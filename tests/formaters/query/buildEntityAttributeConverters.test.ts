import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { buildEntityAttributeConverters } from '../../../src/formaters/query/buildConverters'
import { ConvertersBuild } from '../../../src/types/entity/Query'
import { productMetadata } from '../../testSkeleton/config'
import { Product } from '../../testSkeleton/entities'
import { EntityBase, EntityNoExternal } from '../../../src/types/entity/Root'
import { validateString, validateNumber, validateDate, validateBoolean } from '../../../src/formaters/query/validators'

type OrmQuery<E extends EntityBase> = {
    where: OrmQueryWhere<E>
}
type OrmQueryWhere<E extends EntityBase> = {
    [Key in keyof EntityNoExternal<E>]: E[Key]
}

const convertersBuild: ConvertersBuild<Product, OrmQuery<Product>> = {
    baseAttributes: {
        string: <K extends keyof EntityNoExternal<Product>>(
                value: any, 
                attribute: K, 
                converted: OrmQuery<Product>, 
                validate?: (value: any, attribute: K) => any) => {
            if (!converted.where) converted.where = {} as OrmQueryWhere<Product>
            const validatedValue = validate ? validate(value, attribute) : value
            converted.where[attribute] = validatedValue
            return converted
        },
        number: <K extends keyof EntityNoExternal<Product>>(
                value: any, 
                attribute: K, 
                converted: OrmQuery<Product>, 
                validate?: (value: any, attribute: K) => any) => {
            if (!converted.where) converted.where = {} as OrmQueryWhere<Product>
            const validatedValue = validate ? validate(value, attribute) : value
            converted.where[attribute] = validatedValue
            return converted
        },
        date: <K extends keyof EntityNoExternal<Product>>(
                value: any, 
                attribute: K, 
                converted: OrmQuery<Product>, 
                validate?: (value: any, attribute: K) => any) => {
            if (!converted.where) converted.where = {} as OrmQueryWhere<Product>
            const validatedValue = validate ? validate(value, attribute) : value
            converted.where[attribute] = validatedValue
            return converted
        },
        boolean: <K extends keyof EntityNoExternal<Product>>(
                value: any, 
                attribute: K, 
                converted: OrmQuery<Product>, 
                validate?: (value: any, attribute: K) => any) => {
            if (!converted.where) converted.where = {} as OrmQueryWhere<Product>
            const validatedValue = validate ? validate(value, attribute) : value
            converted.where[attribute] = validatedValue
            return converted
        }
    }
}

describe('buildEntityAttributeConverters', () => {
    describe('string attributes', () => {
        it('creates converters for all string attributes in metadata', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'string'>(
                convertersBuild,
                config,
                productMetadata.stringAttributesList,
                'string'
            )

            const expectedKeys = ['brand', 'model', 'type', 'description', 'image', 'variant', 'variant_second'].sort()
            assert.deepStrictEqual(Object.keys(result).sort(), expectedKeys)
        })

        it('validate=false => type must be correct (passes string as-is, no coercion)', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'string'>(
                convertersBuild,
                config,
                productMetadata.stringAttributesList,
                'string'
            )

            const converted = result.brand.convert('TestBrand', 'brand', {} as OrmQuery<Product>)
            assert.deepStrictEqual(converted, { where: { brand: 'TestBrand' } })
            assert.strictEqual(typeof converted.where.brand, 'string')
        })

        it('validate=true => type can be switched (validator runs and validates string)', () => {
            const config = {
                validation: { baseAttributes: { string: true, number: false, date: false, boolean: false } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'string'>(
                convertersBuild,
                config,
                productMetadata.stringAttributesList,
                'string'
            )

            const converted = result.brand.convert('ValidBrand', 'brand', {} as OrmQuery<Product>)
            assert.deepStrictEqual(converted, { where: { brand: 'ValidBrand' } })
            assert.strictEqual(typeof converted.where.brand, 'string')
        })

        it('validate=true => throws Error when type not valid (object passed instead of string)', () => {
            const config = {
                validation: { baseAttributes: { string: true, number: false, date: false, boolean: false } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'string'>(
                convertersBuild,
                config,
                productMetadata.stringAttributesList,
                'string'
            )

            assert.throws(
                () => result.brand.convert({ invalid: 'object' } as any, 'brand', {} as OrmQuery<Product>),
                /Value type for brand is not valid[\s\S]*Type object can not be used where accepted is "string"\/"null"/
            )
        })

        it('validate=true => throws Error when type not valid (number passed instead of string)', () => {
            const config = {
                validation: { baseAttributes: { string: true, number: false, date: false, boolean: false } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'string'>(
                convertersBuild,
                config,
                productMetadata.stringAttributesList,
                'string'
            )

            assert.throws(
                () => result.brand.convert(123 as any, 'brand', {} as OrmQuery<Product>),
                /Value type for brand is not valid[\s\S]*Type number can not be used where accepted is "string"\/"null"/
            )
        })
    })

    describe('number attributes', () => {
        it('creates converters for all number attributes in metadata', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'number'>(
                convertersBuild,
                config,
                productMetadata.numberAttributesList,
                'number'
            )

            const expectedKeys = ['id', 'importer_id'].sort()
            assert.deepStrictEqual(Object.keys(result).sort(), expectedKeys)
        })

        it('validate=false => type must be correct (passes number as-is, no coercion)', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'number'>(
                convertersBuild,
                config,
                productMetadata.numberAttributesList,
                'number'
            )

            const converted = result.importer_id.convert(42, 'importer_id', {} as OrmQuery<Product>)
            assert.deepStrictEqual(converted, { where: { importer_id: 42 } })
            assert.strictEqual(typeof converted.where.importer_id, 'number')
        })

        it('validate=true => type can be switched (validator coerces string to number)', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: true, date: false, boolean: false } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'number'>(
                convertersBuild,
                config,
                productMetadata.numberAttributesList,
                'number'
            )

            const converted = result.id.convert('100', 'id', {} as OrmQuery<Product>)
            assert.deepStrictEqual(converted, { where: { id: 100 } })
            assert.strictEqual(typeof converted.where.id, 'number')
        })

        it('validate=true => throws Error when type not valid (object passed instead of number)', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: true, date: false, boolean: false } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'number'>(
                convertersBuild,
                config,
                productMetadata.numberAttributesList,
                'number'
            )

            assert.throws(
                () => result.id.convert({ invalid: 'object' } as any, 'id', {} as OrmQuery<Product>),
                /Value type for id is not valid[\s\S]*Type object can not be used where accepted is "number"\/"null"/
            )
        })

        it('validate=true => throws Error when type not valid (array passed instead of number)', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: true, date: false, boolean: false } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'number'>(
                convertersBuild,
                config,
                productMetadata.numberAttributesList,
                'number'
            )

            assert.throws(
                () => result.id.convert([1, 2, 3], 'id', {} as OrmQuery<Product>),
                /Value type for id is not valid[\s\S]*Type object can not be used where accepted is "number"\/"null"/
            )
        })
    })

    describe('date attributes', () => {
        it('creates converters for all date attributes in metadata', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'date'>(
                convertersBuild,
                config,
                productMetadata.dateAttributesList,
                'date'
            )

            const expectedKeys = ['created', 'updated'].sort()
            assert.deepStrictEqual(Object.keys(result).sort(), expectedKeys)
        })

        it('validate=false => type must be correct (passes Date as-is, no coercion)', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'date'>(
                convertersBuild,
                config,
                productMetadata.dateAttributesList,
                'date'
            )

            const dateObj = new Date('2024-01-15T10:30:00Z')
            const converted = result.created.convert(dateObj, 'created', {} as OrmQuery<Product>)
            assert.ok(converted.where.created instanceof Date)
            assert.strictEqual(converted.where.created.toISOString(), '2024-01-15T10:30:00.000Z')
        })

        it('validate=true => type can be switched (validator coerces string to Date)', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: true, boolean: false } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'date'>(
                convertersBuild,
                config,
                productMetadata.dateAttributesList,
                'date'
            )

            const converted = result.updated.convert('2024-12-31T23:59:59Z', 'updated', {} as OrmQuery<Product>)
            assert.ok(converted.where.updated instanceof Date)
            assert.strictEqual(converted.where.updated.toISOString(), '2024-12-31T23:59:59.000Z')
        })

        it('validate=true => throws Error when type not valid (object passed instead of Date)', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: true, boolean: false } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'date'>(
                convertersBuild,
                config,
                productMetadata.dateAttributesList,
                'date'
            )

            assert.throws(
                () => result.created.convert({ invalid: 'object' } as any, 'created', {} as OrmQuery<Product>),
                /Value type for created is not valid\.\s*Type object can not be used where accepted is "date"\/"null"/
            )
        })

        it('validate=true => throws Error when type not valid (number passed instead of Date)', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: true, boolean: false } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'date'>(
                convertersBuild,
                config,
                productMetadata.dateAttributesList,
                'date'
            )

            assert.throws(
                () => result.created.convert(123456789 as any, 'created', {} as OrmQuery<Product>),
                /Value type for created is not valid\.\s*Type number can not be used where accepted is "date"\/"null"/
            )
        })
    })

    describe('boolean attributes', () => {
        it('creates converters for all boolean attributes in metadata', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'boolean'>(
                convertersBuild,
                config,
                productMetadata.booleanAttributesList,
                'boolean'
            )

            const expectedKeys = ['active'].sort()
            assert.deepStrictEqual(Object.keys(result).sort(), expectedKeys)
        })

        it('validate=false => type must be correct (passes boolean as-is, no coercion)', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'boolean'>(
                convertersBuild,
                config,
                productMetadata.booleanAttributesList,
                'boolean'
            )

            const converted = result.active.convert(true, 'active', {} as OrmQuery<Product>)
            assert.strictEqual(converted.where.active, true)
            assert.strictEqual(typeof converted.where.active, 'boolean')
        })

        it('validate=true => type can be switched (validator coerces string to boolean)', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: true } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'boolean'>(
                convertersBuild,
                config,
                productMetadata.booleanAttributesList,
                'boolean'
            )

            const converted = result.active.convert('true', 'active', {} as OrmQuery<Product>)
            assert.strictEqual(converted.where.active, true)
            assert.strictEqual(typeof converted.where.active, 'boolean')

            const converted2 = result.active.convert('false', 'active', {} as OrmQuery<Product>)
            assert.strictEqual(converted2.where.active, false)
            assert.strictEqual(typeof converted2.where.active, 'boolean')
        })

        it('validate=true => throws Error when type not valid (object passed instead of boolean)', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: true } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'boolean'>(
                convertersBuild,
                config,
                productMetadata.booleanAttributesList,
                'boolean'
            )

            assert.throws(
                () => result.active.convert({ invalid: 'object' } as any , 'active', {} as OrmQuery<Product>),
                /Value type for active is not valid[\s\S]*Type object can not be used where accepted is "boolean"\/"null"/
            )
        })

        it('validate=true => throws Error when type not valid (number passed instead of boolean)', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: true } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'boolean'>(
                convertersBuild,
                config,
                productMetadata.booleanAttributesList,
                'boolean'
            )

            assert.throws(
                () => result.active.convert(42 as any, 'active', {} as OrmQuery<Product>),
                /Value type for active is not valid[\s\S]*Type number can not be used where accepted is "boolean"\/"null"/
            )
        })

        it('validate=true => throws Error when type not valid (invalid string passed instead of boolean)', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: true } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'boolean'>(
                convertersBuild,
                config,
                productMetadata.booleanAttributesList,
                'boolean'
            )

            assert.throws(
                () => result.active.convert('notabool', 'active', {} as OrmQuery<Product>),
                /Value type for active is not valid[\s\S]*Type string can not be used where accepted is "boolean"\/"null"/
            )
        })
    })

    describe('converter function behavior', () => {
        it('returns the converted object to allow chaining', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'string'>(
                convertersBuild,
                config,
                productMetadata.stringAttributesList,
                'string'
            )

            const first = result.brand.convert('Brand1', 'brand', {} as OrmQuery<Product>)
            const second = result.model.convert('Model1', 'model', first)
            
            assert.deepStrictEqual(second.where, { brand: 'Brand1', model: 'Model1' })
        })

        it('handles array values for string attributes', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'string'>(
                convertersBuild,
                config,
                productMetadata.stringAttributesList,
                'string'
            )

            const converted = result.variant.convert(['v1', 'v2', 'v3'], 'variant', {} as OrmQuery<Product>)
            assert.deepStrictEqual(converted.where.variant, ['v1', 'v2', 'v3'])
        })

        it('handles array values for number attributes', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false } }
            }
            const result = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'number'>(
                convertersBuild,
                config,
                productMetadata.numberAttributesList,
                'number'
            )

            const converted = result.id.convert([1, 2, 3], 'id', {} as OrmQuery<Product>)
            assert.deepStrictEqual(converted.where.id, [1, 2, 3])
        })
    })

    describe('Rule: validate(type)=true => type CAN be switched (coerced); validate(type)=false => type MUST be correct (no coercion)', () => {
        it('number: validate=false => type MUST be correct (string stays string); validate=true => type CAN be switched (string coerced to number)', () => {
            const configOff = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false } }
            }
            const configOn = {
                validation: { baseAttributes: { string: false, number: true, date: false, boolean: false } }
            }
            const resultOff = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'number'>(
                convertersBuild, configOff, productMetadata.numberAttributesList, 'number'
            )
            const resultOn = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'number'>(
                convertersBuild, configOn, productMetadata.numberAttributesList, 'number'
            )

            const off = resultOff.id.convert('42', 'id', {} as OrmQuery<Product>)
            assert.strictEqual(off.where.id, '42')
            assert.strictEqual(typeof off.where.id, 'string')

            const on = resultOn.id.convert('42', 'id', {} as OrmQuery<Product>)
            assert.strictEqual(on.where.id, 42)
            assert.strictEqual(typeof on.where.id, 'number')
        })

        it('date: validate=false => type MUST be correct (string stays string); validate=true => type CAN be switched (string coerced to Date)', () => {
            const configOff = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false } }
            }
            const configOn = {
                validation: { baseAttributes: { string: false, number: false, date: true, boolean: false } }
            }
            const resultOff = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'date'>(
                convertersBuild, configOff, productMetadata.dateAttributesList, 'date'
            )
            const resultOn = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'date'>(
                convertersBuild, configOn, productMetadata.dateAttributesList, 'date'
            )

            const off = resultOff.created.convert('2024-01-01', 'created', {} as OrmQuery<Product>)
            assert.strictEqual(off.where.created, '2024-01-01')
            assert.strictEqual(typeof off.where.created, 'string')

            const on = resultOn.created.convert('2024-01-01', 'created', {} as OrmQuery<Product>)
            assert.ok(on.where.created instanceof Date)
        })

        it('boolean: validate=false => type MUST be correct (string stays string); validate=true => type CAN be switched (string coerced to boolean)', () => {
            const configOff = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false } }
            }
            const configOn = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: true } }
            }
            const resultOff = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'boolean'>(
                convertersBuild, configOff, productMetadata.booleanAttributesList, 'boolean'
            )
            const resultOn = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'boolean'>(
                convertersBuild, configOn, productMetadata.booleanAttributesList, 'boolean'
            )

            const off = resultOff.active.convert('true', 'active', {} as OrmQuery<Product>)
            assert.strictEqual(off.where.active, 'true')
            assert.strictEqual(typeof off.where.active, 'string')

            const on = resultOn.active.convert('true', 'active', {} as OrmQuery<Product>)
            assert.strictEqual(on.where.active, true)
            assert.strictEqual(typeof on.where.active, 'boolean')
        })
    })

    describe('validators work correctly', () => {
        it('validateString validates and returns string', () => {
            const result = validateString('hello', 'test' as any)
            assert.strictEqual(result, 'hello')
        })

        it('validateNumber coerces string to number', () => {
            const result = validateNumber('42', 'test' as any)
            assert.strictEqual(result, 42)
            assert.strictEqual(typeof result, 'number')
        })

        it('validateDate coerces string to Date', () => {
            const result = validateDate('2024-01-01', 'test' as any)
            assert.ok(result instanceof Date)
            assert.strictEqual(result.toISOString(), '2024-01-01T00:00:00.000Z')
        })

        it('validateBoolean coerces string to boolean', () => {
            const trueResult = validateBoolean('true', 'test' as any)
            assert.strictEqual(trueResult, true)
            const falseResult = validateBoolean('false', 'test' as any)
            assert.strictEqual(falseResult, false)
        })
    })

    describe('all types combined', () => {
        it('produces distinct converters per attribute type', () => {
            const config = {
                validation: { baseAttributes: { string: false, number: false, date: false, boolean: false } }
            }

            const stringResult = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'string'>(
                convertersBuild, config, productMetadata.stringAttributesList, 'string'
            )
            const numberResult = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'number'>(
                convertersBuild, config, productMetadata.numberAttributesList, 'number'
            )
            const dateResult = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'date'>(
                convertersBuild, config, productMetadata.dateAttributesList, 'date'
            )
            const booleanResult = buildEntityAttributeConverters<Product, OrmQuery<Product>, 'boolean'>(
                convertersBuild, config, productMetadata.booleanAttributesList, 'boolean'
            )

            assert.ok(stringResult.brand)
            assert.ok(numberResult.id)
            assert.ok(dateResult.created)
            assert.ok(booleanResult.active)

            const stringConverted = stringResult.brand.convert('Test', 'brand', {} as OrmQuery<Product>)
            const numberConverted = numberResult.id.convert(123, 'id', {} as OrmQuery<Product>)
            const dateConverted = dateResult.created.convert(new Date('2024-01-01'), 'created', {} as OrmQuery<Product>)
            const booleanConverted = booleanResult.active.convert(true, 'active', {} as OrmQuery<Product>)

            assert.strictEqual(stringConverted.where.brand, 'Test')
            assert.strictEqual(numberConverted.where.id, 123)
            assert.ok(dateConverted.where.created instanceof Date)
            assert.strictEqual(booleanConverted.where.active, true)
        })
    })
})