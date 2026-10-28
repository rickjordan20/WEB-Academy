import {getState,cacheCloudState,setActiveUser} from "./storage.js";
import {getSupabase,getSession} from "./supabase-client.js";

// Merge independently collected learning evidence; never discard either device's work.
const unique=(a=[],b=[])=>[...new Set([...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])])];
const records=(a=[],b=[])=>{const out=new Map();for(const item of [...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])])out.set(item?.id||JSON.stringify(item),item);return [...out.values()]};
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const plain=value=>value!==null&&typeof value==="object"&&!Array.isArray(value);
const mergeAnswerFields=(remote,local,preferLocal)=>{
 if(!plain(remote)||!plain(local))return preferLocal?local:remote;
 const result={...remote,...local};
 for(const key of new Set([...Object.keys(remote),...Object.keys(local)])){
  if(!(key in remote))result[key]=local[key];
  else if(!(key in local))result[key]=remote[key];
  else if(plain(remote[key])&&plain(local[key]))result[key]=mergeAnswerFields(remote[key],local[key],preferLocal);
  else result[key]=preferLocal?local[key]:remote[key];
 }
 return result;
};
const hasConflictingFields=(remote,local)=>{
 if(!plain(remote)||!plain(local))return !same(remote,local);
 return Object.keys(remote).some(key=>key in local&&hasConflictingFields(remote[key],local[key]));
};
const mergeF3Check=(remote,local)=>{
 const history=[...(Array.isArray(remote?.history)?remote.history:[]),...(Array.isArray(local?.history)?local.history:[])];
 const seen=new Set();const mergedHistory=history.filter(a=>{const id=JSON.stringify([a.at,a.selected,a.correct]);if(seen.has(id))return false;seen.add(id);return true}).sort((a,b)=>String(a.at||"").localeCompare(String(b.at||""))).slice(-30);
 const latest=String(local?.updatedAt||"")>=String(remote?.updatedAt||"")?local:remote;
 const attempts=Math.max(Number(remote?.attempts)||0,Number(local?.attempts)||0,mergedHistory.length);
 const first=mergedHistory[0]?.correct;
 const firstTryCorrect=(Number(remote?.attempts)>mergedHistory.length||Number(local?.attempts)>mergedHistory.length)?(remote?.firstTryCorrect??local?.firstTryCorrect??false):(typeof first==="boolean"?first:(remote?.firstTryCorrect??local?.firstTryCorrect??false));
 return {...remote,...local,...latest,history:mergedHistory,attempts,firstTryCorrect,correct:remote?.correct===true||local?.correct===true};
};
const mergeAnswers=(remote={},local={},preferLocal,previous=[])=>{
 const answers={},conflicts=records(previous);
 for(const key of new Set([...Object.keys(remote),...Object.keys(local)])){
  if(!(key in remote)){answers[key]=local[key];continue}
  if(!(key in local)){answers[key]=remote[key];continue}
  if(same(remote[key],local[key])){answers[key]=remote[key];continue}
  if(key.startsWith("F3:f3-slide-")&&plain(remote[key])&&plain(local[key])){answers[key]=mergeF3Check(remote[key],local[key]);continue}
  answers[key]=mergeAnswerFields(remote[key],local[key],preferLocal);
  if(!hasConflictingFields(remote[key],local[key]))continue;
  const losing=preferLocal?remote[key]:local[key];
  const id=key+":"+JSON.stringify(losing);
  if(!conflicts.some(item=>item.answerKey===key&&same(item.value,losing))&&!conflicts.some(item=>item.answerKey===key&&same(item.value,answers[key])))conflicts.push({id,answerKey:key,value:losing});
 }
 return {answers,conflicts};
};
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
 // XP events have a stable reward key, not an id. Merge by key to avoid
 // duplicating the same award when the local and cloud copies are reconciled.
 // Preserve legacy events without a key using their original identity.
 const xpEvents=new Map();
 for(const event of [...(Array.isArray(remote.gamification?.xpHistory)?remote.gamification.xpHistory:[]),...(Array.isArray(local.gamification?.xpHistory)?local.gamification.xpHistory:[])]){
  const identity=event?.key!=null&&String(event.key).length?'key:'+String(event.key):event?.id!=null?'id:'+String(event.id):'legacy:'+JSON.stringify(event);
  if(!xpEvents.has(identity))xpEvents.set(identity,event);
 }
 gamification.xpHistory=[...xpEvents.values()];
 // Preserve o maior saldo legado, mas inclua recompensas únicas registradas
 // em dispositivos diferentes. Divergências permanecem sinalizadas para revisão.
 const eventTotal=gamification.xpHistory.reduce((sum,event)=>sum+(Number(event?.amount)||0),0);
 const previousTotal=Math.max(Number(remote.gamification?.xp)||0,Number(local.gamification?.xp)||0);
 gamification.xp=Math.max(previousTotal,eventTotal);
 if(gamification.xp!==eventTotal)gamification.xpReconciliation={status:"review_required",eventTotal,accumulatedXp:gamification.xp};
 else delete gamification.xpReconciliation;
 const mergedAnswers=mergeAnswers(remote.answers||{},local.answers||{},newer,records(remote.answerConflicts,local.answerConflicts));
 const competencies={...remote.competencies,...local.competencies};
 for(const key of unique(Object.keys(remote.competencies||{}),Object.keys(local.competencies||{})))competencies[key]=records(remote.competencies?.[key],local.competencies?.[key]);
 return {...secondary,...primary,journey,gamification,competencies,
  answers:mergedAnswers.answers,answerConflicts:mergedAnswers.conflicts,
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
  let candidate=merged,saved=false,expectedVersion=data?.updated_at||null;
  for(let attempt=0;attempt<5;attempt++){
   const expected=expectedVersion;
   const result=await sb.rpc("save_student_state_cas",{p_state:candidate,p_expected_updated_at:expected});
   if(result.error)throw result.error;
   const row=Array.isArray(result.data)?result.data[0]:result.data;
   if(row?.saved){saved=true;break}
   if(!row?.cloud_state)throw new Error("Resposta de sincronização inválida.");
   candidate=mergeStudentStates(row.cloud_state,candidate);
   expectedVersion=row.cloud_updated_at;
   const retry=await sb.rpc("save_student_state_cas",{p_state:candidate,p_expected_updated_at:row.cloud_updated_at});
   if(retry.error)throw retry.error;
   const retried=Array.isArray(retry.data)?retry.data[0]:retry.data;
   if(retried?.saved){saved=true;break}
   if(!retried?.cloud_state)throw new Error("Resposta de sincronização inválida.");
   candidate=mergeStudentStates(retried.cloud_state,candidate);
   expectedVersion=retried.cloud_updated_at;
  }
  if(!saved)throw new Error("Conflito de sincronização persistente; progresso local preservado.");
  // Preserve edits made while the asynchronous sync was running.
  cacheCloudState(mergeStudentStates(candidate,getState(session.user.id)),session.user.id);
  window.dispatchEvent(new CustomEvent("uc7:cloud-synced"));return {synced:true};
 })().finally(()=>{inflight=null});
 return inflight;
}
