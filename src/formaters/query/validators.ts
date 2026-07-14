import { EntityBase } from "../../types/entity/Root"
import { EntityQueryable } from "../../types/entity/Query"


export const validateString = <
    E extends EntityBase,
    K extends keyof EntityQueryable<E>
>(value: EntityQueryable<E>[K], attribute: K): EntityQueryable<E>[K] => {
    if (typeof value === 'string' || value === null) {
        return value as EntityQueryable<E>[K]
    } else {
        throw new Error(
            `Value type for ${String(attribute)} is not valid. 
            Type ${typeof value} can not be used where accepted is "string"/"null".`)
    }
}

export const validateNumber = <
    E extends EntityBase,
    K extends keyof EntityQueryable<E>
>(value: EntityQueryable<E>[K], attribute: K): EntityQueryable<E>[K] => {
    if (value === '') return undefined as unknown as EntityQueryable<E>[K]
    const asNumber = value === null ? null : Number(value)
    if (asNumber === null) {
        return asNumber as EntityQueryable<E>[K]
    } else if (!Number.isNaN(asNumber)) {
        return asNumber as EntityQueryable<E>[K]
    } 
    throw new Error(
        `Value type for ${String(attribute)} is not valid. 
        Type ${typeof value} can not be used where accepted is "number"/"null".`)
}

export const validateDate = <
    E extends EntityBase,
    K extends keyof EntityQueryable<E>
>(value: EntityQueryable<E>[K], attribute: K): EntityQueryable<E>[K] => {
    if (value === '') return undefined as unknown as EntityQueryable<E>[K]
    const asDate = value === null ? null : new Date(value as any) 
    if (asDate === null) {
        return asDate as EntityQueryable<E>[K]
    } else if ((typeof value === 'object' || typeof value === 'string') && !isNaN(asDate.getTime())) {
        return asDate as EntityQueryable<E>[K]
    } 
    throw new Error(
        `Value type for ${String(attribute)} is not valid. 
        Type ${typeof value} can not be used where accepted is "date"/"null".`)
}

export const validateBoolean = <
    E extends EntityBase,
    K extends keyof EntityQueryable<E>
>(value: EntityQueryable<E>[K], attribute: K): EntityQueryable<E>[K] => {
    if (value === '') return undefined as unknown as EntityQueryable<E>[K]
    const asBoolean = value === null ? null : (() => {
        if (typeof value === 'boolean') return value;
        // if value as number
        if (value === 1 || value === '1') return true;
        if (value === 0 || value === '0') return false;
        // if value as string
        if (typeof value === 'string') {
            const lower = value.trim().toLowerCase();
            if (lower === 'true') return true;
            if (lower === 'false') return false;
        }
        return 'not valid'
    })()
    if (asBoolean === 'not valid') {
        throw new Error(
            `Value type for ${String(attribute)} is not valid. 
            Type ${typeof value} can not be used where accepted is "boolean"/"null".`)
    } 
    return asBoolean as EntityQueryable<E>[K]
}