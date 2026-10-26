import {getSupabase} from "./supabase-client.js";
import {setVerifiedMissionWindow} from "./mission-engine.js";
const fmt=iso=>iso?new Intl.DateTimeFormat("pt-BR",{timeZone:"America/Sao_Paulo",day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(iso)):"a definir";
export async function missionWindow(missionId){
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
 const access={state:row.access_state,opensAt:row.opens_at,closesAt:row.closes_at,message:row.access_state==="unpublished"?"Aguardando publicação pelo instrutor.":row.access_state==="upcoming"?"Disponível a partir de "+fmt(row.opens_at):row.access_state==="closed"?"Prazo vencido em "+fmt(row.closes_at)+". Entrega com justificativa disponível.":row.access_state==="unconfigured"?"Horário ainda não configurado pelo instrutor.":"Disponível até "+fmt(row.closes_at)};
 setVerifiedMissionWindow(missionId,access);
 return access;
 }catch(error){console.warn("Verificação de publicação indisponível:",error);return {state:"error",message:"Não foi possível verificar o cronograma. Tente novamente."}}
}
export function windowNotice(info,returnHref="missions.html"){
 const title=info.state==="unpublished"?"🔒 Aguardando publicação":info.state==="upcoming"?"🔒 Missão ainda não liberada":info.state==="closed"?"Entrega em atraso disponível":"🔒 Acesso indisponível";
 const section=document.createElement("section");section.className="card current-mission";const h=document.createElement("h1");h.textContent=title;const p=document.createElement("p");p.textContent=info.message;const a=document.createElement("a");a.className="btn btn-secondary";a.href=returnHref;a.textContent="Voltar às missões";section.append(h,p,a);return section;
}

/** Consulta as janelas de todas as missões em uma única chamada ao Supabase. */
export async function missionWindowsBatch(){
 const sb=await getSupabase();if(!sb)throw new Error("Conexão indisponível");
 const {data:auth,error:authError}=await sb.auth.getUser();if(authError||!auth?.user)throw new Error("Faça login para consultar as missões");
 const {data:members,error:memberError}=await sb.from("class_members").select("class_id").eq("user_id",auth.user.id).eq("status","active");
 if(memberError||!members?.length)throw new Error("Matrícula ativa não encontrada");
 const preferred=localStorage.getItem("webacademy.student.activeClass");
 const chosen=members.find(m=>m.class_id===preferred)||members[0];
 const {data,error}=await sb.rpc("student_mission_access_windows",{p_class_id:chosen.class_id});
 if(error)throw error;
 const windows=new Map();
 for(const row of data||[]){
  const access={state:row.access_state,opensAt:row.opens_at,closesAt:row.closes_at,
   message:row.access_state==="unpublished"?"Aguardando publicação pelo instrutor.":row.access_state==="upcoming"?"Disponível a partir de "+fmt(row.opens_at):row.access_state==="closed"?"Prazo vencido em "+fmt(row.closes_at)+". Entrega com justificativa disponível.":row.access_state==="unconfigured"?"Horário ainda não configurado pelo instrutor.":"Disponível até "+fmt(row.closes_at)};
  windows.set(row.mission_id,access);setVerifiedMissionWindow(row.mission_id,access);
 }
 return windows;
}
