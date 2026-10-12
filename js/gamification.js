import { getState,saveState } from "./storage.js";
export const LEVELS=[
{level:1,name:"Novato Web",min:0},{level:2,name:"Explorador HTML",min:250},{level:3,name:"Construtor de Interfaces",min:600},{level:4,name:"Estilista Web",min:1000},{level:5,name:"Programador JavaScript",min:1500},{level:6,name:"Manipulador do DOM",min:2100},{level:7,name:"Integrador Web",min:2800},{level:8,name:"Desenvolvedor Full Stack",min:3600},{level:9,name:"Web Developer",min:4500}];
export const ACHIEVEMENTS=[
{id:"first-mission",icon:"🚀",name:"Primeira Missão",description:"Concluiu sua primeira missão da Jornada."},
{id:"first-phase",icon:"🗺️",name:"Fase Conquistada",description:"Concluiu as missões A e B de uma fase."},
{id:"first-commit",icon:"🌿",name:"Primeiro Commit",description:"Concluiu a preparação de versionamento da Fase 01."},
{id:"guild-start",icon:"⚔️",name:"Guilda em Ação",description:"Concluiu sua primeira Missão da Guilda."}
];
export function ensureGamification(s=getState()){if(!s)return null;s.gamification||={};s.gamification.xp??=0;s.gamification.level??=1;s.gamification.levelName||="Novato Web";s.gamification.achievements||=[];s.gamification.xpHistory||=[];s.gamification.rewarded||=[];return s}
export function levelForXp(xp){return [...LEVELS].reverse().find(l=>xp>=l.min)||LEVELS[0]}
export function awardXp(amount,reason,key,s=getState()){s=ensureGamification(s);if(!s||s.gamification.rewarded.includes(key))return {awarded:0,state:s};s.gamification.xp+=amount;s.gamification.rewarded.push(key);s.gamification.xpHistory.push({amount,reason,key,at:new Date().toISOString()});const lvl=levelForXp(s.gamification.xp);s.gamification.level=lvl.level;s.gamification.levelName=lvl.name;saveState(s);return {awarded:amount,state:s}}
export function unlockAchievement(id,s=getState()){s=ensureGamification(s);const a=ACHIEVEMENTS.find(x=>x.id===id);if(!s||!a||s.gamification.achievements.includes(id))return false;s.gamification.achievements.push(id);saveState(s);return true}
export function rewardMission(mission,s=getState()){s=ensureGamification(s);if(!s)return {awarded:0,state:s};const base=mission.type==="guild"?150:150;const result=awardXp(base,`Missão ${mission.id} concluída`,`mission:${mission.id}`,s);unlockAchievement("first-mission",s);if(mission.id==="1A")unlockAchievement("first-commit",s);if(mission.type==="guild")unlockAchievement("guild-start",s);if(mission.id.endsWith("B"))unlockAchievement("first-phase",s);return result}
export function nextLevelInfo(s=ensureGamification()){const current=levelForXp(s.gamification.xp),next=LEVELS.find(l=>l.level===current.level+1);return {current,next,into:s.gamification.xp-current.min,span:next?next.min-current.min:1,pct:next?Math.min(100,Math.round((s.gamification.xp-current.min)/(next.min-current.min)*100)):100}}
export function achievementObjects(s=ensureGamification()){return (s.gamification.achievements||[]).map(id=>ACHIEVEMENTS.find(a=>a.id===id)).filter(Boolean)}