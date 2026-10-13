import "./cloud-bootstrap.js";
import {getMission,getFundamental,startMission,startFundamental,missionStatus,fundamentalStatus,completeFundamentalStep,STATUS} from "./mission-engine.js";
import {getState} from "./storage.js";
import {renderStep,bindStep} from "./step-renderer.js";
import {getMissionProjectContext,renderProjectContext} from "./project-context.js";
let projectContext=null;
const params=new URLSearchParams(location.search),id=params.get("id"),root=document.querySelector("#missionRoot");
const state=getState();if(!state?.student?.name)location.replace("index.html");
const mission=getMission(id),pad=n=>String(n).padStart(2,"0");
if(!mission)root.innerHTML='<section class="card current-mission"><h1>Missão ainda não disponível</h1><a class="btn btn-primary" href="journey.html">Voltar ao mapa</a></section>';
else if(missionStatus(id)===STATUS.LOCKED)root.innerHTML='<section class="card current-mission"><h1>🔒 Missão bloqueada</h1><p>Conclua a missão anterior para continuar sua Jornada.</p><a class="btn btn-primary" href="journey.html">Voltar ao mapa</a></section>';
else{startMission(id);projectContext=await getMissionProjectContext(mission);render()}
function render(){
 const s=getState(),p=s.journey.missionProgress[id]||{completedSteps:[]},done=p.completedSteps||[],fund=getFundamental(mission.phase),fundDone=s.journey.completedFundamentals?.includes(`F${mission.phase}`),total=mission.steps.length,pct=Math.round(done.length/total*100);
 const guidedContent=mission.type==="training"?`
 <section class="lesson-flow card"><p class="eyebrow">Estrutura da aula • 4h</p><div class="lesson-flow-grid"><div class="${fundDone?"done":""}"><b>1</b><strong>📘 Fundamentos</strong><span>1h30 • dentro da Web Academy</span></div><div><b>2</b><strong>🎓 Prática Guiada EduTech</strong><span>2h • VS Code com o instrutor</span></div><div><b>3</b><strong>📝 Relatório Individual</strong><span>30min • registro e evidência</span></div></div></section>
 ${!fundDone?`<section class="card current-mission mission-gate"><p class="eyebrow">Etapa 1 de 3</p><h2>Fundamentos — ${fund.title}</h2><p>${fund.objective}</p><p>Conclua os Fundamentos antes de iniciar a prática guiada desta mesma missão.</p><a class="btn btn-primary" href="fundamentals.html?phase=${mission.phase}">Começar Fundamentos →</a></section>`:`<div class="mission-notice"><b>Fundamentos concluídos.</b> Agora faça junto com o instrutor no projeto real EduTech. Ao final, registre o Relatório Individual.</div>${renderProjectContext(projectContext)}<section class="learning-list">${mission.steps.map(step=>renderStep(step,id,done.includes(step.id))).join("")}</section>`}`:
 `${renderProjectContext(projectContext)}<div class="mission-notice"><b>Aplique com autonomia.</b> Esta aula de 4h é dedicada à Missão da Guilda. Planejem, dividam responsabilidades, implementem, testem, versionem e registrem as contribuições no Projeto Restaurante.</div><section class="learning-list">${mission.steps.map(step=>renderStep(step,id,done.includes(step.id))).join("")}</section>`;
 root.innerHTML=`<section class="mission-header"><p class="eyebrow">Fase ${pad(mission.phase)} • Missão ${pad(mission.number)} • Aula ${pad(mission.lesson)}</p><h1>${mission.title}</h1><p>${mission.subtitle}</p><div class="mission-meta"><span class="pill">4h</span><span class="pill">${mission.type==="training"?"📘 + 🎓 EduTech":"⚔️ Projeto Restaurante"}</span><span class="pill">${pct}% da prática registrada</span></div></section>${guidedContent}`;
 if(mission.type==="training"&&!fundDone)return;
 mission.steps.forEach(step=>{if(!done.includes(step.id))bindStep(step,id,render)});
 if(done.length===total)root.insertAdjacentHTML("beforeend",`<section class="card current-mission mission-complete"><p class="eyebrow">Missão ${pad(mission.number)} concluída</p><h2>${mission.type==="training"?"Aula registrada! 🎉":"Desafio da Guilda concluído! 🎉"}</h2><p>Seu progresso e suas evidências foram salvos.</p><a class="btn btn-primary" href="journey.html">Continuar Jornada →</a></section>`);
}