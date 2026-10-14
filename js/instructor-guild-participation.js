// Visão pedagógica somente leitura: registros do Projeto Restaurante não atribuem menção automaticamente.
export async function renderGuildParticipation({sb,classId,container}){
 const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&quot;","'":"&#39;"}[c]));
 container.textContent="Carregando participação das Guildas...";
 try{
  const guildResult=await sb.from("guilds").select("id,name").eq("class_id",classId).order("name");
  if(guildResult.error)throw new Error("Consulta guilds: "+(guildResult.error.message||"falha"));
  const guilds=guildResult.data||[],ids=guilds.map(g=>g.id);
  if(!ids.length){container.innerHTML="<p class='muted'>Nenhuma Guilda cadastrada nesta turma.</p>";return}
  const [membersResult,tasksResult]=await Promise.all([
   sb.from("guild_members").select("guild_id,user_id,role").in("guild_id",ids),
   sb.from("guild_tasks").select("id,guild_id,title,status,created_by,responsible_user_id,evidence,updated_at,competencies").in("guild_id",ids)
  ]);
  if(membersResult.error)throw new Error("Consulta guild_members: "+(membersResult.error.message||"falha"));
  if(tasksResult.error)throw new Error("Consulta guild_tasks: "+(tasksResult.error.message||"falha")+(tasksResult.error.code?" ["+tasksResult.error.code+"]":""));
  const members=membersResult.data||[],tasks=tasksResult.data||[];
  const userIds=[...new Set(members.map(m=>m.user_id))];
  const taskIds=tasks.map(t=>t.id);
  const [profilesResult,collabResult]=await Promise.all([
   userIds.length?sb.from("profiles").select("id,full_name").in("id",userIds):Promise.resolve({data:[],error:null}),
   taskIds.length?sb.from("guild_task_collaborators").select("task_id,user_id").in("task_id",taskIds):Promise.resolve({data:[],error:null})
  ]);
  if(profilesResult.error)throw new Error("Consulta profiles: "+(profilesResult.error.message||"falha"));
  const missingCollaborators=collabResult.error?.code==="PGRST205";
  if(collabResult.error&&!missingCollaborators)throw new Error("Consulta guild_task_collaborators: "+(collabResult.error.message||"falha")+(collabResult.error.code?" ["+collabResult.error.code+"]":""));
  const activityResult=await sb.from("guild_task_activity").select("id,task_id,guild_id,actor_id,action,details,occurred_at").in("guild_id",ids).order("occurred_at",{ascending:false}).limit(500);
  const auditUnavailable=activityResult.error?.code==="PGRST205";
  if(activityResult.error&&!auditUnavailable)throw new Error("Consulta guild_task_activity: "+activityResult.error.message);
  const activities=activityResult.data||[];
  const actorIds=[...new Set(activities.map(a=>a.actor_id).filter(Boolean))];
  const extraIds=actorIds.filter(id=>!userIds.includes(id));
  const extraProfiles=extraIds.length?await sb.from("profiles").select("id,full_name").in("id",extraIds):{data:[],error:null};
  if(extraProfiles.error)throw new Error("Consulta de autores: "+extraProfiles.error.message);
  const profiles=new Map([...(profilesResult.data||[]),...(extraProfiles.data||[])].map(p=>[p.id,p.full_name]));
  const collabs=missingCollaborators?[]:(collabResult.data||[]);
  const statuses={todo:"A fazer",doing:"Em missão",review:"Em revisão",done:"Concluído"};
  const eventLabels={created:"Criou a tarefa",status_changed:"Alterou o andamento",responsible_changed:"Alterou o responsável",evidence_changed:"Atualizou a evidência",collaborator_added:"Adicionou colaborador",collaborator_removed:"Removeu colaborador",deleted:"Excluiu a tarefa"};
  const taskTitles=new Map(tasks.map(t=>[t.id,t.title]));
  const when=value=>{const date=new Date(value);return Number.isNaN(date.getTime())?"Data indisponível":date.toLocaleString("pt-BR")};
  container.innerHTML=guilds.map(g=>{
   const team=members.filter(m=>m.guild_id===g.id),work=tasks.filter(t=>t.guild_id===g.id);
   const rows=team.map(m=>{
    const authored=work.filter(t=>t.created_by===m.user_id);
    const assigned=work.filter(t=>t.responsible_user_id===m.user_id);
    const collaborative=work.filter(t=>collabs.some(c=>c.task_id===t.id&&c.user_id===m.user_id));
    const related=[...new Map([...authored,...assigned,...collaborative].map(t=>[t.id,t])).values()];
    const completed=related.filter(t=>t.status==="done").length;
    const evidence=related.filter(t=>String(t.evidence||"").trim()).length;
    return "<tr><td><b>"+esc(profiles.get(m.user_id)||"Estudante")+"</b><small>"+(m.role==="leader"?"Líder":"Integrante")+"</small></td><td>"+authored.length+"</td><td>"+assigned.length+"</td><td>"+(missingCollaborators?"Indisponível":collaborative.length)+"</td><td>"+completed+"</td><td>"+evidence+"</td><td>"+(related.length?"<details><summary>Ver tarefas ("+related.length+")</summary><ul>"+related.map(t=>"<li><b>"+esc(t.title)+"</b> — "+esc(statuses[t.status]||t.status)+"; "+(t.created_by===m.user_id?"criou; ":"")+(t.responsible_user_id===m.user_id?"responsável; ":"")+(collabs.some(c=>c.task_id===t.id&&c.user_id===m.user_id)?"colaborador; ":"")+(String(t.evidence||"").trim()?"evidência registrada":"sem evidência")+"</li>").join("")+"</ul></details>":"Sem vínculo registrado")+"</td></tr>";
   }).join("");
   const events=activities.filter(a=>a.guild_id===g.id);
   const statusName=v=>statuses[v]||v||"—";
   const eventDetail=a=>a.action==="status_changed"?"De "+statusName(a.details?.from)+" para "+statusName(a.details?.to):a.action==="responsible_changed"?"Responsável alterado":a.action==="evidence_changed"?"Evidência atualizada":a.action==="collaborator_added"?"Colaborador incluído":a.action==="collaborator_removed"?"Colaborador removido":"";
   const timeline=auditUnavailable?"<p class='muted'>Histórico individual disponível após aplicar a migração de auditoria.</p>":events.length?"<ol class='guild-activity-list'>"+events.map(a=>"<li style='margin:0 0 .8rem;line-height:1.6'><div><b>"+esc(eventLabels[a.action]||a.action)+"</b> — "+esc(profiles.get(a.actor_id)||(a.actor_id?"Usuário não identificado":"Ação de sistema"))+"</div><div class='muted'>"+esc(when(a.occurred_at))+" · "+esc(taskTitles.get(a.task_id)||"Tarefa removida")+"</div>"+(eventDetail(a)?"<div class='muted'>"+esc(eventDetail(a))+"</div>":"")+"</li>").join("")+"</ol>":"<p class='muted'>Nenhuma ação registrada desde a ativação da auditoria.</p>";
   return "<section class='card instructor-section'><div class='section-heading'><div><p class='eyebrow'>Projeto Restaurante</p><h3>"+esc(g.name)+"</h3><p class='muted'>"+team.length+" integrante(s) • "+work.length+" tarefa(s) • "+work.filter(t=>t.status==="done").length+" concluída(s)</p></div></div><div class='table-wrap'><table class='admin-table'><thead><tr><th>Estudante</th><th>Criadas</th><th>Responsável</th><th>Colabora</th><th>Concluídas*</th><th>Com evidência*</th><th>Registros vinculados</th></tr></thead><tbody>"+(rows||"<tr><td colspan='7'>Nenhum integrante.</td></tr>")+"</tbody></table></div><details style='margin-top:1rem'><summary>Histórico de participação individual ("+events.length+")</summary><p class='muted'>Registro prospectivo das ações, sem atribuição automática de menções. Exibindo até 500 eventos recentes da turma.</p>"+timeline+"</details></section>";
  }).join("");
  const note=document.createElement("p");note.className="muted";note.textContent="* Contagem de tarefas relacionadas ao estudante, não de ações individuais comprovadas. Evidência e conclusão são atributos da tarefa compartilhada; não demonstram, isoladamente, autoria ou competência. A menção é definida pelo instrutor.";
  container.prepend(note);
  if(missingCollaborators){const warning=document.createElement("p");warning.className="muted";warning.textContent="Atenção: a tabela de colaboradores ainda não existe no Supabase conectado. Os vínculos de colaboração não são exibidos e as contagens de tarefas relacionadas podem estar incompletas. Nenhum dado foi alterado.";container.prepend(warning)}
 }catch(error){console.error("Acompanhamento das Guildas:",error);container.textContent="Não foi possível consultar os registros: "+(error.message||"erro desconhecido")+". Confira o esquema do Supabase conectado. Nenhum dado foi alterado."}
}
