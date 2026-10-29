import {getSupabase,getSession} from "./supabase-client.js";
const $=q=>document.querySelector(q),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const sb=await getSupabase(),session=await getSession();
const alert=(message,error=false)=>{$("#notificationAlert").textContent=message;$("#notificationAlert").className=error?"notice-error":"notice-success"};
let classes=[],members=[],history=[],profiles=new Map();
async function init(){
 if(!sb||!session){alert("Faça login como instrutor para continuar.",true);return}
 const me=await sb.from("profiles").select("role").eq("id",session.user.id).single();
 if(me.error||me.data?.role!=="instructor"){alert("Acesso exclusivo para instrutores.",true);return}
 const result=await sb.from("classes").select("id,code,name").eq("instructor_id",session.user.id).order("code");
 if(result.error){alert(result.error.message,true);return}
 classes=result.data||[];
 if(!classes.length){alert("Nenhuma turma vinculada à sua conta.",true);return}
 $("#notificationClass").innerHTML=classes.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.code+" · "+c.name)+'</option>').join("");
 $("#notificationClass").addEventListener("change",load);
 $("#notificationAudience").addEventListener("change",()=>{$("#notificationStudentField").hidden=$("#notificationAudience").value!=="individual"});
 $("#notificationFilterKind").addEventListener("change",render);
 $("#notificationFilterRead").addEventListener("change",render);
 $("#notificationRefresh").addEventListener("click",load);
 $("#notificationForm").addEventListener("submit",send);
 await load();
}
async function load(){
 const classId=$("#notificationClass").value;
 const [m,n]=await Promise.all([
 sb.from("class_members").select("user_id,status").eq("class_id",classId).eq("status","active"),
 sb.from("student_notifications").select("id,student_id,class_id,kind,title,body,url,source_key,created_at,read_at").eq("class_id",classId).order("created_at",{ascending:false}).limit(500)
 ]);
 if(m.error||n.error){alert(m.error?.message||n.error?.message,true);return}
 members=m.data||[];history=n.data||[];
 const ids=[...new Set([...members.map(x=>x.user_id),...history.map(x=>x.student_id)])];
 profiles=new Map();
 if(ids.length){const p=await sb.from("profiles").select("id,full_name").in("id",ids);for(const x of p.data||[])profiles.set(x.id,x.full_name)}
 $("#notificationStudent").innerHTML=members.map(m=>'<option value="'+esc(m.user_id)+'">'+esc(profiles.get(m.user_id)||m.user_id)+'</option>').join("");
 render();
}
function render(){
 const kind=$("#notificationFilterKind").value,read=$("#notificationFilterRead").value;
 const rows=history.filter(n=>(!kind||n.kind===kind)&&(!read||(read==="read"?!!n.read_at:!n.read_at)));
 const unread=history.filter(n=>!n.read_at).length,manual=history.filter(n=>n.source_key?.startsWith("manual:")).length;
 $("#notificationSummary").innerHTML=[["Estudantes ativos",members.length],["Notificações registradas",history.length],["Não lidas",unread],["Avisos manuais",manual]].map(([label,value])=>'<article class="card"><small>'+esc(label)+'</small><strong>'+value+'</strong></article>').join("");
 $("#notificationHistory").innerHTML=rows.length?rows.map(n=>'<article class="notification-record"><div class="notification-record-head"><strong>'+esc(n.title)+'</strong><span class="notification-status '+(n.read_at?"read":"unread")+'">'+(n.read_at?"Lida":"Não lida")+'</span></div><p>'+esc(n.body)+'</p><small>'+esc(profiles.get(n.student_id)||"Estudante")+" · "+new Date(n.created_at).toLocaleString("pt-BR")+" · "+esc(n.kind)+'</small>'+(n.source_key?.startsWith("manual:")?'<button class="notification-delete" type="button" data-delete="'+esc(n.id)+'">Excluir este aviso</button>':"")+'</article>').join(""):'<p class="notification-empty">Nenhuma notificação encontrada.</p>';
 $("#notificationHistory").querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>remove(b.dataset.delete)));
}
async function send(e){
 e.preventDefault();
 const classId=$("#notificationClass").value,student=$("#notificationStudent").value,audience=$("#notificationAudience").value;
 const recipients=audience==="individual"?members.filter(m=>m.user_id===student):members;
 if(!recipients.length){alert("Não há destinatários ativos para esta seleção.",true);return}
 const title=$("#notificationTitle").value.trim(),body=$("#notificationBody").value.trim(),url=$("#notificationUrl").value.trim(),kind=$("#notificationKind").value;
 if(!title||!body){alert("Informe o título e a mensagem.",true);return}
 if(url&&(!/^[a-z0-9/_?&=.%#-]+$/i.test(url)||url.startsWith("/")||url.startsWith("//"))){alert("Informe somente um link interno relativo, como journey.html.",true);return}
 if(!confirm("Publicar a notificação para "+recipients.length+" estudante(s)?"))return;
 const button=$("#notificationSend");button.disabled=true;
 try{
  const batch=crypto.randomUUID();
  const payload=recipients.map(m=>({student_id:m.user_id,class_id:classId,kind,title,body,url:url||null,source_key:"manual:"+batch}));
  const {error}=await sb.from("student_notifications").insert(payload);
  if(error)throw error;
  $("#notificationForm").reset();$("#notificationClass").value=classId;$("#notificationStudentField").hidden=true;
  alert("Notificação publicada para "+recipients.length+" estudante(s).");
  await load();
 }catch(e){alert("Não foi possível publicar: "+e.message,true)}finally{button.disabled=false}
}
async function remove(id){
 const row=history.find(n=>n.id===id);
 if(!row||!row.source_key?.startsWith("manual:"))return;
 if(!confirm("Excluir esta notificação do histórico do estudante?"))return;
 const {error}=await sb.from("student_notifications").delete().eq("id",id).eq("class_id",$("#notificationClass").value);
 if(error){alert(error.message,true);return}
 alert("Notificação excluída.");await load();
}
init().catch(e=>alert(e.message,true));
