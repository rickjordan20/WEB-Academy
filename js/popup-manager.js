import {getSupabase,getSession} from "./supabase-client.js";
import {safePopupLink} from "./popup-utils.js";
const $=s=>document.querySelector(s),esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const sb=await getSupabase(),session=await getSession();
if(!sb||!session){location.replace("auth.html");throw new Error("AUTH_REQUIRED")}
const {data:profile}=await sb.from("profiles").select("role").eq("id",session.user.id).single();
if(profile?.role!=="instructor"){location.replace("app.html");throw new Error("INSTRUCTOR_REQUIRED")}
let classes=[],popups=[],editingId=null;
const defaultItem=()=>({icon:"📢",label:"Nova funcionalidade",title:"",description:"",where:"",url:"",action:"Acessar recurso"});
const toBrasiliaInput=iso=>{const d=new Date(new Date(iso).getTime()-3*3600000);return d.toISOString().slice(0,16)};
const fromBrasiliaInput=v=>new Date(v+":00-03:00").toISOString();
function message(s,error=false){$("#pmMessage").innerHTML='<p class="pm-message'+(error?' error':'')+'">'+esc(s)+'</p>'}
function field(name,label,value="",wide=false,tag="input"){return '<label class="'+(wide?'wide':'')+'">'+esc(label)+(tag==="textarea"?'<textarea class="pm-input" rows="2" data-field="'+name+'">'+esc(value)+'</textarea>':'<input class="pm-input" data-field="'+name+'" value="'+esc(value)+'" maxlength="500">')+'</label>'}
function addItem(item=defaultItem()){
 const div=document.createElement("div");div.className="pm-item";
 div.innerHTML='<div class="pm-item-header"><strong>Cartão <span class="pm-item-number"></span></strong><button type="button" class="btn btn-secondary pm-remove">Remover</button></div><div class="pm-item-fields">'+
 field("icon","Ícone (emoji)",item.icon)+field("label","Tipo / etiqueta",item.label)+field("title","Título",item.title,true)+field("description","Explicação",item.description,true,"textarea")+field("where","Onde encontrar no site",item.where,true)+field("url","Link interno (opcional)",item.url)+field("action","Texto do botão",item.action)+'</div>';
 div.querySelector(".pm-remove").onclick=()=>{div.remove();renumber()};
 $("#pmItems").append(div);renumber()
}
function renumber(){document.querySelectorAll(".pm-item-number").forEach((e,i)=>e.textContent=i+1)}
function readItems(){return [...document.querySelectorAll(".pm-item")].map(el=>Object.fromEntries([...el.querySelectorAll("[data-field]")].map(f=>[f.dataset.field,f.value.trim()])))}
function validateItems(items){
 if(!items.length||items.length>12)throw new Error("Inclua de 1 a 12 cartões.");
 for(const [i,x] of items.entries()){
  if(!x.title||!x.description||!x.where)throw new Error("Preencha título, explicação e localização do cartão "+(i+1)+".");
  if(x.url&&!safePopupLink(x.url))throw new Error("O link do cartão "+(i+1)+" deve ser uma página .html interna, como angel-help.html.");
  for(const [key,max] of Object.entries({icon:24,label:60,title:120,description:500,where:180,url:240,action:80})){if((x[key]||"").length>max)throw new Error("Campo "+key+" excede o limite no cartão "+(i+1)+".")}
 }
}
function clearForm(){
 editingId=null;$("#pmEditorTitle").textContent="Novo comunicado";$("#pmForm").reset();$("#pmTitle").value="";$("#pmSubtitle").value="";
 const start=new Date(Date.now()+3600000);$("#pmStart").value=toBrasiliaInput(start.toISOString());$("#pmEnd").value=toBrasiliaInput(new Date(start.getTime()+3*86400000).toISOString());
 $("#pmActive").checked=true;$("#pmItems").replaceChildren();addItem();
}
function editPopup(p){editingId=p.id;$("#pmEditorTitle").textContent="Editar comunicado";$("#pmTitle").value=p.title;$("#pmSubtitle").value=p.subtitle||"";$("#pmStart").value=toBrasiliaInput(p.starts_at);$("#pmEnd").value=toBrasiliaInput(p.ends_at);$("#pmActive").checked=p.active;$("#pmItems").replaceChildren();(p.items||[]).forEach(addItem);$("#pmForm").scrollIntoView({behavior:"smooth",block:"start"})}
function status(p){if(!p.active)return["Desativado","inactive"];if(Date.now()<Date.parse(p.starts_at))return["Agendado",""];if(Date.now()>=Date.parse(p.ends_at))return["Encerrado","inactive"];return["Em exibição",""]}
function render(){
 const live=popups.filter(p=>status(p)[0]==="Em exibição").length;
 $("#pmStats").textContent=popups.length+" comunicado(s) · "+live+" em exibição";
 $("#pmList").innerHTML=popups.length?popups.map(p=>{const [st,cl]=status(p);return '<article class="pm-record"><span class="pm-status '+cl+'">'+st+'</span><h3>'+esc(p.title)+'</h3><p>'+esc(p.subtitle)+'</p><small>Início: '+esc(new Date(p.starts_at).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"}))+' · Fim: '+esc(new Date(p.ends_at).toLocaleString("pt-BR",{timeZone:"America/Sao_Paulo"}))+'</small><div class="pm-record-actions"><button type="button" class="btn btn-primary" data-edit="'+esc(p.id)+'">Editar</button><button type="button" class="btn btn-secondary" data-toggle="'+esc(p.id)+'">'+(p.active?"Desativar":"Ativar")+'</button><button type="button" class="btn btn-secondary" data-delete="'+esc(p.id)+'">Excluir</button></div></article>'}).join(""):'<p class="muted">Nenhum comunicado cadastrado nesta turma.</p>';
 $("#pmList").querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editPopup(popups.find(p=>p.id===b.dataset.edit)));
 $("#pmList").querySelectorAll("[data-toggle]").forEach(b=>b.onclick=async()=>{const p=popups.find(x=>x.id===b.dataset.toggle);await mutate({id:p.id,active:!p.active},"Situação atualizada.")});
 $("#pmList").querySelectorAll("[data-delete]").forEach(b=>b.onclick=async()=>{if(!confirm("Excluir este comunicado permanentemente?"))return;const {error}=await sb.from("student_popups").delete().eq("id",b.dataset.delete).eq("class_id",$("#pmClass").value);if(error)message(error.message,true);else{message("Comunicado excluído.");clearForm();await loadPopups()}})
}
async function loadPopups(){
 const {data,error}=await sb.from("student_popups").select("*").eq("class_id",$("#pmClass").value).order("starts_at",{ascending:false});
 if(error){message("Falha ao carregar comunicados: "+error.message,true);return}popups=data||[];render()
}
async function mutate(changes,success){
 const {error}=await sb.from("student_popups").update({...changes,updated_at:new Date().toISOString()}).eq("id",changes.id).eq("class_id",$("#pmClass").value);
 if(error)message(error.message,true);else{message(success);await loadPopups()}
}
$("#pmForm").onsubmit=async e=>{
 e.preventDefault();const button=$("#pmSave");button.disabled=true;
 try{
  const items=readItems();validateItems(items);
  const starts_at=fromBrasiliaInput($("#pmStart").value),ends_at=fromBrasiliaInput($("#pmEnd").value);
  if(Date.parse(ends_at)<=Date.parse(starts_at))throw new Error("O encerramento deve ser posterior ao início.");
  if(Date.parse(ends_at)-Date.parse(starts_at)>90*86400000)throw new Error("A duração máxima é de 90 dias.");
  const payload={title:$("#pmTitle").value.trim(),subtitle:$("#pmSubtitle").value.trim(),items,starts_at,ends_at,active:$("#pmActive").checked,updated_at:new Date().toISOString()};
  const result=editingId?await sb.from("student_popups").update(payload).eq("id",editingId).eq("class_id",$("#pmClass").value):await sb.from("student_popups").insert({...payload,class_id:$("#pmClass").value,created_by:session.user.id});
  if(result.error)throw result.error;message(editingId?"Comunicado atualizado.":"Comunicado criado.");clearForm();await loadPopups()
 }catch(err){message(err.message,true)}finally{button.disabled=false}
};
$("#pmPreview").onclick=()=>{
 try{const items=readItems();validateItems(items);$("#pmPreviewContent").innerHTML='<h2>'+esc($("#pmTitle").value)+'</h2><p>'+esc($("#pmSubtitle").value)+'</p>'+items.map(x=>'<article class="pm-preview-card"><strong>'+esc(x.icon)+' '+esc(x.label)+'</strong><h3>'+esc(x.title)+'</h3><p>'+esc(x.description)+'</p><small>📍 '+esc(x.where)+'</small>'+(x.url?'<div><a href="'+esc(x.url)+'" target="_blank" rel="noopener">'+esc(x.action||"Acessar")+' ↗</a></div>':"")+'</article>').join("");$("#pmPreviewDialog").showModal()}catch(e){message(e.message,true)}
};
$("#pmPreviewClose").onclick=()=>$("#pmPreviewDialog").close();
$("#pmAddItem").onclick=()=>addItem();$("#pmNew").onclick=clearForm;$("#pmCancel").onclick=clearForm;
$("#pmClass").onchange=()=>{localStorage.setItem("webacademy.instructor.activeClass",$("#pmClass").value);clearForm();loadPopups()};
const {data,error}=await sb.from("classes").select("id,code,name").eq("instructor_id",session.user.id).order("code");
if(error||!data?.length){message("Não foi possível localizar turmas vinculadas ao instrutor.",true);throw error||new Error("NO_CLASSES")}
classes=data;$("#pmClass").innerHTML=classes.map(c=>'<option value="'+esc(c.id)+'">'+esc(c.code+" · "+(c.name||"Turma"))+'</option>').join("");
const saved=localStorage.getItem("webacademy.instructor.activeClass");$("#pmClass").value=classes.some(c=>c.id===saved)?saved:classes[0].id;
clearForm();await loadPopups();
