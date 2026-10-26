//  *************************************************
//  1.  ProductType ENTITY
//  2.  ProductCategory ENTITY
//  3.  Laptop ENTITY
//  4.  Price ENTITY
//  5.  CollectJob ENTITY
//  6.  User ENTITY
//  7.  UserToken ENTITY
//  *************************************************

export interface ProductType {
    id: number 
    name: string 
    slug: string 
    active: boolean 
    created: Date 
    updated: Date 
}

export interface ProductCategory {
    id: number 
    name: string 
    type: number 
    slug: string 
    description: string | null
    active: boolean 
    created: Date 
    updated: Date 
}

export interface Laptop extends Product {
    id: number 
    type: string 
    brand: string 
    model: string 
    image_low: string | null
    image_high: string | null
    description: string | null
    variant: string 
    variant_second: string | null
    variant_ean: string | null
    active: boolean 
    created: Date 
    updated: Date 
    category: string | null
    processor: string 
    processor_short: string | null
    processor_cores: string | null
    ram_size: string | null
    ram_speed: string | null
    ram_type: string | null
    disk_type: string | null
    disk_size: string | null
    disk_slot_available: boolean | null
    touchscreen: boolean | null
    screen_type: string | null
    screen_coat: string | null
    screen_size: string | null
    screen_resolution: string | null
    screen_refresh: string | null
    graphic_card: string 
    graphic_card_short: string | null
    graphic_card_memory: string | null
    graphic_card_tgp: string | null
    ports: string | null
    battery_type: string | null
    color: string | null
    material: string | null
    operating_system: string | null
    weight: string | null    

    //******EXTERNAL REFERENCES******
    ProductType?: ProductType    
    ProductCategory?: ProductCategory    
    CollectJob?: CollectJob    
    prices?: Price[]
}

export interface Price {
    id: number 
    price: number 
    shop: string 
    url: string 
    active: boolean 
    product_id: number 
    created: Date 
    updated: Date     

    //******EXTERNAL REFERENCES******
    laptop?: Laptop    
    CollectJob?: CollectJob
}

export interface CollectJob {
    id: number 
    pid: string 
    on_targets: string 
    expiration_date: Date 
    active: boolean 
    created: Date 
    updated: Date     

    //******EXTERNAL REFERENCES******
    laptops?: Laptop[]    
    prices?: Price[]
}

export interface User {
    id: number 
    login: string 
    password: string 
    email: string 
    created: Date 
    updated: Date 
    active: boolean 
    verified: boolean 
    super_user: boolean     

    //******EXTERNAL REFERENCES******
    user_token?: UserToken
}

export interface UserToken {
    id: number 
    user_id: number 
    token: string 
    expiration_date: Date 
    created: Date 
    updated: Date 
    active: boolean     

    //******EXTERNAL REFERENCES******
    User?: User
}

export interface Product {
    id: number,
    type: string, 
    brand: string,
    model: string,
    image_low: string | null,
    image_high: string | null,
    description: string | null,
    variant: string,
    variant_second: string | null,
    variant_ean: string | null,
    active: boolean,
    created: Date,
    updated: Date,
    category: string | null
    prices?: Price[]
}