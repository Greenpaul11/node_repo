import { EntityQueryable, EntityQueryRangeAttributes, ConvertersBuild, 
    QueryEntityAttributeValidator, QueryRangeValidator, QueryRangeAttributeTypes, 
    QuerySelectValidator} from "../../../types/entity/Query"
import { EntityBase, EntityNoExternal } from "../../../types/entity/Root"
import { PickByType } from "../../../types/Global"
import { 
    FindOptions, Model, InferAttributes, InferCreationAttributes, 
    Op, 
    FindAttributeOptions
} from "sequelize"
import { WhereValue } from "../types"


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
        attributes: Array<keyof EntityNoExternal<E>>,
        validate?: QuerySelectValidator<E>
    ): F => {
        const select = value
        if (!select) {
            throw new Error('Value for select attribute is not valid!')
        }
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