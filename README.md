# UC7 Web Academy — Fase 3: Ambiente Interativo de Aprendizagem

Plataforma web gamificada de apoio à UC7 — Desenvolver aplicações web.

## Estado atual

### Fase 1 — Fundação
- identidade visual e dashboard
- perfil local do estudante
- localStorage e backup JSON

### Fase 2 — Motor da Jornada
- mapa das 14 Fases
- desbloqueio sequencial
- estados de missão
- retomada do progresso
- Mission Engine orientado a dados

### Fase 3 — Ambiente Interativo de Aprendizagem
- renderer reutilizável de etapas pedagógicas
- Trilha de Conhecimento
- checkpoints objetivos com nova tentativa
- atividade de completar código
- Laboratório HTML com editor e preview em iframe
- Desafio Guiado
- autoavaliação/reflexão
- registro de evidência
- persistência das respostas e código no navegador
- Missão 1A transformada em experiência didática funcional
- Missão 1B com fluxo de Guilda e evidência

## Tipos de etapa disponíveis

`content`, `quiz`, `complete-code`, `editor`, `guided`, `reflection`, `checkpoint` e `evidence`.

O conteúdo das missões fica em `data/missions.js` e é renderizado pelo componente reutilizável `js/step-renderer.js`. Assim, novas missões podem ser cadastradas como dados sem criar uma página HTML para cada uma.

## Laboratório

O laboratório atual executa HTML client-side em um `iframe` usando `srcdoc`. O código é salvo no estado local durante a edição.

## Persistência

Ainda é um MVP local: dados, respostas, código e progresso ficam no `localStorage`. A persistência centralizada e a autenticação real serão integradas posteriormente.

## Como executar

Use um servidor local, como Live Server no VS Code, e abra `index.html`.

## Tecnologias

HTML5, CSS3, JavaScript ES Modules e localStorage. Sem TypeScript e sem framework.


## Fase 4 — Gamificação
- XP concedido uma única vez por missão concluída (anti-farming)
- níveis progressivos da Jornada Web
- atualização automática do nível conforme XP
- conquistas iniciais: Primeira Missão, Primeiro Commit, Guilda em Ação e Fase Conquistada
- galeria de Conquistas
- dashboard conectado ao XP, nível e conquistas reais
- XP é motivacional e não substitui menção, indicadores ou avaliação do instrutor


## Fase 5 — Projetos e Guildas

- área dedicada ao Projeto Individual EduTech;
- repositório e evidências do projeto individual;
- área da Guilda para o Projeto Restaurante;
- cadastro local de nome, integrantes e repositório da Guilda;
- Quadro de Missões em Kanban (A Fazer, Em Missão, Em Revisão e Concluído);
- responsável, competências, evidência e histórico por tarefa;
- registro de contribuição individual da Guilda;
- persistência local integrada ao backup existente.


## Fase 6 — Acompanhamento Pedagógico

- área Competências da Jornada com os seis indicadores oficiais I1–I6;
- registros reflexivos do estudante por competência;
- contagem de evidências sem conversão automática em menção;
- área Meu Progresso integrando Jornada, EduTech, Guilda e evidências;
- próximas ações para continuidade do estudante;
- estrutura preparada para futura visão centralizada do instrutor quando houver backend/autenticação.


## Fase 7 — Conteúdo da UC7

- catálogo completo das 28 missões presenciais (14 fases × A/B);
- Missões A conectadas ao Projeto Individual EduTech;
- Missões B conectadas ao Projeto Restaurante da Guilda;
- competências relacionadas registradas por missão;
- sete Missões Extras correspondentes às 28h não presenciais;
- quatro Marcos Avaliativos alinhados ao PTD;
- conteúdo continua orientado a dados no Mission Engine, sem páginas HTML duplicadas por missão.
