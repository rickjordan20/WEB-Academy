import { getState } from "./storage.js";
import { ensureProjects,addEvidence,addTask,updateTask,STATUS_LABEL } from "./projects.js";
import {getSupabase,getSession} from "./supabase-client.js";

const sb=await getSupabase(),session=await getSession();
if(!sb||!session){location.replace("auth.html");throw new Error("AUTH_REQUIRED")}
const root=document.querySelector("#guildRoot");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
let officialGuild=null,officialMembers=[];

async function loadOfficialGuild(){
 const gm=await sb.from("guild_members").select("guild_id,role").eq("user_id",session.user.id).maybeSingle();
 if(gm.error)throw gm.error;
 if(!gm.data){officialGuild=null;officialMembers=[];return}
 const gr=await sb.from("guilds").select("id,name,repository").eq("id",gm.data.guild_id).single();if(gr.error)throw gr.error;
 officialGuild={...gr.data,role:gm.data.role};
 const members=await sb.from("guild_members").select("user_id,role").eq("guild_id",gm.data.guild_id);if(members.error)throw members.error;
 const ids=(members.data||[]).map(x=>x.user_id);let profiles=[];
 if(ids.length){const pr=await sb.from("profiles").select("id,full_name").in("id",ids);if(pr.error)throw pr.error;profiles=pr.data||[]}
 officialMembers=(members.data||[]).map(m=>({...m,name:profiles.find(p=>p.id===m.user_id)?.full_name||"Estudante"}));
}

function render(){
 const s=ensureProjects(),g=s.guild;
 if(!officialGuild){root.innerHTML=`<section class="card project-section"><p class="eyebrow">Guilda — Equipe de Desenvolvimento</p><h2>Você ainda não está em uma Guilda</h2><p class="muted">A composição das Guildas do Projeto Restaurante é definida pelo instrutor. Quando sua equipe for criada, ela aparecerá aqui automaticamente.</p></section>`;return}
 const memberList=officialMembers.map(m=>`<li><b>${esc(m.name)}</b> <span class="muted">${m.role==="leader"?"Líder":"Integrante"}</span></li>`).join("");
 root.innerHTML=`<section class="project-summary"><article class="card project-card"><p class="eyebrow">Guilda — Equipe de Desenvolvimento</p><h2>⚔️ ${esc(officialGuild.name)}</h2><p><b>Integrantes oficiais</b></p><ul class="guild-member-list">${memberList}</ul><p><b>Repositório</b><br><span class="muted">${esc(officialGuild.repository||"Ainda não informado pelo instrutor")}</span></p><p class="muted">A composição da equipe é gerenciada pelo instrutor.</p></article><article class="card project-card"><p class="eyebrow">Projeto Restaurante</p><h2>${g.progress||0}%</h2><div class="progress"><i style="width:${g.progress||0}%"></i></div><p class="muted">Progresso do Quadro de Missões. A avaliação individual continua sendo responsabilidade do instrutor.</p></article></section>
<section class="card project-section"><div class="section-heading"><div><p class="eyebrow">Quadro de Missões</p><h2>Kanban da Guilda</h2></div></div><form id="taskForm" class="project-form compact"><input name="title" required placeholder="Nova tarefa"><input name="responsible" placeholder="Responsável"><input name="phase" type="number" min="1" max="14" value="1"><textarea name="description" required placeholder="Descrição da tarefa"></textarea><button class="btn btn-secondary">Adicionar ao quadro</button></form><div class="kanban">${["todo","doing","review","done"].map(st=>`<section class="kanban-column"><h3>${STATUS_LABEL[st]}</h3>${g.tasks.filter(t=>t.status===st).map(t=>`<article class="task-card"><small>Fase ${t.phase} • ${esc((t.competencies||[]).join(", "))}</small><h4>${esc(t.title)}</h4><p>${esc(t.description)}</p><label>Responsável<input data-responsible="${t.id}" value="${esc(t.responsible)}"></label><label>Status<select data-status="${t.id}">${Object.entries(STATUS_LABEL).map(([v,l])=>`<option value="${v}" ${v===t.status?"selected":""}>${l}</option>`).join("")}</select></label><label>Evidência<input data-task-evidence="${t.id}" value="${esc(t.evidence||"")}" placeholder="Link ou registro"></label><small>${t.history?.length||0} alteração(ões) registrada(s)</small></article>`).join("")||"<p class='muted'>Sem tarefas.</p>"}</section>`).join("")}</div></section>
<section class="card project-section"><p class="eyebrow">Evidências individuais</p><h2>Minha contribuição</h2><form id="guildEvidence" class="project-form"><input name="title" required placeholder="O que você entregou?"><input name="link" placeholder="Link do commit, PR ou arquivo"><input name="phase" type="number" min="1" max="14" value="1"><textarea name="note" required placeholder="Descreva sua contribuição individual"></textarea><button class="btn btn-primary">Registrar contribuição</button></form><div class="evidence-list">${[...g.evidence].reverse().map(e=>`<article><b>${esc(e.title)}</b><span>Fase ${e.phase}</span><p>${esc(e.note)}</p>${e.link?`<small>${esc(e.link)}</small>`:""}</article>`).join("")||"<p class='muted'>Nenhuma contribuição registrada.</p>"}</div></section>`;
 document.querySelector("#taskForm").onsubmit=e=>{e.preventDefault();addTask(Object.fromEntries(new FormData(e.currentTarget)));render()};
 document.querySelector("#guildEvidence").onsubmit=e=>{e.preventDefault();addEvidence("guild",Object.fromEntries(new FormData(e.currentTarget)));render()};
 document.querySelectorAll("[data-status]").forEach(el=>el.onchange=()=>{updateTask(el.dataset.status,{status:el.value});render()});
 document.querySelectorAll("[data-responsible]").forEach(el=>el.onchange=()=>{updateTask(el.dataset.responsible,{responsible:el.value.trim()});render()});
 document.querySelectorAll("[data-task-evidence]").forEach(el=>el.onchange=()=>{updateTask(el.dataset.taskEvidence,{evidence:el.value.trim()});render()});
}
try{await loadOfficialGuild();render()}catch(error){console.error(error);root.innerHTML="<section class='card project-section'><h2>Não foi possível carregar sua Guilda</h2><p class='muted'>Atualize a página. Se o problema continuar, informe ao instrutor.</p></section>"}
