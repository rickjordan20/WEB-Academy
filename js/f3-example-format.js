// Formatacao didatica compartilhada: apenas HTML escapado e spans controlados.
const escapeHTML=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
const notes=[
 "A região main contém o assunto central da página.",
 "main indica o conteúdo principal; h1 apresenta o título.",
 "div apenas agrupa; main identifica a função do conteúdo.",
 "header identifica o cabeçalho; h1 apresenta o nome da plataforma.",
 "nav reúne os links; href indica o destino do link.",
 "O título e o conteúdo principal ficam dentro de main.",
 "section organiza um assunto; h2 nomeia essa seção.",
 "article representa um conteúdo independente; p contém a descrição.",
 "footer apresenta as informações finais da página.",
 "h1 é o título principal; h2 é seção; h3 é subseção.",
 "ul abre uma lista sem ordem; cada li representa um item.",
 "section reúne título, parágrafo e lista do mesmo assunto.",
 "src aponta para o arquivo; alt descreve a imagem.",
 "alt descreve a informação relevante da imagem.",
 "href aponta para a página de destino; o texto é clicável.",
 "pages guarda as páginas; assets/images guarda imagens.",
 "../ volta uma pasta para encontrar index.html.",
 "Este comentário documenta a seção e não aparece na página.",
 "main contém o conteúdo principal; section organiza o tópico HTML.",
 "Confira a hierarquia e os caminhos antes de avançar.",
 "Preserve a estrutura e preencha main com o conteúdo da EduTech."
];
export function f3ExampleNote(slide){
 const number=Number(String(slide?.id??"").match(/(\d+)$/)?.[1]);
 return notes[number-1]||"Observe a função de cada elemento e como eles se relacionam.";
}
export function formatF3Example(source){
 const input=String(source??"").trim();
 // Estrutura de pastas: preservar linhas, sem simular tags HTML.
 if(!input.includes("<"))return escapeHTML(input);
 const tokens=input.match(/<!--[\s\S]*?-->|<[^>]*>|[^<]+/g)||[];
 let depth=0;
 const rows=[];
 for(const token of tokens){
  if(/^<\//.test(token))depth=Math.max(0,depth-1);
  const isComment=token.startsWith("<!--");
  const isTag=token.startsWith("<")&&!isComment;
  const rendered=isComment?'<span class="f3-syntax-comment">'+escapeHTML(token)+'</span>':isTag?highlightTag(token):escapeHTML(token);
  if(token.trim())rows.push("  ".repeat(depth)+rendered);
  if(/^<(?!\/|!)[^>]+>$/.test(token)&&!/^<(?:img|br|hr|input|meta|link)\b/i.test(token)&&!token.endsWith("/>"))depth++;
 }
 return rows.join("\n");
}
function highlightTag(token){
 const match=token.match(/^(<\/?)([\w-]+)([\s\S]*?)(\/?>)$/);
 if(!match)return escapeHTML(token);
 const attrs=match[3].replace(/([\w-]+)(\s*=\s*)("[^"]*"|'[^']*')/g,(_all,name,eq,value)=>'@@ATTR@@'+name+'@@EQ@@'+eq+'@@VALUE@@'+value+'@@END@@');
 let safe=escapeHTML(attrs).replace(/@@ATTR@@([\w-]+)@@EQ@@([\s\S]*?)@@VALUE@@([\s\S]*?)@@END@@/g,(_all,name,eq,value)=>'<span class="f3-syntax-attr">'+name+'</span>'+eq+'<span class="f3-syntax-value">'+value+'</span>');
 return '<span class="f3-syntax-punct">'+escapeHTML(match[1])+'</span><span class="f3-syntax-tag">'+escapeHTML(match[2])+'</span>'+safe+'<span class="f3-syntax-punct">'+escapeHTML(match[4])+'</span>';
}
