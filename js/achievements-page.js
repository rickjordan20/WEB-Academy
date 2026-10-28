import {getState} from "./storage.js";
import {ACHIEVEMENTS,achievementObjects,ensureGamification,reconcileAchievements} from "./gamification.js";
import {getSupabase,getSession} from "./supabase-client.js";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const root=document.querySelector("#achievementRoot");
function card(a,earned,custom=false){return '<article class="card achievement-card '+(earned?"unlocked":"locked")+'"><div class="achievement-icon">'+(earned?esc(a.icon):"🔒")+'</div><div><p class="eyebrow">'+(earned?"Conquista desbloqueada":custom?"Reconhecimento do instrutor":"Ainda bloqueada")+'</p><h2>'+esc(a.name)+'</h2><p>'+esc(a.description)+'</p></div></article>'}
async function init(){
 const sb=await getSupabase(),session=await getSession();
 if(!sb||!session){location.replace("auth.html");return}
 const s=ensureGamification(getState());if(!s)return;
 reconcileAchievements(s);
 const ids=new Set(achievementObjects(s).map(x=>x.id));
 let html=ACHIEVEMENTS.map(a=>card(a,ids.has(a.id))).join("");
 try{
  const m=await sb.from("class_members").select("class_id").eq("user_id",session.user.id).eq("status","active");
  if(m.error)throw m.error;
  const classIds=(m.data||[]).map(x=>x.class_id);
  if(classIds.length){
   const [a,g]=await Promise.all([
    sb.from("achievement_catalog").select("id,name,description,icon,active").in("class_id",classIds),
    sb.from("achievement_grants").select("achievement_id").eq("student_id",session.user.id)
   ]);
   if(a.error||g.error)throw a.error||g.error;
   const granted=new Set((g.data||[]).map(x=>x.achievement_id));
   const custom=(a.data||[]).filter(x=>x.active||granted.has(x.id));
   if(custom.length)html+='<div class="achievement-custom-heading"><h2>🏅 Reconhecimentos do instrutor</h2><p>Conquistas personalizadas concedidas conforme as evidências de aprendizagem.</p></div>'+custom.map(x=>card(x,granted.has(x.id),true)).join("");
  }
 }catch(e){html+='<p role="status">Não foi possível carregar as conquistas personalizadas. Tente atualizar a página.</p>'}
 root.innerHTML=html;
}
init();