import { test, expect } from '@playwright/test';

const categories = [
  ['brincos', 'Brincos'],
  ['esculturas', 'Esculturas'],
  ['esculturas-biscuit', 'Esculturas de biscuit'],
  ['decoracao', 'Decoração'],
  ['quadros', 'Quadros'],
  ['personalizadas', 'Peças personalizadas'],
  ['colecionaveis', 'Colecionáveis'],
  ['outros-artesanatos', 'Outros artesanatos'],
];

async function setup(page, { oldBackend = false, mismatch = false, reject = false } = {}) {
  let products = [{ id: 1, name: 'Peça antiga', price: 20, category: null, available: true }];
  const writes = [];
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.route('**/track/**', (route) => route.fulfill({ json: {} }));
  await page.route('**/api/**', (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    if (path === '/api/admin/check') return route.fulfill({ status: 204 });
    if (path === '/api/products/catalog') {
      if (oldBackend) return route.fulfill({ status: 400 });
      const category = new URL(request.url()).searchParams.get('categoria');
      const content = category ? products.filter((p) => p.category === category) : products;
      return route.fulfill({
        json: {
          content,
          page: 1,
          size: 12,
          totalPages: content.length ? 1 : 0,
          totalElements: content.length,
        },
      });
    }
    if (path === '/api/products/filters') return route.fulfill({ json: { materials: [] } });
    if (path === '/api/products' && method === 'GET') return route.fulfill({ json: products });
    if (path.startsWith('/api/products') && ['POST', 'PUT'].includes(method)) {
      const payload = request.postDataJSON();
      writes.push({ method, payload });
      if (reject)
        return route.fulfill({
          status: 400,
          json: { detail: 'Categoria inválida. Selecione uma das categorias disponíveis.' },
        });
      const product = { ...payload, id: method === 'POST' ? 2 : Number(path.split('/').pop()) };
      products = [...products.filter((p) => p.id !== product.id), product];
      return route.fulfill({
        json: mismatch ? { ...product, category: 'outros-artesanatos' } : product,
      });
    }
    return route.fulfill({ json: [] });
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/login');
  await page.getByLabel('Usuário', { exact: true }).fill('admin-test');
  await page.getByLabel('Senha', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Entrar no estúdio' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto('/admin?view=products');
  return { writes, errors };
}

for (const [category, label] of categories) {
  test(`categoria ${category}: criação, edição, recarga e filtro público`, async ({ page }) => {
    const { writes, errors } = await setup(page);
    await page.getByRole('button', { name: 'Novo produto', exact: true }).click();
    const select = page.getByRole('combobox', { name: 'Categoria', exact: true });
    await expect(select).toHaveValue('');
    await page.getByLabel('Nome da peça').fill('Peça criada');
    await page.getByLabel('Preço (R$)').fill('80');
    await select.selectOption(category);
    await page.getByRole('button', { name: 'Criar produto', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(writes[0].payload.category).toBe(category);
    await page.reload();
    const row = page.locator('.data-table tbody tr').filter({ hasText: 'Peça criada' });
    await expect(row).toContainText(label);
    await row.getByRole('button', { name: 'Editar Peça criada', exact: true }).click();
    await expect(select).toHaveValue(category);
    await page.getByLabel('Nome da peça').fill('Peça editada');
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(writes[1].payload.category).toBe(category);
    // Updating a legacy product must explicitly save the selected category too.
    await page.getByRole('button', { name: 'Editar Peça antiga', exact: true }).click();
    await expect(select).toHaveValue('');
    await expect(page.getByText(/Esta peça está sem uma categoria válida/)).toBeVisible();
    await select.selectOption(category);
    await page.getByRole('button', { name: 'Salvar alterações' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(writes[2].payload.category).toBe(category);
    await page.goto(`/catalogo?categoria=${category}`);
    await expect(page.locator('.art-card')).toHaveCount(2);
    await expect(page.locator('.art-card').first()).toContainText(label);
    expect(errors).toEqual([]);
  });
}

test('categoria ausente não envia produto nem atribui Outros artesanatos', async ({ page }) => {
  const { writes } = await setup(page);
  await expect(page.locator('.data-table tbody tr').first()).toContainText('Sem categoria');
  await page.getByRole('button', { name: 'Novo produto', exact: true }).click();
  await page.getByLabel('Nome da peça').fill('Sem categoria');
  await page.getByLabel('Preço (R$)').fill('20');
  await page.getByRole('button', { name: 'Criar produto', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Selecione uma categoria');
  expect(writes).toHaveLength(0);
});

test('backend antigo bloqueia gravação antes do POST e mantém o formulário', async ({ page }) => {
  const { writes } = await setup(page, { oldBackend: true });
  await page.getByRole('button', { name: 'Editar Peça antiga', exact: true }).click();
  await page.getByRole('combobox', { name: 'Categoria', exact: true }).selectOption('brincos');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByRole('alert')).toContainText('backend em execução está desatualizado');
  await expect(page.getByRole('combobox', { name: 'Categoria', exact: true })).toHaveValue(
    'brincos',
  );
  expect(writes).toHaveLength(0);
});

test('resposta que perde a categoria não gera confirmação falsa de sucesso', async ({ page }) => {
  await setup(page, { mismatch: true });
  await page.getByRole('button', { name: 'Editar Peça antiga', exact: true }).click();
  await page.getByRole('combobox', { name: 'Categoria', exact: true }).selectOption('brincos');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByRole('alert')).toContainText(
    'A API não confirmou a categoria selecionada',
  );
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('mensagem de validação do backend aparece legível no editor', async ({ page }) => {
  await setup(page, { reject: true });
  await page.getByRole('button', { name: 'Editar Peça antiga', exact: true }).click();
  await page.getByRole('combobox', { name: 'Categoria', exact: true }).selectOption('brincos');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Categoria inválida. Selecione uma das categorias disponíveis.',
  );
});
