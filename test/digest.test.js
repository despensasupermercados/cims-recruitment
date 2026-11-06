// Digest v3 — renderer, scheduler windows, name matching, verdict.
//
// The October 2026 submission is replayed against a console context shaped
// like the live HR database on 6 Nov 2026, with and without the console, and
// with the scheduler's three windows. Nothing here touches the network.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  validateSubmission, computeDigest, isFirstMonday, isReminderThursday, isReminder2Thursday,
  normName, shortShip, classifyPeople, verdict,
} from "../src/lib.js";
import { renderDigest, renderInvite, renderReminder, renderReminder2 } from "../src/emails.js";
import { FLEETS, ADMIN_MAIL, REMINDER2_EXTRA_CC, ADMINS } from "../src/config.js";

const OCT = {
  month: "October 2026", submittedBy: "Yanna",
  counts: { inProcess: 6, interviewed: 6, approved: 4, rejected: 2, inVisa: 1, inMedicals: 4, ready: 7, big5Avg: "" },
  channels: { tcms: 15, referrals: 10, walkins: 0 },
  fleet: { approved: { RCL: 3, AZ: 1 }, visa: { RCL: 1 }, medicals: { RCL: 2, CEL: 1, AZ: 1 } },
  people: {
    ready: [
      { name: "Dela Torre, Reonnel", fleet: "RCL" }, { name: "Mangunay, Jeffrey", fleet: "CEL" },
      { name: "Ordono, Raymond", fleet: "CEL" }, { name: "Manligas, Oscar", fleet: "CEL" },
      { name: "Tatel, Lovely Joy", fleet: "CEL" }, { name: "Gayda, Cherry", fleet: "RCL" },
      { name: "JOSEPH, EMIL RONDY", fleet: "CEL" },
    ],
    joined: [
      { name: "De Torres, Jonathan", fleet: "RCL", date: "Oct 02" }, { name: "Baleña, A.J. Lorenzo", fleet: "AZ", date: "Oct 16" },
      { name: "Matchado, Jay", fleet: "RCL", date: "Oct 30" },
    ],
    flags: [{ name: "Marto, Ryan", fleet: "RCL", reason: "" }],
  },
  visaMedical: [{ name: "Jugao, Kevin Leif", fleet: "AZ", type: "Medical renewal", note: "" }],
  compliance: [],
  forecast: { joiners: "25", roles: "Printer Specialist" },
  signoffOutlook: "7",
  feedback: { positive: "", pain: "" },
  decisions: "NONE", observations: "",
};

const PREV = [
  { month: "September 2026", status: "Submitted", counts: { inProcess: 3, interviewed: 4, approved: 1, rejected: 3, inVisa: 6, inMedicals: 7, ready: 2 }, forecast: 24, signoffOutlook: null, joinedTotal: 4 },
  { month: "July 2026", status: "Submitted", counts: { inProcess: 38, interviewed: 22, approved: 4, rejected: 16, inVisa: 5, inMedicals: 2, ready: 3 }, forecast: 20, signoffOutlook: null, joinedTotal: 1 },
  { month: "May 2026", status: "Submitted", counts: { inProcess: 37, interviewed: 22, approved: 7, rejected: 11, inVisa: 7, inMedicals: 9, ready: 3 }, forecast: 20, signoffOutlook: null, joinedTotal: 2 },
];

function ctxLike() {
  const crew = [
    ["Mangunay, Jeffrey", "On Vacation", "MV CELEBRITY INFINITY", "SC-1"],
    ["Ordoño, Raymond", "On Vacation", "MV CELEBRITY REFLECTION", "SC-2"],
    ["JOSEPH, EMIL RONDY", "On Vacation", null, "358775"],
    ["De Torres, Jonathan", "On board", "MV JEWEL OF THE SEAS", "SC-3"],
    ["Matchado, Jay", "Earmarked", "MV VOYAGER OF THE SEAS", "SC-4"],
    ["Marto, Ryan Paolo", "On Vacation", "MV QUANTUM OF THE SEAS", "SC-5"],
    ["Jugao, Kevin Leif", "On board", "MV AZAMARA PURSUIT", "SC-6"],
    ["Catama, Rnicolie", "On board", "MV UTOPIA OF THE SEAS", "SC-7"],
  ];
  const crewIndex = new Map();
  for (const [name, status, vessel, sc] of crew) crewIndex.set(normName(name), { name, status, ship: shortShip(vessel), fleet: vessel && vessel.includes("CELEBRITY") ? "CEL" : vessel && vessel.includes("AZAMARA") ? "AZ" : "RCL", agencyId: sc });
  const docsByName = new Map([
    [normName("JOSEPH, EMIL RONDY"), [{ doc: "Certificate (SCH)", date: "2026-09-28" }, { doc: "Medical", date: "2027-01-03" }]],
    [normName("Jugao, Kevin Leif"), [{ doc: "Medical", date: "2027-05-14" }]],
    [normName("Catama, Rnicolie"), [{ doc: "Certificate (SCH)", date: "2025-11-26" }]],
  ]);
  return {
    headcount: { onBoard: 49, earmarked: 15, vacation: 11, inactive: 6 },
    coverage: { served: 48, covered: 47, none: [{ ship: "Xcel", earmarked: ["Aquitania, John", "Purnama, Ida"] }], doubled: ["Pursuit", "Enchantment"] },
    bench: [{ name: "Calayag, Andrea", ship: "Radiance", fleet: "RCL" }, { name: "Marto, Ryan Paolo", ship: "Quantum", fleet: "RCL" }, { name: "Mangunay, Jeffrey", ship: "Infinity", fleet: "CEL" }],
    signoffs60: [
      { name: "Villafranca, Dave", ship: "Eclipse", fleet: "CEL", date: "2026-11-10" }, { name: "Agbada, James", ship: "Silhouette", fleet: "CEL", date: "2026-11-21" },
      { name: "Purnama, Ida", ship: "Xcel", fleet: "CEL", date: "2026-11-21" }, { name: "Cina, Maria", ship: "Oasis", fleet: "RCL", date: "2026-11-26" },
      { name: "Gibas, Sherry", ship: "Legend", fleet: "RCL", date: "2026-11-28" }, { name: "Lanuza, Karl", ship: "Adventure", fleet: "RCL", date: "2026-11-29" },
      { name: "Tolentino, Angelo", ship: "Icon", fleet: "RCL", date: "2026-12-12" },
    ],
    signoffs90: [{ name: "Bugarin, Rudy", ship: "Millennium", fleet: "CEL", date: "2027-01-24" }],
    crewIndex, docsByName,
    expired: { sailing: [{ name: "Catama, Rnicolie", ship: "Utopia", fleet: "RCL", doc: "Certificate (SCH)", date: "2025-11-26", status: "On board" }], next: [{ name: "Aquitania, John", ship: "Xcel", fleet: "CEL", doc: "US Visa", date: "2026-04-05", status: "Earmarked" }] },
    renewals30: [{ name: "Osorio, Norman", ship: "Legend", fleet: "RCL", doc: "Medical", date: "2026-11-17" }],
    provenance: { crewUpdated: "2026-11-01", contractMaxSignOn: "2026-06-27" },
  };
}

function octClean() {
  const { ok, errors, clean, warnings } = validateSubmission(OCT, FLEETS);
  assert.ok(ok, errors.join("; "));
  return { clean, warnings };
}

test("scheduler: invite, day-3 and day-10 windows never overlap and cover every month shape", () => {
  // Nov 2026: first Monday 2 Nov, Thursdays 5 Nov (+3) and 12 Nov (+10).
  assert.ok(isFirstMonday(new Date(Date.UTC(2026, 10, 2))));
  assert.ok(isReminderThursday(new Date(Date.UTC(2026, 10, 5))));
  assert.ok(!isReminder2Thursday(new Date(Date.UTC(2026, 10, 5))));
  assert.ok(isReminder2Thursday(new Date(Date.UTC(2026, 10, 12))));
  assert.ok(!isReminderThursday(new Date(Date.UTC(2026, 10, 12))));
  assert.ok(!isReminder2Thursday(new Date(Date.UTC(2026, 10, 19))));
  // Month starting on a Thursday (Oct 2026): first Monday 5 Oct → Thu 8 Oct, Thu 15 Oct.
  assert.ok(isFirstMonday(new Date(Date.UTC(2026, 9, 5))));
  assert.ok(isReminderThursday(new Date(Date.UTC(2026, 9, 8))));
  assert.ok(isReminder2Thursday(new Date(Date.UTC(2026, 9, 15))));
  // Month starting on a Monday (Mar 2027): 1 Mar → Thu 4 Mar, Thu 11 Mar. Date 1 is still "first Monday".
  assert.ok(isFirstMonday(new Date(Date.UTC(2027, 2, 1))));
  assert.ok(isReminderThursday(new Date(Date.UTC(2027, 2, 4))));
  assert.ok(isReminder2Thursday(new Date(Date.UTC(2027, 2, 11))));
  // Every Thursday matches exactly one or zero windows.
  for (let d = 1; d <= 31; d++) {
    const dt = new Date(Date.UTC(2026, 9, d));
    if (dt.getUTCMonth() !== 9) break;
    assert.ok(!(isReminderThursday(dt) && isReminder2Thursday(dt)), "day " + d + " matched both windows");
  }
});

test("form-cycle envelope: To the recruitment inbox, Cc Joy and Yanna; digest list untouched", () => {
  assert.deepEqual(ADMIN_MAIL.to, ["recruitment@tdgcm.ph"]);
  assert.ok(ADMIN_MAIL.cc.includes(ADMINS.crewAdmin), "Joy is Cc");
  assert.ok(ADMIN_MAIL.cc.some(a => /^yanna\./i.test(a) && /@tdgcm\.ph$/i.test(a)), "Yanna is Cc");
  assert.ok(Array.isArray(REMINDER2_EXTRA_CC));
  // The worker must read the envelope, never the bare ADMINS pair, for every form-cycle send.
  const src = readFileSync(new URL("../src/worker.js", import.meta.url), "utf8");
  const sched = src.slice(src.indexOf("async function handleScheduled"), src.indexOf("// Host gate."));
  assert.ok(!/to: admins/.test(sched), "handleScheduled still sends To: admins");
  assert.match(sched, /renderReminder2/);
  assert.match(sched, /isReminder2Thursday/);
});

test("name matching survives case, diacritics and form suffixes", () => {
  assert.equal(normName("Ordoño, Raymond (CEL) — Oct 02"), normName("ORDONO, RAYMOND"));
  assert.equal(normName("Baleña, A.J. Lorenzo"), "balena, a j lorenzo");
  assert.equal(shortShip("MV CELEBRITY XCEL"), "Xcel");
  assert.equal(shortShip("MV WONDER OF THE SEAS"), "Wonder");
  assert.equal(shortShip("Adventure"), "Adventure");
  assert.equal(shortShip(null), "");
});

test("ready and joined lists split into new vs returning against the register", () => {
  const ctx = ctxLike();
  const { clean } = octClean();
  const ready = classifyPeople(clean.people.ready, ctx.crewIndex);
  assert.equal(ready.filter(r => r.kind === "returning").length, 3, "Mangunay, Ordoño, Joseph are returning");
  assert.equal(ready.filter(r => r.kind === "new").length, 4);
  const joined = classifyPeople(clean.people.joined, ctx.crewIndex);
  assert.equal(joined.find(j => /Bale/.test(j.name)).kind, "new");
  assert.equal(joined.find(j => /De Torres/.test(j.name)).kind, "returning");
  assert.equal(joined.find(j => /Matchado/.test(j.name)).crew.status, "Earmarked");
});

test("verdict rules", () => {
  const trend = [{ interviewed: 22 }, { interviewed: 22 }, { interviewed: 4 }];
  assert.equal(verdict({ ready: 7, signoffs60: 7, interviewed: 6, trend, readyBlocked: 0 }), "WATCH");
  assert.equal(verdict({ ready: 5, signoffs60: 7, interviewed: 20, trend, readyBlocked: 0 }), "SHORT");
  assert.equal(verdict({ ready: 9, signoffs60: 7, interviewed: 20, trend, readyBlocked: 0 }), "ON TRACK");
  assert.equal(verdict({ ready: 9, signoffs60: 7, interviewed: 20, trend, readyBlocked: 1 }), "WATCH");
  assert.equal(verdict({ ready: 9, signoffs60: null, interviewed: 1, trend: [], readyBlocked: 0 }), "ON TRACK");
});

test("forecast joiners is optional; the digest math copes with null", () => {
  const p = JSON.parse(JSON.stringify(OCT)); p.forecast.joiners = "";
  const { ok, clean } = validateSubmission(p, FLEETS);
  assert.ok(ok);
  assert.equal(clean.forecast.joiners, null);
  const d = computeDigest(clean, PREV);
  assert.equal(d.gap, null);
  assert.equal(d.interviewsToFill, null);
  assert.equal(d.history[d.history.length - 1].forecast, null);
  assert.equal(d.trend.length, 4);
  assert.deepEqual(d.trend.map(t => t.month.split(" ")[0]), ["May", "July", "September", "October"]);
});

test("digest v3 renders the October replay with the console and says the things the old one hid", () => {
  const { clean, warnings } = octClean();
  const digest = computeDigest(clean, PREV);
  const html = renderDigest(clean, digest, { revised: true, consoleUrl: "https://cims.work", warnings, ctx: ctxLike(), funnelOpen: false });
  assert.ok(!/undefined|\[object Object\]|\$\{|NaN/.test(html), "leaked a placeholder");
  assert.ok(!/rgba\(|linear-gradient/.test(html), "Outlook-hostile CSS");
  assert.match(html, /WATCH/);
  assert.match(html, /Covered to 12 Dec/);
  assert.match(html, /unassigned on vacation/);                 // bench in the first line
  assert.match(html, /47 of 48 served ships/);                   // ship coverage
  assert.match(html, /Xcel has none/);
  assert.match(html, /3 are returning crew, 4 new/);             // ready split
  assert.match(html, /SCH expired/);                             // Emil flagged in the ready list
  assert.match(html, /Open apply\.cims\.work/);                   // standing decision while sandboxed
  assert.match(html, /Expired documents on 2 crew/);
  assert.match(html, /flagged by recruitment/);                   // Marto
  assert.match(html, /one of the two is wrong/i);                 // Jugao conflict + Matchado conflict
  assert.match(html, /reported joined Oct 30/);
  assert.match(html, /first contracts/);
  assert.match(html, /Rotation:/);
  assert.match(html, /Not yet measured/);
  assert.match(html, /Growth demand/);
  assert.match(html, /contract register 27 Jun 2026/);
  assert.match(html, /67% of interviewed · Sep 25% · Jul 18%/);
  assert.match(html, /REVISED|revised/);
  // bench excludes people already in the ready list (Mangunay) — 2 left, both named
  assert.match(html, /2 on vacation — returning or not\?/);
  assert.match(html, /Calayag/);
});

test("digest v3 degrades without the console and never prints undefined", () => {
  const { clean, warnings } = octClean();
  const digest = computeDigest(clean, PREV);
  const html = renderDigest(clean, digest, { revised: false, consoleUrl: "https://cims.work", warnings, ctx: null, funnelOpen: true });
  assert.ok(!/undefined|\[object Object\]|\$\{|NaN/.test(html));
  assert.match(html, /Console unavailable/);
  assert.ok(!/Open apply\.cims\.work/.test(html), "no standing decision when the funnel is open");
  assert.match(html, /7 ready, for 7 sign-offs/);                // falls back to the form's own count
  assert.ok(!/Bench/.test(html));
});

test("digest v3 handles an empty month without throwing", () => {
  const p = JSON.parse(JSON.stringify(OCT));
  p.counts = { inProcess: 0, interviewed: 0, approved: 0, rejected: 0, inVisa: 0, inMedicals: 0, ready: 0, big5Avg: "" };
  p.channels = { tcms: 0, referrals: 0, walkins: 0 }; p.fleet = {}; p.people = { ready: [], joined: [], flags: [] };
  p.visaMedical = []; p.forecast = { joiners: "", roles: "" }; p.signoffOutlook = "0";
  const { ok, clean, warnings } = validateSubmission(p, FLEETS);
  assert.ok(ok);
  const html = renderDigest(clean, computeDigest(clean, []), { revised: false, consoleUrl: "https://cims.work", warnings, ctx: null });
  assert.ok(!/undefined|NaN|\[object Object\]/.test(html));
});

test("form-cycle mails carry the standard mast and the new copy", () => {
  for (const html of [renderInvite("October 2026", "https://x/?k=1"), renderReminder("October 2026", "https://x/?k=1"), renderReminder2("October 2026", "https://x/?k=1", { part1: true, part2: false })]) {
    assert.ok(!/rgba\(|linear-gradient/.test(html));
    assert.match(html, /bgcolor="#1B3A5C"[^>]*>&nbsp;<\/td>\s*<td width="40%"/);   // two-cell rule
    assert.ok(!/undefined/.test(html));
  }
  assert.ok(!/only reminder/.test(renderReminder("October 2026", "https://x")));
  assert.match(renderReminder2("October 2026", "https://x", { part1: true, part2: false }), /Part 1 started, Part 2 empty/);
  assert.match(renderReminder2("October 2026", "https://x", null), /10 days overdue/);
});
