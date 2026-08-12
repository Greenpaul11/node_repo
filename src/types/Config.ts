import { TransformRule } from "./entity/Converters.js"
import { Decimal } from "decimal.js"
import { Sequelize } from "sequelize"

/**
 * Define base type for all your entities.
 * If there is no common attributes for all entities - do not override it.
 * 
 * @example 
 *  - interface EntityBase { id: number } ALL ENTITIES MUST HAVE `id` with type number
 *  - interface EntityBase { id: number, update: Date, created: Date, active: boolean } 
 *    ALL ENTITIES MUST HAVE `id` with type number, `update` and `created` with type Date and
 *    `active` with type boolean
 * 
 */
export interface EntityBaseConfig {
    id: number
}

export interface EntityCreationTransform {
    baseAttributes: {
        decimal: TransformRule<Decimal, number>
    }
}

export interface EntityQueryTransform {
    baseAttributes: {
        decimal: TransformRule<Decimal, number>
    }
}

export interface AggregateBaseConfig {
    $count: number
    $sum: Decimal
    $avg: Decimal
    $min: Decimal
    $max: Decimal
}

/**
 * Define domain level base configuration types
 */
export type ConfigTypes = {
    entityBase: EntityBaseConfig
    entityCreationTransform: EntityCreationTransform
    entityQueryTransform: EntityQueryTransform
    aggregateBase: AggregateBaseConfig
}

export type OrmOptions = Sequelize 

export type DialectOptions = 'mysql' | 'sqlite'

export type NumberLike = number | Decimal

/**
 * Constructor configurations
 */
export type ConstructorConfg = {
    connection: OrmOptions,
    path: string
}