import {getSupabase,getSession} from "./supabase-client.js";
const $=id=>document.getElementById(id);
// Nunca encerrar ou redirecionar a sessão por uma falha temporária de carregamento.
const sb=await getSupabase();
let session=null,profile=null,accessError=null;
try{
 if(!sb)throw new Error("O Supabase não está configurado nesta página.");
 const result=await sb.auth.getUser();
 if(result.error)throw result.error;
 if(!result.data?.user)throw new Error("Não foi encontrada uma sessão neste endereço.");
 session={user:result.data.user};
 const identity=await sb.from("profiles").select("role").eq("id",session.user.id).maybeSingle();
 if(identity.error)throw identity.error;
 profile=identity.data;
 if(!profile||!["instructor","student"].includes(profile.role))throw new Error("Perfil não encontrado ou sem permissão.");
}catch(error){accessError=error}
if(accessError){
 const notice=document.getElementById("scheduleFeedback");
 notice.textContent="Não foi possível verificar seu acesso: "+accessError.message+" Sua conta não foi desconectada. ";
 const retry=document.createElement("button");retry.type="button";retry.textContent="Tentar novamente";retry.addEventListener("click",()=>location.reload());notice.append(retry);
 const back=document.createElement("a");back.href="instructor.html";back.textContent=" Voltar ao painel do instrutor";notice.append(back);
 document.getElementById("scheduleRows").replaceChildren();
 throw new Error("Schedule access unavailable: "+accessError.message);
}
const instructor=profile.role==="instructor";
$("instructorBack").hidden=!instructor;$("studentBack").hidden=instructor;
$("newScheduleLesson").hidden=!instructor;$("scheduleActionsHeading").hidden=!instructor;
let classes=[],rows=[],editing=null;
const days=["domingo","segunda-feira","terça-feira","quarta-feira","quinta-feira","sexta-feira","sábado"];
const formatDate=d=>{const [y,m,day]=d.split("-").map(Number);return String(day).padStart(2,"0")+"/"+String(m).padStart(2,"0")+"/"+y};
const weekday=d=>{const [y,m,day]=d.split("-").map(Number);const date=new Date(Date.UTC(y,m-1,day,12));const label=days[date.getUTCDay()];return label.charAt(0).toUpperCase()+label.slice(1)};
const option=(value,label)=>{const el=document.createElement("option");el.value=value;el.textContent=label;return el};
const feedback=message=>$("scheduleFeedback").textContent=message;
async function loadClasses(){
 let query=sb.from("classes").select("id,code,name,uc").order("code");
 if(instructor)query=query.eq("instructor_id",session.user.id);
 else{
  const {data:members,error}=await sb.from("class_members").select("class_id").eq("user_id",session.user.id).eq("status","active");
  if(error)throw error;
  const ids=(members||[]).map(m=>m.class_id);
  if(!ids.length){classes=[];return}
  query=query.in("id",ids);
 }
 const {data,error}=await query;if(error)throw error;classes=data||[];
 for(const c of classes){$("scheduleClass").append(option(c.id,c.code+" — "+c.name));$("scheduleFormClass").append(option(c.id,c.code+" — "+c.name))}
 const preferred=classes.find(c=>c.code==="2026.36.8");
 if(preferred)$("scheduleClass").value=preferred.id;
}
function updateUcOptions(){
 const old=$("scheduleUc").value,selected=$("scheduleClass").value;
 const ucs=[...new Set(rows.filter(r=>r.class_id===selected).map(r=>r.uc))].sort();
 $("scheduleUc").replaceChildren(option("","Todas as UCs"),...ucs.map(u=>option(u,u)));
 if(ucs.includes(old))$("scheduleUc").value=old;
}
function render(){
 const id=$("scheduleClass").value,uc=$("scheduleUc").value,mode=$("scheduleMode").value;
 const base=rows.filter(r=>r.class_id===id&&(!uc||r.uc===uc));
 const shown=base.filter(r=>!mode||r.execution_mode===mode);
 $("scheduleTotal").textContent=String(base.length);
 $("scheduleInPerson").textContent=String(base.filter(r=>r.execution_mode==="Presencial").length);
 $("scheduleAsync").textContent=String(base.filter(r=>r.execution_mode==="Remota Assíncrona").length);
 $("schedulePeriod").textContent=base.length?formatDate(base[0].lesson_date)+" – "+formatDate(base[base.length-1].lesson_date):"—";
 $("scheduleCount").textContent=shown.length+" aula(s) exibida(s)";
 const tbody=$("scheduleRows");tbody.replaceChildren();
 if(!shown.length){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=instructor?6:5;td.textContent="Nenhuma aula encontrada para os filtros selecionados.";tr.append(td);tbody.append(tr);return}
 for(const row of shown){
  const tr=document.createElement("tr");
  for(const [value,cls] of [[String(row.lesson_number).padStart(2,"0"),"schedule-number"],[formatDate(row.lesson_date),""],[weekday(row.lesson_date),""],[row.uc,""]]){
   const td=document.createElement("td");td.textContent=value;td.className=cls;tr.append(td);
  }
  const td=document.createElement("td"),pill=document.createElement("span");pill.className="schedule-mode"+(row.execution_mode==="Presencial"?"":" remote");pill.textContent=row.execution_mode;td.append(pill);tr.append(td);
  if(instructor){const actions=document.createElement("td"),wrap=document.createElement("div");wrap.className="schedule-row-actions";
   const edit=document.createElement("button");edit.type="button";edit.textContent="Editar";edit.addEventListener("click",()=>openForm(row));
   const del=document.createElement("button");del.type="button";del.className="delete";del.textContent="Excluir";del.addEventListener("click",()=>removeLesson(row));
   wrap.append(edit,del);actions.append(wrap);tr.append(actions)}
  tbody.append(tr);
 }
}
async function loadRows(){
 feedback("");
 const {data,error}=await sb.from("class_schedule").select("id,class_id,uc,lesson_number,lesson_date,execution_mode").in("class_id",classes.map(c=>c.id)).order("lesson_date").order("lesson_number");
 if(error)throw error;
 rows=data||[];updateUcOptions();render();
}
function openForm(row=null){
 if(!instructor)return;
 editing=row?.id||null;
 $("scheduleDialogTitle").textContent=row?"Editar aula":"Nova aula";
 const form=$("scheduleForm");form.reset();
 form.elements.namedItem("class_id").value=row?.class_id||$("scheduleClass").value;
 form.elements.namedItem("uc").value=row?.uc||$("scheduleUc").value||classes.find(c=>c.id===$("scheduleClass").value)?.uc?.match(/UC\d+/i)?.[0]||"UC7";
 form.elements.namedItem("lesson_number").value=row?.lesson_number||"";
 form.elements.namedItem("lesson_date").value=row?.lesson_date||"";
 form.elements.namedItem("execution_mode").value=row?.execution_mode||"Presencial";
 $("scheduleFormFeedback").textContent="";
 $("scheduleDialog").showModal();
}
async function removeLesson(row){
 if(!instructor||!confirm("Excluir a aula "+String(row.lesson_number).padStart(2,"0")+" de "+formatDate(row.lesson_date)+"?"))return;
 const {error}=await sb.from("class_schedule").delete().eq("id",row.id);
 if(error){feedback("Não foi possível excluir: "+error.message);return}
 await loadRows();
}
$("scheduleForm").addEventListener("submit",async e=>{
 e.preventDefault();if(!instructor)return;
 const form=e.currentTarget;
 const payload={class_id:form.elements.namedItem("class_id").value,uc:form.elements.namedItem("uc").value.trim().toUpperCase(),lesson_number:Number(form.elements.namedItem("lesson_number").value),lesson_date:form.elements.namedItem("lesson_date").value,execution_mode:form.elements.namedItem("execution_mode").value};
 if(!classes.some(c=>c.id===payload.class_id)){ $("scheduleFormFeedback").textContent="Turma inválida.";return}
 $("scheduleSave").disabled=true;$("scheduleFormFeedback").textContent="Salvando...";
 const result=editing?await sb.from("class_schedule").update(payload).eq("id",editing):await sb.from("class_schedule").insert(payload);
 $("scheduleSave").disabled=false;
 if(result.error){$("scheduleFormFeedback").textContent="Erro ao salvar: "+result.error.message;return}
 $("scheduleDialog").close();$("scheduleClass").value=payload.class_id;await loadRows();
 $("scheduleUc").value=payload.uc;render();feedback("Aula salva com sucesso.");
});
$("newScheduleLesson").addEventListener("click",()=>openForm());
$("scheduleClose").addEventListener("click",()=>$("scheduleDialog").close());
$("scheduleCancel").addEventListener("click",()=>$("scheduleDialog").close());
$("scheduleClass").addEventListener("change",()=>{updateUcOptions();render()});
$("scheduleUc").addEventListener("change",render);
$("scheduleMode").addEventListener("change",render);
try{await loadClasses();if(classes.length)await loadRows();else{feedback("Nenhuma turma disponível para esta conta.");$("scheduleRows").replaceChildren()}}catch(error){feedback("Não foi possível carregar o cronograma: "+error.message);$("scheduleRows").replaceChildren()}
