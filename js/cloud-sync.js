import {getState,saveState} from "./storage.js";
import {getSupabase,getSession} from "./supabase-client.js";
export async function pullCloudState(){
 const sb=await getSupabase(),session=await getSession();if(!sb||!session)return null;
 const {data,error}=await sb.from("student_states").select("state,updated_at").eq("user_id",session.user.id).maybeSingle();
 if(error)throw error;if(!data?.state)return null;
 const local=getState(),cloud=data.state;
 const lt=Date.parse(local?.meta?.updatedAt||0),ct=Date.parse(data.updated_at||cloud?.meta?.updatedAt||0);
 if(ct>lt){saveState(cloud);return cloud}return local;
}
export async function pushCloudState(state=getState()){
 const sb=await getSupabase(),session=await getSession();if(!sb||!session||!state)return {synced:false};
 const payload={user_id:session.user.id,state,updated_at:new Date().toISOString()};
 const {error}=await sb.from("student_states").upsert(payload,{onConflict:"user_id"});
 if(error)throw error;return {synced:true};
}
