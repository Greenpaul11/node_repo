import { EntityBase, ExternalReferences, EntityNoExternal, AttributeTypes, 
    AggregateOperators, AggregateBase, EntityExtend } from './Root'
import { SwitchType } from '../Global'
import { AggregateAsKey, Query, EntityAggregateAttributes, QueryFunctions} from './Query'
import { OutputFormaterBase } from '../../formaters/output/outputFormaterBase'
import { EntityConfigAttributes } from './Metadata'


/**
 * Maps aggregate operators to transformed types.
 */
export type AggregateTransform = {
    [Key in AggregateOperators]: unknown
}

/**
 * Represents mapping of {@link AttributeTypes} to their
 * corresponding transformation rules.
 *
 * Value of each key is {@link TransformRule} describing 
 * how values of that type should be converted.
 */
export type AttributeTransformRules = {
    [Key in AttributeTypes]?: TransformRule<any, any>
}

/**
 * Represents mapping of {@link AggregateOperators} to their
 * corresponding transformation rules.
 *
 * Each key corresponds to an aggregate operator (e.g. $sum, $avg),
 * and its value is a {@link TransformRule} describing how results
 * produced by that operator should be transformed.
 */
export type AggregateTransformRules = {
    [Key in AggregateOperators]?: TransformRule<any, any>
}

/**
 * Groups all transformation rule mappings used by an entity.
 *
 * Contains:
 * - {@link AttributeTransformRules} — converters for base (non‑relational) attributes,
 * - {@link AggregateTransformRules} — converters for values produced by aggregate operators.
 *
 * This structure represents the complete set of type‑level conversion rules
 * applied to an entity, covering both attribute‑level transformations and
 * aggregate‑function result transformations.
 */
export type EntityTransformRules = {
    baseAttributes: AttributeTransformRules
    fns?: AggregateTransformRules
}

/**
 * Defines a type‑level transformation rule.
 * When the `origin` type is encountered in an object attribute,
 * it will be replaced with the corresponding `transform` type.
 */
export type TransformRule<O, T> = {
    origin: O;
    transform: T;
};

/**
 * Extract all transform rules.
 */
type RulesUnion<R extends AttributeTransformRules | AggregateTransformRules> = R[keyof R];

/**
 * Attempts to match the attribute type `T` against a union of transformation rules `R`.
 * If a rule's `origin` type exactly matches `NonNullable<T>`,
 * the attribute type is transformed using `SwitchType<T, R['transform']>`.
 * If no rule matches, the result is `never`.
 */
export type MatchedType<T, R extends AttributeTransformRules | AggregateTransformRules> =
    RulesUnion<R> extends infer Rule
        ? Rule extends TransformRule<infer O, infer X>
            ? [NonNullable<T>] extends [O]
                ? SwitchType<T, X>
                : never
            : never
        : never;

/**
 * Applies a transformation rule to type `T` only when a matching rule exists.
 * If `MatchedType` resolves to `never`, the original type `T` is preserved.
 * Otherwise, the matched transformed type is returned.
 */
export type TransformType<T, R extends AttributeTransformRules | AggregateTransformRules> =
    MatchedType<T, R> extends never
        ? T
        : MatchedType<T, R>;



//////////////////////////////// CONVERTER RULES INFER ////////////////////////////////

/**
 * Defines per‑attribute converters for base (non‑relational) entity fields.
 *
 * Each key corresponds to an attribute of the entity, and its value is a
 * transformation function that converts the ORM‑level representation of that
 * attribute into the domain/application‑level representation.
 *
 * This is useful when the ORM returns values in a format that is not suitable
 * for the domain model (e.g., strings for decimals, numbers for booleans).
 *
 * @example
 * For a Price entity:
 * {
 *   price: (value) => new Decimal(value)   
 *   active: (value) => Boolean(value)      
 * }
 */
export type BaseAttributeConvertersInfer<E extends EntityBase> = {
    [Key in keyof EntityNoExternal<E>]?: (value: (any)) => EntityNoExternal<E>[Key]
}

/**
 * Converts external references (related entities) attributes from one type to another.
 * Each key represents a relation field, and its value contains converters
 * for that related entity's attributes.
 * 
 * @example
 * For a Price entity with relation attributes product and shop:
 * { 
 *   product: {
 *     active: (value) => Boolean(value) CONVERT number to boolean
 *   },
 *   shop: {
 *     active: (value) => Boolean(value) CONVERT number to boolean
 *   }
 * }
 */
export type ExternalConvertersInfer<E extends EntityBase> = {
    [Key in keyof ExternalReferences<E>]: ConverterFunctionsInfer<ExternalReferences<E>[Key]>
}

/**
 * Defines converters for values produced by aggregate function operators.
 *
 * Each key corresponds to an {@link AggregateOperators} token (e.g. $sum, $avg),
 * and its value is a transformation function that converts the raw aggregated
 * value returned by the data layer into its domain/application‑level
 * representation.
 *
 * This is useful when aggregate results (such as numeric sums, averages, or
 * counts) require normalization or type conversion before being used in the
 * domain model.
 *
 * @example
 * {
 *   $sum:  (value) => Number(value)       
 *   $avg:  (value) => new Decimal(value)  
 *   $count: (value) => new Decimal(value)      
 * }
 */
export type AggregateConvertersInfer = {
    [Key in AggregateOperators]?: 
        (value: NonNullable<AggregateTransformRules[Key]>['transform']
    ) => NonNullable<AggregateTransformRules[Key]>['origin']
}

/**
 * Defines converters for transforming entity attributes between different representations.
 * Organized into two categories:
 * - baseAttributes: converters for the entity's own attributes
 * - subEntities: converters for nested/related entities (external references)
 * - fns: converters for entity aggregate functions
 * 
 * @example
 * For a Product entity with an attribute "prices" relation:
 * - base converters handle Product fields (brand, model, created etc.)
 * - subEntities converters handle referenced external entity conversion individualy
 * - converts aggregate function result type
 */
export type ConverterFunctionsInfer<E extends EntityBase> = {
    baseAttributes: BaseAttributeConvertersInfer<E>  
    subEntities: ExternalConvertersInfer<E>
    fns?: AggregateConvertersInfer
}

/**
 * A mapping that holds attribute converters for different transforms families.
 * Allows different conversion strategies per transform type family ("raw", "native" etc.).
 * 
 * @example
 * {
 *   raw: { baseAttributes: {...}, subEntities: {...} },
 *   native: { baseAttributes: {...}, subEntities: {...} }
 * }
 */
export type ConverterFamilesInfer<E extends EntityBase> = {
    [family: string]: ConverterFunctionsInfer<E>
}

/**
 * Dialect-specific implementations of entity converters.
 * Different database backends may require different conversion logic.
 * 
 * @typeParam E - The target entity type
 * @typeParam T - The transformed row type 
 * @typeParam O - The output formatter type
 * 
 * @example
 * {
 *   mysql: { asEntity: ..., asEntities: ... },
 *   postgres: { asEntity: ..., asEntities: ... }
 * }
 */
export type ConverterFunctionDialects<
    E extends EntityBase, 
    T, 
    O extends OutputFormaterBase<E, T>
> = {
    [dialect: string]: ConverterFunctions<E, T, O>
}

/**
 * Functions that convert transformed database entity rows into entity valid domain type.
 * Provides two methods:
 * - asEntity: converts a single row to an entity extendable by aggregate attributes (or null if not found)
 * - asEntities: converts multiple rows to an array of entities extendable by aggregate attributes
 * 
 * These are the main entry points for transforming database query results
 * into application-ready entity objects.
 * 
 * @typeParam E - The target entity type
 * @typeParam T - The transformed row type (e.g Sequelize model)
 * @typeParam O - The output formatter that provides context for conversion
 * 
 * @example
 * {
 *   asEntity: function(query, row) { return this.convertRow(row) },
 *   asEntities: function(query, rows) { return rows.map(r => this.convertRow(r))}
 * }
 */
export type ConverterFunctions<E extends EntityBase, T, O extends OutputFormaterBase<E, T>> = {
    asEntity<Q extends Query<E>>(this: O, row: T | null, query?: Q,): EntityExtend<E, EntityAggregateAttributes<E>> | null
    asEntities<Q extends Query<E>>(this: O, rows: T[], query?: Q): EntityExtend<E, EntityAggregateAttributes<E>>[]
} 


//////////////////////////////// CONVERTER RULES BUILD  ////////////////////////////////

/**
 * Defines type-specific conversion functions that apply to sepecific
 * attributes or aggregate function result attributes.
 * Instead of converting per-entity, this converts based on the data type
 * (all exact "type" fields across all entities use the same converter).
 * 
 * @typeParam R - The transformation rule defining how to convert a specific type
 *            look {@link AttributeTransformRules}, {@link AggregateTransformRules}
 * 
 * @example
 * baseAttributes(AttributeTransformRules): { 
 *   date: (value) => value ? new Date(value) : null CONVERT string to date
 *   decimal: (value) => parseFloat(value) CONVERT string to number
 *   boolean: (value) => Boolean(value) CONVERT number to boolean
 * },
 * fns(FnsTransformRules): {
 *   $count: (value: string) => Number(value),
 *   $sum: (value: string) => new Decimal(value),
 * }
 */
export type TypeConverter<R extends AttributeTransformRules | AggregateTransformRules > = {
    [Key in keyof R as R[Key] extends TransformRule<any, any> ? Key : never]: 
        R[Key] extends TransformRule<infer O, infer T>
            ? (value: T) => O
            : never
};

/**
 * Base fundamentals for building entity converters:
 * 
 * - baseAttributes: types defined in {@link AttributeTypes} used to 
 *     index proper tranformation function for entity base attribute type.
 *     Each entity attribute of entity has defined domain 
 *     level type {@link EntityConfigAttributes[attribute][type]}
 *     that should match {@link AttributeTypes}. 
 *     Example:
 *      {'string': (value: transformed value) => base attribute type (domain level type)}
 * 
 * - fns: types defined in {@link AggregateOperators} used to index proper
 *     transformation function for aggregate function type.
 *     Converts type of aggregate function to its vaild domain level type.
 *     Example:
 *      {'$count': (value: transformed value) => aggregate function type (domain level type)}     
 */
export type ConverterFunctionsBuild = {
    baseAttributes: {
        [Key in AttributeTypes]?: (value: any) => any
    }
    fns: {
        [Key in AggregateOperators]?: (value: any) => any
    }
}

/**
 * Groups {@link ConverterFunctionsBuild} by transform family. Allows having different
 * type conversion logic for different tramsform categories. Used to fill up 
 * {@link ConverterDialectsBuild}
 * 
 * @example
 * {
 *   raw: { baseAttributes: ..., fns: ... }
 *   native: { baseAttributes: ..., fns: ... }
 * }
 */
export type ConverterFamiliesBuild<T extends Record<string, ConverterFunctionsBuild>> = {
      [Key in keyof T]: ConverterFunctionsBuild
};

/**
 * Dialect-specific type converters build. Different database dialects may return
 * data in different formats, so this allows per-dialect conversion strategies.
 * 
 * @example
 * {
 *   mysql: { 
 *     raw: { baseAttributes: ..., fns: ... }
 *     native: { baseAttributes: ..., fns: ... }
 *   },
 *   sqlite: { 
 *     duplicated: { baseAttributes: ..., fns: ... }
 *     grouped: { baseAttributes: ..., fns: ... }
 *   }
 * }
 */
export type ConverterDialectsBuild<T extends Record<string, Record<string, ConverterFunctionsBuild>>> = {
    [Key in keyof T]: ConverterFamiliesBuild<T[Key]>
}

/**
 * Converts all functions defined in a {@link ConverterFunctionsBuild} structure into
 * corresponding {@link TransformRule} mappings, organized by dialect and family.
 */
export type FunctionsToTransformRules<T extends ConverterFunctionsBuild> = {
    baseAttributes: BaseAttributeRules<T>
    fns: FnsRules<T>
}

type BaseAttributeRules<T extends ConverterFunctionsBuild> = {
    [Key in keyof T['baseAttributes']]: TransformRuleFromFunction<T['baseAttributes'][Key]>
}

type FnsRules<T extends ConverterFunctionsBuild> = {
    [Key in keyof T['fns']]: TransformRuleFromFunction<T['fns'][Key]> 
}

/**
 * Derives a {@link TransformRule} from a function type. 
 */
type TransformRuleFromFunction<T> = 
    T extends (value: infer T) => infer O  
        ? TransformRule<O, T>
        : never


//////////////////////////////// ENTITY TRANSFORM  ////////////////////////////////

/**
 * 
 * Transforms an entity type by applying transformation rules to both its base attributes
 * and all external references (relations). This is the main entry point for transforming
 * an entire entity - it combines the transformed base fields with transformed nested entities.
 * It can be extended by additional attributes like aggreagate functions attributes.
 * 
 * @typeParam E - The entity type extending EntityBase
 * @typeParam T - The transformation rule defining origin → transform type mapping
 */
export type EntityTransform<
    E extends EntityBase, 
    T extends EntityTransformRules
> = TransformNoExternal<E, T> & TransformExternal<E, T> & AggregateAttributesTransform<E, T>

/**
 * Transforms only the non-relational (base) attributes of an entity.
 * Each attribute type is transformed according to the rule.
 */
export type TransformNoExternal<E extends EntityBase, T extends EntityTransformRules> = {
    [Key in keyof EntityNoExternal<E>]: TransformType<E[Key], T['baseAttributes']>
}

/**
 * Transforms external references (relations) of an entity.
 * Relations are optional - if they exist, they get transformed according to the rule.
 * This handles both single entity relations and array relations.
 */
export type TransformExternal<E extends EntityBase, T extends EntityTransformRules> = {
    [Key in keyof ExternalReferences<E>]?: TransformReference<E[Key], T>
}

/**
 * Recursively transforms a reference type - either a single entity or an array of entities.
 * This is a conditional type that:
 * 1. Checks if the reference is an array → transforms each element
 * 2. Otherwise checks if it's a single entity → transforms it directly
 * 3. Returns never if neither matches
 * 
 * @typeParam Ref - The reference type (could be EntityBase, EntityBase[], or other)
 * @typeParam T - The transformation rule
 * 
 * @example
 * TransformReference<Category, T> → EntityTransform<Category, T>
 * TransformReference<Tag[], T> → EntityTransform<Tag, T>[]
 */
export type TransformReference<Ref, T extends EntityTransformRules> =
    // Case 1: Ref is an array of entities
    Ref extends ReadonlyArray<infer U>
        ? U extends EntityBase
            ? EntityTransform<U, T>[] 
            : never
        // Case 2: Ref is a single entity
        : Ref extends EntityBase
            ? EntityTransform<Ref, T>
            : never;

/**
 * Transform aggregate function key by {@link AggregateAsKey} and value 
 * accordingly to the rules inside {@link EntityTransformRules}['fns']
 */
export type AggregateAttributesTransform<
    E extends EntityBase,
    T extends EntityTransformRules,
    F extends QueryFunctions<E>[] = QueryFunctions<E>[]
> = T['fns'] extends FnsRules<any>
    ? { [Key in F[number] as AggregateAsKey<Key>]?: TransformType<AggregateBase[Key[0]], T['fns']> }
    : {}
    
