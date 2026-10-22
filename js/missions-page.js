import {loadStudentMissionCatalog,studentMissionDescription} from "./student-mission-catalog.js";
import {missionWindowsBatch} from "./mission-window.js";
import {getSupabase} from "./supabase-client.js";
import "./cloud-bootstrap.js";import {MISSIONS,missionStatus,STATUS} from "./mission-engine.js";import {getState} from "./storage.js";
const state=getState();if(!state?.student?.name)location.replace("index.html");const root=document.querySelector("#missionsCatalog"),labels={locked:"Bloqueada",available:"Disponível","in-progress":"Em andamento",completed:"Concluída"},pad=n=>String(n).padStart(2,"0");
let scheduleByMission=new Map(),accessByMission=new Map();async function loadAccess(){try{accessByMission=await missionWindowsBatch()}catch(error){console.warn("Acesso às missões:",error);accessByMission=new Map(MISSIONS.map(m=>[m.id,{state:"error",message:"Falha ao verificar publicação"}]))}render()}
const lessonLabel=row=>{if(!row)return "Aguardando associação ao cronograma";const [y,m,d]=row.lesson_date.split("-");return `📅 ${d}/${m}/${y} · Aula ${String(row.lesson_number).padStart(2,"0")} · ${row.execution_mode}${row.start&&row.end?" · "+row.start+"–"+row.end:""}`};
async function loadMissionSchedule(){try{const sb=await getSupabase();if(!sb)return;const {data:auth}=await sb.auth.getUser();if(!auth?.user)return;const {data:members}=await sb.from("class_members").select("class_id").eq("user_id",auth.user.id).eq("status","active").limit(1);const classId=members?.[0]?.class_id;if(!classId)return;const {data,error}=await sb.from("class_schedule").select("mission_id,lesson_number,lesson_date,execution_mode,start_time_override,end_time_override").eq("class_id",classId).eq("uc","UC7").not("mission_id","is",null).order("lesson_date");if(error)throw error;const {data:classData}=await sb.from("classes").select("lesson_start_time,lesson_end_time").eq("id",classId).maybeSingle();scheduleByMission=new Map((data||[]).map(row=>[row.mission_id,{...row,start:String(row.start_time_override||classData?.lesson_start_time||"").slice(0,5),end:String(row.end_time_override||classData?.lesson_end_time||"").slice(0,5)}]));render()}catch(error){console.warn("Cronograma das missões indisponível:",error)}}

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let catalogFilter="all",catalogQuery="";
function render(){
 const s=getState(),done=s.journey?.completedMissions||[];
 document.querySelector("#missionCount").textContent=`${done.length}/28`;
 const options=[["all","Todas"],["available","Disponíveis"],["upcoming","Aguardando"],["training","EduTech"],["guild","Restaurante"],["completed","Concluídas"]];
 const filtered=MISSIONS.filter(m=>{
  const access=accessByMission.get(m.id),status=missionStatus(m.id);
  const match=catalogFilter==="all"||catalogFilter==="available"&&(access?.state==="open")||catalogFilter==="upcoming"&&!(access?.state==="open")||catalogFilter==="training"&&m.type==="training"||catalogFilter==="guild"&&m.type!=="training"||catalogFilter==="completed"&&status==="completed";
  const desc=studentMissionDescription(m);
  return match&&(`${m.id} ${m.subtitle} ${m.title||""} ${desc}`.toLocaleLowerCase("pt-BR").includes(catalogQuery));
 });
 root.innerHTML=`<div class="mission-explorer"><div class="mission-explorer-heading"><div><span class="eyebrow">ESCOLHA SEU PRÓXIMO DESAFIO</span><h2>Mapa de missões</h2><p>Aprenda, pratique e avance na sua jornada de desenvolvimento web.</p></div><strong>${filtered.length} de 28</strong></div><div class="mission-explorer-controls"><label class="mission-explorer-search"><span class="sr-only">Buscar missão</span><input id="catalogSearch" type="search" placeholder="Buscar por assunto ou missão..." value="${esc(catalogQuery)}" autocomplete="off"></label><div class="mission-explorer-filters" role="group" aria-label="Filtrar missões">${options.map(([key,label])=>`<button type="button" data-catalog-filter="${key}" aria-pressed="${catalogFilter===key}" class="${catalogFilter===key?"active":""}">${label}</button>`).join("")}</div></div></div><div class="mission-explorer-grid">${filtered.map(m=>{
  const status=missionStatus(m.id),access=accessByMission.get(m.id),editable=access?.state==="open",locked=!editable;
  const guided=m.type==="training",desc=studentMissionDescription(m);
  const heading=String(m.subtitle||m.title||"").trim(),normalized=v=>String(v||"").toLocaleLowerCase("pt-BR").replace(/\s+/g," ").replace(/[.!?]+$/g,"").trim();
  const showDescription=normalized(desc)!==normalized(heading)&&!normalized(heading).includes(normalized(desc))&&!normalized(desc).includes(normalized(heading));
  const stateLabel=access?.state==="closed"?"Prazo encerrado":access?.state==="open"?"Missão liberada":access?.state==="unpublished"?"Aguardando publicação pelo instrutor":access?.state==="upcoming"?"Aguardando data de liberação":access?.state==="unconfigured"?"Aguardando configuração":access?.message||"Verificando disponibilidade";
  return `<a href="mission.html?id=${encodeURIComponent(m.id)}" class="mission-explorer-card mission-explorer-card-link ${guided?"guided":"guild"} ${esc(status)} ${locked?"is-locked":""}"><div class="mission-explorer-card-top"><span class="mission-explorer-index">MISSÃO ${esc(m.displayId||m.id)}</span><span class="mission-explorer-type">${guided?"📘 EduTech":"⚔️ Restaurante"}</span></div><div class="mission-explorer-symbol" aria-hidden="true">${["⌘","◈","◇","✦","◉","▦","⚡","◎","⚙","⇄","▤","⛨","✚","★"][m.phase-1]||"✦"}</div><p class="mission-explorer-phase">CICLO ${pad(m.phase)} · ${guided?"PRÁTICA GUIADA":"PRÁTICA AUTÔNOMA"}</p><h3>${esc(heading)}</h3>${showDescription?`<p class="mission-explorer-description">${esc(desc)}</p>`:""}<div class="mission-explorer-bottom"><p class="mission-explorer-date">${esc(lessonLabel(scheduleByMission.get(m.id)))}</p><span class="mission-explorer-state">${locked?"🔒 ":""}${esc(stateLabel)}</span>${locked?"":`<span class="mission-explorer-open">${"Abrir missão"} →</span>`}</div></a>`
 }).join("")||'<p class="mission-explorer-empty">Nenhuma missão encontrada para este filtro.</p>'}</div>`;
 root.querySelectorAll(".mission-explorer-card-link.is-locked").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();const message=a.querySelector(".mission-explorer-state")?.textContent||"Missão aguardando liberação";a.setAttribute("title",message);a.querySelector(".mission-explorer-state")?.scrollIntoView({block:"nearest"});}));
 root.querySelector("#catalogSearch")?.addEventListener("input",e=>{const input=e.target,pos=input.selectionStart;catalogQuery=input.value.toLocaleLowerCase("pt-BR");render();const next=root.querySelector("#catalogSearch");next.focus();next.setSelectionRange(pos,pos)});
 root.querySelectorAll("[data-catalog-filter]").forEach(btn=>btn.addEventListener("click",()=>{catalogFilter=btn.dataset.catalogFilter;render()}));
}

Promise.all([loadMissionSchedule(),loadAccess(),loadStudentMissionCatalog().then(render).catch(e=>console.warn("Catálogo:",e))]);

setInterval(()=>{if(!document.hidden)loadAccess().catch(error=>console.warn("Atualização do cronograma:",error))},60000);
document.addEventListener("visibilitychange",()=>{if(!document.hidden)loadAccess().catch(error=>console.warn("Atualização do cronograma:",error))});
