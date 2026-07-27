import { strict as assert } from 'node:assert'
import { it, describe, before } from "node:test";
import { Op } from 'sequelize'
import { productMetadata, priceMetadata } from '../../../../testSkeleton/config'
import { QueryFormater } from '../../../../../src/layers/sequelize/query/formater'
import { createRelationTree } from '../../../../../src/tree/treeBuilders'
import { Query, QueryConverterConfig } from '../../../../../src/types/entity/Query';
import { Product, Price } from '../../../../testSkeleton/entities';


const validationOff: QueryConverterConfig = {
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
            select: false
        }
    },
    subEntityRelationDepth: 5
}

const validationOn: QueryConverterConfig = {
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
    },
    subEntityRelationDepth: 5
}


describe('test formatQuery with relationAttribute', () => {

    describe('test formatting relations without validation', () => {

        let formatProduct: (query: Query<Product>) => any
        let formatPrice: (query: Query<Price>) => any

        before(() => {
            const productRelationTree = createRelationTree(productMetadata)
            const priceRelationTree = createRelationTree(priceMetadata)

            const productFormater = new QueryFormater(productMetadata, productRelationTree, validationOff)
            const priceFormater = new QueryFormater(priceMetadata, priceRelationTree, validationOff)

            formatProduct = (query: Query<Product>) => productFormater.formatQuery(query)
            formatPrice = (query: Query<Price>) => priceFormater.formatQuery(query)
        })

        describe('single-level relations (depth 1)', () => {

            it('relation with base attributes', () => {
                const data: Query<Product> = { prices: { active: true } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [{ association: 'prices', where: { active: true } }]
                })
            })

            it('relation with multiple base attributes', () => {
                const data: Query<Product> = { prices: { active: true, url: 'http://shop.test/phone' } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [{
                        association: 'prices',
                        where: { active: true, url: 'http://shop.test/phone' }
                    }]
                })
            })

            it('relation with range attributes', () => {
                const data: Query<Product> = { prices: { price_from: 100, price_to: 500 } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [{
                        association: 'prices',
                        where: { price: { [Op.gte]: 100, [Op.lt]: 500 } }
                    }]
                })
            })

            it('relation with select attributes', () => {
                const data: Query<Product> = { prices: { select: ['price', 'url'] } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [{
                        association: 'prices',
                        attributes: ['price', 'url']
                    }]
                })
            })

            it('relation with select exclude throws in nested context', () => {
                const data: Query<Product> = { prices: { select: { exclude: ['url'] } } }
                assert.throws(() => formatProduct(data), {
                    name: /Error/,
                    message: /Value for select attribute is not valid/
                })
            })

            it('empty relation object', () => {
                const data: Query<Product> = { prices: {} }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [{ association: 'prices' }]
                })
            })

            it('relation combined with root base attributes', () => {
                const data: Query<Product> = { brand: 'Apple', prices: { active: true } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    where: { brand: 'Apple' },
                    include: [{ association: 'prices', where: { active: true } }]
                })
            })

            it('relation combined with root range attributes', () => {
                const data: Query<Product> = { id_from: 10, prices: { price_from: 100 } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    where: { id: { [Op.gte]: 10 } },
                    include: [{ association: 'prices', where: { price: { [Op.gte]: 100 } } }]
                })
            })

            it('relation combined with root select', () => {
                const data: Query<Product> = { select: ['brand', 'model'], prices: { select: ['price', 'url'] } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    attributes: ['brand', 'model'],
                    include: [{
                        association: 'prices',
                        attributes: ['price', 'url']
                    }]
                })
            })

            it('multiple relations at same level', () => {
                const data: Query<Product> = { prices: { active: true }, comments: { active: true } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [
                        { association: 'prices', where: { active: true } },
                        { association: 'comments', where: { active: true } }
                    ]
                })
            })

            it('relation with combined base and range attributes', () => {
                const data: Query<Product> = { prices: { active: true, price_from: 100, price_to: 500 } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [{
                        association: 'prices',
                        where: {
                            active: true,
                            price: { [Op.gte]: 100, [Op.lt]: 500 }
                        }
                    }]
                })
            })
        })

        describe('nested relations (depth 2)', () => {

            it('depth 2: product -> prices -> shop with base attributes', () => {
                const data: Query<Product> = { prices: { shop: { name: 'ElectroWorld' } } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [{
                        association: 'prices',
                        include: [{ association: 'shop', where: { name: 'ElectroWorld' } }]
                    }]
                })
            })

            it('depth 2: product -> prices -> shop with range attributes', () => {
                const data: Query<Product> = { prices: { shop: { founded_from: new Date('2020-01-01T00:00:00Z') } } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [{
                        association: 'prices',
                        include: [{
                            association: 'shop',
                            where: { founded: { [Op.gte]: new Date('2020-01-01T00:00:00Z') } }
                        }]
                    }]
                })
            })

            it('depth 2: product -> prices -> shop with select', () => {
                const data: Query<Product> = { prices: { shop: { select: ['name'] } } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [{
                        association: 'prices',
                        include: [{
                            association: 'shop',
                            attributes: ['name']
                        }]
                    }]
                })
            })

            it('depth 2: product -> product_importer with base attributes', () => {
                const data: Query<Product> = { product_importer: { name: 'TestImporter' } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [{
                        association: 'product_importer',
                        where: { name: 'TestImporter' }
                    }]
                })
            })
        })

        describe('nested relations (depth 3)', () => {

            it('depth 3: product -> comments -> user -> rates with base attributes', () => {
                const data: Query<Product> = { comments: { user: { rates: { active: true } } } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [{
                        association: 'comments',
                        include: [{
                            association: 'user',
                            include: [{
                                association: 'rates',
                                where: { active: true }
                            }]
                        }]
                    }]
                })
            })

            it('depth 3: product -> comments -> user -> rates with range attributes', () => {
                const data: Query<Product> = { comments: { user: { rates: { rate_from: 3 } } } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [{
                        association: 'comments',
                        include: [{
                            association: 'user',
                            include: [{
                                association: 'rates',
                                where: { rate: { [Op.gte]: 3 } }
                            }]
                        }]
                    }]
                })
            })

            it('depth 3: product -> prices -> shop -> prices with base attributes', () => {
                const data: Query<Product> = { prices: { shop: { prices: { active: true } } } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [{
                        association: 'prices',
                        include: [{
                            association: 'shop',
                            include: [{
                                association: 'prices',
                                where: { active: true }
                            }]
                        }]
                    }]
                })
            })
        })

        describe('nested relations (depth 4)', () => {

            it('depth 4: product -> comments -> user -> rates -> comment with base attributes', () => {
                const data: Query<Product> = { comments: { user: { rates: { comment: { active: true } } } } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [{
                        association: 'comments',
                        include: [{
                            association: 'user',
                            include: [{
                                association: 'rates',
                                include: [{
                                    association: 'comment',
                                    where: { active: true }
                                }]
                            }]
                        }]
                    }]
                })
            })
        })

        describe('nested relations (depth 5)', () => {

            it('depth 5: product -> comments -> user -> rates -> comment -> user with base attributes', () => {
                const data: Query<Product> = { comments: { user: { rates: { comment: { user: { name: 'test' } } } } } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [{
                        association: 'comments',
                        include: [{
                            association: 'user',
                            include: [{
                                association: 'rates',
                                include: [{
                                    association: 'comment',
                                    include: [{
                                        association: 'user',
                                        where: { name: 'test' }
                                    }]
                                }]
                            }]
                        }]
                    }]
                })
            })
        })
    })

    describe('test formatting relations with validation', () => {

        let formatProduct: (query: Query<Product>) => any
        let formatPrice: (query: Query<Price>) => any

        before(() => {
            const productRelationTree = createRelationTree(productMetadata)
            const priceRelationTree = createRelationTree(priceMetadata)

            const productFormater = new QueryFormater(productMetadata, productRelationTree, validationOn)
            const priceFormater = new QueryFormater(priceMetadata, priceRelationTree, validationOn)

            formatProduct = (query: Query<Product>) => productFormater.formatQuery(query)
            formatPrice = (query: Query<Price>) => priceFormater.formatQuery(query)
        })

        describe('valid attribute types in relations', () => {

            it('relation with valid base attributes passes validation', () => {
                const data: Query<Product> = { prices: { url: 'http://test.com', active: true } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [{
                        association: 'prices',
                        where: { url: 'http://test.com', active: true }
                    }]
                })
            })

            it('relation with valid range attributes passes validation', () => {
                const data: Query<Product> = { prices: { price_from: '100', price_to: '500' } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [{
                        association: 'prices',
                        where: { price: { [Op.gte]: 100, [Op.lt]: 500 } }
                    }]
                })
            })

            it('relation with valid select passes validation', () => {
                const data: Query<Product> = { prices: { select: ['price', 'url'] } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [{
                        association: 'prices',
                        attributes: ['price', 'url']
                    }]
                })
            })

            it('relation with empty string base attribute is ignored', () => {
                const data: Query<Product> = { prices: { url: 'http://test.com', active: '' } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [{
                        association: 'prices',
                        where: { url: 'http://test.com' }
                    }]
                })
            })

            it('relation with null base attribute passes validation', () => {
                const data: Query<Product> = { prices: { url: null } as any }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [{
                        association: 'prices',
                        where: { url: null }
                    }]
                })
            })
        })

        describe('invalid attribute types in relations', () => {

            it('relation with invalid string type throws', () => {
                const data = { prices: { url: 123 } }
                assert.throws(() => formatProduct(data as any), {
                    name: /Error/,
                    message: /Value type for url is not valid/
                })
            })

            it('relation with invalid number type throws', () => {
                const data = { prices: { price: 'abc' } }
                assert.throws(() => formatProduct(data as any), {
                    name: /Error/,
                    message: /Value type for price is not valid/
                })
            })

            it('relation with invalid range type throws', () => {
                const data = { prices: { price_from: 'abc' } }
                assert.throws(() => formatProduct(data as any), {
                    name: /Error/,
                    message: /Value type for price_from is not valid/
                })
            })

            it('relation with invalid boolean type throws', () => {
                const data = { prices: { active: 2 } }
                assert.throws(() => formatProduct(data as any), {
                    name: /Error/,
                    message: /Value type for active is not valid/
                })
            })

            it('relation with undefined base attribute throws', () => {
                const data = { prices: { url: undefined } }
                assert.throws(() => formatProduct(data as any), {
                    name: /Error/,
                    message: /Value type for url is not valid/
                })
            })
        })

        describe('nested relations with validation', () => {

            it('nested relation with valid attributes passes validation', () => {
                const data = { prices: { shop: { name: 'TestShop' } } }
                const result = formatProduct(data)
                assert.deepStrictEqual(result, {
                    include: [{
                        association: 'prices',
                        include: [{ association: 'shop', where: { name: 'TestShop' } }]
                    }]
                })
            })

            it('nested relation with invalid deep attribute throws', () => {
                const data = { prices: { shop: { name: 123 } } }
                assert.throws(() => formatProduct(data as any), {
                    name: /Error/,
                    message: /Value type for name is not valid/
                })
            })

            it('deeply nested relation with invalid attribute at depth 2 throws', () => {
                const data = {
                    comments: {
                        user: {
                            rates: { rate: 'invalid' }
                        }
                    }
                }
                assert.throws(() => formatProduct(data as any), {
                    name: /Error/,
                    message: /Value type for rate is not valid/
                })
            })
        })
    })

    describe('error handling', () => {

        let formatProduct: (query: Query<Product>) => any

        before(() => {
            const productRelationTree = createRelationTree(productMetadata)

            const productFormater = new QueryFormater(productMetadata, productRelationTree, validationOff)

            formatProduct = (query: Query<Product>) => productFormater.formatQuery(query)
        })

        describe('invalid relation value types', () => {

            it('null value throws', () => {
                const data = { prices: null }
                assert.throws(() => formatProduct(data as any), {
                    name: /Error/,
                    message: /Value for attribute 'prices' is not valid/
                })
            })

            it('string value throws', () => {
                const data = { prices: 'invalid' }
                assert.throws(() => formatProduct(data as any), {
                    name: /Error/,
                    message: /Value for attribute 'prices' is not valid/
                })
            })

            it('number value throws', () => {
                const data = { prices: 123 }
                assert.throws(() => formatProduct(data as any), {
                    name: /Error/,
                    message: /Value for attribute 'prices' is not valid/
                })
            })

            it('boolean value throws', () => {
                const data = { prices: true }
                assert.throws(() => formatProduct(data as any), {
                    name: /Error/,
                    message: /Value for attribute 'prices' is not valid/
                })
            })
        })

        describe('depth limit behavior', () => {
            it('relations beyond depth 5 throws error', () => {
                const data: Query<Product> = {
                    comments: {
                        user: {
                            rates: {
                                comment: {
                                    user: {
                                        rates: { active: true }
                                    }
                                }
                            }
                        }
                    }
                }
                assert.throws(() => formatProduct(data), {
                    name: /Error/,
                    message: /depth limit exceeded/
                })
            })
        })
    })
})