import {parseBehaviorChecks,evaluateCodeLab} from "./code-lab-checks.js";
import { completeStep,saveAnswer as persistAnswer,getAnswer as readAnswer,recordCodeAttempt as persistCodeAttempt,getCodeAttempts as readCodeAttempts } from "./mission-engine.js";
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
// Renderiza URLs e links Markdown com segurança, sem interpretar HTML do editor.
const linkedText=value=>{
 const raw=String(value??"");
 const pattern=/\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>()]+)/g;
 let html="",last=0,match;
 while((match=pattern.exec(raw))){
  html+=esc(raw.slice(last,match.index));
  let url=match[2]||match[3],label=match[1]||url;
  if(!match[2]){const suffix=url.match(/[.,;!?]+$/)?.[0]||"";url=url.slice(0,url.length-suffix.length);label=url;}
  try{const parsed=new URL(url);if(!["http:","https:"].includes(parsed.protocol))throw Error("Invalid link");html+=`<a href="${esc(parsed.href)}" target="_blank" rel="noopener noreferrer" class="guided-link">${esc(label)}</a>`;}catch{html+=esc(match[0]);}
  if(!match[2])html+=esc((match[3]||"").slice(url.length));
  last=pattern.lastIndex;
 }
 return html+esc(raw.slice(last));
};
const explainCommand=c=>{c=String(c);if(c==="git status")return"Veja os arquivos alterados";if(c==="git init")return"Inicie o Git nesta pasta";if(c==="git add .")return"Prepare os arquivos para o commit";if(c.startsWith("git commit"))return"Registre uma versão no computador";if(c.startsWith("git push"))return"Envie as versões ao GitHub";if(c.startsWith("git remote add"))return"Conecte ao repositório do GitHub";if(c==="git remote -v")return"Confira o endereço conectado";if(c.startsWith("git branch"))return"Defina a branch principal";if(c.startsWith("git config"))return"Confira seu nome ou e-mail";if(c.startsWith("git log"))return"Veja o histórico";return"Execute no terminal"};
const renderCommand=command=>`<div class="learning-command"><div class="learning-command-details"><code>${esc(command)}</code><small>${esc(explainCommand(command))}</small></div><button type="button" class="learning-copy-btn" data-copy-command="${esc(command)}" aria-label="Copiar comando">Copiar</button></div>`;
const guidedInstruction=value=>{const raw=String(value??"");const match=raw.match(/^(?:Digite|Execute) (git (?:--version|init|status|add \.|commit -m "[^"]+"|log -1 --oneline|config --global (?:user\.name|user\.email)(?: "[^"]+")?|remote (?:add origin [^ ]+|-v)|branch -M main|push(?: -u origin main)?|pull))(?=[., ]|$)/i);if(!match)return linkedText(raw);return linkedText(raw)+renderCommand(match[1])};
export function renderStep(step,missionId,done,options={}){
 const saved=options.previewStore?options.previewStore.answers.get(step.id):options.preview===true?null:readAnswer(missionId,step.id); const editable=options.editableCompleted===true;
 const head=`<div class="learning-step-head"><span class="step-type">${label(step.type)}</span><h2>${esc(step.title)}</h2><p>${esc(step.summary||"")}</p></div>`;
 let body="";
 if(step.type==="content")body=`${step.id?.startsWith("f1-block-")?`<div class="learning-block-intro"><span aria-hidden="true">🧭</span><strong>O que você vai aprender neste bloco</strong></div>`:""}${(step.body||[]).map(p=>`<p>${linkedText(p)}</p>`).join("")}${step.callouts?.length?`<div class="concept-grid">${step.callouts.map(x=>`<div><strong>${esc(x.title)}</strong><span>${esc(x.text)}</span></div>`).join("")}</div>`:""}${step.code?`<pre><code>${esc(step.code)}</code></pre>`:""}`;
 if(step.type==="visual-summary")body=`<div class="visual-idea">${esc(step.idea)}</div>${step.sections?.length?`<div class="learning-section-stack">${step.sections.map(section=>`<section class="learning-section ${/exemplo|veja/i.test(section.title)?"section-example":/dica|atenção|cuidado|importante|evite/i.test(section.title)?"section-tip":"section-concept"}"><div class="learning-section-head"><span aria-hidden="true">${/conceito|o que é|para que serve|termo/i.test(section.title)?"📘":/exemplo|veja|visual/i.test(section.title)?"👀":/dica|atenção|cuidado|importante/i.test(section.title)?"💡":"🧩"}</span><h3>${esc(section.title)}</h3></div><ul>${(section.items||[]).map(item=>`<li>${linkedText(item)}</li>`).join("")}</ul></section>`).join("")}</div>`:`<div class="visual-summary-grid">${(step.items||[]).map((x,i)=>`<div><span>${String(i+1).padStart(2,"0")}</span><strong>${esc(x)}</strong></div>`).join("")}</div>`}`;
 if(step.type==="match-cards")body=`<div class="match-card-grid">${step.pairs.map((x,i)=>`<button type="button" class="match-card" data-reveal-card="${i}"><span>${esc(x[0])}</span><strong>Toque para revelar</strong><em>${esc(x[1])}</em></button>`).join("")}</div>`;
 if(step.type==="command-deck")body=`<div class="command-deck">${step.commands.map((x,i)=>`<button type="button" class="command-card" data-reveal-card="${i}"><code>${esc(x[0])}</code><span>Para que serve?</span><strong>${esc(x[1])}</strong></button>`).join("")}</div>`;
 if(step.type==="choice-scenario")body=`<div class="scenario-stack">${step.scenarios.map((s,i)=>`<fieldset class="scenario-card"><legend>${esc(s[0])}</legend>${s[1].map((o,j)=>`<label><input type="radio" name="sc-${step.id}-${i}" value="${j}"> ${esc(o)}</label>`).join("")}<div class="feedback" data-scenario-feedback="${i}"></div></fieldset>`).join("")}</div>`;
 if(step.type==="quiz")body=`<fieldset class="quiz-options"><legend>${esc(step.question)}</legend>${step.options.map((o,i)=>`<label><input type="radio" name="q-${step.id}" value="${i}" ${String(saved)===String(i)?"checked":""}> <span>${esc(o)}</span></label>`).join("")}</fieldset><div class="feedback" data-feedback></div>`;
 if(step.type==="complete-code")body=`<div class="code-complete"><code>${esc(step.prefix)}</code><input data-code-answer placeholder="${esc(step.placeholder)}" value="${esc(saved||"")}"></div><div class="feedback" data-feedback></div>`;
 if(step.type==="editor")body=`<div class="lab-grid"><div><div class="lab-toolbar"><b>Laboratório HTML, CSS e JavaScript</b><button type="button" class="btn btn-secondary" data-run>Executar ▶</button></div><label class="lab-editor-label">HTML<textarea class="code-editor" data-editor spellcheck="false">${esc(typeof saved==="string"?saved:saved?.html??(step.prefillHtml===false?"":step.starter??""))}</textarea></label><label class="lab-editor-label">CSS<textarea class="code-editor" data-css-editor spellcheck="false">${esc(saved?.css??(step.prefillCss===false?"":step.starterCss??""))}</textarea></label><label class="lab-editor-label">JavaScript<textarea class="code-editor" data-js-editor spellcheck="false">${esc(saved?.js??(step.prefillJs===false?"":step.starterJs??""))}</textarea></label><div class="feedback" data-code-feedback role="status"></div><small data-attempt-count></small></div><div><div class="lab-toolbar"><b>Resultado</b></div><iframe class="preview-frame" data-preview sandbox="allow-scripts" referrerpolicy="no-referrer" title="Resultado do código"></iframe></div></div>`;
 if(step.type==="guided")body=`${step.goal?`<div class="guided-goal"><strong>🎯 Objetivo desta etapa</strong><p>${esc(step.goal)}</p></div>`:""}<div class="guided-action-heading"><span aria-hidden="true">🧑‍💻</span><strong>Agora faça no seu computador</strong></div><ol class="instruction-list">${(step.instructions||[]).map(x=>`<li>${guidedInstruction(x)}</li>`).join("")}</ol>${step.commands?.length?`<div class="guided-code-example"><strong>⌨️ Comandos para executar, na ordem</strong><div class="guided-command-stack">${step.commands.map(command=>renderCommand(command)).join("")}</div></div>`:""}${step.code?`<div class="guided-code-example"><strong>📄 Exemplo para copiar</strong><button type="button" class="learning-copy-btn" data-copy-code>Copiar exemplo</button><pre><code>${esc(step.code)}</code></pre></div>`:""}${step.tip?`<aside class="guided-tip"><strong>💡 Atenção</strong><p>${linkedText(step.tip)}</p></aside>`:""}${step.outcome?`<div class="guided-outcome"><strong>✅ Antes de avançar, confira</strong><p>${esc(step.outcome)}</p></div>`:""}`;
 if(step.type==="reflection")body=`<div class="reflection-fields">${step.prompts.map((p,i)=>`<label>${esc(p)}<textarea data-reflection="${i}" placeholder="Escreva sua resposta...">${esc(saved?.[i]||"")}</textarea></label>`).join("")}</div>`;
 if(step.type==="checkpoint")body=`<p class="checkpoint-question">${esc(step.question)}</p><div class="checkpoint-options">${step.options.map((o,i)=>`<label><input type="radio" name="cp-${step.id}" value="${i}" ${String(saved)===String(i)?"checked":""}> ${esc(o)}</label>`).join("")}</div>`;
 if(step.type==="sequence")body=`<p class="checkpoint-question">${esc(step.prompt)}</p><div class="sequence-list" data-sequence-list>${step.items.map((x,i)=>`<button type="button" class="sequence-item" data-sequence-item="${i}"><span>${i+1}</span><code>${esc(x)}</code></button>`).join("")}</div><p class="sequence-answer" data-sequence-answer></p><div class="feedback" data-feedback></div>`;
 if(step.type==="terminal-sim")body=`<p class="checkpoint-question">${esc(step.prompt)}</p><div class="terminal-sim"><span>${esc(step.prefix||"$ ")}</span><input data-terminal-answer autocomplete="off" spellcheck="false" placeholder="digite o comando..."></div><small class="terminal-hint">${esc(step.hint||"")}</small><div class="feedback" data-feedback></div>`;
 if(step.type==="evidence")body=`<div class="reflection-fields">${step.fields.map((p,i)=>`<label>${esc(p)}<textarea data-evidence="${i}" placeholder="Registre aqui...">${esc(saved?.[i]||"")}</textarea></label>`).join("")}</div>`;
 return `<article class="learning-step card ${done?"done":""}" data-step-card="${step.id}">${head}<div class="learning-body">${body}</div><div class="learning-actions"><span class="save-state">${done?(editable?"✓ Concluída • respostas podem ser revisadas":"✓ Etapa concluída"):"Seu progresso é salvo neste navegador"}</span><button type="button" class="btn ${done?"btn-secondary":"btn-primary"}" data-complete-step="${step.id}" ${done?"disabled":""}>${done?(editable?"Concluída • editável":"Concluído"):"Concluir etapa"}</button></div></article>`;
}
export function bindStep(step,missionId,onChange,complete=completeStep,options={}){
 const card=[...document.querySelectorAll(`[data-step-card="${step.id}"]`)].find(el=>el.closest("[data-fundamental-step]")?.dataset.fundamentalStep===step.id&&missionId.startsWith("F")||el.closest("[data-mission-step]")?.dataset.missionStep===step.id&&!missionId.startsWith("F"))||document.querySelector(`[data-step-card="${step.id}"]`);if(!card)return; const completed=options.completed===true;
 const store=options.previewStore;
 const saveAnswer=(unit,key,value)=>{if(store){store.answers.set(key,structuredClone(value));return}return persistAnswer(unit,key,value)};
 const getAnswer=(unit,key)=>store?store.answers.get(key):readAnswer(unit,key);
 const recordCodeAttempt=(unit,key,result)=>{if(store){const count=(store.attempts.get(key)||0)+1;store.attempts.set(key,count);return {count}}return persistCodeAttempt(unit,key,result)};
 const getCodeAttempts=(unit,key)=>store?{count:store.attempts.get(key)||0}:readCodeAttempts(unit,key);
 card.querySelectorAll("[data-copy-command]").forEach(button=>button.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(button.dataset.copyCommand);button.textContent="Copiado ✓"}catch{button.textContent="Selecione o comando e copie"} }));
 const codeCopy=card.querySelector("[data-copy-code]");if(codeCopy)codeCopy.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(step.code||"");codeCopy.textContent="Copiado ✓"}catch{codeCopy.textContent="Selecione o exemplo e copie"}});
 const finish=()=>{const ok=complete(missionId,step.id);if(!ok){throw new Error(`Não foi possível concluir a etapa ${step.id}.`)}onChange();requestAnimationFrame(()=>{const next=document.querySelector(`[data-step-card]:not(.done)`);next?.scrollIntoView({behavior:"smooth",block:"center"})})};
 if(step.type==="visual-summary"){card.querySelector("[data-complete-step]").onclick=finish;return}
 if(step.type==="match-cards"||step.type==="command-deck"){const reveal=[...card.querySelectorAll("[data-reveal-card]")];const visitedKey=step.id+":revealed";const prior=getAnswer(missionId,visitedKey);const visited=new Set(Array.isArray(prior)?prior.map(String):[]);const mark=b=>{visited.add(String(b.dataset.revealCard));b.classList.add("revealed");b.setAttribute("aria-pressed","true");saveAnswer(missionId,visitedKey,[...visited]);const state=card.querySelector(".save-state");if(state&&!completed)state.textContent=visited.size===reveal.length?"Todos os cartões explorados. Agora você pode concluir a etapa.":"Cartões explorados: "+visited.size+" de "+reveal.length+"."};reveal.forEach(b=>{if(visited.has(String(b.dataset.revealCard))){b.classList.add("revealed");b.setAttribute("aria-pressed","true")}else b.setAttribute("aria-pressed","false");b.onclick=()=>mark(b)});card.querySelector("[data-complete-step]").onclick=()=>{try{finish()}catch(error){console.error(error);const state=card.querySelector(".save-state");state.textContent="Não foi possível concluir a etapa. Atualize a página e tente novamente.";state.setAttribute("role","alert")}};return}

 if(step.type==="choice-scenario"){
  const choices=step.scenarios.map((scenario,i)=>[...card.querySelectorAll(`input[name="sc-${step.id}-${i}"]`)]);
  const previous=getAnswer(missionId,step.id);
  const selections=Array.isArray(previous)?previous.slice():[];
  choices.forEach((radios,i)=>radios.forEach(radio=>{
   if(String(selections[i])===radio.value)radio.checked=true;
   radio.addEventListener("change",()=>{selections[i]=Number(radio.value);saveAnswer(missionId,step.id,selections)});
  }));
  card.querySelector("[data-complete-step]").onclick=()=>{
   let all=true,correct=true;
   step.scenarios.forEach((scenario,i)=>{
    const checked=choices[i].find(r=>r.checked),fb=card.querySelector(`[data-scenario-feedback="${i}"]`);
    if(!checked){all=false;fb.textContent="Selecione uma alternativa para continuar.";fb.className="feedback error";return}
    const ok=Number(checked.value)===scenario[2];correct=correct&&ok;
    fb.textContent=ok?"✓ Resposta correta.":"Esta alternativa ainda não está correta. Revise e tente novamente.";
    fb.className=`feedback ${ok?"success":"error"}`;
   });
   if(!all||!correct){const state=card.querySelector(".save-state");state.textContent=!all?"Responda a todas as situações para concluir.":"Revise as alternativas destacadas e tente novamente.";state.setAttribute("role","status");return}
   try{finish()}catch(error){console.error(error);const state=card.querySelector(".save-state");state.textContent="Não foi possível registrar a conclusão. Tente novamente.";state.setAttribute("role","alert")}
  };return
 }

 if(step.type==="quiz"){const radios=[...card.querySelectorAll(`input[name="q-${step.id}"]`)];radios.forEach(r=>r.addEventListener("change",()=>saveAnswer(missionId,step.id,Number(r.value))));if(completed)return;card.querySelector("[data-complete-step]").onclick=()=>{const v=card.querySelector("input:checked")?.value,f=card.querySelector("[data-feedback]");if(v==null){f.textContent="Escolha uma alternativa.";return}saveAnswer(missionId,step.id,Number(v));if(Number(v)!==step.answer){f.textContent="Ainda não. "+step.feedback;f.className="feedback error";return}f.textContent="Correto! "+step.feedback;f.className="feedback success";setTimeout(finish,500)};return}
 if(step.type==="complete-code"){const input=card.querySelector("[data-code-answer]");input.addEventListener("input",()=>saveAnswer(missionId,step.id,input.value));if(completed)return;card.querySelector("[data-complete-step]").onclick=()=>{const input=card.querySelector("[data-code-answer]"),f=card.querySelector("[data-feedback]"),v=input.value.trim();saveAnswer(missionId,step.id,v);if(v!==step.expected){f.textContent="Revise o comando e tente novamente.";f.className="feedback error";return}f.textContent="Comando correto!";f.className="feedback success";setTimeout(finish,400)};return}
 if(step.type==="editor"){
 const ed=card.querySelector("[data-editor]"),css=card.querySelector("[data-css-editor]"),js=card.querySelector("[data-js-editor]"),preview=card.querySelector("[data-preview]"),feedback=card.querySelector("[data-code-feedback]"),counter=card.querySelector("[data-attempt-count]");
 const persist=()=>saveAnswer(missionId,step.id,{html:ed.value,css:css.value,js:js.value});
 const count=()=>{counter.textContent=getCodeAttempts(missionId,step.id).count+" verificações registradas"};
 const run=()=>{
  const doc=new DOMParser().parseFromString(ed.value,"text/html");
  const style=doc.createElement("style");style.textContent=css.value;doc.head.append(style);
  const script=doc.createElement("script");script.textContent=js.value;doc.body.append(script);
  preview.srcdoc=doc.documentElement.outerHTML;persist();feedback.textContent="Prévia atualizada."
 };
 card.querySelector("[data-run]").onclick=run;
 [ed,css,js].forEach(field=>field.addEventListener("input",persist));
 card.querySelector("[data-complete-step]").onclick=async()=>{
  const button=card.querySelector("[data-complete-step]");
  if(button.disabled)return;
  button.disabled=true;
  try{
   const checks=[["HTML",ed.value,step.requiredHtml,step.labModeHtml],["CSS",css.value,step.requiredCss,step.labModeCss],["JavaScript",js.value,step.requiredJs,step.labModeJs]];
   const missing=checks.flatMap(([lang,code,rules,mode])=>String(mode==="off"?"":rules||"").split("\n").map(x=>x.trim()).filter(Boolean).filter(x=>!code.includes(x)).map(x=>lang+": "+x));
   const behavior=parseBehaviorChecks(step.behaviorChecks);
   const outcomes=await evaluateCodeLab(preview,behavior);
   const failures=outcomes.filter(x=>!x.passed);
   recordCodeAttempt(missionId,step.id,{passed:!missing.length&&!failures.length,checks:outcomes,reason:[...missing,...failures.map(x=>x.label+" — "+x.reason)].join(" • ")});count();
   if(missing.length||failures.length){
    feedback.textContent="Revise: "+[...missing,...failures.map(x=>x.label+" — "+x.reason)].join(" • ");
    feedback.className="feedback error";return
   }
   persist();feedback.textContent="Todos os critérios atendidos!";feedback.className="feedback success";
   if(!completed)finish()
  }catch(error){console.error(error);feedback.textContent="Não foi possível verificar o resultado. Tente novamente.";feedback.className="feedback error"}
  finally{if(!completed)button.disabled=false}
 };
 count();run();return
}
 if(step.type==="reflection"){const fields=[...card.querySelectorAll("[data-reflection]")],button=card.querySelector("[data-complete-step]");const persist=()=>saveAnswer(missionId,step.id,fields.map(x=>x.value));fields.forEach(field=>field.addEventListener("input",persist));if(completed)return;button.addEventListener("click",event=>{event.preventDefault();const vals=fields.map(x=>x.value.trim());if(vals.some(v=>!v)){alert("Responda aos dois registros antes de concluir.");fields.find(x=>!x.value.trim())?.focus();return}saveAnswer(missionId,step.id,vals);try{finish()}catch(error){console.error(error);alert("Não foi possível concluir esta etapa. Atualize a página e tente novamente.")}});return}
 if(step.type==="sequence"){const buttons=[...card.querySelectorAll("[data-sequence-item]")],answer=card.querySelector("[data-sequence-answer]"),feedback=card.querySelector("[data-feedback]");let chosen=Array.isArray(getAnswer(missionId,step.id))?getAnswer(missionId,step.id):[];const draw=()=>{answer.innerHTML=chosen.length?"<b>Sua sequência:</b> "+chosen.map((x,i)=>(i+1)+". "+esc(x)).join(" → "):"Clique nos comandos na ordem correta.";buttons.forEach(b=>b.disabled=chosen.includes(step.items[Number(b.dataset.sequenceItem)]))};buttons.forEach(b=>b.onclick=()=>{chosen.push(step.items[Number(b.dataset.sequenceItem)]);saveAnswer(missionId,step.id,chosen);draw()});draw();card.querySelector("[data-complete-step]").onclick=()=>{if(chosen.length!==step.expected.length){feedback.textContent="Monte a sequência completa antes de conferir.";feedback.className="feedback error";return}if(JSON.stringify(chosen)!==JSON.stringify(step.expected)){feedback.textContent="A ordem ainda não está correta. "+step.feedback;feedback.className="feedback error";chosen=[];saveAnswer(missionId,step.id,chosen);draw();return}feedback.textContent="Sequência correta! "+step.feedback;feedback.className="feedback success";setTimeout(finish,500)};return}
 if(step.type==="terminal-sim"){const input=card.querySelector("[data-terminal-answer]"),feedback=card.querySelector("[data-feedback]"),saved=getAnswer(missionId,step.id);if(saved)input.value=saved;input.addEventListener("input",()=>saveAnswer(missionId,step.id,input.value));card.querySelector("[data-complete-step]").onclick=()=>{const value=input.value.trim().replace(/\s+/g," ");saveAnswer(missionId,step.id,value);if(value.toLowerCase()!==step.expected.toLowerCase()){feedback.textContent="Ainda não. "+step.hint;feedback.className="feedback error";return}feedback.textContent=step.success;feedback.className="feedback success";setTimeout(finish,500)};return}
 if(step.type==="evidence"){const fields=[...card.querySelectorAll("[data-evidence]")];fields.forEach(field=>field.addEventListener("input",()=>saveAnswer(missionId,step.id,fields.map(x=>x.value))));if(completed)return;card.querySelector("[data-complete-step]").onclick=()=>{const vals=[...card.querySelectorAll("[data-evidence]")].map(x=>x.value.trim());if(vals.some(v=>!v)){alert("Preencha os registros da evidência.");return}saveAnswer(missionId,step.id,vals);finish()};return}
 if(step.type==="checkpoint"){const options=[...card.querySelectorAll(`input[name="cp-${step.id}"]`)],button=card.querySelector("[data-complete-step]");options.forEach(option=>option.addEventListener("change",()=>saveAnswer(missionId,step.id,Number(option.value))));if(completed)return;button.addEventListener("click",event=>{event.preventDefault();const selected=options.find(option=>option.checked);if(!selected){alert("Selecione uma opção.");return}saveAnswer(missionId,step.id,Number(selected.value));if(Number.isInteger(step.answer)&&Number(selected.value)!==step.answer){let feedback=card.querySelector("[data-feedback]");if(!feedback){feedback=document.createElement("p");feedback.className="feedback";button.before(feedback)}feedback.textContent=step.feedback||"Ainda não. Revise o conteúdo e tente novamente.";feedback.className="feedback error";return}try{finish()}catch(error){console.error(error);alert("Não foi possível concluir este checkpoint. Atualize a página e tente novamente.")}});return}
 card.querySelector("[data-complete-step]")?.addEventListener("click",finish);
}
function label(type){return({content:"Trilha de Conhecimento",quiz:"Checkpoint",editor:"Laboratório",guided:"Desafio Guiado","complete-code":"Complete o Código",reflection:"Autoavaliação",checkpoint:"Checkpoint Final",sequence:"Organize o Fluxo","terminal-sim":"Terminal Simulado",evidence:"Evidência da Missão"}[type]||"Desafio")}