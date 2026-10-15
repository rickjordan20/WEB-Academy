import {getSupabase,getSession} from './supabase-client.js';
const sb=await getSupabase(),session=await getSession();
if(!sb||!session){location.replace('auth.html');throw Error('AUTH_REQUIRED')}
const {data:profile}=await sb.from('profiles').select('role').eq('id',session.user.id).single();
if(profile?.role!=='instructor'){location.replace('app.html');throw Error('INSTRUCTOR_REQUIRED')}
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const {data:classes,error:classError}=await sb.from('classes').select('id,code,name').eq('instructor_id',session.user.id).order('code');
if(classError)throw classError;
$('#reviewClass').innerHTML=(classes||[]).map(c=>'<option value="'+esc(c.id)+'">'+esc(c.code+' • '+c.name)+'</option>').join('');
const selected=localStorage.getItem('webacademy.instructor.activeClass');
if(classes?.some(c=>c.id===selected))$('#reviewClass').value=selected;
const indicators=['I1','I2','I3','I4','I5','I6'];
async function load(){
 const classId=$('#reviewClass').value;if(!classId)return;
 $('#reviewStatus').textContent='Carregando entregas...';
 const {data,error}=await sb.from('mission_submissions').select('id,student_id,mission_id,answers,evidence,status,submitted_at,feedback,grades').eq('class_id',classId).order('submitted_at',{ascending:false});
 if(error){$('#reviewStatus').textContent='Erro: '+error.message;return}
 const ids=[...new Set((data||[]).map(x=>x.student_id))];
 let profiles=[];if(ids.length){const result=await sb.from('profiles').select('id,full_name').in('id',ids);if(result.error){$('#reviewStatus').textContent=result.error.message;return}profiles=result.data||[]}
 const filtered=(data||[]).filter(x=>$('#reviewFilter').value==='all'||x.status===$('#reviewFilter').value);
 $('#reviewStatus').textContent=filtered.length+' entrega(s) encontrada(s).';
 $('#reviewList').replaceChildren();
 for(const item of filtered){
  const name=profiles.find(p=>p.id===item.student_id)?.full_name||'Estudante';
  const card=document.createElement('article');card.className='card';card.style.marginTop='1rem';
  const answers=Object.entries(item.answers||{}).map(([k,v])=>'<details><summary>'+esc(k)+'</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">'+esc(JSON.stringify(v,null,2))+'</pre></details>').join('');
  card.innerHTML='<h2>'+esc(name)+' • '+esc(item.mission_id)+'</h2><p>'+esc(item.status)+' • '+esc(new Date(item.submitted_at).toLocaleString('pt-BR'))+'</p><h3>Respostas e evidências</h3>'+answers+
   '<form class="reviewForm"><h3>Menções por indicador</h3><div class="reviewGrades" style="display:flex;flex-wrap:wrap;gap:1rem">'+indicators.map(k=>'<label>'+k+' <select name="'+k+'" class="admin-input"><option value="">Não avaliado</option>'+['A','PA','NA'].map(v=>'<option value="'+v+'" '+(item.grades?.[k]===v?'selected':'')+'>'+v+'</option>').join('')+'</select></label>').join('')+'</div><label>Feedback ao estudante<textarea name="feedback" class="admin-input" rows="4" style="display:block;width:100%">'+esc(item.feedback||'')+'</textarea></label>'+(item.status==='submitted'?'<button type="submit" class="btn btn-primary" name="action" value="evaluated">Registrar avaliação</button> <button type="submit" class="btn btn-secondary" name="action" value="changes_requested">Solicitar ajustes</button>':'<p>Esta entrega já foi devolvida. Aguarde reenvio para uma nova avaliação.</p>')+'<p class="feedback" role="status"></p></form>';
  $('#reviewList').append(card);
  const form=card.querySelector('form');
  form.onsubmit=async e=>{
   e.preventDefault();const action=e.submitter?.value;if(!action)return;
   const grades={};for(const k of indicators){const v=form.elements[k].value;if(v)grades[k]=v}
   const feedback=form.elements.feedback.value.trim();const msg=form.querySelector('[role="status"]');
   if(action==='changes_requested'&&!feedback){msg.textContent='Informe os ajustes necessários.';return}
   const buttons=[...form.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);msg.textContent='Salvando avaliação...';
   const {error}=await sb.rpc('review_mission_work',{p_submission_id:item.id,p_status:action,p_grades:grades,p_feedback:feedback});
   if(error){msg.textContent='Erro: '+error.message;buttons.forEach(b=>b.disabled=false);return}
   await load();
  };
 }
}
$('#reviewClass').onchange=load;$('#reviewFilter').onchange=load;await load();
