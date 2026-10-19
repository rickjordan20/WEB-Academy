import {MISSIONS,EXTRA_MISSIONS} from "../data/missions.js";
import {getSupabase,getSession} from "./supabase-client.js";
const root=document.querySelector("#milestonesRoot");
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateBR=d=>d?d.split("-").reverse().join("/"):"Data a confirmar";
const allMissions=[...MISSIONS,...EXTRA_MISSIONS];
function render(milestones,schedule){
 root.innerHTML=`<div class="milestone-grid">${milestones.map((m,i)=>{const row=schedule.find(x=>x.mission_id===m.mission_id),mission=allMissions.find(x=>x.id===m.mission_id);return `<article class="card milestone-card"><span class="milestone-number">${m.code==="FINAL"?"🏆":"🏁"}</span><div><p class="eyebrow">${m.code==="FINAL"?"Desafio Final":"Marco "+(i+1)} · ${m.status==="closed"?"Encerrado":"Publicado"}</p><h2>${esc(m.title)}</h2><p>${esc(m.description)}</p><div class="milestone-lesson"><strong>📅 ${esc(row?dateBR(row.lesson_date):"Data a confirmar")}</strong><span>${row?"Aula "+String(row.lesson_number).padStart(2,"0")+" · "+esc(row.execution_mode||"Presencial"):"Aula ainda não vinculada"}</span>${m.mission_id?`<a href="${m.mission_id.startsWith("R")?"extras.html?id=":"mission.html?id="}${encodeURIComponent(m.mission_id)}">Missão ${esc(m.mission_id)} — ${esc(mission?.title||"Atividade")} →</a>`:""}</div><small>Indicadores: ${esc((m.indicator_codes||[]).join(", ")||"A definir")}</small></div></article>`}).join("")||'<section class="card">Ainda não há marcos avaliativos publicados para sua turma.</section>'}</div>`;
}
async function init(){
 root.innerHTML='<section class="card">Carregando marcos avaliativos...</section>';
 try{
  const sb=await getSupabase(),session=await getSession();if(!sb||!session){root.textContent="Entre na plataforma para consultar os marcos.";return}
  const {data:members,error:me}=await sb.from("class_members").select("class_id").eq("user_id",session.user.id).eq("status","active");if(me)throw me;
  if(!members?.length){root.textContent="Nenhuma turma ativa encontrada.";return}
  const preferred=localStorage.getItem("webacademy.student.activeClass"),classId=(members.find(m=>m.class_id===preferred)||members[0]).class_id;
  const [a,b]=await Promise.all([sb.from("assessment_milestones").select("code,title,description,mission_id,indicator_codes,status,sort_order").eq("class_id",classId).in("status",["published","closed"]).order("sort_order"),sb.from("class_schedule").select("lesson_number,lesson_date,mission_id,execution_mode").eq("class_id",classId).eq("uc","UC7")]);
  if(a.error)throw a.error;if(b.error)throw b.error;render(a.data||[],b.data||[]);
 }catch(error){console.error("Marcos avaliativos:",error);root.innerHTML='<section class="card">Não foi possível consultar os marcos. Atualize a página ou avise o instrutor.</section>'}
}
init();
