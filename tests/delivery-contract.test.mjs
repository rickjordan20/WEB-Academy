import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('envio revalida a janela antes de registrar entrega',async()=>{
 const source=await readFile(new URL('../js/mission-delivery.js',import.meta.url),'utf8');
 assert.ok(source.includes('await missionWindow(missionId)'));
 assert.ok(source.includes('latestAccess.state!=="open"&&latestAccess.state!=="closed"'));
 assert.ok(source.includes('isLate&&!late'));
});
test('registro de atraso exige justificativa e preserva indicador no payload',async()=>{
 const source=await readFile(new URL('../js/mission-delivery.js',import.meta.url),'utf8');
 assert.ok(source.includes('explanation?.value.trim().length<10'));
 assert.ok(source.includes('is_late:!!isLate'));
 assert.ok(source.includes('late_reason:isLate?reason.value:null'));
 assert.ok(source.includes('late_explanation:isLate?explanation.value.trim():""'));
});
test('envio requer revisão e bloqueia reenvio de avaliação concluída',async()=>{
 const source=await readFile(new URL('../js/mission-delivery.js',import.meta.url),'utf8');
 assert.ok(source.includes('confirmedFingerprint!==fingerprint'));
 assert.ok(source.includes('previous?.status==="evaluated"'));
 assert.ok(source.includes('button.disabled=true'));
});
