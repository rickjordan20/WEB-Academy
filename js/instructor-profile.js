import {getSupabase,getSession} from "./supabase-client.js";
const sb=await getSupabase(),session=await getSession();
const $=s=>document.querySelector(s);
const dialog=$("#instructorProfileDialog");
if(sb&&session&&dialog){
 const {data:identity,error:identityError}=await sb.from("profiles").select("full_name,role").eq("id",session.user.id).single();
 if(!identityError&&identity?.role==="instructor"){
  const userId=session.user.id;
  const fields=["display_name","professional_title","specialty","bio","educational_email","github_url","portfolio_url","linkedin_url"];
  const icons={astronaut:"🧑‍🚀",developer:"🧑‍💻",robot:"🤖",explorer:"🧭",artist:"🎨"};
  const form=$("#instructorProfileForm"),feedback=$("#instructorProfileFeedback"),avatarFeedback=$("#instructorAvatarFeedback");
  let details={},signedUrl="",signedPath="",refreshId=0;
  const initials=name=>String(name||"I").trim().split(/\s+/).slice(0,2).map(s=>s[0]||"").join("").toUpperCase();
  function setMessage(node,message,error=false){node.textContent=message;node.className="feedback"+(error?" error":"")}
  function draw(){
   const name=details.display_name?.trim()||identity.full_name||"Instrutor";
   $("#instructorProfileName").textContent=name;
   $("#instructorOfficialName").textContent=details.display_name?.trim()?"Nome cadastrado: "+(identity.full_name||"Não informado"):"Instrutor · WEB Academy";
   $("#instructorProfileEmail").textContent=session.user.email||"";
   $("#instructorLoginEmail").textContent=session.user.email||"Não informado";
   const preset=details.avatar_preset||"initials";
   const url=preset==="photo"&&details.avatar_path===signedPath?signedUrl:"";
   for(const id of ["#instructorProfileAvatar","#openInstructorProfile"]){
    const el=$(id);el.replaceChildren();
    if(url){const img=document.createElement("img");img.className="student-avatar-image";img.src=url;img.alt="Foto do instrutor";el.append(img)}
    else el.textContent=icons[preset]||initials(name);
   }
   document.querySelectorAll("[data-instructor-avatar]").forEach(btn=>{
    btn.classList.toggle("selected",btn.dataset.instructorAvatar===preset);
    btn.setAttribute("aria-pressed",String(btn.dataset.instructorAvatar===preset));
    if(btn.dataset.instructorAvatar==="initials")btn.textContent=initials(name);
   });
  }
  async function refreshAvatar(){
   const path=details.avatar_preset==="photo"?details.avatar_path:"";
   const id=++refreshId;
   if(!path){signedUrl="";signedPath="";draw();return}
   const {data,error}=await sb.storage.from("student-avatars").createSignedUrl(path,3600);
   if(id!==refreshId)return;
   if(error)throw error;
   signedPath=path;signedUrl=data.signedUrl;draw();
  }
  async function load(){
   const {data,error}=await sb.from("instructor_profile_details").select("*").eq("user_id",userId).maybeSingle();
   if(error)throw error;
   details=data||{};
   for(const field of fields)form.elements.namedItem(field).value=details[field]||"";
   draw();
   try{await refreshAvatar()}catch(err){setMessage(avatarFeedback,"Foto indisponível: "+err.message,true)}
  }
  async function open(){
   dialog.showModal();
   setMessage(feedback,"");setMessage(avatarFeedback,"");
   $("#saveInstructorProfile").disabled=true;
   try{
    const {count,error}=await sb.from("classes").select("id",{count:"exact",head:true}).eq("instructor_id",userId);
    $("#instructorClassCount").textContent=error?"Não disponível":String(count??0);
    await load();
   }catch(err){setMessage(feedback,"Não foi possível carregar o perfil: "+err.message,true)}
   finally{$("#saveInstructorProfile").disabled=false}
  }
  $("#openInstructorProfile").addEventListener("click",open);
  $("#openInstructorProfileSidebar").addEventListener("click",open);
  $("#closeInstructorProfile").addEventListener("click",()=>dialog.close());
  form.addEventListener("submit",async e=>{
   e.preventDefault();
   const values=Object.fromEntries(new FormData(form));
   for(const k of fields)values[k]=String(values[k]||"").trim();
   if(values.educational_email&&!/^[a-z0-9._%+\-]+@edu\.df\.senac\.br$/i.test(values.educational_email)){setMessage(feedback,"Informe um e-mail educacional terminado em @edu.df.senac.br.",true);return}
   for(const k of ["github_url","portfolio_url","linkedin_url"])if(values[k]&&!/^https:\/\//i.test(values[k])){setMessage(feedback,"Os links profissionais devem começar com https://",true);return}
   const button=$("#saveInstructorProfile");button.disabled=true;setMessage(feedback,"Salvando...");
   try{
    const {error}=await sb.from("instructor_profile_details").upsert({user_id:userId,...values,updated_at:new Date().toISOString()},{onConflict:"user_id"});
    if(error)throw error;
    details={...details,...values};draw();setMessage(feedback,"Perfil atualizado com sucesso.");
   }catch(err){setMessage(feedback,"Não foi possível salvar: "+err.message,true)}
   finally{button.disabled=false}
  });
  async function choose(preset,path){
   const nextPath=path||details.avatar_path||"";
   const {error}=await sb.from("instructor_profile_details").upsert({user_id:userId,avatar_preset:preset,avatar_path:nextPath,updated_at:new Date().toISOString()},{onConflict:"user_id"});
   if(error)throw error;
   details={...details,avatar_preset:preset,avatar_path:nextPath};
   await refreshAvatar();
  }
  document.querySelectorAll("[data-instructor-avatar]").forEach(btn=>btn.addEventListener("click",async()=>{
   const buttons=[...document.querySelectorAll("[data-instructor-avatar]")];
   buttons.forEach(b=>b.disabled=true);setMessage(avatarFeedback,"Salvando avatar...");
   try{await choose(btn.dataset.instructorAvatar);setMessage(avatarFeedback,"Avatar atualizado.")}
   catch(err){setMessage(avatarFeedback,"Erro ao atualizar avatar: "+err.message,true)}
   finally{buttons.forEach(b=>b.disabled=false)}
  }));
  $("#instructorAvatarFile").addEventListener("change",async e=>{
   const file=e.target.files?.[0];e.target.value="";
   if(!file)return;
   if(!["image/jpeg","image/png","image/webp"].includes(file.type)||file.size>2097152){setMessage(avatarFeedback,"Use JPG, PNG ou WebP com até 2 MB.",true);return}
   const ext={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}[file.type];
   const path=userId+"/instructor-"+Date.now()+"."+ext;
   setMessage(avatarFeedback,"Enviando foto...");
   try{
    const {error}=await sb.storage.from("student-avatars").upload(path,file,{contentType:file.type,upsert:false});
    if(error)throw error;
    try{await choose("photo",path)}
    catch(err){await sb.storage.from("student-avatars").remove([path]);throw err}
    setMessage(avatarFeedback,"Foto atualizada com sucesso.");
   }catch(err){setMessage(avatarFeedback,"Falha ao enviar foto: "+err.message,true)}
  });
  load().catch(err=>console.warn("Perfil do instrutor não carregado:",err));
 }
}
