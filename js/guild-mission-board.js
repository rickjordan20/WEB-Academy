import {getSupabase,getSession} from "./supabase-client.js";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const statuses=[["todo","A fazer"],["doing","Em andamento"],["review","Em revisão"],["done","Concluído"]];
const labelStatus=s=>statuses.find(x=>x[0]===s)?.[1]||s;
export async function mountGuildMissionBoard(root,mission,{readOnly=false}={}){
 if(mission.type!=="guild")return;
 const host=root.querySelector("#guildMissionBoard");if(!host)return;
 host.innerHTML='<p class="gm-loading">Carregando organização da Guilda...</p>';
 try{
  const sb=await getSupabase(),session=await getSession();if(!sb||!session){host.textContent="Entre na sua conta para consultar a equipe.";return}
  const member=await sb.from("guild_members").select("guild_id,role").eq("user_id",session.user.id).maybeSingle();
  if(member.error)throw member.error;if(!member.data){host.innerHTML='<p>Você ainda não participa de uma Guilda. <a href="guild.html">Acessar Guildas</a></p>';return}
  const guildId=member.data.guild_id,isLeader=member.data.role==="leader";
  const membersResult=await sb.from("guild_members").select("user_id,role").eq("guild_id",guildId);
  if(membersResult.error)throw membersResult.error;
  const members=membersResult.data||[];
  const profiles=await sb.from("profiles").select("id,full_name").in("id",members.map(x=>x.user_id));
  const names=new Map((profiles.data||[]).map(p=>[p.id,p.full_name||"Integrante"]));
  const name=id=>names.get(id)||"Integrante";
  const stamp=value=>new Date(value).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo",dateStyle:"short",timeStyle:"medium"});
  const logAction=async(taskId,summary)=>{const result=await sb.from("guild_task_contributions").insert({task_id:taskId,guild_id:guildId,author_id:session.user.id,summary});if(result.error)throw result.error};
  const blocks=(mission.steps||[]).map((step,i)=>({id:step.id,title:step.title||step.label||`Bloco ${i+1}`}));
  const blockTitle=t=>{const found=blocks.find(b=>t.description?.includes(`[Bloco: ${b.id}]`));return found?.title||"Tarefa da missão"};
  let tasks=[],contributions=[],busy=false,refreshing=false;
  async function load(){
   if(refreshing)return;refreshing=true;
   try{const a=await sb.from("guild_tasks").select("id,title,description,status,responsible_user_id,created_by,mission_id,phase").eq("guild_id",guildId).eq("mission_id",mission.id).order("created_at");
   if(a.error)throw a.error;tasks=a.data||[];
   if(tasks.length){const b=await sb.from("guild_task_contributions").select("id,task_id,author_id,summary,evidence_url,created_at").eq("guild_id",guildId).in("task_id",tasks.map(t=>t.id)).order("created_at",{ascending:false});if(b.error)throw b.error;contributions=b.data||[]}else contributions=[];
   render();}finally{refreshing=false}
  }
  function render(){
   host.innerHTML=`<div class="gm-heading"><div><p class="eyebrow">Trabalho colaborativo · ${esc(mission.id)}</p><h2>Quadro da Guilda · ${esc(name(session.user.id))}</h2><p>Equipe identificada automaticamente. Distribua as atividades, registre sua participação e acompanhe as evidências da equipe.</p></div><a class="btn btn-secondary" href="guild.html">Abrir Guilda →</a></div>
   ${isLeader&&!readOnly&&blocks.length?`<form id="gmCreate" class="gm-create"><label>Atividade do bloco<select name="block" required>${blocks.map(b=>`<option value="${esc(b.id)}">${esc(b.title)}</option>`).join("")}</select></label><label>Responsável<select name="responsible"><option value="">Não atribuído</option>${members.map(m=>`<option value="${esc(m.user_id)}">${esc(name(m.user_id))}</option>`).join("")}</select></label><button class="btn btn-primary" type="submit">Criar tarefa do bloco</button></form>`:""}
   ${isLeader&&!readOnly&&!blocks.length?'<p class="gm-empty">O instrutor ainda não cadastrou os blocos desta missão. O Kanban ficará pronto para distribuir as tarefas quando os blocos forem publicados.</p>':""}
   <div class="gm-log" role="status"><strong>Histórico compartilhado da missão</strong><p>Os registros abaixo são identificados por integrante, tarefa, data e horário de Brasília.</p>${contributions.slice(0,20).map(c=>`<p><b>${esc(name(c.author_id))}</b> · ${esc(tasks.find(t=>t.id===c.task_id)?.title||"Tarefa")} · <time>${stamp(c.created_at)}</time><span> — ${esc(c.summary)}</span></p>`).join("")||"<p>Sem atividades registradas até o momento.</p>"}</div><div class="gm-columns">${statuses.map(([status,title])=>`<section class="gm-column"><h3>${title} <span>${tasks.filter(t=>t.status===status).length}</span></h3>${tasks.filter(t=>t.status===status).map(t=>`<article class="gm-task"><strong>${esc(t.title)}</strong><small>${esc(blockTitle(t))}</small><p>Responsável: ${esc(t.responsible_user_id?name(t.responsible_user_id):"A definir")}</p>${!readOnly?`<label>Situação<select data-status="${esc(t.id)}" ${!(isLeader||t.responsible_user_id===session.user.id||t.created_by===session.user.id)?"disabled":""}>${statuses.map(([v,l])=>`<option value="${v}" ${v===t.status?"selected":""}>${l}</option>`).join("")}</select></label>`:""}${isLeader&&!readOnly?`<label>Distribuir para<select data-responsible="${esc(t.id)}"><option value="">Não atribuído</option>${members.map(m=>`<option value="${esc(m.user_id)}" ${m.user_id===t.responsible_user_id?"selected":""}>${esc(name(m.user_id))}</option>`).join("")}</select></label>`:""}<details><summary>Contribuições (${contributions.filter(c=>c.task_id===t.id).length})</summary>${contributions.filter(c=>c.task_id===t.id).map(c=>`<div class="gm-log"><b>${esc(name(c.author_id))}</b> <time>${stamp(c.created_at)}</time><p>${esc(c.summary)}</p>${c.evidence_url?`<a href="${esc(c.evidence_url)}" target="_blank" rel="noopener noreferrer">Ver evidência ↗</a>`:""}</div>`).join("")||"<p>Nenhuma contribuição registrada.</p>"}${!readOnly?`<form data-contribute="${esc(t.id)}"><label>O que você realizou?<textarea name="summary" required minlength="10" maxlength="3000" rows="2"></textarea></label><label>Link da evidência (opcional)<input name="url" type="url" placeholder="https://..."></label><button type="submit" class="btn btn-secondary">Registrar minha contribuição</button></form>`:""}</details></article>`).join("")||'<p class="gm-empty">Nenhuma tarefa nesta etapa.</p>'}</section>`).join("")}</div><p class="gm-footnote">Tarefa atribuída não comprova execução. O instrutor poderá consultar os registros individuais e suas evidências.</p><p id="gmFeedback" role="status"></p>`;
   const feedback=msg=>{const el=host.querySelector("#gmFeedback");if(el)el.textContent=msg};
   const run=async fn=>{if(busy)return;busy=true;try{await fn();await load()}catch(e){feedback("Não foi possível concluir: "+e.message)}finally{busy=false}};
   host.querySelector("#gmCreate")?.addEventListener("submit",e=>{e.preventDefault();const fd=new FormData(e.currentTarget),b=blocks.find(x=>x.id===fd.get("block"));if(!b)return;run(async()=>{const result=await sb.rpc("create_guild_manual_task",{p_guild_id:guildId,p_title:`${mission.id} · ${b.title}`,p_description:`[Bloco: ${b.id}] ${b.title} · Missão ${mission.id}`,p_phase:mission.phase,p_responsible_user_id:fd.get("responsible")||null});if(result.error)throw result.error;const id=result.data?.id;if(id){const update=await sb.from("guild_tasks").update({mission_id:mission.id,source:"mission"}).eq("id",id).eq("guild_id",guildId);if(update.error)throw update.error;await logAction(id,`Criou a tarefa no bloco ${b.title} e ${fd.get("responsible")?"atribuiu a "+name(fd.get("responsible")):"deixou sem responsável"}.`)}})});
   host.querySelectorAll("[data-status]").forEach(el=>el.onchange=()=>run(async()=>{const result=await sb.rpc("update_guild_task_collaboration",{p_task_id:el.dataset.status,p_status:el.value,p_responsible_user_id:null,p_set_responsible:false,p_evidence:null,p_set_evidence:false});if(result.error)throw result.error;await logAction(el.dataset.status,`Alterou a situação da tarefa para ${labelStatus(el.value)}.`)}));
   host.querySelectorAll("[data-responsible]").forEach(el=>el.onchange=()=>run(async()=>{const result=await sb.rpc("update_guild_task_collaboration",{p_task_id:el.dataset.responsible,p_status:null,p_responsible_user_id:el.value||null,p_set_responsible:true,p_evidence:null,p_set_evidence:false});if(result.error)throw result.error;await logAction(el.dataset.responsible,`Atualizou o responsável para ${el.value?name(el.value):"não atribuído"}.`)}));
   host.querySelectorAll("[data-contribute]").forEach(form=>form.onsubmit=e=>{e.preventDefault();const fd=new FormData(form);run(async()=>{const result=await sb.from("guild_task_contributions").insert({task_id:form.dataset.contribute,guild_id:guildId,author_id:session.user.id,summary:String(fd.get("summary")).trim(),evidence_url:String(fd.get("url")).trim()||null});if(result.error)throw result.error})});
  }
  await load();
  // A fonte dos registros é o banco; outros integrantes recebem atualizações sem limpar cache.
  const channel=sb.channel("guild-mission-"+guildId+"-"+mission.id)
   .on("postgres_changes",{event:"*",schema:"public",table:"guild_tasks",filter:"guild_id=eq."+guildId},()=>load().catch(console.warn))
   .on("postgres_changes",{event:"*",schema:"public",table:"guild_task_contributions",filter:"guild_id=eq."+guildId},()=>load().catch(console.warn))
   .subscribe();
  const focus=()=>{if(!document.hidden&&host.isConnected)load().catch(console.warn)};
  window.addEventListener("focus",focus);
  const timer=setInterval(()=>{if(host.isConnected&&!document.hidden)load().catch(console.warn);else if(!host.isConnected){clearInterval(timer);window.removeEventListener("focus",focus);sb.removeChannel(channel)}},15000);
 }catch(e){console.error("Kanban da missão:",e);host.innerHTML='<p>Não foi possível carregar o quadro da Guilda. Consulte as tarefas em <a href="guild.html">Guildas</a>.</p>'}
}
