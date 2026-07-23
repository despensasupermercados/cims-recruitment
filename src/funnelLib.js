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

  const clean = {
    name, email, phone, position, source,
    referrer: source === "Crew referral" ? referrer : "",
    shipboard: !!p.shipboard,
    printer: !!p.printer,
    resumeLink: String(p.resumeLink || "").trim().slice(0, 500),
  };
  return { ok: errors.length === 0, errors, clean };
}
