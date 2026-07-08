import { strict as assert } from 'node:assert'
import { it, describe } from "node:test";
import { Price, Product } from '../../../testSkeleton/entities'
import { productMetadata } from '../../../testSkeleton/config';
import { EntityRelationTree } from '../../../../src/types/entity/Metadata';
import { Query } from '../../../../src/types/entity/Query';
import { SequelizeRawEntity, SequelizeRawEntityNotGrouped } from '../../../../src/layers/sequelize/types';
import { createRelationTree } from '../../../../src/tree/treeBuilders';
import { OutputFormater } from '../../../../src/layers/sequelize/output/formater';
import { rowIsUniqueOrNotMerged } from '../../../../src/layers/sequelize/output/mergeRowsIntoEntities';
import { ProductCategory } from '../../../testSkeleton/models';


describe('rowIsUniqueOrNotMerged: Determines if row with its nested entities should be merged or kept separate', () => {

    const metadata = productMetadata
    const tree: EntityRelationTree<Product> = createRelationTree(metadata)
    const formater = new OutputFormater(metadata, tree, 'mysql')
    const mapSelects = formater.mapSelects.bind(formater)

    let query: Query<Product> = {
        select: ['id'],
        prices: {
            select: ['id', 'price']
        }
    }
    let row = {
        id: 2
    } as SequelizeRawEntityNotGrouped<Product>
    let accumulator = {
        id: 2,
        prices: []
    } as unknown as SequelizeRawEntity<Product>
    let accumulatorAfter: SequelizeRawEntity<Product> 
    const copyRow = <T>(r: T): T => JSON.parse(JSON.stringify(r))

    describe('base entity with null related entities', () => {
        it ('null related entity - accumulator unchanged', () => {
            row['prices'] = null 
            const mappedSelects = mapSelects(query)
            const result = rowIsUniqueOrNotMerged(mappedSelects, tree, row, accumulator)
            
            assert.deepStrictEqual(result, false)
            assert.ok(accumulator.prices)
            assert.ok(accumulator.prices.length === 0)
        })
    })

    describe('base entity with unique related entity', () => {
        it ('unique related entity - should merge into accumulator', () => {
            row['prices'] = {id: 2, price: '2222'} as SequelizeRawEntityNotGrouped<Price>
            const mappedSelects = mapSelects(query)
            const result = rowIsUniqueOrNotMerged(mappedSelects, tree, row, accumulator)
            
            assert.deepStrictEqual(result, false)
            assert.ok(accumulator.prices)
            assert.ok(accumulator.prices.length === 1)
            assert.deepStrictEqual(row['prices'], accumulator.prices[0])
        })

        it ('duplicate (same id) related entity - should not duplicate', () => {
            row['prices'] = {id: 2, price: '2222'} as SequelizeRawEntityNotGrouped<Price>
            const mappedSelects = mapSelects(query)
            const result = rowIsUniqueOrNotMerged(mappedSelects, tree, row, accumulator)
            
            assert.deepStrictEqual(result, false)
            assert.ok(accumulator.prices)
            assert.ok(accumulator.prices.length === 1)
            assert.deepStrictEqual(row['prices'], accumulator.prices[0])
        })
    })

    describe('unique base entity', () => {
        it ('different base entity id - should be treated as unique row', () => {
           row['id'] = 3
           const mappedSelects = mapSelects(query)
           const result = rowIsUniqueOrNotMerged(mappedSelects, tree, row, accumulator)
           
           assert.deepStrictEqual(result, true)
           assert.ok(accumulator.prices)
           assert.ok(accumulator.prices.length === 1)
           assert.deepStrictEqual(row['prices'], accumulator.prices[0])
        })
    })

    describe('complex row with multiple nested relations', () => {
        it ('setup complex test data', () => {
            accumulator = {
                id: 2,
                brand: 'Samsung',
                prices: [], 
                comments: [],
                product_categories: [],
                specification_tree: {
                    specification_type: 'smartphone'
                }
            } as unknown as SequelizeRawEntity<Product>
            
            row = {
                id: 2,
                brand: 'Samsung',
                prices: {
                    price: '3333', 
                    shop: { 
                        name: 'TestShop' 
                    }
                }, 
                comments: {
                    id: 2, 
                    content: 'This is test!'
                },
                product_categories: {
                    is_primary: 1, 
                    category: { 
                        name: 'Android Phones',
                        parent: {
                            name: 'Electornic'
                        }
                    }
                },
                specification_tree: {
                    specification_type: 'smartphone'
                }
            } as SequelizeRawEntityNotGrouped<Product>
            
            query = {
                select: ['id', 'brand', 'brand', 'model'],
                prices: {
                    select: ['price'],
                    shop: {
                        select: ['name']
                    }
                }, 
                comments: {
                    select: ['id', 'content']
                }, 
                product_categories: {
                    select: ['is_primary'],
                    category: {
                        select: ['name'],
                        parent: {
                            select: ['name']
                        }
                    }
                },
                specification_tree: {
                    select: ['specification_type']
                }
            }
            
            accumulatorAfter = {
                id: 2,
                brand: 'Samsung',
                prices: [{
                    price: '3333', 
                    shop: { 
                        name: 'TestShop' 
                    }
                }], 
                comments: [{
                    id: 2, 
                    content: 'This is test!'
                }],
                product_categories: [{
                    is_primary: 1, 
                    category: { 
                        name: 'Android Phones',
                        parent: {
                            name: 'Electornic'
                        }
                    }
                }],
                specification_tree: {
                    specification_type: 'smartphone'
                }
            } as SequelizeRawEntity<Product> 
        })

        it ('null nested relations - should merge without adding duplicates', () => {
            const rowWithNulls = {
                id: 2,
                brand: 'Samsung',
                prices: null, 
                comments: null,
                product_categories: null,
                specification_tree: {
                    specification_type: 'smartphone'
                }
            } as SequelizeRawEntityNotGrouped<Product> 
            const mappedSelects = mapSelects(query)
            const result = rowIsUniqueOrNotMerged(mappedSelects, tree, rowWithNulls, accumulator)
            assert.deepStrictEqual(result, false)
            assert.deepStrictEqual(accumulator, accumulator)
        })

        it ('same row with different singular relation - should be unique', () => {
            const rowWithNulls = {
                id: 2,
                brand: 'Samsung',
                prices: null, 
                comments: null,
                product_categories: null,
                specification_tree: {
                    specification_type: 'laptop'
                }
            } as SequelizeRawEntityNotGrouped<Product> 
            const mappedSelects = mapSelects(query)
            const result = rowIsUniqueOrNotMerged(mappedSelects, tree, rowWithNulls, accumulator)
            assert.deepStrictEqual(result, true)
            assert.deepStrictEqual(accumulator, accumulator)
        })
    })

    describe('row with unique nested relations', () => {
        it ('non-unique base with unique nested relations - should merge all unique relations', () => {
            const mappedSelects = mapSelects(query)
            const result = rowIsUniqueOrNotMerged(mappedSelects, tree, row, accumulator)
            assert.deepStrictEqual(result, false)
            assert.deepStrictEqual(accumulator, accumulatorAfter)
        })

        it ('unique nested shop in prices - should add new price', () => {
            row = copyRow(row)
            row['prices']!['shop']!['name'] = 'This is unique shop'
            accumulatorAfter['prices']?.push({
                price: '3333', 
                shop: { 
                    name: 'This is unique shop' 
                }
            } as SequelizeRawEntity<Price>)
            const mappedSelects = mapSelects(query)
            const result = rowIsUniqueOrNotMerged(mappedSelects, tree, row, accumulator)
            assert.deepStrictEqual(result, false)
            assert.deepStrictEqual(accumulator, accumulatorAfter)
        })

        it ('unique nested relation with null - should merge correctly', () => {
            row = copyRow(row)
            row['prices']!['shop'] = null 
            row['product_categories'] = {
                is_primary: 1, 
                category: { 
                    name: 'Android Phones',
                    parent: null 
                }
            } as any
            accumulatorAfter['prices']?.push({
                price: '3333', 
                shop: null as any
            } as SequelizeRawEntity<Price>)
            accumulatorAfter['product_categories']?.push({
                is_primary: 1, 
                category: { 
                    name: 'Android Phones',
                    parent: null as any
                }
            } as SequelizeRawEntity<ProductCategory>)
            const mappedSelects = mapSelects(query)
            const result = rowIsUniqueOrNotMerged(mappedSelects, tree, row, accumulator)
            assert.deepStrictEqual(result, false)
            assert.deepStrictEqual(accumulator, accumulatorAfter)
        })
    })

    describe('unique base entity with nested relations', () => {
        it ('different base id makes row unique regardless of nested relations', () => {
            row = copyRow(row)
            row['id'] = 3
            const mappedSelects = mapSelects(query)
            const result = rowIsUniqueOrNotMerged(mappedSelects, tree, row, accumulator)
            assert.deepStrictEqual(result, true)
            assert.deepStrictEqual(accumulator, accumulatorAfter)
        })
    })

})