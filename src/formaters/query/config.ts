export const defaultConfig = {
    validation: {
        baseAttributes: {
            string: true,
            number: true,
            date: true,
            boolean: true
        },
        rangeAttributes: {
            number: true,
            date: true
        },
        queryAttributes: {
            select: true
        }
    },
    subEntityRelationDepth: 5
}

export const validationOn = {
    baseAttributes: {
        string: true,
        number: true,
        date: true,
        boolean: true
    },
    rangeAttributes: {
        number: true,
        date: true
    },
    queryAttributes: {
        select: true
    }
}

export const validationOff = {
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
        select: false
    }
    
}