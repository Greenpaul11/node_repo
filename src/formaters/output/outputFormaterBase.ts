import { EntityBase } from '../../types/entity/Root'
import { EntityMetadata, EntityRelationTree } from '../../types/entity/Metadata'
import { Query, MapEntitySelect, EntityProjection } from '../../types/entity/Query'
import {
    ConverterFunctions,
    ConverterFunctionDialects,
    ConverterFamilesInfer,
    ConverterDialectsBuild
} from '../../types/entity/Converters'
import { buildConverters } from './buildConverters'
import { entitySelectToMapSelect, mapNestedSelects } from './mapSelects'


/**
 * Base class that defines the main properties and methods for converting
 * ORM-level rows into fully typed domain entities.
 *
 * Subclasses derived from this class provide the implementation for a
 * specific ORM layout (e.g. Sequelize, Prisma). Every subclass is named
 * `OutputFormater`; what distinguishes one subclass from another is the
 * directory tree it is imported from.
 *
 * `OutputFormaterBase` sits between the data layer — which returns raw,
 * ORM-specific representations of an entity (or partially transformed
 * rows) — and the application layer, which expects the {@link EntityBase}
 * shape. It owns three responsibilities:
 *
 *  1. **Select mapping** — retrieves the `select` attribute from a
 *     {@link Query} and turns it into a flat per-attribute selection map
 *     covering the root entity, its nested relations, and aggregate
 *     functions. The result is a {@link MapEntitySelect}.
 *  2. **Converter construction** — builds a family-keyed set of type
 *     converters (e.g. `"raw"`, `"native"`) from the dialect's build
 *     configuration.
 *  3. **Row conversion** — exposes abstract hooks that subclasses
 *     implement to map one or many transformed rows into typed entities.
 *
 * Concrete subclasses (e.g. the Sequelize `OutputFormater`) implement
 * `asEntity` and `asEntities` using the converters and select map exposed
 * by this base.
 *
 * @typeParam E - The typed entity shape returned to callers
 *                (must extend {@link EntityBase}).
 * @typeParam T - The transformed row type produced by the ORM layer
 *                (e.g. a Sequelize `Model` instance).
 * @typeParam C - The dialect build configuration type. Defaults to
 *                {@link ConverterDialectsBuild} of `any`. Each key of `C`
 *                corresponds to a supported dialect (e.g. `"mysql"`,
 *                `"sqlite"`).
 *
 * @example
 * Subclassing for the Sequelize ORM:
 * ```ts
 * class OutputFormater<E extends EntityBase, T extends Model<...>> extends OutputFormaterBase<E, T> {
 *
 *     // ... Sequelize-specific implementation ...
 *
 *     asEntity<Q extends Query<E>>(row: T | null, query?: Q): any {
 *         return this.convertRow(row, query);
 *     }
 *
 *     asEntities<Q extends Query<E>>(rows: T[], query?: Q): any[] {
 *         return rows.map(r => this.convertRow(r, query));
 *     }
 * }
 * ```
 */
export abstract class OutputFormaterBase<
    E extends EntityBase,
    T,
    C extends ConverterDialectsBuild<C> = ConverterDialectsBuild<any>
> {
    /**
     * Family-keyed set of converters, populated by {@link converterFactory}.
     * Each key is a transform family (e.g. `"raw"`, `"native"`) and each
     * value is a {@link ConverterFunctions}-shaped object.
     */
    public converters!: ConverterFamilesInfer<E>;

    /**
     * Inferred converter function set derived from the entity and dialect
     * types. Drives the runtime behavior of `asEntity` and `asEntities`
     * in subclasses.
     */
    public converterFunctions!: ConverterFunctions<E, T, any>;

    /**
     * Dialect-keyed view of {@link converterFunctions}. Each key is a
     * dialect name and its value is the converter pair for that dialect.
     */
    public converterFunctionDialects!: ConverterFunctionDialects<E, T, OutputFormaterBase<E, T, C>>;

    /**
     * The full dialect build configuration passed into the constructor.
     * Exposed so subclasses can introspect available converters.
     */
    public converterDialectsBuild!: C;

    /**
     * @param metadata    Entity metadata describing base attributes and
     *                    relations.
     * @param relationTree Relation tree derived from `metadata`; controls
     *                    nested select mapping.
     * @param dialect     Active dialect key. Must be a key of `C`
     *                    (e.g. `"mysql"`).
     */
    constructor(
        public metadata: EntityMetadata<E>,
        public relationTree: EntityRelationTree<E>,
        public dialect: keyof C
    ) {}


    /**
     * Build a flat per-attribute selection map from the `select` attribute
     * of a {@link Query}.
     *
     * Combines the root-entity select (resolved against
     * `metadata.baseAttributesList`) with the nested select map produced by
     * {@link mapNestedSelects} for each relation in `relationTree`.
     *
     * @param query - Query that may carry a `select` attribute.
     *                - If `query.select` is defined, attributes of the
     *                  entity and its related entities are selected
     *                  accordingly.
     *                - If `query.select` is undefined, all base
     *                  attributes of the root entity are selected by
     *                  default, nested selects still apply if provided.
     * @returns A {@link MapEntitySelect} keyed by attribute path, marking
     *          which fields are requested at the root and at each relation
     *          level.
     */
    public mapSelects(query: Query<E> | undefined): MapEntitySelect<E> {
        return {
            ...entitySelectToMapSelect(query && query['select'], this.metadata.baseAttributesList),
            ...mapNestedSelects(query, this.relationTree)
        }
    }

    /**
     * Build a family-keyed converter object for the given dialect.
     *
     * Iterates the configured transform families (e.g. `"raw"`, `"native"`)
     * in `typeConverters` and, for each one, produces an attribute-level
     * converter set via {@link buildConverters}.
     *
     * @param typeConverters - The build configuration for the current
     *                         dialect, indexed by transform family.
     * @returns A {@link ConverterFamilesInfer} keyed by family name.
     */
    public converterFactory(
        typeConverters: ConverterDialectsBuild<C>[typeof this.dialect]
    ): ConverterFamilesInfer<E> {
        const converters: ConverterFamilesInfer<E> = {}
        for (const family in typeConverters) {
            converters[family] = buildConverters(this.metadata, typeConverters[family])
        }
        return converters
    }


    /**
     * Convert a single transformed row into a typed entity (or projection
     * of it).
     *
     * Implemented by subclasses. The return shape depends on whether
     * `query` is supplied: without a query the full entity `E` is
     * returned, with a query the entity is projected to
     * {@link EntityProjection} of `E` according to the requested
     * selection.
     *
     * @typeParam Q - Query subtype narrowing the returned projection.
     * @param row   - The transformed row from the ORM layer, or `null`
     *                if no row was found.
     * @param query - Optional query describing the desired selection
     *                shape.
     * @returns The typed entity, a projected entity, or `null` when
     *          `row` is `null`.
     */
    public abstract asEntity<Q extends Query<E>>(row: T | null): E;
    public abstract asEntity<Q extends Query<E>>(row: T | null, query: Q): EntityProjection<E, Q> | null;
    public abstract asEntity<Q extends Query<E>>(row: T | null, query?: Q): E | EntityProjection<E, Q> | null;

    /**
     * Convert an array of transformed rows into an array of typed entities.
     *
     * Implemented by subclasses. Each element follows the same projection
     * rules as {@link asEntity}.
     *
     * @typeParam Q - Query subtype narrowing each returned projection.
     * @param rows  - The transformed rows from the ORM layer.
     * @param query - Optional query describing the desired selection
     *                shape.
     * @returns Array of typed entities (possibly projected via `query`).
     */
    public abstract asEntities<Q extends Query<E>>(row: T[], query?: Q): EntityProjection<E, Q>[]
}
