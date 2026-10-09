import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// All API calls, including tracking and mutations, stay inside this fixture.
test.beforeEach(async ({ page }) => {
  let products = Array.from({ length: 14 }, (_, i) => ({
    id: i + 1,
    name: `${i === 0 ? 'Cerâmica' : 'Escultura'} ${i + 1}`,
    description: 'Peça autoral inspirada na cultura pernambucana.',
    price: 190 + i * 30,
    available: i !== 2,
    category: ['brincos', 'decoracao', 'esculturas-biscuit'][i % 3],
    availability: i === 2 ? 'sold-out' : i === 4 ? 'made-to-order' : 'available',
    materials: [i % 2 ? 'resina' : 'cerâmica', 'pintura manual'],
    featured: i === 1,
    imageUrl: '/uploads/peca.webp',
  }));
  let banners = [{ id: 1, url: '/images/pernambuco-editorial.webp', position: 1, active: true }];
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' &&
      /React Router caught|same key|TypeError|not a function/.test(message.text())
    )
      errors.push(message.text());
  });
  page.__errors = errors;
  await page.route('**/uploads/**', (route) =>
    route.fulfill({ status: 302, headers: { location: 'http://127.0.0.1:5173/frevo.svg' } }),
  );
  await page.route('**/track/**', (route) =>
    route.fulfill({
      json: {
        countsByType: { PAGEVIEW: 152, CLICK: 48 },
        uniqueIps: 93,
        topClicks: [
          { label: 'whatsapp_button', count: 25 },
          { label: 'nav_loja', count: 17 },
          { label: 'nav_destaques', count: 6 },
        ],
        pageviewsByDay: Array.from({ length: 7 }, (_, i) => ({
          date: `2026-10-0${i + 1}`,
          count: 10 + i * 3,
        })),
      },
    }),
  );
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    const method = request.method();
    if (path === '/api/products/filters')
      return route.fulfill({
        json: {
          materials: ['cerâmica', 'pintura manual', 'resina'],
          minPrice: 190,
          maxPrice: 580,
          totalProducts: products.length,
        },
      });
    if (path === '/api/products/catalog') {
      const params = new URL(request.url()).searchParams;
      const normalize = (value) =>
        String(value || '')
          .normalize('NFD')
          .replace(/\p{M}/gu, '')
          .toLowerCase();
      const selected = (key, value) =>
        !params.getAll(key).length || params.getAll(key).includes(value);
      const matches = products.filter(
        (p) =>
          normalize(`${p.name} ${p.description}`).includes(normalize(params.get('busca'))) &&
          selected('categoria', p.category || 'outros-artesanatos') &&
          selected('status', p.availability || (p.available ? 'available' : 'sold-out')) &&
          (!params.getAll('material').length ||
            p.materials?.some((m) => params.getAll('material').includes(m))) &&
          (!params.has('min') || p.price >= Number(params.get('min'))) &&
          (!params.has('max') || p.price <= Number(params.get('max'))),
      );
      matches.sort((a, b) =>
        params.get('ordem') === 'price-up'
          ? a.price - b.price
          : params.get('ordem') === 'price-down'
            ? b.price - a.price
            : params.get('ordem') === 'featured'
              ? Number(b.featured || false) - Number(a.featured || false) || b.id - a.id
              : params.get('ordem') === 'name'
                ? a.name.localeCompare(b.name)
                : b.id - a.id,
      );
      const totalPages = Math.ceil(matches.length / 12);
      const currentPage = Math.max(1, Math.min(Number(params.get('pagina')) || 1, totalPages || 1));
      return route.fulfill({
        json: {
          content: matches.slice((currentPage - 1) * 12, currentPage * 12),
          totalElements: matches.length,
          totalPages,
          page: currentPage,
          size: 12,
        },
      });
    }
    if (path === '/api/admin/check') return route.fulfill({ status: 204 });
    if (path === '/api/uploads') return route.fulfill({ json: { url: '/uploads/peca.webp' } });
    if (path.startsWith('/api/carousel')) {
      if (method === 'PUT') banners = request.postDataJSON();
      return route.fulfill({ json: banners });
    }
    if (path === '/api/products') {
      if (method === 'POST') {
        const p = { ...request.postDataJSON(), id: 100 };
        products.push(p);
        return route.fulfill({ json: p });
      }
      return route.fulfill({ json: products });
    }
    const id = Number(path.split('/').pop());
    if (method === 'DELETE') {
      products = products.filter((p) => p.id !== id);
      return route.fulfill({ status: 204 });
    }
    if (method === 'PUT') {
      products = products.map((p) => (p.id === id ? { ...p, ...request.postDataJSON() } : p));
      return route.fulfill({ json: products.find((p) => p.id === id) });
    }
    return route.fulfill({
      status: products.some((p) => p.id === id) ? 200 : 404,
      json: products.find((p) => p.id === id) || {},
    });
  });
});
test.afterEach(async ({ page }) => {
  expect(page.__errors).toEqual([]);
});
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
async function login(page) {
  await page.goto('/login');
  await page.getByLabel('Usuário', { exact: true }).fill('admin-test');
  await page.getByLabel('Senha', { exact: true }).fill('test-password');
  await page.getByRole('button', { name: 'Mostrar senha' }).click();
  await expect(page.locator('#password')).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Entrar no estúdio' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(
    page.getByRole('heading', { name: 'Um novo olhar para o seu negócio.' }),
  ).toBeVisible();
}
test('vitrine, catálogo, filtros, paginação e detalhe com zoom', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Cultura que/ })).toBeVisible();
  await page.locator('.featured-rail .art-card').first().waitFor();
  await noOverflow(page);
  await page.getByRole('button', { name: 'Próximos destaques' }).click();
  await page.goto('/catalogo');
  await expect(page.locator('.art-card')).toHaveCount(12);
  await page.getByRole('button', { name: 'Próxima', exact: true }).click();
  await expect(page.locator('.art-card')).toHaveCount(2);
  await page.getByLabel('Buscar no catálogo').fill('ceramica');
  await expect(page.locator('.art-card')).toHaveCount(1);
  await page.getByRole('link', { name: 'Ver detalhes de Cerâmica 1' }).click();
  await expect(page.getByRole('heading', { name: 'Cerâmica 1' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Tenho interesse/ })).toHaveAttribute(
    'href',
    /wa.me/,
  );
  await page.getByRole('button', { name: 'Ampliar imagem' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await noOverflow(page);
});
test('filtros combinados, preço validado, URL compartilhável e remoção de chips', async ({
  page,
}) => {
  await page.goto('/catalogo?pagina=2');
  await expect(page.locator('.art-card')).toHaveCount(2);
  const mobile = await page.getByRole('button', { name: /^Filtrar/ }).isVisible();
  if (mobile) await page.getByRole('button', { name: /^Filtrar/ }).click();
  const filters = mobile ? page.getByRole('dialog') : page.locator('.catalog-sidebar');
  for (const label of ['Decoração', 'Sob encomenda', 'Cerâmica']) {
    const checkbox = filters.getByLabel(label, { exact: true });
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  }
  await filters.getByLabel('Mínimo (R$)').fill('400');
  await filters.getByLabel('Máximo (R$)').fill('300');
  await filters.getByRole('button', { name: 'Aplicar preço' }).click();
  await expect(filters.getByRole('alert')).toContainText('O mínimo deve ser menor');
  await filters.getByLabel('Mínimo (R$)').fill('300');
  await filters.getByLabel('Máximo (R$)').fill('400');
  await filters.getByRole('button', { name: 'Aplicar preço' }).click();
  if (mobile) {
    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(axe.violations).toEqual([]);
    await filters.getByRole('button', { name: 'Ver resultados' }).click();
  }
  await expect(page.locator('.art-card')).toHaveCount(1);
  await expect(page.locator('.art-card h3')).toHaveText('Escultura 5');
  await expect(page.locator('.art-card')).toContainText('Sob encomenda');
  await expect(page).toHaveURL(/categoria=decoracao/);
  await expect(page).not.toHaveURL(/pagina=/);
  await expect(page).toHaveURL(/min=300/);
  await page.reload();
  await expect(page.locator('.art-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Remover filtro: Sob encomenda', exact: true }).click();
  await expect(page).not.toHaveURL(/status=/);
  await page.getByRole('button', { name: 'Limpar todos os filtros' }).click();
  await expect(page.locator('.art-card')).toHaveCount(12);
  await page.getByRole('combobox', { name: 'Ordenar por', exact: true }).selectOption('featured');
  await expect(page.locator('.art-card h3').first()).toHaveText('Escultura 2');
  await page.getByLabel('Buscar no catálogo').fill('sem correspondência');
  await expect(page.getByRole('heading', { name: 'Nenhuma peça com esses filtros' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver todas as peças' }).click();
  await expect(page.locator('.art-card')).toHaveCount(12);
  await noOverflow(page);
});

test('gestão: criar, editar, filtrar e excluir com confirmação', async ({ page }) => {
  await login(page);
  await noOverflow(page);
  await page.getByRole('button', { name: 'Novo produto' }).click();
  await page.getByLabel('Nome da peça').fill('Peça de teste');
  await page.getByLabel('Descrição', { exact: true }).fill('Descrição de teste');
  await page.getByLabel('Preço (R$)').fill('320');
  await page.getByRole('combobox', { name: 'Categoria', exact: true }).selectOption('brincos');
  await page
    .getByRole('combobox', { name: 'Disponibilidade', exact: true })
    .selectOption('made-to-order');
  await page.getByLabel('Outro material ou técnica').fill('Madeira');
  await page.getByRole('button', { name: 'Adicionar material' }).click();
  await page.getByLabel('Destacar esta peça', { exact: false }).check();
  await page.locator('.editor-media input[type=file]').setInputFiles({
    name: 'arte.svg',
    mimeType: 'image/svg+xml',
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>'),
  });
  await expect(page.getByLabel('Ou use uma URL')).toHaveValue('/uploads/peca.webp');
  await page.getByRole('button', { name: 'Criar produto', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Nova peça adicionada');
  await page.goto('/admin?view=products');
  await page.getByLabel('Buscar produtos').fill('Peça de teste');
  await expect(page.locator('.data-table tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: 'Editar Peça de teste', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Categoria', exact: true })).toHaveValue(
    'brincos',
  );
  await expect(page.getByRole('combobox', { name: 'Disponibilidade', exact: true })).toHaveValue(
    'made-to-order',
  );
  await expect(page.getByLabel('Madeira', { exact: true })).toBeChecked();
  await page.getByLabel('Nome da peça').fill('Peça atualizada');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await page.getByLabel('Buscar produtos').fill('Peça atualizada');
  await page.getByRole('button', { name: 'Excluir Peça atualizada', exact: true }).click();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.locator('.data-table tbody tr')).toHaveCount(1);
  await page.getByRole('button', { name: 'Excluir Peça atualizada', exact: true }).click();
  await page.getByRole('button', { name: 'Excluir produto', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nenhuma peça encontrada' })).toBeVisible();
  await noOverflow(page);
});
test('gestão: analytics, ordenação de banners e persistência', async ({ page }) => {
  await login(page);
  await page.goto('/admin?view=analytics');
  await expect(page.getByRole('heading', { name: 'Visitas ao longo do tempo' })).toBeVisible();
  await page.getByLabel('Período das estatísticas').selectOption('30');
  await page.goto('/admin?view=media');
  await page.getByRole('button', { name: 'Editar carrossel', exact: true }).first().click();
  await page.getByRole('button', { name: 'Adicionar banner' }).click();
  await page.getByLabel('URL da imagem').last().fill('/frevo.svg');
  await page.getByRole('button', { name: 'Subir banner 2' }).click();
  await expect(page.getByLabel('URL da imagem').first()).toHaveValue('/frevo.svg');
  await page.getByRole('button', { name: 'Salvar carrossel' }).click();
  await expect(page.getByRole('status')).toContainText('Carrossel atualizado');
  await expect(page.locator('.media-card')).toHaveCount(2);
  await noOverflow(page);
});
test('estados de erro e vazio, menu móvel e rota protegida', async ({ page }) => {
  await page.goto('/admin?view=products');
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/');
  if (await page.getByRole('button', { name: 'Abrir menu', exact: true }).isVisible()) {
    await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('link', { name: 'A loja', exact: true }).click();
    await expect(page).toHaveURL(/catalogo/);
  }
  await page.route('**/api/products/catalog**', (route) =>
    route.fulfill({ status: 500, body: '' }),
  );
  await page.goto('/catalogo');
  await expect(
    page.getByRole('heading', { name: 'Não foi possível carregar a coleção' }),
  ).toBeVisible();
  await page.route('**/api/products/catalog**', (route) =>
    route.fulfill({ json: { content: [], totalElements: 0, totalPages: 0, page: 1, size: 12 } }),
  );
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('heading', { name: 'A coleção está sendo preparada' })).toBeVisible();
  await page.goto('/produto/999');
  await expect(
    page.getByRole('heading', { name: 'Esta peça não está disponível para consulta' }),
  ).toBeVisible();
  await noOverflow(page);
});

test('acessibilidade: catálogo, login e gestão', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const path of ['/', '/catalogo', '/produto/1', '/login']) {
    await page.goto(path);
    await page
      .locator(
        path === '/login'
          ? '#username'
          : path.startsWith('/produto/')
            ? '.detail-info'
            : '.art-card',
      )
      .first()
      .waitFor();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
    ).toEqual([]);
  }
  await login(page);
  await page.locator('.metric').first().waitFor();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
    })),
  ).toEqual([]);
  await page.getByRole('button', { name: 'Novo produto' }).click();
  const modalResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    modalResults.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
    })),
  ).toEqual([]);
});

test('falhas de escrita preservam edição, produto e banners', async ({ page }) => {
  await login(page);
  await page.route('**/api/products', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({ status: 500, body: 'Não foi possível salvar.' })
      : route.fallback(),
  );
  await page.getByRole('button', { name: 'Novo produto' }).click();
  await page.getByLabel('Nome da peça').fill('Peça preservada');
  await page.getByLabel('Preço (R$)').fill('300');
  await page.getByRole('combobox', { name: 'Categoria', exact: true }).selectOption('brincos');
  await page.getByRole('button', { name: 'Criar produto', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível salvar');
  await expect(page.getByLabel('Nome da peça')).toHaveValue('Peça preservada');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await page.goto('/admin?view=products');
  await page.route('**/api/products/*', (route) =>
    route.request().method() === 'DELETE'
      ? route.fulfill({ status: 500, body: 'Não foi possível excluir.' })
      : route.fallback(),
  );
  await page.getByRole('button', { name: 'Excluir Escultura 14', exact: true }).click();
  await page.getByRole('button', { name: 'Excluir produto', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível excluir');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Excluir Escultura 14', exact: true }),
  ).toBeVisible();
  await page.goto('/admin?view=media');
  await page.route('**/api/carousel/all', (route) => route.fulfill({ status: 500, body: '' }));
  await page.getByRole('button', { name: 'Editar carrossel', exact: true }).first().click();
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Não foi possível carregar os banners' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Salvar carrossel' })).toBeDisabled();
});
