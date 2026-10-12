import {getState} from "./storage.js";
import {ensureProjects,projectProgress} from "./projects.js";
import {COMPETENCIES} from "./../data/competencies.js";
const raw=getState();if(!raw?.student?.name)location.replace("index.html");
const s=ensureProjects(raw),root=document.querySelector("#progressRoot");
const completed=s.journey?.completedMissions||[],extras=s.extraMissions?.completed||[];
const edu=projectProgress("edutech",s),guild=s.guild?.progress||0;
const projectEvidence=[...(s.edutech?.evidence||[]),...(s.guild?.evidence||[])];
const legacyEvidence=Array.isArray(s.evidence)?s.evidence:[];
const uniqueEvidence=[...projectEvidence,...legacyEvidence].filter((e,i,a)=>a.findIndex(x=>(x.id&&e.id&&x.id===e.id)||(!x.id&&!e.id&&x.title===e.title&&x.at===e.at))===i);
const competencyCount=id=>{
 const direct=Array.isArray(s.competencies?.[id])?s.competencies[id].length:0;
 const linked=uniqueEvidence.filter(e=>Array.isArray(e.competencies)&&e.competencies.includes(id)).length;
 const tasks=(s.guild?.tasks||[]).filter(t=>t.status==="done"&&Array.isArray(t.competencies)&&t.competencies.includes(id)&&(t.evidence||"").trim()).length;
 return direct+linked+tasks;
};
root.innerHTML=`<section class="progress-overview">
<article class="card progress-metric"><span class="progress-metric-icon">🗺️</span><div><small>Jornada</small><strong>${s.journey?.progress||0}%</strong><p>${completed.length} missões concluídas</p></div></article>
<article class="card progress-metric"><span class="progress-metric-icon">🎓</span><div><small>EduTech</small><strong>${edu}%</strong><p>Projeto individual</p></div></article>
<article class="card progress-metric"><span class="progress-metric-icon">⚔️</span><div><small>Guilda</small><strong>${guild}%</strong><p>Projeto Restaurante</p></div></article>
<article class="card progress-metric"><span class="progress-metric-icon">📎</span><div><small>Evidências registradas</small><strong>${uniqueEvidence.length}</strong><p>EduTech, Guilda e Jornada</p></div></article>
</section>
<section class="card project-section"><p class="eyebrow">Competências da Jornada</p><h2>Mapa de evidências</h2><p class="muted">Os números abaixo mostram evidências explicitamente vinculadas a cada indicador. Não representam menção automática.</p><div class="competency-mini-grid">${COMPETENCIES.map(c=>`<a href="competencies.html" class="competency-mini"><b>${c.id}</b><span>${c.short}</span><strong>${competencyCount(c.id)} evidência(s)</strong></a>`).join("")}</div></section>
<section class="card project-section"><p class="eyebrow">Continuidade</p><h2>Próximas ações</h2><div class="next-actions"><a class="btn btn-primary" href="journey.html">Continuar Jornada</a><a class="btn btn-secondary" href="edutech.html">Revisar EduTech</a><a class="btn btn-secondary" href="guild.html">Revisar Guilda</a></div><p class="muted">Missões Extras: ${extras.length} / 7 concluídas. Elas serão ativadas na etapa de conteúdo da plataforma.</p></section>`;