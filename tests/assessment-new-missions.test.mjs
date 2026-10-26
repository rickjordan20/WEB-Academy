import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../js/instructor-mission-reviews.js',import.meta.url),'utf8');
const start=source.indexOf('function missionOf('),end=source.indexOf('function completedIds(',start);
assert.ok(start>=0&&end>start);
const context=vm.createContext({getMission:()=>undefined,EXTRA_MISSIONS:[],overrides:new Map()});
vm.runInContext(source.slice(start,end),context);
const find=vm.runInContext('missionOf',context);
const definition=vm.runInContext('effectiveDefinition',context);
test('missão inédita cadastrada para uma turma é reconhecida',()=>{
 context.overrides.set('turma-1:NOVA',{title:'Missão inédita',steps:[{id:'q1',type:'quiz',answer:0,options:['A','B'],indicators:['I1']}]});
 const m=find('NOVA','turma-1');
 assert.equal(m.title,'Missão inédita');
 assert.equal(m.steps.length,1);
 assert.equal(m.competencies[0],'I1');
 assert.equal(definition({class_id:'turma-1',mission_id:'NOVA'},m,null).steps.length,1);
});
test('missão inédita de outra turma não herda configuração',()=>{
 assert.equal(find('NOVA','turma-2').steps.length,0);
});
test('missão sem configuração continua segura para exibição',()=>{
 const m=find('SEM-CONFIG','turma-1');
 assert.equal(m.id,'SEM-CONFIG');
 assert.equal(m.steps.length,0);
});
