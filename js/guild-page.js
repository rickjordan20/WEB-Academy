import "./cloud-bootstrap.js";
import { getState } from "./storage.js";
import { ensureProjects,addEvidence,STATUS_LABEL } from "./projects.js";
import {getSupabase,getSession} from "./supabase-client.js";
import { MISSIONS } from "../data/missions.js";

const sb=await getSupabase(),session=await getSession();
if(!sb||!session){location.replace("auth.html");throw new Error("AUTH_REQUIRED")}
const root=document.querySelector("#guildRoot");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
let officialGuild=null,officialMembers=[],availableStudents=[],classRow=null,sharedTasks=[],taskCollaboratorIds=new Set(),taskCollaborators=new Map(),guildTaskContributions=[],guildTaskChannel=null;
const canManageTask=t=>!!t&&(officialGuild?.role==="leader"||t.created_by===session.user.id);
const canContributeTask=t=>canManageTask(t)||t?.responsible_user_id===session.user.id||taskCollaboratorIds.has(t?.id);
const PROJECT_FUNCTIONS={not_defined:"Não definida",frontend:"Front-end",backend:"Back-end",database:"Banco de Dados",qa:"QA / Testes",fullstack:"Full Stack"};
const projectFunctionOptions=value=>Object.entries(PROJECT_FUNCTIONS).map(([v,l])=>`<option value="${v}" ${v===value?"selected":""}>${l}</option>`).join("");
const taskFromRow=t=>({...t,competencies:t.competencies||[],history:Array.isArray(t.history)?t.history:[]});
async function loadTaskContributions(){
 if(!officialGuild){guildTaskContributions=[];return}
 const {data,error}=await sb.from("guild_task_contributions").select("id,task_id,guild_id,author_id,summary,evidence_url,created_at").eq("guild_id",officialGuild.id).order("created_at",{ascending:false});
 if(error)throw error;
 const rows=data||[],ids=[...new Set(rows.map(r=>r.author_id))];let profiles=[];
 if(ids.length){const result=await sb.from("profiles").select("id,full_name").in("id",ids);if(result.error)throw result.error;profiles=result.data||[]}
 guildTaskContributions=rows.map(r=>({...r,author_name:profiles.find(p=>p.id===r.author_id)?.full_name||"Integrante"}));
}
async function addTaskContribution(taskId,form){
 const fd=new FormData(form),summary=String(fd.get("summary")||"").trim(),evidence_url=String(fd.get("evidence_url")||"").trim();
 if(!summary)throw new Error("Descreva brevemente o que você realizou.");
 if(evidence_url&&!/^https?:\/\//i.test(evidence_url))throw new Error("Informe um link iniciado por http:// ou https://.");
 const task=sharedTasks.find(t=>t.id===taskId);if(!task)throw new Error("Tarefa não encontrada.");
 const {error}=await sb.from("guild_task_contributions").insert({task_id:taskId,guild_id:officialGuild.id,author_id:session.user.id,summary,evidence_url:evidence_url||null});
 if(error)throw error;await loadTaskContributions();render();
}
async function loadSharedTasks(){
 if(!officialGuild){sharedTasks=[];taskCollaboratorIds=new Set();taskCollaborators=new Map();return}
 const {data,error}=await sb.from("guild_tasks").select("id,guild_id,title,description,phase,status,responsible,responsible_user_id,competencies,evidence,history,created_by,created_at,updated_at,mission_id,source").eq("guild_id",officialGuild.id).order("created_at",{ascending:true});
 if(error)throw error;sharedTasks=(data||[]).map(taskFromRow);
 taskCollaboratorIds=new Set();taskCollaborators=new Map();
 if(sharedTasks.length){
  const collaborators=await sb.from("guild_task_collaborators").select("task_id,user_id").in("task_id",sharedTasks.map(t=>t.id));
  if(collaborators.error)throw collaborators.error;
  for(const entry of collaborators.data||[]){
   if(!taskCollaborators.has(entry.task_id))taskCollaborators.set(entry.task_id,new Set());
   taskCollaborators.get(entry.task_id).add(entry.user_id);
   if(entry.user_id===session.user.id)taskCollaboratorIds.add(entry.task_id);
  }
 }
}
function releasedGuildMissions(){
 const state=getState(),unlocked=state?.journey?.unlockedMissions||[],completed=state?.journey?.completedMissions||[];
 const released=new Set([...unlocked,...completed]);
 return MISSIONS.filter(m=>m.type==="guild"&&released.has(m.id));
}
async function syncReleasedMissionTasks(){
 if(!officialGuild||officialGuild.role!=="leader")return;
 const released=releasedGuildMissions(),existing=new Set(sharedTasks.filter(t=>t.mission_id).map(t=>t.mission_id));
 const missing=released.filter(m=>!existing.has(m.id));
 if(!missing.length)return;
 for(const m of missing){
  const row={guild_id:officialGuild.id,mission_id:m.id,source:"mission",title:`${m.id} — ${m.subtitle}`,description:m.steps.find(s=>s.id===`g${m.phase}-mission`)?.instructions?.join(" • ")||`Missão da Guilda da Fase ${m.phase}.`,phase:m.phase,status:"todo",responsible:"",responsible_user_id:null,competencies:m.competencies||[],evidence:"",history:[{from:null,to:"todo",at:new Date().toISOString(),source:"mission-release"}],created_by:session.user.id};
  const {error}=await sb.from("guild_tasks").insert(row);if(error&&error.code!=="23505")throw error;
 }
 await loadSharedTasks();
}
const memberName=id=>officialMembers.find(m=>m.user_id===id)?.name||"";
const responsibleOptions=value=>`<option value="">Sem responsável</option>`+officialMembers.map(m=>`<option value="${m.user_id}" ${m.user_id===value?"selected":""}>${esc(m.name)} — ${esc(PROJECT_FUNCTIONS[m.project_function]||PROJECT_FUNCTIONS.not_defined)}</option>`).join("");
async function addSharedTask(data){
 const responsible_user_id=data.responsible_user_id||null;
 const {error}=await sb.rpc("create_guild_manual_task",{p_guild_id:officialGuild.id,p_title:data.title.trim(),p_description:data.description.trim(),p_phase:Number(data.phase)||1,p_responsible_user_id:responsible_user_id});if(error)throw error;
 await loadSharedTasks();render();
}
async function deleteSharedTask(id){
 const task=sharedTasks.find(t=>t.id===id);if(!task)return;
 if(task.source==="mission"){alert("Cards de missões liberadas fazem parte da Jornada e não podem ser excluídos.");return}
 if(!canManageTask(task)){alert("Somente o líder ou o criador ativo pode excluir esta tarefa.");return}
 if(!confirm(`Excluir a tarefa "${task.title}" do quadro da Guilda?`))return;
 const {data,error}=await sb.from("guild_tasks").delete().eq("id",id).eq("guild_id",officialGuild.id).select("id");if(error)throw error;if(!data?.length)throw new Error("A tarefa não foi excluída. Verifique suas permissões.");
 await loadSharedTasks();render();
}
async function changeTaskCollaborator(taskId,userId,enabled){
 const task=sharedTasks.find(t=>t.id===taskId);
 if(!task||!canManageTask(task))throw new Error("Sem permissão para gerenciar colaboradores.");
 if(!officialMembers.some(m=>m.user_id===userId))throw new Error("Selecione um integrante da Guilda.");
 if(enabled){
  const {error}=await sb.from("guild_task_collaborators").insert({task_id:taskId,user_id:userId});
  if(error&&error.code!=="23505")throw error;
 }else{
  const {error}=await sb.from("guild_task_collaborators").delete().eq("task_id",taskId).eq("user_id",userId);
  if(error)throw error;
 }
 await loadSharedTasks();render();
}
function closeTaskEditor(){document.querySelector("#taskEditModal")?.remove()}
function openTaskEditor(id){
 const task=sharedTasks.find(t=>t.id===id);if(!task)return;
 if(!canManageTask(task)){alert("Somente o líder ou o criador ativo pode editar esta tarefa.");return}
 if(task.source==="mission"){alert("O título, a descrição e a fase de uma missão liberada são definidos pela Jornada e não podem ser alterados aqui.");return}
 closeTaskEditor();
 document.body.insertAdjacentHTML("beforeend",`<div class="guild-modal-backdrop" id="taskEditModal"><section class="guild-task-modal" role="dialog" aria-modal="true" aria-labelledby="taskEditTitle"><div class="guild-task-modal-head"><div><p class="eyebrow">Quadro de Missões</p><h2 id="taskEditTitle">Editar tarefa</h2></div><button type="button" class="btn btn-ghost btn-small" data-close-task-editor aria-label="Fechar">Fechar</button></div><form id="taskEditForm" class="guild-task-edit-form"><label>Título<input name="title" required maxlength="140" value="${esc(task.title)}"></label><label>Descrição<textarea name="description" required rows="5">${esc(task.description)}</textarea></label><label>Fase da Jornada<input name="phase" type="number" min="1" max="14" required value="${task.phase}"></label><div class="guild-task-modal-actions"><button type="button" class="btn btn-ghost" data-close-task-editor>Cancelar</button><button type="submit" class="btn btn-primary">Salvar alterações</button></div><p id="taskEditFeedback" class="feedback" aria-live="polite"></p></form></section></div>`);
 const modal=document.querySelector("#taskEditModal"),form=document.querySelector("#taskEditForm"),feedback=document.querySelector("#taskEditFeedback");
 modal.querySelectorAll("[data-close-task-editor]").forEach(b=>b.onclick=closeTaskEditor);
 modal.onclick=e=>{if(e.target===modal)closeTaskEditor()};
 form.onsubmit=async e=>{e.preventDefault();const fd=new FormData(form),title=String(fd.get("title")||"").trim(),description=String(fd.get("description")||"").trim(),phase=Number(fd.get("phase"));if(!title||!description||!Number.isInteger(phase)||phase<1||phase>14){feedback.textContent="Preencha título, descrição e uma fase entre 1 e 14.";feedback.className="feedback error";return}const submit=form.querySelector('button[type="submit"]');submit.disabled=true;feedback.textContent="Salvando...";feedback.className="feedback";try{await updateSharedTask(id,{title,description,phase});closeTaskEditor()}catch(err){feedback.textContent=err.message||"Não foi possível salvar a tarefa.";feedback.className="feedback error";submit.disabled=false}};
}
async function updateSharedTask(id,patch){
 const current=sharedTasks.find(t=>t.id===id);if(!current)return;
 const collaborative=["status","responsible_user_id","responsible","evidence"];
 const structural=Object.keys(patch).some(k=>!collaborative.includes(k));
 if(structural){
  if(!canManageTask(current))throw new Error("Somente o líder ou o criador ativo pode editar a estrutura das tarefas.");
  if(current.source==="mission")throw new Error("A estrutura de uma missão liberada é definida pela Jornada.");
  const {error}=await sb.from("guild_tasks").update({...patch,updated_at:new Date().toISOString()}).eq("id",id).eq("guild_id",officialGuild.id);if(error)throw error;
 }else{
  if(!canContributeTask(current))throw new Error("Você não tem permissão para colaborar nesta tarefa.");
  if(Object.prototype.hasOwnProperty.call(patch,"responsible_user_id")&&!canManageTask(current))throw new Error("Somente gestores podem alterar o responsável.");
  const args={p_task_id:id,p_status:patch.status??null,p_responsible_user_id:patch.responsible_user_id??null,p_set_responsible:Object.prototype.hasOwnProperty.call(patch,"responsible_user_id"),p_evidence:patch.evidence??null,p_set_evidence:Object.prototype.hasOwnProperty.call(patch,"evidence")};
  const {error}=await sb.rpc("update_guild_task_collaboration",args);if(error)throw error;
 }
 await loadSharedTasks();render();
}
function startGuildTaskRealtime(){
 if(guildTaskChannel){sb.removeChannel(guildTaskChannel);guildTaskChannel=null}
 if(!officialGuild)return;
 guildTaskChannel=sb.channel("guild-kanban-"+officialGuild.id).on("postgres_changes",{event:"*",schema:"public",table:"guild_tasks",filter:"guild_id=eq."+officialGuild.id},async()=>{try{await loadSharedTasks();render()}catch(e){console.warn("Kanban em tempo real indisponível:",e)}}).subscribe();
}

async function loadAvailableStudents(guildId=null){
 const {data,error}=await sb.rpc("get_available_guild_students",{p_guild_id:guildId});
 if(error)throw error;availableStudents=data||[];
}
async function loadOfficialGuild(){
 const cm=await sb.from("class_members").select("class_id").eq("user_id",session.user.id).eq("status","active").maybeSingle();
 if(cm.error)throw cm.error;
 if(cm.data){const cr=await sb.from("classes").select("id").eq("id",cm.data.class_id).single();if(cr.error)throw cr.error;classRow=cr.data}
 const gm=await sb.from("guild_members").select("guild_id,role").eq("user_id",session.user.id).maybeSingle();
 if(gm.error)throw gm.error;
 if(!gm.data){officialGuild=null;officialMembers=[];await loadAvailableStudents(null);return}
 const gr=await sb.from("guilds").select("id,name,repository").eq("id",gm.data.guild_id).single();if(gr.error)throw gr.error;
 officialGuild={...gr.data,role:gm.data.role};
 const members=await sb.from("guild_members").select("user_id,role,project_function").eq("guild_id",gm.data.guild_id);if(members.error)throw members.error;
 const ids=(members.data||[]).map(x=>x.user_id);let profiles=[];
 if(ids.length){const pr=await sb.from("profiles").select("id,full_name").in("id",ids);if(pr.error)throw pr.error;profiles=pr.data||[]}
 officialMembers=(members.data||[]).map(m=>({...m,name:profiles.find(p=>p.id===m.user_id)?.full_name||"Estudante"}));
 if(officialGuild.role==="leader")await loadAvailableStudents(officialGuild.id);else availableStudents=[];
}

async function createGuild(e){e.preventDefault();const form=e.currentTarget,fd=new FormData(form),fb=document.querySelector("#createGuildFeedback");try{if(!classRow)throw new Error("Turma não encontrada.");const name=String(fd.get("name")||"").trim(),repository=String(fd.get("repository")||"").trim();const created=await sb.from("guilds").insert({class_id:classRow.id,name,repository,created_by:session.user.id}).select("id").single();if(created.error)throw created.error;const leader=await sb.from("guild_members").insert({guild_id:created.data.id,user_id:session.user.id,role:"leader"});if(leader.error)throw leader.error;const members=fd.getAll("members");if(members.length){const added=await sb.from("guild_members").insert(members.map(user_id=>({guild_id:created.data.id,user_id,role:"member"})));if(added.error)throw added.error}await loadOfficialGuild();render()}catch(err){fb.textContent=err.message||"Não foi possível criar a Guilda.";fb.className="feedback error"}}

async function saveGuildSettings(e){e.preventDefault();const fd=new FormData(e.currentTarget),fb=document.querySelector("#manageGuildFeedback");try{const {error}=await sb.from("guilds").update({name:String(fd.get("name")||"").trim(),repository:String(fd.get("repository")||"").trim()}).eq("id",officialGuild.id);if(error)throw error;fb.textContent="Guilda atualizada.";fb.className="feedback success";await loadOfficialGuild();render()}catch(err){fb.textContent=err.message;fb.className="feedback error"}}
async function addGuildMember(id){const {error}=await sb.from("guild_members").insert({guild_id:officialGuild.id,user_id:id,role:"member",project_function:"not_defined"});if(error)alert(error.message);else{await loadOfficialGuild();render()}}
async function setMemberProjectFunction(id,value,select){
 const previous=officialMembers.find(m=>m.user_id===id)?.project_function||"not_defined";
 select.disabled=true;select.classList.add("is-saving");
 const status=select.closest(".guild-member-card")?.querySelector(".guild-function-status");
 if(status){status.textContent="Salvando...";status.className="guild-function-status is-saving"}
 const {data,error}=await sb.from("guild_members").update({project_function:value}).eq("guild_id",officialGuild.id).eq("user_id",id).select("project_function").single();
 if(error){select.value=previous;select.disabled=false;select.classList.remove("is-saving");if(status){status.textContent="Não foi possível salvar";status.className="guild-function-status is-error"}return}
 const saved=data?.project_function===value;
 select.disabled=false;select.classList.remove("is-saving");
 if(status){status.textContent=saved?"Salvo":"Não confirmado";status.className="guild-function-status "+(saved?"is-saved":"is-error")}
 const member=officialMembers.find(m=>m.user_id===id);if(member&&saved)member.project_function=value;
 const badge=select.closest(".guild-member-card")?.querySelector(".guild-function-badge");if(badge&&saved)badge.textContent=PROJECT_FUNCTIONS[value];
 setTimeout(()=>{if(status&&status.textContent==="Salvo")status.textContent=""},1800);
}
async function removeGuildMember(id){if(!confirm("Remover este integrante da Guilda?"))return;const {error}=await sb.from("guild_members").delete().eq("guild_id",officialGuild.id).eq("user_id",id);if(error)alert(error.message);else{await loadOfficialGuild();render()}}
async function transferLeadership(id){if(!confirm("Transferir a liderança? Você continuará como integrante."))return;const {error}=await sb.rpc("transfer_guild_leadership",{p_guild_id:officialGuild.id,p_new_leader:id});if(error)alert(error.message);else{await loadOfficialGuild();render()}}
async function deleteOwnGuild(){
 if(!officialGuild||officialGuild.role!=="leader")return;
 if(officialMembers.length>1){alert("Antes de excluir a Guilda, remova todos os demais integrantes.");return}
 const hasProgress=sharedTasks.some(t=>t.status!=="todo"||String(t.responsible||"").trim()||String(t.evidence||"").trim());
 if(hasProgress){alert("Esta Guilda já possui progresso salvo no Kanban e não pode ser excluída.");return}
 if(!confirm("Excluir sua Guilda? Esta opção só é permitida enquanto não houver outros integrantes nem progresso salvo."))return;
 const {error}=await sb.rpc("delete_own_empty_guild",{p_guild_id:officialGuild.id});
 if(error){alert(error.message||"Não foi possível excluir a Guilda.");return}
 if(guildTaskChannel){sb.removeChannel(guildTaskChannel);guildTaskChannel=null}
 officialGuild=null;officialMembers=[];sharedTasks=[];
 await loadOfficialGuild();render();
}

function render(){
 const s=ensureProjects(),g=s.guild;
 if(!officialGuild){const opts=availableStudents.map(s=>`<label><input type="checkbox" name="members" value="${s.id}"> ${esc(s.full_name)}</label>`).join("")||"<p class='muted'>Nenhum outro estudante disponível no momento.</p>";root.innerHTML=`<section class="card project-section"><p class="eyebrow">Guilda — Equipe de Desenvolvimento</p><h2>Crie sua Guilda</h2><p class="muted">Ao criar a equipe, você se torna o líder e pode gerenciar os integrantes. Só aparecem estudantes da turma que ainda não participam de outra Guilda.</p><form id="createGuildForm" class="project-form"><input name="name" required placeholder="Nome da Guilda"><input name="repository" placeholder="Repositório da equipe (opcional)"><fieldset class="member-picker"><legend>Convidar integrantes disponíveis</legend>${opts}</fieldset><p id="createGuildFeedback" class="feedback"></p><button class="btn btn-primary">Criar Guilda</button></form></section>`;document.querySelector("#createGuildForm").onsubmit=createGuild;return}
 const isLeader=officialGuild.role==="leader"; const memberList=officialMembers.map(m=>`<li class="guild-member-card"><div class="guild-member-main"><div class="guild-member-identity"><b>${esc(m.name)}</b><span class="guild-role-badge ${m.role==="leader"?"is-leader":""}">${m.role==="leader"?"Líder":"Integrante"}</span><span class="guild-function-badge">${esc(PROJECT_FUNCTIONS[m.project_function]||PROJECT_FUNCTIONS.not_defined)}</span></div>${isLeader?`<label class="guild-function-picker"><span>Função no projeto</span><select data-project-function="${m.user_id}">${projectFunctionOptions(m.project_function||"not_defined")}</select><small class="guild-function-status" aria-live="polite"></small></label>`:""}</div>${isLeader&&m.user_id!==session.user.id?`<div class="guild-member-actions"><button class="btn btn-ghost btn-small" data-transfer="${m.user_id}">Tornar líder</button><button class="btn btn-ghost btn-small" data-remove-member="${m.user_id}">Remover</button></div>`:""}</li>`).join(""); const availableList=availableStudents.map(s=>`<li><b>${esc(s.full_name)}</b> <button class="btn btn-secondary btn-small" data-add-member="${s.id}">Adicionar</button></li>`).join("")||"<li class='muted'>Nenhum estudante disponível.</li>";
 root.innerHTML=`<section class="project-summary"><article class="card project-card"><p class="eyebrow">Guilda — Equipe de Desenvolvimento</p><h2>⚔️ ${esc(officialGuild.name)}</h2><p><b>Integrantes oficiais</b></p><ul class="guild-member-list">${memberList}</ul><p><b>Repositório</b><br><span class="muted">${esc(officialGuild.repository||"Ainda não informado pelo instrutor")}</span></p><p class="muted">${isLeader?"Você é o líder desta Guilda e pode gerenciar a equipe.":"A equipe é gerenciada pelo líder da Guilda e pelo instrutor."}</p>${isLeader?`<details class="guild-management"><summary>Gerenciar Guilda</summary><form id="manageGuildForm" class="project-form compact"><input name="name" required value="${esc(officialGuild.name)}" placeholder="Nome da Guilda"><input name="repository" value="${esc(officialGuild.repository||"")}" placeholder="Repositório"><button class="btn btn-secondary">Salvar dados</button><p id="manageGuildFeedback" class="feedback"></p></form><h4>Estudantes disponíveis</h4><ul>${availableList}</ul><hr><h4>Excluir Guilda</h4><p class="muted">Disponível somente enquanto você for o único integrante e não houver progresso salvo no Kanban.</p><button type="button" class="btn btn-ghost" id="deleteOwnGuild">Excluir minha Guilda</button></details>`:""}</article><article class="card project-card"><p class="eyebrow">Projeto Restaurante</p><h2>${sharedTasks.length?Math.round(sharedTasks.filter(t=>t.status==="done").length/sharedTasks.length*100):0}%</h2><div class="progress"><i style="width:${sharedTasks.length?Math.round(sharedTasks.filter(t=>t.status==="done").length/sharedTasks.length*100):0}%"></i></div><p class="muted">Progresso do Quadro de Missões. A avaliação individual continua sendo responsabilidade do instrutor.</p></article></section>
<section class="card project-section"><div class="section-heading"><div><p class="eyebrow">Quadro de Missões</p><h2>Kanban da Guilda</h2></div></div><form id="taskForm" class="project-form compact" ${isLeader?"":"hidden"}><input name="title" required placeholder="Nova tarefa"><select name="responsible_user_id" aria-label="Responsável"><option value="">Sem responsável</option>${officialMembers.map(m=>`<option value="${m.user_id}">${esc(m.name)} — ${esc(PROJECT_FUNCTIONS[m.project_function]||PROJECT_FUNCTIONS.not_defined)}</option>`).join("")}</select><input name="phase" type="number" min="1" max="14" value="1"><textarea name="description" required placeholder="Descrição da tarefa"></textarea><button class="btn btn-secondary">Adicionar ao quadro</button></form><div class="kanban">${["todo","doing","review","done"].map(st=>`<section class="kanban-column"><h3>${STATUS_LABEL[st]}</h3>${sharedTasks.filter(t=>t.status===st).map(t=>`<article class="task-card"><small>Fase ${t.phase}${t.mission_id?` • ${esc(t.mission_id)} • Missão liberada`:" • Tarefa da Guilda"}${t.competencies?.length?` • ${esc(t.competencies.join(", "))}`:""}</small><h4>${esc(t.title)}</h4><p>${esc(t.description)}</p><label>Responsável<select data-responsible="${t.id}" ${canManageTask(t)?"":"disabled title=\"Somente gestores podem alterar o responsável\""}>${responsibleOptions(t.responsible_user_id||"")}</select></label><label>Status<select data-status="${t.id}" ${canContributeTask(t)?"":"disabled"}>${Object.entries(STATUS_LABEL).map(([v,l])=>`<option value="${v}" ${v===t.status?"selected":""}>${l}</option>`).join("")}</select></label><label>Evidência<input data-task-evidence="${t.id}" ${canContributeTask(t)?"":"disabled"} value="${esc(t.evidence||"")}" placeholder="Link ou registro"></label><small>${t.history?.length||0} alteração(ões) de status registrada(s)</small><details class="task-contribution-details"><summary>Contribuições individuais (${guildTaskContributions.filter(c=>c.task_id===t.id).length})</summary><div class="task-contribution-list">${guildTaskContributions.filter(c=>c.task_id===t.id).map(c=>`<article class="task-contribution"><b>${esc(c.author_name)}</b><small>${new Date(c.created_at).toLocaleString("pt-BR")}</small><p>${esc(c.summary)}</p>${c.evidence_url?`<a href="${esc(c.evidence_url)}" target="_blank" rel="noopener noreferrer">Abrir evidência</a>`:""}</article>`).join("")||"<p class=\"muted\">Nenhuma contribuição registrada nesta tarefa.</p>"}</div><form class="task-contribution-form" data-task-contribution="${t.id}"><label>O que você realizou?<textarea name="summary" required rows="2" maxlength="1200" placeholder="Descreva sua contribuição individual"></textarea></label><label>Link da evidência (opcional)<input name="evidence_url" type="url" placeholder="https://..."></label><button class="btn btn-secondary btn-small" type="submit">Registrar contribuição</button><p class="feedback" data-contribution-feedback aria-live="polite"></p></form></details>${canManageTask(t)?`<details class="task-collaborators"><summary>Colaboradores (${taskCollaborators.get(t.id)?.size||0})</summary>${officialMembers.map(m=>`<label style="display:block"><input type="checkbox" data-task-collaborator="${t.id}" data-user-id="${m.user_id}" ${taskCollaborators.get(t.id)?.has(m.user_id)?"checked":""}> ${esc(m.name)}</label>`).join("")}</details>`:""}${canManageTask(t)&&t.source!=="mission"?`<div class="task-card-actions"><button type="button" class="btn btn-ghost btn-small" data-edit-task="${t.id}">Editar</button><button type="button" class="btn btn-ghost btn-small" data-delete-task="${t.id}">Excluir</button></div>`:""}</article>`).join("")||"<p class='muted'>Sem tarefas.</p>"}</section>`).join("")}</div></section>
<section class="card project-section"><p class="eyebrow">Evidências individuais</p><h2>Minha contribuição</h2><form id="guildEvidence" class="project-form"><input name="title" required placeholder="O que você entregou?"><input name="link" placeholder="Link do commit, PR ou arquivo"><input name="phase" type="number" min="1" max="14" value="1"><textarea name="note" required placeholder="Descreva sua contribuição individual"></textarea><button class="btn btn-primary">Registrar contribuição</button></form><div class="evidence-list">${[...g.evidence].reverse().map(e=>`<article><b>${esc(e.title)}</b><span>Fase ${e.phase}</span><p>${esc(e.note)}</p>${e.link?`<small>${esc(e.link)}</small>`:""}</article>`).join("")||"<p class='muted'>Nenhuma contribuição registrada.</p>"}</div></section>`;
 if(isLeader){document.querySelector("#manageGuildForm").onsubmit=saveGuildSettings;document.querySelectorAll("[data-add-member]").forEach(b=>b.onclick=()=>addGuildMember(b.dataset.addMember));document.querySelectorAll("[data-remove-member]").forEach(b=>b.onclick=()=>removeGuildMember(b.dataset.removeMember));document.querySelectorAll("[data-transfer]").forEach(b=>b.onclick=()=>transferLeadership(b.dataset.transfer));document.querySelectorAll("[data-project-function]").forEach(el=>el.onchange=()=>setMemberProjectFunction(el.dataset.projectFunction,el.value,el));const del=document.querySelector("#deleteOwnGuild");if(del)del.onclick=deleteOwnGuild}
 document.querySelector("#taskForm").onsubmit=async e=>{e.preventDefault();try{await addSharedTask(Object.fromEntries(new FormData(e.currentTarget)))}catch(err){alert(err.message||"Não foi possível adicionar a tarefa.")}};
 document.querySelector("#guildEvidence").onsubmit=e=>{e.preventDefault();addEvidence("guild",Object.fromEntries(new FormData(e.currentTarget)));render()};
 document.querySelectorAll("[data-status]").forEach(el=>el.onchange=async()=>{try{await updateSharedTask(el.dataset.status,{status:el.value})}catch(err){alert(err.message)}});
 document.querySelectorAll("[data-responsible]").forEach(el=>el.onchange=async()=>{try{const uid=el.value||null;await updateSharedTask(el.dataset.responsible,{responsible_user_id:uid,responsible:uid?memberName(uid):""})}catch(err){alert(err.message)}});
 document.querySelectorAll("[data-task-collaborator]").forEach(el=>el.onchange=async()=>{el.disabled=true;try{await changeTaskCollaborator(el.dataset.taskCollaborator,el.dataset.userId,el.checked)}catch(err){alert(err.message||"Não foi possível alterar o colaborador.");await loadSharedTasks();render()}});
 document.querySelectorAll("[data-edit-task]").forEach(el=>el.onclick=async()=>{try{openTaskEditor(el.dataset.editTask)}catch(err){alert(err.message||"Não foi possível editar a tarefa.")}});
 document.querySelectorAll("[data-delete-task]").forEach(el=>el.onclick=async()=>{try{await deleteSharedTask(el.dataset.deleteTask)}catch(err){alert(err.message||"Não foi possível excluir a tarefa.")}});
 document.querySelectorAll("[data-task-evidence]").forEach(el=>el.onchange=async()=>{try{await updateSharedTask(el.dataset.taskEvidence,{evidence:el.value.trim()})}catch(err){alert(err.message)}});
 document.querySelectorAll("[data-task-contribution]").forEach(form=>form.onsubmit=async e=>{e.preventDefault();const feedback=form.querySelector("[data-contribution-feedback]"),button=form.querySelector("button[type=submit");button.disabled=true;feedback.textContent="Salvando contribuição...";feedback.className="feedback";try{await addTaskContribution(form.dataset.taskContribution,form)}catch(err){feedback.textContent=err.message||"Não foi possível registrar a contribuição.";feedback.className="feedback error";button.disabled=false}});
}
try{await loadOfficialGuild();await loadSharedTasks();await loadTaskContributions();await syncReleasedMissionTasks();startGuildTaskRealtime();render()}catch(error){console.error(error);root.innerHTML="<section class='card project-section'><h2>Não foi possível carregar sua Guilda</h2><p class='muted'>Atualize a página. Se o problema continuar, informe ao instrutor.</p></section>"}

window.addEventListener("beforeunload",()=>{if(guildTaskChannel)sb.removeChannel(guildTaskChannel)});
