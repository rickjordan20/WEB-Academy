import test from "node:test";
import assert from "node:assert/strict";
import {MISSIONS,EXTRA_MISSIONS} from "../data/missions.js";

test("UC7: IDs internos preservados e IDs de exibicao sem duplicidade",()=>{
 assert.equal(MISSIONS.length,28);
 assert.equal(new Set(MISSIONS.map(m=>m.id)).size,28);
 assert.equal(new Set(MISSIONS.map(m=>m.displayId)).size,28);
 assert.equal(EXTRA_MISSIONS.length,7);
});
test("UC7: todas as missoes possuem projeto, titulo, descricao e indicadores",()=>{
 for(const mission of MISSIONS){
  assert.ok(["edutech","restaurante"].includes(mission.project),mission.id);
  assert.ok(mission.title?.trim(),mission.id);
  assert.ok(mission.subtitle?.trim(),mission.id);
  assert.ok(Array.isArray(mission.competencies)&&mission.competencies.length,mission.id);
  assert.ok(Array.isArray(mission.requirements)&&mission.requirements.length,mission.id);
 }
});
test("UC7: missao 3A continua EduTech sem alterar ID historico",()=>{
 const m=MISSIONS.find(m=>m.displayId==="3A");
 assert.equal(m.id,"3B");
 assert.equal(m.project,"edutech");
 assert.match(m.title,/HTML Semântico/);
});
test("UC7: missao final identifica claramente o projeto de origem",()=>{
 const m=MISSIONS.at(-1);
 assert.equal(m.id,"14B");
 assert.equal(m.project,"restaurante");
 assert.equal(m.type,"guild");
 assert.match(m.title,/Restaurante/);
 assert.match(m.subtitle,/publique/);
});
