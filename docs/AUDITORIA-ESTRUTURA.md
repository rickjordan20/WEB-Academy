# Auditoria de estrutura — WEB-Academy

## Inventário inicial (25/10/2026)

Árvore da branch `master` consultada antes das alterações: **184 entradas** (arquivos e diretórios), sem truncamento na API do GitHub.

| Área | Situação | Decisão |
| --- | --- | --- |
| Páginas HTML | Páginas na raiz (incluindo `index.html`, `mission.html`, `instructor.html`) | **Manter URLs públicas** para preservar links e GitHub Pages |
| `js/` | Módulos ES usados por páginas e por outros módulos | Mapear imports antes de qualquer movimentação |
| `css/` | Estilos globais e por tela | Manter caminhos atuais nesta etapa |
| `data/` | Definições pedagógicas e conteúdo | Preservar imports relativos |
| `assets/` | Recursos estáticos | Preservar caminhos referenciados |
| `supabase/migrations/` | Migrações numeradas e datadas | **Não renomear nem mover**; histórico de aplicação |
| `supabase/tests/` | Testes SQL | Preservar |
| `tests/` | Testes Node e Playwright | Adicionar verificação de caminhos |
| `.github/workflows/` | CI existente | Continuar usando workflow de testes isolados |
| `docs/` | Relatórios e instruções | Concentrar documentação de arquitetura e auditoria |

## Dependências críticas observadas

- `mission.html` importa `js/mission-page.js` e estilos com caminhos relativos à raiz.
- `js/mission-page.js` importa `mission-window.js`, `mission-delivery.js`, `mission-engine.js`, `storage.js` e outros módulos relativos a `js/`.
- Mover uma página HTML para `pages/` muda a resolução de `href`, `src` e de links já compartilhados com estudantes.
- Mover um módulo JS sem atualizar seus imports transitivos pode impedir a inicialização da página.
- As migrações SQL são parte do histórico do banco; reorganizá-las é desnecessário e arriscado.

## Primeira intervenção segura

Foi adicionado `tests/paths-integrity.test.mjs`, que procura referências locais quebradas em HTML e imports estáticos relativos em JS/MJS. O teste roda no mesmo workflow automatizado já existente.

**Nesta etapa, nenhum HTML, JS de produção, CSS, migração ou dado foi movido.** O objetivo é criar uma linha de base verificável antes de refatorações estruturais.

## Sequência proposta

1. Executar o teste de integridade de caminhos e investigar eventuais falhas preexistentes.
2. Classificar módulos por domínio (autenticação, jornada, entregas, instrutor, guildas), sem mudar seus caminhos.
3. Identificar duplicações por análise de conteúdo e referências; não excluir com base apenas em nomes parecidos.
4. Reorganizar em lotes pequenos numa branch, ajustando imports, scripts e CSS correspondentes.
5. Validar CI, páginas principais, fluxo do estudante e do instrutor antes de qualquer merge.

**Regra de compatibilidade:** manter páginas públicas nos URLs atuais. Mudanças de diretórios internos só entram na `master` após revisão e testes. Nenhuma operação no Supabase de produção está prevista.
