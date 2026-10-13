import { getState } from "./storage.js";
import { ensureProjects,addEvidence,STATUS_LABEL } from "./projects.js";
import {getSupabase,getSession} from "./supabase-client.js";

const sb=await getSupabase(),session=await getSession();
if(!sb||!session){location.replace("auth.html");throw new Error("AUTH_REQUIRED")}
const root=document.querySelector("#guildRoot");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
let officialGuild=null,officialMembers=[],availableStudents=[],classRow=null,sharedTasks=[],guildTaskChannel=null;
const taskFromRow=t=>({...t,competencies:t.competencies||[],history:Array.isArray(t.history)?t.history:[]});
async function loadSharedTasks(){
 if(!officialGuild){sharedTasks=[];return}
 const {data,error}=await sb.from("guild_tasks").select("id,guild_id,title,description,phase,status,responsible,competencies,evidence,history,created_by,created_at,updated_at").eq("guild_id",officialGuild.id).order("created_at",{ascending:true});
 if(error)throw error;sharedTasks=(data||[]).map(taskFromRow);
}
async function seedSharedTasks(){
 if(!officialGuild||sharedTasks.length)return;
 const seeds=[
  {title:"Organizar ambiente do Projeto Restaurante",description:"Preparar estrutura inicial e fluxo de trabalho da Guilda.",phase:1,status:"todo",responsible:"",competencies:["I1","I6"]},
  {title:"Criar repositório da Guilda",description:"Registrar o repositório e identificar as contribuições individuais.",phase:1,status:"todo",responsible:"",competencies:["I6"]}
 ].map(t=>({...t,guild_id:officialGuild.id,evidence:"",history:[],created_by:session.user.id}));
 const {error}=await sb.from("guild_tasks").insert(seeds);if(error)throw error;await loadSharedTasks();
}
async function addSharedTask(data){
 const row={guild_id:officialGuild.id,title:data.title.trim(),description:data.description.trim(),phase:Number(data.phase)||1,status:"todo",responsible:data.responsible.trim(),competencies:[],evidence:"",history:[{from:null,to:"todo",at:new Date().toISOString(),responsible:data.responsible.trim()}],created_by:session.user.id};
 const {error}=await sb.from("guild_tasks").insert(row);if(error)throw error;await loadSharedTasks();render();
}
async function updateSharedTask(id,patch){
 const current=sharedTasks.find(t=>t.id===id);if(!current)return;
 const next={...patch,updated_at:new Date().toISOString()};
 if(patch.status&&patch.status!==current.status)next.history=[...(current.history||[]),{from:current.status,to:patch.status,at:new Date().toISOString(),responsible:patch.responsible??current.responsible??""}];
 const {error}=await sb.from("guild_tasks").update(next).eq("id",id).eq("guild_id",officialGuild.id);if(error)throw error;
 await loadSharedTasks();render();
}
function startGuildTaskRealtime(){
 if(guildTaskChannel){sb.removeChannel(guildTaskChannel);guildTaskChannel=null}
 if(!officialGuild)return;
 guildTaskChannel=sb.channel("guild-kanban-"+officialGuild.id).on("postgres_changes",{event:"*",schema:"public",table:"guild_tasks",filter:"guild_id=eq."+officialGuild.id},async()=>{try{await loadSharedTasks();render()}catch(e){console.warn("Kanban em tempo real indisponível:",e)}}).subscribe();
}

async function loadOfficialGuild(){
 const cm=await sb.from("class_members").select("class_id").eq("user_id",session.user.id).eq("status","active").maybeSingle();if(cm.error)throw cm.error;if(cm.data){const cr=await sb.from("classes").select("id").eq("id",cm.data.class_id).single();if(cr.error)throw cr.error;classRow=cr.data}
 const gm=await sb.from("guild_members").select("guild_id,role").eq("user_id",session.user.id).maybeSingle();
 if(gm.error)throw gm.error;
 if(!gm.data){officialGuild=null;officialMembers=[];if(classRow){const cms=await sb.from("class_members").select("user_id").eq("class_id",classRow.id).eq("status","active");if(cms.error)throw cms.error;const used=await sb.from("guild_members").select("user_id");if(used.error)throw used.error;const usedIds=new Set((used.data||[]).map(x=>x.user_id));const ids=(cms.data||[]).map(x=>x.user_id).filter(id=>!usedIds.has(id)&&id!==session.user.id);if(ids.length){const ps=await sb.from("profiles").select("id,full_name").in("id",ids);if(ps.error)throw ps.error;availableStudents=ps.data||[]}}return}
 const gr=await sb.from("guilds").select("id,name,repository").eq("id",gm.data.guild_id).single();if(gr.error)throw gr.error;
 officialGuild={...gr.data,role:gm.data.role};
 const members=await sb.from("guild_members").select("user_id,role").eq("guild_id",gm.data.guild_id);if(members.error)throw members.error;
 const ids=(members.data||[]).map(x=>x.user_id);let profiles=[];
 if(ids.length){const pr=await sb.from("profiles").select("id,full_name").in("id",ids);if(pr.error)throw pr.error;profiles=pr.data||[]}
 officialMembers=(members.data||[]).map(m=>({...m,name:profiles.find(p=>p.id===m.user_id)?.full_name||"Estudante"}));
 availableStudents=[];if(officialGuild.role==="leader"&&classRow){const cms=await sb.from("class_members").select("user_id").eq("class_id",classRow.id).eq("status","active");if(cms.error)throw cms.error;const candidateIds=(cms.data||[]).map(x=>x.user_id).filter(id=>id!==session.user.id);let usedIds=new Set();if(candidateIds.length){const used=await sb.from("guild_members").select("user_id").in("user_id",candidateIds);if(used.error)throw used.error;usedIds=new Set((used.data||[]).map(x=>x.user_id))}const free=candidateIds.filter(id=>!usedIds.has(id));if(free.length){const ps=await sb.from("profiles").select("id,full_name").in("id",free);if(ps.error)throw ps.error;availableStudents=ps.data||[]}}
}

async function createGuild(e){e.preventDefault();const form=e.currentTarget,fd=new FormData(form),fb=document.querySelector("#createGuildFeedback");try{if(!classRow)throw new Error("Turma não encontrada.");const name=String(fd.get("name")||"").trim(),repository=String(fd.get("repository")||"").trim();const created=await sb.from("guilds").insert({class_id:classRow.id,name,repository,created_by:session.user.id}).select("id").single();if(created.error)throw created.error;const leader=await sb.from("guild_members").insert({guild_id:created.data.id,user_id:session.user.id,role:"leader"});if(leader.error)throw leader.error;const members=fd.getAll("members");if(members.length){const added=await sb.from("guild_members").insert(members.map(user_id=>({guild_id:created.data.id,user_id,role:"member"})));if(added.error)throw added.error}await loadOfficialGuild();render()}catch(err){fb.textContent=err.message||"Não foi possível criar a Guilda.";fb.className="feedback error"}}

async function saveGuildSettings(e){e.preventDefault();const fd=new FormData(e.currentTarget),fb=document.querySelector("#manageGuildFeedback");try{const {error}=await sb.from("guilds").update({name:String(fd.get("name")||"").trim(),repository:String(fd.get("repository")||"").trim()}).eq("id",officialGuild.id);if(error)throw error;fb.textContent="Guilda atualizada.";fb.className="feedback success";await loadOfficialGuild();render()}catch(err){fb.textContent=err.message;fb.className="feedback error"}}
async function addGuildMember(id){const {error}=await sb.from("guild_members").insert({guild_id:officialGuild.id,user_id:id,role:"member"});if(error)alert(error.message);else{await loadOfficialGuild();render()}}
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
 const isLeader=officialGuild.role==="leader"; const memberList=officialMembers.map(m=>`<li><b>${esc(m.name)}</b> <span class="muted">${m.role==="leader"?"Líder":"Integrante"}</span>${isLeader&&m.user_id!==session.user.id?` <button class="btn btn-ghost btn-small" data-transfer="${m.user_id}">Tornar líder</button> <button class="btn btn-ghost btn-small" data-remove-member="${m.user_id}">Remover</button>`:""}</li>`).join(""); const availableList=availableStudents.map(s=>`<li><b>${esc(s.full_name)}</b> <button class="btn btn-secondary btn-small" data-add-member="${s.id}">Adicionar</button></li>`).join("")||"<li class='muted'>Nenhum estudante disponível.</li>";
 root.innerHTML=`<section class="project-summary"><article class="card project-card"><p class="eyebrow">Guilda — Equipe de Desenvolvimento</p><h2>⚔️ ${esc(officialGuild.name)}</h2><p><b>Integrantes oficiais</b></p><ul class="guild-member-list">${memberList}</ul><p><b>Repositório</b><br><span class="muted">${esc(officialGuild.repository||"Ainda não informado pelo instrutor")}</span></p><p class="muted">${isLeader?"Você é o líder desta Guilda e pode gerenciar a equipe.":"A equipe é gerenciada pelo líder da Guilda e pelo instrutor."}</p>${isLeader?`<details class="guild-management"><summary>Gerenciar Guilda</summary><form id="manageGuildForm" class="project-form compact"><input name="name" required value="${esc(officialGuild.name)}" placeholder="Nome da Guilda"><input name="repository" value="${esc(officialGuild.repository||"")}" placeholder="Repositório"><button class="btn btn-secondary">Salvar dados</button><p id="manageGuildFeedback" class="feedback"></p></form><h4>Estudantes disponíveis</h4><ul>${availableList}</ul><hr><h4>Excluir Guilda</h4><p class="muted">Disponível somente enquanto você for o único integrante e não houver progresso salvo no Kanban.</p><button type="button" class="btn btn-ghost" id="deleteOwnGuild">Excluir minha Guilda</button></details>`:""}</article><article class="card project-card"><p class="eyebrow">Projeto Restaurante</p><h2>${sharedTasks.length?Math.round(sharedTasks.filter(t=>t.status==="done").length/sharedTasks.length*100):0}%</h2><div class="progress"><i style="width:${sharedTasks.length?Math.round(sharedTasks.filter(t=>t.status==="done").length/sharedTasks.length*100):0}%"></i></div><p class="muted">Progresso do Quadro de Missões. A avaliação individual continua sendo responsabilidade do instrutor.</p></article></section>
<section class="card project-section"><div class="section-heading"><div><p class="eyebrow">Quadro de Missões</p><h2>Kanban da Guilda</h2></div></div><form id="taskForm" class="project-form compact"><input name="title" required placeholder="Nova tarefa"><input name="responsible" placeholder="Responsável"><input name="phase" type="number" min="1" max="14" value="1"><textarea name="description" required placeholder="Descrição da tarefa"></textarea><button class="btn btn-secondary">Adicionar ao quadro</button></form><div class="kanban">${["todo","doing","review","done"].map(st=>`<section class="kanban-column"><h3>${STATUS_LABEL[st]}</h3>${sharedTasks.filter(t=>t.status===st).map(t=>`<article class="task-card"><small>Fase ${t.phase} • ${esc((t.competencies||[]).join(", "))}</small><h4>${esc(t.title)}</h4><p>${esc(t.description)}</p><label>Responsável<input data-responsible="${t.id}" value="${esc(t.responsible)}"></label><label>Status<select data-status="${t.id}">${Object.entries(STATUS_LABEL).map(([v,l])=>`<option value="${v}" ${v===t.status?"selected":""}>${l}</option>`).join("")}</select></label><label>Evidência<input data-task-evidence="${t.id}" value="${esc(t.evidence||"")}" placeholder="Link ou registro"></label><small>${t.history?.length||0} alteração(ões) registrada(s)</small></article>`).join("")||"<p class='muted'>Sem tarefas.</p>"}</section>`).join("")}</div></section>
<section class="card project-section"><p class="eyebrow">Evidências individuais</p><h2>Minha contribuição</h2><form id="guildEvidence" class="project-form"><input name="title" required placeholder="O que você entregou?"><input name="link" placeholder="Link do commit, PR ou arquivo"><input name="phase" type="number" min="1" max="14" value="1"><textarea name="note" required placeholder="Descreva sua contribuição individual"></textarea><button class="btn btn-primary">Registrar contribuição</button></form><div class="evidence-list">${[...g.evidence].reverse().map(e=>`<article><b>${esc(e.title)}</b><span>Fase ${e.phase}</span><p>${esc(e.note)}</p>${e.link?`<small>${esc(e.link)}</small>`:""}</article>`).join("")||"<p class='muted'>Nenhuma contribuição registrada.</p>"}</div></section>`;
 if(isLeader){document.querySelector("#manageGuildForm").onsubmit=saveGuildSettings;document.querySelectorAll("[data-add-member]").forEach(b=>b.onclick=()=>addGuildMember(b.dataset.addMember));document.querySelectorAll("[data-remove-member]").forEach(b=>b.onclick=()=>removeGuildMember(b.dataset.removeMember));document.querySelectorAll("[data-transfer]").forEach(b=>b.onclick=()=>transferLeadership(b.dataset.transfer));const del=document.querySelector("#deleteOwnGuild");if(del)del.onclick=deleteOwnGuild}
 document.querySelector("#taskForm").onsubmit=async e=>{e.preventDefault();try{await addSharedTask(Object.fromEntries(new FormData(e.currentTarget)))}catch(err){alert(err.message||"Não foi possível adicionar a tarefa.")}};
 document.querySelector("#guildEvidence").onsubmit=e=>{e.preventDefault();addEvidence("guild",Object.fromEntries(new FormData(e.currentTarget)));render()};
 document.querySelectorAll("[data-status]").forEach(el=>el.onchange=async()=>{try{await updateSharedTask(el.dataset.status,{status:el.value})}catch(err){alert(err.message)}});
 document.querySelectorAll("[data-responsible]").forEach(el=>el.onchange=async()=>{try{await updateSharedTask(el.dataset.responsible,{responsible:el.value.trim()})}catch(err){alert(err.message)}});
 document.querySelectorAll("[data-task-evidence]").forEach(el=>el.onchange=async()=>{try{await updateSharedTask(el.dataset.taskEvidence,{evidence:el.value.trim()})}catch(err){alert(err.message)}});
}
try{await loadOfficialGuild();await loadSharedTasks();await seedSharedTasks();startGuildTaskRealtime();render()}catch(error){console.error(error);root.innerHTML="<section class='card project-section'><h2>Não foi possível carregar sua Guilda</h2><p class='muted'>Atualize a página. Se o problema continuar, informe ao instrutor.</p></section>"}

window.addEventListener("beforeunload",()=>{if(guildTaskChannel)sb.removeChannel(guildTaskChannel)});
