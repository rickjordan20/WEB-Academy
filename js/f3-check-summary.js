// Pure helpers for F3 checks; no student data is modified here.
export function summarizeF3Checks(answers={},slides=[]){
 const rows=slides.map(slide=>{
  const record=answers[`F3:${slide.id}`]||{};
  const attempts=Number(record.attempts)||0;
  return {id:slide.id,title:slide.title,answered:attempts>0,correct:record.correct===true,firstTryCorrect:record.firstTryCorrect===true,attempts,selected:record.selected??null,updatedAt:record.updatedAt??null};
 });
 return {total:rows.length,answered:rows.filter(x=>x.answered).length,correct:rows.filter(x=>x.correct).length,firstTryCorrect:rows.filter(x=>x.firstTryCorrect).length,needsReview:rows.filter(x=>x.answered&&!x.correct).map(x=>x.id),rows};
}
export function nextF3Index(answers={},slides=[]){
 const i=slides.findIndex(slide=>answers[`F3:${slide.id}`]?.correct!==true);
 return i<0?Math.max(0,slides.length-1):i;
}
