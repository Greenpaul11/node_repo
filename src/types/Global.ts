/**
 * Remove undefinde from field.
 * @example
 * type T = string | undefined => string
 */
export type NonUndefined<T> = T extends undefined ? never : T

/**
 *  Make all fields non-nullable.
 * @example
 * { a: string | null } => { a: string }
 */ 
export type NonNullableFromObject<T> = {
    [Key in keyof T]: NonNullable<T[Key]>
}

/**
 * Keep only nullable fields.
 * @example 
 * { a: string | null; b: number } => { a: string | null }
 */ 
export type NullableFromObject<T> = {
    [Key in keyof T as null extends T[Key] ? Key : never]: T[Key]
}

/**
 * Converts all properties to string type.
 * @example
 * { id: number, created: object } => { id: string, created: string }
 */
export type StringifyObjectProperties<T> = {
    [Property in keyof T]: string
}

/**
 * Expands nested object types to their full form.
 * Useful for debugging complex type transformations.
 */
export type Expand<T> = T extends (...args: infer A) => infer R
  ? (...args: Expand<A>) => Expand<R>
  : T extends infer O
  ? { [K in keyof O]: O[K] }
  : never;

/**
 * Recursively expands all nested object types.
 * Provides complete type information for deeply nested structures.
 */
export type ExpandRecursively<T> = T extends (...args: infer A) => infer R
  ? (...args: ExpandRecursively<A>) => ExpandRecursively<R>
  : T extends object
  ? T extends infer O
    ? { [K in keyof O]: ExpandRecursively<O[K]> }
    : never
  : T;

/**
 * Returns all shallow properties that accept `undefined` or `null`.
 * Does not include Optional properties, only `undefined` or `null`.
 */
export type NullishPropertiesOf<T> = {
   [P in keyof T]-?: undefined extends T[P] ? P
     : null extends T[P] ? P
     : never
 }[keyof T];

/**
 * Makes all shallow properties of an object `optional` if they accept `undefined` or `null` as a value.
 */
export type TransformNullishToOptional<T extends object> = 
    T extends any ? Optional<T, NullishPropertiesOf<T>> : never;

/**
 * Type helper for making certain fields of an object optional.
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Pick properties from object represented by 'V'.
 * @example
 * PickByType<{
 *  id: number,
 *  name: string
 * }, number> => {id: number}
 */
export type PickByType<T, V> = {
    [K in keyof T as NonNullable<T[K]> extends V ? K : never]: T[K]
};

export type HasUndefined<T> = undefined extends T ? true : false

export type HasNull<T> = null extends T ? true : false

/**
 * Switch type keeping orginal extension to null of undefined or both.
 */
export type SwitchType<A, T> = 
    HasNull<A> extends true ? 
        HasUndefined<A> extends true ?
            T | null | undefined
        : T | null 
    : HasUndefined<A> extends true ?
        T | undefined
    : T

export type Exact<T, Shape> =
  T extends Shape
    ? Exclude<keyof T, keyof Shape> extends never
      ? T
      : never
    : never;









