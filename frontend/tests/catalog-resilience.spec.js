import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const products = [
  {
    id: 1,
    name: 'Brinco de cerâmica',
    description: 'Pintura manual',
    category: 'brincos',
    materials: ['cerâmica'],
    price: 80,
    available: true,
  },
  {
    id: 2,
    name: 'Brinco de resina',
    description: 'Pintura manual',
    category: 'brincos',
    materials: ['resina'],
    price: 30,
    available: true,
  },
  {
    id: 3,
    name: 'Vaso de cerâmica',
    description: 'Decoração autoral',
    category: 'decoracao',
    materials: ['cerâmica'],
    price: 120,
    available: true,
  },
  { id: 4, name: 'Peça antiga', price: null, imageUrl: null, available: false },
];
const pageOf = (content) => ({
  content,
  totalElements: content.length,
  totalPages: content.length ? 1 : 0,
  page: 1,
  size: 12,
});

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (
      m.type() === 'error' &&
      /React Router caught|same key|TypeError|not a function/.test(m.text())
    )
      errors.push(m.text());
  });
  page.__errors = errors;
  await page.route('**/track/**', (route) => route.fulfill({ status: 204 }));
  await page.route('**/api/products', (route) => route.fulfill({ json: products }));
  await page.route('**/api/products/filters', (route) =>
    route.fulfill({
      json: { materials: ['cerâmica', 'resina'], minPrice: 30, maxPrice: 120, totalProducts: 4 },
    }),
  );
  await page.route('**/api/products/catalog**', (route) =>
    route.fulfill({ json: pageOf(products) }),
  );
});
test.afterEach(async ({ page }) => {
  expect(page.__errors).toEqual([]);
});

async function filters(page) {
  const trigger = page.getByRole('button', { name: /^Filtrar/ });
  const mobile = await trigger.isVisible();
  if (mobile) await trigger.click();
  return { panel: mobile ? page.getByRole('dialog') : page.locator('.catalog-sidebar'), mobile };
}
async function closeFilters({ panel, mobile }) {
  if (mobile) {
    const actionsVisible = await panel.evaluate((dialog) => {
      const bounds = dialog.getBoundingClientRect();
      return [...dialog.querySelectorAll('.catalog-filter-actions .btn')].every((button) => {
        const rect = button.getBoundingClientRect();
        return rect.top >= bounds.top && rect.bottom <= bounds.bottom;
      });
    });
    expect(actionsVisible).toBe(true);
    await panel.getByRole('button', { name: 'Ver resultados' }).click();
  }
}
async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test('API antiga: combina filtros reais, busca, preço, ordenação, limpeza e coleção vazia', async ({
  page,
}) => {
  let listRequests = 0;
  let empty = false;
  await page.route('**/api/products/catalog**', (route) => route.fulfill({ status: 400 }));
  await page.route('**/api/products/filters', (route) => route.fulfill({ status: 400 }));
  await page.route('**/api/products', (route) => {
    listRequests++;
    return route.fulfill({ json: empty ? [] : products });
  });
  await page.goto('/catalogo');
  await expect(page.locator('.art-card')).toHaveCount(4);
  await expect(
    page.getByRole('link', { name: 'Ver detalhes de Peça antiga' }).locator('img'),
  ).toHaveAttribute('src', '/frevo.svg');
  await expect(page.locator('.art-card').filter({ hasText: 'Peça antiga' })).toContainText(
    'Preço sob consulta',
  );
  const group = await filters(page);
  await group.panel.getByLabel('Brincos', { exact: true }).check();
  await expect(group.panel.getByLabel('Brincos', { exact: true })).toBeChecked();
  await closeFilters(group);
  await page.getByLabel('Buscar no catálogo').fill('pintura');
  await expect(page.locator('.art-card')).toHaveCount(2);
  await page.getByRole('combobox', { name: 'Ordenar por', exact: true }).selectOption('price-up');
  await expect(page.locator('.art-card h3').first()).toHaveText('Brinco de resina');
  const price = await filters(page);
  await price.panel.getByLabel('Mínimo (R$)').fill('50');
  await price.panel.getByRole('button', { name: 'Aplicar preço' }).click();
  await closeFilters(price);
  await expect(page.locator('.art-card')).toHaveCount(1);
  await expect(page.locator('.art-card h3')).toHaveText('Brinco de cerâmica');
  await page.getByRole('button', { name: 'Limpar todos os filtros' }).click();
  await expect(page.locator('.art-card')).toHaveCount(4);
  expect(listRequests).toBe(1);
  // Clearing also discards an unsubmitted price draft.
  const draft = await filters(page);
  await draft.panel.getByLabel('Mínimo (R$)').fill('999');
  await draft.panel.getByLabel('Brincos', { exact: true }).check();
  if (draft.mobile)
    await draft.panel.getByRole('button', { name: 'Limpar filtros', exact: true }).click();
  else await page.getByRole('button', { name: 'Limpar todos os filtros' }).click();
  await expect(draft.panel.getByLabel('Mínimo (R$)')).toHaveValue('');
  await closeFilters(draft);
  await expect(page.locator('a[href="/login"],a[href="/admin"]')).toHaveCount(0);
  await expect(page.locator('.image-index')).toHaveCount(0);
  if (draft.mobile) {
    await page.getByRole('button', { name: 'Abrir menu', exact: true }).click();
    await expect(page.getByRole('dialog').locator('a[href="/login"],a[href="/admin"]')).toHaveCount(
      0,
    );
    await page.keyboard.press('Escape');
  }
  empty = true;
  await page.evaluate(() => window.dispatchEvent(new Event('products:refresh')));
  await expect(page.getByRole('heading', { name: 'A coleção está sendo preparada' })).toBeVisible();
  await noOverflow(page);
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login$/);
});

test('dados incompletos e duplicados não derrubam o catálogo nem criam preço gratuito', async ({
  page,
}) => {
  const damaged = [
    null,
    {},
    ...products,
    { ...products[0], name: 'Duplicado' },
    {
      id: 9,
      name: { broken: true },
      price: 'NaN',
      imageUrl: 42,
      materials: [null, {}, 'resina', 'Resina'],
      category: 'undefined',
    },
  ];
  await page.route('**/api/products/catalog**', (route) =>
    route.fulfill({ json: pageOf(damaged) }),
  );
  await page.route('**/api/products/filters', (route) =>
    route.fulfill({
      json: {
        materials: [null, {}, 'resina', 'Resina', 'undefined'],
        minPrice: null,
        maxPrice: 'NaN',
      },
    }),
  );
  await page.goto('/catalogo');
  await expect(page.locator('.art-card')).toHaveCount(5);
  await expect(page.locator('.art-card').filter({ hasText: 'Peça artesanal' })).toContainText(
    'Preço sob consulta',
  );
  await expect(page.getByText('Duplicado', { exact: true })).toHaveCount(0);
  const group = await filters(page);
  await expect(group.panel.getByLabel('Resina', { exact: true })).toHaveCount(1);
  await expect(group.panel.getByText('undefined', { exact: true })).toHaveCount(0);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(axe.violations).toEqual([]);
  await closeFilters(group);
  await noOverflow(page);
});

test('parâmetros compartilhados são validados e deduplicados antes da API', async ({ page }) => {
  const queries = [];
  await page.route('**/api/products/catalog**', (route) => {
    queries.push(new URL(route.request().url()).searchParams.toString());
    return route.fulfill({ json: pageOf(products) });
  });
  await page.goto(
    '/catalogo?categoria=undefined&categoria=brincos&categoria=brincos&material=null&material=RESINA&material=resina&min=Infinity&max=-3&pagina=NaN&ordem=quebrada',
  );
  await expect(page.locator('.art-card')).toHaveCount(4);
  await expect(page).toHaveURL(/catalogo\?categoria=brincos&material=resina$/);
  expect(queries.every((value) => !/undefined|null|Infinity|NaN|quebrada/.test(value))).toBe(true);
  await expect(
    page.getByRole('button', { name: 'Remover filtro: Brincos', exact: true }),
  ).toHaveCount(1);
  await page.getByRole('button', { name: 'Limpar todos os filtros' }).click();
  await expect(page).toHaveURL(/\/catalogo$/);
  await noOverflow(page);
});

test('loading, respostas atrasadas, falha HTTP e resposta inválida têm recuperação', async ({
  page,
}) => {
  let recover = false;
  await page.route('**/api/products/catalog**', async (route) => {
    const query = new URL(route.request().url()).searchParams.get('busca');
    if (query === 'velho') {
      await new Promise((resolve) => setTimeout(resolve, 900));
      return route.fulfill({ json: pageOf([{ ...products[0], name: 'Resultado antigo' }]) });
    }
    if (query === 'novo')
      return route.fulfill({ json: pageOf([{ ...products[1], name: 'Resultado atual' }]) });
    if (query === 'erro' && !recover) return route.fulfill({ status: 503 });
    if (query === 'formato') return route.fulfill({ json: { totalElements: 10 } });
    return route.fulfill({ json: pageOf(products) });
  });
  await page.goto('/catalogo');
  await expect(page.locator('.art-card')).toHaveCount(4);
  const olderRequest = page.waitForRequest(
    (request) => new URL(request.url()).searchParams.get('busca') === 'velho',
  );
  await page.getByLabel('Buscar no catálogo').fill('velho');
  await olderRequest;
  await expect(page.getByLabel('Carregando produtos')).toBeVisible();
  await page.getByLabel('Buscar no catálogo').fill('novo');
  await expect(page.locator('.art-card h3')).toHaveText('Resultado atual');
  await page.waitForTimeout(950);
  await expect(page.locator('.art-card h3')).toHaveText('Resultado atual');
  await page.getByLabel('Buscar no catálogo').fill('erro');
  await expect(
    page.getByRole('heading', { name: 'Não foi possível carregar a coleção' }),
  ).toBeVisible();
  recover = true;
  await page.getByRole('button', { name: 'Tentar novamente', exact: true }).click();
  await expect(page.locator('.art-card')).toHaveCount(4);
  await page.getByLabel('Buscar no catálogo').fill('formato');
  await expect(page.getByRole('alert')).toContainText('A API retornou um catálogo inválido');
  await page.getByRole('button', { name: 'Limpar todos os filtros' }).click();
  await expect(page.locator('.art-card')).toHaveCount(4);
  await noOverflow(page);
});
