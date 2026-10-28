import {phaseDescriptions} from "./mission-descriptions.js";
import {MISSION_1B_STEPS} from "./mission-1b-plan.js";
const phaseData=[
[1,"Ambiente Dev e Versionamento","Preparação do EduTech","Preparação do Projeto Restaurante","IDE, organização do projeto, Git e GitHub.",["I1","I6"]],
[2,"Fundamentos de HTML","Estrutura Inicial do EduTech","Estrutura Inicial do Projeto Restaurante","HTML, estrutura do documento, elementos, atributos e organização do conteúdo.",["I2"]],
[3,"HTML Semântico e Navegação","Evolução do EduTech","Evolução do Projeto Restaurante","Semântica, seções, cabeçalho, navegação, links e organização acessível.",["I2"]],
[4,"Formulários HTML","Contato e Cadastro no EduTech","Contato e Cadastro no Projeto Restaurante","Formulários, campos, labels, tipos de entrada e coleta de dados.",["I2","I5"]],
[5,"Fundamentos de CSS","Identidade Visual do EduTech","Identidade Visual do Projeto Restaurante","Seletores, propriedades, cascata, cores, tipografia e identidade visual.",["I3"]],
[6,"Layout e Responsividade","Interfaces do EduTech","Interfaces do Projeto Restaurante","Box model, Flexbox, Grid, media queries e adaptação de interfaces.",["I3","I5"]],
[7,"Fundamentos de JavaScript","Interatividade no EduTech","Interatividade no Projeto Restaurante","Variáveis, tipos, operadores, condições, repetições e funções.",["I2"]],
[8,"DOM e Eventos","Conteúdo Dinâmico no EduTech","Conteúdo Dinâmico no Projeto Restaurante","DOM, seleção de elementos, manipulação de conteúdo e eventos.",["I2","I5"]],
[9,"Validação e Depuração","Formulários do EduTech","Formulários do Projeto Restaurante","Validação, tratamento de erros, console, depuração e testes.",["I2","I5"]],
[10,"Cliente-Servidor e APIs","Integração do EduTech","Integração do Projeto Restaurante","Cliente e servidor, HTTP, JSON, requisições e consumo de APIs.",["I2","I5"]],
[11,"Integração com Banco de Dados","Persistência no EduTech","Persistência no Projeto Restaurante","SGBD, conexão, persistência e recuperação de dados.",["I2","I4","I5"]],
[12,"Autenticação e Controle de Acesso","Usuários do EduTech","Usuários do Projeto Restaurante","Autenticação, autorização, sessão e controle de acesso.",["I2","I4","I5"]],
[13,"CRUD e Testes","Gestão de Dados no EduTech","Gestão de Dados no Projeto Restaurante","Create, Read, Update, Delete, testes e tratamento de erros.",["I2","I4","I5","I6"]],
[14,"Integração e Publicação","Finalização do EduTech","Finalização do Projeto Restaurante","Integração final, revisão, versionamento, documentação e publicação.",["I1","I2","I3","I4","I5","I6"]]
];
const phase1GuidedSteps=[
 {
  "id": "p1-guided-01",
  "type": "guided",
  "title": "01 · Prepare o ambiente de trabalho",
  "summary": "Prática Guiada • 15 min • faça com o instrutor",
  "goal": "Abrir o projeto no VS Code e localizar o terminal.",
  "instructions": [
   "Se precisar instalar as ferramentas, acesse [Visual Studio Code](https://code.visualstudio.com/) e [Git](https://git-scm.com/downloads). Faça a instalação com o instrutor.",
   "No VS Code, abra Arquivo → Abrir Pasta. Em Documentos, crie uma pasta chamada edutech e selecione-a.",
   "No VS Code, abra Terminal → Novo Terminal. Confira se o caminho termina em edutech.",
   "No terminal, execute o comando destacado abaixo para verificar a instalação do Git. Se aparecer um número de versão, está tudo certo."
  ],
  "outcome": "VS Code aberto, terminal na pasta correta e Git reconhecido.",
  "tip": "Se o terminal não mostrar a pasta edutech ou o Git não for reconhecido, peça ajuda antes de continuar.",
  "commands": [
   "git --version"
  ]
 },
 {
  "id": "p1-guided-02",
  "type": "guided",
  "title": "02 · Organize a estrutura do EduTech",
  "summary": "Prática Guiada • 15 min • faça com o instrutor",
  "goal": "Criar arquivos e pastas antes de iniciar o versionamento.",
  "instructions": [
   "No VS Code, abra o Explorador (primeiro ícone à esquerda) e crie index.html dentro da pasta edutech.",
   "No Explorador, crie as pastas css, js e assets. Dentro de assets, crie images.",
   "No Explorador, crie style.css dentro de css, app.js dentro de js e .gitkeep dentro de assets/images.",
   "No Explorador, abra index.html. Copie o exemplo de HTML destacado abaixo, cole no arquivo e salve com Ctrl+S.",
   "No VS Code, abra style.css, escreva /* Estilos do EduTech */ e salve. Em app.js, escreva // Interações do EduTech e salve."
  ],
  "outcome": "No Explorador: index.html, css/style.css, js/app.js e assets/images/.gitkeep.",
  "code": "<!DOCTYPE html>\n<html lang=\"pt-BR\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>EduTech</title>\n</head>\n<body>\n  <h1>Meu EduTech</h1>\n</body>\n</html>",
  "tip": "Hoje o foco é organizar arquivos. Não é necessário compreender todas as tags HTML nesta aula.",
  "commands": []
 },
 {
  "id": "p1-guided-03",
  "type": "guided",
  "title": "03 · Ative o Git no computador",
  "summary": "Prática Guiada • 10 min • faça com o instrutor",
  "goal": "Transformar a pasta do EduTech em um repositório local.",
  "instructions": [
   "No VS Code, abra o terminal e confirme que o caminho termina em edutech.",
   "No terminal, execute os comandos destacados abaixo, um de cada vez. O primeiro inicia o repositório local e o segundo mostra os arquivos ainda não registrados.",
   "No terminal, confira seu nome e e-mail usando os comandos de configuração destacados abaixo. Se algum resultado estiver vazio, peça ajuda ao instrutor antes do primeiro commit."
  ],
  "outcome": "O terminal reconhece um repositório Git e mostra o estado dos arquivos.",
  "tip": "git init cria o repositório somente no computador. Ainda não envia nada para o GitHub.",
  "commands": [
   "git init",
   "git status",
   "git config --global user.name",
   "git config --global user.email"
  ]
 },
 {
  "id": "p1-guided-04",
  "type": "guided",
  "title": "04 · Registre sua primeira versão",
  "summary": "Prática Guiada • 20 min • faça com o instrutor",
  "goal": "Criar um commit local antes de enviar ao GitHub.",
  "instructions": [
   "No terminal, execute os comandos destacados abaixo na ordem apresentada.",
   "Após o primeiro status, observe os arquivos novos. Depois do add, confira se aparecem em Changes to be committed.",
   "Após o commit, confira no log o código curto e a mensagem da versão registrada no computador."
  ],
  "outcome": "O Git mostra um commit com a mensagem escolhida.",
  "tip": "Salvar o arquivo e criar um commit são ações diferentes. O commit registra uma versão no histórico do Git.",
  "commands": [
   "git status",
   "git add .",
   "git status",
   "git commit -m \"Criar estrutura inicial do EduTech\"",
   "git log -1 --oneline"
  ]
 },
 {
  "id": "p1-guided-05",
  "type": "guided",
  "title": "05 · Crie o repositório no GitHub",
  "summary": "Prática Guiada • 15 min • faça com o instrutor",
  "goal": "Preparar um local online para receber o projeto.",
  "instructions": [
   "No navegador, abra [Criar repositório no GitHub](https://github.com/new) e entre na sua conta.",
   "No GitHub, em Repository name, digite edutech ou o nome combinado com o instrutor.",
   "Na mesma página, deixe desmarcada a opção Add a README file; mantenha .gitignore e licença como None.",
   "No GitHub, clique em Create repository e copie a URL HTTPS do seu repositório. Cada estudante tem um endereço diferente."
  ],
  "outcome": "Repositório remoto vazio criado e endereço HTTPS copiado.",
  "tip": "O repositório deve começar vazio para evitar conflitos no primeiro envio. Não marque a criação automática de README."
 },
 {
  "id": "p1-guided-06",
  "type": "guided",
  "title": "06 · Conecte o Git ao GitHub",
  "summary": "Prática Guiada • 10 min • faça com o instrutor",
  "goal": "Vincular o repositório local ao remoto.",
  "instructions": [
   "No terminal do VS Code, copie o primeiro comando destacado abaixo e substitua a URL de exemplo pelo endereço HTTPS do seu repositório.",
   "No terminal, execute o segundo comando e confira se origin aponta para o seu GitHub.",
   "Se aparecer origin already exists ou o endereço estiver incorreto, peça ajuda antes de continuar."
  ],
  "outcome": "O terminal mostra o endereço remoto correto.",
  "tip": "Cada estudante deve utilizar a URL do próprio repositório, nunca a URL de exemplo.",
  "commands": [
   "git remote add origin https://github.com/seu-usuario/edutech.git",
   "git remote -v"
  ]
 },
 {
  "id": "p1-guided-07",
  "type": "guided",
  "title": "07 · Publique o primeiro commit",
  "summary": "Prática Guiada • 15 min • faça com o instrutor",
  "goal": "Enviar ao GitHub a versão que você registrou.",
  "instructions": [
   "No terminal, execute os dois comandos destacados abaixo, na ordem apresentada. O primeiro define main como branch principal; o segundo envia seu commit ao GitHub.",
   "Se o GitHub solicitar login, siga as instruções no navegador com o instrutor. Nunca compartilhe senhas ou tokens.",
   "No navegador, abra seu repositório do GitHub, atualize a página e confira os arquivos e o primeiro commit."
  ],
  "outcome": "O repositório online mostra os arquivos do EduTech e o commit.",
  "tip": "Não compartilhe senhas nem tokens. Se a autenticação falhar, solicite apoio.",
  "commands": [
   "git branch -M main",
   "git push -u origin main"
  ]
 },
 {
  "id": "p1-guided-08",
  "type": "guided",
  "title": "08 · Faça uma mudança e sincronize",
  "summary": "Prática Guiada • 20 min • faça com o instrutor",
  "goal": "Repetir o fluxo para entender o trabalho cotidiano.",
  "instructions": [
   "No VS Code, abra index.html. Substitua Meu EduTech por Meu primeiro projeto EduTech e salve com Ctrl+S.",
   "No terminal, execute os comandos destacados abaixo na ordem apresentada. Observe a alteração no status, registre a segunda versão e envie-a ao GitHub.",
   "No navegador, atualize seu repositório do GitHub e confira se a mensagem Atualizar página inicial aparece no histórico."
  ],
  "outcome": "O histórico no GitHub mostra pelo menos dois commits.",
  "tip": "Não repita git init nem git remote add origin a cada alteração. Agora o fluxo é salvar, status, add, commit e push.",
  "commands": [
   "git status",
   "git add .",
   "git commit -m \"Atualizar página inicial\"",
   "git push"
  ]
 },
 {
  "id": "p1-guided-support",
  "type": "content",
  "title": "🛠️ Precisa de ajuda?",
  "summary": "Consulte apenas se algo não funcionar. Não é uma etapa obrigatória.",
  "body": [
   "Git não reconhecido? Reabra o VS Code após instalar o Git e peça apoio.",
   "O commit pede nome ou e-mail? Volte à etapa 3 e configure sua identidade com o instrutor.",
   "O GitHub já tem um README ou o push foi rejeitado? Não use --force; confira git status e peça orientação.",
   "O login falhou? Use a autenticação pelo navegador. Não compartilhe senhas ou tokens.",
   "Não terminou? Registre no relatório até onde chegou e qual dificuldade apareceu."
  ]
 },
 {
  "id": "p1-report",
  "type": "evidence",
  "title": "Relatório Individual · Minha primeira versão do EduTech",
  "summary": "30 min • registre o que fez, as evidências e o que precisa revisar.",
  "fields": [
   "O que você conseguiu preparar no VS Code?",
   "Cole o link do seu repositório GitHub. Se não publicou, diga em qual etapa parou.",
   "Você conseguiu criar os arquivos, fazer commit e enviar com push?",
   "Qual comando foi mais fácil? Qual foi mais difícil?",
   "Com suas palavras, qual é a diferença entre commit e push?",
   "Você conseguiria repetir status → add → commit → push sozinho, com ajuda ou precisa revisar?"
  ]
 }
];

const EDUTECH_SELF_REVIEW_FIELDS=[
 {type:"cards",label:"Como foi sua participação nesta prática?",options:[{emoji:"🚀",label:"Participei ativamente"},{emoji:"🤝",label:"Participei com orientação"},{emoji:"🌱",label:"Participei parcialmente"}]},
 {type:"scale",label:"Quanto você confia na sua capacidade de aplicar o que aprendeu?",minLabel:"Ainda preciso praticar",maxLabel:"Consigo fazer sozinho"},
 {type:"checklist",label:"O que você conseguiu desenvolver?",options:["Compreendi os conceitos apresentados","Acompanhei e realizei a prática guiada","Consegui aplicar o que aprendi","Testei e conferi meu resultado","Identifiquei algo que preciso melhorar"]},
 {type:"radio",label:"Como você lidou com as dificuldades?",options:["Resolvi pesquisando ou tentando novamente","Precisei de orientação para avançar","Ainda tenho dúvidas que preciso esclarecer","Não encontrei dificuldades significativas"]},
 {type:"short",label:"Qual foi sua principal conquista ou aprendizado? (uma ou duas frases)"},
 {type:"url",label:"Link de uma evidência do que você realizou"}
];
const edutechSelfReview=(p)=>({id:`p${p}-report`,type:"evidence",title:"Minha evolução na EduTech — Autoavaliação Individual",summary:"Avalie sua participação, confiança e aprendizagem e apresente uma evidência real.",answerKey:`p${p}-report::edutech-self-review-v2`,fields:EDUTECH_SELF_REVIEW_FIELDS});
const guidedSteps=(p,topic,sub)=>p===1?phase1GuidedSteps:[
{id:`p${p}-guided`,type:"guided",title:`Prática Guiada EduTech — ${sub}`,summary:"Faça junto com o instrutor no projeto real, usando o VS Code.",instructions:[`Abra o projeto EduTech no VS Code e localize onde a evolução ${sub} será implementada.`,`Acompanhe a demonstração do instrutor e implemente ${topic} no seu próprio projeto.`,"Relacione a implementação aos requisitos exibidos no briefing desta missão.","Execute e teste o resultado antes de prosseguir.","Revise o que mudou e registre a evolução com Git/GitHub quando pertinente à etapa."]},
edutechSelfReview(p)
];
const phase1GuildSteps=[
{id:"g1-brief",type:"content",title:"Briefing da Guilda — Projeto Restaurante",summary:"Prepare a base colaborativa do projeto da equipe.",body:["A Guilda começará o Projeto Restaurante criando uma base de trabalho compartilhada. Nesta fase, o foco é organização, responsabilidades e versionamento — ainda não é necessário construir a interface do restaurante.","A contribuição de cada integrante deve permanecer identificável no histórico do repositório."]},
{id:"g1-plan",type:"guided",title:"Missão da Guilda — Preparação do Projeto Restaurante",summary:"Organize equipe, repositório e fluxo inicial de colaboração.",instructions:["Confirme os integrantes e o líder da Guilda na Web Academy.","Definam as funções iniciais do projeto; elas poderão evoluir durante a UC.","Definam o nome do restaurante e uma descrição curta da proposta.","Criem ou escolham o repositório GitHub oficial da Guilda e registrem o link na plataforma.","Criem um README.md com nome do projeto, objetivo e integrantes.","Distribuam as tarefas desta preparação no Quadro de Missões.","Cada integrante deve realizar uma contribuição identificável e versionada quando a organização do repositório permitir.","Confiram se o repositório remoto representa corretamente a versão atual do projeto."]},
{id:"g1-check",type:"checkpoint",title:"Checklist da Guilda",summary:"Antes da evidência, verifique a preparação da equipe.",question:"A Guilda possui equipe definida, repositório oficial, README e organização inicial das responsabilidades?",options:["Sim, todos os itens foram conferidos","Há um item que ainda precisa de ajuste","A preparação ainda não está concluída"]},
{id:"g1-evidence",type:"evidence",title:"Evidência da Missão",summary:"Registre o resultado coletivo e sua participação.",fields:["Link do repositório oficial do Projeto Restaurante","Descreva o que a Guilda organizou e entregou nesta fase","Informe sua contribuição individual e, quando houver, o commit relacionado"]}
];
const guildSteps=(p,topic,sub,axis)=>p===1?phase1GuildSteps:[
{id:`g${p}-brief`,type:"content",title:"Briefing da Guilda",summary:`Projeto Restaurante — ${sub}.`,body:[`A Guilda deverá aplicar de forma autônoma os conhecimentos de ${axis}`,"Organizem as responsabilidades antes de alterar o projeto. A contribuição individual de cada integrante deve permanecer identificável."]},
{id:`g${p}-mission`,type:"guided",title:`Missão da Guilda — ${sub}`,summary:"Planeje, desenvolva, teste e versione em equipe.",instructions:["Revise os requisitos da fase no Projeto Restaurante.","Distribua tarefas no Quadro de Missões entre os integrantes.","Implemente a evolução prevista para esta fase.","Teste o que foi desenvolvido e corrija problemas encontrados.","Registre commits e evidências de forma que a contribuição individual possa ser acompanhada."]},
{id:`g${p}-evidence`,type:"evidence",title:"Evidência da Missão",summary:"Registre o resultado e sua contribuição individual.",fields:["Link do repositório, commit ou evidência","O que a Guilda entregou nesta fase?","Qual foi sua contribuição individual?"]}
];
const phaseRequirementMap={
1:{edutech:["RNF04"],restaurante:["RNF04"]},
2:{edutech:["RF01"],restaurante:["RF01"]},
3:{edutech:["RF01","RNF03"],restaurante:["RF01","RNF03"]},
4:{edutech:["RF03"],restaurante:["RF03"]},
5:{edutech:["RF01","RF02","RNF02"],restaurante:["RF01","RF02","RNF02"]},
6:{edutech:["RNF01","RNF02"],restaurante:["RNF01","RNF02"]},
7:{edutech:["RF04"],restaurante:["RF04"]},
8:{edutech:["RF02","RF04"],restaurante:["RF02","RF04"]},
9:{edutech:["RF03","RF05"],restaurante:["RF03","RF05"]},
10:{edutech:["RF06"],restaurante:["RF06"]},
11:{edutech:["RF07"],restaurante:["RF07"]},
12:{edutech:["RF08","RF09","RNF05"],restaurante:["RF08","RF09","RNF05"]},
13:{edutech:["RF07","RF09","RF10"],restaurante:["RF07","RF09","RF10"]},
14:{edutech:["RF01","RF02","RF03","RF04","RF05","RF06","RF07","RF08","RF09","RF10","RNF01","RNF02","RNF03","RNF04","RNF05","RNF06","RNF07","RNF08"],restaurante:["RF01","RF02","RF03","RF04","RF05","RF06","RF07","RF08","RF09","RF10","RNF01","RNF02","RNF03","RNF04","RNF05","RNF06","RNF07","RNF08"]}
};
// IDs internos permanecem estáveis para preservar entregas, avaliações e vínculos.
// A sequência pedagógica da turma tem três encontros no primeiro ciclo.
const originalMissions=phaseData.flatMap(([phase,topic,a,b,axis,competencies])=>[
{id:`${phase}A`,number:(phase-1)*2+1,lesson:(phase-1)*2+1,phase,type:"training",title:topic,subtitle:phaseDescriptions[phase-1]?.[0]||a,project:"edutech",hours:4,structure:[{kind:"fundamentals",label:"Fundamentos",hours:1.5},{kind:"guided",label:"Prática Guiada EduTech",hours:2},{kind:"report",label:"Relatório Individual",hours:.5}],competencies,requirements:phaseRequirementMap[phase].edutech,steps:[]},
{id:`${phase}B`,number:(phase-1)*2+2,lesson:(phase-1)*2+2,phase,type:"guild",title:topic,subtitle:phaseDescriptions[phase-1]?.[1]||b,project:"restaurante",hours:4,structure:[{kind:"guild",label:"Missão da Guilda",hours:4}],competencies,requirements:phaseRequirementMap[phase].restaurante,steps:phase===1?structuredClone(MISSION_1B_STEPS):[]}
]);
// Aula 4 presencial (08h–12h): fundamentos antes do desafio autônomo da Guilda.
const MISSION_2B_STEPS=[
  {
    "id": "a4-guia-1",
    "type": "guided",
    "title": "Prática guiada 1 · Index da EduTech",
    "summary": "Faça junto com o instrutor: somente cabeçalho, menu e rodapé.",
    "goal": "Criar a estrutura-base de index.html, deixando main vazio para a próxima aula.",
    "instructions": [
      "Crie a pasta EduTech e o arquivo index.html na raiz.",
      "Digite a estrutura HTML5 com head e body.",
      "No body, crie header com nome EduTech e nav com os links Início, Sobre, Cursos e Contato.",
      "Deixe <main></main> vazio: NÃO inclua hero, títulos, textos, cards ou formulário agora.",
      "Adicione footer com identificação e link de contato.",
      "Salve e abra o index no navegador; as páginas internas serão criadas no próximo passo."
    ],
    "code": "<!DOCTYPE html>\n<html lang=\"pt-BR\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Início | EduTech</title>\n</head>\n<body>\n  <!-- Cabeçalho comum a todas as páginas -->\n  <header>\n    <div class=\"logo\"><a href=\"index.html\">EduTech</a></div>\n    <nav aria-label=\"Menu principal\">\n      <a href=\"index.html\" aria-current=\"page\">Início</a>\n      <a href=\"pages/sobre.html\">Sobre</a>\n      <a href=\"pages/cursos.html\">Cursos</a>\n      <a href=\"pages/contato.html\">Contato</a>\n    </nav>\n  </header>\n\n  <!-- Conteúdo será construído na próxima aula -->\n  <main></main>\n\n  <!-- Rodapé comum a todas as páginas -->\n  <footer>\n    <p>&copy; 2026 EduTech.</p>\n    <p><a href=\"pages/contato.html\">Contato</a></p>\n  </footer>\n</body>\n</html>",
    "tip": "Não antecipe o conteúdo de main. Nesta aula a entrega é o esqueleto compartilhado da página.",
    "outcome": "O index.html apresenta apenas cabeçalho, menu e rodapé, com main vazio."
  },
  {
    "id": "a4-guia-2",
    "type": "guided",
    "title": "Prática guiada 2 · Replique em pages/",
    "summary": "Duplique a estrutura e corrija os caminhos relativos.",
    "goal": "Criar sobre.html, cursos.html e contato.html sem preencher o conteúdo.",
    "instructions": [
      "Crie a pasta pages/ dentro de EduTech.",
      "Copie index.html para pages/sobre.html, pages/cursos.html e pages/contato.html.",
      "Em cada arquivo, atualize o title da aba para Sobre | EduTech, Cursos | EduTech ou Contato | EduTech.",
      "Nas páginas internas, altere o menu: Início aponta para ../index.html; os outros links apontam para sobre.html, cursos.html e contato.html.",
      "Atualize o href do rodapé para contato.html e ajuste aria-current=\"page\" no link correspondente.",
      "Mantenha <main></main> vazio em todas as páginas.",
      "Teste o menu saindo do index, navegando entre páginas e voltando à raiz."
    ],
    "code": "<!-- Exemplo de navegação dentro de pages/sobre.html -->\n<nav aria-label=\"Menu principal\">\n  <a href=\"../index.html\">Início</a>\n  <a href=\"sobre.html\" aria-current=\"page\">Sobre</a>\n  <a href=\"cursos.html\">Cursos</a>\n  <a href=\"contato.html\">Contato</a>\n</nav>\n<main></main>\n<footer><p>&copy; 2026 EduTech.</p><a href=\"contato.html\">Contato</a></footer>",
    "tip": "O ../ volta uma pasta. O cabeçalho e o rodapé são copiados, não atualizados automaticamente.",
    "outcome": "Quatro páginas HTML da EduTech navegáveis, todas com main vazio."
  },
  {
    "id": "a4-guia-3",
    "type": "guided",
    "title": "Prática guiada 3 · Teste a estrutura",
    "summary": "Confira os links antes de começar o projeto da Guilda.",
    "goal": "Verificar a navegação e a organização dos arquivos.",
    "instructions": [
      "Confira que index.html está na raiz e as outras três páginas estão em pages/.",
      "Teste todos os links do cabeçalho e rodapé, inclusive o retorno à página inicial.",
      "Confira o title de cada arquivo e a indicação aria-current no menu.",
      "Confirme que todos os main permanecem vazios e que não foi exigido CSS ou JavaScript.",
      "Se houver erro, revise os href relativos e o nome do arquivo."
    ],
    "code": "EduTech/\n├── index.html\n├── pages/\n│   ├── sobre.html\n│   ├── cursos.html\n│   └── contato.html\n├── css/\n├── js/\n└── imagens/",
    "tip": "As pastas de recursos podem ficar vazias por enquanto.",
    "outcome": "Estrutura-base pronta para receber o conteúdo na próxima aula."
  },
  {
    "id": "2b-p4",
    "type": "visual-summary",
    "title": "Prática autônoma · Desafio da Guilda",
    "summary": "10h15–11h25 · Projeto Restaurante",
    "idea": "Agora a Guilda replica a estrutura HTML construída com a EduTech. Nesta aula, main permanece vazio em todas as páginas.",
    "sections": [
      {
        "title": "Organização no Kanban",
        "items": [
          "O líder distribui as tarefas e cada integrante registra sua contribuição.",
          "Todos devem compreender os caminhos relativos entre a raiz e pages/."
        ]
      },
      {
        "title": "Arquivos obrigatórios",
        "items": [
          "ProjetoRestaurante/index.html na raiz.",
          "ProjetoRestaurante/pages/sobre.html, cardapio.html e contato.html.",
          "Em todas as páginas: head com title, header com menu, <main></main> vazio e footer compartilhado."
        ]
      },
      {
        "title": "Navegação e entrega",
        "items": [
          "No index, links para pages/sobre.html, pages/cardapio.html e pages/contato.html.",
          "Dentro de pages/, ../index.html retorna à raiz e os links entre páginas não precisam do prefixo pages/.",
          "Não preencher cardápio, apresentação, formulários, CSS ou JS ainda. Testar todos os links e registrar evidências."
        ]
      }
    ]
  },
  {
    "id": "2b-p5",
    "type": "guided",
    "title": "Desafio diagnóstico · Conserte os links",
    "summary": "Teste dos caminhos relativos antes da entrega",
    "goal": "Corrigir os caminhos errados de uma página interna.",
    "instructions": [
      "Imagine que este menu está dentro de pages/cardapio.html.",
      "Identifique por que os links para Início e Contato estão incorretos.",
      "Corrija para ../index.html e contato.html, respectivamente.",
      "Confirme no navegador antes de registrar a entrega."
    ],
    "code": "<!-- ERRADO em pages/cardapio.html -->\n<a href=\"index.html\">Início</a>\n<a href=\"pages/contato.html\">Contato</a>\n\n<!-- CORRETO em pages/cardapio.html -->\n<a href=\"../index.html\">Início</a>\n<a href=\"contato.html\">Contato</a>",
    "tip": "O navegador resolve os caminhos a partir do arquivo HTML atual.",
    "outcome": "Você consegue explicar e corrigir caminhos relativos."
  },
  {
    "id": "2b-p6",
    "type": "visual-summary",
    "title": "Entrega · GitHub e evidências individuais",
    "summary": "11h35–11h50 · Consolide o trabalho",
    "idea": "Entregar a estrutura navegável e demonstrar a participação de cada integrante.",
    "sections": [
      {
        "title": "Checklist da Guilda",
        "items": [
          "Quatro arquivos HTML: index na raiz e os outros em pages/.",
          "Cabeçalho, navegação e rodapé em todos os arquivos; main vazio.",
          "Links testados em ambos os sentidos e títulos das abas adaptados."
        ]
      },
      {
        "title": "Evidências",
        "items": [
          "Registre commits no repositório do projeto e indique o link da versão.",
          "Cada estudante registra no Kanban a tarefa, os arquivos modificados, a contribuição e evidências.",
          "Se houver dificuldades, registre o problema e a tentativa de solução para receber orientação."
        ]
      }
    ]
  }
];
// Regularização das três aulas já ministradas: registros curtos, sem repetição obrigatória da prática.
const retrospectiveSteps=[
[
{id:"retro-1-overview",type:"visual-summary",title:"Aula 1 · Revisão guiada",summary:"Cinco conceitos essenciais, em uma sequência simples.",idea:"Da pasta no computador à colaboração no GitHub: cada ferramenta tem uma função.",sections:[
{title:"1 · Organize primeiro no Windows",items:["No Explorador de Arquivos, abra Documentos e crie Projeto EduTech.","Dentro dela, organize CSS/style.css, JS/function1.js, PAGES/page1.html e index.html na raiz.","Pastas organizam; arquivos guardam o conteúdo e o código."]},
{title:"2 · Abra a pasta no VS Code",items:["Use File → Open Folder e selecione Projeto EduTech.","Se estiver configurado, abra o CMD nessa pasta e execute code .","O VS Code edita o projeto; não substitui a organização das pastas."]},
{title:"3 · Entenda o Git",items:["git init inicia o controle de versões; git status mostra alterações.","git add . prepara os arquivos; git commit -m \"mensagem\" registra uma versão local.","Fazer commit não envia os arquivos automaticamente ao GitHub."]},
{title:"4 · Publique no GitHub",items:["Git é a ferramenta de versionamento; GitHub é a plataforma que hospeda repositórios.","Depois de conectar o repositório remoto, git push envia os commits.","Assim, o projeto pode ser compartilhado e acompanhado."]},
{title:"5 · Colabore com o professor",items:["Clone o repositório para obter uma cópia.","Crie o arquivo NOME.md e trabalhe na branch individual.","Envie a contribuição com push e abra um pull request para revisão."]}
]},
{id:"retro-1-flashcards",type:"match-cards",title:"Flashcards · Você lembra?",summary:"Clique em cada cartão para revelar a resposta. Revise os conceitos antes dos checkpoints.",pairs:[
["Pasta ou arquivo?","Pasta organiza os itens; arquivo guarda conteúdo ou código."],
["Para que serve o VS Code?","Para abrir a pasta do projeto e editar seus arquivos."],
["O que faz o Git?","Controla as versões e o histórico de alterações do projeto."],
["O que faz um commit?","Registra uma versão das alterações no repositório local."],
["GitHub e git push","GitHub hospeda o repositório; git push envia os commits."],
["Para que serve um pull request?","Para propor uma contribuição e solicitar sua revisão."]
]},
{id:"retro-1-q1",type:"quiz",title:"1 · Organização do projeto",question:"Antes de iniciar o Git, o que devemos organizar?",options:["A pasta principal e os arquivos do projeto","Um pull request no GitHub","Um banco de dados"],answer:0,feedback:"Primeiro organizamos a pasta do projeto e seus arquivos."},
{id:"retro-1-q2",type:"quiz",title:"2 · Git e GitHub",question:"Qual alternativa diferencia Git e GitHub?",options:["Git registra versões; GitHub hospeda repositórios","GitHub substitui o VS Code","Git só funciona na internet"],answer:0,feedback:"Git funciona localmente; GitHub é um serviço remoto."},
{id:"retro-1-q3",type:"quiz",title:"3 · Colaboração",question:"Para sugerir uma alteração feita em uma branch ao repositório do professor, o que foi aberto?",options:["Pull request","git init","Uma pasta de imagens"],answer:0,feedback:"O pull request permite propor e revisar alterações antes da integração."},
{id:"retro-1-evidence",type:"evidence",title:"Registro da Aula 1",summary:"Conte o que já fez; não é necessário repetir a prática.",fields:["Link do repositório individual do Projeto X, se disponível.","Quais atividades realizou: pastas/arquivos, Git, commit, push, clone, arquivo NOME.md, branch e pull request? Indique as pendentes.","Link do pull request ou outra evidência, se houver; se não tiver, explique brevemente."]}
],
[
{id:"retro-2-overview",type:"content",title:"Aula 2 · Retomada e aprofundamento",summary:"Continuação da Aula 1 no projeto TechEduca.",body:["Revise os dois infográficos utilizados em sala: panorama da UC7 e introdução ao Git e GitHub.","A aula retomou a sequência da primeira aula, com explicações mais detalhadas e prática guiada na TechEduca. Não houve prática coletiva obrigatória na Projeto Restaurante.","Registre o que já realizou e indique dificuldades ou pendências. Não é preciso criar outro repositório caso já esteja cadastrado."]},
{id:"retro-2-flashcards",type:"flashcards",title:"Flashcards · Retomada TechEduca",summary:"Revele cada resposta para revisar antes dos checkpoints.",pairs:[["Qual arquivo abre a página principal?","Normalmente index.html, na raiz do projeto."],["Para que serve o CSS?","Definir a aparência e o estilo da página."],["Qual é a função do JavaScript?","Adicionar comportamentos e interações."],["O que faz git status?","Mostra as alterações e o estado do repositório."],["Commit e push são iguais?","Não. Commit registra localmente; push envia ao remoto."],["O que é a prática TechEduca?","Atividade individual guiada, retomando os fundamentos."]]},
{id:"retro-2-q1",type:"quiz",title:"1 · Estrutura",question:"Em qual arquivo normalmente fica o conteúdo inicial da página web?",options:["index.html","style.css","app.js"],answer:0,feedback:"O index.html costuma ser a entrada da página."},
{id:"retro-2-q2",type:"quiz",title:"2 · Versionamento",question:"Qual comando registra uma versão local depois de preparar as alterações?",options:["git commit","git clone","git pull"],answer:0,feedback:"O commit registra uma versão no histórico local."},
{id:"retro-2-q3",type:"quiz",title:"3 · Publicação",question:"Qual comando envia commits locais para o remoto configurado?",options:["git push","git status","git init"],answer:0,feedback:"O push envia commits para o repositório remoto."},
{id:"retro-2-evidence",type:"evidence",title:"Registro da Aula 2",summary:"Aproveite o repositório TechEduca já cadastrado.",fields:["O link do repositório TechEduca já está cadastrado? Se não, informe o link disponível ou explique.","Quais partes da prática guiada você realizou ou retomou?","O que compreendeu melhor nesta aula e o que ainda precisa revisar?"]}
],
[
{id:"retro-3-overview",type:"content",title:"Aula 3 · Organização da Guilda Projeto Restaurante",summary:"Primeiro registro do projeto colaborativo.",body:["A turma conheceu a WEB-Academy, consultou o cronograma, criou grupos e cadastrou links dos repositórios.","O líder iniciou o repositório da Projeto Restaurante e a equipe começou a distribuir responsabilidades no Kanban.","Não foram exigidas branches ou pull requests individuais nesta aula. Aproveite os dados já cadastrados na plataforma."]},
{id:"retro-3-flashcards",type:"flashcards",title:"Flashcards · Guilda Projeto Restaurante",summary:"Revise os papéis e a colaboração antes das perguntas.",pairs:[["O que é uma Guilda?","Equipe que colabora no mesmo projeto Projeto Restaurante."],["Qual o papel do líder?","Organizar a equipe e distribuir as responsabilidades."],["Para que serve o Kanban?","Visualizar tarefas, responsáveis e andamento."],["Quem registra a contribuição?","Cada integrante registra o que realizou e suas evidências."],["Qual projeto é coletivo?","Projeto Restaurante; TechEduca é a prática individual."],["É obrigatório criar um PR individual nessa aula?","Não. A aula tratou da organização inicial da equipe."]]},
{id:"retro-3-q1",type:"quiz",title:"1 · Organização",question:"Para que serve o Kanban da equipe?",options:["Distribuir e acompanhar tarefas","Substituir o Git","Criar automaticamente o site"],answer:0,feedback:"O Kanban ajuda a organizar responsáveis e andamento."},
{id:"retro-3-q2",type:"quiz",title:"2 · Repositório",question:"Quem ficou responsável por publicar inicialmente o projeto Projeto Restaurante?",options:["O líder da equipe","Cada integrante em uma branch obrigatória","Somente o instrutor"],answer:0,feedback:"Nesta aula o líder realizou a publicação inicial."},
{id:"retro-3-q3",type:"quiz",title:"3 · Contribuição",question:"Como demonstrar a participação individual na equipe?",options:["Registrar tarefas e contribuições no Kanban","Apenas informar o nome do grupo","Criar outro grupo"],answer:0,feedback:"O registro das tarefas ajuda a identificar a contribuição de cada integrante."},
{id:"retro-3-evidence",type:"evidence",title:"Registro da Aula 3",summary:"Não duplique cadastros já realizados.",fields:["Qual é sua Guilda na WEB-Academy?","O repositório Projeto Restaurante já foi cadastrado? Se não, informe a situação.","Qual responsabilidade foi combinada para você ou quais tarefas foram registradas no Kanban?","O que a equipe já conseguiu organizar e o que ficou pendente?"]}
]
];
const MISSION_3A_STEPS=[
 {
  "id": "3a-g1",
  "type": "guided",
  "title": "Prática 1 · Preparar o projeto (10 min)",
  "summary": "Prática guiada · construa, salve e teste no navegador",
  "goal": "Preservar a estrutura desenvolvida anteriormente.",
  "instructions": [
   "Abra o repositório TechEduca no VS Code.",
   "Localize index.html na raiz e sobre.html e cursos.html na pasta pages/.",
   "Identifique header, nav, main e footer. Não recrie nem apague o cabeçalho e o rodapé.",
   "Confirme os caminhos de navegação já existentes e salve o trabalho antes de modificar."
  ],
  "code": "<!-- Estrutura existente: preserve as regiões -->\n<header>...</header>\n<main>\n  <!-- Novo conteúdo será inserido aqui -->\n</main>\n<footer>...</footer>",
  "tip": "Os três protótipos são referência visual. Nesta missão, implemente o HTML, não o CSS.",
  "outcome": "Arquivos existentes localizados, estrutura preservada.",
  "xp": 0
 },
 {
  "id": "3a-g2",
  "type": "guided",
  "title": "Prática 2 · Início: apresentação (15 min)",
  "summary": "Prática guiada · construa, salve e teste no navegador",
  "goal": "Construir a seção principal da página Início conforme o primeiro protótipo.",
  "instructions": [
   "Abra index.html e localize o main vazio.",
   "Insira a seção hero com o título principal, os dois parágrafos e os links Fazer Login e Fale conosco.",
   "Ajuste os links para pages/login.html e pages/contato.html, conforme os arquivos existentes. Não crie a funcionalidade de login.",
   "Salve e abra index.html no navegador. Verifique o texto, mesmo sem CSS."
  ],
  "code": "<!-- Apresentação principal da TechEduca -->\n<section class=\"hero\">\n  <h1>Formação em Tecnologia para o mercado real</h1>\n  <p>Aprenda desenvolvimento web, lógica e banco de dados</p>\n  <p>Para visualizar os cursos, é necessário fazer login</p>\n  <a href=\"pages/login.html\">Fazer Login</a>\n  <a href=\"pages/contato.html\">Fale conosco</a>\n</section>",
  "tip": "Insira este código DENTRO do main existente. O caminho de Login só será funcional se a página correspondente existir.",
  "outcome": "A apresentação aparece na página Início.",
  "xp": 0
 },
 {
  "id": "3a-g3",
  "type": "guided",
  "title": "Prática 3 · Início: três diferenciais (15 min)",
  "summary": "Prática guiada · construa, salve e teste no navegador",
  "goal": "Reproduzir os três blocos de diferenciais do primeiro protótipo.",
  "instructions": [
   "Abaixo da hero, ainda dentro de main, adicione a seção diferenciais.",
   "Crie um h2 e três article com h3 e p.",
   "Confira os textos Projetos Reais, Material Didático e Suporte do Instrutor.",
   "Salve e teste: os artigos podem aparecer empilhados até a aula de CSS."
  ],
  "code": "<!-- Diferenciais da TechEduca -->\n<section class=\"diferenciais\">\n  <h2>Por que estudar na TechEduca?</h2>\n  <article><h3>Projetos Reais</h3><p>Você desenvolve sites com base em situações profissionais</p></article>\n  <article><h3>Material Didático</h3><p>Conteúdos e exercícios práticos</p></article>\n  <article><h3>Suporte do Instrutor</h3><p>Acompanhamento durante todo o processo</p></article>\n</section>",
  "tip": "section organiza o assunto; cada article apresenta um diferencial independente.",
  "outcome": "A página Início possui hero e três diferenciais.",
  "xp": 0
 },
 {
  "id": "3a-g4",
  "type": "guided",
  "title": "Prática 4 · Sobre: apresentação, quem somos e missão (15 min)",
  "summary": "Prática guiada · construa, salve e teste no navegador",
  "goal": "Criar as três primeiras partes do segundo protótipo.",
  "instructions": [
   "Abra pages/sobre.html e mantenha header, nav e footer.",
   "Dentro do main, insira a apresentação com h1 e parágrafo.",
   "Adicione as seções Quem somos e Nossa missão com h2 e p.",
   "Salve e teste no navegador."
  ],
  "code": "<!-- Conteúdo de pages/sobre.html: dentro do main existente -->\n<section class=\"apresentacao\">\n  <h1>Sobre a TechEduca</h1>\n  <p>Uma escola de tecnologia com foco em formação prática, metodologias atuais e compromisso com o crescimento profissional.</p>\n</section>\n<section class=\"quem-somos\">\n  <h2>Quem somos</h2>\n  <p>A TechEduca é uma escola de tecnologia focada em formação prática e desenvolvimento de competências para o mercado.</p>\n</section>\n<section class=\"missao\">\n  <h2>Nossa missão</h2>\n  <p>Transformar vidas por meio da educação tecnológica, entregando conteúdo acessível, dinâmico e alinhado com as demandas reais do mercado.</p>\n</section>",
  "tip": "Não crie outro main: use o que já existe em sobre.html.",
  "outcome": "Página Sobre apresenta a identidade e a missão da TechEduca.",
  "xp": 0
 },
 {
  "id": "3a-g5",
  "type": "guided",
  "title": "Prática 5 · Sobre: valores e diferenciais (10 min)",
  "summary": "Prática guiada · construa, salve e teste no navegador",
  "goal": "Concluir os quatro agrupamentos institucionais do segundo protótipo.",
  "instructions": [
   "Depois da seção missão, crie Nossos valores com uma lista ul/li.",
   "Use strong para destacar Compromisso, Inovação e Transparência.",
   "Crie O que nos torna diferentes com três itens em lista.",
   "Teste a hierarquia de títulos e o conteúdo."
  ],
  "code": "<!-- Valores institucionais -->\n<section class=\"valores\">\n  <h2>Nossos valores</h2>\n  <ul>\n    <li><strong>Compromisso</strong> com o sucesso dos nossos alunos.</li>\n    <li><strong>Inovação</strong> em cada curso e experiência de aprendizagem.</li>\n    <li><strong>Transparência</strong> em todo o processo educativo.</li>\n  </ul>\n</section>\n<section class=\"diferenciais\">\n  <h2>O que nos torna diferentes</h2>\n  <ul>\n    <li>Aulas práticas com projetos reais.</li>\n    <li>Equipe de suporte próxima e dedicada.</li>\n    <li>Conteúdos atualizados e focados no mercado.</li>\n  </ul>\n</section>",
  "tip": "A apresentação em cartões ficará para CSS; a lista HTML já expressa corretamente o conteúdo.",
  "outcome": "Página Sobre contém apresentação, quem somos, missão, valores e diferenciais.",
  "xp": 0
 },
 {
  "id": "3a-g6",
  "type": "guided",
  "title": "Prática 6 · Cursos: título, busca e primeiro curso (15 min)",
  "summary": "Prática guiada · construa, salve e teste no navegador",
  "goal": "Iniciar o terceiro protótipo com um curso completo.",
  "instructions": [
   "Abra pages/cursos.html e preserve as regiões existentes.",
   "No main, insira o título Nossos cursos e a busca visual (a filtragem com JavaScript será futura).",
   "Crie section catalogo e insira o primeiro article.",
   "Use o caminho ../assets/images/desenvolvimento-web.jpg; confira se a imagem existe.",
   "O link de detalhes é apenas estrutural nesta etapa."
  ],
  "code": "<!-- Dentro do main existente em pages/cursos.html -->\n<h1>Nossos cursos</h1>\n<div class=\"busca\">\n  <label for=\"buscar-curso\">Buscar Cursos</label>\n  <input type=\"search\" id=\"buscar-curso\" name=\"busca\" placeholder=\"Buscar Cursos\">\n</div>\n<section class=\"catalogo\" aria-label=\"Catálogo de cursos\">\n  <article class=\"curso\">\n    <h2>Desenvolvimento WEB</h2>\n    <img src=\"../assets/images/desenvolvimento-web.jpg\" alt=\"Ilustração sobre desenvolvimento web\">\n    <p>Aprenda HTML, CSS, Javascript e práticas modernas de desenvolvimento</p>\n    <p>CH: 40</p>\n    <a href=\"detalhes-web.html\">Ver detalhes</a>\n  </article>\n  <!-- Insira os próximos cursos aqui -->\n</section>",
  "tip": "A busca é somente estrutural, não um formulário de entrega. Não exija funcionalidade de pesquisa.",
  "outcome": "Primeiro curso aparece com título, imagem, descrição, carga horária e link.",
  "xp": 0
 },
 {
  "id": "3a-g7",
  "type": "guided",
  "title": "Prática 7 · Cursos: Informática e Games (20 min)",
  "summary": "Prática guiada · construa, salve e teste no navegador",
  "goal": "Completar os três cursos do protótipo.",
  "instructions": [
   "Dentro da mesma section catalogo, após o primeiro article, crie o curso Informática Básica.",
   "Repita a estrutura para Desenvolvimento de Games.",
   "Use imagens reais salvas em assets/images, com caminhos relativos e alt adequados.",
   "Verifique as cargas horárias: WEB 40, Informática 30 e Games 80.",
   "Não implemente páginas de detalhes nesta missão."
  ],
  "code": "<!-- Cole estes dois articles dentro de section.catalogo -->\n<article class=\"curso\">\n  <h2>Informática Básica</h2>\n  <img src=\"../assets/images/informatica-basica.jpg\" alt=\"Ilustração sobre informática básica\">\n  <p>Domine o uso do computador e aplicativos essenciais</p>\n  <p>CH: 30</p>\n  <a href=\"detalhes-informatica.html\">Ver detalhes</a>\n</article>\n<article class=\"curso\">\n  <h2>Desenvolvimento de Games</h2>\n  <img src=\"../assets/images/desenvolvimento-games.jpg\" alt=\"Ilustração sobre desenvolvimento de jogos\">\n  <p>Aprenda a desenvolver games de forma legal e criativa</p>\n  <p>CH: 80</p>\n  <a href=\"detalhes-games.html\">Ver detalhes</a>\n</article>",
  "tip": "Os três cards podem ficar um abaixo do outro. A disposição em colunas será feita com CSS.",
  "outcome": "Página Cursos apresenta os três cursos e seus dados corretos.",
  "xp": 0
 },
 {
  "id": "3a-g8",
  "type": "guided",
  "title": "Prática 8 · Navegação e testes (10 min)",
  "summary": "Prática guiada · construa, salve e teste no navegador",
  "goal": "Testar os links e recursos das três páginas.",
  "instructions": [
   "Abra index.html e navegue para Sobre e Cursos pelo menu.",
   "Em pages/sobre.html e pages/cursos.html, teste o retorno à raiz com ../index.html.",
   "Confira se os arquivos de imagem existem e se o caminho começa com ../assets/images/ nas páginas internas.",
   "Confirme um h1 por página, seções organizadas e nenhuma duplicação de header/main/footer.",
   "Registre links previstos para páginas futuras como pendências, sem tratá-los como funcionais."
  ],
  "code": "<a href=\"pages/sobre.html\">Sobre (na raiz)</a>\n<a href=\"../index.html\">Início (dentro de pages/)</a>\n<img src=\"../assets/images/desenvolvimento-web.jpg\" alt=\"Ilustração sobre desenvolvimento web\">",
  "tip": "Não confunda link existente com funcionalidade futura de Login, Contato ou detalhes.",
  "outcome": "Links implementados testados; pendências futuras identificadas.",
  "xp": 0
 },
 {
  "id": "3a-g9",
  "type": "guided",
  "title": "Prática 9 · Versionamento (10 min)",
  "summary": "Prática guiada · construa, salve e teste no navegador",
  "goal": "Registrar as alterações no GitHub.",
  "instructions": [
   "Salve os arquivos e confira git status.",
   "Revise as alterações antes de executar git add .",
   "Crie um commit descritivo e envie ao repositório remoto.",
   "Abra o GitHub e confirme a presença do commit e dos arquivos atualizados."
  ],
  "code": "git status\ngit add .\ngit commit -m \"feat: estruturar paginas da TechEduca\"\ngit push",
  "tip": "Não repita git init nem altere o remoto de um repositório já configurado.",
  "outcome": "As três páginas estão versionadas no GitHub.",
  "xp": 0
 },
 {
  "id": "3a-report",
  "type": "evidence",
  "title": "Relatório individual · Missão 3A (30 min)",
  "summary": "Descreva suas aprendizagens, contribuições, dificuldades e evidências.",
  "fields": [
   "O que você aprendeu sobre HTML semântico? Explique como utilizou os elementos nas páginas.",
   "Quais páginas e elementos você desenvolveu? Identifique suas contribuições em Início, Sobre e Cursos.",
   "Quais dificuldades encontrou e como tentou resolvê-las? Comente tags, links, imagens ou organização.",
   "Quais evidências comprovam sua participação? Informe links do repositório, commits ou outras evidências verificáveis."
  ],
  "xp": 0
 },
 {
  "id": "3a-criteria",
  "type": "content",
  "title": "Critérios de avaliação e encerramento",
  "summary": "Fundamentos · explicação e exemplo",
  "body": [
   "Estrutura semântica: uso coerente de main, section, article e hierarquia de títulos.",
   "Página Início: apresentação, links e três diferenciais; Sobre: identidade, missão, valores e diferenciais; Cursos: três cursos, descrições, imagens e cargas horárias.",
   "Navegação: caminhos relativos adequados; versionamento: commit publicado; participação: relatório com evidências verificáveis.",
   "O preenchimento não garante automaticamente o indicador atendido. A qualidade e a autoria das evidências serão avaliadas pelo instrutor.",
   "Próxima evolução: CSS para reproduzir cores, cartões, espaçamentos, alinhamentos e responsividade dos protótipos."
  ]
 }
];
const MISSION_3B_STEPS=[
 {id:"3b-contexto",type:"content",title:"1 · Entenda o desafio da Guilda",summary:"O Restaurante precisa de páginas organizadas, fáceis de navegar e com HTML semântico.",body:["Nesta missão, o grupo vai revisar a estrutura criada anteriormente e organizar o conteúdo usando header, nav, main, section, article e footer.","HTML semântico descreve a função de cada parte da página. A navegação deve permitir que o visitante encontre as páginas do Restaurante."],xp:0},
 {id:"3b-planejamento",type:"guided",title:"2 · Planejamento no Kanban",goal:"Distribuir tarefas e registrar quem fez cada parte.",instructions:["Abra o Kanban do Projeto Restaurante e revise as tarefas da Guilda.","Distribua as responsabilidades: navegação, estrutura semântica, conteúdo e revisão.","Cada integrante deve registrar sua contribuição individual e, quando possível, um link de evidência.","Confirme que a página index.html continua na raiz e as demais páginas estão na pasta pages."],outcome:"Tarefas organizadas e responsáveis identificados.",xp:15},
 {id:"3b-semantica",type:"guided",title:"3 · Estruture a página com HTML semântico",goal:"Usar elementos HTML de acordo com a função de cada região.",instructions:["Abra o index.html do Projeto Restaurante no VS Code.","Mantenha o cabeçalho e o rodapé construídos na aula anterior.","Confira se o menu está dentro de nav e o conteúdo principal dentro de main.","Dentro de main, organize o conteúdo em section e, quando fizer sentido, article.","Use títulos h1, h2 e parágrafos p em uma ordem lógica.","Não altere o layout com CSS nesta etapa; o foco é a estrutura HTML."],code:"<header>\n  <nav aria-label=\"Menu principal\">\n    <a href=\"index.html\">Início</a>\n    <a href=\"pages/cardapio.html\">Cardápio</a>\n  </nav>\n</header>\n<main>\n  <section>\n    <h1>Bem-vindo ao Restaurante</h1>\n    <p>Conheça nosso espaço e nosso cardápio.</p>\n  </section>\n</main>\n<footer><p>Projeto Restaurante</p></footer>",tip:"O exemplo é uma referência: adapte os nomes e as páginas ao projeto real da Guilda.",xp:35},
 {id:"3b-links",type:"guided",title:"4 · Teste os links entre páginas",goal:"Garantir que o menu funcione com a estrutura de pastas do projeto.",instructions:["Abra index.html no navegador e clique em todos os links do menu.","Confira o caminho das páginas internas: a partir da raiz, use pages/nome.html.","Nas páginas dentro de pages, use ../index.html para voltar à página inicial.","Corrija caminhos quebrados e confirme que cada página possui título e estrutura básica.","Peça a outro integrante para testar a navegação sem sua ajuda."],outcome:"Links internos funcionando e navegação revisada pelo grupo.",xp:25},
 {id:"3b-check",type:"checkpoint",title:"5 · Checklist de qualidade",summary:"Confira o que foi realmente realizado antes de concluir a missão.",question:"Confira a qualidade da entrega antes de avançar.",options:["O HTML utiliza header, nav, main e footer de maneira coerente.","O conteúdo principal tem títulos e seções organizados.","Os links funcionam entre index.html e as páginas de pages.","As tarefas e contribuições individuais foram registradas no Kanban."],answer:0,xp:10},
 {id:"3b-evidencia",type:"evidence",title:"6 · Evidência e reflexão individual",summary:"Registre o que você fez, o que aprendeu e o que ainda precisa melhorar.",fields:["Qual foi sua contribuição individual para a missão?","Quais elementos semânticos você utilizou e por quê?","Que problema de navegação o grupo encontrou ou corrigiu?","Informe o link do repositório, commit ou registro que demonstre sua participação."],xp:15}
];
export const MISSIONS=originalMissions.map((original,index)=>{
 const sourceIndex=index<3?0:index===27?27:index-1;
 const source=originalMissions[sourceIndex];
 const phase=index<3?1:Math.floor((index-3)/2)+2;
 const displayId=index<3?["1A","1B","1C"][index]:`${phase}${(index-3)%2===0?"A":"B"}`;
 const special=index===1?{title:"Ambiente de desenvolvimento e Git/GitHub — retomada",subtitle:"Continuação da aula 1A: revisão da prática guiada",type:"training",project:"edutech"}:
 index===2?{title:"Git/GitHub — consolidação colaborativa",subtitle:"Prática em grupo com Kanban e versionamento",type:"guild",project:"restaurante"}:
 index===27?{title:"Integração e Publicação — Projeto Restaurante",subtitle:"Consolide as funcionalidades, revise os requisitos, documente e publique a versão final do Projeto Restaurante.",type:"guild",project:"restaurante"}:{};
 return {...original,...source,id:original.id,number:index+1,lesson:index+1,phase,displayId,...special,...(displayId==="3A"?{type:"training",project:"edutech",title:"HTML Semântico e Navegação",subtitle:"Aprenda HTML semântico, links e imagens para criar a página Sobre e conectar as páginas do EduTech."}:displayId==="3B"?{type:"guild",project:"restaurante",title:"HTML Semântico e Navegação",subtitle:"Organize conteúdo e navegação do Restaurante com elementos semânticos e links."}:{}),
  // Os blocos personalizados continuam vinculados ao identificador interno original.
  steps:displayId==="3A"?structuredClone(MISSION_3A_STEPS):displayId==="3B"?structuredClone(MISSION_3B_STEPS):index<3?retrospectiveSteps[index]:displayId==="2A"?MISSION_2B_STEPS.filter(step=>["2b-p1","2b-p2","2b-p3","2b-p5","2b-p7"].includes(step.id)):displayId==="2B"?MISSION_2B_STEPS.filter(step=>["2b-p4","2b-p6"].includes(step.id)):original.steps};
});
export const EXTRA_MISSIONS=[
{id:"R1",title:"Controle de Versão",official:"Ambiente Dev e Versionamento: Revisão e Prática",hours:4,competencies:["I1","I6"]},
{id:"R2",title:"Desafio HTML",official:"HTML: Estrutura, Tags, Hierarquia, Conteúdo e Semântica",hours:4,competencies:["I2"]},
{id:"R3",title:"Desafio CSS",official:"CSS: Estilização, Layout e Responsividade",hours:4,competencies:["I3","I5"]},
{id:"R4",title:"Desafio JavaScript",official:"JavaScript: Lógica, DOM e Eventos",hours:4,competencies:["I2","I5"]},
{id:"R5",title:"Caça aos Bugs",official:"Validação, Tratamento de Erros e Testes",hours:4,competencies:["I5"]},
{id:"R6",title:"Conectando as Camadas",official:"Cliente-Servidor e Banco de Dados: Fluxo e Persistência",hours:4,competencies:["I2","I4","I5"]},
{id:"R7",title:"Desafio Full Stack",official:"Jornada Web: Desafio Integrado de Consolidação",hours:4,competencies:["I1","I2","I3","I4","I5","I6"]}
];
// Pré-configuração das sete atividades remotas: editável por turma no painel do instrutor.
EXTRA_MISSIONS.forEach(m=>{m.subtitle=m.official;m.steps=m.id==="R2"?[{"id":"r2-01","type":"content","title":"01 · A página HTML é como uma casa","summary":"Entenda com calma antes de praticar.","body":["<h3>Uma página web também precisa de estrutura</h3><p>Assim como uma casa tem ambientes diferentes, o HTML organiza informações e conteúdos para o navegador.</p>","<h3>As partes principais do documento</h3><p><ul><li><code>&lt;!DOCTYPE html&gt;</code> — informa que o documento utiliza HTML5.</li><li><code>&lt;html&gt;</code> — envolve todo o documento.</li><li><code>&lt;head&gt;</code> — guarda informações sobre a página, como codificação e título da aba.</li><li><code>&lt;body&gt;</code> — reúne o conteúdo visível, como títulos, textos, links e imagens.</li></ul></p>","<h3>Observe o exemplo</h3><p>O texto dentro de <code>&lt;title&gt;</code> aparece na <strong>aba do navegador</strong>. Já o conteúdo dentro de <code>&lt;h1&gt;</code> aparece <strong>na própria página</strong>.</p>"],"code":"<!DOCTYPE html>\n<html lang=\"pt-BR\">\n<head><meta charset=\"UTF-8\"><title>Minha página</title></head>\n<body><h1>Olá, turma!</h1><p>Estou aprendendo HTML.</p></body>\n</html>"},{"id":"r2-02","type":"quiz","title":"Sua vez · Onde aparece o conteúdo?","summary":"Escolha uma resposta. Se errar, leia a explicação e tente novamente.","question":"Em qual elemento você colocaria um parágrafo visível na página?","options":["<head>","<body>","<title>"],"answer":1,"feedback":"O body contém o conteúdo visível. O head reúne informações sobre o documento e title define o texto da aba."},{"id":"r2-03","type":"sequence","title":"Desafio · Organize a estrutura","summary":"Clique nas linhas na ordem em que devem aparecer.","prompt":"Monte a ordem das tags de um documento HTML.","items":["</body>","<head>","<!DOCTYPE html>","</html>","<body>","</head>","<html>"],"expected":["<!DOCTYPE html>","<html>","<head>","</head>","<body>","</body>","</html>"],"feedback":"Primeiro o DOCTYPE; dentro de html, head vem antes de body."},{"id":"r2-04","type":"content","title":"02 · Detetive das tags e atributos","summary":"Entenda com calma antes de praticar.","body":["<h3>O que é uma tag?</h3><p>Uma <strong>tag HTML</strong> informa ao navegador a função de um conteúdo. Por exemplo, <code>&lt;h1&gt;</code> representa um título principal, enquanto <code>&lt;p&gt;</code> representa um parágrafo.</p>","<h3>O que é um atributo?</h3><p>O atributo acrescenta uma informação ao elemento. Observe as funções mais comuns:<ul><li><code>href</code> — endereço de destino de um link.</li><li><code>src</code> — origem do arquivo de imagem.</li><li><code>alt</code> — descrição textual da imagem.</li><li><code>id</code> — identificador de um elemento.</li><li><code>class</code> — classificação ou agrupamento de elementos.</li></ul></p>","<h3>Como ler um link HTML</h3><p>Em <code>&lt;a href=&quot;https://www.senac.br&quot;&gt;Visitar Senac&lt;/a&gt;</code>, <code>&lt;a&gt;</code> abre o link, <code>href</code> define o destino, <strong>Visitar Senac</strong> é o texto clicável e <code>&lt;/a&gt;</code> fecha o elemento.</p>"],"code":"<h1>Meu primeiro site</h1>\n<p>Hoje estou estudando HTML.</p>\n<a href=\"https://www.senac.br\">Visitar Senac</a>\n<img src=\"foto.jpg\" alt=\"Estudantes no laboratório\">"},{"id":"r2-05","type":"flashcards","title":"Explore · Revele os atributos","summary":"Toque em cada cartão antes de responder.","pairs":[["href","Informa o destino de um link."],["src","Informa a origem do arquivo da imagem."],["alt","Descreve uma imagem em texto."],["id","Identifica um elemento."],["class","Permite agrupar ou classificar elementos."],["lang","Indica o idioma do conteúdo."]]},{"id":"r2-06","type":"quiz","title":"Desafio · Complete a imagem","summary":"Escolha uma resposta. Se errar, leia a explicação e tente novamente.","question":"Qual atributo indica o arquivo que deve ser carregado em <img ___=\"foto.jpg\">?","options":["href","src","alt"],"answer":1,"feedback":"src indica a origem da imagem. alt é a descrição textual; href é usado para destinos de links."},{"id":"r2-07","type":"content","title":"03 · HTML tem pais, filhos e irmãos","summary":"Entenda com calma antes de praticar.","body":["<h3>Entenda a hierarquia</h3><p>Assim como em uma árvore genealógica, os elementos HTML podem ter relações de <strong>pai, filho e irmão</strong>.</p>","<h3>Observe os elementos</h3><p><ul><li><code>&lt;section&gt;</code> é o elemento <strong>pai</strong>.</li><li><code>&lt;h2&gt;</code> e <code>&lt;p&gt;</code> são <strong>filhos</strong> de section.</li><li>Como compartilham o mesmo pai, <code>&lt;h2&gt;</code> e <code>&lt;p&gt;</code> são <strong>irmãos</strong>.</li></ul></p>","<h3>Cuidado com o fechamento</h3><p>Se você abriu um elemento dentro de outro, feche primeiro o elemento interno. Isso evita estruturas incorretas.</p>"],"code":"<section>\n  <h2>Meus estudos</h2>\n  <p>Estou aprendendo HTML.</p>\n</section>"},{"id":"r2-08","type":"quiz","title":"Sua vez · Quem são os irmãos?","summary":"Escolha uma resposta. Se errar, leia a explicação e tente novamente.","question":"No exemplo anterior, qual é a relação entre h2 e p?","options":["São elementos irmãos.","h2 é pai de section.","São a mesma tag."],"answer":0,"feedback":"Os dois estão diretamente dentro de section; portanto, são elementos irmãos."},{"id":"r2-09","type":"quiz","title":"Desafio · Encontre o erro","summary":"Escolha uma resposta. Se errar, leia a explicação e tente novamente.","question":"O código <section><p>Olá</section></p> tem qual problema?","options":["O parágrafo não pode estar em section.","As tags foram fechadas fora de ordem.","Toda section precisa de imagem."],"answer":1,"feedback":"O p precisa ser fechado antes de section, pois foi aberto dentro dela."},{"id":"r2-10","type":"content","title":"04 · Dando conteúdo à página","summary":"Entenda com calma antes de praticar.","body":["<h3>Escolha a tag pela função</h3><p>Não basta fazer o texto aparecer: cada elemento comunica uma função ao navegador.</p>","<h3>Principais elementos de conteúdo</h3><p><ul><li><code>&lt;h1&gt;</code> a <code>&lt;h6&gt;</code> — títulos por nível de importância.</li><li><code>&lt;p&gt;</code> — parágrafo.</li><li><code>&lt;ul&gt;</code> — lista sem ordem obrigatória.</li><li><code>&lt;ol&gt;</code> — lista com sequência definida.</li><li><code>&lt;li&gt;</code> — item de uma lista.</li><li><code>&lt;a&gt;</code> — link de navegação.</li><li><code>&lt;img&gt;</code> — imagem, com <code>src</code> e <code>alt</code>.</li></ul></p>","<h3>Exemplo do cotidiano</h3><p>Para apresentar assuntos estudados, utilize <code>&lt;ul&gt;</code>. Para ensinar um passo a passo, prefira <code>&lt;ol&gt;</code>, pois a ordem importa.</p>"],"code":"<h1>Meu curso de tecnologia</h1>\n<p>Estou aprendendo HTML.</p>\n<h2>Conteúdos</h2>\n<ul><li>Estrutura</li><li>Links</li></ul>\n<a href=\"https://www.senac.br\">Conheça o Senac</a>"},{"id":"r2-11","type":"quiz","title":"Sua vez · Qual lista usar?","summary":"Escolha uma resposta. Se errar, leia a explicação e tente novamente.","question":"Você vai escrever passos que precisam ser seguidos na ordem. Qual elemento é mais adequado?","options":["<ul>","<ol>","<p>"],"answer":1,"feedback":"ol representa uma lista ordenada. ul é útil quando a ordem dos itens não importa."},{"id":"r2-12","type":"quiz","title":"Desafio · Qual tag cria links?","summary":"Escolha uma resposta. Se errar, leia a explicação e tente novamente.","question":"Qual elemento permite navegar para outro endereço?","options":["<a>","<img>","<li>"],"answer":0,"feedback":"O elemento a cria links; o atributo href indica o endereço de destino."},{"id":"r2-13","type":"content","title":"05 · HTML semântico: cada parte tem uma função","summary":"Entenda com calma antes de praticar.","body":["<h3>Por que usar HTML semântico?</h3><p>Imagine uma escola em que todas as portas tenham a placa “Sala”. Os elementos semânticos funcionam como <strong>placas que explicam a finalidade</strong> de cada região.</p>","<h3>Conheça as regiões</h3><p><ul><li><code>&lt;header&gt;</code> — cabeçalho.</li><li><code>&lt;nav&gt;</code> — navegação.</li><li><code>&lt;main&gt;</code> — conteúdo principal.</li><li><code>&lt;section&gt;</code> — seção temática.</li><li><code>&lt;article&gt;</code> — conteúdo independente, como uma notícia.</li><li><code>&lt;footer&gt;</code> — rodapé.</li></ul></p>","<h3>Para que isso serve?</h3><p>Uma estrutura semântica facilita a organização do código e ajuda tecnologias assistivas a compreender a página.</p>"],"code":"<header><h1>Meu site</h1></header>\n<nav><a href=\"inicio.html\">Início</a></nav>\n<main><section><h2>Estudos</h2><p>HTML</p></section></main>\n<footer><p>Turma UC7</p></footer>"},{"id":"r2-14","type":"flashcards","title":"Explore · Descubra a função","summary":"Toque para revelar o significado.","pairs":[["header","Cabeçalho da página ou de uma seção."],["nav","Área de navegação."],["main","Conteúdo principal da página."],["section","Agrupamento temático."],["article","Conteúdo independente."],["footer","Rodapé da página ou seção."]]},{"id":"r2-15","type":"quiz","title":"Desafio · Escolha a região","summary":"Escolha uma resposta. Se errar, leia a explicação e tente novamente.","question":"Qual elemento identifica o menu de navegação?","options":["<footer>","<article>","<nav>"],"answer":2,"feedback":"nav identifica uma região com links de navegação; footer é rodapé e article é conteúdo independente."},{"id":"r2-16","type":"content","title":"06 · Laboratório: conserte o HTML","summary":"Entenda com calma antes de praticar.","body":["<h3>Sua tarefa</h3><p>O código do colega tem tags de fechamento incorretas. Você vai investigar e corrigir o HTML.</p>","<h3>Como resolver</h3><p><ol><li>Compare a tag de abertura com a de fechamento.</li><li>Confira se cada parágrafo foi encerrado.</li><li>Clique em <strong>Executar</strong> para observar o resultado.</li><li>Use <strong>Verificar</strong> e leia o feedback antes de tentar novamente.</li></ol></p>","<h3>Dica</h3><p>Se você abriu <code>&lt;h1&gt;</code>, precisa fechar com <code>&lt;/h1&gt;</code>.</p>"],"code":"<h1>Minha página</h2>\n<p>Estou estudando HTML.\n<ul><li>Títulos</li><li>Listas</li></ul>"},{"id":"r2-17","type":"editor","title":"Laboratório 1 · Corrija as tags","summary":"Corrija os erros de fechamento. Execute e verifique o código.","starter":"<h1>Minha página</h2>\n<p>Estou estudando HTML.\n<ul><li>Títulos</li><li>Listas</li></ul>","labModeCss":"off","labModeJs":"off","requiredHtml":"</h1>\n</p>\n<ul>\n<li>"},{"id":"r2-18","type":"editor","title":"Laboratório 2 · Complete o conteúdo","summary":"Crie um título, um parágrafo, uma lista com três itens, um link e uma imagem com alt. Use a prévia para observar.","starter":"<h1>Meus estudos</h1>\n<p>Estou aprendendo HTML.</p>\n<!-- Complete abaixo -->","labModeCss":"off","labModeJs":"off","requiredHtml":"<ul>\n<li>\n<a href=\n<img src=\nalt="},{"id":"r2-19","type":"editor","title":"Laboratório 3 · Organize a semântica","summary":"Complete uma estrutura com cabeçalho, navegação, conteúdo principal e rodapé.","starter":"<h1>Portal de estudos</h1>\n<p>Organize esta página com elementos semânticos.</p>","labModeCss":"off","labModeJs":"off","requiredHtml":"<header>\n</header>\n<nav>\n</nav>\n<main>\n</main>\n<footer>\n</footer>"},{"id":"r2-20","type":"content","title":"07 · Desafio final: Meu Espaço de Tecnologia","summary":"Entenda com calma antes de praticar.","body":["<h3>Sua missão final</h3><p>Crie uma página chamada <strong>Meu Espaço de Tecnologia</strong> utilizando os conhecimentos de HTML revisados.</p>","<h3>Checklist de construção</h3><p><ol><li>Organize <code>&lt;html&gt;</code>, <code>&lt;head&gt;</code> e <code>&lt;body&gt;</code>.</li><li>Crie cabeçalho, navegação e conteúdo principal.</li><li>Adicione título, parágrafo e lista de assuntos.</li><li>Inclua um link e uma imagem com <code>alt</code>.</li><li>Finalize com o rodapé.</li></ol></p>","<h3>Antes de entregar</h3><p>Execute, observe a prévia, verifique os requisitos e melhore seu código. <strong>Não são necessários formulários, CSS ou JavaScript.</strong></p>"]},{"id":"r2-21","type":"editor","title":"Desafio final · Construa sua página","summary":"Complete a página e confira os requisitos. Você pode corrigir e tentar novamente.","starter":"<!DOCTYPE html>\n<html lang=\"pt-BR\">\n<head><meta charset=\"UTF-8\"><title>Meu Espaço de Tecnologia</title></head>\n<body>\n<!-- Cabeçalho -->\n<!-- Navegação -->\n<!-- Conteúdo principal e lista -->\n<!-- Imagem com alt -->\n<!-- Rodapé -->\n</body>\n</html>","labModeCss":"off","labModeJs":"off","requiredHtml":"<!DOCTYPE html>\n<html\n<head>\n<body>\n<header>\n<nav>\n<main>\n<h1>\n<p>\n<ul>\n<li>\n<a href=\n<img src=\nalt=\n<footer>"},{"id":"r2-22","type":"content","title":"Encerramento · O que você aprendeu?","summary":"Entenda com calma antes de praticar.","body":["<h3>O que você conseguiu praticar?</h3><p>Você revisou estrutura HTML, tags, atributos, hierarquia, conteúdo e semântica.</p>","<h3>Faça uma autoavaliação</h3><p><ul><li>Consigo diferenciar <code>&lt;head&gt;</code> e <code>&lt;body&gt;</code>?</li><li>Sei criar títulos, listas, links e imagens?</li><li>Reconheço quando utilizar elementos semânticos?</li></ul></p>","<h3>Próximo passo</h3><p>Erros fazem parte da aprendizagem. Seu instrutor poderá utilizar as tentativas e os resultados para orientar novas práticas.</p>"]}]:[];});
export const ASSESSMENT_MILESTONES=[
{id:"M1",title:"Preparação do Desenvolvedor",official:"Avaliação 1 — Ambiente de Desenvolvimento e Versionamento",after:"2A",competencies:["I1","I6"]},
{id:"M2",title:"Construção da Interface",official:"Avaliação 2 — Desenvolvimento da Interface Web",after:"6B",competencies:["I2","I3","I6"]},
{id:"M3",title:"Aplicação Conectada",official:"Avaliação 3 — Integração da Aplicação com Banco de Dados",after:"11B",competencies:["I2","I4","I5","I6"]},
{id:"FINAL",title:"Aplicação Web Completa",official:"Avaliação 4 — Projeto Web Integrado: Consolidação Final da UC7",after:"14B",competencies:["I1","I2","I3","I4","I5","I6"]}
];
export const getMission=id=>MISSIONS.find(m=>m.id===id);
export const getMissionByNumber=number=>MISSIONS.find(m=>m.number===Number(number));
export const getPhaseMissions=phase=>MISSIONS.filter(m=>m.phase===Number(phase));