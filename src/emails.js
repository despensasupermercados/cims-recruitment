// Email HTML renderers — inline styles only (email clients ignore <style> blocks).
// Design system: the CIMS Travel Console language. 60/40 brand strip, deep-navy
// masthead with the CIMS wordmark, Outfit for headlines and numerals, mono for
// codes and tabular figures, green FILLS for state, GREEN_INK for labels on
// light backgrounds, one red reserved for broken standards, amber for warnings.
// Everything degrades to Helvetica in Outlook. No flexbox, no CSS variables.
import { FLEETS } from "./config.js";

export const NAVY = "#1B3A5C", GREEN = "#5FB946", GREEN_L = "#6CC24A", SLATE = "#6B7280",
  LIGHT = "#9CA3AF", CLOUD = "#F3F4F6", BORDER = "#E5E7EB", DOWN = "#F87171";
export const DEEP = "#142D48", GREEN_INK = "#3E7F2E", RED = "#96281B", AMBER = "#B7791F", BODY = "#374151";

export const FONT = "'DM Sans',Helvetica,Arial,sans-serif";
export const FONT_H = "'Outfit',Helvetica,Arial,sans-serif";
export const FONT_M = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

export const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function shell(inner, footerNote, contextLabel = "Monthly Recruitment Update") {
  return `<!DOCTYPE html><html><body style="margin:0;padding:24px 12px;background:#EEF1F4;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:10px;overflow:hidden;font-family:${FONT};">
    <div style="height:4px;background:linear-gradient(90deg,${NAVY} 60%,${GREEN} 60%);font-size:0;">&nbsp;</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${DEEP};"><tr>
      <td style="padding:18px 24px;">
        <div style="font-family:${FONT_H};font-size:18px;font-weight:700;letter-spacing:5px;color:#ffffff;line-height:1;">CIMS</div>
        <div style="height:2px;background:${GREEN};width:72px;margin:6px 0 5px;font-size:0;">&nbsp;</div>
        <div style="font-size:7px;letter-spacing:2.2px;color:rgba(255,255,255,.55);">CRUISE INDUSTRY MANAGED SERVICES</div>
      </td>
      <td align="right" valign="bottom" style="padding:18px 24px;font-size:8px;font-weight:600;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;">${contextLabel}</td>
    </tr></table>
    ${inner}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${DEEP};"><tr>
      <td style="padding:13px 24px;font-size:9.5px;color:rgba(255,255,255,.5);line-height:1.7;">${footerNote}</td>
    </tr></table>
  </div></body></html>`;
}

/* ── shared primitives (used here and by funnelEmails.js) ───────────────────── */
export const eyebrow = t => `<div style="font-size:9px;letter-spacing:2.4px;color:${GREEN_INK};font-weight:700;">${t}</div>`;
export const headline = t => `<div style="font-family:${FONT_H};font-size:21px;font-weight:600;color:${NAVY};margin-top:5px;line-height:1.3;">${t}</div>`;
export const para = t => `<p style="font-size:13.5px;color:${BODY};line-height:1.65;margin:10px 0 0;">${t}</p>`;
export const finePrint = t => `<p style="font-size:11px;color:${LIGHT};margin:12px 0 0;line-height:1.6;">${t}</p>`;
export const btnGreen = (href, label) => `<a href="${href}" style="display:inline-block;background:${GREEN};color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.4px;padding:12px 24px;border-radius:8px;">${label}</a>`;
export const btnNavy = (href, label) => `<a href="${href}" style="display:inline-block;background:${NAVY};color:#ffffff;text-decoration:none;font-size:12.5px;font-weight:600;letter-spacing:.4px;padding:11px 20px;border-radius:8px;">${label}</a>`;
export const amberBox = t => `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;"><tr>
  <td width="4" style="background:${AMBER};font-size:0;">&nbsp;</td>
  <td style="background:#FDF6E8;padding:11px 14px;font-size:13px;color:${NAVY};line-height:1.6;">${t}</td></tr></table>`;
export const chip = (t, bg) => `<span style="display:inline-block;background:${bg};color:#ffffff;font-size:9px;font-weight:700;letter-spacing:1.4px;padding:3px 9px;border-radius:3px;">${t}</span>`;

/** Numbered itinerary rail — the console's segment-marker device. */
export const stepsBox = rows => `<table width="100%" cellpadding="0" cellspacing="0" style="background:${CLOUD};border-radius:8px;margin-top:14px;"><tr><td style="padding:6px 16px 12px;">
${rows.map(([n, head, rest]) => `<table width="100%" cellpadding="0" cellspacing="0"><tr>
  <td width="26" valign="top" style="padding-top:9px;"><div style="width:20px;height:20px;background:${NAVY};color:#ffffff;border-radius:10px;text-align:center;font-family:${FONT_M};font-size:11px;font-weight:700;line-height:20px;">${n}</div></td>
  <td style="padding:8px 0 0 8px;font-size:12.5px;color:${BODY};line-height:1.6;"><b style="color:${NAVY};">${head}</b> — ${rest}</td>
</tr></table>`).join("")}
</td></tr></table>`;

/** Perforated tear line — the boarding-pass stub divider. */
export const stubLine = (bg = "#ffffff", dash = BORDER) => `<tr><td style="padding:0;font-size:0;">
 <table width="100%" cellpadding="0" cellspacing="0"><tr>
  <td width="11" height="16" style="background:${bg};border-radius:0 16px 16px 0;font-size:0;">&nbsp;</td>
  <td style="font-size:0;"><div style="border-bottom:2px dashed ${dash};height:8px;font-size:0;">&nbsp;</div></td>
  <td width="11" height="16" style="background:${bg};border-radius:16px 0 0 16px;font-size:0;">&nbsp;</td>
 </tr></table>
</td></tr>`;

function secLabel(t) {
  return `<div style="font-size:9px;font-weight:700;color:${GREEN_INK};letter-spacing:2.5px;text-transform:uppercase;margin:18px 0 6px;">${t}</div>`;
}

function deltaHtml(d) {
  if (d === null || d === undefined) return `<span style="color:rgba(255,255,255,0.45);">&mdash;</span>`;
  if (d > 0) return `<span style="color:${GREEN_L};">+${d}</span>`;
  if (d < 0) return `<span style="color:rgba(255,255,255,0.45);">&minus;${Math.abs(d)}</span>`;
  return `<span style="color:rgba(255,255,255,0.45);">0</span>`;
}

/** The team digest. clean = validated submission; digest = computeDigest output. */
export function renderDigest(clean, digest, { revised, consoleUrl, warnings }) {
  const c = clean.counts, d = digest.delta;
  const kpis = [
    ["In process", c.inProcess, d.inProcess], ["Interviewed", c.interviewed, d.interviewed],
    ["Approved", c.approved, d.approved], ["Rejected", c.rejected, d.rejected],
    ["Ready", c.ready, d.ready], ["Joined", clean.joinedTotal, null],
  ];
  const kpiCells = kpis.map(([l, v, dd]) => `<td align="center" style="padding:14px 2px;border-left:1px solid rgba(255,255,255,0.08);">
    <div style="font-family:${FONT_H};font-size:25px;font-weight:700;color:#fff;">${v}</div>
    <div style="font-size:7px;font-weight:700;color:${GREEN};letter-spacing:1.4px;text-transform:uppercase;margin-top:5px;">${l}</div>
    <div style="font-family:${FONT_M};font-size:10px;font-weight:600;margin-top:2px;">${deltaHtml(dd)}</div></td>`).join("");

  const rateTrail = digest.rates.slice(1).map(r => `${r.month.split(" ")[0]} ${r.rate === null ? "—" : r.rate + "%"}`).join(" · ");
  const facts = [
    ["Approval rate", digest.rates[0].rate === null ? "—" : digest.rates[0].rate + "%", rateTrail],
    ["Big 5 avg score", c.big5Avg ?? "—", ""],
    ["Ready vs forecast", `${c.ready} / ${clean.forecast.joiners}`, `gap ${digest.gap} · ${clean.signoffOutlook || 0} sign-offs 60d`],
    ["Interviews to fill " + clean.forecast.joiners, digest.interviewsToFill ? "≈" + digest.interviewsToFill : "—", digest.rates[0].rate ? "at " + digest.rates[0].rate + "% approval" : ""],
  ];
  const factCells = facts.map(([l, v, s]) => `<td style="padding:9px 12px;background:${CLOUD};border-radius:6px;">
    <div style="font-size:7px;font-weight:700;color:${SLATE};letter-spacing:1.2px;text-transform:uppercase;">${l}</div>
    <div style="font-family:${FONT_H};font-size:14px;font-weight:600;color:${NAVY};margin-top:3px;">${v} <span style="font-family:${FONT};font-size:9px;font-weight:500;color:${SLATE};">${s}</span></div></td>`).join(`<td style="width:8px;">&nbsp;</td>`);

  const mrow = (label, row) => {
    const cells = FLEETS.map(f => {
      const v = (row && Number(row[f])) || 0;
      return `<td align="center" style="padding:5px 8px;font-family:${FONT_M};font-size:11.5px;font-weight:600;color:${v ? NAVY : LIGHT};border-bottom:1px solid ${BORDER};">${v || "—"}</td>`;
    }).join("");
    const tot = FLEETS.reduce((s, f) => s + ((row && Number(row[f])) || 0), 0);
    return `<tr><td style="padding:5px 8px;font-size:8px;font-weight:700;color:${GREEN_INK};letter-spacing:1.6px;text-transform:uppercase;border-bottom:1px solid ${BORDER};">${label}</td>${cells}
      <td align="center" style="padding:5px 8px;font-family:${FONT_M};font-size:11.5px;font-weight:700;color:${NAVY};background:${CLOUD};border-bottom:1px solid ${BORDER};">${tot}</td></tr>`;
  };

  const peopleLine = (rows, fmt) => rows.length ? rows.map(fmt).map(esc).join(" · ") : "None";
  const li = t => `<div style="font-size:12.5px;color:${BODY};line-height:1.6;padding-left:13px;position:relative;margin:3px 0;"><span style="color:${GREEN_INK};font-weight:700;">&ndash;</span> ${t}</div>`;

  const risks = [];
  for (const v of clean.visaMedical) risks.push(`<b style="color:${NAVY};">${esc(v.type)}:</b> ${esc(v.name)} (${esc(v.fleet)})${v.note ? " — " + esc(v.note) : ""}`);
  for (const f of clean.people.flags) risks.push(`<b style="color:${NAVY};">Flag:</b> ${esc(f.name)} (${esc(f.fleet)})${f.reason ? " — " + esc(f.reason) : ""}`);
  const compliance = clean.compliance.map(r => `${esc(r.name)} — ${esc(r.doc)}${r.expires ? " — " + esc(r.expires) : ""}`);

  const channelsLine = `${clean.channels.tcms} TCMS · ${clean.channels.referrals} referrals · ${clean.channels.walkins} walk-ins`;

  const inner = `
  <div style="padding:20px 24px 24px;">
    ${eyebrow("MONTHLY RECRUITMENT UPDATE")}
    <div style="font-family:${FONT_H};font-size:21px;font-weight:600;color:${NAVY};margin-top:5px;">${esc(clean.month)}${revised ? ` <span style="font-family:${FONT};font-size:11px;font-weight:700;color:#fff;background:${DOWN};border-radius:4px;padding:2px 8px;vertical-align:3px;">REVISED</span>` : ""}</div>
    <div style="font-size:11px;color:${SLATE};margin-top:3px;">Submitted by ${esc(clean.submittedBy)}${digest.prevMonth ? " · deltas vs " + esc(digest.prevMonth) : " · first month on record"}</div>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:${NAVY};border-radius:8px;margin-top:14px;"><tr>${kpiCells}</tr></table>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;"><tr>${factCells}</tr></table>

    ${secLabel("By fleet")}
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr><td style="font-size:8px;font-weight:700;color:${SLATE};letter-spacing:1.5px;border-bottom:2px solid ${NAVY};padding:4px 8px;">STAGE</td>
      ${FLEETS.map(f => `<td align="center" style="font-size:8px;font-weight:700;color:${SLATE};letter-spacing:1.5px;border-bottom:2px solid ${NAVY};padding:4px 8px;">${f}</td>`).join("")}
      <td align="center" style="font-size:8px;font-weight:700;color:${SLATE};letter-spacing:1.5px;border-bottom:2px solid ${NAVY};padding:4px 8px;">TOTAL</td></tr>
      ${mrow("Approved", clean.fleet.approved)}${mrow("Visa", clean.fleet.visa)}${mrow("Medicals", clean.fleet.medicals)}${mrow("Ready", clean.fleet.ready)}${mrow("Joined", clean.fleet.joined)}
    </table>
    <div style="font-size:10.5px;color:${SLATE};margin-top:6px;">Sourcing: ${channelsLine}</div>

    ${secLabel("Ready to deploy")}
    <div style="font-size:12.5px;color:${BODY};line-height:1.6;">${peopleLine(clean.people.ready, r => `${r.name} (${r.fleet})${r.date ? " — " + r.date : ""}`)}</div>
    ${clean.people.joined.length ? `<div style="font-size:12.5px;color:${BODY};margin-top:4px;"><b style="color:${NAVY};">Joined:</b> ${peopleLine(clean.people.joined, r => `${r.name} (${r.fleet})${r.date ? " — " + r.date : ""}`)}</div>` : ""}

    ${secLabel("Rejections — " + c.rejected)}
    <div style="font-size:12.5px;color:${BODY};line-height:1.6;">${esc(clean.rejectionReasons) || "No breakdown provided"}</div>

    ${risks.length || compliance.length ? secLabel("Risks & compliance") : ""}
    ${risks.map(li).join("")}
    ${compliance.length ? li(`<b style="color:${NAVY};">Renewals / expiries:</b> ` + compliance.join(" · ")) : ""}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;"><tr>
      <td width="50%" valign="top" style="padding-right:12px;">${secLabel("Sourcing now")}<div style="font-size:12.5px;color:${BODY};">${esc(clean.forecast.roles) || "—"}</div></td>
      <td width="50%" valign="top">${secLabel("Decisions needed")}<div style="font-size:12.5px;color:${BODY};">${esc(clean.decisions)}</div></td>
    </tr><tr>
      <td valign="top" style="padding:0 12px 0 0;">${secLabel("Candidate feedback +")}<div style="font-size:12.5px;color:${BODY};">${esc(clean.feedback.positive) || "—"}</div></td>
      <td valign="top">${secLabel("Candidate feedback −")}<div style="font-size:12.5px;color:${BODY};">${esc(clean.feedback.pain) || "—"}</div></td>
    </tr></table>

    ${clean.observations ? secLabel("Observations — " + esc(clean.submittedBy)) + `<div style="font-size:12.5px;color:${BODY};line-height:1.6;">${esc(clean.observations)}</div>` : ""}

    ${warnings && warnings.length ? amberBox(warnings.map(esc).join("<br>")) : ""}

    <div style="margin-top:20px;">${btnNavy(consoleUrl, "View full history in the CIMS Console")}</div>
  </div>`;

  return shell(inner, `Sent automatically on ${esc(clean.submittedBy)}'s form submission · A resubmission for the same month is marked REVISED · CIMS — A division of DG3 · Confidential`);
}

export function renderInvite(monthName, formUrl) {
  const inner = `
  <div style="padding:22px 24px 24px;">
    ${eyebrow("MONTHLY RECRUITMENT UPDATE")}
    ${headline(esc(monthName.split(" ")[0]) + " is closed — the form is open.")}
    ${para(`Time for the monthly recruitment submission covering <b style="color:${NAVY};">${esc(monthName)}</b> — final numbers only, the month is done. The form saves as you type, so each of you can complete your part at different times.`)}
    ${stepsBox([
      ["1", "Recruitment Admin", "sourcing channels, pipeline counts, fleet, rejections"],
      ["2", "Crew Admin", "pre-filled from the CIMS Console; review, adjust, add"],
      ["3", "Submit", "sends the compiled update to Miguel, Rita &amp; the team instantly"],
    ])}
    <div style="margin-top:18px;">${btnGreen(formUrl, "Open the " + esc(monthName.split(" ")[0]) + " form")}</div>
    ${finePrint("Please submit within 3 days. Made a mistake after submitting? Submit the same month again — the new email goes out marked REVISED.")}
  </div>`;
  return shell(inner, "Sent automatically on the first Monday of each month to the Recruitment Admin and Crew Admin · CIMS — A division of DG3");
}

export function renderReminder(monthName, formUrl) {
  const inner = `
  <div style="padding:22px 24px 24px;">
    ${eyebrow("MONTHLY RECRUITMENT UPDATE")}
    ${headline("Quick reminder")}
    ${amberBox(`The <b>${esc(monthName)}</b> update hasn't been submitted yet. The team is waiting on this month's numbers.`)}
    ${para("Anything already typed is saved as a draft — pick up where you left off and hit Submit. The email to Miguel, Rita &amp; the team goes out the moment it's in.")}
    <div style="margin-top:16px;">${btnGreen(formUrl, "Open the " + esc(monthName.split(" ")[0]) + " form")}</div>
    ${finePrint("This is the only reminder — no further follow-ups are sent.")}
  </div>`;
  return shell(inner, "Sent once, 3 days after the invitation if no submission received · CIMS — A division of DG3");
}
