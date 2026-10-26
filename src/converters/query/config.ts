import { SUB_ENTITIES_DEPTH } from "../../repository/config.js"

export default {
    validation: {
        baseAttributes: {
            string: false,
            number: false,
            date: false,
            boolean: false
        },
        rangeAttributes: {
            number: false,
            date: false
        },
        queryAttributes: {
            select: false,
            order: false,
            group: false
        }
    },
    subEntitiesDepth: SUB_ENTITIES_DEPTH
}

