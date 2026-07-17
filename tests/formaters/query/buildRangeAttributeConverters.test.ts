import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { buildRangeAttributeConverters } from '../../../src/formaters/query/buildConverters'
import { ConvertersBuild, QueryRangeValidator } from '../../../src/types/entity/Query'
import { productMetadata } from '../../testSkeleton/config'
import { Product } from '../../testSkeleton/entities'
import { EntityBase } from '../../../src/types/entity/Root'
import { PickByType } from '../../../src/types/Global'
import { validateRangeNumber, validateRangeDate } from '../../../src/formaters/query/validators'

type OrmQuery<E extends EntityBase> = {
    where: Record<string, unknown>
}

const convertersBuild: ConvertersBuild<Product, OrmQuery<Product>> = {
    baseAttributes: {} as never,
    queryAttributes: {} as never,
    rangeAttributes: {
        number: <
            K extends keyof PickByType<Product, number>
        >(
            value: unknown,
            converted: OrmQuery<Product>,
            suffix: '_from' | '_to',
            attribute: K,
            validate?: QueryRangeValidator<Product>
        ) => {
            if (!converted.where) converted.where = {}
            const op = suffix === '_from' ? '_gte' : '_lt'
            const validatedValue = validate ? validate(value, attribute as any) : value
            converted.where[`${String(attribute)}${op}`] = validatedValue
            return converted
        },
        date: <
            K extends keyof PickByType<Product, Date>
        >(
            value: unknown,
            converted: OrmQuery<Product>,
            suffix: '_from' | '_to',
            attribute: K,
            validate?: QueryRangeValidator<Product>
        ) => {
            if (!converted.where) converted.where = {}
            const op = suffix === '_from' ? '_gte' : '_lt'
            const validatedValue = validate ? validate(value, attribute as any) : value
            converted.where[`${String(attribute)}${op}`] = validatedValue
            return converted
        }
    }
}


describe('buildRangeAttributeConverters', () => {
    describe('number range attributes', () => {
        it('creates converters for all number range attributes with _from and _to keys', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false },
                    rangeAttributes: { number: false, date: false },
                    queryAttributes: { select: false } }
            }
            const converters = buildRangeAttributeConverters<Product, OrmQuery<Product>, 'number'>(
                convertersBuild,
                config,
                productMetadata.numberAttributesList,
                'number'
            )

            const keys = Object.keys(converters).sort()
            assert.ok(keys.includes('id_from'))
            assert.ok(keys.includes('id_to'))
            assert.ok(keys.includes('importer_id_from'))
            assert.ok(keys.includes('importer_id_to'))
            assert.strictEqual(keys.length, 4)
        })

        it('validate=false => passes number value as-is for _from (Op.gte equivalent)', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false },
                    rangeAttributes: { number: false, date: false },
                    queryAttributes: { select: false } }
            }
            const converters = buildRangeAttributeConverters<Product, OrmQuery<Product>, 'number'>(
                convertersBuild, config, productMetadata.numberAttributesList, 'number'
            )

            const converted = converters.id_from.convert(100, {} as OrmQuery<Product>)
            assert.deepStrictEqual(converted, { where: { id_gte: 100 } })
            assert.strictEqual(typeof converted.where.id_gte, 'number')
        })

        it('validate=false => passes number value as-is for _to (Op.lt equivalent)', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false },
                    rangeAttributes: { number: false, date: false },
                    queryAttributes: { select: false } }
            }
            const converters = buildRangeAttributeConverters<Product, OrmQuery<Product>, 'number'>(
                convertersBuild, config, productMetadata.numberAttributesList, 'number'
            )

            const converted = converters.id_to!.convert(500, {} as OrmQuery<Product>)
            assert.deepStrictEqual(converted, { where: { id_lt: 500 } })
            assert.strictEqual(typeof converted.where.id_lt, 'number')
        })

        it('validate=true => coerces string to number for range', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false },
                    rangeAttributes: { number: true, date: false },
                    queryAttributes: { select: false } 
                },
            }
            const converters = buildRangeAttributeConverters<Product, OrmQuery<Product>, 'number'>(
                convertersBuild, config, productMetadata.numberAttributesList, 'number'
            )

            const converted = converters.id_from.convert('100', {} as OrmQuery<Product>)
            assert.deepStrictEqual(converted, { where: { id_gte: 100 } })
            assert.strictEqual(typeof converted.where.id_gte, 'number')
        })

        it('validate=true => throws Error for invalid number range value', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false },
                    rangeAttributes: { number: true, date: false },
                    queryAttributes: { select: false }
                }
            }
            const converters = buildRangeAttributeConverters<Product, OrmQuery<Product>, 'number'>(
                convertersBuild, config, productMetadata.numberAttributesList, 'number'
            )

            assert.throws(
                () => converters.id_from.convert({ invalid: 'object' } as any, {} as OrmQuery<Product>),
                /Value type for id is not valid/
            )
        })
    })

    describe('date range attributes', () => {
        it('creates converters for all date range attributes with _from and _to keys', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false },
                    rangeAttributes: { number: false, date: false },
                    queryAttributes: { select: false } }
            }
            const converters = buildRangeAttributeConverters<Product, OrmQuery<Product>, 'date'>(
                convertersBuild,
                config,
                productMetadata.dateAttributesList,
                'date'
            )

            const keys = Object.keys(converters).sort()
            assert.ok(keys.includes('created_from'))
            assert.ok(keys.includes('created_to'))
            assert.ok(keys.includes('updated_from'))
            assert.ok(keys.includes('updated_to'))
            assert.strictEqual(keys.length, 4)
        })

        it('validate=false => passes Date as-is for _from', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false },
                    rangeAttributes: { number: false, date: false },
                    queryAttributes: { select: false } }
            }
            const converters = buildRangeAttributeConverters<Product, OrmQuery<Product>, 'date'>(
                convertersBuild, config, productMetadata.dateAttributesList, 'date'
            )

            const dateObj = new Date('2024-01-15T10:30:00Z')
            const converted = converters.created_from.convert(dateObj, {} as OrmQuery<Product>)
            assert.ok(converted.where.created_gte instanceof Date)
            assert.strictEqual(converted.where.created_gte.toISOString(), '2024-01-15T10:30:00.000Z')
        })

        it('validate=true => validates string as valid date format', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false },
                    rangeAttributes: { number: false, date: true },
                    queryAttributes: { select: false }
                }
            }
            const converters = buildRangeAttributeConverters<Product, OrmQuery<Product>, 'date'>(
                convertersBuild, config, productMetadata.dateAttributesList, 'date'
            )

            const converted = converters.updated_from.convert('2024-12-31T23:59:59Z', {} as OrmQuery<Product>)
            assert.strictEqual((converted.where.updated_gte as any).toISOString(), '2024-12-31T23:59:59.000Z')
            assert.strictEqual(typeof converted.where.updated_gte, 'object')
        })

        it('validate=true => throws Error for invalid date range value', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false },
                    rangeAttributes: { number: false, date: true },
                    queryAttributes: { select: false }
                }
            }
            const converters = buildRangeAttributeConverters<Product, OrmQuery<Product>, 'date'>(
                convertersBuild, config, productMetadata.dateAttributesList, 'date'
            )

            assert.throws(
                () => converters.created_from.convert({ invalid: 'object' } as any, {} as OrmQuery<Product>),
                /Value type for created is not valid/
            )
        })

        it('validate=true => throws Error for number passed as date range', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false },
                    rangeAttributes: { number: false, date: true },
                    queryAttributes: { select: false }
                }
            }
            const converters = buildRangeAttributeConverters<Product, OrmQuery<Product>, 'date'>(
                convertersBuild, config, productMetadata.dateAttributesList, 'date'
            )

            assert.throws(
                () => converters.created_to!.convert(123456789 as any, {} as OrmQuery<Product>),
                /Value type for created is not valid/
            )
        })

        it('validate=false => passes Date as-is for _to', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false },
                    rangeAttributes: { number: false, date: false },
                    queryAttributes: { select: false } }
            }
            const converters = buildRangeAttributeConverters<Product, OrmQuery<Product>, 'date'>(
                convertersBuild, config, productMetadata.dateAttributesList, 'date'
            )

            const dateObj = new Date('2024-06-01T00:00:00Z')
            const converted = converters.updated_to!.convert(dateObj, {} as OrmQuery<Product>)
            assert.ok(converted.where.updated_lt instanceof Date)
            assert.strictEqual(converted.where.updated_lt.toISOString(), '2024-06-01T00:00:00.000Z')
        })
    })

    describe('chaining and accumulation', () => {
        it('accumulates multiple range conditions on the same converted object', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false },
                    rangeAttributes: { number: false, date: false },
                    queryAttributes: { select: false } }
            }
            const converters = buildRangeAttributeConverters<Product, OrmQuery<Product>, 'number'>(
                convertersBuild, config, productMetadata.numberAttributesList, 'number'
            )

            const first = converters.id_from.convert(10, {} as OrmQuery<Product>)
            const second = converters.id_to!.convert(100, first)

            assert.deepStrictEqual(second.where, { id_gte: 10, id_lt: 100 })
        })

        it('chaining number and date ranges', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false },
                    rangeAttributes: { number: false, date: false },
                    queryAttributes: { select: false } }
            }
            const numConverters = buildRangeAttributeConverters<Product, OrmQuery<Product>, 'number'>(
                convertersBuild, config, productMetadata.numberAttributesList, 'number'
            )
            const dateConverters = buildRangeAttributeConverters<Product, OrmQuery<Product>, 'date'>(
                convertersBuild, config, productMetadata.dateAttributesList, 'date'
            )

            const acc = {} as OrmQuery<Product>
            numConverters.id_from.convert(10, acc)
            numConverters.id_to!.convert(100, acc)
            dateConverters.created_from.convert(new Date('2024-01-01'), acc)
            dateConverters.created_to!.convert(new Date('2024-12-31'), acc)

            assert.deepStrictEqual(acc.where, {
                id_gte: 10,
                id_lt: 100,
                created_gte: new Date('2024-01-01'),
                created_lt: new Date('2024-12-31')
            })
        })
    })

    describe('validation behavior', () => {
        it('validate=false => passes value without coercion (number stays number)', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false },
                    rangeAttributes: { number: false, date: false },
                    queryAttributes: { select: false } }
            }
            const converters = buildRangeAttributeConverters<Product, OrmQuery<Product>, 'number'>(
                convertersBuild, config, productMetadata.numberAttributesList, 'number'
            )

            const converted = converters.id_from.convert(42, {} as OrmQuery<Product>)
            assert.strictEqual(converted.where.id_gte, 42)
            assert.strictEqual(typeof converted.where.id_gte, 'number')
        })

        it('validate=true => coerces string to number', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false },
                    rangeAttributes: { number: true, date: false },
                    queryAttributes: { select: false }
                }
            }
            const converters = buildRangeAttributeConverters<Product, OrmQuery<Product>, 'number'>(
                convertersBuild, config, productMetadata.numberAttributesList, 'number'
            )

            const converted = converters.id_from.convert('42', {} as OrmQuery<Product>)
            assert.strictEqual(converted.where.id_gte, 42)
            assert.strictEqual(typeof converted.where.id_gte, 'number')
        })

        it('validate=true for date => validates string date format (returns date)', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false },
                    rangeAttributes: { number: false, date: true },
                    queryAttributes: { select: false }
                }
            }
            const converters = buildRangeAttributeConverters<Product, OrmQuery<Product>, 'date'>(
                convertersBuild, config, productMetadata.dateAttributesList, 'date'
            )

            const converted = converters.created_from.convert('2024-01-01', {} as OrmQuery<Product>)
            assert.strictEqual((converted.where.created_gte as any).toISOString(), '2024-01-01T00:00:00.000Z')
            assert.strictEqual(typeof converted.where.created_gte, 'object')
        })

        it('validate=false for date => passes string as-is, no coercion', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false },
                    rangeAttributes: { number: false, date: false },
                    queryAttributes: { select: false } }
            }
            const converters = buildRangeAttributeConverters<Product, OrmQuery<Product>, 'date'>(
                convertersBuild, config, productMetadata.dateAttributesList, 'date'
            )

            const converted = converters.created_from.convert('2024-01-01', {} as OrmQuery<Product>)
            assert.strictEqual(converted.where.created_gte, '2024-01-01')
            assert.strictEqual(typeof converted.where.created_gte, 'string')
        })
    })

    describe('validators work correctly', () => {
        it('validateRangeNumber coerces string to number', () => {
            const result = validateRangeNumber('42', 'test_from' as any)
            assert.strictEqual(result, 42)
            assert.strictEqual(typeof result, 'number')
        })

        it('validateRangeNumber returns undefined for empty string', () => {
            const result = validateRangeNumber('', 'test_from' as any)
            assert.strictEqual(result, undefined)
        })

        it('validateRangeDate validates string date format (returns date)', () => {
            const result = validateRangeDate('2024-01-01', 'test_from' as any)
            assert.strictEqual(result.toISOString(), '2024-01-01T00:00:00.000Z')
            assert.strictEqual(typeof result, 'object')
        })

        it('validateRangeDate accepts Date object and returns it as-is', () => {
            const date = new Date('2024-06-15')
            const result = validateRangeDate(date, 'test_from' as any)
            assert.ok(result instanceof Date)
            assert.strictEqual(result.toISOString(), '2024-06-15T00:00:00.000Z')
        })
    })
})
