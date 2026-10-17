import {getSupabase,getSession} from "./supabase-client.js";
import {getState} from "./storage.js";
import {getMission,getFundamental,completeFundamentalStep} from "./mission-engine.js";
import {estimateMissionXp} from "./mission-assessment-utils.js";
import {renderStep,bindStep} from "./step-renderer.js";
let cachedRevision=null;
export function reapplyMissionRevision(root,mission){if(cachedRevision?.missionId===mission?.id)applyMissionRevision(root,mission,cachedRevision.previous)}
const reasons=[["absence","Ausência ou falta à aula"],["organization","Falta de atenção ou organização"],["platform","Problema na plataforma"],["internet","Internet ou equipamento"],["personal","Motivo pessoal ou de saúde"],["other","Outro motivo"]];
export async function mountMissionDelivery(missionId,access,root){
 const sb=await getSupabase(),session=await getSession();if(!sb||!session)return;
 const {data:members}=await sb.from("class_members").select("class_id").eq("user_id",session.user.id).eq("status","active").limit(1);
 const classId=members?.[0]?.class_id;if(!classId)return;
 const {data:previous}=await sb.from("mission_submissions").select("id,status,submitted_at,is_late,late_reason,late_explanation,feedback,grades").eq("class_id",classId).eq("student_id",session.user.id).eq("mission_id",missionId).maybeSingle();
 const mission=getMission(missionId),fundamental=mission?.type==="training"?getFundamental(mission.phase):null;
 const isRevision=previous?.status==="changes_requested";
 const safeText=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
 if(isRevision){cachedRevision={missionId,previous};applyMissionRevision(root,mission,previous)}
 const late=access?.state==="closed"||(access?.closesAt&&new Date(access.closesAt).getTime()<Date.now());
 const section=document.createElement("section");section.className="card current-mission mission-delivery"+(late?" is-overdue":"");
 const options=reasons.map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join("");
 const safe=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
 const statuses={submitted:"Enviada para avaliação",changes_requested:"Ajustes solicitados",evaluated:"Avaliada"};
 section.innerHTML=`
 <div class="delivery-heading"><div class="delivery-icon" aria-hidden="true">${late?"!":"✓"}</div><div class="delivery-heading-copy"><span class="delivery-eyebrow">${late?"ENTREGA FORA DO PRAZO":"REGISTRO DE ENTREGA"}</span><h2>${late?"Prazo encerrado":"Entregar missão"}</h2><p>${late?"Você ainda pode entregar esta missão. Informe o motivo do atraso para que o instrutor possa analisar sua justificativa.":"Envie sua atividade para avaliação do instrutor."}</p></div><span class="delivery-status">${late?"Prazo vencido":"No prazo"}</span></div>
 ${previous?`<div class="delivery-history"><strong>Última entrega:</strong> ${new Date(previous.submitted_at).toLocaleString("pt-BR")} <span>· ${statuses[previous.status]||safe(previous.status)}</span></div>`:""}
 ${previous?.grades?.indicators&&Object.keys(previous.grades.indicators).length?`<div class="delivery-history"><strong>Indicadores avaliados:</strong> ${Object.entries(previous.grades.indicators).map(([k,v])=>safe(k)+" — "+safe(v)).join(" · ")}</div>`:""}
 
 ${previous?.feedback&&!isRevision?`<div class="delivery-history"><strong>Recado do instrutor:</strong> ${safe(previous.feedback)}</div>`:""}
 <div class="delivery-fields" ${late?"":"hidden"}>
 <label class="delivery-field"><span>Motivo do atraso <em>Obrigatório</em></span><select data-late-reason><option value="">Selecione o motivo</option>${options}</select></label>
 <label class="delivery-field"><span>Justificativa <em>Obrigatória</em></span><textarea data-late-explanation rows="4" placeholder="Conte brevemente o que aconteceu e por que não conseguiu entregar no prazo."></textarea><small>Escreva pelo menos 10 caracteres.</small></label>
 </div>
 <div class="delivery-preflight" data-delivery-preflight hidden></div>
 <div class="delivery-footer"><p class="delivery-help">A entrega ficará registrada com a data e o horário do envio para análise do instrutor.</p><button class="btn btn-primary delivery-submit" type="button" data-submit-mission>${late?"Enviar entrega atrasada":"Enviar para avaliação"} →</button></div>
 <p class="delivery-feedback" data-delivery-feedback role="status" aria-live="polite"></p>`;

 if(!late){section.querySelector(".delivery-fields").remove();}
 const preflight=section.querySelector("[data-delivery-preflight]");let confirmedFingerprint=null;
 const reason=section.querySelector("[data-late-reason]"),explanation=section.querySelector("[data-late-explanation]"),button=section.querySelector("[data-submit-mission]"),feedback=section.querySelector("[data-delivery-feedback]");
 if(late){reason.closest("label").hidden=false;explanation.closest("label").hidden=false;}
 if(late&&previous?.late_reason)reason.value=previous.late_reason;if(late&&previous?.late_explanation)explanation.value=previous.late_explanation;
 if(previous?.status==="evaluated"){button.disabled=true;feedback.textContent="Entrega já avaliada. Consulte o feedback do instrutor."}
 button.onclick=async()=>{
  if(late&&(!reason?.value||explanation?.value.trim().length<10)){feedback.textContent="Selecione o motivo do atraso e escreva uma justificativa com pelo menos 10 caracteres.";return}
  try{
   const state=getState(),answers=Object.fromEntries(Object.entries(state?.answers||{}).filter(([key])=>key.startsWith(missionId+":")||key.startsWith("F"+missionId.slice(0,-1)+":")));
   const phase=Number(String(missionId).match(/^\\d+/)?.[0]||0);
   const missionProgress=state?.journey?.missionProgress?.[missionId]||{};
   const fundamentalId="F"+phase;
   const fundamentalProgress=state?.journey?.fundamentalProgress?.[fundamentalId]||{};
   const progressSnapshot={
    version:1,capturedAt:new Date().toISOString(),
    mission:{completedSteps:[...(missionProgress.completedSteps||[])],startedAt:missionProgress.startedAt||null,completed:!!state?.journey?.completedMissions?.includes(missionId)},
    fundamentals:{id:fundamentalId,completedSteps:[...(fundamentalProgress.completedSteps||[])],startedAt:fundamentalProgress.startedAt||null,completed:!!state?.journey?.completedFundamentals?.includes(fundamentalId)},
    codeAttempts:Object.fromEntries(Object.entries(state?.codeAttempts||{}).filter(([key])=>key.startsWith(missionId+":")||key.startsWith(fundamentalId+":")))
   };
   const mission=getMission(missionId),fundamental=mission?.type==="training"?getFundamental(phase):null;
   const steps=mission?.steps||[],completed=new Set(progressSnapshot.mission.completedSteps);
   const pending=steps.filter(step=>!completed.has(step.id));
   const fundamentalPending=(fundamental?.steps||[]).filter(step=>!progressSnapshot.fundamentals.completedSteps.includes(step.id));
   const estimate=estimateMissionXp(mission,progressSnapshot);
   const fingerprint=JSON.stringify({answers,missionSteps:progressSnapshot.mission.completedSteps,fundamentalSteps:progressSnapshot.fundamentals.completedSteps,lateReason:reason?.value,lateExplanation:explanation?.value});
   if(confirmedFingerprint!==fingerprint){
    confirmedFingerprint=fingerprint;
    const missing=[...pending.map(s=>"Missão: "+s.title),...fundamentalPending.map(s=>"Fundamentos: "+s.title)];
    preflight.hidden=false;
    preflight.innerHTML='<strong>Revisão antes do envio</strong><p>Progresso registrado: '+estimate.completed+' de '+estimate.total+' etapas ('+estimate.percent+'%). XP sugerido: '+estimate.xp+' de '+estimate.max+'.</p>'+(missing.length?'<p><strong>'+missing.length+' item(ns) ainda sem check:</strong></p><ul>'+missing.map(t=>'<li>'+safe(t)+'</li>').join("")+'</ul><p>Você pode enviar assim mesmo. Os itens não concluídos serão apresentados ao instrutor.</p>':'<p>Todos os checks previstos estão registrados. Confirme para enviar.</p>')+'<p><strong>Confirme o envio clicando novamente no botão abaixo.</strong></p>';
    button.textContent="Confirmar envio →";
    feedback.textContent="Confira o resumo antes de confirmar.";
    preflight.scrollIntoView({behavior:"smooth",block:"nearest"});
    return;
   }
   button.disabled=true;feedback.textContent="Enviando...";
   const payload={class_id:classId,student_id:session.user.id,mission_id:missionId,answers,evidence:(state?.evidence||[]).filter(e=>e?.missionId===missionId||e?.source===missionId),progress_snapshot:progressSnapshot,status:"submitted",reviewed_at:null,reviewed_by:null,feedback:"",grades:{},is_late:!!late,deadline_at:access?.closesAt||null,late_reason:late?reason.value:null,late_explanation:late?explanation.value.trim():"",submitted_at:new Date().toISOString()};
   const result=previous?.id?await sb.from("mission_submissions").update(payload).eq("id",previous.id):await sb.from("mission_submissions").insert(payload);
   if(result.error)throw result.error;
   feedback.textContent="Entrega registrada para avaliação do instrutor.";button.textContent="Entrega enviada";preflight.hidden=true;
  }catch(error){button.disabled=false;confirmedFingerprint=null;feedback.textContent="Não foi possível entregar: "+error.message}
 };
 root.append(section);
}

export function applyMissionRevision(root,mission,previous){
 const missionId=mission.id;
 const fundamental=mission.type==="training"?getFundamental(mission.phase):null;
 const safeText=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
 const isRevision=previous?.status==="changes_requested";
 if(isRevision){
  const grades=previous.grades||{},comments=grades.blocks||{},concepts=grades.blockIndicators||{};
  const human={A:"Aprendizagem demonstrada",PA:"Precisa melhorar",NA:"Ainda não demonstrada"};
  const makeNote=(unit,step,area)=>{
   const key=unit+":"+step.id,comment=String(comments[key]||"").trim(),mentions=concepts[key]||{};
   const needs=Object.values(mentions).some(v=>v==="PA"||v==="NA");
   const generic=/^(Etapa concluída conforme o registro|Registro de conclusão identificado|A conclusão da etapa foi registrada|Ainda não há conclusão registrada|Revise o conteúdo deste bloco)/.test(comment);
   if(!needs&&!comment)return "";
   return '<aside class="inline-revision-note '+(needs?"needs-work":"")+'"><strong>Orientação do instrutor · '+safeText(area)+'</strong>'+(Object.keys(mentions).length?'<p>'+Object.entries(mentions).map(([k,v])=>safeText(k)+': '+safeText(human[v]||v)).join(" · ")+'</p>':"")+(comment&&!generic?'<p>'+safeText(comment)+'</p>':generic?'<p>Confira esta atividade e marque a conclusão quando terminar.</p>':"")+'</aside>';
  };
  const banner=document.createElement("section");banner.className="inline-revision-overview card";banner.innerHTML='<p class="eyebrow">Revisão solicitada</p><h2>Revise e corrija nesta página</h2><p>Leia o recado do instrutor e faça as correções logo abaixo de cada atividade. Suas respostas continuam editáveis. Quando terminar, use o botão de envio no final da página.</p>'+(previous.feedback?'<div class="inline-teacher-message"><strong>Recado do instrutor</strong><p>'+safeText(previous.feedback)+'</p></div>':"")+'<a href="#inlineReviewStart">Ir para as atividades ↓</a>';
  root.insertAdjacentElement("afterbegin",banner);
  const first=root.querySelector(".learning-list");if(first)first.id="inlineReviewStart";
  for(const step of mission.steps||[]){
   const wrap=[...root.querySelectorAll("[data-mission-step]")].find(el=>el.dataset.missionStep===step.id);
   if(wrap){const note=makeNote(missionId,step,step.type==="evidence"?"Relatório individual":"Prática da missão");if(note)wrap.insertAdjacentHTML("afterbegin",note)}
  }
  if(fundamental){
   const s=getState(),done=new Set(s?.journey?.fundamentalProgress?.[fundamental.id]?.completedSteps||[]);
   const reviewFund=document.createElement("section");reviewFund.className="inline-fundamentals-review card";
   reviewFund.innerHTML='<h2>Fundamentos · revisar nesta página</h2><p>Se houver atividades de Fundamentos pendentes, você também pode corrigi-las aqui.</p><div class="inline-fundamental-steps">'+(fundamental.steps||[]).map(step=>'<div class="inline-fundamental-step" data-fundamental-step="'+safeText(step.id)+'">'+makeNote(fundamental.id,step,"Fundamentos")+renderStep(step,fundamental.id,done.has(step.id),{editableCompleted:true})+'</div>').join("")+'</div>';
   const deliveryAnchor=root.querySelector(".learning-list");
   if(deliveryAnchor)deliveryAnchor.before(reviewFund);else root.append(reviewFund);
   for(const step of fundamental.steps||[])bindStep(step,fundamental.id,()=>location.reload(),(_,stepId)=>completeFundamentalStep(mission.phase,stepId),{completed:done.has(step.id)});
  }
 }
}
