// Applicant-funnel emails — rendered on the SAME canonical shell as the monthly
// digest (src/emails.js): 60/40 navy-green brand strip, CIMS | DG3 header,
// 640px, identical type scale, buttons and footer pattern. One design system.
// SOP v1.1: verdict emails never share scores; the rejection email states the
// 12-month re-application window (Miguel, 2026-07-23).

import { shell, esc, NAVY, GREEN, SLATE, LIGHT, CLOUD } from "./emails.js";

const CTX_APPLICANT = "Shipboard Recruitment";
const CTX_TEAM = "Recruitment Funnel";
const FOOT_APPLICANT = "You are receiving this because you applied for a shipboard position with DG3 CIMS · Replies reach the TDG recruitment team · CIMS — A division of DG3";
const FOOT_TEAM = "Sent automatically by the recruitment funnel · CIMS — A division of DG3 · Confidential";

const first = n => {
  const s = String(n || "").trim();
  return s.includes(",") ? s.split(",")[1].trim() : s.split(" ")[0];
};

const title = t => `<div style="font-size:19px;font-weight:700;color:${NAVY};">${t}</div>`;
const para = t => `<p style="font-size:13px;color:#374151;line-height:1.65;margin:10px 0 0;">${t}</p>`;
const small = t => `<p style="font-size:11px;color:${LIGHT};margin:12px 0 0;line-height:1.6;">${t}</p>`;
const btnGreen = (href, label) => `<div style="margin-top:18px;"><a href="${href}" style="display:inline-block;background:${GREEN};color:#fff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.5px;padding:12px 24px;border-radius:8px;">${label}</a></div>`;
const btnNavy = (href, label) => `<div style="margin-top:10px;"><a href="${href}" style="display:inline-block;background:${NAVY};color:#fff;text-decoration:none;font-size:12px;font-weight:600;letter-spacing:.5px;padding:11px 20px;border-radius:8px;">${label}</a></div>`;
const amber = t => `<div style="border-left:3px solid #fab219;background:#FDF8EC;border-radius:0 8px 8px 0;padding:11px 14px;margin-top:12px;"><p style="font-size:13px;color:${NAVY};margin:0;">${t}</p></div>`;

const stepsBox = `<div style="background:${CLOUD};border-radius:8px;padding:14px 16px;margin-top:14px;font-size:12.5px;color:#374151;line-height:1.8;">
  <span style="color:${GREEN};font-weight:700;">1</span>&nbsp; <b style="color:${NAVY};">Take the test</b> — the green button below, about 10 minutes, no right or wrong answers<br>
  <span style="color:${GREEN};font-weight:700;">2</span>&nbsp; <b style="color:${NAVY};">Copy your Result ID</b> — the long code shown at the end next to &quot;Save the following ID&quot;<br>
  <span style="color:${GREEN};font-weight:700;">3</span>&nbsp; <b style="color:${NAVY};">Submit it</b> — on our verification page, with the email address you applied with
</div>`;

export function renderTestInvite(name, testUrl, verifyUrl) {
  const inner = `<div style="padding:24px;">
    ${title("One step left: the assessment")}
    ${para(`Dear ${esc(first(name))}, thank you for applying to the DG3 Cruise Industry Managed Services program. Your application is registered — the next step is a short personality assessment.`)}
    ${stepsBox}
    ${btnGreen(testUrl, "Open the Big Five test")}
    ${btnNavy(verifyUrl, "Then submit my Result ID here")}
    ${small("Please complete the assessment within 7 days. Your email address is your applicant ID — use the same one everywhere.")}
  </div>`;
  return shell(inner, FOOT_APPLICANT, CTX_APPLICANT);
}

export function renderTestReminder(name, testUrl, verifyUrl) {
  const inner = `<div style="padding:24px;">
    ${title("Quick reminder")}
    ${amber(`Dear ${esc(first(name))}, your application is on hold until the assessment is completed — it takes about 10 minutes.`)}
    ${para("Take the test, copy the Result ID shown at the end, and submit it on our verification page with the email you applied with.")}
    ${btnGreen(testUrl, "Open the Big Five test")}
    ${btnNavy(verifyUrl, "Then submit my Result ID here")}
    ${small("If the assessment is not completed within 30 days of applying, the application closes automatically.")}
  </div>`;
  return shell(inner, FOOT_APPLICANT, CTX_APPLICANT);
}

export function renderPass(name) {
  const inner = `<div style="padding:24px;">
    ${title("Congratulations — you are moving to the next stage")}
    ${para(`Dear ${esc(first(name))},`)}
    ${para("<b style=\"color:" + NAVY + ";\">Congratulations!</b> You have successfully completed the assessment stage of the DG3 CIMS recruitment process.")}
    ${para("Our recruitment team will contact you shortly to arrange your interview. No action is needed from you right now — keep an eye on this inbox and your phone.")}
    ${para("We look forward to speaking with you.")}
  </div>`;
  return shell(inner, FOOT_APPLICANT, CTX_APPLICANT);
}

export function renderFail(name) {
  const inner = `<div style="padding:24px;">
    ${title("Thank you for your application")}
    ${para(`Dear ${esc(first(name))},`)}
    ${para("Thank you for taking the time to apply and complete the assessment for the DG3 Cruise Industry Managed Services program.")}
    ${para("After careful review, we will not be moving forward with your application at this time.")}
    ${para(`You are welcome to apply again after <b style="color:${NAVY};">12 months</b> — many strong candidates succeed on a later application as their experience grows.`)}
    ${para("We wish you every success in your career.")}
  </div>`;
  return shell(inner, FOOT_APPLICANT, CTX_APPLICANT);
}

const factRow = (label, value) => `<tr>
  <td style="padding:5px 12px 5px 0;font-size:9px;font-weight:700;color:${GREEN};letter-spacing:2px;text-transform:uppercase;white-space:nowrap;">${label}</td>
  <td style="padding:5px 0;font-size:12.5px;color:#374151;">${value}</td></tr>`;

export function renderAdminPassNotify(c, dashboardUrl) {
  const inner = `<div style="padding:24px;">
    ${title("Candidate passed screening")}
    ${para(`<b style="color:${NAVY};">${esc(c.name)}</b> cleared the Big Five gate${c.priority ? ` — <b style="color:${GREEN};">PRIORITY (480+)</b>, flag for leadership track` : ""}.`)}
    <div style="background:${CLOUD};border-radius:8px;padding:12px 16px;margin-top:14px;">
    <table cellpadding="0" cellspacing="0">
      ${factRow("Fit Score", `<b style="color:${NAVY};font-size:15px;">${esc(String(c.fit))}</b>`)}
      ${factRow("Position", esc(c.position || "—"))}
      ${factRow("Source", esc(c.source || "—"))}
      ${factRow("Experience", (c.shipboard ? "Shipboard" : "First-time") + (c.printer ? " · Printer" : ""))}
      ${factRow("Email", esc(c.email || ""))}
      ${factRow("Phone", esc(c.phone || ""))}
    </table></div>
    ${para("Next step: schedule the first interview. The full profile, resume and evaluation brief are on the candidate record.")}
    ${dashboardUrl ? btnNavy(dashboardUrl, "Open the candidate profile") : ""}
  </div>`;
  return shell(inner, FOOT_TEAM, CTX_TEAM);
}

export function renderParseFailAlert(name, email, resultId) {
  const inner = `<div style="padding:24px;">
    ${title("Manual review needed — result could not be read")}
    ${amber(`Candidate <b>${esc(name)}</b> (${esc(email)}) submitted result ID <span style="font-family:monospace;">${esc(resultId)}</span>, but the scores could not be parsed automatically. The test provider may have changed its page format.`)}
    ${para("Please open the result, read the five scores manually, and record the outcome on the candidate record. If the page itself looks changed, flag it — the automatic reader needs an update.")}
    ${btnNavy("https://bigfive-test.com/result/" + encodeURIComponent(resultId), "Open the result")}
  </div>`;
  return shell(inner, FOOT_TEAM, CTX_TEAM);
}

// --- Phase 2b: endorsement & final-interview emails (unified shell) ----------

const btnRed = (href, label) => `<a href="${href}" style="display:inline-block;background:#C2402F;color:#fff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.5px;padding:12px 22px;border-radius:8px;">${label}</a>`;
const btnGreenInline = (href, label) => `<a href="${href}" style="display:inline-block;background:${GREEN};color:#fff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.5px;padding:12px 22px;border-radius:8px;">${label}</a>`;

function profileTable(c) {
  return `<div style="background:${CLOUD};border-radius:8px;padding:12px 16px;margin-top:14px;">
  <table cellpadding="0" cellspacing="0">
    ${factRow("Fit Score", `<b style="color:${NAVY};font-size:15px;">${esc(String(c.fit))}</b> ${c.priority ? `<span style="color:${GREEN};font-weight:700;font-size:11px;">PRIORITY</span>` : ""}`)}
    ${factRow("Position", esc(c.position || "—"))}
    ${factRow("Source", esc(c.source || "—") + (c.referrer ? " (" + esc(c.referrer) + ")" : ""))}
    ${factRow("Experience", (c.shipboard ? "Shipboard" : "First-time") + (c.printer ? " · Printer" : ""))}
    ${c.resumeUrl ? factRow("Resume", `<a href="${c.resumeUrl}" style="color:#1E6FD0;">Open resume</a>`) : ""}
  </table></div>`;
}

/** To Ray & Rolando — one candidate, Approve/Decline authorizes ARRANGING the final. */
export function renderEndorsement(c, approveUrl, declineUrl, slotText) {
  const inner = `<div style="padding:24px;">
    ${title("New candidate for final interview — " + esc(c.name))}
    ${para(`<b style="color:${NAVY};">${esc(c.interviewer || "The recruitment team")}</b> has interviewed this candidate and recommends advancing to the final interview.`)}
    ${profileTable(c)}
    ${c.recommendation ? `<div style="margin-top:12px;">${secLabelLike("Recommendation")}<div style="font-size:12.5px;color:#374151;line-height:1.6;">${esc(c.recommendation)}</div></div>` : ""}
    ${c.aiBrief ? `<div style="margin-top:12px;">${secLabelLike("Assessment brief")}<div style="font-size:12px;color:#4b5563;line-height:1.6;">${esc(c.aiBrief)}</div></div>` : ""}
    ${para(`If you approve, I will arrange the final interview for <b style="color:${NAVY};">${esc(slotText)}</b> and coordinate the video call with the applicant.`)}
    <table cellpadding="0" cellspacing="0" style="margin-top:16px;"><tr>
      <td style="padding-right:10px;">${btnGreenInline(approveUrl, "Approve — arrange the interview")}</td>
      <td>${btnRed(declineUrl, "Decline")}</td>
    </tr></table>
    ${small("Either of you can approve — the first response is recorded. The hiring decision remains yours in the live interview; this only authorizes scheduling it.")}
  </div>`;
  return shell(inner, FOOT_TEAM, CTX_TEAM);
}

function secLabelLike(t) {
  return `<div style="font-size:9px;font-weight:700;color:${GREEN};letter-spacing:2.5px;text-transform:uppercase;margin:0 0 4px;">${t}</div>`;
}

/** To the applicant — the confirmed final-interview slot. */
export function renderFinalInviteApplicant(name, slotText) {
  const inner = `<div style="padding:24px;">
    ${title("Your final interview is scheduled")}
    ${para(`Dear ${esc(first(name))},`)}
    ${para("Congratulations on reaching the final stage of the DG3 CIMS recruitment process. Your final interview with our management team is scheduled for:")}
    <div style="background:${CLOUD};border-radius:8px;padding:14px 16px;margin-top:12px;font-size:15px;font-weight:700;color:${NAVY};text-align:center;">${esc(slotText)}</div>
    ${para("Our recruitment team will contact you with the video-call link and any details you need. Please confirm your availability by replying to this email.")}
    ${para("We look forward to meeting you.")}
  </div>`;
  return shell(inner, FOOT_APPLICANT, CTX_APPLICANT);
}

/** To Yanna/April — authorization received, coordinate the call. */
export function renderFinalCoordination(c, slotText, by) {
  const inner = `<div style="padding:24px;">
    ${title("Approved — final interview to coordinate")}
    ${para(`<b style="color:${NAVY};">${esc(by)}</b> approved <b style="color:${NAVY};">${esc(c.name)}</b> for the final interview. The applicant has been invited for:`)}
    <div style="background:${CLOUD};border-radius:8px;padding:12px 16px;margin-top:12px;font-size:14px;font-weight:700;color:${NAVY};text-align:center;">${esc(slotText)}</div>
    ${para("Please set up the Zoom/Teams call and confirm the applicant received the invitation. Once the interview happens, record the outcome on the candidate record.")}
  </div>`;
  return shell(inner, FOOT_TEAM, CTX_TEAM);
}

/** To Yanna/April — Ray or Rolando declined at endorsement. */
export function renderDeclineNotify(c, by) {
  const inner = `<div style="padding:24px;">
    ${title("Endorsement declined — " + esc(c.name))}
    ${amber(`<b>${esc(by)}</b> declined the endorsement of <b>${esc(c.name)}</b>. No final interview will be scheduled.`)}
    ${para("The candidate remains on record. If you believe this should be revisited, follow up with the management team directly.")}
  </div>`;
  return shell(inner, FOOT_TEAM, CTX_TEAM);
}

/** To Yanna/April — endorsement still unactioned after N days. */
export function renderEndorseNudge(c, days) {
  const inner = `<div style="padding:24px;">
    ${title("Endorsement still awaiting a response")}
    ${amber(`Your endorsement of <b>${esc(c.name)}</b> has been awaiting Ray or Rolando for ${days} days with no response yet.`)}
    ${para("You may want to follow up with the management team directly so the candidate is not left waiting.")}
  </div>`;
  return shell(inner, FOOT_TEAM, CTX_TEAM);
}

/** To the GM (Miguel) — a below-threshold candidate proposed for exception (SOP v1.1 §11). */
export function renderExceptionRequest(c, reason, requestedBy) {
  const inner = `<div style="padding:24px;">
    ${title("GM exception requested — " + esc(c.name))}
    ${para(`<b style="color:${NAVY};">${esc(requestedBy)}</b> is requesting a threshold exception for a candidate who did not pass the SOP v1.1 automated gate.`)}
    ${profileTable(c)}
    <div style="margin-top:12px;">${secLabelLike("Justification")}<div style="font-size:12.5px;color:#374151;line-height:1.6;">${esc(reason)}</div></div>
    ${amber("Per SOP v1.1 §11, only you can approve advancing this candidate. Reply with your written decision — the candidate is held until then.")}
  </div>`;
  return shell(inner, FOOT_TEAM, CTX_TEAM);
}
