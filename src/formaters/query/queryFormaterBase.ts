import { EntityBase } from '../../types/entity/Root'
import { EntityMetadata, EntityRelationTree } from '../../types/entity/Metadata'
import { Query, QueryEntityAttributeTransform, ConvertersBuild,  
    QueryConvertObject, QueryFormaterBaseConfig } from '../../types/entity/Query'
import { buildEntityAttributeConverters } from './buildConverters'
import defaultConfig from './config'

export abstract class QueryFormaterBase<
    E extends EntityBase,
    T, // model class
    F // object with formated query suitable for orm specific query processing
> {
    
    public convertersBuild!: ConvertersBuild<E, F>;
    public config: QueryFormaterBaseConfig;
    
    
    constructor(
        public metadata: EntityMetadata<E>,
        public relationTree: EntityRelationTree<E>,
        config?: QueryFormaterBaseConfig
    ) {
        this.config = config ?? defaultConfig 
    }



    public queryTransformFactory(): QueryConvertObject<E, F>  {

        const attributeTransform: QueryEntityAttributeTransform<E, F> = {
            ...buildEntityAttributeConverters(this.convertersBuild, this.config, this.metadata.stringAttributesList, 'string'),
            ...buildEntityAttributeConverters(this.convertersBuild, this.config, this.metadata.numberAttributesList, 'number'),
            ...buildEntityAttributeConverters(this.convertersBuild, this.config, this.metadata.dateAttributesList, 'date'),
            ...buildEntityAttributeConverters(this.convertersBuild, this.config, this.metadata.booleanAttributesList, 'boolean'),
        }
        return {
            ...attributeTransform
        }
    }

    public abstract format<Q extends Query<E>>(query: Q): F
}


