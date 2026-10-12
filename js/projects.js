import { getState,saveState } from "./storage.js";
export const TASK_STATUS={TODO:"todo",DOING:"doing",REVIEW:"review",DONE:"done"};
export const STATUS_LABEL={todo:"A FAZER",doing:"EM MISSÃO",review:"EM REVISÃO",done:"CONCLUÍDO"};
const now=()=>new Date().toISOString();
export function ensureProjects(s=getState()){
 if(!s)return null;
 s.edutech||={};s.edutech.progress??=0;s.edutech.repository||="";s.edutech.evidence||=[];s.edutech.history||=[];
 s.guild||={};s.guild.id??=null;s.guild.name||="";s.guild.members||=[];s.guild.repository||="";s.guild.tasks||=[];s.guild.evidence||=[];s.guild.history||=[];s.guild.progress??=0;
 if(!s.guild.tasks.length)s.guild.tasks=[
  {id:"g1",title:"Organizar ambiente do Projeto Restaurante",description:"Preparar estrutura inicial e fluxo de trabalho da Guilda.",phase:1,status:"todo",responsible:"",competencies:["I1","I6"],evidence:"",history:[]},
  {id:"g2",title:"Criar repositório da Guilda",description:"Registrar o repositório e identificar as contribuições individuais.",phase:1,status:"todo",responsible:"",competencies:["I6"],evidence:"",history:[]}
 ];
 return s;
}
export function saveProjectSettings(kind,data){
 const s=ensureProjects();if(!s)return null;
 if(kind==="edutech"){s.edutech.repository=data.repository?.trim()||"";s.edutech.history.push({action:"Configurações do EduTech atualizadas",at:now()})}
 if(kind==="guild"){s.guild.name=data.name?.trim()||"";s.guild.repository=data.repository?.trim()||"";s.guild.members=(data.members||[]).filter(Boolean);s.guild.history.push({action:"Dados da Guilda atualizados",at:now()})}
 saveState(s);return s;
}
export function addEvidence(kind,evidence){
 const s=ensureProjects();if(!s)return null;const item={id:crypto.randomUUID?.()||String(Date.now()),title:evidence.title.trim(),link:evidence.link.trim(),note:evidence.note.trim(),phase:Number(evidence.phase)||1,at:now()};
 s[kind].evidence.push(item);s[kind].history.push({action:`Evidência registrada: ${item.title}`,at:item.at});saveState(s);return s;
}
export function updateTask(id,patch){
 const s=ensureProjects(),t=s.guild.tasks.find(x=>x.id===id);if(!t)return null;const before=t.status;Object.assign(t,patch);
 if(before!==t.status)t.history.push({from:before,to:t.status,at:now(),responsible:t.responsible||""});
 s.guild.progress=Math.round((s.guild.tasks.filter(x=>x.status==="done").length/s.guild.tasks.length)*100);saveState(s);return s;
}
export function addTask(data){
 const s=ensureProjects();const task={id:crypto.randomUUID?.()||String(Date.now()),title:data.title.trim(),description:data.description.trim(),phase:Number(data.phase)||1,status:"todo",responsible:data.responsible.trim(),competencies:data.competencies||[],evidence:"",history:[{from:null,to:"todo",at:now(),responsible:data.responsible.trim()}]};s.guild.tasks.push(task);saveState(s);return s;
}
export function projectProgress(kind,s=ensureProjects()){
 if(kind==="guild")return s.guild.progress||0;
 const completed=s.journey?.completedMissions||[];const done=completed.filter(id=>id.endsWith("A")).length;return Math.round(done/14*100);
}