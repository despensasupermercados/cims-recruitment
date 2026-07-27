// Admin dashboard — keyed staff surface for the applicant funnel.
// Reads /api/admin/candidates, groups by workflow stage, drives actions via
// /api/admin/action. Template literal: no backticks, no dollar-brace inside.

export const ADMIN_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CIMS Recruitment — Admin</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--navy:#1B3A5C;--navyD:#142D48;--green:#5FB946;--green2:#4C9E37;--line:#E4EAF2;--ink:#1B3A5C;--mut:#6B7280;--faint:#9CA3AF;--red:#C2402F;--amber:#B87514;--cloud:#F7F8FA;--bg:#E7EAF0;--mono:'DM Mono',ui-monospace,monospace}
*{box-sizing:border-box}body{margin:0;font-family:'DM Sans',sans-serif;color:var(--ink);background:var(--bg)}
.strip{height:4px;background:linear-gradient(90deg,var(--navy) 60%,var(--green) 60%)}
.topbar{background:var(--navyD)}
.topbar .in{max-width:1120px;margin:0 auto;padding:12px 18px;display:flex;align-items:center;gap:14px}
.wm .t1{font-family:Outfit;font-weight:800;font-size:16px;letter-spacing:4px;color:#fff;line-height:1}
.wm .bar{height:2px;background:var(--green);width:60px;margin:4px 0 3px}
.wm .t2{font-size:6.5px;letter-spacing:1.8px;color:rgba(255,255,255,.5);text-transform:uppercase}
.topbar .nav{margin-left:auto;display:flex;gap:4px}
.topbar .nav a{font-family:var(--mono);font-size:11px;color:rgba(255,255,255,.55);text-decoration:none;padding:7px 12px;border-radius:7px}
.topbar .nav a.on{background:rgba(255,255,255,.12);color:#fff}
.topbar .nav a:hover{color:#fff}
.wrap{max-width:1120px;margin:0 auto;padding:22px 16px 60px}
.ey{font-size:7.5px;letter-spacing:2.4px;color:var(--green);font-weight:700;text-transform:uppercase;margin-bottom:2px}
h1{font-family:Outfit;font-size:23px;font-weight:600;color:var(--navy);margin:0 0 3px;letter-spacing:-.2px}
.sub{font-size:13px;color:var(--mut);margin:0 0 20px}
.tabs{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:18px}
.tab{font-size:12px;font-weight:700;color:var(--mut);background:#fff;border:.5px solid var(--line);border-radius:9px;padding:8px 13px;cursor:pointer;display:flex;align-items:center;gap:7px}
.tab.on{background:var(--navy);color:#fff;border-color:var(--navy)}
.tab .n{font-family:var(--mono);font-size:11px;font-weight:500;background:rgba(0,0,0,.07);border-radius:20px;padding:1px 7px}
.tab.on .n{background:rgba(255,255,255,.2)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,380px));gap:13px;justify-content:start}
.card{background:#fff;border:.5px solid var(--line);border-radius:14px;padding:16px;box-shadow:0 10px 30px rgba(18,44,71,.06)}
.card .hd{display:flex;align-items:flex-start;gap:10px}
.card .nm{font-family:Outfit;font-weight:700;font-size:15px;color:var(--navy);flex:1}
.fit{font-family:var(--mono);font-weight:500;font-size:19px;color:var(--navy);text-align:right;line-height:1}
.fit .bd{font-family:'DM Sans';font-size:7px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;display:block;margin-top:4px}
.bd.pri{color:var(--green)}.bd.pass{color:var(--faint)}.bd.rej{color:var(--red)}
.meta{font-size:12px;color:#43566d;margin-top:8px;line-height:1.5}
.meta b{color:var(--navy)}
.chips{margin-top:9px;display:flex;flex-wrap:wrap;gap:5px}
.chip{font-size:10px;font-weight:700;letter-spacing:.4px;padding:3px 9px;border-radius:20px;background:#EEF3F8;color:#43566d;text-transform:uppercase}
.chip.g{background:#F2FAEE;color:#3E8A28}.chip.a{background:#FDF4E3;color:var(--amber)}
.acts{margin-top:12px;display:flex;flex-wrap:wrap;gap:7px}
button{font-family:'DM Sans';font-weight:700;font-size:12.5px;border:0;border-radius:9px;padding:9px 14px;cursor:pointer}
.bg{background:var(--green);color:#fff}.bn{background:var(--navy);color:#fff}.br{background:#fff;color:var(--red);border:1.5px solid #EBC9C3}
.bo{background:#fff;color:var(--navy);border:1.5px solid var(--line)}
button:disabled{opacity:.5;cursor:default}
.panel{margin-top:11px;border-top:.5px solid var(--line);padding-top:11px;display:none}
.panel.on{display:block}
label{display:block;font-size:7.5px;letter-spacing:1.6px;text-transform:uppercase;font-weight:700;color:var(--green);margin:10px 0 5px}
select,textarea,input[type=date]{width:100%;border:.5px solid var(--line);border-radius:9px;padding:10px 12px;font:500 13px 'DM Sans';color:var(--ink);background:var(--cloud);transition:border-color .15s,box-shadow .15s}
select:focus,textarea:focus,input[type=date]:focus{outline:none;border-color:var(--green);box-shadow:0 0 0 3px rgba(95,185,70,.16)}
textarea{min-height:62px;resize:vertical}
.det{margin-top:10px;font-family:var(--mono);font-size:11px;color:var(--mut);line-height:1.7;white-space:pre-wrap;background:var(--cloud);border-radius:9px;padding:11px 13px;display:none;max-height:220px;overflow:auto}
.det.on{display:block}
.tiny{font-size:11px;color:var(--mut);margin-top:6px;line-height:1.5}
.empty{color:var(--mut);font-size:13px;padding:30px;text-align:center}
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--navyD);color:#fff;font-size:13px;font-weight:600;padding:11px 20px;border-radius:10px;box-shadow:0 10px 24px rgba(18,44,71,.3);opacity:0;transition:opacity .2s;z-index:50}
.toast.on{opacity:1}
.scores{display:flex;gap:6px;margin-top:8px}
.sc{flex:1;text-align:center;background:var(--cloud);border:.5px solid var(--line);border-radius:8px;padding:6px 2px}
.sc .v{font-family:var(--mono);font-weight:500;font-size:14px;color:var(--navy)}
.sc .k{font-size:8px;font-weight:700;color:var(--faint);letter-spacing:.5px}
.status{margin-top:11px;font-size:12px;font-weight:600;padding:8px 12px;border-radius:9px;line-height:1.35}
.st-act{background:#FDF4E3;color:#9a6410}.st-wait{background:#EEF3F8;color:#54657c}.st-good{background:#F2FAEE;color:#347022}.st-closed{background:#F4EDED;color:#9a4034}
.stepper{display:flex;margin:13px 0 2px}
.stp{flex:1;display:flex;flex-direction:column;align-items:center;position:relative}
.stp .d{width:20px;height:20px;border-radius:50%;background:#E4EAF2;color:#9fb0c2;font-family:var(--mono);font-size:9px;font-weight:500;display:flex;align-items:center;justify-content:center;position:relative;z-index:1}
.stp .lb{font-size:7px;font-weight:700;letter-spacing:.4px;color:var(--faint);margin-top:4px;text-transform:uppercase}
.stp.done .d{background:var(--green);color:#fff}.stp.done .lb{color:var(--navy)}
.stp.cur .d{background:#fff;border:2px solid var(--navy);color:var(--navy)}.stp.cur .lb{color:var(--navy)}
.stp.closed .d{background:var(--red);color:#fff}.stp.closed .lb{color:var(--red)}
.stp::before{content:"";position:absolute;top:9px;left:-50%;width:100%;height:2px;background:#E4EAF2;z-index:0}
.stp:first-child::before{display:none}.stp.done::before,.stp.cur::before{background:var(--green)}
@keyframes flash{0%{box-shadow:0 0 0 3px rgba(95,185,70,.55)}100%{box-shadow:0 10px 30px rgba(18,44,71,.06)}}
.card.flash{animation:flash 1.4s ease-out}
button.wait{opacity:.7;cursor:default}
@media(max-width:560px){button{padding:11px 15px}.grid{grid-template-columns:1fr}}
</style></head><body>
<div class="strip"></div>
<div class="topbar"><div class="in">
  <div class="wm"><div class="t1">CIMS</div><div class="bar"></div><div class="t2">Shipboard Recruitment</div></div>
  <div class="nav"><a href="/?k=KEYHOLDER">Monthly report</a><a class="on" href="#">Candidate desk</a><a href="/reports?k=KEYHOLDER">Reports</a></div>
</div></div>
<div class="wrap">
  <div class="ey">Candidate desk</div>
  <h1>Applicant funnel</h1>
  <p class="sub" id="sub">Loading candidates&#8230;</p>
  <div class="tabs" id="tabs"></div>
  <div class="grid" id="grid"></div>
</div>
<div class="toast" id="toast"></div>
<script>
var KEY=new URLSearchParams(location.search).get('k')||'';
document.querySelectorAll('.nav a').forEach(function(a){a.href=a.getAttribute('href').replace('KEYHOLDER',encodeURIComponent(KEY));});
var REJECT=["Not the best candidate","Failed Big 5 / psych analysis","Not eligible for rehire","Does not meet qualifications","Communication / technical skills","Attitude","Salary expectations","Age disapproval","Dishonesty","Withdrew / other offer","GM declined exception","Other"];
var INTERVIEWERS=["Yanna","April"];
var DATA=[],TL=THRESH();var CUR='action';var FLASH='';
function THRESH(){return{floor:440,priority:480};}
// The tabs are the monthly report. Each post-hire tab count IS the headline
// number it is named after — approved, in visa, in medicals, ready to deploy,
// joined — so the figure on the form and the figure on this screen cannot
// disagree. That is the whole point of the four post-hire buttons: those five
// numbers used to be typed in by hand from a spreadsheet nobody else could see.
var BUCKETS=[
 ['action','Needs action',['Tested — Passed','Interview Assigned','Interviewed — Recommend','Endorsed — Awaiting Approval','Exception Requested']],
 ['scheduled','Scheduled',['Final Scheduled']],
 ['approved','Approved',['Approved']],
 ['visa','In visa',['Visa processing']],
 ['medicals','In medicals',['Medicals']],
 ['ready','Ready to deploy',['Ready for deployment']],
 ['deployed','Deployed',['Deployed']],
 ['closed','Closed',['Interviewed — Not advancing','Rejected — Manual','Endorsement Declined','Final — Not hired','Tested — Rejected','Expired — No Test','Withdrawn']],
 ['testing','In testing',['Applied']],
];
// Medical statuses that mean "still in progress". Fit and Not recommended are
// deliberately absent: those are outcomes with their own buttons, and offering
// them here would let someone close a candidate through a status dropdown
// without the stage ever moving. Mirrors config.js MEDICAL_STATUS_VALUES; a
// test enforces the subset.
var MEDSTATUS=["Not started","Ongoing","For appointment","For consultation"];
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function toast(m){var t=document.getElementById('toast');t.textContent=m;t.classList.add('on');setTimeout(function(){t.classList.remove('on');},2200);}
function load(){
 fetch('/api/admin/candidates?k='+encodeURIComponent(KEY)).then(function(r){return r.json();}).then(function(d){
  if(!d.ok){document.getElementById('sub').textContent='Access error.';return;}
  DATA=d.candidates||[];if(d.thresholds)TL={floor:d.thresholds.floor,priority:d.thresholds.priority};
  render();
 }).catch(function(){document.getElementById('sub').textContent='Network error.';});
}
function bucketOf(stage){for(var i=0;i<BUCKETS.length;i++){if(BUCKETS[i][2].indexOf(stage)>=0)return BUCKETS[i][0];}return 'testing';}
function render(){
 var counts={};DATA.forEach(function(c){var b=bucketOf(c.stage);counts[b]=(counts[b]||0)+1;});
 var tabs='';BUCKETS.forEach(function(b){tabs+='<div class="tab'+(b[0]===CUR?' on':'')+'" onclick="CUR=\\''+b[0]+'\\';render()">'+b[1]+' <span class="n">'+(counts[b[0]]||0)+'</span></div>';});
 document.getElementById('tabs').innerHTML=tabs;
 document.getElementById('sub').textContent=DATA.length+' candidates in the funnel';
 var rows=DATA.filter(function(c){return bucketOf(c.stage)===CUR;});
 rows.sort(function(a,b){return (b.fit||0)-(a.fit||0);});
 var g=document.getElementById('grid');
 if(!rows.length){g.innerHTML='<div class="empty">No candidates in this stage.</div>';return;}
 g.innerHTML=rows.map(card).join('');
 if(FLASH){var fe=document.getElementById('c_'+FLASH);if(fe)fe.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(function(){FLASH='';},1500);}
}
function band(c){
 if(c.verdict==='Auto-Rejected'||c.stage==='Tested — Rejected')return['rej','Below '+TL.floor];
 if(c.priority)return['pri','Priority'];
 if(c.fit>=TL.floor)return['pass','Pass'];
 return['pass',''];
}
// stage -> { step (completed nodes 1..6), tone, closed, text(c) }
function meta(c){
 var s=c.stage,iv=c.interviewer||'the interviewer',df=c.dateFinal||'',rr=c.rejectionReason||'';
 var vs=esc(c.visaStatus||''),ms=esc(c.medicalStatus||''),ej=esc(c.expectedJoin||''),dd=esc(c.dateDeployed||'');
 var M={
  'Applied':[1,'wait',0,'Awaiting assessment'],
  'Pending Test':[1,'wait',0,'Awaiting assessment'],
  'Tested — Passed':[2,'act',0,'Passed screening — assign a first interview'],
  'Interview Assigned':[2,'act',0,'In first interview with '+iv+' — record the outcome'],
  'Interviewed — Recommend':[3,'act',0,'Recommended — endorse to Ray & Rolando'],
  'Endorsed — Awaiting Approval':[4,'wait',0,'Endorsed — awaiting Ray or Rolando to approve'],
  'Final Scheduled':[4,'act',0,'Final interview scheduled'+(df?' — '+df:'')+' — record the outcome after it happens'],
  'Approved':[6,'act',0,'Hired &amp; approved — start visa processing'],
  'Visa processing':[7,'act',0,'In visa processing'+(vs?' — '+vs:'')],
  'Medicals':[8,'act',0,'In medicals'+(ms?' — '+ms:'')],
  'Ready for deployment':[8,'good',0,'Cleared — ready to deploy'+(ej?', expected join '+ej:'')],
  'Deployed':[9,'good',0,'Joined'+(dd?' '+dd:'')],
  'Withdrawn':[6,'closed',1,'Closed — withdrawn after approval'+(vs==='Denied'?' (visa denied)':(ms==='Not recommended'?' (medically not recommended)':''))],
  'Final — Not hired':[5,'closed',1,'Closed — not hired at the final interview'],
  'Interviewed — Not advancing':[3,'closed',1,'Closed — not advancing after interview'],
  'Rejected — Manual':[2,'closed',1,'Closed — rejected'+(rr?' ('+rr+')':'')],
  'Endorsement Declined':[4,'closed',1,'Closed — declined by management'],
  'Tested — Rejected':[2,'closed',1,'Closed — did not pass screening'],
  'Auto-Rejected':[2,'closed',1,'Closed — did not pass screening'],
  'Expired — No Test':[1,'closed',1,'Closed — no assessment (expired)'],
  'Exception Requested':[2,'wait',0,'GM exception requested — awaiting decision']
 };
 var m=M[s]||[1,'wait',0,esc(s)];
 return {step:m[0],tone:m[1],closed:m[2],text:m[3]};
}
var STEPS=['Apply','Test','Interview','Endorse','Final','Hired','Visa','Medical','Joined'];
function stepper(m){
 var h='<div class="stepper">';
 // Driven off STEPS.length, not a literal 6. The loop bound was hardcoded, so
 // adding the three post-hire nodes to STEPS would have rendered a six-step
 // bar with three labels missing and no error anywhere.
 for(var i=1;i<=STEPS.length;i++){
  var cls='';
  if(i<=m.step){cls=(m.closed&&i===m.step)?'closed':'done';}
  else if(i===m.step+1&&!m.closed){cls='cur';}
  var glyph=(cls==='done')?'&#10003;':(cls==='closed'?'&#215;':i);
  h+='<div class="stp '+cls+'"><div class="d">'+glyph+'</div><div class="lb">'+STEPS[i-1]+'</div></div>';
 }
 return h+'</div>';
}
function card(c){
 var b=band(c),m=meta(c);
 var chips='';
 chips+='<span class="chip">'+esc(c.source||'—')+'</span>';
 if(c.shipboard)chips+='<span class="chip g">Shipboard</span>';
 if(c.printer)chips+='<span class="chip g">Printer</span>';
 if(c.interviewer)chips+='<span class="chip a">Interviewer: '+esc(c.interviewer)+'</span>';
 var sc=c.scores||{};
 var scores=(sc.N!=null)?'<div class="scores">'+['N','E','O','A','C'].map(function(k){return '<div class="sc"><div class="v">'+(sc[k]==null?'—':sc[k])+'</div><div class="k">'+k+'</div></div>';}).join('')+'</div>':'';
 var det='Stage: '+esc(c.stage)+'\\nEmail: '+esc(c.email)+'  Phone: '+esc(c.phone)+
   (c.dateApplied?'\\nApplied: '+esc(c.dateApplied):'')+(c.dateTested?'  Tested: '+esc(c.dateTested):'')+
   (c.dateEndorsed?'\\nEndorsed: '+esc(c.dateEndorsed):'')+
   (c.dateFinal?'\\nFinal interview: '+esc(c.dateFinal):'')+
   (c.rejectionReason?'\\nRejection: '+esc(c.rejectionReason):'')+
   (c.interviewNotes?'\\n\\nInterview notes:\\n'+esc(c.interviewNotes):'')+
   (c.recommendation?'\\n\\nRecommendation:\\n'+esc(c.recommendation):'');
 var acts=actions(c)+
    (c.resumeUrl?'<button class="bo" onclick="window.open(\\''+c.resumeUrl+'\\')">Resume</button>':'')+
    '<button class="bo" onclick="tg(\\'d_'+c.id+'\\')">Details</button>';
 return '<div class="card'+(FLASH===c.id?' flash':'')+'" id="c_'+c.id+'">'+
  '<div class="hd"><div class="nm">'+esc(c.name)+'</div><div class="fit">'+(c.fit||'—')+'<span class="bd '+b[0]+'">'+esc(b[1])+'</span></div></div>'+
  '<div class="meta"><b>'+esc(c.position||'—')+'</b></div>'+
  scores+
  stepper(m)+
  '<div class="status st-'+m.tone+'">'+m.text+'</div>'+
  '<div class="chips">'+chips+'</div>'+
  (acts?'<div class="acts">'+acts+'</div>':'')+
  '<div class="det" id="d_'+c.id+'">'+det+'</div>'+
  '<div class="panel" id="p_'+c.id+'"></div>'+
 '</div>';
}
function actions(c){
 var a='';var s=c.stage;
 if(s==='Tested — Passed'||s==='Interview Assigned'||s==='Interviewed — Recommend'){
  a+='<button class="bn" onclick="pAssign(\\''+c.id+'\\')">Assign interview</button>';
 }
 if(s==='Interview Assigned'){a+='<button class="bg" onclick="pOutcome(\\''+c.id+'\\')">Record outcome</button>';}
 if(s==='Interviewed — Recommend'){a+='<button class="bg" onclick="pEndorse(\\''+c.id+'\\')">Endorse to Ray &amp; Rolando</button>';}
 if(s==='Final Scheduled'){a+='<button class="bg" onclick="pFinal(\\''+c.id+'\\')">Record final outcome</button>';}
 if(s==='Exception Requested'){a+='<button class="bn" onclick="pExc(\\''+c.id+'\\')">Record GM decision</button>';}
 if(s==='Tested — Passed'||s==='Interview Assigned'||s==='Interviewed — Recommend'){a+='<button class="br" onclick="pReject(\\''+c.id+'\\')">Reject</button>';}
 if(c.verdict==='Auto-Rejected'&&s!=='Exception Requested'){a+='<button class="bo" onclick="pException(\\''+c.id+'\\')">Request GM exception</button>';}
 // Post-hire: the four buttons that carry a candidate from Approved to Joined.
 if(s==='Approved'){a+='<button class="bn" onclick="doAct(this,\\''+c.id+'\\',\\'startVisa\\',{},\\'Visa processing started\\')">Start visa processing</button>';}
 if(s==='Visa processing'){a+='<button class="bg" onclick="pVisa(\\''+c.id+'\\')">Record visa outcome</button>';}
 if(s==='Medicals'){a+='<button class="bg" onclick="pMed(\\''+c.id+'\\')">Record medical outcome</button>';}
 if(s==='Ready for deployment'){a+='<button class="bg" onclick="pJoin(\\''+c.id+'\\')">Mark joined</button>';}
 return a;
}
function tg(id){document.getElementById(id).classList.toggle('on');}
function panel(id,html){var p=document.getElementById('p_'+id);p.innerHTML=html;p.classList.add('on');}
function opts(arr){return arr.map(function(o){return '<option>'+esc(o)+'</option>';}).join('');}
function pAssign(id){panel(id,'<label>Assign first interview to</label><select id="f1_'+id+'">'+opts(INTERVIEWERS)+'</select><div class="acts"><button class="bn" onclick="doAct(this,\\''+id+'\\',\\'assign\\',{interviewer:v(\\'f1_'+id+'\\')},\\'Assigned — record the outcome after the interview\\')">Confirm</button></div>');}
function pOutcome(id){panel(id,'<label>Interview outcome notes</label><textarea id="n_'+id+'" placeholder="How did the interview go? (optional)"></textarea><div class="acts"><button class="bg" onclick="doAct(this,\\''+id+'\\',\\'outcome\\',{result:\\'recommend\\',notes:v(\\'n_'+id+'\\')},\\'Recommended — ready to endorse to Ray &amp; Rolando\\')">Recommend to final</button><button class="br" onclick="pOutNo(\\''+id+'\\')">Not advancing</button></div>');}
function pOutNo(id){panel(id,'<label>Reason for not advancing</label><select id="r_'+id+'">'+opts(REJECT)+'</select><label>Notes</label><textarea id="n_'+id+'"></textarea><div class="acts"><button class="br" onclick="doAct(this,\\''+id+'\\',\\'outcome\\',{result:\\'no\\',reason:v(\\'r_'+id+'\\'),notes:v(\\'n_'+id+'\\')},\\'Marked not advancing — moved to Closed\\')">Confirm — not advancing</button></div>');}
function pEndorse(id){panel(id,'<label>Recommendation for Ray &amp; Rolando</label><textarea id="e_'+id+'" placeholder="Why this candidate should advance to the final interview&#8230;"></textarea><div class="tiny">Sends the profile with Approve / Decline links to Ray and Rolando. Either one approving schedules the next available Monday.</div><div class="acts"><button class="bg" onclick="doAct(this,\\''+id+'\\',\\'endorse\\',{recommendation:v(\\'e_'+id+'\\')},\\'Endorsed — Ray &amp; Rolando notified, awaiting their approval\\')">Send endorsement</button></div>');}
function pReject(id){panel(id,'<label>Rejection reason</label><select id="r_'+id+'">'+opts(REJECT)+'</select><div class="acts"><button class="br" onclick="doAct(this,\\''+id+'\\',\\'reject\\',{reason:v(\\'r_'+id+'\\')},\\'Rejected — moved to Closed\\')">Confirm rejection</button></div>');}
function pException(id){panel(id,'<label>Justification for GM exception</label><textarea id="x_'+id+'" placeholder="Documented reason to advance a candidate below the SOP threshold&#8230;"></textarea><div class="tiny">Emails the GM. The candidate is held until a written decision.</div><div class="acts"><button class="bn" onclick="doAct(this,\\''+id+'\\',\\'exception\\',{reason:v(\\'x_'+id+'\\')},\\'Exception request sent to the GM\\')">Request exception</button></div>');}
function pFinal(id){panel(id,'<label>Final interview outcome</label><textarea id="n_'+id+'" placeholder="How did the final interview go? (optional)"></textarea><div class="tiny">Record the result of the live interview with Ray &amp; Rolando.</div><div class="acts"><button class="bg" onclick="doAct(this,\\''+id+'\\',\\'finalOutcome\\',{result:\\'hired\\',notes:v(\\'n_'+id+'\\')},\\'Hired — approved, entering visa &amp; medicals\\')">Hired &#10003;</button><button class="br" onclick="pFinalNo(\\''+id+'\\')">Not hired</button></div>');}
function pFinalNo(id){panel(id,'<label>Reason not hired</label><select id="r_'+id+'">'+opts(REJECT)+'</select><label>Notes</label><textarea id="n_'+id+'"></textarea><div class="acts"><button class="br" onclick="doAct(this,\\''+id+'\\',\\'finalOutcome\\',{result:\\'no\\',reason:v(\\'r_'+id+'\\'),notes:v(\\'n_'+id+'\\')},\\'Recorded — not hired, moved to Closed\\')">Confirm — not hired</button></div>');}
function pExc(id){panel(id,'<div class="tiny">Record the GM\\'s written decision on this exception request.</div><div class="acts"><button class="bg" onclick="doAct(this,\\''+id+'\\',\\'exceptionDecide\\',{result:\\'approve\\'},\\'GM approved — candidate rejoins the interview flow\\')">GM approved</button><button class="br" onclick="doAct(this,\\''+id+'\\',\\'exceptionDecide\\',{result:\\'reject\\'},\\'GM declined — moved to Closed\\')">GM declined</button></div>');}
// --- Post-hire panels ------------------------------------------------------
function today(){return new Date().toISOString().slice(0,10);}
function pVisa(id){panel(id,'<div class="tiny">Delayed keeps the candidate in visa processing on purpose — they really are still in visa, so the count should still say so.</div><div class="acts"><button class="bg" onclick="doAct(this,\\''+id+'\\',\\'visaOutcome\\',{result:\\'approved\\'},\\'Visa approved — medicals started\\')">Visa approved</button><button class="bo" onclick="doAct(this,\\''+id+'\\',\\'visaOutcome\\',{result:\\'delayed\\'},\\'Marked delayed — still in visa\\')">Delayed</button><button class="br" onclick="doAct(this,\\''+id+'\\',\\'visaOutcome\\',{result:\\'denied\\'},\\'Visa denied — withdrawn\\')">Denied</button></div>');}
function pMed(id){panel(id,'<label>Expected join date</label><input type="date" id="j_'+id+'"><div class="tiny">Required before anyone can be marked ready to deploy: it is the only input behind the 60&#8211;90 day joiner forecast.</div><div class="acts"><button class="bg" onclick="doAct(this,\\''+id+'\\',\\'medicalOutcome\\',{result:\\'fit\\',expectedJoin:v(\\'j_'+id+'\\')},\\'Medically fit — ready to deploy\\')">Medically fit</button><button class="bo" onclick="pMedWait(\\''+id+'\\')">Still in progress</button><button class="br" onclick="doAct(this,\\''+id+'\\',\\'medicalOutcome\\',{result:\\'unfit\\'},\\'Not recommended — withdrawn\\')">Not recommended</button></div>');}
function pMedWait(id){panel(id,'<label>Medical status</label><select id="ms_'+id+'">'+opts(MEDSTATUS)+'</select><div class="tiny">Keeps the candidate in medicals and records where they actually are.</div><div class="acts"><button class="bn" onclick="doAct(this,\\''+id+'\\',\\'medicalOutcome\\',{result:\\'pending\\',status:v(\\'ms_'+id+'\\')},\\'Medical status updated\\')">Update status</button></div>');}
function pJoin(id){panel(id,'<label>Date joined</label><input type="date" id="dj_'+id+'" value="'+today()+'"><div class="tiny">The actual join date, written to its own field. The forecast in Expected Join Date is left untouched so it can still be scored against reality.</div><div class="acts"><button class="bg" onclick="doAct(this,\\''+id+'\\',\\'deploy\\',{date:v(\\'dj_'+id+'\\')},\\'Marked joined\\')">Confirm joined</button></div>');}
function v(id){return (document.getElementById(id)||{}).value||'';}
function doAct(btn,id,action,params,msg){
 if(btn){btn.dataset.t=btn.innerHTML;btn.innerHTML='Saving&#8230;';btn.classList.add('wait');btn.disabled=true;}
 fetch('/api/admin/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({k:KEY,id:id,action:action,params:params})})
 .then(function(r){return r.json();}).then(function(d){
  if(d.ok){FLASH=id;toast(msg||'Saved');load();}
  else{toast((d.errors||['Something went wrong'])[0]);if(btn){btn.innerHTML=btn.dataset.t;btn.classList.remove('wait');btn.disabled=false;}}
 }).catch(function(){toast('Network error — please try again');if(btn){btn.innerHTML=btn.dataset.t;btn.classList.remove('wait');btn.disabled=false;}});
}
load();
</script></body></html>`;

// Reports surface — funnel analytics, computed client-side from the candidate list.
export const REPORTS_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CIMS Recruitment — Reports</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--navy:#1B3A5C;--navyD:#142D48;--green:#5FB946;--line:#E4EAF2;--ink:#1B3A5C;--mut:#6B7280;--faint:#9CA3AF;--cloud:#F7F8FA;--bg:#E7EAF0;--mono:'DM Mono',ui-monospace,monospace}
*{box-sizing:border-box}body{margin:0;font-family:'DM Sans',sans-serif;color:var(--ink);background:var(--bg)}
.strip{height:4px;background:linear-gradient(90deg,var(--navy) 60%,var(--green) 60%)}
.topbar{background:var(--navyD)}
.topbar .in{max-width:1120px;margin:0 auto;padding:12px 18px;display:flex;align-items:center;gap:14px}
.wm .t1{font-family:Outfit;font-weight:800;font-size:16px;letter-spacing:4px;color:#fff;line-height:1}
.wm .bar{height:2px;background:var(--green);width:60px;margin:4px 0 3px}
.wm .t2{font-size:6.5px;letter-spacing:1.8px;color:rgba(255,255,255,.5);text-transform:uppercase}
.topbar .nav{margin-left:auto;display:flex;gap:4px}
.topbar .nav a{font-family:var(--mono);font-size:11px;color:rgba(255,255,255,.55);text-decoration:none;padding:7px 12px;border-radius:7px}
.topbar .nav a.on{background:rgba(255,255,255,.12);color:#fff}
.topbar .nav a:hover{color:#fff}
.wrap{max-width:1120px;margin:0 auto;padding:22px 16px 60px}
.ey{font-size:7.5px;letter-spacing:2.4px;color:var(--green);font-weight:700;text-transform:uppercase;margin-bottom:2px}
h1{font-family:Outfit;font-size:23px;font-weight:600;color:var(--navy);margin:0 0 3px;letter-spacing:-.2px}
.sub{font-size:13px;color:var(--mut);margin:0 0 20px}
h2{font-size:7.5px;color:var(--green);letter-spacing:2.4px;text-transform:uppercase;font-weight:700;margin:26px 0 10px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.kpi{background:#fff;border:.5px solid var(--line);border-radius:13px;padding:16px;box-shadow:0 10px 30px rgba(18,44,71,.05)}
.kpi .v{font-family:var(--mono);font-weight:500;font-size:26px;color:var(--navy);line-height:1}
.kpi .k{font-size:10px;font-weight:700;color:var(--faint);letter-spacing:1.2px;text-transform:uppercase;margin-top:6px}
.card{background:#fff;border:.5px solid var(--line);border-radius:14px;padding:18px;box-shadow:0 10px 30px rgba(18,44,71,.05)}
.frow{display:flex;align-items:center;gap:12px;margin:9px 0}
.frow .lbl{width:150px;font-size:12px;font-weight:600;color:var(--navy)}
.frow .barw{flex:1;background:var(--cloud);border-radius:20px;height:22px;overflow:hidden;border:.5px solid var(--line)}
.frow .bar{height:100%;background:linear-gradient(90deg,var(--navy),var(--green));border-radius:20px}
.frow .val{width:44px;text-align:right;font-family:var(--mono);font-size:12.5px;font-weight:500;color:var(--navy)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:640px){.two{grid-template-columns:1fr}}
.empty{color:var(--mut);font-size:13px;padding:20px;text-align:center}
</style></head><body>
<div class="strip"></div>
<div class="topbar"><div class="in">
  <div class="wm"><div class="t1">CIMS</div><div class="bar"></div><div class="t2">Shipboard Recruitment</div></div>
  <div class="nav"><a href="/?k=KEYHOLDER">Monthly report</a><a href="/admin?k=KEYHOLDER">Candidate desk</a><a class="on" href="#">Reports</a></div>
</div></div>
<div class="wrap">
  <div class="ey">Route map</div>
  <h1>Funnel reports</h1>
  <p class="sub" id="sub">Loading&#8230;</p>
  <div class="kpis" id="kpis"></div>
  <h2>Pipeline funnel</h2><div class="card" id="funnel"></div>
  <div class="two">
    <div><h2>Sourcing</h2><div class="card" id="src"></div></div>
    <div><h2>Rejection reasons</h2><div class="card" id="rej"></div></div>
  </div>
</div>
<script>
var KEY=new URLSearchParams(location.search).get('k')||'';
document.querySelectorAll('.nav a').forEach(function(a){a.href=a.getAttribute('href').replace('KEYHOLDER',encodeURIComponent(KEY));});
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
var PASS=['Tested — Passed','Interview Assigned','Interviewed — Recommend','Endorsed — Awaiting Approval','Final Scheduled','Approved','Interviewed — Not advancing','Rejected — Manual','Endorsement Declined'];
function has(c,set){return set.indexOf(c.stage)>=0;}
fetch('/api/admin/candidates?k='+encodeURIComponent(KEY)).then(function(r){return r.json();}).then(function(d){
 if(!d.ok){document.getElementById('sub').textContent='Access error.';return;}
 var C=d.candidates||[];
 document.getElementById('sub').textContent=C.length+' candidates all-time';
 var applied=C.length;
 var tested=C.filter(function(c){return c.dateTested;}).length;
 var passed=C.filter(function(c){return c.verdict==='Passed'||c.verdict==='Passed — Priority';}).length;
 var interviewed=C.filter(function(c){return has(c,['Interviewed — Recommend','Endorsed — Awaiting Approval','Final Scheduled','Approved','Interviewed — Not advancing']);}).length;
 var endorsed=C.filter(function(c){return has(c,['Endorsed — Awaiting Approval','Final Scheduled','Approved']);}).length;
 var approved=C.filter(function(c){return c.stage==='Approved';}).length;
 var passRate=tested?Math.round(passed/tested*100):0;
 document.getElementById('kpis').innerHTML=[
  ['Applied',applied],['Tested',tested],['Passed',passed],['Pass rate',passRate+'%'],['Endorsed',endorsed],['Approved',approved]
 ].map(function(k){return '<div class="kpi"><div class="v">'+k[1]+'</div><div class="k">'+k[0]+'</div></div>';}).join('');
 var steps=[['Applied',applied],['Tested',tested],['Passed screening',passed],['Interviewed',interviewed],['Endorsed',endorsed],['Approved',approved]];
 var max=applied||1;
 document.getElementById('funnel').innerHTML=steps.map(function(s){var pct=Math.round(s[1]/max*100);return '<div class="frow"><div class="lbl">'+s[0]+'</div><div class="barw"><div class="bar" style="width:'+Math.max(pct,2)+'%"></div></div><div class="val">'+s[1]+'</div></div>';}).join('')||'<div class="empty">No data yet.</div>';
 function tally(field){var m={};C.forEach(function(c){var k=c[field]||'—';if(field==='rejectionReason'&&!c[field])return;m[k]=(m[k]||0)+1;});return Object.keys(m).map(function(k){return [k,m[k]];}).sort(function(a,b){return b[1]-a[1];});}
 function barlist(el,rows){var mx=rows.reduce(function(a,r){return Math.max(a,r[1]);},1);document.getElementById(el).innerHTML=rows.length?rows.map(function(r){return '<div class="frow"><div class="lbl" style="width:170px">'+esc(r[0])+'</div><div class="barw"><div class="bar" style="width:'+Math.max(Math.round(r[1]/mx*100),3)+'%"></div></div><div class="val">'+r[1]+'</div></div>';}).join(''):'<div class="empty">No data yet.</div>';}
 barlist('src',tally('source'));
 barlist('rej',tally('rejectionReason'));
}).catch(function(){document.getElementById('sub').textContent='Network error.';});
</script></body></html>`;
