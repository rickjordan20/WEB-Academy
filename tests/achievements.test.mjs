import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
const source=await readFile(new URL("../js/gamification.js",import.meta.url),"utf8");
let saved=0;
const code=source.replace('import { getState,saveState } from "./storage.js";','const getState=()=>null; const saveState=()=>{globalThis.__badgeSaved=(globalThis.__badgeSaved||0)+1};');
const {earnedAchievementIds,reconcileAchievements,ACHIEVEMENTS,defaultAchievementRule,applyAchievementRules,effectiveAchievements}=await import("data:text/javascript;base64,"+Buffer.from(code).toString("base64"));
const state=ids=>({journey:{completedMissions:ids},gamification:{xp:100,level:1,achievements:[],rewarded:[],xpHistory:[]}});
test("all badge ids unique",()=>assert.equal(new Set(ACHIEVEMENTS.map(a=>a.id)).size,ACHIEVEMENTS.length));
test("first-phase requires both A and B",()=>{assert.equal(earnedAchievementIds(state(["1B"])).has("first-phase"),false);assert.equal(earnedAchievementIds(state(["1A","1B"])).has("first-phase"),true)});
test("multi-phase badges require completed pairs",()=>{const ids=["1A","1B","2A","2B","3A","3B"];assert.equal(earnedAchievementIds(state(ids)).has("three-phases"),true);assert.equal(earnedAchievementIds(state(["1A","2A","3A"])).has("three-phases"),false)});
test("mission milestones are distinct and no XP added",()=>{const s=state(["1A","1B","2A"]);const xp=s.gamification.xp;assert.equal(reconcileAchievements(s),true);assert.ok(s.gamification.achievements.includes("three-missions"));assert.equal(s.gamification.xp,xp);assert.equal(reconcileAchievements(s),false)});
test("ten missions unlocks maratonista",()=>{const ids=Array.from({length:5},(_,i)=>[String(i+1)+"A",String(i+1)+"B"]).flat();assert.ok(earnedAchievementIds(state(ids)).has("ten-missions"));assert.ok(earnedAchievementIds(state(ids)).has("five-phases"))});

test("HTML, CSS e JavaScript desbloqueiam apenas com A e B da fase",()=>{
 for(const n of [2,3,4,5,6,7,8,9,10,11,12,13,14]){
  const id="phase-"+n+"-complete";
  assert.equal(earnedAchievementIds(state([n+"A"])).has(id),false);
  assert.equal(earnedAchievementIds(state([n+"B"])).has(id),false);
  assert.equal(earnedAchievementIds(state([n+"A",n+"B"])).has(id),true);
 }
});
test("fases não se misturam para conceder conquista técnica",()=>{
 assert.equal(earnedAchievementIds(state(["2A","3B","5A","7B"])).has("phase-2-complete"),false);
 assert.equal(earnedAchievementIds(state(["2A","3B","5A","7B"])).has("phase-5-complete"),false);
});

test("regras padrão representam os 22 distintivos existentes",()=>{
 assert.equal(ACHIEVEMENTS.length,22);
 for(const a of ACHIEVEMENTS)assert.ok(defaultAchievementRule(a.id),a.id);
 assert.deepEqual(defaultAchievementRule("phase-5-complete"),{type:"phase_complete",phase:5});
});
test("instrutor pode mudar critério de CSS sem afetar o padrão das outras conquistas",()=>{
 applyAchievementRules("turma-teste",[{achievement_id:"phase-5-complete",name:"CSS Avançado",description:"Concluir a missão 6A",icon:"🎨",active:true,rule:{type:"mission_complete",mission_id:"6A"}}]);
 assert.equal(earnedAchievementIds(state(["5A","5B"])).has("phase-5-complete"),false);
 assert.equal(earnedAchievementIds(state(["6A"])).has("phase-5-complete"),true);
 assert.equal(effectiveAchievements().find(a=>a.id==="phase-5-complete").name,"CSS Avançado");
 applyAchievementRules(null);
 assert.equal(earnedAchievementIds(state(["5A","5B"])).has("phase-5-complete"),true);
});
test("desativar conquista impede novos desbloqueios, sem retirar históricos",()=>{
 const s=state(["2A","2B"]);s.gamification.achievements=["phase-2-complete"];
 applyAchievementRules("turma-teste",[{achievement_id:"phase-2-complete",name:"HTML",description:"HTML básico",icon:"🏗️",active:false,rule:{type:"phase_complete",phase:2}}]);
 assert.equal(earnedAchievementIds(s).has("phase-2-complete"),false);
 reconcileAchievements(s);
 assert.ok(s.gamification.achievements.includes("phase-2-complete"));
 applyAchievementRules(null);
});
test("conquista de guilda exige evidência registrada",()=>{
 applyAchievementRules(null);
 assert.equal(earnedAchievementIds(state([])).has("guild-start"),false);
 const s=state([]);s.gamification.guildCompleted=true;
 assert.equal(earnedAchievementIds(s).has("guild-start"),true);
});
