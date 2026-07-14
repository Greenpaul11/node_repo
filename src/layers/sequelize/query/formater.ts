import { QueryFormaterBase } from "../../../formaters/query/queryFormaterBase";
import { EntityBase } from "../../../types/entity/Root";
import { EntityMetadata, EntityRelationTree } from "../../../types/entity/Metadata";
import { Model, InferAttributes, InferCreationAttributes, FindOptions } from "sequelize"
import sequelizeConvertersBuild from "./build"
import { Query, QueryConvertObject } from "../../../types/entity/Query";





export class QueryFormater< 
    E extends EntityBase,
    T extends Model<InferAttributes<T>, InferCreationAttributes<T>>,
    F extends FindOptions<InferAttributes<T>> 
> extends QueryFormaterBase<E, T, F> {
    
    constructor(
        metadata: EntityMetadata<E>, 
        relationTree: EntityRelationTree<E>, 
    ) {
        super(metadata, relationTree)

        this.convertersBuild = sequelizeConvertersBuild<E, T, F>()
        this.queryConvertObject = this.queryConvertObjectFactory()
    }

    public formatQuery<Q extends Query<E>>(query: Q): F {
        // create orm query object
        const formated = {} as F

        for (const [key, value] of Object.entries(query)) {
            const queryKey = key as keyof QueryConvertObject<E, F>
            if (this.queryConvertObject.hasOwnProperty(queryKey)) {
                this.queryConvertObject[queryKey].convert(value, queryKey, formated)
            }
        }

        return formated
    }
}