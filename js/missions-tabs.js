const tabs=[...document.querySelectorAll("[data-missions-tab]")];
const tracking=document.querySelector("#myMissions"),catalog=document.querySelector("#missionsCatalog");
function activate(value){
 const isCatalog=value==="catalog";
 tracking.hidden=isCatalog;catalog.hidden=!isCatalog;
 tabs.forEach(tab=>{const selected=tab.dataset.missionsTab===value;tab.classList.toggle("active",selected);tab.setAttribute("aria-selected",String(selected))});
 try{history.replaceState(null,"",isCatalog?"#catalog":"#tracking")}catch{}
}
tabs.forEach(tab=>tab.addEventListener("click",()=>activate(tab.dataset.missionsTab)));
activate(location.hash==="#catalog"?"catalog":"tracking");
