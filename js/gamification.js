import { getState,saveState } from "./storage.js";
export const LEVELS=[
{level:1,name:"Novato Web",min:0},{level:2,name:"Explorador HTML",min:250},{level:3,name:"Construtor de Interfaces",min:600},{level:4,name:"Estilista Web",min:1000},{level:5,name:"Programador JavaScript",min:1500},{level:6,name:"Manipulador do DOM",min:2100},{level:7,name:"Integrador Web",min:2800},{level:8,name:"Desenvolvedor Full Stack",min:3600},{level:9,name:"Web Developer",min:4500}];
export const ACHIEVEMENTS=[
{id:"first-mission",icon:"🚀",name:"Primeira Missão",description:"Concluiu sua primeira missão da Jornada."},
{id:"first-phase",icon:"🗺️",name:"Fase Conquistada",description:"Concluiu as missões A e B de uma fase."},
{id:"first-commit",icon:"🌿",name:"Primeiro Commit",description:"Concluiu a preparação de versionamento da Fase 01."},
{id:"guild-start",icon:"⚔️",name:"Guilda em Ação",description:"Concluiu sua primeira Missão da Guilda."},
{id:"three-missions",icon:"🧩",name:"Três Desafios",description:"Concluiu três missões diferentes da Jornada."},
{id:"five-missions",icon:"🔥",name:"Ritmo de Desenvolvimento",description:"Concluiu cinco missões diferentes da Jornada."},
{id:"ten-missions",icon:"🏆",name:"Maratonista Web",description:"Concluiu dez missões diferentes da Jornada."},
{id:"three-phases",icon:"🗺️",name:"Explorador de Fases",description:"Concluiu as missões A e B de três fases diferentes."},
{id:"five-phases",icon:"🌟",name:"Mestre da Jornada",description:"Concluiu as missões A e B de cinco fases diferentes."}
];
export function ensureGamification(s=getState()){if(!s)return null;s.gamification||={};s.gamification.xp??=0;s.gamification.level??=1;s.gamification.levelName||="Novato Web";s.gamification.achievements||=[];s.gamification.xpHistory||=[];s.gamification.rewarded||=[];return s}
export function levelForXp(xp){return [...LEVELS].reverse().find(l=>xp>=l.min)||LEVELS[0]}
export function awardXp(amount,reason,key,s=getState()){s=ensureGamification(s);if(!s||s.gamification.rewarded.includes(key))return {awarded:0,state:s};s.gamification.xp+=amount;s.gamification.rewarded.push(key);s.gamification.xpHistory.push({amount,reason,key,at:new Date().toISOString()});const lvl=levelForXp(s.gamification.xp);s.gamification.level=lvl.level;s.gamification.levelName=lvl.name;saveState(s);return {awarded:amount,state:s}}
export function unlockAchievement(id,s=getState()){s=ensureGamification(s);const a=ACHIEVEMENTS.find(x=>x.id===id);if(!s||!a||s.gamification.achievements.includes(id))return false;s.gamification.achievements.push(id);saveState(s);return true}
export function earnedAchievementIds(s){
 const completed=new Set(Array.isArray(s?.journey?.completedMissions)?s.journey.completedMissions:[]);
 const earned=new Set();
 if(completed.size)earned.add("first-mission");
 if(completed.has("1A"))earned.add("first-commit");
 const phases=new Set();
 for(const id of completed){
  const match=/^(\\d+)A$/.exec(id);
  if(match&&completed.has(match[1]+"B"))phases.add(match[1]);
 }
 if(phases.size){earned.add("first-phase")}
 if(phases.size>=3)earned.add("three-phases");
 if(phases.size>=5)earned.add("five-phases");
 if(completed.size>=3)earned.add("three-missions");
 if(completed.size>=5)earned.add("five-missions");
 if(completed.size>=10)earned.add("ten-missions");
 // Guild achievements are granted by the existing mission completion event.
 return earned;
}
export function reconcileAchievements(s=getState()){
 s=ensureGamification(s);
 if(!s)return false;
 const earned=earnedAchievementIds(s);
 const current=new Set(s.gamification.achievements);
 let changed=false;
 for(const id of earned){if(!current.has(id)){current.add(id);changed=true}}
 if(changed){s.gamification.achievements=[...current];saveState(s)}
 return changed;
}
export function rewardMission(mission,s=getState()){
 s=ensureGamification(s);
 if(!s)return {awarded:0,state:s};
 const base=mission.id==="R2"?0:150;
 const result=base>0?awardXp(base,`Missão ${mission.id} concluída`,`mission:${mission.id}`,s):{awarded:0,state:s};
 if(mission.type==="guild")unlockAchievement("guild-start",s);
 reconcileAchievements(s);
 return result;
}
export function nextLevelInfo(s=ensureGamification()){const current=levelForXp(s.gamification.xp),next=LEVELS.find(l=>l.level===current.level+1);return {current,next,into:s.gamification.xp-current.min,span:next?next.min-current.min:1,pct:next?Math.min(100,Math.round((s.gamification.xp-current.min)/(next.min-current.min)*100)):100}}
export function achievementObjects(s=ensureGamification()){return (s.gamification.achievements||[]).map(id=>ACHIEVEMENTS.find(a=>a.id===id)).filter(Boolean)}