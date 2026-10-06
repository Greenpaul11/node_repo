import { Decimal } from "decimal.js"
export default {
    native: {
        baseAttributes: {
            decimal: (value: number | null) => value === null ? null : new Decimal(value)
        },
        fns: {
            $count: (value: string | null) => value === null ? null : Number(value),
            $sum: (value: string | null) => value === null ? null : new Decimal(value),
            $avg: (value: string | null) => value === null ? null : new Decimal(value),
            $min: (value: string | null) => value === null ? null : new Decimal(value),
            $max: (value: string | null) => value === null ? null : new Decimal(value)
        }
    },
    raw: {
        baseAttributes: {
            decimal: (value: string | null) => value === null ? null : new Decimal(value),
            boolean: (value: number | null) => value === null ? null : Boolean(value) 
        }, 
        fns: {
            $count: (value: string | null) => value === null ? null : Number(value),
            $sum: (value: string | null) => value === null ? null : new Decimal(value),
            $avg: (value: string | null) => value === null ? null : new Decimal(value),
            $min: (value: string | null) => value === null ? null : new Decimal(value),
            $max: (value: string | null) => value === null ? null : new Decimal(value)
        }
    }
} 