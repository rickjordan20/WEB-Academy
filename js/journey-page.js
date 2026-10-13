import "./cloud-bootstrap.js";
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
  <div class="phase-missions"><button class="mission-chip fundamentals-chip ${p.fundamental.status}" data-fundamental="${p.phase}" ${p.fundamental.status===STATUS.LOCKED?"disabled":""}><strong>📘 Fundamentos — APRENDER</strong><small>${p.fundamental.title} • 1h30</small></button>${p.missions.map(m=>`<button class="mission-chip ${m.status}" data-mission="${m.id}" ${m.status===STATUS.LOCKED?"disabled":""}><strong>${m.id} — ${m.type==="training"?"Prática Guiada EduTech":"Missão da Guilda"}</strong><small>${m.subtitle} • ${m.hours}h</small></button>`).join("")}</div>
 </article>`).join("");
 document.querySelectorAll("[data-fundamental]").forEach(b=>b.addEventListener("click",()=>location.href=`fundamentals.html?phase=${b.dataset.fundamental}`)); document.querySelectorAll("[data-mission]").forEach(b=>b.addEventListener("click",()=>location.href=`mission.html?id=${b.dataset.mission}`));
} render();