import {getSupabase,getSession} from "./supabase-client.js";
import {pullCloudState,pushCloudState} from "./cloud-sync.js";
import {setActiveUser,getState} from "./storage.js";
const sb=await getSupabase();
if(sb){
 const session=await getSession();
 if(!session){setActiveUser(null);location.replace("auth.html")}
 else{
  setActiveUser(session.user.id);
  let pending=false, syncing=false, retryTimer=null,debounceTimer=null;
  const scheduleRetry=()=>{clearTimeout(retryTimer);if(navigator.onLine)retryTimer=setTimeout(()=>syncPending(),5000)};
  async function syncPending(){
   if(syncing||!navigator.onLine||!pending)return;
   syncing=true;
   try{
    const result=await pushCloudState();
    if(result?.synced)pending=false;
    else scheduleRetry();
   }catch(error){console.warn("Sincronização pendente; progresso local preservado:",error);scheduleRetry()}
   finally{syncing=false}
  }
  window.addEventListener("uc7:state-saved",()=>{
   pending=true;clearTimeout(debounceTimer);
   debounceTimer=setTimeout(syncPending,700);
  });
  window.addEventListener("online",()=>{pending=true;clearTimeout(retryTimer);syncPending()});
  document.addEventListener("visibilitychange",()=>{if(!document.hidden){pending=true;syncPending()}});
  try{
   const hadLocal=!!getState(session.user.id);
   const cloud=await pullCloudState();
   if(!hadLocal&&cloud)location.reload();
   // Retry locally retained changes after a previously interrupted session.
   if(hadLocal){pending=true;syncPending()}
  }catch(error){console.warn("Sincronização inicial indisponível:",error);pending=true;scheduleRetry()}
 }
}
