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

## Avaliação com IA, evidências e ficha individual (31/10/2026)

A **Central de Avaliação** (`instructor.html#evaluations`, `js/instructor-mission-reviews.js`) permite analisar entregas individuais e de Guilda. A listagem identifica a modalidade, o código da missão e, para atividades do Restaurante, procura apresentar o nome da Guilda do estudante. A ficha exibe enunciados e orientações disponíveis nas definições da missão, respostas, checks, evidências, histórico de colaboração e indicadores.

### Contrato da análise por IA

A função Supabase Edge `supabase/functions/mission-ai-review/index.ts` (implantada como `mission-ai-review`, **v33** em 30/10/2026) autentica o solicitante, confirma que é instrutor da turma, lê a entrega e consulta indicadores curriculares e eventuais sobrescritas de conteúdo. O frontend fornece as etapas e suas chaves de revisão. A função utiliza Groq como primeira opção e Gemini como alternativa quando configurados; a saída estruturada contém resumo, feedback, indicadores, análises por bloco e observações sobre checks.

**Critérios pedagógicos incorporados à instrução da IA:**

| Classificação de observação | Conduta esperada |
| --- | --- |
| Requisito atendido | Reconhecer o acerto com referência à resposta |
| Erro comprovado | Explicar a falha demonstrável e a correção pertinente |
| Evidência insuficiente | Indicar o que não foi possível verificar, sem presumir erro |
| Melhoria opcional | Sugerir sem reduzir a qualidade ou a menção |

- Julgar a resposta **pelo enunciado original**, sem exigir CSS, JavaScript, uma página inteira ou requisitos adicionais quando não solicitados.
- Não tratar a ausência de elementos fora de um **fragmento de código** como erro comprovado.
- Preservar acertos em questões objetivas e evitar feedback repetitivo ou genérico.
- Consolidar primeiro competências demonstradas; depois erros comprovados, lacunas de evidência e melhorias opcionais.
- Tratar `A`, `PA`, `NA` e `SEM_EVIDENCIA` como **sugestões sujeitas à decisão docente**. `SEM_EVIDENCIA` não equivale automaticamente a `NA`.
- **Não atribuir XP por IA.** O XP elegível/calculado pela plataforma, a qualidade técnica e a menção pedagógica são informações distintas. Homologação permanece com o instrutor.

Essas são **instruções do modelo**, não garantias determinísticas: a saída ainda exige conferência humana. A função limita e filtra parte do JSON retornado, mas não comprova automaticamente a correção semântica de todas as afirmações.

### Tratamento específico das missões em grupo — Restaurante

Quando o frontend identifica a missão como `type: "guild"`, a função busca no Supabase os vínculos do estudante, a Guilda da turma, tarefas e contribuições do Kanban. O contexto fornecido à IA diferencia:

- **Tarefas da missão atual:** criadas ou atribuídas ao estudante, com status e evidências cadastradas.
- **Tarefas históricas:** registros de outros IDs, mantidos como histórico, **sem conversão automática** entre missões A/B.
- **Contribuições individuais:** descrições e evidências registradas pelo estudante.
- **Autoavaliação:** declaração do estudante, que deve ser confrontada com os registros, e não tomada como prova suficiente.

Uma tarefa criada não equivale a tarefa concluída; uma tarefa concluída não comprova, isoladamente, a autoria ou qualidade do código. Se a Guilda não puder ser identificada inequivocamente, o parecer deve ficar pendente de revisão, **não** concluir falta de participação. A IA **não inspeciona automaticamente commits nem arquivos do GitHub**.

**Limites conhecidos:** o gatilho para consultar a Guilda depende do `missionType` enviado pelo frontend; o servidor ainda não valida independentemente a classificação da missão. O vínculo de Guilda pode ser ambíguo em históricos de múltiplos grupos; tarefas com IDs antigos exigem conciliação manual. A disponibilidade de dados também depende das políticas de acesso do Supabase. Não assumir que a IA viu evidências que não foram retornadas pela consulta.

### Fluxo de homologação recomendado

1. Abrir a entrega e conferir o identificador e a modalidade da missão, turma, estudante e Guilda.
2. Ler os **enunciados completos** e confrontá-los com cada resposta; conferir o gabarito quando configurado.
3. Para Restaurante, comparar autoavaliação, tarefas atribuídas/criadas/concluídas e contribuições; verificar repositório quando necessário.
4. Executar **Analisar entrega com IA** e revisar o parecer por bloco e indicador. Uma análise ausente não deve ser apresentada como avaliação concluída.
5. Corrigir afirmações não sustentadas, separar requisitos obrigatórios de melhorias opcionais e registrar feedback individualizado.
6. Somente então homologar menção e XP conforme regras do sistema, sem confundir pontuação com evidência pedagógica.

**Estado de validação:** função v33 implantada no Supabase e alterações do frontend registradas no GitHub. **Não foi comprovado teste autenticado ponta a ponta com entrega real após essas mudanças.** Pareceres anteriores não são reprocessados automaticamente.

## Ranking de destaques

A página `leaderboard.html` apresenta todos os alunos e Guildas da turma em ordem decrescente, com destaque visual para os três primeiros. A consulta é feita pela função Supabase `uc7_class_leaderboard`:

- **Alunos:** XP, depois missões concluídas, entregas registradas e nome como desempate.
- **Guildas:** tarefas concluídas, depois média de XP dos integrantes e nome como desempate.
- A página exibe XP, progresso e entregas individuais; para Guildas, tarefas concluídas/total, percentual, média de XP e número de integrantes.

A classificação é **formativa**, não determina nota, menção nem aprovação. É necessário validar os totais e o vínculo de turma em sessões reais antes de usá-la como relatório oficial.

## Notificações e suporte técnico

- `notification-manager.html` e `js/student-notifications.js`: avisos da turma, notificações de entregas e atualizações relevantes, conforme os eventos configurados.
- `support-tickets.html` e `js/site-support.js`: abertura e acompanhamento de chamados com contexto da página, eventos recentes do navegador e diagnóstico técnico. A coleta é limitada à sessão do componente; não substitui logs de servidor.
- O botão global de suporte e a visualização de chamados devem ser testados em telas responsivas e com perfis de estudante/instrutor.

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
