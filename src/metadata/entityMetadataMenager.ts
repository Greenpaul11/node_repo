import { EntityBase, EntityNoExternal, ExternalReferences } from '../types/entity/Root'
import {
    EntityMetadata,
    EntityConfigAttributes,
    EntityConfig,
    EntityAliases,
    SubEntitiesReferences,
    SortOptions
} from '../types/entity/Metadata'
import { NullableFromObject, PickByType } from '../types/Global'
import Decimal from 'decimal.js';


/**
 * Concrete implementation of {@link EntityMetadata} for a single entity.
 *
 * `EntityMetadataManager` is built once per entity from an
 * {@link EntityConfig} and exposes:
 *
 *  1. **Pre-computed attribute lists** — primary keys, base attributes,
 *     typed slices (string / number / boolean / date / range /
 *     full-text-search), and the full attribute config map.
 *  2. **Lazy relation metadata** — related entities' metadata is computed
 *     on first access via the `lazySubEntities` callback, then cached.
 *  3. **Lazy order / group option trees** — the full `orderOptions` and
 *     `groupOptions` trees (including all nested relations) are generated
 *     on first access and cached.
 *
 * Order / group option generation walks the entire relation graph to
 * produce exhaustive template-literal sort keys (e.g.
 * `` `by price_sum asc nulls first` ``). The walk is bounded against
 * cycles by tracking already-visited entity aliases.
 *
 * @typeParam E - Entity whose metadata is managed. Must extend
 *                {@link EntityBase}.
 *
 * @example
 * ```ts
 * const productMetadata = new EntityMetadataManager<Product>(
 *     productConfig,
 *     () => buildRelatedMetadata()   // lazy resolver for relations
 * )
 *
 * productMetadata.primaryKeys        // => ['id']
 * productMetadata.stringAttributesList // => ['brand', 'model']
 * productMetadata.orderOptions       // generated on first access, cached
 * ```
 */
export class EntityMetadataManager<E extends EntityBase>
        implements EntityMetadata<E> {

    private _subEntities?: SubEntitiesReferences<E>;
    private _orderOptions?: SortOptions<E>;
    private _groupOptions?: SortOptions<E>;

    /** Singular / plural reference names used in joins and queries. */
    public readonly aliases: EntityAliases;

    /** Per-attribute configuration: types, nullability, primary keys, etc. */
    public readonly attributesConfig: EntityConfigAttributes<E>;

    /** Attributes marked as primary keys in `attributesConfig`. */
    public readonly primaryKeys: Array<keyof E>;

    /** Every attribute key of `E`, in declaration order. */
    public readonly entityAttributesList: Array<keyof E>;

    /**
     * Base (non-relational) attribute keys — i.e. attributes whose
     * `associated` config is not `'outside'`.
     */
    public readonly baseAttributesList: Array<keyof EntityNoExternal<E>>;

    /** Subset of `baseAttributesList` whose `allowNull` is `true`. */
    public readonly baseAttributesListNullable: Array<keyof NullableFromObject<EntityNoExternal<E>>>;

    /** Base attributes whose type is `'number'` or `'decimal'`. */
    public readonly numberAttributesList: Array<keyof PickByType<E, number | Decimal>>;

    /** Base attributes whose type is `'date'`. */
    public readonly dateAttributesList: Array<keyof PickByType<E, Date>>;

    /** Base attributes whose type is `'boolean'`. */
    public readonly booleanAttributesList: Array<keyof PickByType<E, boolean>>;

    /**
     * Base attributes eligible for range queries (`_from` / `_to`
     * variants): `number`/`decimal` plus `date` attributes, excluding
     * `'outside'`-associated ones.
     */
    public readonly rangeAttributesList: Array<keyof PickByType<E, number | Date>>;

    /** String attributes flagged with `searchIn: true` for full-text search. */
    public readonly fullTextSearchAttributes: Array<keyof PickByType<E, string>>;

    /** Base attributes whose type is `'string'`. */
    public readonly stringAttributesList: Array<keyof PickByType<E, string>>;


    /**
     * @param config          Raw entity configuration (reference names +
     *                        per-attribute config).
     * @param lazySubEntities Callback that resolves related entities'
     *                        metadata. Invoked once on first access to
     *                        `subEntities`, then cached. Use this for
     *                        lazy / cyclic relation resolution.
     */
    constructor(
        config: EntityConfig<E>,
        private readonly lazySubEntities: () => SubEntitiesReferences<E>
    ) {

        const baseConfig = config.base
        const attributesList = Object.entries(config.attributes
            ) as [keyof EntityNoExternal<E>, EntityConfigAttributes<E>[keyof EntityNoExternal<E>]][];

        this.aliases = {
            singular: baseConfig.referenceNames.singularName,
            plural: baseConfig.referenceNames.pluralName
        }

        this.attributesConfig = config.attributes;

        this.primaryKeys = attributesList
            .filter((e) => !!e[1].primaryKey)
            .map(([key]) => key)

        this.entityAttributesList = attributesList.map(([key]) => key);

        this.baseAttributesList = attributesList
            .filter((e) => e[1].associated !== 'outside')
            .map(([key]) => key);

        this.baseAttributesListNullable = attributesList
            .filter((e): e is [keyof NullableFromObject<EntityNoExternal<E>>, EntityConfigAttributes<E>[keyof EntityNoExternal<E>]] =>
                !!e[1].allowNull)
            .map(([key]) => key)

        this.stringAttributesList = attributesList
            .filter((e): e is [keyof PickByType<EntityNoExternal<E>, string>, EntityConfigAttributes<E>[keyof EntityNoExternal<E>]] =>
                e[1].type === 'string')
            .map(([key]) => key);

        this.numberAttributesList = attributesList
            .filter((e): e is [keyof PickByType<EntityNoExternal<E>, number | Decimal>, EntityConfigAttributes<E>[keyof EntityNoExternal<E>]] =>
                e[1].type === 'number' || e[1].type === 'decimal')
            .map(([key]) => key);

        this.booleanAttributesList = attributesList
            .filter((e): e is [keyof PickByType<EntityNoExternal<E>, boolean>, EntityConfigAttributes<E>[keyof EntityNoExternal<E>]] =>
                e[1].type === 'boolean')
            .map(([key]) => key);

        this.dateAttributesList = attributesList
            .filter((e): e is [keyof PickByType<EntityNoExternal<E>, Date>, EntityConfigAttributes<E>[keyof EntityNoExternal<E>]] =>
                e[1].type === 'date')
            .map(([key]) => key);

        this.rangeAttributesList = attributesList
            .filter((e): e is [keyof PickByType<EntityNoExternal<E>, number | Date>, EntityConfigAttributes<E>[keyof EntityNoExternal<E>]] =>
                ['number', 'date', 'decimal'].includes(e[1].type) && e[1].associated !== 'outside'
            )
            .map(([key]) => key);
        this.fullTextSearchAttributes = attributesList
            .filter((e): e is [keyof PickByType<EntityNoExternal<E>, string>, EntityConfigAttributes<E>[keyof EntityNoExternal<E>]] =>
                !!e[1].searchIn)
            .map(([key]) => key);
    }

    /**
     * Related entities metadata. Lazy: resolved via the
     * `lazySubEntities` constructor callback on first access, then cached.
     */
    get subEntities() {
        if (!this._subEntities) {
            this._subEntities = this.lazySubEntities()
        }
        return this._subEntities
    }
    set subEntities(refer: SubEntitiesReferences<E>) {
        this._subEntities = refer
    }

    /**
     * Generated order-options tree for this entity and all nested
     * relations. Lazy: built via {@link generateOrderOptions} on first
     * access, then cached.
     */
    get orderOptions() {
        if (!this._orderOptions) {
            this._orderOptions = this.generateOrderOptions()
        }
        return this._orderOptions!
    }
    set orderOptions(refer: SortOptions<E>) {
        this._orderOptions = refer
    }

    /**
     * Generated group-options tree for this entity and all nested
     * relations. Lazy: built via {@link generateGroupOptions} on first
     * access, then cached.
     */
    get groupOptions() {
        if (!this._groupOptions) {
            this._groupOptions = this.generateGroupOptions()
        }
        return this._groupOptions!
    }
    set groupOptions(refer: SortOptions<E>) {
        this._groupOptions = refer
    }



    /**
     * Build the order-options tree for this entity and recurse into
     * every related entity.
     *
     * For each base attribute the following template keys are emitted:
     *  - `by <attr> asc`, `by <attr> desc`
     *  - `by <attr> asc nulls first|last` and the `desc` counterparts
     *    when `allowNull` is `true`
     *  - `by $<attr>_count asc|desc` for `COUNT`
     *  - `by $<attr>_sum|_avg|_min|_max asc|desc` for numeric attrs
     *    (`'number'` only — see `@remarks`)
     *  - `by $<attr>_min|_max asc|desc` for date attrs (see `@remarks`)
     *
     * The function then recurses into every sub-entity, attaching the
     * generated tree under `related[<relationKey>]`.
     *
     * @param included Stack of already-visited singular aliases. Used
     *                 internally to break cycles in cyclic relation
     *                 graphs. **Pass `undefined` on the first call**;
     *                 the function manages the stack itself.
     * @returns The generated {@link SortOptions}`<E>` tree, or
     *          `undefined` if a cycle was detected at this entity (the
     *          parent's `related[...]` entry is then skipped).
     *
     * @remarks
     * The current implementation contains two known issues that may
     * produce empty or incorrect options for certain attribute types:
     *
     * 1. The numeric-aggregate branch only runs for `'number'` typed
     *    attributes, but `decimal` and `text` columns could also
     *    legitimately support `SUM`/`AVG`/`MIN`/`MAX`.
     * 2. The date-aggregate branch gates on `'object'` instead of
     *    `'date'` (see source line ~164). As a result, no `MIN`/`MAX`
     *    options are generated for `'date'` attributes.
     *
     * @example
     * ```ts
     * // First call — no `included` stack
     * metadata.generateOrderOptions()
     * // => { sortType: 'order', options: {...}, fns: {...}, related: {...} }
     * ```
     */
    generateOrderOptions(included?: string[]) {
        if (included && included.some((a) => this.aliases.singular === a
            || this.aliases.plural === a)) return // prevent circular loading
        const include: string[] = included ? included : []
        include.push(this.aliases.singular)

        const orderObject = <SortOptions<E>>{
            sortType: 'order',
            fns: {},
            options: {},
            related: {}
        }

        for (const attribute of this.baseAttributesList) {
            // ASC and DESC options for all attributes
            orderObject['options'][`by ${String(attribute)} asc`] = { name: attribute, value: 'ASC' }
            orderObject['options'][`by ${String(attribute)} desc`] = { name: attribute, value: 'DESC' }

            // NULLS FIRST and NULLS LAST for nullable attributes
            if (this.attributesConfig[attribute]['allowNull']) {
                orderObject['options'][`by ${String(attribute)} asc nulls first`] = { name: attribute, value: 'ASC NULLS FIRST' }
                orderObject['options'][`by ${String(attribute)} asc nulls last`] = { name: attribute, value: 'ASC NULLS LAST' }
                orderObject['options'][`by ${String(attribute)} desc nulls first`] = { name: attribute, value: 'DESC NULLS FIRST' }
                orderObject['options'][`by ${String(attribute)} desc nulls last`] = { name: attribute, value: 'DESC NULLS LAST' }
            }

            // COUNT function for every base attribute
            orderObject['fns'][`by $${String(attribute)}_count asc`] = { name: attribute, value: 'ASC', fn: 'COUNT' }
            orderObject['fns'][`by $${String(attribute)}_count desc`] = { name: attribute, value: 'DESC', fn: 'COUNT' }

            // SUM / AVG / MIN / MAX — currently only for 'number' (see @remarks)
            if (this.attributesConfig[attribute]['type'] === 'number') {
                orderObject['fns'][`by $${String(attribute)}_sum asc`] = { name: attribute, value: 'ASC', fn: 'SUM' }
                orderObject['fns'][`by $${String(attribute)}_sum desc`] = { name: attribute, value: 'DESC', fn: 'SUM' }
                orderObject['fns'][`by $${String(attribute)}_avg asc`] = { name: attribute, value: 'ASC', fn: 'AVG' }
                orderObject['fns'][`by $${String(attribute)}_avg desc`] = { name: attribute, value: 'DESC', fn: 'AVG' }
                orderObject['fns'][`by $${String(attribute)}_min asc`] = { name: attribute, value: 'ASC', fn: 'MIN' }
                orderObject['fns'][`by $${String(attribute)}_min desc`] = { name: attribute, value: 'DESC', fn: 'MIN' }
                orderObject['fns'][`by $${String(attribute)}_max asc`] = { name: attribute, value: 'ASC', fn: 'MAX' }
                orderObject['fns'][`by $${String(attribute)}_max desc`] = { name: attribute, value: 'DESC', fn: 'MAX' }
            }

            // MIN / MAX — currently gates on 'object' instead of 'date' (see @remarks)
            if (this.attributesConfig[attribute]['type'] === 'object' && this.attributesConfig[attribute].associated !== 'outside') {
                orderObject['fns'][`by $${String(attribute)}_min asc`] = { name: attribute, value: 'ASC', fn: 'MIN' }
                orderObject['fns'][`by $${String(attribute)}_min desc`] = { name: attribute, value: 'DESC', fn: 'MIN' }
                orderObject['fns'][`by $${String(attribute)}_max asc`] = { name: attribute, value: 'ASC', fn: 'MAX' }
                orderObject['fns'][`by $${String(attribute)}_max desc`] = { name: attribute, value: 'DESC', fn: 'MAX' }
            }
        }

        // recurse into related entities, attaching each generated tree under `related[...]`
        for (const entity in this.subEntities) {
            const entityKey = entity as keyof SubEntitiesReferences<E>
            const generated = (this.subEntities[entityKey]['metadata'] as unknown as EntityMetadataManager<ExternalReferences<E>[typeof entityKey]>).generateOrderOptions(include)
            if (generated) {
                orderObject['related'][entityKey] = generated
            }

        }
        return orderObject
    }

    /**
     * Build the group-options tree for this entity and recurse into
     * every related entity.
     *
     * For each base attribute a single key `by <attr>` is emitted
     * (group options have no direction — `value` is intentionally
     * omitted, matching the {@link SortOptions} `sortType: 'group'`
     * variant).
     *
     * @param included Stack of already-visited singular aliases. Used
     *                 internally to break cycles. **Pass `undefined` on
     *                 the first call**.
     * @returns The generated {@link SortOptions}`<E>` tree, or
     *          `undefined` if a cycle was detected.
     *
     * @remarks
     * The current implementation contains a known duplication bug: the
     * same key `by <attr>` is written twice in the options map with
     * the same value `{ name: attribute }`. The second write is a
     * no-op at runtime but indicates an incomplete implementation —
     * `asc` / `desc` variants (or equivalent) were likely intended.
     */
    generateGroupOptions(included?: string[]) {
        if (included && included.some((a) => this.aliases.singular === a
            || this.aliases.plural === a)) return // prevent circular loading
        const include: string[] = included ? included : []
        include.push(this.aliases.singular)

        const groupObject = <SortOptions<E>>{
            sortType: 'group',
            fns: {},
            options: {},
            related: {}
        }

        for (const attribute of this.baseAttributesList) {

            // Single key per attribute (group options carry no direction)
            groupObject['options'][`by ${String(attribute)}`] = { name: attribute }

        }
        // recurse into related entities, attaching each generated tree under `related[...]`
        for (const entity in this.subEntities) {
            const entityKey = entity as keyof SubEntitiesReferences<E>
            const generated = (this.subEntities[entityKey]['metadata'] as unknown as EntityMetadataManager<ExternalReferences<E>[typeof entityKey]>).generateGroupOptions(include)
            if (generated) {
                groupObject['related'][entityKey] = generated
            }

        }
        return groupObject
    }
}
