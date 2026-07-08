import { EntityBase } from '../../types/entity/Root'
import { EntityMetadata, EntityRelationTree } from '../../types/entity/Metadata'
import { Query, MapEntitySelect, EntityProjection } from '../../types/entity/Query'
import { 
    ConverterFunctions, 
    ConverterFunctionDialects, 
    ConverterFamilesInfer,
    ConverterDialectsBuild } from '../../types/entity/Converters'

export class QueryFormaterBase<
    E extends EntityBase,
    T,
    C extends ConverterDialectsBuild<C> = ConverterDialectsBuild<any>
> {


    constructor(
        public metadata: EntityMetadata<E>,
        public relationTree: EntityRelationTree<E>, 
        public dialect: keyof C
    ) {}
}


