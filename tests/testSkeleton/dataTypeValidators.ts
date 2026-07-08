import { strict as assert } from 'node:assert'
import { Product, Price, Shop } from './entities'

export const isProductOutput = (product: Product) => {
    // Required fields (Mandatory)
    assert.strictEqual(typeof product.id, 'number', 'id must be a number');
    assert.strictEqual(typeof product.type, 'string', 'type must be a string');
    assert.strictEqual(typeof product.brand, 'string', 'brand must be a string');
    assert.strictEqual(typeof product.model, 'string', 'model must be a string');
    assert.strictEqual(typeof product.variant, 'string', 'variant must be a string');
    assert.strictEqual(typeof product.active, 'boolean', 'active must be a boolean');
    
    // Optional fields (String | Null)
    assert(typeof product.image === 'string' || product.image === null, 'image must be string or null');
    assert(typeof product.description === 'string' || product.description === null, 'description must be string or null');
    assert(typeof product.variant_second === 'string' || product.variant_second === null, 'variant_second must be string or null');
    
    // Date fields (Instance check)
    assert.strictEqual(product.created instanceof Date, true, 'created must be an instance of Date');
    assert.strictEqual(product.updated instanceof Date, true, 'updated must be an instance of Date');
    
    // Optional Relationship (Array check)
    if (product.prices !== undefined) {
        assert.strictEqual(Array.isArray(product.prices), true, 'prices must be an array if present');
    }
}

export const isPriceOutput = (price: Price) => {
    // Required Numeric fields (Mandatory)
    assert.strictEqual(typeof price.id, 'number', 'Price id must be a number');
    assert.strictEqual(typeof price.price, 'number', 'Price value must be a number');
    assert.strictEqual(typeof price.shop_id, 'number', 'shop_id must be a number');
    assert.strictEqual(typeof price.product_id, 'number', 'product_id must be a number');
    
    // Required String/Boolean fields
    assert.strictEqual(typeof price.url, 'string', 'url must be a string');
    assert.strictEqual(typeof price.active, 'boolean', 'active flag must be a boolean');
    
    // Date fields (Instance check)
    // Weryfikuje, czy pola są prawdziwymi obiektami Date (nie stringami)
    assert.strictEqual(price.created instanceof Date, true, 'Price created must be an instance of Date');
    assert.strictEqual(price.updated instanceof Date, true, 'Price updated must be an instance of Date');
};

export const isShopOutput = (shop: Shop) => {
    // Pola obowiązkowe (Prymitywy)
    assert.strictEqual(typeof shop.id, 'number', 'Shop id must be a number');
    assert.strictEqual(typeof shop.name, 'string', 'Shop name must be a string');
    assert.strictEqual(typeof shop.active, 'boolean', 'Shop active status must be a boolean');
    
    // Pole 'founded' (Date | null)
    // Sprawdzamy czy jest instancją Date LUB czy jest stricte równe null
    assert(
        shop.founded instanceof Date || shop.founded === null, 
        'Shop founded must be an instance of Date or null'
    );
    
    // Pola dat systemowych (Obowiązkowe instancje Date)
    assert.strictEqual(shop.updated instanceof Date, true, 'Shop updated must be an instance of Date');
    assert.strictEqual(shop.created instanceof Date, true, 'Shop created must be an instance of Date');
};