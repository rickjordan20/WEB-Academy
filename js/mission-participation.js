import {getSupabase,getSession} from "./supabase-client.js";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export async function mountMissionParticipation(target,{missionId,classId=null,studentId=null,teacher=false}={}){
 if(!target||!missionId)return;
 target.innerHTML='<p class="muted">Consultando participação registrada...</p>';
 try{
  const sb=await getSupabase(),session=await getSession();if(!sb||!session)return;
  const uid=studentId||session.user.id;
  let guildId=null;
  const membership=await sb.from("guild_members").select("guild_id").eq("user_id",uid).maybeSingle();
  if(membership.error)throw membership.error;guildId=membership.data?.guild_id;
  if(!guildId){target.innerHTML='<p class="muted">Não há Guilda vinculada a este estudante.</p>';return}
  const taskQuery=sb.from("guild_tasks").select("id,title,status,responsible_user_id,mission_id").eq("guild_id",guildId).eq("mission_id",missionId);
  const {data:tasks,error:te}=await taskQuery;if(te)throw te;
  if(!tasks?.length){target.innerHTML='<p class="muted">Ainda não há tarefas vinculadas a esta missão. O líder poderá organizá-las no Kanban.</p>';return}
  const ids=tasks.map(t=>t.id);
  const [logs,team]=await Promise.all([sb.from("guild_task_contributions").select("id,task_id,author_id,summary,evidence_url,created_at").eq("guild_id",guildId).in("task_id",ids).order("created_at",{ascending:false}),sb.from("guild_members").select("user_id").eq("guild_id",guildId)]);
  if(logs.error)throw logs.error;if(team.error)throw team.error;
  const members=team.data||[],profiles=members.length?await sb.from("profiles").select("id,full_name").in("id",members.map(x=>x.user_id)):{data:[]};
  const names=new Map((profiles.data||[]).map(p=>[p.id,p.full_name||"Integrante"]));
  const taskMap=new Map(tasks.map(t=>[t.id,t]));
  const entries=(logs.data||[]).filter(x=>x.author_id===uid);
  const done=tasks.filter(t=>t.status==="done").length;
  const assigned=tasks.filter(t=>t.responsible_user_id===uid).length;
  target.innerHTML=`<div class="mp-head"><div><p class="eyebrow">Evidências de colaboração</p><h3>${teacher?"Participação individual do estudante":"Meu registro individual"}</h3></div><span class="mp-counter">${entries.length} contribuição(ões)</span></div><div class="mp-stats"><span><b>${tasks.length}</b> tarefas da missão</span><span><b>${done}</b> concluídas</span><span><b>${assigned}</b> atribuídas ao estudante</span></div><p class="muted">Atribuições e tarefas concluídas são informações de acompanhamento, não comprovação automática de aprendizagem.</p>${entries.length?`<div class="mp-entries">${entries.map(c=>`<article class="mp-entry"><div><strong>${esc(names.get(c.author_id)||"Integrante")}</strong><time>${new Date(c.created_at).toLocaleString("pt-BR")}</time></div><small>${esc(taskMap.get(c.task_id)?.title||"Tarefa")}</small><p>${esc(c.summary)}</p>${/^https?:\/\//i.test(c.evidence_url||"")?`<a href="${esc(c.evidence_url)}" target="_blank" rel="noopener noreferrer">Consultar evidência ↗</a>`:""}</article>`).join("")}</div>`:'<p class="muted">Nenhuma contribuição individual registrada nesta missão até o momento.</p>'}`;
 }catch(error){console.warn("Participação na missão:",error);target.innerHTML='<p class="muted">Não foi possível consultar as contribuições. Tente atualizar a página.</p>'}
}
