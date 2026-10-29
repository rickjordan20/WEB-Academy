import {mountVisualFrame} from "./visual-content.js";
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


const explanationHtml=value=>{
 const source=String(value??"");
 const hasHtml=/<\/?(?:p|strong|b|em|i|u|code|pre|h[2-6]|ul|ol|li|blockquote|a|br|div|span)\b/i.test(source);
 const input=hasHtml?source:esc(source).replace(new RegExp('&#96;([^&]+)&#96;','g'),'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
 const doc=new DOMParser().parseFromString('<div>'+input+'</div>','text/html');
 const allowed=new Set(['P','STRONG','B','EM','I','U','CODE','PRE','H2','H3','H4','H5','H6','UL','OL','LI','BLOCKQUOTE','A','BR','DIV','SPAN']);
 const clean=node=>{
  if(node.nodeType===3)return document.createTextNode(node.textContent);
  if(node.nodeType!==1)return document.createTextNode('');
  if(!allowed.has(node.tagName)){const fragment=document.createDocumentFragment();[...node.childNodes].forEach(child=>fragment.append(clean(child)));return fragment}
  const el=document.createElement(node.tagName.toLowerCase());
  if(node.tagName==='A'){const href=node.getAttribute('href')||'';try{const url=new URL(href,location.origin);if(['https:','http:'].includes(url.protocol)){el.href=url.href;el.target='_blank';el.rel='noopener noreferrer'}}catch{}}
  [...node.childNodes].forEach(child=>el.append(clean(child)));
  return el;
 };
 const output=document.createElement('div');
 [...doc.body.firstElementChild.childNodes].forEach(node=>output.append(clean(node)));
 colorizeInlineCode(output);
 return output.innerHTML;
};


const formatHtmlExample=value=>{
 const source=String(value??"").trim();
 if(!source)return "";
 const lines=source.replace(/>\s*</g,'>\n<').split('\n');
 let depth=0;
 return lines.map(raw=>{
  const line=raw.trim();if(!line)return "";
  const closing=/^<\//.test(line);
  if(closing)depth=Math.max(0,depth-1);
  const output='  '.repeat(depth)+line;
  const opens=(line.match(/<(?!\/|!|\?)[a-z][\w:-]*(?:\s[^<>]*?)?>/gi)||[]).filter(t=>!(/\/>$/.test(t)||/^<(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b/i.test(t))).length;
  const closes=(line.match(/<\/[a-z][\w:-]*\s*>/gi)||[]).length;
  depth=Math.max(0,depth+opens-closes+(closing?1:0));
  return output;
 }).join('\n');
};
const highlightHtml=value=>{
 const source=formatHtmlExample(value);
 const tokenizeTag=token=>{
  if(/^<!--/.test(token))return '<span class="syntax-comment">'+esc(token)+'</span>';
  if(/^<!/.test(token))return '<span class="syntax-punctuation">'+esc(token)+'</span>';
  const match=token.match(/^(<\/?)([a-z][\w:-]*)([\s\S]*?)(\/?>)$/i);
  if(!match)return esc(token);
  const attributes=match[3].replace(/([^\s=\/]+)(\s*=\s*)("[^"]*"|'[^']*'|[^\s"'=<>]+)/g,(_,name,eq,val)=>'<span class="syntax-attribute">'+esc(name)+'</span><span class="syntax-punctuation">'+esc(eq)+'</span><span class="syntax-string">'+esc(val)+'</span>');
  return '<span class="syntax-punctuation">'+esc(match[1])+'</span><span class="syntax-tag">'+esc(match[2])+'</span>'+attributes+'<span class="syntax-punctuation">'+esc(match[4])+'</span>';
 };
 return source.split(/(<!--[\s\S]*?-->|<![^>]*>|<\/?[a-z][^>]*>)/gi).map((part,i)=>i%2?tokenizeTag(part):esc(part)).join('');
};
const colorizeInlineCode=container=>{
 container.querySelectorAll('code:not(pre code)').forEach(code=>{
  const value=code.textContent;
  if(/<[/!]?[a-z]|<!DOCTYPE/i.test(value))code.innerHTML=highlightHtml(value).replace(/\n/g,' ');
  else if(/^(?:href|src|alt|id|class|lang)$/.test(value))code.classList.add('syntax-attribute');
 });
};
const explanationStyles='<style>.learning-explanation{display:grid;gap:14px;margin:16px 0 20px}.learning-explanation-paragraph{border-left:3px solid #609cde;background:rgba(92,145,214,.07);border-radius:9px;padding:16px 18px;line-height:1.8;overflow-wrap:anywhere}.learning-explanation-paragraph p{margin:0 0 10px}.learning-explanation-paragraph p:last-child{margin-bottom:0}.learning-explanation-paragraph h2,.learning-explanation-paragraph h3,.learning-explanation-paragraph h4{margin:0 0 10px;line-height:1.35}.learning-explanation-paragraph ul,.learning-explanation-paragraph ol{padding-left:22px;margin:8px 0}.learning-explanation-paragraph li{margin:6px 0}.learning-explanation-paragraph code{background:#1e1e1e;color:#d4d4d4;border-radius:4px;padding:2px 5px;white-space:normal;overflow-wrap:anywhere}.learning-explanation-paragraph pre code{display:block;white-space:pre-wrap;padding:12px}.learning-example-code{margin:16px 0;border:1px solid rgba(130,171,224,.25);border-radius:12px;overflow:hidden}.learning-example-code-title{padding:10px 15px;background:rgba(91,143,213,.14);font-weight:700;font-size:13px}.learning-example-code pre{margin:0!important;padding:16px;white-space:pre-wrap;overflow-wrap:anywhere}@media(max-width:600px){.learning-explanation-paragraph{padding:12px 14px}}</style>';
const syntaxStyles='<style>.learning-example-code{background:#1e1e1e!important;border-color:#294263!important;box-shadow:0 8px 20px rgba(0,0,0,.13)}.learning-example-code-title{color:#d4d4d4!important;background:#252526!important;border-bottom:1px solid #294263}.learning-example-code pre{color:#d4d4d4!important;overflow-x:auto;white-space:pre!important;tab-size:2;font:13px/1.75 ui-monospace,SFMono-Regular,Consolas,monospace}.learning-example-code code{font:inherit}.syntax-tag{color:#569cd6}.syntax-attribute{color:#9cdcfe}.syntax-string{color:#ce9178}.syntax-comment{color:#8596ad}.syntax-punctuation{color:#94a3b8}.learning-explanation-paragraph{background:rgba(75,123,190,.09);border-left-color:#75b2f7}.learning-explanation-paragraph strong{color:#d3e6ff}.learning-explanation-paragraph a{color:#8fc6ff;text-decoration:underline}.learning-explanation-paragraph blockquote{border-left:3px solid #8fc6ff;padding-left:12px;margin:10px 0;color:#cbd5e1}@media(max-width:600px){.learning-example-code pre{font-size:12px}}</style>';
const renderExplanation=step=>explanationStyles+syntaxStyles+'<div class="learning-explanation">'+(step.body||[]).map(p=>'<div class="learning-explanation-paragraph">'+explanationHtml(p)+'</div>').join('')+'</div>'+(step.callouts?.length?'<div class="concept-grid">'+step.callouts.map(x=>'<div><strong>'+esc(x.title)+'</strong><span>'+esc(x.text)+'</span></div>').join('')+'</div>':'')+(step.code?'<div class="learning-example-code"><div class="learning-example-code-title">Exemplo de código HTML</div><pre><code>'+highlightHtml(step.code)+'</code></pre></div>':'');
const explainCommand=c=>{c=String(c);if(c==="git status")return"Veja os arquivos alterados";if(c==="git init")return"Inicie o Git nesta pasta";if(c==="git add .")return"Prepare os arquivos para o commit";if(c.startsWith("git commit"))return"Registre uma versão no computador";if(c.startsWith("git push"))return"Envie as versões ao GitHub";if(c.startsWith("git remote add"))return"Conecte ao repositório do GitHub";if(c==="git remote -v")return"Confira o endereço conectado";if(c.startsWith("git branch"))return"Defina a branch principal";if(c.startsWith("git config"))return"Confira seu nome ou e-mail";if(c.startsWith("git log"))return"Veja o histórico";return"Execute no terminal"};
const renderCommand=command=>`<div class="learning-command"><div class="learning-command-details"><code>${esc(command)}</code><small>${esc(explainCommand(command))}</small></div><button type="button" class="learning-copy-btn" data-copy-command="${esc(command)}" aria-label="Copiar comando">Copiar</button></div>`;
const guidedInstruction=value=>{const raw=String(value??"");const match=raw.match(/^(?:Digite|Execute) (git (?:--version|init|status|add \.|commit -m "[^"]+"|log -1 --oneline|config --global (?:user\.name|user\.email)(?: "[^"]+")?|remote (?:add origin [^ ]+|-v)|branch -M main|push(?: -u origin main)?|pull))(?=[., ]|$)/i);if(!match)return linkedText(raw);return linkedText(raw)+renderCommand(match[1])};
export function renderStep(step,missionId,done,options={}){
 const saved=options.previewStore?options.previewStore.answers.get(step.id):options.preview===true?null:readAnswer(missionId,step.answerKey||step.id); const editable=options.editableCompleted===true;
 const head=`<div class="learning-step-head"><span class="step-type">${label(step.type)}</span><h2>${esc(step.title)}</h2><p>${esc(step.summary||"")}</p></div>`;
 let body="";
 if(step.type==="image-review"){const safeImage=typeof step.imageData==="string"&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(step.imageData)&&step.imageData.length<700000?step.imageData:"";body=`<figure class="learning-image-review" style="width:100%;max-width:100%;min-width:0;overflow:hidden;box-sizing:border-box">${(safeImage||(/^\/?assets\/[a-zA-Z0-9/_-]+\.svg$/.test(step.imageUrl||"")?step.imageUrl:""))?`<img src="${esc(safeImage||step.imageUrl)}" alt="${esc(step.imageCaption||step.title)}" loading="lazy" style="display:block;width:100%;max-width:100%;height:auto;object-fit:contain;box-sizing:border-box">`:`<p class="feedback error">Imagem de revisão não anexada. Avise o instrutor.</p>`}${step.imageCaption?`<figcaption>${esc(step.imageCaption)}</figcaption>`:""}</figure>`;}
 if(step.type==="visual-html")body=`<iframe class="learning-visual-frame" data-visual-content title="Conteúdo visual: ${esc(step.title)}" sandbox="" referrerpolicy="no-referrer"></iframe>`;
 if(step.type==="content")body=renderExplanation(step);
 if(step.type==="visual-summary")body=`<div class="visual-idea">${esc(step.idea)}</div>${step.sections?.length?`<div class="learning-section-stack">${step.sections.map(section=>`<section class="learning-section ${/exemplo|veja/i.test(section.title)?"section-example":/dica|atenção|cuidado|importante|evite/i.test(section.title)?"section-tip":"section-concept"}"><div class="learning-section-head"><span aria-hidden="true">${/conceito|o que é|para que serve|termo/i.test(section.title)?"📘":/exemplo|veja|visual/i.test(section.title)?"👀":/dica|atenção|cuidado|importante/i.test(section.title)?"💡":"🧩"}</span><h3>${esc(section.title)}</h3></div><ul>${(section.items||[]).map(item=>`<li>${linkedText(item)}</li>`).join("")}</ul></section>`).join("")}</div>`:`<div class="visual-summary-grid">${(step.items||[]).map((x,i)=>`<div><span>${String(i+1).padStart(2,"0")}</span><strong>${esc(x)}</strong></div>`).join("")}</div>`}`;
 if(step.type==="match-cards"||step.type==="flashcards")body=`<div class="match-card-grid">${step.pairs.map((x,i)=>`<button type="button" class="match-card" data-reveal-card="${i}"><span>${esc(x[0])}</span><strong>Toque para revelar</strong><em>${esc(x[1])}</em></button>`).join("")}</div>`;
 if(step.type==="command-deck")body=`<div class="command-deck">${step.commands.map((x,i)=>`<button type="button" class="command-card" data-reveal-card="${i}"><code>${esc(x[0])}</code><span>Para que serve?</span><strong>${esc(x[1])}</strong></button>`).join("")}</div>`;
 if(step.type==="choice-scenario")body=`<div class="scenario-stack">${step.scenarios.map((s,i)=>`<fieldset class="scenario-card"><legend>${esc(s[0])}</legend>${s[1].map((o,j)=>`<label><input type="radio" name="sc-${step.id}-${i}" value="${j}"> ${esc(o)}</label>`).join("")}<div class="feedback" data-scenario-feedback="${i}"></div></fieldset>`).join("")}</div>`;
 if(step.type==="quiz")body=`<fieldset class="quiz-options"><legend>${esc(step.question)}</legend>${step.options.map((o,i)=>`<label><input type="radio" name="q-${step.id}" value="${i}" ${String(saved)===String(i)?"checked":""}> <span>${esc(o)}</span></label>`).join("")}</fieldset><div class="feedback" data-feedback></div>`;
 if(step.type==="complete-code")body=`<div class="code-complete"><code>${esc(step.prefix)}</code><input data-code-answer placeholder="${esc(step.placeholder)}" value="${esc(saved||"")}"></div><div class="feedback" data-feedback></div>`;
 if(step.type==="editor")body=`<div class="lab-grid"><div><div class="lab-toolbar"><b>Laboratório HTML, CSS e JavaScript</b><button type="button" class="btn btn-secondary" data-run>Executar ▶</button></div><label class="lab-editor-label">HTML<textarea class="code-editor" data-editor spellcheck="false">${esc(typeof saved==="string"?saved:saved?.html??(step.prefillHtml===false?"":step.starter??""))}</textarea></label><label class="lab-editor-label">CSS<textarea class="code-editor" data-css-editor spellcheck="false">${esc(saved?.css??(step.prefillCss===false?"":step.starterCss??""))}</textarea></label><label class="lab-editor-label">JavaScript<textarea class="code-editor" data-js-editor spellcheck="false">${esc(saved?.js??(step.prefillJs===false?"":step.starterJs??""))}</textarea></label><div class="feedback" data-code-feedback role="status"></div><small data-attempt-count></small></div><div><div class="lab-toolbar"><b>Resultado</b></div><iframe class="preview-frame" data-preview sandbox="allow-scripts" referrerpolicy="no-referrer" title="Resultado do código"></iframe><aside class="lab-student-tip" aria-label="Dica para resolver" style="margin-top:14px;padding:16px;border:1px solid rgba(100,170,240,.3);border-radius:12px;background:rgba(60,120,180,.10);line-height:1.65"><strong style="display:block;margin-bottom:8px">💡 Dica para resolver</strong><p style="margin:0">${linkedText(step.studentHint||step.hint||step.tip||step.summary||"Leia o enunciado, organize o código em pequenas etapas e execute para conferir o resultado.")}</p></aside></div></div>`;
 if(step.type==="guided")body=`${step.goal?`<div class="guided-goal"><strong>🎯 Objetivo desta etapa</strong><p>${esc(step.goal)}</p></div>`:""}<div class="guided-action-heading"><span aria-hidden="true">🧑‍💻</span><strong>Agora faça no seu computador</strong></div><ol class="instruction-list">${(step.instructions||[]).map(x=>`<li>${guidedInstruction(x)}</li>`).join("")}</ol>${step.commands?.length?`<div class="guided-code-example"><strong>⌨️ Comandos para executar, na ordem</strong><div class="guided-command-stack">${step.commands.map(command=>renderCommand(command)).join("")}</div></div>`:""}${step.code?`<div class="guided-code-example"><strong>📄 Exemplo para copiar</strong><button type="button" class="learning-copy-btn" data-copy-code>Copiar exemplo</button><pre><code>${esc(step.code)}</code></pre></div>`:""}${step.tip?`<aside class="guided-tip"><strong>💡 Atenção</strong><p>${linkedText(step.tip)}</p></aside>`:""}${step.outcome?`<div class="guided-outcome"><strong>✅ Antes de avançar, confira</strong><p>${esc(step.outcome)}</p></div>`:""}`;
 if(step.type==="reflection")body=`<div class="reflection-fields">${step.prompts.map((p,i)=>`<label>${esc(p)}<textarea data-reflection="${i}" placeholder="Escreva sua resposta...">${esc(saved?.[i]||"")}</textarea></label>`).join("")}</div>`;
 if(step.type==="checkpoint")body=`<p class="checkpoint-question">${esc(step.question)}</p><div class="checkpoint-options">${step.options.map((o,i)=>`<label><input type="radio" name="cp-${step.id}" value="${i}" ${String(saved)===String(i)?"checked":""}> ${esc(o)}</label>`).join("")}</div>`;
 if(step.type==="sequence")body=`<p class="checkpoint-question">${esc(step.prompt)}</p><div class="sequence-list" data-sequence-list>${step.items.map((x,i)=>`<button type="button" class="sequence-item" data-sequence-item="${i}"><span>${i+1}</span><code>${esc(x)}</code></button>`).join("")}</div><p class="sequence-answer" data-sequence-answer></p><div class="feedback" data-feedback></div>`;
 if(step.type==="terminal-sim")body=`<p class="checkpoint-question">${esc(step.prompt)}</p><div class="terminal-sim"><span>${esc(step.prefix||"$ ")}</span><input data-terminal-answer autocomplete="off" spellcheck="false" placeholder="digite o comando..."></div><small class="terminal-hint">${esc(step.hint||"")}</small><div class="feedback" data-feedback></div>`;
 if(step.type==="evidence")body=`<div class="reflection-fields edutech-review-fields">${step.fields.map((p,i)=>{
  if(typeof p==="string")return `<label>${esc(p)}<textarea data-evidence="${i}" placeholder="Registre aqui...">${esc(saved?.[i]||"")}</textarea></label>`;
  const title=esc(p.label||"");const value=String(saved?.[i]??"");
  if(p.type==="cards")return `<fieldset class="review-choice-cards"><legend>${title}</legend><div class="review-card-grid">${(p.options||[]).map((o,j)=>`<label class="review-card-option"><input type="radio" data-evidence="${i}" name="review-${esc(step.id)}-${i}" value="${esc(o.value||o.label||o)}" ${value===(o.value||o.label||o)?"checked":""}><span class="review-card-content"><span class="review-card-emoji" aria-hidden="true">${esc(o.emoji||"✨")}</span><strong>${esc(o.label||o)}</strong></span></label>`).join("")}</div></fieldset>`;
  if(p.type==="scale")return `<fieldset class="review-scale"><legend>${title}</legend><div class="review-scale-labels"><span>${esc(p.minLabel||"Preciso de ajuda")}</span><span>${esc(p.maxLabel||"Tenho autonomia")}</span></div><input type="range" data-evidence="${i}" min="1" max="5" step="1" value="${/^[1-5]$/.test(value)?value:"3"}"><output data-scale-output="${i}">${/^[1-5]$/.test(value)?value:"3"} de 5</output></fieldset>`;
  if(p.type==="checklist")return `<fieldset class="review-checklist"><legend>${title}</legend><p class="review-hint">Marque todas as opções que representam sua experiência.</p>${(p.options||[]).map(o=>`<label><input type="checkbox" data-evidence="${i}" value="${esc(o)}" ${value.split(" | ").includes(o)?"checked":""}><span>${esc(o)}</span></label>`).join("")}</fieldset>`;
  if(p.type==="radio")return `<fieldset class="review-radio"><legend>${title}</legend>${(p.options||[]).map(o=>`<label><input type="radio" data-evidence="${i}" name="review-${esc(step.id)}-${i}" value="${esc(o)}" ${value===o?"checked":""}><span>${esc(o)}</span></label>`).join("")}</fieldset>`;
  if(p.type==="select")return `<label>${title}<select data-evidence="${i}"><option value="">Selecione uma opção</option>${(p.options||[]).map(o=>`<option value="${esc(o)}" ${value===o?"selected":""}>${esc(o)}</option>`).join("")}</select></label>`;
  if(p.type==="short"||p.type==="url")return `<label>${title}<input type="${p.type==="url"?"url":"text"}" maxlength="${p.type==="url"?"1000":"300"}" data-evidence="${i}" value="${esc(value)}" placeholder="${p.type==="url"?"https://...":"Responda em uma ou duas frases"}"></label>`;
  return `<label>${title}<textarea data-evidence="${i}" placeholder="Registre aqui...">${esc(value)}</textarea></label>`;
 }).join("")}</div>`;


 return `<article class="learning-step card ${done?"done":""}" data-step-card="${step.id}">${head}<div class="learning-body" style="min-width:0;max-width:100%;overflow-wrap:anywhere">${body}</div><div class="learning-actions"><span class="save-state">${done?(editable?"✓ Concluída • respostas podem ser revisadas":"✓ Etapa concluída"):"Seu progresso é salvo neste navegador"}</span><button type="button" class="btn ${done?"btn-secondary":"btn-primary"}" data-complete-step="${step.id}" ${done?"disabled":""}>${done?(editable?"Concluída • editável":"Concluído"):"Concluir etapa"}</button></div></article>`;
}
export function bindStep(step,missionId,onChange,complete=completeStep,options={}){
 const card=[...document.querySelectorAll(`[data-step-card="${step.id}"]`)].find(el=>el.closest("[data-fundamental-step]")?.dataset.fundamentalStep===step.id&&missionId.startsWith("F")||el.closest("[data-mission-step]")?.dataset.missionStep===step.id&&!missionId.startsWith("F"))||document.querySelector(`[data-step-card="${step.id}"]`);if(!card)return; const completed=options.completed===true;
 if(step.type==="visual-html"){const frame=card.querySelector("[data-visual-content]");if(frame)mountVisualFrame(frame,step.visualHtml||"",step.visualCss||"");card.querySelector("[data-complete-step]").onclick=()=>{const ok=complete(missionId,step.id);if(ok)onChange()};return}
 const store=options.previewStore;
 const saveAnswer=(unit,key,value)=>{if(store){store.answers.set(key,structuredClone(value));return}return persistAnswer(unit,key,value)};
 const getAnswer=(unit,key)=>store?store.answers.get(key):readAnswer(unit,key);
 const recordCodeAttempt=(unit,key,result)=>{if(store){const count=(store.attempts.get(key)||0)+1;store.attempts.set(key,count);return {count}}return persistCodeAttempt(unit,key,result)};
 const getCodeAttempts=(unit,key)=>store?{count:store.attempts.get(key)||0}:readCodeAttempts(unit,key);
 card.querySelectorAll("[data-copy-command]").forEach(button=>button.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(button.dataset.copyCommand);button.textContent="Copiado ✓"}catch{button.textContent="Selecione o comando e copie"} }));
 const codeCopy=card.querySelector("[data-copy-code]");if(codeCopy)codeCopy.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(step.code||"");codeCopy.textContent="Copiado ✓"}catch{codeCopy.textContent="Selecione o exemplo e copie"}});
 const finish=()=>{const ok=complete(missionId,step.id);if(!ok){throw new Error(`Não foi possível concluir a etapa ${step.id}.`)}onChange();requestAnimationFrame(()=>{const next=document.querySelector(`[data-step-card]:not(.done)`);next?.scrollIntoView({behavior:"smooth",block:"center"})})};
 if(step.type==="visual-summary"){card.querySelector("[data-complete-step]").onclick=finish;return}
 if(step.type==="match-cards"||step.type==="flashcards"||step.type==="command-deck"){const reveal=[...card.querySelectorAll("[data-reveal-card]")];const visitedKey=step.id+":revealed";const prior=getAnswer(missionId,visitedKey);const visited=new Set(Array.isArray(prior)?prior.map(String):[]);const mark=b=>{visited.add(String(b.dataset.revealCard));b.classList.add("revealed");b.setAttribute("aria-pressed","true");saveAnswer(missionId,visitedKey,[...visited]);const state=card.querySelector(".save-state");if(state&&!completed)state.textContent=visited.size===reveal.length?"Todos os cartões explorados. Agora você pode concluir a etapa.":"Cartões explorados: "+visited.size+" de "+reveal.length+"."};reveal.forEach(b=>{if(visited.has(String(b.dataset.revealCard))){b.classList.add("revealed");b.setAttribute("aria-pressed","true")}else b.setAttribute("aria-pressed","false");b.onclick=()=>mark(b)});card.querySelector("[data-complete-step]").onclick=()=>{try{finish()}catch(error){console.error(error);const state=card.querySelector(".save-state");state.textContent="Não foi possível concluir a etapa. Atualize a página e tente novamente.";state.setAttribute("role","alert")}};return}

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

 if(step.type==="quiz"){const radios=[...card.querySelectorAll(`input[name="q-${step.id}"]`)];radios.forEach(r=>r.addEventListener("change",()=>saveAnswer(missionId,step.id,Number(r.value))));if(completed)return;card.querySelector("[data-complete-step]").onclick=()=>{const v=radios.find(r=>r.checked)?.value,f=card.querySelector("[data-feedback]");if(v==null){f.textContent="Escolha uma alternativa antes de concluir.";f.className="feedback error";return}saveAnswer(missionId,step.id,Number(v));if(Number(v)!==step.answer){f.textContent="Ainda não. "+step.feedback;f.className="feedback error";return}f.textContent="Correto! "+step.feedback;f.className="feedback success";setTimeout(finish,500)};return}
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
   const hasRules=checks.some(([,code,rules,mode])=>mode!=="off"&&String(rules||"").trim())||behavior.length>0;
   if(!hasRules&&!String(ed.value||"").trim()&&!String(css.value||"").trim()&&!String(js.value||"").trim()){feedback.textContent="Escreva ou complete o código antes de concluir o laboratório.";feedback.className="feedback error";return}
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
 if(step.type==="sequence"){const buttons=[...card.querySelectorAll("[data-sequence-item]")],answer=card.querySelector("[data-sequence-answer]"),feedback=card.querySelector("[data-feedback]");let chosen=Array.isArray(getAnswer(missionId,step.id))?getAnswer(missionId,step.id):[];const draw=()=>{answer.innerHTML=chosen.length?"<b>Sua sequência (clique para remover um item):</b> "+chosen.map((x,i)=>'<button type="button" class="sequence-remove-item" data-remove-sequence="'+i+'" title="Remover item da sequência">'+(i+1)+". "+esc(x)+" ×</button>").join(" → "):"Clique nos comandos na ordem correta.";answer.querySelectorAll("[data-remove-sequence]").forEach(b=>b.onclick=()=>{chosen.splice(Number(b.dataset.removeSequence),1);saveAnswer(missionId,step.id,chosen);draw()});buttons.forEach(b=>b.disabled=chosen.includes(step.items[Number(b.dataset.sequenceItem)]))};buttons.forEach(b=>b.onclick=()=>{chosen.push(step.items[Number(b.dataset.sequenceItem)]);saveAnswer(missionId,step.id,chosen);draw()});draw();card.querySelector("[data-complete-step]").onclick=()=>{if(chosen.length!==step.expected.length){feedback.textContent="Monte a sequência completa antes de conferir.";feedback.className="feedback error";return}if(JSON.stringify(chosen)!==JSON.stringify(step.expected)){feedback.textContent="A ordem ainda não está correta. "+step.feedback+" Clique em um item da sua sequência para removê-lo e reorganizar.";feedback.className="feedback error";return}feedback.textContent="Sequência correta! "+step.feedback;feedback.className="feedback success";setTimeout(finish,500)};return}
 if(step.type==="terminal-sim"){const input=card.querySelector("[data-terminal-answer]"),feedback=card.querySelector("[data-feedback]"),saved=getAnswer(missionId,step.id);if(saved)input.value=saved;input.addEventListener("input",()=>saveAnswer(missionId,step.id,input.value));card.querySelector("[data-complete-step]").onclick=()=>{const value=input.value.trim().replace(/\s+/g," ");saveAnswer(missionId,step.id,value);if(value.toLowerCase()!==step.expected.toLowerCase()){feedback.textContent="Ainda não. "+step.hint;feedback.className="feedback error";return}feedback.textContent=step.success;feedback.className="feedback success";setTimeout(finish,500)};return}
 if(step.type==="evidence"){
  const fields=[...card.querySelectorAll("[data-evidence]")],answerKey=step.answerKey||step.id;
  const values=()=>step.fields.map((p,i)=>{const group=fields.filter(el=>Number(el.dataset.evidence)===i);if(p?.type==="checklist")return group.filter(el=>el.checked).map(el=>el.value).join(" | ");if(p?.type==="cards"||p?.type==="radio")return group.find(el=>el.checked)?.value||"";return group[0]?.value?.trim()||""});
  fields.forEach(field=>{const persist=()=>{if(field.type==="range"){const output=card.querySelector('[data-scale-output="'+field.dataset.evidence+'"]');if(output)output.textContent=field.value+" de 5"}saveAnswer(missionId,answerKey,values())};field.addEventListener("input",persist);field.addEventListener("change",persist)});
  if(completed)return;
  card.querySelector("[data-complete-step]").onclick=()=>{const vals=values();if(vals.some(v=>!v)){alert("Responda às perguntas e registre sua evidência antes de concluir.");return}saveAnswer(missionId,answerKey,vals);finish()};return}
 if(step.type==="checkpoint"){const options=[...card.querySelectorAll(`input[name="cp-${step.id}"]`)],button=card.querySelector("[data-complete-step]");const previous=getAnswer(missionId,step.id);options.forEach(option=>{if(previous!==undefined&&String(previous)===option.value)option.checked=true;option.addEventListener("change",()=>saveAnswer(missionId,step.id,Number(option.value)))});if(completed)return;button.addEventListener("click",event=>{event.preventDefault();const selected=options.find(option=>option.checked);if(!selected){let feedback=card.querySelector("[data-feedback]");if(!feedback){feedback=document.createElement("p");feedback.className="feedback";button.before(feedback)}feedback.textContent="Selecione uma alternativa antes de concluir.";feedback.className="feedback error";options[0]?.focus();return}saveAnswer(missionId,step.id,Number(selected.value));if(Number.isInteger(step.answer)&&Number(selected.value)!==step.answer){let feedback=card.querySelector("[data-feedback]");if(!feedback){feedback=document.createElement("p");feedback.className="feedback";button.before(feedback)}feedback.textContent="Ainda não. "+(step.feedback||"Revise o conteúdo e tente novamente.");feedback.className="feedback error";return}let feedback=card.querySelector("[data-feedback]");if(!feedback){feedback=document.createElement("p");feedback.className="feedback";button.before(feedback)}feedback.textContent="Correto! "+(step.feedback||"Você selecionou a alternativa correta.");feedback.className="feedback success";try{finish()}catch(error){console.error(error);alert("Não foi possível concluir este checkpoint. Atualize a página e tente novamente.")}});return}
 card.querySelector("[data-complete-step]")?.addEventListener("click",event=>{event.preventDefault();try{finish()}catch(error){console.error("Falha ao concluir etapa",missionId,step.id,error);let feedback=card.querySelector("[data-feedback]");if(!feedback){feedback=document.createElement("p");feedback.className="feedback";card.querySelector("[data-complete-step]").before(feedback)}feedback.textContent="Não foi possível concluir esta etapa. Confira se as anteriores estão concluídas e tente novamente. Se persistir, reporte pelo botão Problema?.";feedback.className="feedback error";feedback.setAttribute("role","alert")}});
}
function label(type){return({content:"Trilha de Conhecimento","image-review":"Revisão visual","visual-html":"Conteúdo visual",quiz:"Checkpoint",editor:"Laboratório",guided:"Desafio Guiado","complete-code":"Complete o Código",reflection:"Autoavaliação",checkpoint:"Checkpoint Final",sequence:"Organize o Fluxo","terminal-sim":"Terminal Simulado",evidence:"Evidência da Missão",flashcards:"Flashcards", "match-cards":"Cartões de associação"}[type]||"Desafio")}