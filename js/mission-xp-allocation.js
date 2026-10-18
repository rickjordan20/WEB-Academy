/**
 * Distribuição determinística do orçamento de XP por blocos.
 * Apenas blocos obrigatórios e visíveis participam; os demais recebem zero.
 * A distribuição não concede XP ao estudante.
 */
export function distributeMissionXp(definition,totalXp){
 if(!Number.isSafeInteger(totalXp)||totalXp<0||totalXp>100000)throw Error("Informe um total de XP inteiro entre 0 e 100.000.");
 const groups=[...(definition.fundamental?.steps?[definition.fundamental.steps]:[]),definition.steps||[]];
 const eligible=groups.flatMap(steps=>steps.filter(step=>step.visible!==false&&step.required!==false));
 if(!eligible.length)throw Error("A missão precisa ter ao menos um bloco obrigatório e visível.");
 const base=Math.floor(totalXp/eligible.length),remainder=totalXp%eligible.length;
 let index=0;
 const updated=groups.map(steps=>steps.map(step=>{
  const active=step.visible!==false&&step.required!==false;
  return {...step,xp:active?base+(index++<remainder?1:0):0};
 }));
 const result={...definition,steps:updated[updated.length-1]};
 if(definition.fundamental?.steps)result.fundamental={...definition.fundamental,steps:updated[0]};
 return {mission:result,totalXp,eligibleCount:eligible.length};
}
/**
 * XP é creditável somente depois da publicação da avaliação e da confirmação
 * explícita do instrutor de que o bloco foi concluído (check).
 * A chamada é pura: não grava saldo nem produz premiação.
 */
export function calculatePublishedXp(definition,review){
 if(review?.status!=="evaluated"||review?.published!==true)return {xp:0,pending:true,blocks:[]};
 const blocks=[...(definition.fundamental?.steps||[]),...(definition.steps||[])];
 const checks=review.blockChecks||{};
 const result=blocks.map(step=>{
  const approved=step.visible!==false&&step.required!==false&&checks[step.id]===true;
  return {id:step.id,xp:approved?Math.max(0,Math.floor(Number(step.xp)||0)):0,approved};
 });
 return {xp:result.reduce((sum,block)=>sum+block.xp,0),pending:false,blocks:result};
}
