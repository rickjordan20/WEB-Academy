# UC7 Web Academy — Fase 1: Fundação

MVP inicial da plataforma gamificada de apoio à UC7 — Desenvolver aplicações web.

## O que já está implementado

- Identidade visual responsiva da UC7 Web Academy
- Tela de identificação do estudante
- Dashboard inicial
- Navegação preparada para as áreas futuras
- Estrutura visual da Jornada Web
- Estrutura-base das 14 Fases
- Modelo inicial das 6 competências oficiais
- Estado do estudante em `localStorage`
- Exportação de backup JSON
- Importação/restauração de backup
- Limpeza de dados com dupla confirmação
- Estrutura modular em HTML, CSS e JavaScript puro
- Base preparada para a Fase 2 — Motor da Jornada

## Como executar

A opção mais simples é abrir `index.html` no navegador.

Para desenvolvimento, recomenda-se servir a pasta por um servidor local, por exemplo a extensão Live Server do VS Code.

## Persistência

Nesta Fase 1, os dados ficam apenas no navegador do dispositivo utilizado (`localStorage`).

Isso significa que os dados **não são sincronizados entre dispositivos** e o instrutor não recebe automaticamente o progresso dos estudantes. Use o recurso de backup JSON para preservar/restaurar o estado.

## Próxima implantação

Fase 2 — Motor da Jornada:
- mapa interativo das 14 Fases
- desbloqueio e progressão
- estados das missões
- Mission Engine orientado a dados
- retomada de missão
- estrutura para Missão de Treinamento e Missão da Guilda

## Tecnologias

- HTML5
- CSS3
- JavaScript ES Modules
- localStorage

Sem TypeScript e sem framework.
