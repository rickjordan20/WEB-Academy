import {getSupabase,getSession} from "./supabase-client.js";
import {ACHIEVEMENTS,defaultAchievementRule} from "./gamification.js";
const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let sb,user,classes=[],catalog=[],grants=[],students=[],selectedGrant="",ruleOverrides=[];
function feedback(message,error=false){$("#amFeedback").innerHTML='<div class="am-feedback'+(error?' error':'')+'">'+esc(message)+'</div>'}
function card(a,custom=false){
 const total=grants.filter(g=>g.achievement_id===a.id).length;
 return '<article class="am-card'+(custom&&!a.active?' is-inactive':'')+'"><div class="am-card-icon">'+esc(a.icon)+'</div><span class="am-chip">'+(custom?(a.active?'Personalizada · ativa':'Personalizada · inativa'):'Automática')+'</span><h3>'+esc(a.name)+'</h3><p>'+esc(a.description)+'</p>'+(custom?'<small>'+total+' concessão(ões)</small><div class="am-card-actions"><button class="btn btn-secondary" type="button" data-edit="'+esc(a.id)+'">Editar</button><button class="btn btn-primary" type="button" data-grant="'+esc(a.id)+'" '+(!a.active?'disabled':'')+'>Conceder</button></div>' :'<div class="am-card-actions"><button class="btn btn-primary" type="button" data-rule="'+esc(a.id)+'">Gerenciar regras</button></div>')+'</article>';
}
function render(){
 $("#amBuiltins").innerHTML=ACHIEVEMENTS.map(a=>{const override=ruleOverrides.find(r=>r.achievement_id===a.id);return card({...a,...(override||{}),description:(override?.description||a.description)+" · Regra: "+ruleSummary(override?.rule||defaultAchievementRule(a.id))},false)}).join("");
 $("#amCustom").innerHTML=catalog.length?catalog.map(a=>card(a,true)).join(""):'<p>Nenhuma conquista personalizada nesta turma. Use “Nova conquista” para começar.</p>';
 $("#amBuiltinCount").textContent=ACHIEVEMENTS.length;
 $("#amCustomCount").textContent=catalog.length;
 $("#amGrantCount").textContent=grants.length;
 $("#amBuiltins").querySelectorAll("[data-rule]").forEach(b=>b.onclick=()=>editRule(b.dataset.rule));
 $("#amCustom").querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>edit(b.dataset.edit));
 $("#amCustom").querySelectorAll("[data-grant]").forEach(b=>b.onclick=()=>grant(b.dataset.grant));
}
async function load(){
 const classId=$("#amClass").value;
 const [a,m,rules]=await Promise.all([
  sb.from("achievement_catalog").select("id,name,description,icon,active").eq("class_id",classId).order("created_at",{ascending:false}),
  sb.from("class_members").select("user_id").eq("class_id",classId).eq("status","active"),
  sb.from("achievement_rule_overrides").select("achievement_id,name,description,icon,active,rule").eq("class_id",classId)
 ]);
 if(a.error||m.error||rules.error)throw a.error||m.error||rules.error;
 ruleOverrides=rules.data||[];
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
function ruleSummary(rule){
 if(!rule)return "Não definida";
 switch(rule.type){
 case "mission_count":return "Concluir pelo menos "+rule.count+" missão(ões)";
 case "phase_count":return "Completar "+rule.count+" fase(s), com A e B";
 case "mission_complete":return "Concluir a missão "+rule.mission_id;
 case "phase_complete":return "Concluir "+rule.phase+"A e "+rule.phase+"B";
 case "guild_completion":return "Concluir uma missão de guilda";
 default:return "Tipo de regra desconhecido";
 }
}
function ruleFields(){
 const type=$("#amRuleType").value;
 const wrap=$("#amRuleValueWrap"),input=$("#amRuleValue");
 wrap.hidden=type==="guild_completion";
 input.required=!wrap.hidden;
 input.type=["mission_count","phase_count","phase_complete"].includes(type)?"number":"text";
 input.min="1";input.max=type==="phase_complete"?"14":"99";
 input.placeholder=type==="mission_complete"?"Ex.: 2A, 2B ou R2":"";
 wrap.firstChild.textContent=type==="mission_complete"?"Identificador da missão":type==="phase_complete"?"Número da fase":"Quantidade mínima";
}
function editRule(id){
 const original=ACHIEVEMENTS.find(a=>a.id===id);
 if(!original)return;
 const override=ruleOverrides.find(r=>r.achievement_id===id);
 const a={...original,...(override||{})},rule=override?.rule||defaultAchievementRule(id);
 $("#amRuleId").value=id;$("#amRuleIcon").value=a.icon;$("#amRuleName").value=a.name;
 $("#amRuleDescription").value=a.description;$("#amRuleActive").checked=a.active!==false;
 $("#amRuleTitle").textContent=a.icon+" "+a.name;
 $("#amRuleDefault").textContent="Padrão original: "+original.name+" — "+original.description+" | "+ruleSummary(defaultAchievementRule(id))+(override?" · Personalização ativa":" · Usando padrão");
 $("#amRuleType").value=rule.type;ruleFields();
 $("#amRuleValue").value=rule.count??rule.mission_id??rule.phase??"";
 $("#amRuleEditor").hidden=false;$("#amEditor").hidden=true;$("#amGrantSection").hidden=true;
 $("#amRuleEditor").scrollIntoView({behavior:"smooth",block:"start"});
}
function getRuleFromForm(){
 const type=$("#amRuleType").value,value=$("#amRuleValue").value.trim();
 if(type==="guild_completion")return {type};
 if(type==="mission_complete"){
  if(!/^(R[1-9][0-9]?|[1-9][0-9]?[AB])$/.test(value))throw Error("Informe uma missão válida, como 2A, 5B ou R2.");
  return {type,mission_id:value};
 }
 const count=Number(value);
 if(!Number.isInteger(count)||count<1||count>(type==="phase_complete"?14:99))throw Error("Informe um número inteiro válido para o critério.");
 return type==="phase_complete"?{type,phase:count}:{type,count};
}
function edit(id=""){
 const a=catalog.find(x=>x.id===id);
 $("#amId").value=a?.id||"";
 $("#amIcon").value=a?.icon||"🏅";
 $("#amName").value=a?.name||"";
 $("#amDescription").value=a?.description||"";
 $("#amActive").checked=a?.active??true;
 $("#amEditorTitle").textContent=a?"Editar conquista":"Nova conquista";
 $("#amEditor").hidden=false;$("#amRuleEditor").hidden=true;$("#amGrantSection").hidden=true;
 $("#amEditor").scrollIntoView({behavior:"smooth",block:"start"});
}
function grant(id){
 const a=catalog.find(x=>x.id===id);if(!a||!a.active)return;
 selectedGrant=id;$("#amGrantTitle").textContent=a.icon+" "+a.name;
 $("#amGrantSection").hidden=false;$("#amEditor").hidden=true;$("#amRuleEditor").hidden=true;
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
  $("#amClass").onchange=()=>{$("#amRuleEditor").hidden=true;$("#amEditor").hidden=true;$("#amGrantSection").hidden=true;load().catch(e=>feedback(e.message,true))};
  $("#amRuleType").onchange=ruleFields;
  $("#amRuleCancel").onclick=()=>{$("#amRuleEditor").hidden=true};
  $("#amRuleReset").onclick=async()=>{
   const id=$("#amRuleId").value;
   if(!confirm("Restaurar os valores e a regra original desta conquista para a turma?"))return;
   const {error}=await sb.from("achievement_rule_overrides").delete().eq("class_id",$("#amClass").value).eq("achievement_id",id);
   if(error)return feedback("Não foi possível restaurar: "+error.message,true);
   $("#amRuleEditor").hidden=true;feedback("Regra original restaurada.");await load();
  };
  $("#amRuleForm").onsubmit=async e=>{
   e.preventDefault();const button=$("#amRuleSave");button.disabled=true;
   try{
    const rule=getRuleFromForm();const payload={class_id:$("#amClass").value,achievement_id:$("#amRuleId").value,name:$("#amRuleName").value.trim(),description:$("#amRuleDescription").value.trim(),icon:$("#amRuleIcon").value.trim(),active:$("#amRuleActive").checked,rule,updated_by:user.id,updated_at:new Date().toISOString()};
    const {error}=await sb.from("achievement_rule_overrides").upsert(payload,{onConflict:"class_id,achievement_id"});
    if(error)throw error;
    $("#amRuleEditor").hidden=true;feedback("Regra automática atualizada para a turma.");await load();
   }catch(error){feedback(error.message,true)}finally{button.disabled=false}
  };
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