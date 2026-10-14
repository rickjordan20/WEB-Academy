# Homologação local da Fase 10 — sem custo de branch Supabase

Requisitos: Docker Desktop em execução, Node.js e Supabase CLI (instalada conforme documentação oficial). Não conectar o CLI ao projeto remoto durante estes testes.

1. Faça checkout da branch `fase-10-motor-pedagogico`.
2. Execute `supabase start` para iniciar os serviços locais. Consulte `supabase --help` e `supabase start --help` se a versão instalada usar opções diferentes.
3. Confira as migrações existentes no diretório `supabase/migrations`. Este repositório pode conter apenas parte do histórico que já foi aplicado ao banco remoto. **Não execute `supabase db reset` até confirmar que o esquema base local está completo.**
4. No banco local, aplique a migração `019_student_state_cas.sql` somente após a tabela `public.student_states` e a função `auth.uid()` existirem. Nunca executar no banco de produção durante a homologação.
5. Crie duas contas locais de teste e faça login em duas sessões separadas. Use o mesmo usuário em dois navegadores para o teste de concorrência e outro usuário para isolamento.
6. Dispositivo A: concluir uma etapa e registrar evidência. Dispositivo B: concluir outra etapa e registrar evidência sem atualizar a página. Sincronizar ambos e recarregar. Ambas as etapas e evidências devem permanecer.
7. Repita com respostas diferentes, XP, indicadores e modo offline/retorno da conexão. Verifique que o usuário B não consegue modificar o estado do usuário A.
8. Teste as 3 áreas pedagógicas da Fase 1: Fundamentos, prática guiada e missão da Guilda; verifique o desbloqueio, registro individual e painel do instrutor.
9. Registre evidências e erros antes de mesclar o PR #9.

**Importante:** a função CAS precisa ser aplicada localmente antes de testar `pushCloudState`. Sem isso a chamada RPC falha. A validação de RLS exige tokens autenticados reais, não apenas uma consulta administrativa ao banco. Uma instalação local não reproduz automaticamente os dados e configurações de produção.
