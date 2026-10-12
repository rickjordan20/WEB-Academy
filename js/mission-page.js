import { getMission,startMission,missionStatus,STATUS } from "./mission-engine.js";
import { getState } from "./storage.js";
import { renderStep,bindStep } from "./step-renderer.js";
const params=new URLSearchParams(location.search),id=params.get("id"),root=document.querySelector("#missionRoot");
const state=getState();if(!state?.student?.name)location.replace("index.html");
const mission=getMission(id);
if(!mission)root.innerHTML='<section class="card current-mission"><h1>Missão ainda não disponível</h1><p>Esta missão será adicionada progressivamente à Jornada Web.</p><a class="btn btn-primary" href="journey.html">Voltar ao mapa</a></section>';
else if(missionStatus(id)===STATUS.LOCKED)root.innerHTML='<section class="card current-mission"><h1>🔒 Missão bloqueada</h1><p>Conclua a missão anterior para continuar sua Jornada.</p><a class="btn btn-primary" href="journey.html">Voltar ao mapa</a></section>';
else{startMission(id);render()}
function render(){
 const s=getState(),p=s.journey.missionProgress[id]||{completedSteps:[]},done=p.completedSteps||[],total=mission.steps.length,pct=Math.round(done.length/total*100);
 root.innerHTML=`<section class="mission-header"><p class="eyebrow">Fase ${String(mission.phase).padStart(2,"0")} • ${mission.type==="training"?"Missão de Treinamento":"Missão da Guilda"}</p><h1>${mission.id} — ${mission.title}</h1><p>${mission.subtitle}</p><div class="mission-meta"><span class="pill">${mission.hours}h</span><span class="pill">${mission.project==="edutech"?"🎓 EduTech":"⚔️ Projeto Restaurante"}</span><span class="pill">${pct}% concluído</span></div><div class="progress-meta"><span>Progresso da missão</span><b>${pct}%</b></div><div class="progress"><i style="width:${pct}%"></i></div></section>
 <div class="mission-notice"><b>Aprenda fazendo.</b> Leia, experimente, responda e avance. Errar faz parte do processo: checkpoints podem ser tentados novamente sem penalização.</div>
 <section class="learning-list">${mission.steps.map(step=>renderStep(step,id,done.includes(step.id))).join("")}</section>`;
 mission.steps.forEach(step=>{if(!done.includes(step.id))bindStep(step,id,render)});
 if(done.length===total)root.insertAdjacentHTML("beforeend",'<section class="card current-mission mission-complete"><p class="eyebrow">Missão concluída</p><h2>Checkpoint alcançado! 🎉</h2><p>Seu progresso e suas respostas foram salvos. Continue pelo Mapa da Jornada.</p><a class="btn btn-primary" href="journey.html">Continuar Jornada →</a></section>');
}