import { QueryFormaterBase } from "../../../formaters/query/queryFormaterBase";
import { EntityBase } from "../../../types/entity/Root";
import { EntityMetadata, EntityRelationTree } from "../../../types/entity/Metadata";
import { FindOptions, Model, InferAttributes, InferCreationAttributes } from "sequelize"

import sequelizeConvertersBuild from "./build"




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
    }
}