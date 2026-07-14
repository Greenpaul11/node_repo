import { EntityQueryable, ConvertersBuild, QueryEntityAttributeValidator } from "../../../types/entity/Query"
import { EntityBase } from "../../../types/entity/Root"
import { FindOptions, Model, InferAttributes, InferCreationAttributes } from "sequelize"
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
        }
    }
}

function buildAttributeConverter<E extends EntityBase, F extends FindOptions<InferAttributes<any>>>() {
    return <K extends keyof EntityQueryable<E>>(
        value: EntityQueryable<E>[K],
        attribute: K,
        converted: F,
        validate?: QueryEntityAttributeValidator<E>
    ): F => {
        (converted as Record<string, any>).where ??= {}
        const where = (converted as any).where as Record<string, WhereValue>

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