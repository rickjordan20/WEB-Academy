// Auditoria somente leitura: submissão registrada não significa missão concluída.
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const $=id=>document.getElementById(id);
const done=s=>Array.isArray(s?.state?.journey?.completedMissions)?s.state.journey.completedMissions:[];
const completed=(s,id)=>done(s).some(x=>typeof x==="string"?x===id:x?.id===id||x?.missionId===id);
const format=t=>t?new Date(t).toLocaleString("pt-BR"):"—";
let submissions=[],loaded=false;
export function initMissionAudit(sb,getStudents){
 const status=$("missionAuditStatus"),rows=$("missionAuditRows"),summary=$("missionAuditSummary");
 if(!status||!rows||!summary)return;
 const selected=()=>{const cls=$("studentClassFilter")?.value||"",uc=$("studentUcFilter")?.value||"",search=($("studentSearch")?.value||"").toLocaleLowerCase("pt-BR");return getStudents().filter(s=>(!cls||s.class_id===cls)&&(!uc||s.uc===uc)&&(!search||(s.full_name+" "+s.email).toLocaleLowerCase("pt-BR").includes(search)))};
 function render(){
  if(!loaded)return;
  const students=selected(),ids=new Set(students.filter(s=>s.user_id).map(s=>s.user_id)),classes=new Set(students.map(s=>s.class_id));
  const matching=submissions.filter(x=>ids.has(x.student_id)&&classes.has(x.class_id));
  const missing=matching.filter(x=>!completed(students.find(s=>s.user_id===x.student_id&&s.class_id===x.class_id),x.mission_id));
  const empty=matching.filter(x=>x.answers&&Object.keys(x.answers).length===0);
  const cards=[["Entregas registradas",matching.length],["Estudantes com entregas",new Set(matching.map(x=>x.student_id)).size],["Entregas fora de concluídas",missing.length],["Respostas estruturadas vazias",empty.length]];
  summary.innerHTML=cards.map(([name,value])=>'<article class="student-monitor-stat"><small>'+esc(name)+'</small><strong>'+value+'</strong></article>').join("");
  const grouped=new Map();
  for(const s of students){if(!s.user_id)continue;const key=s.class_id+":"+s.user_id;grouped.set(key,{s,items:[]})}
  for(const x of matching){const g=grouped.get(x.class_id+":"+x.student_id);if(g)g.items.push(x)}
  rows.innerHTML=[...grouped.values()].map(({s,items})=>{
   const mismatches=items.filter(x=>!completed(s,x.mission_id)),empties=items.filter(x=>x.answers&&Object.keys(x.answers).length===0);
   const detail=items.length?'<details><summary>Ver '+items.length+' entrega(s)</summary><div class="mission-audit-chips">'+items.sort((a,b)=>a.mission_id.localeCompare(b.mission_id,undefined,{numeric:true})).map(x=>'<div class="mission-audit-chip"><b>'+esc(x.mission_id)+'</b> · '+esc(x.status)+' · '+(completed(s,x.mission_id)?"Concluída no estado":"Não consta como concluída")+(x.answers&&Object.keys(x.answers).length===0?' · Respostas estruturadas vazias':'')+'<small>Enviada: '+esc(format(x.submitted_at))+'</small></div>').join("")+'</div></details>':'<span class="muted">Sem entregas registradas</span>';
   return '<tr><td><b>'+esc(s.full_name)+'</b><small>'+esc(s.class_code)+'</small></td><td>'+items.length+'</td><td>'+done(s).length+'</td><td>'+mismatches.length+'</td><td>'+empties.length+'</td><td>'+detail+'</td></tr>';
  }).join("")||'<tr><td colspan="6">Nenhum estudante encontrado no filtro.</td></tr>';
  status.textContent="Leitura concluída. Entrega submetida e missão concluída são estados diferentes; divergência não prova perda. Nenhum dado foi alterado.";
 }
 async function refresh(){
  status.textContent="Conferindo entregas no banco...";rows.innerHTML="";loaded=false;
  const {data,error}=await sb.from("mission_submissions").select("class_id,student_id,mission_id,status,submitted_at,answers").order("submitted_at",{ascending:false}).limit(2000);
  if(error){status.textContent="Não foi possível consultar as entregas: "+error.message;return}
  submissions=data||[];loaded=true;render();
 }
 $("missionAuditRefresh").addEventListener("click",refresh);
 for(const id of ["studentSearch","studentClassFilter","studentUcFilter"]){$(id)?.addEventListener(id==="studentSearch"?"input":"change",render)}
 refresh().catch(e=>{status.textContent="Erro ao consultar entregas: "+e.message});
}
