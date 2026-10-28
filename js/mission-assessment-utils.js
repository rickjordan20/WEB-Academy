// Estimativa pedagógica: XP sugerido, nunca concedido automaticamente.
export function missionMaxXp(mission){if(mission?.id==="R2")return (mission.steps||[]).reduce((sum,step)=>sum+Math.max(0,Number(step.xp)||0),0);return Number.isFinite(Number(mission?.maxXp))&&Number(mission.maxXp)>0?Math.round(Number(mission.maxXp)):150}
export function estimateMissionXp(mission,snapshot={}){
 const steps=mission?.steps||[];
 const recorded=Array.isArray(snapshot?.mission?.completedSteps)?[...new Set(snapshot.mission.completedSteps)]:[];
 const current=new Set(steps.map(s=>s.id));
 const matched=recorded.filter(id=>current.has(id));
 const historical=recorded.filter(id=>!current.has(id));
 const total=steps.length;
 const completed=matched.length;
 const percent=total?Math.round(completed/total*100):0;
 const max=missionMaxXp(mission);
 const weightedXp=mission?.id==="R2"?steps.filter(step=>matched.includes(step.id)).reduce((sum,step)=>sum+Math.max(0,Number(step.xp)||0),0):null;
 // Não atribuir XP às etapas antigas que não possuem definição/peso atual.
 // Exibir o conflito para revisão docente em vez de ocultá-lo como 0 XP.
 return {completed,total,percent,xp:weightedXp??(total?Math.round(max*completed/total):0),max,
  recorded:recorded.length,historicalSteps:historical,hasUnmappedProgress:historical.length>0,
  hasSnapshot:Number(snapshot?.version)>0};
}
