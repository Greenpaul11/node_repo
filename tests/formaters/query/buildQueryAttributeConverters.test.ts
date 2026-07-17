import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { buildQueryAttributeConverters } from '../../../src/formaters/query/buildConverters'
import { ConvertersBuild, QueryFormaterBaseConfig, QuerySelectValidator } from '../../../src/types/entity/Query'
import { productMetadata } from '../../testSkeleton/config'
import { Product } from '../../testSkeleton/entities'
import { EntityBase, EntityNoExternal } from '../../../src/types/entity/Root'
import { validateSelect } from '../../../src/formaters/query/validators'

type OrmQuery<E extends EntityBase> = {
    attributes: string[]
}

const configOff: QueryFormaterBaseConfig = {
    validation: {
        baseAttributes: { string: false, number: false, date: false, boolean: false },
        rangeAttributes: { number: false, date: false },
        queryAttributes: { select: false }
    }
}

const configOn: QueryFormaterBaseConfig = {
    validation: {
        baseAttributes: { string: false, number: false, date: false, boolean: false },
        rangeAttributes: { number: false, date: false },
        queryAttributes: { select: true }
    }
}

const convertersBuild: ConvertersBuild<Product, OrmQuery<Product>> = {
    baseAttributes: {} as never,
    rangeAttributes: {} as never,
    queryAttributes: {
        select: (
            value: unknown,
            converted: OrmQuery<Product>,
            attributes: Array<keyof EntityNoExternal<Product>>,
            validate?: QuerySelectValidator<Product>
        ) => {
            if (!converted.attributes) converted.attributes = [] 
            if (typeof value === 'string') {
                if (validate) validate(value, attributes)
                converted.attributes.push(value)
            } else {
                throw new Error('Type of value is not valid!')
            }
            
            return converted
        }
    }
}

describe('buildQueryAttributeConverters', () => {
    describe('select converter', () => {
        it('creates select converter with convert function', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOff,
                productMetadata.baseAttributesList
            )

            assert.ok(result.select)
            assert.strictEqual(typeof result.select.convert, 'function')
        })

        it('validate=false => passes value as-is, no validation', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOff,
                productMetadata.baseAttributesList
            )

            const converted = result.select.convert('brand', {} as OrmQuery<Product>)
            assert.deepStrictEqual(converted, { attributes: ['brand'] })
            assert.strictEqual(typeof converted.attributes[0], 'string')
        })

        it('validate=true => valid attribute passes validation', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOn,
                productMetadata.baseAttributesList
            )

            const converted = result.select.convert('brand', {} as OrmQuery<Product>)
            assert.deepStrictEqual(converted, { attributes: ['brand'] })
        })

        it('validate=true => throws Error when attribute is not part of entity', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOn,
                productMetadata.baseAttributesList
            )

            assert.throws(
                () => result.select.convert('nonexistent', {} as OrmQuery<Product>),
                /not a part of baseAttributes/
            )
        })

        it('validate=true => throws Error for external reference attribute', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOn,
                productMetadata.baseAttributesList
            )

            assert.throws(
                () => result.select.convert('prices' as any, {} as OrmQuery<Product>),
                /not a part of baseAttributes/
            )
        })
    })

    describe('converter function behavior', () => {
        it('returns the converted object to allow chaining', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOff,
                productMetadata.baseAttributesList
            )

            const obj = {} as OrmQuery<Product>
            const returned = result.select.convert('brand', obj)
            assert.strictEqual(returned, obj)
        })
    })

    describe('validation behavior', () => {
        it('validate=false => passes only value of type string without validation', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOff,
                productMetadata.baseAttributesList
            )

            const converted = result.select.convert('nonexistent', {} as OrmQuery<Product>)
            assert.deepStrictEqual(converted, { attributes: ['nonexistent'] })

            assert.throws(
                () => result.select.convert(123, {} as OrmQuery<Product>),
                /Type of value is not valid!/
            )
        })

        it('validate=true => throws Error for invalid attribute', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOn,
                productMetadata.baseAttributesList
            )

            assert.throws(
                () => result.select.convert('invalid_attr', {} as OrmQuery<Product>),
                /not a part of baseAttributes/
            )
        })

        it('validate=true => throws Error for numeric value', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOn,
                productMetadata.baseAttributesList
            )

            assert.throws(
                () => result.select.convert(123 as any, {} as OrmQuery<Product>),
                /Type of value is not valid!/
            )
        })
    })

    describe('validators work correctly', () => {
        it('validateSelect does not throw for valid attribute', () => {
            const baseAttributes = productMetadata.baseAttributesList
            assert.doesNotThrow(() => validateSelect<Product>('brand', baseAttributes))
        })

        it('validateSelect throws for invalid attribute', () => {
            const baseAttributes = productMetadata.baseAttributesList
            assert.throws(
                () => validateSelect<Product>('nonexistent', baseAttributes),
                /not a part of baseAttributes/
            )
        })

        it('validateSelect throws for numeric value', () => {
            const baseAttributes = productMetadata.baseAttributesList
            assert.throws(
                () => validateSelect<Product>('123', baseAttributes),
                /not a part of baseAttributes/
            )
        })
    })
})
