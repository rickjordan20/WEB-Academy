import { getState, exportState, importState, clearState, setActiveUser, createInitialState, saveState } from "./storage.js";
import { ensureGamification,nextLevelInfo } from "./gamification.js";
import {getSupabase,getSession} from "./supabase-client.js";

const sb=await getSupabase();
const cloudSession=sb?await getSession():null;
if(sb&&!cloudSession){setActiveUser(null);location.replace("auth.html");throw new Error("AUTH_REDIRECT")}
if(cloudSession)setActiveUser(cloudSession.user.id);

let state=getState();
if(!state&&cloudSession){
 const name=cloudSession.user.user_metadata?.full_name||cloudSession.user.email?.split("@")[0]||"Estudante";
 state=createInitialState({name,email:cloudSession.user.email||""});
 saveState(state,cloudSession.user.id);
}
state=ensureGamification(state);
if(!state?.student?.name){location.replace(sb?"auth.html":"index.html");throw new Error("STATE_REDIRECT")}

const $ = (s) => document.querySelector(s);
const initials = (name="U") => name.trim().split(/\s+/).slice(0,2).map(p=>p[0]).join("").toUpperCase();

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
}
render();
if(cloudSession){const ds=$("#dataStatus");if(ds)ds.innerHTML="<i></i> Sincronizado";}

const settings = $("#settingsDialog"), profile = $("#profileDialog");
$("#openSettings").addEventListener("click", () => settings.showModal());
$("#profileButton").addEventListener("click", () => profile.showModal());
$("#showProfile").addEventListener("click", () => profile.showModal());
$("#exportBackup").addEventListener("click", () => { try { exportState(); toast("Backup exportado."); } catch(e) { toast(e.message); } });
const picker = $("#backupFile");
$("#importBackup").addEventListener("click", () => picker.click());
picker.addEventListener("change", async () => { try { if (!picker.files[0]) return; await importState(picker.files[0]); toast("Backup importado. Recarregando..."); setTimeout(()=>location.reload(),700); } catch(e) { toast(e.message || "Falha ao importar."); } finally { picker.value=""; } });
$("#clearData").addEventListener("click", () => { const ok=confirm("ATENÇÃO: isso apagará todos os dados locais da UC7 Web Academy neste navegador. Deseja continuar?");if(!ok)return;const again=confirm("Confirme novamente: deseja apagar definitivamente os dados locais?");if(again){clearState();location.replace(sb?"auth.html":"index.html")} });
$("#logoutButton").addEventListener("click", async () => {if(sb)await sb.auth.signOut();setActiveUser(null);location.replace(sb?"auth.html":"index.html");});
const sidebar=$("#sidebar");$("#menuButton")?.addEventListener("click",()=>sidebar.classList.toggle("open"));
document.querySelectorAll(".nav-item[data-view], [data-demo]").forEach(btn=>{btn.addEventListener("click",()=>{const view=btn.dataset.view||btn.dataset.demo;if(view==="dashboard")return;toast("Esta área será ativada nas próximas fases de implantação.");sidebar.classList.remove("open")})});
let toastTimer;function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600)}
