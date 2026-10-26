import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../js/instructor-mission-reviews.js',import.meta.url),'utf8');
const start=source.indexOf('function completedIds(');
const end=source.indexOf('function blockKey(',start);
assert.ok(start>=0&&end>start,'Funções de auditoria precisam existir');
const context=vm.createContext({});
vm.runInContext(source.slice(start,end),context);
const audit=vm.runInContext('checkSummary',context);

test('1B: check histórico removido permanece identificado sem reduzir checks atuais',()=>{
 const row={mission_id:'1B',answers:{'1B:retro-2-flashcards:revealed':[0,1],'1B:retro-2-q1':'Resposta'},progress_snapshot:{version:1,mission:{completedSteps:['retro-2-flashcards','retro-2-q1']}}};
 const result=audit(row,{id:'1B'},[{id:'retro-2-q1'}],null,[]);
 assert.equal(result.valid.length,1);
 assert.equal(result.obsolete.length,1);
 assert.equal(result.obsolete[0],'retro-2-flashcards');
});
test('checks dos fundamentos não são somados aos da missão',()=>{
 const row={mission_id:'1A',answers:{},progress_snapshot:{version:1,mission:{completedSteps:['mission-1']},fundamentals:{completedSteps:['fund-1']}}};
 const result=audit(row,{id:'1A'},[{id:'mission-1'}],{id:'F1'},[{id:'fund-1'},{id:'fund-2'}]);
 assert.equal(result.valid.length,1);
 assert.equal(result.fundValid.length,1);
 assert.equal(result.foundationTotal,2);
});
test('entrega sem check não é tratada como ausência de respostas',()=>{
 const row={mission_id:'2A',answers:{'2A:question-1':'Uma resposta'},progress_snapshot:{version:1,mission:{completedSteps:[]}}};
 const result=audit(row,{id:'2A'},[{id:'question-1'}],null,[]);
 assert.equal(result.valid.length,0);
 assert.equal(result.historical.length,0);
 assert.equal(Object.keys(row.answers).length,1);
});
