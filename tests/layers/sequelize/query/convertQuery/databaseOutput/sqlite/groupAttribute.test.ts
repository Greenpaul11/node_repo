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
    ProductImporter as ProductImporterModel,
    ProductCategory as ProductCategoryModel,
    Category as CategoryModel
} from '../../../../../../testSkeleton/models'
import { productMetadata, priceMetadata, shopMetadata } from '../../../../../../testSkeleton/config'
import { 
    productData as baseProductData, 
    priceData as basePriceData, 
    shopData, productImporterData, 
    categoryData as categoryDataBase 
} from '../../../../../../testSkeleton/testData/dataBase'
import { productData as extendedProductData, priceData as extendedPriceData } from '../../../../../../testSkeleton/testData/dataExtended'
import { 
    priceData as extendedPriceData2, 
    shopData as extendedShopData, 
    productCategoryData,
    categoryData as extendedCategoryData
} from '../../../../../../testSkeleton/testData/dataExtended2'
import { Repository } from '../../../../../../../src/repository/repository';
import { EntityCreationAttributes } from '../../../../../../../src/types/entity/Creation';
import { Query } from '../../../../../../../src/types/entity/Query';

const allProductData = [...baseProductData, ...extendedProductData]
const allPriceData = [...basePriceData, ...extendedPriceData, ...extendedPriceData2]
const allShopData = [...shopData, ...extendedShopData]
const categoryData = [...categoryDataBase, ...extendedCategoryData]

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
        
        await CategoryModel.bulkCreate(categoryData)
        await ProductCategoryModel.bulkCreate(productCategoryData)
        
    })

    describe('grouping by entity base attributes', async () => {
    
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

        it('group with $sum returns sum per group', async () => {
            const prices = await priceRepository.getManyBy({
                select: ['shop_id', ['$sum', 'price']],
                group: 'by shop_id'
            })
            for (const row of prices) {
                assert(row['$sum_price'] instanceof Decimal)
            }
            assert.deepStrictEqual(prices.map((r) => ({ shop_id: r.shop_id, 
                                                $sum_price: r.$sum_price.toNumber() })), [
                { shop_id: 10, $sum_price: 49969.99 },
                { shop_id: 20, $sum_price: 38770.99 },
                { shop_id: 30, $sum_price: 31643 }
            ])
        })

        it('group with $avg returns avg per group', async () => {
            const prices = await priceRepository.getManyBy({
                select: ['shop_id', ['$avg', 'price']],
                group: 'by shop_id'
            })
            for (const row of prices) {
                assert(row['$avg_price'] instanceof Decimal)
            }
            assert.deepStrictEqual(prices.map((r) => ({ shop_id: r.shop_id, 
                                                $avg_price: r.$avg_price.round().toNumber() })), [
                { shop_id: 10, $avg_price: 4164 },
                { shop_id: 20, $avg_price: 3877 },
                { shop_id: 30, $avg_price: 4520 }
            ])
        })
        
        it('group with $min returns min per group', async () => {
            const prices = await priceRepository.getManyBy({
                select: ['shop_id', ['$min', 'price']],
                group: 'by shop_id'
            })
            for (const row of prices) {
                assert(row['$min_price'] instanceof Decimal)
            }
            assert.deepStrictEqual(prices.map((r) => ({ shop_id: r.shop_id, 
                                                $min_price: r.$min_price.round().toNumber() })), [
                { shop_id: 10, '$min_price': 1150 },
                { shop_id: 20, '$min_price': 1199 },
                { shop_id: 30, '$min_price': 1799 }
            ])
        })

        it('group with $max returns max per group', async () => {
            const prices = await priceRepository.getManyBy({
                select: ['shop_id', ['$max', 'price']],
                group: 'by shop_id'
            })
            for (const row of prices) {
                assert(row['$max_price'] instanceof Decimal)
            }
            assert.deepStrictEqual(prices.map((r) => ({ shop_id: r.shop_id, $max_price: 
                                                r.$max_price.round().toNumber() })), [
                { shop_id: 10, '$max_price': 8499 },
                { shop_id: 20, '$max_price': 8550 },
                { shop_id: 30, '$max_price': 8399 }
            ])
        })

        it('group with $min and $max returns min and max per group', async () => {
            const prices = await priceRepository.getManyBy({
                select: ['shop_id', ['$min', 'price'], ['$max', 'price']] ,
                group: 'by shop_id'
            })
            for (const row of prices) {
                assert(row['$min_price'] instanceof Decimal)
                assert(row['$max_price'] instanceof Decimal)
            }
            assert.deepStrictEqual(prices.map((r) => ({ shop_id: r.shop_id, $min_price: 
                                                    r.$min_price.round().toNumber(), $max_price: 
                                                    r.$max_price.round().toNumber() })), [
                { shop_id: 10, $min_price: 1150, $max_price: 8499 },
                { shop_id: 20, $min_price: 1199, $max_price: 8550 },
                { shop_id: 30, $min_price: 1799, $max_price: 8399 }
            ])
        })

        it('group with all aggregate operators combined', async () => {
            const prices = await priceRepository.getManyBy({
                select: ['shop_id', ['$count', 'id'], ['$sum', 'price'], ['$avg', 'price'], ['$min', 'price'], ['$max', 'price']] ,
                group: 'by shop_id'
            })
            assert.deepStrictEqual(prices.map((r) => ({
                shop_id: r.shop_id,
                $count_id: r.$count_id,
                $sum_price: r.$sum_price.toNumber(),
                $avg_price: r.$avg_price.round().toNumber(),
                $min_price: r.$min_price.round().toNumber(),
                $max_price: r.$max_price.round().toNumber()
            })), [
                { shop_id: 10, $count_id: 12, $sum_price: 49969.99, $avg_price: 4164, $min_price: 1150, $max_price: 8499 },
                { shop_id: 20, $count_id: 10, $sum_price: 38770.99, $avg_price: 3877, $min_price: 1199, $max_price: 8550},
                { shop_id: 30, $count_id: 7, $sum_price: 31643, $avg_price: 4520, $min_price: 1799, $max_price: 8399 }
            ])
        })
    })
    

    describe('grouping by related entities base attributes', async () => {

        describe('grouping by first level related attributes', async () => {
        
            it('group by one field returns avg per group', async () => {
                const average = await priceRepository.getManyBy({
                    select: [['$avg', 'price']],
                    group: [['product', ['by brand']]],
                    product: { select: ['brand']}
                })

                assert.deepStrictEqual(average.map((a) => ({
                    $avg_price: a.$avg_price.round().toNumber(), product: a.product
                })), [
                    { $avg_price: 4276, product: { brand: 'Apple' } },
                    { $avg_price: 4732, product: { brand: 'Dell' } },
                    { $avg_price: 4212, product: { brand: 'Google' } },
                    { $avg_price: 4569, product: { brand: 'Samsung' } },
                    { $avg_price: 1174, product: { brand: 'Sony' } }
                ])
            })

            it('group by multiple fields returns max per group', async () => {
                const maxPrice = await priceRepository.getManyBy({
                    select: [['$max', 'price']],
                    group: [['product', ['by brand', 'by active', 'by model']]],
                    product: { select: ['brand', 'active', 'model']}
                })
                assert.deepStrictEqual(maxPrice.map((m) => ({
                    $max_price: m.$max_price.round().toNumber(),
                    product: m.product
                })), [
                    { $max_price: 5500, product: { brand: 'Apple', active: true, model: 'MacBook Air M2' } },
                    { $max_price: 8550, product: { brand: 'Apple', active: true, model: 'MacBook Pro M3' } },
                    { $max_price: 1899, product: { brand: 'Apple', active: true, model: 'Watch Series 9' } },
                    { $max_price: 2749, product: { brand: 'Apple', active: true, model: 'iPad Air' } },
                    { $max_price: 5249, product: { brand: 'Apple', active: true, model: 'iPhone 15 Pro' } },
                    { $max_price: 2499, product: { brand: 'Dell', active: false, model: 'U2723QE' } },
                    { $max_price: 5899, product: { brand: 'Dell', active: true, model: 'XPS 13' } },
                    { $max_price: 4299, product: { brand: 'Google', active: true, model: 'Pixel 8 Pro' } },
                    { $max_price: 3300, product: { brand: 'Samsung', active: true, model: 'Galaxy S23' } },
                    { $max_price: 6399, product: { brand: 'Samsung', active: true, model: 'Galaxy S24 Ultra' } },
                    { $max_price: 3449, product: { brand: 'Samsung', active: true, model: 'Odyssey G7' } },
                    { $max_price: 1199, product: { brand: 'Sony', active: true, model: 'WH-1000XM5' } }
                ])
            })
            
            it('group by seprate relation fields returns min per group', async () => {
                const minPrice = await priceRepository.getManyBy({
                    select: [['$min', 'price']],
                    group: [['product', ['by brand', 'by model']], ['shop', ['by name']]],
                    product: { select: ['brand', 'model'], brand: ['Dell', 'Google', 'Sony']},
                    shop: { select: ['name']}
                })
            
                assert.deepStrictEqual(minPrice.map((m) => ({
                    $min_price: m.$min_price.round().toNumber(),
                    product: m.product,
                    shop: m.shop
                })), [
                    { '$min_price': 2499, product: { brand: 'Dell', model: 'U2723QE' }, shop: { name: 'Morele' } },
                    { '$min_price': 5899, product: { brand: 'Dell', model: 'XPS 13' }, shop: { name: 'Morele' } },
                    { '$min_price': 5799, product: { brand: 'Dell', model: 'XPS 13' }, shop: { name: 'X-Kom' } },
                    { '$min_price': 4199, product: { brand: 'Google', model: 'Pixel 8 Pro' }, shop: { name: 'Media Expert' } },
                    { '$min_price': 4099, product: { brand: 'Google', model: 'Pixel 8 Pro' }, shop: { name: 'Morele' } },
                    { '$min_price': 4249, product: { brand: 'Google', model: 'Pixel 8 Pro' }, shop: { name: 'X-Kom' } },
                    { '$min_price': 1199, product: { brand: 'Sony', model: 'WH-1000XM5' }, shop: { name: 'Media Expert' } },
                    { '$min_price': 1150, product: { brand: 'Sony', model: 'WH-1000XM5' }, shop: { name: 'X-Kom' } }
                ])
            })
        })

        describe('grouping by second level related attributes', async () => {

            it('group by one field returns avg per group', async () => {
            
                const average = await productRepository.getManyBy({
                    select: [['$avg', ['prices', 'price']]],
                    group: [['prices', [['shop', ['by name']]]]],
                    prices: {shop: {select: ['name']}, select: []},
                    
                })

                assert.deepStrictEqual(average.map((a) => ({
                    $avg_prices_price: a.$avg_prices_price ? a.$avg_prices_price.round().toNumber() : a.$avg_prices_price,
                    prices: a.prices
                })), [
                 { $avg_prices_price: null, prices: [{ shop: null }] },
                 { $avg_prices_price: 3877, prices: [{ shop: { name: "Media Expert" } }] },
                 { $avg_prices_price: 4520, prices: [{ shop: { name: "Morele" } }] },
                 { $avg_prices_price: 4164, prices: [{ shop: { name: "X-Kom" } }] }
                ])
            })

            it('group by multiple field returns max per group', async () => {
                
                const max = await productRepository.getManyBy({
                    select: ['id', 'brand', ['$max', ['prices', 'price']]],
                    group: [['prices', [['shop', ['by name', 'by founded']]]], 'by brand', 'by id'],
                    prices: {shop: {select: ['name', 'founded']}, select: []},
                    brand: ['Dell', 'Sony', 'Samsung']
                })

                assert.deepStrictEqual(max.map((m) => ({
                    id: m.id,
                    brand: m.brand,
                    $max_prices_price: m.$max_prices_price ? m.$max_prices_price.round().toNumber() : m.$max_prices_price,
                    prices: m.prices
                })), [
                    { id: 13, brand: "Dell", $max_prices_price: null, prices: [{ shop: null }] },
                    { id: 7, brand: "Samsung", $max_prices_price: 3399, prices: [{ shop: { name: "Media Expert", founded: new Date("2002-10-01T00:00:00.000Z") } }] },
                    { id: 8, brand: "Sony", $max_prices_price: 1199, prices: [{ shop: { name: "Media Expert", founded: new Date("2002-10-01T00:00:00.000Z") } }] },
                    { id: 3, brand: "Dell", $max_prices_price: 2499, prices: [{ shop: null }] },
                    { id: 9, brand: "Dell", $max_prices_price: 5899, prices: [{ shop: null }] },
                    { id: 6, brand: "Samsung", $max_prices_price: 6299, prices: [{ shop: null }] },
                    { id: 9, brand: "Dell", $max_prices_price: 5799, prices: [{ shop: { name: "X-Kom", founded: new Date("2002-01-01T00:00:00.000Z") } }] },
                    { id: 2, brand: "Samsung", $max_prices_price: 3300, prices: [{ shop: { name: "X-Kom", founded: new Date("2002-01-01T00:00:00.000Z") } }] },
                    { id: 6, brand: "Samsung", $max_prices_price: 6399, prices: [{ shop: { name: "X-Kom", founded: new Date("2002-01-01T00:00:00.000Z") } }] },
                    { id: 7, brand: "Samsung", $max_prices_price: 3449, prices: [{ shop: { name: "X-Kom", founded: new Date("2002-01-01T00:00:00.000Z") } }] },
                    { id: 8, brand: "Sony", $max_prices_price: 1150, prices: [{ shop: { name: "X-Kom", founded: new Date("2002-01-01T00:00:00.000Z") } }] }
                ])
            })

            it('group by seprate relation fields returns min per group', async () => {
    
                const min = await productRepository.getManyBy({
                    select: ['id', 'brand', ['$min', ['prices', 'price']]],
                    group: [['product_categories', [['category', 'by name']]],['prices', [['shop', ['by name']]]], 'by brand', 'by id'],
                    product_categories: {category: { select: ['name']}, select: []},
                    prices: {shop: {select: ['name']}, select: []},
                    brand: ['Apple', 'Sony']
                })
                
                assert.deepStrictEqual(min.map((m) => ({
                    id: m.id,
                    brand: m.brand,
                    $min_prices_price: m.$min_prices_price ? m.$min_prices_price.round().toNumber() : m.$min_prices_price,
                    product_categories: m.product_categories,
                    prices: m.prices
                })), [
                    { id: 8, brand: "Sony", $min_prices_price: 1199, prices: [{ shop: { name: "Media Expert" } }], product_categories: [{ category: { name: "Audio" } }] },
                    { id: 8, brand: "Sony", $min_prices_price: 1150, prices: [{ shop: { name: "X-Kom" } }], product_categories: [{ category: { name: "Audio" } }] },
                    { id: 1, brand: "Apple", $min_prices_price: 5399, prices: [{ shop: { name: "Media Expert" } }], product_categories: [{ category: { name: "Gaming Laptops" } }, { category: { name: "Laptops" } }] },
                    { id: 4, brand: "Apple", $min_prices_price: 8550, prices: [{ shop: { name: "Media Expert" } }], product_categories: [{ category: { name: "Gaming Laptops" } }, { category: { name: "Laptops" } }] },
                    { id: 4, brand: "Apple", $min_prices_price: 8399, prices: [{ shop: { name: "Morele" } }], product_categories: [{ category: { name: "Gaming Laptops" } }, { category: { name: "Laptops" } }] },
                    { id: 1, brand: "Apple", $min_prices_price: 5500, prices: [{ shop: { name: "X-Kom" } }], product_categories: [{ category: { name: "Gaming Laptops" } }, { category: { name: "Laptops" } }] },
                    { id: 4, brand: "Apple", $min_prices_price: 8499, prices: [{ shop: { name: "X-Kom" } }], product_categories: [{ category: { name: "Gaming Laptops" } }, { category: { name: "Laptops" } }] },
                    { id: 5, brand: "Apple", $min_prices_price: 5249, prices: [{ shop: { name: "Media Expert" } }], product_categories: [{ category: { name: "Smartphones" } }] },
                    { id: 5, brand: "Apple", $min_prices_price: 5199, prices: [{ shop: { name: "X-Kom" } }], product_categories: [{ category: { name: "Smartphones" } }] },
                    { id: 10, brand: "Apple", $min_prices_price: 2749, prices: [{ shop: { name: "Media Expert" } }], product_categories: [{ category: { name: "Tablets" } }] },
                    { id: 10, brand: "Apple", $min_prices_price: 2649, prices: [{ shop: { name: "Morele" } }], product_categories: [{ category: { name: "Tablets" } }] },
                    { id: 10, brand: "Apple", $min_prices_price: 2699, prices: [{ shop: { name: "X-Kom" } }], product_categories: [{ category: { name: "Tablets" } }] },
                    { id: 12, brand: "Apple", $min_prices_price: 1829, prices: [{ shop: { name: "Media Expert" } }], product_categories: [{ category: { name: "Wearables" } }] },
                    { id: 12, brand: "Apple", $min_prices_price: 1799, prices: [{ shop: { name: "Morele" } }], product_categories: [{ category: { name: "Wearables" } }] },
                    { id: 12, brand: "Apple", $min_prices_price: 1849, prices: [{ shop: { name: "X-Kom" } }], product_categories: [{ category: { name: "Wearables" } }] }
                ])
            })
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
