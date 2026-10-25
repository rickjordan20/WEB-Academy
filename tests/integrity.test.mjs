import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SourceTextModule,SyntheticModule,createContext} from 'node:vm';

async function loadModule(file, mocks={}) {
  const context=createContext({Date,Map,Set,JSON,Math,Number,String,Boolean,Array,Object,RegExp,console});
  const code=await readFile(new URL(file,import.meta.url),'utf8');
  const mod=new SourceTextModule(code,{context,identifier:file});
  await mod.link(async spec=>{
    if(!(spec in mocks))throw Error('Dependência não simulada: '+spec);
    const exports=mocks[spec];
    return new SyntheticModule(Object.keys(exports),function(){for(const [k,v] of Object.entries(exports))this.setExport(k,v)},{context});
  });
  await mod.evaluate();
  return mod.namespace;
}
const fresh=()=>({meta:{updatedAt:'2026-10-20T10:00:00Z'},journey:{completedMissions:[],unlockedMissions:[],missionProgress:{},completedFundamentals:[],unlockedFundamentals:[],fundamentalProgress:{}},gamification:{xp:0,rewarded:[],xpHistory:[],achievements:[]},answers:{},evidence:[],competencies:{}});
test('etapas exigem sequência e conclusão integral',async()=>{
 const rules=await loadModule('../js/mission-progress-rules.js');
 const steps=[{id:'a'},{id:'b'},{id:'c'}];
 assert.equal(rules.canCompleteSequentialStep(steps,[],'b'),false);
 assert.equal(rules.canCompleteSequentialStep(steps,[],'a'),true);
 assert.equal(rules.canCompleteSequentialStep(steps,['a'],'b'),true);
 assert.equal(rules.allStepsCompleted(steps,['a','b']),false);
 assert.equal(rules.allStepsCompleted(steps,['a','b','c']),true);
});
test('sincronização preserva etapas, evidências e XP de ambos dispositivos',async()=>{
 const sync=await loadModule('../js/cloud-sync.js',{'./storage.js':{getState:()=>null,cacheCloudState:()=>{},setActiveUser:()=>{}},'./supabase-client.js':{getSupabase:async()=>null,getSession:async()=>null}});
 const a=fresh(),b=fresh();
 a.journey.missionProgress['1A']={completedSteps:['a'],startedAt:'2026-10-19T09:00:00Z',currentStep:1};
 b.meta.updatedAt='2026-10-21T10:00:00Z';
 b.journey.missionProgress['1A']={completedSteps:['b'],startedAt:'2026-10-20T09:00:00Z',currentStep:2};
 a.gamification.xp=100;b.gamification.xp=80;
 a.evidence=[{id:'e1'}];b.evidence=[{id:'e2'}];
 const merged=sync.mergeStudentStates(a,b);
 assert.deepEqual(Array.from(merged.journey.missionProgress['1A'].completedSteps),['a','b']);
 assert.equal(merged.journey.missionProgress['1A'].currentStep,2);
 assert.equal(merged.journey.missionProgress['1A'].startedAt,'2026-10-19T09:00:00Z');
 assert.equal(merged.gamification.xp,100);
 assert.equal(merged.evidence.length,2);
 assert.equal(merged.meta.updatedAt,b.meta.updatedAt);
});
test('leituras não salvam novamente uma jornada já inicializada',async()=>{
 let state=fresh(),saves=0;
 state.journey={...state.journey,currentPhase:1,unlockedMissions:['1A'],unlockedFundamentals:['F1']};
 const engine=await loadModule('../js/mission-engine.js',{
  '../data/journey.js':{JOURNEY:[]},
  '../data/missions.js':{MISSIONS:[],EXTRA_MISSIONS:[],getMission:()=>null,getPhaseMissions:()=>[]},
  '../data/fundamentals.js':{FUNDAMENTALS:[],getFundamental:()=>null},
  './storage.js':{getState:()=>structuredClone(state),saveState:s=>{saves++;state=structuredClone(s)}},
  './gamification.js':{rewardMission:()=>{}},
  './mission-progress-rules.js':{canCompleteSequentialStep:()=>true,allStepsCompleted:()=>true}
 });
 engine.ensureJourneyState();engine.ensureJourneyState();
 assert.equal(saves,0);
});
test('janela em cache não autoriza registrar progresso após o vencimento',async()=>{
 let now=Date.now();
 const engine=await loadModule('../js/mission-engine.js',{
  '../data/journey.js':{JOURNEY:[]},
  '../data/missions.js':{MISSIONS:[],EXTRA_MISSIONS:[{id:'1A'}],getMission:()=>null,getPhaseMissions:()=>[]},
  '../data/fundamentals.js':{FUNDAMENTALS:[],getFundamental:()=>null},
  './storage.js':{getState:()=>fresh(),saveState:()=>{}},
  './gamification.js':{rewardMission:()=>{}},
  './mission-progress-rules.js':{canCompleteSequentialStep:()=>true,allStepsCompleted:()=>true}
 });
 engine.setVerifiedMissionWindow('1A',{state:'open',opensAt:new Date(now-60000).toISOString(),closesAt:new Date(now+60000).toISOString()});
 assert.equal(engine.canRecordMissionProgress('1A'),true);
 engine.setVerifiedMissionWindow('1A',{state:'open',opensAt:new Date(now-120000).toISOString(),closesAt:new Date(now-1000).toISOString()});
 assert.equal(engine.canRecordMissionProgress('1A'),false);
 engine.setVerifiedMissionWindow('1A',{state:'closed'});
 assert.equal(engine.canRecordMissionProgress('1A'),false);
});
