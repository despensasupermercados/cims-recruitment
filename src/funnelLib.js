// Applicant funnel — pure logic. No network, no platform APIs. Covered by test/funnel.test.js.
// THE GATES ARE CODE: SOP v1.1 thresholds, GM-approved 2026-07-23. Changes are GM-only,
// versioned here and nowhere else.

export const THRESHOLDS = {
  version: "v1.1",
  floor: 440,          // Fit Score below this = auto-reject. Universal, no experience discount.
  priority: 480,       // At or above = priority / leadership-track flag.
  guards: { Nmax: 60, Emin: 75, Omin: 70, Amin: 90, Cmin: 100 }, // any single failure = reject
};

/** Fit Score = E + O + A + C + (120 − N). Max 600, higher is better. */
export function fitScore(s) {
  return s.E + s.O + s.A + s.C + (120 - s.N);
}

/**
 * Apply SOP v1.1 gates to a {N,E,O,A,C} score set.
 * Returns { fit, verdict: "priority"|"pass"|"reject", failedGuards: string[] }.
 */
export function applyGates(s, t = THRESHOLDS) {
  const failedGuards = [];
  if (s.N > t.guards.Nmax) failedGuards.push("N>" + t.guards.Nmax);
  if (s.E < t.guards.Emin) failedGuards.push("E<" + t.guards.Emin);
  if (s.O < t.guards.Omin) failedGuards.push("O<" + t.guards.Omin);
  if (s.A < t.guards.Amin) failedGuards.push("A<" + t.guards.Amin);
  if (s.C < t.guards.Cmin) failedGuards.push("C<" + t.guards.Cmin);
  const fit = fitScore(s);
  let verdict = "reject";
  if (fit >= t.floor && failedGuards.length === 0) verdict = fit >= t.priority ? "priority" : "pass";
  return { fit, verdict, failedGuards };
}

/**
 * Extract {N,E,O,A,C} from the bigfive-test.com result page HTML.
 * The page embeds a flight payload with escaped JSON per domain:
 *   \"domain\":\"N\", ... \"score\":34
 * Deterministic — no AI in the scoring path. Returns null if any domain is missing.
 */
export function parseBigFiveHtml(html) {
  const out = {};
  const re = /\\"domain\\":\\"([NEOAC])\\"/g;
  let m;
  while ((m = re.exec(html))) {
    const d = m[1];
    if (out[d] !== undefined) continue; // first occurrence wins (payload repeats)
    const tail = html.slice(m.index, m.index + 4000);
    const sm = tail.match(/\\"score\\":(\d{1,3})/);
    if (sm) {
      const v = Number(sm[1]);
      if (v >= 24 && v <= 120) out[d] = v;
    }
  }
  for (const d of ["N", "E", "O", "A", "C"]) if (out[d] === undefined) return null;
  return out;
}

/** A bigfive-test.com result ID is a 24-char hex string. */
export function validResultId(id) {
  return /^[0-9a-f]{24}$/i.test(String(id || "").trim());
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const SOURCES = ["TCMS website", "Crew referral", "Walk-in"];

/**
 * Validate + normalize an application payload from the public apply page.
 * Returns { ok, errors, clean }.
 */
export function validateApplication(payload) {
  const errors = [];
  const p = payload || {};
  if (p.website) errors.push("Spam check failed.");

  const name = String(p.name || "").trim();
  if (name.length < 3) errors.push("Full name is required.");
  const email = String(p.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) errors.push("A valid email address is required — it is your applicant ID.");
  const phone = String(p.phone || "").trim();
  if (phone.length < 6) errors.push("A contact phone number is required.");
  const position = String(p.position || "").trim();
  if (!position) errors.push("The position you are applying for is required.");
  const source = String(p.source || "").trim();
  if (!SOURCES.includes(source)) errors.push("Please tell us how you heard about us.");
  const referrer = String(p.referrer || "").trim();
  if (source === "Crew referral" && !referrer) errors.push("Please give the name of the crew member who referred you.");
  if (!p.consent) errors.push("Consent to process your application data is required.");

  // Resume is required — uploaded first via /api/upload, referenced by key here.
  const r = p.resume || {};
  const resumeKey = String(r.key || "").trim();
  const resumeName = String(r.name || "").trim().slice(0, 200);
  if (!/^[0-9a-f-]{36}\.(pdf|doc|docx)$/i.test(resumeKey)) errors.push("Please attach your resume (PDF or Word).");

  const clean = {
    name, email, phone, position, source,
    referrer: source === "Crew referral" ? referrer : "",
    shipboard: !!p.shipboard,
    printer: !!p.printer,
    resume: { key: resumeKey, name: resumeName || "resume" },
  };
  return { ok: errors.length === 0, errors, clean };
}

// --- Final-interview scheduling ---------------------------------------------
// Finals are Mondays 08:00 Miami, skipping US + PH holidays (Miguel: same rule always).

/** US federal holidays that can land on a Monday + PH regular holidays, rule-based. */
export function isFinalHoliday(iso) {
  const d = new Date(iso + "T00:00:00Z");
  const m = d.getUTCMonth() + 1, day = d.getUTCDate(), dow = d.getUTCDay();
  const nthMon = Math.ceil(day / 7);
  const fixed = new Set(["01-01", "06-19", "07-04", "11-11", "12-25", // US fixed
    "04-09", "05-01", "06-12", "08-21", "11-30", "12-30"]);          // PH regular
  const mmdd = String(m).padStart(2, "0") + "-" + String(day).padStart(2, "0");
  if (fixed.has(mmdd)) return true;
  if (dow === 1) { // Monday-anchored: US MLK, Presidents, Memorial, Labor, Columbus; PH National Heroes
    if (m === 1 && nthMon === 3) return true;
    if (m === 2 && nthMon === 3) return true;
    if (m === 5 && day > 24) return true;            // last Monday of May
    if (m === 9 && nthMon === 1) return true;
    if (m === 10 && nthMon === 2) return true;
    if (m === 8 && day > 24) return true;            // PH National Heroes Day — last Monday of August
  }
  return false;
}

/** Next available Monday strictly after `fromIso`, skipping holidays. Returns ISO date. */
export function nextFinalMonday(fromIso) {
  const d = new Date(fromIso + "T00:00:00Z");
  do { d.setUTCDate(d.getUTCDate() + 1); } while (d.getUTCDay() !== 1);
  let iso = d.toISOString().slice(0, 10);
  while (isFinalHoliday(iso)) {
    d.setUTCDate(d.getUTCDate() + 7);
    iso = d.toISOString().slice(0, 10);
  }
  return iso;
}

/** Miami is UTC-4 during US DST (2nd Sunday March → 1st Sunday November), else UTC-5. */
export function miamiIsDst(iso) {
  const [y, m, day] = iso.split("-").map(Number);
  const nthSunday = (year, month, n) => {
    const first = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    return 1 + ((7 - first) % 7) + (n - 1) * 7;
  };
  if (m > 3 && m < 11) return true;
  if (m === 3) return day >= nthSunday(y, 3, 2);
  if (m === 11) return day < nthSunday(y, 11, 1);
  return false;
}

/** Human string for the final-interview slot, both timezones correct for the date. */
export function finalSlotText(iso) {
  const manila = miamiIsDst(iso) ? "20:00" : "21:00";
  const d = new Date(iso + "T00:00:00Z");
  const label = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][d.getUTCDay()] + " " +
    d.getUTCDate() + " " + ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getUTCMonth()] + " " + d.getUTCFullYear();
  return label + " — 08:00 Miami / " + manila + " Manila";
}
