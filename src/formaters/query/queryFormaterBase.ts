import { EntityBase } from '../../types/entity/Root'
import { EntityMetadata, EntityRelationTree } from '../../types/entity/Metadata'
import { Query, ConvertersBuild,  
    QueryConvertObject, QueryConverterConfig, OverridesQueryConverterConfig 
} from '../../types/entity/Query'
import { overrideObject } from '../../lib/override'
import { defaultConfig, validationOn, validationOff } from './config'

export abstract class QueryFormaterBase<
    E extends EntityBase,
    T, // model class
    F = unknown // object with formated query suitable for orm specific query processing
> {
    
    public convertersBuild!: ConvertersBuild<F>;
    public queryConvertObject!: QueryConvertObject<E, F>
    public config: QueryConverterConfig
    
    constructor(
        public metadata: EntityMetadata<E>,
        public relationTree: EntityRelationTree<E>,
        config?: OverridesQueryConverterConfig
    ) {
        this.config = config ? this._overrideConfig(defaultConfig, config) : defaultConfig
    }

    private _overrideConfig(target: QueryConverterConfig, source: OverridesQueryConverterConfig): QueryConverterConfig {
        const normalized = { ...source } as Record<string, unknown>
        if (source.hasOwnProperty('validation')) {
            const validation = source.validation
            normalized.validation = validation === true
                ? validationOn
                : validation === false
                    ? validationOff
                    : validation
        }
        return overrideObject(target, normalized) as QueryConverterConfig
    }

    public abstract formatQuery<Q extends Query<E>>(query: Q): F
}


