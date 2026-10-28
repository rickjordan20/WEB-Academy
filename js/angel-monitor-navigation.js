import {getSupabase,getSession} from "./supabase-client.js";
async function showAngelLink(){
 try{
  const sb=await getSupabase(),session=await getSession();if(!sb||!session)return;
  const {data,error}=await sb.from("class_angel_assignments").select("class_id").eq("user_id",session.user.id).eq("active",true).limit(1);
  if(error||!data?.length)return;
  const href="angel-monitor.html";
  if(document.querySelector('a[href="'+href+'"]'))return;
  const link=document.createElement("a");link.href=href;link.className="nav-item";link.textContent="💙 Meu Painel de Anjo";
  const side=document.querySelector(".sidebar .nav-list");
  if(side)side.appendChild(link);
  const shared=document.querySelector("#waStudentNavigation .wa-nav-links");
  if(shared){const a=document.createElement("a");a.href=href;a.className="wa-nav-link";a.innerHTML='<span class="wa-nav-icon" aria-hidden="true">💙</span><span class="wa-nav-name">Meu Painel de Anjo</span>';shared.appendChild(a)}
 }catch(e){console.warn("Menu de monitoria indisponível",e)}
}
showAngelLink();