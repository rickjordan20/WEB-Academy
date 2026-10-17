// Menu único para páginas internas do estudante. Não interfere nos módulos das páginas.
const links=[
 ["app.html","⌂","Visão Geral",""],
 ["journey.html","🗺","Minha Jornada","14 fases"],
 ["class-schedule.html","📅","Cronograma","Aulas"],
 ["missions.html","🎯","Missões","28 aulas"],
 ["edutech.html","🎓","EduTech","Projeto"],
 ["guild.html","⚔","Minha Guilda","Kanban"],
 ["extras.html","🧭","Missões Remotas","7 missões"],
 ["milestones.html","🏁","Marcos Avaliativos","4"],
 ["competencies.html","⚡","Competências","I1–I6"],
 ["progress.html","📊","Meu Progresso",""],
 ["achievements.html","🏅","Conquistas",""]
];
const page=location.pathname.split("/").pop()||"app.html";
const active=page==="mission.html"||page==="fundamentals.html"?"missions.html":page;
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const nav=links.map(([url,icon,label,meta])=>`<a class="wa-nav-link${url===active?" active":""}" href="${url}" ${url===active?'aria-current="page"':""}><span class="wa-nav-icon" aria-hidden="true">${icon}</span><span class="wa-nav-name">${label}</span>${meta?`<small>${meta}</small>`:""}</a>`).join("");
const root=document.createElement("div");
root.id="waStudentNavigation";
root.innerHTML=`<aside class="wa-student-sidebar" id="waStudentSidebar" aria-label="Menu da Web Academy">
 <a class="wa-nav-brand" href="app.html"><span class="wa-nav-brand-mark" aria-hidden="true">&lt;/&gt;</span><span><b>UC7 Web Academy</b><small>SENAC · DF</small></span></a>
 <button type="button" class="wa-nav-collapse" id="waNavCollapse" aria-label="Recolher menu">☰ <span>Recolher menu</span></button>
 <nav class="wa-nav-links" aria-label="Navegação do estudante">${nav}</nav>
 <div class="wa-nav-footer"><a class="wa-nav-link" href="report.html"><span class="wa-nav-icon">📄</span><span class="wa-nav-name">Relatório</span></a><a class="wa-nav-link" href="validation.html"><span class="wa-nav-icon">🩺</span><span class="wa-nav-name">Diagnóstico</span></a><a class="wa-nav-link" href="app.html?panel=profile"><span class="wa-nav-icon">👤</span><span class="wa-nav-name">Meu perfil</span></a><a class="wa-nav-link" href="app.html?panel=settings"><span class="wa-nav-icon">⚙</span><span class="wa-nav-name">Configurações</span></a><button class="wa-nav-link wa-nav-signout" type="button" id="waNavSignOut"><span class="wa-nav-icon">↪</span><span class="wa-nav-name">Sair da conta</span></button></div>
 </aside><button type="button" class="wa-nav-expand" id="waNavExpand" aria-label="Abrir menu" aria-controls="waStudentSidebar">☰</button><div class="wa-nav-overlay" id="waNavOverlay"></div>`;
document.body.prepend(root);
document.body.classList.add("wa-has-student-nav");
const sidebar=document.getElementById("waStudentSidebar");
const collapse=document.getElementById("waNavCollapse");
const expand=document.getElementById("waNavExpand");
const overlay=document.getElementById("waNavOverlay");
const mobile=matchMedia("(max-width: 1000px)");
const key="uc7-web-academy-sidebar-collapsed";
const read=()=>{try{return localStorage.getItem(key)==="1"}catch{return false}};
const save=value=>{try{localStorage.setItem(key,value?"1":"0")}catch{}};
let open=false;
function sync(){
 const collapsed=!mobile.matches&&read();
 document.body.classList.toggle("wa-nav-collapsed",collapsed);
 document.body.classList.toggle("wa-nav-open",mobile.matches&&open);
 collapse.setAttribute("aria-label",mobile.matches?"Fechar menu":"Recolher menu");
 expand.setAttribute("aria-label",mobile.matches&&open?"Fechar menu":collapsed?"Expandir menu":"Abrir menu");
 expand.textContent=mobile.matches&&open?"✕":"☰";
 expand.setAttribute("aria-expanded",String(mobile.matches?open:!collapsed));
}
collapse.addEventListener("click",()=>{if(mobile.matches)open=false;else save(true);sync()});
expand.addEventListener("click",()=>{if(mobile.matches)open=!open;else save(false);sync()});
overlay.addEventListener("click",()=>{open=false;sync()});
sidebar.addEventListener("click",event=>{if(mobile.matches&&event.target.closest("a.wa-nav-link")){open=false;sync()}});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&open){open=false;sync();expand.focus()}});
mobile.addEventListener("change",()=>{open=false;sync()});
sync();
document.getElementById("waNavSignOut").addEventListener("click",async event=>{
 const button=event.currentTarget;button.disabled=true;
 try{
  const {getSupabase}=await import("./supabase-client.js");
  const {setActiveUser}=await import("./storage.js");
  const sb=await getSupabase();
  if(sb){const {error}=await sb.auth.signOut();if(error)throw error}
  setActiveUser(null);
  location.replace(sb?"auth.html":"index.html");
 }catch(error){button.disabled=false;alert("Não foi possível sair da conta: "+(error?.message||"Tente novamente."))}
});
