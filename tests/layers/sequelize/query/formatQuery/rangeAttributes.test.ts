import { strict as assert } from 'node:assert'
import { it, describe, before } from "node:test";
import { Op } from 'sequelize'
import { productMetadata, priceMetadata } from '../../../../testSkeleton/config'
import { QueryFormater } from '../../../../../src/layers/sequelize/query/formater'
import { createRelationTree } from '../../../../../src/tree/treeBuilders'
import { Query, QueryFormaterBaseConfig } from '../../../../../src/types/entity/Query';
import { Product, Price } from '../../../../testSkeleton/entities';

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
        }
    }
}

describe('test formatQueryRangeAttributes', async () => {

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

        describe('test formating date range attributes', () => {
            
            it('accept valid date as range', () => {
                const data = { created_from: new Date('2023-01-01T11:20:00Z') }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    where: { created: { [Op.gte]: new Date('2023-01-01T11:20:00Z') } }
                })
            })

            it('accept number value as range', () => {
                const data = { created_from: 12345 }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    where: { created: { [Op.gte]: 12345 } }
                })
            })

            it('accept invalid date string as range', () => {
                const data = { created_to: 'bad-date' }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    where: { created: { [Op.lt]: 'bad-date' } }
                })
            })

            it('accept null value as range', () => {
                const data = { created_from: null }
                const result = formatProduct(data as any)
                assert.deepStrictEqual(result, {
                    where: { created: { [Op.gte]: null } }
                })
            })

            it('accept empty string as range', () => {
                const data = { created_from: '' }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    where: { created: { [Op.gte]: '' } }
                })
            })

            it('accept boolean value as range', () => {
                const data = { created_from: true }
                const result = formatProduct(data as any)
                assert.deepStrictEqual(result, {
                    where: { created: { [Op.gte]: true } }
                })
            })
        })

        describe('test formating number range attributes', () => {

            it('accept valid number value as range', () => {
                const data = { price_from: 444 }
                const result = formatPrice(data)
                assert.deepStrictEqual(result, {
                    where: { price: { [Op.gte]: 444 } }
                })
            })
            
            it('accept string value as range', () => {
                const data = { price_from: 'abc' }
                const result = formatPrice(data)
                assert.deepStrictEqual(result, {
                    where: { price: { [Op.gte]: 'abc' } }
                })
            })

            it('accept boolean value as range', () => {
                const data = { price_from: true }
                const result = formatPrice(data as any)
                assert.deepStrictEqual(result, {
                    where: { price: { [Op.gte]: true } }
                })
            })

            it('accept null value as range', () => {
                const data = { price_from: null }
                const result = formatPrice(data as any)
                assert.deepStrictEqual(result, {
                    where: { price: { [Op.gte]: null } }
                })
            })

            it('accept empty string as range', () => {
                const data = { price_from: '' }
                const result = formatPrice(data)
                assert.deepStrictEqual(result, {
                    where: { price: { [Op.gte]: '' } }
                })
            })
        })
    })

    describe('test formating fields with validators', () => {

        let formatProduct: (query: Query<Product>) => any
        let formatPrice: (query: Query<Price>) => any

        before(() => {
            const productRelationTree = createRelationTree(productMetadata)
            const priceRelationTree = createRelationTree(priceMetadata)

            const productFormater = new QueryFormater(productMetadata, productRelationTree, configWithValidation)
            const priceFormater = new QueryFormater(priceMetadata, priceRelationTree, configWithValidation)

            formatProduct = (query: Query<Product>) => productFormater.formatQuery(query)
            formatPrice = (query: Query<Price>) => priceFormater.formatQuery(query)
        })

        it('query fields with valid range query types 1', () => {
            const data = {
                created_from: new Date('2023-01-01T11:20:00Z')
            }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                where: {created: {[Op.gte]: new Date('2023-01-01T11:20:00Z')}}
            })
        })

        it('query fields with valid range query types 2', () => {
            const data = {
                created_to: new Date('2023-06-10T15:00:00Z')
            }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                where: {created: {[Op.lt]: new Date('2023-06-10T15:00:00Z')}}
            })
        })

        it('query fields with valid range query types 3', () => {
            const data = {
                created_from: new Date('2024-03-01T10:00:00Z')
            }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                where: {created: {[Op.gte]: new Date('2024-03-01T10:00:00Z')}}
            })
        })

        it('query fields with valid range query types 4', () => {
            const data = {
                created_to: new Date('2021-03-01T10:00:00Z')
            }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                where: {created: {[Op.lt]: new Date('2021-03-01T10:00:00Z')}}
            })
        })

        it('query fields with valid range query types 5', () => {
            const data = {
                created_from: new Date('2024-02-01T12:00:00Z'),
                created_to: new Date('2025-02-01T12:00:00Z')
            }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                where: {
                    created: {
                        [Op.gte]: new Date('2024-02-01T12:00:00Z'),
                        [Op.lt]: new Date('2025-02-01T12:00:00Z')
                    }
                }
            })
        })

        it('query fields with valid range query types 6', () => {
            const data = {
                created_from: new Date('2021-02-01T12:00:00Z'),
                created_to: new Date('2025-02-01T12:00:00Z'),
                updated_from: new Date('2024-02-14T09:30:00Z'),
                updated_to: new Date('2024-02-16T09:30:00Z')
            }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                where: {
                    created: {
                        [Op.gte]: new Date('2021-02-01T12:00:00Z'),
                        [Op.lt]: new Date('2025-02-01T12:00:00Z'),
                    }, 
                    updated: {
                        [Op.gte]: new Date('2024-02-14T09:30:00Z'),
                        [Op.lt]: new Date('2024-02-16T09:30:00Z'),
                    }
                }
            })
        })

        it('query fields with valid range query types 7', () => {
            const data = {
                price_from: 2000.11,
                price_to: 3300.00
            }
            const result = formatPrice(data)
            assert.deepStrictEqual(result, {
                where: {
                    price: {
                        [Op.gte]: 2000.11,
                        [Op.lt]: 3300.00
                    }
                }
            })
        })

        it('query fields with valid range query types 8', () => {
            const dataPrice = {
                active: true,
                price_from: 2000.11,
                price_to: 3300.00
            }
            const priceResult = formatPrice(dataPrice)
            assert.deepStrictEqual(priceResult, {
                where: {
                    active: true,
                    price: {
                        [Op.gte]: 2000.11,
                        [Op.lt]: 3300.00
                    }
                }
            })
        })

        it('query fields with valid range query types 9', () => {
            const data = {
                id_from: 3
            }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                where: {
                    id: {
                        [Op.gte]: 3
                    }
                }
            })
        })

        it('query fields with valid range query types 10', () => {
            const dataPrice = {
                active: true,
                price_from: 3300.00
            }
            const priceResult = formatPrice(dataPrice)
            assert.deepStrictEqual(priceResult, {
                where: {
                    active: true,
                    price: {
                        [Op.gte]: 3300.00
                    }
                }
            })
        })

        it('query fields with range query as type string', () => {

            const data = {id_to: '2'} 
            const productResult = formatProduct(data)
            assert.deepStrictEqual(productResult, {
                where: {id: {[Op.lt]: 2}}
            })

            const dataPrice = {
                active: 'true',
                price_from: '3300.00'
            }
            const priceResult = formatPrice(dataPrice)
            assert.deepStrictEqual(priceResult, {
                where: {
                    active: true,
                    price: {
                        [Op.gte]: 3300.00
                    }
                }
            })
        })

        it('query fields with range query types that have empty string', () => {
            const data = {
                brand: 'Dell',
                id_from: ''
            }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                where: {brand: 'Dell'}
            })

            const dataPrice = {
                active: false,
                price_from: '',
                price_to: '',
                updated_from: '',
                updated_to: '',
                created_to: '2023-06-10T15:00:00Z'
            }
            const priceResult = formatPrice(dataPrice)
            assert.deepStrictEqual(priceResult, {
                where: {
                    active: false,
                    created: {
                        [Op.lt]: new Date('2023-06-10T15:00:00Z')
                    }
                }
            })
        })

        it('query fields with range query types that should be rejected', () => {
            let data = {
                price_from: null,
                price_to: 3300.00
            } as any
            assert.throws(() => formatPrice(data), {
                name: /Error/,
                message: /Value type for price_from is not valid/
            })

            data = {
                id_from: undefined,
                price_from: 9999,
                price_to: 3300.00
            } as any
            assert.throws(() => formatPrice(data), {
                name: /Error/,
                message: /Value type for id_from is not valid/
            })

            data = {
                id_from: 'test',
                price_from: 9999,
                price_to: 3300.00
            } as any
            assert.throws(() => formatPrice(data), {
                name: /Error/,
                message: /Value type for id_from is not valid/
            })

            data = {
                id_from: null,
                price_from: 9999,
                price_to: 3300.00
            } as any
            assert.throws(() => formatPrice(data), {
                name: /Error/,
                message: /Value type for id_from is not valid/
            })
        })
    })
})
