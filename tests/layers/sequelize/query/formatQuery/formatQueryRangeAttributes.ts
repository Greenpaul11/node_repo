import { strict as assert } from 'node:assert'
import { it, describe, before, after } from "node:test";
import { isProductOutput } from './testSkeleton/dataTypeValidators';
import { ProductRepository, PriceRepository, ShopRepository } from './testSkeleton/repositories';
import { Product as ProductModel, Price as PriceModel, Shop as ShopModel } from './testSkeleton/models'
import { productData, priceData, shopData } from './testSkeleton/testData';
import { ProductQuery, PriceQuery, ShopQuery } from './testSkeleton/types';
import { Op } from 'sequelize'



describe('test formatQueryRangeAttributes', async () => {
    
    const productList = productData
    const priceList = priceData
    const shopList = shopData

    let productRepository: ProductRepository
    let priceRepository: PriceRepository
    let shopRepository: ShopRepository

    let formatProduct: (query: ProductQuery) => any
    let formatPrice: (query: PriceQuery) => any
    let formatShop: (query: ShopQuery) => any
    
    before(async () => {
        await ShopRepository.createTable(ShopModel)
        await ProductRepository.createTable(ProductModel)
        await PriceRepository.createTable(PriceModel)

        productRepository = new ProductRepository()
        priceRepository = new PriceRepository()
        shopRepository = new ShopRepository()

        formatProduct = (query: ProductQuery) => productRepository.formatQuery(query)
        formatPrice = (query: PriceQuery) => priceRepository.formatQuery(query)
        formatShop = (query: ShopQuery) => shopRepository.formatQuery(query)
    })

    after(async () => {
        await ShopRepository.dropTable(ShopModel)
        await ProductRepository.dropTable(ProductModel)
        await PriceRepository.dropTable(PriceModel)
    })   

    it('insert shop data', async () => {
        for (const shop of shopList) {
            await shopRepository.createOne(shop)
        }
        const count = await shopRepository.getCount()
        assert.strictEqual(count, 3)
    })
    
    it('insert product data', async () => {
        for (const product of productList) {
            await productRepository.createOne(product)
        }
        const count = await productRepository.getCount()
        assert.strictEqual(count, 3)
    })
    
    it('insert price data', async () => {
        for (const price of priceList) {
            await priceRepository.createOne(price)
        }
        const count = await priceRepository.getCount()
        assert.strictEqual(count, 4)
    })



    describe('test formating rangeQuery - expected output from database', async () => {
        
        it('query fields with valid range query types 1', async () => {
            const data = {
                created_from: new Date('2023-01-01T11:20:00Z')
            }
            const products = await productRepository.getManyByProperties(data)
            assert.strictEqual(products.length, 3)
            products.forEach((p) => isProductOutput(p))
        })

        it('query fields with valid range query types 2', async () => {
            const data = {
                created_from: new Date('2023-06-10T15:00:00Z')
            }
            const count = await productRepository.getCount(data)
            assert.strictEqual(count, 2)
                
        })

        it('query fields with valid range query types 3', async () => {
            const data = {
                created_from: new Date('2024-03-01T10:00:00Z')
            }
            const count = await productRepository.getCount(data)
            assert.strictEqual(count, 1)
                
        })

        it('query fields with valid range query types 4', async () => {
            const data = {
                created_to: new Date('2021-03-01T10:00:00Z')
            }
            const count = await productRepository.getCount(data)
            assert.strictEqual(count, 0)
        })

        it('query fields with valid range query types 5', async () => {
            const data = {
                created_from: new Date('2024-02-01T12:00:00Z'),
                created_to: new Date('2025-02-01T12:00:00Z')
            }
            const products = await productRepository.getManyByProperties(data)
            assert.strictEqual(products.length, 1)
            assert.deepStrictEqual(products[0], {
                id: 2,
                type: 'smartphone',
                brand: 'Samsung',
                model: 'Galaxy S23',
                image: null,
                description: null,
                variant: '128GB',
                variant_second: null,
                active: true,
                created: new Date('2024-03-01T10:00:00Z'),
                updated: new Date('2024-03-01T10:00:00Z')
            })
        })

        it('query fields with valid range query types 6', async () => {
            const data = {
                created_from: new Date('2021-02-01T12:00:00Z'),
                created_to: new Date('2025-02-01T12:00:00Z'),
                updated_from: new Date('2024-02-14T09:30:00Z'),
                updated_to: new Date('2024-02-16T09:30:00Z')
            }
            const products = await productRepository.getManyByProperties(data)
            assert.strictEqual(products.length, 1)
            assert.deepStrictEqual(products[0], {
                id: 1,
                type: 'laptop',
                brand: 'Apple',
                model: 'MacBook Air M2',
                image: 'https://cdn.example.com/products/mba-m2.jpg',
                description: 'Ultra-thin laptop with Apple M2 chip, 8-core CPU, and 8-core GPU.',
                variant: '8GB RAM / 256GB SSD',
                variant_second: 'Space Gray',
                active: true,
                created: new Date('2024-01-01T12:00:00Z'),
                updated: new Date('2024-02-15T09:30:00Z')
            })
        })

        it('query fields with valid range query types 7', async () => {
            const data = {
                price_from: 2000.11,
                price_to: 3300.00
            }
            const prices = await priceRepository.getManyByProperties(data)
            assert.deepStrictEqual(prices, [
                {
                    id: 3,
                    price: 3299.50,
                    shop_id: 10,
                    url: 'https://x-kom.pl',
                    product_id: 2,
                    active: true,
                    updated: new Date('2024-03-01T10:00:00Z'),
                    created: new Date('2024-03-01T10:00:00Z')
                },
                {
                    id: 4,
                    price: 2499.00,
                    shop_id: 30, 
                    url: 'https://morele.net',
                    product_id: 3,
                    active: false,
                    updated: new Date('2023-12-01T11:20:00Z'),
                    created: new Date('2023-05-10T15:00:00Z')
                }
            ])
        })


        it('query fields with valid range query types 8', async () => {
            const data = {
                id_from: 3
            }
            const products = await productRepository.getManyByProperties(data)
            assert.strictEqual(products.length, 1)
            assert.deepStrictEqual(products[0], {
                id: 3,
                type: 'monitor',
                brand: 'Dell',
                model: 'U2723QE',
                image: 'https://cdn.example.com/products/dell-u27.png',
                description: '4K USB-C Hub Monitor with IPS Black technology.',
                variant: '27 inch',
                variant_second: '4K Resolution',
                active: false,
                created: new Date('2023-05-10T15:00:00Z'),
                updated: new Date('2023-12-01T11:20:00Z')
            })
        })

        it('query fields with valid range query types 9', async () => {
            const dataPrice: PriceQuery = {
                active: true,
                price_from: 3300.00,
                select: ['price']
            }
            const data: ProductQuery = {id_to: 2, prices: dataPrice, select: ['brand', 'model']}
            const products = await productRepository.getManyByProperties(data)
            assert.strictEqual(products.length, 1)
            assert.deepStrictEqual(products[0], {
                brand: 'Apple',
                model: 'MacBook Air M2',
                prices: [{
                    price: 5499.99
                }, {
                    price: 5399.00
                }]
            })
        })

        it('query fields with range query as type string', async () => {
            let data = {
                created_from: '2023-01-01T11:20:00Z'
            } as any
            let products = await productRepository.getManyByProperties(data)
            assert.strictEqual(products.length, 3)

        })

        it('query fields with range query types that have empty string', async () => {
            const data: ProductQuery = {id_from: '', brand: 'Dell', model: 'U2723QE'}
            const products = await productRepository.getManyByProperties(data)
            assert.deepStrictEqual(products, [
                {
                    id: 3,
                    type: 'monitor',
                    brand: 'Dell',
                    model: 'U2723QE',
                    image: 'https://cdn.example.com/products/dell-u27.png',
                    description: '4K USB-C Hub Monitor with IPS Black technology.',
                    variant: '27 inch',
                    variant_second: '4K Resolution',
                    active: false,
                    created: new Date('2023-05-10T15:00:00Z'),
                    updated: new Date('2023-12-01T11:20:00Z'),
                }
            ])
        })

        it('query fields with range query types that should be rejected', async () => {
            
            let data = {
                price_from: null,
                price_to: 3300.00
            } as any
            await assert.rejects(async () => priceRepository.getManyByProperties(data), {
                name: /Error/,
                message: /Value type for price_from is not valid/
            })
            
            data = {
                id_from: undefined,
                price_from: 9999,
                price_to: 3300.00
            } 
            await assert.rejects(async () => await priceRepository.getManyByProperties(data), {
                name: /Error/,
                message: /Value type for id_from is not valid/
            })
            
            data = {
                id_from: 'test',
                price_from: 9999,
                price_to: 3300.00
            } 
            await assert.rejects(async () => await priceRepository.getManyByProperties(data), {
                name: /Error/,
                message: /Value type for id_from is not valid/
            })

            data = {
                id_from: null,
                price_from: 9999,
                price_to: 3300.00
            } 
            await assert.rejects(async () => await priceRepository.getManyByProperties(data), {
                name: /Error/,
                message: /Value type for id_from is not valid/
            })
        })

    })

})