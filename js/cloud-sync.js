import {getState,cacheCloudState,setActiveUser} from "./storage.js";
import {getSupabase,getSession} from "./supabase-client.js";
export async function pullCloudState(){
 const sb=await getSupabase(),session=await getSession();if(!sb||!session)return null;setActiveUser(session.user.id);
 const {data,error}=await sb.from("student_states").select("state,updated_at").eq("user_id",session.user.id).maybeSingle();
 if(error)throw error;if(!data?.state)return null;
 const local=getState(session.user.id),cloud=data.state,lt=Date.parse(local?.meta?.updatedAt||0),ct=Date.parse(data.updated_at||cloud?.meta?.updatedAt||0);
 if(ct>lt){cacheCloudState(cloud,session.user.id);return cloud}return local;
}
export async function pushCloudState(state){
 const sb=await getSupabase(),session=await getSession();if(!sb||!session)return {synced:false};setActiveUser(session.user.id);
 const current=state||getState(session.user.id);if(!current)return {synced:false};
 const payload={user_id:session.user.id,state:current,updated_at:new Date().toISOString()};
 const {error}=await sb.from("student_states").upsert(payload,{onConflict:"user_id"});if(error)throw error;
 window.dispatchEvent(new CustomEvent("uc7:cloud-synced"));return {synced:true};
}
