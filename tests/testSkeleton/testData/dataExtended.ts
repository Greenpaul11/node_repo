import { Product, Price } from '../entities'
import { EntityCreationAttributes } from '../../../src/types/entity/Creation';

export const productData: EntityCreationAttributes<Product>[] = [
    {
        id: 4,
        importer_id: 1,
        type: 'laptop',
        brand: 'Apple',
        model: 'MacBook Pro M3',
        image: 'https://example.com',
        description: 'Next-gen Pro laptop with M3 chip.',
        variant: 'M3-16-512',
        variant_second: 'BK-2024',
        active: true,
        created: new Date('2024-04-01T10:00:00Z'),
        updated: new Date('2024-04-01T10:00:00Z')
    },
    {
        id: 5,
        importer_id: 2,
        type: 'smartphone',
        brand: 'Apple',
        model: 'iPhone 15 Pro',
        image: null,
        description: 'Titanium built smartphone.',
        variant: '15P-256',
        variant_second: null,
        active: true,
        created: new Date('2024-01-10T08:00:00Z'),
        updated: new Date('2024-02-01T12:00:00Z')
    },
    {
        id: 6,
        importer_id: 2,
        type: 'smartphone',
        brand: 'Samsung',
        model: 'Galaxy S24 Ultra',
        image: null,
        description: 'AI-driven mobile experience.',
        variant: 'S24U-512',
        variant_second: 'GR-TIT',
        active: true,
        created: new Date('2024-02-20T14:00:00Z'),
        updated: new Date('2024-02-20T14:00:00Z')
    },
    {
        id: 7,
        importer_id: 3,
        type: 'monitor',
        brand: 'Samsung',
        model: 'Odyssey G7',
        image: null,
        description: 'High-speed gaming monitor.',
        variant: 'G7-32-QHD',
        variant_second: null,
        active: true,
        created: new Date('2023-11-15T09:00:00Z'),
        updated: new Date('2024-01-05T10:00:00Z')
    },
    {
        id: 8,
        importer_id: 1,
        type: 'headphones',
        brand: 'Sony',
        model: 'WH-1000XM5',
        image: null,
        description: 'Noise canceling headphones.',
        variant: 'XM5-WRLS',
        variant_second: 'B-STD',
        active: true,
        created: new Date('2023-08-20T11:00:00Z'),
        updated: new Date('2023-08-20T11:00:00Z')
    },
    {
        id: 9,
        importer_id: 3,
        type: 'laptop',
        brand: 'Dell',
        model: 'XPS 13',
        image: null,
        description: 'Ultra-portable laptop.',
        variant: 'XPS-13-9315',
        variant_second: 'PLT-16',
        active: true,
        created: new Date('2024-03-15T13:00:00Z'),
        updated: new Date('2024-03-15T13:00:00Z')
    },
    {
        id: 10,
        importer_id: 1,
        type: 'tablet',
        brand: 'Apple',
        model: 'iPad Air',
        image: null,
        description: 'Powerful and light tablet.',
        variant: 'AIR-M1-64',
        variant_second: 'BL-WiFi',
        active: true,
        created: new Date('2023-12-10T10:00:00Z'),
        updated: new Date('2023-12-10T10:00:00Z')
    },
    {
        id: 11,
        importer_id: 2,
        type: 'smartphone',
        brand: 'Google',
        model: 'Pixel 8 Pro',
        image: null,
        description: 'The best of Google hardware.',
        variant: 'P8P-128',
        variant_second: 'BY-BLU',
        active: true,
        created: new Date('2024-02-05T16:00:00Z'),
        updated: new Date('2024-02-05T16:00:00Z')
    },
    {
        id: 12,
        importer_id: 1,
        type: 'watch',
        brand: 'Apple',
        model: 'Watch Series 9',
        image: null,
        description: 'Advanced health tracking.',
        variant: 'S9-45-GPS',
        variant_second: 'AL-MID',
        active: true,
        created: new Date('2024-01-20T09:00:00Z'),
        updated: new Date('2024-01-20T09:00:00Z')
    },
    {
        id: 13,
        importer_id: 3,
        type: 'monitor',
        brand: 'Dell',
        model: 'U2723QE',
        image: null,
        description: 'Professional 4K display.',
        variant: 'U27-4K-IPS',
        variant_second: 'SL-ED',
        active: true,
        created: new Date('2024-05-01T12:00:00Z'),
        updated: new Date('2024-05-01T12:00:00Z')
    }
];

export const priceData: EntityCreationAttributes<Price>[] = [
    {
        id: 5,
        price: 8499.00,
        shop_id: 10,
        url: 'https://x-kom.pl',
        product_id: 4,
        active: true,
        updated: new Date('2024-04-05T09:00:00Z'),
        created: new Date('2024-04-01T10:00:00Z')
    },
    {
        id: 6,
        price: 8549.99,
        shop_id: 20,
        url: 'https://mediaexpert.pl',
        product_id: 4,
        active: true,
        updated: new Date('2024-04-06T10:00:00Z'),
        created: new Date('2024-04-01T10:00:00Z')
    },
    {
        id: 7,
        price: 5199.00,
        shop_id: 10,
        url: 'https://x-kom.pl',
        product_id: 5,
        active: true,
        updated: new Date('2024-02-01T12:00:00Z'),
        created: new Date('2024-01-10T08:00:00Z')
    },
    {
        id: 8,
        price: 6299.00,
        shop_id: 30,
        url: 'https://morele.net',
        product_id: 6,
        active: true,
        updated: new Date('2024-02-20T14:00:00Z'),
        created: new Date('2024-02-20T14:00:00Z')
    },
    {
        id: 9,
        price: 3399.00,
        shop_id: 20,
        url: 'https://mediaexpert.pl',
        product_id: 7,
        active: true,
        updated: new Date('2024-01-05T10:00:00Z'),
        created: new Date('2023-11-15T09:00:00Z')
    },
    {
        id: 10,
        price: 1149.50,
        shop_id: 10,
        url: 'https://x-kom.pl',
        product_id: 8,
        active: true,
        updated: new Date('2023-08-20T11:00:00Z'),
        created: new Date('2023-08-20T11:00:00Z')
    },
    {
        id: 11,
        price: 5899.00,
        shop_id: 30,
        url: 'https://morele.net',
        product_id: 9,
        active: true,
        updated: new Date('2024-03-15T13:00:00Z'),
        created: new Date('2024-03-15T13:00:00Z')
    },
    {
        id: 12,
        price: 2699.00,
        shop_id: 10,
        url: 'https://x-kom.pl',
        product_id: 10,
        active: true,
        updated: new Date('2023-12-10T10:00:00Z'),
        created: new Date('2023-12-10T10:00:00Z')
    },
    {
        id: 13,
        price: 4199.00,
        shop_id: 20,
        url: 'https://mediaexpert.pl',
        product_id: 11,
        active: true,
        updated: new Date('2024-02-05T16:00:00Z'),
        created: new Date('2024-02-05T16:00:00Z')
    },
    {
        id: 14,
        price: 1849.00,
        shop_id: 10,
        url: 'https://x-kom.pl',
        product_id: 12,
        active: true,
        updated: new Date('2024-01-20T09:00:00Z'),
        created: new Date('2024-01-20T09:00:00Z')
    }
];
