import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { buildEntityAttributeConverters } from '../../../src/formaters/query/buildConverters'
import { ConvertersBuild, EntityQueryable, QueryEntityAttributeValidator } from '../../../src/types/entity/Query'
import { productMetadata } from '../../testSkeleton/config'
import { Product } from '../../testSkeleton/entities'
import { EntityBase } from '../../../src/types/entity/Root'
import { validateString, validateNumber, validateDate, validateBoolean } from '../../../src/formaters/query/validators'


type OrmQuery = {
    where: Record<string, unknown>
}

const validationOn = {
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
            select: true,
            order: true,
            group: true
        }
    },
    subEntityRelationDepth: 2
}


export const validationOff = {
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
    subEntityRelationDepth: 2
}

// Test query converters
function buildBaseConverter<F extends OrmQuery>() {
    return <E extends EntityBase, K extends keyof EntityQueryable<E>>(
        value: unknown,
        converted: F,
        attribute: K,
        nested: boolean,
        validate?: QueryEntityAttributeValidator<E>
    ): F => {
        converted.where ??= {}
        const validatedValue = validate ? validate(value, attribute) : value
        converted.where[String(attribute)] = validatedValue
        return converted
    }
}

function createConvertersBuild<F extends OrmQuery>(): ConvertersBuild<F> {
    const baseConverter = buildBaseConverter<F>()
    return {
        baseAttributes: {
            string: baseConverter,
            number: baseConverter,
            date: baseConverter,
            boolean: baseConverter
        },
        rangeAttributes: {} as never,
        queryAttributes: {} as never,
        relationAttributes: {} as never
    }
}

const convertersBuild = createConvertersBuild()

describe('buildEntityAttributeConverters', () => {
    describe('string attributes', () => {
        it('creates converters for all string attributes in metadata', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'string'>(
                convertersBuild,
                validationOff,
                productMetadata.stringAttributesList,
                'string'
            )

            const expectedKeys = ['brand', 'model', 'type', 'description', 'image', 'variant', 'variant_second'].sort()
            assert.deepStrictEqual(Object.keys(result).sort(), expectedKeys)
        })

        it('validate=false => type must be correct (passes string as-is, no coercion)', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'string'>(
                convertersBuild,
                validationOff,
                productMetadata.stringAttributesList,
                'string'
            )

            const converted = result.brand.convert('TestBrand', {} as OrmQuery)
            assert.deepStrictEqual(converted, { where: { brand: 'TestBrand' } })
            assert.strictEqual(typeof converted.where.brand, 'string')
        })

        it('validate=true => type can be switched (validator runs and validates string)', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'string'>(
                convertersBuild,
                validationOn,
                productMetadata.stringAttributesList,
                'string'
            )

            const converted = result.brand.convert('ValidBrand', {} as OrmQuery)
            assert.deepStrictEqual(converted, { where: { brand: 'ValidBrand' } })
            assert.strictEqual(typeof converted.where.brand, 'string')
        })

        it('validate=true => throws Error when type not valid (object passed instead of string)', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'string'>(
                convertersBuild,
                validationOn,
                productMetadata.stringAttributesList,
                'string'
            )

            assert.throws(
                () => result.brand.convert({ invalid: 'object' } as any, {} as OrmQuery),
                /Value type for brand is not valid[\s\S]*Type object can not be used where accepted is "string"\/"null"/
            )
        })

        it('validate=true => throws Error when type not valid (number passed instead of string)', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'string'>(
                convertersBuild,
                validationOn,
                productMetadata.stringAttributesList,
                'string'
            )

            assert.throws(
                () => result.brand.convert(123 as any, {} as OrmQuery),
                /Value type for brand is not valid[\s\S]*Type number can not be used where accepted is "string"\/"null"/
            )
        })
    })

    describe('number attributes', () => {
        it('creates converters for all number attributes in metadata', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'number'>(
                convertersBuild,
                validationOff,
                productMetadata.numberAttributesList,
                'number'
            )

            const expectedKeys = ['id', 'importer_id'].sort()
            assert.deepStrictEqual(Object.keys(result).sort(), expectedKeys)
        })

        it('validate=false => type must be correct (passes number as-is, no coercion)', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'number'>(
                convertersBuild,
                validationOff,
                productMetadata.numberAttributesList,
                'number'
            )

            const converted = result.importer_id.convert(42, {} as OrmQuery)
            assert.deepStrictEqual(converted, { where: { importer_id: 42 } })
            assert.strictEqual(typeof converted.where.importer_id, 'number')
        })

        it('validate=true => type can be switched (validator coerces string to number)', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'number'>(
                convertersBuild,
                validationOn,
                productMetadata.numberAttributesList,
                'number'
            )

            const converted = result.id.convert('100', {} as OrmQuery)
            assert.deepStrictEqual(converted, { where: { id: 100 } })
            assert.strictEqual(typeof converted.where.id, 'number')
        })

        it('validate=true => throws Error when type not valid (object passed instead of number)', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'number'>(
                convertersBuild,
                validationOn,
                productMetadata.numberAttributesList,
                'number'
            )

            assert.throws(
                () => result.id.convert({ invalid: 'object' } as any, {} as OrmQuery),
                /Value type for id is not valid[\s\S]*Type object can not be used where accepted is "number"\/"null"/
            )
        })

        it('validate=true => throws Error when type not valid (array passed instead of number)', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'number'>(
                convertersBuild,
                validationOn,
                productMetadata.numberAttributesList,
                'number'
            )

            assert.throws(
                () => result.id.convert([1, 2, 3] as any, {} as OrmQuery),
                /Value type for id is not valid[\s\S]*Type object can not be used where accepted is "number"\/"null"/
            )
        })
    })

    describe('date attributes', () => {
        it('creates converters for all date attributes in metadata', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'date'>(
                convertersBuild,
                validationOff,
                productMetadata.dateAttributesList,
                'date'
            )

            const expectedKeys = ['created', 'updated'].sort()
            assert.deepStrictEqual(Object.keys(result).sort(), expectedKeys)
        })

        it('validate=false => type must be correct (passes Date as-is, no coercion)', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'date'>(
                convertersBuild,
                validationOff,
                productMetadata.dateAttributesList,
                'date'
            )

            const dateObj = new Date('2024-01-15T10:30:00Z')
            const converted = result.created.convert(dateObj, {} as OrmQuery)
            assert.ok(converted.where.created instanceof Date)
            assert.strictEqual(converted.where.created.toISOString(), '2024-01-15T10:30:00.000Z')
        })

        it('validate=true => type can be switched (validator coerces string to Date)', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'date'>(
                convertersBuild,
                validationOn,
                productMetadata.dateAttributesList,
                'date'
            )

            const converted = result.updated.convert('2024-12-31T23:59:59Z', {} as OrmQuery)
            assert.ok(converted.where.updated instanceof Date)
            assert.strictEqual(converted.where.updated.toISOString(), '2024-12-31T23:59:59.000Z')
        })

        it('validate=true => throws Error when type not valid (object passed instead of Date)', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'date'>(
                convertersBuild,
                validationOn,
                productMetadata.dateAttributesList,
                'date'
            )

            assert.throws(
                () => result.created.convert({ invalid: 'object' } as any, {} as OrmQuery),
                /Value type for created is not valid\.\s*Type object can not be used where accepted is "date"\/"null"/
            )
        })

        it('validate=true => throws Error when type not valid (number passed instead of Date)', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'date'>(
                convertersBuild,
                validationOn,
                productMetadata.dateAttributesList,
                'date'
            )

            assert.throws(
                () => result.created.convert(123456789 as any, {} as OrmQuery),
                /Value type for created is not valid\.\s*Type number can not be used where accepted is "date"\/"null"/
            )
        })
    })

    describe('boolean attributes', () => {
        it('creates converters for all boolean attributes in metadata', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'boolean'>(
                convertersBuild,
                validationOff,
                productMetadata.booleanAttributesList,
                'boolean'
            )

            const expectedKeys = ['active'].sort()
            assert.deepStrictEqual(Object.keys(result).sort(), expectedKeys)
        })

        it('validate=false => type must be correct (passes boolean as-is, no coercion)', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'boolean'>(
                convertersBuild,
                validationOff,
                productMetadata.booleanAttributesList,
                'boolean'
            )

            const converted = result.active.convert(true, {} as OrmQuery)
            assert.strictEqual(converted.where.active, true)
            assert.strictEqual(typeof converted.where.active, 'boolean')
        })

        it('validate=true => type can be switched (validator coerces string to boolean)', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'boolean'>(
                convertersBuild,
                validationOn,
                productMetadata.booleanAttributesList,
                'boolean'
            )

            const converted = result.active.convert('true', {} as OrmQuery)
            assert.strictEqual(converted.where.active, true)
            assert.strictEqual(typeof converted.where.active, 'boolean')

            const converted2 = result.active.convert('false', {} as OrmQuery)
            assert.strictEqual(converted2.where.active, false)
            assert.strictEqual(typeof converted2.where.active, 'boolean')
        })

        it('validate=true => throws Error when type not valid (object passed instead of boolean)', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'boolean'>(
                convertersBuild,
                validationOn,
                productMetadata.booleanAttributesList,
                'boolean'
            )

            assert.throws(
                () => result.active.convert({ invalid: 'object' } as any, {} as OrmQuery),
                /Value type for active is not valid[\s\S]*Type object can not be used where accepted is "boolean"\/"null"/
            )
        })

        it('validate=true => throws Error when type not valid (number passed instead of boolean)', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'boolean'>(
                convertersBuild,
                validationOn,
                productMetadata.booleanAttributesList,
                'boolean'
            )

            assert.throws(
                () => result.active.convert(42 as any, {} as OrmQuery),
                /Value type for active is not valid[\s\S]*Type number can not be used where accepted is "boolean"\/"null"/
            )
        })

        it('validate=true => throws Error when type not valid (invalid string passed instead of boolean)', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'boolean'>(
                convertersBuild,
                validationOn,
                productMetadata.booleanAttributesList,
                'boolean'
            )

            assert.throws(
                () => result.active.convert('notabool', {} as OrmQuery),
                /Value type for active is not valid[\s\S]*Type string can not be used where accepted is "boolean"\/"null"/
            )
        })
    })

    describe('converter function behavior', () => {
        it('returns the converted object to allow chaining', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'string'>(
                convertersBuild,
                validationOff,
                productMetadata.stringAttributesList,
                'string'
            )

            const first = result.brand.convert('Brand1', {} as OrmQuery)
            const second = result.model.convert('Model1', first)
            
            assert.deepStrictEqual(second.where, { brand: 'Brand1', model: 'Model1' })
        })

        it('handles array values for string attributes', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'string'>(
                convertersBuild,
                validationOff,
                productMetadata.stringAttributesList,
                'string'
            )

            const converted = result.variant.convert(['v1', 'v2', 'v3'], {} as OrmQuery)
            assert.deepStrictEqual(converted.where.variant, ['v1', 'v2', 'v3'])
        })

        it('handles array values for number attributes', () => {
            const result = buildEntityAttributeConverters<Product, OrmQuery, 'number'>(
                convertersBuild,
                validationOff,
                productMetadata.numberAttributesList,
                'number'
            )

            const converted = result.id.convert([1, 2, 3], {} as OrmQuery)
            assert.deepStrictEqual(converted.where.id, [1, 2, 3])
        })
    })

    describe('Rule: validate(type)=true => type CAN be switched (coerced); validate(type)=false => type MUST be correct (no coercion)', () => {
        it('number: validate=false => type MUST be correct (string stays string); validate=true => type CAN be switched (string coerced to number)', () => {
            const resultOff = buildEntityAttributeConverters<Product, OrmQuery, 'number'>(
                convertersBuild, validationOff, productMetadata.numberAttributesList, 'number'
            )
            const resultOn = buildEntityAttributeConverters<Product, OrmQuery, 'number'>(
                convertersBuild, validationOn, productMetadata.numberAttributesList, 'number'
            )

            const off = resultOff.id.convert('42', {} as OrmQuery)
            assert.strictEqual(off.where.id, '42')
            assert.strictEqual(typeof off.where.id, 'string')

            const on = resultOn.id.convert('42', {} as OrmQuery)
            assert.strictEqual(on.where.id, 42)
            assert.strictEqual(typeof on.where.id, 'number')
        })

        it('date: validate=false => type MUST be correct (string stays string); validate=true => type CAN be switched (string coerced to Date)', () => {
            const resultOff = buildEntityAttributeConverters<Product, OrmQuery, 'date'>(
                convertersBuild, validationOff, productMetadata.dateAttributesList, 'date'
            )
            const resultOn = buildEntityAttributeConverters<Product, OrmQuery, 'date'>(
                convertersBuild, validationOn, productMetadata.dateAttributesList, 'date'
            )

            const off = resultOff.created.convert('2024-01-01', {} as OrmQuery)
            assert.strictEqual(off.where.created, '2024-01-01')
            assert.strictEqual(typeof off.where.created, 'string')

            const on = resultOn.created.convert('2024-01-01', {} as OrmQuery)
            assert.ok(on.where.created instanceof Date)
        })

        it('boolean: validate=false => type MUST be correct (string stays string); validate=true => type CAN be switched (string coerced to boolean)', () => {
            const resultOff = buildEntityAttributeConverters<Product, OrmQuery, 'boolean'>(
                convertersBuild, validationOff, productMetadata.booleanAttributesList, 'boolean'
            )
            const resultOn = buildEntityAttributeConverters<Product, OrmQuery, 'boolean'>(
                convertersBuild, validationOn, productMetadata.booleanAttributesList, 'boolean'
            )

            const off = resultOff.active.convert('true', {} as OrmQuery)
            assert.strictEqual(off.where.active, 'true')
            assert.strictEqual(typeof off.where.active, 'string')

            const on = resultOn.active.convert('true', {} as OrmQuery)
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
            const stringResult = buildEntityAttributeConverters<Product, OrmQuery, 'string'>(
                convertersBuild, validationOff, productMetadata.stringAttributesList, 'string'
            )
            const numberResult = buildEntityAttributeConverters<Product, OrmQuery, 'number'>(
                convertersBuild, validationOff, productMetadata.numberAttributesList, 'number'
            )
            const dateResult = buildEntityAttributeConverters<Product, OrmQuery, 'date'>(
                convertersBuild, validationOff, productMetadata.dateAttributesList, 'date'
            )
            const booleanResult = buildEntityAttributeConverters<Product, OrmQuery, 'boolean'>(
                convertersBuild, validationOff, productMetadata.booleanAttributesList, 'boolean'
            )

            assert.ok(stringResult.brand)
            assert.ok(numberResult.id)
            assert.ok(dateResult.created)
            assert.ok(booleanResult.active)

            const stringConverted = stringResult.brand.convert('Test', {} as OrmQuery)
            const numberConverted = numberResult.id.convert(123, {} as OrmQuery)
            const dateConverted = dateResult.created.convert(new Date('2024-01-01'), {} as OrmQuery)
            const booleanConverted = booleanResult.active.convert(true, {} as OrmQuery)

            assert.strictEqual(stringConverted.where.brand, 'Test')
            assert.strictEqual(numberConverted.where.id, 123)
            assert.ok(dateConverted.where.created instanceof Date)
            assert.strictEqual(booleanConverted.where.active, true)
        })
    })
})
