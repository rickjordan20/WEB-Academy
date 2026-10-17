import "./cloud-bootstrap.js";
import {getSupabase,getSession} from "./supabase-client.js";
import {getState} from "./storage.js";
import {MISSIONS,getMission} from "./mission-engine.js";
import {estimateMissionXp} from "./mission-assessment-utils.js";
const root=document.querySelector("#myMissions");
const esc=v=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const date=v=>v?new Date(v).toLocaleString("pt-BR"):"—";
const filters=[["all","Todas"],["changes_requested","Revisão solicitada"],["submitted","Aguardando avaliação"],["evaluated","Avaliadas"],["in_progress","Em andamento"],["not_started","Não iniciadas"]];
let rows=[],active="all",query="",detail=null,loadError="";
function localProgress(m,s){
 const done=s?.journey?.missionProgress?.[m.id]?.completedSteps||[];
 const started=Boolean(s?.journey?.missionProgress?.[m.id]?.startedAt||done.length||(s?.journey?.completedMissions||[]).includes(m.id));
 return {started,progress:estimateMissionXp(m,{version:1,mission:{completedSteps:done}})};
}
function situation(r){if(r.submission?.status==="changes_requested")return "changes_requested";if(r.submission?.status==="evaluated")return "evaluated";if(r.submission)return "submitted";return r.local.started?"in_progress":"not_started"}
const labels={changes_requested:"Revisão solicitada",evaluated:"Avaliada",submitted:"Aguardando avaliação",in_progress:"Em andamento",not_started:"Não iniciada"};
function link(r){return "mission.html?id="+encodeURIComponent(r.mission.id)}
function blockFeedback(r){
 const g=r.submission?.grades||{},blocks=g.blocks||{},concepts=g.blockIndicators||{};
 const entries=[...new Set([...Object.keys(blocks),...Object.keys(concepts)])];
 return entries.map(key=>{
  const [unit,...parts]=key.split(":"),stepId=parts.join(":");
  const step=r.mission.steps?.find(x=>x.id===stepId);
  const result=concepts[key]||{};
  const needs=Object.values(result).some(v=>v==="PA"||v==="NA");
  return '<div class="mm-block '+(needs?"mm-attention":"")+'"><strong>'+esc(step?.title||key)+'</strong>'+(Object.keys(result).length?'<p>'+Object.entries(result).map(([k,v])=>'<span class="mm-concept">'+esc(k)+' · '+esc(v)+'</span>').join(" ")+'</p>':"")+(blocks[key]?'<p>'+esc(blocks[key])+'</p>':"")+(needs?'<small>Revise este bloco conforme as orientações.</small>':"")+'</div>';
 }).join("");
}
function renderDetail(r){
 const sub=r.submission,g=sub?.grades||{},snapshot=sub?.progress_snapshot||{},progress=sub?estimateMissionXp(r.mission,snapshot):r.local.progress;
 const status=situation(r),feedback=blockFeedback(r);
 const notes=status==="changes_requested"?"O instrutor solicitou ajustes. Leia as orientações e reenvie sua missão.":status==="evaluated"?"Avaliação concluída. Confira suas menções e o feedback.":"Acompanhe seus registros e continue sua aprendizagem.";
 const answered=Object.entries(sub?.answers||{}).filter(([k])=>k.startsWith(r.mission.id+":")||k.startsWith("F"+r.mission.phase+":"));
 root.innerHTML='<button type="button" class="btn btn-secondary" id="mmBack">← Voltar às minhas missões</button><article class="mm-detail"><div class="mm-detail-head"><div><p class="eyebrow">Detalhes da entrega</p><h2>'+esc(r.mission.title)+'</h2></div><span class="mm-status '+status+'">'+labels[status]+'</span></div><p>'+notes+'</p><div class="mm-stats"><div><small>Progresso registrado</small><strong>'+progress.percent+'%</strong></div><div><small>Etapas com check</small><strong>'+progress.completed+' / '+progress.total+'</strong></div><div><small>XP '+(status==="evaluated"?"registrado":"estimado")+'</small><strong>'+(status==="evaluated"?(g.xp??"—"):progress.xp)+'</strong></div></div><div class="mm-bar"><i style="width:'+progress.percent+'%"></i></div>'+(sub?'<p class="mm-meta">Enviada em '+date(sub.submitted_at)+(sub.is_late?" · Fora do prazo":"")+'</p>':'<p class="mm-meta">Esta missão ainda não foi enviada.</p>')+(sub?.feedback?'<section class="mm-review"><h3>Feedback geral do instrutor</h3><p>'+esc(sub.feedback)+'</p></section>':"")+(Object.keys(g.indicators||{}).length?'<section class="mm-review"><h3>Indicadores avaliados</h3><p>'+Object.entries(g.indicators).map(([k,v])=>'<span class="mm-concept">'+esc(k)+' · '+esc(v)+'</span>').join(" ")+'</p></section>':"")+(feedback?'<section class="mm-review"><h3>Orientações por bloco</h3>'+feedback+'</section>':"")+(sub?'<section class="mm-review"><h3>Checks e respostas da entrega</h3>'+(r.mission.steps||[]).map(step=>{const checked=(snapshot.mission?.completedSteps||[]).includes(step.id),key=r.mission.id+":"+step.id;return '<div class="mm-check"><span>'+(checked?"☑":"☐")+' '+esc(step.title||step.id)+'</span>'+(sub.answers&&Object.hasOwn(sub.answers,key)?'<pre>'+esc(typeof sub.answers[key]==="string"?sub.answers[key]:JSON.stringify(sub.answers[key],null,2))+'</pre>':"")+'</div>'}).join("")+(answered.filter(([k])=>!(r.mission.steps||[]).some(s=>k===r.mission.id+":"+s.id)).length?'<h4>Outros registros e Fundamentos</h4>'+answered.filter(([k])=>!(r.mission.steps||[]).some(s=>k===r.mission.id+":"+s.id)).map(([k,v])=>'<div class="mm-check"><small>'+esc(k)+'</small><pre>'+esc(typeof v==="string"?v:JSON.stringify(v,null,2))+'</pre></div>').join(""):"")+'</section>':"")+'<a class="btn btn-primary" href="'+link(r)+'">'+(status==="changes_requested"?"Revisar e reenviar":"Abrir missão")+' →</a></article>';
 root.querySelector("#mmBack").onclick=()=>{detail=null;render()};
}
function card(r){
 const sub=r.submission,status=situation(r),p=sub?estimateMissionXp(r.mission,sub.progress_snapshot||{}):r.local.progress;
 const pending=Object.values(sub?.grades?.blockIndicators||{}).filter(v=>Object.values(v).some(x=>x==="PA"||x==="NA")).length;
 return '<article class="mm-card '+(status==="changes_requested"?"mm-urgent":"")+'"><div class="mm-card-top"><div><small>Fase '+r.mission.phase+' · '+(r.mission.type==="training"?"Prática Guiada":"Prática Autônoma")+'</small><h3>'+esc(r.mission.title)+'</h3></div><span class="mm-status '+status+'">'+labels[status]+'</span></div><div class="mm-bar"><i style="width:'+p.percent+'%"></i></div><p class="mm-meta">'+p.completed+'/'+p.total+' etapas · '+p.percent+'% · '+(sub?"Enviada em "+date(sub.submitted_at):"Ainda não enviada")+'</p>'+(status==="changes_requested"?'<p class="mm-callout"><strong>Você tem ajustes para revisar.</strong> '+(pending?pending+" bloco(s) com menções PA/NA. ":"")+'Consulte as orientações do instrutor.</p>':"")+(sub?.feedback?'<p class="mm-feedback"><strong>Feedback:</strong> '+esc(sub.feedback)+'</p>':"")+'<div class="mm-actions">'+(sub?'<button class="btn btn-secondary" data-mm-detail="'+esc(r.mission.id)+'">Ver envio e feedback</button>':"")+'<a class="btn btn-primary" href="'+link(r)+'">'+(status==="changes_requested"?"Revisar e reenviar":sub?"Abrir missão":"Começar missão")+' →</a></div></article>';
}
function render(){
 if(detail){const r=rows.find(x=>x.mission.id===detail);if(r){renderDetail(r);return}detail=null}
 const counts=Object.fromEntries(filters.map(([key])=>[key,key==="all"?rows.length:rows.filter(r=>situation(r)===key).length]));
 const found=rows.filter(r=>(active==="all"||situation(r)===active)&&(!query||[r.mission.title,r.mission.subtitle,String(r.mission.phase)].some(x=>String(x||"").toLowerCase().includes(query))));
 root.innerHTML=(loadError?'<p class="mm-error">'+esc(loadError)+'</p>':"")+'<div class="mm-summary"><strong>'+counts.changes_requested+'</strong><span>missão(ões) aguardando sua revisão</span></div><div class="mm-controls"><div class="mm-filters">'+filters.map(([key,label])=>'<button type="button" class="mm-filter '+(active===key?"active":"")+'" data-mm-filter="'+key+'">'+label+' ('+counts[key]+')</button>').join("")+'</div><input id="mmSearch" type="search" placeholder="Buscar missão ou fase..." value="'+esc(query)+'" aria-label="Buscar missão"></div><div class="mm-list">'+(found.length?found.map(card).join(""):'<div class="mm-empty">Nenhuma missão corresponde aos filtros. <a href="missions.html">Explorar missões</a></div>')+'</div>';
 root.querySelectorAll("[data-mm-filter]").forEach(b=>b.onclick=()=>{active=b.dataset.mmFilter;render()});
 root.querySelector("#mmSearch").oninput=e=>{const pos=e.target.selectionStart;query=e.target.value.toLowerCase().trim();render();const input=root.querySelector("#mmSearch");input.focus();input.setSelectionRange(pos,pos)};
 root.querySelectorAll("[data-mm-detail]").forEach(b=>b.onclick=()=>{detail=b.dataset.mmDetail;render();root.scrollIntoView({block:"start"})});
}
async function load(){
 const state=getState();rows=MISSIONS.map(m=>({mission:m,local:localProgress(m,state),submission:null}));
 try{
  const sb=await getSupabase(),session=await getSession();if(!sb||!session){loadError="Faça login para consultar suas entregas registradas.";render();return}
  const {data:members,error:memberError}=await sb.from("class_members").select("class_id").eq("user_id",session.user.id).eq("status","active").limit(1);
  if(memberError)throw memberError;
  const classId=members?.[0]?.class_id;if(!classId){loadError="Nenhuma turma ativa encontrada para sua conta.";render();return}
  const {data,error}=await sb.from("mission_submissions").select("id,mission_id,status,submitted_at,is_late,feedback,grades,answers,evidence,progress_snapshot").eq("student_id",session.user.id).eq("class_id",classId).order("submitted_at",{ascending:false});
  if(error)throw error;
  const latest=new Map();for(const sub of data||[])if(!latest.has(sub.mission_id))latest.set(sub.mission_id,sub);
  rows.forEach(r=>r.submission=latest.get(r.mission.id)||null);
 }catch(e){loadError="Não foi possível consultar as entregas na nuvem: "+e.message}
 render();
}
load();
