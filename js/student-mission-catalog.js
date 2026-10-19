import {getSupabase} from "./supabase-client.js";
import {MISSIONS} from "../data/missions.js";
// Read-only catalog metadata. Drafts are never exposed to students.
export async function loadStudentMissionCatalog(){
 const sb=await getSupabase();if(!sb)return;
 const {data:auth}=await sb.auth.getUser();if(!auth?.user)return;
 const {data:members,error:memberError}=await sb.from("class_members").select("class_id").eq("user_id",auth.user.id).eq("status","active");
 if(memberError)throw memberError;if(!members?.length)return;
 const preferred=localStorage.getItem("webacademy.student.activeClass");
 const classId=(members.find(m=>m.class_id===preferred)||members[0]).class_id;
 const {data,error}=await sb.from("mission_content_overrides").select("mission_id,content").eq("class_id",classId);
 if(error)throw error;
 for(const row of data||[]){
  const m=MISSIONS.find(m=>m.id===row.mission_id),c=row.content;
  if(!m||!c||!["published","closed"].includes(c.status))continue;
  if(typeof c.title==="string")m.title=c.title;
  if(typeof c.subtitle==="string")m.subtitle=c.subtitle;
 }
}
export function studentMissionDescription(m){return m.subtitle||m.official||"Confira os objetivos e desafios desta missão."}
