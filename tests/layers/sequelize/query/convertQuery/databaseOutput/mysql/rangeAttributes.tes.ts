import { strict as assert } from 'node:assert'
import { it, describe, before, after } from "node:test";
import Decimal from 'decimal.js'
import connection from '../../../../../../../config/connection';
import { 
    Product as ProductEntity, 
    Price as PriceEntity, 
    Shop as ShopEntity 
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

describe('test formatQueryRangeAttributes - expected output from database (mysql)', async () => {

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


    describe('test formating rangeQuery - expected output from database', async () => {

        it('query fields with valid range query types 1', async () => {
            const data = {
                created_from: new Date('2023-01-01T11:20:00Z')
            }
            const products = await productRepository.getManyBy(data)
            assert.strictEqual(products.length, 3)
        })

        it('query fields with valid range query types 2', async () => {
            const data = {
                created_from: new Date('2023-06-10T15:00:00Z')
            }
            const products = await productRepository.getManyBy(data)
            assert.strictEqual(products.length, 2)
        })

        it('query fields with valid range query types 3', async () => {
            const data = {
                created_from: new Date('2024-03-01T10:00:00Z')
            }
            const products = await productRepository.getManyBy(data)
            assert.strictEqual(products.length, 1)
        })

        it('query fields with valid range query types 4', async () => {
            const data = {
                created_to: new Date('2021-03-01T10:00:00Z')
            }
            const products = await productRepository.getManyBy(data)
            assert.strictEqual(products.length, 0)
        })

        it('query fields with valid range query types 5', async () => {
            const data = {
                created_from: new Date('2024-02-01T12:00:00Z'),
                created_to: new Date('2025-02-01T12:00:00Z')
            }
            const products = await productRepository.getManyBy(data)
            assert.strictEqual(products.length, 1)
            assert.strictEqual(products[0].id, 2)
            assert.strictEqual(products[0].type, 'smartphone')
            assert.strictEqual(products[0].brand, 'Samsung')
            assert.strictEqual(products[0].model, 'Galaxy S23')
            assert.strictEqual(products[0].active, true)
            assert.deepStrictEqual(products[0].created, new Date('2024-03-01T10:00:00Z'))
            assert.deepStrictEqual(products[0].updated, new Date('2024-03-01T10:00:00Z'))
        })

        it('query fields with valid range query types 6', async () => {
            const data = {
                created_from: new Date('2021-02-01T12:00:00Z'),
                created_to: new Date('2025-02-01T12:00:00Z'),
                updated_from: new Date('2024-02-14T09:30:00Z'),
                updated_to: new Date('2024-02-16T09:30:00Z')
            }
            const products = await productRepository.getManyBy(data)
            assert.strictEqual(products.length, 1)
            assert.strictEqual(products[0].id, 1)
            assert.strictEqual(products[0].type, 'laptop')
            assert.strictEqual(products[0].brand, 'Apple')
            assert.strictEqual(products[0].model, 'MacBook Air M2')
            assert.strictEqual(products[0].active, true)
            assert.deepStrictEqual(products[0].created, new Date('2024-01-01T12:00:00Z'))
            assert.deepStrictEqual(products[0].updated, new Date('2024-02-15T09:30:00Z'))
        })

        it('query fields with valid range query types 7', async () => {
            const data = {
                price_from: 2000.11,
                price_to: 3300.00
            }
            const prices = await priceRepository.getManyBy(data)
            assert.strictEqual(prices.length, 2)
            assert.strictEqual(prices[0].id, 3)
            assert(prices[0].price instanceof Decimal)
            assert.strictEqual(prices[0].price.toString(), '3299.5')
            assert.strictEqual(prices[1].id, 4)
            assert(prices[1].price instanceof Decimal)
            assert.strictEqual(prices[1].price.toString(), '2499')
        })

        it('query fields with valid range query types 8', async () => {
            const data = {
                id_from: 3
            }
            const products = await productRepository.getManyBy(data)
            assert.strictEqual(products.length, 1)
            assert.strictEqual(products[0].id, 3)
            assert.strictEqual(products[0].type, 'monitor')
            assert.strictEqual(products[0].brand, 'Dell')
            assert.strictEqual(products[0].model, 'U2723QE')
            assert.strictEqual(products[0].active, false)
            assert.deepStrictEqual(products[0].created, new Date('2023-05-10T15:00:00Z'))
            assert.deepStrictEqual(products[0].updated, new Date('2023-12-01T11:20:00Z'))
        })

        it('query fields with range query as type string', async () => {
            const data = {
                created_from: '2023-01-01T11:20:00Z'
            }
            const products = await productRepository.getManyBy(data)
            assert.strictEqual(products.length, 3)
        })

        it('query fields with range query types that have empty string', async () => {
            const data = {
                id_from: '',
                brand: 'Dell',
                model: 'U2723QE'
            }
            const products = await productRepository.getManyBy(data)
            assert.strictEqual(products.length, 1)
            assert.strictEqual(products[0].id, 3)
        })

        it('query fields with range query types that should be rejected', async () => {

            let data = {
                price_from: null,
                price_to: 3300.00
            } as any
            await assert.rejects(async () => priceRepository.getManyBy(data), {
                name: /Error/,
                message: /Value type for price_from is not valid/
            })

            data = {
                id_from: undefined,
                price_from: 9999,
                price_to: 3300.00
            }
            await assert.rejects(async () => await priceRepository.getManyBy(data), {
                name: /Error/,
                message: /Value type for id_from is not valid/
            })

            data = {
                id_from: 'test',
                price_from: 9999,
                price_to: 3300.00
            }
            await assert.rejects(async () => await priceRepository.getManyBy(data), {
                name: /Error/,
                message: /Value type for id_from is not valid/
            })

            data = {
                id_from: null,
                price_from: 9999,
                price_to: 3300.00
            }
            await assert.rejects(async () => await priceRepository.getManyBy(data), {
                name: /Error/,
                message: /Value type for id_from is not valid/
            })
        })
    })
})
