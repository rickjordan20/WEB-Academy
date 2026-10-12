# Supabase — UC7 Web Academy

A Fase 9 prepara a migração do MVP local para persistência centralizada.

## Modelo inicial
- profiles: usuário e papel (student/instructor)
- classes: turmas
- class_members: estudantes vinculados à turma
- guilds: guildas por turma
- guild_members: integrantes vinculados por UUID
- student_states: estado completo da Jornada sincronizado em JSONB

## Segurança
As tabelas usam Row Level Security. O estudante pode alterar o próprio perfil e estado. O instrutor pode administrar suas turmas e Guildas e consultar estados de estudantes vinculados à sua turma. Nunca coloque uma chave service_role no navegador.

## Frontend
Copie js/supabase-config.example.js para js/supabase-config.js e preencha SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY. O arquivo real está no .gitignore.

Sem esse arquivo, a plataforma continua funcionando no modo local já existente. Com ele, index.html encaminha para autenticação real e as páginas da aplicação exigem sessão.

## Próxima configuração
Depois de criar o projeto Supabase da UC7:
1. aplicar 001_initial_schema.sql;
2. cadastrar o primeiro usuário;
3. promover o perfil do instrutor para role instructor;
4. criar a turma 2026.36.8;
5. vincular os estudantes cadastrados à turma;
6. ativar a seleção de integrantes da Guilda a partir de class_members.
