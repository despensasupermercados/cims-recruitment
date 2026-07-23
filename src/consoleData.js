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

    // Ready-to-deploy suggestions: Earmarked crew.
    const earmarked = crewRows
      .filter(r => r.status === "Earmarked")
      .map(r => ({ name: r.name, fleet: fleetFromVessel(r.vessel) }));

    // Joined in the reporting month: contract sign-ons joined to crew.
    let joined = [];
    if (range) {
      const rows = await all(env,
        "SELECT c.last_name || ', ' || c.first_name AS name, k.ship, k.sign_on FROM keyman_contract3 k JOIN crew c ON c.agency_id = k.sc WHERE k.sign_on IS NOT NULL AND date(k.sign_on) >= date(?) AND date(k.sign_on) < date(?) ORDER BY k.sign_on",
        range.start, range.end);
      joined = rows.map(r => ({ name: r.name, fleet: fleetFromShip(r.ship), date: r.sign_on, ship: r.ship }));
    }

    // Compliance: any tracked document expiring within the window (or already expired,
    // capped at 24 months back so ancient stale data doesn't flood the form).
    const docRows = await all(env,
      "SELECT last_name || ', ' || first_name AS name, vessel_observed AS vessel, med_exp, usv_exp, sirb_exp, pp_exp, sch_exp FROM crew WHERE status != 'Inactive'");
    const compliance = [];
    const visaMedical = [];
    const today = new Date().toISOString().slice(0, 10);
    const horizon = shiftDays(today, PREFILL.docWindowDays);
    const renewalHorizon = shiftDays(today, PREFILL.renewalWindowDays);
    const staleFloor = shiftDays(today, -730);
    for (const r of docRows) {
      const fleet = fleetFromVessel(r.vessel);
      for (const [col, label] of DOCS) {
        const d = r[col];
        if (!d || d < staleFloor) continue;
        if (d <= horizon) {
          compliance.push({ name: r.name, fleet, doc: label, expires: d, overdue: d < today });
        }
        // Renewals due soon or overdue for the two renewal-driven documents.
        if ((col === "med_exp" || col === "usv_exp") && d <= renewalHorizon) {
          visaMedical.push({
            name: r.name, fleet,
            type: col === "med_exp" ? "Medical renewal" : "US Visa renewal",
            note: (d < today ? "expired " : "due ") + d,
            overdue: d < today,
          });
        }
      }
    }
    compliance.sort((a, b) => a.expires < b.expires ? -1 : 1);

    // Forecast context: projected sign-offs in the next N days (not yet actually off).
    const so = await all(env,
      "SELECT COUNT(*) AS n FROM keyman_contract3 WHERE proj_off IS NOT NULL AND (act_off IS NULL OR act_off = '') AND date(proj_off) >= date('now') AND date(proj_off) <= date('now', ?)",
      "+" + PREFILL.signoffWindowDays + " days");
    const signoffOutlook = so[0] ? Number(so[0].n) || 0 : 0;

    return { crewNames, earmarked, joined, compliance, visaMedical, signoffOutlook };
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
