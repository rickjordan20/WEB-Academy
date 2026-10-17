import {getSupabase,getSession} from "./supabase-client.js";
import {getState} from "./storage.js";
const reasons=[["absence","Ausência ou falta à aula"],["organization","Falta de atenção ou organização"],["platform","Problema na plataforma"],["internet","Internet ou equipamento"],["personal","Motivo pessoal ou de saúde"],["other","Outro motivo"]];
export async function mountMissionDelivery(missionId,access,root){
 const sb=await getSupabase(),session=await getSession();if(!sb||!session)return;
 const {data:members}=await sb.from("class_members").select("class_id").eq("user_id",session.user.id).eq("status","active").limit(1);
 const classId=members?.[0]?.class_id;if(!classId)return;
 const {data:previous}=await sb.from("mission_submissions").select("id,status,submitted_at,is_late,late_reason,late_explanation,feedback").eq("class_id",classId).eq("student_id",session.user.id).eq("mission_id",missionId).maybeSingle();
 const late=access?.state==="closed"||(access?.closesAt&&new Date(access.closesAt).getTime()<Date.now());
 const section=document.createElement("section");section.className="card current-mission mission-delivery"+(late?" is-overdue":"");
 const options=reasons.map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join("");
 const safe=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
 const statuses={submitted:"Enviada para avaliação",changes_requested:"Ajustes solicitados",evaluated:"Avaliada"};
 section.innerHTML=`
 <div class="delivery-heading"><div class="delivery-icon" aria-hidden="true">${late?"!":"✓"}</div><div class="delivery-heading-copy"><span class="delivery-eyebrow">${late?"ENTREGA FORA DO PRAZO":"REGISTRO DE ENTREGA"}</span><h2>${late?"Prazo encerrado":"Entregar missão"}</h2><p>${late?"Você ainda pode entregar esta missão. Informe o motivo do atraso para que o instrutor possa analisar sua justificativa.":"Envie sua atividade para avaliação do instrutor."}</p></div><span class="delivery-status">${late?"Prazo vencido":"No prazo"}</span></div>
 ${previous?`<div class="delivery-history"><strong>Última entrega:</strong> ${new Date(previous.submitted_at).toLocaleString("pt-BR")} <span>· ${statuses[previous.status]||safe(previous.status)}</span></div>`:""}
 ${previous?.feedback?`<div class="delivery-history"><strong>Feedback do instrutor:</strong> ${safe(previous.feedback)}</div>`:""}
 <div class="delivery-fields" ${late?"":"hidden"}>
 <label class="delivery-field"><span>Motivo do atraso <em>Obrigatório</em></span><select data-late-reason><option value="">Selecione o motivo</option>${options}</select></label>
 <label class="delivery-field"><span>Justificativa <em>Obrigatória</em></span><textarea data-late-explanation rows="4" placeholder="Conte brevemente o que aconteceu e por que não conseguiu entregar no prazo."></textarea><small>Escreva pelo menos 10 caracteres.</small></label>
 </div>
 <div class="delivery-footer"><p class="delivery-help">A entrega ficará registrada com a data e o horário do envio para análise do instrutor.</p><button class="btn btn-primary delivery-submit" type="button" data-submit-mission>${late?"Enviar entrega atrasada":"Enviar para avaliação"} →</button></div>
 <p class="delivery-feedback" data-delivery-feedback role="status" aria-live="polite"></p>`;

 if(!late){section.querySelector(".delivery-fields").remove();}
 const reason=section.querySelector("[data-late-reason]"),explanation=section.querySelector("[data-late-explanation]"),button=section.querySelector("[data-submit-mission]"),feedback=section.querySelector("[data-delivery-feedback]");
 if(late){reason.closest("label").hidden=false;explanation.closest("label").hidden=false;}
 if(late&&previous?.late_reason)reason.value=previous.late_reason;if(late&&previous?.late_explanation)explanation.value=previous.late_explanation;
 if(previous?.status==="evaluated"){button.disabled=true;feedback.textContent="Entrega já avaliada. Consulte o feedback do instrutor."}
 button.onclick=async()=>{
  if(late&&(!reason?.value||explanation?.value.trim().length<10)){feedback.textContent="Selecione o motivo do atraso e escreva uma justificativa com pelo menos 10 caracteres.";return}
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
