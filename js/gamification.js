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
{id:"five-phases",icon:"🌟",name:"Mestre da Jornada",description:"Concluiu as missões A e B de cinco fases diferentes."},
{id:"phase-2-complete",icon:"🏗️",name:"Arquiteto HTML",description:"Concluiu as missões 2A e 2B: estrutura e elementos HTML."},
{id:"phase-3-complete",icon:"🧭",name:"Navegador Semântico",description:"Concluiu as missões 3A e 3B: HTML semântico e navegação."},
{id:"phase-4-complete",icon:"📝",name:"Mestre dos Formulários",description:"Concluiu as missões 4A e 4B: formulários HTML."},
{id:"phase-5-complete",icon:"🎨",name:"Artista CSS",description:"Concluiu as missões 5A e 5B: seletores, cores e tipografia."},
{id:"phase-6-complete",icon:"📱",name:"Designer Responsivo",description:"Concluiu as missões 6A e 6B: Flexbox, Grid e responsividade."},
{id:"phase-7-complete",icon:"⚡",name:"Primeiros Passos em JavaScript",description:"Concluiu as missões 7A e 7B: lógica e fundamentos de JavaScript."},
{id:"phase-8-complete",icon:"🖱️",name:"Domador do DOM",description:"Concluiu as missões 8A e 8B: DOM e eventos."},
{id:"phase-9-complete",icon:"🐞",name:"Caçador de Bugs",description:"Concluiu as missões 9A e 9B: validação e depuração."},
{id:"phase-10-complete",icon:"🌐",name:"Conector de APIs",description:"Concluiu as missões 10A e 10B: cliente-servidor e APIs."},
{id:"phase-11-complete",icon:"🗄️",name:"Guardião dos Dados",description:"Concluiu as missões 11A e 11B: integração com banco de dados."},
{id:"phase-12-complete",icon:"🔐",name:"Protetor de Acessos",description:"Concluiu as missões 12A e 12B: autenticação e autorização."},
{id:"phase-13-complete",icon:"🛠️",name:"Engenheiro CRUD",description:"Concluiu as missões 13A e 13B: CRUD e testes."},
{id:"phase-14-complete",icon:"🚀",name:"Desenvolvedor Web Completo",description:"Concluiu as missões 14A e 14B: integração e publicação."}
];
export function ensureGamification(s=getState()){if(!s)return null;s.gamification||={};s.gamification.xp??=0;s.gamification.level??=1;s.gamification.levelName||="Novato Web";s.gamification.achievements||=[];s.gamification.xpHistory||=[];s.gamification.rewarded||=[];return s}
export function levelForXp(xp){return [...LEVELS].reverse().find(l=>xp>=l.min)||LEVELS[0]}
export function awardXp(amount,reason,key,s=getState()){s=ensureGamification(s);if(!s||s.gamification.rewarded.includes(key))return {awarded:0,state:s};s.gamification.xp+=amount;s.gamification.rewarded.push(key);s.gamification.xpHistory.push({amount,reason,key,at:new Date().toISOString()});const lvl=levelForXp(s.gamification.xp);s.gamification.level=lvl.level;s.gamification.levelName=lvl.name;saveState(s);return {awarded:amount,state:s}}
export function unlockAchievement(id,s=getState()){s=ensureGamification(s);const a=effectiveAchievements().find(x=>x.id===id&&x.active);if(!s||!a||s.gamification.achievements.includes(id))return false;s.gamification.achievements.push(id);saveState(s);return true}
export function defaultAchievementRule(id){
 if(id==="first-mission")return {type:"mission_count",count:1};
 if(id==="first-commit")return {type:"mission_complete",mission_id:"1A"};
 if(id==="first-phase")return {type:"phase_count",count:1};
 if(id==="guild-start")return {type:"guild_completion"};
 const counts={"three-missions":3,"five-missions":5,"ten-missions":10,"three-phases":3,"five-phases":5};
 if(id in counts)return {type:id.endsWith("phases")?"phase_count":"mission_count",count:counts[id]};
 const phase=/^phase-(\\d+)-complete$/.exec(id);
 return phase?{type:"phase_complete",phase:Number(phase[1])}:null;
}
let configuredRules=new Map(),configuredClass=null;
export function applyAchievementRules(classId,rows=[]){
 configuredClass=classId||null;
 configuredRules=new Map((rows||[]).filter(r=>ACHIEVEMENTS.some(a=>a.id===r.achievement_id)).map(r=>[r.achievement_id,r]));
}
export function effectiveAchievement(a){
 const row=configuredRules.get(a.id);
 return {...a,...(row?{name:row.name,description:row.description,icon:row.icon,active:row.active,rule:row.rule}:{active:true,rule:defaultAchievementRule(a.id)})};
}
export function effectiveAchievements(){return ACHIEVEMENTS.map(effectiveAchievement)}
export async function loadAchievementRules(sb,classId){
 if(!sb||!classId){applyAchievementRules(null);return}
 const {data,error}=await sb.from("achievement_rule_overrides").select("achievement_id,name,description,icon,active,rule").eq("class_id",classId);
 if(error)throw error;
 applyAchievementRules(classId,data||[]);
}
function matchesAchievementRule(rule,completed,guildCompleted){
 if(!rule)return false;
 const pairs=new Set();
 for(const id of completed){const m=/^(\\d+)A$/.exec(id);if(m&&completed.has(m[1]+"B"))pairs.add(Number(m[1]))}
 switch(rule.type){
 case "mission_count":return completed.size>=Number(rule.count);
 case "phase_count":return pairs.size>=Number(rule.count);
 case "mission_complete":return completed.has(String(rule.mission_id));
 case "phase_complete":return pairs.has(Number(rule.phase));
 case "guild_completion":return guildCompleted;
 default:return false;
 }
}
export function earnedAchievementIds(s){
 const completed=new Set(Array.isArray(s?.journey?.completedMissions)?s.journey.completedMissions:[]);
 const guildCompleted=Boolean(s?.gamification?.guildCompleted||s?.gamification?.achievements?.includes("guild-start"));
 return new Set(effectiveAchievements().filter(a=>a.active&&matchesAchievementRule(a.rule,completed,guildCompleted)).map(a=>a.id));
}
export function reconcileAchievements(s=getState()){
 s=ensureGamification(s);
 if(!s)return false;
 const earned=earnedAchievementIds(s);
 const current=new Set(s.gamification.achievements);
 let changed=false;
 for(const id of earned){if(!current.has(id)){current.add(id);changed=true}}
 // Historical awards are retained when an instructor changes a rule.
 if(changed){s.gamification.achievements=[...current];saveState(s)}
 return changed;
}
export function rewardMission(mission,s=getState()){
 s=ensureGamification(s);
 if(!s)return {awarded:0,state:s};
 const base=mission.id==="R2"?0:150;
 const result=base>0?awardXp(base,`Missão ${mission.id} concluída`,`mission:${mission.id}`,s):{awarded:0,state:s};
 if(mission.type==="guild"&&!s.gamification.guildCompleted){s.gamification.guildCompleted=true;saveState(s)}
 reconcileAchievements(s);
 return result;
}
export function nextLevelInfo(s=ensureGamification()){const current=levelForXp(s.gamification.xp),next=LEVELS.find(l=>l.level===current.level+1);return {current,next,into:s.gamification.xp-current.min,span:next?next.min-current.min:1,pct:next?Math.min(100,Math.round((s.gamification.xp-current.min)/(next.min-current.min)*100)):100}}
export function achievementObjects(s=ensureGamification()){return (s.gamification.achievements||[]).map(id=>effectiveAchievements().find(a=>a.id===id)).filter(Boolean)}