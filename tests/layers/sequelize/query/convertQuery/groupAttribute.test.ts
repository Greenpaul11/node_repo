import { strict as assert } from 'node:assert'
import { it, describe, before } from "node:test";
import { productMetadata, priceMetadata } from '../../../../testSkeleton/config'
import { QueryFormater } from '../../../../../src/layers/sequelize/query/formater'
import { createRelationTree } from '../../../../../src/tree/treeBuilders'
import { Query, QueryConverterConfig } from '../../../../../src/types/entity/Query';
import { Product, Price } from '../../../../testSkeleton/entities';
import { fn, col } from 'sequelize';

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
            select: false,
            order: false,
            group: false
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
            select: true,
            order: true,
            group: true
        }
    },
    subEntityRelationDepth: 5
}

describe('test formatQuery with group attribute', async () => {

    describe('test grouping without validation', () => {

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

        // ============================== 1. Basic grouping ==============================

        it('group by field', () => {
            // group by brand
            const data: Query<Product> = {
                group: 'by brand',
                select: ['brand']
            }
            const result = formatProduct(data)
            assert.deepStrictEqual(result.group, ['brand'])
            assert.deepStrictEqual(result.attributes, ['brand'])
        })

        it('group by fields', () => {
            // group by brand and active
            const data: Query<Product> = {
                group: ['by brand', 'by active'],
                select: ['brand', 'active']
            }
            const result = formatProduct(data)
            assert.deepStrictEqual(result.group, ['brand', 'active'])
            assert.deepStrictEqual(result.attributes, ['brand', 'active'])
        })

        // ============================== 2. Relating grouping ==============================

        it('group by related field', () => {
            // group by price id and shop.id(pk must be included)
            const data: Query<Price> = {
                shop: { select: ['id'] },
                group: ['by id', ['shop', ['by id']]],
                select: ['id']
            }
            const result = formatPrice(data)
            assert.deepStrictEqual(result.group, ['id', 'shop.id'])
            assert.deepStrictEqual(result.attributes, ['id'])
            assert.deepStrictEqual(result.include[0].attributes, ['id'])
        })
        
        it('group by related fields', () => {
            // group by price and shop.name(pk must be included)
            const data: Query<Price> = {
                shop: { select: ['id', 'name'] },
                group: ['by id', 'by price', ['shop', ['by id', 'by name']]],
                select: ['id', 'price']
            }
            const result = formatPrice(data)
            assert.deepStrictEqual(result.group, ['id', 'price', 'shop.id', 'shop.name'])
            assert.deepStrictEqual(result.attributes, ['id', 'price'])
            assert.deepStrictEqual(result.include[0].attributes, ['id', 'name'])
        })

        it('group by fields of deeper entities in relation tree', () => {
            // group by brand, model and shop.name(pk must be included)
            const data: Query<Product> = {
                prices: {
                    shop: { select: ['id', 'name'] },
                    select: ['id']
                },
                group: ['by id', 'by brand', 'by model', ['prices', ['by id', ['shop', ['by id', 'by name']]]]],
                select: ['id', 'brand', 'model']
            }
            const result = formatProduct(data)
            assert.deepStrictEqual(result.group, ['id', 'brand', 'model', 'prices.id', 'prices.shop.id', 'prices.shop.name'])
            assert.deepStrictEqual(result.attributes, ['id', 'brand', 'model'])
            assert.deepStrictEqual(result.include[0].attributes, ['id'])
            assert.deepStrictEqual(result.include[0].include[0].attributes, ['id', 'name'])
        })

        // ============================== 3. Grouping with aggregate operators ==============================

        it('group by field with aggregate operator in select', () => {
            // group by brand count
            const data: Query<Product> = {
                group: 'by brand',
                select: ['brand', ['$count', 'brand']]
            }
            const result = formatProduct(data)
            assert.deepStrictEqual(result.group, ['brand'])
            assert.deepStrictEqual(result.attributes, ['brand', [fn('COUNT', col('brand')), '$count_brand']])
        })

        it('group by fields with aggregate operator in select', () => {
            // group by brand count and active
            const data: Query<Product> = {
                group: ['by brand', 'by active'],
                select: ['brand', 'active', ['$count', 'brand']]
            }
            const result = formatProduct(data)
            assert.deepStrictEqual(result.group, ['brand', 'active'])
            assert.deepStrictEqual(result.attributes, ['brand', 'active', [fn('COUNT', col('brand')), '$count_brand']])
        })

        it('group by related field - primary key of root entity must be present', () => {
            // group by prices.shop_id
            const data: Query<Product> = {
                prices: { select: ['shop_id'] },
                group: ['by id',['prices', [['shop', ['by id']]]]],
                select: ['id', ['$count', ['prices', ['shop', 'id']]]]
            }
            const result = formatProduct(data)
            assert.deepStrictEqual(result.group, ['id', 'prices.shop.id'])
            assert.deepStrictEqual(result.attributes, ['id', [fn('COUNT', col('prices.shop.id')), '$count_prices_shop_id']])
        })

        it('array with non-existent option throws', () => {
            const data = { group: ['by brand', 'by nonexistent'] }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /has no "by nonexistent"/
            })
        })

        it('nested relation with non-existent option throws', () => {
            const data = { group: ['by brand', ['prices', ['by nonexistent']]] } as any
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /has no "by nonexistent"/
            })
        })

        it('group as null throws error', () => {
            const data = { group: null }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /Typeof for sort option is not valid/
            })
        })

        it('group as number throws error', () => {
            const data = { group: 123 }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /Typeof for sort option is not valid/
            })
        })
    })

    describe('test grouping with validation', () => {

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

        it('valid single option passes validation', () => {
            const data: Query<Product> = { group: 'by brand' }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                group: ['brand']
            })
        })

        it('array of valid options passes validation', () => {
            const data: Query<Product> = { group: ['by brand', 'by model'] }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                group: ['brand', 'model']
            })
        })

        it('non-existent option throws', () => {
            const data = { group: 'by nonexistent' }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /has no "by nonexistent"/
            })
        })

        it('array with non-existent option throws', () => {
            const data = { group: ['by brand', 'by nonexistent'] }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /has no "by nonexistent"/
            })
        })

        it('nested relation with valid options passes validation', () => {
            const data: Query<Product> = { group: ['by brand', ['prices', ['by price']]] }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                group: ['brand', 'prices.price']
            })
        })

        it('nested relation with non-existent option throws', () => {
            const data = { group: ['by brand', ['prices', ['by nonexistent']]] } as any
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /has no "by nonexistent"/
            })
        })

        it('nested relation with invalid relation name throws', () => {
            const data = { group: ['by brand', ['nonexistent', ['by price']]] } as any
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /Related order options are undefined/
            })
        })

        it('null value throws with validation on', () => {
            const data = { group: null }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /Value type for order attribute is not valid/
            })
        })

        it('numeric value throws with validation on', () => {
            const data = { group: 123 }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /Value type for order attribute is not valid/
            })
        })
    })
})
