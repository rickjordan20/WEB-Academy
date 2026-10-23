import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp,readFile,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
const source=new URL("../js/cloud-sync.js",import.meta.url);
const mk=answers=>({meta:{updatedAt:"2026-10-20T10:00:00Z"},answers,journey:{},gamification:{xp:0,xpHistory:[],rewarded:[]},evidence:[]});
test("CAS conflict retries without losing independent device edits",async()=>{
 const root=await mkdtemp(join(tmpdir(),"uc7-cas-"));
 try{
  await writeFile(join(root,"package.json"),'{"type":"module"}');
  await writeFile(join(root,"cloud-sync.js"),await readFile(source));
  await writeFile(join(root,"storage.js"),`let state=${JSON.stringify(mk({local:"L"}))};export const getState=()=>state;export const cacheCloudState=s=>{state=s};export const setActiveUser=()=>{};`);
  await writeFile(join(root,"supabase-client.js"),`let cloud=${JSON.stringify(mk({remote:"R"}))};let version="v1",calls=0;export const getSession=async()=>({user:{id:"student-test"}});export const getSupabase=async()=>({from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{state:cloud,updated_at:version},error:null})})})}),rpc:async(_,{p_state,p_expected_updated_at})=>{calls++;if(calls===1){cloud={...cloud,answers:{...cloud.answers,concurrent:"C"}};version="v2"}if(p_expected_updated_at!==version)return {data:{saved:false,cloud_state:cloud,cloud_updated_at:version}};cloud=p_state;version="v"+(calls+2);return {data:{saved:true,cloud_state:cloud,cloud_updated_at:version}}}});export const snapshot=()=>({cloud,calls});`);
  const sync=await import("file://"+join(root,"cloud-sync.js"));
  const remote=await import("file://"+join(root,"supabase-client.js"));
  globalThis.window={dispatchEvent:()=>{}};globalThis.CustomEvent=class{constructor(type){this.type=type}};
  assert.equal((await sync.pushCloudState()).synced,true);
  assert.deepEqual(remote.snapshot().cloud.answers,{remote:"R",concurrent:"C",local:"L"});
  assert.equal(remote.snapshot().calls,2);
 }finally{await rm(root,{recursive:true,force:true})}
});
