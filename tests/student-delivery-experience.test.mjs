import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const delivery=await readFile(new URL('../js/mission-delivery.js',import.meta.url),'utf8');
const page=await readFile(new URL('../js/mission-page.js',import.meta.url),'utf8');
const sync=await readFile(new URL('../js/cloud-bootstrap.js',import.meta.url),'utf8');
const cloud=await readFile(new URL('../js/cloud-sync.js',import.meta.url),'utf8');

test('aluno: entrega consulta prazo novamente, inclusive após vencimento com página aberta',()=>{
 assert.match(delivery,/await missionWindow\(missionId\)/);
 assert.match(delivery,/if\(!late\)\{section\.querySelector\("\.delivery-fields"\)\.hidden=true;\}/);
 assert.match(delivery,/if\(isLate&&!late\)/);
 assert.match(delivery,/fields\.hidden=false;acknowledgement\.hidden=false/);
});
test('aluno: revisão obrigatória é invalidada ao alterar respostas',()=>{
 assert.match(delivery,/confirmedFingerprint!==fingerprint \|\| !preflight\.querySelector/);
 assert.match(delivery,/Ainda não foi enviado/);
});
test('aluno: envio exige resposta confirmada do banco e fornece protocolo',()=>{
 assert.match(delivery,/\.upsert\(payload,\{onConflict:"class_id,student_id,mission_id"\}\)\.select\("id,status,submitted_at,is_late"\)\.single\(\)/);
 assert.match(delivery,/result\.data\.status!=="submitted"/);
 assert.match(delivery,/Protocolo:/);
});
test('aluno: impede reenvio de avaliação já encerrada',()=>{
 assert.match(delivery,/current\?\.status==="evaluated"/);
});
test('aluno: rascunhos de missão não sobrescrevem controles de entrega',()=>{
 assert.match(page,/el\.closest\("\.mission-delivery"\)/);
 assert.match(page,/\.mission-delivery textarea/);
});
test('aluno: sincronização mantém progresso local durante falhas e tenta novamente',()=>{
 assert.match(sync,/scheduleRetry/);
 assert.match(sync,/pending=true/);
 assert.match(cloud,/mergeStudentStates\(data\?\.state,current\)/);
 assert.match(cloud,/save_student_state_cas/);
});
