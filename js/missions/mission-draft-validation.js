// Validação compartilhável e testável do roteiro antes de salvar ou publicar.
export function validateMissionDraft(value,{requireActivities=false}={}){
 if(!String(value?.title??"").trim())throw Error("Informe o título da missão.");
 for(const [name,steps] of [["Prática Guiada / Missão",value.steps],["Fundamentos",value.fundamental?.steps]]){
  if(steps===undefined||steps===null)continue;
  if(!Array.isArray(steps))throw Error(name+": formato das atividades inválido.");
  if(requireActivities&&!steps.length)throw Error(name+": nenhuma atividade cadastrada. Adicione uma atividade antes de publicar.");
  const ids=new Set();
  for(const [index,step] of steps.entries()){
   const position=index+1;
   if(!step||typeof step!=="object")throw Error(name+": atividade "+position+" está inválida.");
   if(!String(step.title??"").trim())throw Error(name+": atividade "+position+" está sem título.");
   if(!String(step.type??"").trim())throw Error(name+": atividade "+position+" ("+String(step.title||"sem título")+") está sem tipo.");
   if(!String(step.id??"").trim())throw Error(name+": atividade "+position+" ("+step.title+") está sem identificador.");
   const id=String(step.id).trim();
   if(ids.has(id))throw Error(name+": identificador repetido na atividade "+position+" ("+step.title+").");
   ids.add(id);
   if(step.xp!==undefined&&(!Number.isInteger(step.xp)||step.xp<0||step.xp>10000))throw Error(name+": XP inválido em "+step.title);
   if(step.indicators!==undefined&&(!Array.isArray(step.indicators)||step.indicators.some(code=>typeof code!=="string"||!code.trim())))throw Error(name+": indicadores inválidos em "+step.title);
  }
 }
 if(requireActivities&&value.fundamental&&!Array.isArray(value.fundamental.steps))throw Error("Fundamentos: nenhuma atividade cadastrada.");
 if(requireActivities&&!Array.isArray(value.steps))throw Error("Prática Guiada / Missão: nenhuma atividade cadastrada.");
 return true;
}
