import {distributeMissionXp} from "./mission-xp-allocation.js";
import {getSupabase,getSession} from "./supabase-client.js";
import {MISSIONS,EXTRA_MISSIONS} from "../data/missions.js";
import {getFundamental} from "../data/fundamentals.js";
import {mountStepEditor} from "./mission-step-editor.js";
const $=q=>document.querySelector(q),esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const id=new URLSearchParams(location.search).get("id"),mission=[...MISSIONS,...EXTRA_MISSIONS].find(x=>x.id===id),remote=EXTRA_MISSIONS.some(x=>x.id===id);
let sb,session,classId,stored={},draft={},fundamental=null,link=null,projects=[],requirements=[],indicators=[],schedule=null,classHours=null,mainEditor,fundEditor,dirty=false;
function message(text,bad=false){$("#builderFeedback").textContent=text;$("#builderFeedback").style.color=bad?"#b42318":""}
function status(){const s=stored.status||(stored.draft?"draft":"published");$("#builderStatus").textContent=({draft:"Rascunho",published:"Publicado",closed:"Encerrado",archived:"Arquivado"})[s]||"Publicado";if(stored.version&&s==="published")$("#builderStatus").textContent+=" · versão "+stored.version;$("#publishMission").textContent=s==="published"?"Publicar atualizações":"Publicar missão";$("#closeMission").disabled=s==="closed";$("#builderContext").textContent=id+" · "+(remote?"Atividade remota":mission.type==="training"?"Aprendizagem guiada · EduTech":"Projeto em equipe · Restaurante")}
function chosenProject(){return projects.find(p=>p.id===$("#builderProject").value)}
async function renderRequirements(){
 const project=chosenProject();
 const host=$("#builderRequirements");host.replaceChildren();
 if(!project)return;
 const {data,error}=await sb.from("project_requirements").select("code,title,description").eq("project_id",project.id).eq("active",true).order("sort_order");
 if(error)throw error;
 requirements=data||[];
 const checked=link?.project_id===project.id?(link.requirement_codes||[]):(project.slug===mission.project?mission.requirements||[]:[]);
 host.innerHTML='<p class="muted">Requisitos associados à missão:</p>'+requirements.map(r=>'<label class="builder-indicator"><input type="checkbox" value="'+esc(r.code)+'" '+(checked.includes(r.code)?"checked":"")+'><span><strong>'+esc(r.code)+' — '+esc(r.title)+'</strong><small>'+esc(r.description||"")+'</small></span></label>').join("");
}
function renderProjects(){
 const selected=link?.project_id||projects.find(p=>p.slug===mission.project)?.id||"";
 $("#builderProject").innerHTML=projects.map(p=>'<option value="'+esc(p.id)+'" '+(p.id===selected?"selected":"")+'>'+esc(p.name)+' ('+esc(p.project_type)+')</option>').join("");
 return renderRequirements();
}
async function saveProjectLink(){
 try{
 const project=chosenProject();if(!project)throw Error("Selecione um projeto.");
 const selected=[...$("#builderRequirements").querySelectorAll("input:checked")].map(x=>x.value);
 const codes=[...$("#builderIndicators").querySelectorAll("input:checked")].map(x=>x.value);
 const payload={class_id:classId,mission_id:id,project_id:project.id,requirement_codes:selected,indicator_codes:codes,implementation_note:$("#builderAssessmentNote").value,updated_by:session.user.id};
 const {error}=await sb.from("mission_curriculum_links").upsert(payload,{onConflict:"class_id,mission_id"});
 if(error)throw error;link={...link,...payload};dirty=false;status();message("Projeto e requisitos vinculados com sucesso. O estudante verá o projeto selecionado.");
 }catch(error){message("Não foi possível salvar o vínculo: "+error.message,true)}
}
function baseline(){const f=!remote&&mission.type==="training"?getFundamental(mission.phase):null;return {title:mission.title,subtitle:mission.subtitle||mission.official||"",steps:structuredClone(mission.steps||[]),...(f?{fundamental:{title:f.title,objective:f.objective,steps:structuredClone(f.steps||[])}}:{})}}
function working(){return {title:$("#builderTitle").value.trim(),subtitle:$("#builderSubtitle").value,steps:mainEditor.getSteps(),...(fundamental?{fundamental:{title:$("#fundamentalTitle").value.trim(),objective:$("#fundamentalObjective").value,steps:fundEditor.getSteps()}}:{})}}
function validate(value){
 if(!value.title)throw Error("Informe o título da missão.");
 for(const [name,steps] of [["Missão",value.steps],["Fundamentos",value.fundamental?.steps]]){
  if(!steps)continue;
  if(!Array.isArray(steps)||!steps.length||steps.some(s=>!s||!s.id||!s.title||!s.type)||new Set(steps.map(s=>s.id)).size!==steps.length)
   throw Error(name+": informe etapas com títulos, tipos e identificadores únicos.");
  for(const step of steps){if(step.xp!==undefined&&(!Number.isInteger(step.xp)||step.xp<0||step.xp>10000))throw Error(name+": XP inválido em "+step.title);if(step.indicators!==undefined&&(!Array.isArray(step.indicators)||step.indicators.some(code=>typeof code!=="string"||!code.trim())))throw Error(name+": indicadores inválidos em "+step.title)}
 }
}
function publishedSnapshot(data){
 return {title:data.title,subtitle:data.subtitle,steps:data.steps||[],...(data.fundamental?{fundamental:data.fundamental}:{})};
}
function removedPublishedSteps(previous,next){
 const missing=(a,b,prefix)=>{const current=new Set((b||[]).map(x=>x.id));return (a||[]).filter(x=>!current.has(x.id)).map(x=>prefix+": "+(x.title||x.id))};
 return [...missing(previous.steps,next.steps,"Missão"),...missing(previous.fundamental?.steps,next.fundamental?.steps,"Fundamentos")];
}
function populate(value){draft=structuredClone(value);$("#builderTitle").value=draft.title||"";$("#builderSubtitle").value=draft.subtitle||"";mainEditor.setSteps(draft.steps||[]);$("#missionXpBudget").value=String([...(draft.fundamental?.steps||[]),...(draft.steps||[])].reduce((sum,step)=>sum+(Number(step.xp)||0),0)||mission.maxXp||150);if(fundamental){$("#fundamentalTitle").value=draft.fundamental?.title??fundamental.title;$("#fundamentalObjective").value=draft.fundamental?.objective??fundamental.objective;fundEditor.setSteps(draft.fundamental?.steps??fundamental.steps)}dirty=false}
function switchMoment(name){const guided=Boolean(fundamental);if(!guided)return;const selected=name==="fundamentals"?"fundamentals":"practice";for(const button of document.querySelectorAll("[data-moment]")){const active=button.dataset.moment===selected;button.classList.toggle("active",active);button.setAttribute("aria-selected",String(active));button.tabIndex=active?0:-1}$("#momentFundamentals").hidden=selected!=="fundamentals";$("#momentPractice").hidden=selected!=="practice"}
function initMoments(){const guided=Boolean(fundamental);$("#guidedMomentNavigation").hidden=!guided;$("#momentFundamentals").hidden=!guided;$("#momentPractice").hidden=guided;$("#practiceMomentFooter").hidden=!guided;if(guided){$("#momentTabFundamentals").onclick=()=>switchMoment("fundamentals");$("#momentTabPractice").onclick=()=>switchMoment("practice");$("#goToPractice").onclick=()=>switchMoment("practice");$("#backToFundamentals").onclick=()=>switchMoment("fundamentals");$("#guidedMomentNavigation").addEventListener("keydown",event=>{if(!["ArrowLeft","ArrowRight"].includes(event.key))return;event.preventDefault();const target=event.key==="ArrowRight"?"practice":"fundamentals";switchMoment(target);$("#momentTab"+(target==="practice"?"Practice":"Fundamentals")).focus()});switchMoment("fundamentals")}}
function renderIndicators(){const codes=link?.indicator_codes||mission.competencies||[];$("#builderIndicators").innerHTML=(indicators.length?indicators:codes.map(code=>({code,name:code,description:""}))).map(i=>`<label class="builder-indicator"><input type="checkbox" value="${esc(i.code)}" ${codes.includes(i.code)?"checked":""}><span><strong>${esc(i.code)} — ${esc(i.name||"Indicador")}</strong><small>${esc(i.description||"")}</small></span></label>`).join("");$("#builderAssessmentNote").value=link?.implementation_note||""}
function hhmm(value){return value?String(value).slice(0,5):""}
function formatDate(value){return value?value.split("-").reverse().join("/"):"A definir"}
function renderOverview(){
 const value=working(),steps=[...(value.fundamental?.steps||[]),...(value.steps||[])];
 const active=steps.filter(s=>s.visible!==false),required=active.filter(s=>s.required!==false);
 const xp=steps.reduce((sum,s)=>sum+(Number(s.xp)||0),0);
 const codes=[...new Set(steps.flatMap(s=>s.indicators||s.indicator_codes||[]))];
 const state=stored.status||(stored.draft?"draft":"published");
 const card=(title,value,detail)=>'<article class="builder-overview-card"><small>'+esc(title)+'</small><strong>'+esc(value)+'</strong><span>'+esc(detail)+'</span></article>';
 $("#builderOverviewDetails").innerHTML='<h3>Configuração atual da missão</h3><div class="builder-overview-grid">'+
 card("Publicação",({draft:"Rascunho",published:"Publicada",closed:"Encerrada",archived:"Arquivada"})[state]||state,"Versão "+(stored.version||"inicial"))+
 card("Atividades",steps.length,required.length+" obrigatórias · "+(steps.length-active.length)+" ocultas")+
 card("XP configurado",xp+" XP",required.length+" blocos elegíveis para distribuição")+
 card("Indicadores dos blocos",codes.length,codes.join(", ")||"Nenhum associado")+
 card("Cronograma",schedule?"Aula "+schedule.lesson_number:"Não vinculada",schedule?formatDate(schedule.lesson_date)+" · "+schedule.execution_mode:"Configure na aba Disponibilidade")+
 card("Momentos",value.fundamental?"Fundamentos + prática":"Prática / atividade",value.fundamental?(value.fundamental.steps||[]).length+" fundamentos · "+value.steps.length+" prática":value.steps.length+" blocos")+
 '</div><p class="muted">Este resumo mostra a configuração em edição. Alterações só chegam aos estudantes após a publicação.</p>';
}
function renderSchedule(){
 const target=$("#builderSchedule"),form=$("#builderScheduleForm");
 if(!schedule){target.innerHTML='<p>Esta missão ainda não está vinculada a uma aula. Associe-a no <a href="class-schedule.html">Cronograma de Aulas</a> antes de editar a disponibilidade.</p>';form.hidden=true;return}
 target.innerHTML='<div class="builder-facts"><span>Aula '+esc(schedule.lesson_number)+'</span><span>'+esc(formatDate(schedule.lesson_date))+'</span><span>'+esc(schedule.execution_mode)+'</span></div><p>As alterações abaixo atualizam a aula vinculada no cronograma, sem modificar o conteúdo ou o progresso da missão.</p>';
 form.hidden=false;
 $("#scheduleLessonDate").value=schedule.lesson_date;
 $("#scheduleExecutionMode").value=schedule.execution_mode;
 $("#scheduleStartTime").value=hhmm(schedule.start_time_override)||hhmm(classHours?.lesson_start_time);
 $("#scheduleEndTime").value=hhmm(schedule.end_time_override)||hhmm(classHours?.lesson_end_time);
 const mode=$("#scheduleExecutionMode");mode.disabled=true;
 mode.title="Para trocar a modalidade, utilize o Cronograma de Aulas, que valida a associação entre missão e modalidade.";
}
async function saveSchedule(event){
 event.preventDefault();if(!schedule?.id)return;
 const date=$("#scheduleLessonDate").value,start=hhmm($("#scheduleStartTime").value),end=hhmm($("#scheduleEndTime").value);
 const feedback=$("#scheduleSaveFeedback"),button=$("#saveSchedule");
 if(!date||!start||!end||start>=end){feedback.textContent="Confira a data e os horários. O término precisa ser posterior ao início.";return}
 if(!confirm("Salvar nova data e horários da aula "+schedule.lesson_number+" no cronograma? Isso pode alterar a janela de acesso dos estudantes."))return;
 button.disabled=true;feedback.textContent="Salvando no cronograma...";
 try{
  const defaultStart=hhmm(classHours?.lesson_start_time),defaultEnd=hhmm(classHours?.lesson_end_time);
  const sameDefaults=start===defaultStart&&end===defaultEnd;
  const payload={lesson_date:date,start_time_override:sameDefaults?null:start,end_time_override:sameDefaults?null:end};
  const {data,error}=await sb.from("class_schedule").update(payload).eq("id",schedule.id).eq("class_id",classId).eq("mission_id",id).select("id,lesson_number,lesson_date,execution_mode,start_time_override,end_time_override").single();
  if(error)throw error;
  schedule=data;renderSchedule();renderOverview();feedback.textContent="Cronograma atualizado. A missão utilizará a nova data e os novos horários.";message("Disponibilidade sincronizada com o cronograma.");
 }catch(error){feedback.textContent="Não foi possível atualizar o cronograma: "+error.message}
 finally{button.disabled=false}
}

function preview(){
 const d=working();
 const frame=document.createElement("iframe");
 frame.className="builder-student-frame";
 frame.title="Prévia do ambiente do estudante";
 frame.setAttribute("sandbox","allow-scripts allow-same-origin");
 const doc={title:d.title,subtitle:d.subtitle,fundamental:d.fundamental||null,steps:d.steps};
 const payload=JSON.stringify(doc).replace(/</g,"\\u003c");
 frame.srcdoc=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="${location.href}"><link rel="stylesheet" href="css/variables.css"><link rel="stylesheet" href="css/global.css"><link rel="stylesheet" href="css/components.css"><link rel="stylesheet" href="css/dashboard.css"><link rel="stylesheet" href="css/journey.css"><link rel="stylesheet" href="css/responsive.css"><link rel="stylesheet" href="css/fundamentals-lab.css"><style>body{margin:0;padding:20px;background:var(--bg)}.mission-container{max-width:1060px;margin:auto}.builder-preview-navigation{display:flex;gap:10px;margin:15px 0 25px;flex-wrap:wrap}.builder-preview-navigation button[aria-selected=true]{outline:2px solid var(--accent)}.builder-preview-message{padding:14px;border:1px solid var(--line);border-radius:10px;margin-bottom:20px}.learning-step[hidden]{display:none}.mission-container{min-height:calc(100vh - 40px);display:flex;flex-direction:column;padding-bottom:0}.builder-preview-navigation[data-pager]{position:sticky;bottom:0;z-index:20;background:var(--bg);border-top:1px solid var(--line);padding:14px 12px;margin:20px -12px 0;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 -8px 20px rgba(0,0,0,.13)}.builder-preview-navigation[data-pager] span{font-size:.85rem;text-align:center}.learning-list{flex:1;min-height:0}@media(max-width:540px){.builder-preview-navigation[data-pager] button{padding:10px 12px}.builder-preview-navigation[data-pager] span{font-size:.75rem}}</style></head><body><main class="mission-container" id="studentRoot"></main><script type="module">
import {renderStep,bindStep} from "./js/step-renderer.js";
const data=${payload};
const root=document.querySelector("#studentRoot");
let moment=data.fundamental?"fundamentals":"practice",current=0;
const stores={fundamentals:{answers:new Map(),attempts:new Map(),done:new Set()},practice:{answers:new Map(),attempts:new Map(),done:new Set()}};
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function draw(){
 const unit=moment==="fundamentals"?data.fundamental:data;
 const steps=unit.steps||[];
 current=Math.max(0,Math.min(current,steps.length-1));
 root.innerHTML='<section class="mission-header"><p class="eyebrow">WEB ACADEMY • VISÃO DO ESTUDANTE</p><h1>'+esc(moment==="fundamentals"?"Fundamentos — "+unit.title:data.title)+'</h1><p>'+esc(moment==="fundamentals"?unit.objective:data.subtitle)+'</p><div class="mission-meta"><span class="pill">'+(moment==="fundamentals"?"1h30 • Fundamentos":"2h • Prática Guiada")+'</span><span class="pill">Prévia do instrutor</span></div></section><div class="builder-preview-navigation">'+(data.fundamental?'<button class="btn btn-secondary" data-moment="fundamentals" aria-selected="'+(moment==="fundamentals")+'">01 Fundamentos</button><button class="btn btn-secondary" data-moment="practice" aria-selected="'+(moment==="practice")+'">02 Prática Guiada</button>':'')+'</div><p class="builder-preview-message">Modo de teste: respostas, correções e conclusões funcionam nesta prévia, mas ficam apenas na memória temporária. Não afeta estudantes. Bloqueios de acesso e disponibilidade dependem da conta do aluno.</p><section class="learning-list">'+(steps.length?renderStep(steps[current],"PREVIEW",stores[moment].done.has(steps[current].id),{previewStore:stores[moment]}):'<p>Nenhuma atividade cadastrada.</p>')+'</section><div class="builder-preview-navigation" data-pager><button class="btn btn-secondary" data-previous '+(current===0?'disabled':'')+'>← Anterior</button><span>Atividade '+(steps.length?current+1:0)+' de '+steps.length+'</span><button class="btn btn-primary" data-next '+(current>=steps.length-1?'disabled':'')+'>Próxima →</button></div>';
 root.querySelectorAll("[data-moment]").forEach(button=>button.onclick=()=>{moment=button.dataset.moment;current=0;draw()});
 const previous=root.querySelector("[data-previous]"),next=root.querySelector("[data-next]");
 if(previous)previous.onclick=()=>{current--;draw()};
 if(next)next.onclick=()=>{current++;draw()};
 const step=steps[current];if(!step)return;
 const store=stores[moment];
 bindStep(step,"PREVIEW",()=>draw(),(_,stepId)=>{store.done.add(stepId);return true},{completed:store.done.has(step.id),previewStore:store});
 const card=root.querySelector("[data-step-card]");
 if(store.done.has(step.id))card.querySelector("[data-complete-step]").disabled=true;
}
draw();
<\/script></body></html>`;
 $("#builderPreviewBody").replaceChildren(frame);
 $("#builderWorkspace").hidden=true;$(".builder-tabs").hidden=true;$("#builderPreview").hidden=false
}
function exitPreview(){$("#builderPreview").hidden=true;$("#builderWorkspace").hidden=false;$(".builder-tabs").hidden=false}
async function save(mode){try{const value=working();validate(value);const next={...stored};if(mode==="draft"){next.draft=value;next.status=stored.status||(Object.keys(stored).length?"published":"draft")}else if(mode==="publish"){
 const removed=stored.status==="published"?removedPublishedSteps(stored,value):[];
 if(removed.length&&!confirm("Você removeu etapas da versão publicada:\\n"+removed.join("\\n")+"\\n\\nIsso pode afetar a consulta de respostas anteriores. Deseja continuar?"))return;
 const now=new Date().toISOString();
 const history=Array.isArray(stored.version_history)?stored.version_history:[];
 const previous=stored.status==="published"&&Array.isArray(stored.steps)?[{version:Number(stored.version)||1,published_at:stored.published_at||null,content:publishedSnapshot(stored)}]:[];
 next.version_history=[...history,...previous].slice(-10);
 next.version=(Number(stored.version)||0)+1;
 Object.assign(next,value);next.draft=null;next.status="published";next.published_at=now
}else if(mode==="close"){next.status="closed";next.draft=value}else throw Error("Ação inválida");const {error}=await sb.from("mission_content_overrides").upsert({class_id:classId,mission_id:id,content:next,updated_by:session.user.id,updated_at:new Date().toISOString()},{onConflict:"class_id,mission_id"});if(error)throw error;stored=next;dirty=false;status();renderOverview();message(mode==="draft"?"Alterações salvas. A versão publicada continua como estava.":mode==="publish"?"Conteúdo publicado. O acesso continua seguindo o cronograma.":"Publicação encerrada.");}catch(e){message("Não foi possível salvar: "+e.message,true)}}
async function saveAssessment(){if(remote)return;const selected=[...$("#builderIndicators").querySelectorAll("input:checked")].map(x=>x.value);if(!link?.project_id){message("Salve primeiro o projeto associado na aba Visão geral.",true);return}const {error}=await sb.from("mission_curriculum_links").upsert({class_id:classId,mission_id:id,project_id:link.project_id,indicator_codes:selected,requirement_codes:link.requirement_codes||[],implementation_note:$("#builderAssessmentNote").value,updated_by:session.user.id},{onConflict:"class_id,mission_id"});if(error)message(error.message,true);else{link={...link,indicator_codes:selected,implementation_note:$("#builderAssessmentNote").value};message("Critérios avaliativos salvos.")}}
async function init(){if(!mission){$("#builderLoading").textContent="Missão não encontrada.";return}try{sb=await getSupabase();session=await getSession();if(!sb||!session?.user)throw Error("Entre com sua conta de instrutor.");const {data:classes,error:classError}=await sb.from("classes").select("id,code").eq("instructor_id",session.user.id).eq("code","2026.36.8").limit(1);if(classError)throw classError;if(!classes?.length)throw Error("Turma de instrutor não encontrada.");classId=classes[0].id;const results=await Promise.all([sb.from("mission_content_overrides").select("content").eq("class_id",classId).eq("mission_id",id).maybeSingle(),sb.from("mission_curriculum_links").select("*").eq("class_id",classId).eq("mission_id",id).maybeSingle(),sb.from("learning_projects").select("id,slug,name,project_type").eq("class_id",classId).eq("active",true),sb.from("curriculum_indicators").select("code,name,description").eq("class_id",classId).order("sort_order"),sb.from("class_schedule").select("id,lesson_number,lesson_date,execution_mode,start_time_override,end_time_override").eq("class_id",classId).eq("mission_id",id).limit(1).maybeSingle()]);for(const r of results)if(r.error)throw r.error;stored=results[0].data?.content||{};link=results[1].data;projects=results[2].data||[];indicators=results[3].data||[];schedule=results[4].data;const {data:hours,error:hoursError}=await sb.from("classes").select("lesson_start_time,lesson_end_time").eq("id",classId).single();if(hoursError)throw hoursError;classHours=hours;fundamental=!remote&&mission.type==="training"?getFundamental(mission.phase):null;mainEditor=mountStepEditor($("#missionStepHost"));if(fundamental){$("#builderFundamental").hidden=false;fundEditor=mountStepEditor($("#fundamentalStepHost"),{context:"fundamentals"});$("#mainStepsHeading").textContent="Prática Guiada · EduTech"}if(remote)$("#mainStepsHeading").textContent="Atividade remota";if(!fundamental&&!remote)$("#mainStepsHeading").textContent="Prática em equipe · Restaurante";initMoments();populate(stored.draft||{...baseline(),...stored});renderIndicators();await renderProjects();renderSchedule();renderOverview();$("#builderFacts").innerHTML=`<span>Missão ${esc(id)}</span><span>${esc(remote?"Remota":mission.type==="training"?"EduTech":"Guilda")}</span><span>UC7</span>`;status();$("#builderLoading").hidden=true;$("#builderWorkspace").hidden=false;document.querySelectorAll("[data-tab]").forEach(btn=>btn.onclick=()=>{document.querySelectorAll("[data-tab]").forEach(b=>b.classList.toggle("active",b===btn));document.querySelectorAll("[data-panel]").forEach(p=>p.hidden=p.dataset.panel!==btn.dataset.tab);if(btn.dataset.tab==="config")renderOverview()});if(fundamental){$("#refreshFundamentals").onclick=()=>{const existing=fundEditor.getSteps();const updated=fundamental.steps||[];if(!confirm("Substituir as "+existing.length+" atividades atuais de Fundamentos pelas "+updated.length+" atividades do planejamento revisado? Isso removerá personalizações e atividades extras APENAS dos Fundamentos. A Prática Guiada não será alterada. Nada será gravado até clicar em Salvar alterações ou Publicar."))return;$("#fundamentalTitle").value=fundamental.title;$("#fundamentalObjective").value=fundamental.objective;fundEditor.setSteps(updated);dirty=true;message("Fundamentos atualizados na edição: "+updated.length+" atividades. Confira a pré-visualização e clique em Salvar alterações ou Publicar para persistir.");switchMoment("fundamentals")}};if(id==="1A"&&fundamental){$("#refreshGuidedPracticeHost").hidden=false;$("#refreshGuidedPractice").onclick=()=>{const existing=mainEditor.getSteps();const updated=structuredClone(mission.steps||[]);if(!confirm("Substituir as "+existing.length+" atividades atuais da Prática Guiada/Relatório pelas "+updated.length+" atividades do planejamento revisado da Missão 1A? Personalizações e etapas extras DESSE MOMENTO serão substituídas. Fundamentos e demais configurações não serão alterados. Nada será gravado até Salvar alterações ou Publicar."))return;mainEditor.setSteps(updated);dirty=true;message("Prática Guiada e relatório atualizados na edição: "+updated.length+" atividades. Confira a pré-visualização e salve ou publique para persistir.");switchMoment("practice")}};$("#builderScheduleForm").addEventListener("submit",saveSchedule);$("#distributeMissionXp").onclick=()=>{
 try{
  const total=Number($("#missionXpBudget").value);
  const {mission:allocated,eligibleCount}=distributeMissionXp(working(),total);
  mainEditor.setSteps(allocated.steps);
  if(fundEditor&&allocated.fundamental)fundEditor.setSteps(allocated.fundamental.steps);
  dirty=true;
  const text="Distribuídos "+total+" XP entre "+eligibleCount+" blocos. Revise e clique em Salvar alterações ou Publicar.";
  $("#missionXpDistributionSummary").textContent=text;message(text);
 }catch(error){message(error.message,true)}
};$("#saveMission").onclick=()=>save("draft");$("#publishMission").onclick=()=>save("publish");$("#closeMission").onclick=()=>{if(confirm("Encerrar esta publicação?"))save("close")};$("#previewMission").onclick=preview;$("#exitPreview").onclick=exitPreview;$("#restoreDefaults").onclick=()=>{if(confirm("Restaurar os campos ao planejamento inicial? Nada será salvo até você clicar em Salvar ou Publicar."))populate(baseline())};$("#builderProject").addEventListener("change",()=>{dirty=true;renderRequirements().catch(e=>message(e.message,true))});$("#saveProjectLink").addEventListener("click",saveProjectLink);$("#builderIndicators").addEventListener("change",saveAssessment);$("#builderAssessmentNote").addEventListener("change",saveAssessment);$("#builderWorkspace").addEventListener("input",()=>{dirty=true});window.addEventListener("beforeunload",e=>{if(dirty){e.preventDefault();e.returnValue=""}})}catch(e){$("#builderLoading").textContent="Não foi possível abrir o construtor: "+e.message;console.error(e)}}
init();