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

// --- Phase 2c: handoff, hire, assignment, expiry & final-stage closure -------
// Five gap-fix emails (Miguel, 2026-07-27). Each closes a point where the
// process previously changed state and told nobody.

/**
 * To Crew Administration — recruitment is finished, crewing starts.
 * This is the handoff that previously did not exist: without it the candidate
 * sits Approved in Airtable and nobody begins visa/medicals.
 */
export function renderCrewAdminHandoff(c, notes) {
  const inner = `<div style="padding:24px;">
    ${title("Hired — handing over to Crew Administration")}
    ${para(`<b style="color:${NAVY};">${esc(c.name)}</b> completed the final interview and has been approved for hire. Recruitment is closed on this candidate; crew administration starts now.`)}
    <div style="background:${CLOUD};border-radius:8px;padding:12px 16px;margin-top:14px;">
    <table cellpadding="0" cellspacing="0">
      ${factRow("Position", esc(c.position || "—"))}
      ${factRow("Fleet", esc(c.fleet || "—"))}
      ${factRow("Experience", (c.shipboard ? "Shipboard" : "First-time") + (c.printer ? " · Printer" : ""))}
      ${factRow("Email", esc(c.email || "—"))}
      ${factRow("Phone", esc(c.phone || "—"))}
      ${factRow("Approved", esc(c.dateApproved || "—"))}
      ${c.resumeUrl ? factRow("Resume", `<a href="${c.resumeUrl}" style="color:#1E6FD0;">Open resume</a>`) : ""}
    </table></div>
    ${notes ? `<div style="margin-top:12px;">${secLabelLike("Final interview notes")}<div style="font-size:12.5px;color:#374151;line-height:1.6;">${esc(notes)}</div></div>` : ""}
    ${para("Next steps sit with Crew Administration: open the visa file, schedule medicals, and confirm the projected joining date. The candidate has been told to expect your contact.")}
    ${small("This candidate now counts as Approved in the monthly report and will move to In Visa / In Medicals as you progress the file.")}
  </div>`;
  return shell(inner, FOOT_TEAM, CTX_TEAM);
}

/** To the applicant — the offer/hire confirmation and what happens next. */
export function renderHiredApplicant(name) {
  const inner = `<div style="padding:24px;">
    ${title("Welcome aboard — you have been selected")}
    ${para(`Dear ${esc(first(name))},`)}
    ${para(`<b style="color:${NAVY};">Congratulations.</b> Following your final interview, we are delighted to confirm that you have been selected to join the DG3 Cruise Industry Managed Services team.`)}
    ${para("Our Crew Administration team will contact you shortly to begin the onboarding process. From this point, the steps are:")}
    <div style="background:${CLOUD};border-radius:8px;padding:14px 16px;margin-top:14px;font-size:12.5px;color:#374151;line-height:1.8;">
      <span style="color:${GREEN};font-weight:700;">1</span>&nbsp; <b style="color:${NAVY};">Documentation</b> — passport, seaman's book and supporting papers<br>
      <span style="color:${GREEN};font-weight:700;">2</span>&nbsp; <b style="color:${NAVY};">Visa processing</b> — arranged and tracked by Crew Administration<br>
      <span style="color:${GREEN};font-weight:700;">3</span>&nbsp; <b style="color:${NAVY};">Medical examination</b> — at an approved clinic<br>
      <span style="color:${GREEN};font-weight:700;">4</span>&nbsp; <b style="color:${NAVY};">Joining date</b> — confirmed once visa and medicals clear
    </div>
    ${para("Please keep your documents current and respond promptly to Crew Administration — the joining date depends on how quickly these steps complete.")}
    ${para("We are glad to have you with us.")}
  </div>`;
  return shell(inner, FOOT_APPLICANT, CTX_APPLICANT);
}

/** To the recruitment team — an interviewer now owns this candidate. */
export function renderAssignmentNotify(c, interviewer) {
  const inner = `<div style="padding:24px;">
    ${title("First interview assigned — " + esc(c.name))}
    ${para(`<b style="color:${NAVY};">${esc(interviewer)}</b> is now the owner of this candidate's first interview. Please schedule it and record the outcome on the candidate record once it has taken place.`)}
    <div style="background:${CLOUD};border-radius:8px;padding:12px 16px;margin-top:14px;">
    <table cellpadding="0" cellspacing="0">
      ${factRow("Interviewer", `<b style="color:${NAVY};">${esc(interviewer)}</b>`)}
      ${factRow("Fit Score", `<b style="color:${NAVY};">${esc(String(c.fit))}</b>${c.priority ? ` <span style="color:${GREEN};font-weight:700;font-size:11px;">PRIORITY</span>` : ""}`)}
      ${factRow("Position", esc(c.position || "—"))}
      ${factRow("Email", esc(c.email || "—"))}
      ${factRow("Phone", esc(c.phone || "—"))}
    </table></div>
    ${small("Ownership is now explicit: if this candidate stalls, it is the assigned interviewer's to unblock.")}
  </div>`;
  return shell(inner, FOOT_TEAM, CTX_TEAM);
}

/** To the applicant — 30 days with no assessment, application auto-closed. */
export function renderExpiryNotice(name) {
  const inner = `<div style="padding:24px;">
    ${title("Your application has been closed")}
    ${para(`Dear ${esc(first(name))},`)}
    ${para("You applied for a shipboard position with DG3 Cruise Industry Managed Services, but the personality assessment was not completed within 30 days, so your application has now been closed automatically.")}
    ${amber("This is not a rejection. There is no waiting period — you are welcome to apply again at any time, and completing the assessment promptly is all that is needed.")}
    ${para("If you did take the test but never submitted your Result ID, simply apply again and complete the verification step; the assessment takes about 10 minutes.")}
    ${para("We hope to hear from you.")}
  </div>`;
  return shell(inner, FOOT_APPLICANT, CTX_APPLICANT);
}

/**
 * To the applicant — not selected AFTER the final interview.
 * Distinct from renderFail: this person met management face to face, so the
 * generic screening-rejection wording reads as careless.
 */
export function renderFinalRejection(name) {
  const inner = `<div style="padding:24px;">
    ${title("Your final interview — our decision")}
    ${para(`Dear ${esc(first(name))},`)}
    ${para("Thank you for meeting with our management team. Reaching the final interview stage of the DG3 CIMS process is itself an achievement — only a small number of applicants get there.")}
    ${para("After careful consideration, we have decided not to proceed with an offer on this occasion. This was a close decision and it does not reflect poorly on your capability or your interview.")}
    ${para(`You are welcome to apply again after <b style="color:${NAVY};">12 months</b>, and we would be glad to see your application return.`)}
    ${para("Thank you for the time and effort you invested with us. We wish you every success.")}
  </div>`;
  return shell(inner, FOOT_APPLICANT, CTX_APPLICANT);
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
