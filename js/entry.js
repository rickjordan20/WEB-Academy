import {getSupabase,getSession} from "./supabase-client.js";const sb=await getSupabase();if(sb){const session=await getSession();location.replace(session?"app.html":"auth.html")}
