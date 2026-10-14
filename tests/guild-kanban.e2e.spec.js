const { test, expect } = require('@playwright/test');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const source = readFileSync(join(__dirname, '../js/guild-page.js'), 'utf8');
const TEST_PAGE_URL = 'http://web-academy.test/guild.html';
const ids = { leader: 'u-leader', creator: 'u-creator', responsible: 'u-responsible', collaborator: 'u-collaborator', member: 'u-member' };
const initialTasks = [
  { id: 'task-manual', guild_id: 'guild-1', title: 'Preparar cardápio', description: 'Organizar os pratos', phase: 1, status: 'todo', responsible: '', responsible_user_id: ids.responsible, competencies: [], evidence: '', history: [], created_by: ids.creator, source: 'manual', mission_id: null },
  { id: 'task-mission', guild_id: 'guild-1', title: 'Missão oficial', description: 'Atividade da Jornada', phase: 1, status: 'todo', responsible: '', responsible_user_id: ids.responsible, competencies: [], evidence: '', history: [], created_by: ids.leader, source: 'mission', mission_id: 'g1' },
];
const bootstrap = (role, user) => `
const ids = ${JSON.stringify(ids)};
const state = {
 role: ${JSON.stringify(role)}, user: ${JSON.stringify(user)},
 tasks: ${JSON.stringify(initialTasks)}, collaborators: [{task_id:'task-manual',user_id:ids.collaborator}],
 calls: [], failDelete: false
};
window.__mock = state;
const members = Object.values(ids).map(id => ({user_id:id,role:id===ids.leader?'leader':'member',project_function:'not_defined'}));
const data = {
 class_members:[{class_id:'class-1'}], classes:[{id:'class-1'}],
 guild_members:members.map(m=>({...m,guild_id:'guild-1'})),
 guilds:[{id:'guild-1',name:'Projeto Restaurante',repository:''}],
 profiles:Object.values(ids).map(id=>({id,full_name:id})),
 guild_tasks:state.tasks, guild_task_collaborators:state.collaborators
};
const result = (table, filters, op, payload) => {
 let rows = data[table] || [];
 for (const [field,value] of filters) rows = rows.filter(r => Array.isArray(value)?value.includes(r[field]):r[field]===value);
 state.calls.push({table,op,payload,filters});
 if(op==='delete') {
  if(!state.failDelete) data[table] = data[table].filter(r=>!rows.includes(r));
  return {data:state.failDelete?[]:rows.map(r=>({id:r.id})),error:null};
 }
 if(op==='insert') {const items=Array.isArray(payload)?payload:[payload]; data[table].push(...items); return {data:items,error:null};}
 if(op==='update') {rows.forEach(r=>Object.assign(r,payload));return {data:rows,error:null};}
 return {data:rows,error:null};
};
const query=(table,op='select',payload=null,filters=[])=>({
 select(){return query(table,op,payload,filters)},
 eq(k,v){return query(table,op,payload,[...filters,[k,v]])},
 in(k,v){return query(table,op,payload,[...filters,[k,v]])},
 order(){return Promise.resolve(result(table,filters,op,payload))},
 single(){const r=result(table,filters,op,payload);return Promise.resolve({...r,data:r.data[0]||null})},
 maybeSingle(){const r=result(table,filters,op,payload);return Promise.resolve({...r,data:r.data[0]||null})},
 then(resolve,reject){return Promise.resolve(result(table,filters,op,payload)).then(resolve,reject)},
});
const sb={
 from(table){return {select(){return query(table)},insert(v){return query(table,'insert',v)},update(v){return query(table,'update',v)},delete(){return query(table,'delete')}}},
 async rpc(name,args){
  state.calls.push({rpc:name,args});
  if(name==='get_available_guild_students')return {data:[],error:null};
  if(name==='create_guild_manual_task'){
   data.guild_tasks.push({id:'task-created',guild_id:'guild-1',title:args.p_title,description:args.p_description,phase:args.p_phase,status:'todo',responsible_user_id:args.p_responsible_user_id,created_by:state.user,source:'manual',history:[],competencies:[],evidence:''});
  }
  if(name==='update_guild_task_collaboration'){
   const t=data.guild_tasks.find(t=>t.id===args.p_task_id);
   if(t){if(args.p_status!==null)t.status=args.p_status;if(args.p_set_evidence)t.evidence=args.p_evidence;if(args.p_set_responsible)t.responsible_user_id=args.p_responsible_user_id;}
  }
  return {data:null,error:null};
 },
 channel(){return {on(){return this},subscribe(){return this}}},removeChannel(){}
};
window.__sb=sb;
`;
test.beforeEach(async ({ page }, testInfo) => {
 const role = testInfo.title.includes('[leader]') ? 'leader' : 'member';
 const user = testInfo.title.includes('[leader]') ? ids.leader : testInfo.title.includes('[creator]') ? ids.creator : testInfo.title.includes('[responsible]') ? ids.responsible : testInfo.title.includes('[collaborator]') ? ids.collaborator : ids.member;
 await page.route('http://web-academy.test/**', async route => {
  const path = new URL(route.request().url()).pathname;
  if(path==='/guild.html') return route.fulfill({contentType:'text/html',body:'<!doctype html><html><body><main id="guildRoot"></main><script type="module" src="/js/guild-page.js"></script></body></html>'});
  if(path==='/js/guild-page.js')return route.fulfill({contentType:'text/javascript',body:source});
  if(path==='/js/supabase-client.js')return route.fulfill({contentType:'text/javascript',body:'export const getSupabase=async()=>window.__sb;export const getSession=async()=>({user:{id:window.__mock.user}});'});
  if(path==='/js/storage.js')return route.fulfill({contentType:'text/javascript',body:'export const getState=()=>({journey:{unlockedMissions:[],completedMissions:[]}});'});
  if(path==='/js/projects.js')return route.fulfill({contentType:'text/javascript',body:"export const STATUS_LABEL={todo:'A fazer',doing:'Em andamento',review:'Em revisão',done:'Concluído'};export const ensureProjects=()=>({guild:{evidence:[]}});export const addEvidence=()=>{};"});
  if(path==='/data/missions.js')return route.fulfill({contentType:'text/javascript',body:'export const MISSIONS=[];'});
  if(path==='/js/cloud-bootstrap.js')return route.fulfill({contentType:'text/javascript',body:'export {}'});
  return route.fulfill({status:404,body:'Not found'});
 });
 await page.addInitScript(bootstrap(role,user));
 await page.goto(TEST_PAGE_URL);
 await expect(page.getByRole('heading',{name:'Kanban da Guilda'})).toBeVisible();
});
test('[leader] cria tarefa pelo formulário',async({page})=>{
 await page.locator('#taskForm [name="title"]').fill('Criar reservas');
 await page.locator('#taskForm [name="description"]').fill('Implementar reservas');
 await page.getByRole('button',{name:'Adicionar ao quadro'}).click();
 await expect(page.getByRole('heading',{name:'Criar reservas'})).toBeVisible();
 expect(await page.evaluate(()=>window.__mock.calls.some(c=>c.rpc==='create_guild_manual_task'))).toBe(true);
});
test('[creator] edita tarefa manual e salva',async({page})=>{
 await page.locator('[data-edit-task="task-manual"]').click();
 await page.locator('#taskEditForm [name="title"]').fill('Cardápio atualizado');
 await page.getByRole('button',{name:'Salvar alterações'}).click();
 await expect(page.getByRole('heading',{name:'Cardápio atualizado'})).toBeVisible();
});
test('[creator] cancela exclusão e preserva tarefa',async({page})=>{
 page.once('dialog',dialog=>dialog.dismiss());
 await page.locator('[data-delete-task="task-manual"]').click();
 await expect(page.getByRole('heading',{name:'Preparar cardápio'})).toBeVisible();
 expect(await page.evaluate(()=>window.__mock.calls.some(c=>c.table==='guild_tasks'&&c.op==='delete'))).toBe(false);
});
test('[creator] confirma exclusão e remove tarefa',async({page})=>{
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('[data-delete-task="task-manual"]').click();
 await expect(page.getByRole('heading',{name:'Preparar cardápio'})).toHaveCount(0);
});
test('[leader] altera colaboradores',async({page})=>{
 await page.locator('details.task-collaborators').first().locator('summary').click();
 const checkbox=page.locator('[data-task-collaborator="task-manual"][data-user-id="u-member"]');
 await checkbox.check();
 await expect(checkbox).toBeChecked();
 expect(await page.evaluate(()=>window.__mock.calls.some(c=>c.table==='guild_task_collaborators'&&c.op==='insert'))).toBe(true);
});
test('[responsible] altera status sem acesso à edição estrutural',async({page})=>{
 await expect(page.locator('[data-edit-task="task-manual"]')).toHaveCount(0);
 await page.locator('[data-status="task-manual"]').selectOption('doing');
 await expect(page.locator('[data-status="task-manual"]')).toHaveValue('doing');
 expect(await page.evaluate(()=>window.__mock.calls.some(c=>c.rpc==='update_guild_task_collaboration'))).toBe(true);
});
test('[collaborator] registra evidência',async({page})=>{
 await page.locator('[data-task-evidence="task-manual"]').fill('https://example.com/pr/1');
 await page.locator('[data-task-evidence="task-manual"]').dispatchEvent('change');
 await expect(page.locator('[data-task-evidence="task-manual"]')).toHaveValue('https://example.com/pr/1');
});
test('[member] não pode alterar tarefa',async({page})=>{
 await expect(page.locator('[data-edit-task="task-manual"]')).toHaveCount(0);
 await expect(page.locator('[data-delete-task="task-manual"]')).toHaveCount(0);
 await expect(page.locator('[data-status="task-manual"]')).toBeDisabled();
 await expect(page.locator('[data-task-evidence="task-manual"]')).toBeDisabled();
 await expect(page.locator('[data-responsible="task-manual"]')).toBeDisabled();
});
test('[leader] não pode excluir missão liberada',async({page})=>{
 await expect(page.locator('[data-delete-task="task-mission"]')).toHaveCount(0);
 await expect(page.locator('[data-edit-task="task-mission"]')).toHaveCount(0);
});
