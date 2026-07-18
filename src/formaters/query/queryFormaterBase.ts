import { EntityBase } from '../../types/entity/Root'
import { EntityMetadata, EntityRelationTree } from '../../types/entity/Metadata'
import { Query, QueryEntityAttributeTransform, ConvertersBuild,  
    QueryConvertObject, QueryFormaterBaseConfig, 
    QueryRangeAttributeTransform,
    QueryAttributeTransform} from '../../types/entity/Query'
import { buildEntityAttributeConverters, buildRangeAttributeConverters,
    buildQueryAttributeConverters
 } from './buildConverters'
import defaultConfig from './config'

export abstract class QueryFormaterBase<
    E extends EntityBase,
    T, // model class
    F = unknown // object with formated query suitable for orm specific query processing
> {
    
    public convertersBuild!: ConvertersBuild<E, F>;
    public queryConvertObject!: QueryConvertObject<E, F>
    public config: QueryFormaterBaseConfig;
    
    
    constructor(
        public metadata: EntityMetadata<E>,
        public relationTree: EntityRelationTree<E>,
        config?: QueryFormaterBaseConfig
    ) {
        this.config = config ?? defaultConfig 
    }

    public queryConvertObjectFactory(): QueryConvertObject<E, F>  {

        const baseAttributes: QueryEntityAttributeTransform<E, F> = {
            ...buildEntityAttributeConverters(this.convertersBuild, this.config, this.metadata.stringAttributesList, 'string'),
            ...buildEntityAttributeConverters(this.convertersBuild, this.config, this.metadata.numberAttributesList, 'number'),
            ...buildEntityAttributeConverters(this.convertersBuild, this.config, this.metadata.dateAttributesList, 'date'),
            ...buildEntityAttributeConverters(this.convertersBuild, this.config, this.metadata.booleanAttributesList, 'boolean'),
        }
        const rangeAttributes: QueryRangeAttributeTransform<E, F> = {
            ...buildRangeAttributeConverters(this.convertersBuild, this.config, this.metadata.numberAttributesList, 'number'),
            ...buildRangeAttributeConverters(this.convertersBuild, this.config, this.metadata.dateAttributesList, 'date')
        }
        const queryAttributes: QueryAttributeTransform<E, F> = {
            ...buildQueryAttributeConverters(this.convertersBuild, this.config, this.metadata)
        }
        return {
            ...baseAttributes,
            ...rangeAttributes,
            ...queryAttributes
        }
    }

    public abstract formatQuery<Q extends Query<E>>(query: Q): F
}


