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
// ============================================================================
// >>> SANDBOX ACTIVE (2026-07-23 acceptance test) — team + approver emails are
// redirected to Miguel's own inboxes so NO real team member is emailed.
//
// EVERY address the funnel can reach lives in THIS block. That is the point of
// it: going live is one contiguous edit, not a hunt across the file. Before
// 2026-07-27 the hired-handoff email resolved to ADMINS.crewAdmin instead, which
// is shared with the production monthly-form flow and is NOT sandboxed — so a
// single Hired click would have mailed the real Crew Admin. Do not reintroduce
// a funnel address outside this block.
//
// TO REVERT after the test, restore these PRODUCTION values:
//   open:           true  (leave true — production accepts applications)
//   notify:         ["yanna.valdueza@tdgcm.ph", "april.jiloca@tdgcm.ph"]
//   replyTo:        "recruitment@tdgcm.ph"
//   crewAdmin:      "maryjoy.manzanares@dg3.com"
//   finalApprovers: Ray -> "Ray.Guerra@dg3.com" , Rolando -> "Rolando.Abellan@dg3.com"
//   gmEmail:        "Miguel.Sanmartin@dg3.com"
// ============================================================================
export const FUNNEL = {
  // Master switch for the public application page. false => /apply and the
  // public POST endpoints return a courteous "not currently accepting
  // applications" response instead of creating a candidate record. Set this to
  // true only when a real human is watching the base daily.
  open: false,
  notify: ["sanmartin@iyassu.com"],                        // SANDBOX (prod: yanna+april @tdgcm.ph)
  replyTo: "sanmartin@me.com",                             // SANDBOX (prod: recruitment@tdgcm.ph)
  crewAdmin: "sanmartin@sudespensa.cl",                    // SANDBOX (prod: maryjoy.manzanares@dg3.com)
  testUrl: "https://bigfive-test.com/test",
  resultUrl: "https://bigfive-test.com/result/", // + result ID (server-side fetch)
  cooldownDays: 365, // rejected applicants may re-apply after 12 months (SOP v1.1 §10)
  // Final-interview approvers. EITHER one's Approve click authorizes arranging the
  // interview (Miguel: they always work together). The hiring decision stays the live interview.
  finalApprovers: [
    { name: "Ray", email: "sanmartin@sudespensa.cl" },     // SANDBOX (prod: Ray.Guerra@dg3.com)
    { name: "Rolando", email: "sanmartin@sudespensa.cl" }, // SANDBOX (prod: Rolando.Abellan@dg3.com)
  ],
  gmEmail: "sanmartin@iyassu.com", // SANDBOX (prod: Miguel.Sanmartin@dg3.com) — GM exception authority
  endorseNudgeDays: 5, // days of silence after endorsement before nudging the endorser
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
