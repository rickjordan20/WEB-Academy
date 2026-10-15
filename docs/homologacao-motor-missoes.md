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

**Evidência informada pelo instrutor (15/10/2026):** as duas suítes passaram: motor de missões 5/5 e merge de sincronização 4/4. Total: 9/9, nenhuma falha.

**Importante:** testes locais de merge não validam autenticação, políticas RLS, função RPC `save_student_state_cas` nem sincronização real com Supabase. Esses itens exigem teste integrado com duas sessões autenticadas. A verificação de cronograma e publicação também depende de ambiente e contas autorizadas.

## Roteiro de homologação funcional no navegador (pendente)

**Preparação:** usar conta de instrutor e conta de estudante de teste, matrícula ativa na turma correta, missão de teste e dois navegadores/perfis separados. Registrar captura, horário, turma, missão e resultado de cada cenário. Não alterar registros reais de estudantes.

| ID | Cenário | Ação | Resultado esperado | Status |
| --- | --- | --- | --- | --- |
| HF01 | Matrícula ativa | Entrar como estudante e selecionar a turma correta | Conteúdo e cronograma da turma selecionada | Pendente |
| HF02 | Antes da liberação | Abrir URL direta de missão futura | Aviso de indisponibilidade, sem iniciar missão | Pendente |
| HF03 | Durante a janela | Abrir missão liberada | Missão acessível conforme pré-requisitos | Pendente |
| HF04 | Após o prazo | Abrir URL direta de missão encerrada | Bloqueio com mensagem de prazo | Pendente |
| HF05 | Fundamentos | Tentar acessar prática sem concluir fundamentos | Prática não disponível | Pendente |
| HF06 | Fundamentos concluídos | Resolver etapas em sequência, recarregar | Conclusão persistida e prática liberada | Pendente |
| HF07 | Prática guiada | Executar passos com VS Code, salvar respostas | Ordem, links, comandos e dados preservados | Pendente |
| HF08 | Relatório individual | Preencher, concluir e reabrir | Respostas/evidências disponíveis sem perda | Pendente |
| HF09 | Missão da Guilda | Acessar missão B após conclusão de A | Acesso apenas quando permitido; sem XP duplicado | Pendente |
| HF10 | Edição do instrutor | Editar, pré-visualizar e publicar conteúdo de teste | Alteração aparece para estudante da mesma turma | Pendente |
| HF11 | Permissão do aluno | Tentar acessar edição/publicação | Operações negadas no cliente e no Supabase | Pendente |
| HF12 | Sincronização real | Alterar progresso no navegador A, entrar no B | Dados atualizados após sincronização | Pendente |
| HF13 | Conflito entre sessões | Criar evidências distintas em A e B | Nenhuma evidência descartada; sem XP duplicado | Pendente |
| HF14 | Responsividade | Abrir no celular e desktop | Etapas, formulários, links e botões utilizáveis | Pendente |

### Critérios de aprovação

- Todos os cenários críticos HF01–HF13 devem passar; HF14 precisa passar nos dispositivos-alvo.
- Qualquer erro de autorização, perda de dados ou liberação antecipada impede a homologação.
- Testes unitários aprovados não comprovam RLS, RPC, autenticação ou experiência completa do usuário.
- Somente registrar **Aprovado** após executar o cenário e guardar evidência; sem acesso ao navegador autenticado e às contas de teste, os cenários permanecem **Pendentes**.
