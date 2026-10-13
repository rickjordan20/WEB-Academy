import "./cloud-bootstrap.js";
import { getJourneyView, STATUS } from "./mission-engine.js";
import { getState } from "./storage.js";
const state=getState(); if(!state?.student?.name) location.replace("index.html");
const map=document.querySelector("#journeyMap");
const labels={locked:"Bloqueada",available:"Disponível","in-progress":"Em andamento",completed:"Concluída"};
const pad=n=>String(n).padStart(2,"0");
function render(){
 const view=getJourneyView(),fresh=getState();
 document.querySelector("#journeyPercent").textContent=`${fresh.journey.progress||0}%`;
 document.querySelector("#journeyProgress").style.width=`${fresh.journey.progress||0}%`;
 map.innerHTML=view.map(p=>`<article class="phase-card card ${p.status}">
  <div class="phase-number"><span>${p.icon}</span></div>
  <div class="phase-info"><p class="eyebrow">Fase ${pad(p.phase)} • 8h</p><h2>${p.title}</h2><p>${p.axis}</p></div>
  <span class="phase-status">${p.status===STATUS.LOCKED?"🔒 ":""}${labels[p.status]}</span>
  <div class="phase-missions">${p.missions.map(m=>`<button class="mission-chip ${m.status}" data-mission="${m.id}" ${m.status===STATUS.LOCKED?"disabled":""}><strong>Missão ${pad(m.number)} • Aula ${pad(m.lesson)}</strong><small>${m.type==="training"?"📘 Fundamentos + 🎓 Prática Guiada EduTech + 📝 Relatório":"⚔️ Missão da Guilda • Prática autônoma"} • 4h</small><small>${m.subtitle}</small></button>`).join("")}</div>
 </article>`).join("");
 document.querySelectorAll("[data-mission]").forEach(b=>b.addEventListener("click",()=>location.href=`mission.html?id=${b.dataset.mission}`));
} render();