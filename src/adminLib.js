// Applicant funnel — admin stage machine (pure logic, no network).
// Covered by test/admin.test.js. The handlers in worker.js execute what this plans;
// keeping the transition rules here means they are tested, not buried in I/O code.

export const STAGES = {
  PASSED: "Tested — Passed",
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
};

// Which stages a passing candidate can be in when each admin action is allowed.
const ALLOWED = {
  assign: [STAGES.PASSED, STAGES.ASSIGNED, STAGES.RECOMMEND, STAGES.NOT_ADVANCING],
  outcome: [STAGES.ASSIGNED],
  endorse: [STAGES.RECOMMEND],
  reject: [STAGES.PASSED, STAGES.ASSIGNED, STAGES.RECOMMEND],
  finalOutcome: [STAGES.FINAL],
  exceptionDecide: [STAGES.EXCEPTION],
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
      return { ok: true, stage: STAGES.NOT_ADVANCING, fields: { interviewNotes: notes, dateInterviewed: P.today, rejectionReason: P.reason || "Interview — not advancing" },
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
      return { ok: true, stage: STAGES.FINAL_NO, fields: { interviewNotes: notes, rejectionReason: P.reason || "Final interview — not selected" },
        audit: "Final interview: NOT HIRED." + (notes ? " Notes recorded." : ""), emails: [{ kind: "finalRegret", to: "applicant" }] };
    }
    return { ok: false, error: "Final outcome must be hired or no." };
  }

  return { ok: false, error: "Unknown action." };
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
