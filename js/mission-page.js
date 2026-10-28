import {loadEditedMissionContent,applyEditedMissionContent,watchMissionContent} from "./mission-content.js";
import {missionWindow,windowNotice} from "./mission-window.js";
import {getSupabase} from "./supabase-client.js";
import {mountGuildMissionBoard} from "./guild-mission-board.js";
import {mountMissionDelivery,reapplyMissionRevision} from "./mission-delivery.js";
import "./cloud-bootstrap.js";
import {getMission,getFundamental,startMission,startFundamental,missionStatus,fundamentalStatus,completeFundamentalStep,STATUS} from "./mission-engine.js";
import {getState} from "./storage.js";
import {renderStep,bindStep} from "./step-renderer.js";
import {getMissionProjectContext,renderProjectContext} from "./project-context.js";
let projectContext=null,scheduledLesson=null,missionReadOnly=false,missionAccess=null,activeEduTechPanel=null;

/* Rascunho local de campos ainda não concluídos: separado por aluno e missão.
   Não altera XP, avaliação nem a entrega oficial. */
function installMissionDrafts(missionId){
 const owner=localStorage.getItem("uc7_web_academy_active_user")||"local";
 const key="uc7:mission-draft:v1:"+owner+":"+missionId;
 const selector='textarea:not(.mission-delivery textarea), input:not([type="file"]):not([type="password"]):not([type="hidden"]):not(.mission-delivery input), select:not(.mission-delivery select)';
 const identify=el=>{
  const card=el.closest("[data-step-card],[data-fundamental-step],form,section");
  const scope=card?.getAttribute("data-step-card")||card?.getAttribute("data-fundamental-step")||card?.id||"mission";
  const controls=[...(card||root).querySelectorAll(selector)];
  return scope+"::"+(el.name||el.id||el.getAttribute("data-evidence")||"field")+"::"+controls.indexOf(el);
 };
 const read=()=>{try{return JSON.parse(localStorage.getItem(key)||"{}")}catch{return {}}};
 let cache=read();
 const restore=()=>{
  root.querySelectorAll(selector).forEach(el=>{
   if(el.disabled||el.readOnly||el.closest('[data-complete-step],.mission-delivery'))return;
   const entry=cache[identify(el)];if(!entry)return;
   if(el.type==="checkbox"||el.type==="radio"){if(el.checked!==entry.checked)el.checked=entry.checked;}
   else if(!el.value&&entry.value)el.value=entry.value;
  });
 };
 let restoring=false;
 const observer=new MutationObserver(()=>{if(restoring)return;restoring=true;queueMicrotask(()=>{restore();restoring=false})});
 observer.observe(root,{childList:true,subtree:true});
 root.addEventListener("input",save,{capture:true});
 root.addEventListener("change",save,{capture:true});
 function save(event){
  const el=event.target;if(!el.matches?.(selector)||el.disabled||el.readOnly||el.closest(".mission-delivery"))return;
  cache[identify(el)]={value:el.value,checked:el.checked};
  try{localStorage.setItem(key,JSON.stringify(cache))}catch(error){console.warn("Rascunho local indisponível:",error)}
 }
 restore();
 window.addEventListener("pageshow",restore);
}

async function refreshMissionSchedule(){try{const sb=await getSupabase();if(!sb)return;const {data:auth}=await sb.auth.getUser();if(!auth?.user)return;const {data:members}=await sb.from("class_members").select("class_id").eq("user_id",auth.user.id).eq("status","active");const preferred=localStorage.getItem("webacademy.student.activeClass");const classId=(members?.find(m=>m.class_id===preferred)||members?.[0])?.class_id;if(!classId)return;const {data,error}=await sb.from("class_schedule").select("lesson_number,lesson_date,execution_mode,start_time_override,end_time_override,class_id").eq("class_id",classId).eq("uc","UC7").eq("mission_id",id).order("lesson_date").limit(1).maybeSingle();if(error)throw error;scheduledLesson=data;if(scheduledLesson){const {data:classData}=await sb.from("classes").select("lesson_start_time,lesson_end_time").eq("id",classId).maybeSingle();scheduledLesson.start=String(scheduledLesson.start_time_override||classData?.lesson_start_time||"").slice(0,5);scheduledLesson.end=String(scheduledLesson.end_time_override||classData?.lesson_end_time||"").slice(0,5)} if(mission&&missionAccess&&((missionAccess.state==="open"||missionAccess.state==="closed")))render(missionReadOnly,missionAccess)}catch(error){console.warn("Cronograma da missão:",error)}}
const params=new URLSearchParams(location.search),id=params.get("id"),root=document.querySelector("#missionRoot");
if(id&&root)installMissionDrafts(id);
const state=getState();if(!state?.student?.name)location.replace("index.html");
const initialAccess=await missionWindow(id);
const mission=getMission(id),pad=n=>String(n).padStart(2,"0");
if(!mission){root.innerHTML='<section class="card current-mission"><h1>Missão não disponível</h1><a class="btn btn-primary" href="missions.html">Voltar às missões</a></section>';}
else if(initialAccess.state==="unpublished"||initialAccess.state==="upcoming"||initialAccess.state==="unconfigured"||initialAccess.state==="error"){root.replaceChildren(windowNotice(initialAccess));startWindowWatch(id);}
else{try{applyEditedMissionContent(id,await loadEditedMissionContent(id))}catch(error){root.textContent="Não foi possível carregar o conteúdo da missão. Atualize a página.";throw error}root.innerHTML='<section class="card current-mission"><h1>Carregando missão...</h1></section>';missionAccess=initialAccess;missionReadOnly=false;if(!missionReadOnly)startMission(id);projectContext=await getMissionProjectContext(mission);render(missionReadOnly,initialAccess);refreshMissionSchedule();startWindowWatch(id);watchMissionContent(id,async content=>{applyEditedMissionContent(id,content);const access=await missionWindow(id);missionAccess=access;if(access.state==="open"||access.state==="closed"){missionReadOnly=false;render(missionReadOnly,access)}else{root.replaceChildren(windowNotice(access))}}).catch(error=>console.warn("Escuta de missão:",error));}

function escapeMissionText(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function renderGuildMissionBrief(m,context){
 const e=escapeMissionText;
 const req=context?.requirements||[];
 const note=context?.implementationNote||"";
 const project=context?.project;
 return `<section class="card guild-mission-brief" aria-label="Desafio e requisitos específicos desta missão">
 <p class="eyebrow">Projeto Restaurante · ${e(m.displayId||m.id)} · Desafio desta missão</p>
 <h2>${e(m.title)}</h2><p class="guild-mission-challenge">${e(m.subtitle||"Consulte os requisitos vinculados à missão.")}</p>
 ${note?`<p class="guild-mission-note"><strong>Orientação cadastrada:</strong> ${e(note)}</p>`:""}
 <h3>O que precisa ser atendido nesta missão</h3>
 ${req.length?req.map(r=>`<article class="guild-mission-criterion"><div><strong>${e(r.code)} · ${e(r.title)}</strong></div><p>${e(r.description)}</p>${Array.isArray(r.acceptance_criteria)&&r.acceptance_criteria.length?`<p><strong>Critérios de aceitação</strong></p><ul>${r.acceptance_criteria.map(c=>`<li>${e(c)}</li>`).join("")}</ul>`:""}</article>`).join(""):`<p>Não há requisitos específicos vinculados nesta configuração. Consulte o documento do projeto e confirme os critérios com o instrutor.</p>`}
 ${project?.deliverables?`<details><summary>Entregáveis gerais do Projeto Restaurante</summary><p>${e(project.deliverables)}</p></details>`:""}
 <p class="guild-mission-brief-tip">Utilize estes requisitos para planejar as tarefas no Kanban, desenvolver a solução e conferir o resultado antes da entrega.</p>
 </section>`;
}
function renderInlineFundamentals(unit,done){
 const completed=unit.steps.filter(step=>done.includes(step.id)).length;
 const percent=unit.steps.length?Math.round(completed/unit.steps.length*100):0;
 return `<section class="card current-mission" id="missionFundamentals" aria-label="Fundamentos da aula"><p class="eyebrow">Etapa 1 · Fundamentos</p><h2>📘 ${escapeMissionText(unit.title)}</h2><p>${escapeMissionText(unit.objective)}</p><p><strong>${completed} de ${unit.steps.length} atividades concluídas (${percent}%)</strong></p><div class="progress"><i style="width:${percent}%"></i></div><div class="learning-list">${unit.steps.map(step=>`<div data-fundamental-step="${escapeMissionText(step.id)}">${renderStep(step,`F${mission.phase}`,done.includes(step.id),{editableCompleted:true})}</div>`).join("")}</div><p class="mission-notice">Após revisar os conceitos, avance para a Prática Guiada EduTech. Você também pode voltar aos fundamentos para revisar.</p><a class="btn btn-secondary" href="#guidedPractice">Continuar para a prática guiada ↓</a></section>`;
}
function organizeEduTechPanels(){
 const flow=root.querySelector(".lesson-flow");
 const fundamentals=root.querySelector("#missionFundamentals");
 if(!flow||!fundamentals)return;
 const links=[...flow.querySelectorAll(".lesson-stage")];
 if(links.length!==3)return;
 const keys=["fundamentals","practice","report"];
 const titles=["Fundamentos","Prática Guiada EduTech","Relatório Individual"];
 const host=document.createElement("section");host.className="edutech-stage-content";host.id="edutechStageContent";host.setAttribute("aria-label","Conteúdo da etapa selecionada");
 flow.insertAdjacentElement("afterend",host);
 const panels=keys.map((key,i)=>{
  const panel=document.createElement("div");panel.className="edutech-stage-panel";panel.id="edutech-panel-"+key;panel.dataset.eduPanel=key;panel.hidden=true;
  panel.innerHTML='<div class="edutech-stage-heading"><p class="eyebrow">Etapa '+(i+1)+' de 3</p><h2>'+titles[i]+'</h2></div>';
  host.append(panel);return panel;
 });
 panels[0].append(fundamentals);
 const project=root.querySelector(".mission-project-brief");
 // O documento do projeto é referência permanente: fica antes da estrutura da aula.
 if(project)flow.insertAdjacentElement("beforebegin",project);
 // Os blocos são vinculados aos IDs oficiais da missão, não à posição no DOM.
 // Assim, a etapa Relatório não desaparece quando o layout é reorganizado.
 const reportSteps=mission.steps.filter(step=>step.type==="evidence");
 const reportIds=new Set(reportSteps.map(step=>step.id));
 const guidedList=document.createElement("div");guidedList.className="learning-list";
 const reportList=document.createElement("div");reportList.className="learning-list";
 const originalSteps=[...root.querySelectorAll("[data-mission-step]")];
 originalSteps.forEach(el=>{
  const target=reportIds.has(el.dataset.missionStep)?reportList:guidedList;
  target.append(el);
 });
 // Proteção: renderizar o relatório a partir da definição da missão caso
 // algum bloco ainda não tenha sido montado na página.
 reportSteps.forEach(step=>{
  if(reportList.querySelector('[data-mission-step="'+step.id+'"]'))return;
  const item=document.createElement("div");item.dataset.missionStep=step.id;item.id="individualReport";
  item.innerHTML=renderStep(step,id,(getState().journey.missionProgress[id]?.completedSteps||[]).includes(step.id),{editableCompleted:true});
  reportList.append(item);
 });
 const oldList=root.querySelector(".learning-list:not(#missionFundamentals .learning-list)");
 if(oldList&&oldList!==guidedList&&oldList!==reportList)oldList.remove();
 if(guidedList.children.length)panels[1].append(guidedList);
 if(reportList.children.length)panels[2].append(reportList);
 else panels[2].insertAdjacentHTML("beforeend",'<p>Esta missão ainda não possui campos de relatório configurados. Avise o instrutor.</p>');
 const controls=document.createElement("nav");controls.className="edutech-stage-navigation";controls.setAttribute("aria-label","Navegação entre etapas");
 controls.innerHTML='<button type="button" class="btn btn-secondary" data-edu-prev>← Etapa anterior</button><span class="edutech-stage-counter" aria-live="polite"></span><button type="button" class="btn btn-primary" data-edu-next>Próxima etapa →</button>';
 host.append(controls);
 const prev=controls.querySelector("[data-edu-prev]"),next=controls.querySelector("[data-edu-next]"),counter=controls.querySelector(".edutech-stage-counter");
 const open=(key,scroll=false)=>{
  const index=Math.max(0,keys.indexOf(key));activeEduTechPanel=keys[index];
  panels.forEach((p,i)=>p.hidden=i!==index);
  links.forEach((link,i)=>{
   const selected=i===index;
   link.classList.toggle("active",selected);
   link.setAttribute("aria-current",selected?"step":"false");
   link.setAttribute("aria-controls",panels[i].id);
   link.setAttribute("aria-expanded",String(selected));
  });
  prev.hidden=index===0;next.hidden=index===2;
  next.textContent=index===1?"Ir para o relatório →":"Avançar para a prática →";
  counter.textContent="Etapa "+(index+1)+" de 3 · "+titles[index];
  if(scroll)host.scrollIntoView({behavior:"smooth",block:"start"});
 };
 links.forEach((link,i)=>{
  link.addEventListener("click",event=>{event.preventDefault();open(keys[i],true)});
 });
 prev.addEventListener("click",()=>open(keys[keys.indexOf(activeEduTechPanel)-1],true));
 next.addEventListener("click",()=>open(keys[keys.indexOf(activeEduTechPanel)+1],true));
 root.querySelectorAll('a[href="#guidedPractice"],a[href="#individualReport"],a[href="#missionFundamentals"]').forEach(link=>{
  if(link.closest(".lesson-stage"))return;
  link.addEventListener("click",event=>{event.preventDefault();open(link.getAttribute("href")==="#guidedPractice"?"practice":link.getAttribute("href")==="#individualReport"?"report":"fundamentals",true)});
 });
 open(keys.includes(activeEduTechPanel)?activeEduTechPanel:"fundamentals");
}
function getEduTechReviewFields(){return [
 {type:"cards",label:"Como foi sua participação nesta prática?",options:[{emoji:"🚀",label:"Participei ativamente"},{emoji:"🤝",label:"Participei com orientação"},{emoji:"🌱",label:"Participei parcialmente"}]},
 {type:"scale",label:"Quanto você confia na sua capacidade de aplicar o que aprendeu?",minLabel:"Ainda preciso praticar",maxLabel:"Consigo fazer sozinho"},
 {type:"checklist",label:"O que você conseguiu desenvolver?",options:["Compreendi os conceitos apresentados","Acompanhei e realizei a prática guiada","Consegui aplicar o que aprendi","Testei e conferi meu resultado","Identifiquei algo que preciso melhorar"]},
 {type:"radio",label:"Como você lidou com as dificuldades?",options:["Resolvi pesquisando ou tentando novamente","Precisei de orientação para avançar","Ainda tenho dúvidas que preciso esclarecer","Não encontrei dificuldades significativas"]},
 {type:"short",label:"Qual foi sua principal conquista ou aprendizado? (uma ou duas frases)"},
 {type:"url",label:"Link de uma evidência do que você realizou"}
];}
function applyEduTechReviewTemplate(){
 if(mission.type!=="training")return;
 const reviews=mission.steps.filter(step=>step.type==="evidence");
 // Se o conteúdo publicado não trouxer relatório, acrescenta o modelo sem alterar os blocos existentes.
 if(!reviews.length){mission.steps.push({id:"edutech-self-review",type:"evidence"});reviews.push(mission.steps[mission.steps.length-1]);}
 reviews.forEach(step=>{
  step.title="Minha evolução na EduTech — Autoavaliação Individual";
  step.summary="Avalie sua participação, confiança e aprendizagem. Registre uma reflexão curta e uma evidência real.";
  step.fields=getEduTechReviewFields();
  // Preserva respostas dos formulários antigos em suas chaves originais.
  step.answerKey=step.id+"::edutech-self-review-v2";
 });
}
function render(readOnly=false,access=null){
 applyEduTechReviewTemplate();
 const s=getState(),p=s.journey.missionProgress[id]||{completedSteps:[]},done=p.completedSteps||[],fund=getFundamental(mission.phase),fundDone=s.journey.completedFundamentals?.includes(`F${mission.phase}`),total=mission.steps.length,pct=Math.round(done.length/total*100);
 const retrospective=id==="1A"||id==="1B"||id==="2A";
 const fundamentalProgress=s.journey.fundamentalProgress?.[`F${mission.phase}`]?.completedSteps||[];
 const guidedContent=mission.type==="training"?`
 ${retrospective?`<section class="mission-notice"><b>Registro retroativo.</b> A aula já aconteceu: revise, responda e registre somente o que realizou. Não é necessário repetir a prática.</section>`:""}${retrospective?"":`<section class="lesson-flow card"><p class="eyebrow">Estrutura da aula • 4h</p><div class="lesson-flow-grid"><a class="lesson-stage ${fundDone?"done":""}" href="#missionFundamentals"><b>1</b><strong>📘 Fundamentos</strong><span>1h30 • dentro da Web Academy</span><em>${fundDone?"Revisar / editar":"Abrir etapa"} →</em></a><a class="lesson-stage" href="#guidedPractice"><b>2</b><strong>🎓 Prática Guiada EduTech</strong><span>2h • VS Code com o instrutor</span><em>Ir para prática →</em></a><a class="lesson-stage" href="#individualReport"><b>3</b><strong>📝 Relatório Individual</strong><span>30min • registro e evidência</span><em>Ir para relatório →</em></a></div></section>`}
 ${false?`<section class="card current-mission mission-gate"><p class="eyebrow">Etapa 1 de 3</p><h2>Fundamentos — ${fund.title}</h2><p>${fund.objective}</p><p>Recomendamos concluir os Fundamentos antes da prática guiada, mas você pode avançar e voltar depois.</p><a class="btn btn-primary" href="fundamentals.html?phase=${mission.phase}">Começar Fundamentos →</a></section>`:`<div class="mission-notice"><b>Sequência recomendada.</b> Você pode realizar e entregar a prática mesmo com etapas pendentes.</div>${retrospective?"":renderInlineFundamentals(fund,fundamentalProgress)}${retrospective?"":renderProjectContext(projectContext)}<section class="learning-list">${mission.steps.map((step,index)=>`<div data-mission-step="${step.id}" id="${step.type==="evidence"?"individualReport":index===0?"guidedPractice":""}">${renderStep(step,id,done.includes(step.id),{editableCompleted:true})}</div>`).join("")}</section>`}`:
 `${retrospective?"":renderGuildMissionBrief(mission,projectContext)+renderProjectContext(projectContext,{hideRequirements:true})}${retrospective?`<section class="mission-notice"><b>Registro retroativo da Aula 3.</b> Confirme a Guilda, o repositório e as responsabilidades já organizadas. Não é necessário criar branches individuais.</section>`:""}${id==="2B"?`<section class="card current-mission"><p class="eyebrow">Aula 4 · Fundamentos de HTML5</p><h2>Primeiro: leia o infográfico e conclua os Fundamentos</h2><p>Depois, construa com o instrutor o index.html da EduTech com cabeçalho, navegação e rodapé. Deixe main vazio e replique a estrutura em pages/. A Guilda fará o mesmo no Projeto Restaurante.</p><a class="btn btn-primary" href="fundamentals.html?phase=2">${fundDone?"✓ Fundamentos concluídos · Revisar infográfico":"Abrir infográfico e marcar conclusão"} →</a></section>`:""}<section id="guildMissionBoard" class="card gm-board" aria-label="Kanban colaborativo da missão"></section><section class="card current-mission" aria-label="Orientações da Missão B"><p class="eyebrow">${retrospective?"Aula 3 · Guilda Projeto Restaurante":"Missão B · Projeto Restaurante · 4h"}</p><h2>${retrospective?"Organização inicial da equipe":"Agora é com a equipe"}</h2><p>${retrospective?"Nesta aula a turma conheceu a plataforma, formou Guildas, cadastrou repositórios e começou a dividir responsabilidades.":id==="2B"?"Nesta aula, primeiro estudamos os fundamentos, depois construímos a EduTech com o instrutor e, por fim, aplicamos a estrutura ao Projeto Restaurante.":"Na aula anterior, vocês aprenderam e praticaram no EduTech. Agora, a missão é aplicar o mesmo conhecimento ao Projeto Restaurante."}</p><p><strong>O que fazer:</strong> ${retrospective?"Confirmar a Guilda, o repositório Projeto Restaurante e as tarefas já distribuídas.":"Consultem o desafio e os critérios de aceitação apresentados acima, organizem as tarefas e desenvolvam a solução."}</p><p><strong>Como organizar:</strong> ${retrospective?"Utilizem o Kanban para consultar as responsabilidades já combinadas e registrar o que cada integrante fez.":"Criem tarefas no Kanban, distribuam entre os integrantes, acompanhem o andamento, implementem, testem e registrem as contribuições e evidências."}</p><p>${retrospective?"Não é necessário repetir a prática, criar branches individuais ou duplicar cadastros.":"Não é necessário repetir a teoria ou seguir outro tutorial passo a passo."}</p></section>${mission.steps.length?(id==="2B"?`<section class="card current-mission"><p class="eyebrow">Aula 4 · 8h–12h</p><h2>Fundamentos → Prática Guiada EduTech → Prática Autônoma Restaurante</h2><p>Comece pelos fundamentos e acompanhe os exemplos. Depois, construa a EduTech com o instrutor e aplique a estrutura no Projeto Restaurante com a Guilda.</p></section><section class="learning-list">${mission.steps.map(step=>`<div data-mission-step="${step.id}">${renderStep(step,id,done.includes(step.id))}</div>`).join("")}</section>`:`<details class="card current-mission"><summary><strong>Atividades e registros da missão (${mission.steps.length})</strong> — abrir para concluir e registrar evidências</summary><section class="learning-list">${mission.steps.map(step=>`<div data-mission-step="${step.id}">${renderStep(step,id,done.includes(step.id))}</div>`).join("")}</section></details>`):""}`;
 root.innerHTML=`<section class="mission-header"><p class="eyebrow">Fase ${pad(mission.phase)} • Missão ${escapeMissionText(mission.displayId||mission.id)} • ${scheduledLesson?`Aula ${pad(scheduledLesson.lesson_number)}`:"Aula a definir"}</p><h1>${mission.title}</h1><p>${mission.subtitle}</p><div class="mission-meta"><span class="pill">4h</span>${scheduledLesson?`<span class="pill">📅 Aula ${String(scheduledLesson.lesson_number).padStart(2,"0")} · ${scheduledLesson.lesson_date.split("-").reverse().join("/")} · ${scheduledLesson.execution_mode}${scheduledLesson.start&&scheduledLesson.end?" · "+scheduledLesson.start+"–"+scheduledLesson.end:""}</span>`:""}<span class="pill">${retrospective?(mission.type==="training"?"📘 EduTech":"⚔️ Projeto Restaurante"):(mission.type==="training"?"📘 + 🎓 EduTech":"⚔️ Projeto Restaurante")}</span><span class="pill">${pct}% da prática registrada</span></div></section>${guidedContent}`;
 if(mission.type==="training"&&!retrospective&&!readOnly){
  startFundamental(mission.phase);
  fund.steps.forEach(step=>bindStep(step,`F${mission.phase}`,()=>render(false,missionAccess),(_,stepId)=>completeFundamentalStep(mission.phase,stepId),{completed:fundamentalProgress.includes(step.id)}));
 }
 if(mission.type==="training"&&!retrospective)organizeEduTechPanels();
 reapplyMissionRevision(root,mission);
 if(mission.type==="guild")mountGuildMissionBoard(root,mission,{readOnly}).catch(error=>console.warn("Kanban:",error));
 if(!readOnly||access?.state==="closed")mountMissionDelivery(id,access,root).catch(error=>console.warn("Entrega indisponível:",error));
 if(readOnly){root.insertAdjacentHTML("afterbegin",`<section class="card current-mission" role="status"><h2>Consulta da missão • somente leitura</h2><p>${access?.state==="closed"?"O prazo terminou, mas a entrega com justificativa está disponível.":access?.state==="upcoming"?"Esta missão ainda não abriu para realização.":"Esta missão ainda não foi liberada para realização."} Você pode consultar o conteúdo e seu progresso, mas não alterar respostas ou concluir etapas.</p></section>`);root.querySelectorAll("input,textarea,select,button,[contenteditable]").forEach(el=>{if(el.closest(".mission-delivery"))return;if(el.matches("[contenteditable]"))el.removeAttribute("contenteditable");else el.disabled=true});return}

 mission.steps.forEach(step=>{const completed=done.includes(step.id);bindStep(step,id,render,undefined,{completed})});
 if(done.length===total)root.insertAdjacentHTML("beforeend",`<section class="card current-mission mission-complete"><p class="eyebrow">Missão ${escapeMissionText(mission.displayId||mission.id)} concluída</p><h2>${mission.type==="training"?"Aula registrada! 🎉":"Desafio da Guilda concluído! 🎉"}</h2><p>Seu progresso e suas evidências foram salvos.</p><a class="btn btn-primary" href="journey.html">Continuar Jornada →</a></section>`);
}
function startWindowWatch(missionId){let checking=false;const check=async()=>{if(checking||document.hidden)return;checking=true;try{const access=await missionWindow(missionId);if(access.state!=="open"&&access.state!=="closed"){if(!missionReadOnly||access.state!==missionAccess?.state){missionReadOnly=true;missionAccess=access;root.replaceChildren(windowNotice(access))}}else if(!missionAccess||missionAccess.state!==access.state){missionAccess=access;missionReadOnly=false;try{applyEditedMissionContent(id,await loadEditedMissionContent(id));projectContext=await getMissionProjectContext(mission);if(!missionReadOnly)startMission(id);await refreshMissionSchedule();render(missionReadOnly,access)}catch(error){console.error("Falha ao abrir missão:",error);root.textContent="Não foi possível abrir a missão. Atualize a página."}}else if(access.state!==missionAccess?.state){missionAccess=access;missionReadOnly=false;render(missionReadOnly,access)}}finally{checking=false}};const timer=setInterval(check,300000);document.addEventListener("visibilitychange",()=>{if(!document.hidden)check()})}
