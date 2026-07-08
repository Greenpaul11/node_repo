import { strict as assert } from 'node:assert'
import { it, describe } from "node:test";
import { Product } from '../../../testSkeleton/entities'
import { productMetadata } from '../../../testSkeleton/config';
import { EntityRelationTree } from '../../../../src/types/entity/Metadata';
import { MapEntitySelect, Query } from '../../../../src/types/entity/Query';
import { SequelizeRawEntityNotGrouped, SequelizeRawEntity } from '../../../../src/layers/sequelize/types';
import { entityRowIsUnique } from '../../../../src/layers/sequelize/output/mergeRowsIntoEntities';
import { createRelationTree } from '../../../../src/tree/treeBuilders';
import { OutputFormater } from '../../../../src/layers/sequelize/output/formater';

describe('entityRowIsUnique: Checks if row is unique at root entity level', () => {
    const metadata = productMetadata
    const tree: EntityRelationTree<Product> = createRelationTree(metadata)
    const formater = new OutputFormater(metadata, tree, 'mysql')
    const mapSelects = formater.mapSelects.bind(formater)

    let query: Query<Product>
    let select: MapEntitySelect<Product>['select']
    let accumulator: SequelizeRawEntity<Product> | SequelizeRawEntity<Product>[]
    let notGrouped: SequelizeRawEntityNotGrouped<Product>
    
    it ('accumulator and notGrouped have identical base attributes - row is not unique', () => {
        query = {}
        select = mapSelects(query)['select']
        accumulator = {
            id: 2,
            type: 'smartphone',
            brand: 'Samsung',
            model: 'Galaxy S23',
            image: null,
            description: null,
            variant: '128GB',
            variant_second: null,
            active: 0,
            created: new Date('2024-03-01T10:00:00Z'),
            updated: new Date('2024-03-01T10:00:00Z')
        } as SequelizeRawEntity<Product>
        
        notGrouped = {
            id: 2,
            type: 'smartphone',
            brand: 'Samsung',
            model: 'Galaxy S23',
            image: null,
            description: null,
            variant: '128GB',
            variant_second: null,
            active: 0,
            created: new Date('2024-03-01T10:00:00Z'),
            updated: new Date('2024-03-01T10:00:00Z')
        } as SequelizeRawEntityNotGrouped<Product>
        const result = entityRowIsUnique(select, notGrouped, accumulator)
        assert.deepStrictEqual(result, false)
    })
    it ('accumulator and notGrouped have different base attributes - row is unique', () => {
        query = {}
        select = mapSelects(query)['select']
        accumulator = {
            id: 3,
            type: 'smartphone',
            brand: 'Samsung',
            model: 'Galaxy S23',
            image: null,
            description: null,
            variant: '128GB',
            variant_second: null,
            active: 0,
            created: new Date('2024-03-01T10:00:00Z'),
            updated: new Date('2024-03-01T10:00:00Z')
        } as SequelizeRawEntity<Product>
        
        notGrouped = {
            id: 2,
            type: 'smartphone',
            brand: 'Samsung',
            model: 'Galaxy S23',
            image: null,
            description: null,
            variant: '128GB',
            variant_second: null,
            active: 0,
            created: new Date('2024-03-01T10:00:00Z'),
            updated: new Date('2024-03-01T10:00:00Z')
        } as SequelizeRawEntityNotGrouped<Product>
        const result = entityRowIsUnique(select, notGrouped, accumulator)
        assert.deepStrictEqual(result, true)
    })
    
    it ('partial select with same values - row is not unique', () => {
        query = {select: ['type', 'brand', 'model', 'image', 'description']}
        select = mapSelects(query)['select']
        accumulator = {
            type: 'smartphone',
            brand: 'Samsung',
            model: 'Galaxy S23',
            image: null,
            description: null
        } as SequelizeRawEntity<Product>
        
        notGrouped = {
            type: 'smartphone',
            brand: 'Samsung',
            model: 'Galaxy S23',
            image: null,
            description: null
        } as SequelizeRawEntityNotGrouped<Product>
        const result = entityRowIsUnique(select, notGrouped, accumulator)
        assert.deepStrictEqual(result, false)
    })
    it ('partial select with different values - row is unique', () => {
        query = {select: ['type', 'brand', 'model', 'image', 'description']}
        select = mapSelects(query)['select']
        accumulator = {
            type: 'smartphone',
            brand: 'Samsung',
            model: 'Galaxy S23',
            image: null,
            description: null
        } as SequelizeRawEntity<Product>
        
        notGrouped = {
            type: 'smartphone',
            brand: 'Samsung',
            model: 'Galaxy S23',
            image: null,
            description: 'i\'m unique'
        } as SequelizeRawEntityNotGrouped<Product>
        const result = entityRowIsUnique(select, notGrouped, accumulator)
        assert.deepStrictEqual(result, true)
    })
    it ('related entity differences ignored when comparing base attributes - row is not unique', () => {
        query = {select: ['type', 'brand', 'model', 'image', 'description']}
        select = mapSelects(query)['select']
        accumulator = {
            type: 'smartphone',
            brand: 'Samsung',
            model: 'Galaxy S23',
            image: null,
            description: null,
            prices: [{id: 33, price: '3333'}]
        } as SequelizeRawEntity<Product>
        
        notGrouped = {
            type: 'smartphone',
            brand: 'Samsung',
            model: 'Galaxy S23',
            image: null,
            description: null,
            prices: {id: 44, price: '4444'}
        } as SequelizeRawEntityNotGrouped<Product>
        const result = entityRowIsUnique(select, notGrouped, accumulator)
        assert.deepStrictEqual(result, false)
    })
    
    it ('base attribute difference makes row unique even with related entity differences', () => {
        query = {select: ['type', 'brand', 'model', 'image', 'description']}
        select = mapSelects(query)['select']
        accumulator = {
            type: 'smartphone',
            brand: 'Samsung',
            model: 'Galaxy S23',
            image: null,
            description: null,
            prices: [{id: 33, price: '3333'}]
        } as SequelizeRawEntity<Product>
        
        notGrouped = {
            type: 'smartphone',
            brand: 'Samsung',
            model: 'Galaxy S23',
            image: null,
            description: 'i\'m unique',
            prices: {id: 44, price: '4444'}
        } as SequelizeRawEntityNotGrouped<Product>
        const result = entityRowIsUnique(select, notGrouped, accumulator)
        assert.deepStrictEqual(result, true)
    })
})