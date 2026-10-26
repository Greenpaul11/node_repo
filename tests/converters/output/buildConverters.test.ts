import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import { Decimal } from 'decimal.js'
import { buildConverters } from '../../../src/converters/output/buildConverters.js'
import { productMetadata } from '../../testSkeleton/metadata.js'
import type { Product } from '../../testSkeleton/entities.ts'
import type { EntityConvertersBuild, OutputConverterConfig } from '../../../src/types/entity/Converters.ts'


const converterFunctionsBuild: EntityConvertersBuild = {
    baseAttributes: {
        number: (value) => Number.parseFloat(value),
        decimal: (value) => new Decimal(value),
        boolean: (value) => Boolean(value),
        date: (value) => new Date(value)
    },
    fns: {}
}

const config: OutputConverterConfig = {
    subEntitiesDepth: 5
}

describe('buildConverters - test baseAttributes', () => {
    const productConverters = buildConverters<Product>(converterFunctionsBuild, config, productMetadata)

    it('creates base converters for base attribute defined in metadata', () => {
        const baseKeys = Object.keys(productConverters.baseAttributes).sort()
        assert.deepStrictEqual(baseKeys, [
            "active",
            "created",
            "id",
            "importer_id",
            "updated"
        ])
    })

    it('applies the provided type converters when invoked', () => {
        const importerConverter = productConverters.baseAttributes.importer_id
        assert.ok(!(productConverters.subEntities.prices instanceof Error))
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
        assert.ok(!(priceConverters instanceof Error))

        const shopConverters = priceConverters.subEntities.shop
         assert.ok(!(shopConverters instanceof Error))
        const shopCreated = shopConverters.baseAttributes.created
        assert.ok(shopCreated)
        const shopDate = shopCreated('2020-01-01T00:00:00Z')
        assert.ok(shopDate instanceof Date)
        assert.strictEqual(shopDate.toISOString().startsWith('2020-01-01'), true)
    })

    it('stops recursion after depth limit to avoid infinite loops', () => {
        const level1 = productConverters.subEntities.prices
        assert.ok(!(level1 instanceof Error))

        const level2 = level1.subEntities.product
        assert.ok(!(level2 instanceof Error))

        const level3 = level2.subEntities.prices
        assert.ok(!(level3 instanceof Error))

        const level4 = level3.subEntities.product
        assert.ok(!(level4 instanceof Error))

        const level5 = level4.subEntities.prices
        assert.ok(!(level5 instanceof Error))

        assert.ok(Object.keys(level5.subEntities).length)
        for (const subEntity of Object.keys(level5.subEntities)) {
            assert.ok(level5.subEntities[subEntity as keyof typeof level5.subEntities] instanceof Error)
        }
    })
})


describe('buildConverters - test subEntities', () => {
    const entityLevel0 = buildConverters<Product>(converterFunctionsBuild, config, productMetadata)
    const entityLevel1 = entityLevel0.subEntities.prices
    assert.ok(!(entityLevel1 instanceof Error))
    const entityLevel2 = entityLevel1.subEntities.shop
    assert.ok(!(entityLevel2 instanceof Error))
    
    it('creates subEntity converters for all relations defined in metadata', () => {
        const subEntityKeys = Object.keys(entityLevel0.subEntities).sort()
        assert.deepStrictEqual(subEntityKeys, [
            'comments', 
            'prices', 
            'product_categories', 
            'product_importer', 
            'specification_tree'
        ])
    })

    it('creates baseAttributes for first-level subEntity', () => {        
        const priceBaseKeys = Object.keys(entityLevel1.baseAttributes).sort()
        assert.deepStrictEqual(priceBaseKeys, [ 'active', 'created', 'id', 'price', 'product_id', 'shop_id', 'updated' ])
    })

    it('creates subEntities for first-level nested relations', () => {
        const shopAndProductKeys = Object.keys(entityLevel1.subEntities).sort()
        assert.deepStrictEqual(shopAndProductKeys, [ 'product', 'shop' ])
    })

    it('applies converters correctly through subEntity chain (2 level)', () => {
        const shopActiveConverter = entityLevel2.baseAttributes.active
        assert.ok(shopActiveConverter)
        assert.strictEqual(shopActiveConverter(1), true)
        assert.strictEqual(shopActiveConverter(0), false)
    })

    it('subEntity has correct baseAttributes structure (2 level)', () => {
        const shopBaseKeys = Object.keys(entityLevel2.baseAttributes).sort()
        assert.deepStrictEqual(shopBaseKeys, [ 'active', 'created', 'founded', 'id', 'updated' ])
    })

    it('subEntity has correct subEntities structure (2 level)', () => {
        const shopSubEntityKeys = Object.keys(entityLevel2.subEntities).sort()
        assert.deepStrictEqual(shopSubEntityKeys, [ 'prices' ])
    })

    it('subEntity at depth 3 and depth 4 still has baseAttributes and subEntities', () => {
        const level3 = entityLevel2.subEntities.prices
        assert.ok(!(level3 instanceof Error))
        assert.deepStrictEqual(Object.keys(level3.baseAttributes).sort(), [
            'active', 
            'created', 
            'id', 
            'price', 
            'product_id', 
            'shop_id', 
            'updated'
        ])
        assert.deepStrictEqual(Object.keys(level3.subEntities).sort(), ['product', 'shop'])

        const level4 = level3.subEntities.product
        assert.ok(!(level4 instanceof Error))
        assert.deepStrictEqual(Object.keys(level4.baseAttributes).sort(), [
            "active",
            "created",
            "id",
            "importer_id",
            "updated"
        ])
        assert.deepStrictEqual(Object.keys(level4.subEntities).sort(), [ 
            'comments', 
            'prices', 
            'product_categories', 
            'product_importer', 
            'specification_tree'
        ])
    })

    it('subEntity at depth 5 has subEntities as instance of error', () => {
        const level1 = entityLevel0.subEntities.product_categories
        assert(!(level1 instanceof Error))
        const level2 = level1.subEntities.category
        assert(!(level2 instanceof Error))
        const level3 = level2.subEntities.parent
        assert(!(level3 instanceof Error))
        const level4 = level3.subEntities.children
        assert(!(level4 instanceof Error))
        const level5 = level4.subEntities.product_categories
        assert(!(level5 instanceof Error))
        const subEntities = level5.subEntities
        assert.deepStrictEqual(Object.keys(subEntities).sort(), ['category', 'product'])
        for (const entity in subEntities) {
            assert(subEntities[entity as keyof typeof subEntities] instanceof Error)
        }
    })

    it('subEntity with empty fns at non-root levels', () => {
        // at level 1
        assert.deepStrictEqual(entityLevel1.fns, undefined)
        // at level 2 
        assert.deepStrictEqual(entityLevel2.fns, undefined)
    })

    it('deeply nested subEntity chain preserves converter functions', () => {
        // at level 1
        assert.ok(entityLevel1.baseAttributes.id)
        assert.strictEqual(entityLevel1.baseAttributes.id('456'), 456)
        assert.ok(entityLevel1.baseAttributes.active)
        assert.strictEqual(entityLevel1.baseAttributes.active(1), true)
        assert.ok(entityLevel1.baseAttributes.created)
        assert.strictEqual(entityLevel1.baseAttributes.created('2024-06-15T10:30:00Z').toISOString(), new Date('2024-06-15T10:30:00Z').toISOString())

        // at level 2
        assert.ok(entityLevel2.baseAttributes.id)
        assert.strictEqual(entityLevel2.baseAttributes.id('789'), 789)
        assert.ok(entityLevel2.baseAttributes.active)
        assert.strictEqual(entityLevel2.baseAttributes.active(1), true)
        assert.ok(entityLevel2.baseAttributes.founded)
        const founded = entityLevel2.baseAttributes.founded('2024-07-15T10:30:00Z')
        assert.ok(founded)
        assert.strictEqual(founded.toISOString(), new Date('2024-07-15T10:30:00Z').toISOString())
    })

    it('deeply nested subEntity chain do not have converter function for attributes that do not match in type in converters build', () => {
        // at level 1
        assert.ok(entityLevel1.baseAttributes.url === undefined)
        // at level 2
        assert.ok(entityLevel2.baseAttributes.name === undefined)
    })

})


describe('buildConverters - test fns', () => {
    const productConverters = buildConverters<Product>(converterFunctionsBuild, config, productMetadata)
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
        assert.ok(!(priceConverters instanceof Error))
        assert.strictEqual(priceConverters.fns, undefined)
    })
})


