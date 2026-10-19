import "./cloud-bootstrap.js";
import {getSupabase,getSession} from "./supabase-client.js";
import {MISSIONS} from "../data/missions.js";
const root=document.querySelector("#studentProjectsRoot");
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const params=new URLSearchParams(location.search);
let projects=[],requirements=[],links=[],selectedClass=null;
const typeName=p=>p.project_type==="guided"?"Projeto guiado":p.project_type==="guild"?"Projeto em equipe":"Projeto da turma";
const related=p=>MISSIONS.filter(m=>links.some(l=>l.project_id===p.id&&l.mission_id===m.id)||(!links.some(l=>l.mission_id===m.id)&&m.project===p.slug));
const fields=[["client_name","Cliente"],["context","Contexto"],["problem","Problema"],["target_audience","Público-alvo"],["objective","Objetivo"],["scope","Escopo"],["constraints","Restrições"],["deliverables","Entregáveis"]];
function renderCatalog(){
 root.innerHTML=`<div class="sp-overview"><span>${projects.length} projetos ativos</span><span>${requirements.length} requisitos cadastrados</span></div><div class="sp-catalog">${projects.map(p=>{const rs=requirements.filter(r=>r.project_id===p.id),ms=related(p);return `<a class="card sp-project" href="projects.html?id=${encodeURIComponent(p.id)}"><div class="sp-top"><span class="sp-icon">${p.project_type==="guided"?"🎓":p.project_type==="guild"?"⚔":"📁"}</span><span class="sp-type">${typeName(p)}</span></div><h2>${esc(p.name)}</h2><p>${esc(p.objective||p.context||"Consulte a proposta e os requisitos do projeto.")}</p><div class="sp-meta"><span>${rs.length} requisitos</span><span>${ms.length} missões vinculadas</span></div><span class="sp-action">Consultar projeto →</span></a>`}).join("")||'<section class="card project-section">Nenhum projeto ativo foi disponibilizado para esta turma.</section>'}</div>`;
}
function renderDetail(p){
 const rs=requirements.filter(r=>r.project_id===p.id),ms=related(p),isGuided=p.project_type==="guided",isGuild=p.project_type==="guild";
 const management=isGuided&&p.slug==="edutech"?'<a class="btn btn-primary" href="edutech.html">Gerenciar repositório e evidências →</a>':isGuild&&p.slug==="restaurante"?'<a class="btn btn-primary" href="guild.html">Abrir gestão da guilda e Kanban →</a>':"";
 root.innerHTML=`<a class="sp-back" href="projects.html">← Todos os projetos</a><section class="card sp-detail-head"><div class="sp-top"><span class="sp-icon">${isGuided?"🎓":isGuild?"⚔":"📁"}</span><span class="sp-type">${typeName(p)}</span></div><h2>${esc(p.name)}</h2><p>${esc(p.objective||p.context||"Projeto cadastrado pelo instrutor.")}</p><div class="sp-meta"><span>${rs.length} requisitos</span><span>${ms.length} missões</span></div>${management?'<div class="sp-management">'+management+'</div>':`<p class="sp-notice">A consulta está disponível. A edição dos requisitos oficiais é reservada ao instrutor. Ferramentas de gerenciamento são disponibilizadas apenas quando compatíveis com o tipo e o vínculo do projeto.</p>`}</section><div class="sp-sections"><section class="card sp-section"><h3>Documento do projeto</h3><div class="sp-fields">${fields.filter(([key])=>p[key]).map(([key,label])=>`<div><strong>${label}</strong><p>${esc(p[key])}</p></div>`).join("")}${p.technologies?.length?`<div><strong>Tecnologias</strong><p>${p.technologies.map(esc).join(" · ")}</p></div>`:""}</div></section><section class="card sp-section"><h3>Requisitos do projeto</h3><p class="sp-muted">Requisitos e critérios definidos pelo instrutor. Consulte cada item para orientar o desenvolvimento.</p><div class="sp-requirements">${rs.map(r=>`<details><summary><span class="sp-code">${esc(r.code)}</span> ${esc(r.title)} <small>${esc(r.requirement_type||"")}</small></summary><div class="sp-requirement-body"><p>${esc(r.description)}</p>${r.acceptance_criteria?.length?`<strong>Critérios de aceitação</strong><ul>${r.acceptance_criteria.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:""}${r.indicators?.length?`<p>Indicadores: ${r.indicators.map(esc).join(", ")}</p>`:""}</div></details>`).join("")||'<p>Não há requisitos ativos cadastrados.</p>'}</div></section><section class="card sp-section"><h3>Missões vinculadas</h3><p class="sp-muted">Acesse a atividade correspondente para consultar orientações, realizar tarefas e registrar entregas.</p><div class="sp-missions">${ms.map(m=>`<a href="mission.html?id=${encodeURIComponent(m.id)}"><strong>Missão ${esc(m.id)}</strong><span>${esc(m.title)}</span><span aria-hidden="true">↗</span></a>`).join("")||'<p>Nenhuma missão vinculada até o momento.</p>'}</div></section></div>`;
}
async function init(){
 try{
  const sb=await getSupabase(),session=await getSession();if(!sb||!session){location.replace("auth.html");return}
  const {data:members,error:me}=await sb.from("class_members").select("class_id").eq("user_id",session.user.id).eq("status","active");if(me)throw me;
  if(!members?.length){root.innerHTML='<section class="card project-section">Sua conta ainda não possui vínculo ativo com uma turma.</section>';return}
  const preferred=localStorage.getItem("webacademy.student.activeClass");
  selectedClass=(members.find(m=>m.class_id===preferred)||members[0]).class_id;
  const [pr,lr]=await Promise.all([sb.from("learning_projects").select("*").eq("class_id",selectedClass).eq("active",true).order("name"),sb.from("mission_curriculum_links").select("mission_id,project_id").eq("class_id",selectedClass)]);
  if(pr.error)throw pr.error;if(lr.error)throw lr.error;projects=pr.data||[];links=lr.data||[];
  if(projects.length){const rr=await sb.from("project_requirements").select("*").in("project_id",projects.map(p=>p.id)).eq("active",true).order("sort_order");if(rr.error)throw rr.error;requirements=rr.data||[]}
  const id=params.get("id");if(id){const p=projects.find(x=>x.id===id);if(!p){root.innerHTML='<section class="card project-section">Projeto indisponível ou não vinculado à sua turma. <a href="projects.html">Voltar aos projetos</a></section>';return}renderDetail(p)}else renderCatalog();
 }catch(error){console.error("Projetos:",error);root.innerHTML='<section class="card project-section">Não foi possível carregar os projetos. Atualize a página ou procure o instrutor.</section>'}
}
init();
