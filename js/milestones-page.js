import {ASSESSMENT_MILESTONES,MISSIONS} from "../data/missions.js";
import {getSupabase,getSession} from "./supabase-client.js";
const root=document.querySelector("#milestonesRoot");
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateBR=d=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(d||""))return "Data a definir";const [y,m,day]=d.split("-");return `${day}/${m}/${y}`};
function render(rows=[]){
 root.innerHTML=`<div class="milestone-grid">${ASSESSMENT_MILESTONES.map((m,i)=>{const row=rows.find(x=>x.mission_id===m.after),mission=MISSIONS.find(x=>x.id===m.after);return `<article class="card milestone-card"><span class="milestone-number">${m.id==="FINAL"?"🏆":"🏁"}</span><div><p class="eyebrow">${m.id==="FINAL"?"Desafio Final":`Marco ${i+1}`}</p><h2>${esc(m.title)}</h2><p>${esc(m.official)}</p><div class="milestone-lesson"><strong>📅 ${esc(row?dateBR(row.lesson_date):"Data a confirmar")}</strong><span>${row?`Aula ${String(row.lesson_number).padStart(2,"0")} · ${esc(row.execution_mode||"Presencial")}`:"Aula ainda não vinculada ao calendário"}</span><a href="mission.html?id=${encodeURIComponent(m.after)}">Missão ${esc(m.after)} — ${esc(mission?.title||"Atividade avaliativa")} →</a></div><small>Indicadores: ${m.competencies.map(esc).join(", ")}</small></div></article>`}).join("")}</div>`;
}
async function init(){
 render();
 try{
  const sb=await getSupabase(),session=await getSession();if(!sb||!session)return;
  const {data:members,error:memberError}=await sb.from("class_members").select("class_id").eq("user_id",session.user.id).eq("status","active");if(memberError)throw memberError;
  if(!members?.length)return;
  const preferred=localStorage.getItem("webacademy.student.activeClass");
  const classId=(members.find(m=>m.class_id===preferred)||members[0]).class_id;
  const {data,error}=await sb.from("class_schedule").select("lesson_number,lesson_date,mission_id,execution_mode").eq("class_id",classId).in("mission_id",ASSESSMENT_MILESTONES.map(m=>m.after)).order("lesson_date");if(error)throw error;
  render(data||[]);
 }catch(error){console.warn("Não foi possível consultar o calendário dos marcos:",error)}
}
init();
