import {getSupabase,getSession} from "./supabase-client.js";
const sb=await getSupabase(),session=await getSession(),$=s=>document.querySelector(s);
if(sb&&session&&$("#joinRequestsDialog")){
 const dialog=$("#joinRequestsDialog"),list=$("#joinRequestsList"),feedback=$("#joinRequestsFeedback");
 async function load(){
  const {data,error}=await sb.rpc("instructor_pending_join_requests");
  if(error){feedback.textContent="Erro ao carregar solicitações: "+error.message;feedback.className="feedback error";return}
  const requests=data||[];
  $("#joinRequestCount").textContent=requests.length;
  $("#joinRequestCount").hidden=!requests.length;
  list.replaceChildren();
  if(!requests.length){const p=document.createElement("p");p.className="muted";p.textContent="Nenhuma solicitação aguardando aprovação.";list.append(p)}
  for(const req of requests){
   const card=document.createElement("article");card.className="join-request-card";
   const info=document.createElement("div"),title=document.createElement("strong"),desc=document.createElement("p"),date=document.createElement("small");
   title.textContent=req.student_name||"Estudante";
   desc.textContent=(req.student_email||"E-mail não informado")+" · Turma "+req.class_code;
   date.textContent="Solicitado em "+new Date(req.requested_at).toLocaleString("pt-BR");
   info.append(title,desc,date);
   const actions=document.createElement("div");actions.className="join-request-actions";
   for(const [approve,label] of [[true,"Aprovar"],[false,"Recusar"]]){
    const button=document.createElement("button");button.type="button";button.className="btn "+(approve?"btn-primary":"btn-secondary");button.textContent=label;
    button.addEventListener("click",async()=>{
     if(!confirm((approve?"Aprovar":"Recusar")+" a solicitação de "+(req.student_name||"estudante")+"?"))return;
     actions.querySelectorAll("button").forEach(b=>b.disabled=true);
     feedback.textContent="Registrando decisão...";feedback.className="feedback";
     const {error}=await sb.rpc("review_class_join",{p_request_id:req.request_id,p_approve:approve});
     if(error){feedback.textContent="Falha ao registrar decisão: "+error.message;feedback.className="feedback error";actions.querySelectorAll("button").forEach(b=>b.disabled=false);return}
     feedback.textContent=approve?"Ingresso aprovado.":"Solicitação recusada.";
     await load();
    });actions.append(button);
   }
   card.append(info,actions);list.append(card);
  }
 }
 $("#openJoinRequests").addEventListener("click",()=>{dialog.showModal();load()});
 $("#closeJoinRequests").addEventListener("click",()=>dialog.close());
 $("#refreshJoinRequests").addEventListener("click",load);
 load();
}
