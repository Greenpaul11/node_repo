import { strict as assert } from 'node:assert'
import { it, describe, before, after } from "node:test";
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

describe('test formatQuerySelectAttribute - expected output from database (sqlite)', async () => {
    
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

    
    describe('select with field names', async () => {
        return
        it('select with single field returns only that field', async () => {
            const products = await productRepository.getManyBy({ select: ['brand']})
            
            assert.strictEqual(products.length, 3)
            for (const product of products) {
                assert.ok(typeof product.brand === 'string')
                assert.strictEqual(Object.keys(product).length, 1)
            }
        })

        it('select all fields and return those fields', async () => {
            const products = await productRepository.getManyBy(
                { select: [...productMetadata.baseAttributesList] })

            assert.strictEqual(products.length, 3)
            const length = productMetadata.baseAttributesList.length
            for (const product of products) {
                const keys = Object.keys(product)
                for (const key of productMetadata.baseAttributesList) {
                    assert(keys.includes(key))
                }
                assert.strictEqual(Object.keys(product).length, length)
            }
        })

        it('select with multiple fields returns only those fields', async () => {
            const products = await productRepository.getManyBy({ select: ['id', 'brand', 'model'] })
            assert.strictEqual(products.length, 3)
            for (const product of products) {
                assert.ok(typeof product.id === 'number')
                assert.ok(typeof product.brand === 'string')
                assert.ok(typeof product.model === 'string')
                assert.deepStrictEqual(Object.keys(product), ['id', 'brand', 'model'])
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
            assert.deepStrictEqual(Object.keys(product), ['id', 'brand', 'model'])
        })
    })
    
    describe('select as exclude object', async () => {
        it('exclude specific fields', async () => {
            const products = await productRepository.getManyBy({ select: { exclude: ['image', 'description'] } })
            assert.strictEqual(products.length, 3)
            const attributes = productMetadata.baseAttributesList
                .filter((a) => !(['image', 'description'].includes(a)))
                .sort()
            for (const product of products) {
                assert.strictEqual(product.hasOwnProperty('image'), false)
                assert.strictEqual(product.hasOwnProperty('description'), false)
                const keys = Object.keys(product).sort()
                assert.deepStrictEqual(keys, attributes)
            }
        })
    })

    describe('select with aggregate functions', async () => {
        const productCount = productData.length
        const priceIds = priceData.map(p => p.id) as number[]
        const priceIdSum = priceIds.reduce((a, b) => a + b, 0)
        const priceIdAvg = priceIdSum / priceIds.length
        const priceIdMin = Math.min(...priceIds)
        const priceIdMax = Math.max(...priceIds)

        it('$count with * returns correct count', async () => {
            const row = await productRepository.getOneBy({ select: [['$count', '*']] })
            assert(row)
            assert.strictEqual(row['$count_*'], productCount)
            
            const rows = await productRepository.getManyBy({ select: [['$count', '*']] })
            assert.strictEqual(rows[0]['$count_*'], productCount)
        })
        
        it('$count with attribute returns correct count', async () => {
            const row = await productRepository.getOneBy({ select: [['$count', 'id']] })
            assert(row)
            assert.strictEqual(row['$count_id'], productCount)
            
            const rows = await productRepository.getManyBy({ select: [['$count', 'id']] })
            assert.strictEqual(rows[0]['$count_id'], productCount)
        })
        
        it('$sum with number attribute', async () => {
            const row = await priceRepository.getOneBy({ select: [['$sum', 'id']] })
            assert(row)
            assert.strictEqual(row['$sum_id']?.toNumber(), priceIdSum)
            
            const rows = await priceRepository.getManyBy({ select: [['$sum', 'id']] })
            assert.strictEqual(rows[0]['$sum_id']?.toNumber(), priceIdSum)
        })
        
        it('$avg with number attribute', async () => {
            const row = await priceRepository.getOneBy({ select: [['$avg', 'id']] })
            assert(row)
            assert.strictEqual(row['$avg_id']?.toNumber(), priceIdAvg)
            
            const rows = await priceRepository.getManyBy({ select: [['$avg', 'id']] })
            assert.strictEqual(rows[0]['$avg_id']?.toNumber(), priceIdAvg)
        })
        
        it('$min with number attribute', async () => {
            const row = await priceRepository.getOneBy({ select: [['$min', 'id']] })
            assert(row)
            assert.strictEqual(row['$min_id']?.toNumber(), priceIdMin)

            const rows = await priceRepository.getManyBy({ select: [['$min', 'id']] })
            assert.strictEqual(rows[0]['$min_id']?.toNumber(), priceIdMin)
        })
    
        it('$max with number attribute', async () => {
            const row = await priceRepository.getOneBy({ select: [['$max', 'id']] })
            assert(row)
            assert.strictEqual(row['$max_id']?.toNumber(), priceIdMax)
            const rows = await priceRepository.getManyBy({ select: [['$max', 'id']] })
            assert.strictEqual(rows[0]['$max_id']?.toNumber(), priceIdMax)
        })
        
        it('aggregate with deep entity reference', async () => {
            //const row = await productRepository.getOneBy({ select: [['$count', ['prices', 'id']]] })
            //assert(row)
            //assert.strictEqual(row['$count_prices_id'], priceIds.length)
            
            const rows = await productRepository.getManyBy({ select: [['$count', ['prices', 'id']]] })
            assert.strictEqual(rows[0]['$count_prices_id'], priceIds.length)
        })
        
    })
})
