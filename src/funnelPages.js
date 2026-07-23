// Public applicant-facing pages: /apply and /verify.
// NOTE: template literals must contain no backticks and no dollar-brace sequences.

const HEAD = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>DG3 CIMS Recruitment</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--navy:#122C47;--navy2:#1B3A5C;--green:#5FB946;--green2:#4CA338;--line:#E4EAF2;--ink:#1C2A38;--mut:#7186A0;--red:#C2402F;--bg:#EFF3F9}
*{box-sizing:border-box}
body{margin:0;font-family:'DM Sans',sans-serif;color:var(--ink);min-height:100vh;
 background:radial-gradient(1100px 500px at 85% -10%,rgba(95,185,70,.16),transparent 60%),
            radial-gradient(900px 600px at -10% 110%,rgba(27,58,92,.12),transparent 55%),var(--bg)}
.shell{max-width:640px;margin:0 auto;padding:34px 16px 40px}
.brandrow{display:flex;align-items:center;gap:10px;margin-bottom:22px}
.mark{width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,var(--navy2),#2A5580);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(18,44,71,.25)}
.mark svg{display:block}
.brandrow .t1{font-family:Outfit;font-weight:800;font-size:16px;color:var(--navy);letter-spacing:2.5px}
.brandrow .t2{font-size:10.5px;font-weight:700;letter-spacing:2px;color:var(--mut);text-transform:uppercase}
h1{font-family:Outfit;font-size:clamp(24px,5vw,31px);font-weight:800;color:var(--navy);margin:0 0 6px;letter-spacing:-.3px}
.sub{font-size:14.5px;color:#43566d;line-height:1.6;margin:0 0 22px;max-width:520px}
.steps{display:flex;gap:8px;margin:0 0 26px}
.step{flex:1;text-align:center;font-size:11px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;color:var(--mut);padding:9px 4px 11px;border-radius:11px;background:#fff;border:1px solid var(--line);position:relative}
.step b{display:block;font-family:Outfit;font-size:15px;margin-bottom:1px}
.step.on{color:#fff;background:linear-gradient(135deg,var(--green),var(--green2));border-color:transparent;box-shadow:0 8px 18px rgba(95,185,70,.35)}
.card{background:rgba(255,255,255,.92);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.9);border-radius:22px;padding:28px;box-shadow:0 18px 44px rgba(18,44,71,.10),0 2px 6px rgba(18,44,71,.05)}
label{display:block;font-size:12.5px;font-weight:700;color:var(--navy);margin:18px 0 7px}
label .opt{color:var(--mut);font-weight:500}
input[type=text],input[type=email],input[type=tel],select{width:100%;padding:13px 15px;border:1.5px solid var(--line);border-radius:12px;font:500 15px 'DM Sans';color:var(--ink);background:#FAFCFE;transition:border-color .15s,box-shadow .15s;appearance:none}
select{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237186A0' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 15px center}
input:focus,select:focus{outline:none;border-color:var(--green);box-shadow:0 0 0 4px rgba(95,185,70,.18)}
input::placeholder{color:#A9B7C9}
.row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:560px){.row{grid-template-columns:1fr}}
.pills{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px}
@media(max-width:560px){.pills{grid-template-columns:1fr}}
.pill{display:flex;align-items:center;gap:10px;border:1.5px solid var(--line);border-radius:12px;padding:12px 14px;font-size:13.5px;font-weight:600;color:#43566d;cursor:pointer;background:#FAFCFE;transition:all .15s;user-select:none}
.pill input{display:none}
.pill .box{width:20px;height:20px;border-radius:6px;border:2px solid #C7D2E0;flex:0 0 20px;display:flex;align-items:center;justify-content:center;transition:all .15s}
.pill .box svg{opacity:0;transform:scale(.5);transition:all .15s}
.pill.sel{border-color:var(--green);background:#F2FAEE;color:var(--navy)}
.pill.sel .box{background:var(--green);border-color:var(--green)}
.pill.sel .box svg{opacity:1;transform:scale(1)}
.drop{margin-top:8px;border:2px dashed #C2CEDD;border-radius:16px;background:#FAFCFE;padding:26px 18px;text-align:center;cursor:pointer;transition:all .18s}
.drop.over{border-color:var(--green);background:#F2FAEE;transform:scale(1.01)}
.drop .ic{font-size:26px;line-height:1;margin-bottom:8px}
.drop .l1{font-size:14.5px;font-weight:700;color:var(--navy)}
.drop .l1 span{color:var(--green);text-decoration:underline}
.drop .l2{font-size:12px;color:var(--mut);margin-top:4px}
.filechip{display:none;margin-top:8px;align-items:center;gap:12px;background:#F2FAEE;border:1.5px solid var(--green);border-radius:12px;padding:12px 14px}
.filechip .fic{width:36px;height:36px;border-radius:9px;background:var(--green);color:#fff;display:flex;align-items:center;justify-content:center;font:700 11px Outfit;flex:0 0 36px}
.filechip .fn{font-size:13.5px;font-weight:700;color:var(--navy);word-break:break-all}
.filechip .fs{font-size:11.5px;color:var(--mut)}
.filechip .rm{margin-left:auto;border:0;background:transparent;color:var(--mut);font-size:18px;cursor:pointer;padding:4px 8px;width:auto}
.consent{display:flex;align-items:flex-start;gap:11px;margin:20px 0 0;font-size:13px;line-height:1.5;color:#43566d;cursor:pointer;user-select:none}
.consent .box{margin-top:1px;width:20px;height:20px;border-radius:6px;border:2px solid #C7D2E0;flex:0 0 20px;display:flex;align-items:center;justify-content:center;transition:all .15s}
.consent .box svg{opacity:0;transition:all .15s}
.consent.sel .box{background:var(--green);border-color:var(--green)}
.consent.sel .box svg{opacity:1}
.consent input{display:none}
button.cta{width:100%;margin-top:22px;background:linear-gradient(135deg,var(--green),var(--green2));border:0;color:#fff;font:700 16px 'DM Sans';padding:15px;border-radius:13px;cursor:pointer;box-shadow:0 10px 24px rgba(95,185,70,.38);transition:transform .12s,box-shadow .12s}
button.cta:hover{transform:translateY(-1px);box-shadow:0 14px 28px rgba(95,185,70,.42)}
button.cta:disabled{opacity:.55;cursor:default;transform:none;box-shadow:none}
.err{background:#FCEFEC;border-left:3px solid var(--red);border-radius:0 10px 10px 0;padding:11px 14px;font-size:13px;color:#7a2c22;margin-top:16px;display:none}
.okpane{display:none;text-align:center;padding:30px 10px}
.okpane .ring{width:74px;height:74px;border-radius:50%;margin:0 auto 16px;background:linear-gradient(135deg,var(--green),var(--green2));display:flex;align-items:center;justify-content:center;box-shadow:0 14px 30px rgba(95,185,70,.4);animation:pop .5s cubic-bezier(.2,1.6,.4,1)}
@keyframes pop{0%{transform:scale(.4);opacity:0}100%{transform:scale(1);opacity:1}}
.okpane .big{font-family:Outfit;font-size:22px;font-weight:800;color:var(--navy);margin:0 0 10px}
.okpane p{font-size:14px;color:#43566d;line-height:1.6;max-width:420px;margin:0 auto}
.callout{background:#F2FAEE;border-left:3px solid var(--green);border-radius:0 12px 12px 0;padding:13px 16px;font-size:13.5px;line-height:1.6;margin:0 0 6px;color:#33591f}
.hp{position:absolute;left:-5000px;top:-5000px}
.foot{text-align:center;color:var(--mut);font-size:11px;margin-top:22px;letter-spacing:.5px}
.hint{font-size:12px;color:var(--mut);margin-top:6px}
</style></head><body>`;

const MARK = `<div class="mark"><svg width="20" height="20" viewBox="0 0 34 34" fill="none"><rect x="4" y="2" width="20" height="26" rx="2" stroke="#5FB946" stroke-width="2.2" fill="none"/><line x1="8" y1="10" x2="20" y2="10" stroke="#5FB946" stroke-width="1.6" opacity="0.85"/><line x1="8" y1="15" x2="18" y2="15" stroke="#5FB946" stroke-width="1.6" opacity="0.55"/><line x1="8" y1="20" x2="16" y2="20" stroke="#5FB946" stroke-width="1.6" opacity="0.3"/></svg></div>`;
const CHECKSVG = `<svg width="12" height="10" viewBox="0 0 12 10" fill="none"><path d="M1 5.2 4.4 8.6 11 1.6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const APPLY_HTML = HEAD + `
<div class="shell">
 <div class="brandrow">` + MARK + `<div><div class="t1">CIMS</div><div class="t2">DG3 Cruise Industry Managed Services</div></div></div>
 <h1>Sail with us.</h1>
 <p class="sub">Apply for a shipboard position in three steps. Your <b>email address is your applicant ID</b> for the whole process — use one you check daily.</p>
 <div class="steps">
  <div class="step on"><b>1</b>Apply</div>
  <div class="step"><b>2</b>Assessment</div>
  <div class="step"><b>3</b>Interview</div>
 </div>
 <div class="card" id="formCard">
  <form id="f" autocomplete="on">
   <label style="margin-top:0">Full name</label><input type="text" id="name" placeholder="Last name, First name" maxlength="120">
   <div class="row">
    <div><label>Email address</label><input type="email" id="email" placeholder="you@example.com" maxlength="120"></div>
    <div><label>Phone <span class="opt">(incl. country code)</span></label><input type="tel" id="phone" placeholder="+63 9xx xxx xxxx" maxlength="40"></div>
   </div>
   <div class="row">
    <div><label>Position applying for</label><input type="text" id="position" placeholder="e.g. Printer Specialist" maxlength="80"></div>
    <div><label>How did you hear about us?</label>
     <select id="source"><option value="">Select&#8230;</option><option>TCMS website</option><option>Crew referral</option><option>Walk-in</option></select></div>
   </div>
   <div id="refWrap" style="display:none"><label>Referring crew member</label><input type="text" id="referrer" placeholder="Their full name" maxlength="80"></div>
   <label>Your experience</label>
   <div class="pills">
    <label class="pill" id="pShip"><input type="checkbox" id="shipboard"><span class="box">` + CHECKSVG + `</span>Worked on a commercial vessel</label>
    <label class="pill" id="pPrint"><input type="checkbox" id="printer"><span class="box">` + CHECKSVG + `</span>Print / production experience</label>
   </div>
   <label>Resume</label>
   <div class="drop" id="drop">
    <div class="ic">&#128196;</div>
    <div class="l1">Drag &amp; drop your resume here, or <span>browse</span></div>
    <div class="l2">PDF or Word &#183; max 8 MB</div>
   </div>
   <div class="filechip" id="chip">
    <div class="fic" id="chipExt">PDF</div>
    <div><div class="fn" id="chipName"></div><div class="fs" id="chipSize"></div></div>
    <button type="button" class="rm" id="chipRm" title="Remove">&#10005;</button>
   </div>
   <input type="file" id="file" accept=".pdf,.doc,.docx" style="display:none">
   <input class="hp" type="text" id="website" tabindex="-1" autocomplete="off">
   <label class="consent" id="cWrap"><input type="checkbox" id="consent"><span class="box">` + CHECKSVG + `</span><span>I consent to DG3 CIMS processing my application data for recruitment purposes.</span></label>
   <div class="err" id="err"></div>
   <button class="cta" id="go" type="submit">Submit application &#8594;</button>
  </form>
 </div>
 <div class="card okpane" id="done">
  <div class="ring">` + CHECKSVG.replace('width="12" height="10"', 'width="30" height="25"') + `</div>
  <div class="big">Application received</div>
  <p>Check your email — we just sent you step 2: a short assessment (about 10 minutes). Complete it within <b>7 days</b>, copy the Result ID at the end, and submit it on the verification page linked in the email.</p>
 </div>
 <div class="foot">DG3 CIMS RECRUITMENT</div>
</div>
<script>
function tgl(pid,cid){var p=document.getElementById(pid),c=document.getElementById(cid);p.addEventListener('click',function(e){e.preventDefault();c.checked=!c.checked;p.classList.toggle('sel',c.checked);});}
tgl('pShip','shipboard');tgl('pPrint','printer');tgl('cWrap','consent');
var src=document.getElementById('source');
src.addEventListener('change',function(){document.getElementById('refWrap').style.display=src.value==='Crew referral'?'block':'none';});
var up=null,uploading=false;
var drop=document.getElementById('drop'),fileIn=document.getElementById('file'),chip=document.getElementById('chip');
drop.addEventListener('click',function(){fileIn.click();});
['dragover','dragenter'].forEach(function(ev){drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.add('over');});});
['dragleave','drop'].forEach(function(ev){drop.addEventListener(ev,function(e){e.preventDefault();drop.classList.remove('over');});});
drop.addEventListener('drop',function(e){if(e.dataTransfer.files.length)handleFile(e.dataTransfer.files[0]);});
fileIn.addEventListener('change',function(){if(fileIn.files.length)handleFile(fileIn.files[0]);});
document.getElementById('chipRm').addEventListener('click',function(){up=null;chip.style.display='none';drop.style.display='block';fileIn.value='';});
function fail(msg){var e=document.getElementById('err');e.textContent=msg;e.style.display='block';window.scrollTo(0,document.body.scrollHeight);}
function handleFile(f){
 var ext=f.name.split('.').pop().toLowerCase();
 if(['pdf','doc','docx'].indexOf(ext)<0){fail('Please upload a PDF or Word document.');return;}
 if(f.size>8*1024*1024){fail('The file is larger than 8 MB — please compress it.');return;}
 document.getElementById('err').style.display='none';
 uploading=true;
 drop.querySelector('.l1').innerHTML='Uploading&#8230;';
 var fd=new FormData();fd.append('file',f);
 fetch('/api/upload',{method:'POST',body:fd}).then(function(r){return r.json();}).then(function(d){
  uploading=false;
  drop.querySelector('.l1').innerHTML='Drag &amp; drop your resume here, or <span>browse</span>';
  if(!d.ok){fail((d.errors||['Upload failed.']).join(' '));return;}
  up={key:d.key,name:f.name};
  document.getElementById('chipExt').textContent=ext.toUpperCase();
  document.getElementById('chipName').textContent=f.name;
  document.getElementById('chipSize').textContent=(f.size/1048576).toFixed(1)+' MB';
  drop.style.display='none';chip.style.display='flex';
 }).catch(function(){uploading=false;drop.querySelector('.l1').innerHTML='Drag &amp; drop your resume here, or <span>browse</span>';fail('Upload failed — please try again.');});
}
document.getElementById('f').addEventListener('submit',function(ev){
 ev.preventDefault();
 if(uploading){fail('Please wait for the resume upload to finish.');return;}
 if(!up){fail('Please attach your resume — drag it into the box or tap to browse.');return;}
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
  resume:up,
  consent:document.getElementById('consent').checked,
  website:document.getElementById('website').value
 };
 fetch('/api/apply',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
 .then(function(r){return r.json();})
 .then(function(d){
  if(d.ok){document.getElementById('formCard').style.display='none';document.getElementById('done').style.display='block';window.scrollTo(0,0);}
  else{fail((d.errors||['Something went wrong.']).join(' '));b.disabled=false;}
 })
 .catch(function(){fail('Network error — please try again.');b.disabled=false;});
});
</script></body></html>`;

export const VERIFY_HTML = HEAD + `
<div class="shell">
 <div class="brandrow">` + MARK + `<div><div class="t1">CIMS</div><div class="t2">DG3 Cruise Industry Managed Services</div></div></div>
 <h1>Almost there.</h1>
 <p class="sub">You completed the assessment — now submit your Result ID so we can verify it.</p>
 <div class="steps">
  <div class="step"><b>1</b>Apply</div>
  <div class="step on"><b>2</b>Assessment</div>
  <div class="step"><b>3</b>Interview</div>
 </div>
 <div class="card" id="formCard">
  <div class="callout"><b>1.</b> Take the test at bigfive-test.com &nbsp;&#8594;&nbsp; <b>2.</b> copy the Result ID at the end &nbsp;&#8594;&nbsp; <b>3.</b> submit it below with your email.</div>
  <form id="f">
   <label>Your email address <span class="opt">(the one you applied with)</span></label>
   <input type="email" id="email" placeholder="you@example.com" maxlength="120">
   <label>Result ID</label>
   <input type="text" id="rid" placeholder="e.g. 69fafe05540c3865e63a19f6" maxlength="40" style="font-family:ui-monospace,monospace">
   <div class="hint">The long code on your results page next to &quot;Save the following ID&quot;.</div>
   <input class="hp" type="text" id="website" tabindex="-1" autocomplete="off">
   <div class="err" id="err"></div>
   <button class="cta" id="go" type="submit">Submit result &#8594;</button>
  </form>
 </div>
 <div class="card okpane" id="done">
  <div class="ring">` + CHECKSVG.replace('width="12" height="10"', 'width="30" height="25"') + `</div>
  <div class="big">Result received</div>
  <p>Your assessment has been recorded. You will receive an email shortly with the outcome and, if you advance, the next step of the process.</p>
 </div>
 <div class="foot">DG3 CIMS RECRUITMENT</div>
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
