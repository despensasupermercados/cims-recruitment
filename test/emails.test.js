// Renderer smoke test.
//
// On 27 Jul 2026 two branches edited funnelEmails.js on the same day. The merge
// kept renderers from one side and the helper header from the other, so
// renderFirstInterview and renderHired referenced FONT_H / chip / finePrint /
// stepsBox — names that no longer existed in the file. Nothing caught it:
// `node --check` passes (the names are only resolved when the function runs),
// and the stage-machine tests never call a renderer. The first person to find
// out would have been a hired candidate whose confirmation 500'd.
//
// This file executes every exported renderer with representative arguments. It
// does not check wording or layout — it checks that each one runs, returns real
// HTML, and does not leak "undefined" into a candidate's inbox.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as E from "../src/funnelEmails.js";

const C = {
  id: "recTest01", name: "Ana Rivera", email: "ana@example.org", phone: "+63 917 000 0000",
  position: "Printer Technician", fleet: "Royal Caribbean", source: "TCMS", referrer: "",
  shipboard: true, printer: true, fit: 512, priority: true, verdict: "Passed — Priority",
  stage: "Final Scheduled", interviewer: "Yanna", recommendation: "Strong technical depth.",
  aiBrief: "", interviewNotes: "Confident, clear communicator.",
  dateApplied: "2026-07-01", dateTested: "2026-07-03", dateEndorsed: "2026-07-20",
  dateFinal: "2026-08-03", dateApproved: "2026-08-03",
  scores: { N: 22, E: 71, O: 63, A: 66, C: 78 },
  resumeUrl: "https://recruitment.cims.work/files/x.pdf", rejectionReason: "",
};

// Every exported renderer, with arguments that exercise its optional branches.
const ARGS = {
  renderTestInvite: ["Ana Rivera", "https://test", "https://verify"],
  renderTestReminder: ["Ana Rivera", "https://test", "https://verify"],
  renderPass: ["Ana Rivera"],
  renderFail: ["Ana Rivera"],
  renderFirstInterview: ["Ana Rivera", "Yanna"],
  renderHired: ["Ana Rivera"],
  renderFinalRegret: ["Ana Rivera"],
  renderAdminPassNotify: [C, "https://recruitment.cims.work/admin"],
  renderParseFailAlert: ["Ana Rivera", "ana@example.org", "abcdef0123456789abcdef01"],
  renderEndorsement: [C, "https://approve", "https://decline", "Mon 3 Aug — 08:00 Miami"],
  renderFinalInviteApplicant: ["Ana Rivera", "Mon 3 Aug — 08:00 Miami"],
  renderFinalCoordination: [C, "Mon 3 Aug — 08:00 Miami", "Ray"],
  renderDeclineNotify: [C, "Rolando"],
  renderEndorseNudge: [C, 6],
  renderCrewAdminHandoff: [C, "Excellent technical depth; ready for a large-fleet assignment."],
  renderAssignmentNotify: [C, "Yanna"],
  renderExpiryNotice: ["Ana Rivera"],
  renderExceptionRequest: [C, "Verified 10 years shipboard with two fleets.", "Yanna"],
};

test("every exported renderer is covered by this file", () => {
  const src = readFileSync(new URL("../src/funnelEmails.js", import.meta.url), "utf8");
  const exported = [...src.matchAll(/^export function (render\w+)/gm)].map(m => m[1]);
  for (const fn of exported) {
    assert.ok(ARGS[fn], "renderer " + fn + " has no smoke-test arguments — add it to ARGS");
  }
  assert.equal(exported.length, Object.keys(ARGS).length);
});

test("every renderer runs and returns complete HTML", () => {
  for (const [fn, args] of Object.entries(ARGS)) {
    assert.equal(typeof E[fn], "function", fn + " is not exported");
    let html;
    try {
      html = E[fn](...args);           // catches ReferenceError on a missing helper
    } catch (err) {
      assert.fail(fn + " threw when rendered: " + err.message);
    }
    assert.equal(typeof html, "string", fn + " did not return a string");
    assert.ok(html.length > 800, fn + " returned suspiciously short HTML (" + html.length + " bytes)");
    assert.ok(html.includes("<table"), fn + " is missing the shell layout");
    assert.ok(!/undefined/.test(html), fn + " leaked the string \"undefined\" into the body");
    assert.ok(!/\[object Object\]/.test(html), fn + " stringified an object into the body");
    assert.ok(!/\$\{/.test(html), fn + " left an unevaluated template placeholder");
  }
});

test("renderers survive sparse candidate data without printing undefined", () => {
  const bare = { id: "recBare", name: "Jun Cruz", email: "jun@example.org", scores: {} };
  for (const fn of ["renderCrewAdminHandoff", "renderAssignmentNotify", "renderDeclineNotify"]) {
    const html = E[fn](bare, fn === "renderAssignmentNotify" ? "Yanna" : "Ray");
    assert.ok(!/undefined/.test(html), fn + " leaked \"undefined\" on a sparse record");
  }
});

test("applicant emails never disclose Big Five scores (SOP v1.1)", () => {
  // Scores are an internal instrument. A candidate-facing letter must not carry them.
  const applicantFacing = [
    ["renderPass", ["Ana Rivera"]],
    ["renderFail", ["Ana Rivera"]],
    ["renderFirstInterview", ["Ana Rivera", "Yanna"]],
    ["renderHired", ["Ana Rivera"]],
    ["renderFinalRegret", ["Ana Rivera"]],
    ["renderExpiryNotice", ["Ana Rivera"]],
    ["renderFinalInviteApplicant", ["Ana Rivera", "Mon 3 Aug"]],
  ];
  for (const [fn, args] of applicantFacing) {
    const html = E[fn](...args);
    assert.ok(!/Fit Score|Neuroticism|Conscientiousness|Big Five score/i.test(html),
      fn + " discloses assessment detail to the candidate");
  }
});
