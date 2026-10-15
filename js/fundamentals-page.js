import {missionWindow,windowNotice} from "./mission-window.js";
import "./cloud-bootstrap.js";
import {getFundamental,startFundamental,fundamentalStatus,completeFundamentalStep,STATUS} from "./mission-engine.js";
import {getState} from "./storage.js";
import {renderStep,bindStep} from "./step-renderer.js";
const phase=Number(new URLSearchParams(location.search).get("phase")),root=document.querySelector("#fundamentalsRoot"),state=getState();
if(!state?.student?.name)location.replace("index.html");
const unit=getFundamental(phase);
if(!unit)root.innerHTML='<section class="card current-mission"><h1>Fundamentos não disponíveis</h1><a class="btn btn-primary" href="journey.html">Voltar ao mapa</a></section>';
else if(fundamentalStatus(phase)===STATUS.LOCKED)root.innerHTML='<section class="card current-mission"><h1>🔒 Fundamentos bloqueados</h1><p>Conclua a fase anterior para continuar.</p><a class="btn btn-primary" href="journey.html">Voltar ao mapa</a></section>';
else{root.innerHTML='<section class="card current-mission"><h1>Verificando disponibilidade...</h1></section>';const access=await missionWindow(`${phase}A`);if(access.state!=="open")root.replaceChildren(windowNotice(access));else{startFundamental(phase);render();startWindowWatch(`${phase}A`)}}
function render(){const s=getState(),id=`F${phase}`,p=s.journey.fundamentalProgress?.[id]||{completedSteps:[]},done=p.completedSteps||[],total=unit.steps.length,pct=Math.round(done.length/total*100);
root.innerHTML=`<section class="mission-header"><p class="eyebrow">Fase ${String(phase).padStart(2,"0")} • APRENDER</p><h1>Fundamentos — ${unit.title}</h1><p>${unit.objective}</p><div class="mission-meta"><span class="pill">1h30</span><span class="pill">📘 Dentro da Web Academy</span><span class="pill">${pct}% concluído</span></div><div class="progress-meta"><span>Progresso dos Fundamentos</span><b>${pct}%</b></div><div class="progress"><i style="width:${pct}%"></i></div></section><div class="mission-notice"><b>Primeiro, compreender.</b> Esta etapa acontece dentro da plataforma. Você não precisa abrir o VS Code para concluí-la. Leia, observe os exemplos, experimente quando houver laboratório e responda aos checkpoints.</div><section class="learning-list">${unit.steps.map(step=>renderStep(step,id,done.includes(step.id),{editableCompleted:true})).join("")}</section>`;
unit.steps.forEach(step=>{const completed=done.includes(step.id);bindStep(step,id,render,(_,stepId)=>completeFundamentalStep(phase,stepId),{completed})});
if(done.length===total)root.insertAdjacentHTML("beforeend",`<section class="card current-mission mission-complete"><p class="eyebrow">Fundamentos concluídos</p><h2>Agora é hora de fazer junto.</h2><p>Continue para a Prática Guiada EduTech desta fase.</p><a class="btn btn-primary" href="mission.html?id=${phase}A">Ir para a Prática Guiada →</a></section>`)}

function startWindowWatch(missionId){let checking=false;const check=async()=>{if(checking||document.hidden)return;checking=true;try{const access=await missionWindow(missionId);if(access.state!=="open"){root.replaceChildren(windowNotice(access));clearInterval(timer);document.removeEventListener("visibilitychange",check)}}finally{checking=false}};const timer=setInterval(check,60000);document.addEventListener("visibilitychange",check)}
