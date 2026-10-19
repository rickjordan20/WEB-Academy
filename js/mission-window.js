import {getSupabase} from "./supabase-client.js";
import {setVerifiedMissionWindow} from "./mission-engine.js";
const fmt=iso=>iso?new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(iso)):"a definir";
export async function missionWindow(missionId){
 setVerifiedMissionWindow(missionId,null);
 try{
 const sb=await getSupabase();if(!sb)return {state:"error",message:"Conexão com o servidor indisponível."};
 const {data:auth,error:authError}=await sb.auth.getUser();if(authError||!auth?.user)return {state:"error",message:"Entre na sua conta para consultar a missão."};
 const {data:members,error:memberError}=await sb.from("class_members").select("class_id").eq("user_id",auth.user.id).eq("status","active");
 if(memberError||!members?.length)return {state:"error",message:"Não foi possível confirmar sua matrícula."};
 const classId=localStorage.getItem("webacademy.student.activeClass");
 const chosen=members.find(m=>m.class_id===classId)||members[0];
 const {data,error}=await sb.rpc("mission_access_window",{p_class_id:chosen.class_id,p_mission_id:missionId});
 if(error)return {state:"error",message:"Falha ao consultar o cronograma: "+error.message};
 const row=data?.[0];if(!row)return {state:"unconfigured",message:"Missão ainda não vinculada ao cronograma."};
 const access={state:row.access_state,opensAt:row.opens_at,closesAt:row.closes_at,message:row.access_state==="upcoming"?"Disponível a partir de "+fmt(row.opens_at):row.access_state==="closed"?"Prazo encerrado em "+fmt(row.closes_at):row.access_state==="unconfigured"?"Horário ainda não configurado pelo instrutor.":"Disponível até "+fmt(row.closes_at)};
 }catch(error){console.warn("Verificação de publicação indisponível:",error);return {state:"error",message:"Não foi possível verificar o cronograma. Tente novamente."}}
}
export function windowNotice(info,returnHref="missions.html"){
 const title=info.state==="upcoming"?"🔒 Missão ainda não liberada":info.state==="closed"?"🔒 Prazo encerrado":"🔒 Acesso indisponível";
 const section=document.createElement("section");section.className="card current-mission";const h=document.createElement("h1");h.textContent=title;const p=document.createElement("p");p.textContent=info.message;const a=document.createElement("a");a.className="btn btn-secondary";a.href=returnHref;a.textContent="Voltar às missões";section.append(h,p,a);return section;
}
