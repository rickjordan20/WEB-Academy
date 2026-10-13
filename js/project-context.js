import {getSupabase,getSession} from "./supabase-client.js";
export async function getMissionProjectContext(mission){
 try{
  const sb=await getSupabase(),session=await getSession();if(!sb||!session||!mission)return null;
  const cr=await sb.from("class_members").select("class_id").eq("user_id",session.user.id).eq("status","active").limit(1).maybeSingle();if(cr.error||!cr.data)return null;
  const pr=await sb.from("learning_projects").select("*").eq("class_id",cr.data.class_id).eq("slug",mission.project).eq("active",true).maybeSingle();if(pr.error||!pr.data)return null;
  const rr=await sb.from("project_requirements").select("*").eq("project_id",pr.data.id).eq("active",true).order("sort_order");if(rr.error)return null;
  const codes=new Set(mission.requirements||[]);
  return {project:pr.data,requirements:(rr.data||[]).filter(x=>codes.has(x.code)),competencies:mission.competencies||[]};
 }catch(error){console.warn("Contexto do projeto indisponível",error);return null}
}
export function renderProjectContext(ctx){
 if(!ctx)return "";
 const e=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
 return `<section class="card mission-project-brief"><div class="section-heading"><div><p class="eyebrow">Documento do projeto</p><h2>${e(ctx.project.name)}</h2></div><span class="pill">${ctx.project.project_type==="guided"?"PROJETO GUIADO":"PROJETO DA GUILDA"}</span></div><p><b>Objetivo:</b> ${e(ctx.project.objective)}</p><details><summary>Ver briefing completo</summary><div class="project-brief-grid"><p><b>Contexto</b><br>${e(ctx.project.context)}</p><p><b>Problema</b><br>${e(ctx.project.problem)}</p><p><b>Público-alvo</b><br>${e(ctx.project.target_audience)}</p><p><b>Escopo</b><br>${e(ctx.project.scope)}</p><p><b>Restrições</b><br>${e(ctx.project.constraints)}</p><p><b>Entregáveis</b><br>${e(ctx.project.deliverables)}</p></div></details><div class="mission-requirements"><p class="eyebrow">Requisitos e indicadores desta missão</p><div class="requirement-links">${(ctx.competencies||[]).map(i=>`<span>${e(i)}</span>`).join("")}</div>${ctx.requirements.length?ctx.requirements.map(r=>`<article class="mission-requirement"><div><span class="requirement-code">${e(r.code)}</span><b>${e(r.title)}</b></div><p>${e(r.description)}</p><ul>${(r.acceptance_criteria||[]).map(x=>`<li>${e(x)}</li>`).join("")}</ul></article>`).join(""):"<p class='muted'>Nenhum requisito foi vinculado a esta fase ainda.</p>"}</div></section>`;
}