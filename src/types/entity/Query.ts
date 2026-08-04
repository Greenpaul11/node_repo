import { 
    NonUndefined, NullableFromObject, NonNullableFromObject, PickByType, 
    DeepPartial, DeepStringArray,
    DeepStringTuple
} from '../Global'
import { EntityBase, ExternalReferences, EntityNoExternal, AggregateBase } from './Root'
import { EntityMetadata, SortOptions } from './Metadata'
import { EntityTransform } from './Converters'
import { ConfigTypes, NumberLike } from '../Config'
import Decimal from 'decimal.js'
import type { Model, InferAttributes, InferCreationAttributes } from 'sequelize'


/**
 * Represents a flexible value type for entity query attribute.
 * Mostly used in  {@link EntityQueryable}.
 */
export type Queryable<T> = NonUndefined<T> | NonUndefined<T>[] | string | string[]

/**
 * Transform attributes type to the one that is accepted in query process.
 */
export type EntityAsQuery<E extends EntityBase> = 
    EntityTransform<E, ConfigTypes['entityQueryTransform']>

/**
 * Generates range query attributes for Date fields.
 * Creates "_from" and "_to" variants for each date field in the entity.
 * Example: { created_from?: Date, created_to?: Date }
 */
export type EntityQueryDateRangeAttributes<E extends EntityBase> = {
    [Key in keyof PickByType<EntityNoExternal<E>, Date> as `${Key & string}_from` 
            | `${Key & string}_to`]? 
        : Date | string
} 

/**
 * Generates range query attributes for Number fields.
 * Creates "_from" and "_to" variants for each number field in the entity.
 * Example: { price_from?: number, price_to?: number }
 */
export type EntityQueryNumberRangeAttributes<E extends EntityBase> = {
    [Key in keyof PickByType<EntityNoExternal<E>, number | Decimal> as `${Key & string}_from` 
        | `${Key & string}_to`]? 
    : number | string;
} 

export type EntityRangeAttributes<E extends EntityBase, T extends number | Date | Decimal> = {
    [Key in keyof PickByType<EntityNoExternal<E>, T> as `${Key & string}_from` 
        | `${Key & string}_to`] 
    : T | string
}

/**
 * Combines date and number range attributes into a single type.
 * Provides extended query capabilities for filtering entities by ranges.
 */
export type EntityQueryRangeAttributes<E extends EntityBase> = 
    EntityRangeAttributes<E, number | Date | Decimal>  

/**
 * Query attributes for an entity.
 * Take entity attributes without External References and turn them to queryable.
 * Used as foundation for building complex query types.
 */
export type EntityQueryable<E extends EntityBase> = {
    [Key in keyof EntityNoExternal<E>]?: Queryable<EntityAsQuery<E>[Key]>
} 

/**
 * Entity query type combining entity attributes, extended attributes.
 * All possible attributes of this type are related to entity by itself.
 */
 export type EntityQuery<E extends EntityBase> = 
    EntityQueryable<E> & Partial<EntityQueryRangeAttributes<E>>  

/**
  * Complete query type combining entity attributes, extended attributes, and query controls.
  * Attributes that are {@link ExternalReferences} are assigned to its own query.
  * This is the main type used for building database queries with filtering, pagination, and sorting.
  */
 export type Query<E extends EntityBase> = 
     EntityQuery<E> & QueryAttributes<E> & {
         [Key in keyof ExternalReferences<E>]?: Query<ExternalReferences<E>[Key]>
     }

/**
 * QueryBaseSelect used when you want to explicitly 
 * - select/exclude certain fields of an entity,
 * - include external references
 * Suitable for less query-demanding functions.
 */
export type QueryBaseSelect<E extends EntityBase> =
    Omit<Query<E>, 'search_in' | 'order' | 'group' | 'aggregate'>


export type QueryControl<T> =
    T extends Model<InferAttributes<any>, InferCreationAttributes<any>>
        ?   {
                native: boolean
            }
        : { native: boolean}
     
export type QueryConverterConfig = {
    validation: {
        baseAttributes: {
            string: boolean
            number: boolean
            date: boolean
            boolean: boolean
        }
        rangeAttributes: {
            number: boolean
            date: boolean
        }
        queryAttributes: {
            select: boolean
            order: boolean
            group: boolean
        }
    }
    subEntityRelationDepth: number
}

export type OverridesQueryConverterConfig = DeepPartial<QueryConverterConfig> & {
    validation?: boolean | DeepPartial<QueryConverterConfig['validation']> & {
        baseAttributes?: boolean | DeepPartial<QueryConverterConfig['validation']['baseAttributes']>
        rangeAttributes?: boolean | DeepPartial<QueryConverterConfig['validation']['rangeAttributes']>
        queryAttributes?: boolean | DeepPartial<QueryConverterConfig['validation']['queryAttributes']>
    }
}

export type QueryEntityAttributeTypes = {
    string: string
    number: number | Decimal
    date: Date
    boolean: boolean
}

export type QueryRangeAttributeTypes = {
    number: number | Decimal
    date: Date
}

export type QueryConvertObject<E extends EntityBase, F> =
    QueryEntityAttributeTransform<E, F> &
    QueryRangeAttributeTransform<E, F> &
    QueryAttributeTransform<F> &
    QueryRelationTransform<E, F> 
    


export type QueryEntityAttributeTransform<E extends EntityBase, F> = 
    QueryEntityAttributeTypeTransform<E, 'string', F> &
    QueryEntityAttributeTypeTransform<E, 'number', F> &
    QueryEntityAttributeTypeTransform<E, 'date', F> &
    QueryEntityAttributeTypeTransform<E, 'boolean', F>

export type QueryEntityAttributeTypeTransform<E extends EntityBase, K extends keyof QueryEntityAttributeTypes, F> = {
    [Key in keyof PickByType<E, QueryEntityAttributeTypes[K]>]: {
        convert: (value: unknown, converted: F) => F
    }
}


export type QueryRangeAttributeTransform<E extends EntityBase, F> =
    QueryRangeAttributeTypeTransform<E, 'number', F> &
    QueryRangeAttributeTypeTransform<E, 'date', F>

export type QueryRangeAttributeTypeTransform<E extends EntityBase, K extends keyof QueryRangeAttributeTypes, F> = {
    [Key in keyof EntityRangeAttributes<E, QueryRangeAttributeTypes[K]>]: {
        convert: (value: unknown, converted: F) => F
    }
}

export type QueryAttributeTransform<F> = {
    select: {
        convert: (value: unknown, converted: F) => F
    }
    order: {
        convert: (value: unknown, converted: F) => F
    }
    group: {
        convert: (value: unknown, converted: F) => F
    }
}


export type QueryEntityAttributeValidator<E extends EntityBase> = 
    <K extends keyof EntityQueryable<E>>(value: unknown, attribute: K) => EntityQueryable<E>[K] 

export type QueryRangeValidator<E extends EntityBase> = 
    <K extends keyof EntityQueryRangeAttributes<E>>(value: unknown, attribute: K) => EntityQueryRangeAttributes<E>[K] 

export type QuerySelectValidator<E extends EntityBase> = 
    (value: unknown, attributes: Array<keyof EntityNoExternal<E>>) => void 

export type QuerySortValidator = 
    (value: unknown, depth?: number) => void 


export type QueryRelationTransform<E extends EntityBase, F> = {
    [K in keyof ExternalReferences<E>]: {
        queryConvertObject: QueryConvertObject<ExternalReferences<E>[K], F> 
        convert: (value: unknown, converted: F) => F
    }
}


export type ConvertersBuild<F> = {
    baseAttributes: {
        [Key in keyof QueryEntityAttributeTypes]: 
            <E extends EntityBase, K extends keyof EntityQueryable<E>>(
                value: unknown, 
                converted: F, 
                attribute: K, 
                nested: boolean,
                validate?: QueryEntityAttributeValidator<E>
            ) => F
    }
    rangeAttributes: {
        [Key in keyof QueryRangeAttributeTypes]:
            <E extends EntityBase, K extends keyof PickByType<E, QueryRangeAttributeTypes[Key]>>(
                value: unknown, 
                converted: F, 
                suffix: '_from' | '_to',  
                attribute: K, 
                nested: boolean,
                validate?: QueryRangeValidator<E>
            ) => F
    }
    queryAttributes: {
        select: <E extends EntityBase>(
            value: unknown, 
            converted: F, 
            metadata: EntityMetadata<E>,
            nested: boolean,
            validate?: QuerySelectValidator<E>
        ) => F,
        order: <E extends EntityBase>(
            value: unknown, 
            converted: F, 
            metadata: EntityMetadata<E>,
            nested: boolean,
            validate?: QuerySortValidator
        ) => F
        group: <E extends EntityBase>(
            value: unknown, 
            converted: F, 
            metadata: EntityMetadata<E>,
            validate?: QuerySortValidator
        ) => F
    },
    relationAttributes: {
        relations: <E extends EntityBase, K extends keyof ExternalReferences<E>>(
           value: unknown,
           converted: F,
           attribute: K,
           queryConvertObject: QueryConvertObject<ExternalReferences<E>[K], F>
        ) => F
    }
    
}

/**
 * Additional query attributes for pagination, sorting, and filtering.
 * These are not part of the entity but control how query results are processed.
 */
export type QueryAttributes<E extends EntityBase> = {
    select?: QuerySelect<E>
    search_in?: Partial<PickByType<E, string>>
    order?: QueryOrderOptions<E>
    group?: QueryGroupOptions<E>
}

/**
 * Defines which fields or computed values should be returned in a query.
 *
 * Can be:
 * - An array of:
 *   - Entity field names (`keyof E`)
 *   - Aggregation/query functions (`QueryFunctions`)
 * - Or an object with an `exclude` property to omit specific fields
 *
 * @example
 * ['id', 'name', { $count: '*' }]
 * { exclude: ['password'] }
 */
export type QuerySelect<E extends EntityBase> = 
    (keyof EntityNoExternal<E> | QueryFunctions<E>)[] | { exclude: (keyof EntityNoExternal<E>)[]}

/**
 * QueryFunctions maps aggregate functions into a tuple form.  
 * Each tuple pairs:
 * - the aggregate function name (e.g., "$count", "$sum")
 * - the function target, which may be a field of the current entity or a
 *   recursively nested path into related entities.
 *
 * This structure allows expressing simple aggregates as well as deeply nested
 * aggregation chains across multiple relations.
 *
 * @example
 * // Count all rows:
 * ["$count", "*"]
 *
 * // Sum a numeric field:
 * ["$sum", "price"]
 *
 * // Count a related entity:
 * ["$count", ["shop", "id"]]
 *
 * // Deeply nested aggregation:
 * // MIN(price) inside prices → inside product → inside user
 * ["$min", ["user", ["product", ["prices", "price"]]]]
 */
export type QueryFunctions<E extends EntityBase> =
    | ["$count", FnCount<E>]
    | ["$sum", FnNumber<E>]
    | ["$avg", FnNumber<E>]
    | ["$min", FnNumber<E>]
    | ["$max", FnNumber<E>]

/**
 * FnCount defines what can be counted(options accepted by COUNT):
 * - '*' to count all rows
 * - any base attribute of the entity (`keyof EntityNoExternal<E>`)
 * - related entities, which may contain nested count options (recursive)
 *
 * @example
 * - count all rows: '*'
 * - count by attribute: 'id' | 'created'
 * - count related entities: ['prices', '*']
 */
export type FnCount<E extends EntityBase> = 
    FnMapper<E, '*' | keyof EntityNoExternal<E>>

/**
 * FnNumber defines base attributes of entity that are type of number
 * (options accepted by SUM, AVG, MIN, MAX)
 * - 'id' | 'price' | etc..
 */
export type FnNumber<E extends EntityBase> = 
    FnMapper<E, keyof PickByType<E, NumberLike> >

/**
 * FnExternal defines function‑compatible rules applied to related (external)
 * entities. Each key corresponds to a relation of the current entity, and the
 * value is a {@link DeepStringTuple} describing the function target within that
 * relation.
 *
 * A {@link DeepStringTuple} may be:
 * - a single string, representing a field of the related entity
 * - a nested tuple structure, representing deeper traversal through multiple
 *   related entities until reaching the final target field
 *
 * This enables COUNT, SUM, AVG, MIN, MAX, and similar functions to be applied
 * recursively across external relations, forming deep aggregation chains.
 *
 * @example
 * // Count all related "prices":
 * ["prices", "*"]
 *
 * // Count a nested relation:
 * ["orders", ["items", "*"]]
 *
 * // Deeply nested aggregation:
 * // MIN(price) inside prices → inside product → inside user
 * ["user", ["product", ["prices", "price"]]]
 */
export type FnExternal<E extends EntityBase> =
    { [Key in keyof ExternalReferences<E>]?: [Key, DeepStringTuple] }[keyof ExternalReferences<E>];

/**
 * FnMapper assigns a function rule (`T`) to the root entity and optionally to
 * any of its related entities. It supports both direct function inputs and
 * recursive aggregation rules across external relations.
 *
 * A value may be either:
 * - `T`, representing the function input applied directly to the current entity.
 * - A {@link FnExternal} mapping that applies function rules to related entities,
 *   allowing nested, multi‑level aggregation.
 *
 * This structure provides a unified way to express COUNT, SUM, AVG, MIN, MAX,
 * and similar function inputs across both the primary entity and its relations.
 *
 * @example
 * // Direct function input:
 * "id"
 *
 * // Count all rows:
 * "*"
 *
 * // Count related entities:
 * ["prices", "*"]
 *
 * // Deeply nested aggregation:
 * ["orders", ["items", ["*"]]]
 */
export type FnMapper<E extends EntityBase, T> =
    T | FnExternal<E>;

/**
 * Recursively builds a dotted-notation key from nested function targets.
 * Limit recursion to 3 level, after that allow string
 * 
 * @example
 * ['prices', 'id'] => 'prices_id'
 * ['prices', ['details', 'id']] => 'prices_details_id'
 */
export type FnNestedSubkey<T extends [string, unknown], D extends readonly number[] = [0, 1, 2]> = 
    D['length'] extends 0
        ? string
        : T extends [infer External extends string, infer Target]
            ? `${External}_${Target extends string
                ? Target
                : Target extends [string, unknown]
                    ? FnNestedSubkey<Target, Tail<D>>
                    : never
            }`
            : never
            
/**
 * Extracts all elements except the first from a tuple type.
 */
type Tail<T extends readonly number[]> = T extends readonly [unknown, ...infer Rest] ? Rest : []

/**
 * Transforms a QueryFunctions tuple into its output key format.
 * 
 * @example
 * ['$count', 'id'] => '$count_id'
 * ['$count', ['prices', 'id']] => '$count_prices_id'
 * ['$sum', 'price'] => '$sum_price'
 * 
 * Works with tuple structure directly rather than via QueryFunctions constraint.
 */
export type AggregateAsKey<T extends [string, unknown]> = 
    T extends [infer Fn extends string, infer Target]
        ? `${Fn}_${Target extends string 
                ? Target
                : Target extends [string, unknown]
                    ? FnNestedSubkey<Target>
                    : never
            }`
        : never

/**
 * Maps function tuples to output record { key: returnType }
 * 
 * @typeParam E - The entity type extending EntityBase.
 * @typeParam F - Union of mapped fn tuples, this type is set to default but
 *                in some scenarios it will be passed 
 *                (when output is mapped in {@link EntityProjection} 
 *                and functions are used selectively). 
 */
export type EntityAggregateAttributes<
    E extends EntityBase,
    F extends QueryFunctions<E>[] = QueryFunctions<E>[]
> = {[Key in F[number] as AggregateAsKey<Key>]: AggregateBase[Key[0]]}

/**
 * QueryGroupOptions defines the grouping rules that can be applied to an
 * entity query. It supports both simple single‑field grouping and complex,
 * multi‑level grouping across related entities.
 *
 * A value may be either:
 * - A single {@link GroupOptions} string, when only one entity field is used
 *   for grouping.
 * - An array containing any mix of:
 *     - {@link GroupOptions} strings for grouping by fields of the current entity.
 *     - {@link QuerySortExternal} tuples for grouping by related (external)
 *       entities, including deeply nested grouping chains.
 *
 * This flexible structure allows queries to express anything from a simple
 * “group by field” to a fully hierarchical grouping strategy spanning multiple
 * related entities.
 *
 * @example
 * // Simple grouping:
 * "by category"
 *
 * // Multi‑level grouping across related entities:
 * [
 *   "by category",
 *   ["prices", ["shop", ["by founded"]]]
 * ]
 */
export type QueryGroupOptions<E extends EntityBase> =
    GroupOptions<E> |
    Array<
        | GroupOptions<E>
        | QuerySortExternal<E>
    >;

/**
 * QueryOrderOptions defines the ordering rules that can be applied to an
 * entity query. It supports both simple single‑field ordering and complex,
 * multi‑level ordering across related entities.
 *
 * A value may be either:
 * - A single {@link OrderOptions} string, when only one ordering rule
 *   is required.
 * - An array containing any mix of:
 *     - {@link OrderOptions} strings describing attribute, nullable‑aware,
 *       or aggregate ordering on the current entity.
 *     - {@link QuerySortExternal} tuples describing ordering applied to
 *       related (external) entities, including deeply nested sort chains.
 *
 * This flexible structure allows queries to express anything from a simple
 * “order by field” to a fully hierarchical ordering strategy spanning multiple
 * related entities.
 *
 * @example
 * // Simple ordering:
 * "by name asc"
 *
 * // Multi‑level ordering across related entities:
 * [
 *   "by name asc",
 *   ["prices", ["by price",["shop", ["by founded", "by created"]]]],
 *   "by $avg_price desc"
 * ]
 */
export type QueryOrderOptions<E extends EntityBase> =
    OrderOptions<E> |
    Array<
        | OrderOptions<E>
        | QuerySortExternal<E>
    >;

/**
 * A tuple describing the sorting configuration for an external (related) entity.
 *
 * - The first element is the related entity key (`Key`).
 * - The second element is a {@link DeepStringArray}, representing deeply nested
 *   {@link QuerySortOptions}. This recursive structure is used as a safe
 *   replacement for nested tuples, which cause key‑widening issues when
 *   distributed over mapped types.
 *
 * @example
 * // Nested sort rules applied to the "price" related entity:
 * ["prices", ["shop", ["by founded", "by created"]]]
 */
export type QuerySortExternal<
    E extends EntityBase
> = {
    [Key in keyof ExternalReferences<E>]: [Key, DeepStringArray]
}[keyof ExternalReferences<E>];

/**
 * OrderOptions is the union of all possible ordering expressions.
 * 
 * It includes:
 * - Simple attribute ordering
 * - Nullable-aware ordering
 * - Aggregate ordering (_count, _sum, _avg, _min, _max)
 */
export type OrderOptions<E extends EntityBase> = 
      OrderAttributeOptions<E>
    | OrderAttributeOptionsWithNulls<E>
    | OrderAggregateOptions<E>

/**
 * OrderAttributeOptions defines simple ascending/descending ordering
 * on any field of the entity.
 * 
 * @example
 * "by name asc"
 * "by price desc"
 */
export type OrderAttributeOptions<E extends EntityBase> = 
      `by ${keyof EntityNoExternal<E> & string} asc`
    | `by ${keyof EntityNoExternal<E> & string} desc`

/**
 * OrderAttributeOptionsWithNulls defines ordering on nullable fields,
 * including SQL null sorting options (`nulls first` / `nulls last`).
 * 
 * @example
 * "by nickname asc nulls first"
 * "by nickname desc nulls last"
 * 
 * Only nullable fields appear here.
 */
export type OrderAttributeOptionsWithNulls<E extends EntityBase> = 
      `by ${keyof NullableFromObject<EntityNoExternal<E>> & string} asc nulls first`
    | `by ${keyof NullableFromObject<EntityNoExternal<E>> & string} asc nulls last`
    | `by ${keyof NullableFromObject<EntityNoExternal<E>> & string} desc nulls first`
    | `by ${keyof NullableFromObject<EntityNoExternal<E>> & string} desc nulls last`

/**
 * OrderAggregateOptions defines ordering based on aggregate values.
 * 
 * Supports:
 * - _count on any non-nullable field
 * - _sum / _avg on numeric or Decimal fields
 * - _min / _max on numeric, Decimal, or Date fields
 * 
 * @example:
 * "by $count_product desc"
 * "by $avg_price asc"
 * "by $max_created desc"
 */
export type OrderAggregateOptions<E extends EntityBase> = 
    // all attributes
      `by $count_${keyof NonNullableFromObject<EntityNoExternal<E>> & string} asc`
    | `by $count_${keyof NonNullableFromObject<EntityNoExternal<E>> & string} desc`
    
    // number and decimal attributes
    | `by $sum_${keyof PickByType<NonNullableFromObject<EntityNoExternal<E>>, number 
        | Decimal> & string} asc`
    | `by $sum_${keyof PickByType<NonNullableFromObject<EntityNoExternal<E>>, number 
        | Decimal> & string} desc`
    | `by $avg_${keyof PickByType<NonNullableFromObject<EntityNoExternal<E>>, number 
        | Decimal> & string} asc`
    | `by $avg_${keyof PickByType<NonNullableFromObject<EntityNoExternal<E>>, number 
        | Decimal> & string} desc`
    
    // number, decimal and Date attributes
    | `by $max_${keyof PickByType<NonNullableFromObject<EntityNoExternal<E>>, number 
        | Decimal | Date> & string} asc`
    | `by $max_${keyof PickByType<NonNullableFromObject<EntityNoExternal<E>>, number 
        | Decimal | Date> & string} desc`
    | `by $min_${keyof PickByType<NonNullableFromObject<EntityNoExternal<E>>, number 
        | Decimal | Date> & string} asc`
    | `by $min_${keyof PickByType<NonNullableFromObject<EntityNoExternal<E>>, number 
        | Decimal | Date> & string} desc`

/**
 * GroupOptions defines a single field to group by.
 * 
 * @example
 * "by category"
 * "by user_id"
 */
export type GroupOptions<E extends EntityBase> = 
    `by ${keyof EntityNoExternal<E> & string}`

/**
 * Determine what type of entity will be returned accordingly to Query['select'] attribute.
 * If select attribute present in query - return attributes of entity included in select array.
 * If select is type of object and has exclude property - return attributes 
 * of entity that are not listed in excluded array.
 * If select as array does not contain attributes that are external references 
 * - no attributes that points to seprate entities will be returned unless 
 *      query contains seprate query for external entity
 * By default it returns a single entity without attributes that points to other entities.
 */
export type EntityProjection<E extends EntityBase, Q = {}> = 
    AttributesProjection<E, Q> & ExternalEntitiesProjection<E, Q>

/** 
 * Projects entity fields based on select array or exclude object from Query. 
 * */
export type AttributesProjection<E extends EntityBase, Q> =
    Q extends { select: infer S }
        ? S extends Array<keyof E | QueryFunctions<E>>
            ? EntityAggregateAttributes<E, Array<FnKeysOnly<E, S>>> & Required<Pick<E, EntityKeysOnly<E, S>>>
            : S extends { exclude: infer Z }
               ? Z extends Array<keyof E & keyof ExternalReferences<E>>
                   ? Required<Omit<E, Z[number]>>
                   : Z extends Array<keyof E>
                       ? Omit<Required<Omit<E, Z[number]>>, keyof ExternalReferences<E>>
                       : never
               : EntityNoExternal<E>
        : EntityNoExternal<E>

/** 
 * Projects external entity relations based on query. Handles one-to-one and one-to-many. 
 * */
export type ExternalEntitiesProjection<E extends EntityBase, Q> = {
    [K in keyof ExternalReferences<E> & keyof Q & keyof E]: NonUndefined<E[K]> extends ReadonlyArray<infer U>
        ? U extends EntityBase
            ? EntityProjection<ExternalReferences<E>[K], NonUndefined<Q[K]>>[]
            : never
        : EntityProjection<ExternalReferences<E>[K], NonUndefined<Q[K]>>
}

/** 
 * Extracts entity field keys from select array. 
 * */
type EntityKeysOnly<E, S> = S extends Array<infer T>
    ? T extends keyof E ? T : never
    : never

/** 
 * Extracts function tuple keys from select array. 
 * */
type FnKeysOnly<E extends EntityBase, S> = S extends Array<infer T>
    ? T extends QueryFunctions<E> ? T : never 
    : never

/**
 * Recursively mapped object that has:
 * - select - selected fields of entity(without external references)
 * - optional selects for external references object which is {@link SubMappedSelects} 
 */
export type MapEntitySelect<E extends EntityBase> = {
    select: Array<keyof EntityNoExternal<E>>
    subEntities?: SubMapSelect<E>
    fns?: QueryFunctions<E>[]
}
    

/**
 * Represents possible selects for related entities,
 */
export type SubMapSelect<E extends EntityBase> = {
    [Key in keyof ExternalReferences<E>]?: MapEntitySelect<ExternalReferences<E>[Key]>
}

///**
// * Map {@link QuerySelect} to an object that has:
// * - select - list of entity fields without ones that points to related entities
// * - fns - list of aggregate functions {@link QueryFunctions}
// */
//export type MapEntitySelect<E extends EntityBase> = {
//    select: Array<keyof EntityNoExternal<E>>
//    fns?: QueryFunctions<E>[]
//}