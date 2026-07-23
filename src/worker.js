// CIMS Recruitment — private submission form + digest/invite/reminder emails.
// Standalone worker. READ-ONLY console access via the CONSOLE_DB binding
// (fixed SELECTs in src/consoleData.js — this worker can never write there).

import { PAGE_HTML, LOCKED_HTML } from "./page.js";
import { RECIPIENTS, ADMINS, FROM, FORM_URL, CONSOLE_URL, AIRTABLE, FLEETS, FUNNEL } from "./config.js";
import { validateSubmission, computeDigest, manilaNow, prevMonthName, isFirstMonday, isReminderThursday } from "./lib.js";
import { consoleContext } from "./consoleData.js";
import { renderDigest, renderInvite, renderReminder } from "./emails.js";
import { APPLY_HTML, VERIFY_HTML } from "./funnelPages.js";
import { validateApplication, validResultId, parseBigFiveHtml, applyGates, THRESHOLDS, nextFinalMonday, finalSlotText } from "./funnelLib.js";
import { planAdminAction, planDecision } from "./adminLib.js";
import { findCandidateByEmail, findCandidateByResultId, createCandidate, updateCandidate, listPendingTests, findCandidateById, findCandidateByToken, listAllCandidates, listByStage, cf } from "./candidates.js";
import { renderTestInvite, renderTestReminder, renderPass, renderFail, renderAdminPassNotify, renderParseFailAlert, renderEndorsement, renderFinalInviteApplicant, renderFinalCoordination, renderDeclineNotify, renderEndorseNudge, renderExceptionRequest } from "./funnelEmails.js";
import { ADMIN_HTML, REPORTS_HTML } from "./adminPage.js";
import { CANDIDATES } from "./config.js";

const AT_API = "https://api.airtable.com/v0";

// ---------------------------------------------------------------------------
// Airtable helpers
// ---------------------------------------------------------------------------
async function atFetch(env, path, init = {}) {
  const res = await fetch(`${AT_API}/${AIRTABLE.baseId}/${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.AIRTABLE_TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
  return res.json();
}

async function findMonthRecord(env, month) {
  const formula = encodeURIComponent(`{Month}="${month.replace(/"/g, '\\"')}"`);
  const data = await atFetch(env, `${AIRTABLE.tableId}?filterByFormula=${formula}&maxRecords=1&returnFieldsByFieldId=true`);
  return data.records[0] || null;
}

async function listAllMonths(env) {
  const out = [];
  let offset = "";
  do {
    const data = await atFetch(env, `${AIRTABLE.tableId}?pageSize=100&returnFieldsByFieldId=true${offset ? "&offset=" + offset : ""}`);
    out.push(...data.records);
    offset = data.offset || "";
  } while (offset);
  return out;
}

function recordToCounts(rec) {
  const f = rec.fields, F = AIRTABLE.fields;
  return {
    month: f[F.month],
    status: f[F.status] || "Submitted",
    counts: {
      inProcess: f[F.inProcess] ?? null, interviewed: f[F.interviewed] ?? null,
      approved: f[F.approved] ?? null, rejected: f[F.rejected] ?? null,
      inVisa: f[F.inVisa] ?? null, inMedicals: f[F.inMedicals] ?? null,
      ready: f[F.ready] ?? null,
    },
  };
}

function cleanToFields(clean) {
  const F = AIRTABLE.fields;
  const p = clean.people;
  return {
    [F.month]: clean.month,
    [F.inProcess]: clean.counts.inProcess,
    [F.interviewed]: clean.counts.interviewed,
    [F.approved]: clean.counts.approved,
    [F.rejected]: clean.counts.rejected,
    [F.inVisa]: clean.counts.inVisa,
    [F.inMedicals]: clean.counts.inMedicals,
    [F.ready]: clean.counts.ready,
    ...(clean.counts.big5Avg !== null ? { [F.big5Avg]: clean.counts.big5Avg } : {}),
    [F.srcTcms]: clean.channels.tcms,
    [F.srcReferrals]: clean.channels.referrals,
    [F.srcWalkins]: clean.channels.walkins,
    [F.rejectionReasons]: clean.rejectionReasons,
    [F.readyNames]: p.ready.map(r => `${r.name} (${r.fleet})${r.date ? " — " + r.date : ""}`).join("\n"),
    [F.joinedNames]: p.joined.map(r => `${r.name} (${r.fleet})${r.date ? " — " + r.date : ""}`).join("\n"),
    [F.notReturning]: p.flags.map(r => `${r.name} (${r.fleet})${r.reason ? " — " + r.reason : ""}`).join("\n"),
    [F.complianceFlags]: [
      ...clean.compliance.map(r => `${r.name} — ${r.doc}${r.expires ? " — " + r.expires : ""}`),
      ...clean.visaMedical.map(r => `${r.type}: ${r.name} (${r.fleet})${r.note ? " — " + r.note : ""}`),
    ].join("\n"),
    [F.forecastJoiners]: clean.forecast.joiners,
    [F.rolesToSource]: clean.forecast.roles,
    [F.feedbackPositive]: clean.feedback.positive,
    [F.feedbackPain]: clean.feedback.pain,
    [F.decisionsNeeded]: clean.decisions,
    [F.observations]: clean.observations,
    [F.rawJson]: JSON.stringify(clean, null, 2),
    [F.status]: "Submitted",
  };
}

// ---------------------------------------------------------------------------
// Email helpers
// ---------------------------------------------------------------------------
const isPlaceholder = a => /@example\.com$/i.test(a);

function digestConfigured(env) {
  if (!env.RESEND_API_KEY) return false;
  return ![...RECIPIENTS.to, ...RECIPIENTS.cc].some(isPlaceholder);
}

function adminEmails() {
  return [ADMINS.recruitmentAdmin, ADMINS.crewAdmin].filter(a => a && !isPlaceholder(a));
}

async function sendEmail(env, { to, cc, subject, html, replyTo }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, ...(cc && cc.length ? { cc } : {}), ...(replyTo ? { reply_to: replyTo } : {}), subject, html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

function keyedFormUrl(env) {
  return FORM_URL + (env.FORM_KEY ? "/?k=" + env.FORM_KEY : "");
}

// ---------------------------------------------------------------------------
// HTTP handlers
// ---------------------------------------------------------------------------
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

function keyOk(env, provided) {
  return !!env.FORM_KEY && provided === env.FORM_KEY;
}

async function handleContext(url, env) {
  const month = url.searchParams.get("month") || "";
  const prefill = await consoleContext(env, month);

  let record = null;
  try {
    const rec = await findMonthRecord(env, month);
    if (rec) {
      let payload = null;
      try { payload = JSON.parse(rec.fields[AIRTABLE.fields.rawJson] || "null"); } catch {}
      record = { status: rec.fields[AIRTABLE.fields.status] || "Submitted", payload };
    }
  } catch (e) {
    console.log("context airtable: " + e.message);
  }
  return json({ ok: true, prefill, record });
}

async function handleDraft(body, env) {
  const payload = body.payload || {};
  const month = String(payload.month || "").trim();
  if (!month) return json({ ok: false, errors: ["No month in draft."] }, 400);

  const F = AIRTABLE.fields;
  const existing = await findMonthRecord(env, month);
  const status = existing && existing.fields[F.status] === "Submitted" ? "Submitted" : "Draft";
  const fields = { [F.month]: month, [F.status]: status, [F.rawJson]: JSON.stringify(payload, null, 2) };
  if (existing) {
    await atFetch(env, `${AIRTABLE.tableId}/${existing.id}`, { method: "PATCH", body: JSON.stringify({ fields }) });
  } else {
    await atFetch(env, AIRTABLE.tableId, { method: "POST", body: JSON.stringify({ records: [{ fields }] }) });
  }
  return json({ ok: true });
}

async function handleSubmit(body, env) {
  const { ok, errors, warnings, clean } = validateSubmission(body.payload, FLEETS);
  if (!ok) return json({ ok: false, errors }, 400);

  const existing = await findMonthRecord(env, clean.month);
  const revised = !!(existing && existing.fields[AIRTABLE.fields.status] === "Submitted");
  const fields = cleanToFields(clean);
  if (existing) {
    await atFetch(env, `${AIRTABLE.tableId}/${existing.id}`, { method: "PATCH", body: JSON.stringify({ fields }) });
  } else {
    await atFetch(env, AIRTABLE.tableId, { method: "POST", body: JSON.stringify({ records: [{ fields }] }) });
  }

  const all = await listAllMonths(env);
  const prevRows = all.map(recordToCounts).filter(r => r.month && r.month !== clean.month && r.status === "Submitted");
  const digest = computeDigest(clean, prevRows);

  let emailSkipped = true;
  if (digestConfigured(env)) {
    const c = clean.counts;
    const subject = `CIMS Recruitment Update — ${clean.month}${revised ? " (REVISED)" : ""} · Pipeline ${c.inProcess} · Approved ${c.approved} · Ready ${c.ready}`;
    const html = renderDigest(clean, digest, { revised, consoleUrl: CONSOLE_URL, warnings });
    await sendEmail(env, { to: RECIPIENTS.to, cc: RECIPIENTS.cc, subject, html });
    emailSkipped = false;
  }

  return json({ ok: true, revised, emailSkipped, warnings });
}

// ---------------------------------------------------------------------------
// Applicant funnel (Phase 1): apply → test invite → verify → verdict.
// Gates are code (SOP v1.1, funnelLib.THRESHOLDS). AI is nowhere in this path.
// ---------------------------------------------------------------------------
const CF = CANDIDATES.fields;

async function handleApply(body, env) {
  const { ok, errors, clean } = validateApplication(body);
  if (!ok) return json({ ok: false, errors }, 400);

  const existing = await findCandidateByEmail(env, clean.email);
  if (existing) {
    const verdict = cf(existing, "verdict");
    if (verdict === "Auto-Rejected") {
      const tested = cf(existing, "dateTested") || "";
      const days = tested ? (Date.now() - new Date(tested + "T00:00:00Z").getTime()) / 86400000 : 9999;
      if (days < FUNNEL.cooldownDays) {
        await updateCandidate(env, existing.id, {}, cf(existing, "audit"),
          "Re-application attempt during 12-month cooldown — declined automatically.");
        return json({ ok: false, errors: ["An application from this email was concluded recently. You are welcome to apply again 12 months after your previous assessment."] }, 400);
      }
      // Cooldown over: reset the record for a fresh run.
      await updateCandidate(env, existing.id, {
        [CF.stage]: "Applied", [CF.verdict]: "Pending Test", [CF.resultId]: "",
        [CF.phone]: clean.phone, [CF.position]: clean.position, [CF.source]: clean.source,
        [CF.dateApplied]: new Date().toISOString().slice(0, 10),
      }, cf(existing, "audit"), "Re-application after cooldown — record reset to Pending Test.");
      await sendInvite(env, clean.name, clean.email);
      return json({ ok: true });
    }
    if (verdict === "Pending Test" || verdict === "Expired — No Test") {
      await updateCandidate(env, existing.id, { [CF.verdict]: "Pending Test" }, cf(existing, "audit"), "Duplicate application — test invite re-sent.");
      await sendInvite(env, cf(existing, "name") || clean.name, clean.email);
      return json({ ok: true });
    }
    return json({ ok: false, errors: ["An application with this email is already in progress. Our recruitment team will contact you — no need to re-apply."] }, 400);
  }

  const resumeUrl = FORM_URL + "/files/" + clean.resume.key;
  const rec = await createCandidate(env, clean, resumeUrl,
    "Applied via " + (body.door === "admin" ? "admin upload" : "public page") + " (" + clean.source + "). Resume: " + clean.resume.name + ". Test invite sent.");
  await sendInvite(env, clean.name, clean.email);
  return json({ ok: true, id: rec.id });
}

// Resume upload to R2. Files are served only via unguessable /files/<uuid>.<ext> URLs.
const RESUME_EXT = { pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };

async function handleUpload(req, env) {
  if (!env.RESUMES) return json({ ok: false, errors: ["Upload storage is not configured."] }, 500);
  let fd;
  try { fd = await req.formData(); } catch { return json({ ok: false, errors: ["Invalid upload."] }, 400); }
  const f = fd.get("file");
  if (!f || typeof f === "string") return json({ ok: false, errors: ["No file received."] }, 400);
  if (f.size > 8 * 1024 * 1024) return json({ ok: false, errors: ["The file is larger than 8 MB."] }, 400);
  const ext = String(f.name || "").split(".").pop().toLowerCase();
  if (!RESUME_EXT[ext]) return json({ ok: false, errors: ["Please upload a PDF or Word document."] }, 400);
  const key = crypto.randomUUID() + "." + ext;
  await env.RESUMES.put(key, f.stream(), { httpMetadata: { contentType: RESUME_EXT[ext] } });
  return json({ ok: true, key });
}

async function handleFile(pathname, env) {
  const key = pathname.slice("/files/".length);
  if (!/^[0-9a-f-]{36}\.(pdf|doc|docx)$/i.test(key) || !env.RESUMES) return new Response("Not found", { status: 404 });
  const obj = await env.RESUMES.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
      "Content-Disposition": "inline",
      "Cache-Control": "private, max-age=300",
    },
  });
}

async function sendInvite(env, name, email) {
  if (!env.RESEND_API_KEY) return;
  await sendEmail(env, {
    to: [email],
    replyTo: FUNNEL.replyTo,
    subject: "Your DG3 CIMS application — one step left: the assessment",
    html: renderTestInvite(name, FUNNEL.testUrl, FORM_URL + "/verify"),
  });
}

async function handleVerify(body, env) {
  if (body.website) return json({ ok: false, errors: ["Spam check failed."] }, 400);
  const email = String(body.email || "").trim().toLowerCase();
  const resultId = String(body.resultId || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ ok: false, errors: ["A valid email address is required."] }, 400);
  if (!validResultId(resultId)) return json({ ok: false, errors: ["That does not look like a Result ID — it is a 24-character code from your results page."] }, 400);

  const rec = await findCandidateByEmail(env, email);
  if (!rec) return json({ ok: false, errors: ["No application found for this email. Please apply first — the email must match your application exactly."] }, 400);
  const verdict = cf(rec, "verdict");
  if (verdict !== "Pending Test") return json({ ok: false, errors: ["This application's assessment has already been processed. Check your email for the outcome."] }, 400);

  const used = await findCandidateByResultId(env, resultId);
  if (used && used.id !== rec.id) {
    await updateCandidate(env, rec.id, {}, cf(rec, "audit"), "SECURITY: submitted a Result ID already used by another candidate (" + resultId + ").");
    return json({ ok: false, errors: ["This Result ID has already been used. Please take the test yourself and submit your own Result ID."] }, 400);
  }

  const res = await fetch(FUNNEL.resultUrl + resultId, { headers: { "user-agent": "CIMS-Recruitment/1.0 (+https://recruitment.cims.work)" } });
  if (res.status === 404) return json({ ok: false, errors: ["We could not find a result with that ID — please check it for typos and try again."] }, 400);
  if (!res.ok) return json({ ok: false, errors: ["The assessment provider is temporarily unavailable. Please try again in a few minutes."] }, 502);
  const scores = parseBigFiveHtml(await res.text());
  if (!scores) {
    await updateCandidate(env, rec.id, {}, cf(rec, "audit"), "Result " + resultId + " fetched but scores could not be parsed — needs manual review.");
    if (env.RESEND_API_KEY) {
      const who = FUNNEL.notify.filter(a => a && !isPlaceholder(a));
      if (who.length) await sendEmail(env, {
        to: who,
        subject: "Manual review needed — assessment result could not be read",
        html: renderParseFailAlert(cf(rec, "name") || email, email, resultId),
      });
    }
    return json({ ok: false, errors: ["We could not read that result automatically. The recruitment team has been notified and will review it manually."] }, 500);
  }

  const { fit, verdict: gate, failedGuards } = applyGates(scores);
  const verdictLabel = gate === "priority" ? "Passed — Priority" : gate === "pass" ? "Passed" : "Auto-Rejected";
  const name = cf(rec, "name") || email;
  const today = new Date().toISOString().slice(0, 10);

  await updateCandidate(env, rec.id, {
    [CF.resultId]: resultId,
    [CF.b5N]: scores.N, [CF.b5E]: scores.E, [CF.b5O]: scores.O, [CF.b5A]: scores.A, [CF.b5C]: scores.C,
    [CF.fitScore]: fit,
    [CF.verdict]: verdictLabel,
    [CF.thresholdVersion]: THRESHOLDS.version,
    [CF.dateTested]: today,
    [CF.stage]: gate === "reject" ? "Tested — Rejected" : "Tested — Passed",
    ...(gate === "reject" ? { [CF.rejectionReason]: "Failed Big 5 / psych" } : {}),
  }, cf(rec, "audit"),
    "Result " + resultId + " scored: N" + scores.N + " E" + scores.E + " O" + scores.O + " A" + scores.A + " C" + scores.C +
    " → Fit " + fit + " → " + verdictLabel + " (thresholds " + THRESHOLDS.version +
    (failedGuards.length ? "; guards failed: " + failedGuards.join(",") : "") + ").");

  if (env.RESEND_API_KEY) {
    if (gate === "reject") {
      await sendEmail(env, { to: [email], replyTo: FUNNEL.replyTo, subject: "Your DG3 CIMS application — outcome", html: renderFail(name) });
    } else {
      await sendEmail(env, { to: [email], replyTo: FUNNEL.replyTo, subject: "Congratulations — you are moving to the next stage", html: renderPass(name) });
      const notify = FUNNEL.notify.filter(a => a && !isPlaceholder(a));
      if (notify.length) {
        await sendEmail(env, {
          to: notify,
          subject: "Candidate passed screening — " + name + " (Fit " + fit + (gate === "priority" ? ", PRIORITY" : "") + ")",
          html: renderAdminPassNotify({
            name, email, fit, priority: gate === "priority",
            position: cf(rec, "position") || "", source: cf(rec, "source") || "",
            phone: cf(rec, "phone") || "", shipboard: !!cf(rec, "shipboard"),
          }, ""),
        });
      }
    }
  }
  return json({ ok: true });
}

// ---------------------------------------------------------------------------
// Phase 2: admin surface + endorsement engine.
// List + actions are KEY-GATED (staff). /decide is token-gated (Ray/Rolando click
// from email, no key) — the unguessable Action Token is the authorization.
// ---------------------------------------------------------------------------

/** Compact candidate view for the dashboard + emails. */
function candView(rec) {
  const fit = cf(rec, "fitScore");
  return {
    id: rec.id,
    name: cf(rec, "name") || "",
    email: cf(rec, "email") || "",
    phone: cf(rec, "phone") || "",
    position: cf(rec, "position") || "",
    source: cf(rec, "source") || "",
    referrer: cf(rec, "referrer") || "",
    shipboard: !!cf(rec, "shipboard"),
    printer: !!cf(rec, "printer"),
    fit: fit ?? "",
    priority: cf(rec, "verdict") === "Passed — Priority",
    verdict: cf(rec, "verdict") || "",
    stage: cf(rec, "stage") || "",
    interviewer: cf(rec, "interviewer") || "",
    recommendation: cf(rec, "recommendation") || "",
    aiBrief: cf(rec, "aiBrief") || "",
    interviewNotes: cf(rec, "interviewNotes") || "",
    dateApplied: cf(rec, "dateApplied") || "",
    dateTested: cf(rec, "dateTested") || "",
    dateEndorsed: cf(rec, "dateEndorsed") || "",
    dateFinal: cf(rec, "dateFinal") || "",
    scores: { N: cf(rec, "b5N"), E: cf(rec, "b5E"), O: cf(rec, "b5O"), A: cf(rec, "b5A"), C: cf(rec, "b5C") },
    resumeUrl: (cf(rec, "resume") && cf(rec, "resume")[0] && cf(rec, "resume")[0].url) || "",
    rejectionReason: cf(rec, "rejectionReason") || "",
  };
}

async function handleAdminList(env) {
  const rows = await listAllCandidates(env);
  return json({ ok: true, candidates: rows.map(candView), thresholds: THRESHOLDS });
}

const notifyTeam = () => FUNNEL.notify.filter(a => a && !isPlaceholder(a));

// Send the emails a plan/decision requested. `c` = candView, `extra` carries per-kind data.
async function sendPlanEmails(env, emails, c, extra = {}) {
  if (!env.RESEND_API_KEY) return;
  for (const e of emails) {
    if (e.kind === "fail") {
      await sendEmail(env, { to: [c.email], replyTo: FUNNEL.replyTo, subject: "Your DG3 CIMS application — outcome", html: renderFail(c.name) });
    } else if (e.kind === "endorsement") {
      // One email per approver, each carrying their own name in the decide links.
      for (const ap of FUNNEL.finalApprovers) {
        const base = FORM_URL + "/decide?t=" + encodeURIComponent(extra.token) + "&by=" + encodeURIComponent(ap.name);
        await sendEmail(env, {
          to: [ap.email], cc: notifyTeam(),
          subject: "Final-interview candidate — " + c.name + " (Fit " + c.fit + (c.priority ? ", PRIORITY" : "") + ")",
          html: renderEndorsement(c, base + "&a=approve", base + "&a=decline", extra.slotText),
        });
      }
    } else if (e.kind === "exception") {
      await sendEmail(env, { to: [FUNNEL.gmEmail], cc: notifyTeam(), subject: "GM exception requested — " + c.name, html: renderExceptionRequest(c, e.reason, extra.by || "Recruitment") });
    } else if (e.kind === "finalApplicant") {
      await sendEmail(env, { to: [c.email], replyTo: FUNNEL.replyTo, subject: "Your DG3 CIMS final interview is scheduled", html: renderFinalInviteApplicant(c.name, extra.slotText) });
    } else if (e.kind === "finalCoordination") {
      const who = notifyTeam(); if (who.length) await sendEmail(env, { to: who, subject: "Approved — coordinate final interview for " + c.name, html: renderFinalCoordination(c, extra.slotText, e.by) });
    } else if (e.kind === "declineNotify") {
      const who = notifyTeam(); if (who.length) await sendEmail(env, { to: who, subject: "Endorsement declined — " + c.name, html: renderDeclineNotify(c, e.by) });
    }
  }
}

async function handleAdminAction(body, env) {
  const id = String(body.id || "");
  const action = String(body.action || "");
  const rec = await findCandidateById(env, id);
  if (!rec) return json({ ok: false, errors: ["Candidate not found."] }, 404);

  const today = new Date().toISOString().slice(0, 10);
  const params = { ...(body.params || {}), today, by: body.by || "Recruitment" };
  if (action === "endorse") params.token = crypto.randomUUID();

  const plan = planAdminAction(action, { stage: cf(rec, "stage"), verdict: cf(rec, "verdict") }, params);
  if (!plan.ok) return json({ ok: false, errors: [plan.error] }, 400);

  const fieldMap = {
    interviewer: CF.interviewer, interviewNotes: CF.interviewNotes, dateInterviewed: CF.dateInterviewed,
    rejectionReason: CF.rejectionReason, recommendation: CF.recommendation,
    actionToken: CF.actionToken, dateEndorsed: CF.dateEndorsed,
  };
  const fields = { [CF.stage]: plan.stage };
  for (const [k, v] of Object.entries(plan.fields || {})) if (fieldMap[k]) fields[fieldMap[k]] = v;

  await updateCandidate(env, rec.id, fields, cf(rec, "audit"), plan.audit);

  if (plan.emails && plan.emails.length) {
    const c = candView(rec);
    // recommendation just written isn't on the stale rec; patch the view for the email
    if (params.recommendation) c.recommendation = params.recommendation;
    let slotText = "";
    await sendPlanEmails(env, plan.emails, c, { token: params.token, slotText, by: params.by });
  }
  return json({ ok: true, stage: plan.stage });
}

// Ray/Rolando click Approve/Decline from their email. Token is the auth.
async function handleDecide(url, env) {
  const token = url.searchParams.get("t") || "";
  const decision = url.searchParams.get("a") || "";
  const byRaw = url.searchParams.get("by") || "";
  const by = FUNNEL.finalApprovers.some(a => a.name === byRaw) ? byRaw : "a manager";

  const rec = await findCandidateByToken(env, token);
  if (!rec) return decidePage("This link is no longer valid. The decision may already have been recorded.", false);

  const slotIso = nextFinalMonday(new Date().toISOString().slice(0, 10));
  const slotText = finalSlotText(slotIso);
  const plan = planDecision(decision, { stage: cf(rec, "stage") }, { by, slotIso, slotText });
  if (!plan.ok) {
    if (plan.error === "already-processed") return decidePage("This candidate has already been actioned — nothing more to do here.", true);
    return decidePage("That action was not understood.", false);
  }

  const fields = { [CF.stage]: plan.stage };
  if (plan.fields.dateFinal) fields[CF.dateFinal] = plan.fields.dateFinal;
  if (plan.fields.actionToken !== undefined) fields[CF.actionToken] = plan.fields.actionToken;
  await updateCandidate(env, rec.id, fields, cf(rec, "audit"), plan.audit);
  await sendPlanEmails(env, plan.emails, candView(rec), { slotText, by });

  return decision === "approve"
    ? decidePage("Approved. The final interview is scheduled for " + slotText + ". The applicant has been invited and the recruitment team will coordinate the call.", true)
    : decidePage("Recorded — the endorsement was declined. The recruitment team has been notified.", true);
}

function decidePage(msg, ok) {
  const color = ok ? "#5FB946" : "#C2402F";
  const html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CIMS Recruitment</title>' +
    '<style>body{margin:0;font-family:Segoe UI,Arial,sans-serif;background:#EFF3F9;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}' +
    '.c{max-width:440px;background:#fff;border:1px solid #E4EAF2;border-radius:16px;overflow:hidden;box-shadow:0 12px 30px rgba(18,44,71,.1)}' +
    '.h{height:4px;background:linear-gradient(90deg,#1B3A5C 60%,#5FB946 60%)}' +
    '.b{padding:30px 28px;text-align:center}.ic{width:56px;height:56px;border-radius:50%;background:' + color + ';margin:0 auto 16px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:28px}' +
    '.t{font-size:15px;color:#1C2A38;line-height:1.6}</style></head><body><div class="c"><div class="h"></div><div class="b">' +
    '<div class="ic">' + (ok ? '&#10003;' : '&#33;') + '</div><div class="t">' + msg + '</div></div></div></body></html>';
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

// Daily funnel sweep (02:00 UTC): 7-day test reminder, 30-day auto-expiry,
// and 5-day endorsement nudge. Idempotent (audit markers); expiry is terminal.
async function funnelDaily(env) {
  const rows = await listPendingTests(env);
  for (const rec of rows) {
    const applied = cf(rec, "dateApplied");
    if (!applied) continue;
    const days = (Date.now() - new Date(applied + "T00:00:00Z").getTime()) / 86400000;
    const email = cf(rec, "email");
    const name = cf(rec, "name") || email || "candidate";
    const audit = cf(rec, "audit") || "";
    if (days >= 30) {
      await updateCandidate(env, rec.id, {
        [CF.verdict]: "Expired — No Test", [CF.stage]: "Expired — No Test",
      }, audit, "No assessment after 30 days — application auto-closed (no cooldown applies).");
    } else if (days >= 7 && !audit.includes("7-day reminder sent") && env.RESEND_API_KEY && email) {
      await sendEmail(env, {
        to: [email], replyTo: FUNNEL.replyTo,
        subject: "Reminder — your DG3 CIMS assessment is waiting",
        html: renderTestReminder(name, FUNNEL.testUrl, FORM_URL + "/verify"),
      });
      await updateCandidate(env, rec.id, {}, audit, "7-day reminder sent.");
    }
  }
  // Endorsement nudge: still awaiting Ray/Rolando after N days.
  const endorsed = await listByStage(env, "Endorsed — Awaiting Approval");
  for (const rec of endorsed) {
    const when = cf(rec, "dateEndorsed");
    const audit = cf(rec, "audit") || "";
    if (!when || audit.includes("endorsement nudge sent")) continue;
    const days = (Date.now() - new Date(when + "T00:00:00Z").getTime()) / 86400000;
    if (days >= FUNNEL.endorseNudgeDays && env.RESEND_API_KEY) {
      const who = notifyTeam();
      if (who.length) await sendEmail(env, { to: who, subject: "Endorsement awaiting a response — " + (cf(rec, "name") || ""), html: renderEndorseNudge(candView(rec), Math.floor(days)) });
      await updateCandidate(env, rec.id, {}, audit, "Endorsement nudge sent (" + Math.floor(days) + " days awaiting authorization).");
    }
  }
}

// ---------------------------------------------------------------------------
// Cron: invitation (first Monday) + reminder (Thursday after, if not submitted)
// ---------------------------------------------------------------------------
async function handleScheduled(env) {
  const mnl = manilaNow();
  const month = prevMonthName(mnl);
  const admins = adminEmails();
  if (!env.RESEND_API_KEY || !admins.length) return;

  if (isFirstMonday(mnl)) {
    await sendEmail(env, {
      to: admins,
      subject: `${month.split(" ")[0]} closed — the Recruitment Update form is open`,
      html: renderInvite(month, keyedFormUrl(env)),
    });
  } else if (isReminderThursday(mnl)) {
    let submitted = false;
    try {
      const rec = await findMonthRecord(env, month);
      submitted = !!(rec && rec.fields[AIRTABLE.fields.status] === "Submitted");
    } catch {}
    if (!submitted) {
      await sendEmail(env, {
        to: admins,
        subject: `Reminder — ${month} Recruitment Update not yet submitted`,
        html: renderReminder(month, keyedFormUrl(env)),
      });
    }
  }
}

// ---------------------------------------------------------------------------
export default {
  async fetch(req, env) {
    const url = new URL(req.url);

    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      return new Response(keyOk(env, url.searchParams.get("k")) ? PAGE_HTML : LOCKED_HTML,
        { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (req.method === "GET" && url.pathname === "/health") {
      return json({
        ok: true,
        digestConfigured: digestConfigured(env),
        adminInvitesConfigured: adminEmails().length === 2,
        hasAirtableToken: !!env.AIRTABLE_TOKEN,
        hasFormKey: !!env.FORM_KEY,
        hasConsoleBinding: !!env.CONSOLE_DB,
      });
    }
    if (req.method === "GET" && url.pathname === "/api/context") {
      if (!keyOk(env, url.searchParams.get("k"))) return json({ ok: false }, 403);
      try { return await handleContext(url, env); }
      catch (e) { return json({ ok: false, errors: ["Server error: " + e.message] }, 500); }
    }
    // --- applicant funnel (public — no key; staff surfaces stay keyed) ---
    if (req.method === "GET" && url.pathname === "/apply") {
      return new Response(APPLY_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (req.method === "GET" && url.pathname === "/verify") {
      return new Response(VERIFY_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (req.method === "POST" && url.pathname === "/api/upload") {
      try { return await handleUpload(req, env); }
      catch (e) { return json({ ok: false, errors: ["Server error: " + e.message] }, 500); }
    }
    if (req.method === "GET" && url.pathname.startsWith("/files/")) {
      return handleFile(url.pathname, env);
    }
    // --- decision link (token-gated; Ray/Rolando click from email, no key) ---
    if (req.method === "GET" && url.pathname === "/decide") {
      try { return await handleDecide(url, env); }
      catch (e) { return decidePage("Something went wrong recording that action: " + e.message, false); }
    }
    // --- admin surface (key-gated staff) ---
    if (req.method === "GET" && url.pathname === "/admin") {
      return new Response(keyOk(env, url.searchParams.get("k")) ? ADMIN_HTML : LOCKED_HTML,
        { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (req.method === "GET" && url.pathname === "/reports") {
      return new Response(keyOk(env, url.searchParams.get("k")) ? REPORTS_HTML : LOCKED_HTML,
        { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (req.method === "GET" && url.pathname === "/api/admin/candidates") {
      if (!keyOk(env, url.searchParams.get("k"))) return json({ ok: false }, 403);
      try { return await handleAdminList(env); }
      catch (e) { return json({ ok: false, errors: ["Server error: " + e.message] }, 500); }
    }
    if (req.method === "POST" && url.pathname === "/api/admin/action") {
      let body;
      try { body = await req.json(); } catch { return json({ ok: false, errors: ["Invalid request body."] }, 400); }
      if (!keyOk(env, body.k)) return json({ ok: false }, 403);
      try { return await handleAdminAction(body, env); }
      catch (e) { return json({ ok: false, errors: ["Server error: " + e.message] }, 500); }
    }
    if (req.method === "POST" && (url.pathname === "/api/apply" || url.pathname === "/api/verify")) {
      let body;
      try { body = await req.json(); } catch { return json({ ok: false, errors: ["Invalid request body."] }, 400); }
      try {
        return url.pathname === "/api/apply" ? await handleApply(body, env) : await handleVerify(body, env);
      } catch (e) { return json({ ok: false, errors: ["Server error: " + e.message] }, 500); }
    }
    if (req.method === "POST" && (url.pathname === "/api/draft" || url.pathname === "/api/submit")) {
      let body;
      try { body = await req.json(); } catch { return json({ ok: false, errors: ["Invalid request body."] }, 400); }
      if (!keyOk(env, body.k)) return json({ ok: false }, 403);
      try {
        return url.pathname === "/api/draft" ? await handleDraft(body, env) : await handleSubmit(body, env);
      } catch (e) { return json({ ok: false, errors: ["Server error: " + e.message] }, 500); }
    }
    return new Response("Not found", { status: 404 });
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(event && event.cron === "0 2 * * *" ? funnelDaily(env) : handleScheduled(env));
  },
};
