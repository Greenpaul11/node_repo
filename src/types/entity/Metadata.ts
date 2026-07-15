import Decimal from 'decimal.js'
import { NullableFromObject, PickByType } from '../Global'
import { EntityBase, ExternalReferences, EntityNoExternal, AttributeTypes } from './Root'

/**
 * Configuration options for formatting database queries.
 * Defines how different types of entity attributes should be processed in queries.
 */
export interface EntityMetadata<E extends EntityBase> {
    /**
     * Entity names represented in relations
     */
    aliases: EntityAliases
    /**
     * Primary keys of entity
     */
    primaryKeys: Array<keyof E>
    /**
     * Configurations for each attribute.
     */
    attributesConfig: EntityConfigAttributes<E>
    /**
     * List of all attributes available in the entity model.
     * Used for validation and query building.
     */
    entityAttributesList: Array<keyof E>;
    /**
     * Attributes that can be queried directly without special processing.
     * These are basic fields that don't require range operations, text search, or subqueries.
     * Excludes attributes that are plural references.
     */
    baseAttributesList: Array<keyof EntityNoExternal<E>>
    /**
     * Base attributes that allow null.
     */
    baseAttributesListNullable: Array<keyof NullableFromObject<EntityNoExternal<E>>>
    /**
     * Attributes of type string.
     */
    stringAttributesList: Array<keyof PickByType<E, string>>
    /**
     * Attributes of type number.
     */
    numberAttributesList: Array<keyof PickByType<E, number | Decimal>>
    /**
     * Attributes of type date.
     */
    dateAttributesList: Array<keyof PickByType<E, Date>>
    /**
     * Attributes of type boolean.
     */
    booleanAttributesList: Array<keyof PickByType<E, boolean>>
    /**
     * Attributes that support range queries (_from/_to).
     * Automatically extracted from Date and number fields in the entity.
     */
    rangeAttributesList: Array<keyof PickByType<E, number | Date>>
    /**
     * Attributes that allow for FullTextSearch operation.
     */
    fullTextSearchAttributes: Array<keyof PickByType<E, string>>
    /**
    * References to metadata of related entities.
    * Defines relationships to other entities that can be queried via joins.
    */
    subEntities?: SubEntitiesReferences<E>
    /**
     * Ordering options specific to entity.
     * Defines how results can be ordered for this particular entity.
     */
    orderOptions: SortOptions<E>
    /**
     * Grouping options specific to entity.
     * Defines how results can be grouped for this particular entity.
     */
    groupOptions: SortOptions<E>
}

/**
 * Configuration for submodel (related entity) references.
 * Maps entity relationships to their query configurations.
 */
export type SubEntitiesReferences<E extends EntityBase> = {
    /**
     * Maps relationship aliases to their configurations.
     * Key is the alias used in database joins, value contains options object.
     */
    [Key in keyof ExternalReferences<E>]: {
        /**
         * Query formatting options for the related entity.
         * Contains configuration for how to process queries on the related model.
         */
        metadata: EntityMetadata<ExternalReferences<E>[Key]>
        /**
         * Type of relation between referenced entity and parent.
         */
        relation: RelationTypeOptions
    }
}

/**
 * Recursively defines the structure and relation type of related entities for a specific root entity.
 * This object is the result of mapping the {@link SubEntitiesReferences} structure.
 */
export type EntityRelationTree<E extends EntityBase> = {
    [Key in keyof ExternalReferences<E>]: {
        relation: RelationTypeOptions
        baseAttributes: Array<keyof EntityNoExternal<ExternalReferences<E>[Key]>>
        baseAttributesNullable: Array<keyof EntityNoExternal<ExternalReferences<E>[Key]>>
        getSubEntities: () => EntityRelationTree<ExternalReferences<E>[Key]> 
    }
}

/**
 * Entity references names.
 */
export type EntityAliases = {
    singular: string
    plural: string
}

/**
 * Represents configruation for individual group/order option ('by id asc', 'by name desc', etc.).
 * If group option - value does not exist, only name which is attribute name.
 * If order option - value is query direction indicator 'ASC', 'DESC' etc. 
 */
export type SortOption<E extends EntityBase> = {
    name: keyof EntityNoExternal<E>,
    value?: string
}

/**
 * Represents configruation for individual option (`by price_count asc`)
 * - 'name' is an attribute name.
 * - 'value' is is query direction indicator 'ASC', 'DESC' etc. 
 * - 'fn' is an aggregate function type 'COUNT', 'SUM' etc.
 */
export type SortFunction<E extends EntityBase> = {
    name: keyof EntityNoExternal<E>,
    value: string,
    fn: string
}

/**
 * Base type for {@link SortOptions}
 * - fns points to {@link SortFunction} through key that looks like: 'by price_sum asc', 
 *  'by created_count desc' etc.
 * - related points to related entities SortOptions by key which is reference name
 */
export type SortBase<E extends EntityBase> = {
    fns: { [index: string]: SortFunction<E> }
    related: { [Key in keyof ExternalReferences<E>]: SortOptions<ExternalReferences<E>[Key]> }
}

/**
 * Complete SortOptions object that is used as GroupOptions or OrderOptions.
 */
export type SortOptions<E extends EntityBase> = 
    & SortBase<E> 
    & (
        {                                   // OrderOptions object
            sortType: 'order';
            options: { [index: string]: {
                name: keyof EntityNoExternal<E>
                value: string; 
            }}
        }
        | {                                 // GroupOptions object
            sortType: 'group';
            options: { [index: string]: {
                name: keyof EntityNoExternal<E>
                
            }}
        }
)

/**
 * Configuration interface for entity metadata.
 * Configurations consists of two parts:
 * - base: {@link EntityConfigBase}
 * - attributes: {@link EntityConfigAttributes}
 */
export type EntityConfig<E extends EntityBase> = {
    base: EntityConfigBase
    attributes: EntityConfigAttributes<E>
}

/**
 * Base configuration interface for entity metadata.
 */
export type EntityConfigBase = {
    referenceNames: {
        /**
        * Defines singular reference name
        */
        singularName: string
        /**
        * Defines plural reference name
        */
        pluralName: string
    } 
}

/**
 * Configuration interface for entity attributes metadata.
 * Defines how entities should be processed, validated, and displayed in the application.
 */
export type EntityConfigAttributes<E extends EntityBase> = {
    /**
     * Configuration for each attribute of the entity.
     * Defines validation rules, UI behavior, and relationships.
     */
    [Property in keyof Required<EntityNoExternal<E>>] : {
        /**
         * Whether the field is required for entity creation.
         */
        required: boolean
        /**
         * Whether the field can be null in the database.
         * If plural reference - null.
         */
        allowNull: boolean | null
        /**
         * Reference to another entity if this is a foreign key.
         */
        associated: null | string
        /**
         * Whether the field can be edited by users.
         */
        locked: boolean
        /**
         * Whether the field can be used as range attributes, look at {@link EntityQueryExtendedAttributes}
         */
        asRange: boolean
        /**
         * Attributes that allow for FullTextSearch operation.
         */
        searchIn: Property extends keyof PickByType<NonNullable<E>, string> ? boolean : null
        /**
         * Database field type
         */
        fieldType: 'string' | 'number' | 'boolean' | 'object' | 'text' | 'float' | 'decimal' | 'none'
        /**
         * Repository attributes types
         */
        type: AttributeTypes
        /**
         * Determine if field is primary key
         */
        primaryKey?: true,
        /**
         * Alternative name for display purposes.
            */
        as?: string
        /**
         * Additional attributes for HTML elements.
         */
        setAttributes?: string
    } 
}

/**
 * Defines relation of entity.
 */
type RelationTypeOptions = 'one to one' | 'one to many' | 'many to one' | 'many to many'

