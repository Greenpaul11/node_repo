import { EntityQueryable, ConvertersBuild, 
    QueryEntityAttributeValidator, QueryRangeValidator, QueryRangeAttributeTypes, 
    QuerySelectValidator,
    QueryFunctions,
    FnCount, FnNumber,
    QuerySelect,
    Query,
    QueryConvertObject,
    QueryOrderOptions,
    QueryGroupOptions,
    QuerySortValidator
} from "../../../types/entity/Query"
import { EntityBase, EntityNoExternal, AggregateOperators, ExternalReferences } from "../../../types/entity/Root"
import { PickByType } from "../../../types/Global"
import { 
    FindOptions, Model, InferAttributes, InferCreationAttributes, 
    Op, col, fn, OrderItem,
    FindAttributeOptions,
    Includeable,
    IncludeOptions
} from "sequelize"
import { Col, Fn } from 'sequelize/types/utils'
import { WhereValue } from "../types"
import { EntityMetadata, SortFunction, SortOption, SortOptions } from "../../../types/entity/Metadata"
import { ref } from "node:process"


export default function sequelizeConvertersBuild<
    F extends FindOptions<InferAttributes<any>> | IncludeOptions = FindOptions<InferAttributes<any>>
>(): ConvertersBuild<F> {
    return {
        baseAttributes: {
            string: buildAttributeConverter<F>(),
            number: buildAttributeConverter<F>(),
            date: buildAttributeConverter<F>(),
            boolean: buildAttributeConverter<F>(),
        },
        rangeAttributes: {
            number: buildRangeConverter<F, 'number'>(),
            date: buildRangeConverter<F, 'date'>()
        },
        queryAttributes: {
            select: buildSelectConverter<F>(),
            order: buildOrderConverter<F>(),
            group: buildGroupConverter<F>()
        },
        relationAttributes: {
            relations: buildRelationConverter<F>()
        } 
    }
}

//**********************************************************************************************************
// BASE CONVERTERS
//**********************************************************************************************************

function buildAttributeConverter<
    F extends FindOptions<InferAttributes<any>> | IncludeOptions
>() {
    return <E extends EntityBase, K extends keyof EntityQueryable<E>>(
        value: unknown,
        converted: F,
        attribute: K,
        nested: boolean,
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

//**********************************************************************************************************
// RANGE CONVERTERS
//**********************************************************************************************************

function buildRangeConverter<
    F extends FindOptions<InferAttributes<any>> | IncludeOptions, 
    R extends keyof QueryRangeAttributeTypes
>() {
    return <E extends EntityBase, K extends keyof PickByType<E, QueryRangeAttributeTypes[R]>>(
        value: unknown,
        converted: F,
        suffix: '_from' | '_to',
        attribute: K,
        nested: boolean,
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

//**********************************************************************************************************
// SELECT CONVERTERS
//**********************************************************************************************************

function buildSelectConverter<
    F extends FindOptions<InferAttributes<any>> | IncludeOptions
>() {
    return <E extends EntityBase>(
        value: unknown, 
        converted: F, 
        metadata: EntityMetadata<E>,
        nested: boolean,
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
                } else if (!nested && Array.isArray(item)) {
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
        // capitalize first letter for Sequelize alias compatibility
        const name = metadata.aliases.singular.charAt(0).toUpperCase() 
            + metadata.aliases.singular.slice(1)
        const column = deepEntity.length
            ? `${deepEntity.join('.')}.${String(item)}`
            : `${name}.${String(item)}`
        
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
    
    let reference = include.find(item => item.association === subEntity)  
    
    if (!reference) {
        reference = { association: subEntity}    
        include.push(reference);
    }   
    
    if (rest.length > 0) {
        reference.include ??= [] 
        mapSubentitiesToIncludable(rest, reference.include as IncludeOptions[])
    }
}

//**********************************************************************************************************
// RELATION CONVERTERS
//**********************************************************************************************************

function buildRelationConverter<
    F extends FindOptions<InferAttributes<any>> | IncludeOptions
>() {
    return <E extends EntityBase, K extends keyof ExternalReferences<E>>(
        value: unknown,
        converted: F,
        attribute: K,
        queryConvertObject: QueryConvertObject<ExternalReferences<E>[K], F>
    ): F => {
        if (!value || typeof value !== 'object') {
            throw new Error(`Value for attribute '${String(attribute)}' is not valid!`)
        }
        
        const query = value as Query<ExternalReferences<E>[K]>
        
        const formatted = {} as F
        for (const [key, value] of Object.entries(query)) {
            const queryKey = key as keyof typeof queryConvertObject
            if (queryConvertObject.hasOwnProperty(key)) {
                queryConvertObject[queryKey].convert(value, formatted)
            } else {
                throw new Error (`Entry: ${String(queryKey)} is not valid query attribute or depth limit exceeded!`)
            }
        }

        converted.include ??= []
        const include = converted.include as IncludeOptions[]

        let reference = include.find(item => item.association === attribute)
        
        if (!reference) {
            reference = { association: attribute as string}    
            include.push(reference);
        }   

        // assign formatted query
        Object.assign(reference, formatted)
        
        return converted
    }
}

//======================================== SORT CONVERTERS =================================================

function convertSortOptions<E extends EntityBase, A extends OrderItem[] | (string | Fn | Col)[]>(
    name: string,
    sortOptions: SortOptions<E>,
    querySort: QueryGroupOptions<E> | QueryOrderOptions<E>,
    acc: A,
    valueFormater: <F extends EntityBase>(name: string, acc: A, value: SortOption<F>, relAsString?: string) => void,
    fnFormater?: (<F extends EntityBase>(acc: A, value: SortFunction<F>) => void) | undefined,
    relAsString?: string
): void {
    if (typeof querySort === "string") {
        applaySortOption(name, acc, sortOptions, querySort, valueFormater, fnFormater, relAsString)
    } else if (Array.isArray(querySort)) {
        for (let i=0; i < querySort.length; i++) {
            const option = querySort[i]
            if (typeof option === "string") {
                applaySortOption(name, acc, sortOptions, option, valueFormater, fnFormater, relAsString)
            } else if (Array.isArray(option)) {
                const entity = option[0]
                const subOptions = option[1] as any // for deep relation type is changed
                const relationAsString = relAsString ? `${relAsString}.${String(entity)}` : entity
                const relSortOptions = sortOptions.related[entity]
                if (!relSortOptions) throw new Error('Related order options are undefined!')
                convertSortOptions(name, relSortOptions, subOptions, acc, valueFormater, fnFormater, relationAsString)
            }
        }
    } else {
        throw new Error(`Typeof for sort option is not valid! Expected array or string.`)
    }
}

const applaySortOption = <E extends EntityBase, A extends OrderItem[] | (string | Fn | Col)[]>(
    name: string,
    acc: A,
    sortOptions: SortOptions<E>,
    option: string,
    valueFormater: <F extends EntityBase>(name: string, acc: A, value: SortOption<F>, subEntity?: string) => void,
    fnFormater?: (<F extends EntityBase>(acc: A, value: SortFunction<F>, relAsString?: string) => void),
    relAsString?: string
): void => {
    if (sortOptions.options[option]) {
        valueFormater(name, acc, sortOptions.options[option], relAsString)
    } else if (fnFormater && sortOptions.fns[option]) {
        fnFormater(acc, sortOptions.fns[option], relAsString)
    } else {
        throw new Error(`${sortOptions.sortType} has no "${option}"`)
    }
}

const fnOptionToSequelize = <E extends EntityBase>(
    acc: OrderItem[],
    option: SortFunction<E>,
    entity?: string
): void => {
    const column = entity ? `${String(entity)}.${String(option.name)}` : String(option.name)
    const fnName = option.fn
    const value = option.value as string
    acc.push([fn(fnName, col(column)), value])
}

//**********************************************************************************************************
// ORDER CONVERTERS
//**********************************************************************************************************

function buildOrderConverter<F extends FindOptions<InferAttributes<any>> | IncludeOptions>() {
    return <E extends EntityBase>(
        value: unknown,
        converted: F,
        metadata: EntityMetadata<E>,
        nested: boolean,
        validate?: QuerySortValidator
    ): F => {

        if (validate) {
            validate(value)
        }
        const options = metadata.orderOptions
        // capitalize first letter for Sequelize alias compatibility
        const name = metadata.aliases.singular.charAt(0).toUpperCase() 
            + metadata.aliases.singular.slice(1)
        const accumulated: OrderItem[] = []
        const asOrder = value as QueryOrderOptions<E>
        convertSortOptions(name, options, asOrder, accumulated, orderOptionToSequelize, fnOptionToSequelize)
        converted.order = accumulated
        return converted
    }
}

const orderOptionToSequelize = <E extends EntityBase>(
    name: string,
    acc: OrderItem[],
    option: SortOption<E>,
    entity?: string
): void => {
    const column = entity ? `${entity}.${String(option.name)}` : String(option.name)
    const value = option.value as string
    switch (value) {
        case 'ASC NULLS FIRST':
            acc.push([col(column), 'ASC'])
            break
        case 'ASC NULLS LAST':
            acc.push([fn('ISNULL', col(column)), 'ASC'])
            acc.push([col(column), 'ASC'])
            break
        case 'DESC NULLS FIRST':
            acc.push([fn('ISNULL', col(column)), 'DESC'])
            acc.push([col(column), 'DESC'])
            break
        case 'DESC NULLS LAST':
            acc.push([col(column), 'DESC'])
            break
        case 'RAND':
            acc.push([fn('RAND'), 'ASC'])
            break
        default:
            acc.push([col(column), value])
    }
}

//**********************************************************************************************************
// GROUP CONVERTERS
//**********************************************************************************************************

function buildGroupConverter<F extends FindOptions<InferAttributes<any>>>() {
    return <E extends EntityBase>(
        value: unknown,
        converted: F,
        metadata: EntityMetadata<E>,
        validate?: QuerySortValidator
    ): F => {
        if (validate) {
            validate(value)
        }
        
        const options = metadata.groupOptions
        // capitalize first letter for Sequelize alias compatibility
        const name = metadata.aliases.singular.charAt(0).toUpperCase() 
            + metadata.aliases.singular.slice(1)
        const accumulated: (string | Fn | Col)[] = []
        const asGroup = value as QueryGroupOptions<E>
        convertSortOptions(name, options, asGroup, accumulated, groupOptionToSequlize)
        converted.group = accumulated
        return converted
    }
}

const groupOptionToSequlize = <E extends EntityBase>(
    name: string, // capitalized alias of sequelize model
    acc: (string | Fn | Col)[],
    option: SortOption<E>, 
    entity?: string
): void => {
    const converted = entity 
        ? `${String(entity)}.${String(option.name)}` 
        : `${name}.${String(option.name)}` 
    acc.push(converted)
}



























