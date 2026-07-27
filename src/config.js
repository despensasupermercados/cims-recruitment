// ============================================================================
// CIMS Recruitment — configuration
// The ONLY file that ever needs a human edit (GitHub pencil icon -> commit;
// the worker redeploys itself).
// ============================================================================

// --- Digest recipients ------------------------------------------------------
// All addresses are real: every submission emails the team. To disarm for
// testing, change any address to something@example.com and commit.
export const RECIPIENTS = {
  to: [
    "Miguel.Sanmartin@dg3.com",           // Miguel San Martin
    "Rita.Berenyi@dg3.com",               // Rita Berenyi
  ],
  cc: [
    "recruitment@tdgcm.ph",               // TDGCM Recruitment — Recruitment Admin
    "maryjoy.manzanares@dg3.com",         // Maryjoy Manzanares — Crew Admin
    "Joyce.Castillo@tdgcm.ph",            // Joyce Castillo — Manager
    "Ray.Guerra@dg3.com",                 // Ray Guerra
    "Rolando.Abellan@dg3.com",            // Rolando Abellan
    "joemar.deleon@dg3.com",              // Joemar De Leon
    "Ohji.Miranda@dg3.com",               // Ohji Miranda
    "Dexter.Lawrence@dg3.com",            // Dexter Lawrence
  ],
};

// The invitation + reminder go to the two form owners (by role, not name).
export const ADMINS = {
  recruitmentAdmin: "recruitment@tdgcm.ph",  // TDGCM Recruitment — Part 1
  crewAdmin: "maryjoy.manzanares@dg3.com",   // Maryjoy Manzanares — Part 2
};

// Sender. Domain must be verified in Resend.
export const FROM = "CIMS Recruitment <recruitment@cims.work>";

// --- Hostnames --------------------------------------------------------------
// Two front doors on one worker, deliberately separated:
//
//   FORM_URL  = recruitment.cims.work — STAFF. The keyed monthly form, the admin
//               console, the reports view, Ray/Rolando's /decide token links and
//               /files/<uuid> resume downloads (candidate PII). Never advertised.
//   APPLY_URL = apply.cims.work       — PUBLIC. The candidate application and the
//               Big Five result verification page. This is the address that goes
//               on a job ad, the TCMS website and a referral card.
//
// Keeping candidate traffic off the staff host means a WAF rate rule can be
// scoped to the whole public hostname without ever throttling the team, and the
// staff host can go behind Cloudflare Access later without touching applicants.
export const FORM_URL = "https://recruitment.cims.work";
export const APPLY_URL = "https://apply.cims.work";

// Host classification for the router. A request arriving on the public host is
// allowed to reach candidate paths only; everything else 404s there.
// During transition the staff host still serves candidate paths too, so links
// already in flight (test invites, verification emails) keep working.
export const HOSTS = {
  staff: "recruitment.cims.work",
  apply: "apply.cims.work",
};

// Link at the bottom of the digest email.
export const CONSOLE_URL = "https://cims.work";

// --- Prefill windows --------------------------------------------------------
export const PREFILL = {
  docWindowDays: 30,      // compliance: documents expired/expiring within 30 days of the report
  signoffWindowDays: 60,  // forecast headline: projected sign-offs within this window
  signoffListDays: 90,    // forecast chips: projected sign-offs listed from the console
};

// --- Airtable (do not change unless the base is rebuilt) --------------------
export const AIRTABLE = {
  baseId: "appkOQpsNUc3ZZ1Zf",
  tableId: "tbl9Hd43HWLONjZ5A", // "Monthly Submission" in "TDG Recruitment Pipeline"
  fields: {
    month:            "fldIbVZxg9NT7SpIS",
    inProcess:        "fld9Khl0d4yoLBlNq",
    interviewed:      "fldNBAXv0TN3Mg84o",
    approved:         "fldtaBVXuo2PryUCo",
    rejected:         "fld2VqqUlTtkcZvMI",
    inVisa:           "fldGvDmjIby83yMgG",
    inMedicals:       "fldgcqDgPuav935EQ",
    ready:            "fldqtbJwyWtDudd6N",
    rejectionReasons: "fldcqIkgPL0sZRtom",
    readyNames:       "flduP30NLed081QCS",
    joinedNames:      "fldpyJmJCZoOtVfhd",
    notReturning:     "fldbU4o2SzgBy2nJq",
    complianceFlags:  "fld5ZS5cIKnRTk3hi",
    forecastJoiners:  "fldQbzJOkl3HRT7OT",
    rolesToSource:    "fldza8b5Xh90kXmwp",
    feedbackPositive: "fldQlWTHkiZRnfhIE",
    feedbackPain:     "fld1ABRCcJkFdCLbI",
    decisionsNeeded:  "fldVMyGW1j2zhZUA7",
    observations:     "fldcwwrDlDw17GDn2",
    big5Avg:          "fldeph3SND53RplHM",
    srcTcms:          "fldB53xXkWCdkR5Wl",
    srcReferrals:     "fldeSGIVrxuXApUji",
    srcWalkins:       "fld67iO4dr3u6b57z",
    rawJson:          "fldBG7FQXlwebd6Fa",
    status:           "fldt9LSVgqXqoXkxO", // Draft | Submitted
  },
};

// Fleets in display order.
export const FLEETS = ["RCL", "CEL", "AZ", "NCL"];

// --- Applicant funnel -------------------------------------------------------
// Funnel notifications go to the two interviewers directly (per Miguel, 2026-07-23).
//
// ============================================================================
// GOING LIVE IS ONE CHARACTER: set SANDBOX to false.
//
// The previous shape parked the production addresses in a comment block for a
// human to retype at go-live. That makes a HALF-REVERT both easy and silent —
// restore crewAdmin, forget notify, and the funnel runs live against real
// candidates while Yanna is never told anyone applied. Nothing would error and
// no test would fail. So the two states are now both real objects, only one of
// which is ever in force, and test/hosts.test.js asserts BOTH directions:
//   SANDBOX true  -> no funnel address may end @dg3.com or @tdgcm.ph, and the
//                    public door must be shut (open === false)
//   SANDBOX false -> every address must deep-equal FUNNEL_PRODUCTION
//
// The dangerous combination is redirected addresses with the door open: real
// people applying into a pipeline nobody is watching. That state is now
// unreachable — open travels with the address set, not separately.
//
// EVERY address the funnel can reach lives in these two objects. Before
// 2026-07-27 the hired-handoff email resolved to ADMINS.crewAdmin instead,
// which is shared with the production monthly-form flow and is never
// sandboxed — a single Hired click would have mailed the real Crew Admin.
// Do not reintroduce a funnel address anywhere else.
// ============================================================================
export const SANDBOX = true;

// Production. `open: true` because production means accepting applications —
// but only turn SANDBOX off when a named human is watching the base daily.
// An open door with nobody behind it is worse than a closed one.
const FUNNEL_PRODUCTION_VALUES = {
  open: true,
  notify: ["yanna.valdueza@tdgcm.ph", "april.jiloca@tdgcm.ph"],
  replyTo: "recruitment@tdgcm.ph",
  crewAdmin: "maryjoy.manzanares@dg3.com",
  finalApprovers: [
    { name: "Ray", email: "Ray.Guerra@dg3.com" },
    { name: "Rolando", email: "Rolando.Abellan@dg3.com" },
  ],
  gmEmail: "Miguel.Sanmartin@dg3.com", // GM exception authority (SOP v1.1 §11)
};

// Sandbox (2026-07-23 acceptance test). Every address is one of Miguel's own
// inboxes, so NO real team member can be emailed by the funnel.
const FUNNEL_SANDBOX_VALUES = {
  open: false,
  notify: ["sanmartin@iyassu.com"],
  replyTo: "sanmartin@me.com",
  crewAdmin: "sanmartin@sudespensa.cl",
  finalApprovers: [
    { name: "Ray", email: "sanmartin@sudespensa.cl" },
    { name: "Rolando", email: "sanmartin@sudespensa.cl" },
  ],
  gmEmail: "sanmartin@iyassu.com",
};

// Identical in both states — nothing here can reach a person.
const FUNNEL_COMMON = {
  testUrl: "https://bigfive-test.com/test",
  resultUrl: "https://bigfive-test.com/result/", // + result ID (server-side fetch)
  cooldownDays: 365, // rejected applicants may re-apply after 12 months (SOP v1.1 §10)
  endorseNudgeDays: 5, // days of silence after endorsement before nudging the endorser
};

// Exported so the guard test can assert the production set is intact while the
// sandbox is active, and that it is actually IN USE once the sandbox is off.
export const FUNNEL_PRODUCTION = FUNNEL_PRODUCTION_VALUES;

export const FUNNEL = {
  ...FUNNEL_COMMON,
  ...(SANDBOX ? FUNNEL_SANDBOX_VALUES : FUNNEL_PRODUCTION_VALUES),
};

// "Candidates" table — system of record for the applicant funnel.
export const CANDIDATES = {
  tableId: "tblTGIe5G8BJ96ohU",
  fields: {
    name:        "fld0wD08Z2wv3IosD", // Candidate Name (primary)
    fleet:       "fldiyDnYecI4MQcBX",
    source:      "fldsV5GCWnVuuh9qO",
    stage:       "fld72eW30dguQo9Ma",
    hireType:    "fldmlArveXi4W8X2z",
    dateApplied: "fldwwilDEiPYMieeS",
    dateInterviewed: "fldSEDCnuI9MW3Aq7",
    dateApproved: "fldwS3dK4ECvAFUPV",
    rejectionReason: "fldXyhb459RhKHbEL",
    notes:       "fld8TSLc8O89Q2lhO",
    email:       "fldGuWpt2piAlViMg",
    phone:       "fldCsTCeIO7deYy7Z",
    position:    "fldDny1wqOZBXKZQd",
    referrer:    "fldBWPjUzIyaLMotF",
    shipboard:   "fldm0oodujyKJuNGT",
    printer:     "fldGM8tGi6TCQTwCB",
    resultId:    "fldIUPdl4VsuZp70U",
    b5N:         "flddV60T2Qb3GxVA8",
    b5E:         "fldJKqs94djBrFwdC",
    b5O:         "fldEZtNGj9rrBVRVg",
    b5A:         "fldd18uNJFkqW49kv",
    b5C:         "fldajRjFjCp9aBepD",
    fitScore:    "flddzyuZDiHPdlbZh",
    verdict:     "fldYCmywbulPazZuw",
    thresholdVersion: "fld2va1WDladrSkSc",
    interviewer: "fldtWVCJpGgGfgz7l",
    resume:      "fldRIcjINQ7WXkavG",
    consent:     "fld3OkD6u5CIgHgpy",
    aiSummary:   "fldXnF8gJnNH73NDl",
    aiBrief:     "fldDe8grbA4PPjVFy",
    audit:       "fldFBqA6ynTMLJHiG",
    dateTested:  "fldgAIG590l3JBeUs",
    dateEndorsed: "fld90Hocw9kpqA2Bv",
    dateFinal:   "fldW6CSH3z3eP8ooh",
    actionToken: "fldRBfehOivooCLha",
    interviewNotes: "fldwrkshmbzbQICUJ",
    recommendation: "fldlaBTwtwHCTYw70",
  },
};
