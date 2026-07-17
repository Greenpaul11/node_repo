import { strict as assert } from 'node:assert'
import { it, describe, before } from "node:test";
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
})
