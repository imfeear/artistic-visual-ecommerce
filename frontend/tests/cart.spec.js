import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const key = 'aldo-sales:cart:v1';
const products = [
  {
    id: 1,
    name: 'Brincos de frevo',
    category: 'brincos',
    price: 10.1,
    availability: 'available',
    stock: 3,
    imageUrl: null,
  },
  {
    id: 2,
    name: 'Caboclo de lança',
    category: 'esculturas-biscuit',
    price: 19.9,
    availability: 'made-to-order',
  },
  { id: 3, name: 'Papangú', category: 'colecionaveis', price: 50, availability: 'sold-out' },
  { id: 4, name: 'La Ursa especial', category: null, price: null, availability: 'available' },
];

test.beforeEach(async ({ page, context }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  page.__errors = [];
  page.on('pageerror', (error) => page.__errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' && /same key|React Router caught|TypeError/.test(message.text()))
      page.__errors.push(message.text());
  });
  await context.route('**/track/**', (route) => route.fulfill({ status: 204 }));
  await context.route('**/api/**', (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() !== 'GET') throw new Error('O carrinho não deve escrever na API.');
    if (url.pathname === '/api/products') return route.fulfill({ json: products });
    if (url.pathname === '/api/products/filters') return route.fulfill({ json: { materials: [] } });
    if (url.pathname === '/api/products/catalog') {
      const category = url.searchParams.get('categoria');
      const query = url.searchParams.get('busca')?.toLowerCase() || '';
      const content = products.filter(
        (p) => (!category || p.category === category) && p.name.toLowerCase().includes(query),
      );
      return route.fulfill({
        json: {
          content,
          totalElements: content.length,
          totalPages: content.length ? 1 : 0,
          page: 1,
          size: 12,
        },
      });
    }
    const product = products.find((p) => String(p.id) === url.pathname.split('/').pop());
    return route.fulfill({ status: product ? 200 : 404, json: product || {} });
  });
});
test.afterEach(async ({ page }) => {
  expect(page.__errors).toEqual([]);
});
const add = (page, name) =>
  page.getByRole('button', { name: `Adicionar ao carrinho: ${name}`, exact: true }).click();
const item = (page, name) => page.getByRole('article', { name, exact: true });

test('adiciona no card e detalhe, combina catálogo, persiste e calcula quantidades', async ({
  page,
}) => {
  await page.goto('/catalogo');
  await add(page, 'Brincos de frevo');
  await expect(page.locator('.cart-feedback')).toContainText('adicionada ao carrinho');
  await add(page, 'Brincos de frevo');
  await expect(page.getByRole('link', { name: 'Carrinho, 2 itens' })).toBeVisible();
  await page.getByLabel('Buscar no catálogo').fill('Brincos');
  await expect(page.locator('.art-card')).toHaveCount(1);
  await page.goto('/produto/2');
  await add(page, 'Caboclo de lança');
  await page.getByRole('link', { name: 'Carrinho, 3 itens' }).click();
  await expect(page.locator('.cart-item')).toHaveCount(2);
  await expect(
    item(page, 'Brincos de frevo').getByLabel('Quantidade atual de Brincos de frevo'),
  ).toHaveText('2');
  await expect(page.locator('.cart-total strong')).toHaveText(/R\$\s40,10/);
  await page.getByRole('button', { name: 'Aumentar quantidade de Brincos de frevo' }).click();
  await expect(page.locator('.cart-total strong')).toHaveText(/R\$\s50,20/);
  await expect(
    page.getByRole('button', { name: 'Aumentar quantidade de Brincos de frevo' }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Diminuir quantidade de Brincos de frevo' }).click();
  await page.reload();
  await expect(page.locator('.cart-total strong')).toHaveText(/R\$\s40,10/);
  await expect(page.locator('.cart-item-image img').first()).toHaveAttribute('src', '/frevo.svg');
  await page.getByRole('button', { name: 'Remover Caboclo de lança', exact: true }).click();
  await expect(page.locator('.cart-total strong')).toHaveText(/R\$\s20,20/);
  await page.getByRole('button', { name: 'Diminuir quantidade de Brincos de frevo' }).click();
  await expect(
    page.getByRole('button', { name: 'Diminuir quantidade de Brincos de frevo' }),
  ).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('esgotados bloqueados, limpeza confirmada e estado vazio acessível', async ({ page }) => {
  await page.goto('/catalogo');
  await expect(page.getByRole('button', { name: 'Peça esgotada: Papangú' })).toBeDisabled();
  await add(page, 'Brincos de frevo');
  await page.goto('/carrinho');
  await page.getByRole('button', { name: 'Limpar carrinho', exact: true }).click();
  await page.getByRole('button', { name: 'Manter minhas peças' }).click();
  await expect(page.locator('.cart-item')).toHaveCount(1);
  await page.getByRole('button', { name: 'Limpar carrinho', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar limpeza' }).click();
  await expect(page.getByRole('heading', { name: /Seu carrinho está esperando/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Explorar o catálogo' })).toBeVisible();
  await page.reload();
  await expect(page.locator('.cart-item')).toHaveCount(0);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
});

test('WhatsApp recebe itens, total e opcionais sem salvar dados pessoais', async ({ page }) => {
  await page.goto('/catalogo');
  await add(page, 'Brincos de frevo');
  await add(page, 'Brincos de frevo');
  await add(page, 'Caboclo de lança');
  await page.goto('/carrinho');
  const finalize = page.getByRole('button', { name: 'Finalizar pedido pelo WhatsApp' });
  await expect(finalize).toBeEnabled();
  // Capture the browser's open call; never contact WhatsApp or send a real message.
  await page.evaluate(() => {
    window.__opened = [];
    window.open = (url) => {
      window.__opened.push(url);
      return null;
    };
  });
  await finalize.click();
  let url = new URL(await page.evaluate(() => window.__opened.at(-1)));
  expect(url.hostname).toBe('wa.me');
  expect(url.pathname).toBe('/5581987063327');
  expect(url.searchParams.get('text')).not.toMatch(/Nome:|Cidade\/UF:|Observações:/);
  await page.getByLabel('Nome (opcional)').fill('João & Ana');
  await page.getByLabel('Cidade/UF (opcional)').fill('Recife/PE');
  await page.getByLabel('Observações (opcional)').fill('Azul + rosa? Quero personalizar.');
  await finalize.click();
  url = new URL(await page.evaluate(() => window.__opened.at(-1)));
  const text = url.searchParams.get('text');
  expect(text).toContain('1. Brincos de frevo');
  expect(text).toContain('Quantidade: 2');
  expect(text).toContain('2. Caboclo de lança');
  expect(text).toMatch(/Total estimado: R\$\s40,10/);
  expect(text).toContain('Nome: João & Ana');
  expect(text).toContain('Cidade/UF: Recife/PE');
  expect(text).toContain('Observações: Azul + rosa? Quero personalizar.');
  const raw = await page.evaluate((key) => localStorage.getItem(key), key);
  expect(raw).not.toMatch(/João|Recife|personalizar/);
  await page.reload();
  await expect(page.getByLabel('Nome (opcional)')).toHaveValue('');
  await expect(page.locator('.cart-item')).toHaveCount(2);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations,
  ).toEqual([]);
});

test('restaura dados quebrados, atualiza preço/estoque e mantém carrinho no erro da API', async ({
  page,
}) => {
  await page.goto('/catalogo');
  await page.evaluate(
    (key) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          items: [
            null,
            {},
            { id: 1, name: 'Preço antigo', price: 5, quantity: 8 },
            { id: 9, name: 'Removida', price: 10, quantity: 1 },
          ],
        }),
      ),
    key,
  );
  await page.goto('/carrinho');
  await expect(
    item(page, 'Brincos de frevo').getByLabel('Quantidade atual de Brincos de frevo'),
  ).toHaveText('3');
  await expect(item(page, 'Removida')).toContainText('Indisponível');
  await expect(page.getByRole('button', { name: 'Finalizar pedido pelo WhatsApp' })).toBeDisabled();
  await page.getByRole('button', { name: 'Remover Removida', exact: true }).click();
  await expect(page.locator('.cart-total strong')).toHaveText(/R\$\s30,30/);
  await page.route('**/api/products', (route) => route.fulfill({ status: 503 }));
  await page.reload();
  await expect(
    page.getByRole('alert').filter({ hasText: 'Seu carrinho foi mantido' }),
  ).toBeVisible();
  await expect(page.locator('.cart-item')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Finalizar pedido pelo WhatsApp' })).toBeDisabled();
  await page.unroute('**/api/products');
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('button', { name: 'Finalizar pedido pelo WhatsApp' })).toBeEnabled();
  await page.evaluate((key) => localStorage.setItem(key, '{'), key);
  await page.reload();
  await expect(page.locator('.cart-item')).toHaveCount(0);
});

test('preço sob consulta e sincronização entre abas preservam carrinho', async ({
  page,
  context,
}) => {
  await page.goto('/catalogo');
  await add(page, 'La Ursa especial');
  const other = await context.newPage();
  await other.goto('/carrinho');
  await expect(other.locator('.cart-item')).toHaveCount(1);
  await expect(other.locator('.cart-item-subtotal')).toContainText('Preço sob consulta');
  await expect(
    other.getByText('Além dos valores das peças sob consulta', { exact: false }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Carrinho, 1 item' }).click();
  await page.getByRole('button', { name: 'Remover La Ursa especial', exact: true }).click();
  await expect(other.locator('.cart-item')).toHaveCount(0);
  await other.close();
});
