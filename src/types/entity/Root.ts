import { NonUndefined } from '../Global'
import { ConfigTypes } from '../Config'

/**
 * Base interface for all entity types.
 * Defines common fields that every entity in the system should have.
 */
export type EntityBase = ConfigTypes['entityBase']

/**
 * Defines external references that an entity has to other entities.
 * Maps entity fields to their corresponding query types of related entities.
 * If entity can has many - reference is an array of related entities,
 * else is a single entity.
 */
 export type ExternalReferences<E extends EntityBase> = {
    [K in keyof E as
        NonNullable<E[K]> extends EntityBase | EntityBase[] 
            ? K
            : never
    ]-?: (
        NonUndefined<E[K]> extends ReadonlyArray<infer U>
            ? U
            : NonUndefined<E[K]>
    ) extends infer R
        ? R extends EntityBase
            ? R
            : never
        : never
}

/**
 * Extend entity by additional attributes.
 */
export type EntityExtend<E extends EntityBase, T extends object> = E & T

/**
 * Entity fields without referencial ones. 
 */
export type EntityNoExternal<E extends EntityBase> = Omit<E, keyof ExternalReferences<E>> 

/**
 * Represents stringified types for entity attributes.
 */
export type AttributeTypes = 'string' | 'number' | 'boolean' | 'date' | 'decimal' | 'object'

/**
 * Domain‑level type representing the results of aggregation operations.
 */
export type AggregateBase = ConfigTypes['aggregateBase']

/**
 * String literal tokens representing supported aggregate operators in the query DSL.
 */
export type AggregateOperators = keyof AggregateBase
