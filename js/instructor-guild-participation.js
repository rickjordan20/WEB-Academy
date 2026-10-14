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
  if(collabResult.error)throw new Error("Consulta guild_task_collaborators: "+(collabResult.error.message||"falha")+(collabResult.error.code?" ["+collabResult.error.code+"]":""));
  const profiles=new Map((profilesResult.data||[]).map(p=>[p.id,p.full_name]));
  const collabs=collabResult.data||[];
  const statuses={todo:"A fazer",doing:"Em missão",review:"Em revisão",done:"Concluído"};
  container.innerHTML=guilds.map(g=>{
   const team=members.filter(m=>m.guild_id===g.id),work=tasks.filter(t=>t.guild_id===g.id);
   const rows=team.map(m=>{
    const authored=work.filter(t=>t.created_by===m.user_id);
    const assigned=work.filter(t=>t.responsible_user_id===m.user_id);
    const collaborative=work.filter(t=>collabs.some(c=>c.task_id===t.id&&c.user_id===m.user_id));
    const related=[...new Map([...authored,...assigned,...collaborative].map(t=>[t.id,t])).values()];
    const completed=related.filter(t=>t.status==="done").length;
    const evidence=related.filter(t=>String(t.evidence||"").trim()).length;
    return "<tr><td><b>"+esc(profiles.get(m.user_id)||"Estudante")+"</b><small>"+(m.role==="leader"?"Líder":"Integrante")+"</small></td><td>"+authored.length+"</td><td>"+assigned.length+"</td><td>"+collaborative.length+"</td><td>"+completed+"</td><td>"+evidence+"</td><td>"+(related.length?"<details><summary>Ver tarefas ("+related.length+")</summary><ul>"+related.map(t=>"<li><b>"+esc(t.title)+"</b> — "+esc(statuses[t.status]||t.status)+"; "+(t.created_by===m.user_id?"criou; ":"")+(t.responsible_user_id===m.user_id?"responsável; ":"")+(collabs.some(c=>c.task_id===t.id&&c.user_id===m.user_id)?"colaborador; ":"")+(String(t.evidence||"").trim()?"evidência registrada":"sem evidência")+"</li>").join("")+"</ul></details>":"Sem vínculo registrado")+"</td></tr>";
   }).join("");
   return "<section class='card instructor-section'><div class='section-heading'><div><p class='eyebrow'>Projeto Restaurante</p><h3>"+esc(g.name)+"</h3><p class='muted'>"+team.length+" integrante(s) • "+work.length+" tarefa(s) • "+work.filter(t=>t.status==="done").length+" concluída(s)</p></div></div><div class='table-wrap'><table class='admin-table'><thead><tr><th>Estudante</th><th>Criadas</th><th>Responsável</th><th>Colabora</th><th>Concluídas*</th><th>Com evidência*</th><th>Registros vinculados</th></tr></thead><tbody>"+(rows||"<tr><td colspan='7'>Nenhum integrante.</td></tr>")+"</tbody></table></div></section>";
  }).join("");
  const note=document.createElement("p");note.className="muted";note.textContent="* Contagem de tarefas relacionadas ao estudante, não de ações individuais comprovadas. Evidência e conclusão são atributos da tarefa compartilhada; não demonstram, isoladamente, autoria ou competência. A menção é definida pelo instrutor.";
  container.prepend(note);
 }catch(error){console.error("Acompanhamento das Guildas:",error);container.textContent="Não foi possível consultar os registros: "+(error.message||"erro desconhecido")+". Confira o esquema do Supabase conectado. Nenhum dado foi alterado."}
}
