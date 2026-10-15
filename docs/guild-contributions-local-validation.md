# Etapa 1 — validar contribuições individuais no Docker local

A aplicação continua usando a configuração de produção por padrão. O modo local só é ativado explicitamente no Live Server.

## 1. Criar a configuração local (não versionada)

No PowerShell, na raiz do repositório:

```powershell
Copy-Item .\js\supabase-config.local.example.js .\js\supabase-config.local.js
```

Abra `js/supabase-config.local.js` e preencha a chave publishable local exibida por `npx supabase@2.121.0 status`. Use a URL local mostrada pelo mesmo comando (normalmente `http://127.0.0.1:54321`). Não use uma secret/service_role key.

O arquivo `js/supabase-config.local.js` está no `.gitignore` e não deve ser enviado ao GitHub.

## 2. Aplicar a migração apenas ao Docker local

A migração é idempotente para a tabela e os índices; as três políticas são recriadas:

```powershell
cmd /c "docker exec -i supabase_db_WEB-Academy psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase\migrations\20261015090000_guild_task_contributions.sql"
```

Confirme que a tabela e as políticas existem:

```powershell
docker exec supabase_db_WEB-Academy psql -U postgres -d postgres -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname='public' AND tablename='guild_task_contributions'; SELECT policyname, cmd FROM pg_policies WHERE schemaname='public' AND tablename='guild_task_contributions' ORDER BY policyname;"
```

## 3. Executar o teste RLS de contribuições

```powershell
cmd /c "docker exec -i supabase_db_WEB-Academy psql -U postgres -d postgres -v ON_ERROR_STOP=1 < supabase\tests\006_guild_task_contributions.sql"
```

O teste usa IDs sintéticos e termina com `ROLLBACK`; não cria contas nem dados persistentes.

## 4. Abrir a aplicação local

Abra a página de login do Live Server com `?backend=local` no final da URL, por exemplo:

```text
http://127.0.0.1:5500/auth.html?backend=local
```

O modo local fica selecionado somente nessa origem do navegador até ser removido. Para voltar ao backend padrão de produção no Live Server, abra `auth.html?backend=production`. A URL de produção hospedada sempre usa a configuração de produção, mesmo se houver parâmetros na URL.

O banco local está vazio neste momento; é necessário cadastrar uma conta local e preparar uma Guilda/tarefa de teste antes de testar a interface autenticada.

## Segurança e publicação

- Não execute a migração no projeto Supabase hospedado durante a validação local.
- Não publique `supabase-config.local.js`.
- A aplicação não deve ser integrada à `master` até que o teste RLS passe e a migração seja aplicada no ambiente de destino antes da publicação do frontend.
