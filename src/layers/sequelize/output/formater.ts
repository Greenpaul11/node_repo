import { EntityBase } from '../../../types/entity/Root'
import { EntityMetadata, EntityRelationTree } from '../../../types/entity/Metadata'
import { EntityProjection, Query } from '../../../types/entity/Query'
import { ConverterDialectsBuild } from '../../../types/entity/Converters'
import { OutputFormaterBase } from '../../../formaters/output/outputFormaterBase'
import { 
    Model, InferAttributes, InferCreationAttributes 
} from 'sequelize'

import mysqlConverterBuild from '../dialects/mysql/build'
import sqliteConverterBuild from '../dialects/sqlite/build'
import extractMysqlFuntions from '../dialects/mysql/functions'
import extractSqliteFuntions from '../dialects/mysql/functions'

// define dialect converters build
export const converterDialectsBuild = {
    mysql: mysqlConverterBuild,
    sqlite: sqliteConverterBuild
}


export class OutputFormater<
    E extends EntityBase,
    T extends Model<InferAttributes<T>, InferCreationAttributes<T>>
> extends OutputFormaterBase<E, T, typeof converterDialectsBuild> {
    
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
