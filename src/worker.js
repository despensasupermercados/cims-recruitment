// CIMS Recruitment — public submission form + digest/invite/reminder emails.
// Standalone worker; deliberately shares NO code or data with cims-hr-console.

import { PAGE_HTML } from "./page.js";
import { RECIPIENTS, YANNA_EMAIL, FROM, FORM_URL, CONSOLE_URL, AIRTABLE, FLEETS } from "./config.js";
import { validateSubmission, computeDigest, manilaNow, prevMonthName, isFirstMonday, isReminderThursday } from "./lib.js";
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
    [F.joinedNames]: p.joined.map(r => `${r.name} (${r.fleet})`).join("\n"),
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
  };
}

// ---------------------------------------------------------------------------
// Email helpers
// ---------------------------------------------------------------------------
const isPlaceholder = a => /@example\.com$/i.test(a);

function emailConfigured(env) {
  if (!env.RESEND_API_KEY) return false;
  return ![...RECIPIENTS.to, ...RECIPIENTS.cc].some(isPlaceholder);
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

// ---------------------------------------------------------------------------
// HTTP handlers
// ---------------------------------------------------------------------------
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json" } });

async function handleSubmit(req, env) {
  let payload;
  try { payload = await req.json(); } catch { return json({ ok: false, errors: ["Invalid request body."] }, 400); }

  const { ok, errors, clean } = validateSubmission(payload, FLEETS);
  if (!ok) return json({ ok: false, errors }, 400);

  // One row per month: update if the month already exists (-> REVISED email).
  const existing = await findMonthRecord(env, clean.month);
  const fields = cleanToFields(clean);
  if (existing) {
    await atFetch(env, `${AIRTABLE.tableId}/${existing.id}`, { method: "PATCH", body: JSON.stringify({ fields }) });
  } else {
    await atFetch(env, AIRTABLE.tableId, { method: "POST", body: JSON.stringify({ records: [{ fields }] }) });
  }

  // Build the digest from history.
  const all = await listAllMonths(env);
  const prevRows = all.map(recordToCounts).filter(r => r.month && r.month !== clean.month);
  const digest = computeDigest(clean, prevRows);

  let emailSkipped = true;
  if (emailConfigured(env)) {
    const c = clean.counts;
    const subject = `CIMS Recruitment Update — ${clean.month}${existing ? " (REVISED)" : ""} · Pipeline ${c.inProcess} · Approved ${c.approved} · Ready ${c.ready}`;
    const html = renderDigest(clean, digest, { revised: !!existing, consoleUrl: CONSOLE_URL });
    await sendEmail(env, { to: RECIPIENTS.to, cc: RECIPIENTS.cc, subject, html });
    emailSkipped = false;
  }

  return json({ ok: true, revised: !!existing, emailSkipped });
}

// ---------------------------------------------------------------------------
// Cron: invitation (first Monday) + reminder (Thursday after, if unsubmitted)
// ---------------------------------------------------------------------------
async function handleScheduled(env) {
  const mnl = manilaNow();
  const month = prevMonthName(mnl);
  if (!env.RESEND_API_KEY || isPlaceholder(YANNA_EMAIL)) return;

  if (isFirstMonday(mnl)) {
    await sendEmail(env, {
      to: [YANNA_EMAIL],
      subject: `${month.split(" ")[0]} closed — your Recruitment Update is ready to submit`,
      html: renderInvite(month, FORM_URL),
    });
  } else if (isReminderThursday(mnl)) {
    const existing = await findMonthRecord(env, month);
    if (!existing) {
      await sendEmail(env, {
        to: [YANNA_EMAIL],
        subject: `Reminder — ${month} Recruitment Update not yet submitted`,
        html: renderReminder(month, FORM_URL),
      });
    }
  }
}

// ---------------------------------------------------------------------------
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      return new Response(PAGE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if (req.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, emailConfigured: emailConfigured(env), hasAirtableToken: !!env.AIRTABLE_TOKEN });
    }
    if (req.method === "POST" && url.pathname === "/api/submit") {
      try { return await handleSubmit(req, env); }
      catch (e) { return json({ ok: false, errors: ["Server error: " + e.message] }, 500); }
    }
    return new Response("Not found", { status: 404 });
  },
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(handleScheduled(env));
  },
};
