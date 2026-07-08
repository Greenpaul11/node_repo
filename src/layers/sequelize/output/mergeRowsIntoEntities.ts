import { EntityBase, EntityNoExternal, ExternalReferences } from '../../../types/entity/Root';
import { MapEntitySelect, SubMapSelect} from '../../../types/entity/Query';
import { EntityRelationTree } from '../../../types/entity/Metadata';
import { SequelizeRawEntityNotGrouped, SequelizeRawEntity } from '../types'


/**
 * Compare entity('row') attributes(without external references) to the 
 * accumulator(row) attributes or its items(rows) attributes. If entity is unique return true.
 */ 
export function entityRowIsUnique<E extends EntityBase>(
    select: MapEntitySelect<E>['select'],
    row: SequelizeRawEntityNotGrouped<E> | null,
    accumulator: SequelizeRawEntity<E> | null | SequelizeRawEntity<E>[]
): boolean {
    // normalize accumulator to array
    const accArray = accumulator
        ? Array.isArray(accumulator) ? accumulator : [accumulator]
        : []

    // case: row is null
    if (!row) {
        // row=null & accumulator empty -> not unique
        if (accArray.length === 0) return false;
        // row=null & accumulator has items -> unique
        return true;
    }

    // case: row is object & accumulator empty -> unique
    if (accArray.length === 0) return true;

    // compare row against each accumulator item
    for (const acc of accArray) {
        let allMatch = true;

        for (const attribute of select) {
            if (toComparable(row[attribute]) !== toComparable(acc[attribute])) {
                allMatch = false;
                break;
            }
        }

        if (allMatch) return false // duplicate found
    }

    return true // no duplicates
}


function toComparable(value: any) {
    if (value instanceof Date) {
        return value.toISOString();
    }
    // return primitives (number, string, boolean, etc.) as-is
    return value;
}


/**
 * Transform row object to the one where its related entity attribute is
 * converted from object type to array type - only if relation is 'many to one'.
 * @param mapSelect selected attributes {@link MapEntitySelect}
 * @param tree keeps information about relation type to parent entity of related entities
 * @param row object to convert
 * @param nullableSelect base attributes of entity that can be a type of null
 * @returns SequelizeRawEntity
 */
export function rowToGrouped<E extends EntityBase>(
    mapSelect: MapEntitySelect<E>,
    tree: EntityRelationTree<E>,
    row: SequelizeRawEntityNotGrouped<E>
): SequelizeRawEntity<E>;
export function rowToGrouped<E extends EntityBase>(
    mapSelect: MapEntitySelect<E>,
    tree: EntityRelationTree<E>,
    row: SequelizeRawEntityNotGrouped<E>,
    nullableSelect: Array<keyof EntityNoExternal<E>>
): SequelizeRawEntity<E> | null;
export function rowToGrouped<E extends EntityBase>(
    mapSelect: MapEntitySelect<E>, 
    tree: EntityRelationTree<E>, 
    row: SequelizeRawEntityNotGrouped<E> , 
    nullableSelect?: Array<keyof EntityNoExternal<E>>
): SequelizeRawEntity<E> | null {
    const grouped = <SequelizeRawEntity<E>>{} 
    const { select, fns, subEntities } = mapSelect
    
    // handle attributes of the current entity
    for (let i = 0; i < select.length; i++) {
        const attribute = select[i];
        const value = row[attribute];

        // fix Sequelize LEFT JOIN null-expansion
        if (nullableSelect && value === null && !nullableSelect.includes(attribute)) {
            return null;
        }

        grouped[attribute] = value as SequelizeRawEntity<E>[typeof attribute];
    }

    if (!subEntities) return grouped
    // handle nested relations
    const subKeys = Object.keys(subEntities) as Array<keyof typeof subEntities>
    for (let i = 0; i < subKeys.length; i++) {
        const key = subKeys[i]
        const subSelects = mapSelect['subEntities']![key]!
        const subTree = tree[key].getSubEntities()
        const subRow = row[key] 
        const nullable = tree[key].baseAttributesNullable 

        // group row
        const subRowGrouped = subRow ? rowToGrouped(subSelects, subTree, subRow, nullable) : null
        // pack related as 'many' into array
        if (tree[key]!['relation'] === 'one to many' || tree[key]!['relation'] === 'many to many') {
            grouped[key] = (subRowGrouped ? [subRowGrouped] : []) as SequelizeRawEntity<E>[typeof key]
        } else {
            grouped[key] = subRowGrouped as SequelizeRawEntity<E>[typeof key]
        }
    }
    return grouped
}


/**
 * Adds related entity(related 'as many' to E) row to accumulator array.
 * @param subSelect related entities mapped select {@link SubMapSelect}
 * @param tree keeps information about relation type to parent entity of related entities
 * @param row - current object with unique relation/s row/s
 * @param accumulator already deduplicated row
 * @param key - realtion reference key
 */
function subRowToAccumulator<E extends EntityBase>(
    subSelect: SubMapSelect<E>,
    tree: EntityRelationTree<E>,
    row: SequelizeRawEntityNotGrouped<E>,
    accumulator: SequelizeRawEntity<E>,
    key: keyof ExternalReferences<E>,
) {
    const select = subSelect[key]!
    const subTree = tree[key].getSubEntities()
    const subNullable = tree[key].baseAttributesNullable
    const subRow = row[key]!
    const subRowGrouped = rowToGrouped(select, subTree, subRow, subNullable)
    // if subRowGrouped is null this mean that row is a result of Sequelize LEFT JOIN null-expansion,
    // in this case accumulator entry(array) for related entity row already exist(no need for creating empty array), 
    // subRowGroped is rejected

    if (!subRowGrouped) return
    
    const subEntityCollection = accumulator[key];
    if (!Array.isArray(subEntityCollection)) {
        throw new Error(`Expected an array for relation '${String(key)}', but got: ${typeof subEntityCollection}`);
    }

    subEntityCollection.push(subRowGrouped);
}


/**
 * Iterates through related entities of parent entity.
 * If related entity is unique and is realted as manay to parent entity
 * and there is no singular relation that is unique - it will be 
 * added to collection of related in parent object (return false).
 * If related entity is unique and is related as one to parent entity - function
 * returns 'true' as indicator that entity row is unique.
 * @param subSelect related entities mapped select {@link SubMapSelect}
 * @param tree keeps information about relation type to parent entity of related entities
 * @param row object with relations that are not yet compared
 * @param accumulator object to be comapared with 'row'
 * @returns boolean that indicate if object was merged(return false) or it is unique(return true)
 */
export function subRowIsUniqueOrNotMerged<E extends EntityBase>(
    subSelect: SubMapSelect<E>,
    tree: EntityRelationTree<E>,
    row: SequelizeRawEntityNotGrouped<E>,
    accumulator: SequelizeRawEntity<E>
): boolean {
    // store keys of entities that will be merged
    const mergeKeys: (keyof typeof subSelect)[] = [];
    for (const entityKey of Object.keys(subSelect) as (keyof typeof subSelect)[]) {
        const select = subSelect[entityKey]!;
        if (!subSelect) throw new Error(`subSelect is undefined for entityKey: ${String(entityKey)}`)
        const subRow = row[entityKey]!
        const subAccumulator = accumulator[entityKey] as SequelizeRawEntity<ExternalReferences<E>[keyof ExternalReferences<E>]>
        const subTree = tree[entityKey].getSubEntities()

        const isUnique = rowIsUniqueOrNotMerged(select, subTree, subRow, subAccumulator)

        // unique relation
        if (isUnique && Array.isArray(subAccumulator)) {
            // many-to-one -> merge later
            mergeKeys.push(entityKey);
        } else if (isUnique) {
            // one-to-one -> unique 
            return true;
        }
    }

    // merge all in plural relations
    for (const key of mergeKeys) {
        subRowToAccumulator(subSelect, tree, row, accumulator, key);
    }

    return false;
}


/**
 * Determine if row is unique(is not duplication of another row(accumulator)).
 *  * compare entity base attributes(attributes without external references)
 *  ==> if base attributes are duplicated check subEntities rows
 *      ==> if subentities rows are not duplicated and are related as many to entity
 *          they will be merged to current accumulator entity subrows collections
 *      x=> else subentities rows are unique
 *  x=> else entity row is unique - do not traverse relation tree 
 * @param mapSelect - mapped select object of entity selected attributes and subattributes
 * @param tree keeps information about relation type to parent entity of related entities
 * @param row - current not deduplicated row object
 * @param accumulator - object that will be compared to 'row'
 * @returns true if row is unique or false if current was merged
 */
export function rowIsUniqueOrNotMerged<E extends EntityBase>(
    mapSelect: MapEntitySelect<E>, 
    tree: EntityRelationTree<E>,
    row: SequelizeRawEntityNotGrouped<E>,
    accumulator: SequelizeRawEntity<E> | SequelizeRawEntity<E>[]
): boolean {

    const { select, subEntities } = mapSelect;

    // check base attributes
    const isBaseUnique = entityRowIsUnique(select, row, accumulator);
    if (isBaseUnique) {
        return true; // no need to check sub-entities
    }

    // normalize accumulator to array
    const accArray = Array.isArray(accumulator)
        ? accumulator
        : [accumulator];

    if (accArray.length === 0) {
        return false; // nothing to compare -> treat as merged
    }

    // if subEntities undefined -> targeg as merged
    if (!subEntities) {
        return false
    }
    // check sub-entities for each accumulator row
    for (const accumulator of accArray) {
        const isSubUnique = subRowIsUniqueOrNotMerged(
            subEntities,
            tree,
            row,
            accumulator
        );

        if (!isSubUnique) {
            return false; // merged
        }
    }

    return true; // unique after checking all sub-entities
}


/**
 * Group and deduplicate records returned from Sequelize (when running with raw: true and nest: true).
 * The statements below must be fulfilled:
 * - remove redundant parent objects from nested relational query results
 * - ensure relational results contain only a single, unique related object or array of unique objects
 * - perform the conversion by recursively traversing the relation tree
 */
export function mergeRowsIntoEntities<E extends EntityBase>
(
    mapSelect: MapEntitySelect<E>,
    tree:  EntityRelationTree<E>, 
    rows: SequelizeRawEntityNotGrouped<E> | SequelizeRawEntityNotGrouped<E>[]
)
: SequelizeRawEntity<E>[] {
    const isArray = Array.isArray(rows)
    
    // if is empty array
    if (isArray && !rows.length) {
        return []
    }
    
    if (isArray) {
        const rowsArray = rows as SequelizeRawEntityNotGrouped<E>[]
        const first = rowsArray.shift() 
        const accumulated: SequelizeRawEntity<E>[] = first ? [rowToGrouped(mapSelect, tree, first)] : []
        let isUnique = true
        for (const row of rowsArray) {
            for (const accumulator of accumulated) {
                isUnique = rowIsUniqueOrNotMerged(mapSelect, tree, row, accumulator)
                if (!isUnique) break // row is merged
            }
            if (isUnique) {
                accumulated.push(rowToGrouped( mapSelect, tree, row)) 
            }
        }
        return accumulated
    } else {
        return [rowToGrouped(mapSelect, tree, rows)]
    }
}