// WEB Academy: autenticação e dados sempre no projeto Supabase de produção.
// O ambiente local (Live Server) hospeda apenas HTML/CSS/JS; não muda o backend.
// Evita Google OAuth 400 e sessões divergentes entre Supabase local e produção.
export {SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY} from "./supabase-config.production.js";
