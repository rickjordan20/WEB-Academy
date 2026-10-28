import {getSupabase,getSession} from "./supabase-client.js";
import {ACHIEVEMENTS} from "./gamification.js";
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let sb,user,classes=[],catalog=[],grants=[],students=[],selectedGrant="";
function feedback(message,error=false){$("#amFeedback").innerHTML='<div class="am-feedback'+(error?' error':'')+'">'+esc(message)+'</div>'}
function card(a,custom=false){
 const total=grants.filter(g=>g.achievement_id===a.id).length;
 return '<article class="am-card'+(custom&&!a.active?' is-inactive':'')+'"><div class="am-card-icon">'+esc(a.icon)+'</div><span class="am-chip">'+(custom?(a.active?'Personalizada · ativa':'Personalizada · inativa'):'Automática')+'</span><h3>'+esc(a.name)+'</h3><p>'+esc(a.description)+'</p>'+(custom?'<small>'+total+' concessão(ões)</small><div class="am-card-actions"><button class="btn btn-secondary" type="button" data-edit="'+esc(a.id)+'">Editar</button><button class="btn btn-primary" type="button" data-grant="'+esc(a.id)+'" '+(!a.active?'disabled':'')+'>Conceder</button></div>':'')+'</article>';
}
function render(){
 $("#amBuiltins").innerHTML=ACHIEVEMENTS.map(a=>card(a)).join("");
 $("#amCustom").innerHTML=catalog.length?catalog.map(a=>card(a,true)).join(""):'<p>Nenhuma conquista personalizada nesta turma. Use “Nova conquista” para começar.</p>';
 $("#amBuiltinCount").textContent=ACHIEVEMENTS.length;
 $("#amCustomCount").textContent=catalog.length;
 $("#amGrantCount").textContent=grants.length;
 $("#amCustom").querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>edit(b.dataset.edit));
 $("#amCustom").querySelectorAll("[data-grant]").forEach(b=>b.onclick=()=>grant(b.dataset.grant));
}
async function load(){
 const classId=$("#amClass").value;
 const [a,g,m]=await Promise.all([
  sb.from("achievement_catalog").select("id,name,description,icon,active").eq("class_id",classId).order("created_at",{ascending:false}),
  sb.from("achievement_grants").select("achievement_id,student_id,granted_at").in("achievement_id",["__none__",...catalog.map(x=>x.id)]),
  sb.from("class_members").select("user_id").eq("class_id",classId).eq("status","active")
 ]);
 if(a.error||m.error)throw a.error||m.error;
 catalog=a.data||[];
 const ids=(m.data||[]).map(x=>x.user_id);
 const p=ids.length?await sb.from("profiles").select("id,full_name").in("id",ids):{data:[],error:null};
 if(p.error)throw p.error;
 students=(p.data||[]).sort((x,y)=>(x.full_name||"").localeCompare(y.full_name||"","pt-BR"));
 const grantsResult=catalog.length?await sb.from("achievement_grants").select("achievement_id,student_id,granted_at").in("achievement_id",catalog.map(x=>x.id)):{data:[],error:null};
 if(grantsResult.error)throw grantsResult.error;
 grants=grantsResult.data||[];
 $("#amStudent").innerHTML='<option value="">Selecione um estudante</option>'+students.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.full_name||"Estudante")+'</option>').join("");
 render();
}
function edit(id=""){
 const a=catalog.find(x=>x.id===id);
 $("#amId").value=a?.id||"";
 $("#amIcon").value=a?.icon||"🏅";
 $("#amName").value=a?.name||"";
 $("#amDescription").value=a?.description||"";
 $("#amActive").checked=a?.active??true;
 $("#amEditorTitle").textContent=a?"Editar conquista":"Nova conquista";
 $("#amEditor").hidden=false;$("#amGrantSection").hidden=true;
 $("#amEditor").scrollIntoView({behavior:"smooth",block:"start"});
}
function grant(id){
 const a=catalog.find(x=>x.id===id);if(!a||!a.active)return;
 selectedGrant=id;$("#amGrantTitle").textContent=a.icon+" "+a.name;
 $("#amGrantSection").hidden=false;$("#amEditor").hidden=true;
 $("#amGrantSection").scrollIntoView({behavior:"smooth",block:"start"});
}
async function init(){
 try{
  sb=await getSupabase();const session=await getSession();if(!sb||!session){location.replace("auth.html");return}
  user=session.user;
  const p=await sb.from("profiles").select("role").eq("id",user.id).single();
  if(p.error||!["instructor","admin"].includes(p.data?.role)){location.replace("app.html");return}
  const c=await sb.from("classes").select("id,code,name").eq("instructor_id",user.id).order("code");
  if(c.error)throw c.error;classes=c.data||[];
  if(!classes.length)throw Error("Nenhuma turma sob sua responsabilidade.");
  $("#amClass").innerHTML=classes.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.code)+' — '+esc(x.name)+'</option>').join("");
  $("#amClass").onchange=()=>load().catch(e=>feedback(e.message,true));
  $("#amNew").onclick=()=>edit();
  $("#amCancel").onclick=()=>{$("#amEditor").hidden=true};
  $("#amGrantCancel").onclick=()=>{$("#amGrantSection").hidden=true};
  $("#amForm").onsubmit=async e=>{
   e.preventDefault();const button=$("#amSave");button.disabled=true;
   const id=$("#amId").value||"custom-"+crypto.randomUUID();
   const payload={id,class_id:$("#amClass").value,name:$("#amName").value.trim(),description:$("#amDescription").value.trim(),icon:$("#amIcon").value.trim(),active:$("#amActive").checked,created_by:user.id,updated_at:new Date().toISOString()};
   const {error}=await sb.from("achievement_catalog").upsert(payload,{onConflict:"id"});
   button.disabled=false;if(error)return feedback("Não foi possível salvar: "+error.message,true);
   $("#amEditor").hidden=true;feedback("Conquista salva.");await load();
  };
  $("#amGrantForm").onsubmit=async e=>{
   e.preventDefault();const studentId=$("#amStudent").value;
   if(!studentId)return;
   if(grants.some(x=>x.achievement_id===selectedGrant&&x.student_id===studentId))return feedback("Este estudante já recebeu esta conquista.",true);
   const button=$("#amGrantSubmit");button.disabled=true;
   const {error}=await sb.from("achievement_grants").insert({achievement_id:selectedGrant,student_id:studentId,granted_by:user.id});
   button.disabled=false;if(error)return feedback("Não foi possível conceder: "+error.message,true);
   $("#amGrantSection").hidden=true;feedback("Conquista concedida ao estudante.");await load();
  };
  await load();
 }catch(e){feedback("Erro ao carregar o gerenciamento: "+e.message,true)}
}
init();