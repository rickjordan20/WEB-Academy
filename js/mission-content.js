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
 if(Array.isArray(content.steps))mission.steps=content.steps;
}
