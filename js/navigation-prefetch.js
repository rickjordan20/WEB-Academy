// Prefetch only same-origin HTML pages after explicit navigation intent.
// Never intercept clicks or change destination URLs, authentication, or routing.
const warmed=new Set();
let lastWarm=0;
function warm(target){
 const a=target?.closest?.('a[href]');if(!a||a.hasAttribute('download')||a.target==='_blank')return;
 let url;try{url=new URL(a.href,location.href)}catch{return}
 if(url.origin!==location.origin||url.pathname===location.pathname||!url.pathname.endsWith('.html')||warmed.has(url.pathname))return;
 if(navigator.connection?.saveData||/2g/.test(navigator.connection?.effectiveType||''))return;
 if(Date.now()-lastWarm<250)return;
 lastWarm=Date.now();warmed.add(url.pathname);
 const hint=document.createElement('link');hint.rel='prefetch';hint.as='document';hint.href=url.pathname+url.search;document.head.append(hint);
}
document.addEventListener('pointerover',event=>{if(event.pointerType==='mouse')warm(event.target)},{passive:true});
document.addEventListener('focusin',event=>warm(event.target));
