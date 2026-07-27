// The vocabulary contract.
//
// Until 2026-07-27 every Airtable write in candidates.js carried typecast:true,
// which makes Airtable CREATE any singleSelect option it does not recognise —
// no error, no log, no signal of any kind. The damage was already visible: the
// admin console's rejection dropdown offered five values that existed nowhere in
// the base, and the auto-reject path wrote "Failed Big 5 / psych" against a base
// that held "Failed Big 5 / psych analysis", so the digest's "Top rejection
// reasons" line was splitting one reason across two buckets that never added up.
//
// typecast is now off, which means a value the code writes and the base does not
// hold is a HARD FAILURE at runtime, in front of a candidate. That trade is only
// safe if drift is caught here instead. These tests are the safety net for it.
//
// The one thing this file CANNOT check is the base itself — no network in tests.
// So the discipline is: add the option in Airtable FIRST, then to config.js, then
// to the code. Never the other way round.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { STAGE_VALUES, VERDICT_VALUES, REJECT_REASONS } from "../src/config.js";
import { STAGES, planAdminAction } from "../src/adminLib.js";

const SRC = new URL("../src/", import.meta.url);
const read = f => readFileSync(new URL(f, SRC), "utf8");
const srcFiles = readdirSync(SRC).filter(f => f.endsWith(".js"));

// ---------------------------------------------------------------------------
// The lists themselves
// ---------------------------------------------------------------------------

test("no vocabulary contains a duplicate", () => {
  for (const [name, list] of [["STAGE_VALUES", STAGE_VALUES], ["VERDICT_VALUES", VERDICT_VALUES], ["REJECT_REASONS", REJECT_REASONS]]) {
    assert.equal(new Set(list).size, list.length, name + " has a duplicate entry");
  }
});

test("no vocabulary value has leading or trailing whitespace", () => {
  // Airtable treats " Approved" and "Approved" as different options and will
  // create the second one. A stray space is a schema fork.
  for (const v of [...STAGE_VALUES, ...VERDICT_VALUES, ...REJECT_REASONS]) {
    assert.equal(v, v.trim(), JSON.stringify(v) + " has surrounding whitespace");
  }
});

test("Stage and Rejection Reason do not overlap", () => {
  // Stage answers WHERE a candidate stopped; Reason answers WHY. When a reason
  // restates a stage ("Interview — not advancing" as a rejection reason) the two
  // fields carry the same information and the digest can only report one of them.
  const overlap = REJECT_REASONS.filter(r => STAGE_VALUES.includes(r));
  assert.deepEqual(overlap, [], "a rejection reason must not restate a stage");
});

// ---------------------------------------------------------------------------
// Code → vocabulary
// ---------------------------------------------------------------------------

test("every STAGES constant is in the closed Stage vocabulary", () => {
  for (const [key, value] of Object.entries(STAGES)) {
    assert.ok(STAGE_VALUES.includes(value),
      "STAGES." + key + " = " + JSON.stringify(value) + " is not in STAGE_VALUES");
  }
});

test("every Stage value has a STAGES constant", () => {
  // The reverse direction. A stage in config.js that nothing can name is either
  // dead vocabulary or a stage the code forgot how to reach.
  const named = new Set(Object.values(STAGES));
  const orphans = STAGE_VALUES.filter(v => !named.has(v));
  assert.deepEqual(orphans, [], "STAGE_VALUES entries with no STAGES constant");
});

test("no source file writes a singleSelect literal outside the vocabularies", () => {
  // Scans the field-write sites — [CF.stage]:, [F.verdict]:, [CF.rejectionReason]:
  // — and asserts every quoted string on those lines is a known vocabulary value.
  // Deliberately checked against the UNION of all three: several writes set stage
  // and verdict on one line, and attributing each literal to its own field would
  // buy precision this does not need. Any literal that is in none of the three
  // lists is drift, whichever field it was headed for.
  const known = new Set([...STAGE_VALUES, ...VERDICT_VALUES, ...REJECT_REASONS]);
  const site = /\[(?:CF|F)\.(?:stage|verdict|rejectionReason)\]\s*:/;
  const offenders = [];
  for (const f of srcFiles) {
    read(f).split("\n").forEach((line, i) => {
      if (!site.test(line)) return;
      // Drop comparison operands first: `gate === "reject" ? A : B` is a control
      // flow test, not a value headed for Airtable.
      const scan = line.replace(/[=!]==?\s*"[^"]*"/g, "");
      for (const m of scan.matchAll(/"([^"]*)"/g)) {
        const v = m[1];
        if (v === "" || known.has(v)) continue;
        offenders.push(f + ":" + (i + 1) + " → " + JSON.stringify(v));
      }
    });
  }
  assert.deepEqual(offenders, [], "unknown singleSelect literals at field-write sites");
});

test("typecast is gone from the source", () => {
  // The regression guard that matters most. If this ever goes red, every test
  // above it has been rendered advisory: typecast makes bad writes succeed.
  const offenders = srcFiles.filter(f => /typecast/i.test(read(f).replace(/^\s*\/\/.*$/gm, "")));
  assert.deepEqual(offenders, [], "typecast reintroduced (comments excepted)");
});

// ---------------------------------------------------------------------------
// Admin console → vocabulary
// ---------------------------------------------------------------------------

// adminPage.js is one template literal with a hard rule in its header: no
// backticks and no dollar-brace inside, so config values CANNOT be interpolated
// into it. The dropdown is therefore hardcoded, and the only thing keeping it
// honest is this test. That is precisely how it drifted five values away from
// the base in the first place.
const adminPage = read("adminPage.js");

function jsArray(varName) {
  const m = adminPage.match(new RegExp("var\\s+" + varName + "\\s*=\\s*(\\[[\\s\\S]*?\\]);"));
  assert.ok(m, "could not find var " + varName + " in adminPage.js");
  // Single quotes to double, and drop trailing commas — both legal in the page's
  // inline JS, neither legal in JSON.
  return JSON.parse(m[1].replace(/'/g, '"').replace(/,(\s*[\]}])/g, "$1"));
}

test("the admin console rejection dropdown matches REJECT_REASONS exactly", () => {
  assert.deepEqual(jsArray("REJECT"), REJECT_REASONS,
    "adminPage.js REJECT has drifted from config.js REJECT_REASONS");
});

test("every stage the admin console buckets is a real stage", () => {
  const bucketed = jsArray("BUCKETS").flatMap(b => b[2]);
  const unknown = bucketed.filter(s => !STAGE_VALUES.includes(s));
  assert.deepEqual(unknown, [], "BUCKETS references stages that can never occur");
});

test("every stage lands in exactly one admin console bucket", () => {
  // bucketOf() falls back to 'testing' for anything unlisted, so a stage missing
  // from BUCKETS does not error — it silently files an Approved candidate under
  // "In testing". A stage listed twice files them under whichever bucket is
  // declared first. Both are wrong quietly, which is the worst way to be wrong.
  const bucketed = jsArray("BUCKETS").flatMap(b => b[2]);
  for (const stage of STAGE_VALUES) {
    assert.equal(bucketed.filter(s => s === stage).length, 1,
      JSON.stringify(stage) + " must appear in exactly one BUCKETS entry");
  }
});

// ---------------------------------------------------------------------------
// Stage machine → vocabulary (behavioural, not textual)
// ---------------------------------------------------------------------------

test("every rejection reason the stage machine can emit is a real option", () => {
  // The fallbacks used to be "Interview — not advancing" and "Final interview —
  // not selected" — neither existed in the base, both restated the stage. They
  // are exercised here rather than grepped for, because what matters is the value
  // that reaches Airtable, not the literal in the file.
  const cases = [
    ["outcome", "Tested — Passed", { result: "no", today: "2026-07-27" }],
    ["outcome", "Interview Assigned", { result: "no", today: "2026-07-27" }],
    ["finalOutcome", "Final Scheduled", { result: "no", today: "2026-07-27" }],
    ["exceptionDecide", "Exception Requested", { result: "reject", by: "GM" }],
    ["reject", "Tested — Passed", { reason: "Dishonesty" }],
  ];
  for (const [action, stage, payload] of cases) {
    const plan = planAdminAction(action, stage, payload);
    if (!plan.ok) continue; // guarded by canAct — covered in admin.test.js
    const reason = plan.fields && plan.fields.rejectionReason;
    if (reason === undefined) continue;
    assert.ok(REJECT_REASONS.includes(reason),
      action + " from " + stage + " emitted reason " + JSON.stringify(reason) + ", which is not a real option");
    assert.ok(STAGE_VALUES.includes(plan.stage),
      action + " from " + stage + " emitted stage " + JSON.stringify(plan.stage));
  }
});
