import { Product, Price, Shop, Category, ProductCategory, ProductImporter } from '../entities'
import { EntityCreationAttributes, EntityCreation } from '../../../src/types/entity/Creation';
import { Expand } from '../../../src/types/Global';
import { TransformNullishToOptional } from '../../../src/types/Global';

export const productImporterData: EntityCreationAttributes<ProductImporter>[] = [
    {
        id: 1,
        name: 'Apple Poland',
        active: true,
        created: new Date('2023-01-01T00:00:00Z'),
        updated: new Date('2023-01-01T00:00:00Z')
    },
    {
        id: 2,
        name: 'Samsung Electronics',
        active: true,
        created: new Date('2023-02-01T00:00:00Z'),
        updated: new Date('2023-02-01T00:00:00Z')
    },
    {
        id: 3,
        name: 'Dell Technologies',
        active: true,
        created: new Date('2023-03-01T00:00:00Z'),
        updated: new Date('2023-03-01T00:00:00Z')
    }
];

export const productData: EntityCreationAttributes<Product>[] = [
    {
        id: 1,
        importer_id: 1,
        type: 'laptop',
        brand: 'Apple',
        model: 'MacBook Air M2',
        image: 'https://cdn.example.com/products/mba-m2.jpg',
        description: 'Ultra-thin laptop with Apple M2 chip, 8-core CPU, and 8-core GPU.',
        variant: 'TestVariant',
        variant_second: 'TestVariantSecond',
        active: true,
        created: new Date('2024-01-01T12:00:00Z'),
        updated: new Date('2024-02-15T09:30:00Z')

    },
    {
        id: 2,
        importer_id: 2,
        type: 'smartphone',
        brand: 'Samsung',
        model: 'Galaxy S23',
        image: null,
        description: null,
        variant: 'C11kkkccc',
        variant_second: null,
        active: true,
        created: new Date('2024-03-01T10:00:00Z'),
        updated: new Date('2024-03-01T10:00:00Z')
    },
    {
        id: 3,
        importer_id: 3,
        type: 'monitor',
        brand: 'Dell',
        model: 'U2723QE',
        image: 'https://cdn.example.com/products/dell-u27.png',
        description: '4K USB-C Hub Monitor with IPS Black technology.',
        variant: 'hiddddd',
        variant_second: 'sdddddddd',
        active: false,
        created: new Date('2023-05-10T15:00:00Z'),
        updated: new Date('2023-12-01T11:20:00Z')
    }
];

export const priceData: EntityCreationAttributes<Price>[] = [
    {
        id: 1,
        price: 5499.99,
        shop_id: 10, 
        url: 'https://x-kom.pl',
        product_id: 1,
        active: true,
        updated: new Date('2024-02-15T09:30:00Z'),
        created: new Date('2024-01-01T12:00:00Z')
    },
    {
        id: 2,
        price: 5399.00,
        shop_id: 20, 
        url: 'https://mediaexpert.pl',
        product_id: 1,
        active: true,
        updated: new Date('2024-02-14T08:00:00Z'),
        created: new Date('2024-01-05T10:00:00Z')
    },
    {
        id: 3,
        price: 3299.50,
        shop_id: 10,
        url: 'https://x-kom.pl',
        product_id: 2,
        active: true,
        updated: new Date('2024-03-01T10:00:00Z'),
        created: new Date('2024-03-01T10:00:00Z')
    },
    {
        id: 4,
        price: 2499.00,
        shop_id: 30,
        url: 'https://morele.net',
        product_id: 3,
        active: false,
        updated: new Date('2023-12-01T11:20:00Z'),
        created: new Date('2023-05-10T15:00:00Z')
    }
];

export const shopData: EntityCreationAttributes<Shop>[] = [
    {
        id: 10,
        name: 'X-Kom',
        founded: new Date('2002-01-01T00:00:00Z'),
        active: true,
        updated: new Date('2024-01-01T12:00:00Z'),
        created: new Date('2020-01-01T12:00:00Z')
    },
    {
        id: 20,
        name: 'Media Expert',
        founded: new Date('2002-10-01T00:00:00Z'),
        active: true,
        updated: new Date('2024-01-01T12:00:00Z'),
        created: new Date('2020-01-01T12:00:00Z')
    },
    {
        id: 30,
        name: 'Morele',
        founded: null,
        active: false,
        updated: new Date('2023-12-01T11:20:00Z'),
        created: new Date('2020-01-01T12:00:00Z')
    }
];

export const categoryData: EntityCreationAttributes<Category>[] = [
    {
        id: 1,
        name: 'Electronics',
        slug: 'electronics',
        parent_id: null,
        active: true,
        created: new Date('2023-01-01T00:00:00Z'),
        updated: new Date('2023-01-01T00:00:00Z')
    },
    {
        id: 2,
        name: 'Laptops',
        slug: 'laptops',
        parent_id: 1,
        active: true,
        created: new Date('2023-01-02T00:00:00Z'),
        updated: new Date('2023-01-02T00:00:00Z')
    },
    {
        id: 3,
        name: 'Smartphones',
        slug: 'smartphones',
        parent_id: 1,
        active: true,
        created: new Date('2023-01-03T00:00:00Z'),
        updated: new Date('2023-01-03T00:00:00Z')
    },
    {
        id: 4,
        name: 'Monitors',
        slug: 'monitors',
        parent_id: 1,
        active: true,
        created: new Date('2023-01-04T00:00:00Z'),
        updated: new Date('2023-01-04T00:00:00Z')
    },
    {
        id: 5,
        name: 'Gaming Laptops',
        slug: 'gaming-laptops',
        parent_id: 2,
        active: true,
        created: new Date('2023-02-01T00:00:00Z'),
        updated: new Date('2023-02-01T00:00:00Z')
    },
    {
        id: 6,
        name: 'Business Laptops',
        slug: 'business-laptops',
        parent_id: 2,
        active: false,
        created: new Date('2023-02-02T00:00:00Z'),
        updated: new Date('2023-06-15T00:00:00Z')
    },
    {
        id: 7,
        name: 'Tablets',
        slug: 'tablets',
        parent_id: 1,
        active: true,
        created: new Date('2023-03-01T00:00:00Z'),
        updated: new Date('2023-03-01T00:00:00Z')
    },
    {
        id: 8,
        name: 'Wearables',
        slug: 'wearables',
        parent_id: 1,
        active: true,
        created: new Date('2023-03-02T00:00:00Z'),
        updated: new Date('2023-03-02T00:00:00Z')
    },
    {
        id: 9,
        name: 'Audio',
        slug: 'audio',
        parent_id: 1,
        active: true,
        created: new Date('2023-03-03T00:00:00Z'),
        updated: new Date('2023-03-03T00:00:00Z')
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