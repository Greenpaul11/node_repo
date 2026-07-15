import { NonUndefined, NullableFromObject, NonNullableFromObject, PickByType
} from '../Global'
import { EntityBase, ExternalReferences, EntityNoExternal, AggregateBase } from './Root'
import { EntityMetadata } from './Metadata'
import { EntityTransform } from './Converters'
import { ConfigTypes } from '../Config'
import Decimal from 'decimal.js'


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


export type QueryFormaterBaseConfig = {
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
    QueryRangeAttributeTransform<E, F> 
    //QueryRelationTransform<E, F> &
    //QueryAttributeTransform<E>


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


export type QueryEntityAttributeValidator<E extends EntityBase> = 
    <K extends keyof EntityQueryable<E>>(value: unknown, attribute: K) => EntityQueryable<E>[K] 

export type QueryRangeValidator<E extends EntityBase> = 
    <K extends keyof EntityQueryRangeAttributes<E>>(value: unknown, attribute: K) => EntityQueryRangeAttributes<E>[K] 





export type QueryRelationTransform<E extends EntityBase, F> = {
    [K in keyof ExternalReferences<E>]?: QueryConvertObject<ExternalReferences<E>[K], F>
}

export type QueryAttributeTransform<E extends EntityBase, Q extends Query<E> = Query<E>> = {
    [K in keyof QueryAttributes<E>]: {
        validate: (value: Q[K]) => Q[K] 
        transform: (value: Q[K]) => any
    }
}

export type ConvertersBuild<E extends EntityBase, F> = {
    baseAttributes: {
        [Key in keyof QueryEntityAttributeTypes]: 
            <K extends keyof EntityQueryable<E>>(
                value: unknown, 
                converted: F, 
                attribute: K, 
                validate?: QueryEntityAttributeValidator<E>
            ) => F
    }
    rangeAttributes: {
        [Key in keyof QueryRangeAttributeTypes]:
            <K extends keyof PickByType<E, QueryRangeAttributeTypes[Key]>>(
                value: unknown, 
                converted: F, 
                suffix: '_from' | '_to',  
                attribute: K, 
                validate?: QueryRangeValidator<E>
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
    order?: QuerySort<E>
    group?: QuerySort<E>
    aggregate?: boolean
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
    (keyof E | QueryFunctions<E>)[] | { exclude: (keyof EntityNoExternal<E>)[]}

/**
 * Maps aggregate functions into a tuple form.
 * The resulting type is a union of tuples where:
 * - the first element is the function name
 * - the second element is the function target
 *
 * @example
 *  - ['$count', '*'] => apply COUNT for all columns
 *  - ['$sum', 'price'] => apply SUM for column price
 *  - ['$count', ['shop', 'id']] 
 *      => apply COUNT to the related entity "shop", counting its "id" field.
 *  - ['$min', ['user', ['product', ['prices', 'price']]]] 
 *      =>  apply MIN to "price" inside "prices" inside "product" inside "user"
 *      (arbitrarily deep nested relation).
 */
export type QueryFunctions<E extends EntityBase> = {
   [Key in keyof AggregateFunctions<E>]: [Key, AggregateFunctions<E>[Key]] 
}[keyof AggregateFunctions<E>]

/**
 * AggregateFunctions defines aggregate functions that
 * can be applied to an entity query.
 *
 * Available functions:
 * - $count: counts rows or related entities
 * - $sum: sums numeric fields
 * - $avg: averages numeric fields
 * - $min: minimum numeric value or earliest date
 * - $max: maximum numeric value or latest date
 *
 * Used in {@link QuerySelect}.
 */
export type AggregateFunctions<E extends EntityBase> = {
    $count: FnCount<E>
    $sum: FnNumber<E>
    $avg: FnNumber<E>
    $min: FnNumber<E>
    $max: FnNumber<E>
}

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
    FnMapper<E, keyof PickByType<E, number> >

/**
 * Allows to assign Fn rules(T) to root entity and
 * recursively to related entities. 
 */
export type FnMapper<E extends EntityBase, T> = 
  T | {[Key in keyof ExternalReferences<E>]?: FnPack<E, Key, T>}[keyof ExternalReferences<E>] 

/**
 * Pack Entity external attribute(K) at first index of tuple.
 * At second index pack FnMapper with Fn rules(T)
 */
export type FnPack<E extends EntityBase, K extends keyof ExternalReferences<E>, T> = 
    [K, FnMapper<ExternalReferences<E>[K], T>]

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
> = {[Key in F[number] as AggregateAsKey<Key>]?: AggregateBase[Key[0]]}


/**
 * QuerySort defines the possible sort options for a query.
 * 
 * It can be:
 * - A fully nested `QuerySortOptions` array (supporting recursive relations)
 * - A single `OrderOptions` string (ordering fields or aggregates)
 * - A single `GroupOptions` string (grouping fields)
 * 
 * @example
 * ["by name asc", "by id desc"]
 * or in relation
 * { user: ["by active desc"] }
 */
export type QuerySort<E extends EntityBase> = 
    QuerySortOptions<E> | OrderOptions<E> | GroupOptions<E>

/**
 * QuerySortOptions is an array of sorting options for a query.
 * 
 * Each element can be:
 * - An OrderOptions string as field, aggregate, or null-aware ordering
 * - A GroupOptions string as field
 * - A nested object for relations, where keys are relation names and values are
 *   further QuerySortOptions. This allows recursive sorting on related entities.
 * 
 * @example
 * [
 *   "by name asc",
 *   { price: ["by created desc", "by price_count desc"] }
 * ]
 */
export type QuerySortOptions<E extends EntityBase> = 
    Array<
    | OrderOptions<E>
    | GroupOptions<E>
    | {
        [Key in keyof ExternalReferences<E>]?: QuerySortOptions<ExternalReferences<E>[Key]>
    } >

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
 * "by product_count desc"
 * "by price_avg asc"
 * "by created_max desc"
 */
export type OrderAggregateOptions<E extends EntityBase> = 
    // all attributes
      `by ${keyof NonNullableFromObject<EntityNoExternal<E>> & string}_count asc`
    | `by ${keyof NonNullableFromObject<EntityNoExternal<E>> & string}_count desc`
    
    // number and decimal attributes
    | `by ${keyof PickByType<NonNullableFromObject<EntityNoExternal<E>>, number 
        | Decimal> & string}_sum asc`
    | `by ${keyof PickByType<NonNullableFromObject<EntityNoExternal<E>>, number 
        | Decimal> & string}_sum desc`
    | `by ${keyof PickByType<NonNullableFromObject<EntityNoExternal<E>>, number 
        | Decimal> & string}_avg asc`
    | `by ${keyof PickByType<NonNullableFromObject<EntityNoExternal<E>>, number 
        | Decimal> & string}_avg desc`
    
    // number, decimal and Date attributes
    | `by ${keyof PickByType<NonNullableFromObject<EntityNoExternal<E>>, number 
        | Decimal | Date> & string}_max asc`
    | `by ${keyof PickByType<NonNullableFromObject<EntityNoExternal<E>>, number 
        | Decimal | Date> & string}_max desc`
    | `by ${keyof PickByType<NonNullableFromObject<EntityNoExternal<E>>, number 
        | Decimal | Date> & string}_min asc`
    | `by ${keyof PickByType<NonNullableFromObject<EntityNoExternal<E>>, number 
        | Decimal | Date> & string}_min desc`

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
 * QueryFunctionHandler maps aggregate function names
 * ($count, $sum, $avg, $min, $max) to handler functions.
 *
 * Each handler receives:
 * - `metadata`: EntityMetadata<E> — information about the entity and its relations
 * - `query`: FnCount<E> or FnNumber<E> — the fields to aggregate 
 *    look at {@link FnCount}, {@link FnNumber}  
 */
export type QueryFunctionHandler<T, E extends EntityBase> = {
    '$count': (metadata: EntityMetadata<E>, query: FnCount<E>) => T;
    '$sum':   (metadata: EntityMetadata<E>, query: FnNumber<E>) => T;
    '$avg':   (metadata: EntityMetadata<E>, query: FnNumber<E>) => T;
    '$min':   (metadata: EntityMetadata<E>, query: FnNumber<E>) => T;
    '$max':   (metadata: EntityMetadata<E>, query: FnNumber<E>) => T;
};

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
            ? EntityAggregateAttributes<E, FnKeysOnly<E, S>> & Required<Pick<E, EntityKeysOnly<E, S>>>
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