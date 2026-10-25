import {getState,cacheCloudState,setActiveUser} from "./storage.js";
import {getSupabase,getSession} from "./supabase-client.js";

// Merge independently collected learning evidence; never discard either device's work.
const unique=(a=[],b=[])=>[...new Set([...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])])];
const records=(a=[],b=[])=>{const out=new Map();for(const item of [...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])])out.set(item?.id||JSON.stringify(item),item);return [...out.values()]};
export function mergeStudentStates(remote,local){
 if(!remote)return local;if(!local)return remote;
 const newer=Date.parse(local.meta?.updatedAt||0)>=Date.parse(remote.meta?.updatedAt||0);
 const primary=newer?local:remote,secondary=newer?remote:local;
 const journey={...secondary.journey,...primary.journey};
 for(const field of ["completedMissions","unlockedMissions","completedFundamentals","unlockedFundamentals"])journey[field]=unique(remote.journey?.[field],local.journey?.[field]);
 for(const field of ["missionProgress","fundamentalProgress"]){
  journey[field]={...remote.journey?.[field],...local.journey?.[field]};
  for(const key of Object.keys(journey[field])){const a=remote.journey?.[field]?.[key]||{},b=local.journey?.[field]?.[key]||{};journey[field][key]={...(newer?a:b),...(newer?b:a),completedSteps:unique(a.completedSteps,b.completedSteps),startedAt:[a.startedAt,b.startedAt].filter(Boolean).sort()[0]||null,currentStep:Math.max(a.currentStep||0,b.currentStep||0)}}
 }
 journey.currentPhase=Math.max(remote.journey?.currentPhase||1,local.journey?.currentPhase||1);
 journey.progress=Math.max(remote.journey?.progress||0,local.journey?.progress||0);
 const gamification={...secondary.gamification,...primary.gamification};
 gamification.rewarded=unique(remote.gamification?.rewarded,local.gamification?.rewarded);
 gamification.achievements=records(remote.gamification?.achievements,local.gamification?.achievements);
 gamification.xpHistory=records(remote.gamification?.xpHistory,local.gamification?.xpHistory);
 // XP acumulado não pode diminuir ao reconciliar dispositivos; eventos continuam deduplicados.
 gamification.xp=Math.max(remote.gamification?.xp||0,local.gamification?.xp||0);
 const competencies={...remote.competencies,...local.competencies};
 for(const key of unique(Object.keys(remote.competencies||{}),Object.keys(local.competencies||{})))competencies[key]=records(remote.competencies?.[key],local.competencies?.[key]);
 return {...secondary,...primary,journey,gamification,competencies,
  answers:{...secondary.answers,...primary.answers},
  evidence:records(remote.evidence,local.evidence),
  extraMissions:{...secondary.extraMissions,...primary.extraMissions,completed:unique(remote.extraMissions?.completed,local.extraMissions?.completed)},
  meta:{...secondary.meta,...primary.meta,updatedAt:primary.meta?.updatedAt||secondary.meta?.updatedAt||new Date().toISOString()}};
}
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
