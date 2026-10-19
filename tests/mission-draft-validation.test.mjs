import test from "node:test";
import assert from "node:assert/strict";
import {validateMissionDraft} from "../js/mission-draft-validation.js";

const step=(id,title="Atividade")=>({id,title,type:"content",xp:0,indicators:[]});
const guided=()=>({title:"Missão 1A",steps:[step("p1")],fundamental:{title:"Fundamentos",steps:[step("f1")]}});

test("rascunho permite os dois momentos vazios",()=>assert.equal(validateMissionDraft({title:"Missão",steps:[],fundamental:{steps:[]}}),true));
test("rascunho permite prática vazia e fundamentos preenchidos",()=>assert.equal(validateMissionDraft({...guided(),steps:[]}),true));
test("publicação exige prática guiada",()=>assert.throws(()=>validateMissionDraft({...guided(),steps:[]},{requireActivities:true}),/Prática Guiada.*nenhuma atividade/));
test("publicação exige fundamentos",()=>assert.throws(()=>validateMissionDraft({...guided(),fundamental:{steps:[]}},{requireActivities:true}),/Fundamentos.*nenhuma atividade/));
test("publicação completa é aceita",()=>assert.equal(validateMissionDraft(guided(),{requireActivities:true}),true));
test("título ausente bloqueia rascunho",()=>assert.throws(()=>validateMissionDraft({...guided(),title:"  "}),/título/));
test("IDs repetidos são rejeitados com identificação",()=>assert.throws(()=>validateMissionDraft({...guided(),steps:[step("x"),step("x","Segunda")] }),/identificador repetido.*atividade 2/));
test("atividades sem título são rejeitadas",()=>assert.throws(()=>validateMissionDraft({...guided(),steps:[step("x"," ")]}),/sem título/));
test("XP inválido é rejeitado",()=>assert.throws(()=>validateMissionDraft({...guided(),steps:[{...step("x"),xp:-1}]}),/XP inválido/));
test("indicadores inválidos são rejeitados",()=>assert.throws(()=>validateMissionDraft({...guided(),steps:[{...step("x"),indicators:[null]}]}),/indicadores inválidos/));
test("não altera o conteúdo recebido",()=>{const v=guided();const before=JSON.stringify(v);validateMissionDraft(v,{requireActivities:true});assert.equal(JSON.stringify(v),before)});
