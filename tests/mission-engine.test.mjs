// Run with: node --test tests/mission-engine.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

const memory=new Map();
globalThis.localStorage={
 getItem:key=>memory.get(key)??null,
 setItem:(key,value)=>memory.set(key,String(value)),
 removeItem:key=>memory.delete(key)
};
globalThis.window={dispatchEvent(){}};
globalThis.CustomEvent=class{constructor(type,init){this.type=type;this.detail=init?.detail}};

const {createInitialState,saveState,getState}=await import('../js/storage.js');
const engine=await import('../js/mission-engine.js');

function reset(){
 memory.clear();
 saveState(createInitialState({name:'Estudante de teste'}));
 engine.ensureJourneyState();
}
function completeFundamentals(){
 const f=engine.getFundamental(1);
 for(const step of f.steps) assert.equal(engine.completeFundamentalStep(1,step.id),true);
}
function completeFirstMission(){
 const m=engine.getMission('1A');
 for(const step of m.steps) assert.equal(engine.completeStep('1A',step.id),true);
}

test('Fundamentos bloqueiam salto e conclusão antecipada',()=>{
 reset();
 const f=engine.getFundamental(1);
 assert.ok(f.steps.length>1);
 assert.equal(engine.completeFundamentalStep(1,f.steps.at(-1).id),false);
 assert.equal(engine.completeFundamental(1),false);
 assert.equal(getState().journey.completedFundamentals.includes('F1'),false);
 completeFundamentals();
 assert.equal(getState().journey.completedFundamentals.includes('F1'),true);
});

test('Missão A exige Fundamentos e ordem das etapas',()=>{
 reset();
 const m=engine.getMission('1A');
 assert.ok(m.steps.length>1);
 assert.equal(engine.completeStep('1A',m.steps[0].id),false);
 assert.equal(engine.completeMission('1A'),false);
 completeFundamentals();
 assert.equal(engine.completeStep('1A',m.steps.at(-1).id),false);
 assert.equal(engine.completeMission('1A'),false);
 assert.equal(getState().gamification.xp,0);
 completeFirstMission();
 assert.equal(getState().journey.completedMissions.includes('1A'),true);
 assert.equal(getState().journey.unlockedMissions.includes('1B'),true);
});

test('Repetição não duplica XP ou conclusão',()=>{
 reset();
 completeFundamentals();
 completeFirstMission();
 const before=getState().gamification.xp;
 assert.equal(engine.completeMission('1A'),true);
 assert.equal(getState().gamification.xp,before);
 assert.equal(getState().journey.completedMissions.filter(id=>id==='1A').length,1);
});

test('Missão B não libera a próxima fase prematuramente',()=>{
 reset();
 completeFundamentals();
 completeFirstMission();
 assert.equal(engine.completeMission('1B'),false);
 assert.equal(getState().journey.unlockedMissions.includes('2A'),false);
 const m=engine.getMission('1B');
 for(const step of m.steps)assert.equal(engine.completeStep('1B',step.id),true);
 assert.equal(getState().journey.unlockedMissions.includes('2A'),true);
 assert.equal(getState().journey.unlockedFundamentals.includes('F2'),true);
});

test('Progresso persiste após nova leitura',()=>{
 reset();
 completeFundamentals();
 const step=engine.getMission('1A').steps[0];
 assert.equal(engine.completeStep('1A',step.id),true);
 assert.ok(getState().journey.missionProgress['1A'].completedSteps.includes(step.id));
});
