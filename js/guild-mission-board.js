import {getSupabase,getSession} from "./supabase-client.js";
const activeBoards=new WeakMap();
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const statuses=[["todo","A fazer"],["doing","Em andamento"],["review","Em revisão"],["done","Concluído"]];
const labelStatus=s=>statuses.find(x=>x[0]===s)?.[1]||s;
export async function mountGuildMissionBoard(root,mission,{readOnly=false}={}){
 if(mission.type!=="guild")return;
 const host=root.querySelector("#guildMissionBoard");if(!host)return;
 const previous=activeBoards.get(root);if(previous){previous();activeBoards.delete(root)}
 let stopped=false,cleanup=()=>{stopped=true};
 activeBoards.set(root,()=>cleanup());
 host.innerHTML='<p class="gm-loading">Carregando organização da Guilda...</p>';
 try{
  const sb=await getSupabase(),session=await getSession();if(!sb||!session){host.textContent="Entre na sua conta para consultar a equipe.";return}
  const member=await sb.from("guild_members").select("guild_id,role").eq("user_id",session.user.id).maybeSingle();
  if(member.error)throw member.error;if(!member.data){host.innerHTML='<p>Você ainda não participa de uma Guilda. <a href="guild.html">Acessar Guildas</a></p>';return}
  const guildId=member.data.guild_id,isLeader=member.data.role==="leader";
  const membersResult=await sb.from("guild_members").select("user_id,role").eq("guild_id",guildId);
  if(membersResult.error)throw membersResult.error;
  const members=membersResult.data||[];
  const profiles=members.length?await sb.from("profiles").select("id,full_name").in("id",members.map(x=>x.user_id)):{data:[]};
  if(profiles.error)console.warn("Nomes dos integrantes:",profiles.error);
  const names=new Map((profiles.data||[]).map(p=>[p.id,p.full_name||"Integrante"]));
  const name=id=>names.get(id)|| (id===session.user.id?"Você":"Integrante da Guilda");
  const stamp=value=>new Date(value).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo",dateStyle:"short",timeStyle:"medium"});
  const logAction=async(taskId,summary)=>{const result=await sb.from("guild_task_contributions").insert({task_id:taskId,guild_id:guildId,author_id:session.user.id,summary});if(result.error)throw result.error};
  const blocks=(mission.steps||[]).map((step,i)=>({id:step.id,title:step.title||step.label||`Bloco ${i+1}`}));
  const blockTitle=t=>{const found=blocks.find(b=>t.description?.includes(`[Bloco: ${b.id}]`));return found?.title||"Tarefa da missão"};
  let tasks=[],contributions=[],collaborators=[],busy=false,refreshing=false,lastSnapshot="";
  async function load(){
   if(stopped||!host.isConnected||refreshing)return;refreshing=true;
   try{const a=await sb.from("guild_tasks").select("id,title,description,status,responsible_user_id,created_by,mission_id,phase").eq("guild_id",guildId).eq("mission_id",mission.id).order("created_at");
   if(a.error)throw a.error;tasks=a.data||[];
   if(tasks.length){const b=await sb.from("guild_task_contributions").select("id,task_id,author_id,summary,evidence_url,created_at").eq("guild_id",guildId).in("task_id",tasks.map(t=>t.id)).order("created_at",{ascending:false});if(b.error)throw b.error;contributions=b.data||[]}else contributions=[];
   const c=await sb.from("guild_task_collaborators").select("task_id,user_id").in("task_id",tasks.length?tasks.map(t=>t.id):["00000000-0000-0000-0000-000000000000"]);if(c.error)throw c.error;collaborators=c.data||[];
   const snapshot=JSON.stringify({tasks,contributions,collaborators});
   if(!stopped&&host.isConnected&&snapshot!==lastSnapshot){lastSnapshot=snapshot;render()}
   }finally{refreshing=false}
  }
  function render(){
   const editing=host.querySelector("#gmCreate");
   const savedForm=editing?{mode:editing.querySelector('input[name="mode"]:checked')?.value,title:editing.querySelector('[name="title"]')?.value,description:editing.querySelector('[name="description"]')?.value,responsible:editing.querySelector('[name="responsible"]')?.value,block:editing.querySelector('[name="block"]')?.value,focus:document.activeElement?.name}:null;
   host.innerHTML=`<div class="gm-heading"><div><p class="eyebrow">Trabalho colaborativo · ${esc(mission.id)}</p><h2>Quadro da Guilda · ${esc(name(session.user.id))}</h2><p>Equipe identificada automaticamente. Distribua as atividades, registre sua participação e acompanhe as evidências da equipe.</p></div><a class="btn btn-secondary" href="guild.html">Abrir Guilda →</a></div>
   ${isLeader&&!readOnly?`<form id="gmCreate" class="gm-create" style="display:grid;gap:12px"><div style="display:flex;gap:16px;flex-wrap:wrap"><label><input type="radio" name="mode" value="custom" checked> Nova tarefa personalizada</label><label><input type="radio" name="mode" value="block"> A partir de um bloco da missão</label></div><label data-gm-block hidden>Bloco de referência<select name="block">${blocks.map(b=>`<option value="${esc(b.id)}">${esc(b.title)}</option>`).join("")}</select></label><label>Título da tarefa<input name="title" maxlength="160" required placeholder="Ex.: Organizar a estrutura inicial do Projeto Restaurante"></label><label>Descrição e resultado esperado<textarea name="description" rows="3" minlength="10" maxlength="3000" required placeholder="Descreva o que será feito, onde e como verificar a conclusão."></textarea></label><label>Responsável<select name="responsible"><option value="">Não atribuído</option>${members.map(m=>`<option value="${esc(m.user_id)}">${esc(name(m.user_id))}</option>`).join("")}</select></label><button class="btn btn-primary" type="submit">Criar tarefa</button><p class="gm-footnote">A tarefa será compartilhada com todos os integrantes da Guilda nesta missão.</p></form>`:""}

   <div class="gm-log" role="status"><strong>Histórico compartilhado da missão</strong><p>Os registros abaixo são identificados por integrante, tarefa, data e horário de Brasília.</p>${contributions.slice(0,20).map(c=>`<p><b>${esc(name(c.author_id))}</b> · ${esc(tasks.find(t=>t.id===c.task_id)?.title||"Tarefa")} · <time>${stamp(c.created_at)}</time><span> — ${esc(c.summary)}</span></p>`).join("")||"<p>Sem atividades registradas até o momento.</p>"}</div><div class="gm-columns">${statuses.map(([status,title])=>`<section class="gm-column"><h3>${title} <span>${tasks.filter(t=>t.status===status).length}</span></h3>${tasks.filter(t=>t.status===status).map(t=>`<article class="gm-task"><strong>${esc(t.title)}</strong><small>${esc(blockTitle(t))}</small><p>Responsável principal: ${esc(t.responsible_user_id?name(t.responsible_user_id):"A definir")}</p><p>Colaboradores: ${esc(collaborators.filter(c=>c.task_id===t.id).map(c=>name(c.user_id)).join(", ")||"Nenhum")}</p>${!readOnly?`<label>Situação<select data-status="${esc(t.id)}" ${!(isLeader||t.responsible_user_id===session.user.id||t.created_by===session.user.id||collaborators.some(c=>c.task_id===t.id&&c.user_id===session.user.id))?"disabled":""}>${statuses.map(([v,l])=>`<option value="${v}" ${v===t.status?"selected":""}>${l}</option>`).join("")}</select></label>`:""}${isLeader&&!readOnly?`<details><summary>Editar, colaboradores ou excluir</summary><form data-edit-task="${esc(t.id)}"><label>Título<input name="title" maxlength="160" required value="${esc(t.title)}"></label><label>Descrição<textarea name="description" rows="3" required maxlength="3000">${esc(t.description||"")}</textarea></label><button type="submit" class="btn btn-secondary">Salvar alterações</button></form><fieldset><legend>Colaboradores adicionais</legend>${members.map(m=>`<label style="display:block"><input type="checkbox" data-collaborator="${esc(t.id)}" value="${esc(m.user_id)}" ${collaborators.some(c=>c.task_id===t.id&&c.user_id===m.user_id)?"checked":""} ${m.user_id===t.responsible_user_id?"disabled":""}> ${esc(name(m.user_id))}</label>`).join("")}<button type="button" class="btn btn-secondary" data-save-collaborators="${esc(t.id)}">Salvar colaboradores</button></fieldset><button type="button" class="btn btn-secondary" data-delete-task="${esc(t.id)}">Excluir tarefa</button></details><label>Distribuir para<select data-responsible="${esc(t.id)}"><option value="">Não atribuído</option>${members.map(m=>`<option value="${esc(m.user_id)}" ${m.user_id===t.responsible_user_id?"selected":""}>${esc(name(m.user_id))}</option>`).join("")}</select></label>`:""}<details><summary>Contribuições (${contributions.filter(c=>c.task_id===t.id).length})</summary>${contributions.filter(c=>c.task_id===t.id).map(c=>`<div class="gm-log"><b>${esc(name(c.author_id))}</b> <time>${stamp(c.created_at)}</time><p>${esc(c.summary)}</p>${c.evidence_url?`<a href="${esc(c.evidence_url)}" target="_blank" rel="noopener noreferrer">Ver evidência ↗</a>`:""}</div>`).join("")||"<p>Nenhuma contribuição registrada.</p>"}${!readOnly?`<form data-contribute="${esc(t.id)}"><label>O que você realizou?<textarea name="summary" required minlength="10" maxlength="3000" rows="2"></textarea></label><label>Link da evidência (opcional)<input name="url" type="url" placeholder="https://..."></label><button type="submit" class="btn btn-secondary">Registrar minha contribuição</button></form>`:""}</details></article>`).join("")||'<p class="gm-empty">Nenhuma tarefa nesta etapa.</p>'}</section>`).join("")}</div><p class="gm-footnote">Tarefa atribuída não comprova execução. O instrutor poderá consultar os registros individuais e suas evidências.</p><p id="gmFeedback" role="status"></p>`;
   const feedback=msg=>{const el=host.querySelector("#gmFeedback");if(el)el.textContent=msg};
   const run=async fn=>{if(busy)return;busy=true;try{await fn();await load()}catch(e){feedback("Não foi possível concluir: "+e.message)}finally{busy=false}};
   const createForm=host.querySelector("#gmCreate");
   if(createForm){
    const modeInputs=createForm.querySelectorAll('input[name="mode"]');
    const blockSelect=createForm.querySelector('[name="block"]');
    const titleInput=createForm.querySelector('[name="title"]');
    const descriptionInput=createForm.querySelector('[name="description"]');
    const updateMode=()=>{
     const isBlock=createForm.querySelector('input[name="mode"]:checked')?.value==="block";
     createForm.querySelector("[data-gm-block]").hidden=!isBlock;
     blockSelect.disabled=!isBlock;
     if(isBlock){const b=blocks.find(x=>x.id===blockSelect.value);if(b){titleInput.value=b.title;descriptionInput.value="Atividade relacionada ao bloco: "+b.title+". Descreva aqui a entrega esperada."}}
     else{titleInput.value="";descriptionInput.value=""}
    };
    modeInputs.forEach(input=>input.onchange=updateMode);
    blockSelect.onchange=()=>{if(createForm.querySelector('input[name="mode"]:checked')?.value==="block"){const b=blocks.find(x=>x.id===blockSelect.value);if(b){titleInput.value=b.title;descriptionInput.value="Atividade relacionada ao bloco: "+b.title+". Descreva aqui a entrega esperada."}}};
    updateMode();
    if(savedForm){const mode=createForm.querySelector(`input[name="mode"][value="${savedForm.mode}"]`);if(mode){mode.checked=true;updateMode()}if(savedForm.block)blockSelect.value=savedForm.block;titleInput.value=savedForm.title||"";descriptionInput.value=savedForm.description||"";createForm.querySelector('[name="responsible"]').value=savedForm.responsible||"";}
    createForm.addEventListener("submit",e=>{e.preventDefault();const fd=new FormData(createForm),isBlock=fd.get("mode")==="block",b=blocks.find(x=>x.id===fd.get("block"));if(isBlock&&!b)return;const title=String(fd.get("title")||"").trim(),description=String(fd.get("description")||"").trim();if(!title||description.length<10)return;run(async()=>{
      const prefix=isBlock?"[Bloco: "+b.id+"] ":"";
      const result=await sb.rpc("create_guild_mission_task",{p_guild_id:guildId,p_mission_id:mission.id,p_title:title,p_description:prefix+description,p_phase:mission.phase,p_responsible_user_id:fd.get("responsible")||null});
      if(result.error)throw result.error;
      const id=result.data?.id;if(!id)throw new Error("Servidor não retornou a tarefa criada");
      await logAction(id,`Criou ${isBlock?"a tarefa vinculada ao bloco "+b.title:"uma tarefa personalizada"}: ${title}.`);
    })});
   }

   host.querySelectorAll("[data-edit-task]").forEach(form=>form.onsubmit=e=>{e.preventDefault();const fd=new FormData(form);run(async()=>{const title=String(fd.get("title")||"").trim(),description=String(fd.get("description")||"").trim();const result=await sb.rpc("manage_guild_mission_task",{p_task_id:form.dataset.editTask,p_action:"edit",p_title:title,p_description:description});if(result.error)throw result.error;await logAction(form.dataset.editTask,"Editou o título ou descrição da tarefa.")})});
   host.querySelectorAll("[data-save-collaborators]").forEach(btn=>btn.onclick=()=>run(async()=>{const ids=[...host.querySelectorAll('[data-collaborator="'+btn.dataset.saveCollaborators+'"]:checked')].map(el=>el.value);const result=await sb.rpc("manage_guild_mission_task",{p_task_id:btn.dataset.saveCollaborators,p_action:"collaborators",p_collaborators:ids});if(result.error)throw result.error;await logAction(btn.dataset.saveCollaborators,"Atualizou os colaboradores: "+(ids.map(name).join(", ")||"nenhum")+".")}));
   host.querySelectorAll("[data-delete-task]").forEach(btn=>btn.onclick=()=>{const task=tasks.find(t=>t.id===btn.dataset.deleteTask);if(!window.confirm("Excluir definitivamente a tarefa '"+(task?.title||"")+"?' Esta ação não pode ser desfeita."))return;run(async()=>{const result=await sb.rpc("manage_guild_mission_task",{p_task_id:btn.dataset.deleteTask,p_action:"delete"});if(result.error)throw result.error})});
   host.querySelectorAll("[data-status]").forEach(el=>el.onchange=()=>run(async()=>{const result=await sb.rpc("update_guild_task_collaboration",{p_task_id:el.dataset.status,p_status:el.value,p_responsible_user_id:null,p_set_responsible:false,p_evidence:null,p_set_evidence:false});if(result.error)throw result.error;await logAction(el.dataset.status,`Alterou a situação da tarefa para ${labelStatus(el.value)}.`)}));
   host.querySelectorAll("[data-responsible]").forEach(el=>el.onchange=()=>run(async()=>{const result=await sb.rpc("update_guild_task_collaboration",{p_task_id:el.dataset.responsible,p_status:null,p_responsible_user_id:el.value||null,p_set_responsible:true,p_evidence:null,p_set_evidence:false});if(result.error)throw result.error;await logAction(el.dataset.responsible,`Atualizou o responsável para ${el.value?name(el.value):"não atribuído"}.`)}));
   host.querySelectorAll("[data-contribute]").forEach(form=>form.onsubmit=e=>{e.preventDefault();const fd=new FormData(form);run(async()=>{const result=await sb.from("guild_task_contributions").insert({task_id:form.dataset.contribute,guild_id:guildId,author_id:session.user.id,summary:String(fd.get("summary")).trim(),evidence_url:String(fd.get("url")).trim()||null});if(result.error)throw result.error})});
  }
  await load();
  // Canal exclusivo por montagem: evita reutilizar um canal já inscrito em outro render.
  const channel=sb.channel("guild-mission-"+guildId+"-"+mission.id+"-"+Math.random().toString(36).slice(2));
  channel.on("postgres_changes",{event:"*",schema:"public",table:"guild_tasks",filter:"guild_id=eq."+guildId},()=>{if(!busy)load().catch(console.warn)});
  channel.on("postgres_changes",{event:"*",schema:"public",table:"guild_task_contributions",filter:"guild_id=eq."+guildId},()=>{if(!busy)load().catch(console.warn)});
  channel.subscribe();
  const focus=()=>{if(!document.hidden&&!busy)load().catch(console.warn)};
  window.addEventListener("focus",focus);
  const timer=setInterval(()=>{if(stopped||!host.isConnected){cleanup();return}if(!document.hidden&&!busy&&!host.querySelector("#gmCreate:focus-within"))load().catch(console.warn)},45000);
  cleanup=()=>{if(stopped)return;stopped=true;clearInterval(timer);window.removeEventListener("focus",focus);sb.removeChannel(channel)};
  if(activeBoards.get(root))activeBoards.set(root,cleanup);

 }catch(e){console.error("Kanban da missão:",e);host.innerHTML='<p>Não foi possível carregar o quadro da Guilda. Consulte as tarefas em <a href="guild.html">Guildas</a>.</p>'}
}
