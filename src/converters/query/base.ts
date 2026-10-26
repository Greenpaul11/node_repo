import { EntityBase } from '../../types/entity/Root.js'
import { EntityMetadata, EntityRelationTree } from '../../types/entity/Metadata.js'
import { Query, ConvertersBuild,  
    QueryConvertObject, QueryConverterConfig, OverridesQueryConverterConfig, 
    ConverterDialectsBuild
} from '../../types/entity/Query.js'
import { overrideObject } from '../../lib/override.js'
import defaultConfig from './config.js'
import { DialectOptions } from '../../types/Registry.js'

/**
 * Base class that defines the main properties and methods for converting
 * high-level application queries into ORM-specific query representations.
 *
 * Subclasses derived from this class provide the implementation for a
 * specific ORM layout (e.g. Sequelize, Prisma). Every subclass is named
 * `QueryConverter`; what distinguishes one subclass from another is the
 * directory tree it is imported from.
 *
 * `QueryConverterBase` sits between the application layer — which uses
 * structured {@link Query} objects to express data access intent — and
 * the data layer, which requires ORM-specific query formats. 
 * It owns three responsibilities:
 *
 *  1. **Query conversion** — transforms a typed {@link Query} into an
 *     ORM-specific representation (e.g. sequelize FindOptions).
 *  2. **Converter configuration** — builds the converter configuration for
 *     the active dialect, including validation rules and transformation logic.
 *  3. **Dialect-aware processing** — ensures that each dialect's supported
 *     query features are properly handled (e.g., custom operators, function calls).
 *
 * Concrete subclasses (e.g., the Sequelize `QueryConverter`) implement
 * {@link convertQuery} using configuration and utilities provided by this base.
 *
 * @typeParam E - The typed entity shape used in queries (must extend
 *                {@link EntityBase}).
 * @typeParam T - The ORM-specific model class or type (e.g. a Sequelize `Model`).
 * @typeParam F - The format of the converted query suitable for the ORM layer,
 *                (e.g. Sequelize FindOptions).
 * @typeParam C - The dialect build configuration type. Defaults to
 *                {@link ConverterDialectsBuild} of `F`. Each key of `C`
 *                corresponds to a supported dialect (e.g. `"mysql"`, `"sqlite"`).
 *
 * @example
 * Subclassing for the Sequelize ORM:
 * ```ts
 * class QueryConverter<E extends EntityBase, T extends Model<...>, F> extends QueryConverterBase<E, T> {
 *
 *     // ... Sequelize-specific implementation ...
 *
 *     convertQuery<Q extends Query<E>>(query: Q): F {
 *         return this.buildSql(query);
 *     }
 * }
 * ```
 */
export abstract class QueryConverterBase<
    E extends EntityBase,
    T, // model class
    F = unknown, // object with formated query suitable for orm specific query processing
    C extends ConverterDialectsBuild<F, C> = ConverterDialectsBuild<F>
> {
    /**
     * Dialect-keyed view of converter configurations for building ORM queries.
     * Each key is a dialect name and its value contains the build-time settings
     * for converting queries into that dialect's format.
     */
    public queryConverterDialects!: C

    /**
     * The full converters build configuration implemented by subclasses.
     */
    public convertersBuild!: ConvertersBuild<F>
    
    /**
     * The compiled query conversion object for the current entity and dialect.
     * This is typically built during initialization or on-demand via
     * {@link buildEntityAttributeConverters}.
     */
    public queryConvertObject!: QueryConvertObject<E, F>
    
    /**
     * Configuration options for this converter instance.
     * Includes settings such as validation behavior, logging, etc.
     */
    public config: QueryConverterConfig
    
    /**
     * @param metadata        Metadata describing base attributes and relations
     *                        of the entity.
     * @param relationTree    Relation tree derived from `metadata`; controls
     *                        nested query mapping.
     * @param dialect         Active dialect key. Must be a key of `C`
     *                        (e.g. `"mysql"`, `"postgres"`).
     * @param config          Optional override configuration for this converter.
     */
    constructor(
        public metadata: EntityMetadata<E>,
        public relationTree: EntityRelationTree<E>,
        public dialect: DialectOptions,
        config?: OverridesQueryConverterConfig
    ) {
        this.config = config ? this._overrideConfig(defaultConfig, config) : defaultConfig
    }
    
    /**
     * Override default configuration with provided values.
     *
     * Normalizes boolean `validation` settings into full validation objects
     * before merging with defaults using {@link overrideObject}.
     *
     * @param target - Default configuration object.
     * @param source - User-provided override configuration.
     * @returns Merged configuration.
     */
    private _overrideConfig(target: QueryConverterConfig, source: OverridesQueryConverterConfig): QueryConverterConfig {
        const setValidation = source.validation
        if (setValidation === true) {
            const validation: QueryConverterConfig['validation'] = JSON.parse(JSON.stringify(defaultConfig.validation))
            Object.values(validation).forEach((group: Record<string, boolean>) => 
                Object.keys(group).forEach((key) => group[key] = true)
            )
            source['validation'] = validation
        }
        return overrideObject(target, source) as QueryConverterConfig
    }
    
    /**
     * Convert a typed {@link Query} into an ORM-specific format suitable for
     * execution by specific orm engine. This method must be implemented 
     * by each subclass.
     *
     * @param query - The input query object of domain type {@link Query} describing desired selection,
     *                filtering, ordering, etc.
     * @returns An ORM-specific representation of the query (e.g. sequelize FindOptions object).
     */
    public abstract convertQuery<Q extends Query<E>>(query: Q): F
}


