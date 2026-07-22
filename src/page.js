// The public landing page served at recruitment.cims.work
// NOTE: this file is a JS template literal — no backticks or dollar-brace
// sequences may appear inside the HTML/client-JS below.

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
    --light-slate:#9CA3AF; --cloud:#F3F4F6; --border:#E5E7EB; --red:#DC2626;
  }
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#EEF1F4; font-family:'DM Sans',sans-serif; color:var(--navy); padding-bottom:60px; }
  .topbar { height:4px; background:linear-gradient(90deg, var(--navy) 60%, var(--green) 60%); }
  .hero { background:var(--navy); padding:34px 0 42px; }
  .hero-inner { max-width:760px; margin:0 auto; padding:0 24px; }
  .wordmark { display:flex; align-items:center; gap:8px; margin-bottom:30px; }
  .wm-cims { font-family:'Outfit',sans-serif; font-size:16px; font-weight:700; color:#fff; letter-spacing:3px; }
  .wm-bar { width:1.5px; height:12px; background:var(--green); }
  .wm-dg3 { font-family:'Outfit',sans-serif; font-size:10px; font-weight:600; color:var(--green); letter-spacing:1.5px; }
  .hero h1 { font-family:'Outfit',sans-serif; font-size:26px; font-weight:600; color:#fff; letter-spacing:-0.2px; }
  .hero .meta-line { display:flex; flex-wrap:wrap; gap:6px 22px; margin-top:14px; font-size:12px; color:rgba(255,255,255,0.55); }
  .hero .meta-line span { display:inline-flex; align-items:center; gap:7px; }
  .hero .meta-line i { width:5px; height:5px; border-radius:50%; background:var(--green); font-style:normal; }
  .sheet { max-width:760px; margin:-16px auto 0; padding:0 24px; }
  .card { background:#fff; border:1px solid var(--border); border-radius:10px; padding:20px 22px; margin-bottom:12px; }
  .sec-label { font-size:9px; font-weight:700; color:var(--green); letter-spacing:2.5px; text-transform:uppercase; margin-bottom:4px; }
  .sec-hint { font-size:11.5px; color:var(--light-slate); margin-bottom:14px; line-height:1.5; }
  label { display:block; font-size:11.5px; font-weight:600; color:var(--slate); margin-bottom:5px; }
  input[type=text], input[type=number], select, textarea {
    width:100%; border:1.5px solid var(--border); border-radius:6px;
    font-family:'DM Sans',sans-serif; font-size:14px; color:var(--navy); background:#fff; outline:none;
  }
  input[type=text], input[type=number], select { height:42px; padding:0 12px; }
  select { -webkit-appearance:none; appearance:none;
    background-image:url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236B7280' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
    background-repeat:no-repeat; background-position:right 12px center; padding-right:30px; }
  input:focus, textarea:focus, select:focus { border-color:var(--green); }
  ::placeholder { color:#C4C9D0; }
  textarea { resize:vertical; min-height:64px; line-height:1.5; padding:10px 12px; }
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
  .matrix input { text-align:center; font-family:'Outfit',sans-serif; font-weight:600; font-size:15px; height:38px; padding:0 2px; }
  .matrix .tot { text-align:center; font-family:'Outfit',sans-serif; font-weight:700; font-size:15px; color:var(--navy); background:var(--cloud); border-radius:6px; height:38px; min-width:44px; }
  .check { margin-top:10px; font-size:10.5px; color:var(--slate); }
  .check b { color:var(--green); }
  .check.bad b { color:var(--red); }
  .prow { display:grid; gap:8px; margin-bottom:8px; align-items:center; }
  .prow.deploy { grid-template-columns:1fr 92px 118px; }
  .prow.joined { grid-template-columns:1fr 92px; }
  .prow.flag { grid-template-columns:1fr 92px 1.2fr; }
  .prow.visa { grid-template-columns:1fr 82px 140px 1fr; }
  .prow.doc { grid-template-columns:1fr 170px 118px; }
  .rowhead { margin-bottom:4px; }
  .rowhead label { margin-bottom:0; }
  .addrow { display:inline-block; font-size:11.5px; font-weight:700; color:var(--green); cursor:pointer; margin-top:2px; background:none; border:none; font-family:'DM Sans',sans-serif; }
  .addrow:hover { text-decoration:underline; }
  .subgroup + .subgroup { margin-top:18px; padding-top:16px; border-top:1px solid var(--cloud); }
  .submit-wrap { text-align:center; margin-top:20px; }
  .submit {
    background:var(--green); border:none; cursor:pointer; color:#fff; font-family:'Outfit',sans-serif;
    font-size:14px; font-weight:600; letter-spacing:.5px; padding:14px 34px; border-radius:8px;
    box-shadow:0 2px 10px rgba(95,185,70,0.35);
  }
  .submit:disabled { opacity:.6; cursor:wait; }
  .submit-note { font-size:10.5px; color:var(--slate); margin-top:10px; line-height:1.6; }
  .submit-note b { color:var(--navy); }
  .errors { display:none; background:#FDF0F0; border-left:3px solid var(--red); border-radius:0 8px 8px 0; padding:12px 16px; margin-bottom:12px; }
  .errors p { font-size:12.5px; color:var(--navy); margin:2px 0; }
  .success { display:none; text-align:center; padding:60px 24px; }
  .success .big { font-size:44px; }
  .success h2 { font-family:'Outfit',sans-serif; font-size:22px; margin-top:10px; }
  .success p { font-size:13.5px; color:var(--slate); margin-top:8px; line-height:1.6; }
  .foot { text-align:center; font-size:8px; color:var(--light-slate); margin-top:26px; letter-spacing:.5px; }
  .hp { position:absolute; left:-9999px; opacity:0; height:0; overflow:hidden; }
</style>
</head>
<body>
<div class="topbar"></div>

<div class="hero">
  <div class="hero-inner">
    <div class="wordmark"><span class="wm-cims">CIMS</span><div class="wm-bar"></div><span class="wm-dg3">DG3</span></div>
    <h1>Monthly Recruitment Submission</h1>
    <div class="meta-line">
      <span><i></i>Covers the month just ended</span>
      <span><i></i>About 10 minutes</span>
      <span><i></i>Emails the team automatically on submit</span>
    </div>
  </div>
</div>

<div class="sheet">
  <div class="success" id="success">
    <div class="big">&#9989;</div>
    <h2 id="successTitle">Submitted</h2>
    <p id="successText">The update has been compiled and emailed to Miguel, Rita and the team.<br>You will receive your own copy — present from it in the monthly meeting.</p>
  </div>

  <form id="f" autocomplete="off">
  <div class="card">
    <div class="sec-label">Reporting Month</div>
    <div class="sec-hint">One submission per month. Submitting the same month again sends a REVISED update.</div>
    <div class="row c2">
      <div><label>Month</label><select id="month"></select></div>
      <div><label>Submitted by</label><input type="text" id="submittedBy" value="Yanna"></div>
    </div>
    <div class="hp"><label>Website</label><input type="text" id="website" tabindex="-1"></div>
  </div>

  <div class="card">
    <div class="sec-label">Pipeline Counts</div>
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
    <div class="sec-label">By Fleet</div>
    <div class="sec-hint">Totals compute automatically and must match the counts above.</div>
    <table class="matrix" id="matrix"></table>
    <div class="check" id="matrixCheck"><b>&#10003;</b> <span>Fleet totals match pipeline counts</span></div>
  </div>

  <div class="card">
    <div class="sec-label">Sourcing Channels</div>
    <div class="sec-hint">Where the in-process candidates came from — must add up to In process above.</div>
    <div class="row c3">
      <div><label>TCMS website</label><input type="number" min="0" id="ch_tcms"></div>
      <div><label>Crew referrals</label><input type="number" min="0" id="ch_referrals"></div>
      <div><label>Walk-ins</label><input type="number" min="0" id="ch_walkins"></div>
    </div>
    <div class="check" id="chCheck"><b>&#10003;</b> <span>Channels add up to In process</span></div>
  </div>

  <div class="card">
    <div class="sec-label">Rejections</div>
    <div class="sec-hint">Counts should add up to the Rejected number above.</div>
    <input type="text" id="rejectionReasons" placeholder="e.g. 11 not the best candidate &middot; 4 failed Big 5 / psych &middot; 1 not eligible for rehire">
  </div>

  <div class="card">
    <div class="sec-label">People</div>
    <div class="sec-hint">One row per person — this is what makes the report clean. Leave empty if none.</div>
    <div class="subgroup">
      <div class="prow deploy rowhead"><label>Ready to deploy</label><label>Fleet</label><label>Join date</label></div>
      <div id="rows_ready"></div>
      <button type="button" class="addrow" data-add="ready">+ Add person</button>
    </div>
    <div class="subgroup">
      <div class="prow joined rowhead"><label>Joined this month</label><label>Fleet</label></div>
      <div id="rows_joined"></div>
      <button type="button" class="addrow" data-add="joined">+ Add person</button>
    </div>
    <div class="subgroup">
      <div class="prow flag rowhead"><label>Not returning / red flag</label><label>Fleet</label><label>Reason</label></div>
      <div id="rows_flags"></div>
      <button type="button" class="addrow" data-add="flags">+ Add person</button>
    </div>
  </div>

  <div class="card">
    <div class="sec-label">Visa &amp; Medical Issues</div>
    <div class="sec-hint">One row per case. Leave empty if the month is clean.</div>
    <div class="prow visa rowhead"><label>Name</label><label>Fleet</label><label>Type</label><label>Note</label></div>
    <div id="rows_visa"></div>
    <button type="button" class="addrow" data-add="visa">+ Add case</button>
  </div>

  <div class="card">
    <div class="sec-label">Compliance Flags</div>
    <div class="sec-hint">One row per document.</div>
    <div class="prow doc rowhead"><label>Crew name</label><label>Document</label><label>Expires</label></div>
    <div id="rows_doc"></div>
    <button type="button" class="addrow" data-add="doc">+ Add document</button>
  </div>

  <div class="card">
    <div class="sec-label">Forecast — Next 60–90 Days</div>
    <div class="row c2">
      <div><label>Forecast joiners</label><input type="number" min="0" id="fc_joiners"></div>
      <div><label>Roles to source now</label><input type="text" id="fc_roles" placeholder="e.g. 20 Printer Specialists — new ship"></div>
    </div>
  </div>

  <div class="card">
    <div class="sec-label">Candidate Feedback</div>
    <div class="row c2">
      <div><label>Positive</label><input type="text" id="fb_pos" placeholder="e.g. Crew Referral Program"></div>
      <div><label>Pain point</label><input type="text" id="fb_pain" placeholder="e.g. Policy on rejected applicants"></div>
    </div>
  </div>

  <div class="card">
    <div class="sec-label">Decisions &amp; Observations</div>
    <div class="field"><label>Decisions needed from Miguel — write NONE if nothing needs a call</label>
      <input type="text" id="decisions" placeholder="NONE"></div>
    <div class="field"><label>Your observations — anything the team should know</label>
      <textarea id="observations" placeholder="Incidents, process friction, candidate stories, cost issues&hellip;"></textarea></div>
  </div>

  <div class="errors" id="errors"></div>

  <div class="submit-wrap">
    <button class="submit" id="submitBtn" type="submit">Submit — send update to the team</button>
    <div class="submit-note">Sends immediately to <b>Miguel &amp; Rita</b> &middot; cc the CIMS team.<br>You'll receive your own copy — you present from it in the monthly meeting.</div>
  </div>
  </form>

  <div class="foot">CIMS — CRUISE INDUSTRY MANAGED SERVICES &middot; A DIVISION OF DG3 &middot; CONFIDENTIAL</div>
</div>

<script>
(function () {
  "use strict";
  var FLEETS = ["RCL", "CEL", "AZ", "NCL"];
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  // --- month options: previous month (default) + current month, Manila time
  var mnl = new Date(Date.now() + 8 * 3600 * 1000);
  var y = mnl.getUTCFullYear(), m = mnl.getUTCMonth();
  var prevName = MONTHS[m === 0 ? 11 : m - 1] + " " + (m === 0 ? y - 1 : y);
  var curName = MONTHS[m] + " " + y;
  var monthSel = document.getElementById("month");
  [prevName, curName].forEach(function (n) {
    var o = document.createElement("option"); o.value = n; o.textContent = n; monthSel.appendChild(o);
  });

  // --- fleet matrix
  var MATRIX_ROWS = [["approved","Approved","c_approved"],["visa","Visa","c_inVisa"],["medicals","Medicals","c_inMedicals"],["ready","Ready","c_ready"],["joined","Joined",null]];
  var matrix = document.getElementById("matrix");
  var head = "<tr><th>Stage</th>";
  FLEETS.forEach(function (f) { head += "<th>" + f + "</th>"; });
  head += "<th>Total</th></tr>";
  matrix.innerHTML = head;
  MATRIX_ROWS.forEach(function (r) {
    var tr = document.createElement("tr");
    var html = "<td>" + r[1] + "</td>";
    FLEETS.forEach(function (f) {
      html += '<td><input type="number" min="0" data-mrow="' + r[0] + '" data-fleet="' + f + '"></td>';
    });
    html += '<td class="tot" id="tot_' + r[0] + '">0</td>';
    tr.innerHTML = html;
    matrix.appendChild(tr);
  });

  function num(el) { var v = el && el.value; var n = Number(v); return v === "" || isNaN(n) ? 0 : n; }
  function byId(id) { return document.getElementById(id); }

  function refreshChecks() {
    var allOk = true;
    MATRIX_ROWS.forEach(function (r) {
      var s = 0;
      document.querySelectorAll('[data-mrow="' + r[0] + '"]').forEach(function (i) { s += num(i); });
      var cell = byId("tot_" + r[0]);
      cell.textContent = s;
      if (r[2]) {
        var want = num(byId(r[2]));
        var ok = byId(r[2]).value === "" || s === want;
        cell.style.color = ok ? "" : "#DC2626";
        if (!ok) allOk = false;
      }
    });
    var mc = byId("matrixCheck");
    mc.className = allOk ? "check" : "check bad";
    mc.innerHTML = allOk ? "<b>&#10003;</b> Fleet totals match pipeline counts" : "<b>&#10007;</b> Fleet totals do not match the pipeline counts above";

    var chSum = num(byId("ch_tcms")) + num(byId("ch_referrals")) + num(byId("ch_walkins"));
    var ip = byId("c_inProcess");
    var chOk = ip.value === "" || chSum === num(ip);
    var cc = byId("chCheck");
    cc.className = chOk ? "check" : "check bad";
    cc.innerHTML = chOk ? "<b>&#10003;</b> Channels add up to In process" : "<b>&#10007;</b> Channels total " + chSum + " but In process is " + num(ip);
  }
  document.addEventListener("input", refreshChecks);

  // --- repeatable people rows
  function mkInput(ph) { var i = document.createElement("input"); i.type = "text"; i.placeholder = ph || ""; return i; }
  function mkFleetSel(extra) {
    var s = document.createElement("select");
    (extra ? extra.concat(FLEETS) : FLEETS).forEach(function (f) {
      var o = document.createElement("option"); o.value = f; o.textContent = f; s.appendChild(o);
    });
    return s;
  }
  var ROWDEFS = {
    ready:  { host: "rows_ready", cls: "prow deploy", make: function () { return [mkInput("Name"), mkFleetSel(), mkInput("e.g. 02 Aug")]; } },
    joined: { host: "rows_joined", cls: "prow joined", make: function () { return [mkInput("Name"), mkFleetSel()]; } },
    flags:  { host: "rows_flags", cls: "prow flag", make: function () { return [mkInput("Name"), mkFleetSel(["Unassigned"]), mkInput("Reason")]; } },
    visa:   { host: "rows_visa", cls: "prow visa", make: function () {
                var t = document.createElement("select");
                ["Visa denied","Visa delay","Medical incident","Reschedule"].forEach(function (x) {
                  var o = document.createElement("option"); o.value = x; o.textContent = x; t.appendChild(o);
                });
                return [mkInput("Name"), mkFleetSel(), t, mkInput("Note")];
              } },
    doc:    { host: "rows_doc", cls: "prow doc", make: function () {
                var d = document.createElement("select");
                ["Drug & Alcohol Test","Medical","US Visa","Chinese Visa","SIRB","BT Refresher / PSSR","STCW","Passport","Other"].forEach(function (x) {
                  var o = document.createElement("option"); o.value = x; o.textContent = x; d.appendChild(o);
                });
                return [mkInput("Crew name"), d, mkInput("e.g. Sep 2026")];
              } },
  };
  function addRow(kind) {
    var def = ROWDEFS[kind];
    var row = document.createElement("div");
    row.className = def.cls;
    row.setAttribute("data-kind", kind);
    def.make().forEach(function (el) { row.appendChild(el); });
    byId(def.host).appendChild(row);
  }
  document.querySelectorAll(".addrow").forEach(function (b) {
    b.addEventListener("click", function () { addRow(b.getAttribute("data-add")); });
  });
  addRow("ready"); addRow("joined"); addRow("flags"); addRow("visa"); addRow("doc");

  function collectRows(kind, keys) {
    var out = [];
    document.querySelectorAll('[data-kind="' + kind + '"]').forEach(function (row) {
      var els = row.querySelectorAll("input, select");
      var o = {}, any = false;
      keys.forEach(function (k, i) {
        var v = (els[i] && els[i].value || "").trim();
        o[k] = v;
        if (v && els[i].tagName === "INPUT") any = true;
      });
      if (any) out.push(o);
    });
    return out;
  }

  // --- submit
  var form = byId("f");
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var fleet = {};
    MATRIX_ROWS.forEach(function (r) {
      fleet[r[0]] = {};
      document.querySelectorAll('[data-mrow="' + r[0] + '"]').forEach(function (i) {
        fleet[r[0]][i.getAttribute("data-fleet")] = i.value === "" ? 0 : Number(i.value);
      });
    });
    var payload = {
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
      people: {
        ready: collectRows("ready", ["name","fleet","date"]),
        joined: collectRows("joined", ["name","fleet"]),
        flags: collectRows("flags", ["name","fleet","reason"])
      },
      visaMedical: collectRows("visa", ["name","fleet","type","note"]),
      compliance: collectRows("doc", ["name","doc","expires"]),
      forecast: { joiners: byId("fc_joiners").value, roles: byId("fc_roles").value },
      feedback: { positive: byId("fb_pos").value, pain: byId("fb_pain").value },
      decisions: byId("decisions").value,
      observations: byId("observations").value
    };

    var btn = byId("submitBtn");
    btn.disabled = true; btn.textContent = "Submitting…";
    var errBox = byId("errors");
    errBox.style.display = "none"; errBox.innerHTML = "";

    fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (res.ok) {
        form.style.display = "none";
        var s = byId("success");
        if (res.revised) {
          byId("successTitle").textContent = "Revised update sent";
          byId("successText").innerHTML = "The corrected " + payload.month + " update has been emailed to the team, marked REVISED.";
        }
        if (res.emailSkipped) {
          byId("successText").innerHTML += "<br><br>(Note: email sending is not configured yet — the data was saved.)";
        }
        s.style.display = "block";
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
