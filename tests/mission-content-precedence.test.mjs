import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SourceTextModule,SyntheticModule,createContext} from 'node:vm';

async function setup(){
 const mission={id:'3B',displayId:'3A',type:'training',title:'Título base',subtitle:'Descrição base',steps:[{id:'base'}]};
 const legacy={id:'3A',displayId:'2B',type:'guild',title:'Guilda base',steps:[{id:'guild-base'}]};
 const context=createContext({console,Array,String,JSON});
 const code=await readFile(new URL('../js/mission-content.js',import.meta.url),'utf8');
 const mod=new SourceTextModule(code,{context});
 await mod.link(async spec=>{
  const exports=spec==='./supabase-client.js'?{getSupabase:async()=>null}:spec==='../data/missions.js'?{MISSIONS:[mission,legacy],EXTRA_MISSIONS:[]}:null;
  if(!exports)throw Error('Unexpected import '+spec);
  return new SyntheticModule(Object.keys(exports),function(){for(const [k,v] of Object.entries(exports))this.setExport(k,v)},{context});
 });
 await mod.evaluate();
 return {mission,legacy,apply:mod.namespace.applyEditedMissionContent};
}
test('UC7: rascunho fechado não substitui conteúdo base',async()=>{
 const {mission,apply}=await setup();
 apply('3B',{status:'closed',draft:{title:'Rascunho',subtitle:'Não publicar',steps:[{id:'draft'}]}});
 assert.equal(mission.title,'Título base');
 assert.equal(mission.subtitle,'Descrição base');
 assert.deepEqual(mission.steps.map(s=>s.id),['base']);
});
test('UC7: conteúdo publicado substitui título e etapas base',async()=>{
 const {mission,apply}=await setup();
 apply('3B',{status:'published',title:'Publicado',subtitle:'Descrição publicada',steps:[{id:'p1',title:'Prática guiada'}]});
 assert.equal(mission.title,'Publicado');
 assert.equal(mission.subtitle,'Descrição publicada');
 assert.deepEqual(mission.steps.map(s=>s.id),['p1']);
});
test('UC7: conteúdo legado de Guilda não sobrescreve missão guiada',async()=>{
 const {legacy,apply}=await setup();
 apply('3A',{status:'published',guild_template_version:1,title:'Guilda antiga',steps:[{id:'guild-3A-01'}]});
 assert.equal(legacy.title,'Guilda base');
 assert.deepEqual(legacy.steps.map(s=>s.id),['guild-base']);
});
test('UC7: etapa da Guilda não é injetada em missão guiada',async()=>{
 const {mission,apply}=await setup();
 apply('3B',{status:'published',steps:[{id:'guided',title:'Prática guiada'},{id:'guild-only',title:'Prática autônoma — Guilda'}]});
 assert.deepEqual(mission.steps.map(s=>s.id),['guided']);
});
