import Decimal from "decimal.js"
export default {
    native: {
        baseAttributes: {
            decimal: (value: number | null) => value === null ? null : new Decimal(value),
            date: (value: string | null) => value === null ? null : new Date(value)
        },
        fns: {
            $sum: (value: string) => new Decimal(value),
            $avg: (value: string) => new Decimal(value),
            $min: (value: string) => new Decimal(value),
            $max: (value: string) => new Decimal(value)
        }
    },
    raw: {
        baseAttributes: {
            decimal: (value: string | null ) => value === null ? null : new Decimal(value),
            date: (value: string | null) => value === null ? null : new Date(value),
            boolean: (value: number | null) => value === null ? null : Boolean(value) 
        }, 
        fns: {
            $sum: (value: string) => new Decimal(value),
            $avg: (value: string) => new Decimal(value),
            $min: (value: string) => new Decimal(value),
            $max: (value: string) => new Decimal(value)
        }
    }
} 