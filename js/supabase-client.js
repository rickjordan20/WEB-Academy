import {createClient} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
let client=null;
export async function getSupabase(){
 if(client)return client;
 try{
  const cfg=await import("./supabase-config.js");
  if(!cfg.SUPABASE_URL||!cfg.SUPABASE_PUBLISHABLE_KEY||cfg.SUPABASE_URL.includes("SEU-PROJETO"))return null;
  client=createClient(cfg.SUPABASE_URL,cfg.SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  return client;
 }catch{return null}
}
export async function getSession(){const sb=await getSupabase();if(!sb)return null;const {data}=await sb.auth.getSession();return data.session}
