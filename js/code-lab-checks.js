// Testes declarativos executados dentro do iframe isolado do laboratório.
export function parseBehaviorChecks(source){
 return String(source||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map((line,index)=>{
  const parts=line.split("|").map(x=>x.trim()),[selector,kind,...args]=parts;
  if(!selector||!["existe","texto","css","clique-texto"].includes(kind)||((kind==="texto"||kind==="clique-texto")&&!args[0])||(kind==="css"&&(!args[0]||!args[1])))return {index,label:line,invalid:true};
  return {index,label:line,selector,kind,args}
 })
}
export function evaluateCodeLab(frame,checks,timeout=2500){
 if(!checks.length)return Promise.resolve([]);
 const token="lab-"+Math.random().toString(36).slice(2);
 const harness=`<script>(function(){
 const checks=${JSON.stringify(checks).replace(/</g,"\\u003c")};
 const result=[];
 setTimeout(function(){
 for(const check of checks){
  if(check.invalid){result.push({label:check.label,passed:false,reason:"Regra de teste inválida"});continue}
  try{
   const el=document.querySelector(check.selector);
   let passed=false;
   if(check.kind==="existe")passed=!!el;
   else if(el&&check.kind==="texto")passed=(el.textContent||"").includes(check.args[0]);
   else if(el&&check.kind==="css")passed=getComputedStyle(el).getPropertyValue(check.args[0]).trim().toLowerCase()===check.args[1].trim().toLowerCase();
   else if(el&&check.kind==="clique-texto"){el.click();passed=(el.textContent||"").includes(check.args[0])}
   result.push({label:check.label,passed,reason:passed?"Atendido":el?"Resultado diferente do esperado":"Elemento não encontrado"});
  }catch(error){result.push({label:check.label,passed:false,reason:"Teste não pôde ser executado"})}
 }
 parent.postMessage({kind:"webacademy-lab-check",token:${JSON.stringify(token)},results:result},"*");
 },120);
})();<\\/script>`;
 return new Promise(resolve=>{
  let settled=false;
  const finish=results=>{if(settled)return;settled=true;clearTimeout(timer);window.removeEventListener("message",onMessage);resolve(results)};
  const onMessage=event=>{if(event.source!==frame.contentWindow||event.data?.kind!=="webacademy-lab-check"||event.data?.token!==token)return;finish(event.data.results)};
  const timer=setTimeout(()=>finish(checks.map(c=>({label:c.label,passed:false,reason:"Tempo esgotado"}))),timeout);
  window.addEventListener("message",onMessage);
  const html=frame.srcdoc||"";
  frame.srcdoc=html.replace(/<\/body>/i,harness+"</body>");
 })
}
