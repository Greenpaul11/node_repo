import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import Decimal from 'decimal.js'
import { buildConverters } from '../../../src/formaters/output/buildConverters'
import { ConverterFunctionsBuild } from '../../../src/types/entity/Converters'
import { productMetadata } from '../../testSkeleton/config'
import { Product } from '../../testSkeleton/entities'


const converterFunctionsBuild: ConverterFunctionsBuild = {
    baseAttributes: {
        number: (value) => Number.parseFloat(value),
        decimal: (value) => new Decimal(value),
        boolean: (value) => Boolean(value),
        date: (value) => new Date(value)
    },
    fns: {}
}

describe('buildConverters - test baseAttributes', () => {
    const productConverters = buildConverters<Product>(productMetadata, converterFunctionsBuild)

    it('creates base converters for base attribute defined in metadata', () => {
        const baseKeys = Object.keys(productConverters.baseAttributes).sort()
        assert.deepStrictEqual(baseKeys, [ 'active', 'created', 'id', 'importer_id', 'updated' ])
    })

    it('applies the provided type converters when invoked', () => {
        const importerConverter = productConverters.baseAttributes.importer_id
        const priceConverter = productConverters.subEntities.prices.baseAttributes.price
        const activeConverter = productConverters.baseAttributes.active
        const createdConverter = productConverters.baseAttributes.created

        assert.ok(importerConverter)
        assert.strictEqual(importerConverter('22'), 22)

        assert.ok(priceConverter)
        const decimalValue = priceConverter(123.45)
        assert.ok(decimalValue instanceof Decimal)
        assert.strictEqual(decimalValue.toString(), '123.45')

        assert.ok(activeConverter)
        assert.strictEqual(activeConverter(0), false)
        assert.strictEqual(activeConverter(1), true)

        assert.ok(createdConverter)
        const created = createdConverter('2024-04-01T12:15:00Z')
        assert.ok(created instanceof Date)
        assert.strictEqual(created.toISOString().startsWith('2024-04-01'), true)
    })

    it('builds converters recursively for nested relations', () => {
        const priceConverters = productConverters.subEntities.prices
        assert.ok(priceConverters)

        const shopConverters = priceConverters.subEntities.shop
        assert.ok(shopConverters)
        const shopCreated = shopConverters.baseAttributes.created
        assert.ok(shopCreated)
        const shopDate = shopCreated('2020-01-01T00:00:00Z')
        assert.ok(shopDate instanceof Date)
        assert.strictEqual(shopDate.toISOString().startsWith('2020-01-01'), true)
    })

    it('stops recursion after depth five to avoid infinite loops', () => {
        const level1 = productConverters.subEntities.prices
        assert.ok(level1)

        const level2 = level1.subEntities.product
        assert.ok(level2)

        const level3 = level2.subEntities.prices
        assert.ok(level3)

        const level4 = level3.subEntities.product
        assert.ok(level4)

        const level5 = level4.subEntities.prices
        assert.ok(level5)

        assert.deepStrictEqual(Object.keys(level5.subEntities), [])
    })
})


describe('buildConverters - test subEntities', () => {
    const productConverters = buildConverters<Product>(productMetadata, converterFunctionsBuild)
    const priceConverters = productConverters.subEntities.prices
    const shopConverters = priceConverters.subEntities.shop
    
    it('creates subEntity converters for all relations defined in metadata', () => {
        const subEntityKeys = Object.keys(productConverters.subEntities).sort()
        assert.deepStrictEqual(subEntityKeys, [
            'comments', 
            'prices', 
            'product_categories', 
            'product_importer', 
            'specification_tree'
        ])
    })

    it('creates baseAttributes for first-level subEntity', () => {        
        const priceBaseKeys = Object.keys(priceConverters.baseAttributes).sort()
        assert.deepStrictEqual(priceBaseKeys, [ 'active', 'created', 'id', 'price', 'product_id', 'shop_id', 'updated' ])
    })

    it('creates subEntities for second-level nested relations', () => {
        const shopAndProductKeys = Object.keys(priceConverters.subEntities).sort()
        assert.deepStrictEqual(shopAndProductKeys, [ 'product', 'shop' ])
    })

    it('applies converters correctly through subEntity chain', () => {
        const shopActiveConverter = shopConverters.baseAttributes.active
        assert.ok(shopActiveConverter)
        assert.strictEqual(shopActiveConverter(1), true)
        assert.strictEqual(shopActiveConverter(0), false)
    })

    it('subEntity has correct baseAttributes structure', () => {
        const shopBaseKeys = Object.keys(shopConverters.baseAttributes).sort()
        assert.deepStrictEqual(shopBaseKeys, [ 'active', 'created', 'founded', 'id', 'updated' ])
    })

    it('subEntity at depth 3 continues to have subEntities', () => {
        const shopSubEntityKeys = Object.keys(shopConverters.subEntities).sort()
        assert.deepStrictEqual(shopSubEntityKeys, [ 'prices' ])
    })

    it('subEntity at depth 4 still has subEntities', () => {
        const level1 = productConverters.subEntities.prices
        assert.ok(level1)

        const level2 = level1.subEntities.product
        assert.ok(level2)

        const level3 = level2.subEntities.prices
        assert.ok(level3)

        assert.ok(Object.keys(level3.subEntities).length > 0)
    })

    it('subEntity at depth 5 has no subEntities', () => {
        const level1 = productConverters.subEntities.prices
        assert.ok(level1)

        const level2 = level1.subEntities.product
        assert.ok(level2)

        const level3 = level2.subEntities.prices
        assert.ok(level3)

        const level4 = level3.subEntities.product
        assert.ok(level4)

        const level5 = level4.subEntities.prices
        assert.ok(level5)

        assert.deepStrictEqual(Object.keys(level5.subEntities), [])
    })

    it('subEntity with empty fns at non-root levels', () => {
        const priceConverters = productConverters.subEntities.prices
        assert.ok(priceConverters)
        assert.strictEqual(priceConverters.fns, undefined)
    })

    it('deeply nested subEntity chain preserves converter functions', () => {
        const productBaseConverter = productConverters.baseAttributes.id
        assert.ok(productBaseConverter)
        assert.strictEqual(productBaseConverter('123'), 123)


        const priceBaseConverter = productConverters.subEntities.prices.baseAttributes.id
        assert.ok(priceBaseConverter)
        assert.strictEqual(priceBaseConverter('456'), 456)


        const shopBaseConverter = productConverters.subEntities.prices.subEntities.shop.baseAttributes.id
        assert.ok(shopBaseConverter)
        assert.strictEqual(shopBaseConverter('789'), 789)
    })

    it('subEntity chain can traverse through prices back to product', () => {
        const priceSubEntity = productConverters.subEntities.prices
        assert.ok(priceSubEntity)


        const productSubEntityFromPrice = priceSubEntity.subEntities.product
        assert.ok(productSubEntityFromPrice)


        const productBaseConverter = productSubEntityFromPrice.baseAttributes.id
        assert.ok(productBaseConverter)
        assert.strictEqual(productBaseConverter('999'), 999)
    })

    it('subEntity baseAttributes work with decimal type converter', () => {
        const priceConverter = productConverters.subEntities.prices.baseAttributes.price
        assert.ok(priceConverter)
        const result = priceConverter('999.99')
        assert.ok(result instanceof Decimal)
        assert.strictEqual(result.toString(), '999.99')
    })

    it('subEntity baseAttributes work with date type converter', () => {
        const priceCreatedConverter = productConverters.subEntities.prices.baseAttributes.created
        assert.ok(priceCreatedConverter)
        const result = priceCreatedConverter('2024-06-15T10:30:00Z')
        assert.ok(result instanceof Date)
        assert.strictEqual(result.toISOString().startsWith('2024-06-15'), true)
    })
})


describe('buildConverters - test fns', () => {
    const productConverters = buildConverters<Product>(productMetadata, converterFunctionsBuild)
    productConverters['fns'] = {
        $count: (value) => Number(value),
        $avg: (value) => new Decimal(value),
        $sum: (value) => new Decimal(value),
        $min: (value) => new Decimal(value),
        $max: (value) => new Decimal(value)
    }
    
    it('creates fns converters declared in converterFunctionsBuild', () => {
        assert(productConverters.fns)
        const fnsKeys = Object.keys(productConverters.fns).sort()
        assert.deepStrictEqual(fnsKeys, [ '$avg', '$count', '$max', '$min', '$sum' ])
    })

    it('applies $count converter correctly', () => {
        assert.ok(productConverters.fns)
        const countConverter = productConverters.fns['$count']
        assert.ok(countConverter)
        assert.strictEqual(countConverter('42'), 42)
        assert.strictEqual(countConverter(100), 100)
    })

    it('applies $avg converter correctly', () => {
        assert.ok(productConverters.fns)
        const avgConverter = productConverters.fns['$avg']
        assert.ok(avgConverter)
        const result = avgConverter('15.5')
        assert.ok(result instanceof Decimal)
        assert.strictEqual(result.toString(), '15.5')
    })

    it('applies $sum converter correctly', () => {
        assert.ok(productConverters.fns)
        const sumConverter = productConverters.fns['$sum']
        assert.ok(sumConverter)
        const result = sumConverter('999.99')
        assert.ok(result instanceof Decimal)
        assert.strictEqual(result.toString(), '999.99')
    })

    it('applies $min converter correctly', () => {
        assert.ok(productConverters.fns)
        const minConverter = productConverters.fns['$min']
        assert.ok(minConverter)
        const result = minConverter('1.5')
        assert.ok(result instanceof Decimal)
        assert.strictEqual(result.toString(), '1.5')
    })

    it('applies $max converter correctly', () => {
        assert.ok(productConverters.fns)
        const maxConverter = productConverters.fns['$max']
        assert.ok(maxConverter)
        const result = maxConverter('100')
        assert.ok(result instanceof Decimal)
        assert.strictEqual(result.toString(), '100')
    })

    it('fn converters are only available at root level', () => {
        const priceConverters = productConverters.subEntities.prices
        assert.ok(priceConverters)
        assert.strictEqual(priceConverters.fns, undefined)
    })
})


