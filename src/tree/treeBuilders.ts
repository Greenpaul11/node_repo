import { EntityBase } from '../types/entity/Root'
import { EntityMetadata, EntityRelationTree } from '../types/entity/Metadata'


/**
 * Build an {@link EntityRelationTree} from entity metadata.
 *
 * Walks `metadata.subEntities` and produces, for every relation key, a
 * node carrying:
 *  - the relation type (`one to one`, `one to many`, ...);
 *  - the related entity's selectable base attribute lists;
 *  - a **lazy** `getSubEntities()` callback that builds the deeper
 *    relation tree on demand.
 *
 * The lazy callback is what makes this function safe for cyclic
 * relation graphs: deeper branches are not materialized at construction
 * time, so a relation that points back to an ancestor does not cause
 * infinite recursion. Each call to `getSubEntities()` runs
 * `createRelationTree` on the related entity's metadata, returning a
 * fresh tree (no caching at this layer).
 *
 * @typeParam E - Entity whose relation tree is being built. Must extend
 *                {@link EntityBase}.
 *
 * @param metadata Entity metadata providing `subEntities` (the
 *                 related-entity references). When `subEntities` is
 *                 `undefined`, an empty tree is returned.
 *
 * @returns An {@link EntityRelationTree}`<E>` — one entry per
 *          relation key found in `metadata.subEntities`. Each entry's
 *          `getSubEntities()` resolves its own sub-tree on demand.
 *
 * @example
 * ```ts
 * // Tree for a Product that has many Prices and one SpecificationTree
 * const tree = createRelationTree(productMetadata)
 *
 * tree.prices.relation                  // => 'one to many'
 * tree.prices.baseAttributes            // => ['id', 'price', 'currency']
 * tree.prices.getSubEntities()          // recurse into Price's relations
 *
 * // Tree for an entity with no relations
 * createRelationTree(leafMetadata)
 * // => {}
 * ```
 */
export function createRelationTree<E extends EntityBase>(
    metadata: EntityMetadata<E>
): EntityRelationTree<E> {
    const subEntities = metadata.subEntities
    const tree = <EntityRelationTree<E>>{}
    if (!subEntities) return tree

    const subEntitiesKeys = Object.keys(subEntities) as Array<keyof typeof subEntities>
    for (const entityKey of subEntitiesKeys) {
        const subReference = subEntities[entityKey]
        tree[entityKey] = {
            relation: subReference.relation,
            baseAttributes: subReference.metadata.baseAttributesList,
            baseAttributesNullable: subReference.metadata.baseAttributesListNullable,
            getSubEntities: () => createRelationTree(subReference.metadata)
        }
    }
    return tree
}
