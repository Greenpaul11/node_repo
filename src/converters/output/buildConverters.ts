import { EntityBase } from '../../types/entity/Root'
import {
    BaseAttributeConvertersInfer,
    ExternalConvertersInfer,
    ConverterFunctionsBuild,
    ConverterFunctionsInfer
} from '../../types/entity/Converters'
import { EntityMetadata } from '../../types/entity/Metadata'


/**
 * Build a complete set of attribute converters for an entity and its
 * nested relations.
 *
 * Takes the type-keyed {@link ConverterFunctionsBuild} (one function per
 * {@link AttributeTypes} entry, plus aggregate-function operators) and
 * the entity's {@link EntityMetadata}, and produces a
 * {@link ConverterFunctionsInfer} where every base attribute and every
 * relation attribute has its concrete converter function bound to it.
 *
 * Build steps:
 *  1. **Base attributes** — for every entry in
 *     `metadata.baseAttributesList`, look up the converter registered for
 *     that attribute's declared `type` in
 *     `converters.baseAttributes`. Attributes whose type has no
 *     registered converter are silently skipped (no entry is created).
 *  2. **Relations** — for every entry in `metadata.subEntities`, recurse
 *     into `buildConverters` with `depth + 1` so the related entity gets
 *     its own converter tree. Recursion is capped at depth 5 (inclusive)
 *     to bound the type-level expansion.
 *  3. **Aggregate functions** — only at depth `0` (the root entity), copy
 *     `converters.fns` into the result. Deeper levels never carry
 *     aggregate converters, since aggregate functions are valid only at
 *     the root of a query.
 *
 * @typeParam E - Entity whose metadata drives the converter set.
 *
 * @param metadata   Entity metadata providing `baseAttributesList`,
 *                   `attributesConfig`, and `subEntities`.
 * @param converters Type-keyed converter definitions (built once per
 *                   dialect) that get bound to specific attribute names
 *                   here.
 * @param depth      Current recursion depth. Defaults to `0` (root call).
 *                   Each sub-entity recursion increments this by one.
 *                   Hard-capped at `5` — deeper relations are skipped to
 *                   keep the type tree tractable.
 *
 * @returns A {@link ConverterFunctionsInfer}`<E>` with:
 *  - `baseAttributes` — converters keyed by attribute name;
 *  - `subEntities` — recursively built converters keyed by relation key;
 *  - `fns` — aggregate-function converters, included **only** at the
 *    root level.
 *
 * @example
 * ```ts
 * const converters = buildConverters(productMetadata, mysqlConverters)
 *
 * converters.baseAttributes.brand   // (v: string) => string
 * converters.subEntities.prices     // nested ConverterFunctionsInfer<Price>
 * converters.fns?.$count            // (v: number) => number  (root only)
 * ```
 */
export function buildConverters<E extends EntityBase>(
    metadata: EntityMetadata<E>,
    converters: ConverterFunctionsBuild,
    depth = 0
): ConverterFunctionsInfer<E> {
    // 1. Base attributes — bind each attribute's declared type to a converter
    const baseAttributes = {} as BaseAttributeConvertersInfer<E>

    for (const attribute of metadata.baseAttributesList) {
        const config = metadata.attributesConfig[attribute]
        const type = config.type
        const converter = converters.baseAttributes[type]

        if (!converter) continue

        baseAttributes[attribute] = converter
    }

    // 2. Relations — recurse for each sub-entity, capped at depth 5
    const subEntities = {} as ExternalConvertersInfer<E>

    if (depth < 5 && metadata.subEntities) {
        for (const key of Object.keys(metadata.subEntities)) {
            const entity = key as keyof typeof metadata.subEntities
            const subMeta = metadata.subEntities[entity].metadata
            subEntities[entity] = buildConverters(subMeta, converters, depth + 1)
        }
    }

    // 3. Aggregate functions — root level only
    if (depth === 0) {
        const fns = { ...converters.fns }
        return { baseAttributes, subEntities, fns }
    }

    return { baseAttributes, subEntities }
}
