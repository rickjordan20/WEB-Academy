// Regras compartilhadas entre a experiencia do estudante e a simulacao do instrutor.
export function evaluateF3Choice(slide,selected,previous=null,at=new Date().toISOString()){
 if(!slide||!Number.isInteger(selected)||selected<0||selected>=slide.options.length)throw new Error("Alternativa invalida");
 if(previous?.correct===true)return previous;
 const correct=selected===slide.correct;
 const attempts=(Number(previous?.attempts)||0)+1;
 return {selected,correct,attempts,firstTryCorrect:previous?.firstTryCorrect??correct,history:[...(Array.isArray(previous?.history)?previous.history:[]),{selected,correct,at}].slice(-30),updatedAt:at};
}
export function f3Feedback(slide,record){
 if(!record)return "";
 return record.correct?"Correto! Você identificou corretamente o conceito.":"Revise e tente novamente. "+slide.explanation;
}
