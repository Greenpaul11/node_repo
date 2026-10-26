import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { buildRelationAttributeConverters } from '../../../src/converters/query/buildConverters.js'
import { 
    ConvertersBuild, QueryConvertObject, EntityQueryable, 
    QueryRangeAttributeTypes, QueryEntityAttributeValidator, 
    QueryRangeValidator, QuerySelectValidator 
} from '../../../src/types/entity/Query.js'
import { commentMetadata, priceMetadata, productMetadata, shopMetadata } from '../../testSkeleton/metadata.js'
import { Comment, Price, Product, Shop } from '../../testSkeleton/entities.js'
import { EntityBase, ExternalReferences } from '../../../src/types/entity/Root.js'
import { PickByType } from '../../../src/types/Global.js'
import { EntityMetadata } from '../../../src/types/entity/Metadata.js'

// Test orm query type
type OrmQuery = {
    attributes?: (string | unknown[])[]
    include?: Array<{ association?: string; where?: Record<string, unknown> }>
    where?: Record<string, unknown>
}

const config = {
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
    subEntitiesDepth: 2
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

function buildRangeConverter<R extends keyof QueryRangeAttributeTypes, F extends OrmQuery>() {
    return <E extends EntityBase, K extends keyof PickByType<E, QueryRangeAttributeTypes[R]>>(
        value: unknown,
        converted: F,
        suffix: '_from' | '_to',
        attribute: K,
        nested: boolean,
        validate?: QueryRangeValidator<E>
    ): F => {
        if (!converted.where) converted.where = {}
        const op = suffix === '_from' ? '_gte' : '_lt'
        const validatedValue = validate ? validate(value, attribute as any) : value
        converted.where[`${String(attribute)}${op}`] = validatedValue
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
        rangeAttributes: {
            number: buildRangeConverter<'number', F>(),
            date: buildRangeConverter<'date', F>()
        },
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
            order: {} as never, // supported at root level
            group: {} as never // supported at root level
        },
        relationAttributes: {
            relations: <E extends EntityBase, K extends keyof ExternalReferences<E>>(
                value: unknown,
                converted: F,
                attribute: K,
                queryConvertObject: QueryConvertObject<ExternalReferences<E>[K], F>
            ): F => {
                if (!value || typeof value !== 'object') throw new Error('Invalid type for value parameter!')
                if (!converted.include) converted.include = []
                converted.include.push({ association: String(attribute) })
                return converted
            }
        }
    }
}

const convertersBuild = createConvertersBuild()

//  Assert function for checking attribute assingment in converters build
function assertBaseKeys(obj: Record<string, unknown>, expectedKeys: string[], label: string) {
    for (const key of expectedKeys) {
        assert.ok(key in obj, `${label}: missing base attribute "${key}"`)
        const entry = obj[key] as {convert: (value: unknown, converted: unknown) => unknown}
        assert.ok(entry && typeof entry.convert === 'function', `${label}.${key}: missing convert function`)
    }
}

function assertRangeKeys(obj: Record<string, unknown>, attributes: string[], label: string) {
    for (const attr of attributes) {
        assert.ok(`${attr}_from` in obj, `${label}: missing range attr "${attr}_from"`)
        assert.ok(`${attr}_to` in obj, `${label}: missing range attr "${attr}_to"`)
    }
}

//  Test base attribute converter functions
function testBaseConverters(obj: Record<string, unknown>, expectedTypes: [string, string][], label: string ) {
    const converted = {} as { where?: Record<string, unknown> }
    let result = {} as { where: Record<string, unknown> }
    for (const [type, attr] of expectedTypes) {
        const entry = obj[attr] as {convert: (value: unknown, converted: unknown) => { where: Record<string, unknown> }}
        let value: unknown
        switch (type) {
            case 'string':
                value = 1
                break
            case 'number':
                value = 1111
                break
            case 'date':
                value = new Date('2023-03-01T00:00:00Z')
                break
            case 'boolean':
                value = true
                break
            default: 
                throw new Error(`Invalid type "${type}" for base attributes!`)
        }
        result = entry.convert(value, converted)
        assert.ok(converted.where, `${label}: missing property "where" in converted object`)
        assert.ok(Object.hasOwn(converted.where, attr), `${label}: missing converted value for attribute "${attr}"`)
        assert.strictEqual(converted.where[attr], value)
    }
    // Ensure the convert function returns the mutated converted object reference
    assert.deepStrictEqual(result, converted)

}

//  Test base attribute converter functions
function testRangeConverters(obj: Record<string, unknown>, expectedTypes: [string, string, string][], label: string ) {
    const converted = {} as { where?: Record<string, unknown> }
    let result = {} as { where: Record<string, unknown> }
    for (const [type, attrTo, attrFrom] of expectedTypes) {
        const entryTo = obj[attrTo] as {convert: (value: unknown, converted: unknown) => { where: Record<string, unknown> }}
        const entryFrom = obj[attrFrom] as {convert: (value: unknown, converted: unknown) => { where: Record<string, unknown> }}
        const toAfter = attrTo.replace('to', 'lt')
        const fromAfter = attrFrom.replace('from', 'gte')
        let valueTo: unknown
        let valueFrom: unknown
        switch (type) {
            case 'number':
                valueTo = 9999
                valueFrom = 1111
                break
            case 'date':
                valueTo = new Date('2026-03-01T00:00:00Z')
                valueFrom = new Date('1999-03-01T00:00:00Z')
                break
            default: 
                throw new Error(`Invalid type "${type}" for range attributes!`)
        }
        result = entryTo.convert(valueTo, converted)
        result = entryFrom.convert(valueFrom, converted)
        assert.ok(converted.where, `${label}: missing property "where" in converted object`)
        assert.ok(Object.hasOwn(converted.where, toAfter), `${label}: missing converted value for range attribute "${toAfter}"`)
        assert.ok(Object.hasOwn(converted.where, fromAfter), `${label}: missing converted value for range attribute "${fromAfter}"`)
        assert.strictEqual(converted.where[toAfter], valueTo)
        assert.strictEqual(converted.where[fromAfter], valueFrom)
    }
    // Ensure the convert function returns the mutated converted object reference
    assert.deepStrictEqual(result, converted)
}

function testSelectConverter(obj: Record<string, unknown>, expectedAttributes: string[], label: string) {
    const select = obj['select'] as {convert: (value: unknown, converted: unknown) => {attributes: string[]}}
    let converted = {}
    let value: unknown = undefined
    let result: {attributes: string[]}
    // test select as array
    converted = {}
    value = []
    result = select.convert(value, converted)
    assert.ok(result.attributes, `${label}: missing property "attributes" in converted object`)
    assert.ok(Array.isArray(result.attributes), `${label}: "attributes" property of converted object should be type of array`)
    // test select as attributes
    converted = {}
    value = [...expectedAttributes]
    result = select.convert(value, converted)
    assert.ok(result.attributes, `${label}: missing property "attributes" in converted object`)
    const attributes = result.attributes
    for (let i = 0; i < expectedAttributes.length; i++) {
        const expected = expectedAttributes[i]
        assert.ok(attributes.includes(expected), `${label}: missing selected attribute: "${expected}" in convert object`)
    }
    // Ensure the convert function returns the mutated converted object reference
    assert.deepStrictEqual(result, converted)
    // test select as invalid type
    for (const invalid of [undefined, null, 0, '', true]) {
        assert.throws(
            () => select.convert(invalid, converted),
            /Invalid type for select attribute/
        )
    }
    // test select with invalid items
    for (const invalid of [[null, undefined], [1, 2, 3] , [true, false]]) {
        assert.throws(
            () => select.convert(invalid, converted),
            /Invalid type for select item/
        )
    }
}

// Entity attribute metadata (used for assertions)
// Price
const PRICE_BASE = priceMetadata.baseAttributesList
const PRICE_RANGE = priceMetadata.rangeAttributesList
const PRICE_RELATIONS = Object.keys(priceMetadata.subEntities!) as Array<keyof ExternalReferences<Price>>
const PRICE_ATTRIBUTE_TYPES = [
    ...priceMetadata.stringAttributesList.map((a) => ['string', a] as [string, string]),
    ...priceMetadata.numberAttributesList.map((a) => ['number', a] as [string, string]),
    ...priceMetadata.dateAttributesList.map((a) => ['date', a] as [string, string]),
    ...priceMetadata.booleanAttributesList.map((a) => ['boolean', a] as [string, string]),
] satisfies [string, string][]
const PRICE_RANGE_TYPES = [
    ...priceMetadata.numberAttributesList.map((a) => ['number', `${a}_to`, `${a}_from`] as [string, string, string]),
    ...priceMetadata.dateAttributesList.map((a) => ['number', `${a}_to`, `${a}_from`] as [string, string, string])
] satisfies [string, string, string][]
// Shop
const SHOP_BASE = shopMetadata.baseAttributesList
const SHOP_RANGE = shopMetadata.rangeAttributesList
const SHOP_RELATIONS = Object.keys(shopMetadata.subEntities!) as Array<keyof ExternalReferences<Shop>>
const SHOP_ATTRIBUTE_TYPES = [
    ...shopMetadata.stringAttributesList.map((a) => ['string', a] as [string, string]),
    ...shopMetadata.numberAttributesList.map((a) => ['number', a] as [string, string]),
    ...shopMetadata.dateAttributesList.map((a) => ['date', a] as [string, string]),
    ...shopMetadata.booleanAttributesList.map((a) => ['boolean', a] as [string, string]),
] satisfies [string, string][]
const SHOP_RANGE_TYPES = [
    ...shopMetadata.numberAttributesList.map((a) => ['number', `${a}_to`, `${a}_from`] as [string, string, string]),
    ...shopMetadata.dateAttributesList.map((a) => ['number', `${a}_to`, `${a}_from`] as [string, string, string])
] satisfies [string, string, string][]
// Comment
const COMMENT_BASE = commentMetadata.baseAttributesList
const COMMENT_RANGE = commentMetadata.rangeAttributesList
const COMMENT_RELATIONS = Object.keys(commentMetadata.subEntities!) as Array<keyof ExternalReferences<Comment>>
const COMMENT_ATTRIBUTE_TYPES = [
    ...commentMetadata.stringAttributesList.map((a) => ['string', a] as [string, string]),
    ...commentMetadata.numberAttributesList.map((a) => ['number', a] as [string, string]),
    ...commentMetadata.dateAttributesList.map((a) => ['date', a] as [string, string]),
    ...commentMetadata.booleanAttributesList.map((a) => ['boolean', a] as [string, string]),
] satisfies [string, string][]
const COMMENT_RANGE_TYPES = [
    ...commentMetadata.numberAttributesList.map((a) => ['number', `${a}_to`, `${a}_from`] as [string, string, string]),
    ...commentMetadata.dateAttributesList.map((a) => ['number', `${a}_to`, `${a}_from`] as [string, string, string])
] satisfies [string, string, string][]


describe('buildRelationAttributeConverters', () => {

    //  1.  FULL STRUCTURE AT DEPTH 0 (DEFAULT)
    describe('structure at depth 0 (default)', () => {

        it('returns 5 relation entries matching Product external references', () => {
            const result = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, config, productMetadata, 0
            )
            const keys = Object.keys(result).sort()
            assert.deepStrictEqual(keys, [
                'comments', 'prices', 'product_categories',
                'product_importer', 'specification_tree'
            ])
        })

        it('each relation entry has queryConvertObject and convert function', () => {
            const result = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, config, productMetadata, 0
            )
            for (const key of Object.keys(result)) {
                const entry = result[key as keyof typeof result]
                assert.ok(entry.queryConvertObject, `${key}: missing queryConvertObject`)
                assert.strictEqual(typeof entry.convert, 'function', `${key}: missing convert function`)
            }
        })

        describe('prices relation (Price entity, depth 0 => 1)', () => {
            it('queryConvertObject has Price base attribute converters', () => {
                const result = buildRelationAttributeConverters<Product, OrmQuery>(
                    convertersBuild, config, productMetadata, 0
                )
                const convertObj = result.prices.queryConvertObject 
                assertBaseKeys(convertObj, PRICE_BASE, 'prices')
                testBaseConverters(convertObj, PRICE_ATTRIBUTE_TYPES, 'prices')
            })

            it('queryConvertObject has Price range attribute converters', () => {
                const result = buildRelationAttributeConverters<Product, OrmQuery>(
                    convertersBuild, config, productMetadata, 0
                )
                const convertObj = result.prices.queryConvertObject 
                assertRangeKeys(convertObj, PRICE_RANGE, 'prices')
                testRangeConverters(convertObj, PRICE_RANGE_TYPES, 'prices')
            })

            it('queryConvertObject has select converter', () => {
                const result = buildRelationAttributeConverters<Product, OrmQuery>(
                    convertersBuild, config, productMetadata, 0
                )
                const convertObj = result.prices.queryConvertObject
                assert.ok('select' in convertObj)
                assert.strictEqual(typeof convertObj.select.convert, 'function')
                testSelectConverter(convertObj, PRICE_BASE, 'prices')
            })

            it('queryConvertObject has sub-relations: shop, product (depth 1)', () => {
                const result = buildRelationAttributeConverters<Product, OrmQuery>(
                    convertersBuild, config, productMetadata, 0
                )
                const convertObj = result.prices.queryConvertObject 
                for (const rel of PRICE_RELATIONS) {
                    assert.ok(rel in convertObj, `prices: missing sub-relation "${rel}"`)
                    const entry = convertObj[rel] 
                    assert.ok(entry.queryConvertObject, `prices.${rel}: missing queryConvertObject`)
                    assert.strictEqual(typeof entry.convert, 'function', `prices.${rel}: missing convert`)
                }
            })

            it('prices.shop.queryConvertObject has Shop base/range/select/relations (depth 2)', () => {
                const result = buildRelationAttributeConverters<Product, OrmQuery>(
                    convertersBuild, config, productMetadata, 0
                )
                const convertObj = result.prices.queryConvertObject.shop.queryConvertObject 

                assertBaseKeys(convertObj, SHOP_BASE, 'prices.shop')
                assertRangeKeys(convertObj, SHOP_RANGE, 'prices.shop')
                assert.ok('select' in convertObj)
                
                testBaseConverters(convertObj, SHOP_ATTRIBUTE_TYPES, 'shop')
                testRangeConverters(convertObj, SHOP_RANGE_TYPES, 'shop')
                testSelectConverter(convertObj, SHOP_BASE, 'shop')

                for (const rel of SHOP_RELATIONS) {
                    assert.ok(rel in convertObj, `prices.shop: missing sub-relation "${rel}"`)
                    const entry = convertObj[rel] 
                    assert.ok(entry.queryConvertObject, `prices.shop.${rel}: missing queryConvertObject`)
                }
            })

            it('queryConvertObject at depth 3 is empty and convert function throws an error (depth limit)', () => {
                const result = buildRelationAttributeConverters<Product, OrmQuery>(
                    convertersBuild, config, productMetadata, 0
                )
                const entityLevel3 = result.prices.queryConvertObject.shop.queryConvertObject.prices 
                const convertObj = entityLevel3.queryConvertObject

                assert.deepStrictEqual(convertObj, {})
                assert.throws(
                    () => entityLevel3.convert({}, {}),
                    /Depth limit exceeded \(maximum: 2\) when converting query/ 
                )
            })
        })

        describe('comments relation (Comment entity, depth 0 => 1)', () => {
            it('queryConvertObject has Comment base attribute converters', () => {
                const result = buildRelationAttributeConverters<Product, OrmQuery>(
                    convertersBuild, config, productMetadata, 0
                )
                const convertObj = result.comments.queryConvertObject 
                assertBaseKeys(convertObj, COMMENT_BASE, 'comments')
                testBaseConverters(convertObj, COMMENT_ATTRIBUTE_TYPES, 'comments')
            })

            it('queryConvertObject has Comment range attribute converters', () => {
                const result = buildRelationAttributeConverters<Product, OrmQuery>(
                    convertersBuild, config, productMetadata, 0
                )
                const convertObj = result.comments.queryConvertObject 
                assertRangeKeys(convertObj, COMMENT_RANGE, 'comments')
                testRangeConverters(convertObj, COMMENT_RANGE_TYPES, 'comments')
            })

            it('queryConvertObject has sub-relations (product, user, rates) at depth 1', () => {
                const result = buildRelationAttributeConverters<Product, OrmQuery>(
                    convertersBuild, config, productMetadata, 0
                )
                const convertObj = result.comments.queryConvertObject 
                for (const rel of COMMENT_RELATIONS) {
                    assert.ok(rel in convertObj, `comments: missing sub-relation "${rel}"`)
                    const entry = convertObj[rel] 
                    assert.ok(entry.queryConvertObject, `comments.${rel}: missing queryConvertObject`)
                }
            })
        })
    })

    //  2.  DEPTH CONTROL
    describe('depth control', () => {

        it('depth 0 creates relation converters with sub-relations', () => {
            const convertObj = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, config, productMetadata, 0
            )
            // Prices has shop and product at depth 1
            assert.ok('shop' in (convertObj.prices.queryConvertObject))
            assert.ok('product' in (convertObj.prices.queryConvertObject))
        })

        it('depth 1 creates relation converters but limits sub-sub-relations', () => {
            const convertObjLevel1 = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, config, productMetadata, 1
            )
            // Prices exists (2 >= 1)
            assert.ok(convertObjLevel1.prices)
            const convertObjLevel2 = convertObjLevel1.prices.queryConvertObject
            // Prices' sub-relations (shop) have NO further relations (depth 3 exceeds limit)
            const convertObjLevel3 = convertObjLevel2.shop.queryConvertObject 
            assert.ok(!('prices' in convertObjLevel3),
                'at depth 1, shop should NOT have sub-relation "prices" (depth 3 > 2)')
        })

        it('depth equal to subEntitiesDepth limit still creates top-level converters', () => {
            const convertObjLevel2 = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, config, productMetadata, 2
            )
            assert.ok(convertObjLevel2.prices)
            assert.ok(convertObjLevel2.comments)
            // But sub-entities have no sub-relations (depth 3 exceeds limit)
            const convertObjLevel3 = convertObjLevel2.prices.queryConvertObject 
            assert.ok(!('shop' in convertObjLevel3))
            assert.ok(!('product' in convertObjLevel3))
        })

        it('depth exceeding subEntitiesDepth limit returns entries with empty queryConvertObject and convert function', () => {
            const convertObjLevel3 = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, config, productMetadata, 3
            )
            for (const entity in productMetadata.subEntities) {
                assert.ok(entity in convertObjLevel3)
                const entry = convertObjLevel3[entity as keyof typeof convertObjLevel3]
                assert.deepStrictEqual(entry.queryConvertObject, {})
                assert.throws(
                    () => entry.convert({}, {}),
                    /Depth limit exceeded/
                )
            }
        })

        it('depth 0 with subEntitiesDepth limit=0: relations exist but sub-entities have no relations', () => {
            const configDepth0 = {
                ...config,
                subEntitiesDepth: 0
            }
            const convertObj = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, configDepth0, productMetadata, 0
            )
            // Product relations exist (0 < 0 is false => continues)
            assert.ok(convertObj.prices)
            // But sub-entities have no relations (depth 1 > 0)
            const convertObjLevel1 = convertObj.prices.queryConvertObject 
            assert.ok(!('shop' in convertObjLevel1))
            assert.ok(!('product' in convertObjLevel1))
        })
    })

    //  3.  CONVERT FUNCTION BEHAVIOR
    describe('convert function behavior', () => {

        it('calling convert on a relation adds an include entry for the association', () => {
            const convertObj = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, config, productMetadata, 0
            )

            const before = {}
            const converted = convertObj.prices.convert({}, before)
            assert(converted.include)
            assert.strictEqual(converted.include.length, 1)
            assert.strictEqual(converted.include[0].association, 'prices')
            assert.deepStrictEqual(before, converted)
        })

        it('calling convert returns the same converted object (chaining)', () => {
            const convertObj = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, config, productMetadata, 0
            )

            const before: OrmQuery = { include: [] }
            const converted = convertObj.prices.convert({}, before)
            assert.strictEqual(before, converted)
        })

        it('multiple relation convert calls accumulate include entries', () => {
            const convertObj = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, config, productMetadata, 0
            )

            const before: OrmQuery = { include: [] }
            convertObj.prices.convert({}, before)
            convertObj.comments.convert({}, before)
            const converted = convertObj.product_categories.convert({}, before)
            assert(converted.include)
            assert.strictEqual(converted.include.length, 3)
            assert.deepStrictEqual(
                converted.include.map(e => e.association),
                ['prices', 'comments', 'product_categories']
            )
        })

        it('sub-relation convert adds include entry through queryConvertObject access', () => {
            const convertObj = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, config, productMetadata, 0
            )

            const before: OrmQuery = { include: [] }
            const convertObjLevel1 = convertObj.prices.queryConvertObject
            const converted = convertObjLevel1.shop.convert({}, before)
            assert(converted.include)
            assert.strictEqual(converted.include.length, 1)
            assert.strictEqual(converted.include[0].association, 'shop')
        })
    })

    //  4.  SUB-QUERY CONVERSION VIA queryConvertObject
    describe('sub-query conversion via queryConvertObject', () => {

        it('converts base attribute of sub-entity through queryConvertObject', () => {
            const convertObj = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, config, productMetadata, 0
            )

            const before: OrmQuery = { include: [] }
            const convertObjLevel1 = convertObj.prices.queryConvertObject
            const converted = convertObjLevel1.url.convert('http://example.com', before)
            assert.deepStrictEqual(converted.where, { url: 'http://example.com' })
        })

        it('converts range attribute of sub-entity through queryConvertObject', () => {
            const convertObj = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, config, productMetadata, 0
            )

            const before: OrmQuery = { include: [] }
            const convertObjLevel1 = convertObj.prices.queryConvertObject
            const converted = convertObjLevel1.price_from.convert(10, before)
            assert.deepStrictEqual(converted.where, { price_gte: 10 })
        })

        it('converts select on sub-entity through queryConvertObject', () => {
            const convertObj = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, config, productMetadata, 0
            )

            const before: OrmQuery = { include: [] }
            const convertObjLevel1 = convertObj.prices.queryConvertObject
            const converted = convertObjLevel1.select.convert(['url', 'price'], before)
            assert(converted.attributes)
            assert.ok(converted.attributes.includes('url'))
            assert.ok(converted.attributes.includes('price'))
        })

        it('navigates nested sub-entity converters through queryConvertObject chain', () => {
            const convertObj = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, config, productMetadata, 0
            )

            const before: OrmQuery = { include: [] }
            const convertObjLevel2 = convertObj.prices.queryConvertObject.shop.queryConvertObject
            const converted = convertObjLevel2.name.convert('TestShop', before)
            assert.deepStrictEqual(converted.where, { name: 'TestShop' })
        })
    })

    //  5.  ERROR CASES
    describe('error handling', () => {

        it('circular entity graph references are stopped by depth limit (no infinite loop)', () => {
            // Product => Price => Shop => Price => ... is circular
            // subEntitiesDepth limit = 2, so depth 3 exceeds limit
            const convertObj = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, config, productMetadata, 0
            )

            // Depth: Product(0) => Price(1) => Shop(2) => Price(3 exceeds limit)
            // At depth 2, shop exists and has sub-relations (2 < 2 is false)
            const convertObjLevel2 = convertObj.prices.queryConvertObject.shop.queryConvertObject
            assert.ok('prices' in convertObjLevel2,
                'shop at depth 2 still has prices sub-relation')

            // At depth 3: shop.prices.queryConvertObject has NO sub-relations
            const convertObjLevel3 = convertObjLevel2.prices.queryConvertObject
            const subRelationKeys = Object.keys(convertObjLevel3).filter(k =>
                typeof convertObjLevel3[k as keyof typeof convertObjLevel3] === 'object'
                && 'queryConvertObject' in convertObjLevel3[k as keyof typeof convertObjLevel3]
            )
            assert.strictEqual(subRelationKeys.length, 0,
                'shop.prices at depth 3 should have no sub-entity relations')
        })

        it('passing null as value throws an error', () => {
            const convertObj = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, config, productMetadata, 0
            )

            const before: OrmQuery = {}
            assert.throws(
                () => convertObj.prices.convert(null, before),
                /Invalid type for value/
            )
        })

        it('passing undefined as value throws an error', () => {
            const convertObj = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, config, productMetadata, 0
            )

            const before: OrmQuery = {} 
            assert.throws(
                () => convertObj.prices.convert(undefined, before),
                /Invalid type for value/
            )
        })

        it('passing non-object as value throws an error', () => {
            const convertObj = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, config, productMetadata, 0
            )

            const before: OrmQuery = {}
            assert.throws(
                () => convertObj.prices.convert(42, before),
                /Invalid type for value/
            )
            assert.throws(
                () => convertObj.prices.convert('string', before),
                /Invalid type for value/
            )
            assert.throws(
                () => convertObj.prices.convert(true, before),
                /Invalid type for value/
            )
        })

        it('passing object as value and empty converted initializes include array', () => {
            const convertObj = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, config, productMetadata, 0
            )

            const before: OrmQuery = {}
            const converted = convertObj.prices.convert({}, before)
            assert(converted.include)
            assert.strictEqual(converted.include!.length, 1)
            assert.strictEqual(converted, before)
        })

        it('independent relation converter instances produce independent results', () => {
            const convertObjA = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, config, productMetadata, 0
            )
            const convertObjB = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, config, productMetadata, 0
            )

            const accA: OrmQuery = {}
            const accB: OrmQuery = {}
            convertObjA.prices.convert({}, accA)
            convertObjB.comments.convert({}, accB)

            // A only has prices
            assert.strictEqual(accA.include!.length, 1)
            assert.strictEqual(accA.include![0].association, 'prices')
            // B only has comments
            assert.strictEqual(accB.include!.length, 1)
            assert.strictEqual(accB.include![0].association, 'comments')
            // Each should not have the other's entries
            assert.strictEqual(accA.include![0].association, 'prices')
            assert.strictEqual(accB.include![0].association, 'comments')
        })

        it('depth limit=0 with exceeding depth parameter returns always "depth exceeding handler"', () => {
            const configDepth0 = {
                ...config,
                subEntitiesDepth: 0
            }
            // depth 1 already exceeds subEntitiesDepth limit 0
            const convertObjLevel1 = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, configDepth0, productMetadata, 1
            )
            for (const entity in productMetadata.subEntities) {
                assert.ok(entity in convertObjLevel1)
                const entry = convertObjLevel1[entity as keyof typeof convertObjLevel1]
                assert.deepStrictEqual(entry.queryConvertObject, {})
                assert.throws(
                    () => entry.convert({}, {}),
                    /Depth limit exceeded/
                )
            }
            // depth 0 still works (0 < 0 is false)
            const convertObjLevel0 = buildRelationAttributeConverters<Product, OrmQuery>(
                convertersBuild, configDepth0, productMetadata, 0
            )
            for (const entity in productMetadata.subEntities) {
                assert.ok(entity in convertObjLevel0)
                const entry = convertObjLevel0[entity as keyof typeof convertObjLevel0]
                assert.deepStrictEqual(entry.queryConvertObject, {})
                assert.throws(
                    () => entry.convert({}, {}),
                    /Depth limit exceeded/
                )
            }
        })
    })
})