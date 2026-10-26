import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../js/instructor-mission-reviews.js',import.meta.url),'utf8');
test('checks de todas as etapas são reunidos em um único painel',()=>{
 assert.match(source,/checks\.push\(\{unit,step,checked:done\.includes\(step\.id\)\}\)/);
 assert.match(source,/Feedback único dos checks/);
 assert.match(source,/data-checks-feedback/);
});
test('questões objetivas têm feedback opcional sem repetir blocos',()=>{
 assert.match(source,/Feedback desta questão \(opcional\)/);
 assert.match(source,/const manualMission=reviewMission\.steps\.filter\(step=>isManualStep/);
 assert.match(source,/if\(\["quiz","checkpoint"\]\.includes\(step\.type\)\)return false/);
});
test('checks informativos não geram formulários manuais e feedback anterior é preservado',()=>{
 assert.match(source,/\["content","visual-summary","image-review","flashcards"\]\.includes\(step\.type\)/);
 assert.match(source,/const blocks=\{\.\.\.\(g\.blocks\|\|\{\}\)/);
});
