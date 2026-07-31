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
    subEntityRelationDepth: 0
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
    subEntityRelationDepth: 0
}

describe('test formatQuery with order attribute', async () => {

    describe('test ordering without validation', () => {

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

        it('single ascending option', () => {
            const data: Query<Product> = { order: 'by brand asc' }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [[col('brand'), 'ASC']]
            })
        })

        it('single descending option', () => {
            const data: Query<Product> = { order: 'by brand desc' }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [[col('brand'), 'DESC']]
            })
        })

        it('multiple order options as array', () => {
            const data: Query<Product> = { order: ['by brand asc', 'by model desc'] }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [[col('brand'), 'ASC'], [col('model'), 'DESC']]
            })
        })

        it('nulls first ordering', () => {
            const data: Query<Product> = { order: 'by image asc nulls first' }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [[col('image'), 'ASC']]
            })
        })

        it('nulls last ordering (desc)', () => {
            const data: Query<Product> = { order: 'by image desc nulls last' }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [[col('image'), 'DESC']]
            })
        })

        it('nulls last ordering (asc) pushes two items', () => {
            const data: Query<Product> = { order: 'by image asc nulls last' }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [[fn('ISNULL', col('image')), 'ASC'], [col('image'), 'ASC']]
            })
        })

        it('aggregate function option', () => {
            const data: Query<Product> = { order: 'by $count_id asc' } 
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [[fn('COUNT', col('id')), 'ASC']]
            })
        })

        it('sum aggregate option', () => {
            const data: Query<Product> = { order: 'by $sum_id asc' } 
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [[fn('SUM', col('id')), 'ASC']]
            })
        })

        it('order combined with base attributes', () => {
            const data: Query<Product> = { order: 'by brand asc', brand: 'Apple' }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [[col('brand'), 'ASC']],
                where: { brand: 'Apple' }
            })
        })

        it('order combined with select', () => {
            const data: Query<Product> = { order: 'by brand asc', select: ['brand', 'model'] }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [[col('brand'), 'ASC']],
                attributes: ['brand', 'model']
            })
        })

        it('empty array', () => {
            const data: Query<Product> = { order: [] }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, { order: [] })
        })

        it('nested relation sort', () => {
            const data: Query<Product> = { order: ['by brand asc', ['prices', ['by price asc']]] } 
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [[col('brand'), 'ASC'], [col('prices.price'), 'ASC']]
            })
        })

        it('nested relation sort with desc', () => {
            const data: Query<Product> = { order: ['by brand asc', ['prices', ['by url desc']]] }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [[col('brand'), 'ASC'], [col('prices.url'), 'DESC']]
            })
        })

        it('deep nested relation sort with desc', () => {
            const data: Query<Product> = { order: ['by brand asc', ['prices', [['shop', ['by name asc']]]]] }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [[col('brand'), 'ASC'], [col('prices.shop.name'), 'ASC']]
            })
        })

        it('multiple nested relations', () => {
            const data: Query<Product> = {
                order: [
                    'by brand asc',
                    ['prices', ['by price asc']],
                    ['comments', ['by created desc']]
                ]
            } 
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [
                    [col('brand'), 'ASC'],
                    [col('prices.price'), 'ASC'],
                    [col('comments.created'), 'DESC']
                ]
            })
        })

        it('array with non-existent option throws', () => {
            const data = { order: ['by brand asc', 'by nonexistent desc'] }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /has no "by nonexistent desc"/
            })
        })

        it('nested relation with non-existent option throws', () => {
            const data = { order: ['by brand asc', ['prices', ['by nonexistent asc']]] } as any
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /has no "by nonexistent asc"/
            })
        })

        it('order as null throws error', () => {
            const data = { order: null }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /Typeof for sort option is not valid/
            })
        })

        it('order as number throws error', () => {
            const data = { order: 123 }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /Typeof for sort option is not valid/
            })
        })
    })
    
    describe('test ordering with validation', () => {

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

        it('valid ascending option passes validation', () => {
            const data: Query<Product> = { order: 'by brand asc' }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [[col('brand'), 'ASC']]
            })
        })

        it('valid descending option passes validation', () => {
            const data: Query<Product> = { order: 'by brand desc' }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [[col('brand'), 'DESC']]
            })
        })

        it('valid nulls first option passes validation', () => {
            const data: Query<Product> = { order: 'by image asc nulls first' }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [[col('image'), 'ASC']]
            })
        })

        it('valid nulls last option passes validation', () => {
            const data: Query<Product> = { order: 'by image asc nulls last' }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [[fn('ISNULL', col('image')), 'ASC'], [col('image'), 'ASC']]
            })
        })

        it('valid aggregate option passes validation', () => {
            const data: Query<Product> = { order: 'by $count_id asc' } 
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [[fn('COUNT', col('id')), 'ASC']]
            })
        })

        it('valid sum aggregate option passes validation', () => {
            const data: Query<Product> = { order: 'by $sum_id asc' } 
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [[fn('SUM', col('id')), 'ASC']]
            })
        })

        it('array of valid options passes validation', () => {
            const data: Query<Product> = { order: ['by brand asc', 'by model desc'] }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [[col('brand'), 'ASC'], [col('model'), 'DESC']]
            })
        })

        it('non-existent option throws', () => {
            const data = { order: 'by nonexistent asc' }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /has no "by nonexistent asc"/
            })
        })

        it('array with non-existent option throws', () => {
            const data = { order: ['by brand asc', 'by nonexistent desc'] }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /has no "by nonexistent desc"/
            })
        })

        it('nested relation with valid options passes validation', () => {
            const data: Query<Product> = { order: ['by brand asc', ['prices', ['by price asc']]] } 
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                order: [[col('brand'), 'ASC'], [col('prices.price'), 'ASC']]
            })
        })

        it('nested relation with non-existent option throws', () => {
            const data = { order: ['by brand asc', ['prices', ['by nonexistent asc']]] } as any
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /has no "by nonexistent asc"/
            })
        })

        it('nested relation with invalid relation name throws', () => {
            const data = { order: ['by brand asc', ['nonexistent', ['by price asc']]] } as any
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /Related order options are undefined/
            })
        })

        it('null value throws with validation on', () => {
            const data = { order: null }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /Value type for order attribute is not valid/
            })
        })

        it('numeric value throws with validation on', () => {
            const data = { order: 123 }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /Value type for order attribute is not valid/
            })
        })
    })
})
