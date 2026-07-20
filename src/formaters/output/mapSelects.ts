import { EntityBase, EntityNoExternal } from '../../types/entity/Root'
import { MapEntitySelect, SubMapSelect, Query, QuerySelect, QueryFunctions } from '../../types/entity/Query'
import { EntityRelationTree } from '../../types/entity/Metadata'


/**
 * Normalize a {@link QuerySelect} into a {@link MapEntitySelect}.
 *
 * A `QuerySelect` can take three shapes — an array of attribute names
 * (optionally mixed with aggregate function tuples), an `exclude` object,
 * or be left undefined. This function collapses all three into a uniform
 * `{ select, fns? }` shape that downstream consumers (formatters, ORM
 * adapters) can process without additional branching.
 *
 * @typeParam E - Entity whose attributes drive the selection.
 *
 * @param querySelect - The raw select definition. May be:
 *   - an **array** of base attribute keys, optionally mixed with
 *     {@link QueryFunctions} tuples (e.g. `['id', ['$count', '*']]`);
 *   - an **object** `{ exclude: [...] }` listing base attribute keys to
 *     omit (the complement of the array form);
 *   - **undefined**, treated as "select every base attribute".
 * @param baseAttributes - The full list of selectable base attributes for
 *   the entity. Used to:
 *      (a) recognize which array items are base attributes vs. aggregate tuples 
 *      (b) compute the final `select` array when `querySelect` 
 *          is `undefined` or uses the `exclude` form.
 * @param nested - When `true`, aggregate functions are excluded from the
 *   result. Used when this function is called recursively from
 *   {@link mapNestedSelects}, because aggregate functions are only valid
 *   at the root level of a query.
 *
 * @returns A normalized {@link MapEntitySelect} containing:
 *   - `select` — the resolved list of base attribute keys;
 *   - `fns` — extracted {@link QueryFunctions}, present only when
 *     `nested` is not set (i.e. at the root level).
 *
 * @example
 * ```ts
 * // Array form — mix of base attributes and aggregates
 * entitySelectToMapSelect(['id', 'name', ['$count', '*']], ['id', 'name', 'created'])
 * // => { select: ['id', 'name'], fns: [['$count', '*']] }
 *
 * // Exclude form
 * entitySelectToMapSelect({ exclude: ['password'] }, ['id', 'name', 'password'])
 * // => { select: ['id', 'name'], fns: [] }
 *
 * // Undefined — selects everything
 * entitySelectToMapSelect(undefined, ['id', 'name'])
 * // => { select: ['id', 'name'], fns: [] }
 *
 * // Nested call — suppresses fns
 * entitySelectToMapSelect(['id'], ['id'], true)
 * // => { select: ['id'] }
 * ```
 */
export function entitySelectToMapSelect<E extends EntityBase>(
    querySelect: QuerySelect<E> | undefined,
    baseAttributes: Array<keyof EntityNoExternal<E>>,
    nested?: true
): MapEntitySelect<E> {

    const selectQuery = querySelect ?? []
    const select: Array<keyof EntityNoExternal<E>> = []
    const fns: QueryFunctions<E>[] = []

    if (Array.isArray(selectQuery)) {
        // SELECT: ['id', 'name', [$count, 'price']]
        for (let i = 0; i < selectQuery.length; i++) {
            const item = selectQuery[i]
            // check if is baseAttribute(it can be an external one)
            const isBaseAttribute = baseAttributes.includes(item as keyof EntityNoExternal<E>)
            if (isBaseAttribute) { // is base attribute
                select.push(item as keyof EntityNoExternal<E>)
            } else if (!nested && Array.isArray(item)) { // is aggregate function
                fns.push(item)
            }
        }
    } else if (typeof selectQuery === 'object') {
        // SELECT: { exclude: [...] }
        const excluded: Array<keyof EntityNoExternal<E>> = [];
        const exclude = selectQuery.exclude

        for (let i = 0; i < exclude.length; i++) {
            const item = exclude[i]
            const isBase = baseAttributes.includes(item as keyof EntityNoExternal<E>);
            if (isBase) {
                excluded.push(item as keyof EntityNoExternal<E>);
            } else if (!nested && typeof item === "object") {
                fns.push(item);
            }
        }

        // get attributes that are not excluded
        for (let i = 0; i < baseAttributes.length; i++) {
            const attribute = baseAttributes[i]
            if (!excluded.includes(attribute)) {
                select.push(attribute)
            }
        }
    }
    return nested
        ? { select }
        : { select, fns }
}


/**
 * Recursively map select definitions for every related entity in a query.
 *
 * Walks the relation tree, and for each relation key present in the
 * {@link Query}, delegates to {@link entitySelectToMapSelect} (with
 * `nested = true` to suppress aggregates) and recurses into the
 * relation's own sub-entities.
 *
 * @typeParam E - Entity whose relations are being mapped.
 *
 * @param query - {@link Query} for the current entity `E`. Each key
 *   corresponding to a related entity may carry its own `select` and
 *   nested sub-queries.
 * @param tree - The {@link EntityRelationTree} for `E`. Each branch
 *   exposes:
 *   - `baseAttributes` — selectable base attributes of the related
 *     entity;
 *   - `getSubEntities()` — function returning the deeper relation
 *     branches for further recursion.
 *
 * @returns Either:
 *   - `{ subEntities: ... }` — a {@link SubMapSelect}-shaped object
 *     containing one entry per relation that appears in `query`; or
 *   - `{}` — when the query is `undefined`, the tree is empty, or no
 *     relation in the tree is referenced by the query.
 *
 * @example
 * ```ts
 * // Tree has relations `prices` and `specification_tree`, but query only asks for `prices`.
 * mapNestedSelects(
 *   { prices: { select: ['id', 'price'] } },
 *   { prices: branchA, specification_tree: branchB }
 * )
 * // => { subEntities: { prices: { select: ['id', 'price'] } } }
 *
 * // Empty tree or empty query
 * mapNestedSelects(undefined, {})
 * // => {}
 * ```
 */
export function mapNestedSelects<E extends EntityBase>(
    query: Query<E> | undefined,
    tree: EntityRelationTree<E>
): { subEntities: SubMapSelect<E> } | {} {
    const subEntities = {} as SubMapSelect<E>
    if (!query) return subEntities
    const subEntitiesKeys = Object.keys(tree) as Array<keyof typeof tree>
    if (!subEntitiesKeys.length) return subEntities
    for (const entityKey of subEntitiesKeys) {
        const subQuery = query[entityKey]
        if (!subQuery) continue
        
        const branch = tree[entityKey]
        if (!branch) continue

        const deepEntites = branch.getSubEntities()
        const mapped = entitySelectToMapSelect(subQuery['select'], branch.baseAttributes, true)
        const nested = mapNestedSelects(subQuery, deepEntites)
        subEntities[entityKey] = {
            ...mapped,
            ...nested
        }
    }
    if (!Object.keys(subEntities).length) {
        return {}
    }
    return { subEntities: subEntities }
}
