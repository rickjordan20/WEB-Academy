// Comunicado temporário de novidades — horário de Brasília, 28 a 31/10/2026.
export const NEWS_START=Date.parse("2026-10-28T00:00:00-03:00");
export const NEWS_END=Date.parse("2026-10-31T00:00:00-03:00");
export const NEWS_ID="web-academy-novidades-2026-10-28";
export const NEWS_ITEMS=[
 {icon:"🆘",label:"Nova funcionalidade",title:"Central de Ajuda — Aluno Anjo",description:"Precisa de ajuda em uma atividade? Explique sua dúvida e solicite atendimento de um Aluno Anjo ou do instrutor.",where:"Menu lateral → Central de Ajuda",url:"angel-help.html",action:"Abrir Central de Ajuda"},
 {icon:"🏆",label:"Novas conquistas",title:"Conquistas de HTML, CSS e JavaScript",description:"Ganhe distintivos conforme avança nas missões e conclui os desafios de cada fase. Seu progresso anterior também pode ser reconhecido.",where:"Menu lateral → Conquistas",url:"achievements.html",action:"Ver minhas conquistas"},
 {icon:"💡",label:"Melhoria",title:"Dicas nos laboratórios",description:"Os laboratórios de HTML agora apresentam orientações abaixo do resultado do código para ajudar você a resolver os desafios.",where:"Missões → Laboratório → Dica para resolver",url:"extras.html?id=R2",action:"Explorar laboratório"},
 {icon:"🧭",label:"Melhoria",title:"Navegação mais organizada",description:"Menus laterais padronizados facilitam o acesso às atividades, ao cronograma e às ferramentas de apoio.",where:"Menu lateral das páginas atualizadas",url:"class-schedule.html",action:"Ver cronograma"}
];
export function newsActive(now=Date.now()){return now>=NEWS_START&&now<NEWS_END}
export function newsDismissKey(userId){return NEWS_ID+":"+(userId||"anon")}
export function initStudentNews(userId){
 const host=document.createElement("div");host.id="studentNewsHost";document.body.append(host);
 const esc=v=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 host.innerHTML='<button type="button" class="student-news-reopen" id="studentNewsReopen" aria-label="Abrir novidades da WEB Academy">✨ Novidades</button>'+
 '<div class="student-news-overlay" id="studentNewsOverlay" hidden><section class="student-news-dialog" role="dialog" aria-modal="true" aria-labelledby="studentNewsTitle" tabindex="-1">'+
 '<header class="student-news-header"><div><span class="student-news-eyebrow">WEB ACADEMY · 28 A 30 DE OUTUBRO</span><h2 id="studentNewsTitle">🚀 Novidades da WEB Academy!</h2><p>Conheça os novos recursos, saiba onde encontrá-los e continue sua jornada.</p></div><button type="button" id="studentNewsClose" class="student-news-close" aria-label="Fechar novidades">✕</button></header>'+
 '<div class="student-news-items">'+NEWS_ITEMS.map(item=>'<article class="student-news-item"><div class="student-news-item-top"><span class="student-news-icon" aria-hidden="true">'+esc(item.icon)+'</span><div><span class="student-news-kind">'+esc(item.label)+'</span><h3>'+esc(item.title)+'</h3></div></div><p>'+esc(item.description)+'</p><div class="student-news-where">📍 '+esc(item.where)+'</div><a class="student-news-link" href="'+esc(item.url)+'">'+esc(item.action)+' ↗</a></article>').join("")+'</div>'+
 '<footer class="student-news-footer"><label><input type="checkbox" id="studentNewsDontShow"> Não mostrar novamente</label><button type="button" id="studentNewsGotIt" class="student-news-ok">Entendi, vamos continuar!</button></footer></section></div>';
 const overlay=host.querySelector("#studentNewsOverlay"),dialog=host.querySelector(".student-news-dialog"),reopen=host.querySelector("#studentNewsReopen"),check=host.querySelector("#studentNewsDontShow"),key=newsDismissKey(userId);
 let previousFocus=null;
 function close(){try{sessionStorage.setItem(sessionKey,"1")}catch{}if(check.checked){try{localStorage.setItem(key,"1")}catch{}}overlay.hidden=true;document.body.classList.remove("student-news-open");(previousFocus?.isConnected?previousFocus:reopen).focus()}
 function open(){if(!newsActive())return;previousFocus=document.activeElement;check.checked=false;overlay.hidden=false;document.body.classList.add("student-news-open");dialog.focus()}
 host.querySelector("#studentNewsClose").addEventListener("click",close);
 host.querySelector("#studentNewsGotIt").addEventListener("click",close);
 reopen.addEventListener("click",open);
 overlay.addEventListener("click",event=>{if(event.target===overlay)close()});
 overlay.addEventListener("keydown",event=>{if(event.key==="Escape"){event.preventDefault();close()}if(event.key==="Tab"){const focusable=[...dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled])')];if(!focusable.length)return;const first=focusable[0],last=focusable[focusable.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}});
 if(!newsActive()){host.remove();return}
 try{if(localStorage.getItem(key)!=="1"&&sessionStorage.getItem(sessionKey)!=="1")setTimeout(open,450)}catch{setTimeout(open,450)}
}
