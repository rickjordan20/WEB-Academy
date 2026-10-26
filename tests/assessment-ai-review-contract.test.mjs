import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const s=await readFile(new URL('../js/instructor-mission-reviews.js',import.meta.url),'utf8');
test('botão IA envia somente identificador e definição e exibe parecer por indicador',()=>{
 assert.match(s,/data-ai-review>Analisar entrega com IA/);
 assert.match(s,/sb\.functions\.invoke\("mission-ai-review"/);
 assert.match(s,/data-ai-review-result/);
 assert.match(s,/data-ai-apply/);
});
test('aplicação preserva menções já escolhidas e não salva automaticamente',()=>{
 assert.match(s,/if\(radios\.some\(x=>x\.checked\)\)continue/);
 assert.match(s,/if\(general&&!general\.value\.trim\(\)\)/);
 assert.match(s,/if\(!\["A","PA"\]\.includes\(i\.mention\)\)continue/);
 assert.match(s,/if\(radios\.some\(x=>x\.checked\)\)continue/);
 assert.match(s,/Nenhuma avaliação foi salva/);
});
