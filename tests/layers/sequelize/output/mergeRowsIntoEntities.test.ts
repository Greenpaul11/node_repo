import { strict as assert } from 'node:assert'
import { it, describe } from "node:test";
import { Product, Comment, ProductImporter, User, Rate, SpecificationTree } from '../../../testSkeleton/entities'
import { productMetadata, commentMetadata, productImporterMetadata, userMetadata, rateMetadata, specificationTreeMetadata } from '../../../testSkeleton/config';
import { EntityRelationTree } from '../../../../src/types/entity/Metadata';
import { Query } from '../../../../src/types/entity/Query';
import { SequelizeRawEntityNotGrouped } from '../../../../src/layers/sequelize/types';
import { mergeRowsIntoEntities } from '../../../../src/layers/sequelize/output/mergeRowsIntoEntities';
import { createRelationTree } from '../../../../src/tree/treeBuilders';
import { OutputFormater } from '../../../../src/layers/sequelize/output/formater';


describe('mergeRowsIntoEntities: merge rows of entity with related entities into deduplicated rows(plural relations turned into array)', () => {

    const productTree: EntityRelationTree<Product> = createRelationTree(productMetadata)
    const commentTree: EntityRelationTree<Comment> = createRelationTree(commentMetadata)
    const productImporterTree: EntityRelationTree<ProductImporter> = createRelationTree(productImporterMetadata)
    const userTree: EntityRelationTree<User> = createRelationTree(userMetadata)
    const rateTree: EntityRelationTree<Rate> = createRelationTree(rateMetadata)
    const specificationTreeTree: EntityRelationTree<SpecificationTree> = createRelationTree(specificationTreeMetadata)

    // FORMATERS
    const productFormater = new OutputFormater(productMetadata, productTree, 'mysql')
    const commentFormater = new OutputFormater(commentMetadata, commentTree, 'mysql')
    const productImporterFormater = new OutputFormater(productImporterMetadata, productImporterTree, 'mysql')
    const userFormater = new OutputFormater(userMetadata, userTree, 'mysql')
    const rateFormater = new OutputFormater(rateMetadata, rateTree, 'mysql')
    const specificationTreeFormater = new OutputFormater(specificationTreeMetadata, specificationTreeTree, 'mysql')

    // SELECT MAPPERS
    const productSelect = productFormater.mapSelects.bind(productFormater)
    const commentSelect = commentFormater.mapSelects.bind(commentFormater)
    const productImporterSelect = productImporterFormater.mapSelects.bind(productImporterFormater)
    const userSelect = userFormater.mapSelects.bind(userFormater)
    const rateSelect = rateFormater.mapSelects.bind(rateFormater)
    const specificationTreeSelect = specificationTreeFormater.mapSelects.bind(specificationTreeFormater)

    

    const copyRow = <T extends Record<string, unknown>>(r: T): T => JSON.parse(JSON.stringify(r))

    describe('manage empty array and single row', () => {
        it ('empty data array - should return empty array', () => {
            const query: Query<Product> = { select: ['id', 'brand'] }
            const rows = [] as SequelizeRawEntityNotGrouped<Product>[]
            const mappedSelects = productSelect(query)
            const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
            assert.deepStrictEqual(result, [])
        })

        it ('single row - should return single grouped row', () => {
            const query: Query<Product> = { select: ['id', 'brand', 'model'] }
            const rows = { 
                id: 1, brand: 'Samsung', model: 'Galaxy S23' 
            } as SequelizeRawEntityNotGrouped<Product>
            
            const mappedSelects = productSelect(query)
            const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
            assert.deepStrictEqual(result, {
                id: 1, brand: 'Samsung', model: 'Galaxy S23' 
            })
        })
    })

    describe('test duplicate rows (same base attributes)', () => {
        it ('two rows with same id and brand - should merge', () => {
            const query: Query<Product> = { select: ['id', 'brand', 'model'] }
            const rows = [
                { id: 1, brand: 'Samsung', model: 'Galaxy S23' },
                { id: 1, brand: 'Samsung', model: 'Galaxy S23' }
            ] as SequelizeRawEntityNotGrouped<Product>[]
            const mappedSelects = productSelect(query)
            const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
            assert.strictEqual(result.length, 1)
        })

        it ('three identical rows - should return single row', () => {
            const query: Query<Product> = { select: ['id', 'brand', 'model'] }
            const rows = [
                { id: 1, brand: 'Samsung', model: 'Galaxy S23' },
                { id: 1, brand: 'Samsung', model: 'Galaxy S23' },
                { id: 1, brand: 'Samsung', model: 'Galaxy S23' }
            ] as SequelizeRawEntityNotGrouped<Product>[]
            const mappedSelects = productSelect(query)
            const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
            assert.strictEqual(result.length, 1)
        })
    })

    describe('test unique rows (different base attributes)', () => {
        it ('two rows with different id - should return both', () => {
            const query: Query<Product> = { select: ['id', 'brand', 'model'] }
            const rows = [
                { id: 1, brand: 'Samsung', model: 'Galaxy S23' },
                { id: 2, brand: 'Apple', model: 'iPhone 15' }
            ] as SequelizeRawEntityNotGrouped<Product>[]
            const mappedSelects = productSelect(query)
            const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
            assert.strictEqual(result.length, 2)
        })

        it ('three rows with different id - should return all three', () => {
            const query: Query<Product> = { select: ['id', 'brand', 'model'] }
            const rows = [
                { id: 1, brand: 'Samsung', model: 'Galaxy S23' },
                { id: 2, brand: 'Apple', model: 'iPhone 15' },
                { id: 3, brand: 'Google', model: 'Pixel 8' }
            ] as SequelizeRawEntityNotGrouped<Product>[]
            const mappedSelects = productSelect(query)
            const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
            assert.strictEqual(result.length, 3)
        })
    })
    
    describe('test rows with null relations', () => {
        it ('row with null prices - should be merged', () => {
            const query: Query<Product> = { 
                select: ['id', 'brand', 'model'],
                prices: {}
            }
            const rows = [
                { id: 1, brand: 'Samsung', model: 'Galaxy S23', prices: null },
                { id: 1, brand: 'Samsung', model: 'Galaxy S23', prices: null }
            ] as SequelizeRawEntityNotGrouped<Product>[]
            const mappedSelects = productSelect(query)
            const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
            assert.strictEqual(result.length, 1)
            assert.deepStrictEqual(result[0].prices, [])
        })

        it ('row with null and unique row - should keep both', () => {
            const query: Query<Product> = { 
                select: ['id', 'brand', 'model'],
                prices: {}
            }
            const rows = [
                { id: 1, brand: 'Samsung', model: 'Galaxy S23', prices: null },
                { id: 2, brand: 'Apple', model: 'iPhone 15', prices: null }
            ] as SequelizeRawEntityNotGrouped<Product>[]
            const mappedSelects = productSelect(query)
            const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
            assert.deepStrictEqual(result, [
                { id: 1, brand: 'Samsung', model: 'Galaxy S23', prices: [] },
                { id: 2, brand: 'Apple', model: 'iPhone 15', prices: [] }
            ])
        })
    })

    describe('test 1-level depth relations', () => {
        describe('one to one: Product -> SpecificationTree', () => {
            const query: Query<Product> = { 
               select: ['id', 'brand'],
               specification_tree: { select: ['id', 'product_id']}
            }
            const mappedSelects = productSelect(query)
            
            it ('single row is unchanged or its relations are transformed', () => {
                const row = {id: 1, brand: 'Samsung', specification_tree: {id: 2, product_id: 1}} as SequelizeRawEntityNotGrouped<Product>
                const result = mergeRowsIntoEntities(mappedSelects, productTree, row) 
                assert.deepStrictEqual(result, {id: 1, brand: 'Samsung', specification_tree: {id: 2, product_id: 1}})
            })

            it ('duplicated rows with relations are merged', () => {
                const rows = [
                    {id: 1, brand: 'Samsung', specification_tree: {id: 2, product_id: 1}},
                    {id: 1, brand: 'Samsung', specification_tree: {id: 2, product_id: 1}}
                ] as SequelizeRawEntityNotGrouped<Product>[]
                const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
                assert.deepStrictEqual(result, [ 
                    {id: 1, brand: 'Samsung', specification_tree: {id: 2, product_id: 1}}
                ])
            })

            it ('not duplicated rows with relations are not merged', () => {
                const rows = [
                    {id: 1, brand: 'Samsung', specification_tree: {id: 2, product_id: 1}},
                    {id: 2, brand: 'Samsung', specification_tree: {id: 3, product_id: 1}}
                ] as SequelizeRawEntityNotGrouped<Product>[]
                const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
                assert.deepStrictEqual(result, [
                    {id: 1, brand: 'Samsung', specification_tree: {id: 2, product_id: 1}},
                    {id: 2, brand: 'Samsung', specification_tree: {id: 3, product_id: 1}}
                ])
            })

            it ('row with last chain relation as null - relations are transformed or unchanged', () => {
                const row = {id: 1, brand: 'Samsung', specification_tree: null} as SequelizeRawEntityNotGrouped<Product>
                const result = mergeRowsIntoEntities(mappedSelects, productTree, row) 
                assert.deepStrictEqual(result, {id: 1, brand: 'Samsung', specification_tree: null})
            })
            
            it ('duplicated rows with last chain relation as null are merged', () => {
                const rows = [
                    {id: 1, brand: 'Samsung', specification_tree: null},
                    {id: 1, brand: 'Samsung', specification_tree: null}
                ] as SequelizeRawEntityNotGrouped<Product>[]
                const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
                assert.deepStrictEqual(result, [
                    {id: 1, brand: 'Samsung', specification_tree: null},
                ])
            })

            it ('not duplicated rows with last chain relation as null are not merged', () => {
                const rows = [
                    {id: 1, brand: 'Samsung', specification_tree: null},
                    {id: 2, brand: 'Samsung', specification_tree: null}
                ] as SequelizeRawEntityNotGrouped<Product>[]
                const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
                assert.deepStrictEqual(result, [
                    {id: 1, brand: 'Samsung', specification_tree: null},
                    {id: 2, brand: 'Samsung', specification_tree: null}
                ])
            })
        })

        describe('one to many: Product -> Prices', () => {
            const query: Query<Product> = { 
               select: ['id', 'brand'],
               prices: {
                select: ['id', 'price', 'created']
               }
            }
            const mappedSelects = productSelect(query)
            
            it ('single row is unchanged or its relations are transformed', () => {
                const row = {id: 1, brand: 'Samsung', prices: {id: 1, price: '3332.99', created: new Date('2023-05-10T15:00:00Z')}} as SequelizeRawEntityNotGrouped<Product>
                const result = mergeRowsIntoEntities(mappedSelects, productTree, row) 
                assert.deepStrictEqual(result, {
                    id: 1, brand: 'Samsung', 
                    prices: [
                        {id: 1, price: '3332.99', created: new Date('2023-05-10T15:00:00Z')}
                    ],
                })
            })

            it ('duplicated rows with relations are merged', () => {
                const rows = [
                    {id: 1, brand: 'Samsung', prices: {id: 1, price: '3332.99', created: new Date('2023-05-10T15:00:00Z')}},
                    {id: 1, brand: 'Samsung', prices: {id: 1, price: '3332.99', created: new Date('2023-05-10T15:00:00Z')}}
                ] as SequelizeRawEntityNotGrouped<Product>[]
                const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
                assert.deepStrictEqual(result, [ 
                    {id: 1, brand: 'Samsung', prices: [
                        {id: 1, price: '3332.99', created: new Date('2023-05-10T15:00:00Z')}
                    ],
                }])
            })

            it ('duplicated rows with relations are merged with not duplicated relations', () => {
                const rows = [
                    {id: 1, brand: 'Samsung', prices: {id: 1, price: '3332.99', created: new Date('2023-05-10T15:00:00Z')}},
                    {id: 1, brand: 'Samsung', prices: {id: 2, price: '3331.99', created: new Date('2023-06-10T15:00:00Z')}}
                ] as SequelizeRawEntityNotGrouped<Product>[] 
                const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
                assert.deepStrictEqual(result, [{
                    id: 1, brand: 'Samsung', prices: [
                        {id: 1, price: '3332.99', created: new Date('2023-05-10T15:00:00Z')},
                        {id: 2, price: '3331.99', created: new Date('2023-06-10T15:00:00Z')}
                    ]
                }])
            })

            it ('row with last chain relation as null - relations are transformed or unchanged', () => {
                const row = {id: 1, brand: 'Samsung', prices: null} as SequelizeRawEntityNotGrouped<Product>
                const result = mergeRowsIntoEntities(mappedSelects, productTree, row) 
                assert.deepStrictEqual(result, {id: 1, brand: 'Samsung', prices: []})
            })
            
            it ('duplicated rows with last chain relation as null are merged', () => {
                const rows = [
                    {id: 1, brand: 'Samsung', prices: null},
                    {id: 1, brand: 'Samsung', prices: null}
                ] as SequelizeRawEntityNotGrouped<Product>[] 
                const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
                assert.deepStrictEqual(result, [
                    {id: 1, brand: 'Samsung', prices: []},
                ])
            })

            it ('not duplicated rows with last chain relation as null are not merged', () => {
                const rows = [
                    {id: 1, brand: 'Samsung', prices: null},
                    {id: 2, brand: 'Samsung', prices: null}
                ] as SequelizeRawEntityNotGrouped<Product>[] 
                const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
                assert.deepStrictEqual(result, [
                    {id: 1, brand: 'Samsung', prices: []},
                    {id: 2, brand: 'Samsung', prices: []}
                ])
            })
        })

        describe('many to one: Comment -> Product', () => {
            const query: Query<Comment> = { 
               select: ['id', 'content'],
               product: {
                select: ['id', 'model']
               }
            }
            const mappedSelects = commentSelect(query)
            
            it ('single row is unchanged or its relations are transformed', () => {
                const row = {id: 1, content: 'This device is greate', product: {id: 2, model: 'Galaxy 3'}} as SequelizeRawEntityNotGrouped<Comment>
                const result = mergeRowsIntoEntities(mappedSelects, commentTree, row)
                assert.deepStrictEqual(result, {id: 1, content: 'This device is greate', product: {id: 2, model: 'Galaxy 3'}})
            })

            it ('duplicated rows with relations are merged', () => {
                const rows = [
                    {id: 1, content: 'This device is greate', product: {id: 2, model: 'Galaxy 3'}},
                    {id: 1, content: 'This device is greate', product: {id: 2, model: 'Galaxy 3'}}
                ] as SequelizeRawEntityNotGrouped<Comment>[] 
                const result = mergeRowsIntoEntities(mappedSelects, commentTree, rows)
                assert.deepStrictEqual(result, [ 
                    {id: 1, content: 'This device is greate', product: {id: 2, model: 'Galaxy 3'}}
                ])
            })

            it ('not duplicated rows with relations are not merged', () => {
                const rows = [
                    {id: 1, content: 'This device is greate', product: {id: 2, model: 'Galaxy 3'}},
                    {id: 2, content: 'This device is good', product: {id: 2, model: 'Galaxy 3'}}
                ] as SequelizeRawEntityNotGrouped<Comment>[] 
                const result = mergeRowsIntoEntities(mappedSelects, commentTree, rows)
                assert.deepStrictEqual(result, [
                    {id: 1, content: 'This device is greate', product: {id: 2, model: 'Galaxy 3'}},
                    {id: 2, content: 'This device is good', product: {id: 2, model: 'Galaxy 3'}}
                ])
            })

            it ('row with last chain relation as null - relations are transformed or unchanged', () => {
                const row = {id: 1, content: 'This device is greate', product: null} as SequelizeRawEntityNotGrouped<Comment>
                const result = mergeRowsIntoEntities(mappedSelects, commentTree, row)
                assert.deepStrictEqual(result, {id: 1, content: 'This device is greate', product: null})
            })
            
            it ('duplicated rows with last chain relation as null are merged', () => {
                const rows = [
                    {id: 1, content: 'This device is greate', product: null},
                    {id: 1, content: 'This device is greate', product: null}
                ] as SequelizeRawEntityNotGrouped<Comment>[] 
                const result = mergeRowsIntoEntities(mappedSelects, commentTree, rows)
                assert.deepStrictEqual(result, [
                    {id: 1, content: 'This device is greate', product: null},
                ])
            })

            it ('not duplicated rows with last chain relation as null are not merged', () => {
                const rows = [
                    {id: 1, content: 'This device is greate', product: null},
                    {id: 2, content: 'This device is good', product: null}
                ] as SequelizeRawEntityNotGrouped<Comment>[] 
                const result = mergeRowsIntoEntities(mappedSelects, commentTree, rows)
                assert.deepStrictEqual(result, [
                    {id: 1, content: 'This device is greate', product: null},
                    {id: 2, content: 'This device is good', product: null}
                ])
            })
        })
    })

    describe('test 2-level depth relations', () => {
        
        describe('one to one -> one to one: Product -> SpecificationTree -> Product (relations should be unchanged)', () => {
            const query: Query<Product> = { 
                select: ['brand', 'model'],
                specification_tree: {
                    select: ['id', 'specification_type'],
                    product: {
                        select: ['active']
                    }
                }
           }
            const mappedSelects = productSelect(query)

             it ('single row is unchanged or its relations are transformed', () => {
                 const row = {
                     brand: 'Samsung', 
                     model: 'Galaxy 25', 
                     specification_tree: {
                         id: 2,
                         specification_type: 'smartphone',
                         product: {
                             active: 1
                         }
                     }
                 } as SequelizeRawEntityNotGrouped<Product>
                 const unChanged = copyRow(row)
                 const result = mergeRowsIntoEntities(mappedSelects, productTree, row) 
                 assert.deepStrictEqual(result, unChanged)
             })

             it ('duplicated rows with relations are merged', () => {
                 const rows = [{
                     brand: 'Samsung', 
                     model: 'Galaxy 25', 
                     specification_tree: {
                         id: 2, 
                         specification_type: 'smartphone',
                         product: {
                             active: 1
                         }
                     }
                 }, {
                     brand: 'Samsung', 
                     model: 'Galaxy 25', 
                     specification_tree: {
                         id: 2, 
                         specification_type: 'smartphone',
                         product: {
                             active: 1
                         }
                     }
                 }] as SequelizeRawEntityNotGrouped<Product>[]
                 const unChanged = [copyRow(rows[0])]
                 const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
                 assert.deepStrictEqual(result, unChanged)
             })

             it ('not duplicated rows with relations are not merged', () => {
                 const rows = [{
                     brand: 'Samsung', 
                     model: 'Galaxy 25', 
                     specification_tree: {
                         id: 2, 
                         specification_type: 'smartphone',
                         product: {
                             active: 1
                         }
                     }
                 }, {
                     brand: 'Samsung', 
                     model: 'Galaxy 24', 
                     specification_tree: {
                         id: 2, 
                         specification_type: 'smartphone',
                         product: {
                             active: 1
                         }
                     }
                 }] as SequelizeRawEntityNotGrouped<Product>[]
                 
                 const unChanged = rows.map((row) => copyRow(row))
                 const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
                 assert.deepStrictEqual(result, unChanged)
             })

             it ('row with last chain relation as null - relations are transformed or unchanged', () => {
                 const row = {
                     brand: 'Samsung', 
                     model: 'Galaxy 25', 
                     specification_tree: {
                         id: 2, 
                         specification_type: 'smartphone',
                         product: null
                     }
                 } as SequelizeRawEntityNotGrouped<Product>
                 const unChanged = copyRow(row)
                 const result = mergeRowsIntoEntities(mappedSelects, productTree, row) 
                 assert.deepStrictEqual(result, unChanged)
             })

             it ('duplicated rows with last chain relation as null are merged', () => {
                 const rows = [{
                     brand: 'Samsung', 
                     model: 'Galaxy 25', 
                     specification_tree: {
                         id: 2, 
                         specification_type: 'smartphone',
                         product: null
                     }
                 }, { 
                     brand: 'Samsung', 
                     model: 'Galaxy 25', 
                     specification_tree: {
                         id: 2, 
                         specification_type: 'smartphone',
                         product: null
                     }
                 }] as SequelizeRawEntityNotGrouped<Product>[]
                 const unChanged = [copyRow(rows[0])]
                 const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
                 assert.deepStrictEqual(result, unChanged)
             })

             it ('not duplicated rows with last chain relation as null are not merged', () => {
                 const rows = [{
                     brand: 'Samsung', 
                     model: 'Galaxy 25', 
                     specification_tree: {
                         id: 2, 
                         specification_type: 'smartphone',
                         product: null
                     }
                 }, {
                     brand: 'Samsung', 
                     model: 'Galaxy 24', 
                     specification_tree: {
                         id: 2, 
                         specification_type: 'smartphone',
                         product: null
                     }
                 }] as SequelizeRawEntityNotGrouped<Product>[]
                 const unChanged = rows.map((row) => copyRow(row))
                 const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
                 assert.deepStrictEqual(result, unChanged)
             })
         })

        describe('one to one -> one to many: SpecificationTree -> Product -> Prices (relations should be changed)', () => {
            const query: Query<SpecificationTree> = { 
                select: ['id', 'specification_type'],
                product: {
                    select: ['brand', 'model'],
                    prices: {
                        select: ['price']
                    }
                }
            }
            const mappedSelects = specificationTreeSelect(query)
            
            it ('single row is unchanged or its relations are transformed', () => {
                const row = {
                    id: 1,
                    specification_type: 'smartphone',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: {
                            price: '2999'
                        }
                    }
                } as SequelizeRawEntityNotGrouped<SpecificationTree>
                
                const result = mergeRowsIntoEntities(mappedSelects, specificationTreeTree, row)
                assert.deepStrictEqual(result, {
                    id: 1,
                    specification_type: 'smartphone',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: [{
                            price: '2999'
                        }]
                    }
                })
            })
            
            it ('duplicated rows with relations are merged', () => {
                const rows = [{
                    id: 1,
                    specification_type: 'smartphone',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: {
                            price: '2999'
                        }
                    }
                }, {
                    id: 1,
                    specification_type: 'smartphone',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: {
                            price: '2990'
                        }
                    }
                }] as SequelizeRawEntityNotGrouped<SpecificationTree>[] 
                
                const result = mergeRowsIntoEntities(mappedSelects, specificationTreeTree, rows)
                assert.deepStrictEqual(result, [{
                    id: 1,
                    specification_type: 'smartphone',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: [{
                            price: '2999'
                        }, {
                            price: '2990'
                        }]
                    }
                }])
            })
            
            it ('not duplicated rows with relations are not merged', () => {
                const rows = [{
                    id: 1,
                    specification_type: 'smartphone',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: {
                            price: '2999'
                        }
                    }
                }, {
                    id: 2,
                    specification_type: 'laptop',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: {
                            price: '2999'
                        }
                    }
                }] as SequelizeRawEntityNotGrouped<SpecificationTree>[] 
                
                const result = mergeRowsIntoEntities(mappedSelects, specificationTreeTree, rows)
                assert.deepStrictEqual(result, [
                    {
                        id: 1,
                        specification_type: 'smartphone',
                        product: {
                            brand: 'Samsung',
                            model: 'Galaxy S23',
                            prices: [{
                                price: '2999'
                            }]
                        }
                    }, {
                        id: 2,
                        specification_type: 'laptop',
                        product: {
                            brand: 'Samsung',
                            model: 'Galaxy S23',
                            prices: [{
                                price: '2999'
                            }]
                        }
                    }
                ])
            })
            
            it ('row with last chain relation as null - relations are transformed or unchanged', () => {
                const row = {
                    id: 1,
                    specification_type: 'smartphone',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: null
                    }
                } as SequelizeRawEntityNotGrouped<SpecificationTree>
                
                const result = mergeRowsIntoEntities(mappedSelects, specificationTreeTree, row)
                assert.deepStrictEqual(result, {
                    id: 1,
                    specification_type: 'smartphone',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: []
                    }
                })
            })
            
            it ('duplicated rows with last chain relation as null are merged', () => {
                const rows = [{
                    id: 1,
                    specification_type: 'smartphone',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: null
                    }
                }, {
                    id: 1,
                    specification_type: 'smartphone',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: null
                    }
                }] as SequelizeRawEntityNotGrouped<SpecificationTree>[] 
                
                const result = mergeRowsIntoEntities(mappedSelects, specificationTreeTree, rows)
                assert.deepStrictEqual(result, [
                    {
                        id: 1,
                        specification_type: 'smartphone',
                        product: {
                            brand: 'Samsung',
                            model: 'Galaxy S23',
                            prices: []
                        }
                    }
                ])
            })
            
            it ('not duplicated rows with last chain relation as null are not merged', () => {
                const rows = [{
                    id: 1,
                    specification_type: 'smartphone',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: null
                    }
                }, {
                    id: 2,
                    specification_type: 'laptop',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S24',
                        prices: null
                    }
                }] as SequelizeRawEntityNotGrouped<SpecificationTree>[] 
                
                const result = mergeRowsIntoEntities(mappedSelects, specificationTreeTree, rows)
                assert.deepStrictEqual(result, [{
                    id: 1,
                    specification_type: 'smartphone',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: []
                    }
                }, {
                    id: 2,
                    specification_type: 'laptop',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S24',
                        prices: []
                    }
                }])
            })
        })

        describe('one to one -> many to one: SpecificationTree -> Product -> ProductImporter (relations should be unchanged)', () => {
            const query: Query<SpecificationTree> = { 
                select: ['specification_type'],
                product: {
                    select: ['brand', 'model'],
                    product_importer: {
                        select: ['name']
                    }
                }
            }
            const mappedSelects = specificationTreeSelect(query)

            it ('single row is unchanged or its relations are transformed', () => {
                const row = {
                    specification_type: 'smartphone',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        product_importer: {
                            name: 'Importer A'
                        }
                    }
                } as SequelizeRawEntityNotGrouped<SpecificationTree>
                
                const unChanged = copyRow(row)
                const result = mergeRowsIntoEntities(mappedSelects, specificationTreeTree, row)
                assert.deepStrictEqual(result, unChanged)
            })

            it ('duplicated rows with relations are merged', () => {
                const rows = [{
                    specification_type: 'smartphone',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        product_importer: {
                            name: 'Importer A'
                        }
                    }
                }, {
                    specification_type: 'smartphone',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        product_importer: {
                            name: 'Importer A'
                        }
                    }
                }] as SequelizeRawEntityNotGrouped<SpecificationTree>[] 
                
                const unChanged = [copyRow(rows[0])]
                const result = mergeRowsIntoEntities(mappedSelects, specificationTreeTree, rows)
                assert.deepStrictEqual(result, unChanged)
            })

            it ('not duplicated rows with relations are not merged', () => {
                const rows = [{
                    specification_type: 'smartphone',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        product_importer: {
                            name: 'Importer A'
                        }
                    }
                }, {
                    specification_type: 'laptop',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S24',
                        product_importer: {
                            name: 'Importer A'
                        }
                    }
                }] as SequelizeRawEntityNotGrouped<SpecificationTree>[] 
                
                const unChanged = rows.map((row) => copyRow(row))
                const result = mergeRowsIntoEntities(mappedSelects, specificationTreeTree, rows)
                assert.deepStrictEqual(result, unChanged)
            })


            it ('row with last chain relation as null - relations are transformed or unchanged', () => {
                const row = {
                    specification_type: 'smartphone',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        product_importer: null
                    }
                } as SequelizeRawEntityNotGrouped<SpecificationTree>
                
                const unChanged = copyRow(row)
                const result = mergeRowsIntoEntities(mappedSelects, specificationTreeTree, row)
                assert.deepStrictEqual(result, unChanged)
            })


            it ('duplicated rows with last chain relation as null are merged', () => {
                const rows = [{
                    specification_type: 'smartphone',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        product_importer: null
                    }
                }, {
                    specification_type: 'smartphone',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        product_importer: null
                    }
                }] as SequelizeRawEntityNotGrouped<SpecificationTree>[]
                const unChanged = [copyRow(rows[0])] 
                const result = mergeRowsIntoEntities(mappedSelects, specificationTreeTree, rows)
                assert.deepStrictEqual(result, unChanged)
            })


            it ('not duplicated rows with last chain relation as null are not merged', () => {
                const rows = [{
                    specification_type: 'smartphone',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        product_importer: null
                    }
                }, {
                    specification_type: 'laptop',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S24',
                        product_importer: null
                    }
                }] as SequelizeRawEntityNotGrouped<SpecificationTree>[] 
                
                const unChanged = rows.map((row) => copyRow(row))
                const result = mergeRowsIntoEntities(mappedSelects, specificationTreeTree, rows)
                assert.deepStrictEqual(result, unChanged)
            })
        })

describe('one to many -> one to one: ProductImporter -> Product -> SpecificationTree (relations should be changed)', () => {
            const query: Query<ProductImporter> = { 
                select: ['name'],
                products: {
                    select: ['brand', 'model'],
                    specification_tree: {
                        select: ['specification_type']
                    }
                }
            }
            const mappedSelects = productImporterSelect(query)
           
            it ('single row is unchanged or its relations are transformed', () => {
                const row = {
                    name: 'Importer A',
                    products: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: {
                            specification_type: 'smartphone'
                        }
                    }
                } as SequelizeRawEntityNotGrouped<ProductImporter>

                const result = mergeRowsIntoEntities(mappedSelects, productImporterTree, row)
                assert.deepStrictEqual(result, {
                    name: 'Importer A',
                    products: [{
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: {
                            specification_type: 'smartphone'
                        }
                    }]
                })
            })
           
            it ('duplicated rows with relations are merged', () => {
                const rows = [{
                    name: 'Importer A',
                    products: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: {
                            specification_type: 'smartphone'
                        }
                    }
                }, {
                    name: 'Importer A',
                    products: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: {
                            specification_type: 'smartphone'
                        }
                    }
                }] as SequelizeRawEntityNotGrouped<ProductImporter>[] 
               
                const result = mergeRowsIntoEntities(mappedSelects, productImporterTree, rows)
                assert.deepStrictEqual(result, [{
                    name: 'Importer A',
                    products: [{
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: {
                            specification_type: 'smartphone'
                        }
                    }]
                }])
            })
           
            it ('not duplicated rows with relations are not merged', () => {
                const rows = [{
                    name: 'Importer A',
                    products: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: {
                            specification_type: 'smartphone'
                        }
                    }
                }, {
                    name: 'Importer A',
                    products: {
                        brand: 'Samsung',
                        model: 'Galaxy S24',
                        specification_tree: {
                            specification_type: 'laptop'
                        }
                    }
                }] as SequelizeRawEntityNotGrouped<ProductImporter>[] 
               
                const result = mergeRowsIntoEntities(mappedSelects, productImporterTree, rows)
                assert.deepStrictEqual(result, [{
                    name: 'Importer A',
                    products: [
                        {
                            brand: 'Samsung',
                            model: 'Galaxy S23',
                            specification_tree: {
                                specification_type: 'smartphone'
                            }
                        },
                        {
                            brand: 'Samsung',
                            model: 'Galaxy S24',
                            specification_tree: {
                                specification_type: 'laptop'
                            }
                        }
                    ]
                }])
            })
           
            it ('row with last chain relation as null - relations are transformed or unchanged', () => {
                const row = {
                    name: 'Importer A',
                    products: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: null
                    }
                } as SequelizeRawEntityNotGrouped<ProductImporter>

                const result = mergeRowsIntoEntities(mappedSelects, productImporterTree, row)
                assert.deepStrictEqual(result, {
                    name: 'Importer A',
                    products: [{
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: null
                    }]
               })
          })
           
            it ('duplicated rows with last chain relation as null are merged', () => {
                const rows = [{
                    name: 'Importer A',
                    products: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: null
                    }
                }, {
                    name: 'Importer A',
                    products: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: null
                    }
                }] as SequelizeRawEntityNotGrouped<ProductImporter>[] 
               
                const result = mergeRowsIntoEntities(mappedSelects, productImporterTree, rows)
                assert.deepStrictEqual(result, [{
                    name: 'Importer A',
                    products: [{
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: null
                    }]
                }])
            })
           
            it ('not duplicated rows with last chain relation as null are not merged', () => {
                const rows = [{
                    name: 'Importer A',
                    products: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: null
                    }
                }, {
                    name: 'Importer B',
                    products: {
                        brand: 'Samsung',
                        model: 'Galaxy S24',
                        specification_tree: null
                    }
                }] as SequelizeRawEntityNotGrouped<ProductImporter>[] 
               
                const result = mergeRowsIntoEntities(mappedSelects, productImporterTree, rows)
                assert.deepStrictEqual(result, [
                    {
                        name: 'Importer A',
                        products: [{
                            brand: 'Samsung',
                            model: 'Galaxy S23',
                            specification_tree: null
                        }]
                    }, {
                        name: 'Importer B',
                        products: [{
                            brand: 'Samsung',
                            model: 'Galaxy S24',
                            specification_tree: null
                        }]
                    }
                ])
            })
        })

        describe('one to many -> one to many: User -> Comment -> Rate (relations should be changed)', () => {
            const query: Query<User> = { 
                select: ['name'],
                comments: {
                    select: ['content'],
                    rates: {
                        select: ['rate']
                    }
                }
            }
            const mappedSelects = userSelect(query)
            
            it ('single row is unchanged or its relations are transformed', () => {
                const row = {
                    name: 'John Doe',
                    comments: {
                        content: 'Great product',
                        rates: {
                            rate: 5
                        }
                    }
                } as SequelizeRawEntityNotGrouped<User>
                const result = mergeRowsIntoEntities(mappedSelects, userTree, row)
                assert.deepStrictEqual(result, {
                    name: 'John Doe',
                    comments: [{
                        content: 'Great product',
                        rates: [{
                            rate: 5
                        }]
                    }]
                })
            })
            
            it ('duplicated rows with relations are merged', () => {
                const rows = [{
                    name: 'John Doe',
                    comments: {
                        content: 'Great product',
                        rates: {
                            rate: 5
                        }
                    }
                }, {
                    name: 'John Doe',
                    comments: {
                        content: 'Great product',
                        rates: {
                            rate: 4
                        }
                    }
                }] as SequelizeRawEntityNotGrouped<User>[]
                const result = mergeRowsIntoEntities(mappedSelects, userTree, rows)
                assert.deepStrictEqual(result, [{
                    name: 'John Doe',
                    comments: [{
                        content: 'Great product',
                        rates: [{
                            rate: 5
                        }, {
                            rate: 4
                        }]
                    }]
                }])
            })
            
            it ('not duplicated rows with relations are not merged', () => {
                const rows = [{
                    name: 'Lizy Ford',
                    comments: {
                        content: 'Great product',
                        rates: {
                            rate: 5
                        }
                    }
                }, {
                    name: 'John Doe',
                    comments: {
                        content: 'Good product',
                        rates: {
                            rate: 5
                        }
                    }
                }] as SequelizeRawEntityNotGrouped<User>[]
                const result = mergeRowsIntoEntities(mappedSelects, userTree, rows)
                assert.deepStrictEqual(result, [{
                        name: 'Lizy Ford',
                        comments: [{
                            content: 'Great product',
                            rates: [{
                                rate: 5
                            }]
                        }]
                    }, {
                        name: 'John Doe',
                        comments: [{
                            content: 'Good product',
                            rates: [{
                                rate: 5
                            }]
                        }]
                    }
                ])
            })
            
            it ('row with last chain relation as null - relations are transformed or unchanged', () => {
                const row = {
                    name: 'John Doe',
                    comments: {
                        content: 'Great product',
                        rates: null
                    }
                } as SequelizeRawEntityNotGrouped<User>
                const result = mergeRowsIntoEntities(mappedSelects, userTree, row)
                assert.deepStrictEqual(result, {
                    name: 'John Doe',
                    comments: [{
                        content: 'Great product',
                        rates: []
                    }]
                })
            })
            
            it ('duplicated rows with last chain relation as null are merged', () => {
                const rows = [{
                    name: 'John Doe',
                    comments: {
                        content: 'Great product',
                        rates: null
                    }
                }, {
                    name: 'John Doe',
                    comments: {
                        content: 'Great product',
                        rates: null
                    }
                }] as SequelizeRawEntityNotGrouped<User>[]
                const result = mergeRowsIntoEntities(mappedSelects, userTree, rows)
                assert.deepStrictEqual(result, [{
                    name: 'John Doe',
                    comments: [{
                        content: 'Great product',
                        rates: []
                    }]
                }])
            })
            
            it ('not duplicated rows with last chain relation as null are not merged', () => {
                const rows = [{
                    name: 'Lizy Ford',
                    comments: {
                        content: 'Great product',
                        rates: null
                    }
                }, {
                    name: 'John Doe',
                    comments: {
                        content: 'Good product',
                        rates: null
                    }
                }] as SequelizeRawEntityNotGrouped<User>[]
                const result = mergeRowsIntoEntities(mappedSelects, userTree, rows)
                assert.deepStrictEqual(result, [{
                    name: 'Lizy Ford',
                    comments: [{
                        content: 'Great product',
                        rates: []
                    }]
                }, {
                    name: 'John Doe',
                    comments: [{
                        content: 'Good product',
                        rates: []
                    }]
                }])
            })
        })

        describe('one to many -> many to one: Product -> ProductCategory -> Category (relations should be unchanged)', () => {
            const query: Query<Product> = { 
                select: ['brand', 'model'],
                product_categories: {
                    select: ['is_primary'],
                    category: {
                        select: ['name']
                    }
                }
            }
            const mappedSelects = productSelect(query)
            
            it ('single row is unchanged or its relations are transformed', () => {
                const row = {
                    brand: 'Samsung',
                    model: 'Galaxy S23',
                    product_categories: {
                        is_primary: 1,
                        category: {
                            name: 'Electronics'
                        }
                    }
                } as SequelizeRawEntityNotGrouped<Product>
                const result = mergeRowsIntoEntities(mappedSelects, productTree, row) 
                assert.deepStrictEqual(result, {
                    brand: 'Samsung',
                    model: 'Galaxy S23',
                    product_categories: [{
                        is_primary: 1,
                        category: {
                            name: 'Electronics'
                        }
                    }]
                })
            })
            
            it ('duplicated rows with relations are merged', () => {
                const rows = [{
                    brand: 'Samsung',
                    model: 'Galaxy S23',
                    product_categories: {
                        is_primary: 1,
                        category: {
                            name: 'Electronics'
                        }
                    }
                }, {
                    brand: 'Samsung',
                    model: 'Galaxy S23',
                    product_categories: {
                        is_primary: 1,
                        category: {
                            name: 'Electronics'
                        }
                    }
                }] as SequelizeRawEntityNotGrouped<Product>[]
                
                const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
                assert.deepStrictEqual(result, [{
                    brand: 'Samsung',
                    model: 'Galaxy S23',
                    product_categories: [{
                        is_primary: 1,
                        category: {
                            name: 'Electronics'
                        }
                    }]
                }])
            })
            
            it ('not duplicated rows with relations are not merged', () => {
                const rows = [{
                    brand: 'Samsung',
                    model: 'Galaxy S23',
                    product_categories: {
                        is_primary: 1,
                        category: {
                            name: 'Electronics'
                        }
                    }
                }, {
                    brand: 'Samsung',
                    model: 'Galaxy S24',
                    product_categories: {
                        is_primary: 0,
                        category: {
                            name: 'Smartphones'
                        }
                    }
                }] as SequelizeRawEntityNotGrouped<Product>[]
                const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
                assert.deepStrictEqual(result, [
                    {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        product_categories: [{
                            is_primary: 1,
                            category: {
                                name: 'Electronics'
                            }
                        }]
                    },
                    {
                        brand: 'Samsung',
                        model: 'Galaxy S24',
                        product_categories: [{
                            is_primary: 0,
                            category: {
                                name: 'Smartphones'
                            }
                        }]
                    }
                ])
            })
            
            it ('row with last chain relation as null - relations are transformed or unchanged', () => {
                const row = {
                    brand: 'Samsung',
                    model: 'Galaxy S23',
                    product_categories: {
                        id: 1,
                        is_primary: 1,
                        category: null
                    }
                } as SequelizeRawEntityNotGrouped<Product>
                
                const result = mergeRowsIntoEntities(mappedSelects, productTree, row) 
                assert.deepStrictEqual(result, {
                    brand: 'Samsung',
                    model: 'Galaxy S23',
                    product_categories: [{
                        is_primary: 1,
                        category: null
                    }]
                })
            })
            
            it ('duplicated rows with last chain relation as null are merged', () => {
                const rows = [{
                    brand: 'Samsung',
                    model: 'Galaxy S23',
                    product_categories: {
                        is_primary: 1,
                        category: null
                    }
                }, {
                    brand: 'Samsung',
                    model: 'Galaxy S23',
                    product_categories: {
                        is_primary: 1,
                        category: null
                    }
                }, {
                    brand: 'Samsung',
                    model: 'Galaxy S23',
                    product_categories: {
                        is_primary: 1,
                        category: null
                    }
                }] as SequelizeRawEntityNotGrouped<Product>[]
                const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
                assert.deepStrictEqual(result, [{
                    brand: 'Samsung',
                    model: 'Galaxy S23',
                    product_categories: [{
                        is_primary: 1,
                        category: null
                    }]
                }])
            })
            
            it ('not duplicated rows with last chain relation as null are not merged', () => {
                const rows = [{
                    brand: 'Samsung',
                    model: 'Galaxy S23',
                    product_categories: {
                        is_primary: 1,
                        category: null
                    }
                }, {
                    brand: 'Samsung',
                    model: 'Galaxy S24',
                    product_categories: {
                        is_primary: 0,
                        category: null
                    }
                }] as SequelizeRawEntityNotGrouped<Product>[]
                const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
                assert.deepStrictEqual(result, [
                    {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        product_categories: [{
                            is_primary: 1,
                            category: null
                        }]
                    },
                    {
                        brand: 'Samsung',
                        model: 'Galaxy S24',
                        product_categories: [{
                            is_primary: 0,
                            category: null
                        }]
                    }
                ])
            })
        })
        
        describe('many to one -> one to one: Comment -> Product -> SpecificationTree (relations should be unchanged)', () => {
            const query: Query<Comment> = { 
                select: ['content'],
                product: {
                    select: ['brand', 'model'],
                    specification_tree: {
                        select: ['specification_type']
                    }
                }
            }
            const mappedSelects = commentSelect(query)
            
            it ('single row is unchanged or its relations are transformed', () => {
                const row = {
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: {
                            specification_type: 'smartphone'
                        }
                    }
                } as SequelizeRawEntityNotGrouped<Comment>
                
                const result = mergeRowsIntoEntities(mappedSelects, commentTree, row)
                assert.deepStrictEqual(result, {
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: {
                            specification_type: 'smartphone'
                        }
                    }
                })
            })
            
            it ('duplicated rows with relations are merged', () => {
                const rows = [{
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: {
                            specification_type: 'smartphone'
                        }
                    }
                }, {
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: {
                            specification_type: 'smartphone'
                        }
                    }
                }] as SequelizeRawEntityNotGrouped<Comment>[]
                
                const result = mergeRowsIntoEntities(mappedSelects, commentTree, rows)
                assert.deepStrictEqual(result, [{
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: {
                            specification_type: 'smartphone'
                        }
                    }
                }])
            })
            
            it ('not duplicated rows with relations are not merged', () => {
                const rows = [{
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: {
                            specification_type: 'smartphone'
                        }
                    }
                }, {
                    content: 'Good product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S24',
                        specification_tree: {
                            specification_type: 'smartphone'
                        }
                    }
                }, {
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S25',
                        specification_tree: {
                            specification_type: 'smartphone'
                        }
                    }
                }] as SequelizeRawEntityNotGrouped<Comment>[]
                
                const result = mergeRowsIntoEntities(mappedSelects, commentTree, rows)
                assert.deepStrictEqual(result, [
                    {
                        content: 'Great product',
                        product: {
                            brand: 'Samsung',
                            model: 'Galaxy S23',
                            specification_tree: {
                                specification_type: 'smartphone'
                            }
                        }
                    },
                    {
                        content: 'Good product',
                        product: {
                            brand: 'Samsung',
                            model: 'Galaxy S24',
                            specification_tree: {
                                specification_type: 'smartphone'
                            }
                        }
                    },
                    {
                        content: 'Great product',
                        product: {
                            brand: 'Samsung',
                            model: 'Galaxy S25',
                            specification_tree: {
                                specification_type: 'smartphone'
                            }
                        }
                    }
                ])
            })
            
            it ('row with last chain relation as null - relations are transformed or unchanged', () => {
                const row = {
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: null
                    }
                } as SequelizeRawEntityNotGrouped<Comment>
                
                const result = mergeRowsIntoEntities(mappedSelects, commentTree, row)
                assert.deepStrictEqual(result, {
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: null
                    }
                })
            })
            
            it ('duplicated rows with last chain relation as null are merged', () => {
                const rows = [{
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: null
                    }
                }, {
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: null
                    }
                }] as SequelizeRawEntityNotGrouped<Comment>[]
                
                const result = mergeRowsIntoEntities(mappedSelects, commentTree, rows)
                assert.deepStrictEqual(result, [{
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: null
                    }
                }])
            })
            
            it ('not duplicated rows with last chain relation as null are not merged', () => {
                const rows = [{
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        specification_tree: null
                    }
                }, {
                    content: 'Good product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S24',
                        specification_tree: null
                    }
                }, {
                    content: 'Good product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S25',
                        specification_tree: null
                    }
                }] as SequelizeRawEntityNotGrouped<Comment>[]
                
                const result = mergeRowsIntoEntities(mappedSelects, commentTree, rows)
                assert.deepStrictEqual(result, [
                    {
                        content: 'Great product',
                        product: {
                            brand: 'Samsung',
                            model: 'Galaxy S23',
                            specification_tree: null
                        }
                    },
                    {
                        content: 'Good product',
                        product: {
                            brand: 'Samsung',
                            model: 'Galaxy S24',
                            specification_tree: null
                        }
                    },
                    {
                        content: 'Good product',
                        product: {
                            brand: 'Samsung',
                            model: 'Galaxy S25',
                            specification_tree: null
                        }
                    }
                ])
            })
        })

        describe('many to one -> one to many: Comment -> Product -> Price (relations should be changed)', () => {
            const query: Query<Comment> = { 
                select: ['content'],
                product: {
                    select: ['brand', 'model'],
                    prices: {
                        select: ['price']
                    }
                }
            }
            const mappedSelects = commentSelect(query)
            
            it ('single row is unchanged or its relations are transformed', () => {
                const row = {
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: {
                            price: '2999'
                        }
                    }
                } as SequelizeRawEntityNotGrouped<Comment>
                
                const result = mergeRowsIntoEntities(mappedSelects, commentTree, row)
                assert.deepStrictEqual(result, {
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: [{
                            price: '2999'
                        }]
                    }
                })
            })
            
            it ('duplicated rows with relations are merged', () => {
                const rows = [{
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: {
                            price: '2999'
                        }
                    }
                }, {
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: {
                            price: '3199'
                        }
                    }
                }] as SequelizeRawEntityNotGrouped<Comment>[]
                
                const result = mergeRowsIntoEntities(mappedSelects, commentTree, rows)
                assert.deepStrictEqual(result, [{
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: [{
                            price: '2999'
                        }, {
                            price: '3199'
                        }]
                    }
                }])
            })
            
            it ('not duplicated rows with relations are not merged', () => {
                const rows = [{
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: {
                            price: '2999'
                        }
                    }
                }, {
                    content: 'Good product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S24',
                        prices: {
                            price: '3199'
                        }
                    }
                }] as SequelizeRawEntityNotGrouped<Comment>[]
                
                const result = mergeRowsIntoEntities(mappedSelects, commentTree, rows)
                assert.deepStrictEqual(result, [
                    {
                        content: 'Great product',
                        product: {
                            brand: 'Samsung',
                            model: 'Galaxy S23',
                            prices: [{
                                price: '2999'
                            }]
                        }
                    },
                    {
                        content: 'Good product',
                        product: {
                            brand: 'Samsung',
                            model: 'Galaxy S24',
                            prices: [{
                                price: '3199'
                            }]
                        }
                    }
                ])
            })
            
            it ('row with last chain relation as null - relations are transformed or unchanged', () => {
                const row = {
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: null
                    }
                } as SequelizeRawEntityNotGrouped<Comment>
                
                const result = mergeRowsIntoEntities(mappedSelects, commentTree, row)
                assert.deepStrictEqual(result, {
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: []
                    }
                })
            })
            
            it ('duplicated rows with last chain relation as null are merged', () => {
                const rows = [{
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: null
                    }
                }, {
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: null
                    }
                }] as SequelizeRawEntityNotGrouped<Comment>[]
                
                const result = mergeRowsIntoEntities(mappedSelects, commentTree, rows)
                assert.deepStrictEqual(result, [{
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: []
                    }
                }])
            })
            
            it ('not duplicated rows with last chain relation as null are not merged', () => {
                const rows = [{
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23',
                        prices: null
                    }
                }, {
                    content: 'Good product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S24',
                        prices: null
                    }
                }] as SequelizeRawEntityNotGrouped<Comment>[]
                
                const result = mergeRowsIntoEntities(mappedSelects, commentTree, rows)
                assert.deepStrictEqual(result, [
                    {
                        content: 'Great product',
                        product: {
                            brand: 'Samsung',
                            model: 'Galaxy S23',
                            prices: []
                        }
                    },
                    {
                        content: 'Good product',
                        product: {
                            brand: 'Samsung',
                            model: 'Galaxy S24',
                            prices: []
                        }
                    }
                ])
            })
        })

        describe('many to one -> many to one: Rate -> Comment -> Product (relations should be unchanged)', () => { 
            const query: Query<Rate> = { 
                select: ['rate'],
                comment: {
                    select: ['content'],
                    product: {
                        select: ['brand', 'model']
                    }
                }
            }
            const mappedSelects = rateSelect(query)

            it ('single row is unchanged or its relations are transformed', () => {
                const row = {
                    rate: 5,
                    comment: {
                        content: 'Great product',
                        product: {
                            brand: 'Samsung',
                            model: 'Galaxy S23'
                        }
                    }
                } as SequelizeRawEntityNotGrouped<Rate>
                
                const unChanged = copyRow(row)
                const result = mergeRowsIntoEntities(mappedSelects, rateTree, row)
                assert.deepStrictEqual(result, unChanged)
            })

            it ('duplicated rows with relations are merged', () => {
                const rows = [{
                    rate: 5,
                    comment: {
                        content: 'Great product',
                        product: {
                            brand: 'Samsung',
                            model: 'Galaxy S23'
                        }
                    }
                }, {
                    rate: 5,
                    comment: {
                        content: 'Great product',
                        product: {
                            brand: 'Samsung',
                            model: 'Galaxy S23'
                        }
                    }
                }] as SequelizeRawEntityNotGrouped<Rate>[]

                                 

                const unChanged = [copyRow(rows[0])] as SequelizeRawEntityNotGrouped<Rate>[]

            // Note: result should also match unChanged, fixing
            const result = mergeRowsIntoEntities(mappedSelects, rateTree, rows)
            assert.deepStrictEqual(result, unChanged)
        })

        it ('not duplicated rows with relations are not merged', () => {
            const rows = [{
                rate: 5,
                comment: {
                    content: 'Great product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S23'
                    }
                }
            }, {
                rate: 5,
                comment: {
                    content: 'Good product',
                    product: {
                        brand: 'Samsung',
                        model: 'Galaxy S24'
                    }
                }
            }] as SequelizeRawEntityNotGrouped<Rate>[]

            const unChanged = rows.map((row) => copyRow(row)) as SequelizeRawEntityNotGrouped<Rate>[]

            const result = mergeRowsIntoEntities(mappedSelects, rateTree, rows)
            assert.deepStrictEqual(result, unChanged)
        })

        it ('row with last chain relation as null - relations are transformed or unchanged', () => {
            const row = {
                rate: 5,
                comment: {
                    content: 'Great product',
                    product: null
                }
            } as SequelizeRawEntityNotGrouped<Rate>

            const unChanged = copyRow(row) as SequelizeRawEntityNotGrouped<Rate>

            const result = mergeRowsIntoEntities(mappedSelects, rateTree, row)
            assert.deepStrictEqual(result, unChanged)
        })

        it ('duplicated rows with last chain relation as null are merged', () => {
            const rows = [{
                rate: 5,
                comment: {
                    content: 'Great product',
                    product: null
                }
            }, {
                rate: 5,
                comment: {
                    content: 'Great product',
                    product: null
                }
            }] as SequelizeRawEntityNotGrouped<Rate>[]

            const unChanged = [copyRow(rows[0])] as SequelizeRawEntityNotGrouped<Rate>[]

            const result = mergeRowsIntoEntities(mappedSelects, rateTree, rows)
            assert.deepStrictEqual(result, unChanged)
        })

        it ('not duplicated rows with last chain relation as null are not merged', () => {
            const rows = [{
                rate: 5,
                comment: {
                    content: 'Great product',
                    product: null
                }
            }, {
                rate: 5,
                comment: {
                    content: 'Good product',
                    product: null
                }
            }] as SequelizeRawEntityNotGrouped<Rate>[]

            const unChanged = rows.map((row) => copyRow(row)) as SequelizeRawEntityNotGrouped<Rate>[]
            
            const result = mergeRowsIntoEntities(mappedSelects, rateTree, rows)
            assert.deepStrictEqual(result, unChanged)
        })
    })
    })

    describe('test combinations', () => {
        const query: Query<Product> = { 
            select: ['id', 'brand', 'model'],
            prices: { select: ['price'] },
            comments: { select: ['content'] },
            product_categories: { select: ['is_primary'] }
        }
        const mappedSelects = productSelect(query)

        it ('mixed relations: prices, comments, product_categories - should merge correctly', () => {
            const rows = [
                { 
                    id: 1, 
                    brand: 'Samsung', 
                    model: 'Galaxy S23', 
                    prices: { price: '2999' },
                    comments: { content: 'Great phone' },
                    product_categories: { is_primary: 1 }
                },
                { 
                    id: 1, 
                    brand: 'Samsung', 
                    model: 'Galaxy S23', 
                    prices: { price: '3199' },
                    comments: { content: 'Awesome!' },
                    product_categories: { is_primary: 1 }
                },
                { 
                    id: 2, 
                    brand: 'Apple', 
                    model: 'iPhone 15', 
                    prices: { price: '3499' },
                    comments: { content: 'Love it' },
                    product_categories: { is_primary: 1 }
                }
            ] as SequelizeRawEntityNotGrouped<Product>[]
            const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
            assert.deepStrictEqual(result, [
                { 
                    id: 1, 
                    brand: 'Samsung', 
                    model: 'Galaxy S23', 
                    prices: [{ price: '2999' }, { price: '3199' }],
                    comments: [{ content: 'Great phone' }, { content: 'Awesome!' }],
                    product_categories: [{ is_primary: 1 }]
                },
                { 
                   id: 2, 
                   brand: 'Apple', 
                   model: 'iPhone 15', 
                   prices: [{ price: '3499' }],
                   comments: [{ content: 'Love it' }],
                   product_categories: [{ is_primary: 1 }]
               }
            ])
        })
    })
    
    describe('test with exclude select', () => {
        const query: Query<Product> = { 
            select: { 
                exclude: [
                    'id', 'importer_id', 'updated', 'created', 'active', 'image',
                    'description', 'variant_second', 'updated'
                ] 
            } 
        }
        const mappedSelects = productSelect(query)

        it ('exclude with duplicate rows - should merge', () => {
            const rows = [
                { type: 'smartphone', brand: 'Samsung', model: 'Galaxy S23', variant: '1sks8sss' },
                { type: 'smartphone', brand: 'Samsung', model: 'Galaxy S23', variant: '1sks8sss' }
            ] as SequelizeRawEntityNotGrouped<Product>[]
            const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
            assert.deepStrictEqual(result, [
                { type: 'smartphone', brand: 'Samsung', model: 'Galaxy S23', variant: '1sks8sss' }
            ])
        })

        it ('exclude with unique rows - should keep both', () => {
            const rows = [
                { type: 'smartphone', brand: 'Samsung', model: 'Galaxy S23', variant: '1sks8sss' },
                { type: 'smartphone', brand: 'Samsung', model: 'Galaxy S23', variant: 'kdfkdfkd' }
            ] as SequelizeRawEntityNotGrouped<Product>[]
            const result = mergeRowsIntoEntities(mappedSelects, productTree, rows)
            assert.deepStrictEqual(result, [
                { type: 'smartphone', brand: 'Samsung', model: 'Galaxy S23', variant: '1sks8sss' },
                { type: 'smartphone', brand: 'Samsung', model: 'Galaxy S23', variant: 'kdfkdfkd' }
            ])
        })
    })
})