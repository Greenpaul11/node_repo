import { strict as assert } from 'node:assert'
import { it, describe, before } from "node:test";
import { productMetadata, priceMetadata } from '../../../../testSkeleton/config'
import { QueryFormater } from '../../../../../src/layers/sequelize/query/formater'
import { createRelationTree } from '../../../../../src/tree/treeBuilders'
import { Query, QueryFormaterBaseConfig } from '../../../../../src/types/entity/Query';
import { Product, Price } from '../../../../testSkeleton/entities';
import { fn, col } from 'sequelize';

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
            select: false
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

describe('test formatQuery with selectAttribute', async () => {

    describe('test formating select without validators', () => {

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

        it('select as array of valid field names', () => {
            const data: Query<Product> = { select: ['brand', 'model', 'active'] } 
            const result = formatProduct(data)
            assert.deepStrictEqual(result, { attributes: ['brand', 'model', 'active'] })
        })

        it('select with single field', () => {
            const data: Query<Product> = { select: ['brand'] }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, { attributes: ['brand'] })
        })

        it('select with empty array', () => {
            const data: Query<Product> = { select: [] }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, { attributes: [] })
        })

        it('select combined with base attributes', () => {
            const data: Query<Product> = { select: ['brand'], brand: 'Apple', active: true }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                attributes: ['brand'],
                where: { brand: 'Apple', active: true }
            })
        })

        it('select as exclude object', () => {
            const data: Query<Product> = { select: { exclude: ['brand', 'image'] } }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, { attributes: { exclude: ['brand', 'image'] } })
        })

        it('select as exclude with empty array', () => {
            const data: Query<Product> = { select: { exclude: [] } }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, { attributes: { exclude: [] } })
        })

        it('select as null throws', () => {
            const data = { select: null }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /Value for select attribute is not valid/
            })
        })

        it('select as non-array/non-object throws', () => {
            let data = { select: 'brand' } as any
            assert.throws(() => formatProduct(data), {
                name: /Error/,
                message: /Value for select attribute is not valid/
            })

            data = { select: 123 }
            assert.throws(() => formatProduct(data), {
                name: /Error/,
                message: /Value for select attribute is not valid/
            })

            data = { select: true }
            assert.throws(() => formatProduct(data), {
                name: /Error/,
                message: /Value for select attribute is not valid/
            })
        })

        it('select with non-string items throws', () => {
            const data = { select: [1, 2] }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /Item of select has no valid type/
            })
        })

        it('select with object without exclude throws', () => {
            const data = { select: { include: ['brand'] } }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /Value for select attribute is not valid/
            })
        })

        it('select as empty string throws', () => {
            const data = { select: '' }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /Value for select attribute is not valid/
            })
        })
    })

    describe('test formating select with validators', () => {

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

        it('valid field names pass validation', () => {
            const data: Query<Product> = { select: ['brand', 'model'] }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, { attributes: ['brand', 'model'] })
        })

        it('empty array passes validation', () => {
            const data: Query<Product> = { select: [] }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, { attributes: [] })
        })

        it('valid exclude object passes validation', () => {
            const data: Query<Product> = { select: { exclude: ['brand'] } }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, { attributes: { exclude: ['brand'] } })
        })

        it('non-entity attribute in array throws', () => {
            const data = { select: ['nonexistent'] }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /not a part of baseAttributes/
            })
        })

        it('non-entity attribute in exclude throws', () => {
            const data = { select: { exclude: ['nonexistent'] } }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /not a part of baseAttributes/
            })
        })

        it('external reference attribute throws', () => {
            const data = { select: ['prices'] }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /not a part of baseAttributes/
            })
        })
    })

    describe('aggregate functions without validation', () => {

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

        it('$count with wildcard', () => {
            const data: Query<Product> = { select: [['$count', '*']] }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                attributes: [[fn('COUNT', col('*')), '$count_*']]
            })
        })

        it('$count with base attribute', () => {
            const data: Query<Product> = { select: [['$count', 'brand']] }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                attributes: [[fn('COUNT', col('brand')), '$count_brand']]
            })
        })

        it('$sum with number attribute', () => {
            const data: Query<Price> = { select: [['$sum', 'id']] }
            const result = formatPrice(data)
            assert.deepStrictEqual(result, {
                attributes: [[fn('SUM', col('id')), '$sum_id']]
            })
        })

        it('$avg with number attribute', () => {
            const data: Query<Price> = { select: [['$avg', 'id']] }
            const result = formatPrice(data)
            assert.deepStrictEqual(result, {
                attributes: [[fn('AVG', col('id')), '$avg_id']]
            })
        })

        it('$min with number attribute', () => {
            const data: Query<Price> = { select: [['$min', 'id']] }
            const result = formatPrice(data)
            assert.deepStrictEqual(result, {
                attributes: [[fn('MIN', col('id')), '$min_id']]
            })
        })

        it('$max with number attribute', () => {
            const data: Query<Price> = { select: [['$max', 'id']] }
            const result = formatPrice(data)
            assert.deepStrictEqual(result, {
                attributes: [[fn('MAX', col('id')), '$max_id']]
            })
        })

        it('mixed select with attributes and aggregate functions', () => {
            const data: Query<Product> = {
                select: ['brand', ['$count', '*'], ['$count', 'model']]
            }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                attributes: [
                    'brand',
                    [fn('COUNT', col('*')), '$count_*'],
                    [fn('COUNT', col('model')), '$count_model']
                ]
            })
        })

        it('aggregate with deep entity reference', () => {
            const data: Query<Product> = {
                select: [['$count', ['prices', 'id']]]
            }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                attributes: [[fn('COUNT', col('prices.id')), '$count_prices_id']]
            })
        })

        it('aggregate with deep nested relation (2 levels)', () => {
            const data = {
                select: [['$count', ['prices', ['shop', 'id']]]] as Query<Product>['select']
            }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                attributes: [[fn('COUNT', col('prices.shop.id')), '$count_prices_shop_id']]
            })
        })

        it('aggregate with deep nested relation (3 levels)', () => {
            const data = {
                select: [['$count', ['comments', ['user', ['rates', 'id']]]]] as Query<Product>['select']
            }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                attributes: [[fn('COUNT', col('comments.user.rates.id')), '$count_comments_user_rates_id']]
            })
        })

        it('invalid aggregate operator throws', () => {
            const data = { select: [['$invalid', '*']] }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /Invalid aggregate function operator/
            })
        })

        it('non-existent external reference in deep aggregate throws', () => {
            const data = { select: [['$count', ['nonexistent', 'id']]] }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /does not exist/
            })
        })
    })

    describe('aggregate functions with validation', () => {

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

        it('$count with wildcard passes validation', () => {
            const data: Query<Product> = { select: [['$count', '*']] }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                attributes: [[fn('COUNT', col('*')), '$count_*']]
            })
        })

        it('$count with valid attribute passes validation', () => {
            const data = {
                select: [['$count', 'brand']] as Query<Product>['select']
            }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                attributes: [[fn('COUNT', col('brand')), '$count_brand']]
            })
        })

        it('deep nested relation aggregate passes validation', () => {
            const data = {
                select: [['$count', ['prices', ['shop', 'id']]]] as Query<Product>['select']
            }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                attributes: [[fn('COUNT', col('prices.shop.id')), '$count_prices_shop_id']]
            })
        })

        it('deep nested relation aggregate (3 levels) passes validation', () => {
            const data = {
                select: [['$count', ['comments', ['user', ['rates', 'id']]]]] as Query<Product>['select']
            }
            const result = formatProduct(data)
            assert.deepStrictEqual(result, {
                attributes: [[fn('COUNT', col('comments.user.rates.id')), '$count_comments_user_rates_id']]
            })
        })

        it('$count with non-entity attribute inside aggregate throws', () => {
            const data = { select: [['$count', 'nonexistent']] }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /not found on entity/
            })
        })

        it('$sum with non-entity attribute inside aggregate throws', () => {
            const data = { select: [['$sum', 'nonexistent']] }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /not found on entity/
            })
        })

        it('$count with external reference as direct aggregate target throws', () => {
            const data = { select: [['$count', 'prices']] }
            assert.throws(() => formatProduct(data as any), {
                name: /Error/,
                message: /not found on entity/
            })
        })
    })
})
