import "./cloud-bootstrap.js";
import {getSupabase,getSession} from "./supabase-client.js";
import {getState} from "./storage.js";
import {missionWindow} from "./mission-window.js";
import {MISSIONS,getFundamental} from "./mission-engine.js";
import {estimateMissionXp} from "./mission-assessment-utils.js";
const root=document.querySelector("#myMissions");
const esc=v=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const date=v=>v?new Date(v).toLocaleString("pt-BR"):"—";
const filters=[["all","Todas"],["changes_requested","Revisão solicitada"],["submitted","Aguardando avaliação"],["evaluated","Avaliadas"],["in_progress","Em andamento"],["not_started","Não iniciadas"]];
let rows=[],active="all",query="",detail=null,loadError="";
const available=r=>["open","closed"].includes(r.access?.state);
const actionLink=(r,label)=>available(r)?'<a class="btn btn-primary" href="'+link(r)+'">'+label+' →</a>':'<span class="btn btn-secondary" aria-disabled="true">🔒 '+esc(r.access?.message||"Aguardando publicação")+'</span>';
function localProgress(m,s){
 const done=s?.journey?.missionProgress?.[m.id]?.completedSteps||[];
 const started=Boolean(s?.journey?.missionProgress?.[m.id]?.startedAt||done.length||(s?.journey?.completedMissions||[]).includes(m.id));
 return {started,progress:estimateMissionXp(m,{version:1,mission:{completedSteps:done}})};
}
function situation(r){if(r.submission?.status==="changes_requested")return "changes_requested";if(r.submission?.status==="evaluated")return "evaluated";if(r.submission)return "submitted";return r.local.started?"in_progress":"not_started"}
const labels={changes_requested:"Revisão solicitada",evaluated:"Avaliada",submitted:"Aguardando avaliação",in_progress:"Em andamento",not_started:"Não iniciada"};
function link(r){return "mission.html?id="+encodeURIComponent(r.mission.id)}

const conceptName={A:"Aprendizagem demonstrada",PA:"Precisa melhorar",NA:"Ainda não demonstrada"};
function allSteps(r){
 const fundamental=r.mission.type==="training"?getFundamental(r.mission.phase):null;
 return [...(fundamental?.steps||[]).map(s=>({unit:fundamental.id,step:s,area:"Fundamentos",url:"fundamentals.html?phase="+r.mission.phase})),...(r.mission.steps||[]).map(s=>({unit:r.mission.id,step:s,area:s.title?.toLowerCase().includes("relatório")?"Relatório individual":"Prática da missão",url:link(r)}))];
}
function stepInfo(r,key){
 const match=allSteps(r).find(x=>x.unit+":"+x.step.id===key);
 if(match)return {...match,title:match.step.title||match.area};
 return {title:"Registro complementar",area:"Atividade da missão",url:link(r)};
}
function formatAnswer(value){
 if(Array.isArray(value)){
  const prompts=["O que eu fiz?","Como eu fiz?","O que eu aprendi?","Qual dificuldade encontrei?","Como resolvi ou tentei resolver?","Link da evidência"];
  return '<div class="mm-answer-fields">'+value.map((v,i)=>'<p><strong>'+esc(prompts[i]||"Resposta "+(i+1))+':</strong> '+(String(v||"").trim()?esc(v):'<em>Não respondido</em>')+'</p>').join("")+'</div>';
 }
 if(value&&typeof value==="object")return '<pre>'+esc(JSON.stringify(value,null,2))+'</pre>';
 return '<p class="mm-answer-text">'+(String(value??"").trim()?esc(value):'<em>Não respondido</em>')+'</p>';
}
function blockFeedback(r){
 const g=r.submission?.grades||{},blocks=g.blocks||{},concepts=g.blockIndicators||{};
 const entries=[...new Set([...Object.keys(blocks),...Object.keys(concepts)])];
 return entries.map(key=>{
  const info=stepInfo(r,key),result=concepts[key]||{},comment=String(blocks[key]||"").trim();
  const needs=Object.values(result).some(v=>v==="PA"||v==="NA");
  const generic=/^(Etapa concluída conforme o registro|Registro de conclusão identificado|A conclusão da etapa foi registrada|Ainda não há conclusão registrada|Revise o conteúdo deste bloco)/.test(comment);
  if(!needs&&!comment)return "";
  return '<article class="mm-block '+(needs?"mm-attention":"")+'"><small>'+esc(info.area)+'</small><h4>'+esc(info.title)+'</h4>'+(Object.keys(result).length?'<p>'+Object.entries(result).map(([k,v])=>'<span class="mm-concept" title="'+esc(conceptName[v]||v)+'">'+esc(k)+': '+esc(conceptName[v]||v)+'</span>').join("")+'</p>':"")+(comment&&!generic?'<p>'+esc(comment)+'</p>':generic?'<p class="mm-subtle">'+(needs?"Revise esta atividade conforme as orientações do instrutor.":"Confira se você registrou a conclusão desta atividade.")+'</p>':"")+(needs?'<p class="mm-need">Este conteúdo precisa de atenção.</p>':"")+'<a class="mm-step-link" href="'+info.url+'">Ir para '+esc(info.area.toLowerCase())+' →</a></article>';
 }).join("");
}
function renderDetail(r){
 const sub=r.submission,g=sub?.grades||{},snapshot=sub?.progress_snapshot||{},progress=sub?estimateMissionXp(r.mission,snapshot):r.local.progress;
 const status=situation(r),feedback=blockFeedback(r),steps=allSteps(r);
 const missionDone=new Set(snapshot.mission?.completedSteps||[]),fundDone=new Set(snapshot.fundamentals?.completedSteps||[]);
 const pending=sub?steps.filter(x=>!(x.unit===r.mission.id?missionDone:fundDone).has(x.step.id)):[];
 const attention=status==="changes_requested";
 const message=attention?"Seu instrutor pediu que você revise esta missão. Veja abaixo o que falta e abra a atividade correspondente.":status==="evaluated"?"Sua avaliação foi concluída. Veja o resultado e os comentários.":status==="submitted"?"Sua entrega foi recebida e aguarda a avaliação do instrutor.":"Continue de onde parou.";
 const overview=attention?'<section class="mm-next"><h3>Como corrigir minha missão?</h3><p>As orientações aparecem ao lado de cada atividade na página original da missão. Abra a correção para editar seus registros e reenviar.</p><a class="btn btn-primary" href="'+link(r)+'">Ir para a correção da missão →</a></section>':"";
 const pendingHTML=pending.length?'<section class="mm-review"><h3>Atividades sem conclusão registrada</h3><p class="mm-subtle">Confira as atividades que ainda não foram marcadas como concluídas.</p>'+pending.map(x=>'<div class="mm-task"><div><small>'+esc(x.area)+'</small><strong>'+esc(x.step.title||x.area)+'</strong></div><a href="'+link(r)+'">Ir para a missão →</a></div>').join("")+'</section>':"";
 const result=Object.entries(g.indicators||{}).map(([k,v])=>'<span class="mm-concept">'+esc(k)+': '+esc(conceptName[v]||v)+'</span>').join(" ");
 const answered=Object.entries(sub?.answers||{}).filter(([k])=>k.startsWith(r.mission.id+":")||k.startsWith("F"+r.mission.phase+":"));
 const answersHTML=answered.map(([key,value])=>{const info=stepInfo(r,key);return '<div class="mm-answer-item"><small>'+esc(info.area)+'</small><h4>'+esc(info.title)+'</h4>'+formatAnswer(value)+'</div>'}).join("");
 root.innerHTML='<button type="button" class="btn btn-secondary" id="mmBack">← Voltar às minhas missões</button><article class="mm-detail"><div class="mm-detail-head"><div><p class="eyebrow">Acompanhamento da missão</p><h2>'+esc(r.mission.title)+'</h2></div><span class="mm-status '+status+'">'+labels[status]+'</span></div><p>'+message+'</p>'+overview+(sub?.feedback?'<section class="mm-review mm-teacher"><h3>Recado do instrutor</h3><p>'+esc(sub.feedback)+'</p></section>':"")+'<div class="mm-stats"><div><small>Quanto você registrou</small><strong>'+progress.percent+'%</strong></div><div><small>Atividades marcadas</small><strong>'+progress.completed+' de '+progress.total+'</strong></div><div><small>Pontos '+(status==="evaluated"?"registrados":"possíveis (estimativa)")+'</small><strong>'+(status==="evaluated"?(g.xp??"—"):progress.xp)+'</strong></div></div><div class="mm-bar"><i style="width:'+progress.percent+'%"></i></div><p class="mm-subtle">O percentual considera as etapas da missão marcadas como concluídas. Não representa sua nota nem garante aprovação.</p>'+(sub?'<p class="mm-meta">Último envio: '+date(sub.submitted_at)+(sub.is_late?" · Fora do prazo":"")+'</p>':'<p class="mm-meta">Esta missão ainda não foi enviada.</p>')+pendingHTML+(result?'<section class="mm-review"><h3>Como fui avaliado?</h3><p>'+result+'</p></section>':"")+(feedback?'<section class="mm-review"><h3>Comentários sobre as atividades</h3>'+feedback+'</section>':"")+(answersHTML?'<details class="mm-review mm-answers"><summary>Ver minhas respostas enviadas ('+answered.length+')</summary><p class="mm-subtle">Estas são as respostas salvas no último envio. Para mudar alguma resposta, abra a atividade.</p>'+answersHTML+'</details>':"")+'<div class="mm-actions"><a class="btn btn-primary" href="'+link(r)+'">'+(attention?"Corrigir na missão":"Abrir missão")+' →</a></div></article>';
 root.querySelector("#mmBack").onclick=()=>{detail=null;render()};

}
function card(r){
 const sub=r.submission,status=situation(r),p=sub?estimateMissionXp(r.mission,sub.progress_snapshot||{}):r.local.progress;
 const pending=Object.values(sub?.grades?.blockIndicators||{}).filter(v=>Object.values(v).some(x=>x==="PA"||x==="NA")).length;
 return '<article class="mm-card '+(status==="changes_requested"?"mm-urgent":"")+'"><div class="mm-card-top"><div><small>Fase '+r.mission.phase+' · '+(r.mission.type==="training"?"Prática Guiada":"Prática Autônoma")+'</small><h3>'+esc(r.mission.title)+'</h3></div><span class="mm-status '+status+'">'+labels[status]+'</span></div><div class="mm-bar"><i style="width:'+p.percent+'%"></i></div><p class="mm-meta">'+p.completed+'/'+p.total+' etapas · '+p.percent+'% · '+(sub?"Enviada em "+date(sub.submitted_at):"Ainda não enviada")+'</p>'+(status==="changes_requested"?'<p class="mm-callout"><strong>Você tem ajustes para revisar.</strong> '+(pending?pending+" atividade(s) precisam de atenção. ":"")+'Veja o recado do instrutor e saiba onde corrigir.</p>':"")+(sub?.feedback?'<p class="mm-feedback"><strong>Feedback:</strong> '+esc(sub.feedback)+'</p>':"")+'<div class="mm-actions">'+(sub?'<button class="btn btn-secondary" data-mm-detail="'+esc(r.mission.id)+'">Ver detalhes da avaliação</button>':"")+'<a class="btn btn-primary" href="'+link(r)+'">'+(status==="changes_requested"?"Abrir para corrigir":sub?"Abrir missão":"Começar missão")+' →</a></div></article>';
}
function render(){
 if(detail){const r=rows.find(x=>x.mission.id===detail);if(r){renderDetail(r);return}detail=null}
 const counts=Object.fromEntries(filters.map(([key])=>[key,key==="all"?rows.length:rows.filter(r=>situation(r)===key).length]));
 const found=rows.filter(r=>(active==="all"||situation(r)===active)&&(!query||[r.mission.title,r.mission.subtitle,String(r.mission.phase)].some(x=>String(x||"").toLowerCase().includes(query))));
 root.innerHTML=(loadError?'<p class="mm-error">'+esc(loadError)+'</p>':"")+'<div class="mm-summary"><strong>'+counts.changes_requested+'</strong><span>missão(ões) aguardando sua revisão</span></div><div class="mm-controls"><div class="mm-filters">'+filters.map(([key,label])=>'<button type="button" class="mm-filter '+(active===key?"active":"")+'" data-mm-filter="'+key+'">'+label+' ('+counts[key]+')</button>').join("")+'</div><input id="mmSearch" type="search" placeholder="Buscar missão ou fase..." value="'+esc(query)+'" aria-label="Buscar missão"></div><div class="mm-list">'+(found.length?found.map(card).join(""):'<div class="mm-empty">Nenhuma missão corresponde aos filtros. <a href="missions.html">Explorar missões</a></div>')+'</div>';
 root.querySelectorAll("[data-mm-filter]").forEach(b=>b.onclick=()=>{active=b.dataset.mmFilter;render()});
 root.querySelector("#mmSearch").oninput=e=>{const pos=e.target.selectionStart;query=e.target.value.toLowerCase().trim();render();const input=root.querySelector("#mmSearch");input.focus();input.setSelectionRange(pos,pos)};
 root.querySelectorAll("[data-mm-detail],[data-mm-correct]").forEach(b=>b.onclick=()=>{detail=b.dataset.mmDetail||b.dataset.mmCorrect;render();root.scrollIntoView({block:"start"})});
}
async function load(){
 const state=getState();rows=MISSIONS.map(m=>({mission:m,local:localProgress(m,state),submission:null,access:null}));
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
 await refreshAccess();
 render();
}
async function refreshAccess(){const result=await Promise.all(rows.map(async r=>{try{return await missionWindow(r.mission.id)}catch{return {state:"error",message:"Acesso indisponível"}}}));rows.forEach((r,i)=>r.access=result[i]);}
load();
setInterval(async()=>{if(document.hidden)return;await refreshAccess();render()},60000);
document.addEventListener("visibilitychange",async()=>{if(!document.hidden){await refreshAccess();render()}});
