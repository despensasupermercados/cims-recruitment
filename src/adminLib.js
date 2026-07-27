// Applicant funnel — admin stage machine (pure logic, no network).
// Covered by test/admin.test.js. The handlers in worker.js execute what this plans;
// keeping the transition rules here means they are tested, not buried in I/O code.

import { MEDICAL_STATUS_VALUES } from "./config.js";

// The stage vocabulary, by name. Every module that writes a Stage value imports
// from here rather than typing the string — worker.js and candidates.js included.
// The reason is not tidiness: Airtable's typecast used to turn any mistyped stage
// into a brand-new schema option, silently, so a literal in a rarely-hit branch
// could corrupt the base months before anyone read a rollup. A constant cannot be
// mistyped without throwing at import. config.js STAGE_VALUES is the closed list
// these must all appear in; test/vocabulary.test.js enforces that.
export const STAGES = {
  APPLIED: "Applied",
  PASSED: "Tested — Passed",
  TESTED_REJECTED: "Tested — Rejected",
  EXPIRED: "Expired — No Test",
  ASSIGNED: "Interview Assigned",
  RECOMMEND: "Interviewed — Recommend",
  NOT_ADVANCING: "Interviewed — Not advancing",
  ENDORSED: "Endorsed — Awaiting Approval",
  FINAL: "Final Scheduled",
  APPROVED: "Approved",
  FINAL_NO: "Final — Not hired",
  DECLINED: "Endorsement Declined",
  EXCEPTION: "Exception Requested",
  REJECTED: "Rejected — Manual",
  // --- Post-hire ------------------------------------------------------------
  // Recruitment used to end here. "Approved" fired the crew-handoff email and
  // the record stopped moving, so every number after it — in visa, in medicals,
  // ready to deploy, joiners forecast, joined this month — was counted by hand
  // into the monthly form. These stages already existed in the base, unused;
  // nothing in the code ever wrote them. Now the console does, and the counts
  // come from the same table as everything else.
  VISA: "Visa processing",
  MEDICALS: "Medicals",
  READY: "Ready for deployment",
  DEPLOYED: "Deployed",
  // A hired candidate who never sails. Without a terminal post-hire stage the
  // "in visa" count can only grow: a denied visa or an unfit medical would sit
  // in the pipeline forever. A number that can only go up is not a count.
  WITHDRAWN: "Withdrawn",
};

// Which stages a passing candidate can be in when each admin action is allowed.
const ALLOWED = {
  assign: [STAGES.PASSED, STAGES.ASSIGNED, STAGES.RECOMMEND, STAGES.NOT_ADVANCING],
  outcome: [STAGES.ASSIGNED],
  endorse: [STAGES.RECOMMEND],
  reject: [STAGES.PASSED, STAGES.ASSIGNED, STAGES.RECOMMEND],
  finalOutcome: [STAGES.FINAL],
  exceptionDecide: [STAGES.EXCEPTION],
  // Post-hire. Each step is allowed from its own stage as well as the one before
  // it, so a mis-click is corrected by pressing the right button rather than by
  // someone opening Airtable and editing the Stage cell — which is how the base
  // drifted away from the code in the first place.
  startVisa: [STAGES.APPROVED],
  visaOutcome: [STAGES.VISA],
  medicalOutcome: [STAGES.MEDICALS],
  deploy: [STAGES.READY],
};

export function canAct(stage, action) {
  const list = ALLOWED[action];
  return !!list && list.includes(stage);
}

/**
 * Plan an admin action. Returns { ok, error?, stage?, fields?, audit?, emails? }.
 * `emails` is a list of descriptors the handler renders + sends.
 * `cur` is the candidate's current { stage, verdict } read from the record.
 */
export function planAdminAction(action, cur, params = {}) {
  const stage = cur.stage || "";
  const P = params;

  if (action === "assign") {
    if (!canAct(stage, "assign")) return { ok: false, error: "Candidate is not at a stage where an interviewer can be assigned." };
    const who = String(P.interviewer || "").trim();
    if (!who) return { ok: false, error: "Choose an interviewer." };
    return { ok: true, stage: STAGES.ASSIGNED, fields: { interviewer: who },
      audit: "First interview assigned to " + who + ".",
      // Two audiences, two emails: the candidate learns the application is moving
      // and who will call; the team learns who now owns it.
      emails: [
        { kind: "firstInterview", to: "applicant" },
        { kind: "assignNotify", to: "team", interviewer: who },
      ] };
  }

  if (action === "outcome") {
    if (!canAct(stage, "outcome")) return { ok: false, error: "Record an interview outcome only after an interviewer is assigned." };
    const notes = String(P.notes || "").trim();
    if (P.result === "recommend") {
      return { ok: true, stage: STAGES.RECOMMEND, fields: { interviewNotes: notes, dateInterviewed: P.today },
        audit: "First interview: RECOMMEND." + (notes ? " Notes recorded." : ""), emails: [] };
    }
    if (P.result === "no") {
      // Fallback must be a real Rejection Reason option. "Interview — not
      // advancing" was not one: it restated the Stage instead of giving a reason,
      // and typecast created it in the base on first use. Stage already records
      // WHERE the candidate stopped; Reason records WHY, so an unspecified reason
      // is "Other" — not a second copy of the stage name.
      return { ok: true, stage: STAGES.NOT_ADVANCING, fields: { interviewNotes: notes, dateInterviewed: P.today, rejectionReason: P.reason || "Other" },
        audit: "First interview: NOT ADVANCING." + (notes ? " Notes recorded." : ""), emails: [] };
    }
    return { ok: false, error: "Outcome must be recommend or no." };
  }

  if (action === "reject") {
    if (!canAct(stage, "reject")) return { ok: false, error: "This candidate cannot be manually rejected from the current stage." };
    const reason = String(P.reason || "").trim();
    if (!reason) return { ok: false, error: "A rejection reason is required." };
    return { ok: true, stage: STAGES.REJECTED, fields: { rejectionReason: reason },
      audit: "Manually rejected — reason: " + reason + ".", emails: [{ kind: "fail", to: "applicant" }] };
  }

  if (action === "endorse") {
    if (!canAct(stage, "endorse")) return { ok: false, error: "Only a candidate you recommended can be endorsed to the final interview." };
    const rec = String(P.recommendation || "").trim();
    if (!rec) return { ok: false, error: "Add a short recommendation for Ray & Rolando." };
    return { ok: true, stage: STAGES.ENDORSED,
      fields: { recommendation: rec, actionToken: P.token, dateEndorsed: P.today },
      audit: "Endorsed to final interview by " + (P.by || "recruitment") + ". Awaiting Ray/Rolando authorization.",
      emails: [{ kind: "endorsement", to: "approvers" }] };
  }

  if (action === "exception") {
    // Only for a candidate the gate rejected (verdict Auto-Rejected).
    if (cur.verdict !== "Auto-Rejected") return { ok: false, error: "Exceptions apply only to candidates the automated gate rejected." };
    const reason = String(P.reason || "").trim();
    if (!reason) return { ok: false, error: "A written justification is required for a GM exception." };
    return { ok: true, stage: STAGES.EXCEPTION, fields: {},
      audit: "GM exception requested by " + (P.by || "recruitment") + ": " + reason,
      emails: [{ kind: "exception", to: "gm", reason }] };
  }

  // Record the GM's written decision on a requested exception (SOP v1.1 §11).
  if (action === "exceptionDecide") {
    if (!canAct(stage, "exceptionDecide")) return { ok: false, error: "No exception is pending on this candidate." };
    if (P.result === "approve") {
      return { ok: true, stage: STAGES.PASSED, fields: {},
        audit: "GM exception APPROVED by " + (P.by || "recruitment") + " — candidate rejoins the interview flow.", emails: [] };
    }
    if (P.result === "reject") {
      return { ok: true, stage: STAGES.REJECTED, fields: { rejectionReason: "GM declined exception" },
        audit: "GM exception DECLINED by " + (P.by || "recruitment") + ".", emails: [{ kind: "fail", to: "applicant" }] };
    }
    return { ok: false, error: "Exception decision must be approve or reject." };
  }

  // Record the outcome of the final interview with Ray & Rolando.
  if (action === "finalOutcome") {
    if (!canAct(stage, "finalOutcome")) return { ok: false, error: "Only a candidate whose final interview is scheduled can have a final outcome recorded." };
    const notes = String(P.notes || "").trim();
    if (P.result === "hired") {
      return { ok: true, stage: STAGES.APPROVED, fields: { dateApproved: P.today, interviewNotes: notes },
        audit: "Final interview: HIRED. Approved — entering visa & medicals. Crew Administration notified." + (notes ? " Notes recorded." : ""),
        emails: [
          { kind: "hired", to: "applicant" },
          { kind: "crewAdminHandoff", to: "crewAdmin", notes },
        ] };
    }
    if (P.result === "no") {
      // Same rule as the first-interview fallback above: a real option, not a
      // restatement of the stage. "Final interview — not selected" was neither.
      return { ok: true, stage: STAGES.FINAL_NO, fields: { interviewNotes: notes, rejectionReason: P.reason || "Other" },
        audit: "Final interview: NOT HIRED." + (notes ? " Notes recorded." : ""), emails: [{ kind: "finalRegret", to: "applicant" }] };
    }
    return { ok: false, error: "Final outcome must be hired or no." };
  }

  // -------------------------------------------------------------------------
  // Post-hire. Four buttons that walk an Approved candidate to Deployed.
  //
  // None of these send email. That is deliberate, not an omission: the crew
  // handoff already fired at Approved, and adding a notification per step would
  // put five more messages in front of Crew Administration for a status they
  // can read off the console. Email is for handing work to someone; these
  // steps hand work to nobody. Add one when a person is actually waiting on it.
  // -------------------------------------------------------------------------

  if (action === "startVisa") {
    if (!canAct(stage, "startVisa")) return { ok: false, error: "Only an approved candidate can be entered into visa processing." };
    return { ok: true, stage: STAGES.VISA, fields: { visaStatus: "In process" },
      audit: "Visa processing started by " + (P.by || "recruitment") + ".", emails: [] };
  }

  if (action === "visaOutcome") {
    if (!canAct(stage, "visaOutcome")) return { ok: false, error: "This candidate is not in visa processing." };
    if (P.result === "approved") {
      // One button moves two things: visa closes, medicals open. Splitting them
      // would leave a candidate briefly in neither, and "briefly" is how a
      // record gets forgotten.
      return { ok: true, stage: STAGES.MEDICALS, fields: { visaStatus: "Approved", medicalStatus: "Ongoing" },
        audit: "Visa APPROVED. Medicals started.", emails: [] };
    }
    if (P.result === "denied") {
      return { ok: true, stage: STAGES.WITHDRAWN, fields: { visaStatus: "Denied" },
        audit: "Visa DENIED — candidate withdrawn from deployment.", emails: [] };
    }
    if (P.result === "delayed") {
      // Stays in Visa processing on purpose. The stage says which room the
      // candidate is in; the status says what is happening inside it. A delay
      // that silently moved the stage would take them out of the "in visa"
      // count while they are, in fact, still in visa.
      return { ok: true, stage: STAGES.VISA, fields: { visaStatus: "Delayed / rescheduled" },
        audit: "Visa DELAYED / rescheduled" + (P.note ? ": " + String(P.note).trim() : "") + ".", emails: [] };
    }
    return { ok: false, error: "Visa outcome must be approved, denied or delayed." };
  }

  if (action === "medicalOutcome") {
    if (!canAct(stage, "medicalOutcome")) return { ok: false, error: "This candidate is not in medicals." };
    if (P.result === "fit") {
      // Expected Join Date is REQUIRED here, not optional. It is the only input
      // behind "forecast joiners 60–90d"; if it can be skipped the forecast
      // silently under-counts and looks like good news.
      const join = String(P.expectedJoin || "").trim();
      if (!isIsoDate(join)) return { ok: false, error: "An expected join date (YYYY-MM-DD) is required to mark a candidate ready for deployment." };
      return { ok: true, stage: STAGES.READY, fields: { medicalStatus: "Fit", dateReady: P.today, expectedJoin: join },
        audit: "Medically FIT. Ready for deployment — expected join " + join + ".", emails: [] };
    }
    if (P.result === "unfit") {
      return { ok: true, stage: STAGES.WITHDRAWN, fields: { medicalStatus: "Not recommended" },
        audit: "Medically NOT RECOMMENDED — candidate withdrawn from deployment.", emails: [] };
    }
    if (P.result === "pending") {
      const st = String(P.status || "").trim();
      if (!MEDICAL_STATUS_VALUES.includes(st)) return { ok: false, error: "Choose a medical status." };
      if (st === "Fit" || st === "Not recommended") return { ok: false, error: "Record a fit or unfit result with the corresponding button, not as a pending status." };
      return { ok: true, stage: STAGES.MEDICALS, fields: { medicalStatus: st },
        audit: "Medicals updated: " + st + ".", emails: [] };
    }
    return { ok: false, error: "Medical outcome must be fit, unfit or pending." };
  }

  if (action === "deploy") {
    if (!canAct(stage, "deploy")) return { ok: false, error: "Only a candidate ready for deployment can be marked as joined." };
    // Defaults to today, but is editable, because the console is not always
    // opened on the day someone sails. Written to Date Deployed, NOT over
    // Expected Join Date: overwriting the forecast with the actual would make
    // "joined this month" correct and forecast accuracy unmeasurable, and a
    // forecast nobody can score is a guess with a number next to it.
    const when = String(P.date || "").trim() || P.today;
    if (!isIsoDate(when)) return { ok: false, error: "Deployment date must be YYYY-MM-DD." };
    if (when > P.today) return { ok: false, error: "A deployment date in the future is a forecast — keep the candidate ready for deployment until they have actually joined." };
    return { ok: true, stage: STAGES.DEPLOYED, fields: { dateDeployed: when },
      audit: "DEPLOYED — joined " + when + ".", emails: [] };
  }

  return { ok: false, error: "Unknown action." };
}

// Airtable date fields accept a lot of shapes; the monthly counts do not. A
// strict ISO check here means a bad date is refused in front of the person who
// typed it, rather than stored and discovered when a total looks wrong.
function isIsoDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T00:00:00Z");
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

/**
 * Plan the Ray/Rolando decision (approve|decline) arriving via the emailed token link.
 * `cur` = { stage }. `slotIso` / `slotText` provided by the handler (scheduler is in funnelLib).
 * Guards against stale/replayed tokens: only acts from ENDORSED.
 */
export function planDecision(decision, cur, params = {}) {
  if (cur.stage !== STAGES.ENDORSED) {
    return { ok: false, error: "already-processed" }; // token already used or candidate moved on
  }
  const by = String(params.by || "").trim() || "a manager";
  if (decision === "approve") {
    return { ok: true, stage: STAGES.FINAL,
      fields: { dateFinal: params.slotIso, actionToken: "" },
      audit: "Final interview APPROVED by " + by + " via email — scheduled " + params.slotText + ".",
      emails: [{ kind: "finalApplicant", to: "applicant" }, { kind: "finalCoordination", to: "team", by }] };
  }
  if (decision === "decline") {
    return { ok: true, stage: STAGES.DECLINED,
      fields: { actionToken: "" },
      audit: "Endorsement DECLINED by " + by + " via email.",
      emails: [{ kind: "declineNotify", to: "team", by }] };
  }
  return { ok: false, error: "unknown-decision" };
}
