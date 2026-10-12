# UC7 Web Academy — Fase 2: Motor da Jornada

Plataforma web gamificada de apoio à UC7 — Desenvolver aplicações web.

## Implementado

### Fundação
- identidade visual responsiva
- identificação do estudante e dashboard
- persistência em `localStorage`
- backup/restauração JSON
- estrutura modular HTML/CSS/JavaScript puro

### Motor da Jornada
- mapa interativo das 14 Fases
- estados: bloqueada, disponível, em andamento e concluída
- progressão e desbloqueio sequencial
- retomada da missão pelo estado salvo
- Mission Engine orientado a dados
- Missão 1A e 1B como demonstração funcional do motor
- etapas internas com conclusão persistente
- atualização do progresso geral da Jornada
- separação entre Missão de Treinamento e Missão da Guilda

## Fluxo atual

`Dashboard → Mapa da Jornada → Fase → Missão → Etapas → Conclusão → Desbloqueio`

A Fase 01 começa com a Missão 1A disponível. Ao concluí-la, a 1B é desbloqueada. Ao concluir a 1B, a Fase 02 passa a ser a fase atual.

## Importante

O Motor de Missões já funciona, mas o conteúdo didático completo ainda não foi implementado. As etapas atuais da Fase 01 demonstram arquitetura, progressão e persistência.

A próxima implantação é o **Ambiente Interativo de Aprendizagem**, com conteúdos, checkpoints, desafios, editor HTML/CSS/JavaScript, preview e feedback.

## Como executar

Use um servidor local, como Live Server no VS Code, para garantir o funcionamento consistente dos módulos ES.

## Tecnologias

- HTML5
- CSS3
- JavaScript ES Modules
- localStorage

Sem TypeScript e sem framework.
