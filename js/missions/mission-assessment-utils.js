// Estimativa pedagógica de XP: progresso registrado, não avaliação de qualidade.
export function missionMaxXp(mission){return Number.isFinite(Number(mission?.maxXp))&&Number(mission?.maxXp)>0?Math.round(Number(mission.maxXp)):150}
export function estimateMissionXp(mission,snapshot={}){
 const steps=mission?.steps||[];
 const recorded=Array.isArray(snapshot?.mission?.completedSteps)?snapshot.mission.completedSteps:[];
 const completed=steps.filter(s=>recorded.includes(s.id)).length;
 const total=steps.length;
 const percent=total?Math.round(completed/total*100):0;
 const max=missionMaxXp(mission);
 return {completed,total,percent,xp:total?Math.round(max*completed/total):0,max,hasSnapshot:Number(snapshot?.version)>0};
}
