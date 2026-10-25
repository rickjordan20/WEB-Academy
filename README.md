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
| Prazo encerrado | Consulta do conteúdo e progresso; novas etapas bloqueadas |
| Entrega após o prazo | Permitida, com motivo e justificativa obrigatórios, marcada como **em atraso** |
| Entrega já avaliada | Novo envio bloqueado pelo formulário |

O envio apresenta uma revisão prévia do progresso e das pendências antes da confirmação. A entrega registra informações de prazo, respostas, evidências e uma fotografia do progresso para análise do instrutor.

**Atenção:** a consistência integral desse fluxo ainda depende de testes integrados com autenticação, banco de dados e interfaces reais.

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
