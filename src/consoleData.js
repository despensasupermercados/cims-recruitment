// Read-only queries against the CIMS HR console D1 database (binding CONSOLE_DB).
// HARD RULE: fixed SELECT statements only, no user input ever interpolated into SQL,
// this module never writes. The recruitment worker must not be able to change the console.

import { PREFILL } from "./config.js";
import { fleetFromVessel, fleetFromShip, monthRange } from "./lib.js";

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

    // Crew names for the type-ahead (active crew only; name + fleet, nothing else).
    const crewRows = await all(env,
      "SELECT last_name || ', ' || first_name AS name, vessel_observed AS vessel, status FROM crew WHERE status != 'Inactive' AND last_name IS NOT NULL ORDER BY last_name");
    const crewNames = crewRows.map(r => ({ name: r.name, fleet: fleetFromVessel(r.vessel) }));

    // Ready-to-deploy suggestions: crew genuinely awaiting assignment —
    // no ship on record, not Earmarked, not Inactive, not currently on board.
    const awaiting = crewRows
      .filter(r => r.status === "On Vacation" && (!r.vessel || String(r.vessel).trim() === ""))
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
    const docRows = await all(env,
      "SELECT last_name || ', ' || first_name AS name, vessel_observed AS vessel, status, med_exp, usv_exp, sirb_exp, pp_exp, sch_exp FROM crew WHERE status != 'Inactive'");
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

function shiftDays(iso, days) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
