import { strict as assert } from 'node:assert'
import { it, describe } from "node:test";
import { Product } from '../../testSkeleton/entities'
import { productMetadata } from '../../testSkeleton/config';
import { EntityRelationTree } from '../../../src/types/entity/Metadata';
import { QuerySelect, MapEntitySelect, SubMapSelect, Query } from '../../../src/types/entity/Query';
import { entitySelectToMapSelect, mapNestedSelects } from '../../../src/formaters/output/mapSelects';
import { OutputFormater } from '../../../src/layers/sequelize/output/formater';
import { createRelationTree } from '../../../src/tree/treeBuilders';


describe('mapSelects: Map query selects to mapped select objects for database queries', () => {

    const metadata = productMetadata
    const tree: EntityRelationTree<Product> = createRelationTree(metadata)
    
    describe('entitySelectToMapSelect: Converts query select to mapped select for base attributes of entity', () => {
        
        let querySelect: QuerySelect<Product> 
        
        it ('undefined querySelect - should use all base attributes from metadata', () => {
            const {select, fns} = entitySelectToMapSelect(querySelect, metadata.baseAttributesList)
            assert.deepStrictEqual(select, ["id", "importer_id", "type", "brand", "model", "image", "description", 
                "variant", "variant_second", "active", "created", "updated"])
            assert.deepStrictEqual(fns, [])
        })

        it ('array of attributes - should return only specified attributes', () => {
            querySelect = ['id', 'brand', 'description']
            const {select, fns} = entitySelectToMapSelect(querySelect, metadata.baseAttributesList)
            assert.deepStrictEqual(select, ["id", "brand", "description"])
            assert.deepStrictEqual(fns, [])
        })

        it ('attributes with related entity reference - should exclude external references', () => {
            querySelect = ['id', 'brand', 'description', 'prices']
            const {select, fns} = entitySelectToMapSelect(querySelect, metadata.baseAttributesList)
            assert.deepStrictEqual(select, ["id", "brand", "description"])
            assert.deepStrictEqual(fns, [])
        })

        it ('empty exclude object - should use all base attributes', () => {
            querySelect = { exclude: [] } as QuerySelect<Product>
            const {select, fns} = entitySelectToMapSelect(querySelect, metadata.baseAttributesList)
            assert.deepStrictEqual(select, ["id", "importer_id", "type", "brand", "model", "image", "description", 
                "variant", "variant_second", "active", "created", "updated"])
            assert.deepStrictEqual(fns, [])
        })
        
        it ('exclude array - should return attributes excluding specified ones', () => {
            querySelect = { exclude: ['id', 'type', 'brand'] } as QuerySelect<Product>
            const {select, fns} = entitySelectToMapSelect(querySelect, metadata.baseAttributesList)
            assert.deepStrictEqual(select, ["importer_id", "model", "image", "description", "variant", 
                "variant_second", "active", "created", "updated"])
            assert.deepStrictEqual(fns, [])
        })

    })

    describe('mapNestedSelects: Maps nested selects for related entities', () => {
        
        let query: Query<Product> = {}
        let subSelect: {subEntities:  SubMapSelect<Product>} | {} 
        
        it ('empty query - should return empty object', () => {
            subSelect = mapNestedSelects(query, tree)
            assert.deepStrictEqual(subSelect, {})
        })

        it ('query with only root select - should return empty object', () => {
            query = { select: ['id', 'brand'] }
            subSelect = mapNestedSelects(query, tree)
            assert.deepStrictEqual(subSelect, {})
        })

        it ('query with related entity (empty select) - should use all base attributes', () => {
            query = { select: ['id', 'brand'], prices: {}}
            subSelect = mapNestedSelects(query, tree)
            assert.ok(Object.keys(subSelect).length > 0);
            assert.deepStrictEqual(subSelect, {
                subEntities: {
                    prices: {
                        select: ['id', 'price', 'shop_id', 'url', 'product_id', 'active', 'updated', 'created']
                    }
                }
            })
        })

        it ('query with related entity (specific select) - should use only specified attributes', () => {
            query = { select: ['id', 'brand'], prices: {select: ['id', 'created']}}
            subSelect = mapNestedSelects(query, tree)
            assert.deepStrictEqual(subSelect, {
                subEntities: {
                    prices: {
                        select: ['id', 'created']
                    }
                }
            })
        })

        it ('query with deeply nested related entity - should map all nesting levels', () => {
            query = { select: ['id', 'brand'], prices: {select: ['id', 'created'], shop: {}}}
            subSelect = mapNestedSelects(query, tree)
            assert.deepStrictEqual(subSelect, {
                subEntities: {
                    prices: {
                        select: ['id', 'created'],
                        subEntities: {
                            shop: { select: [ 'id', 'name', 'founded', 'active', 'updated', 'created' ]}
                        }
                    }
                }
            })
        })

        it ('query with multiple nested relations - should map all relations', () => {
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
            subSelect = mapNestedSelects(query, tree)
            assert.deepStrictEqual(subSelect, {
                subEntities: {
                    prices: {
                        select: ["id", "price", "shop_id", "url", "product_id", "active", "updated", "created"],
                        subEntities: {
                            shop: {
                                select: ["id", "name", "founded", "active", "updated", "created"]
                            }
                        }
                    },
                    comments: {
                        select: ["id", "product_id", "user_id", "content", "active", "created", "updated"],
                    },
                    product_categories: {
                        select: ["id", "product_id", "category_id", "is_primary", "active", "created", "updated"],
                        subEntities: {
                            category: {
                                select: ["id", "name", "slug", "parent_id", "active", "created", "updated"],
                                subEntities: {
                                    parent: {
                                        select: ["id", "name", "slug", "parent_id", "active", "created", "updated"],
                                    }
                                }
                            }
                        }
                    },
                    specification_tree: {
                        select: ["id", "product_id", "specification_type", "active", "created", "updated"],
                    }
                }
            })
        })
        
    })

    describe('mapSelects: Complete mapping with base entity and nested selects', () => {
        
        const formater = new OutputFormater(productMetadata, tree, 'mysql')
        const mapSelects = formater.mapSelects.bind(formater)
        let query: Query<Product> = {}
        let mappedSelects: MapEntitySelect<Product>

        it ('empty query - should use all base attributes', () => {
            mappedSelects = mapSelects(query)
            assert.deepStrictEqual(mappedSelects, {
                select: ['id', 'importer_id', 'type', 'brand', 'model', 'image', 'description', 'variant', 
                    'variant_second', 'active', 'created', 'updated'],
                fns: []
            })
        })

        it ('query with specific root attributes - should use only those attributes', () => {
            query = { select: ['id', 'brand', 'description'] }
            mappedSelects = mapSelects(query)
            assert.deepStrictEqual(mappedSelects, {
                select: ['id', 'brand', 'description'],
                fns: []
            })
        })

        it ('query with nested entity - should map both root and nested', () => {
            query = { select: ['id', 'brand'], prices: {select: ['id', 'created']}}
            mappedSelects = mapSelects(query)
            assert.deepStrictEqual(mappedSelects, {
                select: ['id', 'brand'],
                fns: [],
                subEntities: {
                    prices: {
                        select: ['id', 'created']
                    }
                }
            })
        })

        it ('query with deeply nested entity - should map all nesting levels', () => {
            query = { select: ['id', 'brand'], prices: {select: ['id', 'created'], shop: {}}}
            mappedSelects = mapSelects(query)
            assert.deepStrictEqual(mappedSelects, {
                select: ['id', 'brand'],
                fns: [],
                subEntities: {
                    prices: {
                        select: ['id', 'created'],
                        subEntities: {
                            shop: { 
                                select: [ 'id', 'name', 'founded', 'active', 'updated', 'created' ]
                            }
                        }
                    }
                }
            })
        })

        it ('complex query with multiple nested relations - should map all correctly', () => {
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
            mappedSelects = mapSelects(query)
            assert.deepStrictEqual(mappedSelects, {
                select: ["id", "type", "brand", "model"],
                fns: [],
                subEntities: {
                    prices: {
                        select: ["price", "active"],
                        subEntities: {
                            shop: {
                                select: ["name"]
                            }
                        }
                    },
                    comments: {
                        select: ["content"],
                    },
                    product_categories: {
                        select: ["is_primary", "active"],
                        subEntities: {
                            category: {
                                select: ["name", "created"],
                                subEntities: {
                                    parent: {
                                        select: ["name"]
                                    }
                                }
                            }
                        }
                    },
                    specification_tree: {
                        select: ["specification_type"]
                    }
                }
            })
        })
    })
})