import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir,readFile,access} from 'node:fs/promises';
import {resolve,dirname,extname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
async function walk(dir){
 const items=await readdir(dir,{withFileTypes:true});
 const result=[];
 for(const item of items){
  if(item.name==='.git'||item.name==='node_modules')continue;
  const full=resolve(dir,item.name);
  if(item.isDirectory())result.push(...await walk(full));
  else result.push(full);
 }
 return result;
}
const files=await walk(root);
const exists=async path=>{try{await access(path);return true}catch{return false}};
const isLocal=value=>value&&!/^(?:[a-z]+:|\/\/|#|data:|javascript:|\{)/i.test(value);
test('todos os imports estáticos relativos resolvem arquivos existentes',async()=>{
 const broken=[];
 for(const file of files.filter(f=>extname(f)==='.js'||extname(f)==='.mjs')){
  const text=await readFile(file,'utf8');
  const regex=/\b(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g;
  for(const match of text.matchAll(regex)){
   if(!match[1].startsWith('.'))continue;
   const source=relative(root,file);
   // O editor gera um iframe srcdoc com <base href=location.href>.
   // Nesse HTML embutido, ./js/... é relativo à página na raiz, não ao arquivo JS.
   const embeddedPreview=source==='js/mission-builder-page.js'&&match[1]==='./js/step-renderer.js'&&text.includes('frame.srcdoc=');
   const target=embeddedPreview?resolve(root,match[1]):resolve(dirname(file),match[1]);
   if(!await exists(target))broken.push(source+' -> '+match[1]);
  }
 }
 assert.deepEqual(broken,[]);
});
test('entradas HTML, folhas de estilo e scripts locais apontam para arquivos existentes',async()=>{
 const broken=[];
 for(const file of files.filter(f=>extname(f)==='.html')){
  const text=await readFile(file,'utf8');
  const regex=/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi;
  for(const match of text.matchAll(regex)){
   const raw=match[1].split(/[?#]/)[0];
   if(!isLocal(raw)||raw.includes('${')||raw.includes('<%'))continue;
   const path=raw.startsWith('/')?resolve(root,raw.slice(1)):resolve(dirname(file),raw);
   if(!path.startsWith(root+'/')&&!path.startsWith(root+'\\'))continue;
   if(!await exists(path))broken.push(relative(root,file)+' -> '+match[1]);
  }
 }
 assert.deepEqual(broken,[]);
});
