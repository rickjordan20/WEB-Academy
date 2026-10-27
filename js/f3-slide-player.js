import {summarizeF3Checks,nextF3Index} from "./f3-check-summary.js";
import {F3_SLIDES} from "../data/f3-slides.js";
import {getAnswer,saveAnswer,completeF3SlideChecks} from "./mission-engine.js";
import {getState} from "./storage.js";
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const slidePositions=new WeakMap();
const key=slide=>slide.id;
const saved=slide=>getAnswer("F3",key(slide));
export function mountF3Slides(root,unit,{readOnly=false,access=null}={}){
 let index=0;
 const all=F3_SLIDES;
 const isCompleted=()=>getState()?.journey?.completedFundamentals?.includes("F3")===true;
 const completedForSlides=()=>getState()?.journey?.fundamentalProgress?.F3?.slideChecksVersion==="f3-slides-v1";
 const passed=s=>saved(s)?.correct===true;
 index=slidePositions.has(root)?Math.min(all.length-1,slidePositions.get(root)):(isCompleted()?all.length-1:nextF3Index(getState()?.answers||{},all));
 const redraw=()=>{
  slidePositions.set(root,index);
  const s=all[index],record=saved(s),done=summarizeF3Checks(getState()?.answers||{},all).correct;
  root.innerHTML=`<section class="f3-shell"><header class="f3-header"><p class="eyebrow">WEB ACADEMY · FASE 03 · APRENDER</p><h1>Fundamentos — Dando Significado às Páginas</h1><p>HTML semântico e conteúdo para a EduTech · 1h30</p><div class="f3-meta"><strong>Slide ${index+1} de ${all.length}</strong><span>${done} checks concluídos</span></div><div class="f3-progress"><span style="width:${Math.round(done/all.length*100)}%"></span></div></header>${readOnly?`<p class="f3-notice" role="status">Modo somente leitura: ${access?.state==="closed"?"prazo encerrado":"atividade indisponível"}.</p>`:""}<article class="f3-card"><p class="eyebrow">APRENDA O CONCEITO</p><h2>${esc(s.title)}</h2><p class="f3-explanation">${esc(s.explanation)}</p><div class="f3-example"><p class="eyebrow">EXEMPLO COMENTADO</p><pre><code>${esc(s.code)}</code></pre></div><section class="f3-check" aria-label="Verificação de aprendizagem"><p class="eyebrow">AGORA É SUA VEZ</p><h3>${esc(s.question)}</h3><div class="f3-choices">${s.options.map((o,i)=>`<label><input type="radio" name="f3-answer" value="${i}" ${record?.selected===i?"checked":""} ${readOnly||record?.correct?"disabled":""}><span>${esc(o)}</span></label>`).join("")}</div><button type="button" class="btn btn-primary" id="f3-verify" ${readOnly||record?.correct?"disabled":""}>Verificar resposta</button><div id="f3-feedback" aria-live="polite">${record?`<p class="f3-feedback ${record.correct?"f3-ok":"f3-review"}">${record.correct?"Correto!":"Revise e tente novamente."} ${esc(record.correct?"Você identificou corretamente o conceito.":s.explanation)} Tentativas: ${Number(record.attempts)||1}.</p>`:""}</div></section></article><nav class="f3-actions" aria-label="Navegação dos slides"><button type="button" class="btn btn-secondary" id="f3-prev" ${index===0?"disabled":""}>← Anterior</button><span>${index+1} / ${all.length}</span><button type="button" class="btn btn-primary" id="f3-next" ${(!readOnly&&!passed(s))||(index===all.length-1&&(readOnly||isCompleted()))?"disabled":""}>${index===all.length-1?"Concluir fundamentos":"Próximo →"}</button></nav></section>`;
  root.querySelector("#f3-prev").onclick=()=>{index=Math.max(0,index-1);redraw()};
  root.querySelector("#f3-next").onclick=()=>{
   if(index<all.length-1){if(!readOnly&&!passed(s))return;index++;redraw();return}
   if(!readOnly&&!isCompleted()&&all.every(passed)){
    if(!completeF3SlideChecks()){root.querySelector("#f3-feedback").textContent="Não foi possível concluir. Verifique os checks e o prazo da atividade.";return;}
    redraw();
   }
  };
  if(completedForSlides()&&index===all.length-1){root.querySelector(".f3-actions").insertAdjacentHTML("afterend",'<div class="f3-finished"><strong>Fundamentos concluídos!</strong><p>Continue para a prática guiada da EduTech.</p><a class="btn btn-primary" href="mission.html?id=3A">Ir para a Missão 3A</a></div>')}
  root.querySelector("#f3-verify").onclick=()=>{
   if(readOnly||isCompleted()||saved(s)?.correct===true)return;
   const checked=root.querySelector('input[name="f3-answer"]:checked');if(!checked)return;
   const selected=Number(checked.value),previous=saved(s),correct=selected===s.correct;
   const at=new Date().toISOString();
   const record={selected,correct,attempts:(Number(previous?.attempts)||0)+1,firstTryCorrect:previous?.firstTryCorrect??correct,history:[...(previous?.history||[]),{selected,correct,at}].slice(-30),updatedAt:at};
   if(saveAnswer("F3",key(s),record)===false){root.querySelector("#f3-feedback").textContent="Não foi possível salvar. Verifique o prazo de acesso.";return}
   if(!saved(s)||saved(s).selected!==selected){root.querySelector("#f3-feedback").textContent="Não foi possível confirmar o salvamento da resposta.";return}
   redraw();
  };
 };
 redraw();
}
