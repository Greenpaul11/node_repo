import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { buildQueryAttributeConverters } from '../../../src/formaters/query/buildConverters'
import { ConvertersBuild, QueryFormaterBaseConfig, QuerySelectValidator } from '../../../src/types/entity/Query'
import { productMetadata } from '../../testSkeleton/config'
import { Product } from '../../testSkeleton/entities'
import { EntityBase, EntityNoExternal } from '../../../src/types/entity/Root'
import { validateSelect } from '../../../src/formaters/query/validators'
import { EntityMetadata } from '../../../src/types/entity/Metadata'
import { escape } from 'node:querystring'

type OrmQuery<E extends EntityBase> = {
    attributes: (string | unknown[])[]
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

// create test converter build
const convertersBuild: ConvertersBuild<Product, OrmQuery<Product>> = {
    baseAttributes: {} as never,
    rangeAttributes: {} as never,
    queryAttributes: {
        select: (
            value: unknown,
            converted: OrmQuery<Product>,
            metadata: EntityMetadata<Product>,
            validate?: QuerySelectValidator<Product>
        ) => {
            const attributes = metadata.baseAttributesList
            if (!converted.attributes) converted.attributes = [] 
            if (Array.isArray(value)) {
                for (let i = 0; i < value.length; i++) {
                    const item = value[i]
                    if (typeof item === 'string') {
                        if (validate) validate(item, attributes)
                        converted.attributes.push(item)
                    } else if (Array.isArray(item)) {
                        converted.attributes.push(item)
                    } else {
                        throw new Error('Invalid type for select item!')
                    }
                }
            } else {
                throw new Error('Invalid type for select attribute where expected list of attributes or aggregates!')
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
                productMetadata
            )

            assert.ok(result.select)
            assert.strictEqual(typeof result.select.convert, 'function')
        })

        it('validate=false => passes value as-is, no validation', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOff,
                productMetadata
            )

            const converted = result.select.convert(['brand'], {} as OrmQuery<Product>)
            assert.deepStrictEqual(converted, { attributes: ['brand'] })
            assert.strictEqual(typeof converted.attributes[0], 'string')
        })

        it('validate=true => valid attribute passes validation', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOn,
                productMetadata
            )

            const converted = result.select.convert(['brand'], {} as OrmQuery<Product>)
            assert.deepStrictEqual(converted, { attributes: ['brand'] })
        })

        it('validate=true => passes all baseAttributes of entity', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOn,
                productMetadata
            )
            const converted = result.select.convert([...productMetadata.baseAttributesList], {} as OrmQuery<Product>)
            assert.deepStrictEqual(converted, { attributes: [...productMetadata.baseAttributesList] })
        })

        it('validate=true => throws Error when attribute is not part of entity', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOn,
                productMetadata
            )

            assert.throws(
                () => result.select.convert(['nonexistent'], {} as OrmQuery<Product>),
                /not a part of baseAttributes/
            )
        })

        it('validate=true => throws Error for external reference attribute', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOn,
                productMetadata
            )

            assert.throws(
                () => result.select.convert(['prices'] as any, {} as OrmQuery<Product>),
                /not a part of baseAttributes/
            )
        })

        it('validate=false => aggregate function tuple passes through', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOff,
                productMetadata
            )

            const converted = result.select.convert(
                [['$count', '*']] as any,
                {} as OrmQuery<Product>
            )
            assert.ok(Array.isArray(converted.attributes[0]))
            assert.deepStrictEqual(converted.attributes[0], ['$count', '*'])
        })

        it('validate=false => aggregate function with attribute passes through', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOff,
                productMetadata
            )

            const converted = result.select.convert(
                [['$sum', 'id'], 'id'] as any,
                {} as OrmQuery<Product>
            )
            assert.deepStrictEqual(converted.attributes, [['$sum', 'id'], 'id'])
        })

        it('validate=true => aggregate function passes through without validation', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOn,
                productMetadata
            )

            const converted = result.select.convert(
                [['$count', '*']] as any,
                {} as OrmQuery<Product>
            )
            assert.deepStrictEqual(converted.attributes[0], ['$count', '*'])
        })
    })

    describe('converter function behavior', () => {
        it('returns the converted object to allow chaining', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOff,
                productMetadata
            )

            const obj = {} as OrmQuery<Product>
            const returned = result.select.convert(['brand'], obj)
            assert.strictEqual(returned, obj)
        })
    })

    describe('validation behavior', () => {
        it('validate=false => passes only value of type array without validation', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOff,
                productMetadata
            )

            const converted = result.select.convert(['nonexistent'], {} as OrmQuery<Product>)
            assert.deepStrictEqual(converted, { attributes: ['nonexistent'] })
            
            assert.throws(
                () => result.select.convert(123, {} as OrmQuery<Product>),
                /Invalid type for select attribute where expected list of attributes or aggregates!/
            )
        })

        it('validate=false => passes only array of values of type string or tuple without validation', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOff,
                productMetadata
            )

            const converted = result.select.convert(['nonexistent', ['some', 'some']], {} as OrmQuery<Product>)
            assert.deepStrictEqual(converted, { attributes: ['nonexistent', ['some', 'some']] })

            assert.throws(
                () => result.select.convert(123, {} as OrmQuery<Product>),
                /Invalid type for select attribute where expected list of attributes or aggregates!/
            )
        })

        it('validate=true => throws Error for array with invalid item', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOn,
                productMetadata
            )

            assert.throws(
                () => result.select.convert(['invalid_attr'], {} as OrmQuery<Product>),
                /not a part of baseAttributes/
            )
        })

        it('validate=true => throws Error for array with invalid item (numeric)', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery<Product>>(
                convertersBuild,
                configOn,
                productMetadata
            )

            assert.throws(
                () => result.select.convert([123] as any, {} as OrmQuery<Product>),
                /Invalid type for select item!/
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
