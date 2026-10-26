import { MetadataConstructor, EntityMetadata } from "../../src/types/index.js"
import { EntityMetadataManager } from "../../src/index.js"
import {
    ProductType, ProductCategory, Laptop, Price,
    CollectJob, User, UserToken
} from "./entities.js"

//  *************************************************
//  1.  ProductType METADATA CONSTRUCTOR
//  2.  ProductCategory METADATA CONSTRUCTOR
//  3.  Laptop METADATA CONSTRUCTOR
//  4.  Price METADATA CONSTRUCTOR
//  5.  CollectJob METADATA CONSTRUCTOR
//  6.  User METADATA CONSTRUCTOR
//  7.  UserToken METADATA CONSTRUCTOR
//  *************************************************


//  1.  ProductType CONSTRUCTOR & METADATA
const productTypeConstructor: MetadataConstructor<ProductType> = {
    base: {
        referenceNames: {
            singularName: 'ProductType',
            pluralName: 'ProductTypes'
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

const productTypeMetadata: EntityMetadata<ProductType> = new EntityMetadataManager(
    productTypeConstructor,
    () => ({})
)

//  2.  ProductCategory CONSTRUCTOR & METADATA
const productCategoryConstructor: MetadataConstructor<ProductCategory> = {
    base: {
        referenceNames: {
            singularName: 'ProductCategory',
            pluralName: 'ProductCategories'
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
        type: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: true,
            asRange: true,
            searchIn: null,
            fieldType: 'number',
            type: 'number'
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

const productCategoryMetadata: EntityMetadata<ProductCategory> = new EntityMetadataManager(
    productCategoryConstructor,
    () => ({})
)

//  3.  Laptop CONSTRUCTOR & METADATA
const laptopConstructor: MetadataConstructor<Laptop> = {
    base: {
        referenceNames: {
            singularName: 'laptop',
            pluralName: 'laptops'
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
        type: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: true,
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
        image_low: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        image_high: {
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
        variant_ean: {
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
        },
        category: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: true,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        processor: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        processor_short: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        processor_cores: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        ram_size: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        ram_speed: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        ram_type: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        disk_type: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        disk_size: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        disk_slot_available: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        touchscreen: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        screen_type: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        screen_coat: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        screen_size: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        screen_resolution: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        screen_refresh: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        graphic_card: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        graphic_card_short: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        graphic_card_memory: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        graphic_card_tgp: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        ports: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        battery_type: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        color: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        material: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        operating_system: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        weight: {
            primaryKey: false,
            required: false,
            allowNull: true,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        }
    }
}

const laptopMetadata: EntityMetadata<Laptop> = new EntityMetadataManager(
    laptopConstructor,
    () => ({
        ProductType: {
            metadata: productTypeMetadata,
            relation: 'many to one'
        },
        ProductCategory: {
            metadata: productCategoryMetadata,
            relation: 'many to one'
        },
        CollectJob: {
            metadata: collectJobMetadata,
            relation: 'many to one'
        },
        prices: {
            metadata: priceMetadata,
            relation: 'one to many'
        }
    })
)

//  4.  Price CONSTRUCTOR & METADATA
const priceConstructor: MetadataConstructor<Price> = {
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
        shop: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
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

const priceMetadata: EntityMetadata<Price> = new EntityMetadataManager(
    priceConstructor,
    () => ({
        laptop: {
            metadata: laptopMetadata,
            relation: 'many to one'
        },
        CollectJob: {
            metadata: collectJobMetadata,
            relation: 'many to one'
        }
    })
)

//  5.  CollectJob CONSTRUCTOR & METADATA
const collectJobConstructor: MetadataConstructor<CollectJob> = {
    base: {
        referenceNames: {
            singularName: 'CollectJob',
            pluralName: 'CollectJobs'
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
        pid: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        on_targets: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        expiration_date: {
            primaryKey: false,
            required: true,
            allowNull: false,
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

const collectJobMetadata: EntityMetadata<CollectJob> = new EntityMetadataManager(
    collectJobConstructor,
    () => ({
        laptops: {
            metadata: laptopMetadata,
            relation: 'one to many'
        },
        prices: {
            metadata: priceMetadata,
            relation: 'one to many'
        }
    })
)

//  6.  User CONSTRUCTOR & METADATA
const userConstructor: MetadataConstructor<User> = {
    base: {
        referenceNames: {
            singularName: 'User',
            pluralName: 'Users'
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
        verified: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        },
        super_user: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'boolean',
            type: 'boolean'
        }
    }
}

const userMetadata: EntityMetadata<User> = new EntityMetadataManager(
    userConstructor,
    () => ({
        user_token: {
            metadata: userTokenMetadata,
            relation: 'one to one'
        }
    })
)

//  7.  UserToken CONSTRUCTOR & METADATA
const userTokenConstructor: MetadataConstructor<UserToken> = {
    base: {
        referenceNames: {
            singularName: 'user_token',
            pluralName: 'user_tokens'
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
        token: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: false,
            searchIn: null,
            fieldType: 'string',
            type: 'string'
        },
        expiration_date: {
            primaryKey: false,
            required: true,
            allowNull: false,
            associated: false,
            asRange: true,
            searchIn: null,
            fieldType: 'datetime',
            type: 'date'
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
        }
    }
}

const userTokenMetadata: EntityMetadata<UserToken> = new EntityMetadataManager(
    userTokenConstructor,
    () => ({
        User: {
            metadata: userMetadata,
            relation: 'many to one'
        }
    })
)

export { 
    productTypeConstructor,
    productCategoryConstructor,
    laptopConstructor,
    priceConstructor,
    collectJobConstructor,
    userConstructor,
    userTokenConstructor,
    productTypeMetadata,
    productCategoryMetadata,
    laptopMetadata,
    priceMetadata,
    collectJobMetadata,
    userMetadata,
    userTokenMetadata
}
