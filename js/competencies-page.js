import {getState,saveState} from "./storage.js";
import {COMPETENCIES} from "./../data/competencies.js";
let s=getState();if(!s?.student?.name)location.replace("index.html");
const root=document.querySelector("#competencyRoot");
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function ensure(){s.competencies||={};COMPETENCIES.forEach(c=>s.competencies[c.id]||=[]);s.pedagogy||={};s.pedagogy.selfNotes||={}}
function render(){
 ensure();
 root.innerHTML=`<div class="competency-grid">${COMPETENCIES.map(c=>{const ev=s.competencies[c.id]||[],note=s.pedagogy.selfNotes[c.id]||"";return `<article class="card competency-card"><div class="competency-head"><span>${c.id}</span><div><h2>${c.short}</h2><p>${c.text}</p></div></div><div class="evidence-counter"><strong>${ev.length}</strong><span>evidência(s) vinculada(s)</span></div><label>Meu registro de aprendizagem<textarea data-note="${c.id}" placeholder="O que já consigo fazer? Onde ainda preciso de apoio?">${esc(note)}</textarea></label><button type="button" class="btn btn-secondary" data-save="${c.id}">Salvar registro</button><p class="feedback" id="fb-${c.id}" aria-live="polite"></p></article>`}).join("")}</div><section class="card project-section"><p class="eyebrow">Importante</p><h2>Acompanhamento formativo</h2><p class="muted">Cada registro salvo nesta tela passa a compor as evidências reflexivas do respectivo indicador. A menção oficial continua sendo definida pelo instrutor a partir do conjunto de evidências e avaliações da UC.</p></section>`;
 root.querySelectorAll("[data-save]").forEach(b=>b.onclick=()=>{
   const id=b.dataset.save,field=root.querySelector(`[data-note="${id}"]`),value=field.value.trim();
   if(!value){const f=root.querySelector(`#fb-${id}`);f.textContent="Escreva seu registro antes de salvar.";f.className="feedback error";field.focus();return}
   const previous=s.pedagogy.selfNotes[id]||"";
   s.pedagogy.selfNotes[id]=value;
   const list=s.competencies[id]||[];
   const existing=list.find(e=>e.type==="self-reflection");
   if(existing){existing.text=value;existing.updatedAt=new Date().toISOString()}
   else list.push({id:`reflection-${id}`,type:"self-reflection",source:"competencies",text:value,createdAt:new Date().toISOString()});
   s.competencies[id]=list;
   saveState(s);
   render();
   const f=root.querySelector(`#fb-${id}`);f.textContent=previous?"✓ Registro atualizado e evidência mantida":"✓ Registro salvo como evidência";f.className="feedback success";
 });
}
render();