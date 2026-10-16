let activePane="practice",activeStep=null;
export function organizeMission(root,mission,done,fundDone){
 if(!fundDone||!mission?.steps?.length)return;
 const training=mission.type==="training";
 const practice=training?mission.steps.filter(s=>s.type!=="evidence"):mission.steps;
 const reports=training?mission.steps.filter(s=>s.type==="evidence"):[];
 const practiceDone=practice.every(s=>done.includes(s.id));
 const reportDone=reports.every(s=>done.includes(s.id));
 if(!practiceDone&&activePane==="report")activePane="practice";
 const list=root.querySelector(".learning-list");if(!list)return;
 const wrappers=mission.steps.map(step=>({step,node:list.querySelector('[data-step-card="'+step.id+'"]')?.closest("div[id]")||list.querySelector('[data-step-card="'+step.id+'"]')})).filter(x=>x.node);
 if(!wrappers.length)return;
 const pending=practice.find(s=>!done.includes(s.id));
 if(!practice.some(s=>s.id===activeStep&&(done.includes(s.id)||s.id===pending?.id)))activeStep=(pending||practice[0])?.id;
 const selected=practice.find(s=>s.id===activeStep);
 const index=practice.indexOf(selected);
 const current=training&&activePane==="report"?reports:[selected];
 wrappers.forEach(({step,node})=>{node.hidden=!current.some(s=>s?.id===step.id);node.style.display=node.hidden?"none":""});
 const flow=root.querySelector(".lesson-flow-grid");
 if(flow&&training){
  const links=flow.querySelectorAll(".lesson-stage");
  [1,2].forEach((n)=>{const original=links[n];if(!original)return;const button=document.createElement("button");button.type="button";button.className=original.className+" "+(activePane===(n===1?"practice":"report")?"mission-stage-active":"");button.innerHTML=original.innerHTML;button.disabled=n===1?!fundDone:!practiceDone;button.onclick=()=>{activePane=n===1?"practice":"report";organizeMission(root,mission,done,fundDone)};original.replaceWith(button)});
 }
 root.querySelector("#missionWizardHeading")?.remove();
 root.querySelector("#missionWizardNavigation")?.remove();
 const heading=document.createElement("section");heading.className="card mission-wizard-heading";heading.id="missionWizardHeading";
 const escape=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
 if(training&&activePane==="report"){
  heading.innerHTML='<p class="eyebrow">Etapa 3 de 3 • Relatório Individual</p><h2>Registre sua aprendizagem</h2><p>Preencha as respostas e revise as evidências antes de enviar ao instrutor.</p>';
 }else{
  const percent=Math.round(practice.filter(s=>done.includes(s.id)).length/Math.max(1,practice.length)*100);
  heading.innerHTML='<p class="eyebrow">'+(training?"Etapa 2 de 3 • Prática Guiada":"Missão da Guilda")+' • Desafio '+(index+1)+' de '+practice.length+'</p><div class="mission-wizard-progress"><span style="width:'+percent+'%"></span></div><h2>'+escape(selected?.title||"Desafio")+'</h2><p>Faça este desafio e conclua a etapa para avançar.</p><div class="mission-wizard-dots"></div>';
  const dots=heading.querySelector(".mission-wizard-dots");
  practice.forEach((step,i)=>{const b=document.createElement("button");b.type="button";b.textContent=done.includes(step.id)?"✓":String(i+1);b.setAttribute("aria-label","Desafio "+(i+1));b.disabled=!done.includes(step.id)&&step.id!==pending?.id;b.className=step.id===activeStep?"active":"";b.onclick=()=>{activeStep=step.id;organizeMission(root,mission,done,fundDone)};dots.append(b)});
 }
 list.before(heading);
 const nav=document.createElement("nav");nav.id="missionWizardNavigation";nav.className="mission-wizard-actions";nav.setAttribute("aria-label","Navegação da missão");
 if(activePane==="report"){const back=document.createElement("button");back.className="btn btn-secondary";back.textContent="← Voltar à prática";back.onclick=()=>{activePane="practice";organizeMission(root,mission,done,fundDone)};nav.append(back)}
 else{
  const prev=document.createElement("button");prev.className="btn btn-secondary";prev.textContent="← Anterior";prev.disabled=index<=0;prev.onclick=()=>{activeStep=practice[index-1].id;organizeMission(root,mission,done,fundDone)};nav.append(prev);
  const next=document.createElement("button");next.className="btn btn-primary";
  if(index===practice.length-1&&training){next.textContent="Abrir relatório →";next.disabled=!practiceDone;next.onclick=()=>{activePane="report";organizeMission(root,mission,done,fundDone)}}
  else{next.textContent="Próximo desafio →";next.disabled=!done.includes(selected?.id)||index===practice.length-1;next.onclick=()=>{activeStep=practice[index+1].id;organizeMission(root,mission,done,fundDone)}}
  nav.append(next);
 }
 list.after(nav);
 const completion=root.querySelector(".mission-complete");
 const submission=root.querySelector("#submissionPanel");
 if(training){
  if(completion)completion.hidden=activePane!=="report"||!reportDone;
  if(submission)submission.hidden=activePane!=="report"||!reportDone;
 }else if(completion)completion.hidden=!mission.steps.every(s=>done.includes(s.id));
}
