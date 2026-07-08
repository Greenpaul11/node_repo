import Decimal from "decimal.js"
/**
 * Product - main entity representing a product in the system
 * 
 * Relations:
 * - hasMany Price (one product can have multiple prices from different shops)
 * - hasMany Comments (one product can have multiple comments)
 * - hasMany ProductCategory (one product can have multiple categories)
 * - hasOne SpecificationTree (enforced one-to-one via unique constraint on product_id)
 * - belongsTo ProductImporter (many products have one importer)
 */
export interface Product {
    id: number 
    importer_id: number | null
    type: string                    
    brand: string                   
    model: string                   
    image: string | null            
    description: string | null      
    variant: string                 
    variant_second: string | null   
    active: boolean
    created: Date
    updated: Date
    
    //******EXTERNAL REFERENCES******
    prices?: Price[]  
    comments?: Comment[]
    product_categories?: ProductCategory[]
    specification_tree?: SpecificationTree | null   
    product_importer?: ProductImporter | null  
}

/**
 * ProductImporter - represents a company responsible for bringing products into market
 * 
 * Relations: 
 * hasMany Products (one importer can have multiple products)
 */
export interface ProductImporter {
    id: number
    name: string
    active: boolean
    created: Date
    updated: Date

    //******EXTERNAL REFERENCES******
    products: Product[]
}

/**
 * Price - represents a price offer for a product at a specific shop
 * 
 * Relations:
 * - belongsTo Product (many prices per product)
 * - belongsTo Shop (many prices per shop)
 */
export interface Price {
    id: number
    price: Decimal                  
    shop_id: number                 
    url: string                     
    product_id: number              
    active: boolean
    updated: Date
    created: Date
    
    //******EXTERNAL REFERENCES******
    shop?: Shop                     
    product?: Product               
}

/**
 * Comment - represents a user comment/review on a product
 * 
 * Relations:
 * - belongsTo User (each comment belongs to one user)
 * - belongsTo Product (each comment is written for one product)
 * - hasMany Rates (each comment can has many rates)
 */
export interface Comment {
    id: number
    product_id: number   
    user_id: number         
    content: string               
    active: boolean
    created: Date
    updated: Date

    //******EXTERNAL REFERENCES******
    user?: User
    product?: Product
    rates?: Rate[]         
}

/**
 * Rating - represents a rating of the comment
 * 
 * Relations:
 * - belongsTo Comment (each Rate is attatched to one comment)
 * - belongsTo User (each Rate is created by one user)
 */
export interface Rate {
    id: number
    comment_id: number
    user_id: number                      
    rate: number       
    active: boolean
    created: Date
    updated: Date

    //******EXTERNAL REFERENCES******
    comment?: Comment
    user?: User
}

/**
 * User - represents user entity
 * 
 * Relation:
 * - hasMany Rates (user can create multiple rates)
 * - hasMany Comments (user can create multiple comments)
 */
export interface User {
    id: number
    name: string
    login: string
    email: string
    password: string
    active: boolean
    created: Date
    updated: Date

    //******EXTERNAL REFERENCES******
    comments?: Comment[]
    rates?: Rate[]
}

/**
 * Shop - represents an online or physical store
 * 
 * Relations:
 * - hasMany Price (one shop can have multiple price offers for diffrent products)
 */
export interface Shop {
    id: number
    name: string                    
    founded: Date | null            
    active: boolean
    updated: Date
    created: Date
    
    //******EXTERNAL REFERENCES******
    prices?: Price[]             
}


/**
 * Category - product categories with hierarchical structure
 * 
 * Relations:
 * - ManyToMany with Product through ProductCategory 
 * - hasMany Category (self-referencing via parent_id for tree structure)
 * - belongsTo Category (as children)
 */
export interface Category {
    id: number
    name: string                  
    slug: string                  
    parent_id: number | null      
    active: boolean
    created: Date
    updated: Date

    //******EXTERNAL REFERENCES******
    parent?: Category
    children?: Category[]
    product_categories?: ProductCategory[]
}

/**
 * ProductCategory - junction table for Product and Category 
 * Links products to categories.
 * 
 * Relations:
 * - belongsTo Product
 * - belongsTo Category
 */
export interface ProductCategory {
    id: number
    product_id: number              
    category_id: number             
    is_primary: boolean             
    active: boolean
    created: Date
    updated: Date

    //******EXTERNAL REFERENCES******
    category?: Category
    product?: Product
}

/**
 * SpecificationTree - links a Product to its specific type of Specification.
 *
 * Relations:
 * - hasOne Product - product can has one SpecificationTree and vice versa
 * - hasMany Specification - product can has diffrent specifications
 */
export interface SpecificationTree {
    id: number
    product_id: number        
    specification_type: 'laptop' | 'monitor' | 'tablet' | 'smartphone' | 'headphones'
    active: boolean
    created: Date
    updated: Date

    //******EXTERNAL REFERENCES******
    product?: Product
    specifications?: Specification[]
}

/**
 * Specification  - represent specification for product
 * 
 * Relations:
 * - belongsTo SpecificationTree
 */

export interface Specification {
    id: number
    specification_tree_id: number
    specification: string
    active: boolean
    created: Date
    updated: Date

    //******EXTERNAL REFERENCES******
    specification_tree?: SpecificationTree;
}















































