# Carrinho e solicitação pelo WhatsApp

O carrinho público fica em `/carrinho`, acessível pelo ícone no header. Não depende de login, não cria pedidos no banco e não possui pagamento online. Os contatos diretos existentes nos produtos continuam disponíveis.

## Configurar o WhatsApp

O número público informado pelo artesão, `5581987063327`, está centralizado em `src/config/store.js`. Esse arquivo é utilizado pelo carrinho e pelos contatos diretos dos produtos.

Para configurar por ambiente, crie `frontend/.env.local`:

```dotenv
VITE_WHATSAPP_NUMBER=5581987063327
```

Use país + DDD + número. Reinicie o Vite depois de alterar variáveis de ambiente e gere novamente o build em produção. `.env.example` contém o exemplo. O número é um contato público, não uma credencial.

## Comportamento

- Cards e detalhes usam o mesmo `AddToCartButton`. Repetir um produto aumenta sua quantidade na mesma linha. A confirmação aparece no botão e em uma mensagem acessível com acesso ao carrinho.
- `CartProvider` centraliza o estado com um reducer imutável. A chave `aldo-sales:cart:v1` contém somente os dados necessários das peças e suas quantidades, em um formato versionado. Dados inválidos são descartados, IDs repetidos são agrupados e alterações são sincronizadas entre abas.
- A quantidade mínima é 1. Peças `sold-out` e estoque zero são bloqueados. O modelo atual do backend não possui estoque numérico; se a API passar a retornar `stock` inteiro não negativo, o limite será respeitado automaticamente. Sem esse campo não se inventa um estoque; há apenas o limite técnico de 999 unidades por linha e 100 peças diferentes por carrinho.
- Ao abrir o carrinho, o frontend consulta a coleção real para atualizar preços, imagens, categorias e disponibilidade. Uma redução de estoque ajusta a quantidade com aviso; peças removidas ou esgotadas permanecem identificadas para remoção. Durante a consulta ou uma falha da API, a finalização fica bloqueada e o carrinho é preservado, com opção de tentar novamente.
- Subtotais e total são calculados em centavos inteiros. Preço ausente permanece **Preço sob consulta**; o resumo distingue os valores conhecidos das peças a consultar. A imagem ausente utiliza a ilustração local existente.
- Limpar o carrinho exige confirmação. Remover uma peça é uma ação direta. O estado vazio convida a voltar ao catálogo.

## Mensagem e privacidade

A página apresenta itens, valores, quantidades e total antes de abrir a conversa. Nome, cidade/UF e observações são opcionais, ficam apenas no estado da página e entram na mensagem somente quando preenchidos. Esses campos não são enviados à API nem persistidos no `localStorage`.

`src/lib/whatsapp.js` monta o texto; `whatsappUrl`, na configuração da loja, aplica `encodeURIComponent` e cria a URL `https://wa.me/`. A ação abre uma conversa com a mensagem preparada, que o cliente ainda precisa enviar no WhatsApp. O carrinho não é apagado e o site não apresenta a solicitação como confirmada. Disponibilidade, frete e prazo são combinados com o artesão.

## Arquivos

Criados, todos relativos a `frontend/`:

- `src/cart/CartContext.jsx`, `src/cart/cartStore.js`, `src/cart/useCart.js`.
- `src/components/cart/AddToCartButton.jsx`, `src/components/cart/CartButton.jsx`, `src/components/cart/CartFeedback.jsx`, `src/components/cart/CartItem.jsx`, `src/components/cart/CartSummary.jsx`.
- `src/config/store.js`, `src/lib/cart.js`, `src/lib/whatsapp.js`.
- `src/pages/Cart.jsx`, `src/styles/cart.css`.
- `tests/cart.spec.js`, `tests/unit/cart.node.js`, `CART.md`.

Modificados:

- `src/main.jsx`, `src/index.css`.
- `src/components/StoreLayout.jsx`, `src/components/ProductCard.jsx`, `src/components/RouteFrame.jsx`.
- `src/pages/ProductDetails.jsx`, `src/lib/format.js`.
- `.env.example`, `.gitignore`, `eslint.config.js`, `package.json`.

Nenhum arquivo do backend foi alterado. O cache gerado pelo Vite foi incluído no ignore do Git e do ESLint.

## Executar e validar

```powershell
cd frontend
npm install
npm run dev
```

Verificações:

```powershell
npm run lint
npm run test:unit
npm run build
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm run test:e2e
```

Os testes de lógica cobrem duplicatas, estoque, quantidades inválidas, cálculos, persistência, revalidação, remoção, limpeza e mensagem. Os testes de navegador cobrem desktop, tablet e celulares de 390/320 px, formulário opcional, WhatsApp, sincronização entre abas, erros, estado vazio e acessibilidade. Os testes de WhatsApp capturam a URL preparada sem enviar mensagens reais. A validação com a API local usa somente leitura; os itens adicionados existem apenas no navegador de teste.
