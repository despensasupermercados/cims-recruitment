// Applicant-funnel emails — rendered on the SAME canonical shell as the monthly
// digest (src/emails.js): the CIMS Travel Console design language. Boarding-pass
// cards with perforated stubs carry the moments that deserve weight (the test
// ticket, the stage-cleared pass, the candidate pass); the rejection email
// deliberately gets NO ticket — a letter, in the shell, with its dignity intact.
// SOP v1.1: verdict emails never share scores; the rejection email states the
// 12-month re-application window (Miguel, 2026-07-23).

import { shell, esc, NAVY, GREEN, SLATE, LIGHT, CLOUD, BORDER, DEEP, GREEN_INK, RED, BODY,
  FONT, FONT_H, FONT_M, eyebrow, headline, para, finePrint, btnGreen as btnG, btnNavy as btnN,
  amberBox, chip, stepsBox, stubLine } from "./emails.js";

const CTX_APPLICANT = "Shipboard Recruitment";
const CTX_TEAM = "Recruitment Funnel";
const FOOT_APPLICANT = "You are receiving this because you applied for a shipboard position with DG3 CIMS · Replies reach the TDG recruitment team · CIMS — A division of DG3";
const FOOT_TEAM = "Sent automatically by the recruitment funnel · CIMS — A division of DG3 · Confidential";

const first = n => {
  const s = String(n || "").trim();
  return s.includes(",") ? s.split(",")[1].trim() : s.split(" ")[0];
};

const title = t => eyebrow(CTX_APPLICANT.toUpperCase()) + headline(t);
const titleTeam = t => eyebrow(CTX_TEAM.toUpperCase()) + headline(t);
const btnGreen = (href, label) => `<div style="margin-top:18px;">${btnG(href, label)}</div>`;
const btnNavy = (href, label) => `<div style="margin-top:10px;">${btnN(href, label)}</div>`;
const amber = t => amberBox(t);

const STEPS = [
  ["1", "Take the test", "the green button below, about 10 minutes, no right or wrong answers"],
  ["2", "Copy your Result ID", "the long code shown at the end next to &quot;Save the following ID&quot;"],
  ["3", "Submit it", "on our verification page, with the email address you applied with"],
];

export function renderTestInvite(name, testUrl, verifyUrl) {
  const inner = `<div style="padding:22px 24px 24px;">
    ${title("One step left: the assessment")}
    ${para(`Dear ${esc(first(name))}, thank you for applying to the DG3 Cruise Industry Managed Services program. Your application is registered — the next step is a short personality assessment.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;margin-top:14px;">
      <tr><td style="padding:12px 18px 0;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td>${chip("NEXT STEP", NAVY)}</td>
          <td align="right" style="font-size:11px;color:${LIGHT};">about 10 minutes &middot; no right or wrong answers</td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:4px 18px 14px;">${stepsBox(STEPS)}</td></tr>
      ${stubLine()}
      <tr><td style="padding:12px 18px 16px;">${btnG(testUrl, "Open the Big Five test")}<span style="display:inline-block;width:8px;">&nbsp;</span>${btnN(verifyUrl, "Then submit my Result ID")}</td></tr>
    </table>
    ${finePrint("Please complete the assessment within 7 days. Your email address is your applicant ID — use the same one everywhere.")}
  </div>`;
  return shell(inner, FOOT_APPLICANT, CTX_APPLICANT);
}

export function renderTestReminder(name, testUrl, verifyUrl) {
  const inner = `<div style="padding:22px 24px 24px;">
    ${title("Quick reminder")}
    ${amber(`Dear ${esc(first(name))}, your application is on hold until the assessment is completed — it takes about 10 minutes.`)}
    ${para("Take the test, copy the Result ID shown at the end, and submit it on our verification page with the email you applied with.")}
    ${btnGreen(testUrl, "Open the Big Five test")}
    ${btnNavy(verifyUrl, "Then submit my Result ID here")}
    ${finePrint("If the assessment is not completed within 30 days of applying, the application closes automatically.")}
  </div>`;
  return shell(inner, FOOT_APPLICANT, CTX_APPLICANT);
}

export function renderPass(name) {
  const inner = `<div style="padding:22px 24px 24px;">
    ${title("Congratulations — you are moving to the next stage")}
    ${para(`Dear ${esc(first(name))},`)}
    ${para("<b style=\"color:" + NAVY + ";\">Congratulations!</b> You have successfully completed the assessment stage of the DG3 CIMS recruitment process.")}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${NAVY};border-radius:12px;overflow:hidden;margin-top:16px;">
      <tr><td colspan="3" style="background:${GREEN};padding:7px 18px;font-size:9.5px;font-weight:700;letter-spacing:1.6px;color:#ffffff;">STAGE CLEARED &mdash; ASSESSMENT</td></tr>
      <tr>
        <td width="40%" style="padding:16px 18px;">
          <div style="font-size:8px;letter-spacing:1.6px;color:${GREEN};font-weight:700;">COMPLETED</div>
          <div style="font-family:${FONT_H};font-size:17px;font-weight:700;color:#ffffff;margin-top:4px;">Assessment</div>
        </td>
        <td align="center" style="color:rgba(255,255,255,.5);font-size:15px;">&#9992;</td>
        <td width="40%" align="right" style="padding:16px 18px;">
          <div style="font-size:8px;letter-spacing:1.6px;color:${GREEN};font-weight:700;">NEXT</div>
          <div style="font-family:${FONT_H};font-size:17px;font-weight:700;color:#ffffff;margin-top:4px;">Interview</div>
        </td>
      </tr>
    </table>
    ${para("Our recruitment team will contact you shortly to arrange your interview. No action is needed from you right now — keep an eye on this inbox and your phone.")}
    ${para("We look forward to speaking with you.")}
  </div>`;
  return shell(inner, FOOT_APPLICANT, CTX_APPLICANT);
}

export function renderFail(name) {
  const inner = `<div style="padding:22px 24px 24px;">
    ${title("Thank you for your application")}
    ${para(`Dear ${esc(first(name))},`)}
    ${para("Thank you for taking the time to apply and complete the assessment for the DG3 Cruise Industry Managed Services program.")}
    ${para("After careful review, we will not be moving forward with your application at this time.")}
    ${para(`You are welcome to apply again after <b style="color:${NAVY};">12 months</b> — many strong candidates succeed on a later application as their experience grows.`)}
    ${para("We wish you every success in your career.")}
  </div>`;
  return shell(inner, FOOT_APPLICANT, CTX_APPLICANT);
}

/** To the applicant — an interviewer has been assigned; the interview is being arranged. */
export function renderFirstInterview(name, interviewer) {
  const who = interviewer ? `<b style="color:${NAVY};">${esc(interviewer)}</b> from our recruitment team` : "Our recruitment team";
  const inner = `<div style="padding:22px 24px 24px;">
    ${title("Your interview is being arranged")}
    ${para(`Dear ${esc(first(name))},`)}
    ${para(`Good news — your application is moving forward. ${who} will contact you at this email address and the phone number on your application to schedule your first interview.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${NAVY};border-radius:12px;overflow:hidden;margin-top:16px;">
      <tr><td colspan="3" style="background:${GREEN};padding:7px 18px;font-size:9.5px;font-weight:700;letter-spacing:1.6px;color:#ffffff;">NEXT STAGE &mdash; FIRST INTERVIEW</td></tr>
      <tr>
        <td width="40%" style="padding:16px 18px;">
          <div style="font-size:8px;letter-spacing:1.6px;color:${GREEN};font-weight:700;">COMPLETED</div>
          <div style="font-family:${FONT_H};font-size:17px;font-weight:700;color:#ffffff;margin-top:4px;">Assessment</div>
        </td>
        <td align="center" style="color:rgba(255,255,255,.5);font-size:15px;">&#9992;</td>
        <td width="40%" align="right" style="padding:16px 18px;">
          <div style="font-size:8px;letter-spacing:1.6px;color:${GREEN};font-weight:700;">SCHEDULING</div>
          <div style="font-family:${FONT_H};font-size:17px;font-weight:700;color:#ffffff;margin-top:4px;">Interview</div>
        </td>
      </tr>
    </table>
    ${para("The interview is a conversation about your experience and the role — no preparation materials are required. Please keep an eye on this inbox and your phone over the coming days.")}
    ${finePrint("If your contact details have changed since you applied, reply to this email with the update.")}
  </div>`;
  return shell(inner, FOOT_APPLICANT, CTX_APPLICANT);
}

/** To the applicant — hired after the final interview. The biggest moment in the
 *  funnel gets the full boarding-pass treatment. */
export function renderHired(name) {
  const NEXT = [
    ["1", "Documentation", "our crew administration team contacts you with the list of documents to prepare"],
    ["2", "Medicals &amp; visa", "we guide you through the medical examination and visa process step by step"],
    ["3", "Deployment", "once cleared, your vessel assignment and travel itinerary arrive by email"],
  ];
  const inner = `<div style="padding:22px 24px 24px;">
    ${title("Welcome aboard")}
    ${para(`Dear ${esc(first(name))},`)}
    ${para(`<b style="color:${NAVY};">Congratulations!</b> Following your final interview, we are delighted to confirm that you have been selected to join the DG3 Cruise Industry Managed Services program.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${NAVY};border-radius:12px;overflow:hidden;margin-top:16px;">
      <tr><td colspan="3" style="background:${GREEN};padding:7px 18px;font-size:9.5px;font-weight:700;letter-spacing:1.6px;color:#ffffff;">WELCOME ABOARD &mdash; DG3 CIMS</td></tr>
      <tr>
        <td width="40%" style="padding:16px 18px;">
          <div style="font-size:8px;letter-spacing:1.6px;color:${GREEN};font-weight:700;">STATUS</div>
          <div style="font-family:${FONT_H};font-size:17px;font-weight:700;color:#ffffff;margin-top:4px;">Selected</div>
        </td>
        <td align="center" style="color:rgba(255,255,255,.5);font-size:15px;">&#9992;</td>
        <td width="40%" align="right" style="padding:16px 18px;">
          <div style="font-size:8px;letter-spacing:1.6px;color:${GREEN};font-weight:700;">NEXT</div>
          <div style="font-family:${FONT_H};font-size:17px;font-weight:700;color:#ffffff;margin-top:4px;">Onboarding</div>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;margin-top:14px;">
      <tr><td style="padding:12px 18px 0;">${chip("WHAT HAPPENS NEXT", NAVY)}</td></tr>
      <tr><td style="padding:4px 18px 14px;">${stepsBox(NEXT)}</td></tr>
    </table>
    ${para("No action is needed from you today — the first contact comes from us. If any of your contact details change, reply to this email so nothing is delayed.")}
    ${para("We are glad to have you with us.")}
  </div>`;
  return shell(inner, FOOT_APPLICANT, CTX_APPLICANT);
}

/** To the applicant — not selected after the final interview. Deliberately a
 *  letter, no ticket: same dignity rule as renderFail, but it acknowledges how
 *  far the candidate got. 12-month window per SOP v1.1 §10. */
export function renderFinalRegret(name) {
  const inner = `<div style="padding:22px 24px 24px;">
    ${title("Thank you — the outcome of your final interview")}
    ${para(`Dear ${esc(first(name))},`)}
    ${para("Thank you for the time and effort you invested in the DG3 CIMS recruitment process — you completed every stage, including the final interview with our management team, and that is an achievement in itself.")}
    ${para("After careful consideration, we have decided not to move forward with your application at this time. This was a close decision among strong candidates, and it is not a judgment on your ability to succeed in this industry.")}
    ${para(`You are welcome to apply again after <b style="color:${NAVY};">12 months</b> — candidates who reached this stage are exactly the ones we hope to see again.`)}
    ${para("We wish you every success in your career.")}
  </div>`;
  return shell(inner, FOOT_APPLICANT, CTX_APPLICANT);
}

const factRow = (label, value) => `<tr>
  <td style="padding:5px 12px 5px 0;font-size:9px;font-weight:700;color:${GREEN_INK};letter-spacing:2px;text-transform:uppercase;white-space:nowrap;">${label}</td>
  <td style="padding:5px 0;font-size:12.5px;color:${BODY};">${value}</td></tr>`;

const passCell = (label, value) => `<td style="padding:10px 13px;">
  <div style="font-size:8px;letter-spacing:1.4px;color:${GREEN};font-weight:700;">${label}</div>
  <div style="font-size:12.5px;color:#ffffff;font-weight:600;margin-top:3px;">${value}</div></td>`;

export function renderAdminPassNotify(c, dashboardUrl) {
  const inner = `<div style="padding:22px 24px 24px;">
    ${titleTeam("Candidate passed screening")}
    ${para(`<b style="color:${NAVY};">${esc(c.name)}</b> cleared the Big Five gate${c.priority ? " — flag for leadership track" : ""}.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${NAVY};border-radius:12px;overflow:hidden;margin-top:16px;">
      <tr><td colspan="2" style="padding:14px 18px 0;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td>${chip("PASSED SCREENING", GREEN)}</td>
          <td align="right" style="font-size:10.5px;color:rgba(255,255,255,.6);">${esc(c.position || "—")} &middot; ${esc(c.source || "—")}</td>
        </tr></table>
      </td></tr>
      <tr>
        <td width="55%" style="padding:14px 18px 16px;">
          <div style="font-size:8px;letter-spacing:1.6px;color:${GREEN};font-weight:700;">FIT SCORE</div>
          <div style="font-family:${FONT_H};font-size:40px;font-weight:700;color:#ffffff;line-height:1;margin-top:4px;letter-spacing:1px;">${esc(String(c.fit))}</div>
        </td>
        <td align="right" valign="middle" style="padding:14px 18px 16px;">
          ${c.priority ? `<span style="display:inline-block;background:rgba(95,185,70,.18);border:1px solid ${GREEN};color:#9BE07C;font-size:10px;font-weight:700;letter-spacing:1.4px;padding:6px 12px;border-radius:5px;">PRIORITY &middot; 480+</span>` : ""}
        </td>
      </tr>
      ${stubLine(NAVY, "rgba(255,255,255,.28)")}
      <tr><td colspan="2" style="padding:10px 5px 14px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          ${passCell("EXPERIENCE", (c.shipboard ? "Shipboard" : "First-time") + (c.printer ? " &middot; Printer" : ""))}
          ${passCell("EMAIL", `<span style="font-family:${FONT_M};font-size:11.5px;">${esc(c.email || "")}</span>`)}
          ${passCell("PHONE", `<span style="font-family:${FONT_M};font-size:11.5px;">${esc(c.phone || "")}</span>`)}
        </tr></table>
      </td></tr>
    </table>
    ${para("Next step: schedule the first interview. The full profile, resume and evaluation brief are on the candidate record.")}
    ${dashboardUrl ? btnNavy(dashboardUrl, "Open the candidate profile") : ""}
  </div>`;
  return shell(inner, FOOT_TEAM, CTX_TEAM);
}

export function renderParseFailAlert(name, email, resultId) {
  const inner = `<div style="padding:22px 24px 24px;">
    ${titleTeam("Manual review needed — result could not be read")}
    ${amber(`Candidate <b>${esc(name)}</b> (${esc(email)}) submitted result ID <span style="font-family:${FONT_M};font-size:12px;">${esc(resultId)}</span>, but the scores could not be parsed automatically. The test provider may have changed its page format.`)}
    ${para("Please open the result, read the five scores manually, and record the outcome on the candidate record. If the page itself looks changed, flag it — the automatic reader needs an update.")}
    ${btnNavy("https://bigfive-test.com/result/" + encodeURIComponent(resultId), "Open the result")}
  </div>`;
  return shell(inner, FOOT_TEAM, CTX_TEAM);
}

// --- Phase 2b: endorsement & final-interview emails (unified shell) ----------

const btnRed = (href, label) => `<a href="${href}" style="display:inline-block;background:${RED};color:#fff;text-decoration:none;font-size:13px;font-weight:700;letter-spacing:.4px;padding:12px 22px;border-radius:8px;">${label}</a>`;
const btnGreenInline = (href, label) => btnG(href, label);

function profileTable(c) {
  return `<div style="background:${CLOUD};border-radius:8px;padding:12px 16px;margin-top:14px;">
  <table cellpadding="0" cellspacing="0">
    ${factRow("Fit Score", `<b style="font-family:${FONT_H};color:${NAVY};font-size:16px;">${esc(String(c.fit))}</b> ${c.priority ? `<span style="color:${GREEN_INK};font-weight:700;font-size:11px;">PRIORITY</span>` : ""}`)}
    ${factRow("Position", esc(c.position || "—"))}
    ${factRow("Source", esc(c.source || "—") + (c.referrer ? " (" + esc(c.referrer) + ")" : ""))}
    ${factRow("Experience", (c.shipboard ? "Shipboard" : "First-time") + (c.printer ? " · Printer" : ""))}
    ${c.resumeUrl ? factRow("Resume", `<a href="${c.resumeUrl}" style="color:#1E6FD0;">Open resume</a>`) : ""}
  </table></div>`;
}

/** To Ray & Rolando — one candidate, Approve/Decline authorizes ARRANGING the final. */
export function renderEndorsement(c, approveUrl, declineUrl, slotText) {
  const inner = `<div style="padding:22px 24px 24px;">
    ${titleTeam("New candidate for final interview — " + esc(c.name))}
    ${para(`<b style="color:${NAVY};">${esc(c.interviewer || "The recruitment team")}</b> has interviewed this candidate and recommends advancing to the final interview.`)}
    ${profileTable(c)}
    ${c.recommendation ? `<div style="margin-top:12px;">${secLabelLike("Recommendation")}<div style="font-size:12.5px;color:${BODY};line-height:1.6;">${esc(c.recommendation)}</div></div>` : ""}
    ${c.aiBrief ? `<div style="margin-top:12px;">${secLabelLike("Assessment brief")}<div style="font-size:12px;color:#4b5563;line-height:1.6;">${esc(c.aiBrief)}</div></div>` : ""}
    ${para(`If you approve, I will arrange the final interview for <b style="color:${NAVY};">${esc(slotText)}</b> and coordinate the video call with the applicant.`)}
    <table cellpadding="0" cellspacing="0" style="margin-top:16px;"><tr>
      <td style="padding-right:10px;">${btnGreenInline(approveUrl, "Approve — arrange the interview")}</td>
      <td>${btnRed(declineUrl, "Decline")}</td>
    </tr></table>
    ${finePrint("Either of you can approve — the first response is recorded. The hiring decision remains yours in the live interview; this only authorizes scheduling it.")}
  </div>`;
  return shell(inner, FOOT_TEAM, CTX_TEAM);
}

function secLabelLike(t) {
  return `<div style="font-size:9px;font-weight:700;color:${GREEN_INK};letter-spacing:2.5px;text-transform:uppercase;margin:0 0 4px;">${t}</div>`;
}

/** To the applicant — the confirmed final-interview slot. */
export function renderFinalInviteApplicant(name, slotText) {
  const inner = `<div style="padding:22px 24px 24px;">
    ${title("Your final interview is scheduled")}
    ${para(`Dear ${esc(first(name))},`)}
    ${para("Congratulations on reaching the final stage of the DG3 CIMS recruitment process. Your final interview with our management team is scheduled for:")}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${NAVY};border-radius:12px;overflow:hidden;margin-top:12px;">
      <tr><td colspan="1" style="background:${GREEN};padding:6px 18px;font-size:9px;font-weight:700;letter-spacing:1.6px;color:#ffffff;">FINAL INTERVIEW &mdash; CONFIRMED</td></tr>
      <tr><td align="center" style="padding:16px 18px;font-family:${FONT_H};font-size:16px;font-weight:700;color:#ffffff;">${esc(slotText)}</td></tr>
    </table>
    ${para("Our recruitment team will contact you with the video-call link and any details you need. Please confirm your availability by replying to this email.")}
    ${para("We look forward to meeting you.")}
  </div>`;
  return shell(inner, FOOT_APPLICANT, CTX_APPLICANT);
}

/** To Yanna/April — authorization received, coordinate the call. */
export function renderFinalCoordination(c, slotText, by) {
  const inner = `<div style="padding:22px 24px 24px;">
    ${titleTeam("Approved — final interview to coordinate")}
    ${para(`<b style="color:${NAVY};">${esc(by)}</b> approved <b style="color:${NAVY};">${esc(c.name)}</b> for the final interview. The applicant has been invited for:`)}
    <div style="background:${CLOUD};border-radius:8px;padding:12px 16px;margin-top:12px;font-family:${FONT_H};font-size:14px;font-weight:700;color:${NAVY};text-align:center;">${esc(slotText)}</div>
    ${para("Please set up the Zoom/Teams call and confirm the applicant received the invitation. Once the interview happens, record the outcome on the candidate record.")}
  </div>`;
  return shell(inner, FOOT_TEAM, CTX_TEAM);
}

/** To Yanna/April — Ray or Rolando declined at endorsement. */
export function renderDeclineNotify(c, by) {
  const inner = `<div style="padding:22px 24px 24px;">
    ${titleTeam("Endorsement declined — " + esc(c.name))}
    ${amber(`<b>${esc(by)}</b> declined the endorsement of <b>${esc(c.name)}</b>. No final interview will be scheduled.`)}
    ${para("The candidate remains on record. If you believe this should be revisited, follow up with the management team directly.")}
  </div>`;
  return shell(inner, FOOT_TEAM, CTX_TEAM);
}

/** To Yanna/April — endorsement still unactioned after N days. */
export function renderEndorseNudge(c, days) {
  const inner = `<div style="padding:22px 24px 24px;">
    ${titleTeam("Endorsement still awaiting a response")}
    ${amber(`Your endorsement of <b>${esc(c.name)}</b> has been awaiting Ray or Rolando for ${days} days with no response yet.`)}
    ${para("You may want to follow up with the management team directly so the candidate is not left waiting.")}
  </div>`;
  return shell(inner, FOOT_TEAM, CTX_TEAM);
}

/** To the GM (Miguel) — a below-threshold candidate proposed for exception (SOP v1.1 §11). */
export function renderExceptionRequest(c, reason, requestedBy) {
  const inner = `<div style="padding:22px 24px 24px;">
    ${titleTeam("GM exception requested — " + esc(c.name))}
    ${para(`<b style="color:${NAVY};">${esc(requestedBy)}</b> is requesting a threshold exception for a candidate who did not pass the SOP v1.1 automated gate.`)}
    ${profileTable(c)}
    <div style="margin-top:12px;">${secLabelLike("Justification")}<div style="font-size:12.5px;color:${BODY};line-height:1.6;">${esc(reason)}</div></div>
    ${amber("Per SOP v1.1 §11, only you can approve advancing this candidate. Reply with your written decision — the candidate is held until then.")}
  </div>`;
  return shell(inner, FOOT_TEAM, CTX_TEAM);
}

// --- Phase 2c: internal handoffs + expiry closure ---------------------------
// (Miguel, 2026-07-27.) Each of these closes a point where the process changed
// state and told nobody. The candidate-facing half of the same sweep
// (renderFirstInterview / renderHired / renderFinalRegret) sits above.

/** Assign: the team learns who now owns this candidate's first interview. */
export function renderAssignmentNotify(c, interviewer) {
  const inner = `<div style="padding:22px 24px 24px;">
    ${titleTeam("First interview assigned — " + esc(c.name))}
    ${para(`<b style="color:${NAVY};">${esc(interviewer)}</b> now owns this candidate's first interview. Schedule it, then record the outcome on the candidate record.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;margin-top:14px;">
      <tr><td style="padding:14px 18px;">
        <table cellpadding="0" cellspacing="0">
          ${factRow("Interviewer", `<b style="color:${NAVY};">${esc(interviewer)}</b>`)}
          ${factRow("Fit Score", `<b style="color:${NAVY};font-family:${FONT_M};">${esc(c.fit === 0 || c.fit ? String(c.fit) : "—")}</b>${c.priority ? ` <span style="color:${GREEN};font-weight:700;font-size:11px;">PRIORITY</span>` : ""}`)}
          ${factRow("Position", esc(c.position || "—"))}
          ${factRow("Email", esc(c.email || "—"))}
          ${factRow("Phone", esc(c.phone || "—"))}
        </table>
      </td></tr>
    </table>
    ${finePrint("Ownership is now explicit: if this candidate stalls, it is the assigned interviewer's to unblock.")}
  </div>`;
  return shell(inner, FOOT_TEAM, CTX_TEAM);
}

/** Hired: recruitment closes, crew administration opens. The handover sheet. */
export function renderCrewAdminHandoff(c, notes) {
  const inner = `<div style="padding:22px 24px 24px;">
    ${titleTeam("Hired — handing over to Crew Administration")}
    ${para(`<b style="color:${NAVY};">${esc(c.name)}</b> completed the final interview and has been approved for hire. Recruitment is closed on this candidate; crew administration starts now.`)}
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;margin-top:14px;">
      <tr><td style="padding:12px 18px 0;">${chip("HANDOVER", NAVY)}</td></tr>
      <tr><td style="padding:6px 18px 14px;">
        <table cellpadding="0" cellspacing="0">
          ${factRow("Position", esc(c.position || "—"))}
          ${factRow("Fleet", esc(c.fleet || "—"))}
          ${factRow("Experience", (c.shipboard ? "Shipboard" : "First-time") + (c.printer ? " · Printer" : ""))}
          ${factRow("Email", esc(c.email || "—"))}
          ${factRow("Phone", esc(c.phone || "—"))}
          ${factRow("Approved", `<span style="font-family:${FONT_M};">${esc(c.dateApproved || "—")}</span>`)}
          ${c.resumeUrl ? factRow("Resume", `<a href="${c.resumeUrl}" style="color:#1E6FD0;">Open resume</a>`) : ""}
        </table>
      </td></tr>
    </table>
    ${notes ? `<div style="margin-top:12px;">${secLabelLike("Final interview notes")}<div style="font-size:12.5px;color:${BODY};line-height:1.6;">${esc(notes)}</div></div>` : ""}
    ${para("Next steps sit with Crew Administration: open the visa file, schedule medicals, and confirm the projected joining date. The candidate has been told to expect your contact.")}
    ${finePrint("This candidate now counts as Approved in the monthly report and moves to In Visa / In Medicals as you progress the file.")}
  </div>`;
  return shell(inner, FOOT_TEAM, CTX_TEAM);
}

/** 30-day auto-close: never let a file close in silence. Not a rejection. */
export function renderExpiryNotice(name) {
  const inner = `<div style="padding:22px 24px 24px;">
    ${title("Your application has been closed")}
    ${para(`Dear ${esc(first(name))},`)}
    ${amber("This is not a rejection. There is no waiting period — you are welcome to apply again whenever you are ready.")}
    ${para("Your application to the DG3 Cruise Industry Managed Services program included a short personality assessment, which we did not receive within 30 days. The application has therefore been closed automatically to keep our records current.")}
    ${para("If you would still like to be considered, simply apply again and complete the assessment when the invitation arrives. Nothing from this application counts against you.")}
    ${finePrint("If you did complete the assessment and believe this closure is a mistake, reply to this email and we will look into it.")}
  </div>`;
  return shell(inner, FOOT_APPLICANT, CTX_APPLICANT);
}
