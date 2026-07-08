import { strict as assert } from 'node:assert'
import { it, describe } from "node:test";
import { Product } from '../../../testSkeleton/entities'
import { productMetadata } from '../../../testSkeleton/config';
import { EntityRelationTree } from '../../../../src/types/entity/Metadata';
import { createRelationTree } from '../../../../src/tree/treeBuilders';
import { Query } from '../../../../src/types/entity/Query';
import { SequelizeRawEntityNotGrouped, SequelizeRawEntity } from '../../../../src/layers/sequelize/types';
import { rowToGrouped } from '../../../../src/layers/sequelize/output/mergeRowsIntoEntities';
import { OutputFormater } from '../../../../src/layers/sequelize/output/formater';


describe('rowToGrouped: Converts flat row with related entities into grouped structure with arrays', () => {

    const metadata = productMetadata
    const tree: EntityRelationTree<Product> = createRelationTree(metadata)
    const formater = new OutputFormater(metadata, tree, 'mysql')
    const mapSelects = formater.mapSelects.bind(formater)

    describe('convert row without related entities', () => {
        let notGrouped: SequelizeRawEntityNotGrouped<Product>
        let query: Query<Product>

        it ('row with only base attributes - returns unchanged row', () => {
            notGrouped = {
                id: 2,
                importer_id: 2,
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
            } 
            query = {}

            const mappedSelects = mapSelects(query)
            const result = rowToGrouped(mappedSelects, tree, notGrouped)
            assert.deepStrictEqual(result, notGrouped)
        })
    })

    describe('convert row with single related entity', () => {
        let notGrouped: SequelizeRawEntityNotGrouped<Product>
        let grouped: SequelizeRawEntity<Product>
        let query: Query<Product>

        it ('row with many-to-one relation - converts to array', () => {
            notGrouped = {
                id: 2,
                importer_id: 2,
                type: 'smartphone',
                brand: 'Samsung',
                model: 'Galaxy S23',
                image: null,
                description: null,
                variant: '128GB',
                variant_second: null,
                active: 0,
                created: new Date('2024-03-01T10:00:00Z'),
                updated: new Date('2024-03-01T10:00:00Z'),
                prices: {
                    id: 2,
                    price: '5399.00',
                    shop_id: 20, 
                    url: 'https://mediaexpert.pl',
                    product_id: 1,
                    active: 1,
                    updated: new Date('2024-02-14T08:00:00Z'),
                    created: new Date('2024-01-05T10:00:00Z')
                }
            } 

            grouped = {
                id: 2,
                importer_id: 2,
                type: 'smartphone',
                brand: 'Samsung',
                model: 'Galaxy S23',
                image: null,
                description: null,
                variant: '128GB',
                variant_second: null,
                active: 0,
                created: new Date('2024-03-01T10:00:00Z'),
                updated: new Date('2024-03-01T10:00:00Z'),
                prices: [{
                    id: 2,
                    price: '5399.00',
                    shop_id: 20, 
                    url: 'https://mediaexpert.pl',
                    product_id: 1,
                    active: 1,
                    updated: new Date('2024-02-14T08:00:00Z'),
                    created: new Date('2024-01-05T10:00:00Z')
                }]
            }
            
            query = {prices: {}}
            const mappedSelects = mapSelects(query)
            const result = rowToGrouped(mappedSelects, tree, notGrouped)
            assert.deepStrictEqual(result, grouped)
        })
    })

    describe('convert row with nested related entity', () => {
        let notGrouped: SequelizeRawEntityNotGrouped<Product>
        let grouped: SequelizeRawEntity<Product>
        let query: Query<Product>

        it ('nested row shop in prices - preserves nested structure', () => {
            notGrouped = {
                id: 2,
                importer_id: 2,
                type: 'smartphone',
                brand: 'Samsung',
                model: 'Galaxy S23',
                image: null,
                description: null,
                variant: '128GB',
                variant_second: null,
                active: 0,
                created: new Date('2024-03-01T10:00:00Z'),
                updated: new Date('2024-03-01T10:00:00Z'),
                prices: {
                    id: 2,
                    price: '5399.00',
                    shop_id: 20, 
                    url: 'https://mediaexpert.pl',
                    product_id: 1,
                    active: 1,
                    updated: new Date('2024-02-14T08:00:00Z'),
                    created: new Date('2024-01-05T10:00:00Z'),
                    shop: {
                        id: 20,
                        name: 'Media Expert',
                        founded: new Date('2002-10-01T00:00:00Z'),
                        active: 0,
                        updated: new Date('2024-01-01T12:00:00Z'),
                        created: new Date('2020-01-01T12:00:00Z')
                    }
                }
            } 
            
            grouped = {
                id: 2,
                importer_id: 2,
                type: 'smartphone',
                brand: 'Samsung',
                model: 'Galaxy S23',
                image: null,
                description: null,
                variant: '128GB',
                variant_second: null,
                active: 0,
                created: new Date('2024-03-01T10:00:00Z'),
                updated: new Date('2024-03-01T10:00:00Z'),
                prices: [{
                    id: 2,
                    price: '5399.00',
                    shop_id: 20, 
                    url: 'https://mediaexpert.pl',
                    product_id: 1,
                    active: 1,
                    updated: new Date('2024-02-14T08:00:00Z'),
                    created: new Date('2024-01-05T10:00:00Z'),
                    shop: {
                        id: 20,
                        name: 'Media Expert',
                        founded: new Date('2002-10-01T00:00:00Z'),
                        active: 0,
                        updated: new Date('2024-01-01T12:00:00Z'),
                        created: new Date('2020-01-01T12:00:00Z')
                    }
                }]
            }
            
            query = {prices: {shop: {}}}
            const mappedSelects = mapSelects(query)
            const result = rowToGrouped(mappedSelects, tree, notGrouped)
            assert.deepStrictEqual(result, grouped)
        })
    })

    describe('convert row with all related entities', () => {
        let notGrouped: SequelizeRawEntityNotGrouped<Product>
        let grouped: SequelizeRawEntity<Product>
        let query: Query<Product>

        it ('row with prices, comments, product_categories - converts to arrays', () => {
            notGrouped = {
                id: 2,
                importer_id: 2,
                type: 'smartphone',
                brand: 'Samsung',
                model: 'Galaxy S23',
                image: null,
                description: null,
                variant: '128GB',
                variant_second: null,
                active: 0,
                created: new Date('2024-03-01T10:00:00Z'),
                updated: new Date('2024-03-01T10:00:00Z'),
                prices: {
                    id: 2,
                    price: '5399.00',
                    shop_id: 20, 
                    url: 'https://mediaexpert.pl',
                    product_id: 1,
                    active: 1,
                    updated: new Date('2024-02-14T08:00:00Z'),
                    created: new Date('2024-01-05T10:00:00Z'),
                    shop: {
                        id: 20,
                        name: 'Media Expert',
                        founded: new Date('2002-10-01T00:00:00Z'),
                        active: 0,
                        updated: new Date('2024-01-01T12:00:00Z'),
                        created: new Date('2020-01-01T12:00:00Z')
                    }
                }, 
                comments: {
                    id: 2,
                    product_id: 2,
                    user_id: 2,
                    content: 'Perfect for development work. Chip handles everything smoothly.',
                    active: 1,
                    created: new Date('2024-02-01T14:30:00Z'),
                    updated: new Date('2024-02-01T14:30:00Z')
                },
                product_categories: {
                    id: 5,
                    product_id: 2,
                    category_id: 16,
                    is_primary: 1,
                    active: 1,
                    created: new Date('2024-04-01T10:00:00Z'),
                    updated: new Date('2024-04-01T10:00:00Z'),
                    category: {
                        id: 16,
                        name: 'Android Phones',
                        slug: 'android-phones',
                        parent_id: 3,
                        active: 1,
                        created: new Date('2024-04-07T10:00:00Z'),
                        updated: new Date('2024-04-07T10:00:00Z'),
                        parent: {
                            id: 3,
                            name: 'Electornic',
                            slug: 'electornic',
                            parent_id: 3,
                            active: 1,
                            created: new Date('2024-01-07T10:00:00Z'),
                            updated: new Date('2024-01-07T10:00:00Z'),
                        }
                    }
                }, 
                specification_tree: {
                    id: 2,
                    product_id: 2,
                    specification_type: 'smartphone',
                    active: 1,
                    created: new Date('2024-03-01T10:00:00Z'),
                    updated: new Date('2024-03-01T10:00:00Z')
                }
            } 

            grouped = {
                id: 2,
                importer_id: 2,
                type: 'smartphone',
                brand: 'Samsung',
                model: 'Galaxy S23',
                image: null,
                description: null,
                variant: '128GB',
                variant_second: null,
                active: 0,
                created: new Date('2024-03-01T10:00:00Z'),
                updated: new Date('2024-03-01T10:00:00Z'),
                prices: [{
                    id: 2,
                    price: '5399.00',
                    shop_id: 20, 
                    url: 'https://mediaexpert.pl',
                    product_id: 1,
                    active: 1,
                    updated: new Date('2024-02-14T08:00:00Z'),
                    created: new Date('2024-01-05T10:00:00Z'),
                    shop: {
                        id: 20,
                        name: 'Media Expert',
                        founded: new Date('2002-10-01T00:00:00Z'),
                        active: 0,
                        updated: new Date('2024-01-01T12:00:00Z'),
                        created: new Date('2020-01-01T12:00:00Z')
                    }
                }], 
                comments: [{
                    id: 2,
                    product_id: 2,
                    user_id: 2,
                    content: 'Perfect for development work. Chip handles everything smoothly.',
                    active: 1,
                    created: new Date('2024-02-01T14:30:00Z'),
                    updated: new Date('2024-02-01T14:30:00Z')
                }],
                product_categories: [{
                    id: 5,
                    product_id: 2,
                    category_id: 16,
                    is_primary: 1,
                    active: 1,
                    created: new Date('2024-04-01T10:00:00Z'),
                    updated: new Date('2024-04-01T10:00:00Z'),
                    category: {
                        id: 16,
                        name: 'Android Phones',
                        slug: 'android-phones',
                        parent_id: 3,
                        active: 1,
                        created: new Date('2024-04-07T10:00:00Z'),
                        updated: new Date('2024-04-07T10:00:00Z'),
                        parent: {
                            id: 3,
                            name: 'Electornic',
                            slug: 'electornic',
                            parent_id: 3,
                            active: 1,
                            created: new Date('2024-01-07T10:00:00Z'),
                            updated: new Date('2024-01-07T10:00:00Z'),
                        }
                    }
                }],
                specification_tree: {
                    id: 2,
                    product_id: 2,
                    specification_type: 'smartphone',
                    active: 1,
                    created: new Date('2024-03-01T10:00:00Z'),
                    updated: new Date('2024-03-01T10:00:00Z')
                }
            } 

            query = {
                prices: {
                    shop: {}
                }, 
                comments: {}, 
                product_categories: {
                    category: {
                        parent: {}
                    }
                },
                specification_tree: {}
            }
            const mappedSelects = mapSelects(query)
            const result = rowToGrouped(mappedSelects, tree, notGrouped)
            assert.deepStrictEqual(result, grouped)
        })
    })

    describe('convert row with partial select', () => {
        let notGrouped: SequelizeRawEntityNotGrouped<Product>
        let grouped: SequelizeRawEntity<Product>
        let query: Query<Product>

        it ('partial select with specific attributes - converts relations', () => {
            notGrouped = {
                id: 2,
                type: 'smartphone',
                brand: 'Samsung',
                model: 'Galaxy S23',
                prices: {
                    price: '5399.00',
                    active: 1,
                    shop: {
                        name: 'Media Expert'
                    }
                }, 
                comments: {
                    content: 'Perfect for development work. Chip handles everything smoothly.'
                },
                product_categories: {
                    is_primary: 1,
                    active: 1,
                    category: {
                        name: 'Android Phones',
                        created: new Date('2024-04-07T10:00:00Z'),
                        parent: {
                            name: 'Electornic'
                        }
                    }
                }, 
                specification_tree: {
                    specification_type: 'smartphone'
                }
            } as SequelizeRawEntityNotGrouped<Product>

            grouped = {
                id: 2,
                type: 'smartphone',
                brand: 'Samsung',
                model: 'Galaxy S23',
                prices: [{
                    price: '5399.00',
                    active: 1,
                    shop: {
                        name: 'Media Expert'
                    }
                }], 
                comments: [{
                    content: 'Perfect for development work. Chip handles everything smoothly.'
                }],
                product_categories: [{
                    is_primary: 1,
                    active: 1,
                    category: {
                        name: 'Android Phones',
                        created: new Date('2024-04-07T10:00:00Z'),
                        parent: {
                            name: 'Electornic'
                        }
                    }
                }],
                specification_tree: {
                    specification_type: 'smartphone'
                }
            } as SequelizeRawEntity<Product>

            query = {
                select: ['id', 'type', 'brand', 'model'],
                prices: {
                    select: ['price', 'active'],
                    shop: {
                        select: ['name']
                    }
                }, 
                comments: {
                    select: ['content']
                }, 
                product_categories: {
                    select: ['is_primary', 'active'],
                    category: {
                        select: ['name', 'created'],
                        parent: {
                            select: ['name']
                        }
                    }
                },
                specification_tree: {
                    select: ['specification_type']
                }
            }
            const mappedSelects = mapSelects(query)
            const result = rowToGrouped(mappedSelects, tree, notGrouped)
            assert.deepStrictEqual(result, grouped)
        })
    })

    describe('convert row with related entities that have null - relation one to many and one to one', () => {
        let notGrouped: SequelizeRawEntityNotGrouped<Product>
        let grouped: SequelizeRawEntity<Product>
        let query: Query<Product>
        it ('row has specification_tree with null and related row prices has shop with null  - related stays as null', () => {
            notGrouped = {
                id: 2,
                prices: {
                    id: 2,
                    price: '5399.00',
                    created: new Date('2024-01-05T10:00:00Z'),
                    shop: null // one to many
                }, 
                specification_tree: null // one to one
            } as SequelizeRawEntityNotGrouped<Product>

            grouped = {
                id: 2,
                prices: [{
                    id: 2,
                    price: '5399.00',
                    created: new Date('2024-01-05T10:00:00Z'),
                    shop: null
                }],
                specification_tree: null
            } as any


            query = {select: ['id'], prices: {select: ['id', 'price', 'created'], shop: {}}, specification_tree: {}}
            const mappedSelects = mapSelects(query)
            const result = rowToGrouped(mappedSelects, tree, notGrouped)
            assert.deepStrictEqual(result, grouped)
        })
    })


    describe('convert row with related entities that have null - relation many to one and many to many', () => {
        let notGrouped: SequelizeRawEntityNotGrouped<Product>
        let grouped: SequelizeRawEntity<Product>
        let query: Query<Product>
        it ('row has related prices, comments with null  - related are converted to empty arrays', () => {
            notGrouped = {
                id: 2,
                prices: null, // many to one
                comments: null, // many to one
            } as SequelizeRawEntityNotGrouped<Product>
            grouped = {
                id: 2,
                prices: [], 
                comments: [],
            } as unknown as SequelizeRawEntity<Product>
            query = {select: ['id'], prices: {}, comments: {}}
            const mappedSelects = mapSelects(query)
            const result = rowToGrouped(mappedSelects, tree, notGrouped)
            assert.deepStrictEqual(result, grouped)
        })
    })


    describe('convert row with related and nested entities that have null - mixed relations', () => {
        let notGrouped: SequelizeRawEntityNotGrouped<Product>
        let grouped: SequelizeRawEntity<Product>
        let query: Query<Product>
        it ('row has related prices, comments, product_categories, specification_tree with null  - related are converted accordingly', () => {
            notGrouped = {
                id: 2,
                prices: null, 
                comments: null,
                product_categories: null,
                specification_tree: null
            } as SequelizeRawEntityNotGrouped<Product>
            grouped = {
                id: 2,
                prices: [], 
                comments: [],
                product_categories: [],
                specification_tree: null as any 
            } as unknown as SequelizeRawEntity<Product>
            query = {select: ['id'], prices: {}, comments: {}, product_categories: {}, specification_tree: {}}
            const mappedSelects = mapSelects(query)
            const result = rowToGrouped(mappedSelects, tree, notGrouped)
            assert.deepStrictEqual(result, grouped)
        })


        it ('row has related prices, comments, product_categories, specification_tree with null  - related are converted accordingly', () => {
            notGrouped = {
                id: 2,
                prices: {
                    id: 2,
                    shop: null
                }, 
                comments: null,
                product_categories: {
                    id: 2,
                    is_primary: 1,
                    category: {
                        id: 12,
                        children: null
                    }
                },
                specification_tree: null
            } as SequelizeRawEntityNotGrouped<Product>
            
            grouped = {
                id: 2,
                prices: [{
                    id: 2,
                    shop: null
                }], 
                comments: [],
                product_categories: [{
                    id: 2,
                    is_primary: 1,
                    category: {
                        id: 12,
                        children: []
                    }
                }],
                specification_tree: null
            } as any
            
            query = {
                select: ['id'], 
                prices: {
                    select: ['id'], 
                    shop: {}
                }, 
                comments: {}, 
                product_categories: {
                    select: ['id', 'is_primary'],
                    category: {
                        select: ['id'], 
                        children: {}
                    }
                }, 
                specification_tree: {}
            }
            const mappedSelects = mapSelects(query)
            const result = rowToGrouped(mappedSelects, tree, notGrouped)
            assert.deepStrictEqual(result, grouped)
        })
    })

    describe('convert row with related entities that have null and selected fields', () => {
        let notGrouped: SequelizeRawEntityNotGrouped<Product>
        let grouped: SequelizeRawEntity<Product>
        let query: Query<Product>
        it ('query has selected fields for prices and specification_tree that are null - should pass without error', () => {
            notGrouped = {
                id: 2,
                prices: null, 
                specification_tree: null 
            } as SequelizeRawEntityNotGrouped<Product>
            grouped = {
                id: 2,
                prices: [],
                specification_tree: null as any
            } as unknown as SequelizeRawEntity<Product>
            query = {select: ['id'], prices: {select: ['id', 'price', 'created'], shop: {}}, specification_tree: { select: ['id', 'active']}}
            const mappedSelects = mapSelects(query)
            const result = rowToGrouped(mappedSelects, tree, notGrouped)
            assert.deepStrictEqual(result, grouped)
        })
    })
})