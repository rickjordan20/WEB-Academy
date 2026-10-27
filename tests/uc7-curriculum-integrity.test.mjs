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

test("UC7: sequência pedagógica, projetos e fases coerentes",()=>{
 const expected=["1A","1B","1C",...Array.from({length:12},(_,i)=>[String(i+2)+"A",String(i+2)+"B"]).flat(),"14A"];
 assert.deepEqual(MISSIONS.map(m=>m.displayId),expected);
 assert.deepEqual(MISSIONS.map(m=>m.id),Array.from({length:14},(_,i)=>[String(i+1)+"A",String(i+1)+"B"]).flat());
 for(const [index,m] of MISSIONS.entries()){
  const expectedProject=index===0||index===1||index>=3&&index%2===1?"edutech":"restaurante";
  assert.equal(m.project,expectedProject,m.displayId);
  assert.equal(m.type,expectedProject==="edutech"?"training":"guild",m.displayId);
  assert.equal(m.phase,index<3?1:Math.floor((index-3)/2)+2,m.displayId);
 }
});
test("UC7: indicadores e requisitos têm códigos válidos, sem repetições",()=>{
 const validIndicator=/^I[1-6]$/;
 const validRequirement=/^(RF(?:0[1-9]|10)|RNF0[1-8])$/;
 for(const m of MISSIONS){
  assert.ok(m.competencies.every(i=>validIndicator.test(i)),m.displayId);
  assert.ok(m.requirements.every(i=>validRequirement.test(i)),m.displayId);
  assert.equal(new Set(m.competencies).size,m.competencies.length,m.displayId);
  assert.equal(new Set(m.requirements).size,m.requirements.length,m.displayId);
 }
 for(const m of EXTRA_MISSIONS){
  assert.ok(m.title?.trim()&&m.official?.trim(),m.id);
  assert.ok(m.competencies.length&&m.competencies.every(i=>validIndicator.test(i)),m.id);
 }
});
