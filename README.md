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
