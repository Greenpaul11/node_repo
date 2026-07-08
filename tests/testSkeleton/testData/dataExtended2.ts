import { Price, Comment, Shop, SpecificationTree, User, Rate, 
    Category, ProductCategory, Specification } from '../entities'
import { EntityCreationAttributes } from '../../../src/types/entity/Creation';

export const priceData: EntityCreationAttributes<Price>[] = [
    {
        id: 15,
        price: 8399.00,
        shop_id: 30,
        url: 'https://morele.net',
        product_id: 4,
        active: true,
        updated: new Date('2024-04-07T11:00:00Z'),
        created: new Date('2024-04-02T10:00:00Z')
    },
    {
        id: 16,
        price: 5249.00,
        shop_id: 20,
        url: 'https://mediaexpert.pl',
        product_id: 5,
        active: true,
        updated: new Date('2024-02-02T10:00:00Z'),
        created: new Date('2024-01-12T09:00:00Z')
    },
    {
        id: 17,
        price: 6399.00,
        shop_id: 10,
        url: 'https://x-kom.pl',
        product_id: 6,
        active: false,
        updated: new Date('2024-02-21T09:00:00Z'),
        created: new Date('2024-02-21T09:00:00Z')
    },
    {
        id: 18,
        price: 3449.00,
        shop_id: 10,
        url: 'https://x-kom.pl',
        product_id: 7,
        active: false,
        updated: new Date('2024-01-06T08:00:00Z'),
        created: new Date('2023-11-18T10:00:00Z')
    },
    {
        id: 19,
        price: 1199.00,
        shop_id: 20,
        url: 'https://mediaexpert.pl',
        product_id: 8,
        active: true,
        updated: new Date('2023-08-21T10:00:00Z'),
        created: new Date('2023-08-21T10:00:00Z')
    },
    {
        id: 20,
        price: 5799.00,
        shop_id: 10,
        url: 'https://x-kom.pl',
        product_id: 9,
        active: false,
        updated: new Date('2024-03-16T10:00:00Z'),
        created: new Date('2024-03-16T10:00:00Z')
    },
    {
        id: 21,
        price: 2749.00,
        shop_id: 20,
        url: 'https://mediaexpert.pl',
        product_id: 10,
        active: true,
        updated: new Date('2023-12-11T09:00:00Z'),
        created: new Date('2023-12-11T09:00:00Z')
    },
    {
        id: 22,
        price: 2649.00,
        shop_id: 30,
        url: 'https://morele.net',
        product_id: 10,
        active: false,
        updated: new Date('2023-12-12T11:00:00Z'),
        created: new Date('2023-12-12T11:00:00Z')
    },
    {
        id: 23,
        price: 4249.00,
        shop_id: 10,
        url: 'https://x-kom.pl',
        product_id: 11,
        active: false,
        updated: new Date('2024-02-06T10:00:00Z'),
        created: new Date('2024-02-06T10:00:00Z')
    },
    {
        id: 24,
        price: 4099.00,
        shop_id: 30,
        url: 'https://morele.net',
        product_id: 11,
        active: false,
        updated: new Date('2024-02-07T12:00:00Z'),
        created: new Date('2024-02-07T12:00:00Z')
    },
    {
        id: 25,
        price: 4299.00,
        shop_id: 20,
        url: 'https://mediaexpert.pl',
        product_id: 11,
        active: true,
        updated: new Date('2024-02-08T09:00:00Z'),
        created: new Date('2024-02-08T09:00:00Z')
    },
    {
        id: 26,
        price: 1899.00,
        shop_id: 20,
        url: 'https://mediaexpert.pl',
        product_id: 12,
        active: true,
        updated: new Date('2024-01-21T10:00:00Z'),
        created: new Date('2024-01-21T10:00:00Z')
    },
    {
        id: 27,
        price: 1799.00,
        shop_id: 30,
        url: 'https://morele.net',
        product_id: 12,
        active: false,
        updated: new Date('2024-01-22T09:00:00Z'),
        created: new Date('2024-01-22T09:00:00Z')
    },
    {
        id: 28,
        price: 1879.00,
        shop_id: 10,
        url: 'https://x-kom.pl',
        product_id: 12,
        active: false,
        updated: new Date('2024-01-23T12:00:00Z'),
        created: new Date('2024-01-23T12:00:00Z')
    },
    {
        id: 29,
        price: 1829.00,
        shop_id: 20,
        url: 'https://mediaexpert.pl',
        product_id: 12,
        active: false,
        updated: new Date('2024-01-24T11:00:00Z'),
        created: new Date('2024-01-24T11:00:00Z')
    }
];


export const shopData: EntityCreationAttributes<Shop>[] = [
    {
        id: 40,
        name: 'Komputronik',
        founded: new Date('2004-03-15T00:00:00Z'),
        active: true,
        updated: new Date('2024-04-01T10:00:00Z'),
        created: new Date('2024-04-01T10:00:00Z')
    },
    {
        id: 50,
        name: 'RTV Euro AGD',
        founded: new Date('2005-06-01T00:00:00Z'),
        active: true,
        updated: new Date('2024-04-01T10:00:00Z'),
        created: new Date('2024-04-01T10:00:00Z')
    },
    {
        id: 60,
        name: 'Allegro',
        founded: new Date('1999-12-01T00:00:00Z'),
        active: true,
        updated: new Date('2024-04-01T10:00:00Z'),
        created: new Date('2024-04-01T10:00:00Z')
    }
];

export const commentData: EntityCreationAttributes<Comment>[] = [
    {
        id: 1,
        product_id: 1,
        user_id: 1,
        content: 'Great laptop for everyday use. Battery life is excellent.',
        active: true,
        created: new Date('2024-01-15T10:00:00Z'),
        updated: new Date('2024-01-15T10:00:00Z')
    },
    {
        id: 2,
        product_id: 1,
        user_id: 2,
        content: 'Perfect for development work. M2 chip handles everything smoothly.',
        active: true,
        created: new Date('2024-02-01T14:30:00Z'),
        updated: new Date('2024-02-01T14:30:00Z')
    },
    {
        id: 3,
        product_id: 1,
        user_id: 3,
        content: 'Good but keyboard could be better.',
        active: true,
        created: new Date('2024-02-10T09:15:00Z'),
        updated: new Date('2024-02-10T09:15:00Z')
    },
    {
        id: 4,
        product_id: 2,
        user_id: 1,
        content: 'Amazing camera quality!',
        active: true,
        created: new Date('2024-03-05T11:00:00Z'),
        updated: new Date('2024-03-05T11:00:00Z')
    },
    {
        id: 5,
        product_id: 2,
        user_id: 2,
        content: 'Smooth performance but battery could last longer.',
        active: true,
        created: new Date('2024-03-10T16:45:00Z'),
        updated: new Date('2024-03-10T16:45:00Z')
    },
    {
        id: 6,
        product_id: 3,
        user_id: 3,
        content: 'Best 4K monitor for productivity.',
        active: true,
        created: new Date('2023-06-01T12:00:00Z'),
        updated: new Date('2023-06-01T12:00:00Z')
    },
    {
        id: 7,
        product_id: 3,
        user_id: 1,
        content: 'Excellent color accuracy for design work.',
        active: false,
        created: new Date('2023-07-15T08:30:00Z'),
        updated: new Date('2023-11-20T10:00:00Z')
    },
    {
        id: 8,
        product_id: 4,
        user_id: 2,
        content: 'M3 chip is a beast! Handles all my tasks with ease.',
        active: true,
        created: new Date('2024-04-05T15:00:00Z'),
        updated: new Date('2024-04-05T15:00:00Z')
    },
    {
        id: 9,
        product_id: 5,
        user_id: 3,
        content: 'Titanium build feels premium. Camera is incredible.',
        active: true,
        created: new Date('2024-01-20T10:00:00Z'),
        updated: new Date('2024-01-25T12:00:00Z')
    },
    {
        id: 10,
        product_id: 6,
        user_id: 1,
        content: 'Best Samsung phone yet. AI features are useful.',
        active: true,
        created: new Date('2024-02-25T09:00:00Z'),
        updated: new Date('2024-02-25T09:00:00Z')
    },
    {
        id: 11,
        product_id: 7,
        user_id: 2,
        content: 'Great gaming monitor. 240Hz is buttery smooth.',
        active: true,
        created: new Date('2023-12-01T14:00:00Z'),
        updated: new Date('2023-12-01T14:00:00Z')
    },
    {
        id: 12,
        product_id: 8,
        user_id: 3,
        content: 'Best noise cancellation on the market.',
        active: true,
        created: new Date('2023-09-01T11:00:00Z'),
        updated: new Date('2023-09-01T11:00:00Z')
    },
    {
        id: 13,
        product_id: 9,
        user_id: 1,
        content: 'Solid business laptop. Build quality is top-notch.',
        active: true,
        created: new Date('2024-03-20T13:00:00Z'),
        updated: new Date('2024-03-20T13:00:00Z')
    },
    {
        id: 14,
        product_id: 10,
        user_id: 2,
        content: 'Perfect tablet for students. Lightweight and powerful.',
        active: true,
        created: new Date('2023-12-20T10:00:00Z'),
        updated: new Date('2023-12-20T10:00:00Z')
    },
    {
        id: 15,
        product_id: 11,
        user_id: 3,
        content: 'Pure Android experience. Love the AI features.',
        active: true,
        created: new Date('2024-02-10T15:00:00Z'),
        updated: new Date('2024-02-10T15:00:00Z')
    },
    {
        id: 16,
        product_id: 12,
        user_id: 1,
        content: 'Great health tracking features.',
        active: true,
        created: new Date('2024-01-25T09:00:00Z'),
        updated: new Date('2024-01-25T09:00:00Z')
    },
    {
        id: 17,
        product_id: 13,
        user_id: 2,
        content: 'Professional grade display. Worth the price.',
        active: true,
        created: new Date('2024-05-10T12:00:00Z'),
        updated: new Date('2024-05-10T12:00:00Z')
    }  
];

export const specificationTreeData: EntityCreationAttributes<SpecificationTree>[] = [
    {
        id: 1,
        product_id: 1,
        specification_type: 'laptop',
        active: true,
        created: new Date('2024-01-01T12:00:00Z'),
        updated: new Date('2024-02-15T09:30:00Z')
    },
    {
        id: 2,
        product_id: 2,
        specification_type: 'smartphone',
        active: true,
        created: new Date('2024-03-01T10:00:00Z'),
        updated: new Date('2024-03-01T10:00:00Z')
    },
    {
        id: 3,
        product_id: 3,
        specification_type: 'monitor',
        active: true,
        created: new Date('2023-05-10T15:00:00Z'),
        updated: new Date('2023-12-01T11:20:00Z')
    },
    {
        id: 4,
        product_id: 4,
        specification_type: 'laptop',
        active: true,
        created: new Date('2024-04-01T10:00:00Z'),
        updated: new Date('2024-04-01T10:00:00Z')
    },
    {
        id: 5,
        product_id: 5,
        specification_type: 'smartphone',
        active: true,
        created: new Date('2024-01-10T08:00:00Z'),
        updated: new Date('2024-02-01T12:00:00Z')
    },
    {
        id: 6,
        product_id: 6,
        specification_type: 'smartphone',
        active: true,
        created: new Date('2024-02-20T14:00:00Z'),
        updated: new Date('2024-02-20T14:00:00Z')
    },
    {
        id: 7,
        product_id: 7,
        specification_type: 'monitor',
        active: true,
        created: new Date('2023-11-15T09:00:00Z'),
        updated: new Date('2024-01-05T10:00:00Z')
    },
    {
        id: 8,
        product_id: 8,
        specification_type: 'headphones',
        active: true,
        created: new Date('2023-08-20T11:00:00Z'),
        updated: new Date('2023-08-20T11:00:00Z')
    },
    {
        id: 9,
        product_id: 9,
        specification_type: 'laptop',
        active: true,
        created: new Date('2024-03-15T13:00:00Z'),
        updated: new Date('2024-03-15T13:00:00Z')
    },
    {
        id: 10,
        product_id: 10,
        specification_type: 'tablet',
        active: true,
        created: new Date('2023-12-10T10:00:00Z'),
        updated: new Date('2023-12-10T10:00:00Z')
    },
    {
        id: 11,
        product_id: 11,
        specification_type: 'smartphone',
        active: true,
        created: new Date('2024-02-05T16:00:00Z'),
        updated: new Date('2024-02-05T16:00:00Z')
    },
    {
        id: 12,
        product_id: 12,
        specification_type: 'headphones',
        active: true,
        created: new Date('2024-01-20T09:00:00Z'),
        updated: new Date('2024-01-20T09:00:00Z')
    },
    {
        id: 13,
        product_id: 13,
        specification_type: 'monitor',
        active: true,
        created: new Date('2024-05-01T12:00:00Z'),
        updated: new Date('2024-05-01T12:00:00Z')
    }
];

export const categoryData: EntityCreationAttributes<Category>[] = [
    {
        id: 10,
        name: 'Pro Laptops',
        slug: 'pro-laptops',
        parent_id: 1,
        active: true,
        created: new Date('2024-04-01T10:00:00Z'),
        updated: new Date('2024-04-01T10:00:00Z')
    },
    {
        id: 11,
        name: 'Gaming Smartphones',
        slug: 'gaming-smartphones',
        parent_id: 1,
        active: true,
        created: new Date('2024-04-02T10:00:00Z'),
        updated: new Date('2024-04-02T10:00:00Z')
    },
    {
        id: 12,
        name: 'Gaming Monitors',
        slug: 'gaming-monitors',
        parent_id: 1,
        active: true,
        created: new Date('2024-04-03T10:00:00Z'),
        updated: new Date('2024-04-03T10:00:00Z')
    },
    {
        id: 13,
        name: 'Wireless Audio',
        slug: 'wireless-audio',
        parent_id: 1,
        active: true,
        created: new Date('2024-04-04T10:00:00Z'),
        updated: new Date('2024-04-04T10:00:00Z')
    },
    {
        id: 14,
        name: 'Ultraportable Laptops',
        slug: 'ultraportable-laptops',
        parent_id: 1,
        active: true,
        created: new Date('2024-04-05T10:00:00Z'),
        updated: new Date('2024-04-05T10:00:00Z')
    },
    {
        id: 15,
        name: 'Flagship Tablets',
        slug: 'flagship-tablets',
        parent_id: 1,
        active: true,
        created: new Date('2024-04-06T10:00:00Z'),
        updated: new Date('2024-04-06T10:00:00Z')
    },
    {
        id: 16,
        name: 'Android Phones',
        slug: 'android-phones',
        parent_id: 1,
        active: true,
        created: new Date('2024-04-07T10:00:00Z'),
        updated: new Date('2024-04-07T10:00:00Z')
    },
    {
        id: 17,
        name: 'Smartwatches',
        slug: 'smartwatches',
        parent_id: 1,
        active: true,
        created: new Date('2024-04-08T10:00:00Z'),
        updated: new Date('2024-04-08T10:00:00Z')
    },
    {
        id: 18,
        name: 'Professional Monitors',
        slug: 'professional-monitors',
        parent_id: 1,
        active: true,
        created: new Date('2024-04-09T10:00:00Z'),
        updated: new Date('2024-04-09T10:00:00Z')
    }
];

export const productCategoryData: EntityCreationAttributes<ProductCategory>[] = [
    {
        id: 1,
        product_id: 1,
        category_id: 2,
        is_primary: true,
        active: true,
        created: new Date('2024-01-01T12:00:00Z'),
        updated: new Date('2024-01-01T12:00:00Z')
    },
    {
        id: 2,
        product_id: 1,
        category_id: 5,
        is_primary: false,
        active: true,
        created: new Date('2024-01-01T12:00:00Z'),
        updated: new Date('2024-01-01T12:00:00Z')
    },
    {
        id: 3,
        product_id: 2,
        category_id: 3,
        is_primary: true,
        active: true,
        created: new Date('2024-03-01T10:00:00Z'),
        updated: new Date('2024-03-01T10:00:00Z')
    },
    {
        id: 4,
        product_id: 3,
        category_id: 4,
        is_primary: true,
        active: true,
        created: new Date('2023-05-10T15:00:00Z'),
        updated: new Date('2023-05-10T15:00:00Z')
    },
    {
        id: 5,
        product_id: 4,
        category_id: 2,
        is_primary: true,
        active: true,
        created: new Date('2024-04-01T10:00:00Z'),
        updated: new Date('2024-04-01T10:00:00Z')
    },
    {
        id: 6,
        product_id: 4,
        category_id: 5,
        is_primary: false,
        active: true,
        created: new Date('2024-04-01T10:00:00Z'),
        updated: new Date('2024-04-01T10:00:00Z')
    },
    {
        id: 7,
        product_id: 5,
        category_id: 3,
        is_primary: true,
        active: true,
        created: new Date('2024-01-10T08:00:00Z'),
        updated: new Date('2024-02-01T12:00:00Z')
    },
    {
        id: 8,
        product_id: 6,
        category_id: 3,
        is_primary: true,
        active: true,
        created: new Date('2024-02-20T14:00:00Z'),
        updated: new Date('2024-02-20T14:00:00Z')
    },
    {
        id: 9,
        product_id: 7,
        category_id: 4,
        is_primary: true,
        active: true,
        created: new Date('2023-11-15T09:00:00Z'),
        updated: new Date('2024-01-05T10:00:00Z')
    },
    {
        id: 10,
        product_id: 8,
        category_id: 9,
        is_primary: true,
        active: true,
        created: new Date('2023-08-20T11:00:00Z'),
        updated: new Date('2023-08-20T11:00:00Z')
    },
    {
        id: 11,
        product_id: 9,
        category_id: 2,
        is_primary: true,
        active: true,
        created: new Date('2024-03-15T13:00:00Z'),
        updated: new Date('2024-03-15T13:00:00Z')
    },
    {
        id: 12,
        product_id: 9,
        category_id: 6,
        is_primary: false,
        active: true,
        created: new Date('2024-03-15T13:00:00Z'),
        updated: new Date('2024-03-15T13:00:00Z')
    },
    {
        id: 13,
        product_id: 10,
        category_id: 7,
        is_primary: true,
        active: true,
        created: new Date('2023-12-10T10:00:00Z'),
        updated: new Date('2023-12-10T10:00:00Z')
    },
    {
        id: 14,
        product_id: 11,
        category_id: 3,
        is_primary: true,
        active: true,
        created: new Date('2024-02-05T16:00:00Z'),
        updated: new Date('2024-02-05T16:00:00Z')
    },
    {
        id: 15,
        product_id: 12,
        category_id: 8,
        is_primary: true,
        active: true,
        created: new Date('2024-01-20T09:00:00Z'),
        updated: new Date('2024-01-20T09:00:00Z')
    },
    {
        id: 16,
        product_id: 13,
        category_id: 4,
        is_primary: true,
        active: true,
        created: new Date('2024-05-01T12:00:00Z'),
        updated: new Date('2024-05-01T12:00:00Z')
    }
];

export const userData: EntityCreationAttributes<User>[] = [
    {
        id: 1,
        name: 'John Doe',
        login: 'johndoe',
        email: 'john@example.com',
        password: 'hashed_password_1',
        active: true,
        created: new Date('2023-01-01T00:00:00Z'),
        updated: new Date('2023-01-01T00:00:00Z')
    },
    {
        id: 2,
        name: 'Jane Smith',
        login: 'janesmith',
        email: 'jane@example.com',
        password: 'hashed_password_2',
        active: true,
        created: new Date('2023-02-01T00:00:00Z'),
        updated: new Date('2023-02-01T00:00:00Z')
    },
    {
        id: 3,
        name: 'Bob Wilson',
        login: 'bobwilson',
        email: 'bob@example.com',
        password: 'hashed_password_3',
        active: true,
        created: new Date('2023-03-01T00:00:00Z'),
        updated: new Date('2023-03-01T00:00:00Z')
    }    
]

export const rateData: EntityCreationAttributes<Rate>[] = [
    {
        id: 1,
        comment_id: 1,
        user_id: 2,
        rate: 5,
        active: true,
        created: new Date('2024-01-16T10:00:00Z'),
        updated: new Date('2024-01-16T10:00:00Z')
    },
    {
        id: 2,
        comment_id: 1,
        user_id: 3,
        rate: 4,
        active: true,
        created: new Date('2024-01-17T11:00:00Z'),
        updated: new Date('2024-01-17T11:00:00Z')
    },
    {
        id: 3,
        comment_id: 2,
        user_id: 1,
        rate: 5,
        active: true,
        created: new Date('2024-02-02T14:00:00Z'),
        updated: new Date('2024-02-02T14:00:00Z')
    },
    {
        id: 4,
        comment_id: 3,
        user_id: 2,
        rate: 3,
        active: true,
        created: new Date('2024-02-11T09:00:00Z'),
        updated: new Date('2024-02-11T09:00:00Z')
    },
    {
        id: 5,
        comment_id: 4,
        user_id: 3,
        rate: 5,
        active: true,
        created: new Date('2024-03-06T12:00:00Z'),
        updated: new Date('2024-03-06T12:00:00Z')
    }    
]

export const specificationData: EntityCreationAttributes<Specification>[] = [
    {
        id: 1,
        specification_tree_id: 1,
        specification: 'CPU: Apple M2, Display: 13.6", Memory: 8GB LPDDR5',
        active: true,
        created: new Date('2024-01-01T12:00:00Z'),
        updated: new Date('2024-02-15T09:30:00Z')
    },
    {
        id: 2,
        specification_tree_id: 1,
        specification: 'Screen: 13.6" Liquid Retina, 2560x1664',
        active: true,
        created: new Date('2024-01-02T12:00:00Z'),
        updated: new Date('2024-02-15T09:30:00Z')
    },
    {
        id: 3,
        specification_tree_id: 2,
        specification: 'CPU: Snapdragon 8 Gen 2, Display: 6.1", Memory: 8GB',
        active: true,
        created: new Date('2024-03-01T10:00:00Z'),
        updated: new Date('2024-03-01T10:00:00Z')
    },
    {
        id: 4,
        specification_tree_id: 2,
        specification: 'Camera: 50MP main, 12MP ultrawide',
        active: true,
        created: new Date('2024-03-01T10:00:00Z'),
        updated: new Date('2024-03-01T10:00:00Z')
    },
    {
        id: 5,
        specification_tree_id: 3,
        specification: 'Resolution: 3840x2160, Size: 27", Refresh Rate: 60Hz',
        active: true,
        created: new Date('2023-05-10T15:00:00Z'),
        updated: new Date('2023-12-01T11:20:00Z')
    },
    {
        id: 6,
        specification_tree_id: 3,
        specification: 'Panel: IPS Black, USB-C Hub',
        active: true,
        created: new Date('2023-05-11T15:00:00Z'),
        updated: new Date('2023-12-01T11:20:00Z')
    },
    {
        id: 7,
        specification_tree_id: 4,
        specification: 'CPU: Apple M3, Display: 14.2", Memory: 16GB LPDDR5',
        active: true,
        created: new Date('2024-04-01T10:00:00Z'),
        updated: new Date('2024-04-01T10:00:00Z')
    },
    {
        id: 8,
        specification_tree_id: 4,
        specification: 'GPU: 10-core, Storage: 512GB SSD',
        active: true,
        created: new Date('2024-04-01T10:00:00Z'),
        updated: new Date('2024-04-01T10:00:00Z')
    },
    {
        id: 9,
        specification_tree_id: 5,
        specification: 'CPU: A17 Pro, Display: 6.1", Memory: 8GB',
        active: true,
        created: new Date('2024-01-10T08:00:00Z'),
        updated: new Date('2024-02-01T12:00:00Z')
    },
    {
        id: 10,
        specification_tree_id: 5,
        specification: 'Titanium frame, 5x optical zoom',
        active: true,
        created: new Date('2024-01-11T08:00:00Z'),
        updated: new Date('2024-02-01T12:00:00Z')
    },
    {
        id: 11,
        specification_tree_id: 6,
        specification: 'CPU: Snapdragon 8 Gen 3, Display: 6.8", Memory: 12GB',
        active: true,
        created: new Date('2024-02-20T14:00:00Z'),
        updated: new Date('2024-02-20T14:00:00Z')
    },
    {
        id: 12,
        specification_tree_id: 7,
        specification: 'Resolution: 2560x1440, Size: 32", Refresh Rate: 240Hz',
        active: true,
        created: new Date('2023-11-15T09:00:00Z'),
        updated: new Date('2024-01-05T10:00:00Z')
    },
    {
        id: 13,
        specification_tree_id: 7,
        specification: 'Response: 1ms, G-Sync compatible',
        active: true,
        created: new Date('2023-11-15T09:00:00Z'),
        updated: new Date('2024-01-05T10:00:00Z')
    },
    {
        id: 14,
        specification_tree_id: 8,
        specification: 'Driver: 30mm, Frequency: 4Hz-40000Hz, Wireless: true',
        active: true,
        created: new Date('2023-08-20T11:00:00Z'),
        updated: new Date('2023-08-20T11:00:00Z')
    },
    {
        id: 15,
        specification_tree_id: 8,
        specification: 'Noise Cancellation: Sony WH-1000XM5',
        active: true,
        created: new Date('2023-08-20T11:00:00Z'),
        updated: new Date('2023-08-20T11:00:00Z')
    },
    {
        id: 16,
        specification_tree_id: 9,
        specification: 'CPU: Intel Core i7-1365U, Display: 13.4", Memory: 16GB LPDDR5',
        active: true,
        created: new Date('2024-03-15T13:00:00Z'),
        updated: new Date('2024-03-15T13:00:00Z')
    },
    {
        id: 17,
        specification_tree_id: 9,
        specification: 'Touchscreen, 4K UHD display',
        active: true,
        created: new Date('2024-03-15T13:00:00Z'),
        updated: new Date('2024-03-15T13:00:00Z')
    },
    {
        id: 18,
        specification_tree_id: 10,
        specification: 'CPU: Apple M1, Display: 10.9", Memory: 8GB',
        active: true,
        created: new Date('2023-12-10T10:00:00Z'),
        updated: new Date('2023-12-10T10:00:00Z')
    },
    {
        id: 19,
        specification_tree_id: 10,
        specification: 'Storage: 64GB, Camera: 12MP',
        active: true,
        created: new Date('2023-12-10T10:00:00Z'),
        updated: new Date('2023-12-10T10:00:00Z')
    },
    {
        id: 20,
        specification_tree_id: 11,
        specification: 'CPU: Tensor G3, Display: 6.7", Memory: 12GB',
        active: true,
        created: new Date('2024-02-05T16:00:00Z'),
        updated: new Date('2024-02-05T16:00:00Z')
    },
    {
        id: 21,
        specification_tree_id: 11,
        specification: 'AI features, 7 years updates',
        active: true,
        created: new Date('2024-02-05T16:00:00Z'),
        updated: new Date('2024-02-05T16:00:00Z')
    },
    {
        id: 22,
        specification_tree_id: 12,
        specification: 'Driver: 30mm, Frequency: 4Hz-40000Hz, Wireless: true',
        active: true,
        created: new Date('2024-01-20T09:00:00Z'),
        updated: new Date('2024-01-20T09:00:00Z')
    },
    {
        id: 23,
        specification_tree_id: 13,
        specification: 'Resolution: 3840x2160, Size: 27", Refresh Rate: 60Hz',
        active: true,
        created: new Date('2024-05-01T12:00:00Z'),
        updated: new Date('2024-05-01T12:00:00Z')
    }
];


export const stringifyDataValues = (object: object) =>  Object.fromEntries(
    Object.entries(object).map(([key, value]) => {
        if (value instanceof Date) {
            return [key, value.toISOString()];
        }
        if (value === null || value === undefined) {
            return [key, ""];
        }
        return [key, String(value)];
    })
);