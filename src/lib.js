// Pure logic — no network, no platform APIs. Covered by test/lib.test.js.

export const MONTHS = ["January","February","March","April","May","June","July",
  "August","September","October","November","December"];

const MANILA_OFFSET_MS = 8 * 3600 * 1000;

/** "July 2026" -> { y: 2026, m: 6 } (m is 0-based) or null. */
export function parseMonth(s) {
  if (typeof s !== "string") return null;
  const m = s.trim().match(/^([A-Z][a-z]+) (20\d\d)$/);
  if (!m) return null;
  const idx = MONTHS.indexOf(m[1]);
  if (idx < 0) return null;
  return { y: Number(m[2]), m: idx };
}

export function monthKey(s) {
  const p = parseMonth(s);
  return p ? p.y * 12 + p.m : -1;
}

/** "July 2026" -> { start: "2026-07-01", end: "2026-08-01" } (ISO, end exclusive) */
export function monthRange(s) {
  const p = parseMonth(s);
  if (!p) return null;
  const pad = n => String(n + 1).padStart(2, "0");
  const start = `${p.y}-${pad(p.m)}-01`;
  const ny = p.m === 11 ? p.y + 1 : p.y;
  const nm = p.m === 11 ? 0 : p.m + 1;
  return { start, end: `${ny}-${pad(nm)}-01` };
}

/** Date "now" shifted to Manila wall-clock, exposed via UTC getters. */
export function manilaNow(now = new Date()) {
  return new Date(now.getTime() + MANILA_OFFSET_MS);
}

export function prevMonthName(mnl) {
  const y = mnl.getUTCFullYear(), m = mnl.getUTCMonth();
  return MONTHS[m === 0 ? 11 : m - 1] + " " + (m === 0 ? y - 1 : y);
}

export function currentMonthName(mnl) {
  return MONTHS[mnl.getUTCMonth()] + " " + mnl.getUTCFullYear();
}

export function isFirstMonday(mnl) {
  return mnl.getUTCDay() === 1 && mnl.getUTCDate() <= 7;
}

export function isReminderThursday(mnl) {
  const d = mnl.getUTCDate();
  return mnl.getUTCDay() === 4 && d >= 4 && d <= 10;
}

// --- fleet mapping ----------------------------------------------------------
const AZ_SHIPS = new Set(["onward","journey","quest","pursuit"]);
const CEL_SHIPS = new Set(["millennium","solstice","edge","apex","eclipse","equinox",
  "silhouette","reflection","beyond","ascent","constellation","infinity","summit","xcel","flora"]);

/** Full vessel string from crew.vessel_observed -> fleet code ("" if unknown). */
export function fleetFromVessel(v) {
  if (!v) return "";
  const s = String(v).toUpperCase();
  if (s.includes("AZAMARA")) return "AZ";
  if (s.includes("CELEBRITY")) return "CEL";
  if (s.includes("NORWEGIAN") || s.includes("NCL")) return "NCL";
  return "RCL";
}

/** Short ship name from keyman_contract3.ship -> fleet code. */
export function fleetFromShip(ship) {
  if (!ship) return "";
  const s = String(ship).trim().toLowerCase();
  if (AZ_SHIPS.has(s)) return "AZ";
  if (CEL_SHIPS.has(s)) return "CEL";
  return "RCL";
}

// --- validation -------------------------------------------------------------
function toInt(v) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n <= 100000 ? n : NaN;
}

const COUNT_KEYS = ["inProcess","interviewed","approved","rejected","inVisa","inMedicals","ready"];
const COUNT_LABELS = {
  inProcess: "In process", interviewed: "Interviewed (30d)", approved: "Approved",
  rejected: "Rejected", inVisa: "In visa", inMedicals: "In medicals", ready: "Ready to deploy",
};
// Candidate stages entered manually per fleet; Ready & Joined are DERIVED from Part 2.
const MANUAL_MATRIX_ROWS = [
  ["approved", "approved", "Approved"],
  ["visa", "inVisa", "Visa"],
  ["medicals", "inMedicals", "Medicals"],
];

function sumFleet(row, fleets) {
  let s = 0;
  for (const f of fleets) {
    const n = toInt(row && row[f]);
    if (Number.isNaN(n)) return NaN;
    s += n || 0;
  }
  return s;
}

/** Count people rows per fleet -> {RCL: n, ...} */
export function countByFleet(rows, fleets) {
  const out = {};
  for (const f of fleets) out[f] = 0;
  for (const r of rows || []) {
    if (r && out[r.fleet] !== undefined) out[r.fleet] += 1;
  }
  return out;
}

/**
 * Validate + normalise a submission payload.
 * Returns { ok, errors, warnings, clean }.
 * Hard errors block; warnings ride along into the digest checks line.
 */
export function validateSubmission(payload, fleets) {
  const errors = [];
  const warnings = [];
  const p = payload || {};

  if (p.website) errors.push("Spam check failed.");
  if (!parseMonth(p.month || "")) errors.push("Reporting month is missing or not in the form 'July 2026'.");
  const submittedBy = String(p.submittedBy || "").trim();
  if (!submittedBy) errors.push("'Submitted by' is required.");

  const counts = {};
  for (const k of COUNT_KEYS) {
    const n = toInt(p.counts && p.counts[k]);
    if (n === null || Number.isNaN(n)) errors.push(COUNT_LABELS[k] + " must be a whole number (0 is allowed).");
    else counts[k] = n;
  }
  const big5 = toInt(p.counts && p.counts.big5Avg);
  if (Number.isNaN(big5)) errors.push("Big 5 average score must be a whole number, or left empty.");

  const ch = p.channels || {};
  const tcms = toInt(ch.tcms), ref = toInt(ch.referrals), walk = toInt(ch.walkins);
  if ([tcms, ref, walk].some(Number.isNaN)) errors.push("Sourcing channels must be whole numbers.");
  else if ([tcms, ref, walk].some(v => v === null)) errors.push("All three sourcing channels are required (0 is allowed).");
  // Note: channels are NOT required to add up to In process (gate removed per Miguel).

  const fleet = p.fleet || {};
  for (const [rowKey, countKey, label] of MANUAL_MATRIX_ROWS) {
    const s = sumFleet(fleet[rowKey], fleets);
    if (Number.isNaN(s)) { errors.push("Fleet row '" + label + "' has a non-numeric cell."); continue; }
    if (counts[countKey] !== undefined && s !== counts[countKey])
      errors.push("Fleet row '" + label + "' totals " + s + " but the pipeline count says " + counts[countKey] + ".");
  }

  const decisions = String(p.decisions || "").trim();
  if (!decisions) errors.push("Decisions needed is required — write NONE if nothing needs a call.");

  const forecast = toInt(p.forecast && p.forecast.joiners);
  if (forecast === null || Number.isNaN(forecast)) errors.push("Forecast joiners must be a whole number.");

  const cleanRows = (rows, keys) => (Array.isArray(rows) ? rows : [])
    .map(r => { const o = {}; for (const k of keys) o[k] = String((r && r[k]) || "").trim(); return o; })
    .filter(r => Object.values(r).some(v => v));

  const people = {
    ready: cleanRows(p.people && p.people.ready, ["name","fleet","date"]),
    joined: cleanRows(p.people && p.people.joined, ["name","fleet","date"]),
    flags: cleanRows(p.people && p.people.flags, ["name","fleet","reason"]),
  };

  // Ready & Joined fleet rows are DERIVED from the people lists (no double entry).
  const readyByFleet = countByFleet(people.ready, fleets);
  const joinedByFleet = countByFleet(people.joined, fleets);
  const joinedTotal = people.joined.length;

  if (counts.ready !== undefined && counts.ready !== people.ready.length)
    warnings.push("Pipeline says " + counts.ready + " ready to deploy but Part 2 lists " + people.ready.length + " people.");

  const clean = {
    month: String(p.month || "").trim(),
    submittedBy,
    counts: { ...counts, big5Avg: Number.isNaN(big5) ? null : big5 },
    channels: { tcms: tcms || 0, referrals: ref || 0, walkins: walk || 0 },
    fleet: {
      approved: fleet.approved || {},
      visa: fleet.visa || {},
      medicals: fleet.medicals || {},
      ready: readyByFleet,
      joined: joinedByFleet,
    },
    joinedTotal,
    rejectionReasons: String(p.rejectionReasons || "").trim(),
    people,
    visaMedical: cleanRows(p.visaMedical, ["name","fleet","type","note"]),
    compliance: cleanRows(p.compliance, ["name","doc","expires"]),
    forecast: { joiners: forecast || 0, roles: String((p.forecast && p.forecast.roles) || "").trim() },
    signoffOutlook: toInt(p.signoffOutlook) || 0,
    feedback: {
      positive: String((p.feedback && p.feedback.positive) || "").trim(),
      pain: String((p.feedback && p.feedback.pain) || "").trim(),
    },
    decisions,
    observations: String(p.observations || "").trim(),
  };
  return { ok: errors.length === 0, errors, warnings, clean };
}

// --- digest math ------------------------------------------------------------
export function computeDigest(clean, prevRows) {
  const key = monthKey(clean.month);
  const sorted = prevRows
    .filter(r => monthKey(r.month) < key && monthKey(r.month) >= 0)
    .sort((a, b) => monthKey(b.month) - monthKey(a.month));
  const prev = sorted[0] || null;

  const delta = {};
  for (const k of COUNT_KEYS) {
    delta[k] = prev && prev.counts[k] !== null && prev.counts[k] !== undefined
      ? clean.counts[k] - prev.counts[k] : null;
  }
  const rate = c => (c.interviewed ? Math.round((c.approved / c.interviewed) * 100) : null);
  const rates = [{ month: clean.month, rate: rate(clean.counts) }];
  for (const r of sorted.slice(0, 2)) rates.push({ month: r.month, rate: rate(r.counts) });

  const gap = Math.max(0, clean.forecast.joiners - clean.counts.ready);
  const r0 = rates[0].rate;
  const interviewsToFill = r0 ? Math.ceil(clean.forecast.joiners / (r0 / 100)) : null;

  return { prevMonth: prev ? prev.month : null, delta, rates, gap, interviewsToFill };
}
