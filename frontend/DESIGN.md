# Recife Art — experiência e arquitetura

A identidade editorial une azul-noite, papel claro, roxo, magenta, dourado e verde. A fonte Manrope é servida pelo próprio frontend; Georgia em itálico cria contraste em títulos. O asset principal tem 1536 × 1024 pixels e foi convertido para WebP, com aproximadamente 411 kB.

## O que mudou

- Home com direção de campanha, arte original, destaques com rolagem nativa, seção cultural e carrossel administrável.
- Catálogo em `/catalogo`, busca sem distinção de acentos, disponibilidade, ordenação e paginação. Os filtros ficam na URL.
- Detalhe em `/produto/:id`, carregado pelo endpoint existente, com imagem ampliada, descrição, disponibilidade e contato contextual.
- Estúdio em `/admin`: sidebar e quatro áreas — visão geral, produtos, estatísticas e vitrine. O parâmetro `view` permite compartilhar cada visão.
- Gestão de produtos com indicadores reais, miniaturas, filtros, paginação, cadastro e edição completos, upload e confirmação de exclusão.
- Gestão de banners com ordenação, visibilidade, prévia, uploads e feedback de salvamento. Uma falha de carregamento bloqueia o salvamento para evitar sobrescrever conteúdo que não foi carregado.
- Modais nativos com foco contido, Escape e retorno do foco; rótulos, foco visível, navegação por teclado, respeito à redução de movimento, skeletons, estados vazios e mensagens de erro.
- Componentes, hooks, tokens e estilos separados por responsabilidade. Requisições atrasadas não substituem respostas mais recentes.
- Rotas carregadas sob demanda. O código dos gráficos fica na área administrativa. O build não emite mais o aviso anterior de chunk maior que 500 kB.
- Autenticação existente preservada, com validação inicial da sessão salva e tratamento de armazenamento inválido. A separação entre contexto e hook resolve o erro anterior de Fast Refresh.

O fallback silencioso por produtos fictícios foi substituído por estados de erro e vazio reais. Assim, uma falha da API não apresenta itens de exemplo como se estivessem à venda. Os produtos e banners cadastrados continuam vindo da API.

## Executar

Na raiz do projeto:

```powershell
cd frontend
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite, normalmente `http://localhost:5173`.

Configuração opcional em `frontend/.env.local`:

```dotenv
VITE_API_BASE=http://localhost:8080
VITE_WHATSAPP_NUMBER=5581999999999
```

Substitua o número acima pelo contato real da loja, com código de país e DDD. Sem essa variável, permanece o número de exemplo anterior.

Para executar o backend com Java 21 e Docker, em outro terminal na raiz:

```powershell
cd backend/ArtisticEcommerce
docker compose up -d
.\mvnw.cmd spring-boot:run
```

## Validação

```powershell
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
```

Para usar o Edge instalado no Windows:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm run test:e2e
```

A suíte usa exclusivamente respostas simuladas para API, tracking e mutações; não altera dados reais. Cobre 1440, 768, 390 e 320 pixels: catálogo, filtros, paginação, detalhes e zoom, login, upload, CRUD, confirmação, estatísticas, ordenação e salvamento de banners, erro/vazio, proteção de rota, falhas de escrita e verificações axe de acessibilidade. Essas verificações automatizadas não substituem uma auditoria manual completa.

Resultado desta implementação: **24 testes aprovados**, `npm run lint` aprovado e `npm run build` aprovado, sem aviso de tamanho dos chunks.

`npm run format` formata o código com Prettier.

## Dependências e limites do backend

A API atual oferece produtos, disponibilidade, uploads, carrossel, autenticação Basic e tracking de visitas/cliques. Foram mantidos os endpoints e o formato de dados. Não há checkout, carrinho persistido, pedidos, estoque por quantidade, categorias ou recuperação de senha na API; esses fluxos não foram simulados como funcionalidades disponíveis. O painel mostra produtos e audiência, sem inventar vendas ou faturamento.

A busca e a paginação operam sobre a lista retornada pelo backend. Um catálogo muito grande deve ganhar paginação e busca na API. Visitantes únicos são a estimativa por IP fornecida pelo tracking existente. Imagens ausentes ou quebradas usam o símbolo local da marca como fallback visual.

Para publicar, o servidor deve encaminhar as rotas do React (`/catalogo`, `/produto/*`, `/admin` e `/login`) para `index.html`.

## Inventário de arquivos desta evolução

Criados:

- `src/auth/authStore.js`, `src/auth/useAuth.js`
- `src/components/AdminLayout.jsx`, `src/components/AnalyticsPanel.jsx`
- `src/components/BannerCarousel.jsx`, `src/components/ProductCard.jsx`
- `src/components/ProductEditor.jsx`, `src/components/RouteFrame.jsx`
- `src/components/StoreLayout.jsx`, `src/components/ui.jsx`
- `src/hooks/useProducts.js`, `src/hooks/useResource.js`
- `src/lib/format.js`
- `src/pages/Catalog.jsx`, `src/pages/ProductDetails.jsx`
- `src/styles/tokens.css`, `src/styles/system.css`, `src/styles/store.css`, `src/styles/admin.css`
- `public/images/pernambuco-editorial.webp`, `public/images/README.md`
- `tests/e2e.spec.js`, `playwright.config.js`, `.prettierrc.json`, `.env.example`

Modificados:

- `src/App.jsx`, `src/main.jsx`, `src/index.css`
- `src/auth/AuthContext.jsx`, `src/routes/ProtectedRoute.jsx`
- `src/components/CarouselModal.jsx`
- `src/pages/AdminProducts.jsx`, `src/pages/Login.jsx`
- `src/lib/api.js`, `src/lib/analytics.js` (este último apenas formatado)
- `package.json`, `package-lock.json`, `eslint.config.js`, `.gitignore`, `index.html`
- `DESIGN.md`

Consolidados e removidos:

- `src/components/CardNav.jsx` → `StoreLayout.jsx`
- `src/components/Hero.jsx` → `BannerCarousel.jsx` e nova campanha da home
- `src/components/ConfirmDialog.jsx` → `Modal` reutilizável em `ui.jsx`
- `src/pages/AdminAnalytics.jsx` → `AnalyticsPanel.jsx`
- `src/App.css` → substituído pelos estilos organizados
- `src/components/CarnivalArt.jsx` da primeira versão → substituído pelo asset editorial original

Nenhum fluxo ativo foi removido por essa consolidação. As alterações locais do backend não foram editadas nesta tarefa. `public/frevo.svg` é o símbolo local criado na versão anterior, reutilizado como favicon e fallback.

## Arte original

Gerada com a ferramenta integrada **imagegen**. Asset final: `public/images/pernambuco-editorial.webp`. O prompt completo está em `public/images/README.md`.
