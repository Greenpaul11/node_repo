import { QueryConverterBase } from "../../../converters/query/base";
import { EntityBase } from "../../../types/entity/Root";
import { EntityMetadata, EntityRelationTree } from "../../../types/entity/Metadata";
import { Model, InferAttributes, InferCreationAttributes, FindOptions } from "sequelize"
import sequelizeConvertersBuild from "./build"
import { Query, QueryConvertObject, OverridesQueryConverterConfig } from "../../../types/entity/Query";
import { queryConvertObjectFactory } from "../../../converters/query/buildConverters";


export class QueryConverter< 
    E extends EntityBase,
    T extends Model<InferAttributes<T>, InferCreationAttributes<T>>,
    F extends FindOptions<InferAttributes<T>> 
> extends QueryConverterBase<E, T, F> {
    
    constructor(
        metadata: EntityMetadata<E>, 
        relationTree: EntityRelationTree<E>,
        config?: OverridesQueryConverterConfig 
    ) {
        super(metadata, relationTree, config)
        this.convertersBuild = sequelizeConvertersBuild<F>()
        this.queryConvertObject = queryConvertObjectFactory(this.convertersBuild, this.config, metadata)
    }

    public convertQuery<Q extends Query<E>>(query: Q): F {
        // create orm query object
        const formatted = {} as F

        for (const [key, value] of Object.entries(query)) {
            const queryKey = key as keyof QueryConvertObject<E, F>
            if (this.queryConvertObject.hasOwnProperty(key)) {
                this.queryConvertObject[queryKey].convert(value, formatted)
            }
        }

        return formatted
    }
}