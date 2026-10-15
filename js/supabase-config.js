// A plataforma utiliza o Supabase de produção por padrão em todas as páginas.
// O backend local só pode ser selecionado explicitamente por URL, na própria página.
// Não persista a seleção entre navegações: isso evita sessões aparentemente perdidas
// e erros de login Google quando o Supabase local não tem OAuth configurado.
const params = new URLSearchParams(location.search);
const localHost = location.hostname === "localhost" || location.hostname === "127.0.0.1";
const useLocal = localHost && params.get("backend") === "local";

try {
  // Limpa a preferência antiga que podia deixar o navegador preso ao backend local.
  sessionStorage.removeItem("web-academy-supabase-target");
} catch (_) {}

let config;
if (useLocal) {
  config = await import("./supabase-config.local.js");
} else {
  config = await import("./supabase-config.production.js");
}

export const SUPABASE_URL = config.SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY = config.SUPABASE_PUBLISHABLE_KEY;
