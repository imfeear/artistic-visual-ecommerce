# Catálogo artesanal

O catálogo usa a API paginada quando disponível. Se o backend em execução ainda não oferece `/api/products/catalog` e responde 400, 404 ou 405, o frontend verifica o contrato antigo de `GET /api/products` e filtra essa coleção real, com paginação, sem mutar a lista original. Falhas de conexão, erros 5xx e respostas inválidas continuam visíveis, com opção de tentar novamente. A home e a gestão preservam o endpoint de lista. Nenhum produto foi apagado ou reclassificado com base no nome.

## Correção de estabilidade do catálogo

Na investigação, o backend local respondeu **400** para `/api/products/catalog` e `/api/products/filters`, enquanto `/api/products` retornou os produtos normalmente. Isso indicou um backend em execução anterior à implementação dos novos endpoints. Também foi reproduzido no console `Cannot read properties of null (reading 'charAt')`: materiais nulos recebidos da API chegavam diretamente a `materialLabel`, derrubando a página.

- A camada de API agora negocia o contrato disponível e normaliza produtos, metadados e páginas antes de renderizar. Materiais inválidos e duplicados são descartados; produtos sem ID válido e IDs repetidos não geram cards ou rotas quebradas.
- Categoria ausente aparece como **Sem categoria**, e códigos desconhecidos aparecem como **Categoria inválida**. Nenhum desses casos é convertido em **Outros artesanatos**. Imagem ausente ou inválida usa a ilustração local. Preço ausente/inválido aparece como **Preço sob consulta**, fica ao final da ordenação por preço e não entra em intervalos numéricos.
- Parâmetros da URL são validados e deduplicados antes de consultar a API. Categoria, disponibilidade, material e ordenação atualizam imediatamente; somente a digitação da busca aguarda 250 ms. Respostas atrasadas não substituem a busca atual. Limpar filtros também descarta preços digitados e ainda não aplicados.
- O cabeçalho mantém a busca sincronizada com o catálogo e preserva os filtros ao enviar um termo. Os textos de busca cabem nos campos, com instrução visível abaixo da busca do catálogo. A ordenação ocupa uma linha própria nas telas menores.
- Foram removidas as legendas numéricas sobre as imagens e todos os links/ícones de perfil e administração da navegação pública. O administrador continua acessando `/login` diretamente; `/admin` permanece protegido.

Arquivos desta correção (prefixo `frontend/`):

- `src/lib/catalog.js`, `src/lib/api.js`, `src/lib/format.js`.
- `src/hooks/useCatalog.js`.
- `src/pages/Catalog.jsx`, `src/pages/ProductDetails.jsx`.
- `src/components/CatalogFilters.jsx`, `src/components/ProductCard.jsx`, `src/components/StoreLayout.jsx`, `src/components/ui.jsx`.
- `src/styles/catalog.css`, `src/styles/store.css`.
- `tests/catalog-resilience.spec.js` (novo), `tests/e2e.spec.js` e `CATALOG.md`.

A validação inclui interações no Edge com a API local real, em desktop e celular, e testes com API simulada para dados incompletos, materiais nulos, duplicatas, parâmetros inválidos, catálogo vazio, falhas HTTP, respostas inválidas e respostas fora de ordem. A suíte de navegador inclui os fluxos de gestão, categorias e acessibilidade em 320, 390, 768 e 1440 px.

## Persistência e validação de categorias

A investigação confirmou que o select e o payload já enviavam os códigos corretos, e que o DTO do código-fonte já possuía `category`. Porém, a JVM em execução ainda usava a versão anterior do backend: o JSON retornado tinha somente os seis campos antigos e o PostgreSQL não possuía a coluna `category`. Os fallbacks da entidade e da normalização do frontend escondiam a perda, exibindo **Outros artesanatos**.

Criação e edição agora exigem `category` explicitamente. O serviço valida o código exato antes de modificar a entidade; não traduz rótulos, não corrige códigos inválidos e não atribui uma categoria padrão. Ausência, branco ou valor desconhecido retornam HTTP 400 com `detail` legível. O frontend exibe essa mensagem no editor, exige a seleção e verifica se a resposta de gravação confirmou a mesma categoria enviada. Uma API antiga é identificada antes de enviar POST/PUT, com orientação para reiniciar o backend atualizado.

Produtos antigos continuam com categoria `NULL` e aparecem como **Sem categoria**. Ao editar uma dessas peças, o administrador precisa escolher uma categoria. Elas permanecem na listagem geral e não entram automaticamente em **Outros artesanatos**. Esse filtro inclui somente produtos classificados explicitamente com `outros-artesanatos`.

O mapeamento usa `products.category varchar(32)`, anulável para preservar registros antigos. A migration `backend/ArtisticEcommerce/src/main/resources/db/migration/V2__product_category.sql` acrescenta a coluna se necessário e uma restrição PostgreSQL com os oito códigos permitidos. A restrição permite `NULL` legado e usa `NOT VALID` para preservar eventuais valores históricos inválidos, mas impede novas gravações com códigos desconhecidos. Não há alteração, exclusão ou reclassificação de registros.

O projeto não executa Flyway automaticamente. A coluna também é criada por `ddl-auto=update` ao iniciar o backend atualizado; para aplicar a restrição e para ambientes com schema gerenciado manualmente, execute a migration explicitamente. Com o PostgreSQL do Docker Compose, a partir de `backend/ArtisticEcommerce`:

```powershell
Get-Content -Raw -Encoding UTF8 src/main/resources/db/migration/V2__product_category.sql |
  docker exec -i artistic-postgres psql -U postgres -d artistic_ecommerce -v ON_ERROR_STOP=1
```

Na correção local, a migration foi aplicada e a API reiniciada. A contagem e o checksum dos seis campos originais dos produtos permaneceram iguais antes e depois da atualização.

Arquivos desta correção de categoria:

- Backend: `entity/Product.java`, `service/ProductCatalog.java`, `service/ProductService.java`, `controller/ProductExceptionHandler.java` (novo), `resources/db/migration/V2__product_category.sql` (novo), `ProductCategoryTest.java` (novo) e `ProductCatalogTest.java`.
- Frontend: `src/components/ProductEditor.jsx`, `src/lib/catalog.js`, `src/lib/api.js`, `tests/product-categories.spec.js` (novo), `tests/e2e.spec.js` e `CATALOG.md`.

`ProductCategoryTest` percorre as oito categorias em criação, edição e edição sem troca de categoria, conferindo o JSON, a coluna via JDBC, a entidade recarregada e o filtro público. Também testa valores nulos, ausentes, vazios, códigos/rótulos inválidos, tipos incorretos e preservação de registros antigos. Foi executado tanto em H2 quanto em um banco PostgreSQL temporário separado. `product-categories.spec.js` cobre formulário, payload, recarga, edição de peças antigas, catálogo e erros no navegador.

Resultado da validação: 34 testes em H2, 27 testes em PostgreSQL e 92 testes de navegador aprovados, além de lint e build de produção do frontend.

## Cadastrar ou editar uma peça

1. Entre em `/login`, acesse **Produtos** e selecione **Novo produto** (ou edite uma peça).
2. Preencha nome, descrição, preço e imagem como antes.
3. Escolha uma categoria: Brincos, Esculturas, Esculturas de biscuit, Decoração, Quadros, Peças personalizadas, Colecionáveis ou Outros artesanatos. **Todos os produtos** é uma opção de navegação, não uma categoria de cadastro.
4. Selecione **Disponível**, **Sob encomenda** ou **Esgotado**. Disponíveis e encomendas permitem contato; esgotados continuam visíveis, com acesso aos detalhes.
5. Selecione os materiais/técnicas utilizados. As sugestões iniciais são biscuit, pintura manual, resina e cerâmica. Para cadastrar outro, digite e clique em **Adicionar material**. Um material digitado também é incluído ao salvar. Até 12 valores de até 80 caracteres por produto; espaços e caixa são normalizados.
6. Marque **Destacar esta peça** para priorizá-la na ordenação por destaque. Salve.

Materiais aparecem no filtro quando estiverem associados a um produto salvo. Não é necessário alterar código para adicionar madeira, tecido, bordado ou outra técnica.

## Campos de produto

| Campo          | Contrato                                                  | Compatibilidade                                                                                                     |
| -------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `category`     | String obrigatória no POST/PUT, com um dos códigos abaixo | Registros antigos podem ter `NULL`, exibido como **Sem categoria**; gravações sem categoria retornam 400            |
| `availability` | `available`, `made-to-order`, `sold-out`                  | Sem valor: derivado do booleano antigo                                                                              |
| `materials`    | Conjunto de strings, armazenado em `product_materials`    | Sem valores: conjunto vazio                                                                                         |
| `featured`     | Booleano                                                  | Ausente/nulo: falso                                                                                                 |
| `createdAt`    | Data ISO gerada no cadastro                               | Produtos antigos podem ter data nula; a ordem recente usa ID decrescente, preservando a ordem de inserção existente |
| `available`    | Booleano anterior, mantido                                | Sincronizado: verdadeiro para disponível/encomenda, falso para esgotado                                             |

Códigos de categoria: `brincos`, `esculturas`, `esculturas-biscuit`, `decoracao`, `quadros`, `personalizadas`, `colecionaveis`, `outros-artesanatos`.

Clientes devem enviar `category` em POST e PUT, inclusive ao editar outros campos. Materiais e destaque omitidos continuam preservados na atualização. O booleano antigo continua aceito: mudar seu valor altera a disponibilidade; manter verdadeiro preserva uma peça já cadastrada sob encomenda.

Exemplo de payload para POST/PUT autenticado:

```json
{
  "name": "Brincos Jardim de Pernambuco",
  "description": "Peça artesanal com pintura manual.",
  "price": 89.9,
  "imageUrl": "/uploads/brincos.webp",
  "category": "brincos",
  "availability": "made-to-order",
  "materials": ["biscuit", "pintura manual"],
  "featured": true,
  "available": true
}
```

## Filtros e API

`GET /api/products/catalog` aceita:

| Parâmetro    | Uso                                                                      |
| ------------ | ------------------------------------------------------------------------ |
| `busca`      | Nome ou descrição; ignora caixa e acentos; trata `%` e `_` literalmente  |
| `categoria`  | Repetível; qualquer categoria selecionada                                |
| `status`     | Repetível; qualquer disponibilidade selecionada                          |
| `material`   | Repetível; qualquer material/técnica selecionado                         |
| `min`, `max` | Preços inclusivos, opcionais, não negativos                              |
| `ordem`      | `recent`, `price-up`, `price-down`, `featured`, `name`                   |
| `pagina`     | A partir de 1; páginas fora da coleção são ajustadas à última disponível |
| `tamanho`    | Padrão 12, máximo 48                                                     |

Grupos diferentes são combinados com **E**. Valores do mesmo grupo são combinados com **OU**. Ordenações usam ID como desempate; destaque considera valores legados nulos como falsos.

Resposta: `{ content, totalElements, totalPages, page, size }`. O contador corresponde ao total filtrado no servidor, não apenas aos itens da página. `GET /api/products/filters` retorna `{ materials, minPrice, maxPrice, totalProducts }` da coleção inteira; as opções não desaparecem ao filtrar.

Exemplo compartilhável:

```text
/catalogo?categoria=brincos&material=biscuit&status=made-to-order&min=50&max=150&ordem=price-up
```

Os filtros reiniciam a paginação, têm chips removíveis e podem ser limpos em conjunto. Busca tem debounce de 250 ms e proteção contra respostas atrasadas. Alterações de filtros entram no histórico do navegador; digitação na busca substitui a entrada atual. No celular/tablet, **Filtrar** abre um modal nativo com controle de foco, Escape e rolagem própria. A faixa de preço usa campos numéricos para permitir valores precisos.

## Executar e atualizar o banco

O catálogo funciona com a API antiga pelo modo de compatibilidade, mas a gravação de produtos exige o backend atualizado para impedir perda de categorias. Após atualizar o código, reinicie o backend e recarregue o frontend. A configuração atual usa `spring.jpa.hibernate.ddl-auto=update`: o Hibernate acrescenta as colunas anuláveis e a tabela de materiais sem remover os registros existentes. Não há Flyway configurado no `pom.xml`; arquivos SQL na pasta `db/migration` não são executados automaticamente.

```powershell
cd backend/ArtisticEcommerce
.\mvnw.cmd spring-boot:run
```

O wrapper existente pode falhar com `Não é possível indexar em uma matriz nula` em algumas instalações do PowerShell. Nesse caso, execute `mvn spring-boot:run` com Maven 3.9 instalado ou diretamente o `bin/mvn.cmd` do Maven já baixado em `.m2/wrapper/dists`.

Em outro terminal:

```powershell
cd frontend
npm install
npm run dev
```

O frontend usa `VITE_API_BASE` (`http://localhost:8080` por padrão). Em ambientes que gerenciam o schema manualmente, aplique antes as alterações equivalentes ao modelo `Product`: `category`/`availability` varchar, `featured` boolean anulável, `created_at` timestamp com fuso e `product_materials(product_id bigint FK products.id, material varchar(80))`.

## Validação

- Backend: `mvn -Dtest=ProductCatalogTest,ProductCategoryTest test`. São 34 testes em **H2 em memória** para consultas combinadas, acentos, paginação, materiais, legados, categorias, persistência, contrato HTTP e validação.
- PostgreSQL: `ProductCategoryTest` aceita `CATEGORY_TEST_DB_URL`, `CATEGORY_TEST_DB_USER`, `CATEGORY_TEST_DB_PASSWORD` e `CATEGORY_TEST_DB_DRIVER`. A URL PostgreSQL precisa apontar para um banco temporário chamado `artistic_category_test_*`, criado antes da execução e removido depois. O teste rejeita outros nomes antes de inicializar o schema. Foram executados 27 testes nesse ambiente separado do banco da loja.
- Frontend: `npm run lint`, `npm run build`, `$env:PLAYWRIGHT_CHANNEL = 'msedge'; npm run test:e2e`. Testes usam API simulada, quatro larguras (320, 390, 768 e 1440 px) e axe para acessibilidade.

## Arquivos desta implementação

Backend (prefixo `backend/ArtisticEcommerce/`):

- `pom.xml` — H2 somente para testes.
- `src/main/java/com/ecommerce/ArtisticEcommerce/entity/Product.java`.
- `src/main/java/com/ecommerce/ArtisticEcommerce/dto/ProductDto.java`.
- `src/main/java/com/ecommerce/ArtisticEcommerce/dto/CatalogPage.java` (novo).
- `src/main/java/com/ecommerce/ArtisticEcommerce/dto/CatalogFilters.java` (novo).
- `src/main/java/com/ecommerce/ArtisticEcommerce/repository/ProductRepository.java`.
- `src/main/java/com/ecommerce/ArtisticEcommerce/service/ProductService.java`.
- `src/main/java/com/ecommerce/ArtisticEcommerce/service/ProductCatalog.java` (novo).
- `src/main/java/com/ecommerce/ArtisticEcommerce/controller/ProductController.java`.
- `src/test/java/com/ecommerce/ArtisticEcommerce/ProductCatalogTest.java` (novo).

Frontend (prefixo `frontend/`):

- `src/pages/Catalog.jsx`.
- `src/pages/AdminProducts.jsx`.
- `src/pages/ProductDetails.jsx`.
- `src/components/CatalogFilters.jsx` (novo).
- `src/components/ProductEditor.jsx`.
- `src/components/ProductCard.jsx`.
- `src/components/StoreLayout.jsx` — correção pontual de tag JSX sem fechamento na marca alterada pelo usuário; nome/imagem preservados.
- `src/hooks/useCatalog.js` (novo).
- `src/lib/catalog.js` (novo).
- `src/lib/api.js`.
- `src/styles/catalog.css` (novo).
- `src/styles/store.css` — remoção dos estilos antigos da barra de filtros.
- `src/index.css`.
- `tests/e2e.spec.js`.
- `CATALOG.md` (novo).
