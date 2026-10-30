import {calculatePublishedXp} from "./mission-xp-allocation.js";
import {getSupabase,getSession} from "./supabase-client.js";
import {mountMissionParticipation} from "./mission-participation.js";
import {getMission,getFundamental} from "./mission-engine.js";
import {EXTRA_MISSIONS} from "../data/missions.js";
import {missionMaxXp,estimateMissionXp} from "./mission-assessment-utils.js";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=d=>d?new Date(d).toLocaleString("pt-BR"):"—";
const statuses={submitted:"Aguardando avaliação",changes_requested:"Ajustes solicitados",evaluated:"Avaliada"};
let rows=[],names=new Map(),classes=[],overrides=new Map(),current=null,filter="submitted",search="",missionFilter="";
let indicatorCatalog=new Map();
let guildNamesByStudent=new Map();
const missionCategory=m=>m?.type==="guild"?"group":m?.type==="guided"?"guided":"individual";
const missionCategoryLabel=m=>missionCategory(m)==="group"?"👥 Em grupo · Restaurante":missionCategory(m)==="guided"?"👤 Individual · EduTech":"👤 Individual";
const guildNameFor=r=>guildNamesByStudent.get(r.class_id+":"+r.student_id)||"Grupo não identificado";
const indicatorLabel=code=>code+(indicatorCatalog.get(code)?.name?" — "+indicatorCatalog.get(code).name:"");
const indicatorDescription=code=>indicatorCatalog.get(code)?.description||"";
function missionOf(id,classId){
 const builtin=getMission(id)||EXTRA_MISSIONS.find(m=>m.id===id);
 if(builtin){const stored=overrides.get(classId+":"+id)||{};const configured=Array.isArray(stored.steps)&&stored.steps.length?stored:Array.isArray(stored.draft?.steps)&&stored.draft.steps.length?stored.draft:stored;const steps=Array.isArray(configured.steps)&&configured.steps.length?configured.steps:builtin.steps||[];return {...builtin,steps,competencies:[...new Set([...(builtin.competencies||[]),...steps.flatMap(step=>step.indicators||step.competencies||[])])],maxXp:id==="R2"?steps.reduce((sum,step)=>sum+Math.max(0,Number(step.xp)||0),0):builtin.maxXp};}
 const stored=overrides.get(classId+":"+id)||{};
 const configured=Array.isArray(stored.steps)&&stored.steps.length?stored:Array.isArray(stored.draft?.steps)&&stored.draft.steps.length?stored.draft:stored;
 const steps=Array.isArray(configured.steps)?configured.steps:[];
 const title=configured.title||stored.title||configured.name||stored.name||("Missão "+id);
 const competencies=Array.isArray(configured.competencies)?configured.competencies:Array.isArray(stored.competencies)?stored.competencies:[...new Set(steps.flatMap(step=>step.indicators||step.competencies||[]))];
 return {id,title,subtitle:configured.subtitle||stored.subtitle||"",steps,competencies,type:configured.type||stored.type||"custom",maxXp:Number(configured.maxXp??stored.maxXp??0)||0};
}
function effectiveDefinition(r,m,fundamental){
 const stored=overrides.get(r.class_id+":"+r.mission_id)||{};const content=Array.isArray(stored.steps)&&stored.steps.length?stored:Array.isArray(stored.draft?.steps)&&stored.draft.steps.length?stored.draft:stored;
 const saved=r.progress_snapshot?.requirements;
 if(saved?.mission?.steps&&saved.missionId===r.mission_id)return {steps:saved.mission.steps,fundamental:fundamental?{steps:saved.fundamentals?.steps||fundamental.steps||[]}:null,source:"submission"};
 return {steps:Array.isArray(content.steps)&&content.steps.length?content.steps:m?.steps||[],fundamental:fundamental?{steps:Array.isArray(content.fundamental?.steps)&&content.fundamental.steps.length?content.fundamental.steps:fundamental.steps||[]}:null,source:"current"};
}
function completedIds(snapshot,kind){const ids=snapshot?.[kind]?.completedSteps;return Array.isArray(ids)?ids:[]}
function historicalSteps(r,unit,configuredSteps){
 const known=new Set((configuredSteps||[]).map(s=>String(s.id)));
 const keys=Object.keys(r.answers||{}).filter(k=>k.startsWith(unit+":"));
 const completed=completedIds(r.progress_snapshot,unit===r.mission_id?"mission":"fundamentals");
 const missing=new Set();
 for(const key of keys){
  const suffix=key.slice(unit.length+1);
  if(suffix.endsWith(":revealed"))continue;
  if(suffix==="guild_self_review")continue; // Ficha oficial da Guilda, não etapa obsoleta.
  if(![...known].some(id=>suffix===id||suffix.startsWith(id+":")))missing.add(suffix.split(":")[0]);
 }
 for(const id of completed)if(!known.has(String(id)))missing.add(String(id));
 return [...missing].filter(Boolean);
}
function checkSummary(r,m,missionSteps,fundamental,foundationSteps){
 const snapshot=r.progress_snapshot||{};
 const missionDone=completedIds(snapshot,"mission");
 const foundationDone=completedIds(snapshot,"fundamentals");
 const known=new Set((missionSteps||[]).map(s=>String(s.id)));
 const obsolete=missionDone.filter(id=>!known.has(String(id)));
 const valid=missionDone.filter(id=>known.has(String(id)));
 const fundKnown=new Set((foundationSteps||[]).map(s=>String(s.id)));
 const fundValid=foundationDone.filter(id=>fundKnown.has(String(id)));
 const versionKnown=Number(snapshot.version)>0;
 return {missionDone,foundationDone,valid,obsolete,fundValid,versionKnown,
  missionTotal:(missionSteps||[]).length,foundationTotal:(foundationSteps||[]).length,
  historical:[...new Set([...historicalSteps(r,m.id,missionSteps),...(fundamental?historicalSteps(r,fundamental.id,foundationSteps):[])])]};
}
function blockKey(unit,step){return unit+":"+step.id}
function checkedInSubmission(r,unit,step,m,fundamental){
 const snapshot=r.progress_snapshot||{};
 const completed=unit===m?.id?snapshot.mission?.completedSteps:unit===fundamental?.id?snapshot.fundamentals?.completedSteps:[];
 return Number(snapshot.version)>0&&Array.isArray(completed)&&completed.includes(step.id);
}
function indicators(m){return [...new Set([...(m?.competencies||[]),...(m?.steps||[]).flatMap(step=>step.indicators||step.competencies||[])].filter(code=>/^I[1-6]$/.test(code)))]}
function keysFor(m,answers){return Object.entries(answers||{}).filter(([key])=>key.startsWith(m.id+":")||(m.type==="training"&&key.startsWith("F"+m.phase+":")))}
function answerText(v){return typeof v==="string"?v:JSON.stringify(v,null,2)}
const answerLabels={answer:"Resposta",response:"Resposta",value:"Valor",text:"Texto",content:"Conteúdo",description:"Descrição",summary:"Resumo",url:"Link",link:"Link",file_url:"Arquivo",filename:"Arquivo",file_name:"Arquivo",name:"Nome",type:"Tipo",language:"Linguagem",code:"Código",notes:"Observações",comment:"Comentário",result:"Resultado",output:"Saída",status:"Situação",created_at:"Registrado em",stepId:"Etapa"};
function answerHTML(v,depth=0){
 if(v===null||v===undefined||v==="")return '<p class="eval-empty">Não informado</p>';
 if(typeof v==="string"){
  const value=v.trim();
  if(/^https?:\/\//i.test(value)){try{const u=new URL(value);if(["http:","https:"].includes(u.protocol))return '<a class="eval-answer-link" target="_blank" rel="noopener noreferrer" href="'+esc(u.href)+'">'+esc(value)+'</a>'}catch{}}
  return '<div class="eval-answer-text">'+esc(v)+'</div>';
 }
 if(typeof v!=="object")return '<span class="eval-answer-text">'+esc(String(v))+'</span>';
 if(depth>5)return '<pre class="eval-answer">'+esc(answerText(v))+'</pre>';
 if(Array.isArray(v))return v.length?'<ol class="eval-answer-list">'+v.map(item=>'<li>'+answerHTML(item,depth+1)+'</li>').join("")+'</ol>':'<p class="eval-empty">Nenhum item registrado.</p>';
 const entries=Object.entries(v);
 if(!entries.length)return '<p class="eval-empty">Nenhum dado registrado.</p>';
 return '<dl class="eval-answer-fields">'+entries.map(([key,value])=>'<div class="eval-answer-field"><dt>'+esc(answerLabels[key]||key.replace(/[_-]/g," "))+'</dt><dd>'+answerHTML(value,depth+1)+'</dd></div>').join("")+'</dl>';
}
function readiness(r){
 const m=missionOf(r.mission_id,r.class_id);
 const entries=Object.entries(r.answers||{}).filter(([k,v])=>!k.endsWith(":revealed")&&v!=null&&v!==""&&!(Array.isArray(v)&&!v.length));
 const form=r.answers?.[r.mission_id+":guild_self_review"]?.form||{};
 const guildDetails=[form.taskReflection,form.contribution,form.participation,form.evidence].some(v=>typeof v==="string"&&v.trim());
 const evidence=Array.isArray(r.evidence)?r.evidence.filter(Boolean):[];
 const reasons=[];
 if(!r.submitted_at)reasons.push("Data de envio ausente");
 if(!entries.length&&!evidence.length&&!guildDetails)reasons.push("Sem respostas ou evidências registradas");
 if(m?.type==="guild"&&!guildDetails&&!evidence.length)reasons.push("Ficha individual da Guilda não localizada");
 const warnings=[];
 if(r.progress_snapshot?.mission?.completed!==true)warnings.push("Snapshot não concluído");
 return {ready:reasons.length===0,reasons,warnings};
}
function card(r){const check=readiness(r);const note=[...check.reasons,...check.warnings].join(' · ');const m=missionOf(r.mission_id,r.class_id);return '<article class="eval-row"><div><div class="eval-mission-identification"><span class="eval-mission-type '+(missionCategory(m)==='group'?'eval-mission-group':'eval-mission-individual')+'">'+esc(missionCategoryLabel(m))+'</span><span class="eval-mission-code">Missão '+esc(r.mission_id)+'</span></div><strong>'+esc(m?.title||r.mission_id)+'</strong>'+(missionCategory(m)==='group'?'<p class="eval-guild-name">Grupo: '+esc(guildNameFor(r))+'</p>':'')+'<p>'+esc(names.get(r.student_id)||"Estudante")+' · '+esc(classes.find(c=>c.id===r.class_id)?.code||"Turma")+' · '+fmt(r.submitted_at)+'</p><small>'+esc(indicators(m).map(indicatorLabel).join(" · ")||"Sem indicadores associados")+(r.is_late?' · <span class="eval-late">Fora do prazo</span>':"")+'</small></div><div class="eval-row-actions"><span class="eval-tag" title="'+esc(note||"Registros disponíveis para análise") +'" style="border-color:'+(check.ready?"#267a5a":"#b7791f")+';color:'+(check.ready?"#66d8a6":"#f2c16d") +'">'+(check.ready?"Apto para análise":"Verificar registros")+'</span><span class="eval-tag">'+esc(statuses[r.status]||r.status)+'</span><button class="btn btn-primary btn-small" data-open-eval="'+esc(r.id)+'">'+(r.status==="evaluated"?"Reavaliar":"Abrir avaliação")+' →</button></div></article>'}
function renderList(box){
 const missions=[...new Map(rows.map(r=>{const m=missionOf(r.mission_id,r.class_id);return [r.mission_id,'['+r.mission_id+'] '+missionCategoryLabel(m)+' — '+(m?.title||r.mission_id)]})).entries()];
 const counts={all:rows.length,submitted:0,changes_requested:0,evaluated:0};rows.forEach(r=>{counts[r.status]=(counts[r.status]||0)+1});
 const list=rows.filter(r=>(filter==="all"||r.status===filter)&&(!missionFilter||r.mission_id===missionFilter)&&(!search||[names.get(r.student_id),missionOf(r.mission_id,r.class_id)?.title,r.mission_id,missionCategoryLabel(missionOf(r.mission_id,r.class_id)),guildNameFor(r)].some(v=>String(v||"").toLowerCase().includes(search))));
 box.innerHTML='<div class="eval-heading"><div><p class="eyebrow">UC7 · Acompanhamento formativo</p><h2>Central de Avaliação</h2><p class="muted">Abra cada entrega para analisar respostas, evidências, indicadores e feedback.</p></div></div><div class="eval-filters">'+["submitted","changes_requested","evaluated","all"].map(s=>'<button type="button" data-eval-filter="'+s+'" class="eval-filter '+(filter===s?"active":"")+'">'+({submitted:"Pendentes",changes_requested:"Ajustes solicitados",evaluated:"Avaliadas",all:"Todas"}[s])+' ('+(counts[s]||0)+')</button>').join("")+'</div><div class="eval-search"><input class="admin-input" data-eval-search placeholder="Buscar estudante ou missão" value="'+esc(search)+'"><select class="admin-input" data-eval-mission><option value="">Todas as missões</option>'+missions.map(([id,title])=>'<option value="'+esc(id)+'" '+(missionFilter===id?"selected":"")+'>'+esc(title)+'</option>').join("")+'</select></div><div class="eval-list">'+(list.length?list.map(card).join(""):'<p class="muted">Nenhuma entrega corresponde aos filtros.</p>')+'</div>';
 box.querySelectorAll("[data-eval-filter]").forEach(b=>b.onclick=()=>{filter=b.dataset.evalFilter;renderList(box)});
 box.querySelector("[data-eval-search]").oninput=e=>{const pos=e.target.selectionStart;search=e.target.value.toLowerCase().trim();renderList(box);const input=box.querySelector("[data-eval-search]");input.focus();input.setSelectionRange(pos,pos)};
 box.querySelector("[data-eval-mission]").onchange=e=>{missionFilter=e.target.value;renderList(box)};
 box.querySelectorAll("[data-open-eval]").forEach(b=>b.onclick=()=>openReview(box,b.dataset.openEval));
}
const stepTypeLabels={content:"Conteúdo de estudo","visual-summary":"Resumo visual","image-review":"Revisão visual",flashcards:"Cartões de revisão",quiz:"Questão",checkpoint:"Questão objetiva",evidence:"Registro de evidência",practice:"Atividade prática"};
function responseForStep(answers,unitId,step){
 const prefix=unitId+":"+step.id;
 const entries=Object.entries(answers||{}).filter(([key])=>key===prefix||key.startsWith(prefix+":"));
 return {value:entries.find(([key])=>key===prefix)?.[1],extras:entries.filter(([key])=>key!==prefix&&!key.endsWith(":revealed")),keys:entries.map(([key])=>key)};
}
function displayExtraAnswer(key,value){
 if(key.endsWith(":revealed"))return "";
 const label=key.split(":").pop();
 return '<div class="eval-submitted"><small>'+esc(/^q[0-9]+$/i.test(label)?"Questão "+label.slice(1):"Registro complementar")+'</small>'+answerHTML(value)+'</div>';
}
function objectiveResult(step,answer){
 if(!["quiz","checkpoint"].includes(step.type)||!Array.isArray(step.options)||step.answer===null||step.answer===undefined||!Number.isInteger(Number(step.answer)))return null;
 const selected=(typeof answer==="number"||typeof answer==="string"&&/^[0-9]+$/.test(answer.trim()))?Number(answer):null;
 if(selected===null||!Number.isInteger(selected)||selected<0||selected>=step.options.length)return {answered:false};
 const correct=Number(step.answer);
 if(correct<0||correct>=step.options.length)return null;
 return {answered:true,selected,correct,passed:selected===correct};
}
function automaticSummary(r,mission,fundamental){
 const units=[[mission.id,mission.steps||[],"mission"],...(fundamental?[[fundamental.id,fundamental.steps||[],"fundamentals"]]:[])];
 const objectives=[],checks=[];
 for(const [unit,steps,kind] of units){
  const done=completedIds(r.progress_snapshot,kind);
  for(const step of steps){
   const response=responseForStep(r.answers,unit,step);
   const result=objectiveResult(step,response.value);
   if(result)objectives.push({unit,step,result,response});
   checks.push({unit,step,checked:done.includes(step.id)});
  }
 }
 return {objectives,checks};
}
function isManualStep(step,response){
 if(["quiz","checkpoint"].includes(step.type))return false;
 if(["content","visual-summary","image-review","flashcards"].includes(step.type))return false;
 return ["evidence","practice","text","textarea","reflection","upload","form","code","editor","sequence"].includes(step.type)||response.value!==undefined&&response.value!==null&&response.value!==""||response.extras.some(([key])=>!key.endsWith(":revealed"));
}
function feedbackSuggestions(r,mission,fundamental){
 const {objectives,checks}=automaticSummary(r,mission,fundamental);
 const snapshotKnown=Number(r.progress_snapshot?.version)>0;
 const completed=checks.filter(item=>item.checked);
 const missing=checks.filter(item=>!item.checked);
 const correct=objectives.filter(item=>item.result.passed);
 const incorrect=objectives.filter(item=>item.result.answered&&!item.result.passed);
 const unanswered=objectives.filter(item=>!item.result.answered);
 const titles=items=>items.map(item=>item.step.title||item.step.id).join("; ");
 let checksText="";
 if(!snapshotKnown)checksText="O histórico de checks desta entrega não está disponível. Não é possível confirmar quais etapas foram marcadas apenas pelos dados preservados.";
 else if(!checks.length)checksText="Esta missão não possui etapas com checks configurados para conferência.";
 else checksText="Foram registrados "+completed.length+" de "+checks.length+" checks previstos na configuração atual."+
  (completed.length?" Etapas com conclusão registrada: "+titles(completed)+".":" Não há checks de conclusão registrados nas etapas atuais.")+
  (missing.length?" Etapas sem registro de check: "+titles(missing)+".":" Todas as etapas atuais apresentam check registrado.")+
  " Os checks indicam conclusão registrada, não comprovam isoladamente o domínio das competências.";
 const objectiveTexts={};
 for(const {unit,step,result} of objectives){
  const key=unit+":"+step.id,topic=step.title||step.question||step.id;
  objectiveTexts[key]=!result.answered?"Não há resposta registrada para a questão sobre "+topic+". Recomendo retomar o enunciado e responder à atividade.":
   result.passed?"Sua resposta à questão sobre "+topic+" está correta conforme o gabarito. Continue aplicando esse conhecimento nas atividades práticas.":
   "Na questão sobre "+topic+", a alternativa selecionada não corresponde ao gabarito. Revise o conteúdo e considere a resposta correta: "+String(step.options[result.correct])+".";
 }
 const objectiveSummary=objectives.length?" Nas questões objetivas com gabarito, houve "+correct.length+" acerto(s) em "+objectives.length+" questão(ões), "+incorrect.length+" erro(s) e "+unanswered.length+" sem resposta.":" Não há questões objetivas com gabarito válido para correção automática.";
 return {checks:checksText,objectives:objectiveTexts,general:checksText+objectiveSummary+" As atividades discursivas e práticas dependem de análise do instrutor."};
}
function autoPanel(r,mission,fundamental){
 const {objectives,checks}=automaticSummary(r,mission,fundamental);
 const correct=objectives.filter(x=>x.result.passed).length;
 const responded=objectives.filter(x=>x.result.answered).length;
 const completed=checks.filter(x=>x.checked).length;
 const saved=r.grades?.blocks||{};
 const checkFeedback=safeAiFeedback(r.grades?.checksFeedback);
 return '<section class="eval-block eval-auto-panel"><div class="eval-suggestion-toolbar"><button type="button" class="btn btn-secondary btn-small" data-generate-feedback>Gerar sugestões de feedback</button><button type="button" class="btn btn-secondary btn-small" data-ai-review>Analisar entrega com IA</button><small class="muted" data-suggestion-status>Sem IA · Apenas campos vazios · Revisão do instrutor</small><small class="muted" data-ai-review-status role="status"></small></div><div class="eval-ai-review-result" data-ai-review-result hidden></div><h3>1. Checks de toda a missão</h3><p class="muted">Resumo único de todos os checks, incluindo Fundamentos, questões e etapas práticas. O check indica conclusão registrada; a avaliação das competências considera também as respostas e evidências.</p>'+
 '<div class="eval-progress-summary"><div><small>Checks registrados</small><strong>'+completed+'/'+checks.length+'</strong></div><div><small>Questões com gabarito</small><strong>'+correct+'/'+objectives.length+' corretas</strong><p class="muted">'+responded+' respondidas</p></div></div>'+
 (checks.length?'<div class="eval-checks-grid">'+checks.map(({unit,step,checked})=>'<details class="eval-auto-line eval-check-detail"><summary><strong>'+esc(step.title||step.id)+'</strong><span>'+(checked?'✓ Marcado':'Não marcado')+'</span><small>'+esc(unit)+'</small></summary>'+fullQuestionStatement(step,["quiz","checkpoint"].includes(step.type))+'</details>').join("")+'</div>':'<p class="muted">Nenhum check configurado.</p>')+
 '<label class="eval-comment-label"><strong>Feedback único dos checks</strong><textarea class="admin-input" rows="3" data-checks-feedback placeholder="Avalie em conjunto todos os checks e as evidências de conclusão.">'+esc(checkFeedback)+'</textarea></label>'+
 '<h3>2. Questões objetivas — correção automática</h3><p class="muted">Cada questão tem resultado automático e feedback individual opcional, sem repetir a avaliação dos checks.</p>'+
 (objectives.length?objectives.map(({unit,step,result,response},i)=>{
  const key=unit+":"+step.id;
  const selected=result.answered?step.options[result.selected]:"Sem resposta";
  const question=step.question||step.prompt||step.title||step.id;
  return '<div class="eval-objective-item"><strong>'+(i+1)+'. '+esc(step.title||question)+'</strong>'+fullQuestionStatement(step,true)+'<p class="muted">Resposta: '+esc(selected)+'</p><p class="muted">Gabarito: '+esc(step.options[result.correct])+'</p><p class="eval-check-status">'+(result.answered?(result.passed?'✓ Correta':'✗ Incorreta'):'Não respondida')+'</p><label class="eval-comment-label">Feedback desta questão (opcional)<textarea class="admin-input" rows="2" data-block-comment="'+esc(key)+'" placeholder="Orientação específica desta questão">'+esc(saved[key]||"")+'</textarea></label></div>';
 }).join(""):'<p class="muted">Não há questões objetivas com gabarito configurado.</p>')+'</section>';
}
function guildSelfReviewPanel(r){
 const record=r.answers?.[r.mission_id+":guild_self_review"];
 const isGuild=missionOf(r.mission_id,r.class_id)?.type==="guild";
 if(!isGuild&&!record)return "";
 const form=record?.form||{};
 const activities=["Desenvolvimento de páginas ou arquivos","Organização do Kanban","Ideias e planejamento","Pesquisa","Apoio aos colegas","Reuniões e decisões","Testes e revisão","Outras contribuições"];
 const tasks=Array.isArray(record?.tasks)?record.tasks:[];
 const done=tasks.filter(t=>t.status==="done").length;
 const lines=[["O que realizou",form.taskReflection],["Como participou",form.participation],["Nível de aprendizado",form.learningLevel],["Colaboração",form.collaboration],["Contribuição individual",form.contribution],["Dificuldades e soluções",form.challenges]];
 const evidence=typeof form.evidence==="string"&&/^https:\/\/[^\s]+$/i.test(form.evidence.trim())?form.evidence.trim():"";
 const activityList=activities.filter((_,i)=>form["activity_"+i]==="yes");
 const value=(v)=>String(v??"").trim();
 const info=lines.map(([label,v])=>'<div class="eval-guild-answer"><span>'+esc(label)+'</span><p>'+esc(value(v)||"Não informado")+'</p></div>').join("");
 return '<section class="eval-block eval-guild-panel"><div class="eval-guild-heading"><div><p class="eyebrow">Projeto Restaurante · avaliação individual</p><h3>Participação e evidências da Guilda</h3><p class="muted">Confronte as declarações do estudante com Kanban, repositório e entregas. A decisão final é do instrutor.</p></div><span class="eval-guild-pill">'+(record?"Ficha enviada":"Ficha não localizada")+'</span></div>'+
 '<div class="eval-guild-metrics"><div><small>Tarefas vinculadas</small><strong>'+tasks.length+'</strong></div><div><small>Concluídas</small><strong>'+done+'</strong></div><div><small>Atividades declaradas</small><strong>'+activityList.length+'</strong></div><div><small>Link de evidência</small><strong>'+(evidence?"Informado":"Ausente")+'</strong></div></div>'+
 (record?.exceptional?'<div class="eval-guild-alert"><strong>Conferência individual necessária</strong><p>Há pendências ou ausência de atribuição no Kanban. A justificativa não comprova, sozinha, a execução.</p><p>'+esc(value(record.justification)||"Sem justificativa registrada")+'</p></div>':"")+
 '<details class="eval-guild-section" open><summary>Contribuições declaradas</summary><div class="eval-guild-tags">'+(activityList.length?activityList.map(x=>'<span>'+esc(x)+'</span>').join(""):'<p class="muted">Nenhuma atividade assinalada.</p>')+'</div><div class="eval-guild-answers">'+info+'</div></details>'+
 '<details class="eval-guild-section"><summary>Conferência das tarefas do Kanban ('+done+'/'+tasks.length+')</summary>'+(tasks.length?'<div class="eval-guild-tasks">'+tasks.map(t=>'<div><span class="eval-guild-task-state">'+(t.status==="done"?"✓":"○")+'</span><span>'+esc(t.title||"Tarefa sem título")+'</span><small>'+esc(t.status==="done"?"Concluída":t.status||"Não concluída")+'</small></div>').join("")+'</div>':'<p class="muted">Nenhuma tarefa individual vinculada ao envio. Verifique o histórico do grupo antes de concluir sobre participação.</p>')+'</details>'+
 (evidence?'<p class="eval-guild-link"><a href="'+esc(evidence)+'" target="_blank" rel="noopener noreferrer">Abrir evidência complementar ↗</a></p>':'<p class="muted">Não foi informado um link de evidência na ficha individual.</p>')+
 '<p class="eval-guild-footnote">As respostas e a autoavaliação não atribuem XP ou menção automaticamente. Confira a produção efetiva e registre sua avaliação nos campos abaixo.</p></section>';
}
function fullQuestionStatement(step,includeOptions=false){
 const entries=[["Contexto",step.context],["Objetivo",step.goal],["Enunciado",step.question],["Orientação",step.prompt],["Instrução",step.instruction],["Resumo",step.summary],["Descrição",step.description],["Resultado esperado",step.outcome],["Critérios",step.criteria],["Passo a passo",step.instructions],["Atividades",step.tasks],["Requisitos",step.requirements],["Comandos",step.commands],["Dicas",step.tip]];
 if(includeOptions)entries.push(["Alternativas",step.options]);
 const seen=new Set();
 const html=entries.filter(([,v])=>v!=null&&v!==""&&(!Array.isArray(v)||v.length)).filter(([,v])=>{const key=JSON.stringify(v);if(seen.has(key))return false;seen.add(key);return true}).map(([label,value])=>'<div class="eval-statement-part"><strong>'+esc(label)+'</strong>'+(Array.isArray(value)?'<ol>'+value.map(v=>'<li>'+esc(typeof v==="string"?v:JSON.stringify(v))+'</li>').join("")+'</ol>':typeof value==="object"?'<pre>'+esc(JSON.stringify(value,null,2))+'</pre>':'<p>'+esc(value)+'</p>')+'</div>').join("");
 return '<div class="eval-full-statement"><strong>Enunciado completo da atividade</strong>'+(html||'<p class="muted">Sem enunciado textual detalhado nesta versão da missão.</p>')+'</div>';
}
function reviewBlock(r,m,step,idx,unitId=m.id,completed=[]){
 const response=responseForStep(r.answers,unitId,step);
 const answer=response.value;
 const prompt=step.question||step.prompt||step.instruction||step.summary||"";
 const requirementNote='<p class="muted"><strong>Rastreabilidade:</strong> compare o requisito com a resposta preservada e com a evidência efetiva. Link informado não significa repositório inspecionado; check não comprova aprendizagem isoladamente.</p>';
 const promptHtml=fullQuestionStatement(step,["quiz","checkpoint"].includes(step.type));
 const selectedIndex=(typeof answer==="number"||typeof answer==="string"&&/^[0-9]+$/.test(answer.trim()))?Number(answer):null;
 const displayAnswer=step.type==="quiz"&&Array.isArray(step.options)&&selectedIndex!==null&&step.options[selectedIndex]!==undefined?'<div class="eval-answer-text"><strong>Alternativa '+(selectedIndex+1)+':</strong> '+esc(step.options[selectedIndex])+'</div>':answerHTML(answer);
 const attempts=r.progress_snapshot?.codeAttempts?.[unitId+":"+step.id];
 const hasAnswer=answer!==undefined&&answer!==null&&answer!=="";
 const checked=completed.includes(step.id);const objective=objectiveResult(step,answer);const auto=r.grades?.objectiveAuto?.results?.[step.id];const autoSummary=step.type==="checkpoint"&&auto?'<p class="eval-check-status"><strong>Correção automática: '+(auto.correct?"✓ Correta":"✗ Incorreta")+'</strong> · Resposta selecionada: '+esc(Number(auto.selected)+1)+' · Gabarito: '+esc(Number(auto.correctAnswer)+1)+'</p>':"";
 const hasSnapshot=Number(r.progress_snapshot?.version)>0;
 const informational=["content","visual-summary"].includes(step.type);
 const suggestions=checked?["Etapa concluída conforme o registro da plataforma. Continue aplicando o que aprendeu nas próximas atividades.","A conclusão da etapa foi registrada. Recomendo revisar os procedimentos e manter as evidências organizadas.","Registro de conclusão identificado. A compreensão e a aplicação prática serão consideradas em conjunto com as demais evidências."]:["Ainda não há conclusão registrada para esta etapa. Revise as orientações e finalize a atividade.","Há registros parciais nesta etapa. Continue o desenvolvimento e apresente as evidências solicitadas.","Revise o conteúdo deste bloco e procure esclarecer as dúvidas antes de prosseguir."];
 const progress=Array.isArray(r.evidence)?r.evidence.filter(x=>x?.stepId===step.id):[];
 const blockCodes=[...new Set((step.indicators||step.competencies||[]).filter(x=>/^I[1-6]$/.test(x)))];
 const blockValues=r.grades?.blockIndicators?.[unitId+":"+step.id]||{};
 const blockAssessment=blockCodes.length?'<div class="eval-block-indicators"><strong>Indicadores deste bloco</strong>'+blockCodes.map(code=>'<div class="eval-indicator"><span><strong>'+esc(indicatorLabel(code))+'</strong>'+(indicatorDescription(code)?'<small style="display:block">'+esc(indicatorDescription(code))+'</small>':'')+'</span><div class="eval-concepts">'+["A","PA","NA"].map(v=>'<label><input type="radio" name="block-ind-'+esc(unitId+":"+step.id+":"+code)+'" value="'+v+'" '+(blockValues[code]===v?"checked":"")+'> '+v+'</label>').join("")+'</div></div>').join("")+'</div>':"";
 const blockKeyValue=unitId+":"+step.id;
 const existingCheck=r.grades?.blockChecks?.[blockKeyValue]===true;
 const xpConfigured=Number(step.xp)||0;
 const awardControl='<label class="eval-xp-check"><input type="checkbox" data-eval-block-check="'+esc(blockKeyValue)+'" '+(checked?'':'disabled ')+(existingCheck&&checked?'checked':'')+'> Confirmar conclusão para XP ('+xpConfigured+' XP)</label>';
 const evidenceStatus=hasAnswer||response.extras.length||progress.length?"Resposta ou registro localizado — conferir conteúdo":checked?"Somente check localizado — comprovação pendente":"Nenhuma evidência vinculada a esta etapa na ficha";
 const tracePanel='<div class="eval-pending-summary" role="note"><strong>Rastreabilidade do requisito</strong><p><strong>Etapa:</strong> '+esc(unitId+":"+step.id)+' · <strong>Indicadores:</strong> '+esc(blockCodes.map(indicatorLabel).join(" · ")||"Não vinculados")+'</p><p><strong>Registro:</strong> '+esc(evidenceStatus)+'</p><p class="muted">Confira o enunciado, as respostas e os registros abaixo. Links informados não comprovam automaticamente código, commits ou publicação; a inspeção externa ainda depende do instrutor. Ausência de registro não equivale automaticamente a NA.</p></div>';
 const label=hasSnapshot?(checked?"✓ Check registrado":hasAnswer||response.extras.length?"Resposta registrada; check não identificado":"Check não registrado — não significa ausência de aprendizagem"):"Histórico de checks não disponível";
 return '<details class="eval-block eval-review-step" '+((hasAnswer||response.extras.length||blockCodes.length)?'open':'')+'><summary class="eval-block-head"><strong>'+(idx+1)+'. '+esc(step.title||step.id)+'</strong><span>'+esc(stepTypeLabels[step.type]||step.type||"Etapa")+'</span></summary>' +promptHtml+tracePanel+(step.goal?'<p class="muted">'+esc(step.goal)+'</p>':"")+'<p class="eval-check-status">'+esc(label)+'</p>' +autoSummary+(hasAnswer?'<div class="eval-submitted"><small>Resposta enviada</small>'+displayAnswer+'</div>':informational?'<p class="muted">Bloco informativo, sem resposta textual obrigatória.</p>':checked?'<p class="muted">Conclusão registrada por check. Esta etapa não contém resposta textual salva.</p>':'<p class="muted">Não há resposta textual nesta entrega.</p>')+response.extras.map(([key,value])=>displayExtraAnswer(key,value)).join("")+(attempts?'<p class="muted">Verificações de código: '+esc(attempts.count||0)+' · Aprovadas: '+esc(attempts.passed||0)+'</p>':"")+progress.map(x=>'<div class="eval-submitted">'+answerHTML(x)+'</div>').join("")+blockAssessment+'<div class="eval-feedback-tools"><label>Modelo de feedback<select class="admin-input" data-feedback-template="'+esc(unitId+":"+step.id)+'"><option value="">Escolher sugestão (opcional)</option>'+suggestions.map((s,i)=>'<option value="'+i+'">'+esc(s)+'</option>').join("")+'</select></label><label class="eval-comment-label">Feedback deste bloco<textarea class="admin-input" rows="2" data-block-comment="'+esc(unitId+":"+step.id)+'" placeholder="Edite ou escreva uma orientação personalizada"></textarea></label></div></details>'
}

function suggestedXpPlan(mission,foundation,maxXp,submission){
 const units=[...(foundation?.steps||[]).map(step=>({step,unit:foundation.id})),...(mission?.steps||[]).map(step=>({step,unit:mission.id}))];
 const eligible=units.filter(({step})=>step.visible!==false&&step.required!==false);
 const weight=step=>["practice","code","evidence","upload","form"].includes(step.type)?3:["reflection","text","textarea","quiz","checkpoint"].includes(step.type)?2:1;
 const total=eligible.reduce((sum,{step})=>sum+weight(step),0);
 const raw=eligible.map(({step,unit})=>({key:unit+":"+step.id,raw:maxXp*weight(step)/Math.max(1,total)}));
 const allocated=mission?.id==="R2"?new Map(units.map(({step,unit})=>[unit+":"+step.id,Math.max(0,Number(step.xp)||0)])):new Map(raw.map(x=>[x.key,Math.floor(x.raw)]));
 let remainder=mission?.id==="R2"?0:maxXp-[...allocated.values()].reduce((a,b)=>a+b,0);
 for(const item of [...raw].sort((a,b)=>(b.raw-Math.floor(b.raw))-(a.raw-Math.floor(a.raw)))){if(remainder--<=0)break;allocated.set(item.key,allocated.get(item.key)+1)}
 const items=units.map(({step,unit})=>{
  const key=unit+":"+step.id;
  const response=responseForStep(submission.answers,unit,step);
  const objective=objectiveResult(step,response.value);
  const hasValue=value=>typeof value==="string"?value.trim().length>0:Array.isArray(value)?value.some(hasValue):value!==null&&value!==undefined&&typeof value==="object"?Object.values(value).some(hasValue):typeof value==="number"||typeof value==="boolean";
  const answered=objective?objective.answered===true:hasValue(response.value)||response.extras.some(([,value])=>hasValue(value));
  // Declaração de participação, URL e check não demonstram produção por bloco.
  // Somente respostas específicas enviadas tornam o bloco elegível automaticamente.
  const eligibleEvidence=answered;
  const selfReviewEligible=false;
  const cap=allocated.get(key)||0;
  // Checks e visualizações não contam como resposta: somente produção enviada.
  return {key,step,cap,suggested:eligibleEvidence?cap:0,answered,objective,selfReviewEligible};
 });
 return {items,total:items.reduce((sum,x)=>sum+x.suggested,0),max:maxXp};
}
function safeAiFeedback(value){
 if(typeof value==="string")return value.trim();
 if(Array.isArray(value))return value.map(safeAiFeedback).filter(Boolean).join(" ");
 if(value&&typeof value==="object")return ["feedback","summary","text","comment","message","notes"].map(k=>safeAiFeedback(value[k])).find(Boolean)||"";
 return "";
}
function indicatorEvidenceSuggestions(box,codes,aiEntries=[]){
 return codes.map(code=>{
  const radios=[...box.querySelectorAll('input[name^="block-ind-"]')].filter(el=>el.name.endsWith(":"+code));
  const groups=[...new Set(radios.map(el=>el.name))];
  const mentions=groups.map(name=>box.querySelectorAll('input[name="'+name+'"]:checked')[0]?.value).filter(Boolean);
  const ai=aiEntries.find(item=>item.code===code);
  const evidenceCount=mentions.filter(x=>x==="A"||x==="PA").length;
  let suggestion=null;
  if(mentions.length&&mentions.length===groups.length)suggestion=mentions.every(x=>x==="A")?"A":mentions.includes("NA")?null:"PA";
  else if(mentions.length)suggestion="PA";
  if(ai&&["A","PA","NA"].includes(ai.mention)){
   if(suggestion==="A"&&ai.mention!=="A")suggestion="PA";
   else if(!suggestion&&evidenceCount>0&&ai.mention!=="NA")suggestion=ai.mention==="A"&&mentions.length<groups.length?"PA":ai.mention;
  }
  if(!evidenceCount&&suggestion==="A")suggestion=null;
  return {code,suggestion,evidenceCount,assessed:mentions.length,total:groups.length,ai:ai?.mention||null};
 });
}
function openReview(box,id){
 const r=rows.find(x=>x.id===id);if(!r)return;current=id;const m=missionOf(r.mission_id,r.class_id);const inds=indicators(m);const g=r.grades||{},blockComments=g.blocks||{},concepts=g.indicators||{};
 const answers=keysFor(m,r.answers);const snapshot=r.progress_snapshot||{};const estimate=estimateMissionXp(m,snapshot);const maxXp=missionMaxXp(m);
 const hasSnapshot=estimate.hasSnapshot;
 
 const pendingMission=(m?.steps||[]).filter(step=>!(snapshot.mission?.completedSteps||[]).includes(step.id));
 const progressNote=hasSnapshot?'<div class="eval-pending-summary"><strong>'+pendingMission.length+' etapa(s) sem check na missão</strong><p>'+ (pendingMission.length?pendingMission.map(step=>esc(step.title||step.id)).join(" · "):"Todas as etapas da missão têm check.")+'</p></div>':'<div class="eval-pending-summary"><strong>Entrega antiga: checks não disponíveis</strong><p>Não é possível inferir a conclusão das etapas a partir da ausência de registro.</p></div>';const fundamental=m?.type==="training"?getFundamental(m.phase):null;
 const configured=effectiveDefinition(r,m,fundamental);

 const versionNotice=`<div class="eval-pending-summary"><strong>Conferência de requisitos históricos</strong><p>${configured.source==="submission"?"Requisitos preservados na entrega: esta avaliação utiliza as etapas registradas no momento do envio.":"Definição atual exibida como referência, não como versão histórica comprovada. Verifique se as etapas eram exigidas no envio; respostas históricas não devem ser penalizadas por mudanças posteriores."}</p><p>Missão: ${esc(r.mission_id)} · Envio: ${fmt(r.submitted_at)} · Versão do registro: ${esc(r.progress_snapshot?.version||"não identificada")}</p></div>`;
 const reviewMission={...m,steps:configured.steps};
 const reviewFundamental=fundamental?{...fundamental,steps:configured.fundamental.steps}:null;
 const xpPlan=suggestedXpPlan(reviewMission,reviewFundamental,maxXp,r);
 const guildReview=r.answers?.[r.mission_id+":guild_self_review"];
 const hasGuildReview=!!(guildReview&&typeof guildReview==="object"&&guildReview.form);
 const guildEvidenceNotice=hasGuildReview?'<div class="eval-pending-summary"><strong>Autoavaliação individual registrada</strong><p>A ficha da Guilda contém participação declarada, reflexões e possível link de evidência. Ela é uma produção avaliável pelo instrutor, mas não equivale automaticamente à conclusão de todas as etapas nem à comprovação das tarefas no Kanban.</p><p><strong>Tarefas vinculadas ao envio:</strong> '+(guildReview.tasks||[]).filter(t=>t.status==="done").length+' concluída(s) de '+(guildReview.tasks||[]).length+'. Confira as contribuições individuais antes de homologar XP e indicadores.</p></div>':"";
 const audit=checkSummary(r,m,reviewMission.steps,fundamental,reviewFundamental?.steps||[]);
 const unmatchedHistorical=Object.keys(r.answers||{}).filter(k=>k.startsWith(m.id+":")&&k!==m.id+":guild_self_review"&&!reviewMission.steps.some(step=>k===m.id+":"+step.id||k.startsWith(m.id+":"+step.id+":")));
 const historicalWarning=(audit.obsolete.length||unmatchedHistorical.length||audit.historical.length)?'<div class="eval-history-warning" role="note"><strong>Conferência de versão necessária</strong><p>A entrega possui '+audit.obsolete.length+' check(s) de etapas ausentes na configuração atual e '+unmatchedHistorical.length+' registro(s) de resposta sem etapa correspondente. Esses dados históricos permanecem preservados e não devem ser interpretados como falha do estudante.</p><p class="muted">Etapas históricas: '+esc(audit.historical.join(" · ")||audit.obsolete.join(" · ")||"não identificadas")+'</p></div>':"";
 const missionProgress='<div class="eval-progress-summary"><div><small>Checks da missão (definição atual)</small><strong>'+audit.valid.length+'/'+audit.missionTotal+' etapas</strong><p class="muted">Entrega enviada: '+esc(statuses[r.status]||r.status)+'. Checks não comprovam, isoladamente, aprendizagem.</p></div>'+(fundamental?'<div><small>Checks de Fundamentos</small><strong>'+audit.fundValid.length+'/'+audit.foundationTotal+' etapas</strong><p class="muted">Acompanhamento independente da prática.</p></div>':'')+'</div>';
 
 const manualMission=reviewMission.steps.filter(step=>isManualStep(step,responseForStep(r.answers,m.id,step))||(m.id==="R2"&&step.type==="quiz"));
 const manualFundamental=(reviewFundamental?.steps||[]).filter(step=>isManualStep(step,responseForStep(r.answers,reviewFundamental.id,step)));
 const assigned=new Set([...(reviewMission?.steps||[]).flatMap(step=>responseForStep(r.answers,m.id,step).keys),...(reviewFundamental?.steps||[]).flatMap(step=>responseForStep(r.answers,reviewFundamental.id,step).keys)]);
 const extra=answers.filter(([k])=>!assigned.has(k)&&!k.endsWith(":revealed")&&k!==m.id+":guild_self_review");
 box.innerHTML='<button class="btn btn-secondary btn-small" data-eval-back>← Voltar à Central</button><header class="eval-detail-header"><p class="eyebrow">Ficha individual de avaliação</p><h2>'+esc(m?.title||r.mission_id)+'</h2><p>'+esc(names.get(r.student_id)||"Estudante")+' · '+esc(classes.find(c=>c.id===r.class_id)?.code||"Turma")+' · '+fmt(r.submitted_at)+'</p><span class="eval-tag">'+esc(statuses[r.status]||r.status)+'</span></header>'+versionNotice+(r.is_late?'<div class="eval-late-box"><strong>Entrega fora do prazo</strong><p>Motivo: '+esc(r.late_reason||"Não informado")+'</p><p>Justificativa: '+esc(r.late_explanation||"Não informada")+'</p></div>':"")+missionProgress+historicalWarning+guildEvidenceNotice+'<div class="eval-progress-summary"><div><small>XP elegível por respostas vinculadas aos blocos</small><strong>'+xpPlan.total+' / '+maxXp+' XP</strong><p class="muted">O cálculo automático só considera respostas vinculadas a cada bloco. Autoavaliação, Kanban e links são evidências complementares para revisão docente; não concedem XP por si sós.</p></div></div><h3>Produção enviada pelo estudante</h3><p class="muted">Respostas preservadas no momento da entrega. O conteúdo original da missão serve como referência; não é uma área de edição.</p>'+autoPanel(r,reviewMission,reviewFundamental)+'<h3>3. Respostas discursivas e evidências práticas</h3><p class="muted">Somente estas atividades precisam de avaliação manual individual.</p>'+(manualMission.length?manualMission.map((step,i)=>reviewBlock(r,reviewMission,step,i,m.id,snapshot.mission?.completedSteps||[])).join(""):"")+(manualFundamental.length?'<h4>Fundamentos — atividades discursivas</h4>'+manualFundamental.map((step,i)=>reviewBlock(r,reviewMission,step,i,reviewFundamental.id,snapshot.fundamentals?.completedSteps||[])).join(""):"")+guildSelfReviewPanel(r)+(m?.type==="guild"?'<section class="eval-block eval-guild-panel"><h3>Kanban e contribuições — consulta atual ao banco</h3><div data-review-participation><p class="muted">Carregando registros da Guilda...</p></div></section>':"")+(extra.length?'<section class="eval-block"><h3>Outros registros da missão</h3>'+extra.map(([k,v])=>displayExtraAnswer(k,v)).join("")+'</section>':"")+(Array.isArray(r.evidence)&&r.evidence.length?'<section class="eval-block"><h3>Evidências adicionais</h3>'+r.evidence.filter(e=>!((reviewMission?.steps||[]).concat(reviewFundamental?.steps||[]).some(step=>step.id===(e?.stepId||e?.step_id)))).map(e=>'<div class="eval-submitted">'+answerHTML(e)+'</div>').join("")+'</section>':"")+'<section class="eval-block"><h3>Consolidação dos indicadores</h3><p class="muted">Registre a menção com base nas evidências da missão. A menção final da UC continua sob responsabilidade do instrutor.</p>'+(inds.length?inds.map(code=>'<div class="eval-indicator"><div><strong>'+esc(indicatorLabel(code))+'</strong>'+(indicatorDescription(code)?'<p class="muted" style="margin:4px 0">'+esc(indicatorDescription(code))+'</p>':'')+'</div><div class="eval-concepts">'+["A","PA","NA"].map(v=>'<label><input type="radio" name="eval-ind-'+esc(code)+'" value="'+v+'" '+(concepts[code]===v?"checked":"")+'> '+v+'</label>').join("")+'</div></div>').join(""):'<p class="muted">Esta missão não possui indicadores configurados.</p>')+'</section><section class="eval-block"><h3>Resultado e devolutiva</h3><label class="eval-comment-label">Feedback geral<textarea class="admin-input" rows="4" data-eval-feedback placeholder="Destaque avanços, dificuldades e próximos passos">'+esc(r.feedback||"")+'</textarea></label><label class="eval-comment-label">XP sugerido (editável; máximo da missão: '+maxXp+' XP)<input class="admin-input" type="number" min="0" max="'+maxXp+'" step="1" data-eval-xp value="'+esc(g.xp??xpPlan.total)+'"></label><p class="muted">A estimativa automática cobre respostas associadas às etapas atuais. A autoavaliação da Guilda e evidências históricas exigem análise docente; check isolado não pontua. A qualidade será avaliada pelo instrutor, com apoio opcional da IA. A distribuição é apenas uma proposta; a publicação depende da revisão e confirmação do instrutor. Ao concluir a avaliação, o valor aprovado será registrado na ficha; a atualização do saldo do estudante ainda depende da integração segura com o sistema de pontuação.</p><div class="eval-actions"><button class="btn btn-secondary" data-eval-save="draft">Salvar rascunho</button><button class="btn btn-secondary" data-eval-save="changes_requested">Solicitar ajustes</button><button class="btn btn-primary" data-eval-save="evaluated">Concluir avaliação</button></div><p data-eval-message role="status"></p></section>';
 if(m?.type==="guild")mountMissionParticipation(box.querySelector("[data-review-participation]"),{missionId:r.mission_id,classId:r.class_id,studentId:r.student_id,teacher:true}).catch(console.warn);
 box.querySelector("[data-eval-back]").onclick=()=>{current=null;renderList(box)};
 box.querySelectorAll("[data-block-comment]").forEach(el=>{
  const saved=blockComments[el.dataset.blockComment];
  const stepId=el.dataset.blockComment.split(":").slice(1).join(":");
  const unit=el.dataset.blockComment.split(":")[0];
  const done=unit.startsWith("F")?snapshot.fundamentals?.completedSteps:snapshot.mission?.completedSteps;
  el.value=saved!==undefined?saved:el.value||"";
 });
 box.querySelectorAll("[data-feedback-template]").forEach(select=>select.addEventListener("change",()=>{
  if(select.value==="")return;
  const textarea=[...box.querySelectorAll("[data-block-comment]")].find(el=>el.dataset.blockComment===select.dataset.feedbackTemplate);
  if(textarea){textarea.value=select.options[select.selectedIndex].textContent;textarea.focus()}
 }));
 const xpField=box.querySelector("[data-eval-xp]");
 const xpInfo=document.createElement("p");
 xpInfo.className="muted";xpInfo.dataset.xpPlan="";xpInfo.textContent="XP elegível por bloco (sem pontuar checks ou autodeclarações): "+xpPlan.items.filter(x=>x.cap>0).map(x=>x.step.title+": "+x.suggested+"/"+x.cap+" XP").join(" · ")+". Total: "+xpPlan.total+"/"+maxXp+" XP. Editável e sujeito à revisão.";
 xpField?.closest("label")?.after(xpInfo);
 if(m?.type==="guild"){
  const review=document.createElement("section");
  review.className="eval-block eval-guild-panel";
  review.innerHTML='<h3>Conferência do XP por evidência</h3><p class="muted">Marque apenas os blocos para os quais você conferiu uma produção individual pertinente (repositório, Kanban ou registro de contribuição). O check da etapa e a autoavaliação, isoladamente, não são comprovação.</p>'+
   xpPlan.items.filter(x=>x.cap>0).map(x=>'<label class="eval-guild-xp-row"><input type="checkbox" data-xp-evidence="'+esc(x.key)+'" '+(x.answered?'checked disabled':'')+'><span><strong>'+esc(x.step.title||x.step.id)+'</strong><small>'+(x.answered?'Resposta vinculada à etapa':'Conferência manual necessária')+'</small></span><strong>'+x.cap+' XP máx.</strong></label>').join("")+
   '<button type="button" class="btn btn-secondary btn-small" data-xp-recalculate>Aplicar teto dos blocos conferidos</button><p class="muted">A aplicação atualiza somente o campo de proposta. Revise a qualidade e ajuste o XP antes de concluir. Nenhuma avaliação é salva automaticamente.</p>';
  xpInfo.after(review);
  review.querySelector("[data-xp-recalculate]")?.addEventListener("click",()=>{
   const total=xpPlan.items.reduce((sum,item)=>sum+(item.answered||review.querySelectorAll("[data-xp-evidence]").length&&[...review.querySelectorAll("[data-xp-evidence]:checked")].some(el=>el.dataset.xpEvidence===item.key)?item.cap:0),0);
   if(xpField)xpField.value=String(Math.min(maxXp,total));
   xpInfo.textContent="Teto recalculado após conferência docente: "+Math.min(maxXp,total)+"/"+maxXp+" XP. Ajuste conforme a qualidade efetiva da produção.";
  });
 }
 box.querySelector("[data-ai-review]")?.addEventListener("click",async()=>{
  const button=box.querySelector("[data-ai-review]");
  const status=box.querySelector("[data-ai-review-status]");
  button.disabled=true;button.textContent="Analisando...";
  if(status)status.textContent="Analisando as evidências por indicador. Nenhuma menção será aplicada automaticamente.";
  try{
   const sb=window.__evalSupabase;
   const {data,error}=await sb.functions.invoke("mission-ai-review",{body:{submissionId:r.id,clientDefinition:{missionType:m?.type,steps:[...(reviewFundamental?.steps||[]).map(step=>({...step,reviewKey:(reviewFundamental?.id||"fundamental")+":"+step.id})),...(reviewMission.steps||[]).map(step=>({...step,reviewKey:reviewMission.id+":"+step.id}))],competencies:inds}}});
   if(error){const httpStatus=error.context?.status;let detail=data?.error;try{if(!detail&&error.context?.json){const body=await error.context.json();detail=body?.error||body?.message}}catch{}if(httpStatus===429||/429|rate.limit|too many requests/i.test(String(detail||error.message||"")))throw new Error("Limite temporário dos provedores de IA (429). Verifique Groq e Gemini; utilize as sugestões de feedback locais enquanto isso. Nenhuma avaliação foi alterada.");throw new Error(detail||error.message||"Falha de conexão")}
   if(data?.error)throw new Error(data.error);
   const result=box.querySelector("[data-ai-review-result]");
   const entries=Array.isArray(data.indicators)?data.indicators:[];
   result.innerHTML='<h4>Parecer sugerido pela IA — revisão obrigatória</h4>'+
    '<p>'+esc(data.summary||"")+'</p>'+
    entries.map(i=>'<article class="eval-ai-indicator"><strong>'+esc(i.code)+' · '+esc(i.mention==="SEM_EVIDENCIA"?"Menção pendente de revisão":i.mention)+'</strong><p>'+esc(i.justification||"")+'</p>'+(i.evidence?.length?'<small>Evidências: '+esc(i.evidence.join("; "))+'</small>':"")+(i.gaps?.length?'<small>Lacunas: '+esc(i.gaps.join("; "))+'</small>':"")+'</article>').join("")+
    (Array.isArray(data.blocks)&&data.blocks.length?'<details class="eval-ai-blocks"><summary>Análise por etapa ('+data.blocks.length+')</summary>'+data.blocks.map(b=>'<article class="eval-ai-indicator"><strong>'+esc(reviewMission.steps?.find(step=>String(step.id)===String(b.step_id))?.title||b.step_id)+'</strong>'+(Array.isArray(b.question_analysis)?b.question_analysis.map(q=>'<p><b>'+esc(q.question||"Questão")+' — '+esc(q.status||"")+'</b>: '+esc(q.note||"")+'</p>').join(""):"")+(b.feedback?'<p>'+esc(b.feedback)+'</p>':"")+(b.needs_review?'<small>Revisão docente necessária</small>':"")+'</article>').join("")+'</details>':"")+
    (Array.isArray(data.alerts)&&data.alerts.length?'<p class="muted">'+esc(data.alerts.join(" · "))+'</p>':"")+
    '<label class="eval-comment-label">Feedback geral sugerido<textarea class="admin-input" rows="5" data-ai-feedback-draft>'+esc(data.feedback||"")+'</textarea></label>'+
    '<div class="eval-suggestion-toolbar"><button type="button" class="btn btn-secondary btn-small" data-ai-apply>Aplicar sugestões aos campos vazios</button></div>';
   result.hidden=false;
   result.querySelector("[data-ai-apply]").onclick=()=>{
    let applied=0;
    const general=box.querySelector("[data-eval-feedback]");
    if(general&&!general.value.trim()){general.value=result.querySelector("[data-ai-feedback-draft]").value;applied++}
    const blockFields=[...box.querySelectorAll("[data-block-comment]")];
    const blocks=Array.isArray(data.blocks)?data.blocks:[];
    for(const block of blocks){
     const key=String(block.review_key||block.reviewKey||"");
     const matching=blockFields.filter(el=>key?el.dataset.blockComment===key:el.dataset.blockComment?.endsWith(":"+block.step_id));
     if(matching.length!==1)continue;
     const field=matching[0];
     if(!field.value.trim()&&safeAiFeedback(block.feedback)){field.value=safeAiFeedback(block.feedback);applied++}
     const codeList=Array.isArray(block.indicators)?block.indicators:[];
     for(const suggestion of codeList){
      if(!["A","PA","NA"].includes(suggestion.mention))continue;
      const name="block-ind-"+matching[0].dataset.blockComment+":"+suggestion.code;
      const radios=[...box.querySelectorAll('input[name="'+name+'"]')];
      if(radios.some(x=>x.checked))continue;
      const radio=radios.find(x=>x.value===suggestion.mention);
      if(radio){radio.checked=true;applied++}
     }
    }
    // If a free-text response is evaluable but the model omits a block, offer a cautious draft.
    for(const item of xpPlan.items){
     if(!item.answered)continue;
     const field=blockFields.find(el=>el.dataset.blockComment===item.key);
     if(!field||field.value.trim())continue;
     const ai=blocks.find(b=>b.review_key===item.key||(!b.review_key&&String(b.step_id)===String(item.step.id)));
     const notes=(ai?.question_analysis||[]).map(q=>q.note).filter(Boolean);
     if(notes.length){field.value=notes.join(" ").slice(0,1600);applied++}
    }
    const autoSuggestions=feedbackSuggestions(r,reviewMission,reviewFundamental);
    for(const [key,value] of Object.entries(autoSuggestions.objectives)){
     const field=blockFields.find(el=>el.dataset.blockComment===key);
     if(field&&!field.value.trim()&&value){field.value=value;applied++}
    }
    const checks=box.querySelector("[data-checks-feedback]");
    if(checks&&!checks.value.trim()){const suggested=safeAiFeedback(data.checks_feedback)||safeAiFeedback(autoSuggestions.checks);if(suggested){checks.value=suggested;applied++}}
    const summary=inds.map(code=>{
     const relevant=blocks.filter(b=>(b.indicators||[]).some(i=>i.code===code));
     const evidence=relevant.filter(b=>b.evidence_used?.length||b.question_analysis?.some(q=>q.status==="atendida"||q.status==="parcial"));
     return code+": "+evidence.length+" bloco(s) com evidência, "+relevant.length+" analisado(s) pela IA";
    }).join(" · ");
    let evidenceNote=box.querySelector("[data-ai-indicator-evidence]");
    if(!evidenceNote){evidenceNote=document.createElement("p");evidenceNote.dataset.aiIndicatorEvidence="";evidenceNote.className="muted";box.querySelector("[data-eval-xp]")?.closest("label")?.before(evidenceNote)}
    if(evidenceNote)evidenceNote.textContent="Indicadores: "+summary+". "+(blocks.length?"Revise as evidências e as menções propostas por bloco.":"A IA não retornou análises por bloco; não é possível validar qualidade ou menções automaticamente.");
    if(!blocks.length&&status)status.textContent="A IA retornou apenas um parecer geral. Feedbacks e menções dos blocos exigem revisão; tente gerar novamente.";

    const consolidation=indicatorEvidenceSuggestions(box,inds,entries);
    // A general AI mention is a suggestion, never proof that every linked block was assessed.

    // AI indicator suggestions are advisory only; never preselect A/PA/NA.
    if(status)status.textContent="Parecer gerado. Confira evidências, indicadores e XP antes de preencher as menções.";
    const xpInput=box.querySelector("[data-eval-xp]");
    if(xpInput){
     const aiBlocks=Array.isArray(data.blocks)?data.blocks:[];
     const scores=xpPlan.items.map(item=>{
      const ai=aiBlocks.find(b=>b.review_key===item.key||(!b.review_key&&b.step_id===item.step.id));
      if(!ai||!item.answered)return item.suggested;
      const statuses=(ai.question_analysis||[]).map(q=>q.status);
      const valid=statuses.filter(v=>["atendida","parcial","incorreta"].includes(v));
      const fraction=valid.length?valid.reduce((sum,v)=>sum+(v==="atendida"?1:v==="parcial"?0.5:0),0)/valid.length:null;
      // A flag de revisão é informativa; nunca reduz XP automaticamente.
      if(typeof ai.quality_score==="number"&&Number.isFinite(ai.quality_score)&&(!item.objective||!item.objective.passed))return Math.min(item.suggested,Math.round(item.cap*Math.max(0,Math.min(1,ai.quality_score))));
      if(item.objective?.passed)return item.suggested;
      return fraction===null?item.suggested:Math.min(item.suggested,Math.round(item.cap*fraction));
     });
     const aiXp=Math.min(xpPlan.total,maxXp,scores.reduce((a,b)=>a+b,0));
     const xpBreakdown=xpPlan.items.map((item,i)=>({title:item.step.title||item.step.id,eligible:item.suggested,suggested:scores[i],discount:item.suggested-scores[i]})).filter(item=>item.eligible>0);
     const reviewedBlocks=aiBlocks.filter(b=>xpPlan.items.some(item=>item.answered&&(b.review_key===item.key||(!b.review_key&&String(b.step_id)===String(item.step.id)))));
     const qualityMeasured=reviewedBlocks.some(b=>typeof b.quality_score==="number"||Array.isArray(b.question_analysis)&&b.question_analysis.length);

     // Preserve the instructor XP field; AI calculations are informational only.
     const xpNote=box.querySelector("[data-xp-plan]");
     if(xpNote)xpNote.textContent="XP elegível pelas respostas: "+xpPlan.total+"/"+maxXp+". "+(qualityMeasured?"IA estima "+aiXp+" XP (não aplicado) com base em "+reviewedBlocks.length+" bloco(s) analisado(s). Distribuição: "+xpBreakdown.map(x=>x.title+": "+x.suggested+"/"+x.eligible+" XP"+(x.discount?" (diferença estimada de "+x.discount+" XP; sem desconto automático — conferir justificativa por bloco)":"")).join(" · ")+". Revise antes de aprovar.":"IA não apresentou análise de qualidade por bloco: não há ajuste qualitativo validado.")
    }
    // Não aplicar menções gerais da IA sem correspondência com evidências da missão.
    for(const i of entries){
     if(!["A","PA"].includes(i.mention))continue;
     if(!blocks.some(b=>(b.indicators||[]).some(v=>v.code===i.code&&(v.mention==="A"||v.mention==="PA")&&(b.evidence_used?.length||b.question_analysis?.some(q=>q.status==="atendida"||q.status==="parcial")))))continue;
     const radios=[...box.querySelectorAll('input[name="eval-ind-'+i.code+'"]')];
     if(radios.some(x=>x.checked))continue;
     const target=radios.find(x=>x.value===i.mention);
     if(target){target.checked=true;applied++}
    }
    if(status)status.textContent=applied+" sugestão(ões) aplicada(s) em campos vazios. Revise as menções e o feedback antes de salvar.";
   };
   if(status)status.textContent="Parecer disponível para conferência. Nenhuma avaliação foi salva.";
  }catch(error){if(status)status.textContent="Análise indisponível: "+error.message}
  finally{button.disabled=false;button.textContent="Analisar entrega com IA"}
 });
 box.querySelector("[data-generate-feedback]")?.addEventListener("click",()=>{
  const suggestions=feedbackSuggestions(r,reviewMission,reviewFundamental);
  let applied=0,skipped=0;
  const fill=(el,value)=>{if(!el)return;if(el.value.trim()){skipped++;return}if(!value)return;el.value=value;el.dispatchEvent(new Event("input",{bubbles:true}));applied++};
  fill(box.querySelector("[data-checks-feedback]"),suggestions.checks);
  for(const [key,value] of Object.entries(suggestions.objectives)){
   const el=[...box.querySelectorAll("[data-block-comment]")].find(item=>item.dataset.blockComment===key);
   fill(el,value);
  }
  const status=box.querySelector("[data-suggestion-status]");
  if(status)status.textContent=applied+" sugestão(ões) inserida(s). "+skipped+" campo(s) já preenchido(s) preservado(s). Revise antes de salvar.";
 });
 box.querySelectorAll("[data-eval-save]").forEach(b=>b.onclick=async()=>{
  const action=b.dataset.evalSave,feedback=box.querySelector("[data-eval-feedback]").value.trim(),xp=Number(box.querySelector("[data-eval-xp]").value);
  if(!Number.isFinite(xp)||xp<0||xp>maxXp){box.querySelector("[data-eval-message]").textContent="Informe XP entre 0 e "+maxXp+".";return}
  const indicatorGrades=Object.fromEntries(inds.map(code=>[code,box.querySelector('input[name="eval-ind-'+code+'"]:checked')?.value||""]).filter(([,v])=>v));
  if(action==="evaluated"&&inds.length&&Object.keys(indicatorGrades).length!==inds.length){box.querySelector("[data-eval-message]").textContent="Selecione A, PA ou NA em todos os indicadores antes de concluir.";return}
  if(action==="changes_requested"&&!feedback){box.querySelector("[data-eval-message]").textContent="Informe no feedback geral o que o estudante deve ajustar.";return}
  const blocks={...(g.blocks||{}),...Object.fromEntries([...box.querySelectorAll("[data-block-comment]")].map(el=>[el.dataset.blockComment,el.value.trim()]))};
  const blockIndicators={...(g.blockIndicators||{})};
  for(const step of [...(reviewMission?.steps||[]).map(s=>[m.id,s]),...(reviewFundamental?.steps||[]).map(s=>[fundamental.id,s])]){
   const [unit,s]=step,codes=[...new Set((s.indicators||s.competencies||[]).filter(v=>/^I[1-6]$/.test(v)))],entry={};
   for(const code of codes){const selected=box.querySelector('input[name="block-ind-'+unit+":"+s.id+":"+code+'"]:checked');if(selected)entry[code]=selected.value}
   if(codes.length)blockIndicators[unit+":"+s.id]=entry;
  }
  const blockChecks={...(g.blockChecks||{}),...Object.fromEntries([...box.querySelectorAll("[data-eval-block-check]")].map(el=>[el.dataset.evalBlockCheck,el.checked&&!el.disabled]))};
  const awardDefinition={steps:reviewMission.steps.map(s=>({...s,id:blockKey(m.id,s),xp:xpPlan.items.find(item=>item.key===blockKey(m.id,s))?.suggested||0})),fundamental:reviewFundamental?{steps:reviewFundamental.steps.map(s=>({...s,id:blockKey(fundamental.id,s),xp:xpPlan.items.find(item=>item.key===blockKey(fundamental.id,s))?.suggested||0}))}:null};
  const awarded=calculatePublishedXp(awardDefinition,{status:action==="evaluated"?"evaluated":action,published:action==="evaluated",blockChecks});
  const xpAward=action==="draft"?g.xpAward||null:{amount:awarded.xp,published:action==="evaluated",blocks:awarded.blocks,calculated_at:new Date().toISOString()};
  const grades={...g,checksFeedback:box.querySelector("[data-checks-feedback]")?.value.trim()||"",blockChecks,xpAward,version:4,blocks,blockIndicators,indicators:indicatorGrades,progress:{completed:estimate.completed,total:estimate.total,percent:estimate.percent,hasSnapshot},xp:Number.isFinite(xp)?Math.max(0,Math.min(maxXp,Math.round(xp))):0,draft:action==="draft"};
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
 const {data:officialIndicators,error:indError}=await sb.from("curriculum_indicators").select("code,name,description").in("class_id",classes.map(c=>c.id)).eq("active",true);
 indicatorCatalog=new Map((indError?[]:officialIndicators||[]).map(i=>[i.code,i]));
 const {data,error}=await sb.from("mission_submissions").select("id,class_id,student_id,mission_id,status,is_late,late_reason,late_explanation,submitted_at,feedback,answers,evidence,grades,progress_snapshot").in("class_id",classes.map(c=>c.id)).order("submitted_at",{ascending:false}).limit(500);
 if(error){box.textContent="Entregas indisponíveis: "+error.message;return}
 rows=data||[];
 const ids=[...new Set(rows.map(r=>r.student_id))];
 if(ids.length){const {data:profiles}=await sb.from("profiles").select("id,full_name").in("id",ids);names=new Map((profiles||[]).map(p=>[p.id,p.full_name]))}
 const {data:guilds,guildError}=await sb.from("guilds").select("id,class_id,name").in("class_id",classes.map(c=>c.id));
 guildNamesByStudent=new Map();
 if(!guildError&&guilds?.length){
  const {data:members,error:memberError}=await sb.from("guild_members").select("guild_id,user_id").in("guild_id",guilds.map(g=>g.id));
  if(!memberError){const lookup=new Map(guilds.map(g=>[g.id,g]));for(const member of members||[]){const guild=lookup.get(member.guild_id);if(guild)guildNamesByStudent.set(guild.class_id+":"+member.user_id,guild.name)}}
 }
 renderList(box);
}
