import test from 'node:test';
import assert from 'node:assert/strict';
import {nextF3Index} from '../js/f3-check-summary.js';
test('F3: primeiro slide pendente',()=>{assert.equal(nextF3Index({},[{id:'s1'}]),0);});

test('F3: calcula checks sem modificar respostas',async()=>{
 const {summarizeF3Checks}=await import('../js/f3-check-summary.js');
 const slides=[{id:'s1',title:'HTML'},{id:'s2',title:'Links'}];
 const answers={'F3:s1':{correct:true,attempts:2,firstTryCorrect:false},'F3:s2':{correct:false,attempts:1}};
 const before=JSON.stringify(answers);
 const summary=summarizeF3Checks(answers,slides);
 assert.equal(summary.total,2);
 assert.equal(summary.answered,2);
 assert.equal(summary.correct,1);
 assert.equal(summary.firstTryCorrect,0);
 assert.deepEqual(summary.needsReview,['s2']);
 assert.equal(nextF3Index(answers,slides),1);
 assert.equal(JSON.stringify(answers),before);
});

test('F3: todos os checks corretos nao possuem pendencias',async()=>{
 const {summarizeF3Checks}=await import('../js/f3-check-summary.js');
 const slides=[{id:'s1',title:'Primeiro'},{id:'s2',title:'Segundo'}];
 const answers={'F3:s1':{correct:true,attempts:1,firstTryCorrect:true},'F3:s2':{correct:true,attempts:2,firstTryCorrect:false}};
 const summary=summarizeF3Checks(answers,slides);
 assert.equal(summary.correct,2);
 assert.equal(summary.firstTryCorrect,1);
 assert.deepEqual(summary.needsReview,[]);
 assert.equal(nextF3Index(answers,slides),1);
});

test('F3: motor compartilhado preserva primeiro erro e historico',async()=>{
 const {evaluateF3Choice,f3Feedback}=await import('../js/f3-slide-core.js');
 const slide={id:'s',correct:1,options:['A','B'],explanation:'Use B.'};
 const first=evaluateF3Choice(slide,0,null,'2026-10-27T10:00:00.000Z');
 const second=evaluateF3Choice(slide,1,first,'2026-10-27T10:01:00.000Z');
 assert.equal(first.correct,false);
 assert.equal(second.correct,true);
 assert.equal(second.firstTryCorrect,false);
 assert.equal(second.attempts,2);
 assert.equal(second.history.length,2);
 assert.match(f3Feedback(slide,first),/Use B/);
 assert.equal(evaluateF3Choice(slide,0,second),second);
 assert.throws(()=>evaluateF3Choice(slide,5),/invalida/);
});
