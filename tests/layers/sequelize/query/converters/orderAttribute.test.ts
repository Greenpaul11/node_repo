import { strict as assert } from 'node:assert'
import { it, describe, before } from "node:test";
import { productMetadata, priceMetadata } from '../../../../testSkeleton/metadata.js'
import { QueryConverter } from '../../../../../src/layers/sequelize/query/converter.js'
import { createRelationTree } from '../../../../../src/tree/treeBuilders.js'
import { fn, col, literal } from 'sequelize';
import type { Query, QueryConverterConfig } from '../../../../../src/types/entity/Query.ts';
import type { Product, Price } from '../../../../testSkeleton/entities.ts';
import type { DialectOptions } from '../../../../../src/types/Registry.ts';

const dialect = process.env.DIALECT as DialectOptions

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
describe(`Detected "${dialect}" dialect`, () => {
    
    if (dialect === 'postgres') {
    
        describe('test convertQuery with order attribute', () => {

            describe('test ordering without validation', () => {

                let formatProduct: (query: Query<Product>) => any
                let formatPrice: (query: Query<Price>) => any

                before(() => {
                    const productRelationTree = createRelationTree(productMetadata)
                    const priceRelationTree = createRelationTree(priceMetadata)

                    const productFormater = new QueryConverter(productMetadata, productRelationTree, dialect, validationOff)
                    const priceFormater = new QueryConverter(priceMetadata, priceRelationTree, dialect, validationOff)

                    formatProduct = (query: Query<Product>) => productFormater.convertQuery(query)
                    formatPrice = (query: Query<Price>) => priceFormater.convertQuery(query)
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
                        order: [literal('image ASC NULLS FIRST')]
                    })
                })
                
                it('nulls last ordering (desc)', () => {
                    const data: Query<Product> = { order: 'by image desc nulls last' }
                    const result = formatProduct(data)
                    assert.deepStrictEqual(result, {
                        order: [literal('image DESC NULLS LAST')]
                    })
                })

                it('nulls last ordering (asc) pushes two items', () => {
                    const data: Query<Product> = { order: 'by image asc nulls last' }
                    const result = formatProduct(data)
                    assert.deepStrictEqual(result, {
                        order: [literal('image ASC NULLS LAST')]
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

                    const productFormater = new QueryConverter(productMetadata, productRelationTree, dialect, validationOn)
                    const priceFormater = new QueryConverter(priceMetadata, priceRelationTree, dialect, validationOn)

                    formatProduct = (query: Query<Product>) => productFormater.convertQuery(query)
                    formatPrice = (query: Query<Price>) => priceFormater.convertQuery(query)
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
                        order: [literal('image ASC NULLS FIRST')]
                    })
                })

                it('valid nulls last option passes validation', () => {
                    const data: Query<Product> = { order: 'by image asc nulls last' }
                    const result = formatProduct(data)
                    assert.deepStrictEqual(result, {
                        order: [literal('image ASC NULLS LAST')]
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
    
    } else {
        // works for mysql, mariadb, sqlite
        describe('test convertQuery with order attribute', () => {

            describe('test ordering without validation', () => {

                let formatProduct: (query: Query<Product>) => any
                let formatPrice: (query: Query<Price>) => any

                before(() => {
                    const productRelationTree = createRelationTree(productMetadata)
                    const priceRelationTree = createRelationTree(priceMetadata)

                    const productFormater = new QueryConverter(productMetadata, productRelationTree, dialect, validationOff)
                    const priceFormater = new QueryConverter(priceMetadata, priceRelationTree, dialect, validationOff)

                    formatProduct = (query: Query<Product>) => productFormater.convertQuery(query)
                    formatPrice = (query: Query<Price>) => priceFormater.convertQuery(query)
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

                    const productFormater = new QueryConverter(productMetadata, productRelationTree, dialect, validationOn)
                    const priceFormater = new QueryConverter(priceMetadata, priceRelationTree, dialect, validationOn)

                    formatProduct = (query: Query<Product>) => productFormater.convertQuery(query)
                    formatPrice = (query: Query<Price>) => priceFormater.convertQuery(query)
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
    }
})