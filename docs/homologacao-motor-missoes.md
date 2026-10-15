# Homologação do motor de missões

Status: **em validação**. Não incorporar a branch sem executar a regressão.

## Testes de regressão (aluno de teste)

1. Abrir a missão 1A antes de concluir F1: prática guiada deve permanecer bloqueada.
2. Tentar completar o último passo de F1 antes do primeiro: a função deve retornar false e não registrar conclusão.
3. Concluir F1 em ordem: liberar 1A, sem XP de missão ainda.
4. Tentar completar o último passo de 1A antes dos anteriores: deve retornar false.
5. Tentar chamar completeMission('1A') com etapas pendentes: deve retornar false, sem XP e sem desbloquear 1B.
6. Concluir todas as etapas 1A: registrar uma única conclusão e liberar 1B.
7. Repetir conclusão de 1A: não duplicar XP, evidências ou progresso.
8. Recarregar página, sair e entrar: verificar persistência do progresso.
9. Testar matrícula em duas turmas: cabeçalho, cronograma e janela de acesso devem usar a mesma turma ativa.
10. Testar missão fora do prazo: interface deve bloquear execução.
11. Editar, salvar, pré-visualizar e publicar missão com perfil instrutor; confirmar conteúdo com perfil aluno.
12. Repetir com conta aluno para confirmar que não pode editar nem publicar.
13. Testar em celular e desktop, incluindo links e comandos copiáveis.
14. Testar sincronização em dois dispositivos e conflitos de progresso.

## Atenções
- As regras de ordem e pré-requisitos foram reforçadas no motor JavaScript, mas isso não substitui validação de permissões no backend.
- Dados antigos podem conter etapas concluídas fora da ordem: verificar compatibilidade antes do merge.
- A UI valida respostas de questões, mas o motor de progresso não valida autonomamente a correção do conteúdo. Avaliar endurecimento da regra sem prejudicar atividades reflexivas.
- Nenhum dos testes acima foi marcado como aprovado automaticamente.

## Execução automatizada

No terminal do VS Code, com a branch de homologação selecionada:

```bash
node --test tests/*.test.mjs
```

**Evidência informada pelo instrutor (15/10/2026):** os cinco testes iniciais de `tests/mission-engine.test.mjs` passaram (5/5, nenhuma falha). Os quatro novos testes de `tests/cloud-sync.test.mjs` ainda aguardam execução.

**Importante:** testes locais de merge não validam autenticação, políticas RLS, função RPC `save_student_state_cas` nem sincronização real com Supabase. Esses itens exigem teste integrado com duas sessões autenticadas. A verificação de cronograma e publicação também depende de ambiente e contas autorizadas.
