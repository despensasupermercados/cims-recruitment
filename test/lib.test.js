import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseMonth, monthKey, monthRange, prevMonthName, isFirstMonday, isReminderThursday,
  validateSubmission, computeDigest, manilaNow, fleetFromVessel, fleetFromShip, countByFleet,
} from "../src/lib.js";

const FLEETS = ["RCL", "CEL", "AZ", "NCL"];

function goodPayload() {
  return {
    month: "July 2026",
    submittedBy: "Recruitment Admin",
    counts: { inProcess: 38, interviewed: 22, approved: 4, rejected: 16, inVisa: 5, inMedicals: 6, ready: 3, big5Avg: 448 },
    channels: { tcms: 31, referrals: 6, walkins: 1 },
    fleet: {
      approved: { RCL: 3, CEL: 1, AZ: 0, NCL: 0 },
      visa: { RCL: 2, CEL: 3, AZ: 0, NCL: 0 },
      medicals: { RCL: 2, CEL: 2, AZ: 1, NCL: 1 },
    },
    rejectionReasons: "11 not the best candidate · 4 failed Big 5 · 1 not eligible",
    people: {
      ready: [
        { name: "Cruz, Ana", fleet: "CEL", date: "02 Aug" },
        { name: "Valderrama, Jeffrey", fleet: "RCL", date: "", src: "console" },
        { name: "Reyes, Ben", fleet: "RCL", date: "08 Aug" },
      ],
      joined: [{ name: "Bo, Dan Angelo", fleet: "RCL", date: "2026-06-25", src: "console" }],
      flags: [],
    },
    visaMedical: [{ name: "Velasco", fleet: "RCL", type: "Visa denied", note: "can re-apply" }],
    compliance: [{ name: "Estandian, Mark", doc: "Medical", expires: "2026-09-23", src: "console" }],
    forecast: { joiners: 20, roles: "20 Printer Specialists" },
    signoffOutlook: 11,
    feedback: { positive: "Referral program", pain: "Rejected applicant policy" },
    decisions: "NONE",
    observations: "",
  };
}

test("parseMonth / monthKey / monthRange", () => {
  assert.deepEqual(parseMonth("July 2026"), { y: 2026, m: 6 });
  assert.equal(parseMonth("2026-07"), null);
  assert.ok(monthKey("August 2026") === monthKey("July 2026") + 1);
  assert.deepEqual(monthRange("July 2026"), { start: "2026-07-01", end: "2026-08-01" });
  assert.deepEqual(monthRange("December 2026"), { start: "2026-12-01", end: "2027-01-01" });
});

test("prevMonthName crosses year boundary", () => {
  assert.equal(prevMonthName(new Date(Date.UTC(2027, 0, 4))), "December 2026");
});

test("first-Monday and reminder-Thursday detection", () => {
  assert.ok(isFirstMonday(new Date(Date.UTC(2026, 7, 3))));
  assert.ok(!isFirstMonday(new Date(Date.UTC(2026, 7, 10))));
  assert.ok(isReminderThursday(new Date(Date.UTC(2026, 7, 6))));
  assert.ok(!isReminderThursday(new Date(Date.UTC(2026, 7, 13))));
});

test("fleet mapping from vessel and ship names", () => {
  assert.equal(fleetFromVessel("MV AZAMARA ONWARD"), "AZ");
  assert.equal(fleetFromVessel("MV CELEBRITY SOLSTICE"), "CEL");
  assert.equal(fleetFromVessel("MV WONDER OF THE SEAS"), "RCL");
  assert.equal(fleetFromVessel(null), "");
  assert.equal(fleetFromShip("Onward"), "AZ");
  assert.equal(fleetFromShip("Millennium"), "CEL");
  assert.equal(fleetFromShip("Mariner"), "RCL");
});

test("valid payload passes; ready/joined fleet rows are derived from Part 2", () => {
  const { ok, errors, warnings, clean } = validateSubmission(goodPayload(), FLEETS);
  assert.deepEqual(errors, []);
  assert.ok(ok);
  assert.deepEqual(clean.fleet.ready, { RCL: 2, CEL: 1, AZ: 0, NCL: 0 });
  assert.deepEqual(clean.fleet.joined, { RCL: 1, CEL: 0, AZ: 0, NCL: 0 });
  assert.equal(clean.joinedTotal, 1);
  assert.equal(clean.signoffOutlook, 11);
  assert.deepEqual(warnings, []); // 3 ready in pipeline, 3 ready people
});

test("ready-count mismatch is a warning, not an error", () => {
  const p = goodPayload();
  p.people.ready.pop();
  const { ok, warnings } = validateSubmission(p, FLEETS);
  assert.ok(ok);
  assert.ok(warnings.some(w => w.includes("ready to deploy")));
});

test("channel mismatch is allowed (gate removed)", () => {
  const p = goodPayload();
  p.channels.tcms = 30;
  const { ok } = validateSubmission(p, FLEETS);
  assert.ok(ok);
});

test("candidate-stage fleet mismatch is rejected", () => {
  const p = goodPayload();
  p.fleet.approved.RCL = 5;
  const { ok, errors } = validateSubmission(p, FLEETS);
  assert.ok(!ok);
  assert.ok(errors.some(e => e.includes("Fleet row 'Approved'")));
});

test("decisions must be explicit", () => {
  const p = goodPayload();
  p.decisions = "";
  assert.ok(!validateSubmission(p, FLEETS).ok);
});

test("honeypot rejects bots", () => {
  const p = goodPayload();
  p.website = "http://spam";
  assert.ok(!validateSubmission(p, FLEETS).ok);
});

test("countByFleet ignores unknown fleets", () => {
  const out = countByFleet([{ fleet: "RCL" }, { fleet: "Unassigned" }, { fleet: "CEL" }], FLEETS);
  assert.deepEqual(out, { RCL: 1, CEL: 1, AZ: 0, NCL: 0 });
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
  assert.equal(d.rates[0].rate, 18);
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
  assert.equal(manilaNow(new Date(Date.UTC(2026, 7, 3, 0, 0))).getUTCHours(), 8);
});
