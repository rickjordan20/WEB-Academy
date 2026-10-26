import {getSupabase,getSession} from "./supabase-client.js";
const isFutureGuildMission=id=>/^(?:[3-9]|1[0-4])B$/.test(String(id||""))||/^(?:[4-9]|1[0-4])A$/.test(String(id||""));
const draftKey=(uid,id)=>"webacademy:guild-self-review:"+uid+":"+id;
function mountGuildSelfReview(target,uid,missionId,tasks=[],contributions=[]){
 if(!isFutureGuildMission(missionId))return;
 const key=draftKey(uid,missionId);let saved={};try{saved=JSON.parse(localStorage.getItem(key)||"{}")}catch{}
 const assigned=tasks.filter(t=>t.responsible_user_id===uid);
 const completed=assigned.filter(t=>t.status==="done").length;
 const taskEvidence=new Map();for(const c of contributions){if(c.evidence_url&&!taskEvidence.has(c.task_id))taskEvidence.set(c.task_id,c.evidence_url)}
 const section=document.createElement("section");section.className="card mp-self-review";
 const activities=["Desenvolvi artefatos (documentos, diagramas, protótipos)","Organizei e atualizei tarefas no Kanban","Contribuí com ideias e soluções","Realizei pesquisas e levantamento de informações","Ajudei colegas com dúvidas","Participei das reuniões do grupo","Fiz testes e validações","Outra contribuição"];
 section.innerHTML='<p class="eyebrow">Projeto Restaurante · Ficha individual</p><h3>Minha contribuição e autoavaliação</h3><p class="muted">Informações do Kanban carregadas automaticamente. As respostas são um rascunho local e não substituem a entrega oficial.</p>'+
 '<div class="mp-head"><strong>1 · Minhas tarefas no Kanban</strong><span class="mp-counter">'+completed+'/'+assigned.length+' concluídas</span></div>'+
 (assigned.length?'<div class="mp-entries">'+assigned.map(t=>'<article class="mp-entry"><strong>'+esc(t.title)+'</strong> · '+(t.status==="done"?"Concluída":esc(t.status))+(taskEvidence.has(t.id)?' · <a target="_blank" rel="noopener noreferrer" href="'+esc(taskEvidence.get(t.id))+'">Evidência</a>':'')+'</article>').join("")+'</div>':'<p class="muted">Nenhuma tarefa atribuída a você nesta missão.</p>')+
 '<form class="mp-self-form"><h4>2 · Minha participação no projeto</h4><p>Marque as atividades que realizou.</p><div class="mp-activities">'+activities.map((v,i)=>'<label style="display:inline-flex;align-items:center;gap:8px;margin:8px 14px 8px 0"><input type="checkbox" name="activity_'+i+'" value="yes">'+esc(v)+'</label>').join("")+'</div>'+
 '<h4>3 · Sobre minhas tarefas atribuídas</h4><p>'+completed+' de '+assigned.length+' tarefa(s) concluída(s), conforme o Kanban.</p><label>Como foi sua participação nas tarefas?<select name="taskReflection"><option value="">Selecione</option><option value="todas">Concluí todas</option><option value="maioria">Concluí a maioria</option><option value="algumas">Concluí algumas</option><option value="nenhuma">Não concluí</option></select></label>'+
 '<h4>4 · Autoavaliação da minha aprendizagem</h4><label>Meu nível de participação<select name="participation"><option value="">Selecione</option><option>Alta</option><option>Média</option><option>Baixa</option></select></label><label>Meu aprendizado<select name="learningLevel"><option value="">Selecione</option><option>Muito</option><option>Razoável</option><option>Pouco</option></select></label><label>Minha colaboração<select name="collaboration"><option value="">Selecione</option><option>Alta</option><option>Média</option><option>Baixa</option></select></label>'+
 '<h4>5 · Registre sua contribuição</h4><label>O que você fez?<textarea name="contribution" rows="4" maxlength="500" placeholder="Descreva suas principais contribuições"></textarea></label>'+
 '<h4>6 · Desafios e próximos passos</h4><label>Dificuldades e melhorias<textarea name="challenges" rows="4" maxlength="500"></textarea></label>'+
 '<h4>7 · Evidências complementares (opcional)</h4><label>Link de evidência<input name="evidence" type="url" placeholder="https://"></label>'+
 '<p class="muted">'+(assigned.length&&completed===assigned.length?"Todas as tarefas atribuídas estão concluídas.":"A entrega oficial exige a conclusão de todas as tarefas atribuídas.")+'</p>'+
 '<button class="btn btn-primary" type="submit">Salvar rascunho</button><p class="mp-save-status" role="status"></p></form>';
 target.append(section);const form=section.querySelector("form");
 for(const [k,v] of Object.entries(saved)){const field=form.elements.namedItem(k);if(field&&typeof v==="string"&&field.type!=="checkbox")field.value=v;else if(field&&field.type==="checkbox")field.checked=v==="yes"}
 form.addEventListener("submit",event=>{event.preventDefault();const data=Object.fromEntries(new FormData(form));for(let i=0;i<activities.length;i++)data["activity_"+i]=form.elements.namedItem("activity_"+i).checked?"yes":"no";
 if(data.evidence&&!/^https:\/\//i.test(data.evidence)){form.querySelector(".mp-save-status").textContent="Informe um link HTTPS válido.";return}
 try{localStorage.setItem(key,JSON.stringify({...data,savedAt:new Date().toISOString()}));form.querySelector(".mp-save-status").textContent="Rascunho salvo neste navegador. A entrega oficial continua sendo feita na missão."}catch{form.querySelector(".mp-save-status").textContent="Não foi possível salvar neste navegador."}
 });
}
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
  if(!guildId){target.innerHTML='<p class="muted">Não há Guilda vinculada a este estudante.</p>';if(!teacher)mountGuildSelfReview(target,uid,missionId,[]);return}
  const taskQuery=sb.from("guild_tasks").select("id,title,status,responsible_user_id,mission_id").eq("guild_id",guildId).eq("mission_id",missionId);
  const {data:tasks,error:te}=await taskQuery;if(te)throw te;
  if(!tasks?.length){target.innerHTML='<p class="muted">Ainda não há tarefas vinculadas a esta missão. O líder poderá organizá-las no Kanban.</p>';if(!teacher)mountGuildSelfReview(target,uid,missionId,tasks);return}
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
  if(!teacher)mountGuildSelfReview(target,uid,missionId,tasks,entries);
 }catch(error){console.warn("Participação na missão:",error);target.innerHTML='<p class="muted">Não foi possível consultar as contribuições. Tente atualizar a página.</p>'}
}
