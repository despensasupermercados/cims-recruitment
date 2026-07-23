// ============================================================================
// CIMS Recruitment — configuration
// The ONLY file that ever needs a human edit (GitHub pencil icon -> commit;
// the worker redeploys itself).
// ============================================================================

// --- Digest recipients ------------------------------------------------------
// Until every "@example.com" placeholder is gone, submissions are SAVED but
// no email is sent. Two placeholders remain: Miguel's and the Recruitment
// Admin's (Yanna's) addresses.
export const RECIPIENTS = {
  to: [
    "miguel@example.com",                 // Miguel San Martin — PENDING
    "Rita.Berenyi@dg3.com",               // Rita Berenyi
  ],
  cc: [
    "recruitment.admin@example.com",      // Yanna — Recruitment Admin — PENDING
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
  recruitmentAdmin: "recruitment.admin@example.com", // Yanna — PENDING
  crewAdmin: "maryjoy.manzanares@dg3.com",           // Maryjoy Manzanares
};

// Sender. Domain must be verified in Resend.
export const FROM = "CIMS Recruitment <recruitment@cims.work>";

// Where the form lives. The invite links append ?k=<FORM_KEY> automatically.
export const FORM_URL = "https://recruitment.cims.work";

// Link at the bottom of the digest email.
export const CONSOLE_URL = "https://cims.work";

// --- Prefill windows --------------------------------------------------------
export const PREFILL = {
  docWindowDays: 120,     // compliance: documents expiring within this window
  renewalWindowDays: 90,  // visa & medical: renewals due within this window (or overdue)
  signoffWindowDays: 60,  // forecast context: projected sign-offs within this window
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
