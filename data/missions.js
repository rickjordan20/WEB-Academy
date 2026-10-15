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
   "Se precisar instalar, abra [Visual Studio Code](https://code.visualstudio.com/) e [Git](https://git-scm.com/downloads). Faça a instalação com o instrutor.",
   "No VS Code, abra Arquivo → Abrir Pasta. Crie uma pasta chamada edutech e abra essa pasta.",
   "Abra Terminal → Novo Terminal. Confira se o caminho mostrado termina em edutech. Se não terminar, peça ajuda.",
   "Digite git --version e pressione Enter. Se aparecer um número, o Git está instalado."
  ],
  "outcome": "VS Code aberto, terminal na pasta correta e Git reconhecido."
 },
 {
  "id": "p1-guided-02",
  "type": "guided",
  "title": "02 · Organize a estrutura do EduTech",
  "summary": "Prática Guiada • 15 min • faça com o instrutor",
  "goal": "Criar arquivos e pastas antes de iniciar o versionamento.",
  "instructions": [
   "No Explorador do VS Code, crie index.html dentro da pasta edutech.",
   "Crie as pastas css, js e assets. Dentro de assets, crie images.",
   "Crie style.css dentro de css e app.js dentro de js. Dentro de images, crie .gitkeep para que a pasta vazia apareça no GitHub.",
   "No index.html, copie o exemplo de código mostrado abaixo. Hoje não precisa memorizar HTML: aprenderemos isso depois.",
   "No style.css, escreva /* Estilos do EduTech */. No app.js, escreva // Interações do EduTech. Salve os arquivos com Ctrl+S."
  ],
  "outcome": "No Explorador: index.html, css/style.css, js/app.js e assets/images/.gitkeep.",
  "code": "<!DOCTYPE html>\n<html lang=\"pt-BR\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>EduTech</title>\n</head>\n<body>\n  <h1>Meu EduTech</h1>\n</body>\n</html>"
 },
 {
  "id": "p1-guided-03",
  "type": "guided",
  "title": "03 · Ative o Git no computador",
  "summary": "Prática Guiada • 10 min • faça com o instrutor",
  "goal": "Transformar a pasta do EduTech em um repositório local.",
  "instructions": [
   "Confira se o terminal está na pasta edutech.",
   "Digite git init. Isso inicia o controle de versões no computador.",
   "Digite git status. Os arquivos novos devem aparecer como untracked files (ainda não registrados).",
   "Confira git config --global user.name e git config --global user.email. Se estiverem vazios, peça ao instrutor para ajudar a configurar seu nome e e-mail antes do commit."
  ],
  "outcome": "O terminal reconhece um repositório Git e mostra o estado dos arquivos."
 },
 {
  "id": "p1-guided-04",
  "type": "guided",
  "title": "04 · Registre sua primeira versão",
  "summary": "Prática Guiada • 20 min • faça com o instrutor",
  "goal": "Criar um commit local antes de enviar ao GitHub.",
  "instructions": [
   "Digite git status e observe os arquivos novos.",
   "Digite git add . (há um espaço antes do ponto). Isso prepara os arquivos para o commit.",
   "Digite git status outra vez. Os arquivos devem aparecer como Changes to be committed.",
   "Digite git commit -m \"Criar estrutura inicial do EduTech\". Isso registra uma versão no computador.",
   "Digite git log -1 --oneline. Deve aparecer um código curto e a mensagem do commit."
  ],
  "outcome": "O Git mostra um commit com a mensagem escolhida."
 },
 {
  "id": "p1-guided-05",
  "type": "guided",
  "title": "05 · Crie o repositório no GitHub",
  "summary": "Prática Guiada • 15 min • faça com o instrutor",
  "goal": "Preparar um local online para receber o projeto.",
  "instructions": [
   "Abra [Criar novo repositório no GitHub](https://github.com/new) e entre na sua conta.",
   "No campo Repository name, escreva edutech (ou o nome combinado com o instrutor).",
   "Não marque as opções para criar README, .gitignore ou licença. Precisamos de um repositório vazio.",
   "Clique em Create repository e copie a URL HTTPS mostrada na página. Cada estudante terá seu próprio endereço."
  ],
  "outcome": "Repositório remoto vazio criado e endereço HTTPS copiado."
 },
 {
  "id": "p1-guided-06",
  "type": "guided",
  "title": "06 · Conecte o Git ao GitHub",
  "summary": "Prática Guiada • 10 min • faça com o instrutor",
  "goal": "Vincular o repositório local ao remoto.",
  "instructions": [
   "No terminal, digite git remote add origin e, depois de um espaço, cole a URL HTTPS do SEU repositório. Exemplo: git remote add origin https://github.com/seu-usuario/edutech.git.",
   "Digite git remote -v para conferir o endereço configurado.",
   "Se o endereço estiver incorreto ou aparecer origin already exists, peça ajuda em vez de repetir o comando."
  ],
  "outcome": "O terminal mostra o endereço remoto correto."
 },
 {
  "id": "p1-guided-07",
  "type": "guided",
  "title": "07 · Publique o primeiro commit",
  "summary": "Prática Guiada • 15 min • faça com o instrutor",
  "goal": "Enviar ao GitHub a versão que você registrou.",
  "instructions": [
   "Digite git branch -M main. Isso dá o nome main à linha principal do projeto.",
   "Digite git push -u origin main. Aguarde o primeiro envio ao GitHub.",
   "Se aparecer uma tela de login, siga a orientação do instrutor. Nunca compartilhe senha ou token.",
   "Abra seu repositório no GitHub e confira se os arquivos e o primeiro commit aparecem."
  ],
  "outcome": "O repositório online mostra os arquivos do EduTech e o commit."
 },
 {
  "id": "p1-guided-08",
  "type": "guided",
  "title": "08 · Faça uma mudança e sincronize",
  "summary": "Prática Guiada • 20 min • faça com o instrutor",
  "goal": "Repetir o fluxo para entender o trabalho cotidiano.",
  "instructions": [
   "No index.html, troque Meu EduTech por Meu primeiro projeto EduTech e salve com Ctrl+S.",
   "Digite git status. Confira que index.html aparece como modificado.",
   "Digite git add . e depois git commit -m \"Atualizar página inicial\".",
   "Digite git push. Atualize o GitHub e confira o segundo commit.",
   "Lembre-se: init e remote são da preparação inicial; push envia versões, pull recebe mudanças e clone copia um repositório remoto."
  ],
  "outcome": "O histórico no GitHub mostra pelo menos dois commits."
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

const guidedSteps=(p,topic,sub)=>p===1?phase1GuidedSteps:[
{id:`p${p}-guided`,type:"guided",title:`Prática Guiada EduTech — ${sub}`,summary:"Faça junto com o instrutor no projeto real, usando o VS Code.",instructions:[`Abra o projeto EduTech no VS Code e localize onde a evolução ${sub} será implementada.`,`Acompanhe a demonstração do instrutor e implemente ${topic} no seu próprio projeto.`,"Relacione a implementação aos requisitos exibidos no briefing desta missão.","Execute e teste o resultado antes de prosseguir.","Revise o que mudou e registre a evolução com Git/GitHub quando pertinente à etapa."]},
{id:`p${p}-report`,type:"evidence",title:"Relatório Individual da Fase",summary:"Registre sua aprendizagem e uma evidência verificável da prática guiada.",fields:["O que eu fiz?","Como eu fiz?","O que eu aprendi?","Qual dificuldade encontrei?","Como resolvi ou tentei resolver?","Link do repositório, commit ou outra evidência da evolução"]}
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
11:{edutech:["RF07"],restaurante:["RF07","RF11"]},
12:{edutech:["RF08","RF09","RNF05"],restaurante:["RF08","RF09","RNF05"]},
13:{edutech:["RF07","RF09","RF10"],restaurante:["RF07","RF09","RF10","RF11"]},
14:{edutech:["RF01","RF02","RF03","RF04","RF05","RF06","RF07","RF08","RF09","RF10","RNF01","RNF02","RNF03","RNF04","RNF05","RNF06","RNF07","RNF08"],restaurante:["RF01","RF02","RF03","RF04","RF05","RF06","RF07","RF08","RF09","RF10","RF11","RNF01","RNF02","RNF03","RNF04","RNF05","RNF06","RNF07","RNF08"]}
};
export const MISSIONS=phaseData.flatMap(([phase,topic,a,b,axis,competencies])=>[
{id:`${phase}A`,number:(phase-1)*2+1,lesson:(phase-1)*2+1,phase,type:"training",title:topic,subtitle:a,project:"edutech",hours:4,structure:[{kind:"fundamentals",label:"Fundamentos",hours:1.5},{kind:"guided",label:"Prática Guiada EduTech",hours:2},{kind:"report",label:"Relatório Individual",hours:.5}],competencies,requirements:phaseRequirementMap[phase].edutech,steps:guidedSteps(phase,topic,a)},
{id:`${phase}B`,number:(phase-1)*2+2,lesson:(phase-1)*2+2,phase,type:"guild",title:topic,subtitle:b,project:"restaurante",hours:4,structure:[{kind:"guild",label:"Missão da Guilda",hours:4}],competencies,requirements:phaseRequirementMap[phase].restaurante,steps:guildSteps(phase,topic,b,axis)}
]);
export const EXTRA_MISSIONS=[
{id:"R1",title:"Controle de Versão",official:"Ambiente Dev e Versionamento: Revisão e Prática",hours:4,competencies:["I1","I6"]},
{id:"R2",title:"Desafio HTML",official:"HTML: Estrutura, Semântica e Formulários",hours:4,competencies:["I2"]},
{id:"R3",title:"Desafio CSS",official:"CSS: Estilização, Layout e Responsividade",hours:4,competencies:["I3","I5"]},
{id:"R4",title:"Desafio JavaScript",official:"JavaScript: Lógica, DOM e Eventos",hours:4,competencies:["I2","I5"]},
{id:"R5",title:"Caça aos Bugs",official:"Validação, Tratamento de Erros e Testes",hours:4,competencies:["I5"]},
{id:"R6",title:"Conectando as Camadas",official:"Cliente-Servidor e Banco de Dados: Fluxo e Persistência",hours:4,competencies:["I2","I4","I5"]},
{id:"R7",title:"Desafio Full Stack",official:"Jornada Web: Desafio Integrado de Consolidação",hours:4,competencies:["I1","I2","I3","I4","I5","I6"]}
];
// Pré-configuração das sete atividades remotas: editável por turma no painel do instrutor.
EXTRA_MISSIONS.forEach(m=>{m.subtitle=m.official;m.steps=[
{id:m.id+"-intro",type:"content",title:"Objetivos e contextualização",summary:m.official,body:["Nesta atividade remota você vai consolidar os conhecimentos de: "+m.official+".","Leia os objetivos, realize a prática proposta e registre sua aprendizagem."]},
{id:m.id+"-practice",type:"guided",title:"Prática autônoma",summary:"Aplicação individual dos conhecimentos",instructions:["Revise o material das aulas anteriores relacionado ao tema.","Desenvolva uma pequena melhoria ou exercício aplicado ao projeto em andamento.","Execute testes, revise o resultado e registre as alterações realizadas."]},
{id:m.id+"-evidence",type:"evidence",title:"Evidência e reflexão",summary:"Comprove sua participação",fields:["O que você desenvolveu ou estudou?","Informe o link do repositório, commit ou evidência do exercício.","Qual dificuldade encontrou e como buscou resolvê-la?"]}
]});
export const ASSESSMENT_MILESTONES=[
{id:"M1",title:"Preparação do Desenvolvedor",official:"Avaliação 1 — Ambiente de Desenvolvimento e Versionamento",after:"1B",competencies:["I1","I6"]},
{id:"M2",title:"Construção da Interface",official:"Avaliação 2 — Desenvolvimento da Interface Web",after:"6B",competencies:["I2","I3","I6"]},
{id:"M3",title:"Aplicação Conectada",official:"Avaliação 3 — Integração da Aplicação com Banco de Dados",after:"11B",competencies:["I2","I4","I5","I6"]},
{id:"FINAL",title:"Aplicação Web Completa",official:"Avaliação 4 — Projeto Web Integrado: Consolidação Final da UC7",after:"14B",competencies:["I1","I2","I3","I4","I5","I6"]}
];
export const getMission=id=>MISSIONS.find(m=>m.id===id);
export const getMissionByNumber=number=>MISSIONS.find(m=>m.number===Number(number));
export const getPhaseMissions=phase=>MISSIONS.filter(m=>m.phase===Number(phase));