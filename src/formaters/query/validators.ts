import { EntityBase, EntityNoExternal } from "../../types/entity/Root"
import { PickByType } from "../../types/Global"
import { EntityQueryable } from "../../types/entity/Query"
import { Query } from "../../types/entity/Query"



export const validateString = <
    E extends EntityBase,
    K extends keyof EntityQueryable<E>
>(value: Query<E>[K], attribute: K): EntityQueryable<E>[K] => {
    if (typeof value === 'string' || value === null) {
        return value as EntityQueryable<E>[K]
    } else {
        throw new Error(
            `Value type for ${String(attribute)} is not valid. 
            Type ${typeof value} can not be used where accepted is "string"/"null".`)
    }
}


//const validateSearchInAttribute = <
//    E extends EntityBase
//>(value: EntiyQuerySearchInAttributes<E>[keyof PickByType<E, string>], attribute: keyof PickByType<E, string>) => {
//    if (typeof value === 'string' && value.length > 2) {
//        return value
//    } else {
//        throw new Error(
//            `Value type for attribute: ${attribute} in search_in is not valid. 
//            Type ${typeof value} can not be used where accepted is "string".
//            Minimal length for FullTextSearch is 3.`)
//    }
//}
//
//
//const validateNumberAttribute = <
//    E extends EntityBase
//>(value: Query<E>[keyof PickByType<E, number>], attribute: keyof PickByType<E, number>) => {
//    const asNumber = value === null ? null : Number(value)
//    if (asNumber === null) {
//        return asNumber
//    } else if (!Number.isNaN(asNumber)) {
//        return asNumber
//    } 
//    throw new Error(
//        `Value type for ${attribute} is not valid. 
//        Type ${typeof value} can not be used where accepted is "number"/"null".`)
//}
//
//
//const validateDateAttribute = <
//    E extends EntityBase
//>(value: Query<E, A, R>[keyof PickByType<E, Date>], attribute: keyof PickByType<E, Date>) => {
//    const asDate = value === null ? null : new Date(value as any) 
//    if (asDate === null) {
//        return asDate
//    } else if ((typeof value === 'object' || typeof value === 'string') && !isNaN(asDate.getTime())) {
//        return asDate
//    } 
//    throw new Error(
//        `Value type for ${attribute} is not valid. 
//        Type ${typeof value} can not be used where accepted is "date"/"null".`)
//}
//
//
//const validateBooleanAttribute = <
//    E extends EntityBase
//>(value: Query<E>[keyof PickByType<E, boolean>], attribute: keyof PickByType<E, boolean>) => {
//    const asBoolean = value === null ? null : (() => {
//        if (typeof value === 'boolean') return value;
//        // if value as number
//        if (value === 1 || value === '1') return true;
//        if (value === 0 || value === '0') return false;
//        // if value as string
//        if (typeof value === 'string') {
//            const lower = value.trim().toLowerCase();
//            if (lower === 'true') return true;
//            if (lower === 'false') return false;
//        }
//        return 'not valid'
//    })()
//    if (asBoolean === 'not valid') {
//        throw new Error(
//            `Value type for ${attribute} is not valid. 
//            Type ${typeof value} can not be used where accepted is "boolean"/"null".`)
//    } 
//    return asBoolean
//}