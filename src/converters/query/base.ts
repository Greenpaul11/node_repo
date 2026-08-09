import { EntityBase } from '../../types/entity/Root.js'
import { EntityMetadata, EntityRelationTree } from '../../types/entity/Metadata.js'
import { Query, ConvertersBuild,  
    QueryConvertObject, QueryConverterConfig, OverridesQueryConverterConfig 
} from '../../types/entity/Query.js'
import { overrideObject } from '../../lib/override.js'
import { defaultConfig, validationOn, validationOff } from './config.js'

export abstract class QueryConverterBase<
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

    public abstract convertQuery<Q extends Query<E>>(query: Q): F
}


