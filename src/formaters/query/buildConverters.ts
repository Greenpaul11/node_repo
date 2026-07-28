import { EntityBase } from '../../types/entity/Root'
import { 
    QueryEntityAttributeTypes, 
    QueryEntityAttributeTypeTransform, ConvertersBuild, 
    QueryConverterConfig, QueryRangeAttributeTypeTransform,
    QueryRangeAttributeTypes,
    QueryAttributeTransform,
    QueryAttributes,
    QueryRelationTransform,
    QueryConvertObject,
    QueryEntityAttributeTransform,
    QueryRangeAttributeTransform} 
from '../../types/entity/Query'
import { PickByType } from '../../types/Global'
import { 
    validateString, validateNumber, validateDate, 
    validateBoolean, validateRangeDate, validateRangeNumber,
    validateSelect, validateOrder 
} from './validators'
import { EntityMetadata } from '../../types/entity/Metadata'


/**
 * Build a per-attribute query converter set for a single attribute type.
 *
 * Takes the type-keyed {@link ConvertersBuild} (one converter per
 * {@link QueryEntityAttributeTypes} entry) and produces a
 * {@link QueryEntityAttributeTypeTransform} where every attribute of the
 * given type has its converter bound to it, optionally wrapping the
 * converter with validator like eg. {@link validateString} when validation is enabled.
 *
 * Build steps:
 *  1. **Look up** the converter registered for `type` in
 *     `convertersBuild.baseAttributes`.
 *  2. **Iterate** over `attributes` — every entity field of this type.
 *  3. **Check** `config.validation.baseAttributes[type]` to decide whether
 *     to inject validator as the converter's `validate` argument.
 *  4. **Bind** each attribute to a `convert` function that calls the
 *     converter with (`value`, `attribute`, `converted`) and, when
 *     validation is on, passes validator as the fourth argument.
 *
 * @typeParam E - Entity whose attributes are being converted.
 * @typeParam F - The ORM-specific query output type (e.g. Sequelize
 *                `FindOptions`).
 * @typeParam K - The attribute-type key being processed (one of
 *                `'string'`, `'number'`, `'date'`, `'boolean'`).
 *
 * @param convertersBuild Type-keyed converter definitions produced by
 *                        the ORM layer {@link ConvertersBuild}.
 * @param config          Configuration object with a `validation` section
 *                        that controls whether the `validate` argument is
 *                        forwarded.
 * @param attributes      List of entity attribute names that belong to
 *                        the given `type` (e.g. `metadata.stringAttributesList`).
 * @param type            The attribute-type key used to index into
 *                        `convertersBuild.baseAttributes`.
 *
 * @returns A {@link QueryEntityAttributeTypeTransform}`<E, K, F>` with a
 *          `convert` function for each attribute. Each convert accepts
 *          (`value`, `attribute`, `converted`) and optionally applies
 *          validation before delegating to the layer's converter.
 *
 * @example
 * ```ts
 * const stringConverters = buildEntityAttributeConverters(
 *     sequelizeConvertersBuild,
 *     { validation: { baseAttributes: { string: true } } },
 *     metadata.stringAttributesList,
 *     'string'
 * )
 *
 * stringConverters.name.convert('John', 'name', findOptions)
 * ```
 */
export function buildEntityAttributeConverters<E extends EntityBase, F, K extends keyof QueryEntityAttributeTypes>(
    convertersBuild: ConvertersBuild<F>,
    config: QueryConverterConfig,
    attributes: Array<keyof PickByType<E, QueryEntityAttributeTypes[K]>>,
    type: K,
    nested: boolean = false
): QueryEntityAttributeTypeTransform<E, K, F> {
    const transform = {} as QueryEntityAttributeTypeTransform<E, K, F>
    const converter = convertersBuild['baseAttributes'][type]
    const validationOn = config.validation.baseAttributes[type]
    
    for (const attribute of attributes) {
        transform[attribute] = {
            convert: (value: unknown, converted: F) => validationOn 
                ? converter(value, converted, attribute, nested, assignFieldValidator(type))
                : converter(value, converted, attribute, nested)
        } 
    }
    
    return transform
}


/**
 * Build a per-attribute range query converter set for a single range type.
 *
 * For every range-capable attribute, produces two entries — `{attr}_from`
 * and `{attr}_to` — each with a converter bound to it. When validation is
 * enabled, the converter receives the range-specific validator (e.g.
 * {@link validateRangeNumber} or {@link validateRangeDate}) as its last
 * argument.
 *
 * Build steps:
 *  1. **Look up** the converter registered for `type` in
 *     `convertersBuild.rangeAttributes`.
 *  2. **Iterate** over `attributes` — every entity field of this type
 *     that is marked as `asRange: true`.
 *  3. **For each attribute**, generate two keys (`{field}_from`,
 *     `{field}_to`) and assign a `convert` function.
 *  4. **Check** `config.validation.rangeAttributes[type]` to decide whether
 *     to inject a range validator as the converter's extra argument.
 *  5. **Bind** each key to a `convert` function that calls the converter
 *     with (`value`, `converted`, ... ) and, when
 *     validation is on, passes the range validator as the extra argument.
 *
 * @typeParam E - Entity whose attributes are being converted.
 * @typeParam F - The ORM-specific query output type (e.g. Sequelize
 *                `FindOptions`).
 * @typeParam K - The range attribute-type key being processed (one of
 *                `'number'`, `'date'`).
 *
 * @param convertersBuild Type-keyed converter definitions produced by
 *                        the ORM layer {@link ConvertersBuild}.
 * @param config          Configuration object with a `validation` section
 *                        that controls whether the validator is forwarded.
 * @param attributes      List of entity attribute names that support range
 *                        queries for the given `type` (e.g. metadata.numberAttributesList).
 * @param type            The range attribute-type key used to index into
 *                        `convertersBuild.rangeAttributes` (e.g 'number', 'date').
 *
 * @returns A {@link QueryRangeAttributeTypeTransform}`<E, K, F>` with a
 *          `convert` function for each `{field}_from` / `{field}_to` key.
 *          Each convert accepts (`value`, `converted`) and optionally
 *          applies range validation before delegating to the layer's
 *          converter.
 *
 * @example
 * ```ts
 * const numberRangeConverters = buildRangeAttributeConverters(
 *     sequelizeConvertersBuild,
 *     { validation: { rangeAttributes: { number: true } } },
 *     metadata.numberAttributesList,
 *     'number'
 * )
 *
 * numberRangeConverters.price_from.convert(100, findOptions)
 * numberRangeConverters.price_to.convert(500, findOptions)
 * ```
 */
export function buildRangeAttributeConverters<E extends EntityBase, F, K extends keyof QueryRangeAttributeTypes>(
    convertersBuild: ConvertersBuild<F>,
    config: QueryConverterConfig,
    attributes: Array<keyof PickByType<E, QueryRangeAttributeTypes[K]>>,
    type: K,
    nested: boolean = false
): QueryRangeAttributeTypeTransform<E, K, F> {
    const transform = {} as QueryRangeAttributeTypeTransform<E, K, F>
    const converter = convertersBuild['rangeAttributes'][type]
    const validationOn = config.validation.rangeAttributes[type]
    
    for (const attribute of attributes) {
        for (const suffix of ['_from', '_to'] as const) {
            const key = `${String(attribute)}${suffix}` as keyof QueryRangeAttributeTypeTransform<E, K, F>
            transform[key] = {
                convert: ( value: unknown, converted: F) => validationOn 
                    ? converter(value, converted, suffix, attribute, nested, assignRangeValidator(type))
                    : converter(value, converted, suffix, attribute, nested)
            } 
        }
    }
    
    return transform
}

/**
 * Build converter set for query-level attributes (e.g. `select`).
 *
 * Currently only handles the `select` attribute. Looks up the converter
 * registered for `'select'` in `convertersBuild.queryAttributes` and,
 * when validation is enabled, wraps it with a validator (e.g.
 * {@link validateSelect}).
 *
 * Build steps:
 *  1. **Look up** the converter registered for `'select'` in
 *     `convertersBuild.queryAttributes`.
 *  2. **Check** `config.validation.queryAttributes.select` to decide
 *     whether to inject the validator.
 *  3. **Bind** the `select` key to a `convert` function that calls the
 *     converter with (`value`, `converted`, `metadata`, `nested`) and,
 *     when validation is on, passes the validator as the last argument.
 *
 * @typeParam E - Entity whose query attributes are being converted.
 * @typeParam F - The ORM-specific query output type (e.g. Sequelize
 *                `FindOptions`).
 *
 * @param convertersBuild Type-keyed converter definitions produced by
 *                        the ORM layer {@link ConvertersBuild}.
 * @param config          Configuration object with a `validation` section
 *                        that controls whether the validator is forwarded.
 * @param metadata        Entity metadata used to resolve attribute lists
 *                        during select conversion.
 * @param nested          Whether this converter is being built for a
 *                        nested (relation) context. When `true`, aggregate
 *                        functions inside select arrays are disallowed.
 *
 * @returns A {@link QueryAttributeTransform}`<F>` with a `convert`
 *          function for the `select` key. The convert accepts
 *          (`value`, `converted`) and optionally applies validation
 *          before delegating to the layer's converter.
 *
 * @example
 * ```ts
 * const queryConverters = buildQueryAttributeConverters(
 *     sequelizeConvertersBuild,
 *     { validation: { queryAttributes: { select: true } } },
 *     metadata
 * )
 *
 * queryConverters.select.convert(['id', 'brand'], findOptions)
 * ```
 */
export function buildQueryAttributeConverters<E extends EntityBase, F>(
    convertersBuild: ConvertersBuild<F>,
    config: QueryConverterConfig,
    metadata: EntityMetadata<E>,
    nested: boolean = false
): QueryAttributeTransform<F> {
    const transform = {} as QueryAttributeTransform<F>
    const validation = config.validation.queryAttributes
    let validationOn: boolean

    // create select converter
    const converterSelect = convertersBuild['queryAttributes']['select']
    validationOn = validation['select']
    transform['select'] = {
        convert: (value: unknown, converted: F) => validationOn
            ? converterSelect(value, converted, metadata, nested, assignQueryValidator('select'))
            : converterSelect(value, converted, metadata, nested)
    }

    // create order converter
    const converterOrder = convertersBuild['queryAttributes']['order']
    validationOn = validation['order']
    const orderOptions = metadata.orderOptions
    transform['order'] = {
        convert: (value: unknown, converted: F) => validationOn
            ? converterOrder(value, converted, orderOptions, nested, assignQueryValidator('order'))
            : converterOrder(value, converted, orderOptions, nested)
    }
    
    return transform
}

/**
 * Build converter set for relation (sub-entity) attributes.
 *
 * Iterates over every sub-entity defined in the entity metadata and
 * recursively builds a full {@link QueryConvertObject} for each one.
 * Recursion is bounded by `config.subEntityRelationDepth` — when
 * `depth` exceeds the configured limit the function returns an empty
 * transform so no further relations are processed.
 *
 * Build steps:
 *  1. **Check** `config.subEntityRelationDepth` against `depth`. If the
 *     limit is reached, return an empty transform immediately.
 *  2. **Look up** the sub-entity map from `metadata.subEntities`.
 *     If none exist, return an empty transform.
 *  3. **Look up** the relation converter from
 *     `convertersBuild.relationAttributes.relations`.
 *  4. **For each sub-entity**, recursively call
 *     {@link queryConvertObjectFactory} with `depth + 1` to produce its
 *     `queryConvertObject`, then bind a `convert` function that
 *     delegates to the relation converter with
 *     (`value`, `converted`, `key`, `queryConvertObject`).
 *
 * @typeParam E - Entity whose relation attributes are being converted.
 * @typeParam F - The ORM-specific query output type (e.g. Sequelize
 *                `FindOptions`).
 *
 * @param convertersBuild Type-keyed converter definitions produced by
 *                        the ORM layer {@link ConvertersBuild}.
 * @param config          Configuration object with a `validation` section
 *                        and a `subEntityRelationDepth` limit.
 * @param metadata        Entity metadata containing the sub-entity map.
 * @param depth           Current recursion depth. Starts at `0` at the
 *                        root entity and increments by one per nested
 *                        level.
 *
 * @returns A {@link QueryRelationTransform}`<E, F>` with a `convert`
 *          function and a nested `queryConvertObject` for each
 *          sub-entity. When the depth limit is exceeded or no
 *          sub-entities exist, an empty object is returned.
 *
 * @example
 * ```ts
 * const relationConverters = buildRelationAttributeConverters(
 *     sequelizeConvertersBuild,
 *     { subEntityRelationDepth: 3, validation: { ... } },
 *     productMetadata,
 *     0
 * )
 *
 * relationConverters.prices.convert({ active: true }, findOptions)
 * ```
 */
export function buildRelationAttributeConverters<E extends EntityBase, F>(
    convertersBuild: ConvertersBuild<F>,
    config: QueryConverterConfig,
    metadata: EntityMetadata<E>,
    depth: number 
): QueryRelationTransform<E, F>{
    const transform = {} as QueryRelationTransform<E, F>
    
    // limit recursion depth
    if (config.subEntityRelationDepth < depth) {
        return transform
    }
    
    const subEntities = metadata.subEntities

    if (!subEntities) {
        return transform
    }
    const converter = convertersBuild['relationAttributes']['relations']

    for (const key in subEntities) {
        const subMetadata = subEntities[key].metadata
        const relationDepth = depth
        const queryConvertObject = queryConvertObjectFactory(convertersBuild, config, subMetadata, relationDepth)
        transform[key] = {
            queryConvertObject: queryConvertObject,
            convert: (value: unknown, converted: F) => converter(value, converted, key, queryConvertObject)
        }
    }

    return transform
}

/**
 * Assemble a complete {@link QueryConvertObject} for a given entity.
 *
 * Composes the four converter groups — base attributes, range attributes,
 * query attributes, and relation attributes — into a single flat object.
 * The `nested` flag is derived from `depth`: when `depth > 0` the
 * converters are built in nested mode, which disables aggregate functions
 * inside select arrays for that level.
 *
 * Build steps:
 *  1. **Determine** whether this level is nested (`depth > 0`).
 *  2. **Build** `baseAttributes` by calling
 *     {@link buildEntityAttributeConverters} for `'string'`, `'number'`,
 *     `'date'`, and `'boolean'` attribute types.
 *  3. **Build** `rangeAttributes` by calling
 *     {@link buildRangeAttributeConverters} for `'number'` and `'date'`
 *     range types.
 *  4. **Build** `queryAttributes` by calling
 *     {@link buildQueryAttributeConverters} for query-level attributes
 *     (e.g. `select`).
 *  5. **Build** `relationAttributes` by calling
 *     {@link buildRelationAttributeConverters} with `depth + 1` to
 *     recurse into sub-entities.
 *  6. **Merge** all four groups into a single object and return it.
 *
 * @typeParam E - Entity whose query converters are being assembled.
 * @typeParam F - The ORM-specific query output type (e.g. Sequelize
 *                `FindOptions`).
 *
 * @param convertersBuild Type-keyed converter definitions produced by
 *                        the ORM layer {@link ConvertersBuild}.
 * @param config          Configuration object controlling validation and
 *                        relation depth limits.
 * @param metadata        Entity metadata used to resolve attribute lists
 *                        and sub-entity maps.
 * @param depth           Current recursion depth. Starts at `0` for the
 *                        root entity; each nested relation increments by
 *                        one. Used to derive the `nested` flag and to
 *                        enforce relation depth limits.
 *
 * @returns A fully populated {@link QueryConvertObject}`<E, F>` with
 *          `convert` functions for every queryable attribute, range
 *          key, select option, and relation of the entity.
 *
 * @example
 * ```ts
 * const convertObject = queryConvertObjectFactory(
 *     sequelizeConvertersBuild,
 *     { validation: { ... }, subEntityRelationDepth: 5 },
 *     productMetadata
 * )
 *
 * convertObject.brand.convert('Apple', findOptions)
 * convertObject.price_from.convert(100, findOptions)
 * convertObject.select.convert(['id'], findOptions)
 * convertObject.prices.convert({ active: true }, findOptions)
 * ```
 */
export function queryConvertObjectFactory<E extends EntityBase, F>(
    convertersBuild: ConvertersBuild<F>, 
    config: QueryConverterConfig,
    metadata: EntityMetadata<E>,
    depth: number = 0
): QueryConvertObject<E, F> {
    const nested = depth > 0 ? true : false
    
    const baseAttributes: QueryEntityAttributeTransform<E, F> = {
        ...buildEntityAttributeConverters(convertersBuild, config, metadata.stringAttributesList, 'string', nested),
        ...buildEntityAttributeConverters(convertersBuild, config, metadata.numberAttributesList, 'number', nested),
        ...buildEntityAttributeConverters(convertersBuild, config, metadata.dateAttributesList, 'date', nested),
        ...buildEntityAttributeConverters(convertersBuild, config, metadata.booleanAttributesList, 'boolean', nested),
    }
    const rangeAttributes: QueryRangeAttributeTransform<E, F> = {
        ...buildRangeAttributeConverters(convertersBuild, config, metadata.numberAttributesList, 'number', nested),
        ...buildRangeAttributeConverters(convertersBuild, config, metadata.dateAttributesList, 'date', nested)
    }
    const queryAttributes: QueryAttributeTransform<F> = {
        ...buildQueryAttributeConverters(convertersBuild, config, metadata, nested)
    }
    const relationAttributes: QueryRelationTransform<E, F> = {
        ...buildRelationAttributeConverters(convertersBuild, config, metadata, depth + 1)
    } 
    
    return {
        ...baseAttributes,
        ...rangeAttributes,
        ...queryAttributes,
        ...relationAttributes
    }
}

/**
 * Assign proper validation function to baseAttributes converter.
 * @param type keyof {@link QueryEntityAttributeTypes}
 * @returns validation function
 */
function assignFieldValidator<K extends keyof QueryEntityAttributeTypes>(type: K) {
    switch (type) {
        case 'string': 
            return validateString
        case 'number':
            return validateNumber
        case 'date':
            return validateDate
        case 'boolean':
            return validateBoolean
        default: 
            throw new Error('Type value is not assignable!')
    }    
}

/**
 * Assign proper validation function to range converter.
 * @param type keyof {@link QueryRangeAttributeTypes}
 * @returns validation function
 */
function assignRangeValidator<K extends keyof QueryRangeAttributeTypes>(type: K) {
    switch (type) {
        case 'number':
            return validateRangeNumber
        case 'date':
            return validateRangeDate
        default: 
            throw new Error('Type value is not assignable!')
    }    
}

/**
 * Assign proper validation function to query attribute converter.
 * @param type keyof {@link QueryAttributes}
 * @returns validation function
 */
function assignQueryValidator(type: 'select'): typeof validateSelect
function assignQueryValidator(type: 'order'): typeof validateOrder
function assignQueryValidator(type: string) {
    switch (type) {
        case 'select':
            return validateSelect
        case 'order':
            return validateOrder
        default: 
            throw new Error('Type value is not assignable!')
    }    
}