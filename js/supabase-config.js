// Production is the safe default. Local testing must be explicitly enabled with ?backend=local
// on localhost/127.0.0.1 and requires an ignored js/supabase-config.local.js file.
const params = new URLSearchParams(location.search);
const localHost = location.hostname === "localhost" || location.hostname === "127.0.0.1";

if (localHost && params.get("backend") === "local") {
  sessionStorage.setItem("web-academy-supabase-target", "local");
} else if (localHost && params.get("backend") === "production") {
  sessionStorage.removeItem("web-academy-supabase-target");
}

const useLocal = localHost && sessionStorage.getItem("web-academy-supabase-target") === "local";
const config = useLocal
  ? await import("./supabase-config.local.js")
  : await import("./supabase-config.production.js");

export const SUPABASE_URL = config.SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY = config.SUPABASE_PUBLISHABLE_KEY;
