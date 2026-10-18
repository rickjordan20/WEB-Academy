/**
 * WEB Academy — núcleo de missões configuráveis (versão 1).
 * Sem dependências de DOM ou Supabase. Compatível com dados legados.
 * IDs são estáveis: nunca devem ser recriados ao editar uma missão publicada.
 */
export const BLOCK_TYPES=Object.freeze({
 content:{label:"Conteúdo",family:"content"},
 objective:{label:"Objetivo",family:"content"},
 material:{label:"Material de apoio",family:"content"},
 quiz:{label:"Perguntas",family:"answers"},
 boolean:{label:"Verdadeiro ou falso",family:"answers"},
 checklist:{label:"Checklist",family:"answers"},
 html:{label:"Editor HTML",family:"code"},
 css:{label:"Editor CSS",family:"code"},
 javascript:{label:"Editor JavaScript",family:"code"},
 guided:{label:"Prática guiada",family:"entries"},
 evidence:{label:"Evidências",family:"entries"},
 reflection:{label:"Autoavaliação",family:"answers"},
 report:{label:"Relatório individual",family:"answers"},
 delivery:{label:"Entrega",family:"delivery"}
});
export const MISSION_STAGES=Object.freeze(["fundamentals","guided","autonomous","asynchronous"]);
export const REVIEW_STATUS=Object.freeze(["draft","submitted","changes_requested","evaluated"]);
const filled=v=>typeof v==="string"?v.trim().length>0:Array.isArray(v)?v.length>0:v!==null&&v!==undefined&&v!==false;
const unique=values=>new Set(values).size===values.length;
export function validateMissionDefinition(def){
 const errors=[];
 if(!def||typeof def!=="object")return ["A missão deve ser um objeto."];
 if(!String(def.id||"").trim())errors.push("Identificador da missão obrigatório.");
 if(!String(def.title||"").trim())errors.push("Título da missão obrigatório.");
 if(!MISSION_STAGES.includes(def.stage))errors.push("Etapa pedagógica inválida.");
 if(!Array.isArray(def.blocks)||!def.blocks.length)errors.push("Inclua pelo menos um bloco.");
 else{
  if(!unique(def.blocks.map(b=>b.id)))errors.push("Os blocos precisam ter identificadores únicos.");
  for(const [i,b] of def.blocks.entries()){
   if(!String(b.id||"").trim())errors.push(`Bloco ${i+1}: identificador obrigatório.`);
   if(!BLOCK_TYPES[b.kind])errors.push(`Bloco ${i+1}: tipo desconhecido.`);
   if(!String(b.title||"").trim())errors.push(`Bloco ${i+1}: título obrigatório.`);
   if(b.xp!==undefined&&(!Number.isFinite(b.xp)||b.xp<0))errors.push(`Bloco ${i+1}: XP inválido.`);
   if(b.indicators!==undefined&&(!Array.isArray(b.indicators)||!b.indicators.every(x=>typeof x==="string")))errors.push(`Bloco ${i+1}: indicadores inválidos.`);
  }
 }
 return errors;
}
export function normalizeMissionDefinition(raw){
 const stage=raw.stage|| (raw.type==="training"?"guided":"autonomous");
 const blocks=(raw.blocks||raw.steps||[]).map((b,i)=>({
  ...b,id:String(b.id||`block-${i+1}`),kind:BLOCK_TYPES[b.kind]?b.kind:(b.type==="evidence"?"report":b.type==="code"?"html":"guided"),
  title:String(b.title||b.label||`Atividade ${i+1}`),required:b.required!==false,
  visible:b.visible!==false,xp:Number.isFinite(b.xp)?b.xp:0,indicators:b.indicators||b.indicator_codes||[]
 }));
 return {...raw,stage,blocks,version:Number.isInteger(raw.version)?raw.version:1};
}
export function blockCompletion(block,record={}){
 if(block.visible===false||block.required===false)return null;
 const family=BLOCK_TYPES[block.kind]?.family;
 if(family==="content")return !!record.acknowledged;
 if(family==="answers"){
  const required=(block.fields||[]).filter(f=>f.required);
  if(required.length)return required.every(f=>filled(record.answers?.[f.key]));
  return Object.values(record.answers||{}).some(filled)||!!record.completed;
 }
 if(family==="code")return !!record.completed&&filled(record.code);
 if(family==="entries")return (record.entries||[]).length>=Math.max(1,block.minItems||1)||!!record.completed;
 if(family==="delivery")return !!record.submitted;
 return false;
}
export function missionProgress(def,records={}){
 const blocks=(def.blocks||[]).filter(b=>b.visible!==false&&b.required!==false);
 const completed=blocks.filter(b=>blockCompletion(b,records[b.id])===true).length;
 return {completed,total:blocks.length,percent:blocks.length?Math.round(100*completed/blocks.length):0};
}
export function revisionBlocks(def,grades={}){
 const notes=grades.blocks||{},indicators=grades.blockIndicators||{};
 return (def.blocks||[]).filter(b=>b.visible!==false).map(b=>{
  const key=`${def.id}:${b.id}`;
  const concepts=indicators[key]||indicators[b.id]||{};
  const comment=notes[key]||notes[b.id]||"";
  const needsAttention=Object.values(concepts).some(v=>v==="PA"||v==="NA")||!!String(comment).trim();
  return {...b,review:{comment,concepts,needsAttention}};
 });
}
export function canEditMission(status,accessOpen=true){
 return !!accessOpen&&(status==="draft"||status==="changes_requested"||status==null);
}
