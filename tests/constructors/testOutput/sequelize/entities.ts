
//  *************************************************
//  1.  Product ENTITY
//  2.  ProductImporter ENTITY
//  3.  Price ENTITY
//  4.  Shop ENTITY
//  5.  Category ENTITY
//  6.  ProductCategory ENTITY
//  7.  SpecificationTree ENTITY
//  8.  Specification ENTITY
//  9.  User ENTITY
//  10.  Comment ENTITY
//  11.  Rate ENTITY
//  12.  ProductClone ENTITY
//  13.  Gadget ENTITY
//  *************************************************

export interface Product {
    id: number 
    importer_id: number | null
    type: string 
    brand: string 
    model: string 
    description: string | null
    image: string | null
    variant: string 
    variant_second: string | null
    active: boolean 
    created: Date 
    updated: Date     

    //******EXTERNAL REFERENCES******
    prices?: Price[]    
    comments?: Comment[]    
    product_categories?: ProductCategory[]    
    specification_tree?: SpecificationTree    
    product_importer?: ProductImporter
}

export interface ProductImporter {
    id: number 
    name: string 
    active: boolean 
    created: Date 
    updated: Date     

    //******EXTERNAL REFERENCES******
    products?: Product[]
}

export interface Price {
    id: number 
    price: number 
    shop_id: number 
    url: string 
    active: boolean 
    product_id: number 
    created: Date 
    updated: Date     

    //******EXTERNAL REFERENCES******
    product?: Product    
    shop?: Shop
}

export interface Shop {
    id: number 
    name: string 
    founded: Date | null
    active: boolean 
    created: Date 
    updated: Date     

    //******EXTERNAL REFERENCES******
    prices?: Price[]
}

export interface Category {
    id: number 
    name: string 
    slug: string 
    parent_id: number | null
    active: boolean 
    created: Date 
    updated: Date     

    //******EXTERNAL REFERENCES******
    children?: Category[]    
    parent?: Category    
    product_categories?: ProductCategory[]
}

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

export interface SpecificationTree {
    id: number 
    product_id: number 
    specification_type: string 
    active: boolean 
    created: Date 
    updated: Date     

    //******EXTERNAL REFERENCES******
    product?: Product    
    specifications?: Specification[]
}

export interface Specification {
    id: number 
    specification_tree_id: number 
    specification: string 
    active: boolean 
    created: Date 
    updated: Date     

    //******EXTERNAL REFERENCES******
    specification_tree?: SpecificationTree
}

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

export interface Comment {
    id: number 
    product_id: number 
    user_id: number 
    content: string 
    active: boolean 
    created: Date 
    updated: Date     

    //******EXTERNAL REFERENCES******
    product?: Product    
    user?: User    
    rates?: Rate[]
}

export interface Rate {
    id: number 
    comment_id: number 
    user_id: number 
    rate: number 
    active: boolean 
    created: Date 
    updated: Date     

    //******EXTERNAL REFERENCES******
    user?: User    
    comment?: Comment
}

export interface ProductClone {
    id: number 
    importer_id: number | null
    type: string 
    brand: string 
    model: string 
    description: string | null
    image: string | null
    variant: string 
    variant_second: string | null
    active: boolean 
    created: Date 
    updated: Date 
}

export interface Gadget {
    id: number 
    external_id: string 
    sku: string 
    short_label: string | null
    description: string | null
    importer_id: number | null
    price: number 
    weight: number 
    ratio: number | null
    rating: number | null
    active: boolean 
    kind_on: Date | null
    released_at: Date | null
    payload: object | null
    specs: object | null
    image_data: object | null
    kind: string 
    createdAt: Date 
    updatedAt: Date 
}

