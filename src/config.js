// ============================================================================
// CIMS Recruitment — configuration
// This is the ONLY file Miguel ever needs to edit (on GitHub: open the file,
// click the pencil icon, change a value, commit — the worker redeploys itself).
// ============================================================================

// --- Email recipients -------------------------------------------------------
// Replace the placeholders with real addresses. Until every "@example.com"
// placeholder is gone, the worker SAVES submissions but SKIPS sending email
// (so nothing embarrassing goes out half-configured).
export const RECIPIENTS = {
  to: [
    "miguel@example.com",     // Miguel San Martin
    "rita@example.com",       // Rita
  ],
  cc: [
    "yanna@example.com",      // Yanna (TDG Recruitment) — also gets invite & reminder
    "joyce@example.com",      // Joyce
    "joy@example.com",        // Joy
    "ray@example.com",        // Ray
    "rolando@example.com",    // Rolando
    "joemar@example.com",     // Joemar
    "ohjie@example.com",      // Ohjie
  ],
};

// The invitation + reminder go only to Yanna.
export const YANNA_EMAIL = "yanna@example.com";

// Sender. The domain must be verified in Resend (same as the CIMS HR console uses).
export const FROM = "CIMS Recruitment <recruitment@cims.work>";

// Where the form lives (used inside the invite/reminder emails).
export const FORM_URL = "https://recruitment.cims.work";

// Link shown at the bottom of the digest email. Point it at the CIMS console
// Reports tab once that page exists; any URL works.
export const CONSOLE_URL = "https://cims.work";

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
  },
};

// Fleets shown on the form and in the digest, in display order.
export const FLEETS = ["RCL", "CEL", "AZ", "NCL"];
