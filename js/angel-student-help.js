import {getSupabase,getSession} from "./supabase-client.js";
import {MISSIONS,EXTRA_MISSIONS} from "../data/missions.js";
const $=s=>document.querySelector(s);
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const labels={pending:"Aguardando Aluno Anjo",in_progress:"Em atendimento",escalated:"Encaminhado ao instrutor",awaiting_confirmation:"Aguardando sua confirmação",resolved:"Resolvido",reopened:"Reaberto",cancelled:"Cancelado"};
let sb,user,classes=[],angels=[],requests=[],names=new Map(),classId="";
let wizardStep=1,editingRequestId=null;
function updateJourney(step=wizardStep){
 document.querySelectorAll("[data-journey-step]").forEach(el=>{
  const n=Number(el.dataset.journeyStep);
  el.classList.toggle("is-current",n===step);
  el.classList.toggle("is-complete",n<step);
  el.classList.toggle("is-locked",n===3&&!requests.length);
  if(n===step)el.setAttribute("aria-current","step");else el.removeAttribute("aria-current");
 });
}
function setWizardStep(step){
 wizardStep=step;
 document.querySelectorAll("[data-help-pane]").forEach(el=>{el.hidden=Number(el.dataset.helpPane)!==step});
 $("#helpStepEyebrow").textContent="ETAPA "+step+" DE 3";
 $("#helpStepTitle").textContent=step===1?"🧩 Minha dificuldade":"🤝 Quem vai me ajudar?";
 $("#helpStepDescription").textContent=step===1?"Conte o que aconteceu e o que você já tentou fazer. Não compartilhe senhas ou dados sensíveis.":"Escolha como receber ajuda e confira os dados antes de enviar.";
 $("#helpBack").hidden=step===1;$("#helpNext").hidden=step!==1;$("#helpSubmit").hidden=step!==2;
 updateJourney(step);
 if(step===2)renderReview();
}
function renderReview(){
 const project=$("#helpProject").selectedOptions[0]?.textContent||"Dúvida geral";
 const route=$("#helpRouting").value;
 const destination=route==="automatic"?"Aluno Anjo escolhido automaticamente":route==="chosen_angel"?$("#helpAngel").selectedOptions[0]?.textContent||"Selecione um Aluno Anjo":"Instrutor";
 $("#helpReview").innerHTML='<div class="help-review-title">📋 Confira seu pedido</div><dl><div><dt>Assunto</dt><dd>'+esc($("#helpTopic").selectedOptions[0]?.textContent)+'</dd></div><div><dt>Projeto</dt><dd>'+esc(project)+'</dd></div><div><dt>Título</dt><dd>'+esc($("#helpTitle").value.trim())+'</dd></div><div><dt>Modalidade</dt><dd>'+esc($("#helpMode").value==="in_person"?"Presencialmente":"Pelo site") +'</dd></div><div><dt>Ajuda escolhida</dt><dd>'+esc(destination)+'</dd></div></dl>';
}
function validateFirstStep(){
 for(const id of ["helpClass","helpTitle","helpTopic","helpDescription"]){
  const field=$("#"+id);
  if(!field.checkValidity()){field.reportValidity();field.focus();return false}
 }
 if($("#helpTitle").value.trim().length<4){$("#helpTitle").setCustomValidity("Informe um título com pelo menos 4 caracteres.");$("#helpTitle").reportValidity();$("#helpTitle").setCustomValidity("");return false}
 if($("#helpDescription").value.trim().length<10){$("#helpDescription").setCustomValidity("Descreva sua dificuldade com pelo menos 10 caracteres.");$("#helpDescription").reportValidity();$("#helpDescription").setCustomValidity("");return false}
 return true;
}
function validateSecondStep(){
 const route=$("#helpRouting").value;
 const field=route==="chosen_angel"?$("#helpAngel"):route==="instructor"?$("#helpReason"):null;
 if(!field)return true;
 if(!field.checkValidity()){field.reportValidity();field.focus();return false}
 if(route==="instructor"&&field.value.trim().length<10){
  field.setCustomValidity("Explique o motivo em pelo menos 10 caracteres.");
  field.reportValidity();field.setCustomValidity("");field.focus();return false;
 }
 return true;
}
function helpProgress(status){const stage=status==="resolved"?3:status==="pending"||status==="escalated"?1:2;const title=status==="resolved"?"Missão concluída! 🎉":status==="awaiting_confirmation"?"Sua confirmação é a próxima etapa":status==="cancelled"?"Pedido cancelado":stage===1?"Pedido enviado — aguardando atendimento":"Orientação em andamento";return '<div class="help-progress" aria-label="Progresso do atendimento"><span class="done"></span><span class="'+(stage>1?"done":"current")+'"></span><span class="'+(stage===3?"done":stage===2?"current":"")+'"></span></div><div class="help-progress-label">'+esc(title)+'</div>'}
function feedback(msg,error=false){$("#helpFeedback").innerHTML='<div class="angel-feedback"'+(error?' style="border-color:#e57373"':'')+'>'+esc(msg)+'</div>'}
async function loadMissionOptions(){
 const select=$("#helpMission"),selected=select.value;
 const base=[...MISSIONS,...EXTRA_MISSIONS];
 const {data,error}=await sb.from("mission_content_overrides").select("mission_id,content").eq("class_id",classId);
 if(error)throw error;
 const overrides=new Map((data||[]).map(x=>[x.mission_id,x.content||{}]));
 const registered=new Map(base.map(m=>[m.id,{id:m.id,title:m.subtitle||m.title||m.official||m.id}]));
 for(const [id,content] of overrides){
  if(!["published","closed"].includes(content.status))continue;
  if(id==="3A"&&(content.guild_template_version||content.guild_config||content.steps?.some(step=>String(step.id||"").startsWith("guild-3A-"))))continue;
  if(registered.has(id)){
   if(typeof content.title==="string"&&content.title.trim())registered.get(id).title=content.title.trim();
   else if(typeof content.subtitle==="string"&&content.subtitle.trim())registered.get(id).title=content.subtitle.trim();
  }else if(["published","closed"].includes(content.status)){
   registered.set(id,{id,title:content.title||content.subtitle||id});
  }
 }
 const options=[...registered.values()].sort((a,b)=>a.id.localeCompare(b.id,"pt-BR",{numeric:true}));
 select.innerHTML='<option value="">Nenhuma missão relacionada</option>'+options.map(m=>'<option value="'+esc(m.id)+'">'+esc(m.id+" — "+m.title)+'</option>').join("");
 if(options.some(m=>m.id===selected))select.value=selected;
}
async function loadClass(){
 classId=$("#helpClass").value;
 const [p,n]=await Promise.all([sb.from("learning_projects").select("id,name").eq("class_id",classId).eq("active",true).order("name"),sb.rpc("angel_available_monitor_names",{p_class_id:classId})]);
 if(p.error||n.error)throw p.error||n.error;
 $("#helpProject").innerHTML='<option value="">Dúvida geral</option>'+(p.data||[]).map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join("");
 angels=(n.data||[]).filter(x=>x.user_id!==user.id);
 names=new Map(angels.map(x=>[x.user_id,x.full_name]));
 $("#helpAngel").innerHTML='<option value="">Selecione um monitor</option>'+angels.map(a=>'<option value="'+esc(a.user_id)+'">'+esc(a.full_name)+' · '+esc((a.specialties||[]).join(", ")||"Apoio geral")+'</option>').join("");
 await loadMissionOptions();updateRouting();await loadRequests();
}
function updateRouting(){
 const route=$("#helpRouting").value;
 $("#helpAngelRow").hidden=route!=="chosen_angel";$("#helpReasonRow").hidden=route!=="instructor";
 $("#helpAngel").required=route==="chosen_angel";$("#helpAngel").disabled=route!=="chosen_angel";$("#helpReason").required=route==="instructor";$("#helpReason").disabled=route!=="instructor";
 $("#helpRoutingHint").textContent=route==="automatic"?"O sistema atribuirá a um monitor disponível com menor carga. Se não houver monitores disponíveis, encaminhará ao instrutor.":route==="chosen_angel"?"Você pode escolher um monitor disponível. Se ele ficar indisponível antes do envio, escolha outro ou use distribuição automática.":"O pedido será enviado diretamente ao instrutor. Explique o motivo técnico do encaminhamento.";
}
async function loadRequests(){
 const {data,error}=await sb.from("angel_help_requests").select("*").eq("class_id",classId).eq("requester_id",user.id).order("created_at",{ascending:false});
 if(error)throw error;requests=data||[];render();$("#helpTracking").hidden=!requests.length;updateJourney(wizardStep);
}
function render(){
 $("#helpRequests").innerHTML=requests.length?requests.map(r=>'<article class="angel-request"><div class="angel-item-head"><strong>'+esc(r.title)+'</strong><span class="angel-chip">'+esc(labels[r.status]||r.status)+'</span></div><p>'+esc(r.description)+'</p>'+helpProgress(r.status)+(r.status==='resolved'?'<div class="help-achievement">🏆 Missão de colaboração concluída! Sua confirmação ajuda a reconhecer quem orientou você.</div>':'')+'<small>Modalidade: '+(r.preferred_help_mode==='in_person'?'🤝 Presencialmente':'💬 Pelo site')+'</small><br><small>'+new Date(r.created_at).toLocaleString("pt-BR")+' · '+esc(r.topic)+'</small><div class="angel-actions">'+(r.status==="awaiting_confirmation"?'<button class="btn btn-primary" data-action="confirm" data-id="'+esc(r.id)+'">Minha dúvida foi resolvida</button><button class="btn btn-secondary" data-action="reopen" data-id="'+esc(r.id)+'">Ainda preciso de ajuda</button>':'')+(r.status==="resolved"?'<button class="btn btn-secondary" data-action="reopen" data-id="'+esc(r.id)+'">Reabrir pedido</button>':'')+(!["resolved","cancelled"].includes(r.status)?'<button class="btn btn-secondary" data-action="cancel" data-id="'+esc(r.id)+'">Cancelar pedido</button>':'')+'</div><details data-request="'+esc(r.id)+'" class="angel-student-conversation"><summary>💬 Conversar e acompanhar respostas</summary><div class="angel-chat-messages" data-history="'+esc(r.id)+'"></div>'+(!["resolved","cancelled"].includes(r.status)?'<form data-message="'+esc(r.id)+'" class="angel-chat-form"><label class="angel-chat-label">Sua mensagem<textarea name="body" required rows="2" maxlength="5000" placeholder="Responda ao instrutor ou Aluno Anjo..."></textarea></label><div class="angel-chat-controls"><button class="btn btn-primary" type="submit">Enviar mensagem</button></div></form>':'')+'</details></article>').join(""):'<p class="angel-empty">Você ainda não abriu nenhum pedido de ajuda nesta turma.</p>';
 $("#helpRequests").querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>{const r=requests.find(x=>x.id===b.dataset.edit);if(!r)return;editingRequestId=r.id;$("#helpEditTitle").value=r.title;$("#helpEditTopic").value=r.topic;$("#helpEditDescription").value=r.description;$("#helpEditMode").value=r.preferred_help_mode||"online";$("#helpEditDialog").showModal()});
 $("#helpRequests").querySelectorAll("[data-resolve]").forEach(b=>b.onclick=async()=>{if(!confirm("Sua dúvida já foi resolvida? Esta ação encerrará o atendimento e avisará o responsável."))return;b.disabled=true;const {error}=await sb.rpc("angel_student_resolve_request",{p_request_id:b.dataset.resolve});if(error){b.disabled=false;return feedback(error.message,true)}feedback("Solicitação marcada como atendida.");await loadRequests()});
 $("#helpRequests").querySelectorAll("[data-action]").forEach(b=>b.onclick=async()=>{let note=null;if(b.dataset.action==="reopen"){note=prompt("O que ainda não foi resolvido? (mínimo 10 caracteres)");if(note===null)return;if(note.trim().length<10)return feedback("Descreva o problema em pelo menos 10 caracteres.",true)}if(b.dataset.action==="cancel"&&!confirm("Cancelar este pedido?"))return;b.disabled=true;const {error}=await sb.rpc("angel_transition_help_request",{p_request_id:b.dataset.id,p_action:b.dataset.action,p_note:note});if(error){b.disabled=false;return feedback(error.message,true)}feedback("Pedido atualizado.");await loadRequests()});
 $("#helpRequests").querySelectorAll("details").forEach(d=>d.addEventListener("toggle",()=>{if(d.open)loadHistory(d.dataset.request)}));
 $("#helpRequests").querySelectorAll("[data-message]").forEach(f=>f.onsubmit=async e=>{e.preventDefault();const body=f.elements.namedItem("body").value;const b=f.querySelector("button");b.disabled=true;const {error}=await sb.rpc("angel_add_help_message",{p_request_id:f.dataset.message,p_body:body,p_message_type:"message"});b.disabled=false;if(error)return feedback(error.message,true);f.reset();feedback("Mensagem enviada.");await loadHistory(f.dataset.message)});
}
async function loadHistory(id){
 const el=$("#helpRequests").querySelector('[data-history="'+id+'"]');if(!el)return;
 const [m,e]=await Promise.all([sb.from("angel_help_messages").select("author_id,body,message_type,created_at").eq("request_id",id).order("created_at"),sb.from("angel_help_events").select("actor_id,action,new_status,details,created_at").eq("request_id",id).order("created_at")]);
 if(m.error||e.error){el.textContent="Não foi possível carregar as mensagens.";return}
 const messages=(m.data||[]).map(x=>'<div class="angel-chat-bubble '+(x.author_id===user.id?"mine":"theirs")+'"><strong>'+esc(x.author_id===user.id?"Você":"Aluno Anjo / Instrutor")+'</strong><p>'+(x.message_type==="in_person_summary"?"📍 Orientação presencial: ":"")+esc(x.body)+'</p><time>'+new Date(x.created_at).toLocaleString("pt-BR")+'</time></div>').join("");
 const events=(e.data||[]).map(x=>'<p class="angel-chat-event">'+new Date(x.created_at).toLocaleString("pt-BR")+' · '+esc(labels[x.new_status]||x.action)+(x.details?.note?" · "+esc(x.details.note):"")+'</p>').join("");
 el.innerHTML=messages||'<p class="angel-chat-empty">Nenhuma resposta ainda. Você pode enviar uma mensagem abaixo.</p>';
 if(events)el.insertAdjacentHTML("beforeend",'<details class="angel-chat-events"><summary>Histórico do atendimento</summary>'+events+'</details>');
 el.scrollTop=el.scrollHeight;
}
async function init(){
 try{sb=await getSupabase();const session=await getSession();if(!sb||!session){location.replace("auth.html");return}user=session.user;
 const c=await sb.from("class_members").select("class_id").eq("user_id",user.id).eq("status","active");if(c.error)throw c.error;
 const ids=(c.data||[]).map(x=>x.class_id);if(!ids.length)throw Error("Você não possui matrícula ativa.");
 const cl=await sb.from("classes").select("id,code,name").in("id",ids);if(cl.error)throw cl.error;classes=cl.data||[];
 $("#helpClass").innerHTML=classes.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.code)+' — '+esc(x.name)+'</option>').join("");
 const preferred=localStorage.getItem("webacademy.student.activeClass");$("#helpClass").value=classes.find(x=>x.id===preferred)?.id||classes.find(x=>x.code==="2026.36.8")?.id||classes[0].id;
 $("#helpEditClose").onclick=()=>$("#helpEditDialog").close();
 $("#helpEditForm").onsubmit=async e=>{e.preventDefault();const b=$("#helpEditForm").querySelector('button[type="submit"]');b.disabled=true;const {error}=await sb.rpc("angel_student_update_request",{p_request_id:editingRequestId,p_title:$("#helpEditTitle").value.trim(),p_topic:$("#helpEditTopic").value,p_description:$("#helpEditDescription").value.trim(),p_preferred_help_mode:$("#helpEditMode").value});b.disabled=false;if(error)return feedback("Não foi possível editar: "+error.message,true);$("#helpEditDialog").close();feedback("Solicitação atualizada.");await loadRequests()};
 $("#helpClass").onchange=()=>loadClass().catch(e=>feedback(e.message,true));$("#helpRouting").onchange=()=>{updateRouting();renderReview()};$("#helpAngel").onchange=renderReview;$("#helpRefresh").onclick=()=>loadRequests().catch(e=>feedback(e.message,true));
 $("#helpNext").onclick=()=>{if(validateFirstStep()){setWizardStep(2);$("#helpWizard").scrollIntoView({behavior:"smooth",block:"start"})}};$("#helpBack").onclick=()=>setWizardStep(1);$("#helpForm").onsubmit=async e=>{e.preventDefault();if(wizardStep!==2)return;if(!validateFirstStep()){setWizardStep(1);validateFirstStep();return}if(!validateSecondStep())return;const route=$("#helpRouting").value,requestedMode=$("#helpMode").value,button=$("#helpSubmit");button.disabled=true;const payload={p_class_id:classId,p_title:$("#helpTitle").value.trim(),p_topic:$("#helpTopic").value,p_description:$("#helpDescription").value.trim(),p_routing:route,p_angel_id:route==="chosen_angel"?$("#helpAngel").value:null,p_project_id:$("#helpProject").value||null,p_mission_id:$("#helpMission").value||null,p_escalation_reason:route==="instructor"?$("#helpReason").value.trim():null};
 const {error}=await sb.rpc("angel_create_help_request",payload);button.disabled=false;if(error)return feedback("Não foi possível enviar: "+error.message,true);$("#helpForm").reset();updateRouting();setWizardStep(1);feedback("🚀 Pedido enviado! Acompanhe o atendimento abaixo e confirme quando sua dúvida for resolvida.");await loadRequests();if(requests.length){const created=requests[0];const {error:modeError}=await sb.rpc("angel_student_set_help_mode",{p_request_id:created.id,p_preferred_help_mode:requestedMode});if(modeError)feedback("Pedido enviado, mas não foi possível salvar a modalidade: "+modeError.message,true);else await loadRequests()}updateJourney(3);$("#helpTracking").scrollIntoView({behavior:"smooth",block:"start"})};
 setWizardStep(1);await loadClass();
 }catch(e){feedback("Erro ao abrir Central de Ajuda: "+e.message,true)}
}
init();