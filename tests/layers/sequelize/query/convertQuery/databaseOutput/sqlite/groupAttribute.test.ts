import { strict as assert } from 'node:assert'
import { it, describe, before } from "node:test";
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
import { productData as baseProductData, priceData as basePriceData, shopData, productImporterData } from '../../../../../../testSkeleton/testData/dataBase'
import { productData as extendedProductData, priceData as extendedPriceData } from '../../../../../../testSkeleton/testData/dataExtended'
import { priceData as extendedPriceData2, shopData as extendedShopData } from '../../../../../../testSkeleton/testData/dataExtended2'
import { Repository } from '../../../../../../../src/repository/repository';
import { EntityCreationAttributes } from '../../../../../../../src/types/entity/Creation';
import { Query } from '../../../../../../../src/types/entity/Query';
import { col, fn } from 'sequelize';

const allProductData = [...baseProductData, ...extendedProductData]
const allPriceData = [...basePriceData, ...extendedPriceData, ...extendedPriceData2]
const allShopData = [...shopData, ...extendedShopData]

describe('test formatQueryGroupAttribute - expected output from database (sqlite)', async () => {

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

    describe('simple grouping', async () => {

        it('group by single field returns one row per group with correct count', async () => {
            const products = await productRepository.getManyBy({
                select: ['brand', ['$count', 'id']],
                group: 'by brand'
            })
            assert.deepStrictEqual(products, [
                { brand: 'Apple', $count_id: 5 },
                { brand: 'Dell', $count_id: 3 },
                { brand: 'Google', $count_id: 1 },
                { brand: 'Samsung', $count_id: 3 },
                { brand: 'Sony', $count_id: 1 }
            ])
        })
    
        it('group by multiple fields returns one row per combination with correct count', async () => {
            const products = await productRepository.getManyBy({
                select: ['brand', 'active', ['$count', 'id']],
                group: ['by active', 'by brand']
            })
            assert.deepStrictEqual(products, [
                { brand: 'Dell', active: false, '$count_id': 1 },
                { brand: 'Apple', active: true, '$count_id': 5 },
                { brand: 'Dell', active: true, '$count_id': 2 },
                { brand: 'Google', active: true, '$count_id': 1 },
                { brand: 'Samsung', active: true, '$count_id': 3 },
                { brand: 'Sony', active: true, '$count_id': 1 }
            ])
        })
        
        it('group by field returns groups for every distinct value', async () => {
            const products = await productRepository.getManyBy({
                select: ['type', ['$count', '*']],
                group: 'by type'
            })
            assert.deepStrictEqual(products, [
                { type: 'headphones', '$count_*': 1 },
                { type: 'laptop', '$count_*': 3 },
                { type: 'monitor', '$count_*': 3 },
                { type: 'smartphone', '$count_*': 4 },
                { type: 'tablet', '$count_*': 1 },
                { type: 'watch', '$count_*': 1 }
            ])
        })
        
        it('group by number attribute', async () => {
            const prices = await priceRepository.getManyBy({
                select: ['shop_id', ['$count', 'id']],
                group: 'by shop_id'
            })
            assert.deepStrictEqual(prices, [
                { shop_id: 10, $count_id: 12 },
                { shop_id: 20, $count_id: 10 },
                { shop_id: 30, $count_id: 7 }
            ])
        })
    })
    return
    describe('grouping with aggregate operators', async () => {

        it('group with $sum returns sum per group', async () => {
            const prices = await priceRepository.getManyBy({
                select: ['shop_id', ['$sum', 'price']] as any,
                group: 'by shop_id'
            })
            for (const row of prices as any[]) {
                assert(row['$sum_price'] instanceof Decimal)
            }
            assert.deepStrictEqual(prices.map((r: any) => ({ shop_id: r.shop_id, $sum_price: r.$sum_price.toNumber() })), [
                { shop_id: 10, $sum_price: 49969.99 },
                { shop_id: 20, $sum_price: 38770.99 },
                { shop_id: 30, $sum_price: 31643 }
            ])
        })

        it('group with $avg returns average per group', async () => {
            const prices = await priceRepository.getManyBy({
                select: ['shop_id', ['$avg', 'price']] as any,
                group: 'by shop_id'
            })
            for (const row of prices as any[]) {
                assert(row['$avg_price'] instanceof Decimal)
            }
            const avgs = prices.map((r: any) => ({ shop_id: r.shop_id, $avg_price: Math.round(r.$avg_price.toNumber() * 100) / 100 }))
            assert.deepStrictEqual(avgs, [
                { shop_id: 10, $avg_price: 4164.17 },
                { shop_id: 20, $avg_price: 3877.1 },
                { shop_id: 30, $avg_price: 4520.43 }
            ])
        })

        it('group with $min and $max returns extremes per group', async () => {
            const prices = await priceRepository.getManyBy({
                select: ['shop_id', ['$min', 'price'], ['$max', 'price']] as any,
                group: 'by shop_id'
            })
            for (const row of prices as any[]) {
                assert(row['$min_price'] instanceof Decimal)
                assert(row['$max_price'] instanceof Decimal)
            }
            assert.deepStrictEqual(prices.map((r: any) => ({ shop_id: r.shop_id, $min_price: r.$min_price.toNumber(), $max_price: r.$max_price.toNumber() })), [
                { shop_id: 10, $min_price: 1149.5, $max_price: 8499 },
                { shop_id: 20, $min_price: 1199, $max_price: 8549.99 },
                { shop_id: 30, $min_price: 1799, $max_price: 8399 }
            ])
        })

        it('group with all aggregate operators combined', async () => {
            const prices = await priceRepository.getManyBy({
                select: ['shop_id', ['$count', 'id'], ['$sum', 'price'], ['$avg', 'price'], ['$min', 'price'], ['$max', 'price']] as any,
                group: 'by shop_id'
            })
            assert.deepStrictEqual(prices.map((r: any) => ({
                shop_id: r.shop_id,
                $count_id: r.$count_id,
                $sum_price: r.$sum_price.toNumber(),
                $avg_price: Math.round(r.$avg_price.toNumber() * 100) / 100,
                $min_price: r.$min_price.toNumber(),
                $max_price: r.$max_price.toNumber()
            })), [
                { shop_id: 10, $count_id: 12, $sum_price: 49969.99, $avg_price: 4164.17, $min_price: 1149.5, $max_price: 8499 },
                { shop_id: 20, $count_id: 10, $sum_price: 38770.99, $avg_price: 3877.1, $min_price: 1199, $max_price: 8549.99 },
                { shop_id: 30, $count_id: 7, $sum_price: 31643, $avg_price: 4520.43, $min_price: 1799, $max_price: 8399 }
            ])
        })

        it('group by field with count of related entities', async () => {
            const products = await productRepository.getManyBy({
                select: ['brand', ['$count', ['prices', 'id']]],
                group: 'by brand'
            })
            assert.deepStrictEqual(products, [
                { brand: 'Apple', $count_prices_id: 15 },
                { brand: 'Dell', $count_prices_id: 3 },
                { brand: 'Google', $count_prices_id: 4 },
                { brand: 'Samsung', $count_prices_id: 5 },
                { brand: 'Sony', $count_prices_id: 2 }
            ])
        })
    })

    describe('grouping by related entity fields', async () => {

        it('group by related field returns one row per related group with count', async () => {
            const prices = await priceRepository.getManyBy({
                select: [['$count', ['shop', 'id']]],
                group: [['shop', ['by name']]],
                shop: { select: ['name'] }
            })
            assert.deepStrictEqual(prices, [
                { $count_shop_id: 10, shop: { name: 'Media Expert' } },
                { $count_shop_id: 7, shop: { name: 'Morele' } },
                { $count_shop_id: 12, shop: { name: 'X-Kom' } }
            ])
        })
    })

    describe('grouping combined with other query attributes', async () => {

        it('group combined with where clause', async () => {
            const products = await productRepository.getManyBy({
                select: ['brand', ['$count', 'id']],
                group: 'by brand',
                type: 'smartphone'
            })
            assert.deepStrictEqual(products, [
                { brand: 'Apple', $count_id: 1 },
                { brand: 'Google', $count_id: 1 },
                { brand: 'Samsung', $count_id: 2 }
            ])
        })

        it('group combined with where clause on grouped field', async () => {
            const products = await productRepository.getManyBy({
                select: ['active', ['$count', 'id']],
                group: 'by active',
                brand: 'Dell'
            })
            assert.deepStrictEqual(products, [
                { active: false, $count_id: 1 },
                { active: true, $count_id: 2 }
            ])
        })

        it('group combined with order', async () => {
            const products = await productRepository.getManyBy({
                select: ['brand', ['$count', 'id']],
                group: 'by brand',
                order: 'by brand desc'
            })
            assert.deepStrictEqual(products, [
                { brand: 'Sony', $count_id: 1 },
                { brand: 'Samsung', $count_id: 3 },
                { brand: 'Google', $count_id: 1 },
                { brand: 'Dell', $count_id: 3 },
                { brand: 'Apple', $count_id: 5 }
            ])
        })

        it('group combined with include of related entity', async () => {
            const products = await productRepository.getManyBy({
                select: ['brand', ['$count', ['prices', 'id']]],
                group: 'by brand',
                prices: { select: ['id', 'price'] }
            } as any)
            assert.deepStrictEqual(products.map((r: any) => ({ brand: r.brand, $count_prices_id: r.$count_prices_id })), [
                { brand: 'Apple', $count_prices_id: 15 },
                { brand: 'Dell', $count_prices_id: 3 },
                { brand: 'Google', $count_prices_id: 4 },
                { brand: 'Samsung', $count_prices_id: 5 },
                { brand: 'Sony', $count_prices_id: 2 }
            ])
        })

        it('getOneBy with group returns first group row', async () => {
            const product = await productRepository.getOneBy({
                select: ['brand', ['$count', 'id']],
                group: 'by brand'
            })
            assert.deepStrictEqual(product, { brand: 'Apple', $count_id: 5 })
        })
    })

    describe('group validation errors', async () => {

        it('non-existent group option throws', async () => {
            const query = { select: ['brand'], group: 'by nonexistent' }
            await assert.rejects(async () => await productRepository.getManyBy(query as any), {
                name: /Error/,
                message: /has no "by nonexistent"/
            })
        })

        it('array with non-existent group option throws', async () => {
            const query = { select: ['brand'], group: ['by brand', 'by nonexistent'] }
            await assert.rejects(async () => await productRepository.getManyBy(query as any), {
                name: /Error/,
                message: /has no "by nonexistent"/
            })
        })

        it('nested relation with non-existent option throws', async () => {
            const query = { select: ['brand'], group: ['by brand', ['prices', ['by nonexistent']]] }
            await assert.rejects(async () => await productRepository.getManyBy(query as any), {
                name: /Error/,
                message: /has no "by nonexistent"/
            })
        })

        it('nested relation with invalid relation name throws', async () => {
            const query = { select: ['brand'], group: ['by brand', ['nonexistent', ['by price']]] }
            await assert.rejects(async () => await productRepository.getManyBy(query as any), {
                name: /Error/,
                message: /Related order options are undefined/
            })
        })

        it('group as null throws', async () => {
            const query: Query<ProductEntity> = { group: null } as any
            await assert.rejects(async () => await productRepository.getManyBy(query), {
                name: /Error/,
                message: /Value type for order attribute is not valid/
            })
        })

        it('group as number throws', async () => {
            const query: Query<ProductEntity> = { group: 123 } as any
            await assert.rejects(async () => await productRepository.getManyBy(query), {
                name: /Error/,
                message: /Value type for order attribute is not valid/
            })
        })
    })
})
