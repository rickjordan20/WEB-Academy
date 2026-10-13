import {getSupabase} from "./supabase-client.js";
import {createInitialState,getState,saveState,setActiveUser,hasLegacyState,getLegacyState,clearLegacyState} from "./storage.js";
import {pushCloudState} from "./cloud-sync.js";
function friendlyAuthError(err){
 const code=String(err?.code||"").toLowerCase(),msg=String(err?.message||"").toLowerCase();
 if(code==="over_email_send_rate_limit"||msg.includes("email rate limit exceeded"))return "O serviço de e-mails atingiu temporariamente o limite de envios. Seu cadastro não foi concluído. Aguarde e tente novamente mais tarde ou avise o instrutor. Evite repetir o cadastro várias vezes.";
 if(code==="email_address_not_authorized"||msg.includes("email address not authorized"))return "O serviço de e-mails ainda não está configurado para enviar confirmações a este endereço. Avise o instrutor.";
 if(code==="user_already_exists"||msg.includes("user already registered"))return "Este e-mail já possui cadastro. Use Entrar ou Esqueci minha senha.";
 if(code==="invalid_credentials"||msg.includes("invalid login credentials"))return "E-mail ou senha incorretos. Confira seus dados e tente novamente.";
 if(code==="weak_password"||msg.includes("password should be"))return "A senha não atende aos requisitos de segurança. Escolha uma senha mais forte.";
 if(code==="over_request_rate_limit"||msg.includes("rate limit"))return "Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.";
 if(msg.includes("failed to fetch")||msg.includes("network"))return "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.";
 return err?.message||"Não foi possível concluir o acesso.";
}
const sb=await getSupabase(),form=document.querySelector("#authForm"),fb=document.querySelector("#authFeedback"),toggle=document.querySelector("#toggleMode");let mode="login",recovery=false;
if(!sb){fb.textContent="Backend ainda não configurado. O instrutor precisa conectar o projeto Supabase.";fb.className="feedback error";form.querySelectorAll("input,button").forEach(x=>x.disabled=true)}
function draw(){const signup=mode==="signup";document.querySelector("#authTitle").textContent=recovery?"Definir nova senha":signup?"Criar conta":"Entrar";document.querySelector("#authHint").textContent=recovery?"Digite e confirme sua nova senha.":signup?"Cadastre-se para acessar sua Jornada Web.":"Use seu e-mail e senha cadastrados.";document.querySelector("#nameRow").hidden=!signup||recovery;document.querySelector("#confirmRow").hidden=!(signup||recovery);document.querySelector("#email").closest("label")?.removeAttribute("hidden");document.querySelector("#email").hidden=recovery;document.querySelector("#submitAuth").textContent=recovery?"Salvar nova senha":signup?"Criar conta":"Entrar";toggle.hidden=recovery;document.querySelector("#forgotPassword").hidden=recovery}
async function ensureProfile(session,name,email){await sb.from("profiles").upsert({id:session.user.id,full_name:name,email},{onConflict:"id"});setActiveUser(session.user.id)}
async function initializeAccount(session,name,email){
 setActiveUser(session.user.id);let state=getState(session.user.id);
 if(!state){state=createInitialState({name,email});saveState(state,session.user.id)}
 state.student.name=name;state.student.email=email;saveState(state,session.user.id);await pushCloudState(state);
}
if(sb){const {data:{session}}=await sb.auth.getSession();if(session){setActiveUser(session.user.id)}sb.auth.onAuthStateChange((event,session)=>{if(event==="PASSWORD_RECOVERY"){recovery=true;if(session)setActiveUser(session.user.id);draw()}})}
toggle.onclick=()=>{mode=mode==="login"?"signup":"login";draw()};
form.onsubmit=async e=>{e.preventDefault();fb.textContent="";const email=document.querySelector("#email").value.trim(),password=document.querySelector("#password").value,name=document.querySelector("#fullName").value.trim(),confirm=document.querySelector("#confirmPassword").value;try{
 if(recovery){if(password!==confirm)throw new Error("As senhas não conferem.");const {error}=await sb.auth.updateUser({password});if(error)throw error;fb.textContent="Senha atualizada. Você já pode continuar.";fb.className="feedback success";setTimeout(()=>location.href="app.html",700);return}
 if(mode==="signup"){if(!name)throw new Error("Informe seu nome completo.");if(password!==confirm)throw new Error("As senhas não conferem.");const {data,error}=await sb.auth.signUp({email,password,options:{data:{full_name:name}}});if(error)throw error;if(data.session){await ensureProfile(data.session,name,email);await initializeAccount(data.session,name,email);location.href="app.html"}else{fb.textContent="Conta criada. Verifique seu e-mail para confirmar o cadastro.";fb.className="feedback success"}}
 else{const {data,error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;if(data.session){const fullName=data.session.user.user_metadata?.full_name||email.split("@")[0];await ensureProfile(data.session,fullName,email);setActiveUser(data.session.user.id);location.href="app.html"}}
 }catch(err){fb.textContent=friendlyAuthError(err);fb.className="feedback error"}};
document.querySelector("#forgotPassword").onclick=async()=>{if(!sb)return;const email=document.querySelector("#email").value.trim();if(!email){fb.textContent="Informe seu e-mail primeiro.";fb.className="feedback error";return}const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:new URL("auth.html",location.href).href});fb.textContent=error?friendlyAuthError(error):"Se este e-mail estiver cadastrado, você receberá instruções de recuperação.";fb.className=error?"feedback error":"feedback success"};
draw();
