import { TransformRule } from "./entity/Converters"
import Decimal from "decimal.js"
import { Sequelize } from "sequelize"


/**
 * Define domain level base configuration types
 */
export type ConfigTypes = {
    entityBase: {
        id: number
        created: Date
        updated: Date
        active: boolean
    }
    entityCreationTransform: {
        baseAttributes: {
            decimal: TransformRule<Decimal, number>
        }
    }
    entityQueryTransform: {
        baseAttributes: {
            decimal: TransformRule<Decimal, number>
        }
    }
    aggregateBase: {
        $count: number
        $sum: Decimal
        $avg: Decimal
        $min: Decimal
        $max: Decimal
    }
}

export type OrmOptions = Sequelize | Decimal // Decimal is for test purpose

export type DialectOptions = 'mysql' | 'sqlite'