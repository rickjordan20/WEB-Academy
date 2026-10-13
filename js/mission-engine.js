import { JOURNEY } from "../data/journey.js";
import { MISSIONS,getMission,getPhaseMissions } from "../data/missions.js";
import { getState,saveState } from "./storage.js";
import { rewardMission } from "./gamification.js";
export const STATUS={LOCKED:"locked",AVAILABLE:"available",IN_PROGRESS:"in-progress",COMPLETED:"completed"};
export function ensureJourneyState(){const s=getState();if(!s)return null;s.journey||={};s.journey.currentPhase||=1;s.journey.completedMissions||=[];s.journey.unlockedMissions||=["1A"];s.journey.missionProgress||={};s.answers||={};s.evidence||=[];if(!s.journey.unlockedMissions.includes("1A"))s.journey.unlockedMissions.push("1A");saveState(s);return s}
export function missionStatus(id,s=ensureJourneyState()){if(s.journey.completedMissions.includes(id))return STATUS.COMPLETED;if(s.journey.missionProgress[id]?.startedAt)return STATUS.IN_PROGRESS;if(s.journey.unlockedMissions.includes(id))return STATUS.AVAILABLE;return STATUS.LOCKED}
export function phaseStatus(phase,s=ensureJourneyState()){const ids=[`${phase}A`,`${phase}B`];if(ids.every(id=>s.journey.completedMissions.includes(id)))return STATUS.COMPLETED;if(ids.some(id=>missionStatus(id,s)!==STATUS.LOCKED))return phase===s.journey.currentPhase?STATUS.IN_PROGRESS:STATUS.AVAILABLE;return STATUS.LOCKED}
export function startMission(id){const s=ensureJourneyState(),m=getMission(id);if(!m||missionStatus(id,s)===STATUS.LOCKED)return false;s.journey.missionProgress[id]||={currentStep:0,completedSteps:[],startedAt:new Date().toISOString()};saveState(s);return true}
export function saveAnswer(missionId,stepId,value){const s=ensureJourneyState();s.answers[`${missionId}:${stepId}`]=value;saveState(s)}
export function getAnswer(missionId,stepId){return ensureJourneyState().answers?.[`${missionId}:${stepId}`]}
export function completeStep(missionId,stepId){const s=ensureJourneyState(),m=getMission(missionId);if(!m)return false;s.journey.missionProgress[missionId]||={currentStep:0,completedSteps:[],startedAt:new Date().toISOString()};const p=s.journey.missionProgress[missionId];if(!p.completedSteps.includes(stepId))p.completedSteps.push(stepId);p.currentStep=Math.min(p.completedSteps.length,m.steps.length-1);if(p.completedSteps.length===m.steps.length)completeMission(missionId,s);else saveState(s);return true}
function evidenceValue(v){return Array.isArray(v)?v.map(x=>String(x||"").trim()).filter(Boolean):[]}
function registerMissionEvidence(s,m){
 if(!m?.competencies?.length)return;
 s.competencies||={I1:[],I2:[],I3:[],I4:[],I5:[],I6:[]};
 const evidenceSteps=m.steps.filter(step=>step.type==="evidence");
 const evidencePayload=evidenceSteps.flatMap(step=>evidenceValue(s.answers?.[`${m.id}:${step.id}`]));
 if(!evidencePayload.length)return;
 m.competencies.forEach(indicator=>{
  s.competencies[indicator]||=[];
  const key=`mission-${m.id}-${indicator}`;
  const item={id:key,type:"mission-evidence",source:m.id,missionId:m.id,project:m.project,phase:m.phase,title:`${m.id} — ${m.title}`,summary:evidencePayload.join(" • "),createdAt:new Date().toISOString()};
  const existing=s.competencies[indicator].findIndex(e=>e.id===key);
  if(existing>=0)item.createdAt=s.competencies[indicator][existing].createdAt||item.createdAt,s.competencies[indicator][existing]={...s.competencies[indicator][existing],...item,updatedAt:new Date().toISOString()};
  else s.competencies[indicator].push(item);
 });
}

export function completeMission(id,s=ensureJourneyState()){const already=s.journey.completedMissions.includes(id);if(!already)s.journey.completedMissions.push(id);const m=getMission(id);if(!m){saveState(s);return}if(!already)rewardMission(m,s);registerMissionEvidence(s,m);if(id.endsWith("A")){const b=`${m.phase}B`;if(!s.journey.unlockedMissions.includes(b))s.journey.unlockedMissions.push(b)}else{const next=m.phase+1;if(next<=JOURNEY.length){const a=`${next}A`;if(!s.journey.unlockedMissions.includes(a))s.journey.unlockedMissions.push(a);s.journey.currentPhase=Math.max(s.journey.currentPhase,next)}}s.journey.progress=Math.round((s.journey.completedMissions.length/(JOURNEY.length*2))*100);saveState(s)}
export function getJourneyView(){const s=ensureJourneyState();return JOURNEY.map(p=>({...p,status:phaseStatus(p.phase,s),missions:getPhaseMissions(p.phase).map(m=>({...m,status:missionStatus(m.id,s)}))}))}
export {JOURNEY,MISSIONS,getMission};