import {getSupabase,getSession} from "./supabase-client.js";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export async function renderLateSubmissions(){
 const sb=await getSupabase(),session=await getSession();if(!sb||!session)return;
 const {data:classes,error:ce}=await sb.from("classes").select("id,code").eq("instructor_id",session.user.id);if(ce||!classes?.length)return;
 const ids=classes.map(c=>c.id);
 const {data:rows,error}=await sb.from("mission_submissions").select("id,class_id,student_id,mission_id,status,is_late,late_reason,late_explanation,submitted_at,feedback").in("class_id",ids).order("submitted_at",{ascending:false}).limit(100);
 let box=document.querySelector("#lateMissionReview");if(!box){box=document.createElement("section");box.id="lateMissionReview";box.className="card";document.querySelector("main")?.append(box)}if(!box)return;
 if(error){box.textContent="Entregas indisponíveis: "+error.message;return}
 const {data:profiles}=await sb.from("profiles").select("id,full_name").in("id",[...new Set((rows||[]).map(r=>r.student_id))].length?[...new Set(rows.map(r=>r.student_id))]:[session.user.id]);
 const names=new Map((profiles||[]).map(p=>[p.id,p.full_name]));
 box.innerHTML="<h2>Entregas para avaliação</h2><p>Justificativas de atraso e histórico de entregas.</p>"+(rows?.length?rows.map(r=>'<article class="card" style="margin:12px 0;padding:14px"><b>'+esc(names.get(r.student_id)||"Estudante")+' · '+esc(r.mission_id)+'</b><p>'+new Date(r.submitted_at).toLocaleString("pt-BR")+' · '+(r.is_late?'<strong style="color:#d33">Fora do prazo</strong>':'No prazo')+' · '+esc(r.status)+'</p>'+(r.is_late?'<p>Motivo: '+esc(r.late_reason||"Não informado")+'<br>Justificativa: '+esc(r.late_explanation)+'</p>':'')+'<label>Feedback<textarea data-feedback-id="'+r.id+'">'+esc(r.feedback)+'</textarea></label><button class="btn btn-secondary" data-review-id="'+r.id+'" data-review-status="changes_requested">Solicitar ajustes</button> <button class="btn btn-primary" data-review-id="'+r.id+'" data-review-status="evaluated">Registrar avaliação</button></article>').join(""):"<p>Nenhuma entrega registrada.</p>");
 box.querySelectorAll("[data-review-id]").forEach(button=>button.onclick=async()=>{const id=button.dataset.reviewId,status=button.dataset.reviewStatus,feedback=box.querySelector('[data-feedback-id="'+id+'"]').value;button.disabled=true;const {error}=await sb.from("mission_submissions").update({status,feedback,reviewed_at:new Date().toISOString(),reviewed_by:session.user.id}).eq("id",id);if(error){alert(error.message);button.disabled=false}else await renderLateSubmissions()});
}
