/**
 * Deeply override a config-like object with strict structural validation.
 *
 * Rules:
 * - Every key in `source` must exist in `target`.
 * - Types must match exactly at every level (boolean ↔ boolean, object ↔ object etc.).
 * - Arrays are replaced entirely, never merged.
 * - `null` is **not** allowed in source (it is an explicit signal of a mistake).
 * - On the first error the function throws with the full object path, leaving
 *   `target` untouched.
 *
 * @param target – original config object (mutated in place on success).
 * @param source – partial overrides.
 * @param path   – internal – current property path for error messages.
 */
export function overrideObject(
    target: Record<string, unknown>,
    source: Record<string, unknown>,
    path: string = ''
): Record<string, unknown> {
    for (const key of Object.keys(source)) {
        const currentPath = path ? `${path}.${key}` : key

        if (!Object.prototype.hasOwnProperty.call(target, key)) {
            throw new Error(
                `Override error at '${currentPath}': key does not exist in target`
            )
        }

        const sourceValue = source[key]
        const targetValue = target[key]

        // --- null is never allowed in source ---
        if (sourceValue === null) {
            throw new Error(
                `Override error at '${currentPath}': source value is null`
            )
        }

        // --- primitives ---
        if (typeof targetValue === 'boolean') {
            if (typeof sourceValue !== 'boolean') {
                throw new Error(
                    `Override error at '${currentPath}': expected boolean, got ${typeof sourceValue}`
                )
            }
            target[key] = sourceValue
            continue
        }

        if (typeof targetValue === 'number') {
            if (typeof sourceValue !== 'number') {
                throw new Error(
                    `Override error at '${currentPath}': expected number, got ${typeof sourceValue}`
                )
            }
            target[key] = sourceValue
            continue
        }

        if (typeof targetValue === 'string') {
            if (typeof sourceValue !== 'string') {
                throw new Error(
                    `Override error at '${currentPath}': expected string, got ${typeof sourceValue}`
                )
            }
            target[key] = sourceValue
            continue
        }

        // --- arrays ---
        if (Array.isArray(targetValue)) {
            if (!Array.isArray(sourceValue)) {
                throw new Error(
                    `Override error at '${currentPath}': expected array, got ${typeof sourceValue}`
                )
            }
            target[key] = sourceValue
            continue
        }

        // --- nested objects ---
        if (typeof targetValue === 'object' && targetValue !== null) {
            if (typeof sourceValue !== 'object' || sourceValue === null || Array.isArray(sourceValue)) {
                throw new Error(
                    `Override error at '${currentPath}': expected object, got ${sourceValue === null 
                        ? 'null' 
                        : Array.isArray(sourceValue) ? 'array' : typeof sourceValue}`
                )
            }
            target[key] = overrideObject(
                targetValue as Record<string, unknown>,
                sourceValue as Record<string, unknown>,
                currentPath
            )
            continue
        }

        // --- unsupported target type (function, symbol, undefined) ---
        throw new Error(
            `Override error at '${currentPath}': unsupported target type '${typeof targetValue}'`
        )
    }

    return target
}
