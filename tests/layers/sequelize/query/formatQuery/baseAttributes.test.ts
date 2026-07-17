import { strict as assert } from 'node:assert'
import { it, describe, before } from "node:test";
import { productMetadata, priceMetadata, shopMetadata } from '../../../../testSkeleton/config'
import { QueryFormater } from '../../../../../src/layers/sequelize/query/formater'
import { createRelationTree } from '../../../../../src/tree/treeBuilders'
import { Query, QueryFormaterBaseConfig } from '../../../../../src/types/entity/Query';
import { Product, Price, Shop } from '../../../../testSkeleton/entities';

const configWithoutValidation: QueryFormaterBaseConfig = {
    validation: {
        baseAttributes: {
            string: false,
            number: false,
            date: false,
            boolean: false
        },
        rangeAttributes: {
            number: false,
            date: false
        },
        queryAttributes: {
            select: true
        }
    }
}

const configWithValidation: QueryFormaterBaseConfig = {
    validation: {
        baseAttributes: {
            string: true,
            number: true,
            date: true,
            boolean: true
        },
        rangeAttributes: {
            number: true,
            date: true
        },
        queryAttributes: {
            select: true
        }
    }
}

describe('test formatQuery with baseAttributes', async () => {

    describe('test formating fields without validators', () => {

        let formatProduct: (query: Query<Product>) => any
        let formatPrice: (query: Query<Price>) => any

        before(() => {
            const productRelationTree = createRelationTree(productMetadata)
            const priceRelationTree = createRelationTree(priceMetadata)

            const productFormater = new QueryFormater(productMetadata, productRelationTree, configWithoutValidation)
            const priceFormater = new QueryFormater(priceMetadata, priceRelationTree, configWithoutValidation)

            formatProduct = (query: Query<Product>) => productFormater.formatQuery(query)
            formatPrice = (query: Query<Price>) => priceFormater.formatQuery(query)
        })

        describe('test formating fields assigned to stringAttributesList', () => {

            it('accept valid string value', () => {
                const data = { brand: 'brand' }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, { where: { brand: 'brand' } })
            })
            
            it('accept number value', () => {
                const data = { brand: 123 }
                const result = formatProduct(data as any)
                assert.deepStrictEqual(result, { where: { brand: 123 } })
            })

            it('accept boolean value', () => {
                const data = { brand: false }
                const result = formatProduct(data as any)
                assert.deepStrictEqual(result, { where: { brand: false } })
            })

            it('accept null value', () => {
                const data = { brand: null }
                const result = formatProduct(data as any)
                assert.deepStrictEqual(result, { where: { brand: null } })
            })

            it('accept empty string', () => {
                const data = { brand: '' }
                const result = formatProduct(data as any)
                assert.deepStrictEqual(result, { where: { brand: '' } })
            })
        })

        describe('test formating fields assigned to numberAttributesList', () => {

            it('accept valid number value', () => {
               const data = { id: 1 }
               const result = formatPrice(data)
               assert.deepStrictEqual(result, { where: { id: 1 } })
            })
            
            it('accept string value', () => {
                const data = { id: 'abc' }
                const result = formatPrice(data as any)
                assert.deepStrictEqual(result, { where: { id: 'abc' } })
            })

            it('accept boolean value', () => {
                const data = { id: true }
                const result = formatPrice(data as any)
                assert.deepStrictEqual(result, { where: { id: true } })
            })

            it('accept null value', () => {
                const data = { id: null }
                const result = formatPrice(data as any)
                assert.deepStrictEqual(result, { where: { id: null } })
            })

            it('accept empty string', () => {
                const data = { id: '' }
                const result = formatPrice(data as any)
                assert.deepStrictEqual(result, { where: { id: '' } })
            })
        })

        describe('test formating fields assigned to dateAttributesList', () => {
            
            it('accept valid date value', () => {
                const data = { created: new Date('2023-01-01T11:20:00Z') }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, { where: { created: new Date('2023-01-01T11:20:00Z') } })
            })
            
            it('accept number value', () => {
                const data = { created: 12345 }
                const result = formatProduct(data as any)
                assert.deepStrictEqual(result, { where: { created: 12345 } })
            })

            it('accept invalid date string', () => {
                const data = { created: 'not-a-date' }
                const result = formatProduct(data as any)
                assert.deepStrictEqual(result, { where: { created: 'not-a-date' } })
            })

            it('accept null value', () => {
                const data = { created: null }
                const result = formatProduct(data as any)
                assert.deepStrictEqual(result, { where: { created: null } })
            })

            it('accept empty string', () => {
                const data = { created: '' }
                const result = formatProduct(data as any)
                assert.deepStrictEqual(result, { where: { created: '' } })
            })
        })

        describe('test formating fields assigned to booleanAttributesList', () => {

            it('accept valid boolean value', () => {
                const data = { active: true }
                const result = formatPrice(data)
                assert.deepStrictEqual(result, { where: { active: true } })
            })
            
            it('accept number value', () => {
                const data = { active: 2 }
                const result = formatPrice(data as any)
                assert.deepStrictEqual(result, { where: { active: 2 } })
            })

            it('accept string value', () => {
                const data = { active: 'yes' }
                const result = formatPrice(data as any)
                assert.deepStrictEqual(result, { where: { active: 'yes' } })
            })

            it('accept null value', () => {
                const data = { active: null }
                const result = formatPrice(data as any)
                assert.deepStrictEqual(result, { where: { active: null } })
            })

            it('accept empty string', () => {
                const data = { active: '' }
                const result = formatPrice(data as any)
                assert.deepStrictEqual(result, { where: { active: '' } })
            })
        })
    })

    describe('test formating fields with validators', () => {

        let formatProduct: (query: Query<Product>) => any
        let formatPrice: (query: Query<Price>) => any
        let formatShop: (query: Query<Shop>) => any

        before(() => {
            const productRelationTree = createRelationTree(productMetadata)
            const priceRelationTree = createRelationTree(priceMetadata)
            const shopRelationTree = createRelationTree(shopMetadata)

            const productFormater = new QueryFormater(productMetadata, productRelationTree, configWithValidation)
            const priceFormater = new QueryFormater(priceMetadata, priceRelationTree, configWithValidation)
            const shopFormater = new QueryFormater(shopMetadata, shopRelationTree, configWithValidation)

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
                        brand: 'Apple'
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
})
