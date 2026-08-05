import { EntityConstructor } from "../../../../../src/types/entity/Metadata"


//  *************************************************
//  1.  Product ATTRIBUTES CONFIG
//  2.  ProductImporter ATTRIBUTES CONFIG
//  3.  Price ATTRIBUTES CONFIG
//  4.  Shop ATTRIBUTES CONFIG
//  5.  Category ATTRIBUTES CONFIG
//  6.  ProductCategory ATTRIBUTES CONFIG
//  7.  SpecificationTree ATTRIBUTES CONFIG
//  8.  Specification ATTRIBUTES CONFIG
//  9.  User ATTRIBUTES CONFIG
//  10.  Comment ATTRIBUTES CONFIG
//  11.  Rate ATTRIBUTES CONFIG
//  12.  ProductClone ATTRIBUTES CONFIG
//  13.  Gadget ATTRIBUTES CONFIG
//  *************************************************


//  1.  Product ATTRIBUTES CONFIG
const productAttributesConfig: EntityConstructor<Product> = {
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

//  2.  ProductImporter ATTRIBUTES CONFIG
const productImporterAttributesConfig: EntityConstructor<ProductImporter> = {
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

//  3.  Price ATTRIBUTES CONFIG
const priceAttributesConfig: EntityConstructor<Price> = {
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
            type: 'decimal'
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

//  4.  Shop ATTRIBUTES CONFIG
const shopAttributesConfig: EntityConstructor<Shop> = {
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

//  5.  Category ATTRIBUTES CONFIG
const categoryAttributesConfig: EntityConstructor<Category> = {
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

//  6.  ProductCategory ATTRIBUTES CONFIG
const productCategoryAttributesConfig: EntityConstructor<ProductCategory> = {
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

//  7.  SpecificationTree ATTRIBUTES CONFIG
const specificationTreeAttributesConfig: EntityConstructor<SpecificationTree> = {
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

//  8.  Specification ATTRIBUTES CONFIG
const specificationAttributesConfig: EntityConstructor<Specification> = {
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

//  9.  User ATTRIBUTES CONFIG
const userAttributesConfig: EntityConstructor<User> = {
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

//  10.  Comment ATTRIBUTES CONFIG
const commentAttributesConfig: EntityConstructor<Comment> = {
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

//  11.  Rate ATTRIBUTES CONFIG
const rateAttributesConfig: EntityConstructor<Rate> = {
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

//  12.  ProductClone ATTRIBUTES CONFIG
const productCloneAttributesConfig: EntityConstructor<ProductClone> = {
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

//  13.  Gadget ATTRIBUTES CONFIG
const gadgetAttributesConfig: EntityConstructor<Gadget> = {
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
            type: 'decimal'
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

export { 
    productAttributesConfig,
    productImporterAttributesConfig,
    priceAttributesConfig,
    shopAttributesConfig,
    categoryAttributesConfig,
    productCategoryAttributesConfig,
    specificationTreeAttributesConfig,
    specificationAttributesConfig,
    userAttributesConfig,
    commentAttributesConfig,
    rateAttributesConfig,
    productCloneAttributesConfig,
    gadgetAttributesConfig
}
