import {getSupabase,getSession} from "./supabase-client.js";
import {pullCloudState,pushCloudState} from "./cloud-sync.js";
import {setActiveUser,getState} from "./storage.js";
const sb=await getSupabase();
if(sb){
 const session=await getSession();
 if(!session){setActiveUser(null);location.replace("auth.html")}
 else{
  setActiveUser(session.user.id);
  let pending=false, syncing=false, retryTimer=null,debounceTimer=null,saveVersion=0, enrollmentBlocked=false;
  const scheduleRetry=()=>{clearTimeout(retryTimer);if(navigator.onLine)retryTimer=setTimeout(()=>syncPending(),5000)};
  async function syncPending(){
   if(syncing||!navigator.onLine||!pending||enrollmentBlocked)return;
   syncing=true;const startedAtVersion=saveVersion;
   try{
    const result=await pushCloudState();
    if(result?.synced){pending=saveVersion!==startedAtVersion;if(pending)scheduleRetry();}
    else scheduleRetry();
   }catch(error){\n    if(error?.code==="P0001"&&/active enrollment required/i.test(error?.message||"")){\n     enrollmentBlocked=true;clearTimeout(retryTimer);\n     console.warn("Sincronização pausada: esta sessão não tem matrícula ativa reconhecida. Progresso local preservado. Verifique a conta autenticada e a turma selecionada.");\n     window.dispatchEvent(new CustomEvent("uc7:enrollment-required"));\n    }else{console.warn("Sincronização pendente; progresso local preservado:",error);scheduleRetry()}\n   }
   finally{syncing=false}
  }
  window.addEventListener("uc7:state-saved",()=>{
   pending=true;saveVersion++;clearTimeout(debounceTimer);
   debounceTimer=setTimeout(syncPending,700);
  });
  window.addEventListener("online",()=>{pending=true;clearTimeout(retryTimer);if(!enrollmentBlocked)syncPending()});
  document.addEventListener("visibilitychange",()=>{if(!document.hidden){pending=true;if(!enrollmentBlocked)syncPending()}});
  try{
   const hadLocal=!!getState(session.user.id);
   const cloud=await pullCloudState();
   if(!hadLocal&&cloud)location.reload();
   // Retry locally retained changes after a previously interrupted session.
   if(hadLocal){pending=true;syncPending()}
  }catch(error){console.warn("Sincronização inicial indisponível:",error);pending=true;scheduleRetry()}
 }
}
