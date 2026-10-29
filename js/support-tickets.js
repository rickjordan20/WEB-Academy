import {getSupabase,getSession} from "./supabase-client.js";
const $=s=>document.querySelector(s),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const sb=await getSupabase(),session=await getSession();let instructor=false,rows=[],classes=[];
const labels={open:"Aberto",in_review:"Em análise",resolved:"Resolvido",closed:"Encerrado"};
async function init(){if(!sb||!session){$("#supportList").textContent="Faça login para acessar seus chamados.";return}
 const role=await sb.from("profiles").select("role").eq("id",session.user.id).maybeSingle();instructor=role.data?.role==="instructor";
 $("#supportBack").href=instructor?"instructor.html":"app.html";
 $("#supportSubtitle").textContent=instructor?"Chamados enviados pelos estudantes das suas turmas.":"Consulte a situação e a resposta do instrutor.";
 $("#supportReload").addEventListener("click",load);
 await load();
}
async function load(){const query=sb.from("site_support_tickets").select("*").order("created_at",{ascending:false}).limit(300);if(!instructor)query.eq("reporter_id",session.user.id);
 const result=await query;if(result.error){$("#supportStatus").textContent=result.error.message;return}rows=result.data||[];
 $("#supportStats").innerHTML=[["Total",rows.length],["Abertos",rows.filter(x=>x.status==="open").length],["Em análise",rows.filter(x=>x.status==="in_review").length],["Resolvidos",rows.filter(x=>x.status==="resolved").length]].map(([t,v])=>'<div><small>'+t+'</small><strong>'+v+'</strong></div>').join("");
 $("#supportList").innerHTML=rows.length?rows.map(t=>'<article class="support-ticket"><div class="meta"><h3>'+esc(t.title)+'</h3><span>'+esc(labels[t.status]||t.status)+'</span></div><small>Chamado #'+esc(t.id.slice(0,8))+' · '+new Date(t.created_at).toLocaleString("pt-BR")+' · Página: '+esc(t.page_url||"não informada")+'</small><p>'+esc(t.description)+'</p>'+(t.instructor_reply?'<p class="response"><strong>Resposta do instrutor:</strong> '+esc(t.instructor_reply)+'</p>':"")+(instructor?'<details><summary>Diagnóstico da página</summary><pre>'+esc(JSON.stringify(t.diagnostic||{},null,2))+'</pre></details><form data-ticket="'+esc(t.id)+'"><label>Situação<select name="status">'+Object.entries(labels).map(([k,v])=>'<option value="'+k+'" '+(k===t.status?"selected":"")+'>'+v+'</option>').join("")+'</select></label><label>Resposta ao estudante<textarea name="reply" rows="3" maxlength="2500" placeholder="Informe o diagnóstico e os próximos passos.">'+esc(t.instructor_reply||"")+'</textarea></label><button type="submit">Salvar atendimento</button></form>':"")+'</article>').join(""):'<p>Nenhum chamado registrado.</p>';
 if(instructor)$("#supportList").querySelectorAll("form[data-ticket]").forEach(f=>f.addEventListener("submit",save));
}
async function save(e){e.preventDefault();const form=e.currentTarget,id=form.dataset.ticket,button=form.querySelector("button");button.disabled=true;const status=form.elements.status.value,reply=form.elements.reply.value.trim();const {error}=await sb.from("site_support_tickets").update({status,instructor_reply:reply,updated_at:new Date().toISOString()}).eq("id",id);button.disabled=false;if(error){$("#supportStatus").textContent="Falha ao salvar: "+error.message;return}$("#supportStatus").textContent="Atendimento atualizado.";await load()}
init().catch(e=>{$("#supportStatus").textContent=e.message});
