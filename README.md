# node_repo

**Status: in development.**

A polymorphic, type-safe ORM abstraction for TypeScript. One
`Repository<T>` works across [Sequelize](https://sequelize.org/) today and
[Prisma](https://www.prisma.io/) tomorrow — the application code stays the
same.

The layer turns ORM-specific typed entities into fully typed domain entities
defined by your `EntityBase` shape. Your entity definition is independent
of the ORM layer. Switching ORMs — e.g., from Sequelize to Prisma — means
changing only the connection and the layer import; application code does not
change.

Currently supported ORM and dialects:

- Sequelize
  - mysql
  - sqlite

## Why this exists

I wanted to learn something new, so I chose a project like this:
**CREATE A MINI ORM LAYER THAT HANDLES MULTIPLE ORM BACKENDS**.

## How to run

The application requires:

- An ORM connection (currently only Sequelize is accepted).
- A definition for your entities (see `tests/testSkeleton/entities.ts`).
- An `EntityConfig` definition for each entity. This will auto-generate
  `EntityMetadata` (see `tests/testSkeleton/config.ts`).
- The Sequelize models defined manually (see `tests/testSkeleton/models.ts`).

Initialize your repository like this:

```ts
import { Repository } from 'src/repository/repository'
import connection from 'config/connection'
import { productMetadata } from 'tests/testSkeleton/config'
import { ProductModel } from 'tests/testSkeleton/models'

const repo = await Repository.init(connection, productMetadata, ProductModel)
```

Now you have a repository with these available calls:

- `createOne(data, native?)` — creates a record. Returns a domain typed entity by default, or the raw ORM model if `native = true`.
- `getOneBy(query, control?)` — finds one record matching the query. Returns a domain typed entity or `null`. Pass `{ native: true }` to get the raw ORM model.
- `getManyBy(query, control?)` — finds all records matching the query. Returns an array of domain typed entities (or raw ORM models).
- `deleteOne(id)` — deletes a record by id. Returns `true` if a record was removed.
- `destroyAll(where?)` — deletes all records matching the condition. Returns the number of deleted records.

These repository APIs cover the majority of common use cases. However, they are not intended to be restrictive. 
If you need functionality that is not exposed through the repository interface, 
you can access the underlying ORM manager directly. For example:

```ts
repo.ormManager.manager.findAll() // SequelizeModel.findAll()
```

Use the native ORM manager only when the repository APIs cannot satisfy your requirements.

Repository calls will always stay the same regardless of the ORM underneath. The
query parameter uses its own query language that is independent of the ORM.
Currently you can use in your queries:

- **base attributes** — the entity's own fields like `id`, `name`, `brand`
  ```
  { brand: 'Apple', active: true }
  ```

- **range attributes** — number or date fields with `_from` or `_to` suffixes
  ```
  { id_from: 10, created_from: '2023-03-01T00:00:00Z' }
  ```

- **relation attributes** — fields that point to other entities. Each relation
  value is itself a query for that sub-entity. Aggregate functions are not
  available inside relation queries.
  ```
  { prices: { active: true, price_from: 100, shop: { name: 'Shopnix' } } }
  ```

- **select attribute** — choose which fields to return, or use aggregate
  functions (`$count`, `$sum`, `$avg`, `$min`, `$max`), or exclude fields.
  ```
  { select: ['id', 'name', ['$sum', ['prices', 'price']]] }
  { select: { exclude: ['image', 'description'] } }
  ```

- **order attribute** — single string for one field, array for multi-field composite sorts, 
  `nulls first`/`nulls last` for null placement. Use tuple for relation ordering, first item
  in tuple refers always to related entity name 
  (`['prices', ['by price asc']]`) or deep nested ordering
  (`['prices', ['by price asc', ['shop', ['by name desc']]]]`).
  ```
  { order: 'by brand asc' }
  { order: 'by created desc nulls last' }
  { order: ['by brand asc', 'by model desc', 'by id asc'] }
  { order: ['by brand asc', ['prices', ['by price desc']]] }
  { order: ['by brand asc', ['prices', [['shop', ['by name asc']]]]] }
  ```

- **group attribute** - single string for one field, array for multi-field. Use tuple for
  relation grouping, first item in tuple refers always to related entity name
  (`['prices', ['by price']]`) or deep nested ordering
  (`['prices', [['shop', ['by name']]]]`).
  ```
  { group: 'by price' }
  { group: ['by price', 'by created'] }
  { group: ['by price', ['shop', ['by name']]] }
  { group: ['by price', ['product', ['by brand', ['importer', ['by name']]]]] }

The domain query language is converted to the ORM-specific query language
internally. When entities are returned by the ORM manager, they are converted
by `asEntity`/`asEntities` in `OutputFormater` into domain typed entities.

## How the query conversion works

1. A `Query<E>` object is passed to `QueryFormater.formatQuery()`.
2. The formater uses a `QueryConvertObject` — a flat dispatch table built by
   `queryConvertObjectFactory()` — to convert each key/value pair.
3. The dispatch table contains converters for:
   - **base attributes** (string, number, date, boolean)
   - **range attributes** (`_from`/`_to` for number and date)
   - **query attributes** (`select`, `order`)
   - **relation attributes** (recursive conversion via `buildRelationAttributeConverters`)
4. Validation can be enabled per attribute type. When active, each value is
   checked before conversion.
5. The result is an ORM-specific query object (e.g., Sequelize `FindOptions`).

## Architecture

`Repository` sits at the top and wires three parallel collaborators through
dynamic imports. The abstract contracts live in `src/formaters/` and
`src/ormManager/`; each ORM (Sequelize, and later Prisma) provides concrete
implementations under `src/layers/<orm>/`.

```
                                      ┌─────────────────────────────┐
                                      │         Repository          │
                                      │      src/repository/        │
                                      │        (user-facing)        │
                                      └─────────────┬───────────────┘
                                                    │
                                      wires via dynamic import
                                                    │
                    ┌───────────────────────────────┼──────────────────────────────────┐
                    │                               │                                  │
                    ▼                               ▼                                  ▼

  ┌────────────────────────────┐      ┌────────────────────────────┐      ┌────────────────────────────┐
  │      QueryFormatter        │      │        OrmManager          │      │      OutputFormatter       │
  ├────────────────────────────┤      ├────────────────────────────┤      ├────────────────────────────┤
  │      Abstract Base         │      │      Abstract Base         │      │      Abstract Base         │
  │   src/formatters/query/    │      │     src/ormManager/        │      │  src/formatters/output/    │
  └─────────────┬──────────────┘      └─────────────┬──────────────┘      └─────────────┬──────────────┘
                │                                   │                                   │
                ▼                                   ▼                                   ▼
  ┌────────────────────────────┐      ┌────────────────────────────┐      ┌────────────────────────────┐
  │     Sequelize Layer        │      │     Sequelize Manager      │      │     Sequelize Layer        │
  │ src/layers/sequelize/      │      │ src/layers/sequelize/      │      │ src/layers/sequelize/      │
  │        query/              │      │        manager/            │      │        output/             │
  └────────────────────────────┘      └────────────────────────────┘      └────────────────────────────┘
```


- **Repository** (`src/repository/repository.ts`) — what application code
  calls. Constructed synchronously; the async `Repository.init()` factory
  dynamically imports the right implementations based on the connection's
  ORM and dialect.
- **QueryFormater** — converts domain `Query<E>` objects into ORM-specific
  query objects (e.g. Sequelize `FindOptions`). Validation is configurable
  per attribute type. Abstract base: `src/formaters/query/queryFormaterBase.ts`.
  Sequelize impl: `src/layers/sequelize/query/formater.ts` using converters
  from `src/layers/sequelize/query/build.ts`.
- **OrmManager** — performs actual CRUD against the database. Abstract base:
  `src/ormManager/ormMenagerBase.ts`. Sequelize impl:
  `src/layers/sequelize/manager/ormManager.ts`.
- **OutputFormater** — converts raw ORM rows into domain typed entities.
  Handles `raw: true, nest: true` row deduplication(in Sequelize case). Abstract base:
  `src/formaters/output/outputFormaterBase.ts`. Sequelize impl:
  `src/layers/sequelize/output/formater.ts` with
  `mergeRowsIntoEntities.ts`.

All layers are type-parameterized on the entity shape `E` and the ORM model
type `T`, so the compiler catches mismatches between layers.

## Data flow

### `createOne`

```
User → Repo.createOne(data)
        → OrmManager.createOne(data) → Model.create(data)
        → OutputFormater.asEntity(model) → typed Entity
```

### `getManyBy` / `getOneBy`

```
User → Repo.getManyBy(query)
        → QueryFormater.formatQuery(query) → ORM query object
        → OrmManager.getManyBy(ormQuery) → raw rows
        → OutputFormater.asEntities(rows, query) → typed Entities
```

## Project layout

```
src/
  types/                          Type-level DSL and metadata types
    entity/
      Root.ts                     EntityBase, ExternalReferences, EntityNoExternal
      Query.ts                    Query<E>, QuerySelect, EntityProjection, ...
      Metadata.ts                 EntityMetadata, sub-entity references, sort options
      Converters.ts               TransformRule, EntityTransform, dialect-aware rules
      Creation.ts                 CreationOptional, EntityCreationAttributes
    Config.ts                     OrmOptions, DialectOptions
    Global.ts                     Utility types (PickByType, NonUndefined, ...)
  formaters/
    output/                       Row → entity conversion
      outputFormaterBase.ts       Abstract formater
      buildConverters.ts          Type-keyed → attribute-keyed converters
      convertRow.ts               Single-row recursive transformation
      mapSelects.ts               QuerySelect → MapEntitySelect
    query/                        Domain query → ORM query conversion
      queryFormaterBase.ts        Abstract query formater
      buildConverters.ts          Builds per-attribute converter dispatch table
      config.ts                   Default config, validation presets
      validators.ts               Type validators (string, number, date, boolean, range, select)
  layers/
    sequelize/                    Sequelize implementation
      dialects/{mysql,sqlite}/    Per-dialect converter build + functions
      manager/ormManager.ts       Concrete OrmManager
      output/
        formater.ts               Concrete OutputFormater
        mergeRowsIntoEntities.ts   raw:true, nest:true deduplication
      query/
        build.ts                  Sequelize-specific converter functions
        formater.ts               Sequelize QueryFormater
      types.ts                    Sequelize-specific type helpers
  metadata/
    entityMetadataMenager.ts      Attribute lists, lazy order/group trees
  ormManager/
    ormMenagerBase.ts             Abstract CRUD contract
  repository/
    repository.ts                 Polymorphic entry point (Repository.init)
  tree/
    treeBuilders.ts               Cycle-safe relation-tree builder
  lib/
    override.ts                   Deep partial override utility
config/                           Environment files, connection bootstrap, test setup
docs/api/                         Generated TypeDoc reference (npm run docs)
```

## Highlights

- **Polymorphic `Repository<T>`** — one class, any ORM. Dynamic imports
  pick the right `OrmManager` and `OutputFormater` implementations.
- **Type-level query DSL** — `Query<E>` with range filters, select
  inclusion/exclusion, aggregate functions (`$count`, `$sum`, `$avg`,
  `$min`, `$max`), all checked at compile time against your entity shape.
- **Metadata-driven converter pipeline** — converters are built from
  entity metadata, not hard-coded per entity. Adding a new entity
  requires no converter code.
- **Configurable validation** — type validation can be enabled or disabled
  independently per attribute type (string, number, date, boolean, range,
  select).
- **Recursive relation handling** — 1:1, 1:N, N:1, N:M with arbitrarily
  nested sub-entities. Depth is bounded by configuration.
- **Dialect-aware converters** — per-dialect (MySQL, SQLite) attribute
  and aggregate converters.
- **Exclude-in-relation select** — `select: { exclude: ['field'] }` works
  both at root level and inside relation queries.

## Requirements

- Node.js 20+ (uses native `--env-file` and `node --test`).
- TypeScript 5.7+.

## Install

```bash
npm install
```

## Scripts

| Command | Purpose |
|---|---|
| `npm start` | Bootstraps the application entry point. |
| `npm test` | Runs the full test suite via `node --test` with `tsx` on SQLite. |
| `npm run docs` | Generates the TypeDoc API reference into `docs/api/`. |
| `npm run docs:watch` | Regenerates docs on save. |

## Configuration

Environment files live in `config/`:

- `config/.env` — default development settings.
- `config/.env.sequelize_mysql` — test profile for MySQL.
- `config/.env.sequelize_sqlite` — test profile for SQLite (used by `npm test`).

`npm test` already passes `--env-file=config/.env.sequelize_sqlite`.

## Usage — `Repository<T>` (recommended)

```ts
import { Repository } from 'src/repository/repository'
import { productMetadata } from 'tests/testSkeleton/config'
import { Product, ProductModel } from 'tests/testSkeleton/entities'
import connection from 'config/connection'

const repo = await Repository.init<Product, typeof ProductModel>(
    connection,
    productMetadata,
    ProductModel
)

// --- Create ---
const created = await repo.createOne({ brand: 'Samsung', model: 'Galaxy S23' })
//    => Product  (typed entity)

const rawRow = await repo.createOne({ brand: 'Apple', model: 'iPhone 15' }, true)
//    => ProductModel  (raw Sequelize instance)

// --- Query with relations ---
const products = await repo.getManyBy({
    brand: 'Apple',
    prices: { active: true, price_from: 3000 }
})
//    => Product[]  (typed entities with nested prices)

const one = await repo.getOneBy({
    id: 1,
    select: ['id', 'brand', 'model'],
    prices: { select: ['price', 'url'], active: true }
})
//    => Product  (only selected fields)

// --- Query with range ---
const recent = await repo.getManyBy({
    created_from: new Date('2024-06-01'),
    prices: { price_to: 500 }
})

// --- Query with exclude select ---
const withoutImage = await repo.getOneBy({
    select: { exclude: ['image', 'description'] },
    prices: { select: { exclude: ['url'] } }
})

// --- Query with aggregate functions ---
const stats = await repo.getOneBy({
    select: [
        ['$count', '*'],
        ['$sum', ['prices', 'price']],
        ['$avg', ['prices', 'price']],
        ['$min', ['prices', 'price']],
        ['$max', ['prices', 'price']]
    ]
})
//    => { $count_*, $sum_prices_price, $avg_prices_price, $min_prices_price, $max_prices_price }

const counts = await repo.getManyBy({
    select: ['id', ['$count', ['prices', 'id']]]
})
//    => each row: { id, $count_prices_id }

// --- Delete ---
await repo.deleteOne(1)

// --- Destroy all matching ---
await repo.destroyAll({ brand: 'Dell' })
```

### Validation

By default, validation is enabled for all attribute types. You can disable
it globally or per type:

```ts
import { QueryFormater } from 'src/layers/sequelize/query/formater'
import { createRelationTree } from 'src/tree/treeBuilders'

const tree = createRelationTree(productMetadata)
const formater = new QueryFormater(productMetadata, tree, {
    validation: {
        baseAttributes: { string: false, number: false },
        rangeAttributes: { number: false },
        queryAttributes: { select: false }
    }
})

const result = formater.formatQuery({ brand: 123, prices: { price_from: 'abc' } })
// passes without validation; with validation these would throw
```

`Repository.init` uses default validation (all on). To use custom config,
instantiate `QueryFormater` directly.

## `queryControl` parameter

`getOneBy` and `getManyBy` accept an optional second argument `queryControl`:

```ts
type QueryControl = { native: boolean }
```

- `{ native: false }` (default) — returns domain typed entities.
- `{ native: true }` — returns raw ORM model instances (Sequelize `Model`).

```ts
// Domain typed entity (default)
const product = await repo.getOneBy({ brand: 'Apple' })
//    => Product  (plain object, no Sequelize getters/setters)

// Raw Sequelize model instance
const raw = await repo.getOneBy({ brand: 'Apple' }, { native: true })
//    => ProductModel  (Sequelize Model with getters, setters, validators)
```

## Testing

```bash
npm test
```

The suite uses the built-in `node --test` runner with `tsx`. Coverage includes:

- **Formater unit tests** — `buildEntityAttributeConverters`,
  `buildRangeAttributeConverters`, `buildQueryAttributeConverters`,
  `buildRelationAttributeConverters` — verify converter construction
  with and without validation.
- **Query conversion tests** — `baseAttributes`, `rangeAttributes`,
  `relationAttribute`, `selectAttribute` at both formater level and
  database output level (sqlite + mysql).
- **Database output tests** — end-to-end: construct a query, run it
  against the database, assert returned entity shapes and values.
- **Output formater tests** — `buildConverters`, `convertRow`,
  `mapSelects`, `compareOutput` (deep equality between formater output
  and raw Sequelize output).
- **Merge/deduplication tests** — `mergeRowsIntoEntities`,
  `rowIsUniqueOrNotMerged`, `entityRowIsUnique`,
  `subRowIsUniqueOrNotMerged`, `rowToGrouped`.
- **Manager CRUD tests** — `createOne`, `deleteOne`, `destroyAll`
  lifecycle against test fixtures.
- **Relation model tests** — Sequelize model relation setup and cascade
  delete behavior.
- **Override utility tests** — `lib/override.test.ts`.

All tests run against the SQLite dialect by default (`npm test`). MySQL
tests can be run with the corresponding env file.

## Documentation

- This README — entry point, architecture, usage.
- **TypeDoc API reference** — generated from TSDoc comments into
  [`docs/api/`](https://greenpaul11.github.io/node_repo/api/).
  Run `npm run docs` to regenerate.

## License

MIT — see [`LICENSE`](./LICENSE).
