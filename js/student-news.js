import {getSupabase} from "./supabase-client.js";
export const NEWS_START=Date.parse("2026-10-28T00:00:00-03:00");
export const NEWS_END=Date.parse("2026-10-31T00:00:00-03:00");
export const NEWS_ID="web-academy-novidades-2026-10-28";
export const NEWS_ITEMS=[];
export function newsActive(now=Date.now()){return now>=NEWS_START&&now<NEWS_END}
export function newsDismissKey(userId,popupId=NEWS_ID){return "webacademy.popup.dismissed:"+popupId+":"+(userId||"anon")}
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export function safePopupLink(url){const v=String(url||"").trim();if(!v||v.startsWith("//")||v.startsWith("/")||v.includes("\\")||!/^([a-z0-9-]+\.html)(\?[a-z0-9_=&%-]+)?$/i.test(v))return null;return v}
export function popupIsLive(p,now=Date.now()){return p.active&&Date.parse(p.starts_at)<=now&&now<Date.parse(p.ends_at)}
function renderPopup(host,popup,userId){
 const items=Array.isArray(popup.items)?popup.items:[];
 const safeItems=items.filter(x=>x&&typeof x==="object").slice(0,12);
 const id=popup.id,key=newsDismissKey(userId,id),sessionKey=key+":seen";
 host.innerHTML='<button type="button" class="student-news-reopen" aria-label="Abrir novidades da WEB Academy">✨ Novidades</button>'+
 '<div class="student-news-overlay" hidden><section class="student-news-dialog" role="dialog" aria-modal="true" aria-labelledby="studentNewsTitle" tabindex="-1">'+
 '<header class="student-news-header"><div><span class="student-news-eyebrow">WEB ACADEMY · COMUNICADO</span><h2 id="studentNewsTitle">'+esc(popup.title)+'</h2><p>'+esc(popup.subtitle)+'</p></div><button type="button" class="student-news-close" aria-label="Fechar novidades">✕</button></header>'+
 '<div class="student-news-items">'+safeItems.map(item=>'<article class="student-news-item"><div class="student-news-item-top"><span class="student-news-icon" aria-hidden="true">'+esc(item.icon||"📢")+'</span><div><span class="student-news-kind">'+esc(item.label||"Novidade")+'</span><h3>'+esc(item.title)+'</h3></div></div><p>'+esc(item.description)+'</p><div class="student-news-where">📍 '+esc(item.where)+'</div>'+(safePopupLink(item.url)?'<a class="student-news-link" href="'+esc(safePopupLink(item.url))+'">'+esc(item.action||"Acessar recurso")+' ↗</a>':"")+'</article>').join("")+'</div>'+
 '<footer class="student-news-footer"><label><input type="checkbox" id="studentNewsDontShow"> Não mostrar novamente</label><button type="button" class="student-news-ok">Entendi, vamos continuar!</button></footer></section></div>';
 const overlay=host.querySelector(".student-news-overlay"),dialog=host.querySelector(".student-news-dialog"),reopen=host.querySelector(".student-news-reopen"),check=host.querySelector("#studentNewsDontShow");
 let previousFocus=null;
 function close(){try{sessionStorage.setItem(sessionKey,"1")}catch{}if(check.checked){try{localStorage.setItem(key,"1")}catch{}}overlay.hidden=true;document.body.classList.remove("student-news-open");(previousFocus?.isConnected?previousFocus:reopen).focus()}
 function open(){if(!popupIsLive(popup))return;previousFocus=document.activeElement;check.checked=false;overlay.hidden=false;document.body.classList.add("student-news-open");dialog.focus()}
 host.querySelector(".student-news-close").addEventListener("click",close);
 host.querySelector(".student-news-ok").addEventListener("click",close);
 reopen.addEventListener("click",open);
 overlay.addEventListener("click",e=>{if(e.target===overlay)close()});
 overlay.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();close()}if(e.key==="Tab"){const a=[...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled])')];if(!a.length)return;if(e.shiftKey&&document.activeElement===a[0]){e.preventDefault();a.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===a.at(-1)){e.preventDefault();a[0].focus()}}});
 try{if(localStorage.getItem(key)!=="1"&&sessionStorage.getItem(sessionKey)!=="1")setTimeout(open,400)}catch{setTimeout(open,400)}
}
export async function initStudentNews(userId,classId){
 if(!userId||!classId)return;
 const sb=await getSupabase();if(!sb)return;
 const {data,error}=await sb.from("student_popups").select("id,title,subtitle,items,starts_at,ends_at,active").eq("class_id",classId).eq("active",true).lte("starts_at",new Date().toISOString()).gt("ends_at",new Date().toISOString()).order("starts_at",{ascending:false}).limit(5);
 if(error){console.warn("Comunicados indisponíveis:",error.message);return}
 const popup=(data||[]).find(p=>popupIsLive(p));if(!popup)return;
 const host=document.createElement("div");host.id="studentNewsHost";document.body.append(host);renderPopup(host,popup,userId);
}
