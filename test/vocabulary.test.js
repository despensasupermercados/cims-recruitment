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
import { STAGE_VALUES, VERDICT_VALUES, REJECT_REASONS, VISA_STATUS_VALUES, MEDICAL_STATUS_VALUES, CANDIDATES } from "../src/config.js";
import { STAGES, planAdminAction } from "../src/adminLib.js";

const ALL_VOCABS = [
  ["STAGE_VALUES", STAGE_VALUES],
  ["VERDICT_VALUES", VERDICT_VALUES],
  ["REJECT_REASONS", REJECT_REASONS],
  ["VISA_STATUS_VALUES", VISA_STATUS_VALUES],
  ["MEDICAL_STATUS_VALUES", MEDICAL_STATUS_VALUES],
];

const SRC = new URL("../src/", import.meta.url);
const read = f => readFileSync(new URL(f, SRC), "utf8");
const srcFiles = readdirSync(SRC).filter(f => f.endsWith(".js"));

// ---------------------------------------------------------------------------
// The lists themselves
// ---------------------------------------------------------------------------

test("no vocabulary contains a duplicate", () => {
  for (const [name, list] of ALL_VOCABS) {
    assert.equal(new Set(list).size, list.length, name + " has a duplicate entry");
  }
});

test("no vocabulary value has leading or trailing whitespace", () => {
  // Airtable treats " Approved" and "Approved" as different options and will
  // create the second one. A stray space is a schema fork.
  for (const [, list] of ALL_VOCABS) {
    for (const v of list) assert.equal(v, v.trim(), JSON.stringify(v) + " has surrounding whitespace");
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
  // Every case here MUST reach ok:true. The second argument to planAdminAction is
  // the candidate record ({ stage, verdict }), not a bare stage string — the first
  // draft of this test passed the string, so cur.stage was undefined, canAct
  // rejected every case, and the loop ran to completion without evaluating one
  // assertion. It reported green while testing nothing. Hence the count check at
  // the bottom: a test that can silently stop testing is worse than no test.
  const cases = [
    ["outcome", STAGES.ASSIGNED, { result: "no", today: "2026-07-27" }],
    ["finalOutcome", STAGES.FINAL, { result: "no", today: "2026-07-27" }],
    ["exceptionDecide", STAGES.EXCEPTION, { result: "reject", by: "GM" }],
    ["reject", STAGES.PASSED, { reason: "Dishonesty" }],
    ["reject", STAGES.RECOMMEND, { reason: "Withdrew / other offer" }],
  ];
  let checked = 0;
  for (const [action, stage, payload] of cases) {
    const plan = planAdminAction(action, { stage, verdict: "Passed" }, payload);
    assert.ok(plan.ok, action + " from " + stage + " was refused: " + plan.error);
    assert.ok(STAGE_VALUES.includes(plan.stage),
      action + " from " + stage + " emitted stage " + JSON.stringify(plan.stage) + ", which is not a real option");
    const reason = plan.fields && plan.fields.rejectionReason;
    assert.ok(reason !== undefined, action + " from " + stage + " set no rejection reason");
    assert.ok(REJECT_REASONS.includes(reason),
      action + " from " + stage + " emitted reason " + JSON.stringify(reason) + ", which is not a real option");
    checked++;
  }
  assert.equal(checked, cases.length, "some cases were skipped — this test is not testing what it claims");
});

// ---------------------------------------------------------------------------
// Post-hire — the half of the funnel that produces the monthly report
// ---------------------------------------------------------------------------

// Five headline numbers — in visa, in medicals, ready to deploy, forecast
// joiners 60–90d, joined this month — used to be hand-counted into the form
// because the code stopped at "Approved". These tests exist so the machine that
// now produces them cannot emit a status the base does not hold: typecast is
// off, so a wrong value is a 422 in front of whoever pressed the button.

const post = (action, stage, payload = {}) =>
  planAdminAction(action, { stage, verdict: "Passed" }, { today: "2026-07-27", by: "Recruitment", ...payload });

test("the post-hire walk goes Approved → Visa → Medicals → Ready → Deployed", () => {
  // The happy path, end to end, asserting the stage each step lands on. If any
  // link breaks, a candidate stalls in a bucket and the count it feeds is wrong
  // in the direction that looks like good news.
  const walk = [
    ["startVisa", STAGES.APPROVED, {}, STAGES.VISA],
    ["visaOutcome", STAGES.VISA, { result: "approved" }, STAGES.MEDICALS],
    ["medicalOutcome", STAGES.MEDICALS, { result: "fit", expectedJoin: "2026-09-15" }, STAGES.READY],
    ["deploy", STAGES.READY, { date: "2026-07-20" }, STAGES.DEPLOYED],
  ];
  let checked = 0;
  for (const [action, from, payload, expected] of walk) {
    const plan = post(action, from, payload);
    assert.ok(plan.ok, action + " from " + from + " was refused: " + plan.error);
    assert.equal(plan.stage, expected, action + " from " + from + " landed on the wrong stage");
    assert.ok(STAGE_VALUES.includes(plan.stage), plan.stage + " is not a real Stage option");
    checked++;
  }
  assert.equal(checked, walk.length, "some steps were skipped — this test is not testing what it claims");
});

test("every visa and medical status the machine emits is a real option", () => {
  const cases = [
    ["startVisa", STAGES.APPROVED, {}],
    ["visaOutcome", STAGES.VISA, { result: "approved" }],
    ["visaOutcome", STAGES.VISA, { result: "denied" }],
    ["visaOutcome", STAGES.VISA, { result: "delayed" }],
    ["medicalOutcome", STAGES.MEDICALS, { result: "fit", expectedJoin: "2026-09-15" }],
    ["medicalOutcome", STAGES.MEDICALS, { result: "unfit" }],
    ["medicalOutcome", STAGES.MEDICALS, { result: "pending", status: "For appointment" }],
  ];
  let checked = 0;
  for (const [action, stage, payload] of cases) {
    const plan = post(action, stage, payload);
    assert.ok(plan.ok, action + " " + JSON.stringify(payload) + " was refused: " + plan.error);
    const f = plan.fields || {};
    if (f.visaStatus !== undefined) {
      assert.ok(VISA_STATUS_VALUES.includes(f.visaStatus),
        action + " emitted visa status " + JSON.stringify(f.visaStatus) + ", which is not a real option");
    }
    if (f.medicalStatus !== undefined) {
      assert.ok(MEDICAL_STATUS_VALUES.includes(f.medicalStatus),
        action + " emitted medical status " + JSON.stringify(f.medicalStatus) + ", which is not a real option");
    }
    checked++;
  }
  assert.equal(checked, cases.length, "some cases were skipped — this test is not testing what it claims");
});

test("a delayed visa keeps the candidate in visa processing", () => {
  // The count has to stay honest. Moving a delayed candidate anywhere else takes
  // them out of "in visa" while they are, in fact, still in visa.
  const plan = post("visaOutcome", STAGES.VISA, { result: "delayed" });
  assert.ok(plan.ok);
  assert.equal(plan.stage, STAGES.VISA);
  assert.equal(plan.fields.visaStatus, "Delayed / rescheduled");
});

test("a failed visa or medical leaves the pipeline instead of inflating it", () => {
  for (const [action, stage, payload] of [
    ["visaOutcome", STAGES.VISA, { result: "denied" }],
    ["medicalOutcome", STAGES.MEDICALS, { result: "unfit" }],
  ]) {
    const plan = post(action, stage, payload);
    assert.ok(plan.ok, action + " was refused: " + plan.error);
    assert.equal(plan.stage, STAGES.WITHDRAWN,
      action + " must terminate the candidate — a count that can only go up is not a count");
  }
});

test("ready for deployment cannot be reached without an expected join date", () => {
  // This is the whole forecast. If it can be skipped, "forecast joiners 60–90d"
  // silently under-reports and looks like the pipeline is smaller than it is.
  for (const bad of [undefined, "", "  ", "15/09/2026", "2026-9-15", "2026-02-31"]) {
    const plan = post("medicalOutcome", STAGES.MEDICALS, { result: "fit", expectedJoin: bad });
    assert.equal(plan.ok, false, JSON.stringify(bad) + " was accepted as an expected join date");
  }
  const good = post("medicalOutcome", STAGES.MEDICALS, { result: "fit", expectedJoin: "2026-09-15" });
  assert.ok(good.ok, "a valid ISO join date was refused: " + good.error);
  assert.equal(good.fields.expectedJoin, "2026-09-15");
  assert.equal(good.fields.dateReady, "2026-07-27", "Date Ready must be stamped when medicals clear");
});

test("deploying writes the actual date and never overwrites the forecast", () => {
  // Expected Join Date is a forecast; Date Deployed is what happened. Writing
  // one over the other would make "joined this month" right and forecast
  // accuracy unmeasurable — a forecast nobody scores is a guess with a number
  // next to it.
  const plan = post("deploy", STAGES.READY, { date: "2026-07-01" });
  assert.ok(plan.ok, plan.error);
  assert.equal(plan.fields.dateDeployed, "2026-07-01");
  assert.equal(plan.fields.expectedJoin, undefined, "deploy must not touch Expected Join Date");

  assert.equal(post("deploy", STAGES.READY, {}).fields.dateDeployed, "2026-07-27", "deploy should default to today");
  assert.equal(post("deploy", STAGES.READY, { date: "2027-01-01" }).ok, false,
    "a future join date is a forecast, not a deployment");
  assert.equal(post("deploy", STAGES.READY, { date: "not-a-date" }).ok, false);
});

test("post-hire actions are refused from the wrong stage", () => {
  // Guards the buttons against a stale page: the console is a list that can sit
  // open for an hour, and two people can act on the same candidate.
  const wrong = [
    ["startVisa", STAGES.PASSED], ["startVisa", STAGES.VISA],
    ["visaOutcome", STAGES.APPROVED], ["visaOutcome", STAGES.MEDICALS],
    ["medicalOutcome", STAGES.VISA], ["medicalOutcome", STAGES.DEPLOYED],
    ["deploy", STAGES.MEDICALS], ["deploy", STAGES.APPROVED], ["deploy", STAGES.DEPLOYED],
  ];
  for (const [action, stage] of wrong) {
    assert.equal(post(action, stage, { result: "approved", expectedJoin: "2026-09-15" }).ok, false,
      action + " must not be allowed from " + stage);
  }
});

test("a medical outcome cannot be closed through the pending status dropdown", () => {
  // "Fit" and "Not recommended" are outcomes with their own buttons and their
  // own stage transitions. Allowing them as a pending status would set the
  // status without moving the stage — the exact split between what the base
  // says and what the report counts that this work exists to close.
  for (const st of ["Fit", "Not recommended"]) {
    assert.equal(post("medicalOutcome", STAGES.MEDICALS, { result: "pending", status: st }).ok, false,
      st + " must not be settable as a pending status");
  }
  assert.equal(post("medicalOutcome", STAGES.MEDICALS, { result: "pending", status: "Nonsense" }).ok, false);
});

test("the admin console's medical status dropdown is a real subset of the vocabulary", () => {
  const med = jsArray("MEDSTATUS");
  for (const s of med) {
    assert.ok(MEDICAL_STATUS_VALUES.includes(s), JSON.stringify(s) + " is not a real Medical Status option");
  }
  for (const s of ["Fit", "Not recommended"]) {
    assert.ok(!med.includes(s), s + " must not be offered as an in-progress status");
  }
  assert.deepEqual(med, MEDICAL_STATUS_VALUES.filter(s => s !== "Fit" && s !== "Not recommended"),
    "MEDSTATUS has drifted from config.js MEDICAL_STATUS_VALUES");
});

test("every field the stage machine can plan has an Airtable field mapped to it", () => {
  // handleAdminAction used to copy plan.fields with `if (fieldMap[k])`. A key the
  // machine planned but the map did not know was dropped SILENTLY: the stage
  // advanced, the button went green, the value never reached the base. Same
  // shape as typecast — a write that succeeds and is wrong. The loop now refuses
  // an unmapped key at runtime; this test refuses one at commit time, which is
  // considerably cheaper.
  const worker = read("worker.js");
  const map = worker.match(/const fieldMap = \{([\s\S]*?)\n  \};/);
  assert.ok(map, "could not find the fieldMap in worker.js");
  const mapped = new Set([...map[1].matchAll(/(\w+)\s*:\s*CF\./g)].map(m => m[1]));

  const lib = read("adminLib.js");
  const planned = new Set();
  for (const m of lib.matchAll(/fields: \{([^}]*)\}/g)) {
    for (const k of m[1].matchAll(/(\w+)\s*:/g)) planned.add(k[1]);
  }
  // dateFinal is planned by planDecision, which is the emailed Ray/Rolando token
  // path — a different handler with its own single-field write. Listed here so
  // that if it ever moves into planAdminAction this test notices.
  planned.delete("dateFinal");
  assert.ok(/plan\.fields\.dateFinal/.test(worker), "dateFinal is no longer handled by the decision path");

  const unmapped = [...planned].filter(k => !mapped.has(k));
  assert.deepEqual(unmapped, [], "planAdminAction can emit fields worker.js cannot write");

  // And the reverse: a mapped key must name a real field in config.js, or the
  // write goes to `undefined` as a field ID.
  for (const k of mapped) {
    assert.ok(CANDIDATES.fields[k], "fieldMap references CF." + k + ", which is not in CANDIDATES.fields");
  }
});

test("the stepper renders every step it declares", () => {
  // The loop bound was the literal 6 while STEPS had six entries, so the two
  // agreed by coincidence. Adding post-hire nodes to STEPS would have silently
  // dropped them off the end of the bar.
  assert.ok(/for\(var i=1;i<=STEPS\.length;i\+\+\)/.test(adminPage),
    "stepper() must iterate STEPS.length, not a hardcoded count");
  const steps = jsArray("STEPS");
  const maxStep = Math.max(...[...adminPage.matchAll(/'[^']+':\[(\d+),'(?:act|wait|good|closed)'/g)].map(m => Number(m[1])));
  assert.ok(maxStep <= steps.length,
    "meta() points at step " + maxStep + " but the stepper only draws " + steps.length);
});
