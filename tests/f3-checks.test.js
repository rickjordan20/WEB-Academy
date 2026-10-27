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
