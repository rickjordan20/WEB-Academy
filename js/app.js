import { getState, exportState, importState, clearState, setActiveUser, createInitialState, saveState, cacheCloudState } from "./storage.js";
import { ensureGamification,nextLevelInfo } from "./gamification.js";
import {getSupabase,getSession} from "./supabase-client.js";
import {pushCloudState} from "./cloud-sync.js";

const sb=await getSupabase();
const cloudSession=sb?await getSession():null;
if(sb&&!cloudSession){setActiveUser(null);location.replace("auth.html");throw new Error("AUTH_REDIRECT")}
if(cloudSession)setActiveUser(cloudSession.user.id);

let state=getState();
let studentRealtimeChannel=null,realtimeRefreshTimer=null;
if(!state&&cloudSession){
 const name=cloudSession.user.user_metadata?.full_name||cloudSession.user.email?.split("@")[0]||"Estudante";
 state=createInitialState({name,email:cloudSession.user.email||""});
 saveState(state,cloudSession.user.id);
}
state=ensureGamification(state);
if(!state?.student?.name){location.replace(sb?"auth.html":"index.html");throw new Error("STATE_REDIRECT")}

const $ = (s) => document.querySelector(s);
const initials = (name="U") => name.trim().split(/\s+/).slice(0,2).map(p=>p[0]).join("").toUpperCase();

const evidenceCount=v=>Array.isArray(v)?v.length:(v&&typeof v==="object"?Object.keys(v).length:(v?1:0));
function renderStudentOverview(){
 const completed=state.journey?.completedMissions||[],extras=state.journey?.completedExtras||state.extraMissions?.completed||[];
 const competencies=state.competencies?.evidence||state.competencies||{},inds=["I1","I2","I3","I4","I5","I6"];
 const counts=inds.map(i=>evidenceCount(competencies[i])),totalEvidence=counts.reduce((a,n)=>a+n,0),progress=state.journey?.progress||0;
 $("#completedMissionCount").textContent=completed.length+"/28";$("#currentPhaseCount").textContent=Math.min(Number(state.journey?.currentPhase||1),14)+"/14";$("#extraMissionCount").textContent=extras.length+"/7";$("#competencyEvidenceCount").textContent=totalEvidence;
 $("#dashboardJourneyProgress").textContent=progress+"%";$("#dashboardJourneyBar").style.width=progress+"%";
 $("#studentCompetencySummary").innerHTML=inds.map((i,n)=>"<div><b>"+i+"</b><strong>"+counts[n]+"</strong><span>evidência(s)</span></div>").join("");
 const edu=state.projects?.edutech||state.edutech||{},guild=state.projects?.guild||state.guild||{};
 $("#edutechDashboard").textContent=(edu.progress||0)+"% • "+((edu.evidence||[]).length)+" evidência(s)";$("#edutechRepoDashboard").textContent=edu.repository?"Repositório: "+edu.repository:"Repositório não informado";
 $("#guildDashboardName").textContent=guild.name||"Minha Guilda";$("#guildDashboardMeta").textContent=guild.name?((guild.progress||0)+"% • Projeto Restaurante"):"Ver equipe e projeto";$("#guildRepoDashboard").textContent=guild.repository?"Repositório: "+guild.repository:"Repositório não informado";
 const updated=state.meta?.updatedAt;$("#lastCloudUpdate").textContent=updated?"Última alteração neste dispositivo: "+new Date(updated).toLocaleString("pt-BR"):"Aguardando sincronização...";
}
async function refreshStudentFromCloud(){
 if(!cloudSession)return;
 const {data,error}=await sb.from("student_states").select("state,updated_at").eq("user_id",cloudSession.user.id).maybeSingle();
 if(error||!data?.state)return;
 const localUpdated=Date.parse(state?.meta?.updatedAt||0),cloudUpdated=Date.parse(data.updated_at||0);
 if(cloudUpdated>localUpdated){state=ensureGamification(data.state);cacheCloudState(state,cloudSession.user.id);render();const ds=$("#dataStatus"),cs=$("#dashboardCloudStatus");if(ds)ds.innerHTML="<i></i> Tempo real";if(cs)cs.innerHTML="<i></i> Tempo real";$("#lastCloudUpdate").textContent="Última sincronização: "+new Date(data.updated_at).toLocaleString("pt-BR")}
}
function startStudentRealtime(){
 if(!cloudSession||studentRealtimeChannel)return;
 studentRealtimeChannel=sb.channel("student-dashboard-"+cloudSession.user.id).on("postgres_changes",{event:"*",schema:"public",table:"student_states",filter:"user_id=eq."+cloudSession.user.id},()=>{clearTimeout(realtimeRefreshTimer);realtimeRefreshTimer=setTimeout(refreshStudentFromCloud,200)}).subscribe(status=>{const cs=$("#dashboardCloudStatus");if(status==="SUBSCRIBED"){if(cs)cs.innerHTML="<i></i> Tempo real"}else if(status==="CHANNEL_ERROR"||status==="TIMED_OUT"){if(cs)cs.innerHTML="<i></i> Nuvem"}});
}
window.addEventListener("beforeunload",()=>{if(studentRealtimeChannel)sb?.removeChannel(studentRealtimeChannel)});

function render() {
  const first = state.student.name.split(/\s+/)[0];
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
  const unlocked = state.journey?.unlockedMissions || ["1A"];
  const nextId = unlocked.find(id => !completed.includes(id)) || "1A";
  const nextButton = $("#nextMissionButton"); if (nextButton) { nextButton.href = `mission.html?id=${nextId}`; nextButton.textContent = completed.length ? `Continuar Missão ${nextId} →` : "Iniciar Missão 1A →"; }
  $("#profileButton").textContent = initials(state.student.name);
  $("#profileAvatar").textContent = initials(state.student.name);
  $("#profileName").textContent = state.student.name;
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
  startStudentRealtime();
}

const settings = $("#settingsDialog"), profile = $("#profileDialog");
$("#openSettings").addEventListener("click", () => settings.showModal());
$("#profileButton").addEventListener("click", () => profile.showModal());
$("#showProfile").addEventListener("click", () => profile.showModal());
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
  toast(cloudSession?"Backup restaurado e sincronizado com a nuvem.":"Backup restaurado neste navegador.");
  setTimeout(()=>location.reload(),900);
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
const sidebar=$("#sidebar");$("#menuButton")?.addEventListener("click",()=>sidebar.classList.toggle("open"));
document.querySelectorAll(".nav-item[data-view], [data-demo]").forEach(btn=>{btn.addEventListener("click",()=>{const view=btn.dataset.view||btn.dataset.demo;if(view==="dashboard")return;toast("Esta área será ativada nas próximas fases de implantação.");sidebar.classList.remove("open")})});
let toastTimer;function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600)}
