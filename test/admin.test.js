import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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
  // both audiences are told: the candidate that it is moving, the team who owns it
  assert.deepEqual(p.emails.map(e => e.kind), ["firstInterview", "assignNotify"]);
  assert.equal(p.emails[1].interviewer, "Yanna");
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
  assert.deepEqual(kinds, ["hired", "crewAdminHandoff"]);
  assert.equal(hired.emails[1].notes, "Strong");

  const no = planAdminAction("finalOutcome", { stage: STAGES.FINAL }, { result: "no", reason: "Not selected" });
  assert.equal(no.stage, STAGES.FINAL_NO);
  assert.equal(no.fields.rejectionReason, "Not selected");
  // a final-round candidate gets the final-stage letter, not the screening one
  assert.equal(no.emails[0].kind, "finalRegret");
});

test("every email kind a plan can emit is one the worker knows how to send", () => {
  // Guards the seam between adminLib (plans the email) and worker.sendPlanEmails
  // (sends it). A kind emitted with no branch there is dropped in silence — the
  // candidate record moves, the audit line claims an email went out, and nothing
  // arrives. Read the handled set out of worker.js rather than restating it here:
  // a hardcoded list drifts from the file it is meant to guard (it did, 27 Jul 26).
  const src = readFileSync(new URL("../src/worker.js", import.meta.url), "utf8");
  const HANDLED = new Set([...src.matchAll(/e\.kind === "(\w+)"/g)].map(m => m[1]));
  assert.ok(HANDLED.size >= 9, "could not parse the handled kinds out of worker.js");

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
  const emitted = new Set();
  for (const p of plans) {
    for (const e of p.emails || []) {
      emitted.add(e.kind);
      assert.ok(HANDLED.has(e.kind), "adminLib emits \"" + e.kind + "\" but worker.js has no branch for it");
    }
  }
  // And the reverse: a handler nobody emits is dead code that hides a rename.
  for (const k of HANDLED) {
    assert.ok(emitted.has(k), "worker.js handles \"" + k + "\" but no plan emits it");
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

test("every renderer worker.js imports is actually exported by funnelEmails", () => {
  const src = readFileSync(new URL("../src/worker.js", import.meta.url), "utf8");
  const line = src.match(/import \{([^}]+)\} from "\.\/funnelEmails\.js";/);
  assert.ok(line, "could not find the funnelEmails import in worker.js");
  const imported = line[1].split(",").map(x => x.trim()).filter(Boolean);
  const mail = readFileSync(new URL("../src/funnelEmails.js", import.meta.url), "utf8");
  const exported = new Set([...mail.matchAll(/^export function (\w+)/gm)].map(m => m[1]));
  for (const fn of imported) {
    assert.ok(exported.has(fn), "worker.js imports " + fn + " but funnelEmails.js does not export it");
  }
});
