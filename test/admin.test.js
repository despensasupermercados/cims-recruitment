import { test } from "node:test";
import assert from "node:assert/strict";
import { STAGES, canAct, planAdminAction, planDecision } from "../src/adminLib.js";

test("canAct gates each action to the right stages", () => {
  assert.ok(canAct(STAGES.PASSED, "assign"));
  assert.ok(!canAct(STAGES.ENDORSED, "assign"));
  assert.ok(canAct(STAGES.ASSIGNED, "outcome"));
  assert.ok(!canAct(STAGES.PASSED, "outcome"));       // must assign first
  assert.ok(canAct(STAGES.RECOMMEND, "endorse"));
  assert.ok(!canAct(STAGES.PASSED, "endorse"));        // can't endorse without a recommend
  assert.ok(!canAct(STAGES.FINAL, "reject"));          // too late to manually reject
});

test("assign requires an interviewer", () => {
  assert.ok(!planAdminAction("assign", { stage: STAGES.PASSED }, {}).ok);
  const p = planAdminAction("assign", { stage: STAGES.PASSED }, { interviewer: "Yanna" });
  assert.ok(p.ok);
  assert.equal(p.stage, STAGES.ASSIGNED);
  assert.equal(p.fields.interviewer, "Yanna");
  // the team is told who now owns the candidate
  assert.equal(p.emails.length, 1);
  assert.equal(p.emails[0].kind, "assignNotify");
  assert.equal(p.emails[0].interviewer, "Yanna");
});

test("outcome: recommend and no branches", () => {
  const rec = planAdminAction("outcome", { stage: STAGES.ASSIGNED }, { result: "recommend", notes: "strong", today: "2026-07-27" });
  assert.equal(rec.stage, STAGES.RECOMMEND);
  assert.equal(rec.fields.dateInterviewed, "2026-07-27");
  const no = planAdminAction("outcome", { stage: STAGES.ASSIGNED }, { result: "no", reason: "Communication" });
  assert.equal(no.stage, STAGES.NOT_ADVANCING);
  assert.equal(no.fields.rejectionReason, "Communication");
  // outcome before assignment is refused
  assert.ok(!planAdminAction("outcome", { stage: STAGES.PASSED }, { result: "recommend" }).ok);
});

test("endorse requires a recommendation and a recommend stage", () => {
  assert.ok(!planAdminAction("endorse", { stage: STAGES.RECOMMEND }, {}).ok); // no text
  assert.ok(!planAdminAction("endorse", { stage: STAGES.PASSED }, { recommendation: "x" }).ok); // wrong stage
  const p = planAdminAction("endorse", { stage: STAGES.RECOMMEND }, { recommendation: "Great fit", token: "abc", today: "2026-07-27", by: "Yanna" });
  assert.ok(p.ok);
  assert.equal(p.stage, STAGES.ENDORSED);
  assert.equal(p.fields.actionToken, "abc");
  assert.equal(p.emails[0].kind, "endorsement");
});

test("exception only for gate-rejected candidates", () => {
  assert.ok(!planAdminAction("exception", { stage: STAGES.PASSED, verdict: "Passed" }, { reason: "x" }).ok);
  const p = planAdminAction("exception", { stage: STAGES.NOT_ADVANCING, verdict: "Auto-Rejected" }, { reason: "verified 10y shipboard", by: "Yanna" });
  assert.ok(p.ok);
  assert.equal(p.stage, STAGES.EXCEPTION);
  assert.equal(p.emails[0].kind, "exception");
  assert.ok(!planAdminAction("exception", { stage: STAGES.NOT_ADVANCING, verdict: "Auto-Rejected" }, { reason: "" }).ok); // needs justification
});

test("final outcome: hired -> Approved (dateApproved), no -> closed; only from FINAL", () => {
  assert.ok(!planAdminAction("finalOutcome", { stage: STAGES.ENDORSED }, { result: "hired" }).ok); // wrong stage
  const hired = planAdminAction("finalOutcome", { stage: STAGES.FINAL }, { result: "hired", today: "2026-08-03", notes: "Strong" });
  assert.ok(hired.ok);
  assert.equal(hired.stage, STAGES.APPROVED);
  assert.equal(hired.fields.dateApproved, "2026-08-03");
  // hiring must both congratulate the candidate AND start crewing — never silently
  const kinds = hired.emails.map(e => e.kind);
  assert.deepEqual(kinds, ["hiredApplicant", "crewAdminHandoff"]);
  assert.equal(hired.emails[1].notes, "Strong");

  const no = planAdminAction("finalOutcome", { stage: STAGES.FINAL }, { result: "no", reason: "Not selected" });
  assert.equal(no.stage, STAGES.FINAL_NO);
  assert.equal(no.fields.rejectionReason, "Not selected");
  // a final-round candidate gets the final-stage letter, not the screening one
  assert.equal(no.emails[0].kind, "finalRejection");
});

test("every email kind a plan can emit is one the worker knows how to send", () => {
  // Guards the seam between adminLib (plans) and worker.sendPlanEmails (sends):
  // a new kind added here without a branch there would silently send nothing.
  const HANDLED = new Set([
    "fail", "endorsement", "exception", "finalApplicant", "finalCoordination",
    "declineNotify", "assignNotify", "hiredApplicant", "finalRejection", "crewAdminHandoff",
  ]);
  const plans = [
    planAdminAction("assign", { stage: STAGES.PASSED }, { interviewer: "Yanna" }),
    planAdminAction("reject", { stage: STAGES.PASSED }, { reason: "x" }),
    planAdminAction("endorse", { stage: STAGES.RECOMMEND }, { recommendation: "x" }),
    planAdminAction("exception", { stage: STAGES.NOT_ADVANCING, verdict: "Auto-Rejected" }, { reason: "x" }),
    planAdminAction("exceptionDecide", { stage: STAGES.EXCEPTION }, { result: "reject" }),
    planAdminAction("finalOutcome", { stage: STAGES.FINAL }, { result: "hired" }),
    planAdminAction("finalOutcome", { stage: STAGES.FINAL }, { result: "no" }),
    planDecision("approve", { stage: STAGES.ENDORSED }, { by: "Ray", slotIso: "2026-07-27", slotText: "x" }),
    planDecision("decline", { stage: STAGES.ENDORSED }, { by: "Ray" }),
  ];
  for (const p of plans) {
    for (const e of p.emails || []) {
      assert.ok(HANDLED.has(e.kind), "unhandled email kind: " + e.kind);
    }
  }
});

test("exception decision: approve -> Passed, reject -> Rejected; only from EXCEPTION", () => {
  assert.ok(!planAdminAction("exceptionDecide", { stage: STAGES.PASSED }, { result: "approve" }).ok);
  const ap = planAdminAction("exceptionDecide", { stage: STAGES.EXCEPTION }, { result: "approve", by: "Miguel" });
  assert.equal(ap.stage, STAGES.PASSED);
  const rj = planAdminAction("exceptionDecide", { stage: STAGES.EXCEPTION }, { result: "reject" });
  assert.equal(rj.stage, STAGES.REJECTED);
  assert.equal(rj.emails[0].kind, "fail");
});

test("decision: approve schedules and clears token; decline notifies; stale token is inert", () => {
  const ap = planDecision("approve", { stage: STAGES.ENDORSED }, { by: "Ray", slotIso: "2026-07-27", slotText: "Mon 27 Jul — 08:00 Miami" });
  assert.ok(ap.ok);
  assert.equal(ap.stage, STAGES.FINAL);
  assert.equal(ap.fields.dateFinal, "2026-07-27");
  assert.equal(ap.fields.actionToken, "");            // token consumed
  assert.equal(ap.emails.length, 2);                  // applicant + team

  const dc = planDecision("decline", { stage: STAGES.ENDORSED }, { by: "Rolando" });
  assert.equal(dc.stage, STAGES.DECLINED);
  assert.equal(dc.fields.actionToken, "");

  // second click after the first already moved the candidate: no-op
  const stale = planDecision("approve", { stage: STAGES.FINAL }, { by: "Rolando" });
  assert.ok(!stale.ok);
  assert.equal(stale.error, "already-processed");
});
