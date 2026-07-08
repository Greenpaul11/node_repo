import Decimal from "decimal.js"
export default {
    native: {
        baseAttributes: {
            decimal: (value: number) => new Decimal(value) 
        },
        fns: {
            $count: (value: string) => Number(value),
            $sum: (value: string) => new Decimal(value),
            $avg: (value: string) => new Decimal(value),
            $min: (value: string) => new Decimal(value),
            $max: (value: string) => new Decimal(value)
        }
    },
    raw: {
        baseAttributes: {
            decimal: (value: string ) => new Decimal(value) ,
            boolean: (value: number ) => Boolean(value) 
        }, 
        fns: {
            $count: (value: string) => new Decimal(value),
            $sum: (value: string) => new Decimal(value),
            $avg: (value: string) => new Decimal(value),
            $min: (value: string) => new Decimal(value),
            $max: (value: string) => new Decimal(value)
        }
    }
} 