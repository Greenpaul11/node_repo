import { QueryConverterConfig } from "../../types/entity/Query.js"
import { OverridesQueryConverterConfig } from "../../types/entity/Query.js"
import { overrideObject } from "../../lib/override.js"

export default function build(reference: QueryConverterConfig, override: OverridesQueryConverterConfig): QueryConverterConfig {
    if (!override || Array.isArray(override) || (override && !(typeof override === 'object'))) {
        throw new Error(`Invalid type: "${typeof override}" for override argument.`)
    }
    // manage validation
    const validationSet = override.validation
    const validationRefCopy: Pick<QueryConverterConfig, 'validation'> = { validation: structuredClone(reference.validation) }
    const validationCopy = validationRefCopy['validation']
    // validation set to true
    if (validationSet === true) {
        Object.values(validationCopy).forEach((group: Record<string, boolean>) => 
            Object.keys(group).forEach((key) => group[key] = true)
        )
    // validation group set to true
    } else if (validationSet && !(Array.isArray(validationSet)) && typeof validationSet === 'object') {
        for (const key in validationSet) {
            const groupKey = key as keyof typeof validationSet
            if (groupKey in validationCopy) {
                const groupSet = validationSet[groupKey] as Record<string, boolean>
                const group = validationCopy[groupKey] as Record<string, boolean>
                // if group set to true
                if (validationSet[groupKey] === true) {
                    Object.keys(group).forEach((typeKey) => {
                        group[typeKey] = true
                    })
                // if group enables selected members
                } else if (validationSet[groupKey] && !(Array.isArray(validationSet[groupKey])) && typeof validationSet[groupKey] === 'object') {
                    Object.keys(groupSet).forEach((typeKey) => {
                        // validate
                        const value = groupSet[typeKey]
                        if (value !== true) {
                            throw new Error(`Invalid type for enabling validation members.`)
                        }
                        group[typeKey] = true
                    })
                } else {
                    throw new Error(`Invalid type for enabling validation members.`)
                }
            } else {
                throw new Error(`Validation configuration has no member: ${groupKey}.`)
            }
        }
    } else if (validationSet !== undefined) {
        throw new Error(`Invalid type for "validation" attribute: "${typeof validationSet}" expected object.`)
    }
    // keep reference unchanged and use copy
    const copy = structuredClone(reference)
    return overrideObject(copy, {...override, ...validationRefCopy}) as QueryConverterConfig
}