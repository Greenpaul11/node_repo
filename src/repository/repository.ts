import { Model, ModelStatic, InferAttributes, InferCreationAttributes, Sequelize } from "sequelize";
import { EntityMetadata, EntityRelationTree } from "../types/entity/Metadata";
import { EntityBase } from "../types/entity/Root";
import { createRelationTree } from "../tree/treeBuilders";
import { OutputFormaterBase } from "../formaters/output/outputFormaterBase";
import { OrmOptions, DialectOptions } from "../types/Config";
import { CreationOptional, EntityCreationAttributes } from "../types/entity/Creation";
import { OrmManagerBase } from "../ormManager/ormMenagerBase";
import { Query, EntityQueryable, EntityProjection } from "../types/entity/Query";
import { QueryFormaterBase } from "../formaters/query/queryFormaterBase";


/**
 * User-facing polymorphic entry point for an entity.
 *
 * `Repository` is what application code consumes. It hides the
 * ORM-specific plumbing behind a small, typed API and exposes the
 * typed entity shape `E` regardless of which ORM is underneath
 * (Sequelize today, Prisma-ready for the future).
 *
 * The class wires together three collaborators, each loaded lazily for
 * its concrete ORM / dialect:
 *
 *  - {@link OrmManagerBase} — performs the actual CRUD calls
 *    (`createOne`, `deleteOne`, `destroyAll`).
 *  - {@link OutputFormaterBase} — converts ORM rows returned by the
 *    manager into fully typed {@link EntityBase} entities.
 *  - {@link QueryFormaterBase} — *(reserved, not yet implemented)* —
 *    will translate declarative {@link EntityQueryable} filters into
 *    ORM-specific queries for richer operations such as `findOne`,
 *    `findAll`, and aggregate queries.
 *
 * `Repository` itself is constructed synchronously (constructor only
 * holds metadata). The ORM-specific collaborators are wired in by the
 * async static {@link Repository.init} factory, which dynamically
 * imports the right implementation based on the connection's ORM.
 *
 * @typeParam E - Typed entity shape (must extend {@link EntityBase}).
 * @typeParam C - Creation attribute shape, i.e. the fields accepted by
 *                {@link createOne}. Defaults to the entity's full
 *                creation-attribute set including {@link CreationOptional}
 *                fields.
 * @typeParam T - The ORM-specific row / model type. For Sequelize this
 *                is a `Model<InferAttributes<T>, InferCreationAttributes<T>>`;
 *                for Prisma it would be the corresponding record type.
 *
 * @example
 * ```ts
 * const repo = await Repository.init(
 *     sequelizeConnection,
 *     productMetadata,
 *     ProductModel
 * )
 *
 * const created = await repo.createOne({ brand: 'Samsung', model: 'Galaxy S23' })
 * //    => Product  (typed entity)
 *
 * const rawRow = await repo.createOne({ brand: 'Apple', model: 'iPhone 15' }, true)
 * //    => ProductModel  (raw Sequelize instance)
 *
 * await repo.destroyAll()
 * ```
 */
export class Repository<
    E extends EntityBase,
    C extends EntityCreationAttributes<E, CreationOptional<E>>,
    T
> {
    /** Entity metadata driving attribute lists, relations, and converters. */
    public readonly metadata: EntityMetadata<E>;

    /** The live ORM connection (e.g. a Sequelize instance). */
    public readonly connection: OrmOptions;

    /** Pre-computed relation tree derived from `metadata`. */
    public readonly relationTree: EntityRelationTree<E>;

    /**
     * Query formatter — translates declarative queries into
     * ORM-specific calls. **Reserved for future implementation**;
     * currently uninitialized. Will follow the same dynamic-import
     * initialization pattern as `outputFormater` / `menager` below
     * (see {@link Repository.init}).
     */
    private queryFormater!: QueryFormaterBase<E, T>;

    /**
     * Output formatter — converts raw ORM rows returned by `menager`
     * into typed entities. Loaded by {@link Repository.init} from the
     * ORM-specific implementation directory.
     */
    private outputFormater!: OutputFormaterBase<E, T>;

    /**
     * ORM manager — performs the actual CRUD calls. Loaded by
     * {@link Repository.init} from the ORM-specific implementation
     * directory. *(Field name retains the legacy `menager` spelling
     * to match the {@link OrmManagerBase} import name.)*
     */
    private menager!: OrmManagerBase<E, T>;

    /**
     * @param metadata   Entity metadata providing attribute lists,
     *                   configs, and relation references.
     * @param connection Live ORM connection. Stored but not yet used
     *                   here — the async {@link Repository.init}
     *                   factory inspects it to decide which ORM /
     *                   dialect implementation to load.
     */
    constructor(metadata: EntityMetadata<E>, connection: OrmOptions) {
        this.metadata = metadata;
        this.connection = connection;
        this.relationTree = createRelationTree(this.metadata);
    }


    /**
     * Async factory that wires the ORM-specific collaborators.
     *
     * Inspects `connection` to determine the ORM and dialect, then
     * dynamically imports the matching modules from
     * `layers/<orm>/manager/ormManager` and
     * `layers/<orm>/output/formater`. Each loaded class is instantiated
     * with the right dialect and stored on the new repository instance.
     *
     * This dynamic-import pattern keeps the ORM-specific code out of
     * the main bundle and lets a single `Repository` class work across
     * any supported ORM.
     *
     * @typeParam E - Typed entity shape.
     * @typeParam C - Creation attribute shape.
     * @typeParam T - The ORM-specific model type. Constrained here to
     *                a Sequelize `Model<InferAttributes, InferCreationAttributes>`
     *                to match the dynamic-import resolution path.
     *
     * @param connection Live ORM connection (e.g. a Sequelize instance).
     *                    Currently only `Sequelize` is recognized.
     * @param metadata   Entity metadata.
     * @param ormEntity  The ORM-specific model constructor (e.g. a
     *                    Sequelize `ModelStatic<T>`).
     *
     * @returns A fully initialized `Repository` ready to use.
     *
     * @throws {Error} When `connection` is not a recognized ORM (only
     *                 `Sequelize` is currently supported).
     *
     * @remarks
     * **Future:** once {@link QueryFormaterBase} is implemented, this
     * method will additionally load it from
     * `layers/<orm>/query/formater` and assign it to
     * `this.queryFormater`. The initialization rule will mirror the
     * existing two collaborators: dynamic import keyed by ORM name,
     * instantiate with `(metadata, relationTree, dialect)`.
     *
     * @example
     * ```ts
     * const repo = await Repository.init(
     *     sequelizeConnection,
     *     productMetadata,
     *     ProductModel
     * )
     * ```
     */
    static async init<
        E extends EntityBase,
        C extends EntityCreationAttributes<E, CreationOptional<E>>,
        T extends Model<InferAttributes<T>, InferCreationAttributes<T>>
    >(
        connection: OrmOptions,
        metadata: EntityMetadata<E>,
        ormEntity: ModelStatic<T>
    ): Promise<Repository<E, C, T>> {
        const repository = new Repository<E, C, T>(metadata, connection);
        const orm = repository._resolveOrmName(connection)
        const dialect = repository._resolveDialectName(connection);

        // place for implementation of queryFormater
        const ormQueryModule = await import(`../layers/${orm}/query/formater`);
        const QueryFormater = ormQueryModule.QueryFormater as new (
            metadata: EntityMetadata<E>,
            relationTree: EntityRelationTree<E>,
        ) => QueryFormaterBase<E, T>
        repository.queryFormater = new QueryFormater(repository.metadata, repository.relationTree)

        // load proper OrmOperations class for specific ORM
        const ormManagerModule = await import(`../layers/${orm}/manager/ormManager`);
        const OrmManager = ormManagerModule.OrmManager as new (
            ormEntity: ModelStatic<T>,
            dialect: DialectOptions,
            convertQuery: <Q extends Query<E>>(query: Q) => unknown
        ) => OrmManagerBase<E, T>
        const convertQuery = repository.queryFormater.formatQuery.bind(repository.queryFormater)
        repository.menager = new OrmManager(ormEntity, dialect, convertQuery)

        // load proper OutputFormater class for specific ORM
        const formaterModule = await import(`../layers/${orm}/output/formater`);
        const OutputFormater = formaterModule.OutputFormater as new (
            metadata: EntityMetadata<E>,
            relationTree: EntityRelationTree<E>,
            dialect: DialectOptions
        ) => OutputFormaterBase<E, T>;
        repository.outputFormater = new OutputFormater(repository.metadata, repository.relationTree, dialect);

        return repository;
    }


    /**
     * Inspect `connection` and return its dialect identifier.
     *
     * @param connection The ORM connection to inspect.
     * @returns `'mysql'` or `'sqlite'` (the values of
     *          {@link DialectOptions}) when the connection is a
     *          `Sequelize` instance.
     * @throws {Error} When `connection` is not a Sequelize instance.
     */
    private _resolveDialectName(connection: OrmOptions): DialectOptions {
        if (connection instanceof Sequelize) {
            return connection.getDialect() as DialectOptions
        }
        throw new Error(`unknown ORM connection: ${typeof connection}`);
    }

    /**
     * Inspect `connection` and return the ORM identifier used to
     * resolve the dynamic-import path
     * (`layers/<orm>/manager/ormManager`,
     * `layers/<orm>/output/formater`).
     *
     * @param connection The ORM connection to inspect.
     * @returns `'sequelize'` for a Sequelize connection; reserved
     *          future values include `'prisma'`.
     * @throws {Error} When `connection` is not a recognized ORM.
     */
    private _resolveOrmName(connection: OrmOptions): string {
        if (connection instanceof Sequelize) {
            return 'sequelize'
        }
        throw new Error('connection is unknown!')
    }


    //////////////////////////////////////// MENAGER ////////////////////////////////////////

    /**
     * Insert a single record and return it as a typed entity.
     *
     * The return type is selected by the `raw` flag:
     *  - `raw` omitted or `false` (default) → typed entity `E`;
     *  - `raw: true` → raw ORM model `T`.
     *
     * @param data Fields for the new record. Optional / auto-generated
     *             fields declared in {@link CreationOptional} or
     *             {@link CreationOptionalAlways} may be omitted.
     * @param raw  When `true`, returns the raw ORM model instead of
     *             the typed entity.
     * @returns The newly created row, either as a typed entity or as
     *          a raw ORM model depending on `raw`.
     *
     * @example
     * ```ts
     * // Typed entity
     * const product = await repo.createOne({ brand: 'Samsung', model: 'Galaxy S23' })
     *
     * // Raw ORM model
     * const raw = await repo.createOne({ brand: 'Apple', model: 'iPhone 15' }, true)
     * ```
     */
    async createOne(data: C): Promise<E>
    async createOne(data: C, raw: false): Promise<E>
    async createOne(data: C, raw: true): Promise<T>
    async createOne(data: C, raw: boolean = false): Promise<E | T> {
        const entityRaw = await this.menager.createOne(data)
        if (raw) return entityRaw
        return this.outputFormater.asEntity(entityRaw)
    }

    /**
     * Delete a single record by primary key.
     *
     * @param id Numeric primary key of the record to delete.
     * @returns `true` when a record was actually removed, `false` when
     *          no matching record existed.
     */
    async deleteOne(id: number): Promise<boolean> {
        return await this.menager.deleteOne(id)
    }

    /**
     * Delete every record matching the optional filter.
     *
     * @param where Optional {@link EntityQueryable} filter. When
     *             omitted, **every** record of the entity is removed —
     *             use with care.
     * @returns The number of records deleted.
     */
    async destroyAll(where?: EntityQueryable<E>): Promise<number> {
        return this.menager.destroyAll(where)
    }
    
    /**
     * Find a single record matching the query and return it as a typed entity.
     *
     * The return type is selected by the `raw` flag:
     *  - `raw` omitted or `false` (default) → typed entity `E`;
     *  - `raw: true` → raw ORM model `T`.
     *
     * @typeParam Q - Query type, inferred from `query`. Controls which
     *                fields are selected and which relations are included.
     * @param query Declarative query with filters, selects, and nested
     *               relation queries. See {@link Query}.
     * @param raw   When `true`, returns the raw ORM model instead of
     *              the typed entity (or `null` when not found).
     * @returns The matching row projected to `Q`, or `null` when no
     *          record matches the query.
     *
     * @example
     * ```ts
     * const product = await repo.getOneBy({ id: 1, select: ['id', 'brand'] })
     * // => { id: 1, brand: 'Samsung' }
     *
     * const raw = await repo.getOneBy({ id: 1 }, true)
     * // => ProductModel instance
     * ```
     */
    async getOneBy<Q extends Query<E>>(query: Q): Promise<EntityProjection<E, Q> | null>
    async getOneBy<Q extends Query<E>>(query: Q, raw: false): Promise<EntityProjection<E, Q> | null>
    async getOneBy<Q extends Query<E>>(query: Q, raw: true): Promise<T | null>
    async getOneBy<Q extends Query<E>>(query: Q, raw: boolean = false): Promise<EntityProjection<E, Q> | T | null> {
        const entityRaw = await this.menager.getOneBy(query)
        if (raw) return entityRaw
        return this.outputFormater.asEntity(entityRaw, query)
    }

    /**
     * Find all records matching the query and return them as typed entities.
     *
     * The return type is selected by the `raw` flag:
     *  - `raw` omitted or `false` (default) → typed entity array `E[]`;
     *  - `raw: true` → raw ORM model array `T[]`.
     *
     * @typeParam Q - Query type, inferred from `query`. Controls which
     *                fields are selected and which relations are included.
     * @param query Declarative query with filters, selects, and nested
     *               relation queries. See {@link Query}.
     * @param raw   When `true`, returns raw ORM models instead of
     *              typed entities.
     * @returns An array of matching rows projected to `Q`, or an empty
     *          array when no records match the query.
     *
     * @example
     * ```ts
     * const products = await repo.getManyBy({
     *     brand: 'Samsung',
     *     select: ['id', 'model']
     * })
     * // => [{ id: 1, model: 'Galaxy S23' }, ...]
     *
     * const raw = await repo.getManyBy({ active: true }, true)
     * // => ProductModel[]
     * ```
     */
    async getManyBy<Q extends Query<E>>(query: Q): Promise<EntityProjection<E, Q>[]>
    async getManyBy<Q extends Query<E>>(query: Q, raw: false): Promise<EntityProjection<E, Q>[]>
    async getManyBy<Q extends Query<E>>(query: Q, raw: true): Promise<T[]>
    async getManyBy<Q extends Query<E>>(query: Q, raw: boolean = false): Promise<EntityProjection<E, Q>[] | T[]> {
        const entityRaw = await this.menager.getManyBy(query)
        if (raw) return entityRaw
        return this.outputFormater.asEntities(entityRaw)
    }

}
