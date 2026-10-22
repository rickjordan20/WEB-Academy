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
  "id": "f1-block-1",
  "type": "content",
  "title": "BLOCO 1 · Ferramentas e projetos",
  "summary": "Comece por aqui: neste bloco você aprende antes de responder.",
  "body": [
   "Objetivo: reconhecer a WEB Academy, o EduTech e as ferramentas que usaremos."
  ]
 },
 {
  "id": "f1-welcome",
  "type": "visual-summary",
  "title": "Boas-vindas · O que vamos fazer hoje?",
  "summary": "Conheça a aula antes de começar • 4 min",
  "idea": "Hoje você vai entender as ferramentas e o Git antes de usá-los com o instrutor.",
  "sections": [
   {
    "title": "O que é cada espaço?",
    "items": [
     "UC7: aprender desenvolvimento web desde o começo.",
     "WEB Academy: plataforma de atividades e desafios.",
     "EduTech: projeto individual feito com o instrutor.",
     "Projeto Restaurante: projeto em equipe nas missões B."
    ]
   },
   {
    "title": "O que faremos hoje?",
    "items": [
     "Fundamentos (1h30) → Prática Guiada EduTech (2h) → Relatório (30min)."
    ]
   }
  ]
 },
 {
  "id": "f1-kit",
  "type": "visual-summary",
  "title": "Conheça as ferramentas de desenvolvimento",
  "summary": "Observe a função de cada ferramenta • 6 min",
  "idea": "Cada ferramenta tem uma missão diferente.",
  "sections": [
   {
    "title": "Conceitos: para que serve cada ferramenta?",
    "items": [
     "VS Code: editor para criar e modificar arquivos.",
     "Navegador: programa para abrir e testar páginas.",
     "Terminal: espaço para digitar comandos.",
     "Git: ferramenta para registrar versões.",
     "GitHub: site para hospedar repositórios Git."
    ]
   },
   {
    "title": "Termo que você vai ouvir",
    "items": [
     "IDE: ambiente integrado de desenvolvimento. O VS Code é um editor extensível com recursos de desenvolvimento."
    ]
   }
  ]
 },
 {
  "id": "f1-tools",
  "type": "match-cards",
  "title": "Desafio: escolha a ferramenta certa",
  "summary": "Associe usando o quadro anterior • 4 min",
  "pairs": [
   [
    "Escrever um arquivo",
    "VS Code"
   ],
   [
    "Ver uma página funcionando",
    "Navegador"
   ],
   [
    "Digitar um comando",
    "Terminal"
   ],
   [
    "Registrar uma versão",
    "Git"
   ],
   [
    "Hospedar o repositório na internet",
    "GitHub"
   ]
  ]
 },
 {
  "id": "f1-block-2",
  "type": "content",
  "title": "BLOCO 2 · Pastas, arquivos e VS Code",
  "summary": "Comece por aqui: neste bloco você aprende antes de responder.",
  "body": [
   "Objetivo: entender onde ficam os arquivos e como trabalhar com a pasta do projeto."
  ]
 },
 {
  "id": "f1-files",
  "type": "visual-summary",
  "title": "Veja como uma pasta de projeto é organizada",
  "summary": "Observe o exemplo do EduTech • 5 min",
  "idea": "Uma pasta principal reúne os arquivos. Cada arquivo tem seu lugar.",
  "sections": [
   {
    "title": "Conceito: estrutura de pastas",
    "items": [
     "A pasta principal do projeto se chama edutech.",
     "Arquivos são organizados dentro de pastas conforme sua função."
    ]
   },
   {
    "title": "Exemplo: veja onde fica cada arquivo",
    "items": [
     "edutech/index.html: conteúdo da página.",
     "edutech/css/style.css: estilos visuais.",
     "edutech/js/app.js: interações.",
     "edutech/assets/images/logo.png: imagem."
    ]
   },
   {
    "title": "Dica de leitura",
    "items": [
     "css/style.css significa: entre na pasta css e encontre style.css."
    ]
   }
  ]
 },
 {
  "id": "f1-organize",
  "type": "match-cards",
  "title": "Desafio: cada arquivo no seu lugar",
  "summary": "Associe usando o exemplo anterior • 4 min",
  "pairs": [
   [
    "index.html",
    "Raiz edutech/"
   ],
   [
    "style.css",
    "Pasta css/"
   ],
   [
    "app.js",
    "Pasta js/"
   ],
   [
    "logo.png",
    "Pasta assets/images/"
   ]
  ]
 },
 {
  "id": "f1-vscode",
  "type": "visual-summary",
  "title": "Conheça as partes do VS Code",
  "summary": "Veja onde cada tarefa acontece • 5 min",
  "idea": "O projeto fica no computador. O VS Code abre sua pasta.",
  "sections": [
   {
    "title": "Conceitos: partes do VS Code",
    "items": [
     "Explorador: mostra pastas e arquivos.",
     "Editor: área para escrever e salvar arquivos.",
     "Terminal integrado: digitar comandos.",
     "Controle de Código-Fonte: visualizar alterações com Git."
    ]
   },
   {
    "title": "Atenção",
    "items": [
     "Abrir uma pasta no VS Code não inicia automaticamente um repositório Git."
    ]
   }
  ]
 },
 {
  "id": "f1-terminal",
  "type": "visual-summary",
  "title": "Entenda o terminal e a pasta atual",
  "summary": "Aprenda o significado dos comandos antes de responder • 5 min",
  "idea": "O terminal executa comandos na pasta atual.",
  "sections": [
   {
    "title": "Conceito",
    "items": [
     "O terminal executa comandos na pasta em que você está."
    ]
   },
   {
    "title": "Exemplos de comandos no Windows",
    "items": [
     "dir: lista os arquivos.",
     "cd: muda de pasta.",
     "mkdir: cria uma pasta.",
     "code .: abre a pasta atual no VS Code, se configurado."
    ]
   },
   {
    "title": "Atenção ao caminho",
    "items": [
     "C:\\\\Projetos\\\\edutech indica que o terminal está na pasta edutech.",
     "O ponto (.) significa a pasta atual."
    ]
   }
  ]
 },
 {
  "id": "f1-code-dot",
  "type": "quiz",
  "title": "Desafio: o que significa o ponto?",
  "summary": "A resposta está na explicação anterior • 3 min",
  "question": "Você está em C:\\Projetos\\edutech e digita code . O que será aberto?",
  "options": [
   "A pasta atual edutech no VS Code",
   "Um novo repositório no GitHub",
   "Uma página publicada na internet"
  ],
  "answer": 0,
  "feedback": "O ponto significa a pasta atual. Também é possível usar Arquivo > Abrir Pasta."
 },
 {
  "id": "f1-block-3",
  "type": "content",
  "title": "BLOCO 3 · Git e GitHub: entendendo versões",
  "summary": "Comece por aqui: neste bloco você aprende antes de responder.",
  "body": [
   "Objetivo: distinguir salvar, criar uma versão local e usar um repositório remoto."
  ]
 },
 {
  "id": "f1-repos",
  "type": "visual-summary",
  "title": "Git, GitHub e repositórios: qual a diferença?",
  "summary": "Veja os conceitos com um exemplo do EduTech • 6 min",
  "idea": "Imagine que você quer recuperar uma versão anterior do EduTech.",
  "sections": [
   {
    "title": "Conceitos: três ações diferentes",
    "items": [
     "Salvar (Ctrl+S): grava as alterações no arquivo.",
     "Git: acompanha mudanças e registra versões.",
     "GitHub: hospeda repositórios na internet."
    ]
   },
   {
    "title": "Exemplo: um projeto EduTech",
    "items": [
     "Repositório local: pasta do projeto com histórico Git no computador.",
     "Commit: registro de uma versão nesse histórico.",
     "Repositório remoto: cópia acessível em um serviço como o GitHub."
    ]
   }
  ]
 },
 {
  "id": "f1-gitgithub",
  "type": "quiz",
  "title": "Desafio: Git ou GitHub?",
  "summary": "Responda usando a explicação anterior • 3 min",
  "question": "Qual frase está correta?",
  "options": [
   "Git registra versões; GitHub hospeda repositórios online",
   "GitHub é obrigatório para salvar arquivos",
   "Git e GitHub são navegadores"
  ],
  "answer": 0,
  "feedback": "Git funciona localmente; GitHub é um serviço de hospedagem de repositórios Git."
 },
 {
  "id": "f1-version",
  "type": "visual-summary",
  "title": "Como uma alteração vira uma versão?",
  "summary": "Acompanhe o caminho completo • 7 min",
  "idea": "Exemplo: você criou index.html e quer publicar o commit.",
  "sections": [
   {
    "title": "Conceito: fluxo de uma alteração",
    "items": [
     "Salvar → conferir → preparar → registrar → enviar."
    ]
   },
   {
    "title": "Exemplo: comandos em ordem",
    "items": [
     "1. Ctrl+S: salvar.",
     "2. git status: conferir.",
     "3. git add .: preparar.",
     "4. git commit -m \"Criar estrutura\": registrar.",
     "5. git push: enviar ao remoto já conectado."
    ]
   },
   {
    "title": "Atenção",
    "items": [
     "Salvar, commit e push são ações diferentes.",
     "O primeiro push exige preparar a conexão com o remoto; isso será feito com o instrutor."
    ]
   }
  ]
 },
 {
  "id": "f1-flow-quiz",
  "type": "sequence",
  "title": "Desafio: organize os passos do versionamento",
  "summary": "Ordene os passos ensinados acima • 5 min",
  "prompt": "Qual é a sequência para registrar e enviar uma alteração?",
  "items": [
   "git push",
   "Salvar arquivo",
   "git commit",
   "git status",
   "git add"
  ],
  "expected": [
   "Salvar arquivo",
   "git status",
   "git add",
   "git commit",
   "git push"
  ],
  "feedback": "Primeiro salvar, depois conferir, preparar, registrar e enviar."
 },
 {
  "id": "f1-block-4",
  "type": "content",
  "title": "BLOCO 4 · Comandos e situações do dia a dia",
  "summary": "Comece por aqui: neste bloco você aprende antes de responder.",
  "body": [
   "Objetivo: compreender os comandos antes de escolher qual usar."
  ]
 },
 {
  "id": "f1-commands",
  "type": "visual-summary",
  "title": "Comandos para começar e sincronizar",
  "summary": "Conheça init, remote, clone, pull e push • 7 min",
  "idea": "Nem todo comando precisa ser repetido em todas as aulas.",
  "sections": [
   {
    "title": "Conceitos: preparação inicial",
    "items": [
     "git init: começa o repositório local.",
     "git remote add origin URL: conecta o endereço remoto.",
     "main: nome comum da branch principal; origin: apelido do remoto."
    ]
   },
   {
    "title": "Conceitos: sincronização",
    "items": [
     "git push: envia commits locais.",
     "git pull: recebe e integra mudanças do remoto.",
     "git clone URL: copia um repositório remoto para outro computador."
    ]
   },
   {
    "title": "Atenção",
    "items": [
     "Não é necessário repetir git init nem git remote add origin em toda alteração."
    ]
   }
  ]
 },
 {
  "id": "f1-command-cards",
  "type": "command-deck",
  "title": "Desafio: revise os comandos com cartões",
  "summary": "Toque para revelar a função de cada comando • 4 min",
  "commands": [
   [
    "git init",
    "Iniciar o repositório local"
   ],
   [
    "git status",
    "Conferir alterações"
   ],
   [
    "git add .",
    "Preparar alterações"
   ],
   [
    "git commit",
    "Registrar versão local"
   ],
   [
    "git push",
    "Enviar commits ao remoto"
   ],
   [
    "git pull",
    "Receber e integrar alterações remotas"
   ],
   [
    "git clone",
    "Copiar um repositório remoto"
   ],
   [
    "git remote add origin",
    "Vincular o endereço do remoto"
   ]
  ]
 },
 {
  "id": "f1-direction",
  "type": "choice-scenario",
  "title": "Desafio: enviar, receber ou copiar?",
  "summary": "Escolha entre push, pull e clone • 5 min",
  "scenarios": [
   [
    "Tenho commits locais e quero enviá-los ao GitHub.",
    [
     "push",
     "pull",
     "clone"
    ],
    0
   ],
   [
    "Meu projeto já está no computador e quero receber mudanças do GitHub.",
    [
     "clone",
     "pull",
     "init"
    ],
    1
   ],
   [
    "O projeto está no GitHub, mas não neste computador.",
    [
     "clone",
     "push",
     "commit"
    ],
    0
   ]
  ]
 },
 {
  "id": "f1-commit-intro",
  "type": "visual-summary",
  "title": "Como escrever uma mensagem de commit?",
  "summary": "Compare mensagens claras e vagas • 4 min",
  "idea": "A mensagem deve ajudar você a entender o histórico depois.",
  "sections": [
   {
    "title": "Conceito",
    "items": [
     "A mensagem de commit descreve o que mudou no projeto."
    ]
   },
   {
    "title": "Exemplos de boas mensagens",
    "items": [
     "Criar estrutura inicial do EduTech.",
     "Corrigir link do menu."
    ]
   },
   {
    "title": "Evite mensagens vagas",
    "items": [
     "coisas, teste, alterações."
    ]
   },
   {
    "title": "Exemplo de comando",
    "items": [
     "git commit -m \"Criar estrutura inicial do EduTech\"."
    ]
   }
  ]
 },
 {
  "id": "f1-commit",
  "type": "choice-scenario",
  "title": "Desafio: escolha uma boa mensagem",
  "summary": "Aplique os exemplos anteriores • 4 min",
  "scenarios": [
   [
    "Você criou a estrutura inicial do EduTech.",
    [
     "coisas",
     "Criar estrutura inicial do EduTech",
     "alterações"
    ],
    1
   ],
   [
    "Você corrigiu um link do menu.",
    [
     "Corrigir link do menu",
     "teste",
     "mais um"
    ],
    0
   ]
  ]
 },
 {
  "id": "f1-block-5",
  "type": "content",
  "title": "BLOCO 5 · Revisão e preparação para o EduTech",
  "summary": "Comece por aqui: neste bloco você aprende antes de responder.",
  "body": [
   "Objetivo: conferir o aprendizado e iniciar a prática acompanhada."
  ]
 },
 {
  "id": "f1-final",
  "type": "quiz",
  "title": "Checkpoint final · O que você aprendeu?",
  "summary": "Revisão dos conceitos trabalhados • 3 min",
  "question": "Qual é a sequência correta para registrar e enviar uma alteração?",
  "options": [
   "Salvar → status → add → commit → push",
   "Push → criar arquivo → clone",
   "Abrir navegador → pull → apagar pasta"
  ],
  "answer": 0,
  "feedback": "Você já conhece o fluxo. Agora vai executá-lo com o instrutor!"
 },
 {
  "id": "f1-handoff",
  "type": "visual-summary",
  "title": "Agora é com o instrutor: EduTech",
  "summary": "Veja o que faremos na prática • 5 min",
  "idea": "Na Prática Guiada, o instrutor mostrará cada passo no EduTech.",
  "sections": [
   {
    "title": "Na prática guiada",
    "items": [
     "Abrir o EduTech no VS Code e organizar arquivos.",
     "Iniciar o Git e observar alterações.",
     "Criar o primeiro commit local.",
     "Criar o repositório no GitHub e conectar ao projeto.",
     "Enviar o commit com push e conferir online.",
     "Alterar um arquivo e enviar a nova versão."
    ]
   },
   {
    "title": "No relatório",
    "items": [
     "Registrar o link do repositório, o que aprendeu e as dificuldades."
    ]
   }
  ]
 }
];

const PHASE_2_FOUNDATIONS=[
  {
    "id": "2b-f1",
    "type": "visual-summary",
    "title": "Fundamentos 01 · O que vamos construir?",
    "summary": "8h00–8h10 · Objetivo e arquitetura",
    "idea": "Missão: montar a estrutura navegável de quatro páginas HTML antes de aprofundar seus conteúdos.",
    "sections": [
      {
        "title": "Duas situações de aprendizagem",
        "items": [
          "EduTech: desenvolvimento guiado com o instrutor.",
          "Projeto Restaurante: aplicação autônoma da Guilda com tarefas e evidências no Kanban."
        ]
      },
      {
        "title": "Resultado esperado",
        "items": [
          "index.html na raiz; sobre.html, cursos.html e contato.html dentro de pages/ (EduTech).",
          "No Restaurante, trocar cursos.html por cardapio.html.",
          "Hoje: estrutura HTML, cabeçalho, navegação, main, rodapé e testes. Conteúdo completo, CSS e JavaScript ficam para depois."
        ]
      }
    ]
  },
  {
    "id": "2b-f2",
    "type": "visual-summary",
    "title": "Fundamentos 02 · HTML, tags e atributos",
    "summary": "8h10–8h20 · Conceitos dos slides",
    "idea": "HTML é a linguagem de marcação que organiza o conteúdo; CSS cuida da aparência; JavaScript acrescenta comportamento.",
    "sections": [
      {
        "title": "Elementos HTML",
        "items": [
          "<p>Texto</p> possui abertura, conteúdo e fechamento; <img> e <br> são elementos vazios, sem tag de fechamento.",
          "Tags estruturam conteúdo; atributos fornecem informações adicionais dentro da abertura."
        ]
      },
      {
        "title": "Atributos na prática",
        "items": [
          "<a href=\"pages/sobre.html\">Sobre</a> aponta para outra página.",
          "<img src=\"imagens/curso.jpg\" alt=\"Estudante programando\" width=\"250\"> referencia imagem, descreve-a e informa largura.",
          "class identifica elementos para futura estilização; o HTML funciona mesmo sem CSS."
        ]
      }
    ]
  },
  {
    "id": "2b-f3",
    "type": "visual-summary",
    "title": "Fundamentos 03 · Esqueleto de um documento HTML5",
    "summary": "8h20–8h30 · Entenda cada parte",
    "idea": "O navegador precisa reconhecer o documento, seu idioma, metadados e o conteúdo visível.",
    "sections": [
      {
        "title": "Estrutura",
        "items": [
          "<!DOCTYPE html> declara HTML5; <html lang=\"pt-BR\"> identifica o idioma.",
          "<head> guarda metadados e título da aba; <body> contém a página visível."
        ]
      },
      {
        "title": "Metadados",
        "items": [
          "<meta charset=\"UTF-8\"> permite acentuação; viewport orienta a exibição em dispositivos móveis.",
          "<meta name=\"description\"> descreve o conteúdo; <title> é diferente de <h1>.",
          "<link rel=\"stylesheet\"> e <script src=\"...\"> conectam CSS e JS quando seus arquivos estiverem prontos."
        ]
      }
    ]
  },
  {
    "id": "2b-f4",
    "type": "visual-summary",
    "title": "Fundamentos 04 · Cabeçalho, navegação e rodapé",
    "summary": "8h30–8h40 · Estrutura reutilizável",
    "idea": "O cabeçalho e o rodapé serão copiados entre páginas; cada página terá conteúdo próprio dentro de main.",
    "sections": [
      {
        "title": "Cabeçalho",
        "items": [
          "<header> identifica o topo; <nav> agrupa links; <a href> permite navegação.",
          "<div> agrupa elementos; <span> marca parte de um texto. class=\"ativo\" pode ajudar na futura estilização.",
          "Atributo aria-current=\"page\" identifica a página atual."
        ]
      },
      {
        "title": "Conteúdo e rodapé",
        "items": [
          "<main> delimita o conteúdo principal; <section> organiza seções; <article> representa conteúdo independente.",
          "<h1>, <h2>, <h3>, <p>, <ul>, <li> e <strong> organizam títulos, textos, listas e destaques.",
          "<footer> contém informações fixas e links de contato."
        ]
      }
    ]
  },
  {
    "id": "2b-f5",
    "type": "visual-summary",
    "title": "Fundamentos 05 · Pastas e caminhos relativos",
    "summary": "8h40–8h50 · Navegação sem links quebrados",
    "idea": "O endereço de um link depende da pasta onde está o arquivo HTML que o contém.",
    "sections": [
      {
        "title": "EduTech/",
        "items": [
          "Raiz: index.html; pasta pages/: sobre.html, cursos.html, contato.html.",
          "Pastas de apoio na raiz: css/, js/ e imagens/."
        ]
      },
      {
        "title": "No index.html",
        "items": [
          "Use pages/sobre.html, pages/cursos.html e pages/contato.html.",
          "Para recursos na raiz: css/style.css, js/script.js e imagens/foto.jpg."
        ]
      },
      {
        "title": "Dentro de pages/",
        "items": [
          "Use ../index.html para voltar à página inicial; sobre.html, cursos.html e contato.html para navegar entre páginas irmãs.",
          "Para recursos da raiz: ../css/style.css, ../js/script.js e ../imagens/foto.jpg.",
          "O símbolo ../ significa subir um nível de pasta."
        ]
      }
    ]
  },
  {
    "id": "2b-f6",
    "type": "visual-summary",
    "title": "Fundamentos 06 · Comentários e próximos conteúdos",
    "summary": "8h50–9h00 · Organização profissional",
    "idea": "Comentários ajudam a compreender e manter o HTML, mas não escondem informações sensíveis.",
    "sections": [
      {
        "title": "Sintaxe",
        "items": [
          "<!-- INÍCIO DO CABEÇALHO --> e <!-- FIM DO CABEÇALHO --> delimitam blocos.",
          "Comentários não aparecem na página, mas podem ser vistos no código-fonte."
        ]
      },
      {
        "title": "Conteúdos das próximas etapas",
        "items": [
          "index.html: hero e cards com destaques; sobre.html: história, missão e valores.",
          "cursos.html/cardapio.html: artigos, descrições, imagens e preços/carga horária.",
          "contato.html: form, label, input, textarea e button; type, required, placeholder, for e id.",
          "Nesta aula apenas preparar as áreas e títulos: os exemplos completos dos slides serão aplicados ao preencher o conteúdo."
        ]
      }
    ]
  },
  {
    "id": "2b-f7",
    "type": "flashcards",
    "title": "Checkpoint · Revise os fundamentos",
    "summary": "Revisão rápida antes da prática",
    "pairs": [
      [
        "O que HTML, CSS e JavaScript fazem?",
        "HTML estrutura; CSS estiliza; JavaScript acrescenta comportamentos."
      ],
      [
        "Qual a diferença entre head e header?",
        "head contém metadados; header é um cabeçalho visível dentro de body."
      ],
      [
        "Para que serve nav?",
        "Agrupar os links de navegação."
      ],
      [
        "O que significa ../index.html?",
        "Subir uma pasta e abrir index.html."
      ],
      [
        "O que é compartilhado entre páginas?",
        "A estrutura do cabeçalho e do rodapé, copiada e adaptada conforme os caminhos."
      ],
      [
        "Onde entra o conteúdo exclusivo?",
        "Dentro de main, com título e seções próprias de cada página."
      ]
    ]
  },
  {
    "id": "2b-f8",
    "type": "quiz",
    "title": "Checkpoint · Caminhos",
    "question": "Dentro de pages/sobre.html, qual link volta ao index.html da raiz?",
    "options": [
      "index.html",
      "../index.html",
      "pages/index.html"
    ],
    "answer": 1,
    "feedback": "../ sobe de pages/ para a raiz do projeto."
  }
];
export const FUNDAMENTALS=DATA.map(([phase,title,axis,objective])=>({id:`F${phase}`,phase,title,axis,objective,hours:phase===2?1:1.5,steps:phase===2?[{id:"2b-f-infografico",type:"image-review",title:"Aula 4 · Infográfico completo dos Fundamentos HTML5",summary:"Leia o infográfico: estrutura, tags, atributos, caminhos e objetivos. Depois marque Concluir etapa para iniciar a prática.",imageUrl:"assets/infografico-aula4-html5.svg",imageCaption:"Fundamentos da Aula 4 · Todas as tags e seus conceitos · EduTech e Projeto Restaurante"}]:[]}));
export const getFundamental=phase=>FUNDAMENTALS.find(f=>f.phase===Number(phase));
