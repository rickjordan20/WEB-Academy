import {calculatePublishedXp} from "./mission-xp-allocation.js";
import {getSupabase,getSession} from "./supabase-client.js";
import {getMission,getFundamental} from "./mission-engine.js";
import {missionMaxXp,estimateMissionXp} from "./mission-assessment-utils.js";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=d=>d?new Date(d).toLocaleString("pt-BR"):"—";
const statuses={submitted:"Aguardando avaliação",changes_requested:"Ajustes solicitados",evaluated:"Avaliada"};
let rows=[],names=new Map(),classes=[],overrides=new Map(),current=null,filter="submitted",search="",missionFilter="";
function missionOf(id){return getMission(id)}
function effectiveDefinition(r,m,fundamental){
 const content=overrides.get(r.class_id+":"+r.mission_id)||{};
 return {steps:content.steps||m?.steps||[],fundamental:fundamental?{steps:content.fundamental?.steps||fundamental.steps||[]}:null};
}
function blockKey(unit,step){return unit+":"+step.id}
function checkedInSubmission(r,unit,step,m,fundamental){
 const snapshot=r.progress_snapshot||{};
 const completed=unit===m?.id?snapshot.mission?.completedSteps:unit===fundamental?.id?snapshot.fundamentals?.completedSteps:[];
 return Number(snapshot.version)>0&&Array.isArray(completed)&&completed.includes(step.id);
}
function indicators(m){return [...new Set(m?.competencies||[])]}
function keysFor(m,answers){return Object.entries(answers||{}).filter(([key])=>key.startsWith(m.id+":")||(m.type==="training"&&key.startsWith("F"+m.phase+":")))}
function answerText(v){return typeof v==="string"?v:JSON.stringify(v,null,2)}
function answerHTML(v){const value=answerText(v);if(/^https?:\/\//i.test(value.trim())){try{const u=new URL(value.trim());if(["http:","https:"].includes(u.protocol))return '<a target="_blank" rel="noopener noreferrer" href="'+esc(u.href)+'">'+esc(value)+'</a>'}catch{}}return '<pre class="eval-answer">'+esc(value)+'</pre>'}
function card(r){const m=missionOf(r.mission_id);return '<article class="eval-row"><div><strong>'+esc(m?.title||r.mission_id)+'</strong><p>'+esc(names.get(r.student_id)||"Estudante")+' · '+esc(classes.find(c=>c.id===r.class_id)?.code||"Turma")+' · '+fmt(r.submitted_at)+'</p><small>'+esc(indicators(m).join(" · ")||"Sem indicadores associados")+(r.is_late?' · <span class="eval-late">Fora do prazo</span>':"")+'</small></div><div class="eval-row-actions"><span class="eval-tag">'+esc(statuses[r.status]||r.status)+'</span><button class="btn btn-primary btn-small" data-open-eval="'+esc(r.id)+'">'+(r.status==="evaluated"?"Reavaliar":"Abrir avaliação")+' →</button></div></article>'}
function renderList(box){
 const missions=[...new Map(rows.map(r=>[r.mission_id,missionOf(r.mission_id)?.title||r.mission_id])).entries()];
 const counts={all:rows.length,submitted:0,changes_requested:0,evaluated:0};rows.forEach(r=>{counts[r.status]=(counts[r.status]||0)+1});
 const list=rows.filter(r=>(filter==="all"||r.status===filter)&&(!missionFilter||r.mission_id===missionFilter)&&(!search||[names.get(r.student_id),missionOf(r.mission_id)?.title,r.mission_id].some(v=>String(v||"").toLowerCase().includes(search))));
 box.innerHTML='<div class="eval-heading"><div><p class="eyebrow">UC7 · Acompanhamento formativo</p><h2>Central de Avaliação</h2><p class="muted">Abra cada entrega para analisar respostas, evidências, indicadores e feedback.</p></div></div><div class="eval-filters">'+["submitted","changes_requested","evaluated","all"].map(s=>'<button type="button" data-eval-filter="'+s+'" class="eval-filter '+(filter===s?"active":"")+'">'+({submitted:"Pendentes",changes_requested:"Ajustes solicitados",evaluated:"Avaliadas",all:"Todas"}[s])+' ('+(counts[s]||0)+')</button>').join("")+'</div><div class="eval-search"><input class="admin-input" data-eval-search placeholder="Buscar estudante ou missão" value="'+esc(search)+'"><select class="admin-input" data-eval-mission><option value="">Todas as missões</option>'+missions.map(([id,title])=>'<option value="'+esc(id)+'" '+(missionFilter===id?"selected":"")+'>'+esc(title)+'</option>').join("")+'</select></div><div class="eval-list">'+(list.length?list.map(card).join(""):'<p class="muted">Nenhuma entrega corresponde aos filtros.</p>')+'</div>';
 box.querySelectorAll("[data-eval-filter]").forEach(b=>b.onclick=()=>{filter=b.dataset.evalFilter;renderList(box)});
 box.querySelector("[data-eval-search]").oninput=e=>{const pos=e.target.selectionStart;search=e.target.value.toLowerCase().trim();renderList(box);const input=box.querySelector("[data-eval-search]");input.focus();input.setSelectionRange(pos,pos)};
 box.querySelector("[data-eval-mission]").onchange=e=>{missionFilter=e.target.value;renderList(box)};
 box.querySelectorAll("[data-open-eval]").forEach(b=>b.onclick=()=>openReview(box,b.dataset.openEval));
}
function reviewBlock(r,m,step,idx,unitId=m.id,completed=[]){
 const answer=(r.answers||{})[unitId+":"+step.id];
 const attempts=r.progress_snapshot?.codeAttempts?.[unitId+":"+step.id];
 const hasAnswer=answer!==undefined&&answer!==null&&answer!=="";
 const checked=completed.includes(step.id);
 const hasSnapshot=Number(r.progress_snapshot?.version)>0;
 const informational=["content","visual-summary"].includes(step.type);
 const suggestions=checked?["Etapa concluída conforme o registro da plataforma. Continue aplicando o que aprendeu nas próximas atividades.","A conclusão da etapa foi registrada. Recomendo revisar os procedimentos e manter as evidências organizadas.","Registro de conclusão identificado. A compreensão e a aplicação prática serão consideradas em conjunto com as demais evidências."]:["Ainda não há conclusão registrada para esta etapa. Revise as orientações e finalize a atividade.","Há registros parciais nesta etapa. Continue o desenvolvimento e apresente as evidências solicitadas.","Revise o conteúdo deste bloco e procure esclarecer as dúvidas antes de prosseguir."];
 const progress=Array.isArray(r.evidence)?r.evidence.filter(x=>x?.stepId===step.id):[];
 const blockCodes=[...new Set((step.indicators||step.competencies||[]).filter(x=>/^I[1-6]$/.test(x)))];
 const blockValues=r.grades?.blockIndicators?.[unitId+":"+step.id]||{};
 const blockAssessment=blockCodes.length?'<div class="eval-block-indicators"><strong>Indicadores deste bloco</strong>'+blockCodes.map(code=>'<div class="eval-indicator"><span>'+esc(code)+'</span><div class="eval-concepts">'+["A","PA","NA"].map(v=>'<label><input type="radio" name="block-ind-'+esc(unitId+":"+step.id+":"+code)+'" value="'+v+'" '+(blockValues[code]===v?"checked":"")+'> '+v+'</label>').join("")+'</div></div>').join("")+'</div>':"";
 const blockKeyValue=unitId+":"+step.id;
 const existingCheck=r.grades?.blockChecks?.[blockKeyValue]===true;
 const xpConfigured=Number(step.xp)||0;
 const awardControl='<label class="eval-xp-check"><input type="checkbox" data-eval-block-check="'+esc(blockKeyValue)+'" '+(checked?'':'disabled ')+(existingCheck&&checked?'checked':'')+'> Confirmar conclusão para XP ('+xpConfigured+' XP)</label>';
 const label=hasSnapshot?(checked?"✓ Check registrado":hasAnswer?"Resposta registrada, sem check":"Pendente: check não registrado"):"Entrega anterior ao registro de checks";
 return '<section class="eval-block"><div class="eval-block-head"><strong>'+(idx+1)+'. '+esc(step.title||step.id)+'</strong><span>'+esc(step.type||"Etapa")+'</span></div>'+(step.goal?'<p class="muted">'+esc(step.goal)+'</p>':"")+'<p class="eval-check-status">'+esc(label)+'</p>'+(hasAnswer?'<div class="eval-submitted"><small>Resposta enviada</small>'+answerHTML(answer)+'</div>':informational?'<p class="muted">Bloco informativo, sem resposta textual obrigatória.</p>':checked?'<p class="muted">Conclusão registrada por check. Esta etapa não contém resposta textual salva.</p>':'<p class="muted">Não há resposta textual nesta entrega.</p>')+(attempts?'<p class="muted">Verificações de código: '+esc(attempts.count||0)+' · Aprovadas: '+esc(attempts.passed||0)+'</p>':"")+progress.map(x=>'<div class="eval-submitted">'+answerHTML(x)+'</div>').join("")+blockAssessment+'<div class="eval-feedback-tools"><label>Modelo de feedback<select class="admin-input" data-feedback-template="'+esc(unitId+":"+step.id)+'"><option value="">Escolher sugestão (opcional)</option>'+suggestions.map((s,i)=>'<option value="'+i+'">'+esc(s)+'</option>').join("")+'</select></label><label class="eval-comment-label">Feedback deste bloco<textarea class="admin-input" rows="2" data-block-comment="'+esc(unitId+":"+step.id)+'" placeholder="Edite ou escreva uma orientação personalizada"></textarea></label></div></section>'
}

function openReview(box,id){
 const r=rows.find(x=>x.id===id);if(!r)return;current=id;const m=missionOf(r.mission_id);const inds=indicators(m);const g=r.grades||{},blockComments=g.blocks||{},concepts=g.indicators||{};
 const answers=keysFor(m,r.answers);const snapshot=r.progress_snapshot||{};const estimate=estimateMissionXp(m,snapshot);const maxXp=missionMaxXp(m);
 const hasSnapshot=estimate.hasSnapshot;
 
 const pendingMission=(m?.steps||[]).filter(step=>!(snapshot.mission?.completedSteps||[]).includes(step.id));
 const progressNote=hasSnapshot?'<div class="eval-pending-summary"><strong>'+pendingMission.length+' etapa(s) sem check na missão</strong><p>'+ (pendingMission.length?pendingMission.map(step=>esc(step.title||step.id)).join(" · "):"Todas as etapas da missão têm check.")+'</p></div>':'<div class="eval-pending-summary"><strong>Entrega antiga: checks não disponíveis</strong><p>Não é possível inferir a conclusão das etapas a partir da ausência de registro.</p></div>';const fundamental=m?.type==="training"?getFundamental(m.phase):null;
 const configured=effectiveDefinition(r,m,fundamental);
 const reviewMission={...m,steps:configured.steps};
 const reviewFundamental=fundamental?{...fundamental,steps:configured.fundamental.steps}:null;
 const stepIds=new Set([...(reviewMission?.steps||[]).map(s=>m.id+":"+s.id),...(reviewFundamental?.steps||[]).map(s=>reviewFundamental.id+":"+s.id)]);
 const extra=answers.filter(([k])=>!stepIds.has(k));
 box.innerHTML='<button class="btn btn-secondary btn-small" data-eval-back>← Voltar à Central</button><header class="eval-detail-header"><p class="eyebrow">Ficha individual de avaliação</p><h2>'+esc(m?.title||r.mission_id)+'</h2><p>'+esc(names.get(r.student_id)||"Estudante")+' · '+esc(classes.find(c=>c.id===r.class_id)?.code||"Turma")+' · '+fmt(r.submitted_at)+'</p><span class="eval-tag">'+esc(statuses[r.status]||r.status)+'</span></header>'+(r.is_late?'<div class="eval-late-box"><strong>Entrega fora do prazo</strong><p>Motivo: '+esc(r.late_reason||"Não informado")+'</p><p>Justificativa: '+esc(r.late_explanation||"Não informada")+'</p></div>':"")+'<div class="eval-progress-summary"><div><small>Progresso da missão</small><strong>'+estimate.completed+'/'+estimate.total+' etapas · '+estimate.percent+'%</strong><div class="eval-progress-track"><i style="width:'+estimate.percent+'%"></i></div></div><div><small>XP sugerido pelo progresso</small><strong>'+estimate.xp+' / '+maxXp+' XP</strong><span class="muted">Estimativa pelo check, não mede a qualidade da resposta.</span></div></div><h3>Produção enviada pelo estudante</h3><p class="muted">Respostas preservadas no momento da entrega. O conteúdo original da missão serve como referência; não é uma área de edição.</p>'+(reviewMission?.steps?.length?reviewMission.steps.map((step,i)=>reviewBlock(r,reviewMission,step,i,m.id,snapshot.mission?.completedSteps||[])).join(""):"")+(fundamental?'<h3>Fundamentos da aula</h3><p class="muted">Respostas e checks dos exercícios realizados na etapa de Fundamentos.</p>'+reviewFundamental.steps.map((step,i)=>reviewBlock(r,reviewMission,step,i,fundamental.id,snapshot.fundamentals?.completedSteps||[])).join(""):"")+(extra.length?'<section class="eval-block"><h3>Outros registros da missão</h3>'+extra.map(([k,v])=>'<div class="eval-submitted"><small>'+esc(k)+'</small>'+answerHTML(v)+'</div>').join("")+'</section>':"")+(Array.isArray(r.evidence)&&r.evidence.length?'<section class="eval-block"><h3>Evidências adicionais</h3>'+r.evidence.map(e=>'<div class="eval-submitted">'+answerHTML(e)+'</div>').join("")+'</section>':"")+'<section class="eval-block"><h3>Consolidação dos indicadores</h3><p class="muted">Registre a menção com base nas evidências da missão. A menção final da UC continua sob responsabilidade do instrutor.</p>'+(inds.length?inds.map(code=>'<div class="eval-indicator"><strong>'+esc(code)+'</strong><div class="eval-concepts">'+["A","PA","NA"].map(v=>'<label><input type="radio" name="eval-ind-'+esc(code)+'" value="'+v+'" '+(concepts[code]===v?"checked":"")+'> '+v+'</label>').join("")+'</div></div>').join(""):'<p class="muted">Esta missão não possui indicadores configurados.</p>')+'</section><section class="eval-block"><h3>Resultado e devolutiva</h3><label class="eval-comment-label">Feedback geral<textarea class="admin-input" rows="4" data-eval-feedback placeholder="Destaque avanços, dificuldades e próximos passos">'+esc(r.feedback||"")+'</textarea></label><label class="eval-comment-label">XP sugerido (editável; máximo da missão: '+maxXp+' XP)<input class="admin-input" type="number" min="0" max="'+maxXp+'" step="1" data-eval-xp value="'+esc(g.xp??(hasSnapshot?estimate.xp:0))+'"></label><p class="muted">O XP por bloco exige check registrado e confirmação do instrutor. Ao concluir a avaliação, o valor aprovado será registrado na ficha; a atualização do saldo do estudante ainda depende da integração segura com o sistema de pontuação.</p><div class="eval-actions"><button class="btn btn-secondary" data-eval-save="draft">Salvar rascunho</button><button class="btn btn-secondary" data-eval-save="changes_requested">Solicitar ajustes</button><button class="btn btn-primary" data-eval-save="evaluated">Concluir avaliação</button></div><p data-eval-message role="status"></p></section>';
 box.querySelector("[data-eval-back]").onclick=()=>{current=null;renderList(box)};
 box.querySelectorAll("[data-block-comment]").forEach(el=>{
  const saved=blockComments[el.dataset.blockComment];
  const stepId=el.dataset.blockComment.split(":").slice(1).join(":");
  const unit=el.dataset.blockComment.split(":")[0];
  const done=unit.startsWith("F")?snapshot.fundamentals?.completedSteps:snapshot.mission?.completedSteps;
  el.value=saved!==undefined?saved:(done||[]).includes(stepId)?"Etapa concluída conforme o registro da plataforma. Continue aplicando o que aprendeu nas próximas atividades.":"";
 });
 box.querySelectorAll("[data-feedback-template]").forEach(select=>select.addEventListener("change",()=>{
  if(select.value==="")return;
  const textarea=[...box.querySelectorAll("[data-block-comment]")].find(el=>el.dataset.blockComment===select.dataset.feedbackTemplate);
  if(textarea){textarea.value=select.options[select.selectedIndex].textContent;textarea.focus()}
 }));
 box.querySelectorAll("[data-eval-save]").forEach(b=>b.onclick=async()=>{
  const action=b.dataset.evalSave,feedback=box.querySelector("[data-eval-feedback]").value.trim(),xp=Number(box.querySelector("[data-eval-xp]").value);
  if(!Number.isFinite(xp)||xp<0||xp>maxXp){box.querySelector("[data-eval-message]").textContent="Informe XP entre 0 e "+maxXp+".";return}
  const indicatorGrades=Object.fromEntries(inds.map(code=>[code,box.querySelector('input[name="eval-ind-'+code+'"]:checked')?.value||""]).filter(([,v])=>v));
  if(action==="evaluated"&&inds.length&&Object.keys(indicatorGrades).length!==inds.length){box.querySelector("[data-eval-message]").textContent="Selecione A, PA ou NA em todos os indicadores antes de concluir.";return}
  if(action==="changes_requested"&&!feedback){box.querySelector("[data-eval-message]").textContent="Informe no feedback geral o que o estudante deve ajustar.";return}
  const blocks=Object.fromEntries([...box.querySelectorAll("[data-block-comment]")].map(el=>[el.dataset.blockComment,el.value.trim()]));
  const blockIndicators={...(g.blockIndicators||{})};
  for(const step of [...(m?.steps||[]).map(s=>[m.id,s]),...(fundamental?.steps||[]).map(s=>[fundamental.id,s])]){
   const [unit,s]=step,codes=[...new Set((s.indicators||s.competencies||[]).filter(v=>/^I[1-6]$/.test(v)))],entry={};
   for(const code of codes){const selected=box.querySelector('input[name="block-ind-'+unit+":"+s.id+":"+code+'"]:checked');if(selected)entry[code]=selected.value}
   if(codes.length)blockIndicators[unit+":"+s.id]=entry;
  }
  const blockChecks=Object.fromEntries([...box.querySelectorAll("[data-eval-block-check]")].map(el=>[el.dataset.evalBlockCheck,el.checked&&!el.disabled]));
  const awardDefinition={steps:reviewMission.steps.map(s=>({...s,id:blockKey(m.id,s)})),fundamental:reviewFundamental?{steps:reviewFundamental.steps.map(s=>({...s,id:blockKey(fundamental.id,s)}))}:null};
  const awarded=calculatePublishedXp(awardDefinition,{status:action==="evaluated"?"evaluated":action,published:action==="evaluated",blockChecks});
  const xpAward=action==="draft"?g.xpAward||null:{amount:awarded.xp,published:action==="evaluated",blocks:awarded.blocks,calculated_at:new Date().toISOString()};
  const grades={...g,blockChecks,xpAward,version:4,blocks,blockIndicators,indicators:indicatorGrades,progress:{completed:estimate.completed,total:estimate.total,percent:estimate.percent,hasSnapshot},xp:Number.isFinite(xp)?Math.max(0,Math.min(maxXp,Math.round(xp))):0,draft:action==="draft"};
  const status=action==="draft"?r.status:action;const payload={grades,feedback,...(action==="draft"?{}:{status,reviewed_at:new Date().toISOString(),reviewed_by:window.__evalInstructorId})};
  box.querySelectorAll("[data-eval-save]").forEach(x=>x.disabled=true);box.querySelector("[data-eval-message]").textContent="Salvando...";
  const {error}=await window.__evalSupabase.from("mission_submissions").update(payload).eq("id",r.id).eq("class_id",r.class_id).select("id").single();
  if(error){box.querySelectorAll("[data-eval-save]").forEach(x=>x.disabled=false);box.querySelector("[data-eval-message]").textContent="Falha ao salvar: "+error.message;return}
  Object.assign(r,payload);box.querySelector("[data-eval-message]").textContent=action==="draft"?"Rascunho salvo.":action==="evaluated"?"Avaliação registrada.":"Ajustes solicitados.";if(action!=="draft")setTimeout(()=>{if(current===r.id){current=null;renderList(box)}},650);
 });
}
export async function renderLateSubmissions(){
 const box=document.querySelector("#lateMissionReview");if(!box)return;
 box.textContent="Carregando entregas...";
 const sb=await getSupabase(),session=await getSession();if(!sb||!session){box.textContent="Entre na conta de instrutor para consultar as entregas.";return}
 window.__evalSupabase=sb;window.__evalInstructorId=session.user.id;
 const {data:owned,error:ce}=await sb.from("classes").select("id,code").eq("instructor_id",session.user.id);
 if(ce){box.textContent="Não foi possível consultar as turmas: "+ce.message;return}
 classes=owned||[];if(!classes.length){box.textContent="Nenhuma turma vinculada ao instrutor.";return}
 const {data:configuredRows,error:configError}=await sb.from("mission_content_overrides").select("class_id,mission_id,content").in("class_id",classes.map(c=>c.id));
 if(configError){box.textContent="Não foi possível carregar o XP configurado nas missões: "+configError.message;return}
 overrides=new Map((configuredRows||[]).map(item=>[item.class_id+":"+item.mission_id,item.content||{}]));
 const {data,error}=await sb.from("mission_submissions").select("id,class_id,student_id,mission_id,status,is_late,late_reason,late_explanation,submitted_at,feedback,answers,evidence,grades,progress_snapshot").in("class_id",classes.map(c=>c.id)).order("submitted_at",{ascending:false}).limit(500);
 if(error){box.textContent="Entregas indisponíveis: "+error.message;return}
 rows=data||[];
 const ids=[...new Set(rows.map(r=>r.student_id))];
 if(ids.length){const {data:profiles}=await sb.from("profiles").select("id,full_name").in("id",ids);names=new Map((profiles||[]).map(p=>[p.id,p.full_name]))}
 renderList(box);
}
