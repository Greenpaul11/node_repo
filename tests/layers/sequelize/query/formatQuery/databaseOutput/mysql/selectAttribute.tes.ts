import { strict as assert } from 'node:assert'
import { it, describe, before, after } from "node:test";
import Decimal from 'decimal.js'
import connection from '../../../../../../../config/connection';
import { 
    Product as ProductEntity, 
    Price as PriceEntity, 
} from '../../../../../../testSkeleton/entities'
import { 
    Product as ProductModel, 
    Price as PriceModel, 
    ProductImporter as ProductImporterModel 
} from '../../../../../../testSkeleton/models'
import { productMetadata, priceMetadata } from '../../../../../../testSkeleton/config'
import { productData, priceData, productImporterData } from '../../../../../../testSkeleton/testData/dataBase'
import { Repository } from '../../../../../../../src/repository/repository';
import { EntityCreationAttributes } from '../../../../../../../src/types/entity/Creation';

describe('test formatQuerySelectAttribute - expected output from database (mysql)', async () => {

    const productList = productData
    const priceList = priceData

    let productRepository: Repository<ProductEntity, EntityCreationAttributes<ProductEntity>, ProductModel>
    let priceRepository: Repository<PriceEntity, EntityCreationAttributes<PriceEntity>, PriceModel>

    before(async () => {
        productRepository = await Repository.init(connection, productMetadata, ProductModel)
        priceRepository = await Repository.init(connection, priceMetadata, PriceModel)

        await ProductImporterModel.bulkCreate(productImporterData)

        for (const product of productList) {
            await productRepository.createOne(product)
        }

        for (const price of priceList) {
            await priceRepository.createOne(price)
        }
    })

    after(async () => {
    })

    describe('select with field names', async () => {

        it('select with single field returns only that field', async () => {
            const products = await productRepository.getManyBy({ select: ['brand'] })
            assert.strictEqual(products.length, 3)
            for (const product of products) {
                assert.ok(typeof product.brand === 'string')
                assert.strictEqual(Object.keys(product).length, 1)
            }
        })

        it('select with multiple fields returns only those fields', async () => {
            const products = await productRepository.getManyBy({ select: ['id', 'brand', 'model'] })
            assert.strictEqual(products.length, 3)
            for (const product of products) {
                assert.ok(typeof product.id === 'number')
                assert.ok(typeof product.brand === 'string')
                assert.ok(typeof product.model === 'string')
            }
        })

        it('select combined with where clause', async () => {
            const product = await productRepository.getOneBy({
                brand: 'Apple',
                select: ['id', 'brand', 'model']
            })
            assert(product)
            assert.strictEqual(product.brand, 'Apple')
            assert.strictEqual(product.model, 'MacBook Air M2')
        })
    })

    describe('select as exclude object', async () => {

        it('exclude specific fields', async () => {
            const products = await productRepository.getManyBy({ select: { exclude: ['image', 'description'] } })
            assert.strictEqual(products.length, 3)
            for (const product of products) {
                assert.strictEqual(product.image, undefined)
                assert.strictEqual(product.description, undefined)
            }
        })
    })

    describe('select with aggregate functions', async () => {
        const productCount = productData.length
        const priceIds = priceData.map(p => p.id)
        const priceIdSum = priceIds.reduce((a, b) => a + b, 0)
        const priceIdAvg = priceIdSum / priceIds.length
        const priceIdMin = Math.min(...priceIds)
        const priceIdMax = Math.max(...priceIds)

        it('$count with * returns correct count', async () => {
            const result = await productRepository.getManyBy({ select: [['$count', '*'] as any] }, true)
            const row = (result as any)[0]
            assert.strictEqual(Number(row['$count_*']), productCount)
        })

        it('$count with attribute returns correct count', async () => {
            const result = await productRepository.getManyBy({ select: [['$count', 'id'] as any] }, true)
            const row = (result as any)[0]
            assert.strictEqual(Number(row['$count_id']), productCount)
        })

        it('$sum with number attribute', async () => {
            const result = await priceRepository.getManyBy({ select: [['$sum', 'id'] as any] }, true)
            const row = (result as any)[0]
            assert.strictEqual(Number(row['$sum_id']), priceIdSum)
        })

        it('$avg with number attribute', async () => {
            const result = await priceRepository.getManyBy({ select: [['$avg', 'id'] as any] }, true)
            const row = (result as any)[0]
            assert.strictEqual(Number(row['$avg_id']), priceIdAvg)
        })

        it('$min with number attribute', async () => {
            const result = await priceRepository.getManyBy({ select: [['$min', 'id'] as any] }, true)
            const row = (result as any)[0]
            assert.strictEqual(Number(row['$min_id']), priceIdMin)
        })

        it('$max with number attribute', async () => {
            const result = await priceRepository.getManyBy({ select: [['$max', 'id'] as any] }, true)
            const row = (result as any)[0]
            assert.strictEqual(Number(row['$max_id']), priceIdMax)
        })

        it('aggregate with deep entity reference', async () => {
            const result = await productRepository.getManyBy({ select: [['$count', ['prices', 'id']] as any] }, true)
            const row = (result as any)[0]
            assert.strictEqual(Number(row['$count_prices_id']), priceIds.length)
        })
    })
})
