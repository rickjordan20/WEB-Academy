import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source=await readFile(new URL('../js/instructor-mission-reviews.js',import.meta.url),'utf8');

test('ficha separa checks da missão e fundamentos e sinaliza histórico',()=>{
 assert.match(source,/function checkSummary\(/);
 assert.match(source,/const missionProgress=/);
 assert.match(source,/Checks de Fundamentos/);
 assert.match(source,/Conferência de versão necessária/);
 assert.match(source,/historicalWarning/);
});
test('etapas são expansíveis e os comentários não são preenchidos automaticamente',()=>{
 assert.match(source,/return '<details class="eval-block eval-review-step"/);
 assert.match(source,/<\/textarea><\/label><\/div><\/details>/);
 assert.match(source,/el\.value=saved!==undefined\?saved:el\.value\|\|"";/);
});
test('salvamento usa os blocos efetivamente exibidos',()=>{
 assert.match(source,/for\(const step of \[\.\.\.\(reviewMission\?\.steps/);
 assert.match(source,/const assigned=new Set/);
 assert.match(source,/responseForStep\(r\.answers/);
});
