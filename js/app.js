import { getState, exportState, importState, clearState, setActiveUser, createInitialState, saveState, cacheCloudState } from "./storage.js";
import { ensureGamification,nextLevelInfo } from "./gamification.js";
import {getSupabase,getSession} from "./supabase-client.js";
import {pullCloudState,pushCloudState} from "./cloud-sync.js";

const sb=await getSupabase();
const cloudSession=sb?await getSession():null;
if(sb&&!cloudSession){setActiveUser(null);location.replace("auth.html");throw new Error("AUTH_REDIRECT")}
if(cloudSession){
 const {data:role}=await sb.from("profiles").select("role").eq("id",cloudSession.user.id).maybeSingle();
 if(role?.role==="instructor"){location.replace("instructor.html");throw new Error("INSTRUCTOR_REDIRECT")}
 const {data:membership,error:membershipError}=await sb.from("class_members").select("class_id").eq("user_id",cloudSession.user.id).eq("status","active").limit(1);
 if(membershipError)throw membershipError;
 if(!membership?.length){location.replace("enrollment.html");throw new Error("ENROLLMENT_REQUIRED")}
}
if(cloudSession){setActiveUser(cloudSession.user.id);try{await pullCloudState()}catch(e){console.warn("Sincronização inicial indisponível:",e)}}

let state=getState();
let studentRealtimeChannel=null,guildRealtimeChannel=null,realtimeRefreshTimer=null;
let officialGuildSummary=null;
if(!state&&cloudSession){
 const name=cloudSession.user.user_metadata?.full_name||cloudSession.user.email?.split("@")[0]||"Estudante";
 state=createInitialState({name,email:cloudSession.user.email||""});
 saveState(state,cloudSession.user.id);
}
state=ensureGamification(state);
if(!state?.student?.name){location.replace(sb?"auth.html":"index.html");throw new Error("STATE_REDIRECT")}

const $ = (s) => document.querySelector(s);
var AVATAR_EMOJI={astronaut:"🧑‍🚀",developer:"🧑‍💻",robot:"🤖",explorer:"🧭",artist:"🎨"};
var studentAvatarSignedUrl="",studentAvatarSignedPath="",avatarRefreshSequence=0;
const initials = (name="U") => name.trim().split(/\s+/).slice(0,2).map(p=>p[0]).join("").toUpperCase();

const evidenceCount=v=>Array.isArray(v)?v.length:(v&&typeof v==="object"?Object.keys(v).length:(v?1:0));
function renderStudentOverview(){
 const completed=state.journey?.completedMissions||[],extras=state.journey?.completedExtras||state.extraMissions?.completed||[];
 const competencies=state.competencies?.evidence||state.competencies||{},inds=["I1","I2","I3","I4","I5","I6"];
 const counts=inds.map(i=>evidenceCount(competencies[i])),totalEvidence=counts.reduce((a,n)=>a+n,0),progress=state.journey?.progress||0;
 $("#completedMissionCount").textContent=completed.length+"/28";$("#currentPhaseCount").textContent=Math.min(Number(state.journey?.currentPhase||1),14)+"/14";$("#extraMissionCount").textContent=extras.length+"/7";$("#competencyEvidenceCount").textContent=totalEvidence;
 $("#dashboardJourneyProgress").textContent=progress+"%";$("#dashboardJourneyBar").style.width=progress+"%";
 $("#studentCompetencySummary").innerHTML=inds.map((i,n)=>"<div><b>"+i+"</b><strong>"+counts[n]+"</strong><span>evidência(s)</span></div>").join("");
 const edu=state.projects?.edutech||state.edutech||{},localGuild=state.projects?.guild||state.guild||{},guild=officialGuildSummary||localGuild;
 $("#edutechDashboard").textContent=(edu.progress||0)+"% • "+((edu.evidence||[]).length)+" evidência(s)";$("#edutechRepoDashboard").textContent=edu.repository?"Repositório: "+edu.repository:"Repositório não informado";
 $("#guildDashboardName").textContent=guild.name||"Minha Guilda";
 if(officialGuildSummary){
  const leader=officialGuildSummary.leaderName||"Não definido",count=officialGuildSummary.memberCount||0;
  $("#guildDashboardMeta").textContent=`${count} integrante(s) • Líder: ${leader}`;
 }else $("#guildDashboardMeta").textContent=cloudSession?"Você ainda não participa de uma Guilda.":"Ver equipe e projeto";
 $("#guildRepoDashboard").textContent=guild.repository?"Repositório: "+guild.repository:"Repositório não informado";
 const updated=state.meta?.updatedAt;$("#lastCloudUpdate").textContent=updated?"Última alteração neste dispositivo: "+new Date(updated).toLocaleString("pt-BR"):"Aguardando sincronização...";
}
async function loadOfficialGuildSummary(){
 if(!cloudSession)return null;
 const gm=await sb.from("guild_members").select("guild_id,role").eq("user_id",cloudSession.user.id).maybeSingle();
 if(gm.error)throw gm.error;
 if(!gm.data){officialGuildSummary=null;renderStudentOverview();return null}
 const [gr,members]=await Promise.all([
  sb.from("guilds").select("id,name,repository").eq("id",gm.data.guild_id).single(),
  sb.from("guild_members").select("user_id,role").eq("guild_id",gm.data.guild_id)
 ]);
 if(gr.error)throw gr.error;if(members.error)throw members.error;
 const rows=members.data||[],leader=rows.find(m=>m.role==="leader");let leaderName="";
 if(leader){const pr=await sb.from("profiles").select("full_name").eq("id",leader.user_id).maybeSingle();if(!pr.error)leaderName=pr.data?.full_name||""}
 officialGuildSummary={...gr.data,memberCount:rows.length,leaderName};
 renderStudentOverview();return officialGuildSummary;
}
async function refreshStudentFromCloud(){
 if(!cloudSession)return;
 const {data,error}=await sb.from("student_states").select("state,updated_at").eq("user_id",cloudSession.user.id).maybeSingle();
 if(error||!data?.state)return;
 const localUpdated=Date.parse(state?.meta?.updatedAt||0),cloudUpdated=Date.parse(data.updated_at||0);
 if(cloudUpdated>localUpdated){state=ensureGamification(data.state);cacheCloudState(state,cloudSession.user.id);render();const ds=$("#dataStatus"),cs=$("#dashboardCloudStatus");if(ds)ds.innerHTML="<i></i> Tempo real";if(cs)cs.innerHTML="<i></i> Tempo real";$("#lastCloudUpdate").textContent="Última sincronização: "+new Date(data.updated_at).toLocaleString("pt-BR")}
}
function startGuildRealtime(){
 if(!cloudSession||guildRealtimeChannel)return;
 guildRealtimeChannel=sb.channel("student-guild-summary-"+cloudSession.user.id)
  .on("postgres_changes",{event:"*",schema:"public",table:"guild_members"},()=>{clearTimeout(realtimeRefreshTimer);realtimeRefreshTimer=setTimeout(()=>loadOfficialGuildSummary().catch(()=>{}),200)})
  .on("postgres_changes",{event:"*",schema:"public",table:"guilds"},()=>{clearTimeout(realtimeRefreshTimer);realtimeRefreshTimer=setTimeout(()=>loadOfficialGuildSummary().catch(()=>{}),200)})
  .subscribe();
}
function startStudentRealtime(){
 if(!cloudSession||studentRealtimeChannel)return;
 studentRealtimeChannel=sb.channel("student-dashboard-"+cloudSession.user.id).on("postgres_changes",{event:"*",schema:"public",table:"student_states",filter:"user_id=eq."+cloudSession.user.id},()=>{clearTimeout(realtimeRefreshTimer);realtimeRefreshTimer=setTimeout(refreshStudentFromCloud,200)}).subscribe(status=>{const cs=$("#dashboardCloudStatus");if(status==="SUBSCRIBED"){if(cs)cs.innerHTML="<i></i> Tempo real"}else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"){if(cs)cs.innerHTML="<i></i> Nuvem"}});
}
window.addEventListener("beforeunload",()=>{if(studentRealtimeChannel)sb?.removeChannel(studentRealtimeChannel);if(guildRealtimeChannel)sb?.removeChannel(guildRealtimeChannel)});

function render() {
  const displayName=studentProfileDetails?.display_name?.trim()||state.student.name;
  const first = displayName.split(/\s+/)[0];
  $("#welcomeTitle").textContent = `Olá, ${first}!`;
  $("#xpValue").textContent = state.gamification?.xp ?? 0;
  $("#levelValue").textContent = state.gamification?.level ?? 1;
  const li=nextLevelInfo(state);
  $("#levelNameStat").textContent=state.gamification.levelName;
  $("#levelBadge").textContent=state.gamification.level;
  $("#levelName").textContent=state.gamification.levelName;
  $("#levelXp").textContent=li.next?`${state.gamification.xp} / ${li.next.min} XP`:`${state.gamification.xp} XP • Nível máximo`;
  $("#levelProgress").style.width=`${li.pct}%`;
  $("#achievementCount").textContent=state.gamification.achievements.length;
  $("#navAchievementCount").textContent=state.gamification.achievements.length;
  const journeyProgress = state.journey?.progress ?? 0;
  const journeyStat = $("#journeyStat"); if (journeyStat) journeyStat.textContent = `${journeyProgress}%`;
  const journeyText = $("#journeyProgressText"); if (journeyText) journeyText.textContent = `${journeyProgress}%`;
  const journeyBar = $("#journeyProgressBar"); if (journeyBar) journeyBar.style.width = `${journeyProgress}%`;
  const completed = state.journey?.completedMissions || [];
  const unlocked=state.journey?.unlockedMissions||["1A"];
  const nextId=unlocked.find(id=>!completed.includes(id))||"1A";
  const phase=Number.parseInt(nextId,10)||1,number=(phase-1)*2+(nextId.endsWith("B")?2:1);
  const nextButton=$("#nextMissionButton");if(nextButton){nextButton.href=`mission.html?id=${nextId}`;nextButton.textContent=completed.length?`Continuar Missão ${String(number).padStart(2,"0")} →`:"Iniciar Missão 01 →";}
  renderStudentAvatars(displayName);
  $("#profileName").textContent = displayName;
  $("#profileOfficialName").textContent=studentProfileDetails?.display_name?.trim()?"Nome cadastrado: "+state.student.name:"";
  $("#profileEmail").textContent = state.student.email || "E-mail não informado";
  renderStudentOverview();
}
render();
if(cloudSession){
  const ds=$("#dataStatus");
  if(ds)ds.innerHTML="<i></i> Conectado";
  const pr=await sb.from("profiles").select("role").eq("id",cloudSession.user.id).single();
  if(!pr.error&&pr.data?.role==="instructor"){
    location.replace("instructor.html");
    throw new Error("INSTRUCTOR_REDIRECT");
  }
  window.addEventListener("uc7:cloud-synced",()=>{if(ds)ds.innerHTML="<i></i> Sincronizado";const cs=$("#dashboardCloudStatus");if(cs)cs.innerHTML="<i></i> Sincronizado";state=ensureGamification(getState());render()});
  try{await loadOfficialGuildSummary()}catch(e){console.warn("Resumo da Guilda indisponível:",e)}
  startStudentRealtime();
  startGuildRealtime();
}

const settings = $("#settingsDialog"), profile = $("#profileDialog");
const BACKUP_RESTORE_KEY="uc7_web_academy_last_backup_restore";
function showBackupRestoreStatus(info){
 const box=$("#backupRestoreStatus"),msg=$("#backupRestoreMessage"),time=$("#backupRestoreTime");
 if(!box||!info)return;
 msg.textContent=info.cloud?"Os dados foram salvos neste dispositivo e sincronizados com a nuvem.":"Os dados foram restaurados neste dispositivo.";
 time.textContent="Último backup restaurado: "+new Date(info.at).toLocaleString("pt-BR");
 box.hidden=false;
}
try{const saved=localStorage.getItem(BACKUP_RESTORE_KEY);if(saved)showBackupRestoreStatus(JSON.parse(saved))}catch{};
$("#openSettings").addEventListener("click", () => settings.showModal());
var studentProfileDetails=null;
const studentProfileForm=$("#studentProfileForm");
const profileFeedback=$("#studentProfileFeedback");

function renderStudentAvatars(name){
 const preset=studentProfileDetails?.avatar_preset||"initials";
 const path=studentProfileDetails?.avatar_path||"";
 const value=preset==="photo"&&path&&studentAvatarSignedPath===path&&studentAvatarSignedUrl?studentAvatarSignedUrl:null;
 for(const id of ["#profileButton","#profileAvatar"]){
  const el=$(id);if(!el)continue;
  el.replaceChildren();
  if(value){const img=document.createElement("img");img.src=value;img.alt="Foto do perfil";img.className="student-avatar-image";el.append(img)}
  else el.textContent=AVATAR_EMOJI[preset]||initials(name);
 }
 document.querySelectorAll("[data-avatar-preset]").forEach(btn=>{
  btn.classList.toggle("selected",(preset==="photo"?"":preset)===btn.dataset.avatarPreset);
  btn.setAttribute("aria-pressed",String(preset===btn.dataset.avatarPreset));
  if(btn.dataset.avatarPreset==="initials")btn.textContent=initials(name);
 });
}
async function refreshStudentAvatar(){
 const path=studentProfileDetails?.avatar_preset==="photo"?studentProfileDetails.avatar_path:"";
 const seq=++avatarRefreshSequence;
 if(!path){studentAvatarSignedPath="";studentAvatarSignedUrl="";render();return}
 const {data,error}=await sb.storage.from("student-avatars").createSignedUrl(path,3600);
 if(seq!==avatarRefreshSequence)return;
 if(error)throw error;
 studentAvatarSignedPath=path;
 studentAvatarSignedUrl=data.signedUrl;
 render();
}
async function saveAvatarSelection(preset,path){
 const {error}=await sb.from("student_profile_details").upsert({user_id:cloudSession.user.id,avatar_preset:preset,avatar_path:path||studentProfileDetails?.avatar_path||"",updated_at:new Date().toISOString()},{onConflict:"user_id"});
 if(error)throw error;
 studentProfileDetails={...(studentProfileDetails||{}),avatar_preset:preset,avatar_path:path||studentProfileDetails?.avatar_path||""};
 await refreshStudentAvatar();
}
const avatarFeedback=$("#studentAvatarFeedback");
document.querySelectorAll("[data-avatar-preset]").forEach(btn=>btn.addEventListener("click",async()=>{
 if(!cloudSession)return;
 const preset=btn.dataset.avatarPreset;
 document.querySelectorAll("[data-avatar-preset]").forEach(el=>el.disabled=true);
 avatarFeedback.textContent="Salvando avatar...";avatarFeedback.className="feedback";
 try{await saveAvatarSelection(preset);avatarFeedback.textContent="Avatar atualizado.";toast("Avatar atualizado.")}
 catch(err){avatarFeedback.textContent="Erro ao salvar avatar: "+err.message;avatarFeedback.className="feedback error"}
 finally{document.querySelectorAll("[data-avatar-preset]").forEach(el=>el.disabled=false)}
}));
$("#studentAvatarFile").addEventListener("change",async e=>{
 const file=e.target.files?.[0];if(!file||!cloudSession)return;
 e.target.value="";
 if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>2097152){avatarFeedback.textContent="Selecione JPG, PNG ou WebP de até 2 MB.";avatarFeedback.className="feedback error";return}
 avatarFeedback.textContent="Enviando foto...";avatarFeedback.className="feedback";
 const ext={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}[file.type];
 const path=cloudSession.user.id+"/profile-"+Date.now()+"."+ext;
 try{
  const {error}=await sb.storage.from("student-avatars").upload(path,file,{contentType:file.type,upsert:false});
  if(error)throw error;
  try{await saveAvatarSelection("photo",path)}
  catch(saveError){await sb.storage.from("student-avatars").remove([path]);throw saveError}
  avatarFeedback.textContent="Foto atualizada com sucesso.";toast("Foto de perfil atualizada.");
 }catch(err){avatarFeedback.textContent="Não foi possível enviar a foto: "+err.message;avatarFeedback.className="feedback error"}
});

async function openStudentProfile(){
 profile.showModal();
 profileFeedback.textContent="";profileFeedback.className="feedback";
 if(!cloudSession){studentProfileForm.querySelector('button[type="submit"]').disabled=true;profileFeedback.textContent="Faça login para editar seus dados.";return}
 try{
  const {data,error}=await sb.from("student_profile_details").select("display_name,bio,learning_goal,github_url,portfolio_url,linkedin_url,educational_email,avatar_preset,avatar_path").eq("user_id",cloudSession.user.id).maybeSingle();
  if(error)throw error;
  studentProfileDetails=data||{};
  render();
  await refreshStudentAvatar();
  for(const field of ["display_name","bio","learning_goal","github_url","portfolio_url","linkedin_url","educational_email"])studentProfileForm.elements.namedItem(field).value=studentProfileDetails[field]||"";
  $("#profileLoginEmail").textContent=cloudSession.user.email||"Não informado";
  studentProfileForm.querySelector('button[type="submit"]').disabled=false;
 }catch(err){profileFeedback.textContent="Não foi possível carregar os dados: "+err.message;profileFeedback.className="feedback error";studentProfileForm.querySelector('button[type="submit"]').disabled=true}
}
$("#profileButton").addEventListener("click",openStudentProfile);
$("#showProfile").addEventListener("click",openStudentProfile);
$("#closeProfile").addEventListener("click",()=>profile.close());
studentProfileForm.addEventListener("submit",async e=>{
 e.preventDefault();
 if(!cloudSession)return;
 const button=$("#saveStudentProfile"),data=Object.fromEntries(new FormData(studentProfileForm));
 for(const field of Object.keys(data))data[field]=String(data[field]||"").trim();
 if(data.educational_email&&!/^[a-z0-9._%+\-]+@edu\.df\.senac\.br$/i.test(data.educational_email)){profileFeedback.textContent="Informe um e-mail educacional válido terminado em @edu.df.senac.br.";profileFeedback.className="feedback error";return}
 for(const field of ["github_url","portfolio_url","linkedin_url"]){
  if(data[field]&&!/^https:\/\//i.test(data[field])){profileFeedback.textContent="Os links devem começar com https://";profileFeedback.className="feedback error";return}
 }
 button.disabled=true;profileFeedback.textContent="Salvando...";profileFeedback.className="feedback";
 try{
  const {error}=await sb.from("student_profile_details").upsert({user_id:cloudSession.user.id,...data,updated_at:new Date().toISOString()},{onConflict:"user_id"});
  if(error)throw error;
  studentProfileDetails={...(studentProfileDetails||{}),...data};
  render();
  profileFeedback.textContent="Perfil atualizado com sucesso.";profileFeedback.className="feedback success";
  toast("Informações do perfil salvas.");
 }catch(err){profileFeedback.textContent="Não foi possível salvar: "+err.message;profileFeedback.className="feedback error"}
 finally{button.disabled=false}
});
if(cloudSession){
 sb.from("student_profile_details").select("display_name,bio,learning_goal,github_url,portfolio_url,linkedin_url,educational_email").eq("user_id",cloudSession.user.id).maybeSingle().then(({data,error})=>{
  if(!error){studentProfileDetails=data||{};render();refreshStudentAvatar().catch(err=>console.warn("Foto do perfil indisponível:",err))}
 }).catch(err=>console.warn("Perfil complementar indisponível:",err));
}
$("#exportBackup").addEventListener("click", () => { try { exportState(); toast("Backup exportado."); } catch(e) { toast(e.message); } });
const picker = $("#backupFile");
$("#importBackup").addEventListener("click", () => picker.click());
picker.addEventListener("change", async () => {
 try{
  if(!picker.files[0])return;
  const restored=await importState(picker.files[0]);
  if(cloudSession){
   const result=await pushCloudState(restored);
   if(!result?.synced)throw new Error("O backup foi restaurado neste navegador, mas não foi possível confirmar a sincronização com a nuvem.");
  }
  const restoreInfo={at:new Date().toISOString(),cloud:!!cloudSession};
  localStorage.setItem(BACKUP_RESTORE_KEY,JSON.stringify(restoreInfo));
  state=ensureGamification(restored);
  render();
  showBackupRestoreStatus(restoreInfo);
  toast(cloudSession?"Backup restaurado e sincronizado com a nuvem.":"Backup restaurado neste navegador.");
 }catch(e){toast(e.message||"Falha ao importar o backup.");}
 finally{picker.value="";}
});
$("#clearData").addEventListener("click", async () => {
 const scope=cloudSession?"deste navegador e da sua conta na nuvem":"deste navegador";
 const ok=confirm(`ATENÇÃO: isso apagará todos os dados da UC7 Web Academy ${scope}. Esta ação zera missões, XP, evidências, projetos e preferências. Deseja continuar?`);
 if(!ok)return;
 const again=confirm("Confirme novamente: deseja zerar definitivamente seu progresso? Faça um backup JSON antes se quiser guardar uma cópia.");
 if(!again)return;
 try{
  if(cloudSession){
   const fresh=createInitialState({name:state.student?.name||cloudSession.user.user_metadata?.full_name||"",email:state.student?.email||cloudSession.user.email||""});
   const {error}=await sb.from("student_states").upsert({user_id:cloudSession.user.id,state:fresh,updated_at:new Date().toISOString()},{onConflict:"user_id"});
   if(error)throw error;
   clearState(cloudSession.user.id);
   cacheCloudState(fresh,cloudSession.user.id);
   state=ensureGamification(fresh);
   render();
   settings.close();
   toast("Progresso zerado neste dispositivo e na nuvem.");
  }else{
   clearState();
   location.replace("index.html");
  }
 }catch(e){toast("Não foi possível limpar os dados: "+(e?.message||"erro desconhecido"))}
});
$("#logoutButton").addEventListener("click", async () => {if(sb)await sb.auth.signOut();setActiveUser(null);location.replace(sb?"auth.html":"index.html");});
const sidebar=$("#sidebar");$("#menuButton")?.addEventListener("click",()=>$("#sidebarExpand")?.click());
document.querySelectorAll(".nav-item[data-view], [data-demo]").forEach(btn=>{btn.addEventListener("click",()=>{const view=btn.dataset.view||btn.dataset.demo;if(view==="dashboard")return;toast("Esta área será ativada nas próximas fases de implantação.");sidebar.classList.remove("open")})});
let toastTimer;function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600)}
