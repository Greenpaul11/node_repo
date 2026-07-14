import { strict as assert } from 'node:assert'
import { it, describe } from "node:test";
import { ProductImporter, Product, Price, Shop, Comment, Category, ProductCategory,
    SpecificationTree, User, Rate  } from '../../../../testSkeleton/models'
import connection from '../../../../../config/connection';


describe('test sequelize models', () => {
    
    let testShopId: number;
    let testProductImporterId: number;
    let testProductId: number;
    let testCategoryId: number;
    let testCategoryId2: number;
    let testProductCategoryId: number;
    let testCommentId: number;
    let testUserId: number;
    let testSpecificationTreeId: number;
    let testRateId: number;
    

    describe('Shop model', () => {
        it('should create a shop', async () => {
            const shop = await Shop.create({
                name: 'Test Shop'
            });
            testShopId = shop.id;
            assert.ok(shop.id, 'Shop should have an id');
            assert.strictEqual(shop.name, 'Test Shop');
            assert.strictEqual(shop.active, true);
        });

        it('should find shop by id', async () => {
            const shop = await Shop.findByPk(testShopId);
            assert.strictEqual(shop?.name, 'Test Shop');
        });

        it('should update shop', async () => {
            const shop = await Shop.findByPk(testShopId);
            await shop?.update({ name: 'Updated Shop' });
            const updated = await Shop.findByPk(testShopId);
            assert.strictEqual(updated?.name, 'Updated Shop');
        });

        it('should deactivate shop', async () => {
            const shop = await Shop.findByPk(testShopId);
            await shop?.update({ active: false });
            const deleted = await Shop.findByPk(testShopId);
            assert.strictEqual(deleted?.active, false);
        });
    });
    
    describe('ProductImporter model', async () => {
        it('should create an importer', async () => {
            const importer = await ProductImporter.create({
                id: 1,
                name: 'TestImporter'
            });
            testProductImporterId = importer.id;
            assert.ok(importer.id, 'Importer should have an id');
            assert.strictEqual(importer.name, 'TestImporter');
        });
        it('should find importer by id', async () => {
            const importer = await ProductImporter.findByPk(testProductImporterId);
            assert.strictEqual(importer?.name, 'TestImporter');
        });
        it('should update importer', async () => {
            const importer = await ProductImporter.findByPk(testProductImporterId);
            await importer?.update({ name: 'UpdatedImporter' });
            const updated = await ProductImporter.findByPk(testProductImporterId);
            assert.strictEqual(updated?.name, 'UpdatedImporter');
        });
        it('should deactivate importer', async () => {
            const importer = await ProductImporter.findByPk(testProductImporterId);
            await importer?.update({ active: false });
            const deactivated = await ProductImporter.findByPk(testProductImporterId);
            assert.strictEqual(deactivated?.active, false);
        });
    });
    
    describe('Product model', async () => {
        it('should create a product', async () => {
            const product = await Product.create({
                type: 'laptop',
                importer_id: 1,
                brand: 'TestBrand',
                model: 'TestModel',
                description: 'Test Description',
                image: 'test.jpg',
                variant: 'test-variant-001'
            });
            testProductId = product.id;
            assert.ok(product.id, 'Product should have an id');
            assert.strictEqual(product.brand, 'TestBrand');
            assert.strictEqual(product.model, 'TestModel');
            assert.strictEqual(product.active, true);
        });

        it('should find product by id', async () => {
            const product = await Product.findByPk(testProductId);
            assert.strictEqual(product?.brand, 'TestBrand');
        });

        it('should update product', async () => {
            const product = await Product.findByPk(testProductId);
            await product?.update({ model: 'UpdatedModel' });
            const updated = await Product.findByPk(testProductId);
            assert.strictEqual(updated?.model, 'UpdatedModel');
        });

        it('should deactivate product', async () => {
            const product = await Product.findByPk(testProductId);
            await product?.update({ active: false });
            const deleted = await Product.findByPk(testProductId);
            assert.strictEqual(deleted?.active, false);
        });
    });


    describe('Price model', async () => {
        it('should create a price', async () => {
            const price = await Price.create({
                price: 999.99,
                shop_id: testShopId,
                url: 'https://example.com/product',
                product_id: testProductId
            });
            assert.ok(price.id, 'Price should have an id');
            assert.strictEqual(price.price, 999.99);
            assert.strictEqual(price.active, true);
        });

        it('should find price by id', async () => {
            const prices = await Price.findAll({ where: { product_id: testProductId } });
            assert.ok(prices.length > 0);
        });

        it('should update price', async () => {
            const prices = await Price.findAll({ where: { product_id: testProductId } });
            await prices[0].update({ price: 899.99 });
            const updated = await Price.findByPk(prices[0].id);
            assert.strictEqual(updated?.price, '899.99');
        });

        it('should deactivate price', async () => {
            const prices = await Price.findAll({ where: { product_id: testProductId } });
            await prices[0].update({ active: false });
            const deleted = await Price.findByPk(prices[0].id);
            assert.strictEqual(deleted?.active, false);
        });
    });


    describe('Category model', async () => {
        it('should create a category', async () => {
            const category = await Category.create({
                name: 'Laptops',
                slug: 'laptops'
            });
            testCategoryId = category.id;
            assert.ok(category.id, 'Category should have an id');
            assert.strictEqual(category.name, 'Laptops');
            assert.strictEqual(category.active, true);
        });

        it('should create a child category', async () => {
            const category = await Category.create({
                name: 'Gaming Laptops',
                slug: 'gaming-laptops',
                parent_id: testCategoryId
            });
            testCategoryId2 = category.id;
            assert.strictEqual(category.parent_id, testCategoryId);
        });

        it('should find category by id', async () => {
            const category = await Category.findByPk(testCategoryId);
            assert.strictEqual(category?.name, 'Laptops');
        });

        it('should update category', async () => {
            const category = await Category.findByPk(testCategoryId);
            await category?.update({ name: 'Updated Laptops' });
            const updated = await Category.findByPk(testCategoryId);
            assert.strictEqual(updated?.name, 'Updated Laptops');
        });

        it('should deactivate category', async () => {
            const category = await Category.findByPk(testCategoryId);
            await category?.update({ active: false });
            const deleted = await Category.findByPk(testCategoryId);
            assert.strictEqual(deleted?.active, false);
        });
    });


    describe('ProductCategory model', async () => {
        it('should create a product category', async () => {
            const productCategory = await ProductCategory.create({
                product_id: testProductId,
                category_id: testCategoryId2,
                is_primary: true
            });
            testProductCategoryId = productCategory.id;
            assert.ok(productCategory.id, 'ProductCategory should have an id');
            assert.strictEqual(productCategory.is_primary, true);
            assert.strictEqual(productCategory.active, true);
        });

        it('should find product category by id', async () => {
            const productCategory = await ProductCategory.findByPk(testProductCategoryId);
            assert.strictEqual(productCategory?.product_id, testProductId);
        });

        it('should update product category', async () => {
            const productCategory = await ProductCategory.findByPk(testProductCategoryId);
            await productCategory?.update({ is_primary: false });
            const updated = await ProductCategory.findByPk(testProductCategoryId);
            assert.strictEqual(updated?.is_primary, false);
        });

        it('should deactivate product category', async () => {
            const productCategory = await ProductCategory.findByPk(testProductCategoryId);
            await productCategory?.update({ active: false });
            const deleted = await ProductCategory.findByPk(testProductCategoryId);
            assert.strictEqual(deleted?.active, false);
        });
    });


    describe('Comment model', async () => {
        it('should create a comment', async () => {
            const user = await User.create({
                name: 'TestUser',
                login: 'TestLoginComment',
                email: 'Paul22@gmail.com',
                password: 'kdfdkfjdfkdfjdfdfdfd'
            })

            const comment = await Comment.create({
                product_id: testProductId,
                content: 'Great product!',
                user_id: user.id
            });
            testCommentId = comment.id;
            assert.ok(comment.id, 'Comment should have an id');
            assert.strictEqual(comment.content, 'Great product!');
            assert.strictEqual(comment.user_id, user.id);
            assert.strictEqual(comment.active, true);
        });

        it('should find comment by id', async () => {
            const comment = await Comment.findByPk(testCommentId);
            assert.strictEqual(comment?.content, 'Great product!');
        });

        it('should update comment', async () => {
            const comment = await Comment.findByPk(testCommentId);
            await comment?.update({ content: 'Updated comment'});
            const updated = await Comment.findByPk(testCommentId);
            assert.strictEqual(updated?.content, 'Updated comment')
        });

        it('should deactivate comment', async () => {
            const comment = await Comment.findByPk(testCommentId);
            await comment?.update({ active: false });
            const deleted = await Comment.findByPk(testCommentId);
            assert.strictEqual(deleted?.active, false);
        });
    });

    describe('User model', async () => {
        it('should create a user', async () => {
            const user = await User.create({
                name: 'Test User',
                login: 'testlogin7',
                email: 'test@example.com',
                password: 'password123'
            });
            testUserId = user.id;
            assert.ok(user.id, 'User should have an id');
            assert.strictEqual(user.name, 'Test User');
            assert.strictEqual(user.login, 'testlogin7');
            assert.strictEqual(user.email, 'test@example.com');
            assert.strictEqual(user.active, true);
        });
        
        it('should find user by id', async () => {
            const user = await User.findByPk(testUserId);
            assert.strictEqual(user?.name, 'Test User');
        });
        
        it('should update user', async () => {
            const user = await User.findByPk(testUserId);
            await user?.update({ name: 'Updated User' });
            const updated = await User.findByPk(testUserId);
            assert.strictEqual(updated?.name, 'Updated User');
        });
        
        it('should deactivate user', async () => {
            const user = await User.findByPk(testUserId);
            await user?.update({ active: false });
            const deleted = await User.findByPk(testUserId);
            assert.strictEqual(deleted?.active, false);
        });
    });
    
    describe('Rate model', async () => {
        it('should create a rate', async () => {
            const rate = await Rate.create({
                comment_id: testCommentId,
                user_id: testUserId,
                rate: 5
            });
            testRateId = rate.id;
            assert.ok(rate.id, 'Rate should have an id');
            assert.strictEqual(rate.rate, 5);
            assert.strictEqual(rate.comment_id, testCommentId);
            assert.strictEqual(rate.user_id, testUserId);
            assert.strictEqual(rate.active, true);
        });
        
        it('should find rate by id', async () => {
            const rate = await Rate.findByPk(testRateId);
            assert.strictEqual(rate?.rate, 5);
        });
        
        it('should update rate', async () => {
            const rate = await Rate.findByPk(testRateId);
            await rate?.update({ rate: 4 });
            const updated = await Rate.findByPk(testRateId);
            assert.strictEqual(updated?.rate, 4);
        });
        
        it('should deactivate rate', async () => {
            const rate = await Rate.findByPk(testRateId);
            await rate?.update({ active: false });
            const deleted = await Rate.findByPk(testRateId);
            assert.strictEqual(deleted?.active, false);
        });
    });

    describe('SpecificationTree model', async () => {
        it('should create a specification tree', async () => {
            const specTree = await SpecificationTree.create({
                product_id: testProductId,
                specification_type: 'laptop'
            });
            testSpecificationTreeId = specTree.id;
            assert.ok(specTree.id, 'SpecificationTree should have an id');
            assert.strictEqual(specTree.specification_type, 'laptop');
            assert.strictEqual(specTree.active, true);
        });

        it('should find specification tree by id', async () => {
            const specTree = await SpecificationTree.findByPk(testSpecificationTreeId);
            assert.strictEqual(specTree?.product_id, testProductId);
        });

        it('should update specification tree', async () => {
            const specTree = await SpecificationTree.findByPk(testSpecificationTreeId);
            await specTree?.update({ specification_type: 'monitor' });
            const updated = await SpecificationTree.findByPk(testSpecificationTreeId);
            assert.strictEqual(updated?.specification_type, 'monitor');
        });

        it('should deactivate specification tree', async () => {
            const specTree = await SpecificationTree.findByPk(testSpecificationTreeId);
            await specTree?.update({ active: false });
            const deleted = await SpecificationTree.findByPk(testSpecificationTreeId);
            assert.strictEqual(deleted?.active, false);
        });
    });

});