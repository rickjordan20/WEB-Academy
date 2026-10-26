import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=async path=>readFile(new URL(path,import.meta.url),'utf8');

test('a entrega da Guilda 2B+ consulta tarefas reais e exige conclusão individual',async()=>{
 const s=await source('../js/mission-delivery.js');
 assert.match(s,/guild_members/);
 assert.match(s,/guild_tasks/);
 assert.match(s,/mission_id",missionId/);
 assert.match(s,/t\.source!=="mission"&&t\.responsible_user_id===session\.user\.id/);
 assert.match(s,/myTasks\.some\(t=>t\.status!=="done"\)/);
 assert.match(s,/guild_self_review/);
 assert.match(s,/mission_submissions/);
});
test('autoavaliação não é automaticamente uma menção Senac',async()=>{
 const s=await source('../js/mission-delivery.js');
 assert.match(s,/answers\[missionId\+":guild_self_review"\]=guildReview/);
 assert.match(s,/grades:\{\}/);
 const instructor=await source('../js/instructor-mission-reviews.js');
 assert.match(instructor,/guildSelfReviewPanel\(r\)/);
 assert.match(instructor,/Consolidação dos indicadores/);
});
test('associação da tarefa pode ser alterada e exibida na Guilda',async()=>{
 const s=await source('../js/guild-page.js');
 assert.match(s,/name="mission_id"/);
 assert.match(s,/missionOptions\(task\.mission_id\|\|""\)/);
 assert.match(s,/updateSharedTask\(id,\{title,description,phase,mission_id:mission_id\|\|null\}\)/);
 assert.match(s,/missionLabel\(t\.mission_id\)/);
});
test('o novo construtor aceita 2B e preserva 1B',async()=>{
 const s=await source('../js/guild-builder-page.js');
 assert.match(s,/mission\.displayId==="1B"/);
 assert.doesNotMatch(s,/mission\.phase\)<3/);
});
