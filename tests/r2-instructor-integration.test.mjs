import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../js/instructor-mission-reviews.js',import.meta.url),'utf8');
const first=source.indexOf('function missionOf('),last=source.indexOf('function effectiveDefinition(',first);
assert.ok(first>=0&&last>first,'missionOf precisa estar disponível');
const context=vm.createContext({getMission:id=>id==='R2'?{id:'R2',title:'Revisão HTML',steps:[],competencies:[],maxXp:150}:null,EXTRA_MISSIONS:[],overrides:new Map()});
vm.runInContext(source.slice(first,last),context);
const missionOf=vm.runInContext('missionOf',context);

test('R2: ficha do instrutor lê os indicadores de cada bloco publicado',()=>{
 const steps=[{id:'r2-01',type:'content',indicators:['I2'],xp:0},{id:'r2-02',type:'quiz',indicators:['I2'],xp:20},{id:'r2-17',type:'editor',indicators:['I2'],xp:45}];
 context.overrides.set('turma:R2',{status:'closed',steps});
 const mission=missionOf('R2','turma');
 assert.equal(mission.steps.length,3);
 assert.deepEqual(Array.from(mission.competencies),['I2']);
 assert.equal(mission.maxXp,65);
 assert.equal(mission.steps[2].indicators[0],'I2');
});

test('R2: plano de XP da avaliação usa os pesos originais sem redistribuir',()=>{
 const start=source.indexOf('function suggestedXpPlan('),end=source.indexOf('function safeAiFeedback(',start);
 assert.ok(start>=0&&end>start);
 const ctx=vm.createContext({responseForStep:(answers,unit,step)=>({value:answers[unit+':'+step.id],extras:[]}),objectiveResult:()=>null});
 vm.runInContext(source.slice(start,end),ctx);
 const plan=vm.runInContext('suggestedXpPlan',ctx);
 const mission={id:'R2',steps:[{id:'r2-01',type:'content',xp:0},{id:'r2-02',type:'quiz',xp:20},{id:'r2-17',type:'editor',xp:45}]};
 const result=plan(mission,null,65,{answers:{'R2:r2-02':1,'R2:r2-17':'<main>OK</main>'}});
 assert.equal(result.max,65);
 assert.equal(result.total,65);
 assert.deepEqual(Array.from(result.items.map(item=>item.cap)),[0,20,45]);
 assert.deepEqual(Array.from(result.items.map(item=>item.suggested)),[0,20,45]);
});
