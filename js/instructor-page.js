import {getSupabase,getSession} from "./supabase-client.js";
const sb=await getSupabase(),session=await getSession();
if(!sb||!session){location.replace("auth.html");throw new Error("AUTH_REQUIRED")}
const meResult=await sb.from("profiles").select("id,full_name,role").eq("id",session.user.id).single();
if(meResult.error||meResult.data?.role!=="instructor"){location.replace("app.html");throw new Error("INSTRUCTOR_REQUIRED")}
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
let students=[],guilds=[],memberships=[],classRow=null,selectedGuildId=null,realtimeChannel=null,realtimeTimer=null,isReloading=false,reloadQueued=false;
async function load(){
 const cr=await sb.from("classes").select("id,code,name,uc").eq("instructor_id",session.user.id).eq("code","2026.36.8").single();if(cr.error)throw cr.error;classRow=cr.data;
 const mr=await sb.from("class_members").select("user_id,status").eq("class_id",classRow.id).eq("status","active");if(mr.error)throw mr.error;const ids=(mr.data||[]).map(x=>x.user_id);
 let profiles=[],states=[];if(ids.length){const pr=await sb.from("profiles").select("id,full_name,email").in("id",ids);if(pr.error)throw pr.error;profiles=pr.data||[];const sr=await sb.from("student_states").select("user_id,state,updated_at").in("user_id",ids);if(sr.error)throw sr.error;states=sr.data||[]}
 const gr=await sb.from("guilds").select("id,name,repository").eq("class_id",classRow.id).order("name");if(gr.error)throw gr.error;guilds=gr.data||[];
 memberships=[];const gids=guilds.map(g=>g.id);if(gids.length){const gmr=await sb.from("guild_members").select("guild_id,user_id,role").in("guild_id",gids);if(gmr.error)throw gmr.error;memberships=gmr.data||[]}
 students=profiles.map(p=>{const st=states.find(x=>x.user_id===p.id),m=memberships.find(x=>x.user_id===p.id),g=guilds.find(x=>x.id===m?.guild_id);return {...p,state:st?.state||null,updated_at:st?.updated_at||null,guild:g?.name||"—"}});
 $("#classTitle").textContent="Turma "+classRow.code;$("#classMeta").textContent=classRow.name+" • "+classRow.uc;render();
}

async function reloadFromRealtime(){
 if(isReloading){reloadQueued=true;return}
 isReloading=true;
 try{
  const openStudentId=$("#studentDialog")?.open?$("#studentDialog").dataset.studentId:null;
  await load();
  if(openStudentId)openStudent(openStudentId,{keepOpen:true});
  if(selectedGuildId&&$("#guildManageDialog")?.open)renderGuildManager();
 }catch(err){console.error("Falha ao atualizar dados em tempo real",err)}
 finally{isReloading=false;if(reloadQueued){reloadQueued=false;reloadFromRealtime()}}
}
function scheduleRealtimeReload(){clearTimeout(realtimeTimer);realtimeTimer=setTimeout(reloadFromRealtime,250)}
function startRealtime(){
 if(realtimeChannel||!classRow)return;
 realtimeChannel=sb.channel("instructor-dashboard-"+classRow.id)
  .on("postgres_changes",{event:"*",schema:"public",table:"student_states"},scheduleRealtimeReload)
  .on("postgres_changes",{event:"*",schema:"public",table:"guilds",filter:"class_id=eq."+classRow.id},scheduleRealtimeReload)
  .on("postgres_changes",{event:"*",schema:"public",table:"guild_members"},scheduleRealtimeReload)
  .on("postgres_changes",{event:"*",schema:"public",table:"class_members",filter:"class_id=eq."+classRow.id},scheduleRealtimeReload)
  .subscribe(status=>{const label=document.querySelector(".status-dot");if(!label)return;if(status==="SUBSCRIBED")label.innerHTML="<i></i> Tempo real";else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT")label.innerHTML="<i></i> Nuvem"})
}
window.addEventListener("beforeunload",()=>{if(realtimeChannel)sb.removeChannel(realtimeChannel)});

function evidenceCount(value){return Array.isArray(value)?value.length:(value&&typeof value==="object"?Object.keys(value).length:(value?1:0))}
function studentMetrics(s){const st=s.state||{},journey=st.journey||{};return {progress:Number(journey.progress||0),xp:Number(st.gamification?.xp||0),missions:(journey.completedMissions||[]).length,extras:(journey.completedExtras||st.extras?.completed||[]).length}}
function renderOverview(){
 const metrics=students.map(studentMetrics),total=students.length;
 const avg=total?Math.round(metrics.reduce((a,m)=>a+m.progress,0)/total):0;
 $("#classProgressBar").style.width=avg+"%";$("#classProgressLabel").textContent=avg+"%";
 $("#missionsDone").textContent=metrics.reduce((a,m)=>a+m.missions,0);$("#extrasDone").textContent=metrics.reduce((a,m)=>a+m.extras,0);$("#syncedCount").textContent=students.filter(s=>s.updated_at).length+"/"+total;
 const bands=[["Concluído",students.filter(s=>studentMetrics(s).progress===100).length],["Em andamento",students.filter(s=>{const p=studentMetrics(s).progress;return p>0&&p<100}).length],["Ainda não iniciou",students.filter(s=>studentMetrics(s).progress===0).length]];
 $("#progressBands").innerHTML=bands.map(([label,n])=>"<div class='band-row'><span>"+label+"</span><b>"+n+"</b><i style='--band:"+(total?Math.round(n/total*100):0)+"%'></i></div>").join("");
 const indicators=["I1","I2","I3","I4","I5","I6"];$("#competencyOverview").innerHTML=indicators.map(i=>{const count=students.reduce((sum,s)=>{const st=s.state||{},e=st.competencies?.evidence||st.competencies||{};return sum+evidenceCount(e[i])},0);return "<div class='competency-summary'><b>"+i+"</b><strong>"+count+"</strong><span>evidência(s)</span></div>"}).join("");
 const inGuild=students.filter(s=>s.guild!=="—").length,noGuild=total-inGuild;$("#studentsInGuilds").textContent=inGuild;$("#studentsWithoutGuild").textContent=noGuild;$("#guildCoverage").textContent=(total?Math.round(inGuild/total*100):0)+"%";
 $("#guildOverviewList").innerHTML=guilds.slice(0,4).map(g=>{const n=memberships.filter(m=>m.guild_id===g.id).length;return "<div class='overview-list-row'><span>⚔️ "+esc(g.name)+"</span><b>"+n+" integrante(s)</b></div>"}).join("")||"<p class='muted'>Nenhuma Guilda cadastrada.</p>";
 const ranked=[...students].sort((a,b)=>studentMetrics(b).progress-studentMetrics(a).progress||studentMetrics(b).xp-studentMetrics(a).xp).slice(0,5);
 $("#topStudents").innerHTML=ranked.map((s,i)=>{const m=studentMetrics(s);return "<button class='overview-list-row overview-student' data-overview-student='"+s.id+"'><span><i>"+(i+1)+"</i>"+esc(s.full_name)+"</span><b>"+m.progress+"% • "+m.xp+" XP</b></button>"}).join("")||"<p class='muted'>Nenhum estudante cadastrado.</p>";
 const attention=[...students].filter(s=>studentMetrics(s).progress===0||!s.updated_at).sort((a,b)=>studentMetrics(a).progress-studentMetrics(b).progress).slice(0,5);
 $("#attentionStudents").innerHTML=attention.map(s=>{const m=studentMetrics(s),reason=!s.updated_at?"Sem sincronização":"Jornada ainda não iniciada";return "<button class='overview-list-row overview-student' data-overview-student='"+s.id+"'><span>"+esc(s.full_name)+"<small>"+reason+"</small></span><b>"+m.progress+"%</b></button>"}).join("")||"<p class='muted'>Nenhuma pendência de acompanhamento identificada.</p>";
 document.querySelectorAll("[data-overview-student]").forEach(b=>b.onclick=()=>openStudent(b.dataset.overviewStudent));
}
function render(){const q=$("#studentSearch").value.trim().toLowerCase(),list=students.filter(s=>(s.full_name+" "+(s.email||"")).toLowerCase().includes(q));$("#studentCount").textContent=students.length;$("#guildCount").textContent=guilds.length;$("#avgProgress").textContent=students.length?Math.round(students.reduce((a,s)=>a+(s.state?.journey?.progress||0),0)/students.length)+"%":"0%";$("#avgXp").textContent=students.length?Math.round(students.reduce((a,s)=>a+(s.state?.gamification?.xp||0),0)/students.length):0;$("#studentRows").innerHTML=list.map(s=>"<tr><td><b>"+esc(s.full_name)+"</b><small>"+esc(s.email||"")+"</small></td><td>"+(s.state?.journey?.progress||0)+"%</td><td>"+(s.state?.gamification?.xp||0)+"</td><td>"+(s.state?.gamification?.level||1)+"</td><td>"+esc(s.guild)+"</td><td>"+(s.updated_at?new Date(s.updated_at).toLocaleString("pt-BR"):"Sem sincronização")+"</td><td><button type=\"button\" class=\"btn btn-secondary btn-small\" data-student=\""+s.id+"\">Ver detalhes</button></td></tr>").join("");$("#emptyStudents").hidden=!!list.length;document.querySelectorAll("[data-student]").forEach(b=>b.onclick=()=>openStudent(b.dataset.student));$("#guildCards").innerHTML=guilds.map(g=>{const ms=memberships.filter(m=>m.guild_id===g.id),leader=students.find(s=>s.id===ms.find(m=>m.role==="leader")?.user_id);return "<article class='card admin-guild-card'><div><p class='eyebrow'>"+ms.length+" integrante(s)</p><h3>⚔️ "+esc(g.name)+"</h3><p>"+esc(g.repository||"Repositório ainda não informado")+"</p><small>Líder: "+esc(leader?.full_name||"Não definido")+"</small></div><button type='button' class='btn btn-secondary btn-small' data-manage-guild='"+g.id+"'>Gerenciar equipe</button></article>"}).join("")||"<p class='muted'>Nenhuma Guilda cadastrada.</p>";document.querySelectorAll("[data-manage-guild]").forEach(b=>b.onclick=()=>openGuildManager(b.dataset.manageGuild));$("#memberOptions").innerHTML=students.filter(s=>s.guild==="—").map(s=>"<label><input type='checkbox' name='members' value='"+s.id+"'> "+esc(s.full_name)+"</label>").join("")||"<p class='muted'>Nenhum estudante disponível.</p>";renderOverview()}
function guildMemberRows(gid){const ms=memberships.filter(m=>m.guild_id===gid);return ms.map(m=>{const s=students.find(x=>x.id===m.user_id);return {id:m.user_id,role:m.role,name:s?.full_name||"Estudante"}})}
function renderGuildManager(){const g=guilds.find(x=>x.id===selectedGuildId);if(!g)return;const rows=guildMemberRows(g.id),leader=rows.find(x=>x.role==="leader");$("#manageGuildTitle").textContent=g.name;const form=$("#manageGuildForm");form.elements.name.value=g.name;form.elements.repository.value=g.repository||"";$("#manageGuildMembers").innerHTML=rows.map(m=>"<article class='guild-admin-member'><div><b>"+esc(m.name)+"</b><small>"+(m.role==="leader"?"Líder":"Integrante")+"</small></div><div class='guild-admin-actions'>"+(m.role!=="leader"?"<button class='btn btn-ghost btn-small' type='button' data-promote='"+m.id+"'>Tornar líder</button>":"")+"<button class='btn btn-ghost btn-small' type='button' data-admin-remove='"+m.id+"' "+(rows.length===1?"disabled":"")+">Remover</button></div></article>").join("")||"<p class='muted'>Nenhum integrante.</p>";const used=new Set(memberships.map(m=>m.user_id));const free=students.filter(s=>!used.has(s.id));$("#manageGuildAvailable").innerHTML=free.map(s=>"<article class='guild-admin-member'><b>"+esc(s.full_name)+"</b><button class='btn btn-secondary btn-small' type='button' data-admin-add='"+s.id+"'>Adicionar</button></article>").join("")||"<p class='muted'>Nenhum estudante sem Guilda.</p>";document.querySelectorAll("[data-admin-add]").forEach(b=>b.onclick=()=>adminAddMember(b.dataset.adminAdd));document.querySelectorAll("[data-admin-remove]").forEach(b=>b.onclick=()=>adminRemoveMember(b.dataset.adminRemove));document.querySelectorAll("[data-promote]").forEach(b=>b.onclick=()=>adminTransferLeader(b.dataset.promote))}
function openGuildManager(id){selectedGuildId=id;$("#manageGuildFeedback").textContent="";renderGuildManager();$("#guildManageDialog").showModal()}
async function refreshGuildManager(){await load();if(selectedGuildId&&$("#guildManageDialog").open)renderGuildManager()}
async function adminAddMember(userId){const {error}=await sb.from("guild_members").insert({guild_id:selectedGuildId,user_id:userId,role:"member"});if(error)return adminGuildError(error);await refreshGuildManager()}
async function adminRemoveMember(userId){const row=memberships.find(m=>m.guild_id===selectedGuildId&&m.user_id===userId);if(row?.role==="leader"){const others=memberships.filter(m=>m.guild_id===selectedGuildId&&m.user_id!==userId);if(others.length){alert("Transfira a liderança antes de remover o líder.");return}}if(!confirm("Remover este estudante da Guilda?"))return;const {error}=await sb.from("guild_members").delete().eq("guild_id",selectedGuildId).eq("user_id",userId);if(error)return adminGuildError(error);await refreshGuildManager()}
async function adminTransferLeader(userId){if(!confirm("Definir este estudante como novo líder da Guilda?"))return;const {error}=await sb.rpc("transfer_guild_leadership",{p_guild_id:selectedGuildId,p_new_leader:userId});if(error)return adminGuildError(error);await refreshGuildManager()}
function adminGuildError(err){const fb=$("#manageGuildFeedback");fb.textContent=err.message||"Não foi possível concluir a operação.";fb.className="feedback error"}

function competencyEvidenceItems(st,indicator){const root=st?.competencies?.evidence||st?.competencies||{},v=root[indicator];if(Array.isArray(v))return v;if(v&&typeof v==="object")return Object.values(v);return v?[v]:[]}
function evidenceOrigin(e){if(e?.type==="mission-evidence")return "Missão "+(e.missionId||e.source||"")+" • "+(e.project==="edutech"?"EduTech":"Projeto Restaurante");if(e?.type==="self-reflection")return "Registro reflexivo do estudante";return e?.title||e?.source||"Evidência registrada"}
function evidenceDate(e){const d=e?.updatedAt||e?.createdAt;return d?new Date(d).toLocaleString("pt-BR"):"Data não registrada"}
function renderStudentCompetencyEvidence(st,indicator){const items=competencyEvidenceItems(st,indicator);if(!items.length)return "<p class='muted'>Nenhuma evidência vinculada a este indicador.</p>";return items.map(e=>"<article class='instructor-evidence-item'><div class='instructor-evidence-head'><b>"+esc(evidenceOrigin(e))+"</b><small>"+esc(evidenceDate(e))+"</small></div>"+(e?.title&&evidenceOrigin(e)!==e.title?"<span>"+esc(e.title)+"</span>":"")+"<p>"+esc(e?.summary||e?.text||e?.note||"Registro vinculado ao indicador.")+"</p></article>").join("")}

function openStudent(id,{keepOpen=false}={}){
 const s=students.find(x=>x.id===id);if(!s)return;$("#studentDialog").dataset.studentId=id;
 $("#studentDetailName").textContent=s.full_name;
 $("#studentDetailEmail").textContent=s.email||"";
 const st=s.state||{},journey=st.journey||{},game=st.gamification||{},projects=st.projects||{};
 const completed=journey.completedMissions||[],extras=journey.completedExtras||st.extras?.completed||[];
 const evidence=st.competencies?.evidence||st.competencies||{};
 const indicators=["I1","I2","I3","I4","I5","I6"];
 const competencyCards=indicators.map(i=>{const count=competencyEvidenceItems(st,i).length;return "<button type='button' class='detail-mini detail-competency-button' data-detail-indicator='"+i+"' aria-expanded='false'><b>"+i+"</b><span>"+count+" evidência(s)</span><small>"+(count?"Ver registros":"Sem registros")+"</small></button>"}).join("");
 const edu=projects.edutech||st.edutech||{},guild=projects.guild||st.guild||{};
 $("#studentDetailBody").innerHTML="<div class='detail-stats'><article><small>Progresso</small><b>"+(journey.progress||0)+"%</b></article><article><small>XP</small><b>"+(game.xp||0)+"</b></article><article><small>Nível</small><b>"+(game.level||1)+"</b></article><article><small>Missões</small><b>"+completed.length+"/28</b></article></div><section class='detail-section'><h3>Competências I1–I6</h3><div class='detail-competencies'>"+competencyCards+"</div><p class='muted'>Evidências da plataforma apoiam o acompanhamento; a menção oficial continua sendo definida pelo instrutor.</p></section><section class='detail-section'><h3>Projetos</h3><div class='detail-projects'><article><b>🎓 EduTech</b><span>"+(edu.progress||0)+"% • "+((edu.evidence||[]).length)+" evidência(s)</span></article><article><b>⚔️ Guilda</b><span>"+esc(s.guild)+" • "+(guild.progress||0)+"%</span></article></div></section><section class='detail-section'><h3>Atividade</h3><p>"+completed.length+" missão(ões) presencial(is) concluída(s) • "+extras.length+" missão(ões) extra(s).</p><p class='muted'>Última sincronização: "+(s.updated_at?new Date(s.updated_at).toLocaleString("pt-BR"):"Sem sincronização")+"</p></section>";
 $("#studentDetailBody").querySelectorAll("[data-detail-indicator]").forEach(btn=>btn.onclick=()=>{
  const indicator=btn.dataset.detailIndicator,existing=$("#studentEvidencePanel");
  if(existing?.dataset.indicator===indicator){existing.remove();btn.setAttribute("aria-expanded","false");return}
  existing?.remove();$("#studentDetailBody").querySelectorAll("[data-detail-indicator]").forEach(x=>x.setAttribute("aria-expanded","false"));btn.setAttribute("aria-expanded","true");
  const panel=document.createElement("section");panel.id="studentEvidencePanel";panel.dataset.indicator=indicator;panel.className="detail-section instructor-evidence-panel";panel.innerHTML="<div class='section-heading'><div><p class='eyebrow'>"+indicator+"</p><h3>Evidências registradas</h3></div><span class='pill'>"+competencyEvidenceItems(st,indicator).length+" registro(s)</span></div>"+renderStudentCompetencyEvidence(st,indicator);
  btn.closest(".detail-section").after(panel);
 });
 if(!keepOpen&&!$("#studentDialog").open)$("#studentDialog").showModal();
}
function setAdminView(view,{updateHash=true}={}){
 const valid=["overview","students","guilds"];if(!valid.includes(view))view="overview";
 document.querySelectorAll(".admin-view").forEach(el=>el.hidden=true);
 const target=document.querySelector("#"+view+"View");if(target)target.hidden=false;
 document.querySelectorAll("[data-admin-view]").forEach(btn=>btn.classList.toggle("active",btn.dataset.adminView===view));
 const titles={overview:["Gestão da turma","Área do Instrutor"],students:["Acompanhamento da turma","Estudantes"],guilds:["Projeto Restaurante","Gerenciar Guildas"]};
 const [eyebrow,title]=titles[view];document.querySelector(".topbar .eyebrow").textContent=eyebrow;document.querySelector(".topbar h1").textContent=title;
 if(updateHash)history.replaceState(null,"","#"+view);
}
document.querySelectorAll("[data-admin-view]").forEach(btn=>btn.onclick=()=>setAdminView(btn.dataset.adminView));document.querySelectorAll("[data-go-view]").forEach(btn=>btn.onclick=()=>setAdminView(btn.dataset.goView));
window.addEventListener("hashchange",()=>setAdminView(location.hash.slice(1),{updateHash:false}));
setAdminView(location.hash.slice(1)||"overview",{updateHash:false});

$("#closeStudent").onclick=()=>$("#studentDialog").close();
$("#closeManageGuild").onclick=()=>$("#guildManageDialog").close();
$("#manageGuildForm").onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget),fb=$("#manageGuildFeedback");const {error}=await sb.from("guilds").update({name:String(fd.get("name")||"").trim(),repository:String(fd.get("repository")||"").trim()}).eq("id",selectedGuildId);if(error)return adminGuildError(error);fb.textContent="Guilda atualizada.";fb.className="feedback success";await refreshGuildManager()};
$("#deleteGuildButton").onclick=async()=>{const g=guilds.find(x=>x.id===selectedGuildId);if(!g||!confirm("Excluir a Guilda "+g.name+"? Os integrantes ficarão sem equipe."))return;const rm=await sb.from("guild_members").delete().eq("guild_id",selectedGuildId);if(rm.error)return adminGuildError(rm.error);const del=await sb.from("guilds").delete().eq("id",selectedGuildId);if(del.error)return adminGuildError(del.error);$("#guildManageDialog").close();selectedGuildId=null;await load()};
$("#studentSearch").addEventListener("input",render);const dlg=$("#guildDialog");$("#newGuildButton").onclick=()=>dlg.showModal();$("#closeGuild").onclick=()=>dlg.close();
$("#guildForm").onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget),name=String(fd.get("name")||"").trim(),repository=String(fd.get("repository")||"").trim(),members=fd.getAll("members"),fb=$("#guildFeedback");try{const created=await sb.from("guilds").insert({class_id:classRow.id,name,repository,created_by:session.user.id}).select("id").single();if(created.error)throw created.error;if(members.length){const added=await sb.from("guild_members").insert(members.map((user_id,i)=>({guild_id:created.data.id,user_id,role:i===0?"leader":"member"})));if(added.error)throw added.error}dlg.close();e.currentTarget.reset();await load()}catch(err){fb.textContent=err.message||"Não foi possível criar a Guilda."}};
$("#logoutButton").onclick=async()=>{await sb.auth.signOut();location.replace("auth.html")};
try{await load();startRealtime()}catch(err){console.error(err);$("#classMeta").textContent="Não foi possível carregar a turma. Verifique o Console."}