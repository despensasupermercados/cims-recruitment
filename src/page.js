// The private landing page served at recruitment.cims.work/?k=<FORM_KEY>
// NOTE: this file is a JS template literal — no backticks or dollar-brace
// sequences may appear inside the HTML/client-JS below.

export const LOCKED_HTML = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CIMS</title>
<style>body{margin:0;background:#1B3A5C;font-family:system-ui,sans-serif;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;gap:10px}
.wm{font-weight:700;letter-spacing:4px;font-size:20px}.wm span{color:#5FB946}p{color:rgba(255,255,255,.55);font-size:13px}</style></head>
<body><div class="wm">CIMS <span>|</span> DG3</div><p>Private page. Use your bookmarked link.</p></body></html>`;

export const PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CIMS — Monthly Recruitment Submission</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<style>
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Outfit:wght@500;600;700&display=swap');
  :root {
    --navy:#1B3A5C; --green:#5FB946; --green-light:#6CC24A; --slate:#6B7280;
    --light-slate:#9CA3AF; --cloud:#F3F4F6; --border:#E5E7EB; --red:#DC2626; --amber:#B45309;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#EEF1F4; font-family:'DM Sans',sans-serif; color:var(--navy); padding-bottom:60px; }
  .topbar { height:4px; background:linear-gradient(90deg, var(--navy) 60%, var(--green) 60%); }
  .hero { background:var(--navy); padding:34px 0 42px; }
  .hero-inner { max-width:760px; margin:0 auto; padding:0 24px; }
  .wordmark { display:flex; align-items:center; gap:8px; margin-bottom:30px; }
  .wm-left { display:flex; align-items:center; gap:8px; }
  .wm-cims { font-family:'Outfit',sans-serif; font-size:16px; font-weight:700; color:#fff; letter-spacing:3px; }
  .wm-bar { width:1.5px; height:12px; background:var(--green); }
  .wm-dg3 { font-family:'Outfit',sans-serif; font-size:10px; font-weight:600; color:var(--green); letter-spacing:1.5px; }
  .hnav { margin-left:auto; display:flex; gap:6px; }
  .hnav a { font-size:11.5px; font-weight:600; color:rgba(255,255,255,.72); text-decoration:none; padding:6px 13px; border-radius:8px; border:1px solid rgba(255,255,255,.16); }
  .hnav a:hover { color:#fff; background:rgba(255,255,255,.1); }
  .hnav a.on { color:#fff; background:rgba(255,255,255,.14); border-color:transparent; }
  .hero h1 { font-family:'Outfit',sans-serif; font-size:26px; font-weight:600; color:#fff; letter-spacing:-0.2px; }
  .hero .meta-line { display:flex; flex-wrap:wrap; gap:6px 22px; margin-top:14px; font-size:12px; color:rgba(255,255,255,0.55); }
  .hero .meta-line span { display:inline-flex; align-items:center; gap:7px; }
  .hero .meta-line i { width:5px; height:5px; border-radius:50%; background:var(--green); font-style:normal; }
  .sheet { max-width:760px; margin:-16px auto 0; padding:0 24px; }
  .card { background:#fff; border:1px solid var(--border); border-radius:10px; padding:20px 22px; margin-bottom:12px; }
  .sec-label { font-size:9px; font-weight:700; color:var(--green); letter-spacing:2.5px; text-transform:uppercase; margin-bottom:4px; }
  .sec-hint { font-size:11.5px; color:var(--light-slate); margin-bottom:14px; line-height:1.5; }
  label { display:block; font-size:11.5px; font-weight:600; color:var(--slate); margin-bottom:5px; }
  input[type=text], input[type=number], select {
    width:100%; border:1.5px solid var(--border); border-radius:6px; height:42px; padding:0 12px;
    font-family:'DM Sans',sans-serif; font-size:14px; color:var(--navy); background:#fff; outline:none;
  }
  select { -webkit-appearance:none; appearance:none;
    background-image:url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236B7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 12px center; padding-right:30px; }
  textarea { width:100%; border:1.5px solid var(--border); border-radius:6px; font-family:'DM Sans',sans-serif; font-size:14px; color:var(--navy); outline:none; resize:vertical; min-height:64px; line-height:1.5; padding:10px 12px; }
  input:focus, textarea:focus, select:focus { border-color:var(--green); }
  ::placeholder { color:#C4C9D0; }
  .row { display:grid; gap:10px; }
  .row.c2 { grid-template-columns:1fr 1fr; }
  .row.c3 { grid-template-columns:1fr 1fr 1fr; }
  .row + .row, .row + label, label + .row { margin-top:12px; }
  .field + .field { margin-top:12px; }
  .numgrid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
  @media (max-width:560px) { .numgrid { grid-template-columns:repeat(2,1fr); } .row.c3 { grid-template-columns:1fr; } }
  .numcell label { font-size:10.5px; text-align:center; }
  .numcell input { text-align:center; font-family:'Outfit',sans-serif; font-size:17px; font-weight:600; padding:0 4px; }
  .matrix { width:100%; border-collapse:separate; border-spacing:4px 5px; margin:0 -4px; }
  .matrix th { font-size:9px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:var(--slate); padding:0 4px 6px; border-bottom:2px solid var(--navy); }
  .matrix th:first-child { text-align:left; }
  .matrix td:first-child { font-size:10.5px; font-weight:600; color:var(--slate); white-space:nowrap; padding-right:10px; }
  .matrix td:first-child small { color:var(--light-slate); font-weight:500; }
  .matrix input { text-align:center; font-family:'Outfit',sans-serif; font-weight:600; font-size:15px; height:38px; padding:0 2px; }
  .matrix .tot { text-align:center; font-family:'Outfit',sans-serif; font-weight:700; font-size:15px; color:var(--navy); background:var(--cloud); border-radius:6px; height:38px; min-width:44px; }
  .matrix .auto { background:#F2F8EE; font-weight:600; }
  .check { margin-top:10px; font-size:10.5px; color:var(--slate); }
  .check b { color:var(--green); }
  .check.bad b { color:var(--red); }

  .part { position:relative; display:flex; align-items:center; gap:20px; background:#fff; border:1px solid var(--border); border-radius:10px; padding:18px 22px 20px; margin:26px 0 12px; overflow:hidden; }
  .part::after { content:""; position:absolute; left:0; right:0; bottom:0; height:3px; background:linear-gradient(90deg, var(--navy) 60%, var(--green) 60%); }
  .part .num { font-family:'Outfit',sans-serif; font-size:44px; font-weight:700; line-height:1; color:var(--cloud); flex:none; -webkit-text-stroke:1px #DDE3E9; }
  .part .kicker { font-size:9px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; color:var(--green); margin-bottom:3px; }
  .part .who { font-family:'Outfit',sans-serif; font-size:18px; font-weight:600; color:var(--navy); }
  .part .desc { font-size:11.5px; color:var(--light-slate); margin-top:3px; }
  .part .owner { margin-left:auto; flex:none; font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:var(--navy); background:var(--cloud); border-radius:999px; padding:7px 14px; }
  .part.p2 .owner { background:#EAF5E3; color:#3E7A22; }
  @media (max-width:560px){ .part .owner { display:none; } }

  .console-note { display:flex; gap:10px; align-items:flex-start; background:#F2F8EE; border:1px solid #D8ECCC; border-radius:10px; padding:12px 16px; margin-bottom:12px; font-size:12px; color:#2F5D1E; line-height:1.55; }
  .console-note b { color:#255315; }
  .console-note.warn { background:#FFF7E0; border-color:#F3E2A8; color:var(--amber); }

  .prow { display:grid; gap:8px; margin-bottom:8px; align-items:center; }
  .prow.ready { grid-template-columns:1fr 84px 104px 78px 30px; }
  .prow.joined { grid-template-columns:1fr 84px 118px 78px 30px; }
  .prow.flag { grid-template-columns:1fr 92px 1.2fr 30px; }
  .prow.visa { grid-template-columns:1fr 78px 148px 1fr 30px; }
  .prow.doc { grid-template-columns:1fr 160px 116px 78px 30px; }
  .rowhead { margin-bottom:4px; }
  .rowhead label { margin-bottom:0; }
  .chip { font-size:8.5px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; text-align:center; border-radius:5px; padding:6px 0; }
  .chip.console { background:#EAF5E3; color:#3E7A22; }
  .chip.manual { background:var(--cloud); color:var(--light-slate); }
  .kill { width:30px; height:30px; border:none; background:none; color:var(--light-slate); font-size:15px; cursor:pointer; border-radius:6px; }
  .kill:hover { background:#FDF0F0; color:var(--red); }
  input.bad-date { color:var(--red); font-weight:600; }
  .addrow { display:inline-block; font-size:11.5px; font-weight:700; color:var(--green); cursor:pointer; margin-top:2px; background:none; border:none; font-family:'DM Sans',sans-serif; }
  .addrow:hover { text-decoration:underline; }
  .subgroup + .subgroup { margin-top:18px; padding-top:16px; border-top:1px solid var(--cloud); }

  .tray { display:flex; flex-wrap:wrap; gap:6px; margin:2px 0 12px; }
  .tray-chip { font-size:11.5px; font-weight:600; color:var(--navy); background:var(--cloud); border:1px solid var(--border); border-radius:999px; padding:6px 12px; cursor:pointer; }
  .tray-chip:hover { background:#EAF5E3; border-color:#D8ECCC; }
  .tray-chip small { color:var(--light-slate); font-weight:500; }
  .tray-chip.passive { cursor:default; }
  .tray-chip.passive:hover { background:var(--cloud); border-color:var(--border); }
  .tray-label { font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:var(--light-slate); margin-bottom:6px; }

  .ta-wrap { position:relative; }
  .ta-list { position:absolute; top:44px; left:0; right:0; background:#fff; border:1px solid var(--border); border-radius:8px; box-shadow:0 8px 24px rgba(11,20,40,.12); z-index:30; overflow:hidden; display:none; }
  .ta-item { padding:9px 12px; font-size:13px; cursor:pointer; display:flex; justify-content:space-between; }
  .ta-item:hover { background:var(--cloud); }
  .ta-item small { color:var(--light-slate); }

  .outlook { font-size:11.5px; color:var(--slate); margin-top:10px; }
  .outlook b { color:var(--navy); }

  .savebar { position:fixed; right:16px; bottom:16px; background:#fff; border:1px solid var(--border); border-radius:999px; padding:8px 16px; font-size:11.5px; color:var(--slate); box-shadow:0 4px 16px rgba(11,20,40,.10); display:none; }
  .savebar b { color:var(--green); }

  .errors { display:none; background:#FDF0F0; border-left:3px solid var(--red); border-radius:0 8px 8px 0; padding:12px 16px; margin-bottom:12px; }
  .errors p { font-size:12.5px; color:var(--navy); margin:2px 0; }
  .revised-note { display:none; background:#FFF7E0; border:1px solid #F3E2A8; border-radius:10px; padding:12px 16px; margin-bottom:12px; font-size:12px; color:var(--amber); }
  .success { display:none; text-align:center; padding:60px 24px; }
  .success .big { font-size:44px; }
  .success h2 { font-family:'Outfit',sans-serif; font-size:22px; margin-top:10px; }
  .success p { font-size:13.5px; color:var(--slate); margin-top:8px; line-height:1.6; }
  .submit-wrap { text-align:center; margin-top:20px; }
  .submit { background:var(--green); border:none; cursor:pointer; color:#fff; font-family:'Outfit',sans-serif; font-size:14px; font-weight:600; letter-spacing:.5px; padding:14px 34px; border-radius:8px; box-shadow:0 2px 10px rgba(95,185,70,0.35); }
  .submit:disabled { opacity:.6; cursor:wait; }
  .submit-note { font-size:10.5px; color:var(--slate); margin-top:10px; line-height:1.6; }
  .foot { text-align:center; font-size:8px; color:var(--light-slate); margin-top:26px; letter-spacing:.5px; }
  .hp { position:absolute; left:-9999px; opacity:0; height:0; overflow:hidden; }
</style>
</head>
<body>
<div class="topbar"></div>

<div class="hero">
  <div class="hero-inner">
    <div class="wordmark"><div class="wm-left"><span class="wm-cims">CIMS</span><div class="wm-bar"></div><span class="wm-dg3">DG3</span></div><div class="hnav"><a class="on" href="#">Monthly report</a><a id="navAdmin" href="/admin">Admin</a><a id="navReports" href="/reports">Reports</a></div></div>
    <script>(function(){var k=new URLSearchParams(location.search).get('k')||'';var a=document.getElementById('navAdmin');var r=document.getElementById('navReports');if(a)a.href='/admin?k='+encodeURIComponent(k);if(r)r.href='/reports?k='+encodeURIComponent(k);})();</script>
    <h1>Monthly Recruitment Submission</h1>
    <div class="meta-line">
      <span><i></i>Part 1 Recruitment Admin &middot; Part 2 Crew Admin</span>
      <span><i></i>Saves as you type — finish in separate sittings</span>
      <span><i></i>Part 2 pre-filled from the CIMS Console</span>
    </div>
  </div>
</div>

<div class="sheet">
  <div class="success" id="success">
    <div class="big">&#9989;</div>
    <h2 id="successTitle">Submitted</h2>
    <p id="successText">The update has been compiled and emailed to the team.<br>You will receive your own copy — present from it in the monthly meeting.</p>
  </div>

  <form id="f" autocomplete="off">

  <div class="card">
    <div class="sec-label">Reporting Month</div>
    <div class="sec-hint">One submission per month. Submitting the same month again sends a REVISED update.</div>
    <div class="row c2">
      <div><label>Month</label><select id="month"></select></div>
      <div><label>Submitted by</label><input type="text" id="submittedBy" placeholder="Your name"></div>
    </div>
    <div class="hp"><label>Website</label><input type="text" id="website" tabindex="-1"></div>
    <div class="revised-note" id="revisedNote">This month was already submitted — submitting again sends a corrected update marked <b>REVISED</b>.</div>
  </div>

  <div class="part">
    <div class="num">01</div>
    <div>
      <div class="kicker">Part One</div>
      <div class="who">Recruitment Funnel</div>
      <div class="desc">Sourcing &rarr; Pipeline &rarr; Fleet &rarr; Rejections &middot; manual, from recruitment documentation</div>
    </div>
    <span class="owner">Recruitment Admin</span>
  </div>

  <div class="card">
    <div class="sec-label">1 &middot; Sourcing Channels</div>
    <div class="sec-hint">Where the in-process candidates came from.</div>
    <div class="row c3">
      <div><label>TCMS website</label><input type="number" min="0" id="ch_tcms"></div>
      <div><label>Crew referrals</label><input type="number" min="0" id="ch_referrals"></div>
      <div><label>Walk-ins</label><input type="number" min="0" id="ch_walkins"></div>
    </div>
  </div>

  <div class="card">
    <div class="sec-label">2 &middot; Pipeline Counts</div>
    <div class="sec-hint">Totals across all fleets. These become the headline numbers of the email. 0 is a valid answer.</div>
    <div class="numgrid">
      <div class="numcell"><label>In process</label><input type="number" min="0" id="c_inProcess"></div>
      <div class="numcell"><label>Interviewed 30d</label><input type="number" min="0" id="c_interviewed"></div>
      <div class="numcell"><label>Approved</label><input type="number" min="0" id="c_approved"></div>
      <div class="numcell"><label>Rejected</label><input type="number" min="0" id="c_rejected"></div>
      <div class="numcell"><label>In visa</label><input type="number" min="0" id="c_inVisa"></div>
      <div class="numcell"><label>In medicals</label><input type="number" min="0" id="c_inMedicals"></div>
      <div class="numcell"><label>Ready to deploy</label><input type="number" min="0" id="c_ready"></div>
      <div class="numcell"><label>Big 5 avg score</label><input type="number" min="0" id="c_big5Avg"></div>
    </div>
  </div>

  <div class="card">
    <div class="sec-label">3 &middot; By Fleet</div>
    <div class="sec-hint">Candidate stages entered per fleet. Ready and Joined compute themselves from Part 2 — no double entry.</div>
    <table class="matrix" id="matrix"></table>
    <div class="check" id="matrixCheck"><b>&#10003;</b> Fleet totals match pipeline counts</div>
  </div>

  <div class="card">
    <div class="sec-label">4 &middot; Rejections</div>
    <div class="sec-hint">Counts should add up to the Rejected number above.</div>
    <input type="text" id="rejectionReasons" placeholder="e.g. 11 not the best candidate &middot; 4 failed Big 5 / psych &middot; 1 not eligible for rehire">
  </div>

  <div class="part p2">
    <div class="num">02</div>
    <div>
      <div class="kicker">Part Two</div>
      <div class="who">Existing Crew</div>
      <div class="desc">Pre-filled from the CIMS Console &middot; review, remove what doesn't belong, add what's missing</div>
    </div>
    <span class="owner">Crew Admin</span>
  </div>

  <div class="console-note" id="consoleNote">
    <span>&#128279;</span>
    <div><b>Pulled from the console just now.</b> Rows marked <b>CONSOLE</b> come from crew records, contracts and document expiries — never re-typed. The <b>&#10005;</b> removes a row from this month's report (the console itself is untouched). Candidates and judgment calls are added manually.</div>
  </div>
  <div class="console-note warn" id="consoleWarn" style="display:none">
    <span>&#9888;</span>
    <div><b>Console connection unavailable right now.</b> The form works normally — enter Part 2 manually this month.</div>
  </div>

  <div class="card">
    <div class="sec-label">5 &middot; Ready to Deploy</div>
    <div class="sec-hint">Crew awaiting assignment — no ship on record, not Earmarked, not retired — appear below from the console; tap to add. Candidates cleared for first deployment: add manually.</div>
    <div class="tray-label" id="trayLabel" style="display:none">From the console — awaiting assignment, tap to add</div>
    <div class="tray" id="tray"></div>
    <div class="prow ready rowhead"><label>Name</label><label>Fleet</label><label>Join date</label><label>Source</label><label></label></div>
    <div id="rows_ready"></div>
    <button type="button" class="addrow" data-add="ready">+ Add person</button>
  </div>

  <div class="card">
    <div class="sec-label">6 &middot; This Month Deployments</div>
    <div class="sec-hint">Pre-filled: contract sign-ons in the reporting month, from the console.</div>
    <div class="prow joined rowhead"><label>Name</label><label>Fleet</label><label>Signed on</label><label>Source</label><label></label></div>
    <div id="rows_joined"></div>
    <button type="button" class="addrow" data-add="joined">+ Add person</button>
  </div>

  <div class="card">
    <div class="sec-label">7 &middot; Visa &amp; Medical Issues</div>
    <div class="sec-hint">Pre-filled: visas &amp; medicals expiring inside the reporting month only. New-hire cases: add manually.</div>
    <div class="prow visa rowhead"><label>Name</label><label>Fleet</label><label>Type</label><label>Note</label><label></label></div>
    <div id="rows_visa"></div>
    <button type="button" class="addrow" data-add="visa">+ Add case</button>
  </div>

  <div class="card">
    <div class="sec-label">8 &middot; Compliance Flags</div>
    <div class="sec-hint">Pre-filled: documents expired or expiring within 30 days of the report, from crew records. Red = already expired.</div>
    <div class="prow doc rowhead"><label>Crew name</label><label>Document</label><label>Expires</label><label>Source</label><label></label></div>
    <div id="rows_doc"></div>
    <button type="button" class="addrow" data-add="doc">+ Add document</button>
  </div>

  <div class="card">
    <div class="sec-label">9 &middot; Not Returning / Red Flags</div>
    <div class="sec-hint">Judgment calls — always manual, with crew autocomplete so names stay canonical.</div>
    <div class="prow flag rowhead"><label>Name</label><label>Fleet</label><label>Reason</label><label></label></div>
    <div id="rows_flags"></div>
    <button type="button" class="addrow" data-add="flags">+ Add person</button>
  </div>

  <div class="card">
    <div class="sec-label">10 &middot; Forecast — Next 60&ndash;90 Days</div>
    <div class="row c2">
      <div><label>Forecast joiners</label><input type="number" min="0" id="fc_joiners"></div>
      <div><label>Roles to source now</label><input type="text" id="fc_roles" placeholder="e.g. 20 Printer Specialists — new ship"></div>
    </div>
    <div class="outlook" id="outlook" style="display:none"></div>
    <div class="tray-label" id="soTrayLabel" style="display:none; margin-top:12px;">From the console — projected sign-offs, next 90 days</div>
    <div class="tray" id="soTray"></div>
  </div>

  <div class="card">
    <div class="sec-label">11 &middot; Decisions &amp; Observations</div>
    <div class="field"><label>Decisions needed from DG3 HR — write NONE if nothing needs a call</label>
      <input type="text" id="decisions" placeholder="NONE"></div>
    <div class="field"><label>Observations — anything the team should know</label>
      <textarea id="observations" placeholder="Incidents, process friction, candidate stories, cost issues&hellip;"></textarea></div>
  </div>

  <div class="errors" id="errors"></div>

  <div class="submit-wrap">
    <button class="submit" id="submitBtn" type="submit">Submit — send update to the team</button>
    <div class="submit-note">Drafts save automatically as you type — both admins can work on this at different times.<br>Submit sends the compiled update to the team immediately.</div>
  </div>
  </form>

  <div class="foot">CIMS — CRUISE INDUSTRY MANAGED SERVICES &middot; A DIVISION OF DG3 &middot; CONFIDENTIAL</div>
</div>

<div class="savebar" id="savebar"><b>&#10003;</b> <span id="savetext">Draft saved</span></div>

<script>
(function () {
  "use strict";
  var FLEETS = ["RCL", "CEL", "AZ", "NCL"];
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var KEY = new URLSearchParams(location.search).get("k") || "";
  var CREW = [];          // [{name, fleet}] for type-ahead
  var ctxLoaded = false;  // block autosave until context applied
  var dirty = false;
  var saveTimer = null;

  function byId(id) { return document.getElementById(id); }
  function num(el) { var v = el && el.value; var n = Number(v); return v === "" || isNaN(n) ? 0 : n; }

  // --- month options
  var mnl = new Date(Date.now() + 8 * 3600 * 1000);
  var y = mnl.getUTCFullYear(), m = mnl.getUTCMonth();
  var prevName = MONTHS[m === 0 ? 11 : m - 1] + " " + (m === 0 ? y - 1 : y);
  var curName = MONTHS[m] + " " + y;
  var monthSel = byId("month");
  [prevName, curName].forEach(function (n) {
    var o = document.createElement("option"); o.value = n; o.textContent = n; monthSel.appendChild(o);
  });

  // --- fleet matrix (manual candidate rows + auto ready/joined)
  var MANUAL_ROWS = [["approved","Approved","c_approved"],["visa","Visa","c_inVisa"],["medicals","Medicals","c_inMedicals"]];
  var matrix = byId("matrix");
  var head = "<tr><th>Stage</th>";
  FLEETS.forEach(function (f) { head += "<th>" + f + "</th>"; });
  head += "<th>Total</th></tr>";
  matrix.innerHTML = head;
  MANUAL_ROWS.forEach(function (r) {
    var tr = document.createElement("tr");
    var html = "<td>" + r[1] + "</td>";
    FLEETS.forEach(function (f) {
      html += '<td><input type="number" min="0" data-mrow="' + r[0] + '" data-fleet="' + f + '"></td>';
    });
    html += '<td class="tot" id="tot_' + r[0] + '">0</td>';
    tr.innerHTML = html;
    matrix.appendChild(tr);
  });
  ["ready","joined"].forEach(function (rk) {
    var tr = document.createElement("tr");
    var html = "<td>" + (rk === "ready" ? "Ready" : "Joined") + " <small>auto</small></td>";
    FLEETS.forEach(function (f) {
      html += '<td class="tot auto" id="auto_' + rk + '_' + f + '">0</td>';
    });
    html += '<td class="tot" id="tot_' + rk + '">0</td>';
    tr.innerHTML = html;
    matrix.appendChild(tr);
  });

  // --- repeatable rows
  function mkInput(ph, cls) { var i = document.createElement("input"); i.type = "text"; i.placeholder = ph || ""; if (cls) i.className = cls; return i; }
  function mkSel(opts) {
    var s = document.createElement("select");
    opts.forEach(function (x) { var o = document.createElement("option"); o.value = x; o.textContent = x; s.appendChild(o); });
    return s;
  }
  function mkChip(src) { var s = document.createElement("span"); s.className = "chip " + (src === "console" ? "console" : "manual"); s.textContent = src === "console" ? "Console" : "Manual"; return s; }
  function mkKill() {
    var b = document.createElement("button"); b.type = "button"; b.className = "kill"; b.innerHTML = "&#10005;";
    b.addEventListener("click", function () { b.closest(".prow").remove(); markDirty(); refreshChecks(); });
    return b;
  }

  var ROWDEFS = {
    ready:  { host: "rows_ready", cls: "prow ready",
      make: function (d) { return [ taInput(d.name, "Name"), mkSelVal(FLEETS, d.fleet), mkInputVal("e.g. 02 Aug", d.date), mkChip(d.src), mkKill() ]; },
      keys: ["name","fleet","date"] },
    joined: { host: "rows_joined", cls: "prow joined",
      make: function (d) { return [ taInput(d.name, "Name"), mkSelVal(FLEETS, d.fleet), mkInputVal("date", d.date), mkChip(d.src), mkKill() ]; },
      keys: ["name","fleet","date"] },
    visa:   { host: "rows_visa", cls: "prow visa",
      make: function (d) { return [ taInput(d.name, "Name"), mkSelVal(FLEETS, d.fleet), mkSelVal(["Visa denied","Visa delay","Medical incident","Medical renewal","US Visa renewal","Reschedule"], d.type), mkInputVal("Note", d.note, d.overdue), mkKill() ]; },
      keys: ["name","fleet","type","note"] },
    doc:    { host: "rows_doc", cls: "prow doc",
      make: function (d) { return [ taInput(d.name, "Crew name"), mkSelVal(["Drug & Alcohol Test","Medical","US Visa","SIRB","Passport","Certificate (SCH)","BT Refresher / PSSR","STCW","Chinese Visa","Other"], d.doc), mkInputVal("e.g. Sep 2026", d.expires, d.overdue), mkChip(d.src), mkKill() ]; },
      keys: ["name","doc","expires"] },
    flags:  { host: "rows_flags", cls: "prow flag",
      make: function (d) { return [ taInput(d.name, "Name"), mkSelVal(["Unassigned"].concat(FLEETS), d.fleet), mkInputVal("Reason", d.reason), mkKill() ]; },
      keys: ["name","fleet","reason"] },
  };
  function mkInputVal(ph, val, bad) { var i = mkInput(ph, bad ? "bad-date" : ""); if (val) i.value = val; return i; }
  function mkSelVal(opts, val) { var s = mkSel(opts); if (val && opts.indexOf(val) >= 0) s.value = val; return s; }

  function addRow(kind, data) {
    var def = ROWDEFS[kind];
    var row = document.createElement("div");
    row.className = def.cls;
    row.setAttribute("data-kind", kind);
    row.setAttribute("data-src", (data && data.src) || "manual");
    def.make(data || {}).forEach(function (el) { row.appendChild(el); });
    byId(def.host).appendChild(row);
    return row;
  }
  document.querySelectorAll(".addrow").forEach(function (b) {
    b.addEventListener("click", function () { addRow(b.getAttribute("data-add"), {}); markDirty(); });
  });

  function collectRows(kind) {
    var def = ROWDEFS[kind];
    var out = [];
    document.querySelectorAll('[data-kind="' + kind + '"]').forEach(function (row) {
      var els = row.querySelectorAll("input, select");
      var o = { src: row.getAttribute("data-src") }, any = false;
      def.keys.forEach(function (k, i) {
        var v = (els[i] && els[i].value || "").trim();
        o[k] = v;
        if (v && els[i].tagName === "INPUT") any = true;
      });
      if (any || o.src === "console") out.push(o);
    });
    return out;
  }
  function clearRows(kind) { byId(ROWDEFS[kind].host).innerHTML = ""; }

  // --- type-ahead
  function taInput(val, ph) {
    var wrap = document.createElement("div"); wrap.className = "ta-wrap";
    var inp = mkInput(ph); if (val) inp.value = val;
    var list = document.createElement("div"); list.className = "ta-list";
    wrap.appendChild(inp); wrap.appendChild(list);
    inp.addEventListener("input", function () {
      var q = inp.value.trim().toLowerCase();
      list.innerHTML = "";
      if (q.length < 2 || !CREW.length) { list.style.display = "none"; return; }
      var hits = CREW.filter(function (c) { return c.name.toLowerCase().indexOf(q) >= 0; }).slice(0, 6);
      if (!hits.length) { list.style.display = "none"; return; }
      hits.forEach(function (c) {
        var d = document.createElement("div");
        d.className = "ta-item";
        d.innerHTML = c.name + " <small>" + (c.fleet || "&mdash;") + " &middot; Keyman</small>";
        d.addEventListener("mousedown", function () {
          inp.value = c.name;
          list.style.display = "none";
          var row = wrap.closest(".prow");
          if (row && c.fleet) {
            var sel = row.querySelector("select");
            if (sel) { sel.value = c.fleet; }
          }
          markDirty();
        });
        list.appendChild(d);
      });
      list.style.display = "block";
    });
    inp.addEventListener("blur", function () { setTimeout(function () { list.style.display = "none"; }, 150); });
    return wrap;
  }

  // --- live checks + auto matrix rows
  function refreshChecks() {
    var allOk = true;
    MANUAL_ROWS.forEach(function (r) {
      var s = 0;
      document.querySelectorAll('[data-mrow="' + r[0] + '"]').forEach(function (i) { s += num(i); });
      var cell = byId("tot_" + r[0]);
      cell.textContent = s;
      var want = num(byId(r[2]));
      var ok = byId(r[2]).value === "" || s === want;
      cell.style.color = ok ? "" : "#DC2626";
      if (!ok) allOk = false;
    });
    ["ready","joined"].forEach(function (rk) {
      var kind = rk === "ready" ? "ready" : "joined";
      var rows = collectRows(kind);
      var tot = 0;
      FLEETS.forEach(function (f) {
        var n = rows.filter(function (r) { return r.fleet === f; }).length;
        byId("auto_" + rk + "_" + f).textContent = n;
        tot += n;
      });
      byId("tot_" + rk).textContent = tot;
    });
    var mc = byId("matrixCheck");
    mc.className = allOk ? "check" : "check bad";
    mc.innerHTML = allOk ? "<b>&#10003;</b> Fleet totals match pipeline counts" : "<b>&#10007;</b> Fleet totals do not match the pipeline counts above";

  }

  // --- payload
  function collect() {
    var fleet = {};
    MANUAL_ROWS.forEach(function (r) {
      fleet[r[0]] = {};
      document.querySelectorAll('[data-mrow="' + r[0] + '"]').forEach(function (i) {
        fleet[r[0]][i.getAttribute("data-fleet")] = i.value === "" ? 0 : Number(i.value);
      });
    });
    return {
      month: monthSel.value,
      submittedBy: byId("submittedBy").value,
      website: byId("website").value,
      counts: {
        inProcess: byId("c_inProcess").value, interviewed: byId("c_interviewed").value,
        approved: byId("c_approved").value, rejected: byId("c_rejected").value,
        inVisa: byId("c_inVisa").value, inMedicals: byId("c_inMedicals").value,
        ready: byId("c_ready").value, big5Avg: byId("c_big5Avg").value
      },
      channels: { tcms: byId("ch_tcms").value, referrals: byId("ch_referrals").value, walkins: byId("ch_walkins").value },
      fleet: fleet,
      rejectionReasons: byId("rejectionReasons").value,
      people: { ready: collectRows("ready"), joined: collectRows("joined"), flags: collectRows("flags") },
      visaMedical: collectRows("visa"),
      compliance: collectRows("doc"),
      forecast: { joiners: byId("fc_joiners").value, roles: byId("fc_roles").value },
      signoffOutlook: byId("outlook").getAttribute("data-n") || "0",
      feedback: { positive: "", pain: "" },
      decisions: byId("decisions").value,
      observations: byId("observations").value
    };
  }

  function restore(p) {
    if (!p) return;
    if (p.month && [prevName, curName].indexOf(p.month) >= 0) monthSel.value = p.month;
    byId("submittedBy").value = p.submittedBy || "";
    var c = p.counts || {};
    ["inProcess","interviewed","approved","rejected","inVisa","inMedicals","ready","big5Avg"].forEach(function (k) {
      byId("c_" + k).value = c[k] !== undefined && c[k] !== null ? c[k] : "";
    });
    var ch = p.channels || {};
    byId("ch_tcms").value = ch.tcms !== undefined ? ch.tcms : "";
    byId("ch_referrals").value = ch.referrals !== undefined ? ch.referrals : "";
    byId("ch_walkins").value = ch.walkins !== undefined ? ch.walkins : "";
    var fl = p.fleet || {};
    MANUAL_ROWS.forEach(function (r) {
      var row = fl[r[0]] || {};
      document.querySelectorAll('[data-mrow="' + r[0] + '"]').forEach(function (i) {
        var v = row[i.getAttribute("data-fleet")];
        i.value = v !== undefined && v !== null ? v : "";
      });
    });
    byId("rejectionReasons").value = p.rejectionReasons || "";
    ["ready","joined","flags"].forEach(function (k) {
      clearRows(k);
      ((p.people || {})[k] || []).forEach(function (d) { addRow(k, d); });
    });
    clearRows("visa"); (p.visaMedical || []).forEach(function (d) { addRow("visa", d); });
    clearRows("doc"); (p.compliance || []).forEach(function (d) { addRow("doc", d); });
    var fc = p.forecast || {};
    byId("fc_joiners").value = fc.joiners !== undefined ? fc.joiners : "";
    byId("fc_roles").value = fc.roles || "";
    byId("decisions").value = p.decisions || "";
    byId("observations").value = p.observations || "";
  }

  // --- context load
  function applyPrefill(pf) {
    if (!pf) {
      byId("consoleNote").style.display = "none";
      byId("consoleWarn").style.display = "flex";
      return;
    }
    CREW = pf.crewNames || [];
    (pf.joined || []).forEach(function (j) { addRow("joined", { name: j.name, fleet: j.fleet, date: j.date, src: "console" }); });
    (pf.visaMedical || []).forEach(function (v) { addRow("visa", { name: v.name, fleet: v.fleet, type: v.type, note: v.note, overdue: v.overdue, src: "console" }); });
    (pf.compliance || []).forEach(function (d) { addRow("doc", { name: d.name, doc: d.doc, expires: d.expires, overdue: d.overdue, src: "console" }); });
    var tray = byId("tray");
    tray.innerHTML = "";
    if ((pf.awaiting || []).length) {
      byId("trayLabel").style.display = "block";
      pf.awaiting.forEach(function (e) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "tray-chip";
        chip.innerHTML = e.name + " <small>" + (e.fleet || "awaiting") + "</small>";
        chip.addEventListener("click", function () {
          addRow("ready", { name: e.name, fleet: e.fleet, src: "console" });
          chip.remove();
          markDirty(); refreshChecks();
        });
        tray.appendChild(chip);
      });
    }
    var soTray = byId("soTray");
    soTray.innerHTML = "";
    if ((pf.upcoming || []).length) {
      byId("soTrayLabel").style.display = "block";
      pf.upcoming.forEach(function (u) {
        var chip = document.createElement("span");
        chip.className = "tray-chip passive";
        chip.innerHTML = u.name + " <small>" + (u.ship || u.fleet || "") + " &middot; " + u.date + "</small>";
        soTray.appendChild(chip);
      });
    }
    if (pf.signoffOutlook !== undefined) {
      var o = byId("outlook");
      o.style.display = "block";
      o.setAttribute("data-n", String(pf.signoffOutlook));
      o.innerHTML = "Console: <b>" + pf.signoffOutlook + " projected sign-offs</b> in the next 60 days — relief demand to plan against.";
    }
  }

  function loadContext() {
    fetch("/api/context?k=" + encodeURIComponent(KEY) + "&month=" + encodeURIComponent(monthSel.value))
      .then(function (r) { return r.json(); })
      .then(function (res) {
        ctxLoaded = false;
        if (res.record && res.record.payload) {
          CREW = (res.prefill && res.prefill.crewNames) || [];
          restore(res.record.payload);
          if (res.prefill && res.prefill.signoffOutlook !== undefined) {
            var o = byId("outlook");
            o.style.display = "block";
            o.setAttribute("data-n", String(res.prefill.signoffOutlook));
            o.innerHTML = "Console: <b>" + res.prefill.signoffOutlook + " projected sign-offs</b> in the next 60 days — relief demand to plan against.";
          }
          if (!res.prefill) { byId("consoleNote").style.display = "none"; byId("consoleWarn").style.display = "flex"; }
          byId("revisedNote").style.display = res.record.status === "Submitted" ? "block" : "none";
        } else {
          applyPrefill(res.prefill);
          byId("revisedNote").style.display = "none";
        }
        ctxLoaded = true;
        refreshChecks();
      })
      .catch(function () {
        byId("consoleNote").style.display = "none";
        byId("consoleWarn").style.display = "flex";
        ctxLoaded = true;
      });
  }
  monthSel.addEventListener("change", function () {
    ["ready","joined","flags","visa","doc"].forEach(clearRows);
    byId("tray").innerHTML = ""; byId("trayLabel").style.display = "none";
    loadContext();
  });
  loadContext();

  // --- autosave
  function markDirty() { dirty = true; scheduleSave(); }
  function scheduleSave() {
    if (!ctxLoaded) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraft, 2500);
  }
  document.addEventListener("input", function () { markDirty(); refreshChecks(); });
  function saveDraft() {
    if (!dirty || !ctxLoaded) return;
    dirty = false;
    fetch("/api/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ k: KEY, payload: collect() })
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (res.ok) {
        var d = new Date(Date.now() + 8 * 3600 * 1000);
        var hh = String(d.getUTCHours()).padStart(2, "0"), mm = String(d.getUTCMinutes()).padStart(2, "0");
        byId("savetext").textContent = "Draft saved " + hh + ":" + mm;
        byId("savebar").style.display = "block";
      }
    }).catch(function () {});
  }

  // --- submit
  byId("f").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var btn = byId("submitBtn");
    btn.disabled = true; btn.textContent = "Submitting…";
    var errBox = byId("errors");
    errBox.style.display = "none"; errBox.innerHTML = "";
    fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ k: KEY, payload: collect() })
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (res.ok) {
        byId("f").style.display = "none";
        if (res.revised) {
          byId("successTitle").textContent = "Revised update sent";
          byId("successText").innerHTML = "The corrected update has been emailed to the team, marked REVISED.";
        }
        var extra = "";
        if (res.warnings && res.warnings.length) extra += "<br><br>Noted in the email: " + res.warnings.join(" ");
        if (res.emailSkipped) extra += "<br><br>(Email sending not configured yet — the data was saved.)";
        if (extra) byId("successText").innerHTML += extra;
        byId("success").style.display = "block";
        byId("savebar").style.display = "none";
        window.scrollTo(0, 0);
      } else {
        (res.errors || ["Something went wrong. Please try again."]).forEach(function (e) {
          var p = document.createElement("p"); p.textContent = "• " + e; errBox.appendChild(p);
        });
        errBox.style.display = "block";
        btn.disabled = false; btn.textContent = "Submit — send update to the team";
        errBox.scrollIntoView({ behavior: "smooth" });
      }
    }).catch(function () {
      errBox.innerHTML = "<p>• Could not reach the server. Check your connection and try again.</p>";
      errBox.style.display = "block";
      btn.disabled = false; btn.textContent = "Submit — send update to the team";
    });
  });
})();
</script>
</body>
</html>`;
