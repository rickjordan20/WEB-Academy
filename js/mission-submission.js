import {getSupabase} from './supabase-client.js';
import {getState} from './storage.js';
import {getMission} from './mission-engine.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function mountMissionSubmission(missionId,root){
 const sb=await getSupabase();if(!sb)return;
 const {data:{user}}=await sb.auth.getUser();if(!user)return;
 const {data:members,error:memberError}=await sb.from('class_members').select('class_id').eq('user_id',user.id).eq('status','active');
 if(memberError||!members?.length)return;
 const preferred=localStorage.getItem('webacademy.student.activeClass');
 const classId=(members.find(m=>m.class_id===preferred)||members[0]).class_id;
 const panel=document.createElement('section');panel.className='card current-mission';panel.id='submissionPanel';root.append(panel);
 const refresh=async()=>{
  const {data:submission,error}=await sb.from('mission_submissions').select('status,submitted_at,reviewed_at,feedback,grades').eq('class_id',classId).eq('mission_id',missionId).eq('student_id',user.id).maybeSingle();
  if(error){panel.textContent='Não foi possível consultar a entrega: '+error.message;return}
  const mission=getMission(missionId),state=getState(),done=state?.journey?.completedMissions?.includes(missionId);
  const labels={submitted:'Enviada • aguardando avaliação',changes_requested:'Ajustes solicitados',evaluated:'Avaliada'};
  const grades=submission?.grades||{};
  panel.innerHTML='<p class="eyebrow">Avaliação do instrutor</p><h2>Entrega da missão</h2>'+
   (submission?'<p><strong>Situação: '+esc(labels[submission.status]||submission.status)+'</strong></p><p>Enviada em '+esc(new Date(submission.submitted_at).toLocaleString('pt-BR'))+'</p>':'<p>Conclua a missão e envie seus registros para avaliação.</p>')+
   (submission?.feedback?'<p><strong>Devolutiva:</strong> '+esc(submission.feedback)+'</p>':'')+
   (Object.keys(grades).length?'<p><strong>Menções:</strong> '+Object.entries(grades).map(([k,v])=>esc(k+': '+v)).join(' • ')+'</p>':'')+
   ((done&&(!submission||submission.status==='changes_requested'))?'<button type="button" class="btn btn-primary" id="sendMissionWork">'+(submission?'Reenviar ajustes':'Enviar para avaliação')+'</button>':'')+
   '<p class="feedback" id="submissionMessage" role="status"></p>';
  const button=panel.querySelector('#sendMissionWork');if(!button)return;
  button.onclick=async()=>{
   const fresh=getState();if(!fresh?.journey?.completedMissions?.includes(missionId)){panel.querySelector('#submissionMessage').textContent='Conclua todas as etapas primeiro.';return}
   const answers={};for(const step of mission.steps)answers[step.id]=fresh.answers?.[missionId+':'+step.id]??null;
   const evidence=mission.steps.filter(step=>step.type==='evidence').map(step=>({stepId:step.id,fields:answers[step.id]}));
   button.disabled=true;const message=panel.querySelector('#submissionMessage');message.textContent='Enviando...';
   try{const {error}=await sb.rpc('submit_mission_work',{p_class_id:classId,p_mission_id:missionId,p_answers:answers,p_evidence:evidence});if(error)throw error;await refresh()}
   catch(err){message.textContent='Falha no envio: '+err.message;button.disabled=false}
  };
 };
 await refresh();
}
