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

/** Date "now" shifted to Manila wall-clock, exposed via UTC getters. */
export function manilaNow(now = new Date()) {
  return new Date(now.getTime() + MANILA_OFFSET_MS);
}

/** Name of the month BEFORE the given manila-shifted date. */
export function prevMonthName(mnl) {
  const y = mnl.getUTCFullYear(), m = mnl.getUTCMonth();
  const pm = m === 0 ? 11 : m - 1;
  const py = m === 0 ? y - 1 : y;
  return MONTHS[pm] + " " + py;
}

export function currentMonthName(mnl) {
  return MONTHS[mnl.getUTCMonth()] + " " + mnl.getUTCFullYear();
}

/** True when the manila-shifted date is the first Monday of its month. */
export function isFirstMonday(mnl) {
  return mnl.getUTCDay() === 1 && mnl.getUTCDate() <= 7;
}

/** True on the Thursday of the same week as the first Monday (day 4..10). */
export function isReminderThursday(mnl) {
  const d = mnl.getUTCDate();
  return mnl.getUTCDay() === 4 && d >= 4 && d <= 10;
}

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
const MATRIX_ROWS = [
  ["approved", "approved", "Approved"],
  ["visa", "inVisa", "Visa"],
  ["medicals", "inMedicals", "Medicals"],
  ["ready", "ready", "Ready"],
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

/**
 * Validate + normalise a submission payload.
 * Returns { ok, errors: string[], clean } — clean has all counts as integers.
 */
export function validateSubmission(payload, fleets) {
  const errors = [];
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

  // Sourcing channels must reconcile with the in-process total.
  const ch = p.channels || {};
  const tcms = toInt(ch.tcms), ref = toInt(ch.referrals), walk = toInt(ch.walkins);
  if ([tcms, ref, walk].some(Number.isNaN)) errors.push("Sourcing channels must be whole numbers.");
  else if ([tcms, ref, walk].some(v => v === null)) errors.push("All three sourcing channels are required (0 is allowed).");
  else if (counts.inProcess !== undefined && tcms + ref + walk !== counts.inProcess)
    errors.push("Sourcing channels (" + (tcms + ref + walk) + ") don't add up to In process (" + counts.inProcess + ").");

  // Fleet matrix must reconcile with the pipeline counts.
  const fleet = p.fleet || {};
  for (const [rowKey, countKey, label] of MATRIX_ROWS) {
    const s = sumFleet(fleet[rowKey], fleets);
    if (Number.isNaN(s)) { errors.push("Fleet row '" + label + "' has a non-numeric cell."); continue; }
    if (counts[countKey] !== undefined && s !== counts[countKey])
      errors.push("Fleet row '" + label + "' totals " + s + " but the pipeline count says " + counts[countKey] + ".");
  }
  const joinedTotal = sumFleet(fleet.joined, fleets);
  if (Number.isNaN(joinedTotal)) errors.push("Fleet row 'Joined' has a non-numeric cell.");

  const decisions = String(p.decisions || "").trim();
  if (!decisions) errors.push("Decisions needed is required — write NONE if nothing needs a call.");

  const forecast = toInt(p.forecast && p.forecast.joiners);
  if (forecast === null || Number.isNaN(forecast)) errors.push("Forecast joiners must be a whole number.");

  const cleanRows = (rows, keys) => (Array.isArray(rows) ? rows : [])
    .map(r => { const o = {}; for (const k of keys) o[k] = String((r && r[k]) || "").trim(); return o; })
    .filter(r => Object.values(r).some(v => v));

  const clean = {
    month: String(p.month || "").trim(),
    submittedBy,
    counts: { ...counts, big5Avg: Number.isNaN(big5) ? null : big5 },
    channels: { tcms: tcms || 0, referrals: ref || 0, walkins: walk || 0 },
    fleet,
    joinedTotal: Number.isNaN(joinedTotal) ? 0 : joinedTotal,
    rejectionReasons: String(p.rejectionReasons || "").trim(),
    people: {
      ready: cleanRows(p.people && p.people.ready, ["name","fleet","date"]),
      joined: cleanRows(p.people && p.people.joined, ["name","fleet"]),
      flags: cleanRows(p.people && p.people.flags, ["name","fleet","reason"]),
    },
    visaMedical: cleanRows(p.visaMedical, ["name","fleet","type","note"]),
    compliance: cleanRows(p.compliance, ["name","doc","expires"]),
    forecast: { joiners: forecast || 0, roles: String((p.forecast && p.forecast.roles) || "").trim() },
    feedback: {
      positive: String((p.feedback && p.feedback.positive) || "").trim(),
      pain: String((p.feedback && p.feedback.pain) || "").trim(),
    },
    decisions,
    observations: String(p.observations || "").trim(),
  };
  return { ok: errors.length === 0, errors, clean };
}

/** People rows -> readable multiline text for the Airtable columns. */
export function peopleToText(rows, fmt) {
  return rows.map(fmt).join("\n");
}

/** Digest computations: deltas vs previous month, approval-rate trail, gap. */
export function computeDigest(clean, prevRows) {
  // prevRows: [{ month, counts: {...} }] for months before clean.month, any order.
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

/** The checks line shown at the bottom of the digest. */
export function checksSummary(clean) {
  const parts = [];
  const chSum = clean.channels.tcms + clean.channels.referrals + clean.channels.walkins;
  parts.push("channels " + chSum + " = in-process " + clean.counts.inProcess);
  parts.push("fleet totals match pipeline counts");
  return "Checks passed — " + parts.join(" · ");
}
