// Email HTML renderers — inline styles only (email clients ignore <style> blocks).
import { FLEETS } from "./config.js";

export const NAVY = "#1B3A5C", GREEN = "#5FB946", GREEN_L = "#6CC24A", SLATE = "#6B7280",
  LIGHT = "#9CA3AF", CLOUD = "#F3F4F6", BORDER = "#E5E7EB", DOWN = "#F87171";

export const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function shell(inner, footerNote, contextLabel = "Monthly Recruitment Update") {
  return `<!DOCTYPE html><html><body style="margin:0;padding:24px 12px;background:#EEF1F4;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:10px;overflow:hidden;font-family:Segoe UI,system-ui,Arial,sans-serif;">
    <div style="height:4px;background:linear-gradient(90deg,${NAVY} 60%,${GREEN} 60%);font-size:0;">&nbsp;</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${NAVY};"><tr>
      <td style="padding:16px 24px;">
        <span style="font-size:16px;font-weight:700;color:#fff;letter-spacing:3px;">CIMS</span>
        <span style="color:${GREEN};font-weight:700;">&nbsp;|&nbsp;</span>
        <span style="font-size:11px;font-weight:600;color:${GREEN};letter-spacing:1.5px;">DG3</span>
      </td>
      <td align="right" style="padding:16px 24px;font-size:8px;font-weight:500;color:rgba(255,255,255,0.5);letter-spacing:2px;text-transform:uppercase;">${contextLabel}</td>
    </tr></table>
    ${inner}
    <div style="border-top:1px solid ${BORDER};padding:12px 24px;font-size:9px;color:${LIGHT};line-height:1.6;">${footerNote}</div>
  </div></body></html>`;
}

function secLabel(t) {
  return `<div style="font-size:9px;font-weight:700;color:${GREEN};letter-spacing:2.5px;text-transform:uppercase;margin:18px 0 6px;">${t}</div>`;
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
    <div style="font-size:24px;font-weight:700;color:#fff;">${v}</div>
    <div style="font-size:7px;font-weight:600;color:${GREEN};letter-spacing:1.4px;text-transform:uppercase;margin-top:5px;">${l}</div>
    <div style="font-size:10px;font-weight:600;margin-top:2px;">${deltaHtml(dd)}</div></td>`).join("");

  const rateTrail = digest.rates.slice(1).map(r => `${r.month.split(" ")[0]} ${r.rate === null ? "—" : r.rate + "%"}`).join(" · ");
  const facts = [
    ["Approval rate", digest.rates[0].rate === null ? "—" : digest.rates[0].rate + "%", rateTrail],
    ["Big 5 avg score", c.big5Avg ?? "—", ""],
    ["Ready vs forecast", `${c.ready} / ${clean.forecast.joiners}`, `gap ${digest.gap} · ${clean.signoffOutlook || 0} sign-offs 60d`],
    ["Interviews to fill " + clean.forecast.joiners, digest.interviewsToFill ? "≈" + digest.interviewsToFill : "—", digest.rates[0].rate ? "at " + digest.rates[0].rate + "% approval" : ""],
  ];
  const factCells = facts.map(([l, v, s]) => `<td style="padding:9px 12px;background:${CLOUD};border-radius:6px;">
    <div style="font-size:7px;font-weight:600;color:${SLATE};letter-spacing:1.2px;text-transform:uppercase;">${l}</div>
    <div style="font-size:14px;font-weight:600;color:${NAVY};margin-top:3px;">${v} <span style="font-size:9px;font-weight:500;color:${SLATE};">${s}</span></div></td>`).join(`<td style="width:8px;">&nbsp;</td>`);

  const mrow = (label, row) => {
    const cells = FLEETS.map(f => {
      const v = (row && Number(row[f])) || 0;
      return `<td align="center" style="padding:5px 8px;font-size:11.5px;font-weight:600;color:${v ? NAVY : LIGHT};border-bottom:1px solid ${BORDER};">${v || "—"}</td>`;
    }).join("");
    const tot = FLEETS.reduce((s, f) => s + ((row && Number(row[f])) || 0), 0);
    return `<tr><td style="padding:5px 8px;font-size:8px;font-weight:600;color:${GREEN};letter-spacing:1.6px;text-transform:uppercase;border-bottom:1px solid ${BORDER};">${label}</td>${cells}
      <td align="center" style="padding:5px 8px;font-size:11.5px;font-weight:700;color:${NAVY};background:${CLOUD};border-bottom:1px solid ${BORDER};">${tot}</td></tr>`;
  };

  const peopleLine = (rows, fmt) => rows.length ? rows.map(fmt).map(esc).join(" · ") : "None";
  const li = t => `<div style="font-size:12.5px;color:#374151;line-height:1.6;padding-left:13px;position:relative;margin:3px 0;"><span style="color:${GREEN};font-weight:700;">&ndash;</span> ${t}</div>`;

  const risks = [];
  for (const v of clean.visaMedical) risks.push(`<b style="color:${NAVY};">${esc(v.type)}:</b> ${esc(v.name)} (${esc(v.fleet)})${v.note ? " — " + esc(v.note) : ""}`);
  for (const f of clean.people.flags) risks.push(`<b style="color:${NAVY};">Flag:</b> ${esc(f.name)} (${esc(f.fleet)})${f.reason ? " — " + esc(f.reason) : ""}`);
  const compliance = clean.compliance.map(r => `${esc(r.name)} — ${esc(r.doc)}${r.expires ? " — " + esc(r.expires) : ""}`);

  const channelsLine = `${clean.channels.tcms} TCMS · ${clean.channels.referrals} referrals · ${clean.channels.walkins} walk-ins`;

  const inner = `
  <div style="padding:20px 24px 24px;">
    <div style="font-size:20px;font-weight:700;color:${NAVY};">${esc(clean.month)}${revised ? ` <span style="font-size:11px;font-weight:700;color:#fff;background:${DOWN};border-radius:4px;padding:2px 8px;vertical-align:3px;">REVISED</span>` : ""}</div>
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
    <div style="font-size:12.5px;color:#374151;line-height:1.6;">${peopleLine(clean.people.ready, r => `${r.name} (${r.fleet})${r.date ? " — " + r.date : ""}`)}</div>
    ${clean.people.joined.length ? `<div style="font-size:12.5px;color:#374151;margin-top:4px;"><b style="color:${NAVY};">Joined:</b> ${peopleLine(clean.people.joined, r => `${r.name} (${r.fleet})${r.date ? " — " + r.date : ""}`)}</div>` : ""}

    ${secLabel("Rejections — " + c.rejected)}
    <div style="font-size:12.5px;color:#374151;line-height:1.6;">${esc(clean.rejectionReasons) || "No breakdown provided"}</div>

    ${risks.length || compliance.length ? secLabel("Risks & compliance") : ""}
    ${risks.map(li).join("")}
    ${compliance.length ? li(`<b style="color:${NAVY};">Renewals / expiries:</b> ` + compliance.join(" · ")) : ""}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;"><tr>
      <td width="50%" valign="top" style="padding-right:12px;">${secLabel("Sourcing now")}<div style="font-size:12.5px;color:#374151;">${esc(clean.forecast.roles) || "—"}</div></td>
      <td width="50%" valign="top">${secLabel("Decisions needed")}<div style="font-size:12.5px;color:#374151;">${esc(clean.decisions)}</div></td>
    </tr><tr>
      <td valign="top" style="padding:0 12px 0 0;">${secLabel("Candidate feedback +")}<div style="font-size:12.5px;color:#374151;">${esc(clean.feedback.positive) || "—"}</div></td>
      <td valign="top">${secLabel("Candidate feedback −")}<div style="font-size:12.5px;color:#374151;">${esc(clean.feedback.pain) || "—"}</div></td>
    </tr></table>

    ${clean.observations ? secLabel("Observations — " + esc(clean.submittedBy)) + `<div style="font-size:12.5px;color:#374151;line-height:1.6;">${esc(clean.observations)}</div>` : ""}

    ${warnings && warnings.length ? `<div style="border-left:3px solid #fab219;background:#FDF8EC;border-radius:0 8px 8px 0;padding:10px 14px;margin-top:16px;font-size:12px;color:${NAVY};">${warnings.map(esc).join("<br>")}</div>` : ""}

    <div style="margin-top:20px;"><a href="${consoleUrl}" style="display:inline-block;background:${NAVY};color:#fff;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:.5px;padding:11px 20px;border-radius:8px;">View full history in the CIMS Console</a></div>
  </div>`;

  return shell(inner, `Sent automatically on ${esc(clean.submittedBy)}'s form submission · A resubmission for the same month is marked REVISED · CIMS — A division of DG3 · Confidential`);
}

export function renderInvite(monthName, formUrl) {
  const inner = `
  <div style="padding:24px;">
    <div style="font-size:19px;font-weight:700;color:${NAVY};">${esc(monthName.split(" ")[0])} is closed — the form is open.</div>
    <p style="font-size:13px;color:#374151;line-height:1.65;margin:10px 0 0;">Time for the monthly recruitment submission covering <b style="color:${NAVY};">${esc(monthName)}</b> — final numbers only, the month is done. The form saves as you type, so each of you can complete your part at different times.</p>
    <div style="background:${CLOUD};border-radius:8px;padding:14px 16px;margin-top:14px;font-size:12.5px;color:#374151;line-height:1.8;">
      <span style="color:${GREEN};font-weight:700;">Part 1</span>&nbsp; <b style="color:${NAVY};">Recruitment Admin</b> — sourcing channels, pipeline counts, fleet, rejections<br>
      <span style="color:${GREEN};font-weight:700;">Part 2</span>&nbsp; <b style="color:${NAVY};">Crew Admin</b> — pre-filled from the CIMS Console; review, adjust, add<br>
      <span style="color:${GREEN};font-weight:700;">Submit</span>&nbsp; sends the compiled update to Miguel, Rita &amp; the team instantly
    </div>
    <div style="margin-top:18px;"><a href="${formUrl}" style="display:inline-block;background:${GREEN};color:#fff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.5px;padding:12px 24px;border-radius:8px;">Open the ${esc(monthName.split(" ")[0])} form</a></div>
    <p style="font-size:11px;color:${LIGHT};margin:12px 0 0;line-height:1.6;">Please submit within 3 days. Made a mistake after submitting? Submit the same month again — the new email goes out marked REVISED.</p>
  </div>`;
  return shell(inner, "Sent automatically on the first Monday of each month to the Recruitment Admin and Crew Admin · CIMS — A division of DG3");
}

export function renderReminder(monthName, formUrl) {
  const inner = `
  <div style="padding:24px;">
    <div style="font-size:19px;font-weight:700;color:${NAVY};">Quick reminder</div>
    <div style="border-left:3px solid #fab219;background:#FDF8EC;border-radius:0 8px 8px 0;padding:11px 14px;margin-top:12px;">
      <p style="font-size:13px;color:${NAVY};margin:0;">The <b>${esc(monthName)}</b> update hasn't been submitted yet. The team is waiting on this month's numbers.</p>
    </div>
    <p style="font-size:13px;color:#374151;line-height:1.65;margin:12px 0 0;">Anything already typed is saved as a draft — pick up where you left off and hit Submit. The email to Miguel, Rita &amp; the team goes out the moment it's in.</p>
    <div style="margin-top:16px;"><a href="${formUrl}" style="display:inline-block;background:${GREEN};color:#fff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.5px;padding:12px 24px;border-radius:8px;">Open the ${esc(monthName.split(" ")[0])} form</a></div>
    <p style="font-size:11px;color:${LIGHT};margin:12px 0 0;line-height:1.6;">This is the only reminder — no further follow-ups are sent.</p>
  </div>`;
  return shell(inner, "Sent once, 3 days after the invitation if no submission received · CIMS — A division of DG3");
}
