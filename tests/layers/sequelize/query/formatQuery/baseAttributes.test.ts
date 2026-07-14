import { strict as assert } from 'node:assert'
import { it, describe, before } from "node:test";
import { productMetadata, priceMetadata, shopMetadata } from '../../../../testSkeleton/config'
import { QueryFormater } from '../../../../../src/layers/sequelize/query/formater'
import { createRelationTree } from '../../../../../src/tree/treeBuilders'
import { Query } from '../../../../../src/types/entity/Query';
import { Product, Price, Shop } from '../../../../testSkeleton/entities';



describe('test formatQuery with baseAttributes', async () => {
    
    let formatProduct: (query: Query<Product>) => any
    let formatPrice: (query: Query<Price>) => any
    let formatShop: (query: Query<Shop>) => any
    
    before(() => {
        const productRelationTree = createRelationTree(productMetadata)
        const priceRelationTree = createRelationTree(priceMetadata)
        const shopRelationTree = createRelationTree(shopMetadata)

        const productFormater = new QueryFormater(productMetadata, productRelationTree)
        const priceFormater = new QueryFormater(priceMetadata, priceRelationTree)
        const shopFormater = new QueryFormater(shopMetadata, shopRelationTree)

        productFormater.queryConvertObject = productFormater.queryConvertObjectFactory()
        priceFormater.queryConvertObject = priceFormater.queryConvertObjectFactory()
        shopFormater.queryConvertObject = shopFormater.queryConvertObjectFactory()

        formatProduct = (query: Query<Product>) => productFormater.formatQuery(query)
        formatPrice = (query: Query<Price>) => priceFormater.formatQuery(query)
        formatShop = (query: Query<Shop>) => shopFormater.formatQuery(query)
    })

    describe('test formating fields assigned to stringAttributesList', () => {

        it('query fields with valid query types', () => {
            const data = {
                type: 'laptop',
                brand: 'Apple',
                model: 'MacBook Air M2',
            }
            const formated = formatProduct(data)
            assert.deepStrictEqual(formated, {
                where: {
                    type: 'laptop',
                    brand: 'Apple',
                    model: 'MacBook Air M2',
                }
            })
        })
        // should accept empty string
        it('query fields with query types that have empty string', () => {
            const data = {
                type: 'laptop',
                brand: 'Apple',
                model: '',
            }
            const formated = formatProduct(data)
            assert.deepStrictEqual(formated, {
                where: {
                    type: 'laptop',
                    brand: 'Apple',
                    model: '',
                }
            })
        })

        it('query fields with query types that have null value', () => {
            const data = {
                type: 'laptop',
                brand: 'Apple',
                image: null
            }
            let result = formatProduct(data)
            assert.deepStrictEqual(result, {
                where: {
                    type: 'laptop',
                    brand: 'Apple',
                    image: null,
                }
            })

            result = formatProduct({ image: null })
            assert.deepStrictEqual(result, { where: { image: null } } )
        })

        it('query fields with query types that should be rejected', () => {
            let data = {
                type: 'laptop',
                brand: 0,
                image: null
            } as any
            assert.throws(() => formatProduct(data), {
                name: /Error/,
                message: /Value type for brand is not valid/
            })

            data = {
                type: 'laptop',
                brand: '',
                image: 999
            } 
            assert.throws(() => formatProduct(data), {
                name: /Error/,
                message: /Value type for image is not valid/
            })

            data = {
                brand: undefined,
                model: 'Galaxy S23',
                image: null
            }
            assert.throws(() => formatProduct(data), {
                name: /Error/,
                message: /Value type for brand is not valid/
            })
        })
    })

    describe('test formating fields assigned to numberAttributesList', () => {
        it('query fields with valid query types', () => {
            const data = {
                id: 2,
                price: 5399.99,
                shop_id: 20, 
            }
            const formated = formatPrice(data)
            assert.deepStrictEqual(formated, {
                where: {
                    id: 2,
                    price: 5399.99,
                    shop_id: 20, 
                }
            })
        })
        // should accept numbers as string
        it('query fields with query types that are number as string', () => {
            const data = {
                id: '2',
                price: '5399.99',
                shop_id: '20', 
            }
            const formated = formatPrice(data)
            assert.deepStrictEqual(formated, {
                where: {
                    id: 2,
                    price: 5399.99,
                    shop_id: 20, 
                }
            })
        })

        it('query fields with query types that are empty string - should be ignored', () => {
            const data = {
                id: '',
                price: '',
                shop_id: '20', 
            }
            const formated = formatPrice(data)
            assert.deepStrictEqual(formated, {
                where: {
                    shop_id: 20, 
                }
            })
        })
       
        it('query fields with query types that have null value', () => {
            const data = {
                id: null,
                price: '5399.99',
                shop_id: '20', 
            } as any
            const formated = formatPrice(data)
            assert.deepStrictEqual(formated, {
                where: {
                    id: null,
                    price: 5399.99,
                    shop_id: 20, 
                }
            })
        })

        it('query fields with query types that should be rejected', () => {
            let data = {
                id: 1,
                price: 'dfdd',
                shop_id: '20', 
            } as any
            assert.throws(() => formatPrice(data), {
                name: /Error/,
                message: /Value type for price is not valid/
            })

            data = {
                id: 1,
                price: undefined,
                shop_id: '20', 
            } 
            assert.throws(() => formatPrice(data), {
                name: /Error/,
                message: /Value type for price is not valid/
            })

            data = {
                id: undefined,
                price: undefined,
                shop_id: '20', 
            } 
            assert.throws(() => formatPrice(data), {
                name: /Error/,
                message: /Value type for id is not valid/
            })

            data = {
                shop_id: 'Shop', 
            } 
            assert.throws(() => formatPrice(data), {
                name: /Error/,
                message: /Value type for shop_id is not valid/
            })

        })
    })

    describe('test formating fields assigned to dateAttributesList', () => {
        
        it('query fields with valid query types', () => {
            const data = {
                founded: new Date('2002-10-01T00:00:00Z'),
                active: true,
                updated: new Date('2024-01-01T12:00:00Z'),
                created: new Date('2020-01-01T12:00:00Z')
            }
            const formated = formatShop(data)
            assert.deepStrictEqual(formated, {
                where: {
                    founded: new Date('2002-10-01T00:00:00Z'),
                    active: true,
                    updated: new Date('2024-01-01T12:00:00Z'),
                    created: new Date('2020-01-01T12:00:00Z')
                }
            })
        })

        it('query fields with query types that are date as string', () => {
            const data = {
                founded: '2002-10-01T00:00:00.000Z',
                active: true,
                updated: '2024-01-01T12:00:00.000Z',
                created: '2020-01-01T12:00:00.000Z'
            }
            const formated = formatShop(data)
            assert.deepStrictEqual(formated, {
                where: {
                    founded: new Date('2002-10-01T00:00:00Z'),
                    active: true,
                    updated: new Date('2024-01-01T12:00:00Z'),
                    created: new Date('2020-01-01T12:00:00Z')
                }
            })
        })

        it('query fields with query types that are empty string - should be ignored', () => {
            const data = {
                founded: '',
                active: true,
                updated: '2024-01-01T12:00:00.000Z',
                created: '2020-01-01T12:00:00.000Z'
            }
            const formated = formatShop(data)
            assert.deepStrictEqual(formated, {
                where: {
                    active: true,
                    updated: new Date('2024-01-01T12:00:00Z'),
                    created: new Date('2020-01-01T12:00:00Z')
                }
            })
        })

        it('query fields with query types that have null value', () => {
            const data = {
                founded: null,
                active: true,
                updated: '2024-01-01T12:00:00.000Z',
                created: '2020-01-01T12:00:00.000Z'
            }
            const formated = formatShop(data)
            assert.deepStrictEqual(formated, {
                where: {
                    founded: null,
                    active: true,
                    updated: new Date('2024-01-01T12:00:00Z'),
                    created: new Date('2020-01-01T12:00:00Z')
                }
            })
        })

        it('query fields with query types that should be rejected', () => {
            // rejects numbers
            let data = {
                founded: 123,
                active: true,
                updated: '2024-01-01T12:00:00.000Z',
                created: '2020-01-01T12:00:00.000Z'
            } as any
            assert.throws(() => formatShop(data), {
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
            assert.throws(() => formatShop(data), {
                name: /Error/,
                message: /Value type for founded is not valid/
            })
            // rejects boolean
            data = {
                active: true,
                updated: true,
                created: '2020-01-01T12:00:00.000Z'
            } 
            assert.throws(() => formatShop(data), {
                name: /Error/,
                message: /Value type for updated is not valid/
            })
            // reject magic strings
            data = {
                updated: 'null',
                created: '2020-01-01T12:00:00.000Z'
            } 
            assert.throws(() => formatShop(data), {
                name: /Error/,
                message: /Value type for updated is not valid/
            })
        })
    })

    describe('test formating fields assigned to booleanAttributesList', async () => {
        it('query fields with valid query types', () => {
            const data = {
                id: 2,
                active: true, 
            }
            const formated = formatPrice(data)
            assert.deepStrictEqual(formated, {
                where: {
                    id: 2,
                    active: true, 
                }
            })
        })
        // should accept numbers as string
        it('query fields with query types that are boolean as string', () => {
            const data = {
                id: 2,
                active: 'true', 
            }
            let result = formatPrice(data)
            assert.deepStrictEqual(result, {
                where: {
                    id: 2,
                    active: true, 
                }
            })

            data['active'] = 'false'
            result = formatPrice(data)
            assert.deepStrictEqual(result, {
                where: {
                    id: 2,
                    active: false, 
                }
            })
        })

        it('query fields with query types that are boolean as number 1 or 0', () => {
            const data = {
                id: 2,
                active: 1, 
            } as any
            let result = formatPrice(data)
            assert.deepStrictEqual(result, {
                where: {
                    id: 2,
                    active: true, 
                }
            })
            data['active'] = 0
            result = formatPrice(data)
            assert.deepStrictEqual(result, {
                where: {
                    id: 2,
                    active: false, 
                }
            })
        })

        it('query fields with query types that are boolean as number in string "1" or "0"', () => {
            const data = {
                id: 2,
                active: '1', 
            } as any
            let result = formatPrice(data)
            assert.deepStrictEqual(result, {
                where: {
                    id: 2,
                    active: true, 
                }
            })
            data['active'] = '0'
            result = formatPrice(data)
            assert.deepStrictEqual(result, {
                where: {
                    id: 2,
                    active: false, 
                }
            })
        })
        
        it('query fields with query types that are empty string - should be ignored', () => {
            const data = {
                id: 2,
                active: '', 
            }
            const formated = formatPrice(data)
            assert.deepStrictEqual(formated, {
                where: {
                    id: 2, 
                }
            })
        })
        
        it('query fields with query types that have null value', () => {
            const data = {
                id: 2,
                active: null, 
            } as any
            const formated = formatPrice(data)
            assert.deepStrictEqual(formated, {
                where: {
                    id: 2,
                    active: null
                }
            })
        })

        it('query fields with query types that should be rejected', () => {
            // rejects numbers
            let data = {
                id: 2,
                active: 2
            } as any
            assert.throws(() => formatShop(data), {
                name: /Error/,
                message: /Value type for active is not valid/
            })
            // rejects undefined
            data = {
                id: 2,
                active: undefined
            } 
            assert.throws(() => formatShop(data), {
                name: /Error/,
                message: /Value type for active is not valid/
            })
            // reject magic strings
            data = {
                id: 2,
                active: 'null'
            } 
            assert.throws(() => formatShop(data), {
                name: /Error/,
                message: /Value type for active is not valid/
            })
        })
    })


})
