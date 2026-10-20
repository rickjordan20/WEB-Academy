import test from "node:test";
import assert from "node:assert/strict";
import {mergeStudentStates} from "../js/cloud-sync.js";
const mk=(answers,ts="2026-10-20T10:00:00Z")=>({meta:{updatedAt:ts},answers,journey:{},gamification:{xp:0,xpHistory:[],rewarded:[]},evidence:[]});
test("repeated merges do not duplicate conflict records",()=>{
 const a=mk({x:"A"}),b=mk({x:"B"});
 const first=mergeStudentStates(a,b),again=mergeStudentStates(a,first);
 assert.equal(again.answerConflicts.length,first.answerConflicts.length);
});
test("merges nested answer fields independently",()=>{
 const merged=mergeStudentStates(mk({x:{part1:"A"}}),mk({x:{part2:"B"}}));
 assert.deepEqual(merged.answers.x,{part1:"A",part2:"B"});
});
test("keeps different evidence versions sharing the same id",()=>{
 const a=mk({}),b=mk({});
 a.evidence=[{id:"ev1",text:"A"}];b.evidence=[{id:"ev1",text:"B"}];
 assert.equal(mergeStudentStates(a,b).evidence.length,2);
});
