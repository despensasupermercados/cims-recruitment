// CIMS Recruitment — private submission form + digest/invite/reminder emails.
// Standalone worker. READ-ONLY console access via the CONSOLE_DB binding
// (fixed SELECTs in src/consoleData.js — this worker can never write there).

import { PAGE_HTML, LOCKED_HTML } from "./page.js";
import { RECIPIENTS, ADMINS, FROM, FORM_URL, CONSOLE_URL, AIRTABLE, FLEETS } from "./config.js";
import { validateSubmission, computeDigest, manilaNow, prevMonthName, isFirstMonday, isReminderThursday } from "./lib.js";
import { consoleContext } from "./consoleData.js";
import { renderDigest, renderInvite, renderReminder } from "./emails.js";

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

async function sendEmail(env, { to, cc, subject, html }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, ...(cc && cc.length ? { cc } : {}), subject, html }),
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
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(handleScheduled(env));
  },
};
