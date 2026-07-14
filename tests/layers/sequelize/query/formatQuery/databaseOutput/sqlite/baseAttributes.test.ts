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



describe('test formatQueryBaseAttributes - expected output from database (sqlite)', async () => {

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

    after(async () => {
    })

    describe('test formating fields assigned to stringAttributesList - expected output from database', async () => {

        it('query fields with valid query types', async () => {
            const data = {
                type: 'laptop',
                brand: 'Apple',
                model: 'MacBook Air M2',
            }
            const product = await productRepository.getOneBy(data)
            assert(product)
            assert.strictEqual(product.type, 'laptop')
            assert.strictEqual(product.brand, 'Apple')
            assert.strictEqual(product.model, 'MacBook Air M2')
        })

        it('query fields with query types that have empty string', async () => {
            const data = {
                type: 'laptop',
                brand: 'Apple',
                model: '',
            }
            const product = await productRepository.getOneBy(data)
            assert.strictEqual(product, null)
        })

        it('query fields with query types that have null value', async () => {
            const data = {
                image: null
            }
            const product = await productRepository.getOneBy(data)
            assert(product)
            assert.strictEqual(product.type, 'smartphone')
            assert.strictEqual(product.brand, 'Samsung')
            assert.strictEqual(product.image, null)
        })

        it('query fields with query types that should be rejected', async () => {
            let data = {
                type: 'laptop',
                brand: 0,
                image: null
            } as any
            await assert.rejects(async () => await productRepository.getOneBy(data), {
                name: /Error/,
                message: /Value type for brand is not valid/
            })

            data = {
                type: 'laptop',
                brand: '',
                image: 999
            }
            await assert.rejects(async () => await productRepository.getOneBy(data), {
                name: /Error/,
                message: /Value type for image is not valid/
            })

            data = {
                brand: undefined,
                model: 'Galaxy S23',
                image: null
            }
            await assert.rejects(async () => await productRepository.getOneBy(data), {
                name: /Error/,
                message: /Value type for brand is not valid/
            })
        })
    })

    describe('test formating fields assigned to numberAttributesList - expected output from database', async () => {

        it('query fields with valid query types', async () => {
            const data = {
                id: 2,
                price: 5399.00,
                shop_id: 20,
            }
            const price = await priceRepository.getOneBy(data)
            assert(price)
            assert.strictEqual(price.id, 2)
            assert(price.price instanceof Decimal)
            assert.strictEqual(price.price.toString(), '5399')
            assert.strictEqual(price.shop_id, 20)
        })
        // should accept numbers as string
        it('query fields with query types that are number as string', async () => {
            const data = {
                id: '2',
                price: '5399.00',
                shop_id: '20',
            }
            const price = await priceRepository.getOneBy(data)
            assert(price)
            assert.strictEqual(price.id, 2)
            assert(price.price instanceof Decimal)
            assert.strictEqual(price.price.toString(), '5399')
            assert.strictEqual(price.shop_id, 20)
        })

        it('query fields with query types that are empty string - should be ignored', async () => {
            const data = {
                id: '',
                price: '',
                shop_id: '20',
            }
            const price = await priceRepository.getOneBy(data)
            assert(price)
            assert.strictEqual(price.id, 2)
            assert(price.price instanceof Decimal)
            assert.strictEqual(price.price.toString(), '5399')
            assert.strictEqual(price.shop_id, 20)
        })

        it('query fields with query types that have null value', async () => {
            const data = {
                id: null,
                price: '5399.99',
                shop_id: '20',
            } as any
            const price = await priceRepository.getOneBy(data)
            assert.strictEqual(price, null)
        })

        it('query fields with query types that should be rejected', async () => {
            let data = {
                id: 1,
                price: 'dfdd',
                shop_id: '20',
            } as any
            await assert.rejects(async () => await priceRepository.getOneBy(data), {
                name: /Error/,
                message: /Value type for price is not valid/
            })

            data = {
                id: 1,
                price: undefined,
                shop_id: '20',
            }
            await assert.rejects(async () => await priceRepository.getOneBy(data), {
                name: /Error/,
                message: /Value type for price is not valid/
            })

            data = {
                id: undefined,
                price: undefined,
                shop_id: '20',
            }
            await assert.rejects(async () => await priceRepository.getOneBy(data), {
                name: /Error/,
                message: /Value type for id is not valid/
            })

            data = {
                shop_id: 'Shop',
            }
            await assert.rejects(async () => await priceRepository.getOneBy(data), {
                name: /Error/,
                message: /Value type for shop_id is not valid/
            })
        })
    })

    describe('test formating fields assigned to dateAttributesList - expected output from database', async () => {

        it('query fields with valid query types', async () => {
            const data = {
                founded: new Date('2002-10-01T00:00:00Z'),
                active: true,
                updated: new Date('2024-01-01T12:00:00Z'),
                created: new Date('2020-01-01T12:00:00Z')
            }
            const shop = await shopRepository.getOneBy(data)
            assert(shop)
            assert.deepStrictEqual(shop.founded, new Date('2002-10-01T00:00:00Z'))
            assert.strictEqual(shop.active, true)
            assert.deepStrictEqual(shop.updated, new Date('2024-01-01T12:00:00Z'))
            assert.deepStrictEqual(shop.created, new Date('2020-01-01T12:00:00Z'))
        })

        it('query fields with query types that are date as string', async () => {
            const data = {
                founded: '2002-10-01T00:00:00.000Z',
                active: true,
                updated: '2024-01-01T12:00:00.000Z',
                created: '2020-01-01T12:00:00.000Z'
            }
            const shop = await shopRepository.getOneBy(data)
            assert(shop)
            assert.deepStrictEqual(shop.founded, new Date('2002-10-01T00:00:00Z'))
            assert.strictEqual(shop.active, true)
            assert.deepStrictEqual(shop.updated, new Date('2024-01-01T12:00:00Z'))
            assert.deepStrictEqual(shop.created, new Date('2020-01-01T12:00:00Z'))
        })

        it('query fields with query types that are empty string - should be ignored', async () => {
            const data = {
                founded: '',
                active: true,
                updated: '2024-01-01T12:00:00.000Z',
                created: '2020-01-01T12:00:00.000Z'
            }
            const shop = await shopRepository.getOneBy(data)
            assert(shop)
            assert.deepStrictEqual(shop.founded, new Date('2002-01-01T00:00:00Z'))
            assert.strictEqual(shop.active, true)
            assert.deepStrictEqual(shop.updated, new Date('2024-01-01T12:00:00Z'))
            assert.deepStrictEqual(shop.created, new Date('2020-01-01T12:00:00Z'))
        })

        it('query fields with query types that have null value', async () => {
            const data = {
                founded: null,
                updated: new Date('2023-12-01T11:20:00Z'),
                created: new Date('2020-01-01T12:00:00Z')
            }
            const shop = await shopRepository.getOneBy(data)
            assert(shop)
            assert.strictEqual(shop.founded, null)
            assert.strictEqual(shop.active, false)
            assert.deepStrictEqual(shop.updated, new Date('2023-12-01T11:20:00Z'))
            assert.deepStrictEqual(shop.created, new Date('2020-01-01T12:00:00Z'))
        })

        it('query fields with query types that should be rejected', async () => {
            // rejects numbers
            let data = {
                founded: 123,
                active: true,
                updated: '2024-01-01T12:00:00.000Z',
                created: '2020-01-01T12:00:00.000Z'
            } as any
            await assert.rejects(async () => await shopRepository.getOneBy(data), {
                name: /Error/,
                message: /Value type for founded is not valid/
            })
            // rejects undefined
            data = {
                founded: undefined,
                active: true,
                updated: '2024-01-01T12:00:00.000Z',
                created: '2020-01-01T12:00:00.000Z'
            }
            await assert.rejects(async () => await shopRepository.getOneBy(data), {
                name: /Error/,
                message: /Value type for founded is not valid/
            })
            // rejects boolean
            data = {
                active: true,
                updated: true,
                created: '2020-01-01T12:00:00.000Z'
            }
            await assert.rejects(async () => await shopRepository.getOneBy(data), {
                name: /Error/,
                message: /Value type for updated is not valid/
            })
            // reject magic strings
            data = {
                updated: 'null',
                created: '2020-01-01T12:00:00.000Z'
            }
            await assert.rejects(async () => await shopRepository.getOneBy(data), {
                name: /Error/,
                message: /Value type for updated is not valid/
            })
        })
    })


    describe('test formating fields assigned to booleanAttributesList - expected output from database', async () => {

        it('query fields with valid query types', async () => {
            const data = {
                id: 2,
                active: true,
            }
            const price = await priceRepository.getOneBy(data)
            assert(price)
            assert.strictEqual(price.id, 2)
            assert.strictEqual(price.active, true)
        })
        // should accept numbers as string
        it('query fields with query types that are boolean as string', async () => {
            const data = {
                id: 2,
                active: 'true',
            } as any
            const price = await priceRepository.getOneBy(data)
            assert(price)
            assert.strictEqual(price.id, 2)
            assert.strictEqual(price.active, true)

            data['id'] = '4'
            data['active'] = 'false'
            const price2 = await priceRepository.getOneBy(data)
            assert(price2)
            assert.strictEqual(price2.id, 4)
            assert.strictEqual(price2.active, false)
        })

        it('query fields with query types that are boolean as number 1 or 0', async () => {
            const data = {
                id: 2,
                active: 1,
            } as any
            const price = await priceRepository.getOneBy(data)
            assert(price)
            assert.strictEqual(price.id, 2)
            assert.strictEqual(price.active, true)

            data['id'] = '4'
            data['active'] = 0
            const price2 = await priceRepository.getOneBy(data)
            assert(price2)
            assert.strictEqual(price2.id, 4)
            assert.strictEqual(price2.active, false)
        })

        it('query fields with query types that are boolean as number in string "1" or "0"', async () => {
            const data = {
                id: 2,
                active: '1',
            }
            const price = await priceRepository.getOneBy(data)
            assert(price)
            assert.strictEqual(price.id, 2)
            assert.strictEqual(price.active, true)

            data['id'] = 4
            data['active'] = '0'
            const price2 = await priceRepository.getOneBy(data)
            assert(price2)
            assert.strictEqual(price2.id, 4)
            assert.strictEqual(price2.active, false)
        })

        it('query fields with query types that are empty string - should be ignored', async () => {
            const data = {
                id: 2,
                active: '',
            }
            const price = await priceRepository.getOneBy(data)
            assert(price)
            assert.strictEqual(price.id, 2)
            assert.strictEqual(price.active, true)
        })

        it('query fields with query types that have null value', async () => {
            const data = {
                id: 2,
                active: null,
            } as any
            const price = await priceRepository.getOneBy(data)
            assert.strictEqual(price, null)
        })

        it('query fields with query types that should be rejected', async () => {
            // rejects numbers
            let data = {
                id: 2,
                active: 2
            } as any
            await assert.rejects(async () => await priceRepository.getOneBy(data), {
                name: /Error/,
                message: /Value type for active is not valid/
            })
            // rejects undefined
            data = {
                id: 2,
                active: undefined
            }
            await assert.rejects(async () => await priceRepository.getOneBy(data), {
                name: /Error/,
                message: /Value type for active is not valid/
            })
            // reject magic strings
            data = {
                id: 2,
                active: 'null'
            }
            await assert.rejects(async () => await priceRepository.getOneBy(data), {
                name: /Error/,
                message: /Value type for active is not valid/
            })
        })
    })
})
