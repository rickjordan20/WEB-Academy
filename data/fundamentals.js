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
const FOUNDATION_BLUEPRINT={
2:{icon:"🧱",idea:"HTML organiza o conteúdo da página.",visual:["<!DOCTYPE html> → documento HTML","<head> → informações da página","<body> → conteúdo visível","elemento + atributo → estrutura + informação"],examples:[["<h1>Curso de Web</h1>","Um título principal."],["<a href=\"aulas.html\">Aulas</a>","Um link com destino no atributo href."],["<img src=\"logo.png\" alt=\"Logo\">","Uma imagem com origem e descrição."]],quiz:["O que o HTML faz principalmente?",["Define a estrutura e o significado do conteúdo","Controla sozinho o banco de dados","Substitui o navegador"],0]},
3:{icon:"🧭",idea:"Semântica é escolher elementos pelo significado.",visual:["<header> → abertura/cabeçalho","<nav> → navegação","<main> → conteúdo principal","<section> → seção temática","<footer> → encerramento/rodapé"],examples:[["<nav>...</nav>","Indica uma área de navegação."],["<main>...</main>","Identifica o conteúdo principal."],["<section>...</section>","Agrupa um assunto relacionado."]],quiz:["Por que usar HTML semântico?",["Para comunicar melhor a função do conteúdo","Apenas para mudar cores","Para substituir o CSS"],0]},
4:{icon:"📝",idea:"Formulários coletam dados; labels explicam o que cada campo pede.",visual:["<form> → agrupa a coleta","<label> → identifica o campo","<input> → recebe um valor","type → define o tipo de entrada","required → indica obrigatoriedade"],examples:[["<input type=\"email\">","Campo preparado para endereço de e-mail."],["<label for=\"nome\">Nome</label>","Relaciona um texto explicativo ao campo."],["required","Indica que o campo é obrigatório."]],quiz:["Qual elemento explica ao usuário o significado de um campo?",["label","section","script"],0]},
5:{icon:"🎨",idea:"CSS define a apresentação visual dos elementos HTML.",visual:["seletor → quem será estilizado","propriedade → o que será alterado","valor → como ficará","cascata → regras podem competir","classe → estilo reutilizável"],examples:[["h1 { color: blue; }","Seleciona h1 e altera sua cor."],[".card { padding: 16px; }","Aplica espaçamento aos elementos da classe card."],["font-size: 20px;","Define o tamanho do texto."]],quiz:["Em CSS, o seletor responde a qual pergunta?",["Quem será estilizado?","Qual banco será usado?","Qual página será enviada ao servidor?"],0]},
6:{icon:"📱",idea:"Responsividade faz a interface se adaptar ao espaço disponível.",visual:["box model → conteúdo + padding + borda + margem","Flexbox → organização em uma dimensão","Grid → organização em linhas e colunas","media query → regra conforme a tela"],examples:[["display: flex;","Ativa um layout flexível."],["display: grid;","Ativa uma grade."],["@media (max-width: 600px)","Aplica regras em determinada largura."]],quiz:["Qual recurso permite aplicar CSS conforme características da tela?",["Media query","Commit","JSON"],0]},
7:{icon:"⚙️",idea:"JavaScript adiciona lógica e comportamento à aplicação.",visual:["variável → guarda um valor","operador → realiza/compara","if → toma decisão","repetição → repete ações","função → agrupa comportamento"],examples:[["const nome = \"Ana\";","Guarda um valor."],["if (idade >= 18)","Executa uma decisão."],["function calcular() { }","Define um comportamento reutilizável."]],quiz:["Qual estrutura é usada para tomar uma decisão?",["if","section","SELECT"],0]},
8:{icon:"🖱️",idea:"DOM é a representação da página que o JavaScript consegue consultar e alterar.",visual:["document → página no JavaScript","selecionar → encontrar elemento","evento → algo aconteceu","listener → reagir ao evento","alterar → mudar conteúdo/estado"],examples:[["document.querySelector(\"#titulo\")","Localiza um elemento."],["button.addEventListener(\"click\", ...)","Reage a um clique."],["element.textContent = \"Olá\"","Altera um texto."]],quiz:["O que é um evento no navegador?",["Uma ocorrência como clique ou digitação","Uma tabela do banco","Uma branch do Git"],0]},
9:{icon:"🐞",idea:"Depurar é investigar por que o comportamento real difere do esperado.",visual:["validar → conferir dados/regras","console → observar informações","erro → pista do problema","teste → comparar esperado × obtido","corrigir → ajustar e testar novamente"],examples:[["console.log(valor)","Ajuda a observar um valor."],["required","Exemplo de validação no formulário."],["esperado ≠ obtido","Sinal de que algo precisa ser investigado."]],quiz:["Qual é uma boa atitude ao encontrar um bug?",["Observar evidências, localizar a causa e testar a correção","Apagar o projeto","Ignorar o resultado"],0]},
10:{icon:"🌐",idea:"Cliente e servidor trocam mensagens por requisições e respostas.",visual:["cliente → faz a requisição","servidor → processa","HTTP → regras da comunicação","JSON → formato comum de dados","API → interface de acesso a recursos"],examples:[["GET /cursos","Solicita dados."],["POST /usuarios","Envia dados para criação."],["{\"nome\":\"Ana\"}","Exemplo de dado em JSON."]],quiz:["Em uma aplicação web, quem normalmente responde a uma requisição do cliente?",["Servidor","CSS","Git"],0]},
11:{icon:"🗄️",idea:"Persistência mantém dados disponíveis além da execução momentânea da interface.",visual:["aplicação → solicita operação","backend → aplica regras","SGBD → gerencia o banco","banco → armazena dados","consulta → recupera informações"],examples:[["INSERT","Inclui dados."],["SELECT","Consulta dados."],["conexão","Permite que a camada responsável acesse o SGBD."]],quiz:["Qual é o papel de um SGBD?",["Gerenciar o banco de dados","Estilizar HTML","Criar commits"],0]},
12:{icon:"🔐",idea:"Autenticação identifica; autorização decide o que o usuário pode fazer.",visual:["login → tentativa de identificação","autenticação → quem é você?","sessão/token → mantém contexto de acesso","autorização → o que você pode fazer?","perfil → conjunto de permissões"],examples:[["Aluno autenticado","Sistema reconhece o usuário."],["Administrador autorizado","Pode acessar funções administrativas."],["Acesso negado","Usuário não possui a permissão necessária."]],quiz:["Qual pergunta pertence à autorização?",["O que este usuário pode fazer?","Qual é a cor do botão?","Qual commit foi criado?"],0]},
13:{icon:"🔄",idea:"CRUD resume quatro operações fundamentais sobre dados.",visual:["Create → criar","Read → consultar","Update → atualizar","Delete → excluir","testar → verificar cada operação"],examples:[["Cadastrar curso","Create"],["Listar cursos","Read"],["Editar curso","Update"],["Excluir curso","Delete"]],quiz:["Editar um registro corresponde a qual operação CRUD?",["Update","Read","Create"],0]},
14:{icon:"🚀",idea:"Produção integra, verifica, documenta, versiona e disponibiliza uma versão utilizável.",visual:["integrar → juntar as partes","revisar/testar → verificar requisitos","versionar → registrar versão","documentar → explicar uso/estrutura","publicar → disponibilizar"],examples:[["README","Documenta informações essenciais."],["versão final testada","Reduz problemas antes da entrega."],["deploy/publicação","Torna a aplicação acessível no ambiente definido."]],quiz:["Antes de publicar uma versão final, o que faz mais sentido?",["Integrar e testar os requisitos","Apagar o histórico Git","Remover a documentação"],0]}
};
const genericSteps=(phase,title,axis)=>{const b=FOUNDATION_BLUEPRINT[phase];return[
{id:`f${phase}-visual`,type:"visual-summary",title:`${b.icon} Resumo visual`,summary:title,idea:b.idea,items:b.visual},
{id:`f${phase}-examples`,type:"match-cards",title:"👀 Veja e associe",summary:"Exemplos curtos para reconhecer o conceito sem transformar Fundamentos em tutorial.",pairs:b.examples},
{id:`f${phase}-quick`,type:"quiz",title:"⚡ Desafio rápido",summary:"Escolha a ideia correta.",question:b.quiz[0],options:b.quiz[1],answer:b.quiz[2],feedback:"Revise o resumo visual e tente relacionar a resposta à finalidade do conceito."},
{id:`f${phase}-map`,type:"visual-summary",title:"🧠 Mapa para levar à prática",summary:"Você não precisa decorar tudo. Entenda estas relações.",idea:axis,items:["O que é? → reconheça o conceito","Para que serve? → relacione ao problema","Como aparece? → reconheça exemplos","Como fazer? → será executado na Prática Guiada com o instrutor"]}
]};
const phase1Steps=[
 {
  "id": "f1-welcome",
  "type": "content",
  "title": "01 · O que vamos aprender nesta aula?",
  "summary": "Boas-vindas e objetivos · 8 min",
  "body": [
   "Bem-vindo à UC7! Ao longo das aulas, você vai aprender a criar aplicações web: começaremos pelo ambiente de trabalho, depois estudaremos HTML, CSS e JavaScript e, mais adiante, integração, testes e publicação.",
   "Você usará a WEB Academy para estudar os fundamentos, resolver pequenos desafios e registrar suas atividades. No EduTech, desenvolverá seu projeto individual com o instrutor. No Projeto Restaurante, trabalhará em equipe nas missões B.",
   "A Missão 1A tem três momentos: 1h30 de Fundamentos (entender), 2h de Prática Guiada no EduTech (fazer junto) e 30 minutos de Relatório Individual (registrar o que aprendeu).",
   "Hoje você não precisa saber programar nem decorar comandos. Ao final, deverá reconhecer as ferramentas, organizar a pasta do projeto e entender por que usamos Git e GitHub."
  ]
 },
 {
  "id": "f1-kit",
  "type": "content",
  "title": "02 · Conheça as ferramentas antes de usá-las",
  "summary": "Leitura orientada · 8 min",
  "body": [
   "Imagine que você vai construir uma página para uma escola. Primeiro, precisa de um lugar para escrever os arquivos. Depois, precisa abrir a página e verificar como ficou. Também será útil guardar o histórico das alterações e compartilhar o projeto.",
   "Um EDITOR DE CÓDIGO é um programa para escrever e modificar arquivos de programação. O Visual Studio Code (VS Code) será nosso editor. Uma IDE é um ambiente de desenvolvimento que reúne várias ferramentas; o VS Code é um editor extensível com recursos de ambiente de desenvolvimento.",
   "O NAVEGADOR, como Chrome, Edge ou Firefox, interpreta e exibe páginas web. O TERMINAL permite executar comandos digitados. O GIT acompanha versões do projeto no computador. O GITHUB é um serviço online onde podemos hospedar repositórios Git.",
   "Essas ferramentas têm funções diferentes. Escrever um arquivo no VS Code não o publica automaticamente na internet, e salvar um arquivo não cria um commit no Git."
  ]
 },
 {
  "id": "f1-tools",
  "type": "match-cards",
  "title": "03 · Pratique: qual ferramenta faz cada tarefa?",
  "summary": "Associação · 4 min. Todas as respostas foram apresentadas na leitura anterior.",
  "pairs": [
   [
    "Escrever e editar os arquivos do projeto",
    "VS Code (editor)"
   ],
   [
    "Abrir a página e conferir como aparece",
    "Navegador"
   ],
   [
    "Digitar comandos para trabalhar com pastas e Git",
    "Terminal"
   ],
   [
    "Guardar o histórico de versões no computador",
    "Git"
   ],
   [
    "Hospedar o repositório em um serviço online",
    "GitHub"
   ]
  ]
 },
 {
  "id": "f1-files",
  "type": "content",
  "title": "04 · O que são arquivos, pastas e caminhos?",
  "summary": "Leitura e exemplo · 8 min",
  "body": [
   "Um projeto é formado por ARQUIVOS organizados em PASTAS. A pasta principal, também chamada de pasta raiz, guarda a estrutura do projeto. Cada arquivo tem um nome e, geralmente, uma extensão que ajuda a identificar seu tipo.",
   "No EduTech, usaremos a pasta edutech/ como raiz. Dentro dela, index.html será o arquivo inicial da página; css/style.css guardará estilos; js/app.js guardará comportamentos; e assets/images/ poderá guardar imagens.",
   "O caminho css/style.css significa: entre na pasta css e encontre o arquivo style.css. A barra separa níveis da estrutura. Nesta aula, você só precisa reconhecer essa organização; HTML, CSS e JavaScript serão ensinados progressivamente nas próximas aulas.",
   "Organizar os arquivos desde o começo facilita encontrá-los, trabalhar com outras pessoas e registrar mudanças no Git."
  ]
 },
 {
  "id": "f1-organize",
  "type": "match-cards",
  "title": "05 · Pratique: onde guardar cada arquivo?",
  "summary": "Associação · 4 min. Consulte o exemplo anterior se precisar.",
  "pairs": [
   [
    "index.html",
    "Na pasta raiz edutech/"
   ],
   [
    "style.css",
    "Na pasta css/"
   ],
   [
    "app.js",
    "Na pasta js/"
   ],
   [
    "logo.png",
    "Na pasta assets/images/"
   ]
  ]
 },
 {
  "id": "f1-vscode",
  "type": "content",
  "title": "06 · Como trabalhar no VS Code?",
  "summary": "Leitura orientada · 6 min",
  "body": [
   "O VS Code não guarda o projeto dentro dele: ele abre e modifica arquivos que estão salvos no computador. Ao abrir a pasta edutech/, você poderá visualizar sua estrutura no painel Explorer (Explorador).",
   "No Explorer, criamos pastas e arquivos. Na área do editor, escrevemos e salvamos o conteúdo. O terminal integrado permite executar comandos sem sair do VS Code. O painel Source Control mostra informações do controle de versão quando o Git está disponível.",
   "Atenção: VS Code e Git são programas diferentes. O VS Code pode oferecer uma interface para o Git, mas o Git precisa estar instalado e configurado para funcionar."
  ]
 },
 {
  "id": "f1-terminal",
  "type": "content",
  "title": "07 · O que é terminal e pasta atual?",
  "summary": "Explicação com exemplos · 7 min",
  "body": [
   "O terminal recebe comandos de texto. No Windows, podemos usar PowerShell ou Prompt de Comando (CMD), inclusive dentro do VS Code. Um comando age sobre o local em que o terminal está trabalhando, chamado DIRETÓRIO ATUAL.",
   "Exemplo: se o terminal está na pasta C:\\\\Projetos\\\\edutech, o comando dir (no CMD e no PowerShell) lista o conteúdo dessa pasta. O comando cd permite mudar de pasta. O comando mkdir cria uma pasta.",
   "Se o comando code estiver disponível no sistema, code . abre no VS Code a pasta atual. O ponto (.) representa exatamente a pasta em que você está. Se não funcionar, use a opção Arquivo > Abrir Pasta no VS Code.",
   "Você não precisa executar esses comandos sozinho agora: na Prática Guiada faremos isso com o instrutor."
  ]
 },
 {
  "id": "f1-code-dot",
  "type": "quiz",
  "title": "08 · Confira: o que significa code .?",
  "summary": "Questão de interpretação · 3 min. A explicação está na etapa anterior.",
  "question": "O terminal está na pasta C:\\\\Projetos\\\\edutech e você digita code . O que o ponto representa?",
  "options": [
   "A pasta atual, edutech, que será aberta no VS Code",
   "Uma ordem para criar automaticamente uma conta no GitHub",
   "Uma instrução para publicar o site na internet"
  ],
  "answer": 0,
  "feedback": "O ponto (.) significa diretório atual. Se code não estiver configurado, a pasta também pode ser aberta pelo menu do VS Code."
 },
 {
  "id": "f1-repos",
  "type": "content",
  "title": "09 · Por que precisamos controlar versões?",
  "summary": "Conceitos de Git e GitHub · 9 min",
  "body": [
   "Imagine que você alterou o EduTech e, no dia seguinte, percebeu que a versão anterior funcionava melhor. Se guardar apenas o arquivo atual, será difícil entender o que mudou. O controle de versão ajuda a registrar a evolução do projeto.",
   "GIT é o sistema que acompanha alterações e cria registros do histórico. Um REPOSITÓRIO LOCAL é a pasta do projeto com o histórico Git no seu computador. Uma pasta comum ainda não é necessariamente um repositório Git.",
   "GITHUB é um serviço online que hospeda repositórios Git. Chamamos de REPOSITÓRIO REMOTO o repositório acessível nesse serviço. Podemos trabalhar localmente mesmo sem publicar nada no GitHub.",
   "Salvar um arquivo (por exemplo, Ctrl+S) grava seu conteúdo. Fazer um COMMIT registra uma versão no histórico do Git. Fazer um PUSH envia commits locais para o remoto. São ações diferentes."
  ]
 },
 {
  "id": "f1-gitgithub",
  "type": "quiz",
  "title": "10 · Confira: Git é a mesma coisa que GitHub?",
  "summary": "Questão de compreensão · 3 min. Revise a etapa 09 se necessário.",
  "question": "Qual alternativa explica corretamente a diferença entre Git e GitHub?",
  "options": [
   "Git registra versões; GitHub pode hospedar repositórios Git na internet",
   "GitHub é obrigatório para salvar qualquer arquivo no computador",
   "Git e GitHub são dois nomes para o navegador"
  ],
  "answer": 0,
  "feedback": "Git funciona no computador e controla versões. GitHub hospeda repositórios remotos e facilita compartilhamento e colaboração."
 },
 {
  "id": "f1-version",
  "type": "content",
  "title": "11 · Entenda o caminho de uma alteração",
  "summary": "Do arquivo ao histórico · 8 min",
  "body": [
   "Veja uma situação real: você cria index.html no EduTech. Primeiro salva o arquivo. O Git pode identificar que existe um arquivo novo ou modificado, mas ainda não foi criado um registro de versão.",
   "O comando git status mostra o estado das alterações. O comando git add . prepara os arquivos da pasta para o próximo registro (área de preparação, ou staging). O comando git commit -m \"Criar estrutura inicial\" registra essa versão no histórico local.",
   "Depois, git push envia os commits ao repositório remoto que já foi configurado. Em resumo: ALTERAR E SALVAR → CONFERIR (status) → PREPARAR (add) → REGISTRAR (commit) → ENVIAR (push).",
   "Uma boa mensagem de commit descreve o que mudou, como \"Criar estrutura inicial do EduTech\". Mensagens vagas, como \"coisas\", dificultam compreender o histórico."
  ]
 },
 {
  "id": "f1-commands",
  "type": "command-deck",
  "title": "12 · Consulte os comandos Git e suas funções",
  "summary": "Cartões de revisão · 5 min. Leia os conceitos antes de avançar.",
  "commands": [
   [
    "git init",
    "Transforma a pasta em um repositório Git local"
   ],
   [
    "git status",
    "Mostra arquivos novos, alterados e preparados"
   ],
   [
    "git add .",
    "Prepara alterações para o próximo commit"
   ],
   [
    "git commit -m \"mensagem\"",
    "Registra uma versão local com uma descrição"
   ],
   [
    "git remote add origin URL",
    "Conecta o repositório local ao endereço do remoto"
   ],
   [
    "git push",
    "Envia commits locais ao remoto"
   ],
   [
    "git pull",
    "Busca e integra atualizações do remoto ao repositório local"
   ],
   [
    "git clone URL",
    "Copia um repositório remoto para o computador"
   ],
   [
    "git branch -M main",
    "Define/renomeia a branch atual como main"
   ]
  ]
 },
 {
  "id": "f1-first",
  "type": "content",
  "title": "13 · Primeira configuração ou trabalho do dia a dia?",
  "summary": "Entenda antes de escolher comandos · 6 min",
  "body": [
   "Na primeira aula, vamos criar a pasta do EduTech, executar git init, criar um repositório vazio no GitHub, conectá-lo como origin e enviar nosso primeiro commit. origin é o nome convencional da conexão com o remoto; main é o nome que usaremos para a branch principal.",
   "Depois que o projeto já estiver configurado, a rotina costuma ser: receber mudanças do remoto quando necessário (git pull), editar e testar, conferir (git status), preparar (git add), registrar (git commit) e enviar (git push).",
   "Se o projeto já existe no GitHub, mas ainda não está no computador, usamos git clone para obter uma cópia local. Não precisamos repetir git init ou criar outro repositório remoto a cada aula.",
   "O comando git pull deve ser usado em um repositório local já conectado ao remoto. A integração pode exigir resolver conflitos quando houver alterações diferentes no mesmo conteúdo."
  ]
 },
 {
  "id": "f1-direction",
  "type": "choice-scenario",
  "title": "14 · Agora escolha: push, pull ou clone?",
  "summary": "Situações práticas · 4 min. As três operações foram explicadas na etapa anterior.",
  "scenarios": [
   [
    "Você criou commits no computador e quer enviá-los ao GitHub.",
    [
     "git push",
     "git pull",
     "git clone"
    ],
    0
   ],
   [
    "Você já tem o projeto no computador e quer receber atualizações do GitHub.",
    [
     "git clone",
     "git pull",
     "git init"
    ],
    1
   ],
   [
    "O projeto está no GitHub, mas você ainda não o tem neste computador.",
    [
     "git clone",
     "git push",
     "git commit"
    ],
    0
   ]
  ]
 },
 {
  "id": "f1-commit",
  "type": "choice-scenario",
  "title": "15 · Qual mensagem de commit ajuda mais?",
  "summary": "Aplicação do que foi ensinado · 3 min",
  "scenarios": [
   [
    "Você criou a estrutura inicial do EduTech.",
    [
     "alterações",
     "Criar estrutura inicial do EduTech",
     "coisas"
    ],
    1
   ],
   [
    "Você corrigiu um link que não abria.",
    [
     "corrigir link de navegação",
     "teste",
     "mais um commit"
    ],
    0
   ]
  ]
 },
 {
  "id": "f1-final",
  "type": "quiz",
  "title": "16 · Verificação final dos Fundamentos",
  "summary": "Síntese da aprendizagem · 3 min",
  "question": "Qual sequência representa corretamente a preparação de uma mudança para o GitHub?",
  "options": [
   "Salvar → git status → git add → git commit → git push",
   "git push → criar arquivo → git clone → salvar",
   "Abrir o navegador → git pull → apagar a pasta"
  ],
  "answer": 0,
  "feedback": "Isso mesmo: primeiro salvamos e conferimos, depois preparamos, registramos localmente e enviamos os commits ao remoto configurado."
 },
 {
  "id": "f1-handoff",
  "type": "content",
  "title": "17 · Próximo passo: fazer junto com o instrutor",
  "summary": "Transição para a Prática Guiada · 2 min",
  "body": [
   "Você já conheceu os conceitos que serão usados na prática. Não é necessário ter memorizado tudo: volte às explicações sempre que precisar.",
   "Agora você vai abrir o VS Code, criar a pasta e os arquivos iniciais do EduTech, inicializar o Git, criar e conectar o repositório do GitHub, fazer commits e sincronizar as alterações.",
   "Durante a prática, pergunte quando algo não funcionar. No relatório final, registre o que conseguiu realizar, suas dificuldades e uma evidência do repositório ou commit."
  ]
 }
];

export const FUNDAMENTALS=DATA.map(([phase,title,axis,objective])=>({id:`F${phase}`,phase,title,axis,objective,hours:1.5,steps:phase===1?phase1Steps:genericSteps(phase,title,axis)}));
export const getFundamental=phase=>FUNDAMENTALS.find(f=>f.phase===Number(phase));
