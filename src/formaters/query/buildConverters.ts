import { EntityBase } from '../../types/entity/Root'
import { Query, EntityQueryable, QueryEntityAttributeTypes, 
    QueryEntityAttributeTypeTransform, ConvertersBuild, 
    QueryFormaterBaseConfig, QueryRangeAttributeTypeTransform,
    QueryRangeAttributeTypes, EntityQueryRangeAttributes} from '../../types/entity/Query'
import { PickByType } from '../../types/Global'
import { validateString, validateNumber, validateDate, validateBoolean, validateRangeDate, validateRangeNumber } from './validators'


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
    convertersBuild: ConvertersBuild<E, F>,
    config: QueryFormaterBaseConfig,
    attributes: Array<keyof PickByType<E, QueryEntityAttributeTypes[K]>>,
    type: K,
): QueryEntityAttributeTypeTransform<E, K, F> {
    const transform = {} as QueryEntityAttributeTypeTransform<E, K, F>
    const converter = convertersBuild['baseAttributes'][type]
    const validationOn = config.validation.baseAttributes[type]
    
    for (const attribute of attributes) {
        transform[attribute] = {
            convert: <K extends keyof EntityQueryable<E>>(value: unknown, converted: F) => validationOn 
                ? converter(value, converted, attribute as K, assignFieldValidator(type))
                : converter(value, converted, attribute as K)
        } 
    }
    return transform
}


export function buildRangeAttributeConverters<E extends EntityBase, F, K extends keyof QueryRangeAttributeTypes>(
    convertersBuild: ConvertersBuild<E, F>,
    config: QueryFormaterBaseConfig,
    attributes: Array<keyof PickByType<E, QueryRangeAttributeTypes[K]>>,
    type: K,
): QueryRangeAttributeTypeTransform<E, K, F> {
    const transform = {} as QueryRangeAttributeTypeTransform<E, K, F>
    const converter = convertersBuild['rangeAttributes'][type]
    const validationOn = config.validation.rangeAttributes[type]
    
    for (const attribute of attributes) {
        for (const suffix of ['_from', '_to'] as const) {
            const key = `${String(attribute)}${suffix}` as keyof QueryRangeAttributeTypeTransform<E, K, F>
            transform[key] = {
                convert: ( value: unknown, converted: F) => validationOn 
                    ? converter(value, converted, suffix, attribute, assignRangeValidator(type))
                    : converter(value, converted, suffix, attribute )
            } 
        }
    }
    return transform
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