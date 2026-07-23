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
  assert.deepEqual(p.emails, []);
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
