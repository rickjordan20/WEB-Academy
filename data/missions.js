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
{id:"retro-2-overview",type:"content",title:"Aula 2 · Retomada e aprofundamento",summary:"Continuação da Aula 1 no projeto TechEduca.",body:["Revise os dois infográficos utilizados em sala: panorama da UC7 e introdução ao Git e GitHub.","A aula retomou a sequência da primeira aula, com explicações mais detalhadas e prática guiada na TechEduca. Não houve prática coletiva obrigatória na Café Central.","Registre o que já realizou e indique dificuldades ou pendências. Não é preciso criar outro repositório caso já esteja cadastrado."]},
{id:"retro-2-flashcards",type:"flashcards",title:"Flashcards · Retomada TechEduca",summary:"Revele cada resposta para revisar antes dos checkpoints.",pairs:[["Qual arquivo abre a página principal?","Normalmente index.html, na raiz do projeto."],["Para que serve o CSS?","Definir a aparência e o estilo da página."],["Qual é a função do JavaScript?","Adicionar comportamentos e interações."],["O que faz git status?","Mostra as alterações e o estado do repositório."],["Commit e push são iguais?","Não. Commit registra localmente; push envia ao remoto."],["O que é a prática TechEduca?","Atividade individual guiada, retomando os fundamentos."]]},
{id:"retro-2-q1",type:"quiz",title:"1 · Estrutura",question:"Em qual arquivo normalmente fica o conteúdo inicial da página web?",options:["index.html","style.css","app.js"],answer:0,feedback:"O index.html costuma ser a entrada da página."},
{id:"retro-2-q2",type:"quiz",title:"2 · Versionamento",question:"Qual comando registra uma versão local depois de preparar as alterações?",options:["git commit","git clone","git pull"],answer:0,feedback:"O commit registra uma versão no histórico local."},
{id:"retro-2-q3",type:"quiz",title:"3 · Publicação",question:"Qual comando envia commits locais para o remoto configurado?",options:["git push","git status","git init"],answer:0,feedback:"O push envia commits para o repositório remoto."},
{id:"retro-2-evidence",type:"evidence",title:"Registro da Aula 2",summary:"Aproveite o repositório TechEduca já cadastrado.",fields:["O link do repositório TechEduca já está cadastrado? Se não, informe o link disponível ou explique.","Quais partes da prática guiada você realizou ou retomou?","O que compreendeu melhor nesta aula e o que ainda precisa revisar?"]}
],
[
{id:"retro-3-overview",type:"content",title:"Aula 3 · Organização da Guilda Café Central",summary:"Primeiro registro do projeto colaborativo.",body:["A turma conheceu a WEB-Academy, consultou o cronograma, criou grupos e cadastrou links dos repositórios.","O líder iniciou o repositório da Café Central e a equipe começou a distribuir responsabilidades no Kanban.","Não foram exigidas branches ou pull requests individuais nesta aula. Aproveite os dados já cadastrados na plataforma."]},
{id:"retro-3-flashcards",type:"flashcards",title:"Flashcards · Guilda Café Central",summary:"Revise os papéis e a colaboração antes das perguntas.",pairs:[["O que é uma Guilda?","Equipe que colabora no mesmo projeto Café Central."],["Qual o papel do líder?","Organizar a equipe e distribuir as responsabilidades."],["Para que serve o Kanban?","Visualizar tarefas, responsáveis e andamento."],["Quem registra a contribuição?","Cada integrante registra o que realizou e suas evidências."],["Qual projeto é coletivo?","Café Central; TechEduca é a prática individual."],["É obrigatório criar um PR individual nessa aula?","Não. A aula tratou da organização inicial da equipe."]]},
{id:"retro-3-q1",type:"quiz",title:"1 · Organização",question:"Para que serve o Kanban da equipe?",options:["Distribuir e acompanhar tarefas","Substituir o Git","Criar automaticamente o site"],answer:0,feedback:"O Kanban ajuda a organizar responsáveis e andamento."},
{id:"retro-3-q2",type:"quiz",title:"2 · Repositório",question:"Quem ficou responsável por publicar inicialmente o projeto Café Central?",options:["O líder da equipe","Cada integrante em uma branch obrigatória","Somente o instrutor"],answer:0,feedback:"Nesta aula o líder realizou a publicação inicial."},
{id:"retro-3-q3",type:"quiz",title:"3 · Contribuição",question:"Como demonstrar a participação individual na equipe?",options:["Registrar tarefas e contribuições no Kanban","Apenas informar o nome do grupo","Criar outro grupo"],answer:0,feedback:"O registro das tarefas ajuda a identificar a contribuição de cada integrante."},
{id:"retro-3-evidence",type:"evidence",title:"Registro da Aula 3",summary:"Não duplique cadastros já realizados.",fields:["Qual é sua Guilda na WEB-Academy?","O repositório Café Central já foi cadastrado? Se não, informe a situação.","Qual responsabilidade foi combinada para você ou quais tarefas foram registradas no Kanban?","O que a equipe já conseguiu organizar e o que ficou pendente?"]}
]
];
export const MISSIONS=originalMissions.map((original,index)=>{
 const sourceIndex=index<3?0:index===27?27:index-1;
 const source=originalMissions[sourceIndex];
 const phase=index<3?1:Math.floor((index-3)/2)+2;
 const displayId=index<3?["1A","1B","1C"][index]:`${phase}${(index-3)%2===0?"A":"B"}`;
 const special=index===1?{title:"Ambiente de desenvolvimento e Git/GitHub — retomada",subtitle:"Continuação da aula 1A: revisão da prática guiada",type:"training",project:"edutech"}:
 index===2?{title:"Git/GitHub — consolidação colaborativa",subtitle:"Prática em grupo com Kanban e versionamento",type:"guild",project:"restaurante"}:{};
 return {...original,...source,id:original.id,number:index+1,lesson:index+1,phase,displayId,...special,
  // Os blocos personalizados continuam vinculados ao identificador interno original.
  steps:index<3?retrospectiveSteps[index]:original.steps};
});
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
EXTRA_MISSIONS.forEach(m=>{m.subtitle=m.official;m.steps=[];});
export const ASSESSMENT_MILESTONES=[
{id:"M1",title:"Preparação do Desenvolvedor",official:"Avaliação 1 — Ambiente de Desenvolvimento e Versionamento",after:"2A",competencies:["I1","I6"]},
{id:"M2",title:"Construção da Interface",official:"Avaliação 2 — Desenvolvimento da Interface Web",after:"6B",competencies:["I2","I3","I6"]},
{id:"M3",title:"Aplicação Conectada",official:"Avaliação 3 — Integração da Aplicação com Banco de Dados",after:"11B",competencies:["I2","I4","I5","I6"]},
{id:"FINAL",title:"Aplicação Web Completa",official:"Avaliação 4 — Projeto Web Integrado: Consolidação Final da UC7",after:"14B",competencies:["I1","I2","I3","I4","I5","I6"]}
];
export const getMission=id=>MISSIONS.find(m=>m.id===id);
export const getMissionByNumber=number=>MISSIONS.find(m=>m.number===Number(number));
export const getPhaseMissions=phase=>MISSIONS.filter(m=>m.phase===Number(phase));