// Admin dashboard — keyed staff surface for the applicant funnel.
// Reads /api/admin/candidates, groups by workflow stage, drives actions via
// /api/admin/action. Template literal: no backticks, no dollar-brace inside.

export const ADMIN_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CIMS Recruitment — Admin</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--navy:#122C47;--navy2:#1B3A5C;--green:#5FB946;--green2:#4CA338;--line:#E4EAF2;--ink:#1C2A38;--mut:#7186A0;--red:#C2402F;--amber:#B87514;--bg:#EFF3F9}
*{box-sizing:border-box}body{margin:0;font-family:'DM Sans',sans-serif;color:var(--ink);background:var(--bg)}
.topbar{background:linear-gradient(100deg,var(--navy2) 60%,#2A5580);border-bottom:3px solid var(--green)}
.topbar .in{max-width:1120px;margin:0 auto;padding:14px 18px;display:flex;align-items:center;gap:14px}
.topbar .t1{font-family:Outfit;font-weight:800;font-size:18px;color:#fff;letter-spacing:4px}
.topbar .t2{font-size:10px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,.6);text-transform:uppercase}
.topbar .nav{margin-left:auto;display:flex;gap:6px}
.topbar .nav a{font-size:12px;font-weight:600;color:rgba(255,255,255,.75);text-decoration:none;padding:7px 13px;border-radius:8px}
.topbar .nav a.on{background:rgba(255,255,255,.14);color:#fff}
.topbar .nav a:hover{color:#fff}
.wrap{max-width:1120px;margin:0 auto;padding:22px 16px 60px}
h1{font-family:Outfit;font-size:22px;font-weight:800;color:var(--navy);margin:0 0 3px}
.sub{font-size:13px;color:var(--mut);margin:0 0 20px}
.tabs{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:18px}
.tab{font-size:12.5px;font-weight:700;color:var(--mut);background:#fff;border:1px solid var(--line);border-radius:9px;padding:8px 13px;cursor:pointer;display:flex;align-items:center;gap:7px}
.tab.on{background:var(--navy);color:#fff;border-color:var(--navy)}
.tab .n{font-size:11px;font-weight:800;background:rgba(0,0,0,.08);border-radius:20px;padding:1px 7px}
.tab.on .n{background:rgba(255,255,255,.2)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:13px}
.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;box-shadow:0 1px 3px rgba(18,44,71,.05)}
.card .hd{display:flex;align-items:flex-start;gap:10px}
.card .nm{font-family:Outfit;font-weight:700;font-size:15px;color:var(--navy);flex:1}
.fit{font-family:Outfit;font-weight:800;font-size:17px;color:var(--navy);text-align:right;line-height:1}
.fit .bd{font-size:8.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;display:block;margin-top:3px}
.bd.pri{color:var(--green)}.bd.pass{color:var(--mut)}.bd.rej{color:var(--red)}
.meta{font-size:12px;color:#43566d;margin-top:8px;line-height:1.5}
.meta b{color:var(--navy)}
.chips{margin-top:9px;display:flex;flex-wrap:wrap;gap:5px}
.chip{font-size:10.5px;font-weight:700;letter-spacing:.4px;padding:3px 9px;border-radius:20px;background:#EEF3F8;color:#43566d}
.chip.g{background:#EDF7E8;color:#3E8A28}.chip.a{background:#FDF4E3;color:var(--amber)}
.acts{margin-top:12px;display:flex;flex-wrap:wrap;gap:7px}
button{font-family:'DM Sans';font-weight:700;font-size:12.5px;border:0;border-radius:9px;padding:9px 14px;cursor:pointer}
.bg{background:var(--green);color:#fff}.bn{background:var(--navy);color:#fff}.br{background:#fff;color:var(--red);border:1.5px solid #EBC9C3}
.bo{background:#fff;color:var(--navy);border:1.5px solid var(--line)}
button:disabled{opacity:.5;cursor:default}
.panel{margin-top:11px;border-top:1px solid var(--line);padding-top:11px;display:none}
.panel.on{display:block}
label{display:block;font-size:11px;font-weight:700;color:var(--navy);margin:8px 0 5px}
select,textarea{width:100%;border:1.5px solid var(--line);border-radius:9px;padding:9px 11px;font:500 13px 'DM Sans';color:var(--ink);background:#FAFCFE}
textarea{min-height:62px;resize:vertical}
.det{margin-top:10px;font-size:11.5px;color:var(--mut);line-height:1.6;white-space:pre-wrap;background:#FAFCFE;border-radius:9px;padding:10px 12px;display:none;max-height:220px;overflow:auto}
.det.on{display:block}
.tiny{font-size:11px;color:var(--mut);margin-top:6px}
.empty{color:var(--mut);font-size:13px;padding:30px;text-align:center}
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--navy);color:#fff;font-size:13px;font-weight:600;padding:11px 20px;border-radius:10px;box-shadow:0 10px 24px rgba(18,44,71,.3);opacity:0;transition:opacity .2s;z-index:50}
.toast.on{opacity:1}
.scores{display:flex;gap:6px;margin-top:8px}
.sc{flex:1;text-align:center;background:#FAFCFE;border:1px solid var(--line);border-radius:8px;padding:5px 2px}
.sc .v{font-family:Outfit;font-weight:800;font-size:14px;color:var(--navy)}
.sc .k{font-size:8px;font-weight:700;color:var(--mut);letter-spacing:.5px}
</style></head><body>
<div class="topbar"><div class="in">
  <span class="t1">CIMS</span><span class="t2">Recruitment</span>
  <div class="nav"><a href="/?k=KEYHOLDER">Monthly report</a><a class="on" href="#">Admin</a><a href="/reports?k=KEYHOLDER">Reports</a></div>
</div></div>
<div class="wrap">
  <h1>Applicant funnel</h1>
  <p class="sub" id="sub">Loading candidates&#8230;</p>
  <div class="tabs" id="tabs"></div>
  <div class="grid" id="grid"></div>
</div>
<div class="toast" id="toast"></div>
<script>
var KEY=new URLSearchParams(location.search).get('k')||'';
document.querySelectorAll('.nav a').forEach(function(a){a.href=a.getAttribute('href').replace('KEYHOLDER',encodeURIComponent(KEY));});
var REJECT=["Not the best candidate","Not eligible for rehire","Does not meet qualifications","Poor English / communication","Limited technical skill","Attitude","Dishonesty","Age","Salary expectations","Other"];
var INTERVIEWERS=["Yanna","April"];
var DATA=[],TL=THRESH();var CUR='action';
function THRESH(){return{floor:440,priority:480};}
var BUCKETS=[
 ['action','Needs action',['Tested — Passed','Interview Assigned','Interviewed — Recommend','Endorsed — Awaiting Approval','Exception Requested']],
 ['scheduled','Scheduled',['Final Scheduled']],
 ['approved','Approved',['Approved']],
 ['closed','Closed',['Interviewed — Not advancing','Rejected — Manual','Endorsement Declined','Tested — Rejected','Auto-Rejected','Expired — No Test']],
 ['testing','In testing',['Applied','Pending Test']],
];
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
}
function band(c){
 if(c.verdict==='Auto-Rejected'||c.stage==='Tested — Rejected')return['rej','Below '+TL.floor];
 if(c.priority)return['pri','Priority'];
 if(c.fit>=TL.floor)return['pass','Pass'];
 return['pass',''];
}
function card(c){
 var b=band(c);
 var chips='';
 chips+='<span class="chip">'+esc(c.source||'—')+'</span>';
 if(c.shipboard)chips+='<span class="chip g">Shipboard</span>';
 if(c.printer)chips+='<span class="chip g">Printer</span>';
 if(c.interviewer)chips+='<span class="chip a">Interviewer: '+esc(c.interviewer)+'</span>';
 var sc=c.scores||{};
 var scores=(sc.N!=null)?'<div class="scores">'+['N','E','O','A','C'].map(function(k){return '<div class="sc"><div class="v">'+(sc[k]==null?'—':sc[k])+'</div><div class="k">'+k+'</div></div>';}).join('')+'</div>':'';
 var det='Stage: '+esc(c.stage)+'\\nEmail: '+esc(c.email)+'  Phone: '+esc(c.phone)+
   (c.dateApplied?'\\nApplied: '+esc(c.dateApplied):'')+(c.dateTested?'  Tested: '+esc(c.dateTested):'')+
   (c.dateFinal?'\\nFinal interview: '+esc(c.dateFinal):'')+
   (c.rejectionReason?'\\nRejection: '+esc(c.rejectionReason):'')+
   (c.interviewNotes?'\\n\\nInterview notes:\\n'+esc(c.interviewNotes):'')+
   (c.recommendation?'\\n\\nRecommendation:\\n'+esc(c.recommendation):'');
 return '<div class="card" id="c_'+c.id+'">'+
  '<div class="hd"><div class="nm">'+esc(c.name)+'</div><div class="fit">'+(c.fit||'—')+'<span class="bd '+b[0]+'">'+esc(b[1])+'</span></div></div>'+
  '<div class="meta"><b>'+esc(c.position||'—')+'</b></div>'+
  scores+
  '<div class="chips">'+chips+'</div>'+
  '<div class="acts">'+actions(c)+
    (c.resumeUrl?'<button class="bo" onclick="window.open(\\''+c.resumeUrl+'\\')">Resume</button>':'')+
    '<button class="bo" onclick="tg(\\'d_'+c.id+'\\')">Details</button></div>'+
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
 if(s==='Tested — Passed'||s==='Interview Assigned'||s==='Interviewed — Recommend'){a+='<button class="br" onclick="pReject(\\''+c.id+'\\')">Reject</button>';}
 if(c.verdict==='Auto-Rejected'&&s!=='Exception Requested'){a+='<button class="bo" onclick="pException(\\''+c.id+'\\')">Request GM exception</button>';}
 return a;
}
function tg(id){document.getElementById(id).classList.toggle('on');}
function panel(id,html){var p=document.getElementById('p_'+id);p.innerHTML=html;p.classList.add('on');}
function opts(arr){return arr.map(function(o){return '<option>'+esc(o)+'</option>';}).join('');}
function pAssign(id){panel(id,'<label>Assign first interview to</label><select id="f1_'+id+'">'+opts(INTERVIEWERS)+'</select><div class="acts"><button class="bn" onclick="doAct(\\''+id+'\\',\\'assign\\',{interviewer:v(\\'f1_'+id+'\\')})">Confirm</button></div>');}
function pOutcome(id){panel(id,'<label>Interview outcome</label><textarea id="n_'+id+'" placeholder="Notes (optional)"></textarea><div class="acts"><button class="bg" onclick="doAct(\\''+id+'\\',\\'outcome\\',{result:\\'recommend\\',notes:v(\\'n_'+id+'\\')})">Recommend to final</button><button class="br" onclick="pOutNo(\\''+id+'\\')">Not advancing</button></div>');}
function pOutNo(id){panel(id,'<label>Reason for not advancing</label><select id="r_'+id+'">'+opts(REJECT)+'</select><label>Notes</label><textarea id="n_'+id+'"></textarea><div class="acts"><button class="br" onclick="doAct(\\''+id+'\\',\\'outcome\\',{result:\\'no\\',reason:v(\\'r_'+id+'\\'),notes:v(\\'n_'+id+'\\')})">Confirm — not advancing</button></div>');}
function pEndorse(id){panel(id,'<label>Recommendation for Ray &amp; Rolando</label><textarea id="e_'+id+'" placeholder="Why this candidate should advance to the final interview&#8230;"></textarea><div class="tiny">Sends the profile with Approve / Decline links to Ray and Rolando. Either one approving schedules the next available Monday.</div><div class="acts"><button class="bg" onclick="doAct(\\''+id+'\\',\\'endorse\\',{recommendation:v(\\'e_'+id+'\\')})">Send endorsement</button></div>');}
function pReject(id){panel(id,'<label>Rejection reason</label><select id="r_'+id+'">'+opts(REJECT)+'</select><div class="acts"><button class="br" onclick="doAct(\\''+id+'\\',\\'reject\\',{reason:v(\\'r_'+id+'\\')})">Confirm rejection</button></div>');}
function pException(id){panel(id,'<label>Justification for GM exception</label><textarea id="x_'+id+'" placeholder="Documented reason to advance a candidate below the SOP threshold&#8230;"></textarea><div class="tiny">Emails the GM. The candidate is held until a written decision.</div><div class="acts"><button class="bn" onclick="doAct(\\''+id+'\\',\\'exception\\',{reason:v(\\'x_'+id+'\\')})">Request exception</button></div>');}
function v(id){return (document.getElementById(id)||{}).value||'';}
function doAct(id,action,params){
 fetch('/api/admin/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({k:KEY,id:id,action:action,params:params})})
 .then(function(r){return r.json();}).then(function(d){
  if(d.ok){toast('Done');load();}else{toast((d.errors||['Error'])[0]);}
 }).catch(function(){toast('Network error');});
}
load();
</script></body></html>`;

// Reports surface — funnel analytics, computed client-side from the candidate list.
export const REPORTS_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>CIMS Recruitment — Reports</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root{--navy:#122C47;--navy2:#1B3A5C;--green:#5FB946;--line:#E4EAF2;--ink:#1C2A38;--mut:#7186A0;--bg:#EFF3F9}
*{box-sizing:border-box}body{margin:0;font-family:'DM Sans',sans-serif;color:var(--ink);background:var(--bg)}
.topbar{background:linear-gradient(100deg,var(--navy2) 60%,#2A5580);border-bottom:3px solid var(--green)}
.topbar .in{max-width:1120px;margin:0 auto;padding:14px 18px;display:flex;align-items:center;gap:14px}
.topbar .t1{font-family:Outfit;font-weight:800;font-size:18px;color:#fff;letter-spacing:4px}
.topbar .t2{font-size:10px;font-weight:700;letter-spacing:2px;color:rgba(255,255,255,.6);text-transform:uppercase}
.topbar .nav{margin-left:auto;display:flex;gap:6px}
.topbar .nav a{font-size:12px;font-weight:600;color:rgba(255,255,255,.75);text-decoration:none;padding:7px 13px;border-radius:8px}
.topbar .nav a.on{background:rgba(255,255,255,.14);color:#fff}
.wrap{max-width:1120px;margin:0 auto;padding:22px 16px 60px}
h1{font-family:Outfit;font-size:22px;font-weight:800;color:var(--navy);margin:0 0 3px}
.sub{font-size:13px;color:var(--mut);margin:0 0 20px}
h2{font-family:Outfit;font-size:13px;color:var(--navy);letter-spacing:1px;text-transform:uppercase;margin:26px 0 10px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
.kpi{background:#fff;border:1px solid var(--line);border-radius:13px;padding:16px}
.kpi .v{font-family:Outfit;font-weight:800;font-size:27px;color:var(--navy)}
.kpi .k{font-size:11px;font-weight:700;color:var(--mut);letter-spacing:.5px;text-transform:uppercase;margin-top:3px}
.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px}
.frow{display:flex;align-items:center;gap:12px;margin:9px 0}
.frow .lbl{width:150px;font-size:12.5px;font-weight:600;color:var(--navy)}
.frow .barw{flex:1;background:#EEF3F8;border-radius:20px;height:22px;overflow:hidden}
.frow .bar{height:100%;background:linear-gradient(90deg,var(--navy2),var(--green));border-radius:20px}
.frow .val{width:44px;text-align:right;font-size:12.5px;font-weight:700;color:var(--navy)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:640px){.two{grid-template-columns:1fr}}
.empty{color:var(--mut);font-size:13px;padding:20px;text-align:center}
</style></head><body>
<div class="topbar"><div class="in">
  <span class="t1">CIMS</span><span class="t2">Recruitment</span>
  <div class="nav"><a href="/?k=KEYHOLDER">Monthly report</a><a href="/admin?k=KEYHOLDER">Admin</a><a class="on" href="#">Reports</a></div>
</div></div>
<div class="wrap">
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
