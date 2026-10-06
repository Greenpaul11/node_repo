import { ORMS, ORM_MAP, DIALECTS } from "../registry/constants.js"
import { TransformRule } from "./entity/Converters.js"
import { Decimal } from "decimal.js"
import { Sequelize } from "sequelize"
import { constructEntities } from "../constructors/entityConstructor/sequelize/build.js"
import { constructMetadatas } from "../constructors/metadataConstructor/sequelize/build.js"

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
 * Defines domain level base configuration types
 */
export type ConfigTypes = {
    entityBase: EntityBaseConfig
    entityCreationTransform: EntityCreationTransform
    entityQueryTransform: EntityQueryTransform
    aggregateBase: AggregateBaseConfig
}


export interface OrmInstanceMap {
    sequelize: Sequelize
}
/**
 * String representation of supported ORMs
 */
export type OrmName = keyof OrmMap

/**
 * Supported ORM instance types
 */
export type OrmOptions = Sequelize 

export type DialectOptions = 'mysql' | 'sqlite' | 'postgres' | 'mariadb' | 'oracle'

export type OrmMap = typeof ORM_MAP

export type DialectName<T extends OrmName> = OrmMap[T][number]


export type NumberLike = number | Decimal

/**
 * Constructor configurations
 */
export type ConstructorConifg = {
    connection: OrmOptions,
    constructEntities: boolean,
    constructMetadatas: boolean
    path: string,
    dirName?: string,
    indent?: number,
    consoleLogIdentifier?: string
}

/**
 * Constructor configurations defaults
 */
export type ConstructorConfigDefaults = {
    dirName: string,
    indent: number,
    consoleLogIdentifier: string
}