import { test } from "node:test";
import assert from "node:assert/strict";
import { THRESHOLDS, fitScore, applyGates, parseBigFiveHtml, validResultId, validateApplication } from "../src/funnelLib.js";

test("thresholds are SOP v1.1 exactly", () => {
  assert.equal(THRESHOLDS.version, "v1.1");
  assert.equal(THRESHOLDS.floor, 440);
  assert.equal(THRESHOLDS.priority, 480);
  assert.deepEqual(THRESHOLDS.guards, { Nmax: 60, Emin: 75, Omin: 70, Amin: 90, Cmin: 100 });
});

test("fit score matches the calibration sample", () => {
  assert.equal(fitScore({ N: 34, E: 98, O: 85, A: 96, C: 118 }), 483); // Jugao
  assert.equal(fitScore({ N: 46, E: 88, O: 93, A: 98, C: 113 }), 466); // Medidas
  assert.equal(fitScore({ N: 56, E: 73, O: 74, A: 87, C: 94 }), 392);  // Marto
});

test("gates: priority, pass, floor reject, guard reject", () => {
  // Jugao — 483, all guards clear → priority
  assert.deepEqual(applyGates({ N: 34, E: 98, O: 85, A: 96, C: 118 }),
    { fit: 483, verdict: "priority", failedGuards: [] });
  // Medidas — 466 → pass
  assert.equal(applyGates({ N: 46, E: 88, O: 93, A: 98, C: 113 }).verdict, "pass");
  // Marto — 392 < 440 → reject on floor (plus guards)
  assert.equal(applyGates({ N: 56, E: 73, O: 74, A: 87, C: 94 }).verdict, "reject");
  // Strong total but N=70 breaches the calm guard → reject regardless of 450 fit
  const r = applyGates({ N: 70, E: 95, O: 90, A: 100, C: 115 });
  assert.equal(r.fit, 450);
  assert.equal(r.verdict, "reject");
  assert.deepEqual(r.failedGuards, ["N>60"]);
  // Exactly at floor with clean guards → pass
  assert.equal(applyGates({ N: 60, E: 90, O: 90, A: 100, C: 100 }).verdict, "pass"); // fit 440
});

test("parseBigFiveHtml extracts domains from flight payload", () => {
  const mk = (d, s) => '\\"domain\\":\\"' + d + '\\",\\"foo\\":1,\\"score\\":' + s + ",";
  const html = "junk" + mk("N", 34) + mk("E", 98) + mk("O", 85) + mk("A", 96) + mk("C", 118) +
    // repeated payload — first occurrence must win
    mk("N", 40) + "tail";
  assert.deepEqual(parseBigFiveHtml(html), { N: 34, E: 98, O: 85, A: 96, C: 118 });
  assert.equal(parseBigFiveHtml("no payload here"), null);
  assert.equal(parseBigFiveHtml(mk("N", 34) + mk("E", 98)), null); // missing domains
});

test("result id validation", () => {
  assert.ok(validResultId("69fafe05540c3865e63a19f6"));
  assert.ok(!validResultId("69fafe05540c3865e63a19f"));  // 23 chars
  assert.ok(!validResultId("not-an-id"));
});

test("application validation", () => {
  const good = {
    name: "Cruz, Ana", email: "Ana@Example.org", phone: "+63 912 345 6789",
    position: "Printer Specialist", source: "Crew referral", referrer: "Jugao, Kevin",
    shipboard: true, printer: false, consent: true,
    resume: { key: "0f8b7c6d-1234-4abc-9def-0123456789ab.pdf", name: "cruz_ana_cv.pdf" },
  };
  const { ok, clean } = validateApplication(good);
  assert.ok(ok);
  assert.equal(clean.email, "ana@example.org"); // lowercased — it is the ID
  assert.equal(clean.referrer, "Jugao, Kevin");
  assert.equal(clean.resume.name, "cruz_ana_cv.pdf");

  assert.ok(!validateApplication({ ...good, consent: false }).ok);
  assert.ok(!validateApplication({ ...good, source: "Crew referral", referrer: "" }).ok);
  assert.ok(!validateApplication({ ...good, email: "nope" }).ok);
  assert.ok(!validateApplication({ ...good, website: "http://spam" }).ok);
  // resume is REQUIRED — and the key format is strict (uuid.ext from our own upload endpoint)
  assert.ok(!validateApplication({ ...good, resume: undefined }).ok);
  assert.ok(!validateApplication({ ...good, resume: { key: "../../etc/passwd", name: "x" } }).ok);
  assert.ok(!validateApplication({ ...good, resume: { key: "0f8b7c6d-1234-4abc-9def-0123456789ab.exe", name: "x" } }).ok);
  // referral name dropped when source is not a referral
  assert.equal(validateApplication({ ...good, source: "Walk-in" }).clean.referrer, "");
});

test("final-interview scheduling: Mondays, holidays skipped, DST correct", async () => {
  const { nextFinalMonday, isFinalHoliday, miamiIsDst, finalSlotText } = await import("../src/funnelLib.js");
  // From Wed 2026-07-22 → Mon 2026-07-27 (no holiday)
  assert.equal(nextFinalMonday("2026-07-22"), "2026-07-27");
  // From Sun 2026-08-30 → Mon 2026-08-31 is PH National Heroes Day (last Mon Aug) AND
  // the next Monday 2026-09-07 is US Labor Day → lands on 2026-09-14
  assert.ok(isFinalHoliday("2026-08-31"));
  assert.ok(isFinalHoliday("2026-09-07"));
  assert.equal(nextFinalMonday("2026-08-30"), "2026-09-14");
  // From a Monday, "next" means the FOLLOWING Monday
  assert.equal(nextFinalMonday("2026-07-27"), "2026-08-03");
  // DST: July is EDT (20:00 Manila), December is EST (21:00 Manila)
  assert.ok(miamiIsDst("2026-07-27"));
  assert.ok(!miamiIsDst("2026-12-14"));
  assert.ok(finalSlotText("2026-07-27").includes("20:00 Manila"));
  assert.ok(finalSlotText("2026-12-14").includes("21:00 Manila"));
});
