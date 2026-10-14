import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Testes isolados no Chromium: nao acessam Supabase, contas ou Guildas reais.
// As funcoes sao extraidas do codigo de producao para evitar reimplementar as regras.
const source = readFileSync(fileURLToPath(new URL('../js/guild-page.js', import.meta.url)), 'utf8');
function extract(name) {
  const line = source.split('\n').find(line => line.startsWith('const ' + name + '='));
  if (!line) throw new Error('Regra ausente no codigo de producao: ' + name);
  return line.slice(line.indexOf('=>') + 2).replace(/;\s*$/, '');
}
const manage = extract('canManageTask');
const contribute = extract('canContributeTask');

async function permissions(page, { role = 'member', user = 'member', creator = 'creator', responsible = 'responsible', collaborator = false } = {}) {
  return page.evaluate(({ manage, contribute, role, user, creator, responsible, collaborator }) => {
    const officialGuild = { role };
    const session = { user: { id: user } };
    const taskCollaboratorIds = new Set(collaborator ? ['task-1'] : []);
    const canManageTask = new Function('officialGuild', 'session', 't', 'return (' + manage + ')')(officialGuild, session);
    const canContributeTask = new Function('canManageTask', 'session', 'taskCollaboratorIds', 't', 'return (' + contribute + ')')(canManageTask, session, taskCollaboratorIds);
    const t = { id: 'task-1', created_by: creator, responsible_user_id: responsible };
    return { manage: canManageTask(t), contribute: canContributeTask(t) };
  }, { manage, contribute, role, user, creator, responsible, collaborator });
}

test('lider gerencia e contribui', async ({ page }) => {
  expect(await permissions(page, { role: 'leader' })).toEqual({ manage: true, contribute: true });
});
test('criador gerencia e contribui', async ({ page }) => {
  expect(await permissions(page, { user: 'creator' })).toEqual({ manage: true, contribute: true });
});
test('responsavel contribui, mas nao gerencia', async ({ page }) => {
  expect(await permissions(page, { user: 'responsible' })).toEqual({ manage: false, contribute: true });
});
test('colaborador contribui, mas nao gerencia', async ({ page }) => {
  expect(await permissions(page, { collaborator: true })).toEqual({ manage: false, contribute: true });
});
test('integrante comum nao pode modificar tarefa', async ({ page }) => {
  expect(await permissions(page)).toEqual({ manage: false, contribute: false });
});
test('interface contem controles e bloqueios de permissao', async () => {
  for (const token of ['data-task-collaborator', 'data-edit-task', 'data-delete-task', 'canContributeTask(t)?"":"disabled"', 'canManageTask(t)&&t.source!=="mission"']) {
    expect(source, 'Controle ausente: ' + token).toContain(token);
  }
});
test('exclusao exige confirmacao de linha afetada', async () => {
  expect(source).toContain('if(!data?.length)throw new Error(');
});
