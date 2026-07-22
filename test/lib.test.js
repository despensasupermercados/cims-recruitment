import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseMonth, monthKey, prevMonthName, isFirstMonday, isReminderThursday,
  validateSubmission, computeDigest, manilaNow,
} from "../src/lib.js";

const FLEETS = ["RCL", "CEL", "AZ", "NCL"];

function goodPayload() {
  return {
    month: "July 2026",
    submittedBy: "Yanna",
    counts: { inProcess: 38, interviewed: 22, approved: 4, rejected: 16, inVisa: 5, inMedicals: 6, ready: 3, big5Avg: 448 },
    channels: { tcms: 31, referrals: 6, walkins: 1 },
    fleet: {
      approved: { RCL: 3, CEL: 1, AZ: 0, NCL: 0 },
      visa: { RCL: 2, CEL: 3, AZ: 0, NCL: 0 },
      medicals: { RCL: 2, CEL: 2, AZ: 1, NCL: 1 },
      ready: { RCL: 2, CEL: 1, AZ: 0, NCL: 0 },
      joined: { RCL: 1, CEL: 0, AZ: 0, NCL: 0 },
    },
    rejectionReasons: "11 not the best candidate · 4 failed Big 5 · 1 not eligible",
    people: {
      ready: [{ name: "Cruz, Ana", fleet: "CEL", date: "02 Aug" }],
      joined: [{ name: "Bornea, Mark John", fleet: "RCL" }],
      flags: [],
    },
    visaMedical: [{ name: "Velasco", fleet: "RCL", type: "Visa denied", note: "can re-apply" }],
    compliance: [{ name: "Estandian, Mark", doc: "Medical", expires: "Sep 2026" }],
    forecast: { joiners: 20, roles: "20 Printer Specialists" },
    feedback: { positive: "Referral program", pain: "Rejected applicant policy" },
    decisions: "NONE",
    observations: "",
  };
}

test("parseMonth accepts 'July 2026' and rejects junk", () => {
  assert.deepEqual(parseMonth("July 2026"), { y: 2026, m: 6 });
  assert.equal(parseMonth("2026-07"), null);
  assert.equal(parseMonth("Julyy 2026"), null);
  assert.ok(monthKey("August 2026") === monthKey("July 2026") + 1);
});

test("prevMonthName crosses year boundary", () => {
  const jan = new Date(Date.UTC(2027, 0, 4));
  assert.equal(prevMonthName(jan), "December 2026");
});

test("first-Monday and reminder-Thursday detection", () => {
  // Monday 3 Aug 2026 is the first Monday of August.
  assert.ok(isFirstMonday(new Date(Date.UTC(2026, 7, 3))));
  // Monday 10 Aug is NOT.
  assert.ok(!isFirstMonday(new Date(Date.UTC(2026, 7, 10))));
  // Thursday 6 Aug is the reminder Thursday (day 4..10).
  assert.ok(isReminderThursday(new Date(Date.UTC(2026, 7, 6))));
  // Thursday 13 Aug is not.
  assert.ok(!isReminderThursday(new Date(Date.UTC(2026, 7, 13))));
});

test("valid payload passes and normalises", () => {
  const { ok, errors, clean } = validateSubmission(goodPayload(), FLEETS);
  assert.deepEqual(errors, []);
  assert.ok(ok);
  assert.equal(clean.counts.inProcess, 38);
  assert.equal(clean.joinedTotal, 1);
});

test("channel mismatch is rejected with a clear message", () => {
  const p = goodPayload();
  p.channels.tcms = 30;
  const { ok, errors } = validateSubmission(p, FLEETS);
  assert.ok(!ok);
  assert.ok(errors.some(e => e.includes("don't add up to In process")));
});

test("fleet matrix mismatch is rejected", () => {
  const p = goodPayload();
  p.fleet.ready.RCL = 5;
  const { ok, errors } = validateSubmission(p, FLEETS);
  assert.ok(!ok);
  assert.ok(errors.some(e => e.includes("Fleet row 'Ready'")));
});

test("decisions must be explicit — blank is rejected", () => {
  const p = goodPayload();
  p.decisions = "";
  const { ok, errors } = validateSubmission(p, FLEETS);
  assert.ok(!ok);
  assert.ok(errors.some(e => e.includes("Decisions needed")));
});

test("honeypot rejects bots", () => {
  const p = goodPayload();
  p.website = "http://spam";
  assert.ok(!validateSubmission(p, FLEETS).ok);
});

test("computeDigest: deltas, rate trail, gap, interviews-to-fill", () => {
  const { clean } = validateSubmission(goodPayload(), FLEETS);
  const prev = [
    { month: "June 2026", counts: { inProcess: 31, interviewed: 17, approved: 4, rejected: 7, inVisa: 7, inMedicals: 5, ready: 1 } },
    { month: "May 2026", counts: { inProcess: 37, interviewed: 22, approved: 7, rejected: 11, inVisa: 7, inMedicals: 9, ready: 3 } },
  ];
  const d = computeDigest(clean, prev);
  assert.equal(d.prevMonth, "June 2026");
  assert.equal(d.delta.inProcess, 7);
  assert.equal(d.delta.ready, 2);
  assert.equal(d.rates[0].rate, 18);
  assert.equal(d.rates[1].rate, 24);
  assert.equal(d.rates[2].rate, 32);
  assert.equal(d.gap, 17);
  assert.equal(d.interviewsToFill, Math.ceil(20 / 0.18));
});

test("computeDigest with no history has null deltas", () => {
  const { clean } = validateSubmission(goodPayload(), FLEETS);
  const d = computeDigest(clean, []);
  assert.equal(d.prevMonth, null);
  assert.equal(d.delta.inProcess, null);
});

test("manilaNow shifts by +8h", () => {
  const utcMidnight = new Date(Date.UTC(2026, 7, 3, 0, 0));
  assert.equal(manilaNow(utcMidnight).getUTCHours(), 8);
});
