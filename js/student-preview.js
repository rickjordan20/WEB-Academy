import {getSupabase,getSession} from "./supabase-client.js";
const sb=await getSupabase(),session=await getSession();
const id=new URLSearchParams(location.search).get("student");
const root=document.querySelector("#previewContent"),nav=document.querySelector("#previewNav");
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const entries=v=>Array.isArray(v)?v:Object.entries(v||{}).map(([key,value])=>({key,value}));
const format=v=>typeof v==="string"?v:JSON.stringify(v,null,2);
function list(items,empty="Nenhum registro sincronizado."){return items?.length?'<div class="preview-list">'+items.map((x,i)=>'<article class="preview-entry"><h3>'+esc(x.title||x.name||x.key||"Registro "+(i+1))+'</h3><p>'+esc(format(x.description||x.summary||x.text||x.value||x))+'</p></article>').join("")+'</div>':'<p class="preview-muted">'+esc(empty)+'</p>'}
function stats(a){return '<div class="preview-stats">'+a.map(([label,value])=>'<div class="preview-stat"><small>'+esc(label)+'</small><b>'+esc(value)+'</b></div>').join("")+'</div>'}
async function init(){
 if(!sb||!session||!id||!/^[-0-9a-f]{36}$/i.test(id)){root.textContent="Sessão inválida. Entre como instrutor.";return}
 const me=await sb.from("profiles").select("role").eq("id",session.user.id).single();
 if(me.error||me.data?.role!=="instructor"){root.textContent="Acesso restrito ao instrutor.";return}
 const classes=await sb.from("classes").select("id").eq("instructor_id",session.user.id);
 if(classes.error||!classes.data?.length){root.textContent="Nenhuma turma autorizada.";return}
 const member=await sb.from("class_members").select("class_id").eq("user_id",id).eq("status","active").in("class_id",classes.data.map(c=>c.id)).limit(1);
 if(member.error||!member.data?.length){root.textContent="Estudante não pertence às turmas deste instrutor.";return}
 const [profile,stateRow,submissions]=await Promise.all([
 sb.from("profiles").select("full_name,email").eq("id",id).single(),
 sb.from("student_states").select("state,updated_at").eq("user_id",id).maybeSingle(),
 sb.from("mission_submissions").select("mission_id,status,grades,feedback,submitted_at,reviewed_at").eq("student_id",id).eq("class_id",member.data[0].class_id).order("submitted_at",{ascending:false})
 ]);
 if(profile.error||stateRow.error||submissions.error){root.textContent="Falha ao consultar dados autorizados.";return}
 const st=stateRow.data?.state||{},journey=st.journey||{},game=st.gamification||{},missions=submissions.data||[];
 document.querySelector("#studentName").textContent=profile.data?.full_name||st.student?.name||"Estudante";
 document.querySelector("#studentMeta").textContent="Última sincronização: "+(stateRow.data?.updated_at?new Date(stateRow.data.updated_at).toLocaleString("pt-BR"):"não disponível");
 const pages=[
 ["Visão geral",()=>stats([["XP homologado",game.xp||0],["Nível",game.level||1],["Progresso",String(journey.progress||0)+"%"],["Missões concluídas",(journey.completedMissions||[]).length],["Entregas enviadas",missions.length],["Avaliações concluídas",missions.filter(m=>m.status==="evaluated").length]])+'<h2>Histórico de XP</h2>'+list((game.xpHistory||[]).map(x=>({title:x.reason||x.key,description:String(x.amount)+" XP · "+(x.at||"")})))],
 ["Minha jornada",()=>stats([["Fase atual",journey.currentPhase||1],["Missões concluídas",(journey.completedMissions||[]).length]])+'<h2>Missões concluídas</h2>'+list((journey.completedMissions||[]).map(x=>({title:String(x)})))+'<h2>Progresso por missão</h2>'+list(entries(journey.missionProgress))],
 ["Missões e avaliações",()=>list(missions.map(m=>({title:"Missão "+m.mission_id+" · "+m.status,description:"Enviado: "+(m.submitted_at?new Date(m.submitted_at).toLocaleString("pt-BR"):"—")+"\nXP aprovado: "+(m.status==="evaluated"?(m.grades?.xp??"—"):"Pendente")+"\nFeedback: "+(m.feedback||"Ainda não informado")})))],
 ["Projetos",()=>'<h2>EduTech</h2>'+list(entries(st.edutech))+'<h2>Guilda</h2>'+list(entries(st.guild))],
 ["Competências",()=>list(entries(st.competencies))],
 ["Meu progresso",()=>stats([["XP",game.xp||0],["Nível",game.level||1],["Missões concluídas",(journey.completedMissions||[]).length]])+'<h2>Registros de aprendizagem</h2>'+list(entries(st.checkpoints))],
 ["Conquistas",()=>list((game.achievements||[]).map(x=>({title:x})))],
 ["Respostas e evidências",()=>'<h2>Respostas registradas</h2>'+list(entries(st.answers))+'<h2>Evidências</h2>'+list(entries(st.evidence))]
 ];
 function show(i){nav.querySelectorAll("button").forEach((b,n)=>b.setAttribute("aria-current",String(i===n)));root.innerHTML='<h2>'+esc(pages[i][0])+'</h2>'+pages[i][1]()}
 pages.forEach(([label],i)=>{const b=document.createElement("button");b.type="button";b.textContent=label;b.onclick=()=>show(i);nav.append(b)});
 show(0);
}
init().catch(e=>{console.error(e);root.textContent="Não foi possível abrir a prévia. Tente novamente."});
