import test from "node:test";
import assert from "node:assert/strict";
import {mergeStudentStates} from "../js/cloud-sync.js";
const state=(answers,xpHistory=[],xp=0)=>({meta:{updatedAt:"2026-10-20T10:00:00Z"},answers,evidence:[],journey:{},gamification:{xp,xpHistory,rewarded:[]}});
test("preserves both divergent answers in recoverable conflict log",()=>{
 const merged=mergeStudentStates(state({"1A:step":"remote"}),state({"1A:step":"local"}));
 assert.equal(merged.answers["1A:step"],"local");
 assert.equal(merged.answerConflicts[0].value,"remote");
});
test("merges different answers and evidence without deletion",()=>{
 const a=state({a:"A"}),b=state({b:"B"});
 a.evidence=[{id:"a",value:"A"}];b.evidence=[{id:"b",value:"B"}];
 const merged=mergeStudentStates(a,b);
 assert.deepEqual(merged.answers,{a:"A",b:"B"});
 assert.equal(merged.evidence.length,2);
});
test("deduplicates keyed XP events across devices",()=>{
 const e={key:"mission:1A",amount:150};
 const merged=mergeStudentStates(state({},[e],150),state({},[e,{key:"mission:1B",amount:150}],150));
 assert.equal(merged.gamification.xpHistory.length,2);
 assert.equal(merged.gamification.xp,300);
 assert.deepEqual(merged.gamification.rewarded.sort(),["mission:1A","mission:1B"]);
});
