// Email HTML renderers — inline styles only (email clients ignore <style> blocks).
// Design system: the CIMS Travel Console language. 60/40 brand strip, deep-navy
// masthead with the CIMS wordmark, Outfit for headlines and numerals, mono for
// codes and tabular figures, green FILLS for state, GREEN_INK for labels on
// light backgrounds, one red reserved for broken standards, amber for warnings.
// Everything degrades to Helvetica in Outlook. No flexbox, no CSS variables.
import { FLEETS, GROWTH_DEMAND } from "./config.js";
import { mastRows, M } from "./cims-mast.js";
import { classifyPeople, normName, verdict } from "./lib.js";

export const NAVY = "#1B3A5C", GREEN = "#5FB946", GREEN_L = "#6CC24A", SLATE = "#6B7280",
  LIGHT = "#9CA3AF", CLOUD = "#F3F4F6", BORDER = "#E5E7EB", DOWN = "#F87171";
export const DEEP = "#142D48", GREEN_INK = "#3E7F2E", RED = "#96281B", AMBER = "#B7791F", BODY = "#374151";

export const FONT = "'DM Sans',Helvetica,Arial,sans-serif";
export const FONT_H = "'Outfit',Helvetica,Arial,sans-serif";
export const FONT_M = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";

export const esc = s => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function shell(inner, footerNote, _contextLabel) {
  // Standard letterhead (cims-email-standard §1/§2): two-cell 60/40 rule, solid
  // hex colours only — Outlook's Word engine drops gradients and rgba(). The
  // right-hand context label is gone by design; _contextLabel is accepted and
  // ignored so older call sites keep working. Footer text uses the mast's own
  // solid subtitle tint instead of white-at-50%.
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:24px 12px;background:#EEF1F4;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:0;">
  <table role="presentation" width="640" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff" style="max-width:640px;width:100%;background:#ffffff;border-radius:10px;overflow:hidden;font-family:${FONT};">
    ${mastRows()}
    <tr><td style="padding:0;">${inner}</td></tr>
    <tr><td bgcolor="${DEEP}" style="background:${DEEP};padding:13px 24px;font-size:9.5px;color:${M.sub};line-height:1.7;">${footerNote}</td></tr>
  </table>
  </td></tr></table></body></html>`;
}

/* ── shared primitives (used here and by funnelEmails.js) ───────────────────── */
export const eyebrow = t => `<div style="font-size:9px;letter-spacing:2.4px;color:${GREEN_INK};font-weight:700;">${t}</div>`;
export const headline = t => `<div style="font-family:${FONT_H};font-size:21px;font-weight:600;color:${NAVY};margin-top:5px;line-height:1.3;">${t}</div>`;
export const para = t => `<p style="font-size:13.5px;color:${BODY};line-height:1.65;margin:10px 0 0;">${t}</p>`;
export const finePrint = t => `<p style="font-size:11px;color:${LIGHT};margin:12px 0 0;line-height:1.6;">${t}</p>`;
export const btnGreen = (href, label) => `<a href="${href}" style="display:inline-block;background:${GREEN};color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.4px;padding:12px 24px;border-radius:8px;">${label}</a>`;
export const btnNavy = (href, label) => `<a href="${href}" style="display:inline-block;background:${NAVY};color:#ffffff;text-decoration:none;font-size:12.5px;font-weight:600;letter-spacing:.4px;padding:11px 20px;border-radius:8px;">${label}</a>`;
export const amberBox = t => `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;"><tr>
  <td width="4" bgcolor="${AMBER}" style="background:${AMBER};font-size:0;">&nbsp;</td>
  <td bgcolor="#F6EEE1" style="background:#F6EEE1;padding:11px 14px;font-size:13px;color:${NAVY};line-height:1.6;">${t}</td></tr></table>`;
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

/* ── digest v3 ("Daylight, CIMS edition" — cims-email-standard §9) ───────────
   The email says the answer in its first line. Sections, top to bottom:
   eyebrow + verdict pill · headline · three lines · coverage bars · names ·
   funnel tiles + trend · by fleet + headcount · action list with owners ·
   not-yet-measured · joined + forecast vs actual · CTA · provenance footer.
   Every console-fed section degrades to a one-line "console unavailable" note. */

const MONO = FONT_M + ",'Courier New',monospace";
const RED_TINT = "#F4E5E3", AMBER_TINT = "#F6EEE1", GREEN_MID = "#9CC98A", GREEN_PALE = "#C5DFBA";

const sec = t => `<div style="font-size:12px;font-weight:700;letter-spacing:1.4px;color:${GREEN_INK};text-transform:uppercase;">${t}</div>`;
const secRow = (l, r) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td>${sec(l)}</td><td align="right" style="font-size:12px;color:${SLATE};">${r || ""}</td></tr></table>`;
const pill = (t, bg, fg) => `<span style="display:inline-block;background:${bg};color:${fg};font-size:11px;font-weight:700;padding:5px 10px;border-radius:999px;white-space:nowrap;">${t}</span>`;
const block = inner => `<tr><td style="padding:26px 28px 0;">${inner}</td></tr>`;
const grey = t => `<span style="color:${LIGHT};">${t}</span>`;
const bigNum = (n, color = NAVY) => `<div style="font-family:${FONT_H};font-size:28px;font-weight:700;color:${color};line-height:1;">${n}</div>`;
const small = t => `<div style="font-size:11px;color:${SLATE};margin-top:4px;">${t}</div>`;
const note = t => `<div style="font-size:12px;color:${SLATE};margin-top:10px;line-height:1.5;">${t}</div>`;
const fmtDate = iso => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return esc(iso || "");
  const d = new Date(iso.slice(0, 10) + "T00:00:00Z");
  return d.getUTCDate() + " " + ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getUTCMonth()];
};
const fmtMonthYear = iso => {
  if (!iso || !/^\d{4}-\d{2}/.test(iso)) return esc(iso || "");
  const d = new Date(iso.slice(0, 7) + "-01T00:00:00Z");
  return ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getUTCMonth()] + " " + d.getUTCFullYear();
};
const pct = (a, b) => (b ? Math.round((a / b) * 100) : null);

function bar(cells, label, right) {
  const segs = cells.filter(c => c.w > 0).map((c, i, arr) => {
    const first = i === 0, last = i === arr.length - 1;
    const radius = first && last ? "4px" : first ? "4px 0 0 4px" : last ? "0 4px 4px 0" : "0";
    return `<td width="${c.w}%" height="22" bgcolor="${c.bg}" style="background:${c.bg};height:22px;border-radius:${radius};font-size:0;">&nbsp;</td>`;
  }).join("");
  return `<tr>
   <td width="92" style="font-size:12px;color:${SLATE};padding:0 10px 0 0;">${label}</td>
   <td style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${segs}<td style="font-size:0;">&nbsp;</td></tr></table></td>
   <td width="150" align="right" style="font-family:${FONT_H};font-size:16px;font-weight:700;color:${NAVY};padding-left:12px;">${right}</td>
  </tr><tr><td colspan="3" height="8" style="font-size:0;line-height:0;">&nbsp;</td></tr>`;
}

function actionRow(n, color, title, body, owner, ownerBg, ownerFg, last) {
  // Two cells, not three: a fixed owner column plus an unbreakable title
  // ("apply.cims.work") pushed the whole email past 320px. The owner pill sits
  // on its own line under the title, which costs nothing on desktop and never
  // forces width on a phone.
  const bb = last ? "" : `border-bottom:1px solid ${BORDER};`;
  return `<tr>
   <td width="28" valign="top" style="padding:14px 0;${bb}"><div style="width:22px;height:22px;background:${color};color:#fff;border-radius:11px;text-align:center;font-family:${MONO};font-size:12px;font-weight:700;line-height:22px;">${n}</div></td>
   <td valign="top" style="padding:14px 0 14px 10px;${bb}">
    <div style="font-family:${FONT_H};font-size:17px;font-weight:600;color:${NAVY};line-height:1.25;">${title}</div>
    <div style="margin-top:6px;">${pill(owner, ownerBg, ownerFg)}</div>
    <div style="font-size:13px;color:${BODY};line-height:1.55;margin-top:6px;">${body}</div>
   </td>
  </tr>`;
}

/**
 * The team digest, v3.
 * clean  = validated submission (validateSubmission)
 * digest = computeDigest output (deltas, rates, trend, history)
 * ctx    = digestContext output from the console, or null
 */
export function renderDigest(clean, digest, { revised, consoleUrl, warnings, ctx = null, funnelOpen = true }) {
  const c = clean.counts;
  const monthShort = clean.month.split(" ")[0];
  const hasCtx = !!ctx;

  // ---- people classification (new vs returning) and doc status for the ready list
  const ready = classifyPeople(clean.people.ready, hasCtx ? ctx.crewIndex : null);
  const today = new Date().toISOString().slice(0, 10);
  const expiredFor = name => {
    if (!hasCtx) return [];
    return (ctx.docsByName.get(normName(name)) || []).filter(d => d.date < today);
  };
  for (const r of ready) r.expired = expiredFor(r.name);
  const readyBlocked = ready.filter(r => r.expired.length).length;
  const readyNew = ready.filter(r => r.kind === "new").length;
  const readyReturning = ready.length - readyNew;

  const joined = classifyPeople(clean.people.joined, hasCtx ? ctx.crewIndex : null);
  const firstContracts = joined.filter(j => j.kind === "new");
  const rotation = joined.filter(j => j.kind === "returning");
  // A "joined" name the console still has as Earmarked (not On board) is a conflict worth a line.
  const joinedConflicts = joined.filter(j => j.crew && j.crew.status === "Earmarked");

  // ---- demand & supply
  const signoffs60 = hasCtx ? ctx.signoffs60 : null;
  const demand = hasCtx ? signoffs60.length : (clean.signoffOutlook || null);
  const bench = hasCtx ? ctx.bench.filter(b => !ready.some(r => normName(r.name) === normName(b.name))) : [];
  const behind = (c.inMedicals || 0) + (c.inVisa || 0) + (c.approved || 0);

  // ---- verdict
  const v = verdict({ ready: c.ready, signoffs60: demand, interviewed: c.interviewed, trend: digest.trend.slice(0, -1), readyBlocked });
  const vStyle = v === "SHORT" ? [RED_TINT, RED] : v === "WATCH" ? [AMBER_TINT, AMBER] : ["#EAF5E3", GREEN_INK];

  // ---- headline
  const covered = demand === null ? null : c.ready >= demand;
  const lastSo = signoffs60 && signoffs60.length ? fmtDate(signoffs60[signoffs60.length - 1].date) : null;
  const trendPast = digest.trend.slice(0, -1).map(t => t.interviewed).filter(n => typeof n === "number");
  const peak = trendPast.length ? Math.max(...trendPast) : null;
  const thin = peak !== null && trendPast.length >= 3 && c.interviewed < peak / 2;
  const h1 = demand === null ? `${c.ready} ready to deploy.`
    : covered ? `Covered${lastSo ? " to " + lastSo : " for 60 days"}${bench.length ? "," : "."}`
    : `Short by ${demand - c.ready}${lastSo ? " to " + lastSo : ""}.`;
  const h2 = covered && bench.length ? `maybe over-covered.${thin ? " Nothing behind it for Q" + (Math.floor(new Date().getUTCMonth() / 3) + 2 > 4 ? 1 : Math.floor(new Date().getUTCMonth() / 3) + 2) + "." : ""}`
    : thin ? "The funnel behind it is thin." : covered === false ? "Pipeline cannot close it this month." : "";

  const line = (color, html) => `<tr><td width="22" valign="top" style="padding:3px 0;color:${color};font-weight:700;">●</td><td style="padding:3px 0;">${html}</td></tr>`;
  const lines = [];
  if (demand !== null) {
    lines.push(line(covered ? GREEN : RED,
      `<b style="color:${NAVY};">${c.ready} ready${bench.length ? " + " + bench.length + " unassigned on vacation" : ""}, for ${demand} sign-off${demand === 1 ? "" : "s"}</b>${lastSo ? " through " + lastSo : " in 60 days"}.` +
      (covered && bench.length ? ` If the ${bench.length} are coming back, supply is ${c.ready + bench.length} for ${demand} — the question is whether we are recruiting people we do not need.` : covered ? " One-for-one, no spare." : "")));
  } else {
    lines.push(line(LIGHT, `<b style="color:${NAVY};">${c.ready} ready to deploy.</b> Console demand unavailable this month.`));
  }
  const trailTxt = digest.trend.slice(0, -1).filter(t => t.interviewed !== null).slice(-2).map(t => `${t.interviewed} in ${t.month.split(" ")[0]}`).join(", ");
  lines.push(line(thin ? RED : GREEN_INK, `<b style="color:${NAVY};">${c.interviewed} interview${c.interviewed === 1 ? "" : "s"}</b> in ${monthShort}${trailTxt ? ", " + trailTxt : ""}${thin ? " — the funnel has collapsed and the fix is a decision, not a hire." : "."}`));
  if (hasCtx) {
    const ex = ctx.expired.sailing.length + ctx.expired.next.length;
    const exNames = new Set([...ctx.expired.sailing, ...ctx.expired.next].map(e => e.name)).size;
    if (exNames) lines.push(line(AMBER, `<b style="color:${NAVY};">${exNames} crew carrying an expired document</b> per TDG's register — ${new Set(ctx.expired.sailing.map(e => e.name)).size} sailing, ${new Set(ctx.expired.next.map(e => e.name)).size} earmarked or on vacation and due to fly next.`));
    lines.push(line(NAVY, `<b style="color:${NAVY};">${ctx.coverage.covered} of ${ctx.coverage.served} served ships have a PS on board${ctx.coverage.none.length ? ". " + ctx.coverage.none.map(n => esc(n.ship)).join(", ") + (ctx.coverage.none.length === 1 ? " has none" : " have none") : ""}.</b>${ctx.coverage.doubled.length ? " " + ctx.coverage.doubled.map(esc).join(" and ") + (ctx.coverage.doubled.length === 1 ? " carries" : " carry") + " two." : ""} Of the ${ready.length} "ready", ${readyReturning} ${readyReturning === 1 ? "is" : "are"} returning crew, ${readyNew} new.`));
  }

  // ---- coverage bars (scale: max of demand, ready, behind, bench)
  const maxBar = Math.max(demand || 0, c.ready, behind, bench.length, 1);
  const w = n => Math.round((n / maxBar) * 100 * 0.62); // leave air on the right
  const okReady = c.ready - readyBlocked;
  const barsHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
  ${demand !== null ? bar([{ w: w(demand), bg: NAVY }], "Demand", `${demand} <span style="font-family:${FONT};font-size:12px;font-weight:400;color:${SLATE};">sign-offs</span>`) : ""}
  ${bar([{ w: w(okReady), bg: GREEN }, { w: w(readyBlocked), bg: RED }], "Ready now", `${c.ready} <span style="font-family:${FONT};font-size:12px;font-weight:400;color:${readyBlocked ? RED : SLATE};">${readyBlocked ? readyBlocked + " docs ✗" : "docs ✓"}</span>`)}
  ${hasCtx ? bar([{ w: w(bench.length), bg: GREEN_MID }], "Bench", `${bench.length} <span style="font-family:${FONT};font-size:12px;font-weight:400;color:${AMBER};">return not confirmed</span>`) : ""}
  ${bar([{ w: w(c.inMedicals), bg: GREEN_MID }, { w: w(c.inVisa), bg: GREEN_PALE }, { w: w(c.approved), bg: BORDER }], "Behind them", `${behind} <span style="font-family:${FONT};font-size:12px;font-weight:400;color:${SLATE};">${c.inMedicals} med · ${c.inVisa} visa · ${c.approved} approved</span>`)}
  </table>`;
  const growth = GROWTH_DEMAND.joiners === null ? "Growth demand (NCL Getaway, Xcel, newbuild, dry-dock cover) is <b>not set</b> — it belongs on a second line."
    : `Growth demand: <b style="color:${NAVY};">${GROWTH_DEMAND.joiners}</b>${GROWTH_DEMAND.note ? " — " + esc(GROWTH_DEMAND.note) : ""}.`;
  const coverageNote = hasCtx
    ? `Demand is relief only — projected sign-offs from the console${ctx.provenance.contractMaxSignOn ? "; contract data there ends " + fmtDate(ctx.provenance.contractMaxSignOn) + " " + ctx.provenance.contractMaxSignOn.slice(0, 4) + ", so " + demand + " is a floor" : ""}. ${growth}${bench.length ? " Bench = on vacation, not earmarked, no active contract, not in the ready list: " + bench.map(b => esc(b.name.split(",")[0])).join(", ") + " — nobody has recorded whether they are returning." : ""}`
    : `Console unavailable when this was sent — demand shown is the form's own sign-off count (${clean.signoffOutlook || 0}). ${growth}`;

  // ---- names card
  const readyHtml = ready.length ? ready.map(r => {
    const bad = r.expired.length;
    const label = `${bad ? `<span style="color:${RED};font-weight:700;">${esc(r.name)}</span>` : esc(r.name)} ${grey(esc(r.fleet) + (hasCtx ? " · " + r.kind : ""))}${bad ? ` <span style="color:${RED};">· ${esc(r.expired.map(e => e.doc.replace("Certificate (SCH)", "SCH")).join(", "))} expired</span>` : ""}`;
    return label;
  }).join("<br>") : grey("none listed");
  const soHtml = signoffs60 && signoffs60.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:13px;color:${BODY};line-height:1.75;">
    ${signoffs60.map(r => `<tr><td>${esc(r.name.split(",")[0])} ${grey(esc(r.ship || ""))}</td><td align="right" style="font-family:${MONO};font-size:12px;color:${SLATE};">${fmtDate(r.date)}</td></tr>`).join("")}
    ${ctx.signoffs90.length ? `<tr><td style="padding-top:6px;color:${LIGHT};">Days 61–90: ${ctx.signoffs90.map(r => esc(r.name.split(",")[0]) + " " + grey(esc(r.ship || ""))).join(" · ")}</td><td align="right" style="padding-top:6px;font-family:${MONO};font-size:12px;color:${LIGHT};">${ctx.signoffs90.map(r => fmtDate(r.date)).join(" · ")}</td></tr>` : ""}
   </table>` : grey(hasCtx ? "none in the next 60 days" : "console unavailable");
  const namesHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CLOUD}" style="background:${CLOUD};border-radius:16px;"><tr>
  <td width="50%" valign="top" style="padding:18px 12px 18px 20px;">
   <div style="font-size:11px;font-weight:700;letter-spacing:1.2px;color:${GREEN_INK};text-transform:uppercase;">Ready to deploy</div>
   <div style="font-size:13px;color:${BODY};line-height:1.75;margin-top:6px;">${readyHtml}</div>
  </td>
  <td width="50%" valign="top" style="padding:18px 20px 18px 12px;border-left:1px solid ${BORDER};">
   <div style="font-size:11px;font-weight:700;letter-spacing:1.2px;color:${GREEN_INK};text-transform:uppercase;">Signing off</div>
   <div style="margin-top:6px;">${soHtml}</div>
  </td></tr></table>`;

  // ---- funnel tiles + trend
  const sourced = clean.channels.tcms + clean.channels.referrals + clean.channels.walkins;
  const rateTrail = digest.rates.slice(1).map(r => `${r.month.split(" ")[0].slice(0, 3)} ${r.rate === null ? "—" : r.rate + "%"}`).join(" · ");
  const tile = (color, n, label, sub) => `<td width="25%" valign="top" style="padding:0 6px;">
   <div style="height:3px;background:${color};font-size:0;">&nbsp;</div>
   ${bigNum(n)}<div style="font-size:12px;color:${SLATE};margin-top:4px;">${label}</div>
   <div style="font-size:11px;color:${LIGHT};margin-top:2px;">${sub}</div></td>`;
  const tilesHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;"><tr>
   ${tile(NAVY, sourced, "Sourced", `${clean.channels.tcms} TCMS · ${clean.channels.referrals} referral${clean.channels.walkins ? " · " + clean.channels.walkins + " walk-in" : ""}`)}
   ${tile(thin ? RED : GREEN_INK, c.interviewed, "Interviewed", sourced ? `<span style="color:${thin ? RED : SLATE};font-weight:700;">${pct(c.interviewed, sourced)}% of sourced</span>` : "")}
   ${tile(GREEN, c.approved, "Approved", `${digest.rates[0].rate === null ? "—" : digest.rates[0].rate + "%"} of interviewed${rateTrail ? " · " + rateTrail : ""}`)}
   ${tile(LIGHT, c.inProcess, "Still in process", `Big Five avg ${c.big5Avg ?? "—"} · SOP v1.1 gate 440`)}
  </tr></table>`;
  const tr = digest.trend.filter(t => t.interviewed !== null);
  const tmax = Math.max(1, ...tr.map(t => t.interviewed));
  const trendHtml = tr.length > 1 ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;"><tr>
  <td width="120" valign="bottom" style="font-size:12px;color:${SLATE};padding-right:12px;line-height:1.5;">Interviews<br>per month</td>
  <td valign="bottom" style="padding:0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
   ${tr.map(t => {
    const h = Math.max(4, Math.round((t.interviewed / tmax) * 44));
    const col = peak !== null && t.interviewed < peak / 2 ? RED : "#C9D2DE";
    return `<td width="${Math.floor(100 / tr.length)}%" valign="bottom" align="center" style="padding:0 4px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="${h}" bgcolor="${col}" style="background:${col};height:${h}px;border-radius:3px 3px 0 0;font-size:0;">&nbsp;</td></tr></table><div style="font-size:11px;color:${SLATE};margin-top:4px;">${esc(t.month.split(" ")[0].slice(0, 3))} <b style="color:${NAVY};">${t.interviewed}</b></div></td>`;
  }).join("")}
  </tr></table></td></tr></table>` : "";
  const funnelNote = [
    c.rejected ? `Rejected ${c.rejected}${clean.rejectionReasons ? " — " + esc(clean.rejectionReasons) : ""}.` : "",
    `Candidate feedback (+/−): ${clean.feedback.positive || clean.feedback.pain ? esc([clean.feedback.positive, clean.feedback.pain].filter(Boolean).join(" / ")) : "none reported"}.`,
    clean.observations ? `Observations — ${esc(clean.submittedBy)}: ${esc(clean.observations)}` : "Observations: none.",
    clean.forecast.roles ? `Sourcing now: <b style="color:${NAVY};">${esc(clean.forecast.roles)}</b>.` : "",
  ].filter(Boolean).join(" ");

  // ---- by fleet + headcount
  const TH = `padding:6px 5px;border-bottom:2px solid ${NAVY};font-size:10px;font-weight:700;color:${SLATE};letter-spacing:.8px;`;
  const TDn = `padding:6px 5px;border-bottom:1px solid ${BORDER};font-family:${MONO};font-size:12px;`;
  const TDl = `padding:6px 5px 6px 0;border-bottom:1px solid ${BORDER};font-size:12px;color:${BODY};`;
  const fleetRow = (label, row, last) => {
    const bb = last ? "border-bottom:0;" : "";
    const cells = FLEETS.map(f => { const n = (row && Number(row[f])) || 0; return `<td align="right" style="${TDn}${bb}color:${n ? NAVY : LIGHT};">${n || "—"}</td>`; }).join("");
    const tot = FLEETS.reduce((a, f) => a + ((row && Number(row[f])) || 0), 0);
    return `<tr><td style="${TDl}${bb}">${label}</td>${cells}<td align="right" style="${TDn}${bb}font-weight:700;color:${NAVY};padding-right:0;">${tot}</td></tr>`;
  };
  const soByFleet = {}; for (const f of FLEETS) soByFleet[f] = 0;
  if (signoffs60) for (const r of signoffs60) if (soByFleet[r.fleet] !== undefined) soByFleet[r.fleet] += 1;
  const fleetHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:10px;">
   <tr><td style="${TH}padding-left:0;">STAGE</td>${FLEETS.map(f => `<td align="right" style="${TH}">${f}</td>`).join("")}<td align="right" style="${TH}padding-right:0;">TOTAL</td></tr>
   ${fleetRow("Approved, no docs yet", clean.fleet.approved)}${fleetRow("In visa", clean.fleet.visa)}${fleetRow("In medicals", clean.fleet.medicals)}${fleetRow("Ready to deploy", clean.fleet.ready)}${fleetRow("Signed on in " + esc(monthShort), clean.fleet.joined, !hasCtx)}${hasCtx ? fleetRow("Sign-offs next 60 days", soByFleet, true) : ""}
  </table>`;
  const headHtml = hasCtx ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;"><tr>
   <td width="25%" valign="top" style="padding-right:8px;">${bigNum(ctx.headcount.onBoard).replace("28px", "24px")}${small("on board")}</td>
   <td width="25%" valign="top" style="padding-right:8px;">${bigNum(ctx.headcount.earmarked).replace("28px", "24px")}${small("earmarked for a ship")}</td>
   <td width="25%" valign="top" style="padding-right:8px;">${bigNum(ctx.headcount.vacation).replace("28px", "24px")}${small("on vacation")}</td>
   <td width="25%" valign="top">${bigNum(ctx.headcount.inactive, LIGHT).replace("28px", "24px")}${small("inactive, excluded")}</td>
  </tr></table>` : "";
  const covNote = hasCtx ? `<b style="color:${NAVY};">Ship coverage: ${ctx.coverage.covered} of ${ctx.coverage.served}.</b>` +
    ctx.coverage.none.map(n => ` ${esc(n.ship)} — nobody on board${n.earmarked.length ? ", " + n.earmarked.map(x => esc(x.split(",")[0])).join(" and ") + " earmarked" : ""}.`).join("") +
    (ctx.coverage.doubled.length ? ` ${ctx.coverage.doubled.map(esc).join(" and ")} — two on board${ctx.coverage.doubled.length === 1 ? "" : " each"}.` : "") +
    " NCL stays empty until the Getaway pilot staffs."
    : "Console unavailable — headcount and ship coverage not shown this month.";

  // ---- action list
  const actions = [];
  const decisionsTxt = clean.decisions && !/^none$/i.test(clean.decisions.trim()) ? esc(clean.decisions) : "";
  if (decisionsTxt) actions.push([RED, "Decision needed from Miguel", decisionsTxt, "Miguel · decide", RED_TINT, RED]);
  // Standing decision while the applicant funnel is closed: it is the reason every
  // count above is hand-typed and no Big Five score reaches this report. It stays
  // on the list until SANDBOX is switched off — not something the form can hide.
  if (!funnelOpen) actions.push([RED, "Open apply.cims.work", "The DG3 applicant site is closed (sandbox). Until it opens, every count is hand-typed, no Big Five score reaches this report, and stage aging cannot be measured.", "Miguel · decide", RED_TINT, RED]);
  if (hasCtx && (ctx.expired.sailing.length || ctx.expired.next.length)) {
    const fmtEx = e => `${esc(e.name.split(",")[0])} ${grey(esc(e.ship || e.status) + " · " + esc(e.doc.replace("Certificate (SCH)", "SCH")) + " " + fmtMonthYear(e.date))}`;
    const names = new Set([...ctx.expired.sailing, ...ctx.expired.next].map(e => e.name)).size;
    actions.push([RED, `Expired documents on ${names} crew`,
      (ctx.expired.sailing.length ? `<b style="color:${NAVY};">Sailing:</b> ${ctx.expired.sailing.map(fmtEx).join(" · ")}.<br>` : "") +
      (ctx.expired.next.length ? `<b style="color:${NAVY};">Due to fly next:</b> ${ctx.expired.next.map(fmtEx).join(" · ")}.<br>` : "") +
      "Renewed and unrecorded, or expired for real — TDG to confirm each. Anyone earmarked will be stopped at the gate if it is the latter.",
      "Joyce · confirm", RED_TINT, RED]);
  }
  for (const r of ready.filter(x => x.expired.length)) {
    actions.push([AMBER, `${esc(r.name)} — ready, but ${esc(r.expired.map(e => e.doc.replace("Certificate (SCH)", "SCH") + " expired " + fmtDate(e.date)).join(", "))}`,
      (r.crew && r.crew.agencyId && !/^SC-/.test(r.crew.agencyId) ? "Non-standard agency ID; documents do not auto-merge. " : "") + "Confirm the renewal is on file before any flight is requested.",
      "Joy · verify", AMBER_TINT, AMBER]);
  }
  for (const vm of clean.visaMedical) {
    // Conflict check: a manual renewal row whose console date is more than 90 days out.
    let conflict = "";
    if (hasCtx) {
      const docs = ctx.docsByName.get(normName(vm.name)) || [];
      const want = /medical/i.test(vm.type) ? "Medical" : /us visa/i.test(vm.type) ? "US Visa" : null;
      const d = want ? docs.find(x => x.doc === want) : null;
      if (d && d.date > shiftIso(today, 90)) conflict = ` Console shows the ${want.toLowerCase()} valid to ${fmtMonthYear(d.date)} — one of the two is wrong.`;
    }
    actions.push([AMBER, `${esc(vm.name)} (${esc(vm.fleet)}) — ${esc(vm.type)}`, `${esc(vm.note) || "No date given — ask for one."}${conflict}`, "Yanna · date", AMBER_TINT, AMBER]);
  }
  for (const f of clean.people.flags) {
    actions.push([AMBER, `${esc(f.name)} (${esc(f.fleet)}) — flagged by recruitment`,
      f.reason ? esc(f.reason) : "Flag raised with no reason recorded — a flag without a reason cannot be acted on or closed.",
      f.reason ? "Rita · review" : "Yanna · reason", AMBER_TINT, AMBER]);
  }
  if (hasCtx && ctx.renewals30.length) {
    actions.push([LIGHT, "Renewals due within 30 days",
      ctx.renewals30.map(r => `${esc(r.name.split(",")[0])} ${esc(r.doc.replace("Certificate (SCH)", "SCH"))} ${grey(fmtDate(r.date))}`).join(" · ") + ".",
      "Joy · track", CLOUD, SLATE]);
  }
  if (bench.length) {
    actions.push([RED, `${bench.length === 1 ? "One" : bench.length} on vacation — returning or not?`,
      bench.map(b => `${esc(b.name.split(",")[0])} ${grey(esc(b.ship || ""))}`).join(" · ") + ". Each one confirmed back is one fewer hire to make; each one not returning is attrition nobody has reported. Record the answer in the console.",
      "Joy · confirm", RED_TINT, RED]);
  }
  for (const j of joinedConflicts) {
    actions.push([AMBER, `${esc(j.name)} — reported joined ${esc(j.date || "")}`, `Console still shows ${esc(j.name.split(",")[0])} as earmarked${j.crew.ship ? " for " + esc(j.crew.ship) : ""}, not on board. One of the two is wrong.`, "Joy · verify", AMBER_TINT, AMBER]);
  }
  const actionsHtml = actions.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">${actions.map((a, i) => actionRow(i + 1, a[0], a[1], a[2], a[3], a[4], a[5], i === actions.length - 1)).join("")}</table>`
    : note("Nothing needs a call or an owner this month.");

  // ---- not yet measured
  const nym = [
    ["Stage aging", "Days in approved / visa / medicals per candidate. A candidate 60 days in medicals is a decision; a count is not. Needs the Candidates table dates — fills only when apply.cims.work opens.", "gated", CLOUD, SLATE],
    ["Retention of Big Five hires", "First-contract completion by hire cohort — the only number that can show the SOP v1.1 gate works. Needs the contract register kept current and a hire-cohort tag per crew.", "Joy · register", AMBER_TINT, AMBER],
    ["Cost per hire", "Joining flight + medical + visa + agency fee, per first contract. Flights already sit in the travel console; medical and visa in TDG's invoices.", "Joy · invoices", AMBER_TINT, AMBER],
    ...(GROWTH_DEMAND.joiners === null ? [["Growth demand", "NCL Getaway staffing, Xcel, newbuild, dry-dock cover — set once in config, carried every month alongside relief demand.", "Miguel · set", RED_TINT, RED]] : []),
    ["Approval rate by source · interviewer throughput", "TCMS vs referral conversion, and days from endorsement to Ray/Rolando decision. Both come free from the Candidates table once the funnel is live.", "gated", CLOUD, SLATE],
  ];
  const nymHtml = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">${nym.map(([t, b, o, bg, fg], i) => {
    const bb = i === nym.length - 1 ? "" : `border-bottom:1px solid ${BORDER};`;
    return `<tr><td valign="top" style="padding:12px 0;${bb}"><div style="font-family:${FONT_H};font-size:15px;font-weight:600;color:${NAVY};">${t} &nbsp;${pill(o, bg, fg)}</div><div style="font-size:12.5px;color:${BODY};line-height:1.5;margin-top:4px;">${b}</div></td></tr>`;
  }).join("")}</table>`;

  // ---- joined + forecast vs actual
  const joinedHtml = `<td width="50%" valign="top" style="padding-right:12px;">
   ${sec("Joined in " + esc(monthShort))}
   <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;"><tr>
    <td valign="top" style="padding-right:18px;">${bigNum(hasCtx ? firstContracts.length : joined.length)}${small(hasCtx ? "first contracts" : "sign-ons")}</td>
    ${hasCtx ? `<td valign="top">${bigNum(rotation.length, LIGHT)}${small("rotation sign-ons")}</td>` : ""}
   </tr></table>
   ${note((hasCtx
     ? (firstContracts.length ? `<b style="color:${NAVY};">First contracts:</b> ${firstContracts.map(j => esc(j.name.split(",")[0]) + " (" + esc(j.fleet) + ")" + (j.date ? " " + esc(j.date) : "")).join(" · ")}.<br>` : "")
       + (rotation.length ? `<b style="color:${NAVY};">Rotation:</b> ${rotation.map(j => esc(j.name.split(",")[0]) + (j.date ? " " + esc(j.date) : "")).join(" · ")}. Rotation is crew admin, not recruitment output.` : "")
     : joined.map(j => esc(j.name) + " (" + esc(j.fleet) + ")" + (j.date ? " " + esc(j.date) : "")).join(" · ")) || "None.")}
  </td>`;
  const hist = digest.history;
  const fvaHtml = `<td width="50%" valign="top" style="padding-left:16px;border-left:1px solid ${BORDER};">
   ${sec("Forecast vs actual")}
   <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;font-size:12px;color:${BODY};">
    <tr><td style="padding:3px 0;color:${SLATE};">&nbsp;</td><td align="right" style="padding:3px 0;color:${SLATE};">typed</td><td align="right" style="padding:3px 0;color:${SLATE};">console</td><td align="right" style="padding:3px 0;color:${SLATE};">joined</td></tr>
    ${hist.map((h, i) => { const cur = i === hist.length - 1; const st = `padding:3px 0;${i === 0 ? "border-top:1px solid " + BORDER + ";" : ""}${cur ? "font-weight:700;color:" + NAVY + ";" : ""}`; const num = v => v === null || v === undefined ? `<span style="color:${LIGHT};">—</span>` : `<span style="font-family:${MONO};">${v}</span>`;
      return `<tr><td style="${st}">${esc(h.month.split(" ")[0].slice(0, 3))}</td><td align="right" style="${st}">${num(h.forecast)}</td><td align="right" style="${st}">${num(h.signoffOutlook)}</td><td align="right" style="${st}">${num(h.joinedTotal)}</td></tr>`; }).join("")}
   </table>
   ${note("The typed forecast is optional from November; demand comes from the console.")}
  </td>`;

  // ---- footer
  const prov = `Sent ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC on form submission${revised ? " · revised" : ""} · Part 1 ${esc(clean.submittedBy)}, Part 2 Crew Admin. Funnel and sourcing as reported by TDGCM Recruitment. ` +
    (hasCtx ? `Ready list, sign-offs and document dates from the CIMS Console — crew register ${ctx.provenance.crewUpdated ? fmtDate(ctx.provenance.crewUpdated) + " " + ctx.provenance.crewUpdated.slice(0, 4) : "date unknown"}, contract register ${ctx.provenance.contractMaxSignOn ? fmtDate(ctx.provenance.contractMaxSignOn) + " " + ctx.provenance.contractMaxSignOn.slice(0, 4) : "date unknown"}. New/returning split by name match against the register.` : "Console unavailable at send time — console sections omitted.") +
    " CIMS — a division of DG3 · Confidential.";

  const preheader = [h1, h2].filter(Boolean).join(" ") + ` ${c.ready} ready, ${demand === null ? "demand n/a" : demand + " sign-offs"}, ${c.interviewed} interviews.`;

  const inner = `
  <div style="display:none;font-size:1px;color:#EEF1F4;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td style="padding:22px 28px 0;">${secRow("Recruitment · " + esc(clean.month) + (revised ? " · revised" : ""), pill(v, vStyle[0], vStyle[1]))}</td></tr>
  <tr><td style="padding:12px 28px 0;"><div style="font-family:${FONT_H};font-size:36px;font-weight:600;letter-spacing:-0.6px;color:${NAVY};line-height:1.1;">${esc(h1)}${h2 ? `<br><span style="color:${LIGHT};">${esc(h2)}</span>` : ""}</div></td></tr>
  <tr><td style="padding:14px 28px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:14px;color:${BODY};line-height:1.55;">${lines.join("")}</table></td></tr>
  ${warnings && warnings.length ? `<tr><td style="padding:14px 28px 0;">${amberBox(warnings.map(esc).join("<br>"))}</td></tr>` : ""}
  ${block(secRow("Coverage · next 60 days", "supply vs demand") + barsHtml + note(coverageNote))}
  <tr><td style="padding:16px 28px 0;">${namesHtml}</td></tr>
  ${block(secRow("Funnel · " + esc(monthShort), "as reported by TDGCM Recruitment") + tilesHtml + trendHtml + note(funnelNote))}
  ${block(secRow("By fleet", hasCtx ? "form + console" : "from the form") + fleetHtml + headHtml + note(covNote))}
  ${block(sec("Needs a call or an owner") + actionsHtml)}
  ${block(secRow("Not yet measured", "stays on the report until the data exists") + nymHtml)}
  ${block(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${joinedHtml}${fvaHtml}</tr></table>`)}
  ${block(`<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right:10px;">${btnNavy(consoleUrl, "Open the pipeline")}</td><td><a href="${consoleUrl}" style="display:inline-block;background:#FFFFFF;color:${NAVY};text-decoration:none;font-size:12.5px;font-weight:600;letter-spacing:.4px;padding:10px 19px;border-radius:8px;border:1px solid ${BORDER};">Past months</a></td></tr></table>`)}
  <tr><td style="padding:22px 28px 26px;"><div style="font-size:12px;color:${SLATE};line-height:1.6;border-top:1px solid ${BORDER};padding-top:14px;">${prov}</div></td></tr>
  </table>`;

  return shell(inner, `Sent automatically on ${esc(clean.submittedBy)}'s form submission · A resubmission for the same month is marked REVISED · CIMS — A division of DG3 · Confidential`);
}

function shiftIso(iso, days) {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
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
    ${finePrint("Please submit within 3 days — a reminder follows on Thursday, and again a week later if the month is still open. Made a mistake after submitting? Submit the same month again — the new email goes out marked REVISED.")}
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
    ${finePrint("One more reminder follows in a week if the month is still open.")}
  </div>`;
  return shell(inner, "Sent once, 3 days after the invitation if no submission received · CIMS — A division of DG3");
}

/** Day-10 reminder. draft = { part1: bool, part2: bool } from the saved draft, or null. */
export function renderReminder2(monthName, formUrl, draft) {
  const state = draft ? (draft.part1 || draft.part2
      ? `Draft saved so far: <b style="color:${NAVY};">Part 1 ${draft.part1 ? "started" : "empty"}, Part 2 ${draft.part2 ? "started" : "empty"}</b>.`
      : `No draft has been started.`) : "";
  const inner = `
  <div style="padding:22px 24px 24px;">
    ${eyebrow("MONTHLY RECRUITMENT UPDATE")}
    ${headline(esc(monthName.split(" ")[0]) + " is 10 days overdue.")}
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;"><tr>
      <td width="4" bgcolor="${RED}" style="background:${RED};font-size:0;">&nbsp;</td>
      <td bgcolor="#F4E5E3" style="background:#F4E5E3;padding:11px 14px;font-size:13px;color:${NAVY};line-height:1.6;">The <b>${esc(monthName)}</b> update was due on the first Monday and has not been submitted. The team has no numbers for the month.</td></tr></table>
    ${para(`${state} Finish and submit today — if something is blocking the numbers, reply to this email and say what.`)}
    <div style="margin-top:16px;">${btnGreen(formUrl, "Open the " + esc(monthName.split(" ")[0]) + " form")}</div>
    ${finePrint("No further automated reminders. The month stays open on the form until it is submitted.")}
  </div>`;
  return shell(inner, "Sent once, 10 days after the invitation if no submission received · CIMS — A division of DG3");
}
