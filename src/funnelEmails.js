// Applicant-facing funnel emails. Same visual language as the digest, simpler frame.
// SOP v1.1: verdict emails never share scores or trait detail; the rejection email
// states the 12-month re-application window (Miguel, 2026-07-23).

const NAVY = "#1B3A5C", GREEN = "#5FB946", MUT = "#6B7C93";

function shell(title, inner) {
  return '<div style="margin:0;padding:24px 12px;background:#F4F7FA;font-family:Segoe UI,Arial,sans-serif">' +
    '<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #E3E9F0;border-radius:12px;overflow:hidden">' +
    '<div style="background:' + NAVY + ';padding:18px 24px">' +
    '<div style="color:' + GREEN + ';font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase">DG3 Cruise Industry Managed Services</div>' +
    '<div style="color:#ffffff;font-size:19px;font-weight:700;margin-top:2px">' + title + '</div>' +
    '</div>' +
    '<div style="padding:22px 24px;color:#22303E;font-size:14px;line-height:1.6">' + inner + '</div>' +
    '<div style="padding:12px 24px;border-top:1px solid #E3E9F0;color:' + MUT + ';font-size:11px">DG3 CIMS Recruitment · This mailbox is automated — please follow the instructions above.</div>' +
    '</div></div>';
}

function btn(href, label) {
  return '<div style="margin:16px 0"><a href="' + href + '" style="background:' + GREEN + ';color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 22px;border-radius:8px;display:inline-block">' + label + '</a></div>';
}

export function renderTestInvite(name, testUrl, verifyUrl) {
  const first = String(name).split(",").length > 1 ? String(name).split(",")[1].trim() : String(name).split(" ")[0];
  return shell("Your application — next step: the assessment",
    '<p>Dear ' + first + ',</p>' +
    '<p>Thank you for applying to the DG3 Cruise Industry Managed Services program. Your application has been registered. The next step is a personality assessment — it takes about 10 minutes and there are no right or wrong answers.</p>' +
    '<p style="font-weight:700;color:' + NAVY + '">Three steps:</p>' +
    '<ol style="padding-left:20px;margin:8px 0 14px">' +
    '<li style="margin-bottom:8px"><b>Click the link</b> and complete the test:<br><a href="' + testUrl + '" style="color:#1E6FD0">' + testUrl + '</a></li>' +
    '<li style="margin-bottom:8px"><b>At the end, copy your Result ID</b> — the long code shown with "Save the following ID". It is your proof of completion.</li>' +
    '<li><b>Return to our page</b> and submit the Result ID together with the email address you applied with:</li>' +
    '</ol>' +
    btn(verifyUrl, "Submit my Result ID") +
    '<p style="color:' + MUT + ';font-size:12.5px">Please complete the assessment within 7 days. Your email address is your applicant ID — use the same one everywhere.</p>');
}

export function renderTestReminder(name, testUrl, verifyUrl) {
  const first = String(name).split(",").length > 1 ? String(name).split(",")[1].trim() : String(name).split(" ")[0];
  return shell("Reminder — your assessment is waiting",
    '<p>Dear ' + first + ',</p>' +
    '<p>A quick reminder that your application is on hold until the personality assessment is completed. It takes about 10 minutes.</p>' +
    '<p><a href="' + testUrl + '" style="color:#1E6FD0">Take the test</a>, copy the Result ID at the end, then submit it here:</p>' +
    btn(verifyUrl, "Submit my Result ID") +
    '<p style="color:' + MUT + ';font-size:12.5px">If the assessment is not completed within 30 days of applying, the application closes automatically.</p>');
}

export function renderPass(name) {
  const first = String(name).split(",").length > 1 ? String(name).split(",")[1].trim() : String(name).split(" ")[0];
  return shell("Congratulations — you are moving to the next stage",
    '<p>Dear ' + first + ',</p>' +
    '<p><b>Congratulations!</b> You have successfully completed the assessment stage of the DG3 CIMS recruitment process.</p>' +
    '<p>Our recruitment team will contact you shortly to arrange your interview. No action is needed from you right now — just keep an eye on this inbox and your phone.</p>' +
    '<p>We look forward to speaking with you.</p>');
}

export function renderFail(name) {
  const first = String(name).split(",").length > 1 ? String(name).split(",")[1].trim() : String(name).split(" ")[0];
  return shell("Thank you for your application",
    '<p>Dear ' + first + ',</p>' +
    '<p>Thank you for taking the time to apply and complete the assessment for the DG3 Cruise Industry Managed Services program.</p>' +
    '<p>After careful review, we will not be moving forward with your application at this time.</p>' +
    '<p>You are welcome to apply again after <b>12 months</b> — many strong candidates succeed on a later application as their experience grows.</p>' +
    '<p>We wish you every success in your career.</p>');
}

export function renderAdminPassNotify(c, dashboardUrl) {
  return shell("New candidate passed screening — " + c.name,
    '<p><b>' + c.name + '</b> has passed the Big Five screening gate.</p>' +
    '<table style="border-collapse:collapse;font-size:13px;margin:10px 0">' +
    '<tr><td style="padding:3px 12px 3px 0;color:' + MUT + '">Fit Score</td><td style="font-weight:700;color:' + NAVY + '">' + c.fit + (c.priority ? ' · PRIORITY (480+)' : '') + '</td></tr>' +
    '<tr><td style="padding:3px 12px 3px 0;color:' + MUT + '">Position</td><td>' + c.position + '</td></tr>' +
    '<tr><td style="padding:3px 12px 3px 0;color:' + MUT + '">Source</td><td>' + c.source + '</td></tr>' +
    '<tr><td style="padding:3px 12px 3px 0;color:' + MUT + '">Experience</td><td>' + (c.shipboard ? "Shipboard" : "First-time") + (c.printer ? " · Printer" : "") + '</td></tr>' +
    '<tr><td style="padding:3px 12px 3px 0;color:' + MUT + '">Email</td><td>' + c.email + '</td></tr>' +
    '<tr><td style="padding:3px 12px 3px 0;color:' + MUT + '">Phone</td><td>' + c.phone + '</td></tr>' +
    '</table>' +
    '<p>Next step: schedule the first interview. The full profile is in the admin dashboard.</p>' +
    (dashboardUrl ? btn(dashboardUrl, "Open the candidate profile") : ''));
}
