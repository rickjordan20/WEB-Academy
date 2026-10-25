import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {SourceTextModule,SyntheticModule,createContext} from 'node:vm';

async function load(path,mocks={}){
 const context=createContext({Date,Map,Set,JSON,Math,Number,String,Boolean,Array,Object,RegExp,console,Promise});
 const mod=new SourceTextModule(await readFile(new URL(path,import.meta.url),'utf8'),{context});
 await mod.link(async spec=>new SyntheticModule(Object.keys(mocks[spec]||{}),function(){for(const [key,val] of Object.entries(mocks[spec]||{}))this.setExport(key,val)},{context}));
 await mod.evaluate();return mod.namespace;
}
const fixtures={
 guild_members:[{user_id:'fake-a',guild_id:'g'},{user_id:'fake-b',guild_id:'g'}],
 guild_tasks:[{id:'t',guild_id:'g',mission_id:'2B',title:'Página',status:'done',responsible_user_id:'fake-a'}],
 guild_task_contributions:[{id:'c1',guild_id:'g',task_id:'t',author_id:'fake-a',summary:'Criou HTML',created_at:'2026-10-20T12:00:00Z'},{id:'c2',guild_id:'g',task_id:'t',author_id:'fake-b',summary:'Revisou CSS',created_at:'2026-10-20T13:00:00Z'}],
 profiles:[{id:'fake-a',full_name:'Fictício A'},{id:'fake-b',full_name:'Fictício B'}]
};
const supabase={from(table){
 let rows=[...(fixtures[table]||[])];
 const q={select(){return q},eq(k,v){rows=rows.filter(x=>x[k]===v);return q},in(k,v){rows=rows.filter(x=>v.includes(x[k]));return q},order(){return q},async maybeSingle(){return {data:rows[0]||null,error:null}},then(ok,bad){return Promise.resolve({data:rows,error:null}).then(ok,bad)}};
 return q;
}};
test('instrutor vê somente contribuições individuais selecionadas',async()=>{
 const {mountMissionParticipation}=await load('../js/mission-participation.js',{'./supabase-client.js':{getSupabase:async()=>supabase,getSession:async()=>({user:{id:'fake-a'}})}});
 const target={innerHTML:''};
 await mountMissionParticipation(target,{missionId:'2B',studentId:'fake-a',teacher:true});
 assert.match(target.innerHTML,/Criou HTML/);
 assert.doesNotMatch(target.innerHTML,/Revisou CSS/);
 assert.match(target.innerHTML,/1 contribuição/);
});
test('outro estudante não herda contribuições do colega',async()=>{
 const {mountMissionParticipation}=await load('../js/mission-participation.js',{'./supabase-client.js':{getSupabase:async()=>supabase,getSession:async()=>({user:{id:'fake-a'}})}});
 const target={innerHTML:''};
 await mountMissionParticipation(target,{missionId:'2B',studentId:'fake-b',teacher:true});
 assert.match(target.innerHTML,/Revisou CSS/);
 assert.doesNotMatch(target.innerHTML,/Criou HTML/);
 assert.match(target.innerHTML,/não comprovação automática de aprendizagem/);
});
test('XP proporcional considera apenas etapas existentes',async()=>{
 const {estimateMissionXp}=await load('../js/mission-assessment-utils.js');
 const result=estimateMissionXp({maxXp:120,steps:[{id:'a'},{id:'b'},{id:'c'}]},{version:1,mission:{completedSteps:['a','invalid']}});
 assert.equal(result.completed,1);
 assert.equal(result.xp,40);
 assert.equal(result.percent,33);
});
