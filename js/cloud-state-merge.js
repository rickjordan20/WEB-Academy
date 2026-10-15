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
  for(const key of Object.keys(journey[field])){const a=remote.journey?.[field]?.[key]||{},b=local.journey?.[field]?.[key]||{};journey[field][key]={...a,...b,completedSteps:unique(a.completedSteps,b.completedSteps)}}
 }
 journey.currentPhase=Math.max(remote.journey?.currentPhase||1,local.journey?.currentPhase||1);
 journey.progress=Math.max(remote.journey?.progress||0,local.journey?.progress||0);
 const gamification={...secondary.gamification,...primary.gamification};
 gamification.rewarded=unique(remote.gamification?.rewarded,local.gamification?.rewarded);
 gamification.achievements=records(remote.gamification?.achievements,local.gamification?.achievements);
 gamification.xpHistory=records(remote.gamification?.xpHistory,local.gamification?.xpHistory);
 gamification.xp=Math.max(remote.gamification?.xp||0,local.gamification?.xp||0);
 const competencies={...remote.competencies,...local.competencies};
 for(const key of unique(Object.keys(remote.competencies||{}),Object.keys(local.competencies||{})))competencies[key]=records(remote.competencies?.[key],local.competencies?.[key]);
 return {...secondary,...primary,journey,gamification,competencies,
  answers:{...secondary.answers,...primary.answers},
  evidence:records(remote.evidence,local.evidence),
  extraMissions:{...secondary.extraMissions,...primary.extraMissions,completed:unique(remote.extraMissions?.completed,local.extraMissions?.completed)},
  meta:{...secondary.meta,...primary.meta,updatedAt:new Date().toISOString()}};
}
