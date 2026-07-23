// Candidates table access (Airtable). One row per candidate — the system of record
// for the applicant funnel. Every write appends to the Audit Log field with a timestamp.

import { AIRTABLE, CANDIDATES } from "./config.js";

const AT_API = "https://api.airtable.com/v0";

async function at(env, path, init = {}) {
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

const F = CANDIDATES.fields;

export async function findCandidateByEmail(env, email) {
  const esc = String(email).toLowerCase().replace(/"/g, '\\"');
  const formula = encodeURIComponent(`LOWER({Email})="${esc}"`);
  const data = await at(env, `${CANDIDATES.tableId}?filterByFormula=${formula}&maxRecords=1&returnFieldsByFieldId=true`);
  return data.records[0] || null;
}

export async function findCandidateByResultId(env, resultId) {
  const esc = String(resultId).replace(/"/g, '\\"');
  const formula = encodeURIComponent(`{Result ID}="${esc}"`);
  const data = await at(env, `${CANDIDATES.tableId}?filterByFormula=${formula}&maxRecords=1&returnFieldsByFieldId=true`);
  return data.records[0] || null;
}

export async function listPendingTests(env) {
  return listByFormula(env, '{Screening Verdict}="Pending Test"');
}

export async function findCandidateById(env, id) {
  if (!/^rec[A-Za-z0-9]{14}$/.test(String(id || ""))) return null;
  try {
    const data = await at(env, CANDIDATES.tableId + "/" + id + "?returnFieldsByFieldId=true");
    return data && data.id ? data : null;
  } catch { return null; }
}

export async function findCandidateByToken(env, token) {
  if (!/^[0-9a-f-]{36}$/i.test(String(token || ""))) return null;
  const esc = String(token).replace(/"/g, '\\"');
  const data = await at(env, CANDIDATES.tableId + "?filterByFormula=" + encodeURIComponent('{Action Token}="' + esc + '"') + "&maxRecords=1&returnFieldsByFieldId=true");
  return data.records[0] || null;
}

/** All candidates, most-recent first (dashboard reads then groups client-side). */
export async function listAllCandidates(env) {
  return listByFormula(env, "");
}

async function listByFormula(env, formula) {
  const out = [];
  let offset = "";
  const f = formula ? "filterByFormula=" + encodeURIComponent(formula) + "&" : "";
  do {
    const data = await at(env, CANDIDATES.tableId + "?" + f + "pageSize=100&returnFieldsByFieldId=true" + (offset ? "&offset=" + offset : ""));
    out.push(...data.records);
    offset = data.offset || "";
  } while (offset);
  return out;
}

/** Candidates in a given Stage — used by the daily endorsement-nudge sweep. */
export async function listByStage(env, stage) {
  return listByFormula(env, '{Stage}="' + String(stage).replace(/"/g, '\\"') + '"');
}

export function auditLine(msg) {
  return new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC — " + msg;
}

export async function createCandidate(env, clean, resumeUrl, auditMsg) {
  const fields = {
    [F.name]: clean.name,
    [F.email]: clean.email,
    [F.phone]: clean.phone,
    [F.position]: clean.position,
    [F.source]: clean.source,
    ...(clean.referrer ? { [F.referrer]: clean.referrer } : {}),
    [F.shipboard]: clean.shipboard,
    [F.printer]: clean.printer,
    [F.stage]: "Applied",
    [F.verdict]: "Pending Test",
    [F.dateApplied]: new Date().toISOString().slice(0, 10),
    ...(resumeUrl ? { [F.resume]: [{ url: resumeUrl, filename: clean.resume.name }] } : {}),
    [F.consent]: true,
    [F.audit]: auditLine(auditMsg),
  };
  const data = await at(env, `${CANDIDATES.tableId}?typecast=true`, {
    method: "POST",
    body: JSON.stringify({ records: [{ fields }], typecast: true }),
  });
  return data.records[0];
}

export async function updateCandidate(env, id, fields, prevAudit, auditMsg) {
  const audit = (prevAudit ? prevAudit + "\n" : "") + auditLine(auditMsg);
  await at(env, `${CANDIDATES.tableId}/${id}?typecast=true`, {
    method: "PATCH",
    body: JSON.stringify({ fields: { ...fields, [F.audit]: audit }, typecast: true }),
  });
}

/** Convenience getters for a fetched record (field IDs). */
export function cf(rec, key) {
  return rec && rec.fields ? rec.fields[F[key]] : undefined;
}
