const DATA=[
[1,"Preparando o Ambiente","IDE, organização do projeto, Git e GitHub.","Entenda o fluxo profissional antes de abrir o projeto no VS Code."],
[2,"Construindo a Web","HTML, estrutura do documento, elementos e atributos.","Compreenda como o navegador interpreta a estrutura de uma página."],
[3,"Dando Significado às Páginas","HTML semântico, seções, navegação e acessibilidade.","Aprenda a escolher elementos pelo significado e não apenas pela aparência."],
[4,"Coletando Informações","Formulários, labels, tipos de entrada e coleta de dados.","Entenda como páginas recebem informações do usuário."],
[5,"Criando uma Identidade","Seletores, propriedades, cascata, cores e tipografia.","Compreenda como o CSS transforma estrutura em interface."],
[6,"Adaptando Interfaces","Box model, Flexbox, Grid, media queries e responsividade.","Aprenda a construir interfaces que se adaptam a diferentes telas."],
[7,"Dando Vida à Aplicação","Variáveis, tipos, operadores, condições, repetições e funções.","Entenda os fundamentos usados para programar comportamentos no navegador."],
[8,"DOMinando a Interatividade","DOM, seleção de elementos, manipulação e eventos.","Aprenda como JavaScript encontra e modifica elementos da página."],
[9,"Caçando Bugs","Validação, tratamento de erros, console, depuração e testes.","Aprenda a identificar problemas e verificar se o comportamento atende ao esperado."],
[10,"Conectando os Mundos","Cliente, servidor, HTTP, JSON, requisições e APIs.","Entenda como aplicações web trocam dados entre camadas."],
[11,"Persistindo Dados","SGBD, conexão, persistência e recuperação de dados.","Compreenda como a aplicação envia, armazena e recupera informações."],
[12,"Protegendo o Acesso","Autenticação, autorização, sessão e controle de acesso.","Diferencie identificar um usuário de autorizar o que ele pode fazer."],
[13,"Dominando o CRUD","Create, Read, Update, Delete, testes e tratamento de erros.","Entenda o ciclo completo de manutenção dos dados da aplicação."],
[14,"Rumo à Produção","Integração, revisão, versionamento, documentação e publicação.","Consolide as camadas do projeto e prepare uma versão final verificável."]
];
const genericSteps=(phase,title,axis)=>[
{id:`f${phase}-understand`,type:"content",title:"Entenda o fundamento",summary:title,body:[axis,"Nesta etapa, concentre-se no conceito e no motivo de ele existir. Você ainda não precisa abrir o projeto no VS Code: observe a explicação, os exemplos e relacione cada elemento ao resultado esperado."]},
{id:`f${phase}-inspect`,type:"content",title:"Observe e explique",summary:"Leia um exemplo pequeno antes de aplicar no projeto.",body:[`Identifique no exemplo apresentado pelo instrutor onde aparece ${title}.`,"Pergunte a si mesmo: o que este trecho faz, por que está organizado dessa forma e o que mudaria se uma parte fosse alterada?"]},
{id:`f${phase}-check`,type:"checkpoint",title:"Checkpoint dos Fundamentos",summary:"Confirme que você compreendeu antes da prática guiada.",question:`Depois dos exemplos, você consegue explicar a finalidade de ${title} e reconhecer onde esse fundamento será usado?`,options:["Sim, consigo explicar e reconhecer","Consigo com algum apoio","Ainda preciso revisar os exemplos"]}
];
const phase1Steps=[
{id:"f1-understand",type:"content",title:"IDE, Git e GitHub: papéis diferentes",summary:"Entenda onde cada ferramenta entra no fluxo.",body:["A IDE ou editor, como o VS Code, é onde você organiza e edita os arquivos do projeto. O navegador é usado para executar e verificar a aplicação.","Git registra versões do projeto no computador. GitHub hospeda o repositório remoto e permite compartilhar e sincronizar o histórico. Um não substitui o outro."]},
{id:"f1-flow",type:"content",title:"Leia o fluxo de versionamento",summary:"Observe a sequência e a finalidade dos comandos.",body:["git status mostra o estado dos arquivos; git add prepara alterações; git commit registra uma versão; git push envia commits ao repositório remoto.","Nos Fundamentos você não precisa executar esses comandos no VS Code. A execução real acontecerá depois, na Prática Guiada EduTech."],code:"git status\ngit add .\ngit commit -m \"chore: iniciar projeto EduTech\"\ngit push"},
{id:"f1-check",type:"checkpoint",title:"Checkpoint dos Fundamentos",summary:"Confirme a diferença entre as ferramentas.",question:"Qual fluxo representa melhor o trabalho que faremos?",options:["Editar no VS Code, testar, versionar com Git e sincronizar no GitHub","Escrever tudo diretamente no GitHub e usar Git apenas para abrir arquivos","Usar Git e GitHub como se fossem a mesma ferramenta"]}
];
export const FUNDAMENTALS=DATA.map(([phase,title,axis,objective])=>({id:`F${phase}`,phase,title,axis,objective,hours:1.5,steps:phase===1?phase1Steps:genericSteps(phase,title,axis)}));
export const getFundamental=phase=>FUNDAMENTALS.find(f=>f.phase===Number(phase));
