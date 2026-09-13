import { MetadataConstructor, EntityMetadata } from "node-repo/types"
import { EntityMetadataManager } from "node-repo"

//  *************************************************
//  1.  Product METADATA CONSTRUCTOR
//  2.  ProductImporter METADATA CONSTRUCTOR
//  3.  Price METADATA CONSTRUCTOR
//  4.  Shop METADATA CONSTRUCTOR
//  5.  Category METADATA CONSTRUCTOR
//  6.  ProductCategory METADATA CONSTRUCTOR
//  7.  SpecificationTree METADATA CONSTRUCTOR
//  8.  Specification METADATA CONSTRUCTOR
//  9.  User METADATA CONSTRUCTOR
//  10.  Comment METADATA CONSTRUCTOR
//  11.  Rate METADATA CONSTRUCTOR
//  12.  ProductClone METADATA CONSTRUCTOR
//  13.  Gadget METADATA CONSTRUCTOR
//  *************************************************


//  1.  Product CONSTRUCTOR & METADATA
const productConstructor: MetadataConstructor<any> = {
    base: {
        referenceNames: {
            singularName: 'Product',
            pluralName: 'Products'
        }
    },
    attributes: {
        id: {
            primaryKey: true,
            required: false,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        importer_id: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: true,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        type: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        brand: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        model: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        description: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        image: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        variant: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        variant_second: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        active: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        created: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        },
        updated: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        }
    }
}
const productMetadata: EntityMetadata<any> = new EntityMetadataManager(
    productConstructor,
    () => ({
        prices: {
            metadata: priceMetadata,
            relation: 'one to many'
        },
        comments: {
            metadata: commentMetadata,
            relation: 'one to many'
        },
        product_categories: {
            metadata: productCategoryMetadata,
            relation: 'one to many'
        },
        specification_tree: {
            metadata: specificationTreeMetadata,
            relation: 'one to one'
        },
        product_importer: {
            metadata: productImporterMetadata,
            relation: 'many to one'
        }
    })
)

//  2.  ProductImporter CONSTRUCTOR & METADATA
const productImporterConstructor: MetadataConstructor<any> = {
    base: {
        referenceNames: {
            singularName: 'ProductImporter',
            pluralName: 'ProductImporters'
        }
    },
    attributes: {
        id: {
            primaryKey: true,
            required: false,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        name: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        active: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        created: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        },
        updated: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        }
    }
}
const productImporterMetadata: EntityMetadata<any> = new EntityMetadataManager(
    productImporterConstructor,
    () => ({
        products: {
            metadata: productMetadata,
            relation: 'one to many'
        }
    })
)

//  3.  Price CONSTRUCTOR & METADATA
const priceConstructor: MetadataConstructor<any> = {
    base: {
        referenceNames: {
            singularName: 'Price',
            pluralName: 'Prices'
        }
    },
    attributes: {
        id: {
            primaryKey: true,
            required: false,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        price: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'decimal',
            type: 'number'
        },
        shop_id: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: true,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        url: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        active: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        product_id: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: true,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        created: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        },
        updated: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        }
    }
}
const priceMetadata: EntityMetadata<any> = new EntityMetadataManager(
    priceConstructor,
    () => ({
        product: {
            metadata: productMetadata,
            relation: 'many to one'
        },
        shop: {
            metadata: shopMetadata,
            relation: 'many to one'
        }
    })
)

//  4.  Shop CONSTRUCTOR & METADATA
const shopConstructor: MetadataConstructor<any> = {
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
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        name: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        founded: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        },
        active: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        created: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        },
        updated: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        }
    }
}
const shopMetadata: EntityMetadata<any> = new EntityMetadataManager(
    shopConstructor,
    () => ({
        prices: {
            metadata: priceMetadata,
            relation: 'one to many'
        }
    })
)

//  5.  Category CONSTRUCTOR & METADATA
const categoryConstructor: MetadataConstructor<any> = {
    base: {
        referenceNames: {
            singularName: 'Category',
            pluralName: 'Categories'
        }
    },
    attributes: {
        id: {
            primaryKey: true,
            required: false,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        name: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        slug: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        parent_id: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: true,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        active: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        created: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        },
        updated: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        }
    }
}
const categoryMetadata: EntityMetadata<any> = new EntityMetadataManager(
    categoryConstructor,
    () => ({
        children: {
            metadata: categoryMetadata,
            relation: 'one to many'
        },
        parent: {
            metadata: categoryMetadata,
            relation: 'many to one'
        },
        product_categories: {
            metadata: productCategoryMetadata,
            relation: 'one to many'
        }
    })
)

//  6.  ProductCategory CONSTRUCTOR & METADATA
const productCategoryConstructor: MetadataConstructor<any> = {
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
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        product_id: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: true,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        category_id: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: true,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        is_primary: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        active: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        created: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        },
        updated: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        }
    }
}
const productCategoryMetadata: EntityMetadata<any> = new EntityMetadataManager(
    productCategoryConstructor,
    () => ({
        category: {
            metadata: categoryMetadata,
            relation: 'many to one'
        },
        product: {
            metadata: productMetadata,
            relation: 'many to one'
        }
    })
)

//  7.  SpecificationTree CONSTRUCTOR & METADATA
const specificationTreeConstructor: MetadataConstructor<any> = {
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
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        product_id: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: true,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        specification_type: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'enum',
            type: 'string'
        },
        active: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        created: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        },
        updated: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        }
    }
}
const specificationTreeMetadata: EntityMetadata<any> = new EntityMetadataManager(
    specificationTreeConstructor,
    () => ({
        product: {
            metadata: productMetadata,
            relation: 'many to one'
        },
        specifications: {
            metadata: specificationMetadata,
            relation: 'one to many'
        }
    })
)

//  8.  Specification CONSTRUCTOR & METADATA
const specificationConstructor: MetadataConstructor<any> = {
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
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        specification_tree_id: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: true,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        specification: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        active: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        created: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        },
        updated: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        }
    }
}
const specificationMetadata: EntityMetadata<any> = new EntityMetadataManager(
    specificationConstructor,
    () => ({
        specification_tree: {
            metadata: specificationTreeMetadata,
            relation: 'many to one'
        }
    })
)

//  9.  User CONSTRUCTOR & METADATA
const userConstructor: MetadataConstructor<any> = {
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
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        name: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        login: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        email: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        password: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        active: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        created: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        },
        updated: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        }
    }
}
const userMetadata: EntityMetadata<any> = new EntityMetadataManager(
    userConstructor,
    () => ({
        comments: {
            metadata: commentMetadata,
            relation: 'one to many'
        },
        rates: {
            metadata: rateMetadata,
            relation: 'one to many'
        }
    })
)

//  10.  Comment CONSTRUCTOR & METADATA
const commentConstructor: MetadataConstructor<any> = {
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
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        product_id: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: true,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        user_id: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: true,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        content: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        active: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        created: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        },
        updated: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        }
    }
}
const commentMetadata: EntityMetadata<any> = new EntityMetadataManager(
    commentConstructor,
    () => ({
        product: {
            metadata: productMetadata,
            relation: 'many to one'
        },
        user: {
            metadata: userMetadata,
            relation: 'many to one'
        },
        rates: {
            metadata: rateMetadata,
            relation: 'one to many'
        }
    })
)

//  11.  Rate CONSTRUCTOR & METADATA
const rateConstructor: MetadataConstructor<any> = {
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
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        comment_id: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: true,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        user_id: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: true,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        rate: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        active: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        created: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        },
        updated: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        }
    }
}
const rateMetadata: EntityMetadata<any> = new EntityMetadataManager(
    rateConstructor,
    () => ({
        user: {
            metadata: userMetadata,
            relation: 'many to one'
        },
        comment: {
            metadata: commentMetadata,
            relation: 'many to one'
        }
    })
)

//  12.  ProductClone CONSTRUCTOR & METADATA
const productCloneConstructor: MetadataConstructor<any> = {
    base: {
        referenceNames: {
            singularName: 'ProductClone',
            pluralName: 'ProductClones'
        }
    },
    attributes: {
        id: {
            primaryKey: true,
            required: false,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        importer_id: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: true,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        type: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        brand: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        model: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        description: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        image: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        variant: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        variant_second: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        active: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        created: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        },
        updated: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        }
    }
}
const productCloneMetadata: EntityMetadata<any> = new EntityMetadataManager(
    productCloneConstructor,
    () => ({})
)

//  13.  Gadget CONSTRUCTOR & METADATA
const gadgetConstructor: MetadataConstructor<any> = {
    base: {
        referenceNames: {
            singularName: 'Gadget',
            pluralName: 'Gadgets'
        }
    },
    attributes: {
        id: {
            primaryKey: true,
            required: false,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        external_id: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'uuid',
            type: 'string'
        },
        sku: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        short_label: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        description: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        importer_id: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: true,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        price: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'decimal',
            type: 'number'
        },
        weight: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        ratio: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        rating: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
        },
        active: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        kind_on: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'date',
            type: 'date'
        },
        released_at: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        },
        payload: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'json',
            type: 'object'
        },
        specs: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'json',
            type: 'object'
        },
        image_data: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'binary',
            type: 'object'
        },
        kind: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'enum',
            type: 'string'
        },
        createdAt: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        },
        updatedAt: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
        }
    }
}
const gadgetMetadata: EntityMetadata<any> = new EntityMetadataManager(
    gadgetConstructor,
    () => ({})
)

export { 
    productConstructor,
    productImporterConstructor,
    priceConstructor,
    shopConstructor,
    categoryConstructor,
    productCategoryConstructor,
    specificationTreeConstructor,
    specificationConstructor,
    userConstructor,
    commentConstructor,
    rateConstructor,
    productCloneConstructor,
    gadgetConstructor
}
