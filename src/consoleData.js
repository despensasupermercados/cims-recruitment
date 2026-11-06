// Read-only queries against the CIMS HR console D1 database (binding CONSOLE_DB).
// HARD RULE: fixed SELECT statements only, no user input ever interpolated into SQL,
// this module never writes. The recruitment worker must not be able to change the console.

import { PREFILL } from "./config.js";
import { fleetFromVessel, fleetFromShip, monthRange, normName, shortShip } from "./lib.js";

const DOCS = [
  ["med_exp", "Medical"],
  ["usv_exp", "US Visa"],
  ["sirb_exp", "SIRB"],
  ["pp_exp", "Passport"],
  ["sch_exp", "Certificate (SCH)"],
];

async function all(env, sql, ...binds) {
  const res = await env.CONSOLE_DB.prepare(sql).bind(...binds).all();
  return res.results || [];
}

/** Everything Part 2 needs, in one call. Returns null if the binding is absent/broken
 *  — the form then degrades to fully-manual entry instead of failing. */
export async function consoleContext(env, reportingMonth) {
  if (!env.CONSOLE_DB) return null;
  try {
    const range = monthRange(reportingMonth);

    // Crew names for the type-ahead. Manual edits in crew_override ALWAYS win over the
    // imported base row (same rule as the console): overridden status/vessel apply, and
    // crew tagged retired are excluded everywhere in this module.
    const crewRows = (await all(env,
      "SELECT c.agency_id AS sc, c.last_name || ', ' || c.first_name AS name, " +
      "COALESCE(NULLIF(TRIM(o.vessel_observed),''), c.vessel_observed) AS vessel, " +
      "COALESCE(NULLIF(o.status,''), c.status) AS status, COALESCE(o.retired, 0) AS retired " +
      "FROM crew c LEFT JOIN crew_override o ON o.agency_id = c.agency_id " +
      "WHERE c.last_name IS NOT NULL ORDER BY c.last_name"))
      .filter(r => !r.retired && r.status !== "Retired" && r.status !== "Inactive");
    const crewNames = crewRows.map(r => ({ name: r.name, fleet: fleetFromVessel(r.vessel) }));

    // Ready-to-deploy suggestions: crew genuinely awaiting assignment — effective status
    // On Vacation (override wins), no ship on record (override wins), not retired, not
    // Earmarked, and no currently-active contract leg in the schedule.
    const activeScRows = await all(env,
      "SELECT DISTINCT sc FROM keyman_contract3 WHERE sign_on IS NOT NULL AND date(sign_on) <= date('now') AND (act_off IS NULL OR act_off = '') AND proj_off IS NOT NULL AND date(proj_off) >= date('now')");
    const activeSc = new Set(activeScRows.map(r => r.sc));
    const awaiting = crewRows
      .filter(r => r.status === "On Vacation" && (!r.vessel || String(r.vessel).trim() === "") && !activeSc.has(r.sc))
      .map(r => ({ name: r.name, fleet: "" }));

    // Deployments in the reporting month: contract sign-ons joined to crew.
    let joined = [];
    if (range) {
      const rows = await all(env,
        "SELECT c.last_name || ', ' || c.first_name AS name, k.ship, k.sign_on FROM keyman_contract3 k JOIN crew c ON c.agency_id = k.sc WHERE k.sign_on IS NOT NULL AND date(k.sign_on) >= date(?) AND date(k.sign_on) < date(?) ORDER BY k.sign_on",
        range.start, range.end);
      joined = rows.map(r => ({ name: r.name, fleet: fleetFromShip(r.ship), date: r.sign_on, ship: r.ship }));
    }

    // Visa & Medical: expiries that fall INSIDE the reporting month only.
    // Doc expiry dates also follow manual-wins (crew_override), and retired crew are excluded.
    const docRows = (await all(env,
      "SELECT c.last_name || ', ' || c.first_name AS name, " +
      "COALESCE(NULLIF(TRIM(o.vessel_observed),''), c.vessel_observed) AS vessel, " +
      "COALESCE(NULLIF(o.status,''), c.status) AS status, COALESCE(o.retired, 0) AS retired, " +
      "COALESCE(NULLIF(o.med_exp,''), c.med_exp) AS med_exp, COALESCE(NULLIF(o.usv_exp,''), c.usv_exp) AS usv_exp, " +
      "COALESCE(NULLIF(o.sirb_exp,''), c.sirb_exp) AS sirb_exp, COALESCE(NULLIF(o.pp_exp,''), c.pp_exp) AS pp_exp, " +
      "COALESCE(NULLIF(o.sch_exp,''), c.sch_exp) AS sch_exp " +
      "FROM crew c LEFT JOIN crew_override o ON o.agency_id = c.agency_id WHERE c.last_name IS NOT NULL"))
      .filter(r => !r.retired && r.status !== "Retired" && r.status !== "Inactive");
    const visaMedical = [];
    if (range) {
      for (const r of docRows) {
        const fleet = fleetFromVessel(r.vessel);
        for (const [col, type] of [["med_exp", "Medical renewal"], ["usv_exp", "US Visa renewal"]]) {
          const d = r[col];
          if (d && d >= range.start && d < range.end) {
            visaMedical.push({ name: r.name, fleet, type, note: "expires " + d, overdue: false });
          }
        }
      }
    }

    // Compliance: documents expired or expiring within N days of TODAY (report day),
    // overdue capped at 12 months back so stale records don't flood the form.
    const today = new Date().toISOString().slice(0, 10);
    const horizon = shiftDays(today, PREFILL.docWindowDays);
    const staleFloor = shiftDays(today, -365);
    const compliance = [];
    for (const r of docRows) {
      const fleet = fleetFromVessel(r.vessel);
      for (const [col, label] of DOCS) {
        const d = r[col];
        if (!d || d < staleFloor || d > horizon) continue;
        compliance.push({ name: r.name, fleet, doc: label, expires: d, overdue: d < today });
      }
    }
    compliance.sort((a, b) => a.expires < b.expires ? -1 : 1);

    // Forecast context: projected sign-offs — headline count (60d) + chip list (90d).
    const so = await all(env,
      "SELECT COUNT(*) AS n FROM keyman_contract3 WHERE proj_off IS NOT NULL AND (act_off IS NULL OR act_off = '') AND date(proj_off) >= date('now') AND date(proj_off) <= date('now', ?)",
      "+" + PREFILL.signoffWindowDays + " days");
    const signoffOutlook = so[0] ? Number(so[0].n) || 0 : 0;

    const upcomingRows = await all(env,
      "SELECT c.last_name || ', ' || c.first_name AS name, k.ship, k.proj_off FROM keyman_contract3 k JOIN crew c ON c.agency_id = k.sc WHERE k.proj_off IS NOT NULL AND (k.act_off IS NULL OR k.act_off = '') AND date(k.proj_off) >= date('now') AND date(k.proj_off) <= date('now', ?) ORDER BY k.proj_off LIMIT 30",
      "+" + PREFILL.signoffListDays + " days");
    const upcoming = upcomingRows.map(r => ({ name: r.name, ship: r.ship, fleet: fleetFromShip(r.ship), date: r.proj_off }));

    return { crewNames, awaiting, joined, compliance, visaMedical, signoffOutlook, upcoming };
  } catch (e) {
    console.log("consoleContext failed: " + e.message);
    return null;
  }
}

/**
 * Everything the DIGEST needs from the console beyond the form's own rows.
 * Same rules as consoleContext: fixed SELECTs, manual-wins via crew_override,
 * retired/Inactive excluded. Returns null if the binding is absent or any query
 * throws — the digest then renders without console sections and says so.
 *
 * Shape:
 *   headcount   { onBoard, earmarked, vacation, inactive }
 *   coverage    { served, covered, none: [{ ship, earmarked: [names] }], doubled: [ship] }
 *   bench       [{ name, ship, fleet }]  — On Vacation, no active contract, not Earmarked
 *   signoffs60  [{ name, ship, fleet, date }]
 *   signoffs90  [{ ... }]                — days 61–90 only
 *   crewIndex   Map(normName -> { name, status, ship, fleet, agencyId })
 *   expired     { sailing: [...], next: [...] }  — { name, ship, fleet, doc, date, status }
 *   renewals30  [{ name, ship, fleet, doc, date }]
 *   docsByName  Map(normName -> [{ doc, date }])   — every doc date on file, for conflict checks
 *   provenance  { crewUpdated, contractMaxSignOn }
 */
export async function digestContext(env) {
  if (!env.CONSOLE_DB) return null;
  try {
    const today = new Date().toISOString().slice(0, 10);

    const crewRows = (await all(env,
      "SELECT c.agency_id AS sc, c.last_name || ', ' || c.first_name AS name, " +
      "COALESCE(NULLIF(TRIM(o.vessel_observed),''), c.vessel_observed) AS vessel, " +
      "COALESCE(NULLIF(o.status,''), c.status) AS status, COALESCE(o.retired, 0) AS retired, " +
      "COALESCE(NULLIF(o.med_exp,''), c.med_exp) AS med_exp, COALESCE(NULLIF(o.usv_exp,''), c.usv_exp) AS usv_exp, " +
      "COALESCE(NULLIF(o.sirb_exp,''), c.sirb_exp) AS sirb_exp, COALESCE(NULLIF(o.pp_exp,''), c.pp_exp) AS pp_exp, " +
      "COALESCE(NULLIF(o.sch_exp,''), c.sch_exp) AS sch_exp, c.updated_at " +
      "FROM crew c LEFT JOIN crew_override o ON o.agency_id = c.agency_id WHERE c.last_name IS NOT NULL"))
      .filter(r => !r.retired && r.status !== "Retired");

    const active = crewRows.filter(r => r.status !== "Inactive");
    const headcount = {
      onBoard: active.filter(r => r.status === "On board").length,
      earmarked: active.filter(r => r.status === "Earmarked").length,
      vacation: active.filter(r => r.status === "On Vacation").length,
      inactive: crewRows.length - active.length,
    };

    // Active contract legs (for bench) + sign-off windows.
    const activeScRows = await all(env,
      "SELECT DISTINCT sc FROM keyman_contract3 WHERE sign_on IS NOT NULL AND date(sign_on) <= date('now') AND (act_off IS NULL OR act_off = '') AND proj_off IS NOT NULL AND date(proj_off) >= date('now')");
    const activeSc = new Set(activeScRows.map(r => r.sc));

    const soRows = await all(env,
      "SELECT c.last_name || ', ' || c.first_name AS name, k.ship, k.proj_off FROM keyman_contract3 k JOIN crew c ON c.agency_id = k.sc WHERE k.proj_off IS NOT NULL AND (k.act_off IS NULL OR k.act_off = '') AND date(k.proj_off) >= date('now') AND date(k.proj_off) <= date('now', ?) ORDER BY k.proj_off",
      "+" + PREFILL.signoffListDays + " days");
    const cut60 = shiftDays(today, PREFILL.signoffWindowDays);
    const signoffs60 = [], signoffs90 = [];
    for (const r of soRows) {
      const row = { name: r.name, ship: r.ship, fleet: fleetFromShip(r.ship), date: r.proj_off };
      (r.proj_off <= cut60 ? signoffs60 : signoffs90).push(row);
    }

    // Crew index for name matching, docs on file, expired split.
    const crewIndex = new Map();
    const docsByName = new Map();
    const expired = { sailing: [], next: [] };
    const renewals30 = [];
    const horizon = shiftDays(today, PREFILL.docWindowDays);
    const staleFloor = shiftDays(today, -PREFILL.expiredLookbackDays);
    for (const r of active) {
      const ship = shortShip(r.vessel), fleet = fleetFromVessel(r.vessel);
      const key = normName(r.name);
      crewIndex.set(key, { name: r.name, status: r.status, ship, fleet, agencyId: r.sc });
      const docs = [];
      for (const [col, label] of DOCS) {
        const d = r[col];
        if (!d) continue;
        docs.push({ doc: label, date: d });
        if (d < today && d >= staleFloor) {
          const row = { name: r.name, ship, fleet, doc: label, date: d, status: r.status };
          (r.status === "On board" ? expired.sailing : expired.next).push(row);
        } else if (d >= today && d <= horizon) {
          renewals30.push({ name: r.name, ship, fleet, doc: label, date: d });
        }
      }
      docsByName.set(key, docs);
    }
    expired.sailing.sort((a, b) => a.date < b.date ? -1 : 1);
    expired.next.sort((a, b) => a.date < b.date ? -1 : 1);
    renewals30.sort((a, b) => a.date < b.date ? -1 : 1);

    // Bench: on vacation, not earmarked, no active contract leg.
    const bench = active
      .filter(r => r.status === "On Vacation" && !activeSc.has(r.sc))
      .map(r => ({ name: r.name, ship: shortShip(r.vessel), fleet: fleetFromVessel(r.vessel) }))
      .sort((a, b) => a.name < b.name ? -1 : 1);

    // Ship coverage: served vessels (no NCL until the pilot staffs, no expedition
    // hull) vs crew with status On board whose vessel resolves to that hull.
    const vessels = await all(env, "SELECT name, brand, class FROM vessel");
    const served = vessels.filter(v => v.brand !== "NCL" && String(v.class || "").toLowerCase() !== "expedition");
    const onBoardByShip = new Map();
    for (const r of active) {
      if (r.status !== "On board") continue;
      const s = shortShip(r.vessel);
      if (!s) continue;
      onBoardByShip.set(s, (onBoardByShip.get(s) || 0) + 1);
    }
    const earmarkedByShip = new Map();
    for (const r of active) {
      if (r.status !== "Earmarked") continue;
      const s = shortShip(r.vessel);
      if (!s) continue;
      earmarkedByShip.set(s, [...(earmarkedByShip.get(s) || []), r.name]);
    }
    const none = [], doubled = [];
    for (const v of served) {
      const n = onBoardByShip.get(v.name) || 0;
      if (n === 0) none.push({ ship: v.name, earmarked: earmarkedByShip.get(v.name) || [] });
      else if (n > 1) doubled.push(v.name);
    }
    const coverage = { served: served.length, covered: served.length - none.length, none, doubled };

    const prov = await all(env, "SELECT (SELECT MAX(updated_at) FROM crew) AS crewUpdated, (SELECT MAX(sign_on) FROM keyman_contract3) AS contractMaxSignOn");
    const provenance = {
      crewUpdated: prov[0] && prov[0].crewUpdated ? String(prov[0].crewUpdated).slice(0, 10) : null,
      contractMaxSignOn: prov[0] && prov[0].contractMaxSignOn ? String(prov[0].contractMaxSignOn).slice(0, 10) : null,
    };

    return { headcount, coverage, bench, signoffs60, signoffs90, crewIndex, expired, renewals30, docsByName, provenance };
  } catch (e) {
    console.log("digestContext failed: " + e.message);
    return null;
  }
}

function shiftDays(iso, days) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
