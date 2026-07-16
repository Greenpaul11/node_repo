import { EntityQueryable, EntityQueryRangeAttributes, ConvertersBuild, 
    QueryEntityAttributeValidator, QueryRangeValidator, QueryRangeAttributeTypes } from "../../../types/entity/Query"
import { EntityBase } from "../../../types/entity/Root"
import { PickByType } from "../../../types/Global"
import { 
    FindOptions, Model, InferAttributes, InferCreationAttributes, 
    Op 
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
            where[attribute as string] = { ...where[attribute as string], [op]: validated }
        }
        
        return converted
    }
}