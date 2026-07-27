import { strict as assert } from 'node:assert'
import { it, describe, before } from "node:test";
import Decimal from 'decimal.js'
import connection from '../../../../../../../config/connection';
import { 
    Product as ProductEntity, 
    Price as PriceEntity, 
    Shop as ShopEntity,
    Product
} from '../../../../../../testSkeleton/entities'
import { 
    Product as ProductModel, 
    Price as PriceModel, 
    Shop as ShopModel,
    ProductImporter as ProductImporterModel 
} from '../../../../../../testSkeleton/models'
import { productMetadata, priceMetadata, shopMetadata } from '../../../../../../testSkeleton/config'
import { productData, priceData, shopData, productImporterData } from '../../../../../../testSkeleton/testData/dataBase'
import { Repository } from '../../../../../../../src/repository/repository';
import { EntityCreationAttributes } from '../../../../../../../src/types/entity/Creation';
import { Query } from '../../../../../../../src/types/entity/Query';

describe('test formatQueryRelationAttribute - expected output from database (mysql)', async () => {

    const productList = productData
    const priceList = priceData
    const shopList = shopData

    let productRepository: Repository<ProductEntity, EntityCreationAttributes<ProductEntity>, ProductModel>
    let priceRepository: Repository<PriceEntity, EntityCreationAttributes<PriceEntity>, PriceModel>
    let shopRepository: Repository<ShopEntity, EntityCreationAttributes<ShopEntity>, ShopModel>

    before(async () => {
        productRepository = await Repository.init(connection, productMetadata, ProductModel)
        priceRepository = await Repository.init(connection, priceMetadata, PriceModel)
        shopRepository = await Repository.init(connection, shopMetadata, ShopModel)

        await ProductImporterModel.bulkCreate(productImporterData)

        for (const shop of shopList) {
            await shopRepository.createOne(shop)
        }

        for (const product of productList) {
            await productRepository.createOne(product)
        }

        for (const price of priceList) {
            await priceRepository.createOne(price)
        }
    })

    describe('relation with base attributes', async () => {

        it('query with single base attribute in relation', async () => {
            const query = { prices: { active: true } }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 2)
            const ids = products.map(p => p.id).sort()
            assert.deepStrictEqual(ids, [1, 2])

            const product1 = products.find(p => p.id === 1) 
            assert(product1)
            assert.strictEqual(product1.prices.length, 2)
            for (const price of product1.prices) {
                assert.strictEqual(price.active, true)
                assert.ok(price.price instanceof Decimal)
            }

            const product2 = products.find(p => p.id === 2) 
            assert(product2)
            assert.strictEqual(product2.prices.length, 1)
            assert.strictEqual(product2.prices[0].active, true)
            assert.strictEqual(product2.prices[0].id, 3)
            assert.strictEqual(product2.prices[0].price.toString(), '3299.5')

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.strictEqual(single.id, 1)
            assert.strictEqual(single.prices.length, 2)
        })

        it('query with multiple base attributes in relation', async () => {
            const query = { prices: { active: true, url: 'https://x-kom.pl' } }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 2)
            const ids = products.map(p => p.id).sort()
            assert.deepStrictEqual(ids, [1, 2])

            for (const product of products) {
                const prices = product.prices
                for (const price of prices) {
                    assert.strictEqual(price.active, true)
                    assert.strictEqual(price.url, 'https://x-kom.pl')
                }
            }

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.strictEqual(single.id, 1)
            assert.strictEqual(single.prices.length, 1)
            assert.strictEqual(single.prices[0].url, 'https://x-kom.pl')
        })

        it('query with relation filter returns correct product details and relation data', async () => {
            const query = { prices: { active: true } }
            const products = await productRepository.getManyBy(query)
            const product = products.find(p => p.id === 1)
            assert(product)
            assert.strictEqual(product.brand, 'Apple')
            assert.strictEqual(product.model, 'MacBook Air M2')

            assert.strictEqual(product.prices.length, 2)
            const priceUrls = product.prices.map((p) => p.url).sort()
            assert.deepStrictEqual(priceUrls, ['https://mediaexpert.pl', 'https://x-kom.pl'])

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.strictEqual(single.brand, 'Apple')
        })

        it('query with inactive relation returns empty result', async () => {
            const query = { prices: { active: true }, brand: 'Dell' }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 0)

            const single = await productRepository.getOneBy(query)
            assert.strictEqual(single, null)
        })

        it('relation with specific string field returns correct related entity', async () => {
            const query = { prices: { url: 'https://morele.net' } }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 1)
            assert.strictEqual(products[0].id, 3)

            const product3 = products[0]
            assert.strictEqual(product3.prices.length, 1)
            assert.strictEqual(product3.prices[0].url, 'https://morele.net')
            assert.strictEqual(product3.prices[0].active, false)
            assert.strictEqual(product3.prices[0].price.toString(), '2499')

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.strictEqual(single.id, 3)
            assert.strictEqual(single.prices[0].url, 'https://morele.net')
        })

        it('product without matching prices is undefined', async () => {
            const query = { prices: { active: true } }
            const products = await productRepository.getManyBy(query)
            const product3 = products.find((p) => p.id === 3)
            assert(product3 === undefined)
        })
    })

    describe('relation with range attributes', async () => {

        it('query with price_from in relation', async () => {
            const query = { prices: { price_from: 4000 } }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 1)
            assert.strictEqual(products[0].id, 1)

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.strictEqual(single.id, 1)
        })

        it('query with price_to in relation', async () => {
            const query = { prices: { price_to: 3000 } }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 1)
            assert.strictEqual(products[0].id, 3)

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.strictEqual(single.id, 3)
        })

        it('query with price_from and price_to in relation', async () => {
            const query = { prices: { price_from: 3000, price_to: 6000 } }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 2)
            const ids = products.map(p => p.id).sort()
            assert.deepStrictEqual(ids, [1, 2])

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.strictEqual(single.id, 1)
        })

        it('query with id range in relation', async () => {
            const query = { prices: { id_from: 3 } }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 2)
            const ids = products.map(p => p.id).sort()
            assert.deepStrictEqual(ids, [2, 3])

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.ok(single.id === 2 || single.id === 3)
        })

        it('query with range as type string in relation', async () => {
            const query = { prices: { price_from: '3000', price_to: '6000' } }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 2)

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.strictEqual(single.id, 1)
        })

        it('empty range string ignored in relation', async () => {
            const query = { prices: { price_from: '', price_to: '6000' } }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 3)

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.strictEqual(single.id, 1)
        })

        it('invalid range type in relation throws', async () => {
            const query = { prices: { price_from: 'abc' } }
            await assert.rejects(async () => await productRepository.getManyBy(query as any), {
                name: /Error/,
                message: /Value type for price_from is not valid/
            })
            await assert.rejects(async () => await productRepository.getOneBy(query as any), {
                name: /Error/,
                message: /Value type for price_from is not valid/
            })
        })
    })

    describe('relation with select attributes', async () => {

        it('select single field in relation', async () => {
            const query: Query<Product> = { prices: { select: ['price'], active: true } }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 2)
            const firstProductPrices = products[0].prices
            assert(Array.isArray(firstProductPrices))
            for (const price of firstProductPrices) {
                assert.strictEqual(Object.keys(price).length, 1)
                assert.ok('price' in price)
            }

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.strictEqual(single.prices.length, 2)
            assert.deepStrictEqual(Object.keys(single.prices[0]), ['price'])
        })

        it('select multiple fields in relation', async () => {
            const query: Query<Product> = { prices: { select: ['id', 'price', 'url'], active: true } }
            const products = await productRepository.getManyBy(query)
            const firstProductPrices = products[0].prices
            for (const price of firstProductPrices) {
                const keys = Object.keys(price).sort()
                assert.deepStrictEqual(keys, ['id', 'price', 'url'])
            }

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.deepStrictEqual(Object.keys(single.prices[0]).sort(), ['id', 'price', 'url'])
        })

        it('exclude in relation excludes specified fields', async () => {
            const query: Query<Product> = { prices: { select: { exclude: ['url'] }, active: true } }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 2)
            for (const product of products) {
                const prices = product.prices
                for (const price of prices) {
                    const keys = Object.keys(price)
                    assert.ok(!keys.includes('url'))
                    assert.ok(keys.includes('price'))
                }
            }

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.ok(!Object.keys(single.prices[0]).includes('url'))
            assert.ok(Object.keys(single.prices[0]).includes('price'))
        })
    })

    describe('empty relation', async () => {

        it('empty relation object returns all products with included relation', async () => {
            const query = { prices: {} }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 3)
            for (const product of products) {
                assert.ok(Array.isArray(product.prices))
            }

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.strictEqual(single.id, 1)
            assert(Array.isArray(single.prices))
            assert.strictEqual(single.prices.length, 2)
        })
    })

    describe('combined root and relation queries', async () => {

        it('root base attribute combined with relation base attribute', async () => {
            const query = { brand: 'Apple', prices: { active: true } }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 1)
            assert.strictEqual(products[0].id, 1)

            const product = products[0]
            assert.strictEqual(product.prices.length, 2)
            for (const price of product.prices) {
                assert.strictEqual(Object.keys(price).length, 8)
                assert.strictEqual(price.active, true)
                assert.ok(price.price instanceof Decimal)
            }

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.strictEqual(single.id, 1)
            assert.strictEqual(single.prices.length, 2)
        })

        it('root range attribute combined with relation range attribute', async () => {
            const query = { id_from: 2, prices: { price_from: 3000 } }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 1)
            assert.strictEqual(products[0].id, 2)

            const product = products[0]
            assert.strictEqual(product.prices.length, 1)
            assert.strictEqual(Object.keys(product.prices[0]).length, 8)
            assert(product.prices[0].price instanceof Decimal)
            assert.ok(product.prices[0].price.toNumber() >= 3000)
            assert.strictEqual(product.prices[0].id, 3)

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.strictEqual(single.id, 2)
            assert.strictEqual(single.prices.length, 1)
        })

        it('root select combined with relation select', async () => {
            const query: Query<Product> = { select: ['id', 'brand'], prices: { select: ['price'] } }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 3)
            for (const product of products) {
                const keys = Object.keys(product).sort()
                assert.deepStrictEqual(keys, ['brand', 'id', 'prices'])
                assert.ok(typeof product.brand === 'string')

                const prices = product.prices
                assert(Array.isArray(prices))
                for (const price of prices) {
                    const priceKeys = Object.keys(price)
                    assert.deepStrictEqual(priceKeys, ['price'])
                }
            }

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.deepStrictEqual(Object.keys(single).sort(), ['brand', 'id', 'prices'])
            assert.deepStrictEqual(Object.keys(single.prices[0]), ['price'])
        })
    })
    
    describe('multiple relations at same level', async () => {

        it('filter by prices and product_importer simultaneously', async () => {
            const query = { prices: { active: true }, product_importer: { name: 'Apple Poland' } }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 1)
            assert.strictEqual(products[0].id, 1)

            const product = products[0]
            assert.strictEqual(product.prices.length, 2)
            for (const price of product.prices) {
                assert.strictEqual(Object.keys(price).length, 8)
                assert.strictEqual(price.active, true)
            }
            assert.strictEqual(Object.keys(product.product_importer).length, 5)
            assert.strictEqual(product.product_importer.name, 'Apple Poland')

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.strictEqual(single.id, 1)
            assert.strictEqual(single.prices.length, 2)
            assert.strictEqual(Object.keys(single.product_importer).length, 5)
            assert.strictEqual(single.product_importer.name, 'Apple Poland')
        })

        it('filter by multiple relations with no match', async () => {
            const query = { prices: { active: true }, product_importer: { name: 'Dell Technologies' } }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 0)

            const single = await productRepository.getOneBy(query)
            assert.strictEqual(single, null)
        })

        it('multiple relations with select on each', async () => {
            const query: Query<Product> = { prices: { select: ['price'], active: true }, product_importer: { select: ['name'], name: 'Apple Poland' } }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 1)
            assert.strictEqual(products[0].id, 1)

            const product = products[0]
            for (const price of product.prices) {
                assert.deepStrictEqual(Object.keys(price), ['price'])
            }
            assert.strictEqual(product.product_importer.name, 'Apple Poland')
            assert.deepStrictEqual(Object.keys(product.product_importer), ['name'])

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.strictEqual(single.id, 1)
            assert.deepStrictEqual(Object.keys(single.prices[0]), ['price'])
            assert.deepStrictEqual(Object.keys(single.product_importer), ['name'])
        })
    })

    describe('nested relations (depth 2)', async () => {

        it('nested relation: product => prices => shop with base attribute', async () => {
            const query = { prices: { shop: { name: 'X-Kom' } } }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 3)
            for (const product of products) {
                const prices = product.prices
                if (prices && prices.length > 0) {
                    for (const price of prices) {
                        if (price.shop) {
                            assert.strictEqual(price.shop.name, 'X-Kom')
                        }
                    }
                }
            }

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.strictEqual(single.id, 1)
            assert(single.prices.length > 0)
        })

        it('nested relation: product => prices => shop with range attribute', async () => {
            const query = { prices: { shop: { founded_from: new Date('2002-06-01T00:00:00Z') } } }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 3)

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.strictEqual(single.id, 1)
        })

        it('nested relation: product => prices => shop with select', async () => {
            const query: Query<Product> = { prices: { shop: { select: ['name'] } } }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 3)
            for (const product of products) {
                const prices = product.prices
                assert(Array.isArray(prices))
                for (const price of prices) {
                    assert.ok('shop' in price)
                    const shop = price.shop
                    const shopKeys = Object.keys(shop)
                    assert.deepStrictEqual(shopKeys, ['name'])
                }
            }

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.strictEqual(single.id, 1)
            assert.ok('shop' in single.prices[0])
            assert.deepStrictEqual(Object.keys(single.prices[0].shop), ['name'])
        })

        it('nested relation: product => product_importer with base attribute', async () => {
            const query = { product_importer: { name: 'Samsung Electronics' } }
            const products = await productRepository.getManyBy(query)
            assert.strictEqual(products.length, 1)
            assert.strictEqual(products[0].id, 2)

            const single = await productRepository.getOneBy(query)
            assert(single)
            assert.strictEqual(single.id, 2)
        })
    })

    describe('validation error handling for relations', async () => {

        it('null value for relation throws', async () => {
            const query = { prices: null }
            await assert.rejects(async () => await productRepository.getManyBy(query as any), {
                name: /Error/,
                message: /Value for attribute 'prices' is not valid/
            })
            await assert.rejects(async () => await productRepository.getOneBy(query as any), {
                name: /Error/,
                message: /Value for attribute 'prices' is not valid/
            })
        })

        it('string value for relation throws', async () => {
            const query = { prices: 'invalid' }
            await assert.rejects(async () => await productRepository.getManyBy(query as any), {
                name: /Error/,
                message: /Value for attribute 'prices' is not valid/
            })
            await assert.rejects(async () => await productRepository.getOneBy(query as any), {
                name: /Error/,
                message: /Value for attribute 'prices' is not valid/
            })
        })

        it('number value for relation throws', async () => {
            const query = { prices: 123 }
            await assert.rejects(async () => await productRepository.getManyBy(query as any), {
                name: /Error/,
                message: /Value for attribute 'prices' is not valid/
            })
            await assert.rejects(async () => await productRepository.getOneBy(query as any), {
                name: /Error/,
                message: /Value for attribute 'prices' is not valid/
            })
        })

        it('boolean value for relation throws', async () => {
            const query = { prices: true }
            await assert.rejects(async () => await productRepository.getManyBy(query as any), {
                name: /Error/,
                message: /Value for attribute 'prices' is not valid/
            })
            await assert.rejects(async () => await productRepository.getOneBy(query as any), {
                name: /Error/,
                message: /Value for attribute 'prices' is not valid/
            })
        })

        it('invalid base attribute type in relation throws', async () => {
            const query = { prices: { url: 123 } }
            await assert.rejects(async () => await productRepository.getManyBy(query as any), {
                name: /Error/,
                message: /Value type for url is not valid/
            })
            await assert.rejects(async () => await productRepository.getOneBy(query as any), {
                name: /Error/,
                message: /Value type for url is not valid/
            })
        })

        it('invalid boolean type in relation throws', async () => {
            const query = { prices: { active: 2 } }
            await assert.rejects(async () => await productRepository.getManyBy(query as any), {
                name: /Error/,
                message: /Value type for active is not valid/
            })
            await assert.rejects(async () => await productRepository.getOneBy(query as any), {
                name: /Error/,
                message: /Value type for active is not valid/
            })
        })

        it('undefined value in relation throws', async () => {
            const query = { prices: { url: undefined } }
            await assert.rejects(async () => await productRepository.getManyBy(query as any), {
                name: /Error/,
                message: /Value type for url is not valid/
            })
            await assert.rejects(async () => await productRepository.getOneBy(query as any), {
                name: /Error/,
                message: /Value type for url is not valid/
            })
        })
    })
})
