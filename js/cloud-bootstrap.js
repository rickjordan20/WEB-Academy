import {getSupabase,getSession} from "./supabase-client.js";
import {pullCloudState,pushCloudState} from "./cloud-sync.js";
import {setActiveUser,getState} from "./storage.js";
const sb=await getSupabase();
if(sb){
 const session=await getSession();
 if(!session){setActiveUser(null);location.replace("auth.html")}
 else{
  setActiveUser(session.user.id);
  try{
   const hadLocal=!!getState(session.user.id);
   const cloud=await pullCloudState();
   if(!hadLocal&&cloud)location.reload();
  }catch(e){console.warn("Sincronização inicial indisponível:",e)}
  let timer;window.addEventListener("uc7:state-saved",e=>{clearTimeout(timer);timer=setTimeout(()=>pushCloudState(e.detail).catch(err=>console.warn("Sincronização pendente:",err)),700)});
 }
}
