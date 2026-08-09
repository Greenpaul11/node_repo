import { EntityBase } from '../../../types/entity/Root.js'
import { EntityMetadata, EntityRelationTree } from '../../../types/entity/Metadata.js'
import { EntityProjection, Query } from '../../../types/entity/Query.js'
import { ConverterDialectsBuild } from '../../../types/entity/Converters.js'
import { OutputConverterBase } from '../../../converters/output/base.js'
import { 
    Model, InferAttributes, InferCreationAttributes 
} from 'sequelize'

import mysqlConverterBuild from '../dialects/mysql/build.js'
import sqliteConverterBuild from '../dialects/sqlite/build.js'
import extractMysqlFuntions from '../dialects/mysql/functions.js'
import extractSqliteFuntions from '../dialects/sqlite/functions.js'

// define dialect converters build
export const converterDialectsBuild = {
    mysql: mysqlConverterBuild,
    sqlite: sqliteConverterBuild
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
        this.converterFunctionDialects = {
            mysql: extractMysqlFuntions(),
            sqlite: extractSqliteFuntions()
        }

        // create attribute type converters
        this.converters = this.converterFactory(this.converterDialectsBuild[dialect])

        // set entity converters accordingly to dialect
        this.converterFunctions = this.converterFunctionDialects[dialect]
    }
    
    asEntity<Q extends Query<E>>(row: T | null): E;
    asEntity<Q extends Query<E>>(row: T | null, query: Q): EntityProjection<E, Q> | null;
    asEntity<Q extends Query<E>>(row: T | null, query?: Q): E | EntityProjection<E, Q> | null {
        return this.converterFunctions.asEntity.call(this, row, query) 
    }

    asEntities<Q extends Query<E>>(rows: T[], query?: Q) {
        return this.converterFunctions.asEntities.call(this, rows, query) as unknown as EntityProjection<E, Q>[]
    }
}
