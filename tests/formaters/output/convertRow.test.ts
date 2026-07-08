import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'
import Decimal from 'decimal.js'
import { convertRow } from '../../../src/formaters/output/convertRow'
import { buildConverters } from '../../../src/formaters/output/buildConverters'
import { MapEntitySelect } from '../../../src/types/entity/Query'
import { shopMetadata, priceMetadata, productMetadata } from '../../testSkeleton/config'
import { Shop, Price, Product } from '../../testSkeleton/entities'
import { EntityTransform, FunctionsToTransformRules } from '../../../src/types/entity/Converters'

const typeConverters = {
    baseAttributes: {
        number: (value: string | number) => Number.parseFloat(String(value)),
        decimal: (value: string | number) => new Decimal(String(value)),
        boolean: (value: number | boolean) => Boolean(value),
        date: (value: string) => new Date(value)
    },
    fns: {
        $count: (value: string | number) => Number.parseInt(String(value), 10),
        $sum: (value: string | number) => new Decimal(String(value)),
        $avg: (value: string | number) => new Decimal(String(value)),
        $min: (value: string | number) => new Decimal(String(value)),
        $max: (value: string | number) => new Decimal(String(value))
    }
}

const productConverters = buildConverters<Product>(productMetadata, typeConverters)
const priceConverters = buildConverters<Price>(priceMetadata, typeConverters)

type ProductRow = EntityTransform<Product, FunctionsToTransformRules<typeof typeConverters>>
type PriceRow = EntityTransform<Price, FunctionsToTransformRules<typeof typeConverters>>
type ShopRow = EntityTransform<Shop, FunctionsToTransformRules<typeof typeConverters>>

describe('convertRow', () => {

    describe('base attribute conversion', () => {
        const shopConverters = buildConverters<Shop>(shopMetadata, typeConverters)

        it('converts selected scalar attributes using registered base converters', () => {
            const row: ShopRow = {
                id: '5', 
                name: 'TechStore', 
                founded: null,
                active: 0, 
                updated: '2024-01-01T00:00:00Z', 
                created: '2020-06-01T00:00:00Z'
            } 

            const mappedSelect: MapEntitySelect<Shop> = {
                select: ['id', 'name', 'founded', 'active', 'updated', 'created'],
                fns: []
            } 

            const result = convertRow(row, mappedSelect, shopConverters)

            assert.strictEqual(result.id, 5)
            assert.strictEqual(result.active, false)
            assert.ok(result.created instanceof Date)
            assert.strictEqual(result.created.toISOString(), '2020-06-01T00:00:00.000Z')
        })

        it('skips attribute when no converter is registered for its type', () => {
            const row= {
                id: '3', 
                name: 'NoConverterShop'
            } as ShopRow

            const mappedSelect: MapEntitySelect<Shop> = {
                select: ['id', 'name'],   // name has type 'string' — no 'string' converter in typeConverters
                fns: []
            } 

            const result = convertRow(row, mappedSelect, shopConverters)

            assert.strictEqual(result.name, 'NoConverterShop')
        })

        it('returns the same object reference it was given', () => {
            const row: ShopRow = {
                id: '1', 
                name: 'SameRef', 
                founded: null,
                active: 1, 
                updated: '2024-01-01T00:00:00Z', 
                created: '2020-01-01T00:00:00Z'
            } 

            const mappedSelect: MapEntitySelect<Shop> = {
                select: ['id', 'name', 'founded', 'active', 'updated', 'created'],
                fns: []
            } 

            const result = convertRow(row, mappedSelect, shopConverters)

            assert.strictEqual(result, row)
        })
    })

    describe('one-to-many relation (array of sub-rows)', () => {

        it('recursively converts each row in an array relation', () => {
            const row: ProductRow = {
                id: '1', 
                importer_id: '2', 
                type: 'laptop', 
                brand: 'Lenovo',
                model: 'ThinkPad X1', 
                image: null, 
                description: null,
                variant: 'Carbon', 
                variant_second: null, 
                active: 1,
                updated: '2024-01-01T00:00:00Z', 
                created: '2023-01-01T00:00:00Z',
                prices: [
                    { id: '10', price: 1299.99, shop_id: '3', url: 'http://a.com', product_id: '1', 
                        active: 1, updated: '2024-01-01T00:00:00Z', created: '2023-06-01T00:00:00Z' },
                    { id: '11', price: 1399.00, shop_id: '4', url: 'http://b.com', product_id: '1', 
                        active: 0, updated: '2024-01-01T00:00:00Z', created: '2023-07-01T00:00:00Z' }
                ]
            } 

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'active', 'created'],
                fns: [],
                subEntities: {
                    prices: { select: ['id', 'price', 'shop_id', 'product_id', 'active', 'created']}
                }
            } 

            const result = convertRow(row, mappedSelect, productConverters)
            const prices = result.prices!

            assert.ok(Array.isArray(prices))
            assert.strictEqual(prices.length, 2)
            assert.strictEqual(prices[0].id, 10)
            assert.ok(prices[0].price instanceof Decimal)
            assert.strictEqual(prices[0].price.toString(), '1299.99')
            assert.strictEqual(prices[0].active, true)
            assert.ok(prices[0].created instanceof Date)
            assert.strictEqual(prices[1].active, false)
        })

        it('produces an empty array when the relation contains no rows', () => {
            const row: ProductRow = {
                id: '1', 
                importer_id: '2', 
                type: 'laptop', 
                brand: 'Lenovo',
                model: 'ThinkPad', 
                image: null, 
                description: null,
                variant: 'Base', 
                variant_second: null, 
                active: 1,
                updated: '2024-01-01T00:00:00Z', 
                created: '2023-01-01T00:00:00Z',
                prices: []
            } 

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'active'],
                fns: [],
                subEntities: {
                    prices: { select: ['id', 'price', 'active']}
                }
            } 

            const result = convertRow(row, mappedSelect, productConverters)

            assert.ok(Array.isArray(result.prices))
            assert.strictEqual(result.prices!.length, 0)
        })
    })

    describe('single relation (many-to-one / one-to-one)', () => {

        it('recursively converts a single nested entity relation', () => {
            const row = {
                id: '10', 
                price: 999.99, 
                active: 1,
                created: '2023-06-01T00:00:00Z',
                shop: {
                    id: '3', 
                    name: 'CoolShop', 
                    active: 0, 
                    created: '2008-06-01T00:00:00Z'
                }
            } as PriceRow

            const mappedSelect: MapEntitySelect<Price> = {
                select: ['id', 'price', 'active', 'created'],
                fns: [],
                subEntities: {
                    shop: { select: ['id', 'name', 'active', 'created']}
                }
            } 

            const result = convertRow(row, mappedSelect, priceConverters)

            assert.ok(result.shop)
            assert.strictEqual(result.shop!.id, 3)
            assert.strictEqual(result.shop!.active, false)
            assert.ok(result.shop!.created instanceof Date)
            assert.strictEqual(result.shop!.name, 'CoolShop')  // string type — no converter registered
        })
    })

    
    describe('deep recursive conversion', () => {

        it('converts three levels deep: product -> prices -> shop', () => {
            const row = {
                id: '1', 
                active: 1,
                created: '2023-01-01T00:00:00Z',
                prices: [
                    {
                        id: '20', 
                        price: 1899.99, 
                        active: 1,
                        created: '2023-05-01T00:00:00Z',
                        shop: {
                            id: '5', 
                            name: 'DellStore', 
                            active: 1, 
                            created: '2000-01-01T00:00:00Z'
                        }
                    }
                ]
            } as ProductRow

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'active', 'created'],
                fns: [],
                subEntities: {
                    prices: {
                        select: ['id', 'price', 'active', 'created'],
                        subEntities: {
                            shop: { select: ['id', 'name', 'active', 'created']}
                        }
                    }
                }
            } 

            const result = convertRow(row, mappedSelect, productConverters)

            // level 1 — product
            assert.strictEqual(result.id, 1)
            assert.strictEqual(result.active, true)
            assert.ok(result.created instanceof Date)

            // level 2 — price
            const price = result.prices![0]
            assert.strictEqual(price.id, 20)
            assert.ok(price.price instanceof Decimal)
            assert.strictEqual(price.active, true)
            assert.ok(price.created instanceof Date)

            // level 3 — shop
            const shop = price.shop!
            assert.strictEqual(shop.id, 5)
            assert.strictEqual(shop.active, true)
            assert.ok(shop.created instanceof Date)
        })
    })
        describe('simple aggregate functions on root entity', () => {
        const shopConverters = buildConverters<Shop>(shopMetadata, typeConverters)

        it('converts $count aggregate function result', () => {
            const row = {
                id: '5',
                name: 'TechStore',
                active: 1,
                created: '2020-06-01T00:00:00Z',
                '$count_id': '42'
            } as ShopRow

            const mappedSelect: MapEntitySelect<Shop> = {
                select: ['id', 'name', 'active', 'created'],
                fns: [['$count', 'id']]
            }

            const result = convertRow(row, mappedSelect, shopConverters)

            assert.strictEqual(result.$count_id, 42)
            assert.strictEqual(typeof result.$count_id, 'number')
        })

        it('converts $sum aggregate function result to Decimal', () => {
            const row = {
                id: '3',
                name: 'ShopName',
                active: 1,
                '$sum_id': '150'
            } as ShopRow

            const mappedSelect: MapEntitySelect<Shop> = {
                select: ['id', 'name', 'active'],
                fns: [['$sum', 'id']]
            }

            const result = convertRow(row, mappedSelect, shopConverters)

            assert.ok(result.$sum_id instanceof Decimal)
            assert.strictEqual(result.$sum_id.toString(), '150')
        })

        it('handles multiple aggregate functions', () => {
            const row = {
                id: '1',
                name: 'MultiFnShop',
                active: 1,
                updated: '2024-01-01T00:00:00Z',
                '$count_id': '150',
                '$count_created': '75'
            } as ShopRow

            const mappedSelect: MapEntitySelect<Shop> = {
                select: ['id', 'name', 'active', 'created'],
                fns: [['$count', 'id'], ['$count', 'created']]
            }

            const result = convertRow(row, mappedSelect, shopConverters)

            assert.strictEqual(result.$count_id, 150)
            assert.strictEqual(result.$count_created, 75)
        })

        it('skips fn conversion when no converter is registered for the aggregate operator', () => {
            const customTypeConverters = {
                baseAttributes: typeConverters.baseAttributes,
                fns: {
                    $count: (value: string | number) => Number.parseInt(String(value), 10)
                }
            }
            const customConverters = buildConverters<Shop>(shopMetadata, customTypeConverters)

            const row: ShopRow = {
                id: '1',
                name: 'NoSumConverter',
                founded: null,
                active: 1,
                updated: '2024-01-01T00:00:00Z',
                created: '2020-01-01T00:00:00Z',
                '$sum_id': '999'
            }

            const mappedSelect: MapEntitySelect<Shop> = {
                select: ['id', 'name', 'active'],
                fns: [['$sum', 'id']]
            }

            const result = convertRow(row, mappedSelect, customConverters)

            assert.strictEqual(result.$sum_id, '999')
        })
    })

    describe('aggregate functions with nested relation target', () => {

        it('converts $count on nested relation attribute', () => {
            const row = {
                id: '1',
                brand: 'Lenovo',
                model: 'ThinkPad X1',
                active: 1,
                '$count_prices_id': '8'
            } as ProductRow

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$count', ['prices', 'id']]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.strictEqual(result.$count_prices_id, 8)
        })

        it('converts $sum on nested relation attribute', () => {
            const row = {
                id: '2',
                brand: 'Dell',
                model: 'XPS 15',
                active: 1,
                '$sum_prices_id': '25'
            } as ProductRow

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$sum', ['prices', 'id']]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.ok(result.$sum_prices_id instanceof Decimal)
            assert.strictEqual(result.$sum_prices_id.toString(), '25')
        })

        it('converts $avg on nested relation attribute', () => {
            const row = {
                id: '2',
                brand: 'Dell',
                model: 'XPS 15',
                active: 1,
                '$avg_prices_id': '15'
            } as ProductRow

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$avg', ['prices', 'id']]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.ok(result.$avg_prices_id instanceof Decimal)
            assert.strictEqual(result.$avg_prices_id.toString(), '15')
        })

        it('converts $min on nested relation attribute', () => {
            const row = {
                id: '2',
                brand: 'Dell',
                model: 'XPS 15',
                active: 1,
                '$min_prices_id': '1'
            } as ProductRow

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$min', ['prices', 'id']]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.ok(result.$min_prices_id instanceof Decimal)
            assert.strictEqual(result.$min_prices_id.toString(), '1')
        })

        it('converts $max on nested relation attribute', () => {
            const row = {
                id: '2',
                brand: 'Dell',
                model: 'XPS 15',
                active: 1,
                '$max_prices_id': '100'
            } as ProductRow

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$max', ['prices', 'id']]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.ok(result.$max_prices_id instanceof Decimal)
            assert.strictEqual(result.$max_prices_id.toString(), '100')
        })
    })

    describe('combined base attributes and fns conversion', () => {

        it('converts both base attributes and aggregate functions', () => {
            const row = {
                id: '10',
                price: '1299.99',
                active: 1,
                created: '2023-06-01T00:00:00Z',
                shop: {
                    id: '3',
                    name: 'BestShop',
                    active: 0,
                    created: '2020-01-01T00:00:00Z'
                },
                '$count_id': '1'
            } as PriceRow

            const mappedSelect: MapEntitySelect<Price> = {
                select: ['id', 'price', 'active', 'created'],
                fns: [['$count', 'id']],
                subEntities: {
                    shop: { select: ['id', 'name', 'active', 'created']}
                }
            }

            const result = convertRow(row, mappedSelect, priceConverters)

            assert.strictEqual(result.id, 10)
            assert.ok(result.price instanceof Decimal)
            assert.strictEqual(result.active, true)
            assert.ok(result.created instanceof Date)
            assert.strictEqual(result.$count_id, 1)
            assert.ok(result.shop)
            assert.strictEqual(result.shop!.id, 3)
        })
    })

    describe('edge cases for fns', () => {

        it('handles empty fns array', () => {
            const row = {
                id: '1',
                brand: 'TestBrand',
                model: 'TestModel',
                active: 1
            } as ProductRow

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: []
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.strictEqual(result.id, 1)
            assert.strictEqual(result.brand, 'TestBrand')
            assert.strictEqual(result.$count_id, undefined)
        })

        it('handles decimal string values in $sum result', () => {
            const row = {
                id: '1',
                brand: 'TestBrand',
                model: 'TestModel',
                active: 1,
                '$sum_prices_id': '12345.678'
            } as ProductRow

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$sum', ['prices', 'id']]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.ok(result.$sum_prices_id instanceof Decimal)
            assert.strictEqual(result.$sum_prices_id.toString(), '12345.678')
        })

        it('handles zero values in aggregate functions', () => {
            const row = {
                id: '1',
                brand: 'TestBrand',
                model: 'TestModel',
                active: 1,
                '$sum_prices_id': '0',
                '$count_prices_id': '0'
            } as ProductRow

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$sum', ['prices', 'id']], ['$count', ['prices', 'id']]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.ok(result.$sum_prices_id instanceof Decimal)
            assert.strictEqual(result.$sum_prices_id.toString(), '0')
            assert.strictEqual(result.$count_prices_id, 0)
        })

        it('handles large numbers in aggregate functions', () => {
            const row = {
                id: '1',
                brand: 'TestBrand',
                model: 'TestModel',
                active: 1,
                '$sum_prices_id': '999999999'
            } as ProductRow

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$sum', ['prices', 'id']]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.ok(result.$sum_prices_id instanceof Decimal)
            assert.strictEqual(result.$sum_prices_id.toString(), '999999999')
        })
    })

    describe('deep nested aggregate functions', () => {

        it('converts aggregate function with three-level deep nested target', () => {
            const row = {
                id: '1',
                brand: 'TestBrand',
                model: 'TestModel',
                active: 1,
                prices: [
                    {
                        id: '10',
                        price: '999.99',
                        active: 1,
                        shop: {
                            id: '3',
                            name: 'DeepShop',
                            active: 1,
                            created: '2000-01-01T00:00:00Z'
                        }
                    }
                ],
                '$count_prices_shop_id': '1'
            } as ProductRow

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$count', ['prices', ['shop', 'id']]]],
                subEntities: {
                    prices: {
                        select: ['id', 'price', 'active'],
                        subEntities: {
                            shop: { select: ['id', 'name', 'active', 'created'] }
                        }
                    }
                }
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.strictEqual(result.id, 1)
            assert.strictEqual(result.brand, 'TestBrand')
            assert.ok(Array.isArray(result.prices))
            assert.strictEqual(result.$count_prices_shop_id, 1)
        })
    })

    describe('nested aggregate functions depth 1 through 5 (varied paths)', () => {

        it('depth 1 - $count on prices.id', () => {
            const row = {
                id: '1',
                brand: 'Brand',
                model: 'Model',
                active: 1,
                '$count_prices_id': '10'
            } as ProductRow

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$count', ['prices', 'id']]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.strictEqual(result.$count_prices_id, 10)
        })

        it('depth 1 - $count on comments.id (different relation)', () => {
            const row = {
                id: '1',
                brand: 'Brand',
                model: 'Model',
                active: 1,
                '$count_comments_id': '25'
            } as ProductRow

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$count', ['comments', 'id']]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.strictEqual(result.$count_comments_id, 25)
        })

        it('depth 2 - $sum on prices.shop.id', () => {
            const row = {
                id: '1',
                brand: 'Brand',
                model: 'Model',
                active: 1,
                '$sum_prices_shop_id': '25'
            } as ProductRow

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$sum', ['prices', ['shop', 'id']]]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.ok(result.$sum_prices_shop_id instanceof Decimal)
            assert.strictEqual(result.$sum_prices_shop_id.toString(), '25')
        })

        it('depth 2 - $count on comments.user.id (different path via user)', () => {
            const row = {
                id: '1',
                brand: 'Brand',
                model: 'Model',
                active: 1,
                '$count_comments_user_id': '15'
            } as ProductRow

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$count', ['comments', ['user', 'id']]]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.strictEqual(result.$count_comments_user_id, 15)
        })

        it('depth 3 - $count on prices.shop.prices.id', () => {
            const row = {
                id: '1',
                brand: 'Brand',
                model: 'Model',
                active: 1,
                '$count_prices_shop_prices_id': '7'
            } as unknown as ProductRow // retriving keys is limited to 2 depth

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$count', ['prices', ['shop', ['prices', 'id']]]]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.strictEqual(result.$count_prices_shop_prices_id, 7)
        })

        it('depth 3 - $sum on comments.user.rates.id (different path via rates)', () => {
            const row = {
                id: '1',
                brand: 'Brand',
                model: 'Model',
                active: 1,
                '$sum_comments_user_rates_id': '120'
            }as unknown as ProductRow // retriving keys is limited to 2 depth

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$sum', ['comments', ['user', ['rates', 'id']]]]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.ok(result.$sum_comments_user_rates_id instanceof Decimal)
            assert.strictEqual(result.$sum_comments_user_rates_id.toString(), '120')
        })

        it('depth 3 - $avg on prices.shop.id (path to shop field)', () => {
            const row = {
                id: '1',
                brand: 'Brand',
                model: 'Model',
                active: 1,
                '$avg_prices_shop_id': '50'
            }as unknown as ProductRow // retriving keys is limited to 2 depth

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$avg', ['prices', ['shop', 'id']]]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.ok(result.$avg_prices_shop_id instanceof Decimal)
            assert.strictEqual(result.$avg_prices_shop_id.toString(), '50')
        })

        it('depth 3 - $min on comments.user.rates.id', () => {
            const row = {
                id: '1',
                brand: 'Brand',
                model: 'Model',
                active: 1,
                '$min_comments_user_rates_id': '3'
            } as unknown as ProductRow // retriving keys is limited to 2 depth

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$min', ['comments', ['user', ['rates', 'id']]]]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.ok(result.$min_comments_user_rates_id instanceof Decimal)
            assert.strictEqual(result.$min_comments_user_rates_id.toString(), '3')
        })

        it('depth 3 - $max on comments.user.rates.id', () => {
            const row = {
                id: '1',
                brand: 'Brand',
                model: 'Model',
                active: 1,
                '$max_comments_user_rates_id': '95'
            } as unknown as ProductRow // retriving keys is limited to 2 depth

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$max', ['comments', ['user', ['rates', 'id']]]]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.ok(result.$max_comments_user_rates_id instanceof Decimal)
            assert.strictEqual(result.$max_comments_user_rates_id.toString(), '95')
        })

        it('depth 4 - $count on prices.shop.prices.shop.id', () => {
            const row = {
                id: '1',
                brand: 'Brand',
                model: 'Model',
                active: 1,
                '$count_prices_shop_prices_shop_id': '3'
            } as unknown as ProductRow // retriving keys is limited to 2 depth

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$count', ['prices', ['shop', ['prices', ['shop', 'id']]]]]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.strictEqual(result.$count_prices_shop_prices_shop_id, 3)
        })

        it('depth 4 - $sum on comments.user.rates.comment.id (cycle via comment)', () => {
            const row = {
                id: '1',
                brand: 'Brand',
                model: 'Model',
                active: 1,
                '$sum_comments_user_rates_comment_id': '45'
            } as unknown as ProductRow // retriving keys is limited to 2 depth

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$sum', ['comments', ['user', ['rates', ['comment', 'id']]]]]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.ok(result.$sum_comments_user_rates_comment_id instanceof Decimal)
            assert.strictEqual(result.$sum_comments_user_rates_comment_id.toString(), '45')
        })

        it('depth 4 - $avg on prices.shop.prices.shop.id', () => {
            const row = {
                id: '1',
                brand: 'Brand',
                model: 'Model',
                active: 1,
                '$avg_prices_shop_prices_shop_id': '50'
            } as unknown as ProductRow // retriving keys is limited to 2 depth

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$avg', ['prices', ['shop', ['prices', ['shop', 'id']]]]]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.ok(result.$avg_prices_shop_prices_shop_id instanceof Decimal)
            assert.strictEqual(result.$avg_prices_shop_prices_shop_id.toString(), '50')
        })

        it('depth 4 - $min on comments.user.rates.comment.id', () => {
            const row = {
                id: '1',
                brand: 'Brand',
                model: 'Model',
                active: 1,
                '$min_comments_user_rates_comment_id': '5'
            } as unknown as ProductRow // retriving keys is limited to 2 depth

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$min', ['comments', ['user', ['rates', ['comment', 'id']]]]]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.ok(result.$min_comments_user_rates_comment_id instanceof Decimal)
            assert.strictEqual(result.$min_comments_user_rates_comment_id.toString(), '5')
        })

        it('depth 4 - $max on comments.user.rates.comment.id', () => {
            const row = {
                id: '1',
                brand: 'Brand',
                model: 'Model',
                active: 1,
                '$max_comments_user_rates_comment_id': '80'
            } as unknown as ProductRow // retriving keys is limited to 2 depth

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$max', ['comments', ['user', ['rates', ['comment', 'id']]]]]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.ok(result.$max_comments_user_rates_comment_id instanceof Decimal)
            assert.strictEqual(result.$max_comments_user_rates_comment_id.toString(), '80')
        })

        it('depth 5 - $count on prices.shop.prices.shop.prices.id', () => {
            const row = {
                id: '1',
                brand: 'Brand',
                model: 'Model',
                active: 1,
                '$count_prices_shop_prices_shop_prices_id': '2'
            } as unknown as ProductRow // retriving keys is limited to 2 depth

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$count', ['prices', ['shop', ['prices', ['shop', ['prices', 'id']]]]]]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.strictEqual(result.$count_prices_shop_prices_shop_prices_id, 2)
        })

        it('depth 5 - $sum on comments.user.rates.comment.user.id (full cycle)', () => {
            const row = {
                id: '1',
                brand: 'Brand',
                model: 'Model',
                active: 1,
                '$sum_comments_user_rates_comment_user_id': '60'
            } as unknown as ProductRow // retriving keys is limited to 2 depth

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$sum', ['comments', ['user', ['rates', ['comment', ['user', 'id']]]]]]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.ok(result.$sum_comments_user_rates_comment_user_id instanceof Decimal)
            assert.strictEqual(result.$sum_comments_user_rates_comment_user_id.toString(), '60')
        })

        it('depth 5 - $avg on prices.shop.prices.shop.prices.id', () => {
            const row = {
                id: '1',
                brand: 'Brand',
                model: 'Model',
                active: 1,
                '$avg_prices_shop_prices_shop_prices_id': '37.5'
            } as unknown as ProductRow // retriving keys is limited to 2 depth

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$avg', ['prices', ['shop', ['prices', ['shop', ['prices', 'id']]]]]]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.ok(result.$avg_prices_shop_prices_shop_prices_id instanceof Decimal)
            assert.strictEqual(result.$avg_prices_shop_prices_shop_prices_id.toString(), '37.5')
        })

        it('depth 5 - $min on comments.user.rates.comment.user.id', () => {
            const row = {
                id: '1',
                brand: 'Brand',
                model: 'Model',
                active: 1,
                '$min_comments_user_rates_comment_user_id': '10'
            } as unknown as ProductRow // retriving keys is limited to 2 depth

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$min', ['comments', ['user', ['rates', ['comment', ['user', 'id']]]]]]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.ok(result.$min_comments_user_rates_comment_user_id instanceof Decimal)
            assert.strictEqual(result.$min_comments_user_rates_comment_user_id.toString(), '10')
        })

        it('depth 5 - $max on comments.user.rates.comment.user.id', () => {
            const row = {
                id: '1',
                brand: 'Brand',
                model: 'Model',
                active: 1,
                '$max_comments_user_rates_comment_user_id': '150'
            } as unknown as ProductRow // retriving keys is limited to 2 depth

            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [['$max', ['comments', ['user', ['rates', ['comment', ['user', 'id']]]]]]]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.ok(result.$max_comments_user_rates_comment_user_id instanceof Decimal)
            assert.strictEqual(result.$max_comments_user_rates_comment_user_id.toString(), '150')
        })

        it('depth 5 - multiple fns at maximum depth using comments path', () => {
            const row = {
                id: '1',
                brand: 'Brand',
                model: 'Model',
                active: 1,
                '$count_comments_user_rates_comment_user_id': '5',
                '$sum_comments_user_rates_comment_user_id': '250',
                '$avg_comments_user_rates_comment_user_id': '50',
                '$min_comments_user_rates_comment_user_id': '20',
                '$max_comments_user_rates_comment_user_id': '80'
            } as unknown as ProductRow // retriving keys is limited to 2 depth

            const commentsUserRatesCommentUserId: ['comments', ['user', ['rates', ['comment', ['user', 'id']]]]] = 
                ['comments', ['user', ['rates', ['comment', ['user', 'id']]]]]
            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [
                    ['$count', commentsUserRatesCommentUserId],
                    ['$sum', commentsUserRatesCommentUserId],
                    ['$avg', commentsUserRatesCommentUserId],
                    ['$min', commentsUserRatesCommentUserId],
                    ['$max', commentsUserRatesCommentUserId]
                ]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.strictEqual(result.$count_comments_user_rates_comment_user_id, 5)
            assert.ok(result.$sum_comments_user_rates_comment_user_id instanceof Decimal)
            assert.strictEqual(result.$sum_comments_user_rates_comment_user_id.toString(), '250')
            assert.ok(result.$avg_comments_user_rates_comment_user_id instanceof Decimal)
            assert.strictEqual(result.$avg_comments_user_rates_comment_user_id.toString(), '50')
            assert.ok(result.$min_comments_user_rates_comment_user_id instanceof Decimal)
            assert.strictEqual(result.$min_comments_user_rates_comment_user_id.toString(), '20')
            assert.ok(result.$max_comments_user_rates_comment_user_id instanceof Decimal)
            assert.strictEqual(result.$max_comments_user_rates_comment_user_id.toString(), '80')
        })

        it('depth 5 - multiple fns at maximum depth using prices path', () => {
            const row = {
                id: '1',
                brand: 'Brand',
                model: 'Model',
                active: 1,
                '$count_prices_shop_prices_shop_prices_id': '4',
                '$sum_prices_shop_prices_shop_prices_id': '200',
                '$avg_prices_shop_prices_shop_prices_id': '50',
                '$min_prices_shop_prices_shop_prices_id': '10',
                '$max_prices_shop_prices_shop_prices_id': '90'
            } as unknown as ProductRow // retriving keys is limited to 2 depth

            const priceShopPricesShopPricesId: ['prices', ['shop', ['prices', ['shop', ['prices', 'id']]]]] = 
                ['prices', ['shop', ['prices', ['shop', ['prices', 'id']]]]]
            const mappedSelect: MapEntitySelect<Product> = {
                select: ['id', 'brand', 'model', 'active'],
                fns: [
                    ['$count', priceShopPricesShopPricesId],
                    ['$sum', priceShopPricesShopPricesId],
                    ['$avg', priceShopPricesShopPricesId],
                    ['$min', priceShopPricesShopPricesId],
                    ['$max', priceShopPricesShopPricesId]
                ]
            }

            const result = convertRow(row, mappedSelect, productConverters)

            assert.strictEqual(result.$count_prices_shop_prices_shop_prices_id, 4)
            assert.ok(result.$sum_prices_shop_prices_shop_prices_id instanceof Decimal)
            assert.strictEqual(result.$sum_prices_shop_prices_shop_prices_id.toString(), '200')
            assert.ok(result.$avg_prices_shop_prices_shop_prices_id instanceof Decimal)
            assert.strictEqual(result.$avg_prices_shop_prices_shop_prices_id.toString(), '50')
            assert.ok(result.$min_prices_shop_prices_shop_prices_id instanceof Decimal)
            assert.strictEqual(result.$min_prices_shop_prices_shop_prices_id.toString(), '10')
            assert.ok(result.$max_prices_shop_prices_shop_prices_id instanceof Decimal)
            assert.strictEqual(result.$max_prices_shop_prices_shop_prices_id.toString(), '90')
        })
    })
})
