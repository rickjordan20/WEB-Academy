import test from "node:test";
import assert from "node:assert/strict";
import {mergeStudentStates} from "../js/cloud-sync.js";
const mk=()=>({meta:{updatedAt:"2026-10-20T10:00:00Z"},answers:{},journey:{},gamification:{xp:0,xpHistory:[],rewarded:[]},evidence:[]});
test("independent nested changes survive in either merge order",()=>{const a=mk(),b=mk();a.answers={x:{one:1}};b.answers={x:{two:2}};for(const m of [mergeStudentStates(a,b),mergeStudentStates(b,a)])assert.deepEqual(m.answers.x,{one:1,two:2})});
test("identical XP key is idempotent",()=>{const a=mk(),b=mk();for(const s of [a,b])s.gamification={xp:150,xpHistory:[{key:"mission:1A",amount:150}],rewarded:["mission:1A"]};const m=mergeStudentStates(a,b);assert.equal(m.gamification.xp,150);assert.equal(m.gamification.xpHistory.length,1)});
test("different XP values for same key are audited",()=>{const a=mk(),b=mk();a.gamification={xp:150,xpHistory:[{key:"mission:1A",amount:150}],rewarded:["mission:1A"]};b.gamification={xp:250,xpHistory:[{key:"mission:1A",amount:250}],rewarded:["mission:1A"]};assert.ok(mergeStudentStates(a,b).gamification.xpConflicts.length>0)});
test("divergent evidence merge is idempotent",()=>{const a=mk(),b=mk();a.evidence=[{id:"e",v:1}];b.evidence=[{id:"e",v:2}];const first=mergeStudentStates(a,b);assert.deepEqual(mergeStudentStates(first,b).evidence,first.evidence)});
