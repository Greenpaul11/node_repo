import { strict as assert } from 'node:assert'
import { it, describe, before } from "node:test";
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
import { productData as baseProductData, priceData as basePriceData, shopData, productImporterData } from '../../../../../../testSkeleton/testData/dataBase'
import { productData as extendedProductData, priceData as extendedPriceData } from '../../../../../../testSkeleton/testData/dataExtended'
import { priceData as extendedPriceData2, shopData as extendedShopData } from '../../../../../../testSkeleton/testData/dataExtended2'
import { Repository } from '../../../../../../../src/repository/repository';
import { EntityCreationAttributes } from '../../../../../../../src/types/entity/Creation';

const allProductData = [...baseProductData, ...extendedProductData]
const allPriceData = [...basePriceData, ...extendedPriceData, ...extendedPriceData2]
const allShopData = [...shopData, ...extendedShopData]

describe('test formatQueryOrderAttribute - expected output from database (sqlite)', async () => {

    let productRepository: Repository<ProductEntity, EntityCreationAttributes<ProductEntity>, ProductModel>
    let priceRepository: Repository<PriceEntity, EntityCreationAttributes<PriceEntity>, PriceModel>
    let shopRepository: Repository<ShopEntity, EntityCreationAttributes<ShopEntity>, ShopModel>

    before(async () => {
        productRepository = await Repository.init(connection, productMetadata, ProductModel)
        priceRepository = await Repository.init(connection, priceMetadata, PriceModel)
        shopRepository = await Repository.init(connection, shopMetadata, ShopModel)

        await ProductImporterModel.bulkCreate(productImporterData)

        for (const shop of allShopData) {
            await shopRepository.createOne(shop)
        }

        for (const product of allProductData) {
            await productRepository.createOne(product)
        }

        for (const price of allPriceData) {
            await priceRepository.createOne(price)
        }
    })

    describe('simple ordering', async () => {

        it('order by brand descending within same group', async () => {
            const products = await productRepository.getManyBy({ select: ['id', 'brand', 'model'], order: ['by brand desc', 'by model desc', 'by id desc'] })
            assert.deepStrictEqual(products, [
                { id: 8, brand: 'Sony', model: 'WH-1000XM5' },
                { id: 7, brand: 'Samsung', model: 'Odyssey G7' },
                { id: 6, brand: 'Samsung', model: 'Galaxy S24 Ultra' },
                { id: 2, brand: 'Samsung', model: 'Galaxy S23' },
                { id: 11, brand: 'Google', model: 'Pixel 8 Pro' },
                { id: 9, brand: 'Dell', model: 'XPS 13' },
                { id: 13, brand: 'Dell', model: 'U2723QE' },
                { id: 3, brand: 'Dell', model: 'U2723QE' },
                { id: 5, brand: 'Apple', model: 'iPhone 15 Pro' },
                { id: 10, brand: 'Apple', model: 'iPad Air' },
                { id: 12, brand: 'Apple', model: 'Watch Series 9' },
                { id: 4, brand: 'Apple', model: 'MacBook Pro M3' },
                { id: 1, brand: 'Apple', model: 'MacBook Air M2' }
            ])
        })

        it('order by model ascending within same brand', async () => {
            const products = await productRepository.getManyBy({ select: ['id', 'brand', 'model'], order: ['by brand asc', 'by model asc', 'by id asc'] })
            assert.deepStrictEqual(products, [
                { id: 1, brand: 'Apple', model: 'MacBook Air M2' },
                { id: 4, brand: 'Apple', model: 'MacBook Pro M3' },
                { id: 12, brand: 'Apple', model: 'Watch Series 9' },
                { id: 10, brand: 'Apple', model: 'iPad Air' },
                { id: 5, brand: 'Apple', model: 'iPhone 15 Pro' },
                { id: 3, brand: 'Dell', model: 'U2723QE' },
                { id: 13, brand: 'Dell', model: 'U2723QE' },
                { id: 9, brand: 'Dell', model: 'XPS 13' },
                { id: 11, brand: 'Google', model: 'Pixel 8 Pro' },
                { id: 2, brand: 'Samsung', model: 'Galaxy S23' },
                { id: 6, brand: 'Samsung', model: 'Galaxy S24 Ultra' },
                { id: 7, brand: 'Samsung', model: 'Odyssey G7' },
                { id: 8, brand: 'Sony', model: 'WH-1000XM5' }
            ])
        })

        it('order by brand asc, model desc, id desc', async () => {
            const products = await productRepository.getManyBy({ select: ['id', 'brand', 'model'], order: ['by brand asc', 'by model desc', 'by id desc'] })
            assert.deepStrictEqual(products, [
                { id: 5, brand: 'Apple', model: 'iPhone 15 Pro' },
                { id: 10, brand: 'Apple', model: 'iPad Air' },
                { id: 12, brand: 'Apple', model: 'Watch Series 9' },
                { id: 4, brand: 'Apple', model: 'MacBook Pro M3' },
                { id: 1, brand: 'Apple', model: 'MacBook Air M2' },
                { id: 9, brand: 'Dell', model: 'XPS 13' },
                { id: 13, brand: 'Dell', model: 'U2723QE' },
                { id: 3, brand: 'Dell', model: 'U2723QE' },
                { id: 11, brand: 'Google', model: 'Pixel 8 Pro' },
                { id: 7, brand: 'Samsung', model: 'Odyssey G7' },
                { id: 6, brand: 'Samsung', model: 'Galaxy S24 Ultra' },
                { id: 2, brand: 'Samsung', model: 'Galaxy S23' },
                { id: 8, brand: 'Sony', model: 'WH-1000XM5' }
            ])
        })

        it('order by created ascending', async () => {
            const products = await productRepository.getManyBy({ select: ['id', 'brand', 'model', 'created'], order: 'by created asc' })
            const dates = products.map((p: any) => ({
                id: p.id, brand: p.brand, model: p.model, created: p.created.toISOString()
            }))
            assert.deepStrictEqual(dates, [
                { id: 3, brand: 'Dell', model: 'U2723QE', created: '2023-05-10T15:00:00.000Z' },
                { id: 8, brand: 'Sony', model: 'WH-1000XM5', created: '2023-08-20T11:00:00.000Z' },
                { id: 7, brand: 'Samsung', model: 'Odyssey G7', created: '2023-11-15T09:00:00.000Z' },
                { id: 10, brand: 'Apple', model: 'iPad Air', created: '2023-12-10T10:00:00.000Z' },
                { id: 1, brand: 'Apple', model: 'MacBook Air M2', created: '2024-01-01T12:00:00.000Z' },
                { id: 5, brand: 'Apple', model: 'iPhone 15 Pro', created: '2024-01-10T08:00:00.000Z' },
                { id: 12, brand: 'Apple', model: 'Watch Series 9', created: '2024-01-20T09:00:00.000Z' },
                { id: 11, brand: 'Google', model: 'Pixel 8 Pro', created: '2024-02-05T16:00:00.000Z' },
                { id: 6, brand: 'Samsung', model: 'Galaxy S24 Ultra', created: '2024-02-20T14:00:00.000Z' },
                { id: 2, brand: 'Samsung', model: 'Galaxy S23', created: '2024-03-01T10:00:00.000Z' },
                { id: 9, brand: 'Dell', model: 'XPS 13', created: '2024-03-15T13:00:00.000Z' },
                { id: 4, brand: 'Apple', model: 'MacBook Pro M3', created: '2024-04-01T10:00:00.000Z' },
                { id: 13, brand: 'Dell', model: 'U2723QE', created: '2024-05-01T12:00:00.000Z' }
            ])
        })

        it('order by created descending', async () => {
            const products = await productRepository.getManyBy({ select: ['id', 'brand', 'model', 'created'], order: 'by created desc' })
            const dates = products.map((p: any) => ({
                id: p.id, brand: p.brand, model: p.model, created: p.created.toISOString()
            }))
            assert.deepStrictEqual(dates, [
                { id: 13, brand: 'Dell', model: 'U2723QE', created: '2024-05-01T12:00:00.000Z' },
                { id: 4, brand: 'Apple', model: 'MacBook Pro M3', created: '2024-04-01T10:00:00.000Z' },
                { id: 9, brand: 'Dell', model: 'XPS 13', created: '2024-03-15T13:00:00.000Z' },
                { id: 2, brand: 'Samsung', model: 'Galaxy S23', created: '2024-03-01T10:00:00.000Z' },
                { id: 6, brand: 'Samsung', model: 'Galaxy S24 Ultra', created: '2024-02-20T14:00:00.000Z' },
                { id: 11, brand: 'Google', model: 'Pixel 8 Pro', created: '2024-02-05T16:00:00.000Z' },
                { id: 12, brand: 'Apple', model: 'Watch Series 9', created: '2024-01-20T09:00:00.000Z' },
                { id: 5, brand: 'Apple', model: 'iPhone 15 Pro', created: '2024-01-10T08:00:00.000Z' },
                { id: 1, brand: 'Apple', model: 'MacBook Air M2', created: '2024-01-01T12:00:00.000Z' },
                { id: 10, brand: 'Apple', model: 'iPad Air', created: '2023-12-10T10:00:00.000Z' },
                { id: 7, brand: 'Samsung', model: 'Odyssey G7', created: '2023-11-15T09:00:00.000Z' },
                { id: 8, brand: 'Sony', model: 'WH-1000XM5', created: '2023-08-20T11:00:00.000Z' },
                { id: 3, brand: 'Dell', model: 'U2723QE', created: '2023-05-10T15:00:00.000Z' }
            ])
        })

        it('order by id descending', async () => {
            const products = await productRepository.getManyBy({ select: ['id', 'brand', 'model'], order: 'by id desc' })
            assert.deepStrictEqual(products, [
                { id: 13, brand: 'Dell', model: 'U2723QE' },
                { id: 12, brand: 'Apple', model: 'Watch Series 9' },
                { id: 11, brand: 'Google', model: 'Pixel 8 Pro' },
                { id: 10, brand: 'Apple', model: 'iPad Air' },
                { id: 9, brand: 'Dell', model: 'XPS 13' },
                { id: 8, brand: 'Sony', model: 'WH-1000XM5' },
                { id: 7, brand: 'Samsung', model: 'Odyssey G7' },
                { id: 6, brand: 'Samsung', model: 'Galaxy S24 Ultra' },
                { id: 5, brand: 'Apple', model: 'iPhone 15 Pro' },
                { id: 4, brand: 'Apple', model: 'MacBook Pro M3' },
                { id: 3, brand: 'Dell', model: 'U2723QE' },
                { id: 2, brand: 'Samsung', model: 'Galaxy S23' },
                { id: 1, brand: 'Apple', model: 'MacBook Air M2' }
            ])
        })
    })

    describe('ordering by entity type then brand', async () => {

        it('order by type asc, brand desc, model asc, id asc', async () => {
            const products = await productRepository.getManyBy({ 
                select: ['id', 'brand', 'type', 'model'], 
                order: ['by type asc', 'by brand desc', 'by model asc', 'by id asc'] 
            })
            assert.deepStrictEqual(products, [
                { id: 8, brand: 'Sony', type: 'headphones', model: 'WH-1000XM5' },
                { id: 9, brand: 'Dell', type: 'laptop', model: 'XPS 13' },
                { id: 1, brand: 'Apple', type: 'laptop', model: 'MacBook Air M2' },
                { id: 4, brand: 'Apple', type: 'laptop', model: 'MacBook Pro M3' },
                { id: 7, brand: 'Samsung', type: 'monitor', model: 'Odyssey G7' },
                { id: 3, brand: 'Dell', type: 'monitor', model: 'U2723QE' },
                { id: 13, brand: 'Dell', type: 'monitor', model: 'U2723QE' },
                { id: 2, brand: 'Samsung', type: 'smartphone', model: 'Galaxy S23' },
                { id: 6, brand: 'Samsung', type: 'smartphone', model: 'Galaxy S24 Ultra' },
                { id: 11, brand: 'Google', type: 'smartphone', model: 'Pixel 8 Pro' },
                { id: 5, brand: 'Apple', type: 'smartphone', model: 'iPhone 15 Pro' },
                { id: 10, brand: 'Apple', type: 'tablet', model: 'iPad Air' },
                { id: 12, brand: 'Apple', type: 'watch', model: 'Watch Series 9' }
            ])
        })
    })

    describe('ordering with null handling', async () => {

        it('order by image asc nulls first', async () => {
            const products = await productRepository.getManyBy({ select: ['id', 'brand', 'image'], order: 'by image asc nulls first' })
            assert.strictEqual(products.length, 13)
            for (let i = 0; i < 10; i++) {
                assert.strictEqual(products[i].image, null)
            }
            assert.strictEqual(products[10].image, 'https://cdn.example.com/products/dell-u27.png')
            assert.strictEqual(products[11].image, 'https://cdn.example.com/products/mba-m2.jpg')
            assert.strictEqual(products[12].image, 'https://example.com')
        })

        it('order by image desc nulls last', async () => {
            const products = await productRepository.getManyBy({ select: ['id', 'brand', 'image'], order: 'by image desc nulls last' })
            assert.strictEqual(products.length, 13)
            for (let i = 4; i < 13; i++) {
                assert.strictEqual(products[i].image, null)
            }
        })
    })

    describe('ordering combined with other query attributes', async () => {

        it('order combined with where clause', async () => {
            const products = await productRepository.getManyBy({
                select: ['id', 'brand', 'model'],
                brand: 'Apple',
                order: ['by model asc', 'by id asc']
            })
            assert.deepStrictEqual(products, [
                { id: 1, brand: 'Apple', model: 'MacBook Air M2' },
                { id: 4, brand: 'Apple', model: 'MacBook Pro M3' },
                { id: 12, brand: 'Apple', model: 'Watch Series 9' },
                { id: 10, brand: 'Apple', model: 'iPad Air' },
                { id: 5, brand: 'Apple', model: 'iPhone 15 Pro' }
            ])
        })

        it('order combined with select', async () => {
            const products = await productRepository.getManyBy({
                select: ['id', 'brand'],
                order: ['by brand asc', 'by id asc']
            })
            assert.strictEqual(products.length, 13)
            assert.strictEqual(products[0].brand, 'Apple')
            assert.strictEqual(products[0].id, 1)
            const keys = Object.keys(products[0]).sort()
            assert.deepStrictEqual(keys, ['brand', 'id'])
        })

        it('order combined with base attribute and range', async () => {
            const products = await productRepository.getManyBy({
                select: ['id', 'brand', 'model', 'created'],
                brand: 'Apple',
                id_from: 5,
                order: 'by created desc'
            })
            const dates = products.map((p: any) => ({
                id: p.id, brand: p.brand, model: p.model, created: p.created.toISOString()
            }))
            assert.deepStrictEqual(dates, [
                { id: 12, brand: 'Apple', model: 'Watch Series 9', created: '2024-01-20T09:00:00.000Z' },
                { id: 5, brand: 'Apple', model: 'iPhone 15 Pro', created: '2024-01-10T08:00:00.000Z' },
                { id: 10, brand: 'Apple', model: 'iPad Air', created: '2023-12-10T10:00:00.000Z' }
            ])
        })
    })

    describe('ordering by related entity field (root level)', async () => {

        it('order by price asc through prices relation', async () => {
            const products = await productRepository.getManyBy({
                select: ['id', 'brand'],
                order: ['by brand asc', ['prices', ['by price asc']]],
                prices: { select: ['id', 'price'] }
            })
            const product1 = products.find((p: { id: number }) => p.id === 1)
            assert(product1)
            const priceValues = product1.prices.map((p: { id: number, price: { toNumber: () => number } }) => ({ id: p.id, price: p.price.toNumber() }))
            assert.deepStrictEqual(priceValues, [
                { id: 2, price: 5399 },
                { id: 1, price: 5499.99 }
            ])
            assert.strictEqual(products[0].brand, 'Apple')
        })

        it('order by price desc through prices relation', async () => {
            const products = await productRepository.getManyBy({
                select: ['id', 'brand'],
                order: ['by brand asc', ['prices', ['by price desc']]],
                prices: { select: ['id', 'price'] }
            })
            const product1 = products.find((p: { id: number }) => p.id === 1)
            assert(product1)
            const priceValues = product1.prices.map((p: {id: number, price: { toNumber: () => number } }) => ({ id: p.id, price: p.price.toNumber() }))
            assert.deepStrictEqual(priceValues, [
                { id: 1, price: 5499.99 },
                { id: 2, price: 5399 }
            ])
        })

        it('order by url desc through prices relation', async () => {
            const products = await productRepository.getManyBy({
                select: ['id', 'brand'],
                order: ['by brand asc', ['prices', ['by url desc']]],
                prices: { select: ['id', 'url'] }
            } )
            const product1 = products.find((p: { id: number }) => p.id === 1)
            assert(product1)
            assert.deepStrictEqual(product1.prices, [
                { id: 1, url: 'https://x-kom.pl' },
                { id: 2, url: 'https://mediaexpert.pl' }
            ])
        })

        it('order by price asc filtered by active prices', async () => {
            const products = await productRepository.getManyBy({
                select: ['id', 'brand'],
                order: ['by brand asc', ['prices', ['by price asc']]],
                prices: { select: ['id', 'price', 'active'], active: true }
            } as any)
            for (const product of products) {
                for (const price of product.prices) {
                    assert.strictEqual(price.active, true)
                }
            }
        })
    })

    describe('deep nested relation ordering (depth 2)', async () => {

        it('order by shop name asc through prices->shop', async () => {
            const products = await productRepository.getManyBy({
                select: ['id', 'brand'],
                order: [
                    'by brand asc',
                    ['prices', [['shop', ['by name asc']]]]
                ],
                prices: { select: ['id', 'price'], shop: { select: ['name'] } }
            } as any)
            const product1 = products.find((p: { id: number }) => p.id === 1)
            assert(product1)
            const priceInfos = product1.prices.map((p: { id: number,  price: { toNumber: () => number }; shop: { name: string } }) => ({
                id: p.id, price: p.price.toNumber(), shop: p.shop
            }))
            assert.deepStrictEqual(priceInfos, [
                { id: 2, price: 5399, shop: { name: 'Media Expert' } },
                { id: 1, price: 5499.99, shop: { name: 'X-Kom' } }
            ])
        })

        it('order by shop name desc through prices->shop', async () => {
            const products = await productRepository.getManyBy({
                select: ['id', 'brand'],
                order: [
                    'by brand asc',
                    ['prices', [['shop', ['by name desc']]]]
                ],
                prices: { select: ['id', 'price'], shop: { select: ['name'] } }
            } as any)
            const product1 = products.find((p: { id: number }) => p.id === 1)
            assert(product1)
            const priceInfos = product1.prices.map((p: { id: number, price: { toNumber: () => number }; shop: { name: string } }) => ({
                id: p.id, price: p.price.toNumber(), shop: p.shop
            }))
            assert.deepStrictEqual(priceInfos, [
                { id: 1, price: 5499.99, shop: { name: 'X-Kom' } },
                { id: 2, price: 5399, shop: { name: 'Media Expert' } }
            ])
        })
    })
})
