import { getMission, startMission, completeStep, missionStatus, STATUS } from "./mission-engine.js";
import { getState } from "./storage.js";
const params=new URLSearchParams(location.search), id=params.get("id"), root=document.querySelector("#missionRoot");
const state=getState(); if(!state?.student?.name) location.replace("index.html");
const mission=getMission(id);
if(!mission){root.innerHTML='<section class="card current-mission"><h1>Missão ainda não disponível</h1><p>Esta missão será adicionada progressivamente à Jornada Web.</p><a class="btn btn-primary" href="journey.html">Voltar ao mapa</a></section>';}
else if(missionStatus(id)===STATUS.LOCKED){root.innerHTML='<section class="card current-mission"><h1>🔒 Missão bloqueada</h1><p>Conclua a missão anterior para continuar sua Jornada.</p><a class="btn btn-primary" href="journey.html">Voltar ao mapa</a></section>';}
else {startMission(id); render();}
function render(){
 const s=getState(), progress=s.journey.missionProgress[id]||{completedSteps:[]};
 const done=progress.completedSteps||[], total=mission.steps.length, pct=Math.round(done.length/total*100);
 root.innerHTML=`<section class="mission-header"><p class="eyebrow">Fase ${String(mission.phase).padStart(2,"0")} • ${mission.type==="training"?"Missão de Treinamento":"Missão da Guilda"}</p><h1>${mission.id} — ${mission.title}</h1><p>${mission.subtitle}</p><div class="mission-meta"><span class="pill">${mission.hours}h</span><span class="pill">${mission.project==="edutech"?"🎓 EduTech":"⚔️ Projeto Restaurante"}</span><span class="pill">${pct}% concluído</span></div></section>
 <div class="mission-notice">Esta é a primeira versão do Motor de Missões. Nesta implantação, as etapas demonstram progressão, retomada e desbloqueio. O conteúdo didático completo será incorporado na fase de Ambiente Interativo de Aprendizagem.</div>
 <section class="step-list">${mission.steps.map((step,i)=>{const ok=done.includes(step.id);return `<article class="step-card card ${ok?"done":""}"><div class="step-index">${ok?"✓":i+1}</div><div><h3>${step.title}</h3><p>${step.summary}</p></div><button class="btn ${ok?"btn-secondary":"btn-primary"}" data-step="${step.id}" ${ok?"disabled":""}>${ok?"Concluído":"Concluir etapa"}</button></article>`}).join("")}</section>`;
 root.querySelectorAll("[data-step]").forEach(b=>b.addEventListener("click",()=>{completeStep(id,b.dataset.step);render();}));
 if(done.length===total) root.insertAdjacentHTML("beforeend",'<section class="card current-mission" style="margin-top:1rem"><p class="eyebrow">Missão concluída</p><h2>Checkpoint alcançado! 🎉</h2><p>Sua progressão foi salva. A próxima missão disponível já pode ser acessada no Mapa da Jornada.</p><a class="btn btn-primary" href="journey.html">Continuar Jornada →</a></section>');
}