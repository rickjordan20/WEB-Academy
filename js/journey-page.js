import { getJourneyView, STATUS } from "./mission-engine.js";
import { getState } from "./storage.js";
const state=getState(); if(!state?.student?.name) location.replace("index.html");
const map=document.querySelector("#journeyMap");
const labels={locked:"Bloqueada",available:"Disponível","in-progress":"Em andamento",completed:"Concluída"};
function render(){
 const view=getJourneyView(), fresh=getState();
 document.querySelector("#journeyPercent").textContent=`${fresh.journey.progress||0}%`;
 document.querySelector("#journeyProgress").style.width=`${fresh.journey.progress||0}%`;
 map.innerHTML=view.map(p=>`<article class="phase-card card ${p.status}">
  <div class="phase-number"><span>${p.icon}</span></div>
  <div class="phase-info"><p class="eyebrow">Fase ${String(p.phase).padStart(2,"0")}</p><h2>${p.title}</h2><p>${p.axis}</p></div>
  <span class="phase-status">${p.status===STATUS.LOCKED?"🔒 ":""}${labels[p.status]}</span>
  <div class="phase-missions">${p.missions.length?p.missions.map(m=>`<button class="mission-chip ${m.status}" data-mission="${m.id}" ${m.status===STATUS.LOCKED?"disabled":""}><strong>${m.id} — ${m.type==="training"?"Missão de Treinamento":"Missão da Guilda"}</strong><small>${m.subtitle}</small></button>`).join(""):`<button class="mission-chip" disabled><strong>Missões em preparação</strong><small>O conteúdo será liberado progressivamente.</small></button>`}</div>
 </article>`).join("");
 document.querySelectorAll("[data-mission]").forEach(b=>b.addEventListener("click",()=>location.href=`mission.html?id=${b.dataset.mission}`));
} render();