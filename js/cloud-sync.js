import {getState,cacheCloudState,setActiveUser} from "./storage.js";
import {getSupabase,getSession} from "./supabase-client.js";

import {mergeStudentStates} from "./cloud-state-merge.js";
export {mergeStudentStates} from "./cloud-state-merge.js";

export async function pullCloudState(){
 const sb=await getSupabase(),session=await getSession();if(!sb||!session)return null;setActiveUser(session.user.id);
 const {data,error}=await sb.from("student_states").select("state,updated_at").eq("user_id",session.user.id).maybeSingle();
 if(error)throw error;if(!data?.state)return null;
 const local=getState(session.user.id),merged=mergeStudentStates(data.state,local);
 cacheCloudState(merged,session.user.id);
 return merged;
}
let inflight=null;
export async function pushCloudState(){
 if(inflight)return inflight;
 inflight=(async()=>{
  const sb=await getSupabase(),session=await getSession();if(!sb||!session)return {synced:false};
  setActiveUser(session.user.id);
  // Read latest remote before writing to reduce conflicts. Database-side CAS is still needed
  // to guarantee safety against truly simultaneous writes.
  const {data,error:readError}=await sb.from("student_states").select("state,updated_at").eq("user_id",session.user.id).maybeSingle();
  if(readError)throw readError;
  const current=getState(session.user.id);if(!current)return {synced:false};
  const merged=mergeStudentStates(data?.state,current);
  let candidate=merged,saved=false;
  for(let attempt=0;attempt<5;attempt++){
   const expected=attempt===0?(data?.updated_at||null):null;
   const result=await sb.rpc("save_student_state_cas",{p_state:candidate,p_expected_updated_at:expected});
   if(result.error)throw result.error;
   const row=Array.isArray(result.data)?result.data[0]:result.data;
   if(row?.saved){saved=true;break}
   if(!row?.cloud_state)throw new Error("Resposta de sincronização inválida.");
   candidate=mergeStudentStates(row.cloud_state,candidate);
   const retry=await sb.rpc("save_student_state_cas",{p_state:candidate,p_expected_updated_at:row.cloud_updated_at});
   if(retry.error)throw retry.error;
   const retried=Array.isArray(retry.data)?retry.data[0]:retry.data;
   if(retried?.saved){saved=true;break}
   candidate=mergeStudentStates(retried?.cloud_state,candidate);
  }
  if(!saved)throw new Error("Conflito de sincronização persistente; progresso local preservado.");
  // Preserve edits made while the asynchronous sync was running.
  cacheCloudState(mergeStudentStates(candidate,getState(session.user.id)),session.user.id);
  window.dispatchEvent(new CustomEvent("uc7:cloud-synced"));return {synced:true};
 })().finally(()=>{inflight=null});
 return inflight;
}
