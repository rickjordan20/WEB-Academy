import {getSupabase,getSession} from "./supabase-client.js";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const icons={evaluation:"✅",revision:"📝",submission:"📨",announcement:"📢",system:"🔔"};
const safeUrl=url=>{if(typeof url!=="string"||!url||url.startsWith("//")||url.includes("\\")||/^[a-z][a-z0-9+.-]*:/i.test(url)||url.startsWith("/"))return null;return /^[a-z0-9/_?&=.%#-]+$/i.test(url)?url:null};
export async function initStudentNotifications(){
 const sb=await getSupabase(),session=await getSession();if(!sb||!session)return;
 const mount=document.querySelector(".topbar-actions");if(!mount)return;
 const wrap=document.createElement("div");wrap.className="student-notification-wrap";
 wrap.innerHTML='<button class="student-notification-trigger" type="button" aria-expanded="false" aria-label="Abrir notificações">🔔 <span class="student-notification-count" hidden>0</span></button><section class="student-notification-panel" hidden><header><div><strong>Notificações</strong><small id="studentNotificationSubtitle">Atualizações da sua jornada</small></div><button type="button" class="student-notification-close" aria-label="Fechar notificações">✕</button></header><div class="student-notification-list" role="list"></div><footer><button type="button" class="student-notification-readall">Marcar todas como lidas</button><span>Atualização automática</span></footer></section>';
 mount.insertBefore(wrap,mount.firstChild);
 const trigger=wrap.querySelector(".student-notification-trigger"),panel=wrap.querySelector(".student-notification-panel"),count=wrap.querySelector(".student-notification-count"),list=wrap.querySelector(".student-notification-list");
 let items=[],busy=false,derivedCache=[],derivedCacheAt=0;
 const seenKey="uc7:notification-seen:"+session.user.id;
 const getSeen=()=>{try{return new Set(JSON.parse(localStorage.getItem(seenKey)||"[]"))}catch{return new Set()}};
 const saveSeen=ids=>{const seen=getSeen();ids.forEach(id=>seen.add(id));try{localStorage.setItem(seenKey,JSON.stringify([...seen].slice(-400)))}catch{}};
 async function loadDerived(force=false){
  const now=Date.now(),day=86400000,derived=[];
  if(!force&&now-derivedCacheAt<180000)return derivedCache;
  const memberships=await sb.from("class_members").select("class_id").eq("user_id",session.user.id).eq("status","active");
  const classIds=(memberships.data||[]).map(x=>x.class_id);
  if(!classIds.length)return derived;
  const [schedule,popups,guildMember]=await Promise.all([
   sb.from("class_schedule").select("id,class_id,mission_id,mission_open_at,mission_close_at").in("class_id",classIds).not("mission_id","is",null),
   sb.from("student_popups").select("id,title,subtitle,starts_at,ends_at,active,updated_at").in("class_id",classIds).eq("active",true),
   sb.from("guild_members").select("guild_id").eq("user_id",session.user.id)
  ]);
  for(const m of schedule.data||[]){
   const open=m.mission_open_at?Date.parse(m.mission_open_at):NaN,close=m.mission_close_at?Date.parse(m.mission_close_at):NaN;
   if(Number.isFinite(open)&&open<=now&&open>=now-7*day)derived.push({id:"auto:open:"+m.id+":"+m.mission_open_at,kind:"announcement",title:"Missão "+m.mission_id+" disponível",body:"O período de realização da missão começou.",url:"journey.html",created_at:m.mission_open_at});
   if(Number.isFinite(close)&&close>now&&close<=now+2*day)derived.push({id:"auto:deadline:"+m.id+":"+m.mission_close_at,kind:"revision",title:"Prazo próximo · missão "+m.mission_id,body:"Confira o prazo de entrega da missão.",url:"journey.html",created_at:new Date(Math.max(now-day,close-2*day)).toISOString()});
  }
  for(const p of popups.data||[]){
   if((p.starts_at&&Date.parse(p.starts_at)>now)||(p.ends_at&&Date.parse(p.ends_at)<=now))continue;
   derived.push({id:"auto:announcement:"+p.id+":"+p.updated_at,kind:"announcement",title:p.title||"Comunicado da turma",body:p.subtitle||"Há um comunicado disponível.",url:"app.html",created_at:p.updated_at||p.starts_at||new Date().toISOString()});
  }
  const guildIds=(guildMember.data||[]).map(g=>g.guild_id);
  if(guildIds.length){
   const activity=await sb.from("guild_task_activity").select("id,guild_id,actor_id,action,occurred_at").in("guild_id",guildIds).gte("occurred_at",new Date(now-14*day).toISOString()).order("occurred_at",{ascending:false}).limit(35);
   for(const a of activity.data||[])if(a.actor_id!==session.user.id)derived.push({id:"auto:kanban:"+a.id,kind:"system",title:"Kanban do grupo atualizado",body:"Uma tarefa do grupo recebeu uma atualização.",url:"guild.html",created_at:a.occurred_at});
  }
  const requests=await sb.from("angel_help_requests").select("id,title,status,updated_at").eq("requester_id",session.user.id).order("updated_at",{ascending:false}).limit(20);
  for(const a of requests.data||[])if(a.updated_at&&Date.parse(a.updated_at)>=now-30*day)derived.push({id:"auto:help:"+a.id+":"+a.status+":"+a.updated_at,kind:"system",title:"Pedido de ajuda atualizado",body:(a.title||"Solicitação")+" · "+(a.status||"Em acompanhamento"),url:"app.html",created_at:a.updated_at});
  derivedCache=derived;derivedCacheAt=now;return derived;
 }

 async function refresh(force=false){
  if(busy)return;busy=true;
  try{const {data,error}=await sb.from("student_notifications").select("id,kind,title,body,url,created_at,read_at").eq("student_id",session.user.id).order("created_at",{ascending:false}).limit(80);if(error)throw error;const derived=await loadDerived(force);const seen=getSeen();items=[...(data||[]),...derived.map(n=>({...n,read_at:seen.has(n.id)?n.created_at:null}))].sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)).slice(0,100);
   const unread=items.filter(x=>!x.read_at).length;count.hidden=!unread;count.textContent=unread>99?"99+":String(unread);
   trigger.setAttribute("aria-label",unread?unread+" notificações não lidas":"Abrir notificações");
   list.innerHTML=items.length?items.map(n=>'<article class="student-notification-item '+(!n.read_at?"unread":"")+'" role="listitem"><span class="student-notification-icon">'+(icons[n.kind]||"🔔")+'</span><div><strong>'+esc(n.title)+'</strong><p>'+esc(n.body)+'</p><small>'+new Date(n.created_at).toLocaleString("pt-BR")+'</small>'+(safeUrl(n.url)?'<a href="'+esc(safeUrl(n.url))+'" data-notification-link="'+esc(n.id)+'">Ver detalhes →</a>':"")+'</div>'+(!n.read_at?'<button type="button" class="student-notification-mark" data-mark="'+esc(n.id)+'" aria-label="Marcar como lida" title="Marcar como lida">✓</button>':"")+'</article>').join(""):'<p class="student-notification-empty">Você está em dia! Nenhuma notificação por enquanto.</p>';
  }catch(e){console.warn("Notificações indisponíveis",e);list.innerHTML='<p class="student-notification-empty">Não foi possível carregar as notificações.</p>'}finally{busy=false}
 }
 async function mark(ids){if(!ids.length)return;const derived=ids.filter(id=>id.startsWith("auto:"));if(derived.length)saveSeen(derived);const persisted=ids.filter(id=>!id.startsWith("auto:"));if(persisted.length){const {error}=await sb.from("student_notifications").update({read_at:new Date().toISOString()}).eq("student_id",session.user.id).in("id",persisted);if(error){console.warn("Não foi possível marcar como lida",error);return}}await refresh()}
 trigger.addEventListener("click",()=>{const open=panel.hidden;panel.hidden=!open;trigger.setAttribute("aria-expanded",String(open));if(open)refresh(true)});
 wrap.querySelector(".student-notification-close").addEventListener("click",()=>{panel.hidden=true;trigger.setAttribute("aria-expanded","false")});
 wrap.querySelector(".student-notification-readall").addEventListener("click",()=>mark(items.filter(x=>!x.read_at).map(x=>x.id)));
 list.addEventListener("click",e=>{const button=e.target.closest("[data-mark]");if(button)mark([button.dataset.mark]);const link=e.target.closest("[data-notification-link]");if(link)mark([link.dataset.notificationLink])});
 document.addEventListener("click",e=>{if(!wrap.contains(e.target)){panel.hidden=true;trigger.setAttribute("aria-expanded","false")}});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){panel.hidden=true;trigger.setAttribute("aria-expanded","false")}});
 const channel=sb.channel("student-notifications-"+session.user.id).on("postgres_changes",{event:"*",schema:"public",table:"student_notifications",filter:"student_id=eq."+session.user.id},refresh).subscribe();
 window.addEventListener("pagehide",()=>sb.removeChannel(channel),{once:true});
 await refresh();
 const refreshInterval=setInterval(()=>{if(!document.hidden)refresh()},180000);
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)refresh()});
 window.addEventListener("pagehide",()=>clearInterval(refreshInterval),{once:true});
}
