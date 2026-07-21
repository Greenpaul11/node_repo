import { EntityQueryable, ConvertersBuild, 
    QueryEntityAttributeValidator, QueryRangeValidator, QueryRangeAttributeTypes, 
    QuerySelectValidator,
    QueryFunctions,
    FnCount, FnNumber,
    QuerySelect,
    Query
} from "../../../types/entity/Query"
import { EntityBase, EntityNoExternal, AggregateOperators } from "../../../types/entity/Root"
import { PickByType } from "../../../types/Global"
import { 
    FindOptions, Model, InferAttributes, InferCreationAttributes, 
    Op, col, fn,
    FindAttributeOptions,
    Includeable,
    IncludeOptions
} from "sequelize"
import { Fn } from 'sequelize/types/utils'
import { WhereValue } from "../types"
import { EntityMetadata } from "../../../types/entity/Metadata"
import { ref } from "node:process"


export default function sequelizeConvertersBuild<
    E extends EntityBase,
    T extends Model<InferAttributes<T>, InferCreationAttributes<T>>,
    F extends FindOptions<InferAttributes<T>> = FindOptions<InferAttributes<T>>
>(): ConvertersBuild<E, F> {
    return {
        baseAttributes: {
            string: buildAttributeConverter<E, F>(),
            number: buildAttributeConverter<E, F>(),
            date: buildAttributeConverter<E, F>(),
            boolean: buildAttributeConverter<E, F>(),
        },
        rangeAttributes: {
            number: buildRangeConverter<E, F, 'number'>(),
            date: buildRangeConverter<E, F, 'date'>()
        },
        queryAttributes: {
            select: buildSelectConverter<E, F>()
        } 
    }
}

function buildAttributeConverter<
    E extends EntityBase, 
    F extends FindOptions<InferAttributes<any>>
>() {
    return <K extends keyof EntityQueryable<E>>(
        value: unknown,
        converted: F,
        attribute: K,
        validate?: QueryEntityAttributeValidator<E>
    ): F => {
        converted.where ??= {}
        const where = converted.where as Record<string, WhereValue>

        if (Array.isArray(value)) {
            const validated = []
            if (validate) {
                for (const entry of value) {
                    validated.push(validate(entry, attribute))
                }
                where[attribute as string] = validated
            } else {
                where[attribute as string] = value
            }
        } else {
            const validated = validate ? validate(value, attribute) : value
            if (validated !== undefined) {
                where[attribute as string] = validated
            }
        }
        return converted
    }
}

function buildRangeConverter<
    E extends EntityBase, 
    F extends FindOptions<InferAttributes<any>>, 
    R extends keyof QueryRangeAttributeTypes
>() {
    return <K extends keyof PickByType<E, QueryRangeAttributeTypes[R]>>(
        value: unknown,
        converted: F,
        suffix: '_from' | '_to',
        attribute: K,
        validate?: QueryRangeValidator<E>
    ): F => {
        converted.where ??= {}
        const where = converted.where as Record<string, WhereValue>
        const op = suffix === '_from' ? Op.gte : Op.lt
        const validated = validate ? validate(value, `${String(attribute)}${suffix}` as any) : value
        if (validated !== undefined) {
            const target = where[attribute]
            if (target && typeof target === 'object') {
                // already has other operators
                where[attribute] = { ...target, [op]: validated}
            } else {
                // value is not yet assigned
                where[attribute] = { [op]: validated }
            }
        }
        
        return converted
    }
}

function buildSelectConverter<
    E extends EntityBase,
    F extends FindOptions<InferAttributes<any>>
>() {
    return (
        value: unknown, 
        converted: F, 
        metadata: EntityMetadata<E>,
        validate?: QuerySelectValidator<E>
    ): F => {
        if (!value) {
            throw new Error('Value for select attribute is not valid!')
        }
        const select = value as QuerySelect<E>
        const attributes = metadata.baseAttributesList
        let sequelizeAttributes: FindAttributeOptions | undefined
        if (select instanceof Array) {
            sequelizeAttributes = []
            for (let i = 0; i < select.length; i++) {
                const item = select[i]
                if (typeof item === 'string') {
                    if (validate) { 
                        validate(item, attributes)
                    }
                    sequelizeAttributes.push(item)
                } else if (Array.isArray(item)) {
                    const [aggregate, subEntities] = convertAggregates(metadata, item)
                    sequelizeAttributes.push(aggregate)
                    if (subEntities.length) {
                        includeSelectSubEntities(subEntities, converted)
                    }
                } else {
                    throw new Error('Item of select has no valid type!')
                }
            }
        } else if (typeof select === 'object' && 'exclude' in select) {
            if (select.exclude instanceof Array) {
                sequelizeAttributes = { exclude: []}
                const exclude = select.exclude as Array<keyof EntityNoExternal<E>>
                for (let i = 0; i < exclude.length; i++) {
                    const item = exclude[i]
                    if (typeof item === 'string') {
                        if (validate) { 
                            validate(item, attributes)
                        }
                        sequelizeAttributes.exclude.push(item)
                    } else {
                        throw new Error('Item of exclude has no valid type!')
                    }
                }
            }
        } else {
            throw new Error('Value for select attribute is not valid!')
        }

        converted.attributes = sequelizeAttributes
        return converted
    } 
}

function convertAggregates<
    E extends EntityBase,
>(metadata: EntityMetadata<E>, fnsObject: QueryFunctions<E>): [[Fn, string], string[]] {
    const key = fnsObject[0]
    if (!isAggregateKey(key)) {
        throw new Error(
            `Invalid aggregate function operator "${key}". ` +
            `Expected one of: ${Object.keys(AGGREGATE_OPERATORS).join(', ')}`
        )
    }

    return convertToSequelizeTuple(key, metadata, fnsObject[1])
}

function convertToSequelizeTuple<
    E extends EntityBase
> (
    on: AggregateOperators, 
    metadata: EntityMetadata<E>, 
    item: FnCount<E> | FnNumber<E>,
    deepEntity: string[] = []
): [[Fn, string], string[]] {
    if (typeof item === 'string') {
        const alias = deepEntity.length
            ? `${on}_${deepEntity.join('_')}_${String(item)}`
            : `${on}_${String(item)}`
        if (item === '*') {
            return [[fn(AGGREGATE_OPERATORS[on], col('*')), alias], deepEntity]
        }
        if (!metadata.baseAttributesList.includes(item as keyof EntityNoExternal<E>)) {
            throw new Error(
                `Field "${String(item)}" not found on entity for ${alias}). ` +
                `Available attributes: [${metadata.baseAttributesList.join(', ')}]`
            )
        }
        const column = deepEntity.length
            ? `${deepEntity.join('.')}.${String(item)}`
            : item
        
        return [[fn(AGGREGATE_OPERATORS[on], col(column)), alias], deepEntity]
    }

    if (Array.isArray(item)) {
        const subEntities = metadata.subEntities
        if (!subEntities) {
            throw new Error(`Value for ${on} function is incorrect!`)
        }
        const key = item[0]
        const subentity = subEntities[key]
        if (!subentity) {
            throw new Error(`External reference: ${String(key)} does not exist!`)
        }

        return convertToSequelizeTuple(
            on,
            subentity.metadata,
            item[1] as any,
            [...deepEntity, key as string]
        )
    }

    throw new Error('Type for item is not valid!')
}

function isAggregateKey(key: string): key is AggregateOperators {
    return key in AGGREGATE_OPERATORS
}

const AGGREGATE_OPERATORS = {
    '$count': 'COUNT',
    '$sum': 'SUM',
    '$avg': 'AVG',
    '$min': 'MIN',
    '$max': 'MAX'
} as const satisfies Record<AggregateOperators, string>


function includeSelectSubEntities(subEntities: string[], converted: FindOptions<InferAttributes<any>>) {
    converted.include ??= []
    const include = converted.include as IncludeOptions[]
    mapSubentitiesToIncludable(subEntities, include)
}

function mapSubentitiesToIncludable(
    subEntities: string[],
    include: IncludeOptions[] 
) {
    const [subEntity, ...rest] = subEntities;   
    if (!subEntity) {
      return
    }   
    
    let reference = include.find( item => item.association === subEntity)  
    
    if (!reference) {
        reference = { association: subEntity}    
        include.push(reference);
    }   
    
    if (rest.length > 0) {
        reference.include ??= [] 
        mapSubentitiesToIncludable(rest, reference.include as IncludeOptions[])
    }
}




