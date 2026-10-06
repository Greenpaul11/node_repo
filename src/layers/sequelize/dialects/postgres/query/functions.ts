import { QueryOrderOptions, QuerySortValidator } from "../../../../../types/entity/Query.js"
import { EntityBase } from "../../../../../types/entity/Root.js"
import { FindOptions, InferAttributes, col, fn, OrderItem, IncludeOptions, literal } from "sequelize"
import { EntityMetadata, SortOption } from "../../../../../types/entity/Metadata.js"
import { convertSortOptions, fnOptionToSequelize } from "../../common/query/functions.js"

export function buildOrderConverter<F extends FindOptions<InferAttributes<any>> | IncludeOptions>() {
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
        case 'ASC NULLS LAST':
        case 'DESC NULLS FIRST':
        case 'DESC NULLS LAST':
            acc.push(literal(`${column} ${value}`))
            break

        case 'RAND': 
            acc.push(fn('RANDOM'))
            break

        default:
            acc.push([col(column), value])
    }
}

