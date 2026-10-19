// Conteúdo visual de leitura: HTML e CSS isolados, sem JavaScript.
const escapeAttribute = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
export function visualDocument(html = "", css = "") {
  // O iframe não recebe allow-scripts nem allow-same-origin. CSP reforça o isolamento.
  const safeCss = String(css).replace(/<\\/style/gi, "<\\/style");
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; style-src 'unsafe-inline'; img-src https: data:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'; frame-src 'none'">
<style>*,*::before,*::after{box-sizing:border-box}html{color-scheme:light dark}body{margin:0;padding:20px;font:16px/1.6 system-ui,sans-serif;overflow-wrap:anywhere}img,video,table{max-width:100%}pre{white-space:pre-wrap;overflow-wrap:anywhere}a{color:#5265de}@media(max-width:600px){body{padding:12px}}</style>
<style>${safeCss}</style></head><body>${String(html)}</body></html>`;
}
export function mountVisualFrame(frame, html, css) {
  frame.setAttribute("sandbox", "");
  frame.setAttribute("referrerpolicy", "no-referrer");
  frame.setAttribute("loading", "lazy");
  frame.srcdoc = visualDocument(html, css);
}
export function visualTemplate() {
 return {html:'<section class="conceito">\\n  <h2>Conceito principal</h2>\\n  <p>Explique aqui o conteúdo de forma clara.</p>\\n</section>',css:'.conceito { padding: 24px; border: 1px solid #64748b; border-radius: 14px; background: #f8fafc; color: #0f172a; }\\n.conceito h2 { margin-top: 0; color: #334155; }'};
}
