import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../js/instructor-mission-reviews.js',import.meta.url),'utf8');
const start=source.indexOf('function objectiveResult(');
const end=source.indexOf('function reviewBlock(',start);
assert.ok(start>=0&&end>start);
const context=vm.createContext({esc:String,completedIds:()=>[],responseForStep:()=>({value:null})});
vm.runInContext(source.slice(start,end),context);
const grade=vm.runInContext('objectiveResult',context);
test('questão objetiva com gabarito é corrigida automaticamente',()=>{
 assert.equal(grade({type:'quiz',options:['A','B'],answer:0},0).passed,true);
 assert.equal(grade({type:'quiz',options:['A','B'],answer:0},1).passed,false);
});
test('sem resposta, sem gabarito e discursiva não recebem correção automática',()=>{
 assert.equal(grade({type:'quiz',options:['A','B'],answer:0},null).answered,false);
 assert.equal(grade({type:'quiz',options:['A','B']},0),null);
 assert.equal(grade({type:'evidence',fields:['Explique']},'texto'),null);
});
