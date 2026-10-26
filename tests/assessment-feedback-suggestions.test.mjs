import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../js/instructor-mission-reviews.js',import.meta.url),'utf8');
const start=source.indexOf('function feedbackSuggestions('),end=source.indexOf('function autoPanel(',start);
assert.ok(start>=0&&end>start);
const context=vm.createContext({automaticSummary:()=>({checks:[],objectives:[]})});
vm.runInContext(source.slice(start,end),context);
const suggest=vm.runInContext('feedbackSuggestions',context);
test('sem snapshot não inventa conclusão',()=>{
 const x=suggest({progress_snapshot:{}},{},null);
 assert.match(x.checks,/não está disponível/);
});
test('checks e gabarito produzem feedback individual contextualizado',()=>{
 context.automaticSummary=()=>({checks:[{step:{title:'Introdução'},checked:true},{step:{title:'Prática'},checked:false}],objectives:[{unit:'N',step:{id:'q1',title:'Git',options:['Git','GitHub']},result:{answered:true,passed:false,correct:0}}]});
 const x=suggest({progress_snapshot:{version:1}},{},null);
 assert.match(x.checks,/1 de 2/);
 assert.match(x.checks,/Prática/);
 assert.match(x.objectives['N:q1'],/Git/);
 assert.match(x.objectives['N:q1'],/alternativa selecionada não corresponde/);
});
test('resposta ausente não é descrita como erro',()=>{
 context.automaticSummary=()=>({checks:[],objectives:[{unit:'N',step:{id:'q2',title:'HTML',options:['a']},result:{answered:false,passed:false,correct:0}}]});
 const x=suggest({progress_snapshot:{version:1}},{},null);
 assert.match(x.objectives['N:q2'],/Não há resposta registrada/);
});
