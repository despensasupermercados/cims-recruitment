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
import { FUNNEL, ADMINS, HOSTS, FORM_URL, APPLY_URL } from "../src/config.js";

const SRC = readFileSync(new URL("../src/worker.js", import.meta.url), "utf8");

// The set the router actually gates on, read out of the source rather than
// restated here — a hardcoded copy drifts from the file it is meant to guard.
function publicPaths() {
  const block = SRC.match(/const PUBLIC_PATHS = new Set\(\[([\s\S]*?)\]\)/);
  assert.ok(block, "could not find PUBLIC_PATHS in worker.js");
  return new Set([...block[1].matchAll(/"([^"]+)"/g)].map(m => m[1]));
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
  assert.match(SRC, /url\.hostname === HOSTS\.apply && !PUBLIC_PATHS\.has\(url\.pathname\)/,
    "the host gate is missing or was rewritten — /files/ may now answer on the public host");
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

test("SANDBOX ACTIVE: no funnel email can reach a real company inbox", () => {
  // While the sandbox comment block is present in config.js, every address the
  // funnel can send to must be one of Miguel's own. Delete the marker at go-live
  // and this test stops applying — that deletion is the deliberate switch.
  const cfg = readFileSync(new URL("../src/config.js", import.meta.url), "utf8");
  if (!cfg.includes(">>> SANDBOX ACTIVE")) return;

  const reachable = [
    ...FUNNEL.notify,
    FUNNEL.replyTo,
    FUNNEL.crewAdmin,
    FUNNEL.gmEmail,
    ...FUNNEL.finalApprovers.map(a => a.email),
  ].filter(Boolean);

  assert.ok(reachable.length >= 5, "expected every funnel recipient to be listed");
  for (const a of reachable) {
    assert.ok(!/@(dg3\.com|tdgcm\.ph)$/i.test(a),
      "SANDBOX is active but the funnel can still email " + a);
  }
  // And the production monthly-form owners are deliberately untouched: the
  // digest cycle is live by design and must not be disarmed by mistake.
  assert.match(ADMINS.crewAdmin, /@dg3\.com$/i, "the monthly form owner must stay a real address");
  assert.match(ADMINS.recruitmentAdmin, /@tdgcm\.ph$/i, "the monthly form owner must stay a real address");
});
