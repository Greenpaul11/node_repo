import { EntityBase } from '../../../types/entity/Root.js'
import { EntityMetadata, EntityRelationTree } from '../../../types/entity/Metadata.js'
import { EntityProjection, Query } from '../../../types/entity/Query.js'
import { ConverterDialectsBuild } from '../../../types/entity/Converters.js'
import { OutputConverterBase } from '../../../converters/output/base.js'
import { 
    Model, InferAttributes, InferCreationAttributes 
} from 'sequelize'

import mysqlConverterBuild from '../dialects/mysql/output/build.js'
import sqliteConverterBuild from '../dialects/sqlite/output/build.js'
import postgresConverterBuild from '../dialects/postgres/output/build.js'
import mariadbConvertersBuild from '../dialects/mariadb/output/build.js'
import extractMysqlEntityConverters from '../dialects/mysql/output/converters.js'
import extractSqliteEntityConverters from '../dialects/sqlite/output/converters.js'
import extractPostgresEntityConverters from '../dialects/postgres/output/converters.js'
import extractMariadbEntityConverters from '../dialects/mariadb/output/converters.js'

// define dialect converters build
export const converterDialectsBuild = {
    mysql: mysqlConverterBuild,
    sqlite: sqliteConverterBuild,
    postgres: postgresConverterBuild,
    mariadb: mariadbConvertersBuild
}

export class OutputConverter<
    E extends EntityBase,
    T extends Model<InferAttributes<T>, InferCreationAttributes<T>>
> extends OutputConverterBase<E, T, typeof converterDialectsBuild> {
    
    constructor(
        metadata: EntityMetadata<E>, 
        relationTree: EntityRelationTree<E>, 
        dialect: keyof ConverterDialectsBuild<typeof converterDialectsBuild>
    ) {
        super(metadata, relationTree, dialect)
        
        // set entity type (attribute types) converters for poosible dialects
        this.converterDialectsBuild = converterDialectsBuild

        // set entity converter function dialects
        this.entityConverterDialects = {
            mysql: extractMysqlEntityConverters(),
            sqlite: extractSqliteEntityConverters(),
            postgres: extractPostgresEntityConverters(),
            mariadb: extractMariadbEntityConverters()
        }

        // create attribute type converters
        this.converters = this.converterFactory(this.converterDialectsBuild[dialect])

        // set entity converters accordingly to dialect
        this.entityConverters = this.entityConverterDialects[dialect]
    }
    
    asEntity<Q extends Query<E>>(row: T | null): E;
    asEntity<Q extends Query<E>>(row: T | null, query: Q): EntityProjection<E, Q> | null;
    asEntity<Q extends Query<E>>(row: T | null, query?: Q): E | EntityProjection<E, Q> | null {
        return this.entityConverters.asEntity.call(this, row, query) 
    }

    asEntities<Q extends Query<E>>(rows: T[], query?: Q) {
        return this.entityConverters.asEntities.call(this, rows, query) as unknown as EntityProjection<E, Q>[]
    }
}
