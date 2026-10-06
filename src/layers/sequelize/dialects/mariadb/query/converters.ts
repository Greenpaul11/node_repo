import { ConvertersBuild } from "../../../../../types/entity/Query.js"
import { FindOptions, InferAttributes, IncludeOptions } from "sequelize"
import { 
    buildAttributeConverter, buildRangeConverter, buildSelectConverter, 
    buildOrderConverter, buildGroupConverter, buildRelationConverter 
} from "../../common/query/functions.js"

export default function extract<
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