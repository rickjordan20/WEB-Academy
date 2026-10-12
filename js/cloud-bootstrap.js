import {getSupabase,getSession} from "./supabase-client.js";
import {pullCloudState,pushCloudState} from "./cloud-sync.js";
const sb=await getSupabase();
if(sb){
 const session=await getSession();
 if(!session){location.replace("auth.html")}
 else{
  try{const before=localStorage.getItem("uc7_web_academy_state_v1");await pullCloudState();const after=localStorage.getItem("uc7_web_academy_state_v1");if(before!==after)location.reload()}catch(e){console.warn("Sincronização inicial indisponível:",e)}
  let timer;window.addEventListener("uc7:state-saved",e=>{clearTimeout(timer);timer=setTimeout(()=>pushCloudState(e.detail).catch(err=>console.warn("Sincronização pendente:",err)),700)});
 }
}
