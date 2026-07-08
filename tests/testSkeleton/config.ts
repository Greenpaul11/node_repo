import { EntityConfig, EntityMetadata } from "../../src/types/entity/Metadata"
import { EntityMetadataManager } from "../../src/metadata/entityMetadataMenager"
import { Product, ProductImporter, Price, Shop, Comment, Category, 
    ProductCategory, SpecificationTree, Specification, 
    User, Rate 
} from './entities'


//  *************************************************
//  1.  SHOP METADATA
//  2.  PRICE METADATA
//  3.  PRODUCT METADATA
//  4.  COMMENT METADATA
//  5.  CATEGORY METADATA
//  6.  PRODUCT CATEGORY METADATA
//  7.  SPECIFICATION TREE METADATA
//  8.  SPECIFICATION METADATA
//  9.  USER METADATA
//  10. RATE METADATA
//  11. PRODUCT IMPORTER METADATA
//  *************************************************


//  1.  SHOP METADATA
const shopAttributesConfig: EntityConfig<Shop> = {
    base: {
        referenceNames: {
            singularName: 'shop',
            pluralName: 'shops'
        }
    },
    attributes: {
        id: {
            primaryKey: true,
            required: false,
            allowNull: false,
            associated: null,
            locked: true,
            asRange: false,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        name: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: false,
            fieldType: 'string',
            type: 'string'
        },
        founded: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        },
        active: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        updated: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        },
        created: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        }
    }
}

const shopMetadata = new EntityMetadataManager(
    shopAttributesConfig, 
    () => ( { prices: { metadata: priceMetadata, relation: 'one to many' } })
)

//  2.  PRICE METADATA
const priceAttributesConfig: EntityConfig<Price> = {
    base: {
        referenceNames: {
            singularName: 'price',
            pluralName: 'prices'
        }
    },
    attributes: {
        id: {
            primaryKey: true,
            required: false,
            allowNull: false,
            associated: null,
            locked: true,
            asRange: false,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        price: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            setAttributes: '{ "step": "0.01" }',
            fieldType: 'decimal',
            type: 'decimal'
        },
        shop_id: {
            required: true,
            allowNull: false,
            associated: 'inside',
            locked: true,
            asRange: false,
            searchIn: null,
            fieldType: 'number',
            type: 'number',
            as: 'laptop'
        },
        url: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: false,
            fieldType: 'string',
            type: 'string'
        },
        product_id: {
            required: true,
            allowNull: false,
            associated: 'inside',
            locked: true,
            asRange: false,
            searchIn: null,
            type: 'number',
            fieldType: 'number',
            as: 'laptop'
        },
        active: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        updated: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        },
        created: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        }
    }
}

const priceMetadata: EntityMetadata<Price> = new EntityMetadataManager<Price>(
    priceAttributesConfig, 
    () => ({ 
        shop: { metadata: shopMetadata, relation: 'many to one' }, 
        product: { metadata: productMetadata, relation: 'many to one' }
    })  
)

//  3.  PRODUCT METADATA
const productAttributesConfig: EntityConfig<Product> = {
    base: {
        referenceNames: {
            singularName: 'product',
            pluralName: 'products'
        }
    },
    attributes: {
        id: {
            primaryKey: true,
            required: false,
            allowNull: false,
            associated: null,
            locked: true,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        importer_id: {
            required: true,
            allowNull: false,
            associated: 'inside',
            locked: true,
            asRange: false,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        type: {
            required: false,
            allowNull: false,
            associated: null,
            locked: true,
            asRange: false,
            searchIn: false,
            fieldType: 'string',
            type: 'string'
        },
        brand: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: false,
            fieldType: 'string',
            type: 'string'
        },
        model: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: true,
            fieldType: 'string',
            type: 'string'
        },
        image: {
            required: false,
            allowNull: true,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: false,
            fieldType: 'string',
            type: 'string'
        },
        description: {
            required: true,
            allowNull: true,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: true,
            fieldType: 'text',
            type: 'string'
        },
        variant: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: true,
            fieldType: 'string',
            type: 'string'
        },
        variant_second: {
            required: false,
            allowNull: true,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: true,
            fieldType: 'string',
            type: 'string'
        },
        active: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        created: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        },
        updated: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        }
    }
}

const productMetadata: EntityMetadata<Product> = new EntityMetadataManager<Product>(
    productAttributesConfig, 
    () => ({ 
        prices: { metadata: priceMetadata, relation: 'one to many' },
        comments: { metadata: commentMetadata, relation: 'one to many' },
        product_categories: { metadata: productCategoryMetadata, relation: 'one to many' },
        specification_tree: { metadata: specificationTreeMetadata, relation: 'one to one'},
        product_importer: { metadata: productImporterMetadata, relation: 'many to one'}
    })
)

//  14. COMMENT METADATA 
const commentAttributesConfig: EntityConfig<Comment> = {
    base: {
        referenceNames: {
            singularName: 'comment',
            pluralName: 'comments'
        }
    },
    attributes: {
        id: {
            primaryKey: true,
            required: false,
            allowNull: false,
            associated: null,
            locked: true,
            asRange: false,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        product_id: {
            required: true,
            allowNull: false,
            associated: 'inside',
            locked: true,
            asRange: false,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        user_id: {
            required: true,
            allowNull: false,
            associated: 'inside',
            locked: true,
            asRange: false,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        content: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: true,
            fieldType: 'text',
            type: 'string'
        },
        active: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        created: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        },
        updated: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        }
    }
}

const commentMetadata: EntityMetadata<Comment> = new EntityMetadataManager<Comment>(
    commentAttributesConfig,
    () => ({ 
        product: { metadata: productMetadata, relation: 'many to one' },
        user: { metadata: userMetadata, relation: 'many to one' },
        rates: { metadata: rateMetadata, relation: 'one to many' }
    })
)

//  5.  CATEGORY METADATA
const categoryAttributesConfig: EntityConfig<Category> = {
    base: {
        referenceNames: {
            singularName: 'category',
            pluralName: 'categories'
        }
    },
    attributes: {
        id: {
            primaryKey: true,
            required: false,
            allowNull: false,
            associated: null,
            locked: true,
            asRange: false,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        name: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: true,
            fieldType: 'string',
            type: 'string'
        },
        slug: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: true,
            fieldType: 'string',
            type: 'string'
        },
        parent_id: {
            required: false,
            allowNull: true,
            associated: 'inside',
            locked: true,
            asRange: false,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        active: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        created: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        },
        updated: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        }
    }
}

const categoryMetadata: EntityMetadata<Category> = new EntityMetadataManager<Category>(
    categoryAttributesConfig,
    () => ({ 
        parent: { metadata: categoryMetadata, relation: 'many to one' },
        children: { metadata: categoryMetadata, relation: 'one to many' },
        product_categories: { metadata: productCategoryMetadata, relation: 'one to many' }
    })
)

//  6.  PRODUCT CATEGORY METADATA
const productCategoryAttributesConfig: EntityConfig<ProductCategory> = {
    base: {
        referenceNames: {
            singularName: 'product_category',
            pluralName: 'product_categories'
        }
    },
    attributes: {
        id: {
            primaryKey: true,
            required: false,
            allowNull: false,
            associated: null,
            locked: true,
            asRange: false,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        product_id: {
            required: true,
            allowNull: false,
            associated: 'inside',
            locked: true,
            asRange: false,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        category_id: {
            required: true,
            allowNull: false,
            associated: 'inside',
            locked: true,
            asRange: false,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        is_primary: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        active: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        created: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        },
        updated: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        }
    }
}

const productCategoryMetadata: EntityMetadata<ProductCategory> = new EntityMetadataManager<ProductCategory>(
    productCategoryAttributesConfig,
    () => ({ 
        product: { metadata: productMetadata, relation: 'many to one' },
        category: { metadata: categoryMetadata, relation: 'many to one' }
    })
)

//  7.  SPECIFICATION TREE METADATA
const specificationTreeAttributesConfig: EntityConfig<SpecificationTree> = {
    base: {
        referenceNames: {
            singularName: 'specification_tree',
            pluralName: 'specification_trees'
        }
    },
    attributes: {
        id: {
            primaryKey: true,
            required: false,
            allowNull: false,
            associated: null,
            locked: true,
            asRange: false,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        product_id: {
            required: true,
            allowNull: false,
            associated: 'inside',
            locked: true,
            asRange: false,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        specification_type: {
            required: true,
            allowNull: false,
            associated: null,
            locked: true,
            asRange: false,
            searchIn: false,
            fieldType: 'string',
            type: 'string'
        },
        active: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        created: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        },
        updated: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        }
    }
}

const specificationTreeMetadata: EntityMetadata<SpecificationTree> = new EntityMetadataManager<SpecificationTree>(
    specificationTreeAttributesConfig,
    () => ({ 
        product: { metadata: productMetadata, relation: 'one to one' },
        specifications: { metadata: specificationMetadata, relation: 'one to many' } 
    })
)

//  8.  SPECIFICATION METADATA
const specificationAttributesConfig: EntityConfig<Specification> = {
    base: {
        referenceNames: {
            singularName: 'specification',
            pluralName: 'specifications'
        }
    },
    attributes: {
        id: {
            primaryKey: true,
            required: false,
            allowNull: false,
            associated: null,
            locked: true,
            asRange: false,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        specification_tree_id: {
            required: true,
            allowNull: false,
            associated: 'inside',
            locked: true,
            asRange: false,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        specification: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: true,
            fieldType: 'string',
            type: 'string'
        },
        active: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        created: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        },
        updated: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        }
    }
}

const specificationMetadata: EntityMetadata<Specification> = new EntityMetadataManager<Specification>(
    specificationAttributesConfig,
    () => ({ specification_tree: { metadata: specificationTreeMetadata, relation: 'many to one' }})
)


//  13.  USER METADATA
const userAttributesConfig: EntityConfig<User> = {
    base: {
        referenceNames: {
            singularName: 'user',
            pluralName: 'users'
        }
    },
    attributes: {
        id: {
            primaryKey: true,
            required: false,
            allowNull: false,
            associated: null,
            locked: true,
            asRange: false,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        name: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: true,
            fieldType: 'string',
            type: 'string'
        },
        login: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: true,
            fieldType: 'string',
            type: 'string'
        },
        email: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: true,
            fieldType: 'string',
            type: 'string'
        },
        password: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: false,
            fieldType: 'string',
            type: 'string'
        },
        active: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        created: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        },
        updated: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        }
    }
}

const userMetadata: EntityMetadata<User> = new EntityMetadataManager<User>(
    userAttributesConfig,
    () => ({ 
        comments: { metadata: commentMetadata, relation: 'one to many' },
        rates: { metadata: rateMetadata, relation: 'one to many' }
    })
)

//  14. RATE METADATA
const rateAttributesConfig: EntityConfig<Rate> = {
    base: {
        referenceNames: {
            singularName: 'rate',
            pluralName: 'rates'
        }
    },
    attributes: {
        id: {
            primaryKey: true,
            required: false,
            allowNull: false,
            associated: null,
            locked: true,
            asRange: false,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        comment_id: {
            required: true,
            allowNull: false,
            associated: 'inside',
            locked: true,
            asRange: false,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        user_id: {
            required: true,
            allowNull: false,
            associated: 'inside',
            locked: true,
            asRange: false,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        rate: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            setAttributes: '{ "step": "1", "min": "1", "max": "5" }',
            fieldType: 'number',
            type: 'number'
        },
        active: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        created: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        },
        updated: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        }
    }
}


const rateMetadata: EntityMetadata<Rate> = new EntityMetadataManager<Rate>(
    rateAttributesConfig,
    () => ({ 
        comment: { metadata: commentMetadata, relation: 'many to one' },
        user: { metadata: userMetadata, relation: 'many to one' }
    })
)


export const productImporterAttributesConfig: EntityConfig<ProductImporter> = {
    base: {
        referenceNames: {
            singularName: 'product_importer',
            pluralName: 'product_importers'
        }
    },
    attributes: {
        id: {
            primaryKey: true,
            required: false,
            allowNull: false,
            associated: null,
            locked: true,
            asRange: false,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        name: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: false,
            fieldType: 'string',
            type: 'string'
        },
        active: {
            required: true,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        created: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        },
        updated: {
            required: false,
            allowNull: false,
            associated: null,
            locked: false,
            asRange: true,
            searchIn: null,
            fieldType: 'object',
            type: 'date'
        }
    }
}

const productImporterMetadata: EntityMetadata<ProductImporter> = new EntityMetadataManager<ProductImporter>(
    productImporterAttributesConfig,
    () => ({ 
        products: { metadata: productMetadata, relation: 'one to many' },
    })
)

export { 
    shopMetadata , 
    priceMetadata, 
    productMetadata,
    commentMetadata,
    rateMetadata,
    userMetadata,
    categoryMetadata,
    productCategoryMetadata,
    specificationTreeMetadata,
    specificationMetadata,
    productImporterMetadata
}


















































































































































