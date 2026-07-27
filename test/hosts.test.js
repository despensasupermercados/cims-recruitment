// Host split + sandbox containment guards.
//
// Two things this file exists to stop from silently regressing:
//
// 1. apply.cims.work is the public candidate door. If a staff path ever leaks
//    into PUBLIC_PATHS, the internet-facing hostname starts serving the admin
//    console or /files/ resume downloads (candidate PII) and the WAF rule
//    scoped to that host stops being safe to write. Nothing at runtime would
//    complain — the page would simply start working where it should not.
//
// 2. Every address the applicant funnel can reach must live inside the one
//    SANDBOX block in config.js. On 2026-07-27 the hired-handoff email read
//    ADMINS.crewAdmin instead, which is the production monthly-form owner and
//    is never sandboxed. One Hired click on a test record would have sent a
//    handover sheet to the real Crew Administrator at DG3.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { FUNNEL, FUNNEL_PRODUCTION, SANDBOX, ADMINS, HOSTS, FORM_URL, APPLY_URL } from "../src/config.js";

const SRC = readFileSync(new URL("../src/worker.js", import.meta.url), "utf8");

// The sets the router actually gates on, read out of the source rather than
// restated here — a hardcoded copy drifts from the file it is meant to guard.
function pathSet(name) {
  const block = SRC.match(new RegExp("const " + name + " = new Set\\(\\[([\\s\\S]*?)\\]\\)"));
  assert.ok(block, "could not find " + name + " in worker.js");
  return new Set([...block[1].matchAll(/"([^"]+)"/g)].map(m => m[1]));
}

function publicPaths() {
  // PUBLIC_PATHS is composed from the other two, so resolve it the same way.
  return new Set([...pathSet("APPLY_ONLY_PATHS"), ...pathSet("TRANSITIONAL_PATHS"), "/health"]);
}

test("the public host serves candidate paths and nothing else", () => {
  const pub = publicPaths();
  // Candidates need exactly these to complete the funnel end to end.
  for (const p of ["/apply", "/verify", "/api/apply", "/api/upload", "/api/verify"]) {
    assert.ok(pub.has(p), "candidates cannot finish the funnel without " + p);
  }
  // Staff surfaces must never answer on the public hostname.
  for (const p of ["/", "/index.html", "/admin", "/reports", "/decide",
                   "/api/context", "/api/draft", "/api/submit", "/api/admin/candidates", "/api/admin/action"]) {
    assert.ok(!pub.has(p), p + " is a staff surface and must 404 on " + HOSTS.apply);
  }
});

test("resume downloads are never reachable from the public host", () => {
  // /files/ is prefix-matched, not exact-matched, so it can never appear in the
  // set — assert the router gate is a prefix check that the public host misses.
  const pub = publicPaths();
  for (const p of [...pub]) {
    assert.ok(!p.startsWith("/files"), "candidate PII must not be served from " + HOSTS.apply);
  }
  assert.match(SRC, /const onApplyHost = url\.hostname === HOSTS\.apply/,
    "the public-host test is missing or was rewritten");
  assert.match(SRC, /onApplyHost && !PUBLIC_PATHS\.has\(url\.pathname\)/,
    "the host gate is missing or was rewritten — /files/ may now answer on the public host");
});

test("the application endpoints are single-homed so a host-scoped rate rule works", () => {
  // The whole point of the split is that a WAF rate rule on apply.cims.work
  // covers the abuse surface. If /api/apply or /api/upload also answer on the
  // staff host, the rule is bypassed by changing one word in the request and
  // the R2 bucket fills anyway. These must exist on the public host ONLY.
  const applyOnly = pathSet("APPLY_ONLY_PATHS");
  for (const p of ["/apply", "/api/apply", "/api/upload"]) {
    assert.ok(applyOnly.has(p), p + " must be single-homed — a rate rule on " + HOSTS.apply + " cannot cover it otherwise");
  }
  // And the router must actually reject them off the public host.
  assert.match(SRC, /!onApplyHost && APPLY_ONLY_PATHS\.has\(url\.pathname\)/,
    "the staff-host rejection is missing — the application endpoints still answer on " + HOSTS.staff);
  // A bookmarked /apply on the staff host redirects rather than dead-ends.
  assert.match(SRC, /Response\.redirect\(APPLY_URL \+ "\/apply"/,
    "GET /apply on the staff host should redirect to the public host, not 404");
  // Transitional paths are the emailed ones, and only those. Anything else
  // parked here is a hole that will outlive the reason it was opened.
  assert.deepEqual([...pathSet("TRANSITIONAL_PATHS")].sort(), ["/api/verify", "/verify"],
    "only the emailed verification links may stay dual-homed");
});

test("candidate links point at the apply host, staff links at the staff host", () => {
  assert.equal(APPLY_URL, "https://" + HOSTS.apply);
  assert.equal(FORM_URL, "https://" + HOSTS.staff);
  // The verification link a candidate receives must resolve on the public host.
  assert.ok(SRC.includes('APPLY_URL + "/verify"'), "test invite/reminder must link to the apply host");
  // Resume downloads and the approver decision links stay on the staff host.
  assert.ok(SRC.includes('FORM_URL + "/files/"'), "resume URLs must stay on the staff host");
  assert.ok(SRC.includes('FORM_URL + "/decide?t="'), "approver links must stay on the staff host");
});

test("closing the funnel shuts the front door but never strands a candidate", () => {
  // /apply and /api/apply refuse; /verify and /api/verify must keep working so
  // someone already holding an invite can still submit their result ID.
  assert.match(SRC, /url\.pathname === "\/apply"\)\s*\{\s*\n\s*if \(!FUNNEL\.open\)/,
    "GET /apply is not gated on FUNNEL.open");
  assert.ok(SRC.includes('url.pathname === "/api/apply" && !FUNNEL.open'),
    "POST /api/apply is not gated on FUNNEL.open");
  assert.ok(!/url\.pathname === "\/api\/verify" && !FUNNEL\.open/.test(SRC),
    "/api/verify must stay open when the funnel is closed");
  assert.equal(typeof FUNNEL.open, "boolean", "FUNNEL.open must be an explicit boolean");
});

test("the hired handover resolves from FUNNEL, not from the production ADMINS block", () => {
  assert.ok(SRC.includes("crewAdminAddress()"), "crew handoff must go through crewAdminAddress()");
  assert.match(SRC, /FUNNEL\.crewAdmin \|\| ADMINS\.crewAdmin/, "crewAdminAddress must prefer the funnel address");
  // The raw production constant must not be read anywhere in the funnel path.
  const funnelSection = SRC.slice(SRC.indexOf("async function sendPlanEmails"));
  assert.ok(!/\[ADMINS\.crewAdmin\]/.test(funnelSection),
    "a funnel email addresses ADMINS.crewAdmin directly — that address is not sandboxed");
});

// Every address the funnel can put in a To/Cc/Reply-To header.
function reachableAddresses(f) {
  return [...f.notify, f.replyTo, f.crewAdmin, f.gmEmail, ...f.finalApprovers.map(a => a.email)].filter(Boolean);
}

test("the sandbox switch is honoured in whichever direction it is set", () => {
  const reachable = reachableAddresses(FUNNEL);
  assert.ok(reachable.length >= 5, "expected every funnel recipient to be listed");
  assert.equal(typeof SANDBOX, "boolean", "SANDBOX must be an explicit boolean");

  if (SANDBOX) {
    // Nothing may reach a real company inbox...
    for (const a of reachable) {
      assert.ok(!/@(dg3\.com|tdgcm\.ph)$/i.test(a),
        "SANDBOX is on but the funnel can still email " + a);
    }
    // ...and the door must be shut. Redirected addresses PLUS an open door is
    // the genuinely dangerous state: real people applying into a pipeline that
    // notifies nobody. It must not be reachable by flipping one thing.
    assert.equal(FUNNEL.open, false,
      "SANDBOX is on but /apply is open — candidates would apply into a pipeline nobody is watching");
  } else {
    // Go-live. A HALF-REVERT is the failure this catches: crewAdmin restored,
    // notify forgotten, funnel live, Yanna never told anyone applied. Every
    // field must match production exactly — not merely 'look like' production.
    for (const k of ["open", "replyTo", "crewAdmin", "gmEmail"]) {
      assert.deepEqual(FUNNEL[k], FUNNEL_PRODUCTION[k], "half-revert: FUNNEL." + k + " is not the production value");
    }
    assert.deepEqual(FUNNEL.notify, FUNNEL_PRODUCTION.notify, "half-revert: the team notify list is not the production list");
    assert.deepEqual(FUNNEL.finalApprovers, FUNNEL_PRODUCTION.finalApprovers, "half-revert: Ray/Rolando are not the production approvers");
    assert.equal(FUNNEL.open, true, "production must accept applications");
  }
});

test("the production address set stays intact while the sandbox is active", () => {
  // The sandbox must never be allowed to erode the values it will revert to.
  const prod = reachableAddresses(FUNNEL_PRODUCTION);
  assert.equal(prod.length, 7, "expected 2 notify + replyTo + crewAdmin + gmEmail + 2 approvers = 7");
  for (const a of prod) {
    assert.match(a, /@(dg3\.com|tdgcm\.ph)$/i, "production funnel address " + a + " is not a company inbox");
  }
  assert.equal(FUNNEL_PRODUCTION.crewAdmin, ADMINS.crewAdmin,
    "the funnel's production crew handoff must be the same person as the monthly form owner");
});

test("the live monthly digest cycle is never disarmed by the funnel sandbox", () => {
  // The digest is production by design with ten real recipients. Sandboxing the
  // funnel must not touch it.
  assert.match(ADMINS.crewAdmin, /@dg3\.com$/i, "the monthly form owner must stay a real address");
  assert.match(ADMINS.recruitmentAdmin, /@tdgcm\.ph$/i, "the monthly form owner must stay a real address");
});
