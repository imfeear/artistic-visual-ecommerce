export const CATEGORIES = [
  ['brincos', 'Brincos'],
  ['esculturas', 'Esculturas'],
  ['esculturas-biscuit', 'Esculturas de biscuit'],
  ['decoracao', 'Decoração'],
  ['quadros', 'Quadros'],
  ['personalizadas', 'Peças personalizadas'],
  ['colecionaveis', 'Colecionáveis'],
  ['outros-artesanatos', 'Outros artesanatos'],
];
export const AVAILABILITIES = [
  ['available', 'Disponível'],
  ['made-to-order', 'Sob encomenda'],
  ['sold-out', 'Esgotado'],
];
export const MATERIALS = ['biscuit', 'pintura manual', 'resina', 'cerâmica'];
export const isCategory = (value) => CATEGORIES.some(([key]) => key === value);
export const categoryLabel = (value) =>
  CATEGORIES.find(([key]) => key === value)?.[1] ||
  (value == null || value === '' ? 'Sem categoria' : 'Categoria inválida');
export const availabilityOf = (product) =>
  AVAILABILITIES.some(([key]) => key === product?.availability)
    ? product.availability
    : product?.available === false
      ? 'sold-out'
      : 'available';
export const availabilityLabel = (product) =>
  AVAILABILITIES.find(([key]) => key === availabilityOf(product))?.[1] || 'Disponível';
export const materialLabel = (value) =>
  typeof value === 'string' && value.trim()
    ? value.trim().charAt(0).toLocaleUpperCase('pt-BR') + value.trim().slice(1)
    : 'Outro material';
const usableText = (value) =>
  typeof value === 'string' &&
  value.trim() &&
  !['undefined', 'null', '[object Object]'].includes(value.trim());
export const cleanMaterials = (values, limit = Infinity) =>
  [
    ...new Set(
      (Array.isArray(values) ? values : [])
        .filter(usableText)
        .map((value) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR')),
    ),
  ]
    .filter((value) => value.length <= 80)
    .slice(0, limit);
export const validPrice = (value) =>
  (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')) &&
  Number.isFinite(Number(value)) &&
  Number(value) >= 0;

export function sanitizeCatalogParams(input) {
  const params = new URLSearchParams(input);
  const next = new URLSearchParams();
  const query = params.get('busca');
  if (usableText(query)) next.set('busca', query.slice(0, 160));
  for (const [key, options] of [
    ['categoria', CATEGORIES],
    ['status', AVAILABILITIES],
  ]) {
    for (const value of new Set(params.getAll(key)))
      if (options.some(([id]) => id === value)) next.append(key, value);
  }
  for (const material of cleanMaterials(params.getAll('material'), 12))
    next.append('material', material);
  for (const key of ['min', 'max'])
    if (validPrice(params.get(key))) next.set(key, String(Number(params.get(key))));
  if (next.has('min') && next.has('max') && Number(next.get('min')) > Number(next.get('max'))) {
    next.delete('min');
    next.delete('max');
  }
  const order = params.get('ordem');
  if (['price-up', 'price-down', 'featured', 'name'].includes(order)) next.set('ordem', order);
  const page = Number(params.get('pagina'));
  if (Number.isSafeInteger(page) && page > 1 && page <= 1000000) next.set('pagina', String(page));
  return next;
}
export const catalogParams = (input) => sanitizeCatalogParams(input).toString();

export function normalizeProducts(input) {
  if (!Array.isArray(input))
    throw new Error('A API retornou uma lista de produtos inválida. Tente novamente.');
  const ids = new Set();
  return input.flatMap((product) => {
    if (
      !product ||
      typeof product !== 'object' ||
      Array.isArray(product) ||
      !/^[1-9]\d*$/.test(String(product.id))
    )
      return [];
    const id = String(product.id);
    if (ids.has(id)) return [];
    ids.add(id);
    return [
      {
        ...product,
        name: usableText(product.name) ? product.name.trim() : 'Peça artesanal',
        description: typeof product.description === 'string' ? product.description : '',
        category: typeof product.category === 'string' ? product.category : null,
        availability: availabilityOf(product),
        available: availabilityOf(product) !== 'sold-out',
        materials: cleanMaterials(product.materials, 12),
        price: validPrice(product.price) ? Number(product.price) : null,
        imageUrl: typeof product.imageUrl === 'string' ? product.imageUrl.trim() : '',
        featured: product.featured === true,
      },
    ];
  });
}

export function normalizeCatalogPage(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.content))
    throw new Error('A API retornou um catálogo inválido. Tente novamente.');
  const content = normalizeProducts(data.content);
  const size = Number.isInteger(data.size) && data.size > 0 && data.size <= 48 ? data.size : 12;
  const removed = data.content.length - content.length;
  const reported =
    Number.isSafeInteger(data.totalElements) && data.totalElements >= 0
      ? data.totalElements - removed
      : content.length;
  const totalElements = content.length ? Math.max(content.length, reported) : 0;
  const totalPages = Math.ceil(totalElements / size);
  const page = Math.max(
    1,
    Math.min(Number.isSafeInteger(data.page) ? data.page : 1, totalPages || 1),
  );
  return { content, totalElements, totalPages, page, size };
}

export function normalizeCatalogFilters(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new Error('Não foi possível ler os materiais da coleção.');
  return {
    materials: cleanMaterials(data.materials),
    minPrice: validPrice(data.minPrice) ? Number(data.minPrice) : null,
    maxPrice: validPrice(data.maxPrice) ? Number(data.maxPrice) : null,
    totalProducts:
      Number.isSafeInteger(data.totalProducts) && data.totalProducts >= 0 ? data.totalProducts : 0,
  };
}

const searchable = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
export function filterProducts(products, input) {
  const params = sanitizeCatalogParams(input);
  const categories = params.getAll('categoria'),
    statuses = params.getAll('status'),
    materials = params.getAll('material').map(searchable);
  const query = searchable(params.get('busca')?.trim());
  const hasPrice = params.has('min') || params.has('max');
  const matches = products.filter(
    (product) =>
      searchable(`${product.name} ${product.description}`).includes(query) &&
      (!categories.length || categories.includes(product.category)) &&
      (!statuses.length || statuses.includes(product.availability)) &&
      (!materials.length ||
        product.materials.some((value) => materials.includes(searchable(value)))) &&
      (!hasPrice ||
        (product.price !== null &&
          (!params.has('min') || product.price >= Number(params.get('min'))) &&
          (!params.has('max') || product.price <= Number(params.get('max'))))),
  );
  const order = params.get('ordem');
  matches.sort((a, b) => {
    if (order === 'price-up' || order === 'price-down') {
      if (a.price === null || b.price === null)
        return a.price === b.price ? Number(b.id) - Number(a.id) : a.price === null ? 1 : -1;
      return (
        (order === 'price-up' ? a.price - b.price : b.price - a.price) ||
        Number(b.id) - Number(a.id)
      );
    }
    if (order === 'name')
      return a.name.localeCompare(b.name, 'pt-BR') || Number(b.id) - Number(a.id);
    if (order === 'featured')
      return Number(b.featured) - Number(a.featured) || Number(b.id) - Number(a.id);
    return Number(b.id) - Number(a.id);
  });
  const totalPages = Math.ceil(matches.length / 12);
  const page = Math.max(1, Math.min(Number(params.get('pagina')) || 1, totalPages || 1));
  return {
    content: matches.slice((page - 1) * 12, page * 12),
    totalElements: matches.length,
    totalPages,
    page,
    size: 12,
  };
}

export function productFacets(products) {
  const prices = products.map((product) => product.price).filter((value) => value !== null);
  return {
    materials: [...new Set(products.flatMap((product) => product.materials))].sort((a, b) =>
      a.localeCompare(b, 'pt-BR'),
    ),
    minPrice: prices.length ? prices.reduce((a, b) => Math.min(a, b)) : null,
    maxPrice: prices.length ? prices.reduce((a, b) => Math.max(a, b)) : null,
    totalProducts: products.length,
  };
}
