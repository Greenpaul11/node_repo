import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { buildQueryAttributeConverters } from '../../../src/formaters/query/buildConverters'
import { ConvertersBuild, QuerySelectValidator, QuerySortValidator } from '../../../src/types/entity/Query'
import { productMetadata } from '../../testSkeleton/config'
import { Product } from '../../testSkeleton/entities'
import { EntityBase } from '../../../src/types/entity/Root'
import { validateSelect, validateSort } from '../../../src/formaters/query/validators'
import { EntityMetadata, SortOptions } from '../../../src/types/entity/Metadata'

type OrmQuery= {
    attributes: (string | unknown[])[]
    order?: unknown[]
    group?: unknown[]
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

function createConvertersBuild<F extends OrmQuery>(): ConvertersBuild<F> {
    return {
        baseAttributes: {} as never,
        rangeAttributes: {} as never,
        queryAttributes: {
            select: <E extends EntityBase>(
                value: unknown,
                converted: F,
                metadata: EntityMetadata<E>,
                nested: boolean,
                validate?: QuerySelectValidator<E>
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
            },
            order: <E extends EntityBase>(
                value: unknown,
                converted: F,
                options: SortOptions<E>,
                _nested: boolean,
                validate?: QuerySortValidator
            ) => {
                if (validate) {
                    validate(value)
                }
                if (!converted.order) converted.order = []
                if (typeof value === 'string') {
                    converted.order.push(value)
                } else if (Array.isArray(value)) {
                    for (let i = 0; i < value.length; i++) {
                        const item = value[i]
                        if (typeof item === 'string') {
                            converted.order.push(item)
                        } else if (Array.isArray(item)) {
                            converted.order.push(item)
                        } else {
                            throw new Error('Invalid type for order item!')
                        }
                    }
                } else {
                    throw new Error('Invalid type for order value where expected string or array!')
                }
                return converted
            },
            group: <E extends EntityBase>(
                value: unknown,
                converted: F,
                _options: SortOptions<E>,
                validate?: QuerySortValidator
            ) => {
                if (validate) {
                    validate(value)
                }
                if (!converted.group) converted.group = []
                if (typeof value === 'string') {
                    converted.group.push(value)
                } else if (Array.isArray(value)) {
                    for (let i = 0; i < value.length; i++) {
                        const item = value[i]
                        if (typeof item === 'string') {
                            converted.group.push(item)
                        } else if (Array.isArray(item)) {
                            converted.group.push(item)
                        } else {
                            throw new Error('Invalid type for group item!')
                        }
                    }
                } else {
                    throw new Error('Invalid type for group value where expected string or array!')
                }
                return converted
            }
        },
        relationAttributes: {} as never
    }
}

const convertersBuild = createConvertersBuild()

describe('buildQueryAttributeConverters', () => {
    describe('select converter', () => {
        it('creates select converter with convert function', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOff,
                productMetadata
            )

            assert.ok(result.select)
            assert.strictEqual(typeof result.select.convert, 'function')
        })

        it('validate=false => passes value as-is, no validation', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOff,
                productMetadata
            )

            const converted = result.select.convert(['brand'], {} as OrmQuery)
            assert.deepStrictEqual(converted, { attributes: ['brand'] })
            assert.strictEqual(typeof converted.attributes[0], 'string')
        })

        it('validate=true => valid attribute passes validation', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOn,
                productMetadata
            )

            const converted = result.select.convert(['brand'], {} as OrmQuery)
            assert.deepStrictEqual(converted, { attributes: ['brand'] })
        })

        it('validate=true => passes all baseAttributes of entity', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOn,
                productMetadata
            )
            const converted = result.select.convert([...productMetadata.baseAttributesList], {} as OrmQuery)
            assert.deepStrictEqual(converted, { attributes: [...productMetadata.baseAttributesList] })
        })

        it('validate=true => throws Error when attribute is not part of entity', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOn,
                productMetadata
            )

            assert.throws(
                () => result.select.convert(['nonexistent'], {} as OrmQuery),
                /not a part of baseAttributes/
            )
        })

        it('validate=true => throws Error for external reference attribute', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOn,
                productMetadata
            )

            assert.throws(
                () => result.select.convert(['prices'] as any, {} as OrmQuery),
                /not a part of baseAttributes/
            )
        })

        it('validate=false => aggregate function tuple passes through', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOff,
                productMetadata
            )

            const converted = result.select.convert(
                [['$count', '*']] as any,
                {} as OrmQuery
            )
            assert.ok(Array.isArray(converted.attributes[0]))
            assert.deepStrictEqual(converted.attributes[0], ['$count', '*'])
        })

        it('validate=false => aggregate function with attribute passes through', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOff,
                productMetadata
            )

            const converted = result.select.convert(
                [['$sum', 'id'], 'id'] as any,
                {} as OrmQuery
            )
            assert.deepStrictEqual(converted.attributes, [['$sum', 'id'], 'id'])
        })

        it('validate=true => aggregate function passes through without validation', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOn,
                productMetadata
            )

            const converted = result.select.convert(
                [['$count', '*']],
                {} as OrmQuery
            )
            assert.deepStrictEqual(converted.attributes[0], ['$count', '*'])
        })
    })

    describe('converter function behavior', () => {
        it('returns the converted object to allow chaining', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOff,
                productMetadata
            )

            const obj = {} as OrmQuery
            const returned = result.select.convert(['brand'], obj)
            assert.strictEqual(returned, obj)
        })
    })

    describe('validation behavior', () => {
        it('validate=false => passes only value of type array without validation', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOff,
                productMetadata
            )

            const converted = result.select.convert(['nonexistent'], {} as OrmQuery)
            assert.deepStrictEqual(converted, { attributes: ['nonexistent'] })
            
            assert.throws(
                () => result.select.convert(123, {} as OrmQuery),
                /Invalid type for select attribute where expected list of attributes or aggregates!/
            )
        })

        it('validate=false => passes only array of values of type string or tuple without validation', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOff,
                productMetadata
            )

            const converted = result.select.convert(['nonexistent', ['some', 'some']], {} as OrmQuery)
            assert.deepStrictEqual(converted, { attributes: ['nonexistent', ['some', 'some']] })

            assert.throws(
                () => result.select.convert(123, {} as OrmQuery),
                /Invalid type for select attribute where expected list of attributes or aggregates!/
            )
        })

        it('validate=true => throws Error for array with invalid item', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOn,
                productMetadata
            )

            assert.throws(
                () => result.select.convert(['invalid_attr'], {} as OrmQuery),
                /not a part of baseAttributes/
            )
        })

        it('validate=true => throws Error for array with invalid item (numeric)', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOn,
                productMetadata
            )

            assert.throws(
                () => result.select.convert([123] as any, {} as OrmQuery),
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

    describe('order converter', () => {
        it('creates order converter with convert function', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOff,
                productMetadata
            )

            assert.ok(result.order)
            assert.strictEqual(typeof result.order.convert, 'function')
        })

        it('validate=false => passes string value as-is', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOff,
                productMetadata
            )

            const converted = result.order.convert('by brand asc', {} as OrmQuery)
            assert.deepStrictEqual(converted, { order: ['by brand asc'] })
        })

        it('validate=true => valid string value passes', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOn,
                productMetadata
            )

            const converted = result.order.convert('by brand asc', {} as OrmQuery)
            assert.deepStrictEqual(converted, { order: ['by brand asc'] })
        })

        it('validate=false => array of strings passes through', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOff,
                productMetadata
            )

            const input = ['by brand asc', 'by model desc']
            const converted = result.order.convert(input, {} as OrmQuery)
            assert.deepStrictEqual(converted, { order: input })
        })

        it('validate=true => array of valid strings passes', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOn,
                productMetadata
            )

            const input = ['by brand asc', 'by model desc']
            const converted = result.order.convert(input, {} as OrmQuery)
            assert.deepStrictEqual(converted, { order: input })
        })

        it('validate=true => passes with nested relation tuple', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOn,
                productMetadata
            )

            const input = ['by brand asc', ['prices', ['by amount asc']]]
            const converted = result.order.convert(input, {} as OrmQuery)
            assert.deepStrictEqual(converted, { order: input })
        })

        it('validate=false => nested relation tuple passes through', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOff,
                productMetadata
            )

            const input = ['by brand asc', ['prices', ['by amount asc']]]
            const converted = result.order.convert(input, {} as OrmQuery)
            assert.deepStrictEqual(converted, { order: input })
        })

        it('validate=true => throws Error for non-string, non-array value', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOn,
                productMetadata
            )

            assert.throws(
                () => result.order.convert(123, {} as OrmQuery),
                /can not be used as order value/
            )
        })

        it('validate=false => throws Error for non-string, non-array value', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOff,
                productMetadata
            )

            assert.throws(
                () => result.order.convert(123, {} as OrmQuery),
                /Invalid type for order value/
            )
        })

        it('returns the converted object to allow chaining', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOff,
                productMetadata
            )

            const obj = {} as OrmQuery
            const returned = result.order.convert('by brand asc', obj)
            assert.strictEqual(returned, obj)
        })
    })

    describe('validation behavior', () => {
        it('validate=false => passes any string value without validation', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOff,
                productMetadata
            )

            const converted = result.order.convert('nonexistent_option', {} as OrmQuery)
            assert.deepStrictEqual(converted, { order: ['nonexistent_option'] })
        })

        it('validate=true => throws Error for non-string array item', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOn,
                productMetadata
            )

            assert.throws(
                () => result.order.convert(['by brand asc', 123] as any, {} as OrmQuery),
                /Array item at index 1 at depth: 0 is not valid/
            )
        })
    })

    describe('validators work correctly', () => {
        it('validateSort does not throw for valid string', () => {
            assert.doesNotThrow(() => validateSort('by brand asc'))
        })

        it('validateSort does not throw for array of strings', () => {
            assert.doesNotThrow(
                () => validateSort(['by brand asc', 'by model desc'])
            )
        })

        it('validateSort does not throw for nested relation tuple', () => {
            assert.doesNotThrow(
                () => validateSort(['by brand asc', ['prices', ['by amount asc']]])
            )
        })

        it('validateSort throws for numeric value', () => {
            assert.throws(
                () => validateSort(123),
                /can not be used as order value/
            )
        })

        it('validateSort throws for null', () => {
            assert.throws(
                () => validateSort(null),
                /can not be used as order value/
            )
        })

        it('validateSort throws for object value', () => {
            assert.throws(
                () => validateSort({}),
                /can not be used as order value/
            )
        })

        it('validateSort throws for array with non-string, non-array item', () => {
            assert.throws(
                () => validateSort(['by brand asc', true]),
                /Array item at index 1 at depth: 0 is not valid/
            )
        })

        it('validateSort throws for malformed nested tuple (non-string relation name)', () => {
            assert.throws(
                () => validateSort(['by brand asc', [123, ['by amount asc']]]),
                /Expected.*relationName/
            )
        })
    })

    describe('group converter', () => {
        it('creates group converter with convert function', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOff,
                productMetadata
            )

            assert.ok(result.group)
            assert.strictEqual(typeof result.group.convert, 'function')
        })

        it('validate=false => passes string value as-is', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOff,
                productMetadata
            )

            const converted = result.group.convert('by brand', {} as OrmQuery)
            assert.deepStrictEqual(converted, { group: ['by brand'] })
        })

        it('validate=true => valid string value passes', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOn,
                productMetadata
            )

            const converted = result.group.convert('by brand', {} as OrmQuery)
            assert.deepStrictEqual(converted, { group: ['by brand'] })
        })

        it('validate=false => array of strings passes through', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOff,
                productMetadata
            )

            const input = ['by brand', 'by model']
            const converted = result.group.convert(input, {} as OrmQuery)
            assert.deepStrictEqual(converted, { group: input })
        })

        it('validate=true => array of valid strings passes', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOn,
                productMetadata
            )

            const input = ['by brand', 'by model']
            const converted = result.group.convert(input, {} as OrmQuery)
            assert.deepStrictEqual(converted, { group: input })
        })

        it('validate=true => passes with nested relation tuple', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOn,
                productMetadata
            )

            const input = ['by brand', ['prices', ['by amount']]]
            const converted = result.group.convert(input, {} as OrmQuery)
            assert.deepStrictEqual(converted, { group: input })
        })

        it('validate=false => nested relation tuple passes through', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOff,
                productMetadata
            )

            const input = ['by brand', ['prices', ['by amount']]]
            const converted = result.group.convert(input, {} as OrmQuery)
            assert.deepStrictEqual(converted, { group: input })
        })

        it('validate=true => throws Error for non-string, non-array value', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOn,
                productMetadata
            )

            assert.throws(
                () => result.group.convert(123, {} as OrmQuery),
                /can not be used as order value/
            )
        })

        it('validate=false => throws Error for non-string, non-array value', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOff,
                productMetadata
            )

            assert.throws(
                () => result.group.convert(123, {} as OrmQuery),
                /Invalid type for group value/
            )
        })

        it('returns the converted object to allow chaining', () => {
            const result = buildQueryAttributeConverters<Product, OrmQuery>(
                convertersBuild,
                validationOff,
                productMetadata
            )

            const obj = {} as OrmQuery
            const returned = result.group.convert('by brand', obj)
            assert.strictEqual(returned, obj)
        })
    })
})

