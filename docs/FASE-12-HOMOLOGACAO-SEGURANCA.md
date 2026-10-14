# Fase 12 — Homologação geral e segurança (auditoria parcial)

Data: 14/10/2026. Escopo: Projeto Restaurante, Kanban, auditoria de participação e Supabase UC7 Web Academy.

## Resultados efetivamente verificados no Supabase online (somente leitura)

- Projeto ativo, com **2 Guildas, 5 tarefas e 7 eventos de auditoria**.
- **52 migrações** registradas, incluindo as três de permissões e a auditoria de tarefas.
- **8 políticas RLS** distribuídas entre `guild_tasks`, `guild_task_collaborators` e `guild_task_activity`.
- **3 gatilhos** em `guild_tasks` e **1 gatilho** em `guild_task_collaborators`.
- Eventos observados: **4 status_changed** e **3 responsible_changed**.
- Funções RPC críticas amostradas (`create_guild_manual_task`, `update_guild_task_collaboration`, `delete_managed_class`) possuem checagens de autorização no corpo; `anon` não possui EXECUTE nessas funções. Isso **não substitui testes adversariais com identidades autenticadas distintas**.

## Avisos do Supabase Advisor

Segurança:
- **13** funções SECURITY DEFINER executáveis por `authenticated`: revisar autorização interna função por função; não revogar indiscriminadamente porque podem sustentar fluxos legítimos.
- Proteção contra senhas vazadas no Auth: aviso de configuração pendente.

Desempenho:
- **6** chaves estrangeiras sem índice próprio.
- **5** avisos de otimização de expressões RLS.
- **2** avisos de políticas permissivas múltiplas.
- **6** índices potencialmente não utilizados. Não remover sem observar carga real.

Referência: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

## Matriz de homologação

| Cenário | Resultado | Observação |
|---|---|---|
| Integridade de dados e histórico | Aprovado na consulta | Nenhuma alteração destrutiva |
| Migrações recentes registradas | Aprovado | Conferidas no banco |
| Triggers de auditoria presentes | Aprovado na consulta | Sem simulação destrutiva |
| Segurança RLS / RPC por perfil | Parcial | Revisão estática; faltam testes de líder, integrante, responsável, colaborador, instrutor e usuário externo |
| Saída de integrante / exclusão de tarefa | Não executado | Exige ambiente isolado e dados descartáveis |
| Concorrência de dois usuários | Não executado | Exige sessões simultâneas |
| Backup e restauração | Não executado | Não existe cópia restaurada validada |
| Playwright e pgTAP pós-auditoria | Não executado nesta rodada | Reexecutar no ambiente local |
| Auditoria de evidência e colaborador | Parcial | Triggers presentes; requer teste autenticado de ponta a ponta |
| Revisão de funções SECURITY DEFINER | Parcial | Avisos documentados; não equivale a vulnerabilidade confirmada |

## Decisão de homologação

**Fase 12 ainda NÃO homologada integralmente.** O banco online foi consultado, não modificado. Não foram criados usuários fictícios, excluídas tarefas ou aplicadas alterações de permissões.

## Próximas ações objetivas

1. No ambiente local, executar a suíte pgTAP e Playwright; registrar logs e totais reais.
2. Testar operações permitidas e negadas com usuários de cada papel, incluindo usuário de outra Guilda.
3. Testar exclusão, saída de Guilda e concorrência com registros descartáveis.
4. Criar backup verificável e executar restauração em projeto isolado antes de considerar o plano de recuperação validado.
5. Inspecionar individualmente as 13 funções sinalizadas e decidir se cada exposição é necessária, documentando autorização e risco.
6. Reavaliar avisos de desempenho após obter métricas de uso.

**Não promover para produção como homologação total até que os cenários pendentes tenham evidências.**
