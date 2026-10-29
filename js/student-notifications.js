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
 let items=[],busy=false;
 async function refresh(){
  if(busy)return;busy=true;
  try{const {data,error}=await sb.from("student_notifications").select("id,kind,title,body,url,created_at,read_at").eq("student_id",session.user.id).order("created_at",{ascending:false}).limit(80);if(error)throw error;items=data||[];
   const unread=items.filter(x=>!x.read_at).length;count.hidden=!unread;count.textContent=unread>99?"99+":String(unread);
   trigger.setAttribute("aria-label",unread?unread+" notificações não lidas":"Abrir notificações");
   list.innerHTML=items.length?items.map(n=>'<article class="student-notification-item '+(!n.read_at?"unread":"")+'" role="listitem"><span class="student-notification-icon">'+(icons[n.kind]||"🔔")+'</span><div><strong>'+esc(n.title)+'</strong><p>'+esc(n.body)+'</p><small>'+new Date(n.created_at).toLocaleString("pt-BR")+'</small>'+(safeUrl(n.url)?'<a href="'+esc(safeUrl(n.url))+'" data-notification-link="'+esc(n.id)+'">Ver detalhes →</a>':"")+'</div>'+(!n.read_at?'<button type="button" class="student-notification-mark" data-mark="'+esc(n.id)+'" aria-label="Marcar como lida" title="Marcar como lida">✓</button>':"")+'</article>').join(""):'<p class="student-notification-empty">Você está em dia! Nenhuma notificação por enquanto.</p>';
  }catch(e){console.warn("Notificações indisponíveis",e);list.innerHTML='<p class="student-notification-empty">Não foi possível carregar as notificações.</p>'}finally{busy=false}
 }
 async function mark(ids){if(!ids.length)return;const {error}=await sb.from("student_notifications").update({read_at:new Date().toISOString()}).eq("student_id",session.user.id).in("id",ids);if(error){console.warn("Não foi possível marcar como lida",error);return}await refresh()}
 trigger.addEventListener("click",()=>{const open=panel.hidden;panel.hidden=!open;trigger.setAttribute("aria-expanded",String(open));if(open)refresh()});
 wrap.querySelector(".student-notification-close").addEventListener("click",()=>{panel.hidden=true;trigger.setAttribute("aria-expanded","false")});
 wrap.querySelector(".student-notification-readall").addEventListener("click",()=>mark(items.filter(x=>!x.read_at).map(x=>x.id)));
 list.addEventListener("click",e=>{const button=e.target.closest("[data-mark]");if(button)mark([button.dataset.mark]);const link=e.target.closest("[data-notification-link]");if(link)mark([link.dataset.notificationLink])});
 document.addEventListener("click",e=>{if(!wrap.contains(e.target)){panel.hidden=true;trigger.setAttribute("aria-expanded","false")}});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"){panel.hidden=true;trigger.setAttribute("aria-expanded","false")}});
 const channel=sb.channel("student-notifications-"+session.user.id).on("postgres_changes",{event:"*",schema:"public",table:"student_notifications",filter:"student_id=eq."+session.user.id},refresh).subscribe();
 window.addEventListener("pagehide",()=>sb.removeChannel(channel),{once:true});
 await refresh();
}
