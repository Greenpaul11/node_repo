import { EntityBase, ExternalReferences, EntityExtend } from '../../types/entity/Root'
import {
    AggregateAttributesTransform,
    ConverterFunctionsInfer,
    EntityTransform,
    EntityTransformRules
} from '../../types/entity/Converters'
import {
    MapEntitySelect,
    QueryFunctions,
    EntityAggregateAttributes
} from '../../types/entity/Query'


/**
 * Convert a transformed row into a fully typed entity.
 *
 * Takes a row that has already been transformed at the type level via
 * {@link EntityTransform} and walks it attribute-by-attribute, applying
 * the matching converter from `converters` and recursing into nested
 * relations. The result is the entity in its **domain / origin** type
 * representation (e.g. `Date` instead of `string`, `Decimal` instead of
 * `number`, etc.).
 *
 * The function has two call shapes:
 *
 *  - **Initial call** (`nested` omitted or `undefined`) — returns the
 *    full entity, optionally extended with
 *    {@link EntityAggregateAttributes} computed from `converters.fns`.
 *  - **Recursive call** (`nested: true`) — returns just the converted
 *    sub-entity for a relation, without aggregate function attributes.
 *
 * Conversion steps performed:
 *  1. Every base attribute listed in `mappedSelect.select` is looked up
 *     in `converters.baseAttributes` and converted when a converter
 *     exists.
 *  2. Each relation key in `mappedSelect.subEntities` is recursively
 *     converted. One-to-many relations (`Array.isArray(subRows)`) are
 *     mapped element-by-element; one-to-one relations are converted
 *     directly or left as `null`if missing).
 *  3. Only on the initial call: each entry in `mappedSelect.fns` is
 *     converted via `converters.fns` and attached to the result under
 *     its canonical key (see {@link extractFnToString}).
 *
 * @typeParam E - The typed entity shape being produced.
 * @typeParam T - The transformation rules driving the input row's
 *                type-level shape.
 *
 * @param row          The transformed row (or sub-row) from the ORM layer.
 * @param mappedSelect Select map produced by {@link entitySelectToMapSelect}.
 *                     Only attributes / relations / aggregates listed
 *                     here are converted.
 * @param converters   Attribute converters (base + relations + aggregate)
 *                     produced by `buildConverters`.
 * @param nested       `true` when called recursively from itself for a
 *                     related entity. Suppresses aggregate-function
 *                     conversion, which is only valid at the root.
 *
 * @returns On the initial call: an {@link EntityExtend} of `E` and
 *          {@link EntityAggregateAttributes}`<E>`. On a recursive call:
 *          the converted sub-entity (`E[keyof ExternalReferences<E>]`).
 *
 * @example
 * ```ts
 * // Initial call — convert a root row with a relation and an aggregate
 * const entity = convertRow<Product, T>(row, mappedSelect, converters)
 * // => Product & { $count_prices?: number, $sum_prices_price?: Decimal }
 *
 * // Recursive call — convert a single related row (no aggregates)
 * const subEntity = convertRow<Price, T>(subRow, subSelect, subConverters, true)
 * // => Price
 * ```
 */
export function convertRow<E extends EntityBase, T extends EntityTransformRules>(
    row: EntityTransform<E, T>, mappedSelect: MapEntitySelect<E>, converters: ConverterFunctionsInfer<E>,
): EntityExtend<E, EntityAggregateAttributes<E>>
export function convertRow<E extends EntityBase, T extends EntityTransformRules>(
    row: EntityTransform<E, T>, mappedSelect: MapEntitySelect<E>, converters: ConverterFunctionsInfer<E>,
    nested: true
): E[keyof ExternalReferences<E>]
export function convertRow<E extends EntityBase, T extends EntityTransformRules>(
    row: EntityTransform<E, T>, mappedSelect: MapEntitySelect<E>, converters: ConverterFunctionsInfer<E>,
    nested?: true
): EntityExtend<E, EntityAggregateAttributes<E>> | E[keyof ExternalReferences<E>] {
    const { select, fns, subEntities } = mappedSelect
    const converted = row as E

    // 1. Convert base attributes
    for (const attribute of select) {
        const converter = converters.baseAttributes[attribute]
        if (converter) {
            converted[attribute] = converter(row[attribute])
        }
    }

    // 2. Recursively convert relations
    if (subEntities) {
        const subEntitiesList = Object.keys(subEntities) as Array<keyof typeof subEntities>
        for (const subEntity of subEntitiesList) {
            const subConverters = converters.subEntities[subEntity]
            if (subConverters) {
                const subRows = row[subEntity] as EntityTransform<
                    ExternalReferences<E>[keyof ExternalReferences<E>], T
                >
                const subSelect = subEntities[subEntity]!

                // One-to-many relation — map each sub-row
                if (Array.isArray(subRows)) {
                    const toMany: unknown[] = []
                    for (const subRow of subRows) {
                        toMany.push(convertRow(subRow, subSelect, subConverters, true))
                    }
                    converted[subEntity] = toMany as E[keyof ExternalReferences<E>]
                // One-to-one relation — convert a single sub-row (may be null)
                } else {
                    converted[subEntity] = subRows
                        ? convertRow(subRows, subSelect, subConverters, true)
                        : subRows
                }
            }
        }
    }

    // Recursive calls return immediately — aggregates only apply at the root
    if (nested) return converted
    
    // 3. Convert aggregate function attributes (root level only)
    const convertedWithFns = converted as E & EntityAggregateAttributes<E>
    for (const fnTuple of fns!) {
        const fnName = fnTuple[0]
        const converter = converters.fns![fnName]
        if (converter) {
            const asKey = extractFnToString(fnTuple)
            const asFnKey = asKey as keyof EntityAggregateAttributes<E>
            const asTransformedFnKey = asKey as keyof AggregateAttributesTransform<E, T>
            convertedWithFns[asFnKey] = converter(row[asTransformedFnKey])
        }
    }
    
    return convertedWithFns
}


/**
 * Convert an aggregate-function {@link QueryFunctions} tuple into its
 * canonical string key.
 *
 * Aggregate function results are stored on the converted entity under a
 * string key (e.g. `$count_prices_price`). This helper produces that key
 * by joining the operator (`$count`, `$sum`, ...) with the dotted path
 * of its target field.
 *
 * The second element of `fnTuple` may be:
 *  - a **string** — a base attribute name; joined directly;
 *  - a **tuple** `[relation, ...]` — recursed into until the leaf field
 *    is reached, producing a nested path.
 *
 * @typeParam T - Tuple shape `[operator, target]` where `target` is
 *                either a string (leaf) or another such tuple.
 *
 * @param fnTuple - The aggregate-function tuple.
 *                  At depth 0: `[operator, baseAttribute | [relation, ...]]`.
 *                  At deeper levels: `[relationKey, ...]`.
 * @returns A normalized underscore-joined string used as the object key
 *          on the converted entity.
 *
 * @example
 * ```ts
 * extractFnToString(['$count', 'id'])                       // => "$count_id"
 * extractFnToString(['$sum', ['prices', 'price']])          // => "$sum_prices_price"
 * extractFnToString(['$avg', ['user', ['product', ['price']]]]) // => "$avg_user_product_price"
 * ```
 */
export function extractFnToString<T extends [string, unknown]>(fnTuple: T): string {
    const atIndexZero = fnTuple[0]
    const atIndexOne = fnTuple[1]
    if (typeof atIndexOne === 'string') {
        return `${atIndexZero}_${atIndexOne}`
    }
    const nested = atIndexOne as [string, unknown]
    return `${atIndexZero}_${extractFnToString(nested)}`
}
