import {getSupabase,getSession} from "./supabase-client.js";
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const labels={pending:"Aguardando",in_progress:"Em atendimento",escalated:"Escalonado ao instrutor",awaiting_confirmation:"Aguardando confirmação",resolved:"Resolvido",reopened:"Reaberto",cancelled:"Cancelado"};
let sb,user,activeClass,assignment,requests=[],names=new Map();
function notify(msg,error=false){$("#angelMonitorFeedback").innerHTML='<div class="angel-feedback"'+(error?' style="border-color:#e57373"':'')+'>'+esc(msg)+'</div>'}
function displayName(id){return names.get(id)||"Colega"}
async function load(){
 const [a,r]=await Promise.all([
  sb.from("class_angel_assignments").select("*").eq("class_id",activeClass).eq("user_id",user.id).eq("active",true).maybeSingle(),
  sb.from("angel_help_requests").select("*").eq("class_id",activeClass).eq("angel_id",user.id).order("created_at",{ascending:false})
 ]);
 if(a.error)throw a.error;if(r.error)throw r.error;assignment=a.data;
 if(!assignment){$("#angelMonitorIntro").innerHTML="<h2>Acesso de monitoria indisponível</h2><p>Você ainda não foi nomeado Aluno Anjo nesta turma, ou sua monitoria foi encerrada. Continue utilizando suas missões normalmente.</p>";$("#angelMonitorStats").innerHTML="";$("#angelMonitorQueue").hidden=true;return}
 requests=r.data||[];
 const ids=[...new Set(requests.map(x=>x.requester_id))];
 names=new Map();
 if(ids.length){const p=await sb.from("profiles").select("id,full_name").in("id",ids);if(!p.error)names=new Map((p.data||[]).map(x=>[x.id,x.full_name]))}
 $("#angelMonitorIntro").innerHTML='<div class="angel-row"><div><h2>Seu distintivo: Aluno Anjo 💙</h2><p>Especialidades: '+esc((assignment.specialties||[]).join(" · ")||"Apoio geral")+'</p></div><label>Minha disponibilidade<select id="angelMyAvailability"><option value="available">Disponível</option><option value="busy">Ocupado</option><option value="unavailable">Indisponível</option></select></label></div><p>Ao ajudar pessoalmente, registre o que foi orientado. O colega confirmará a resolução.</p>';
 $("#angelMyAvailability").value=assignment.availability;
 $("#angelMyAvailability").onchange=async e=>{const {error}=await sb.rpc("angel_set_availability",{p_class_id:activeClass,p_availability:e.target.value});if(error){notify(error.message,true);e.target.value=assignment.availability;return}assignment.availability=e.target.value;notify("Disponibilidade atualizada.")};
 $("#angelMonitorStats").innerHTML=[["Aguardando",requests.filter(r=>r.status==="pending"||r.status==="reopened").length],["Em atendimento",requests.filter(r=>r.status==="in_progress").length],["Aguardando confirmação",requests.filter(r=>r.status==="awaiting_confirmation").length],["Resolvidos",requests.filter(r=>r.status==="resolved").length]].map(([t,n])=>'<div class="angel-stat"><strong>'+n+'</strong><span>'+t+'</span></div>').join("");
 $("#angelMonitorQueue").hidden=false;draw();
}
function draw(){
 const filter=$("#angelMonitorFilter").value;
 const list=requests.filter(r=>filter==="all"||(filter==="open"?!["resolved","cancelled","escalated"].includes(r.status):r.status===filter));
 $("#angelMonitorRequests").innerHTML=list.length?list.map(r=>'<article class="angel-request"><div class="angel-item-head"><div><strong>'+esc(r.title)+'</strong> <span class="angel-chip">'+esc(labels[r.status]||r.status)+'</span><p>'+esc(displayName(r.requester_id))+' · '+esc(r.topic)+' · '+new Date(r.created_at).toLocaleString("pt-BR")+'</p></div></div><p>'+esc(r.description)+'</p>'+(r.mission_id?'<small>Missão: '+esc(r.mission_id)+'</small>':'')+'<div class="angel-actions">'+(r.status==="pending"||r.status==="reopened"?'<button class="btn btn-primary" data-action="accept" data-id="'+esc(r.id)+'">Aceitar atendimento</button>':'')+(r.status==="in_progress"?'<button class="btn btn-primary" data-action="mark_helped" data-id="'+esc(r.id)+'">Orientação concluída</button>':'')+(['pending','reopened','in_progress'].includes(r.status)?'<button class="btn btn-secondary" data-action="escalate" data-id="'+esc(r.id)+'">Escalonar ao instrutor</button>':'')+'</div><details data-request="'+esc(r.id)+'"><summary>💬 Conversar com o colega</summary><div class="angel-chat-messages" data-history="'+esc(r.id)+'">Abra para carregar as mensagens.</div>'+(["pending","in_progress","reopened","awaiting_confirmation"].includes(r.status)?'<form class="angel-chat-form" data-message-form="'+esc(r.id)+'"><label class="angel-chat-label">Tipo de registro<select name="kind"><option value="message">Mensagem ao colega</option><option value="in_person_summary">Atendimento presencial</option></select></label><label class="angel-chat-label">Orientação ou mensagem<textarea name="body" rows="3" maxlength="5000" required placeholder="Explique o que foi orientado e quais passos foram realizados."></textarea></label><button type="submit" class="btn btn-secondary">Enviar mensagem</button></form>':'')+'</details></article>').join(""):'<p class="angel-empty">Nenhum atendimento encontrado neste filtro.</p>';
 $("#angelMonitorRequests").querySelectorAll("[data-action]").forEach(b=>b.onclick=async()=>{const action=b.dataset.action;let note=null;if(action!=="accept"){note=prompt(action==="escalate"?"Descreva o que você já tentou e por que precisa do instrutor (mínimo 10 caracteres):":"Resuma a orientação realizada (mínimo 10 caracteres):");if(note===null)return;if(note.trim().length<10)return notify("Escreva pelo menos 10 caracteres.",true)}
 b.disabled=true;
 const {error}=await sb.rpc("angel_transition_help_request",{p_request_id:b.dataset.id,p_action:action,p_note:note});
 if(error){b.disabled=false;return notify(error.message,true)}
 notify(action==="escalate"?"Pedido escalonado ao instrutor.":action==="accept"?"Atendimento aceito.":"Orientação registrada; aguardando confirmação do colega.");
 await load();
 });
 $("#angelMonitorRequests").querySelectorAll("details").forEach(d=>d.addEventListener("toggle",()=>{if(d.open)loadHistory(d.dataset.request)}));
 $("#angelMonitorRequests").querySelectorAll("[data-message-form]").forEach(form=>form.onsubmit=async e=>{e.preventDefault();const id=form.dataset.messageForm,body=form.elements.namedItem("body").value,kind=form.elements.namedItem("kind").value;const button=form.querySelector("button");button.disabled=true;const {error}=await sb.rpc("angel_add_help_message",{p_request_id:id,p_body:body,p_message_type:kind});button.disabled=false;if(error)return notify(error.message,true);form.reset();notify("Registro salvo no histórico do pedido.");await loadHistory(id)});
}
async function loadHistory(id){
 const el=$("#angelMonitorRequests").querySelector('[data-history="'+id+'"]');if(!el)return;
 const [m,e]=await Promise.all([sb.from("angel_help_messages").select("author_id,body,message_type,created_at").eq("request_id",id).order("created_at"),sb.from("angel_help_events").select("actor_id,action,new_status,details,created_at").eq("request_id",id).order("created_at")]);
 if(m.error||e.error){el.textContent="Não foi possível consultar as mensagens.";return}
 const r=requests.find(x=>x.id===id);
 el.innerHTML=(m.data||[]).map(x=>'<div class="angel-chat-bubble '+(x.author_id===user.id?"mine":"theirs")+'"><strong>'+esc(x.author_id===user.id?"Você":x.author_id===r?.requester_id?displayName(x.author_id):"Instrutor")+'</strong><p>'+(x.message_type==="in_person_summary"?"📍 Atendimento presencial: ":"")+esc(x.body)+'</p><time>'+new Date(x.created_at).toLocaleString("pt-BR")+'</time></div>').join("")||'<p class="angel-chat-empty">Nenhuma mensagem ainda. Você pode orientar o colega pelo site.</p>';
 const history=(e.data||[]).map(x=>'<p class="angel-chat-event">'+new Date(x.created_at).toLocaleString("pt-BR")+' · '+esc(labels[x.new_status]||x.action)+(x.details?.note?" · "+esc(x.details.note):"")+'</p>').join("");
 if(history)el.insertAdjacentHTML("beforeend",'<details class="angel-chat-events"><summary>Histórico de status</summary>'+history+'</details>');
 el.scrollTop=el.scrollHeight;
}
async function init(){
 try{sb=await getSupabase();const session=await getSession();if(!sb||!session){location.replace("auth.html");return}user=session.user;
 const c=await sb.from("class_members").select("class_id").eq("user_id",user.id).eq("status","active");if(c.error)throw c.error;
 const memberships=c.data||[];if(!memberships.length){$("#angelMonitorIntro").innerHTML="<p>Você não possui vínculo ativo com uma turma.</p>";return}
 const preferred=localStorage.getItem("webacademy.student.activeClass");const classes=memberships.map(m=>m.class_id);
 const a=await sb.from("class_angel_assignments").select("class_id").eq("user_id",user.id).eq("active",true).in("class_id",classes);
 if(a.error)throw a.error;
 activeClass=(a.data||[]).find(x=>x.class_id===preferred)?.class_id||(a.data||[])[0]?.class_id||memberships.find(x=>x.class_id===preferred)?.class_id||classes[0];
 $("#angelMonitorFilter").onchange=draw;await load();
 }catch(err){notify("Não foi possível carregar seu painel: "+err.message,true)}
}
init();
