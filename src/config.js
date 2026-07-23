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

// Where the form lives. The invite links append ?k=<FORM_KEY> automatically.
export const FORM_URL = "https://recruitment.cims.work";

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
export const FUNNEL = {
  notify: ["yanna.valdueza@tdgcm.ph", "april.jiloca@tdgcm.ph"],
  replyTo: "recruitment@tdgcm.ph", // applicant replies land in the monitored TDG recruitment inbox
  testUrl: "https://bigfive-test.com/test",
  resultUrl: "https://bigfive-test.com/result/", // + result ID (server-side fetch)
  cooldownDays: 365, // rejected applicants may re-apply after 12 months (SOP v1.1 §10)
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
  },
};
