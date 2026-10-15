(() => {
 const shell=document.querySelector(".app-shell");
 const sidebar=document.querySelector("#sidebar");
 const collapse=document.querySelector("#sidebarCollapse");
 const expand=document.querySelector("#sidebarExpand");
 if(!shell||!sidebar||!collapse||!expand)return;
 const key="uc7-web-academy-sidebar-collapsed";
 const mobile=window.matchMedia("(max-width: 1000px)");
 const read=()=>{try{return localStorage.getItem(key)==="1"}catch{return false}};
 const save=v=>{try{localStorage.setItem(key,v?"1":"0")}catch{}};
 const update=()=>{
  const isMobile=mobile.matches;
  const collapsed=!isMobile&&read();
  shell.classList.toggle("sidebar-is-collapsed",collapsed);
  const opened=isMobile&&sidebar.classList.contains("open");
  collapse.setAttribute("aria-label",isMobile?"Fechar menu":"Recolher menu");
  collapse.setAttribute("aria-expanded",String(isMobile?opened:!collapsed));
  expand.setAttribute("aria-label",isMobile?(opened?"Fechar menu":"Abrir menu"):"Expandir menu");
  expand.setAttribute("aria-expanded",String(isMobile?opened:!collapsed));
  expand.textContent=isMobile&&opened?"✕":"☰";
 };
 collapse.addEventListener("click",()=>{
  if(mobile.matches)sidebar.classList.remove("open");
  else save(true);
  update();
 });
 expand.addEventListener("click",()=>{
  if(mobile.matches)sidebar.classList.toggle("open");
  else save(false);
  update();
 });
 sidebar.addEventListener("click",e=>{
  if(mobile.matches&&e.target.closest("a.nav-item,button.nav-item")){sidebar.classList.remove("open");update()}
 });
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&mobile.matches&&sidebar.classList.contains("open")){sidebar.classList.remove("open");update();expand.focus()}});
 mobile.addEventListener("change",()=>{sidebar.classList.remove("open");update()});
 update();
})();
