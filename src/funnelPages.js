// Public applicant-facing pages: /apply and /verify.
// NOTE: template literals must contain no backticks and no dollar-brace sequences.

const HEAD = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>DG3 CIMS Recruitment</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--navy:#1B3A5C;--green:#5FB946;--line:#E3E9F0;--ink:#22303E;--mut:#6B7C93;--red:#BC3B2C}
*{box-sizing:border-box}body{margin:0;font-family:'DM Sans',sans-serif;background:#F4F7FA;color:var(--ink)}
.top{background:linear-gradient(100deg,var(--navy) 60%,#2A5580);padding:18px 20px}
.top .brand{color:var(--green);font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase}
.top h1{color:#fff;font-family:Outfit;font-size:20px;margin:2px 0 0}
.wrap{max-width:560px;margin:24px auto;padding:0 14px}
.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:22px 22px;box-shadow:0 1px 3px rgba(20,45,72,.06)}
label{display:block;font-size:12px;font-weight:700;color:var(--navy);letter-spacing:.4px;margin:14px 0 5px}
input[type=text],input[type=email],input[type=tel],input[type=url],select{width:100%;padding:10px 12px;border:1px solid var(--line);border-radius:9px;font:500 14px 'DM Sans';color:var(--ink);background:#FBFCFE}
input:focus,select:focus{outline:2px solid rgba(95,185,70,.35);border-color:var(--green)}
.row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.chk{display:flex;align-items:flex-start;gap:9px;margin:12px 0 0;font-size:13px;line-height:1.45}
.chk input{margin-top:2px;width:16px;height:16px;accent-color:var(--green)}
button{width:100%;margin-top:18px;background:var(--green);border:0;color:#fff;font:700 15px 'DM Sans';padding:13px;border-radius:10px;cursor:pointer}
button:disabled{opacity:.55;cursor:default}
.hint{font-size:12px;color:var(--mut);margin-top:4px}
.err{background:#FBEEED;border-left:3px solid var(--red);border-radius:0 8px 8px 0;padding:9px 12px;font-size:13px;color:#7a2c22;margin-top:14px;display:none}
.okpane{display:none;text-align:center;padding:26px 8px}
.okpane .big{font-family:Outfit;font-size:20px;color:var(--navy);margin:10px 0 8px}
.okpane p{font-size:13.5px;color:#3d4c5c;line-height:1.55}
.steps{background:#EDF7E8;border-left:3px solid var(--green);border-radius:0 10px 10px 0;padding:12px 14px;font-size:13px;line-height:1.6;margin:4px 0 6px}
.hp{position:absolute;left:-5000px;top:-5000px}
.foot{text-align:center;color:var(--mut);font-size:11px;margin:18px 0}
</style></head><body>`;

export const APPLY_HTML = HEAD + `
<div class="top"><div class="brand">DG3 Cruise Industry Managed Services</div><h1>Apply — Shipboard Positions</h1></div>
<div class="wrap">
 <div class="card" id="formCard">
  <p style="font-size:13.5px;color:#3d4c5c;margin:0 0 4px;line-height:1.55">Complete the form below. Your <b>email address is your applicant ID</b> for the whole process — use one you check daily.</p>
  <form id="f" autocomplete="on">
   <label>Full name</label><input type="text" id="name" placeholder="Last name, First name" maxlength="120">
   <div class="row">
    <div><label>Email address</label><input type="email" id="email" placeholder="you@example.com" maxlength="120"></div>
    <div><label>Phone (incl. country code)</label><input type="tel" id="phone" placeholder="+63 9xx xxx xxxx" maxlength="40"></div>
   </div>
   <label>Position applying for</label><input type="text" id="position" placeholder="e.g. Printer Specialist" maxlength="80">
   <div class="row">
    <div><label>How did you hear about us?</label>
     <select id="source"><option value="">Select…</option><option>TCMS website</option><option>Crew referral</option><option>Walk-in</option></select></div>
    <div id="refWrap" style="display:none"><label>Referring crew member</label><input type="text" id="referrer" placeholder="Their full name" maxlength="80"></div>
   </div>
   <div class="row" style="margin-top:10px">
    <label class="chk" style="margin:0"><input type="checkbox" id="shipboard"> I have worked on a commercial vessel</label>
    <label class="chk" style="margin:0"><input type="checkbox" id="printer"> I have print/production experience</label>
   </div>
   <label>Resume link <span style="color:var(--mut);font-weight:500">(optional — Google Drive / OneDrive share link)</span></label>
   <input type="url" id="resumeLink" placeholder="https://…" maxlength="500">
   <div class="hint">No link? No problem — you can provide your resume later in the process.</div>
   <input class="hp" type="text" id="website" tabindex="-1" autocomplete="off">
   <label class="chk"><input type="checkbox" id="consent"> I consent to DG3 CIMS processing my application data for recruitment purposes.</label>
   <div class="err" id="err"></div>
   <button id="go" type="submit">Submit application</button>
  </form>
 </div>
 <div class="card okpane" id="done">
  <div style="font-size:34px">&#9993;</div>
  <div class="big">Application received — check your email</div>
  <p>We have sent you the next step: a short assessment (about 10 minutes). Complete it within <b>7 days</b>, copy the Result ID at the end, and submit it on the verification page linked in the email.</p>
 </div>
 <div class="foot">DG3 CIMS Recruitment</div>
</div>
<script>
var src=document.getElementById('source');
src.addEventListener('change',function(){document.getElementById('refWrap').style.display = src.value==='Crew referral'?'block':'none';});
document.getElementById('f').addEventListener('submit',function(ev){
 ev.preventDefault();
 var b=document.getElementById('go');b.disabled=true;
 var payload={
  name:document.getElementById('name').value,
  email:document.getElementById('email').value,
  phone:document.getElementById('phone').value,
  position:document.getElementById('position').value,
  source:src.value,
  referrer:document.getElementById('referrer').value,
  shipboard:document.getElementById('shipboard').checked,
  printer:document.getElementById('printer').checked,
  resumeLink:document.getElementById('resumeLink').value,
  consent:document.getElementById('consent').checked,
  website:document.getElementById('website').value
 };
 fetch('/api/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
 .then(function(r){return r.json();})
 .then(function(d){
  if(d.ok){document.getElementById('formCard').style.display='none';document.getElementById('done').style.display='block';window.scrollTo(0,0);}
  else{var e=document.getElementById('err');e.textContent=(d.errors||['Something went wrong.']).join(' ');e.style.display='block';b.disabled=false;}
 })
 .catch(function(){var e=document.getElementById('err');e.textContent='Network error — please try again.';e.style.display='block';b.disabled=false;});
});
</script></body></html>`;

export const VERIFY_HTML = HEAD + `
<div class="top"><div class="brand">DG3 Cruise Industry Managed Services</div><h1>Submit your assessment Result ID</h1></div>
<div class="wrap">
 <div class="card" id="formCard">
  <div class="steps"><b>1.</b> Take the test at bigfive-test.com &nbsp;&#8594;&nbsp; <b>2.</b> copy the Result ID shown at the end &nbsp;&#8594;&nbsp; <b>3.</b> submit it here with your email.</div>
  <form id="f">
   <label>Your email address <span style="color:var(--mut);font-weight:500">(the one you applied with — it is your applicant ID)</span></label>
   <input type="email" id="email" placeholder="you@example.com" maxlength="120">
   <label>Result ID</label>
   <input type="text" id="rid" placeholder="e.g. 69fafe05540c3865e63a19f6" maxlength="40" style="font-family:monospace">
   <div class="hint">The long code on your results page next to &quot;Save the following ID&quot;.</div>
   <input class="hp" type="text" id="website" tabindex="-1" autocomplete="off">
   <div class="err" id="err"></div>
   <button id="go" type="submit">Submit result</button>
  </form>
 </div>
 <div class="card okpane" id="done">
  <div style="font-size:34px">&#10003;</div>
  <div class="big">Result received — check your email</div>
  <p>Your assessment has been recorded. You will receive an email shortly with the outcome and, if you advance, the next step of the process.</p>
 </div>
 <div class="foot">DG3 CIMS Recruitment</div>
</div>
<script>
document.getElementById('f').addEventListener('submit',function(ev){
 ev.preventDefault();
 var b=document.getElementById('go');b.disabled=true;
 var payload={
  email:document.getElementById('email').value,
  resultId:document.getElementById('rid').value,
  website:document.getElementById('website').value
 };
 fetch('/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
 .then(function(r){return r.json();})
 .then(function(d){
  if(d.ok){document.getElementById('formCard').style.display='none';document.getElementById('done').style.display='block';window.scrollTo(0,0);}
  else{var e=document.getElementById('err');e.textContent=(d.errors||['Something went wrong.']).join(' ');e.style.display='block';b.disabled=false;}
 })
 .catch(function(){var e=document.getElementById('err');e.textContent='Network error — please try again.';e.style.display='block';b.disabled=false;});
});
</script></body></html>`;
