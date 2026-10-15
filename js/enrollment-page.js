import {getSupabase,getSession} from "./supabase-client.js";
const sb=await getSupabase(),session=await getSession(),$=s=>document.querySelector(s);
if(!sb||!session){location.replace("auth.html");throw new Error("AUTH_REQUIRED")}
const uid=session.user.id,fb=$("#enrollmentFeedback"),select=$("#enrollmentClass");
function feedback(message,error=false){fb.textContent=message;fb.className="feedback"+(error?" error":"")}
async function checkMembership(){
 // Só o cadastro prévio feito pelo instrutor pode gerar vínculo automático.
 await sb.rpc("claim_classroom_membership");
 const {data,error}=await sb.from("class_members").select("class_id").eq("user_id",uid).eq("status","active").limit(1);
 if(error)throw error;
 if(data?.length){location.replace("app.html");return true}
 return false;
}
async function load(){
 try{
  const {data:profile}=await sb.from("profiles").select("role,full_name").eq("id",uid).maybeSingle();
  if(profile?.role==="instructor"){location.replace("instructor.html");return}
  $("#enrollmentGreeting").textContent="Olá, "+(profile?.full_name||session.user.email||"estudante")+". Escolha uma turma para solicitar sua participação.";
  if(await checkMembership())return;
  const {data:classes,error:classError}=await sb.rpc("available_classes_for_join");
  if(classError)throw classError;
  const lookup=new Map((classes||[]).map(c=>[c.id,c]));
  select.replaceChildren(new Option("Selecione a turma...",""));
  for(const c of classes||[])select.add(new Option(c.code+" — "+(c.name||c.uc||"Turma"),c.id));
  const {data:requests,error}=await sb.from("class_join_requests").select("class_id,status,requested_at").eq("student_id",uid).order("requested_at",{ascending:false});
  if(error)throw error;
  const container=$("#enrollmentExisting");container.replaceChildren();
  for(const req of requests||[]){
   const card=document.createElement("div");card.className="enrollment-request";
   const title=document.createElement("strong");title.textContent=(lookup.get(req.class_id)?.code||"Turma")+" — "+({pending:"Aguardando aprovação",approved:"Aprovada",rejected:"Não aprovada"}[req.status]||req.status);
   const date=document.createElement("small");date.textContent="Solicitada em "+new Date(req.requested_at).toLocaleDateString("pt-BR");
   card.append(title,date);container.append(card);
  }
  const pending=(requests||[]).find(r=>r.status==="pending");
  const preferred=sessionStorage.getItem("webacademy.requestedClass");
  if(preferred&&lookup.has(preferred)&&!(requests||[]).some(r=>r.class_id===preferred)){
   select.value=preferred;
   sessionStorage.removeItem("webacademy.requestedClass");
   await submitRequest(preferred);
   return load();
  }
  if(pending){$("#enrollmentForm").hidden=true;feedback("Sua solicitação está em análise. Aguarde a decisão do instrutor.");}
  else{$("#enrollmentForm").hidden=false;feedback((requests||[]).some(r=>r.status==="rejected")?"Você pode enviar uma nova solicitação.":"");}
 }catch(err){feedback("Não foi possível consultar a matrícula: "+err.message,true)}
}
async function submitRequest(id){
 const {error}=await sb.rpc("request_class_join",{p_class_id:id});
 if(error)throw error;
}
$("#enrollmentForm").addEventListener("submit",async e=>{
 e.preventDefault();const id=select.value;if(!id)return;
 const button=e.submitter;button.disabled=true;feedback("Enviando solicitação...");
 try{await submitRequest(id);await load()}catch(err){feedback("Falha ao solicitar ingresso: "+err.message,true)}
 finally{button.disabled=false}
});
$("#refreshEnrollment").addEventListener("click",load);
$("#logoutEnrollment").addEventListener("click",async()=>{await sb.auth.signOut();location.replace("auth.html")});
await load();
