// Regras puras de progressão, independentes de navegador e Supabase.
export function canCompleteSequentialStep(steps,completedSteps,stepId){
 if(!Array.isArray(steps)||!Array.isArray(completedSteps))return false;
 if(!steps.some(step=>step?.id===stepId))return false;
 if(completedSteps.includes(stepId))return true;
 const next=steps.find(step=>!completedSteps.includes(step.id));
 return next?.id===stepId;
}
export function allStepsCompleted(steps,completedSteps){
 return Array.isArray(steps)&&steps.length>0&&Array.isArray(completedSteps)&&steps.every(step=>completedSteps.includes(step.id));
}
