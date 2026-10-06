import { QueryConverterBase } from "../../../converters/query/base.js";
import { EntityBase } from "../../../types/entity/Root.js";
import { EntityMetadata, EntityRelationTree } from "../../../types/entity/Metadata.js";
import { Model, InferAttributes, InferCreationAttributes, FindOptions } from "sequelize"
import { Query, QueryConvertObject, OverridesQueryConverterConfig } from "../../../types/entity/Query.js";
import { queryConvertObjectFactory } from "../../../converters/query/buildConverters.js";
import { DialectOptions } from "../../../types/Registry.js";
import extractMysqlQueryConverters from '../dialects/mysql/query/converters.js'
import extractSqliteQueryConverters from '../dialects/sqlite/query/converters.js'
import extractPostgresQueryConverters from '../dialects/postgres/query/converters.js'
import extractMariadbQueryConverters from '../dialects/mariadb/query/converters.js'


export class QueryConverter< 
    E extends EntityBase,
    T extends Model<InferAttributes<T>, InferCreationAttributes<T>>,
    F extends FindOptions<InferAttributes<T>>,
> extends QueryConverterBase<E, T, F> {
    
    constructor(
        metadata: EntityMetadata<E>, 
        relationTree: EntityRelationTree<E>,
        dialect: DialectOptions,
        config?: OverridesQueryConverterConfig 
    ) {
        super(metadata, relationTree, dialect, config)
        this.queryConverterDialects = {
            mysql: extractMysqlQueryConverters(),
            sqlite: extractSqliteQueryConverters(),
            postgres: extractPostgresQueryConverters(),
            mariadb: extractMariadbQueryConverters()
        }
        this.convertersBuild = this.queryConverterDialects[dialect]
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