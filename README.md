# WEB-Academy — UC7 | Desenvolvimento de Aplicações Web

Plataforma de aprendizagem gamificada para a **UC7 — Desenvolver aplicações web**, do curso Técnico em Desenvolvimento de Sistemas. Reúne fundamentos, práticas guiadas, projetos, missões, evidências, acompanhamento pedagógico e entregas em um ambiente web.

> **Estado do projeto:** aplicação em evolução contínua, com autenticação e persistência em nuvem integradas ao código, além de testes automatizados isolados. A aprovação desses testes **não equivale à homologação completa** dos fluxos reais no navegador e no Supabase.

## Visão geral

- **Fundamentos:** conteúdo introdutório, questões, checkpoints e atividades práticas.
- **Prática guiada — EduTech:** aplicação individual dos conceitos em um projeto web.
- **Prática autônoma — Projeto Restaurante:** trabalho em Guildas, Kanban e registros individuais de colaboração.
- **Jornada:** missões organizadas por fases, desbloqueios, progresso e evidências.
- **Gamificação:** XP, níveis e conquistas; recompensas motivacionais, sem substituição da avaliação docente.
- **Acompanhamento:** indicadores, entregas, feedback e consulta ao histórico.
- **Gestão pedagógica:** turmas, cronograma e liberação de atividades conforme publicação e janela de acesso.

## Organização pedagógica

O catálogo da jornada contempla **14 fases**, com missões **A (EduTech)** e **B (Projeto Restaurante)**, além de atividades extras e marcos avaliativos. O conteúdo das missões é orientado a dados em `data/missions.js`, com renderização reutilizável em `js/step-renderer.js`.

Tipos de etapa disponíveis: `content`, `quiz`, `complete-code`, `editor`, `guided`, `reflection`, `checkpoint` e `evidence`.

O laboratório de HTML utiliza um `iframe` com `srcdoc` para pré-visualização. Respostas, tentativas e progresso podem ser preservados localmente.

## Acesso, prazos e entregas

O acesso às missões considera a turma ativa, o cronograma e o estado de publicação. As regras implementadas distinguem:

| Situação | Comportamento previsto |
| --- | --- |
| Não publicada ou ainda não aberta | Acesso à realização bloqueado |
| Publicada e dentro do prazo | Realização de etapas e entrega permitidas |
| Prazo encerrado | A missão continua disponível para realização e envio; a entrega exige justificativa e ciência de atraso |
| Entrega após o prazo | Permitida, com motivo e justificativa obrigatórios, marcada como **em atraso** |
| Entrega já avaliada | Novo envio bloqueado pelo formulário |

O envio apresenta uma revisão prévia do progresso e das pendências antes da confirmação. A entrega registra informações de prazo, respostas, evidências e uma fotografia do progresso para análise do instrutor.

**Atenção:** a consistência integral desse fluxo ainda depende de testes integrados com autenticação, banco de dados e interfaces reais.

## Construtor, calendário e disponibilidade (26/10/2026)

O construtor de missões (`mission-builder.html`, `js/mission-builder-page.js`) trabalha com os dois tipos de missão: **EduTech (A)** e **Projeto Restaurante/Guilda (B)**. O modelo EduTech separa fundamentos, prática guiada e relatório individual; o conteúdo técnico de cada etapa é editável. A Guilda utiliza prática autônoma, Kanban e evidências próprias. A autoavaliação EduTech é um formulário genérico compartilhado, com cartões, escala, checklist, escolha única, resposta curta e link de evidência.

### Regras do cronograma

- A **abertura** da missão é a data e hora de início da aula vinculada.
- O **prazo final** é um minuto antes da abertura da **próxima missão cadastrada** no cronograma, incluindo missões remotas. Não significa bloqueio de entrega.
- A **última missão**, sem sucessora, recebe provisoriamente o fim do próprio dia (23h59).
- Os campos são mostrados em dois blocos: **Dados da aula** e **Disponibilidade da missão**. A abertura e o prazo são derivados do cronograma, não editados isoladamente.
- Os valores persistem em `class_schedule.mission_open_at` e `class_schedule.mission_close_at` (fuso `America/Sao_Paulo`); a alteração da data/hora inicial no cronograma aciona a sincronização automática das janelas da UC7.
- A publicação é independente do calendário: uma missão não publicada permanece indisponível, ainda que sua data de abertura tenha chegado.
- A missão vencida **não pode ser encerrada automaticamente pelo prazo**. O estudante pode continuar e enviar com justificativa e confirmação de ciência; o instrutor analisa o atraso.
- A data de término da **aula** não é o prazo de entrega. O término da aula continua sendo um campo independente.

### Identificadores: atenção obrigatória

A jornada apresenta `1A, 1B, 1C, 2A, 2B...`, mas `data/missions.js` conserva identificadores **internos históricos** para progresso, entregas e avaliações. O cronograma usa o **identificador exibido** (por exemplo, `3B`). Ao buscar a aula no construtor, utilizar `mission.displayId`, não `mission.id` nem `mission.lesson`; ao salvar, usar o `id` da linha encontrada. Nunca migrar IDs de entregas existentes sem um plano específico.

**Ponto pendente:** a sequência inicial da jornada inclui `1C`, mas o cronograma consultado não contém uma linha `1C`. Verificar a vinculação dessa missão antes de afirmar que todas as missões têm janela de acesso. As missões remotas `R1...` têm seu próprio identificador.

### Testes e critérios de homologação

1. Abrir uma missão A e uma B no construtor e confirmar que ambas exibem os dois blocos do cronograma.
2. Conferir o mapeamento entre `displayId` e `class_schedule.mission_id`, especialmente `1C`, `2B`, `3B` e missões remotas.
3. Alterar a data/hora inicial de uma aula de teste e confirmar que a abertura e o prazo da missão anterior são recalculados sem alterar o conteúdo publicado ou as entregas.
4. Verificar a fronteira temporal (um minuto antes, no horário e após a abertura da próxima missão).
5. Entregar uma missão atrasada, conferir justificativa, ciência, marcação de atraso e visualização pelo instrutor.
6. Confirmar que missão não publicada continua bloqueada e que conta de instrutor não é tratada como estudante sem matrícula.
7. Testar responsividade, publicação, carregamento do relatório EduTech, respostas no Supabase e apresentação ao instrutor.

**Validação já realizada:** consultas SQL confirmaram a atualização das janelas da UC7; a sintaxe do construtor foi verificada e a implantação do frontend foi confirmada na Vercel. **Não foi concluído um teste autenticado ponta a ponta** de todas essas condições. O calendário foi sincronizado com os dados existentes, inclusive horários atípicos: revisar no cronograma aulas com início diferente do esperado.

## Guildas e participação individual

O Projeto Restaurante utiliza tarefas em Kanban, atribuição de responsabilidades e registros de contribuições. A visualização individual filtra os registros pelo estudante selecionado, incluindo descrições e links de evidências quando disponíveis.

**Tarefa atribuída ou concluída não é, por si só, comprovação automática de aprendizagem.** A avaliação depende das evidências e da análise do instrutor.

## Indicadores e avaliação

A plataforma apoia o acompanhamento dos indicadores da UC e o registro de evidências. O **XP é motivacional** e não determina automaticamente menções ou o resultado final da unidade curricular. A homologação pedagógica continua sob responsabilidade do instrutor.

## Arquitetura e persistência

- **Frontend:** HTML5, CSS3 e JavaScript com ES Modules, sem TypeScript e sem framework obrigatório.
- **Dados locais:** `localStorage` como cache e contingência, com recursos de backup.
- **Backend integrado:** Supabase/PostgreSQL, autenticação, turmas, membros, entregas e estado do estudante.
- **Sincronização:** `js/cloud-sync.js` realiza mesclagem de estados e utiliza rotina de gravação com controle de concorrência; `js/mission-engine.js` controla o progresso.
- **Segurança:** políticas de acesso e operações reais do Supabase exigem verificação integrada, incluindo RLS.

A sincronização procura preservar etapas concluídas, evidências e o maior XP registrado. **Conflitos simultâneos em respostas e cenários reais de múltiplos dispositivos ainda precisam de homologação adicional.**

## Executar localmente

1. Clone o repositório.
2. Abra a pasta no VS Code.
3. Execute com um servidor HTTP local, por exemplo a extensão **Live Server**.
4. Abra `index.html` no navegador.

Recursos que dependem de autenticação, turmas e banco de dados requerem configuração válida do Supabase. Não publique credenciais privadas ou chaves de serviço no repositório.

## Testes automatizados sem contas reais

O projeto possui uma suíte isolada em `tests/`, executada pelo GitHub Actions em `.github/workflows/isolated-tests.yml`.

| Arquivo | Cobertura |
| --- | --- |
| `tests/integrity.test.mjs` | Sequência de etapas, mesclagem de progresso e evidências, salvamentos redundantes e bloqueio por prazo |
| `tests/participation.test.mjs` | Filtragem de contribuições individuais, isolamento entre colegas e estimativa de XP |
| `tests/delivery-contract.test.mjs` | Verificações estáticas do contrato de entrega: revalidação do prazo, atraso, justificativa, confirmação e bloqueio após avaliação |

Executar localmente com **Node.js 22**:

```bash
node --experimental-vm-modules --test tests/*.test.mjs
```

O fluxo automático é acionado por alterações relevantes no código, nos testes ou no workflow, por pull requests e manualmente no GitHub Actions.

**Histórico de validação (25/10/2026):** as três primeiras execuções do workflow foram concluídas com status **Success** na branch `master`, conforme verificação do painel GitHub Actions. Isso comprova a aprovação da suíte executada nessas revisões, **não** a ausência de falhas em toda a plataforma.

[Consultar execuções no GitHub Actions](https://github.com/rickjordan20/WEB-Academy/actions/workflows/isolated-tests.yml)

### Limites dos testes atuais

- Os testes de participação usam dados fictícios e respostas simuladas do banco.
- Os testes de entrega verificam trechos do código, mas **não** executam um envio completo.
- Ainda faltam testes integrados do envio e da avaliação pelo instrutor, permissões RLS, concorrência real no Supabase e navegação ponta a ponta no navegador.
- Nenhum teste isolado precisa utilizar contas ou modificar dados reais de estudantes.

## Estrutura principal

```text
data/                        Conteúdos, fundamentos e definições das missões
js/                          Interface, progresso, entregas, sincronização e gamificação
tests/                       Testes automatizados isolados
.github/workflows/           Integração contínua no GitHub Actions
index.html                   Entrada da aplicação
README.md                    Documentação do projeto
```

## Próximas validações

1. Simular o fluxo completo de entrega atrasada e exibição ao instrutor.
2. Homologar permissões e isolamento de dados por turma/usuário em ambiente de testes.
3. Validar sincronização simultânea, conflitos de respostas e recuperação após falhas de rede.
4. Testar navegação, acessibilidade e responsividade com perfis fictícios.

---

**Projeto educacional em desenvolvimento contínuo.** As alterações devem preservar os registros existentes, manter a separação entre XP e avaliação docente e priorizar a rastreabilidade das evidências individuais.
