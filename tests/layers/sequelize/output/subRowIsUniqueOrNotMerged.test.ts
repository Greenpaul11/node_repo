import { strict as assert } from 'node:assert'
import { it, describe } from "node:test";
import { Price, Product, Shop } from '../../../testSkeleton/entities'
import { productMetadata } from '../../../testSkeleton/config';
import { EntityRelationTree } from '../../../../src/types/entity/Metadata';
import { Query } from '../../../../src/types/entity/Query';
import { SequelizeRawEntity, SequelizeRawEntityNotGrouped } from '../../../../src/layers/sequelize/types';
import { createRelationTree } from '../../../../src/tree/treeBuilders';
import { OutputFormater } from '../../../../src/layers/sequelize/output/formater';
import { subRowIsUniqueOrNotMerged } from '../../../../src/layers/sequelize/output/mergeRowsIntoEntities';


describe('subRowIsUniqueOrNotMerged: Determines if subrow (nested entity) should be merged or marked as unique', () => {

    const metadata = productMetadata
    const tree: EntityRelationTree<Product> = createRelationTree(metadata)
    const formater = new OutputFormater(metadata, tree, 'mysql')
    const mapSelects = formater.mapSelects.bind(formater)

    let query: Query<Product> 
    let notGrouped = {
        id: 2
    } as SequelizeRawEntityNotGrouped<Product>
    let accumulator = {
        id: 2,
        prices: []
    } as unknown as SequelizeRawEntity<Product>

    it ('null related entity value - row is treated as not unique (no action taken)', () => {
        notGrouped['prices'] = null 
        query = {prices: {}}
        const { subEntities } = mapSelects(query)
        assert(subEntities)
        const result = subRowIsUniqueOrNotMerged(subEntities, tree, notGrouped, accumulator)
        
        assert.deepStrictEqual(result, false)
        assert.ok(accumulator.prices)
        assert.ok(accumulator.prices[0] === undefined)
    })
    
    it ('unique related entity - should merge into accumulator', () => {
        notGrouped['prices'] = {
            id: 3,
            price: '3299.50',
            shop_id: 10,
            url: 'https://x-kom.pl',
            product_id: 2,
            active: 0,
            updated: new Date('2024-03-01T10:00:00Z'),
            created: new Date('2024-03-01T10:00:00Z')
        }

        query = {prices: {}}
        const { subEntities } = mapSelects(query)
        assert(subEntities)
        const result = subRowIsUniqueOrNotMerged(subEntities, tree, notGrouped, accumulator)
        assert.deepStrictEqual(result, false)
        assert.ok(accumulator.prices)
        assert.ok(accumulator.prices[0])
        assert.deepStrictEqual(accumulator.prices[0], notGrouped.prices)
    })

    it ('duplicate related entity - should not duplicate, only keep one', () => {
        notGrouped['prices'] = {
            id: 3,
            price: '3299.50',
            shop_id: 10,
            url: 'https://x-kom.pl',
            product_id: 2,
            active: 0,
            updated: new Date('2024-03-01T10:00:00Z'),
            created: new Date('2024-03-01T10:00:00Z')
        }
        
        query = {prices: {}}
        const { subEntities } = mapSelects(query)
        assert(subEntities)
        const result = subRowIsUniqueOrNotMerged(subEntities, tree, notGrouped, accumulator)
        assert.deepStrictEqual(result, false)
        assert.ok(accumulator.prices)
        assert.ok(accumulator.prices[0])
        assert.ok(accumulator.prices[1] === undefined)
        assert.deepStrictEqual(accumulator.prices[0], notGrouped.prices)
    })
 
    it ('different unique related entity - should merge', () => {
        notGrouped['prices'] = {
            id: 4,
            price: '3299.50',
            shop_id: 10,
            url: 'https://x-kom.pl',
            product_id: 2,
            active: 0,
            updated: new Date('2024-03-01T10:00:00Z'),
            created: new Date('2024-03-01T10:00:00Z')
        }
        
        query = {prices: {}}
        const { subEntities } = mapSelects(query)
        assert(subEntities)
        const result = subRowIsUniqueOrNotMerged(subEntities, tree, notGrouped, accumulator)
        assert.deepStrictEqual(result, false)
        assert.ok(accumulator.prices)
        assert.ok(accumulator.prices[1])
        assert.deepStrictEqual(accumulator.prices[1], notGrouped.prices)
    })

    it ('reset accumulator reference', () => {
        accumulator['prices'] = []
    })

    it ('related entity with nested reference - should merge', () => {
        notGrouped['prices'] = {
            price: '3299.50',
            shop_id: 10,
            url: 'https://x-kom.pl',
            product_id: 2,
            active: 0,
            updated: new Date('2024-03-01T10:00:00Z'),
            created: new Date('2024-03-01T10:00:00Z'),
            shop: {
                'id': 2,
                'active': 0
            }
        } as SequelizeRawEntityNotGrouped<Price>
        
        query = {prices: {select: { exclude: ['id']}, shop: {select: ['id', 'active']}}}
        const { subEntities } = mapSelects(query)
        assert(subEntities)
        const result = subRowIsUniqueOrNotMerged(subEntities, tree, notGrouped, accumulator)
        assert.deepStrictEqual(result, false)
        assert.ok(accumulator.prices)
        assert.ok(accumulator.prices[0]) 
        assert.deepStrictEqual(accumulator.prices[0], notGrouped.prices)
    })

    it ('related entity with null nested reference - should merge', () => {
        notGrouped['prices'] = {
            price: '3299.50',
            shop_id: 10,
            url: 'https://x-kom.pl',
            product_id: 2,
            active: 0,
            updated: new Date('2024-03-01T10:00:00Z'),
            created: new Date('2024-03-01T10:00:00Z'),
            shop: null 
        } as SequelizeRawEntityNotGrouped<Price>
        
        query = {prices: {select: { exclude: ['id']}, shop: {}}}
        const { subEntities } = mapSelects(query)
        assert(subEntities)
        const result = subRowIsUniqueOrNotMerged(subEntities, tree, notGrouped, accumulator)
        assert.deepStrictEqual(result, false)
        assert.ok(accumulator.prices)
        assert.ok(accumulator.prices[1]) 
        assert.deepStrictEqual(accumulator.prices[1], notGrouped.prices)
    })

    it ('duplicate related entity with null nested reference - should merge', () => {
        notGrouped['prices'] = {
            price: '3299.50',
            shop_id: 10,
            url: 'https://x-kom.pl',
            product_id: 2,
            active: 0,
            updated: new Date('2024-03-01T10:00:00Z'),
            created: new Date('2024-03-01T10:00:00Z'),
            shop: null 
        } as SequelizeRawEntityNotGrouped<Price>
        
        query = {prices: {shop: {}}, select: { exclude: ['id']}}
        const { subEntities } = mapSelects(query)
        assert(subEntities)
        const result = subRowIsUniqueOrNotMerged(subEntities, tree, notGrouped, accumulator)
        assert.deepStrictEqual(result, false)
        assert.ok(accumulator.prices)
        assert.ok(accumulator.prices[2] === undefined) 
    })
})