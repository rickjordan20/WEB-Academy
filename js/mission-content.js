import {getSupabase} from "./supabase-client.js";
import {MISSIONS,EXTRA_MISSIONS} from "../data/missions.js";
export async function loadEditedMissionContent(missionId){
 try{
 const sb=await getSupabase();if(!sb)return null;
 const {data:auth}=await sb.auth.getUser();if(!auth?.user)return null;
 const {data:members,error:memberError}=await sb.from("class_members").select("class_id").eq("user_id",auth.user.id).eq("status","active");
 if(memberError||!members?.length)return null;
 const preferred=localStorage.getItem("webacademy.student.activeClass");
 const classId=(members.find(m=>m.class_id===preferred)||members[0]).class_id;
 const {data,error}=await sb.from("mission_content_overrides").select("content").eq("class_id",classId).eq("mission_id",missionId).maybeSingle();
 if(error)throw error;
 return data?.content||null;
 }catch(error){console.error("Não foi possível carregar o conteúdo da missão:",error);throw error;}
}
export function applyEditedMissionContent(missionId,content){
 if(!content)return;
 const mission=[...MISSIONS,...EXTRA_MISSIONS].find(m=>m.id===missionId);if(!mission)return;
 if(typeof content.title==="string")mission.title=content.title;
 if(typeof content.subtitle==="string")mission.subtitle=content.subtitle;
 if(Array.isArray(content.steps)&&!(missionId==="1B"&&content.steps.length===0))mission.steps=content.steps;
 // Infográfico original aprovado no construtor: mostrar também na revisão da primeira aula.
 if(missionId==="1A"){
  const image=content.draft?.fundamental?.steps?.find(step=>step.type==="image-review"&&typeof step.imageData==="string"&&step.imageData.startsWith("data:image/jpeg;base64,"));
  if(image&&!mission.steps.some(step=>step.id==="retro-1-infographic"))mission.steps=[{...image,id:"retro-1-infographic",title:"Infográfico da aula · Pastas, VS Code, Git e GitHub",summary:"Observe a imagem original utilizada em sala antes de responder às questões."},...mission.steps];
 }
}

/** Atualiza o conteúdo da missão diretamente do Supabase quando o instrutor publicar mudanças. */
export async function watchMissionContent(missionId,onUpdate){
 const sb=await getSupabase();if(!sb)return ()=>{};
 const {data:auth}=await sb.auth.getUser();if(!auth?.user)return ()=>{};
 const {data:members,error}=await sb.from("class_members").select("class_id").eq("user_id",auth.user.id).eq("status","active");
 if(error||!members?.length)return ()=>{};
 const preferred=localStorage.getItem("webacademy.student.activeClass");
 const classId=(members.find(m=>m.class_id===preferred)||members[0]).class_id;
 let active=true,loading=false;
 const refresh=async()=>{if(!active||loading)return;loading=true;try{const {data,error}=await sb.from("mission_content_overrides").select("content").eq("class_id",classId).eq("mission_id",missionId).maybeSingle();if(error)throw error;if(active)onUpdate(data?.content||null)}catch(e){console.warn("Atualização da missão:",e)}finally{loading=false}};
 const channel=sb.channel("student-mission-content-"+classId+"-"+missionId).on("postgres_changes",{event:"*",schema:"public",table:"mission_content_overrides",filter:"class_id=eq."+classId},payload=>{if(payload.new?.mission_id===missionId||payload.old?.mission_id===missionId)refresh()}).subscribe();
 const onFocus=()=>refresh(),onVisible=()=>{if(!document.hidden)refresh()};
 window.addEventListener("focus",onFocus);document.addEventListener("visibilitychange",onVisible);
 return ()=>{active=false;window.removeEventListener("focus",onFocus);document.removeEventListener("visibilitychange",onVisible);sb.removeChannel(channel)};
}
