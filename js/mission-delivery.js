import {getSupabase,getSession} from "./supabase-client.js";
import {getState} from "./storage.js";
const reasons=[["absence","Ausência ou falta à aula"],["organization","Falta de atenção ou organização"],["platform","Problema na plataforma"],["internet","Internet ou equipamento"],["personal","Motivo pessoal ou de saúde"],["other","Outro motivo"]];
export async function mountMissionDelivery(missionId,access,root){
 const sb=await getSupabase(),session=await getSession();if(!sb||!session)return;
 const {data:members}=await sb.from("class_members").select("class_id").eq("user_id",session.user.id).eq("status","active").limit(1);
 const classId=members?.[0]?.class_id;if(!classId)return;
 const {data:previous}=await sb.from("mission_submissions").select("id,status,submitted_at,is_late,late_reason,late_explanation,feedback").eq("class_id",classId).eq("student_id",session.user.id).eq("mission_id",missionId).maybeSingle();
 const late=access?.state==="closed"||(access?.closesAt&&new Date(access.closesAt).getTime()<Date.now());
 const section=document.createElement("section");section.className="card current-mission";section.style.borderLeft=late?"4px solid #d33":"4px solid #398c67";
 const options=reasons.map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join("");
 section.innerHTML='<h2>'+(late?'Prazo vencido — entrega com justificativa':'Entrega da missão')+'</h2><p>'+(late?'Você pode entregar mesmo após o prazo. Informe o motivo para avaliação do instrutor.':'Registre sua entrega para avaliação do instrutor.')+'</p>'+(previous?'<p>Última entrega: '+new Date(previous.submitted_at).toLocaleString("pt-BR")+' · '+previous.status+'</p>':'')+(previous?.feedback?'<p>Feedback: '+previous.feedback.replaceAll("<","&lt;")+'</p>':'')+'<label>Motivo do atraso<select data-late-reason><option value="">Selecione...</option>'+options+'</select></label><label>Justificativa<textarea data-late-explanation placeholder="Explique brevemente o motivo do atraso"></textarea></label><button class="btn btn-primary" type="button" data-submit-mission>Enviar para avaliação</button><p data-delivery-feedback role="status"></p>';
 const reason=section.querySelector("[data-late-reason]"),explanation=section.querySelector("[data-late-explanation]"),button=section.querySelector("[data-submit-mission]"),feedback=section.querySelector("[data-delivery-feedback]");
 reason.closest("label").hidden=!late;explanation.closest("label").hidden=!late;
 if(previous?.late_reason)reason.value=previous.late_reason;if(previous?.late_explanation)explanation.value=previous.late_explanation;
 if(previous?.status==="evaluated"){button.disabled=true;feedback.textContent="Entrega já avaliada. Consulte o feedback do instrutor."}
 button.onclick=async()=>{
  if(late&&(!reason.value||explanation.value.trim().length<10)){feedback.textContent="Selecione o motivo e escreva uma justificativa de pelo menos 10 caracteres.";return}
  button.disabled=true;feedback.textContent="Enviando...";
  try{
   const state=getState(),answers=Object.fromEntries(Object.entries(state?.answers||{}).filter(([key])=>key.startsWith(missionId+":")||key.startsWith("F"+missionId.slice(0,-1)+":")));
   const payload={class_id:classId,student_id:session.user.id,mission_id:missionId,answers,evidence:state?.evidence||[],status:"submitted",is_late:!!late,deadline_at:access?.closesAt||null,late_reason:late?reason.value:null,late_explanation:late?explanation.value.trim():"",submitted_at:new Date().toISOString()};
   const result=previous?.id?await sb.from("mission_submissions").update(payload).eq("id",previous.id):await sb.from("mission_submissions").insert(payload);
   if(result.error)throw result.error;
   feedback.textContent="Entrega registrada para avaliação do instrutor.";
  }catch(error){button.disabled=false;feedback.textContent="Não foi possível entregar: "+error.message}
 };
 root.append(section);
}
