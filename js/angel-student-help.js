import {getSupabase,getSession} from "./supabase-client.js";
const $=s=>document.querySelector(s);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const labels={pending:"Aguardando Aluno Anjo",in_progress:"Em atendimento",escalated:"Encaminhado ao instrutor",awaiting_confirmation:"Aguardando sua confirmação",resolved:"Resolvido",reopened:"Reaberto",cancelled:"Cancelado"};
let sb,user,classes=[],angels=[],requests=[],names=new Map(),classId="";
function feedback(msg,error=false){$("#helpFeedback").innerHTML='<div class="angel-feedback"'+(error?' style="border-color:#e57373"':'')+'>'+esc(msg)+'</div>'}
async function loadClass(){
 classId=$("#helpClass").value;
 const [p,n]=await Promise.all([sb.from("learning_projects").select("id,name").eq("class_id",classId).eq("active",true).order("name"),sb.rpc("angel_available_monitor_names",{p_class_id:classId})]);
 if(p.error||n.error)throw p.error||n.error;
 $("#helpProject").innerHTML='<option value="">Dúvida geral</option>'+(p.data||[]).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join("");
 angels=(n.data||[]).filter(x=>x.user_id!==user.id);
 names=new Map(angels.map(x=>[x.user_id,x.full_name]));
 $("#helpAngel").innerHTML='<option value="">Selecione um monitor</option>'+angels.map(a=>'<option value="'+esc(a.user_id)+'">'+esc(a.full_name)+' · '+esc((a.specialties||[]).join(", ")||"Apoio geral")+'</option>').join("");
 updateRouting();await loadRequests();
}
function updateRouting(){
 const route=$("#helpRouting").value;
 $("#helpAngelRow").hidden=route!=="chosen_angel";$("#helpReasonRow").hidden=route!=="instructor";
 $("#helpAngel").required=route==="chosen_angel";$("#helpAngel").disabled=route!=="chosen_angel";$("#helpReason").required=route==="instructor";$("#helpReason").disabled=route!=="instructor";
 $("#helpRoutingHint").textContent=route==="automatic"?"O sistema atribuirá a um monitor disponível com menor carga. Se não houver monitores disponíveis, encaminhará ao instrutor.":route==="chosen_angel"?"Você pode escolher um monitor disponível. Se ele ficar indisponível antes do envio, escolha outro ou use distribuição automática.":"O pedido será enviado diretamente ao instrutor. Explique o motivo técnico do encaminhamento.";
}
async function loadRequests(){
 const {data,error}=await sb.from("angel_help_requests").select("*").eq("class_id",classId).eq("requester_id",user.id).order("created_at",{ascending:false});
 if(error)throw error;requests=data||[];render();
}
function render(){
 $("#helpRequests").innerHTML=requests.length?requests.map(r=>'<article class="angel-request"><div class="angel-item-head"><strong>'+esc(r.title)+'</strong><span class="angel-chip">'+esc(labels[r.status]||r.status)+'</span></div><p>'+esc(r.description)+'</p><small>'+new Date(r.created_at).toLocaleString("pt-BR")+' · '+esc(r.topic)+'</small><div class="angel-actions">'+(r.status==="awaiting_confirmation"?'<button class="btn btn-primary" data-action="confirm" data-id="'+esc(r.id)+'">Minha dúvida foi resolvida</button><button class="btn btn-secondary" data-action="reopen" data-id="'+esc(r.id)+'">Ainda preciso de ajuda</button>':'')+(r.status==="resolved"?'<button class="btn btn-secondary" data-action="reopen" data-id="'+esc(r.id)+'">Reabrir pedido</button>':'')+(!["resolved","cancelled"].includes(r.status)?'<button class="btn btn-secondary" data-action="cancel" data-id="'+esc(r.id)+'">Cancelar pedido</button>':'')+'</div><details data-request="'+esc(r.id)+'"><summary>Ver mensagens e histórico</summary><div data-history="'+esc(r.id)+'"></div>'+(!["resolved","cancelled"].includes(r.status)?'<form data-message="'+esc(r.id)+'" class="angel-form"><label style="grid-column:1/-1">Enviar complemento ou responder<textarea name="body" required rows="2" maxlength="5000"></textarea></label><button class="btn btn-secondary" type="submit">Enviar mensagem</button></form>':'')+'</details></article>').join(""):'<p class="angel-empty">Você ainda não abriu nenhum pedido de ajuda nesta turma.</p>';
 $("#helpRequests").querySelectorAll("[data-action]").forEach(b=>b.onclick=async()=>{let note=null;if(b.dataset.action==="reopen"){note=prompt("O que ainda não foi resolvido? (mínimo 10 caracteres)");if(note===null)return;if(note.trim().length<10)return feedback("Descreva o problema em pelo menos 10 caracteres.",true)}if(b.dataset.action==="cancel"&&!confirm("Cancelar este pedido?"))return;b.disabled=true;const {error}=await sb.rpc("angel_transition_help_request",{p_request_id:b.dataset.id,p_action:b.dataset.action,p_note:note});if(error){b.disabled=false;return feedback(error.message,true)}feedback("Pedido atualizado.");await loadRequests()});
 $("#helpRequests").querySelectorAll("details").forEach(d=>d.addEventListener("toggle",()=>{if(d.open)loadHistory(d.dataset.request)}));
 $("#helpRequests").querySelectorAll("[data-message]").forEach(f=>f.onsubmit=async e=>{e.preventDefault();const body=f.elements.namedItem("body").value;const b=f.querySelector("button");b.disabled=true;const {error}=await sb.rpc("angel_add_help_message",{p_request_id:f.dataset.message,p_body:body,p_message_type:"message"});b.disabled=false;if(error)return feedback(error.message,true);f.reset();feedback("Mensagem enviada.");await loadHistory(f.dataset.message)});
}
async function loadHistory(id){
 const el=$("#helpRequests").querySelector('[data-history="'+id+'"]');if(!el)return;
 const [m,e]=await Promise.all([sb.from("angel_help_messages").select("author_id,body,message_type,created_at").eq("request_id",id).order("created_at"),sb.from("angel_help_events").select("actor_id,action,new_status,details,created_at").eq("request_id",id).order("created_at")]);
 if(m.error||e.error){el.textContent="Não foi possível carregar o histórico.";return}
 const items=[...(m.data||[]).map(x=>({time:x.created_at,content:(x.message_type==="in_person_summary"?"Orientação presencial: ":"Mensagem: ")+x.body})),...(e.data||[]).map(x=>({time:x.created_at,content:"Status: "+(labels[x.new_status]||x.new_status||x.action)+(x.details?.note?" · "+x.details.note:"")}))].sort((a,b)=>a.time.localeCompare(b.time));
 el.innerHTML=items.length?items.map(x=>'<p><small>'+new Date(x.time).toLocaleString("pt-BR")+'</small> — '+esc(x.content)+'</p>').join(""):'<p>Nenhum registro ainda.</p>';
}
async function init(){
 try{sb=await getSupabase();const session=await getSession();if(!sb||!session){location.replace("auth.html");return}user=session.user;
 const c=await sb.from("class_members").select("class_id").eq("user_id",user.id).eq("status","active");if(c.error)throw c.error;
 const ids=(c.data||[]).map(x=>x.class_id);if(!ids.length)throw Error("Você não possui matrícula ativa.");
 const cl=await sb.from("classes").select("id,code,name").in("id",ids);if(cl.error)throw cl.error;classes=cl.data||[];
 $("#helpClass").innerHTML=classes.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.code)+' — '+esc(x.name)+'</option>').join("");
 const preferred=localStorage.getItem("webacademy.student.activeClass");$("#helpClass").value=classes.find(x=>x.id===preferred)?.id||classes.find(x=>x.code==="2026.36.8")?.id||classes[0].id;
 $("#helpClass").onchange=()=>loadClass().catch(e=>feedback(e.message,true));$("#helpRouting").onchange=updateRouting;$("#helpRefresh").onclick=()=>loadRequests().catch(e=>feedback(e.message,true));
 $("#helpForm").onsubmit=async e=>{e.preventDefault();const route=$("#helpRouting").value,button=$("#helpSubmit");button.disabled=true;const payload={p_class_id:classId,p_title:$("#helpTitle").value.trim(),p_topic:$("#helpTopic").value,p_description:$("#helpDescription").value.trim(),p_routing:route,p_angel_id:route==="chosen_angel"?$("#helpAngel").value:null,p_project_id:$("#helpProject").value||null,p_mission_id:$("#helpMission").value.trim()||null,p_escalation_reason:route==="instructor"?$("#helpReason").value.trim():null};
 const {error}=await sb.rpc("angel_create_help_request",payload);button.disabled=false;if(error)return feedback("Não foi possível enviar: "+error.message,true);$("#helpForm").reset();updateRouting();feedback("Pedido enviado com sucesso! Acompanhe o andamento em Meus pedidos.");await loadRequests()};
 await loadClass();
 }catch(e){feedback("Erro ao abrir Central de Ajuda: "+e.message,true)}
}
init();