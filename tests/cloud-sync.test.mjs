// Execute com: node --test tests/cloud-sync.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeStudentStates} from '../js/cloud-state-merge.js';

const state=(updatedAt,overrides={})=>({
 meta:{updatedAt},
 journey:{currentPhase:1,progress:0,completedMissions:[],unlockedMissions:['1A'],completedFundamentals:[],unlockedFundamentals:['F1'],missionProgress:{},fundamentalProgress:{}},
 gamification:{xp:0,rewarded:[],achievements:[],xpHistory:[]},
 competencies:{I1:[]},answers:{},evidence:[],extraMissions:{completed:[]},...overrides
});

test('Mantém o estado quando só existe um dispositivo',()=>{
 const local=state('2026-10-15T12:00:00Z');
 assert.equal(mergeStudentStates(null,local),local);
 assert.equal(mergeStudentStates(local,null),local);
});

test('Une etapas, missões e fundamentos sem descartar conquistas',()=>{
 const remote=state('2026-10-15T10:00:00Z',{
  journey:{currentPhase:1,progress:20,completedMissions:['1A'],unlockedMissions:['1A','1B'],completedFundamentals:['F1'],unlockedFundamentals:['F1'],missionProgress:{'1A':{completedSteps:['a']}},fundamentalProgress:{}}
 });
 const local=state('2026-10-15T11:00:00Z',{
  journey:{currentPhase:2,progress:30,completedMissions:['1B'],unlockedMissions:['1B','2A'],completedFundamentals:['F2'],unlockedFundamentals:['F2'],missionProgress:{'1A':{completedSteps:['b']}},fundamentalProgress:{}}
 });
 const merged=mergeStudentStates(remote,local);
 assert.deepEqual(new Set(merged.journey.completedMissions),new Set(['1A','1B']));
 assert.deepEqual(new Set(merged.journey.missionProgress['1A'].completedSteps),new Set(['a','b']));
 assert.deepEqual(new Set(merged.journey.completedFundamentals),new Set(['F1','F2']));
 assert.equal(merged.journey.currentPhase,2);
 assert.equal(merged.journey.progress,30);
});

test('Preserva XP máximo e evita recompensas repetidas na união',()=>{
 const remote=state('2026-10-15T10:00:00Z',{gamification:{xp:150,rewarded:['mission:1A'],achievements:[],xpHistory:[]}});
 const local=state('2026-10-15T11:00:00Z',{gamification:{xp:150,rewarded:['mission:1A','mission:1B'],achievements:[],xpHistory:[]}});
 const merged=mergeStudentStates(remote,local);
 assert.equal(merged.gamification.xp,150);
 assert.deepEqual(merged.gamification.rewarded,['mission:1A','mission:1B']);
});

test('Prioriza resposta mais recente e preserva respostas exclusivas',()=>{
 const remote=state('2026-10-15T10:00:00Z',{answers:{'1A:quiz':0,'1A:old':'antiga'}});
 const local=state('2026-10-15T11:00:00Z',{answers:{'1A:quiz':1,'1A:new':'nova'}});
 const merged=mergeStudentStates(remote,local);
 assert.equal(merged.answers['1A:quiz'],1);
 assert.equal(merged.answers['1A:old'],'antiga');
 assert.equal(merged.answers['1A:new'],'nova');
});
