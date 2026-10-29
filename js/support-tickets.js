import {getSupabase,getSession} from "./supabase-client.js";
const $=s=>document.querySelector(s),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const sb=await getSupabase(),session=await getSession();let instructor=false,rows=[],classes=[];
const labels={open:"Aberto",in_review:"Em análise",resolved:"Resolvido",closed:"Encerrado"};
async function init(){if(!sb||!session){$("#supportList").textContent="Faça login para acessar seus chamados.";return}
 const role=await sb.from("profiles").select("role").eq("id",session.user.id).maybeSingle();instructor=role.data?.role==="instructor";
 $("#supportBack").href=instructor?"instructor.html":"app.html";
 $("#supportHomeNav").href=instructor?"instructor.html":"app.html";
 $("#supportHomeNav").textContent=instructor?"▦ Painel do Instrutor":"⌂ Visão Geral";
 $("#supportSidebarBack").href=instructor?"instructor.html":"app.html";
 if(instructor){const nav=document.querySelector(".sidebar .nav-list");nav.innerHTML='<a class="nav-item" href="instructor.html">▦ Painel da Turma</a><a class="nav-item" href="angel-instructor.html">💙 Alunos Anjos</a><a class="nav-item" href="achievement-manager.html">🏅 Gerenciar Conquistas</a><a class="nav-item" href="popup-manager.html">📢 Gerenciar Pop-ups</a><a class="nav-item" href="notification-manager.html">🔔 Gerenciar Notificações</a><a class="nav-item" href="class-schedule.html">📅 Cronograma de Aulas</a><a class="nav-item active" aria-current="page" href="support-tickets.html">🛠️ Chamados de Suporte</a>';}
 $("#supportSubtitle").textContent=instructor?"Chamados enviados pelos estudantes das suas turmas.":"Consulte a situação e a resposta do instrutor.";
 $("#supportReload").addEventListener("click",load);
 $("#supportNew").addEventListener("click",()=>document.querySelector(".site-support-fab")?.click());
 $("#supportSearch").addEventListener("input",render);
 $("#supportFilter").addEventListener("change",render);
 await load();
}
async function load(){const query=sb.from("site_support_tickets").select("*").order("created_at",{ascending:false}).limit(300);if(!instructor)query.eq("reporter_id",session.user.id);
 const result=await query;if(result.error){$("#supportStatus").textContent=result.error.message;return}rows=result.data||[];
 $("#supportStats").innerHTML=[["Total",rows.length],["Abertos",rows.filter(x=>x.status==="open").length],["Em análise",rows.filter(x=>x.status==="in_review").length],["Resolvidos",rows.filter(x=>x.status==="resolved").length]].map(([t,v])=>'<div><small>'+t+'</small><strong>'+v+'</strong></div>').join("");
 render();
}
function render(){
 const term=$("#supportSearch").value.trim().toLowerCase(),filter=$("#supportFilter").value;
 const visible=rows.filter(t=>(!filter||t.status===filter)&&(!term||[t.title,t.description,t.page_url,t.id].some(v=>String(v||"").toLowerCase().includes(term))));
 $("#supportList").innerHTML=visible.length?visible.map(t=>'<article class="support-ticket"><div class="meta"><h3>'+esc(t.title)+'</h3><span>'+esc(labels[t.status]||t.status)+'</span></div><small>Chamado #'+esc(t.id.slice(0,8))+' · '+new Date(t.created_at).toLocaleString("pt-BR")+' · Página: '+esc(t.page_url||"não informada")+'</small><p>'+esc(t.description)+'</p>'+(t.instructor_reply?'<p class="response"><strong>Resposta do instrutor:</strong> '+esc(t.instructor_reply)+'</p>':"")+(instructor?'<details><summary>🧪 Diagnóstico técnico · '+esc((t.diagnostic?.logs||[]).length)+' evento(s)</summary><p><strong>Página:</strong> '+esc(t.diagnostic?.page||t.page_url||"-")+'</p><p><strong>Carregamento:</strong> '+esc(t.diagnostic?.performance?.loadMs??t.diagnostic?.loadMs??"indisponível")+' ms</p><p><strong>Última interação:</strong> '+esc(t.diagnostic?.clicked?.tag||"não registrada")+'</p><h4>Eventos e erros</h4><pre>'+esc(JSON.stringify(t.diagnostic?.logs||[],null,2))+'</pre><h4>Diagnóstico completo</h4><pre>'+esc(JSON.stringify(t.diagnostic||{},null,2))+'</pre><button type="button" data-copy-diagnostic="'+esc(t.id)+'">Copiar diagnóstico</button></details><form data-ticket="'+esc(t.id)+'"><label>Situação<select name="status">'+Object.entries(labels).map(([k,v])=>'<option value="'+k+'" '+(k===t.status?"selected":"")+'>'+v+'</option>').join("")+'</select></label><label>Resposta ao estudante<textarea name="reply" rows="3" maxlength="2500" placeholder="Informe o diagnóstico e os próximos passos.">'+esc(t.instructor_reply||"")+'</textarea></label><button type="submit">Salvar atendimento</button></form>':"")+'</article>').join("") :'<div class="support-empty"><h2>🛠️ '+(rows.length?'Nenhum resultado encontrado':'Nenhum chamado registrado')+'</h2><p>'+(rows.length?'Altere os filtros para encontrar outros chamados.':'Quando você reportar um problema, poderá acompanhar a análise e a resposta aqui.')+'</p><button type="button" id="supportEmptyNew">Reportar problema</button></div>';
 $("#supportEmptyNew")?.addEventListener("click",()=>document.querySelector(".site-support-fab")?.click());
 if(instructor){$("#supportList").querySelectorAll("form[data-ticket]").forEach(f=>f.addEventListener("submit",save));$("#supportList").querySelectorAll("[data-copy-diagnostic]").forEach(b=>b.addEventListener("click",async()=>{const ticket=rows.find(x=>x.id===b.dataset.copyDiagnostic);if(!ticket)return;try{await navigator.clipboard.writeText(JSON.stringify(ticket.diagnostic||{},null,2));b.textContent="Copiado!"}catch{b.textContent="Não foi possível copiar"}}))}
}
async function save(e){e.preventDefault();const form=e.currentTarget,id=form.dataset.ticket,button=form.querySelector("button");button.disabled=true;const status=form.elements.status.value,reply=form.elements.reply.value.trim();const {error}=await sb.from("site_support_tickets").update({status,instructor_reply:reply,updated_at:new Date().toISOString()}).eq("id",id);button.disabled=false;if(error){$("#supportStatus").textContent="Falha ao salvar: "+error.message;return}$("#supportStatus").textContent="Atendimento atualizado.";await load()}
init().catch(e=>{$("#supportStatus").textContent=e.message});
