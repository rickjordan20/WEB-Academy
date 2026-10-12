import { JOURNEY } from "../data/journey.js";
import { MISSIONS, getMission, getPhaseMissions } from "../data/missions.js";
import { getState, saveState } from "./storage.js";

export const STATUS = {LOCKED:"locked",AVAILABLE:"available",IN_PROGRESS:"in-progress",COMPLETED:"completed"};

export function ensureJourneyState(){
  const state=getState();
  if(!state) return null;
  state.journey ||= {};
  state.journey.currentPhase ||= 1;
  state.journey.completedMissions ||= [];
  state.journey.unlockedMissions ||= ["1A"];
  state.journey.missionProgress ||= {};
  if(!state.journey.unlockedMissions.includes("1A")) state.journey.unlockedMissions.push("1A");
  saveState(state);
  return state;
}
export function missionStatus(id,state=ensureJourneyState()){
  if(state.journey.completedMissions.includes(id)) return STATUS.COMPLETED;
  if(state.journey.missionProgress[id]?.startedAt) return STATUS.IN_PROGRESS;
  if(state.journey.unlockedMissions.includes(id)) return STATUS.AVAILABLE;
  return STATUS.LOCKED;
}
export function phaseStatus(phase,state=ensureJourneyState()){
  const ids=[`${phase}A`,`${phase}B`];
  if(ids.every(id=>state.journey.completedMissions.includes(id))) return STATUS.COMPLETED;
  if(ids.some(id=>missionStatus(id,state)!==STATUS.LOCKED)) return phase===state.journey.currentPhase?STATUS.IN_PROGRESS:STATUS.AVAILABLE;
  return STATUS.LOCKED;
}
export function startMission(id){
  const state=ensureJourneyState(), mission=getMission(id);
  if(!mission || missionStatus(id,state)===STATUS.LOCKED) return false;
  state.journey.missionProgress[id] ||= {currentStep:0,completedSteps:[],startedAt:new Date().toISOString()};
  saveState(state); return true;
}
export function completeStep(missionId,stepId){
  const state=ensureJourneyState(), mission=getMission(missionId);
  if(!mission) return false;
  state.journey.missionProgress[missionId] ||= {currentStep:0,completedSteps:[],startedAt:new Date().toISOString()};
  const p=state.journey.missionProgress[missionId];
  if(!p.completedSteps.includes(stepId)) p.completedSteps.push(stepId);
  p.currentStep=Math.min(p.completedSteps.length,mission.steps.length-1);
  if(p.completedSteps.length===mission.steps.length) completeMission(missionId,state);
  else saveState(state);
  return true;
}
export function completeMission(id,state=ensureJourneyState()){
  if(!state.journey.completedMissions.includes(id)) state.journey.completedMissions.push(id);
  const m=getMission(id); if(!m){saveState(state);return;}
  if(id.endsWith("A")){
    const b=`${m.phase}B`; if(!state.journey.unlockedMissions.includes(b)) state.journey.unlockedMissions.push(b);
  } else {
    const next=m.phase+1;
    if(next<=JOURNEY.length){const a=`${next}A`;if(!state.journey.unlockedMissions.includes(a)) state.journey.unlockedMissions.push(a);state.journey.currentPhase=Math.max(state.journey.currentPhase,next);}
  }
  state.journey.progress=Math.round((state.journey.completedMissions.length/(JOURNEY.length*2))*100);
  saveState(state);
}
export function getJourneyView(){
  const state=ensureJourneyState();
  return JOURNEY.map(p=>({...p,status:phaseStatus(p.phase,state),missions:getPhaseMissions(p.phase).map(m=>({...m,status:missionStatus(m.id,state)}))}));
}
export { JOURNEY, MISSIONS, getMission };