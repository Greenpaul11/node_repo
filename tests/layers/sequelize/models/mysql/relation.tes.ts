import { strict as assert } from 'node:assert'
import { it, describe, before, after } from "node:test";
import { Product, Price, Shop, Comment, Category, ProductCategory,
    SpecificationTree, User, Rate, ProductImporter } from '../../../../testSkeleton/models'
import connection from '../../../../../config/connection';


const sequelize = connection
if (!sequelize) throw new Error('Instance Sequelize is undefined')


describe('test sequelize model relations', async () => {
    
    let testShopId: number;
    let testProductImporterId: number;
    let testProductId: number;
    let testCategoryId: number;
    let testChildCategoryId: number;
    let testProductCategoryId: number;
    let testCommentId: number;
    let testPriceId: number;
    let testSpecificationTreeId: number;
    let testUserId: number;
    let testRateId: number;


    describe('ProductImporter -> Product', async () => {
        it('should create importer and product (ProductImporter -> Product)', async () => {
            const importer = await ProductImporter.create({ name: 'Importer Relation'})
            testProductImporterId = importer.id

            const product = await Product.create({
                type: 'laptop',
                importer_id: testProductImporterId,
                brand: 'RelationBrand',
                model: 'RelationModel',
                variant: 'rel-variant-001'
            })
            testProductId = product.id

            assert.ok(product.id, 'Product should have an id')
            assert.strictEqual(product.importer_id, testProductImporterId)
        })

        it('should fetch importer with products (ProductImporter -> Product)', async () => {
            const importer = await ProductImporter.findByPk(testProductImporterId, {
                include: [{ model: Product, as: 'products'}]
            });
            assert.ok(importer, 'Importer should be found');
            assert.ok(importer.products, 'Products should be included');
            assert.ok(importer.products.length > 0, 'Should have at least one product');
        })

        it('should fetch product with importer (Product -> Importer)', async () => {
            const product = await Product.findByPk(testProductId, {
                include: [{ model: ProductImporter, as: 'product_importer'}]
            });
            assert.ok(product, 'Product should be found');
            assert.ok(product.product_importer, 'ProductImporter should be included');
            assert.strictEqual(product.product_importer.id, testProductImporterId);
        })
    })

    describe('Product -> Price -> Shop relations', async () => {
        it('should create shop and product with price (Product -> Price -> Shop)', async () => {
            const shop = await Shop.create({ name: 'Relation Shop' });
            testShopId = shop.id;

            const price = await Price.create({
                price: 1299.99,
                shop_id: testShopId,
                url: 'https://relation-shop.com/product',
                product_id: testProductId
            });
            testPriceId = price.id;

            assert.ok(price.id, 'Price should have an id');
            assert.strictEqual(price.product_id, testProductId);
            assert.strictEqual(price.shop_id, testShopId);
        })

        it('should fetch product with prices (Product -> Price)', async () => {
            const product = await Product.findByPk(testProductId, {
                include: [{ model: Price, as: 'prices'}]
            });
            assert.ok(product, 'Product should be found');
            assert.ok(product.prices, 'Prices should be included');
            assert.ok(product.prices.length > 0, 'Should have at least one price');
        })

        it('should fetch price with product (Price -> Product)', async () => {
            const price = await Price.findByPk(testPriceId, {
                include: [{ model: Product, as: 'product' }]
            });

            assert.ok(price, 'Price should be found');
            assert.ok(price.product, 'Product should be included');
            assert.strictEqual(price.product.brand, 'RelationBrand');
        })

        it('should fetch price with shop (Price -> Shop)', async () => {
            const price = await Price.findByPk(testPriceId, {
                include: [{ model: Shop, as: 'shop' }]
            });

            assert.ok(price, 'Price should be found');
            assert.ok(price.shop, 'Shop should be included');
            assert.strictEqual(price.shop.name, 'Relation Shop');
        })

        it('should fetch product with prices and shops (Product -> Price -> Shop)', async () => {
            const product = await Product.findByPk(testProductId, {
                include: [{ 
                    model: Price,
                    as: 'prices',
                    include: [{ model: Shop, as: 'shop' }]
                }]
            });

            assert.ok(product, 'Product should be found');
            assert.ok(product.prices, 'Prices should be included');
            if (product.prices.length > 0) {
                assert.ok(product.prices[0].shop, 'Shop should be included in price');
            }
        })
    })
    
    describe('Product -> Comment relation', async () => {
        it('should create comment for product (Product -> Comment)', async () => {
            const user = await User.create({
                name: 'TestUser',
                login: 'TestLogin',
                email: 'Paul22@gmail.com',
                password: 'kdfdkfjdfkdfjdfdfdfd'
            })
            const comment = await Comment.create({
                product_id: testProductId,
                content: 'Great laptop!',
                user_id: user.id
            });
            testCommentId = comment.id;

            assert.ok(comment.id, 'Comment should have an id');
            assert.strictEqual(comment.product_id, testProductId);
        })

        it('should fetch product with comments (Product -> Comment)', async () => {
            const product = await Product.findByPk(testProductId, {
                include: [{ model: Comment, as: 'comments' }]
            });

            assert.ok(product, 'Product should be found');
            assert.ok(product.comments, 'Comments should be included');
            assert.ok(product.comments.length > 0, 'Should have at least one comment');
        })

        it('should fetch comment with product (Comment -> Product)', async () => {
            const comment = await Comment.findByPk(testCommentId, {
                include: [{ model: Product, as: 'product' }]
            });

            assert.ok(comment, 'Comment should be found');
            assert.ok(comment)
            assert.ok(comment.product, 'Product should be included');
            assert.strictEqual(comment.product.brand, 'RelationBrand');
        })

        it('should cascade delete comments when product deleted', async () => {
            const user = await User.findOne({where: {login: 'TestLogin'}})
            assert.ok(user)
            const product = await Product.create({
                type: 'laptop',
                importer_id: testProductImporterId,
                brand: 'DeleteTest',
                model: 'DeleteTest',
                variant: 'del-variant-001'
            });

            await Comment.create({
                product_id: product.id,
                content: 'Will be deleted',
                user_id: user.id
            });

            const commentCountBefore = await Comment.count({ where: { product_id: product.id } });
            await product.destroy();

            const commentCountAfter = await Comment.count({ where: { product_id: product.id } });
            await user.destroy()

            assert.strictEqual(commentCountBefore, 1, 'Should have 1 comment before delete');
            assert.strictEqual(commentCountAfter, 0, 'Should have 0 comments after delete');
        })
    })

    describe('User -> Comment relation', async () => {
        it('should create user with comments (User -> Comment)', async () => {
            const user = await User.create({
                name: 'RelationUser',
                login: 'relationuser',
                email: 'relation@example.com',
                password: 'password123'
            });
            testUserId = user.id;

            const comment = await Comment.create({
                product_id: 1,
                user_id: user.id,
                content: 'Test comment from user'
            });
            testCommentId = comment.id;

            assert.ok(comment.id, 'Comment should have an id');
            assert.strictEqual(comment.user_id, testUserId);
        })


        it('should fetch user with comments (User -> Comment)', async () => {
            const user = await User.findByPk(testUserId, {
                include: [{ model: Comment, as: 'comments'}]
            });
            assert.ok(user, 'User should be found');
            assert.ok(user.comments, 'Comments should be included');
            assert.ok(user.comments.length > 0, 'Should have at least one comment');
        })


        it('should fetch comment with user (Comment -> User)', async () => {
            const comment = await Comment.findByPk(testCommentId, {
                include: [{ model: User, as: 'user' }]
            });
            
            assert.ok(comment, 'Comment should be found');
            assert.ok(comment.user, 'User should be included');
            assert.strictEqual(comment.user.name, 'RelationUser');
        })


        it('should cascade delete comments when user deleted', async () => {
            const user = await User.create({
                name: 'DeleteUser',
                login: 'deleteuser',
                email: 'delete@example.com',
                password: 'password123'
            });

            await Comment.create({
                product_id: 1,
                user_id: user.id,
                content: 'Will be deleted'
            });

            const commentCountBefore = await Comment.count({ where: { user_id: user.id } });
            await user.destroy();
            const commentCountAfter = await Comment.count({ where: { user_id: user.id } });

            assert.strictEqual(commentCountBefore, 1, 'Should have 1 comment before delete');
            assert.strictEqual(commentCountAfter, 0, 'Should have 0 comments after delete');
        })
    })

    describe('User -> Rate relation', async () => {
        it('should create user with rates (User -> Rate)', async () => {
            const user = await User.create({
                name: 'RateUser',
                login: 'rateuser',
                email: 'rate@example.com',
                password: 'password123'
            });

            testUserId = user.id;
            
            const comment = await Comment.create({
                product_id: 1,
                user_id: user.id,
                content: 'Comment for rate test'
            });

            const rate = await Rate.create({
                comment_id: comment.id,
                user_id: user.id,
                rate: 4
            });
            testRateId = rate.id;

            assert.ok(rate.id, 'Rate should have an id');
            assert.strictEqual(rate.user_id, user.id);
        })


        it('should fetch user with rates (User -> Rate)', async () => {
            const user = await User.findByPk(testUserId, {
                include: [{ model: Rate, as: 'rates'}]
            });
            assert.ok(user, 'User should be found');
            assert.ok(user.rates, 'Rates should be included');
            assert.ok(user.rates.length > 0, 'Should have at least one rate');
        })


        it('should fetch rate with user (Rate -> User)', async () => {
            const rate = await Rate.findByPk(testRateId, {
                include: [{ model: User, as: 'user' }]
            });
            assert.ok(rate, 'Rate should be found');
            assert.ok(rate.user, 'User should be included');
            assert.strictEqual(rate.user.name, 'RateUser');
        })


        it('should cascade delete rates when user deleted', async () => {
            const user = await User.create({
                name: 'RateDeleteUser',
                login: 'ratedeleteuser',
                email: 'ratedelete@example.com',
                password: 'password123'
            });

            const comment = await Comment.create({
                product_id: 1,
                user_id: user.id,
                content: 'Comment for rate delete test'
            });

            await Rate.create({
                comment_id: comment.id,
                user_id: user.id,
                rate: 5
            });

            const rateCountBefore = await Rate.count({ where: { user_id: user.id } });
            await user.destroy();

            const rateCountAfter = await Rate.count({ where: { user_id: user.id } });
            await comment.destroy();

            assert.strictEqual(rateCountBefore, 1, 'Should have 1 rate before delete');
            assert.strictEqual(rateCountAfter, 0, 'Should have 0 rates after delete');
        })
    })

    describe('Comment -> Rate relation', async () => {
        it('should create comment with rates (Comment -> Rate)', async () => {
            const user = await User.create({
                name: 'RateCommentUser',
                login: 'ratecommentuser',
                email: 'ratecomment@example.com',
                password: 'password123'
            });

            const comment = await Comment.create({
                product_id: 1,
                user_id: user.id,
                content: 'Comment with rates'
            });

            const rate = await Rate.create({
                comment_id: comment.id,
                user_id: user.id,
                rate: 5
            });
            testRateId = rate.id;
            testCommentId = comment.id;

            assert.ok(rate.id, 'Rate should have an id');
            assert.strictEqual(rate.comment_id, comment.id);
        })

        it('should fetch comment with rates (Comment -> Rate)', async () => {
            const comment = await Comment.findByPk(testCommentId, {
                include: [{ model: Rate, as: 'rates'}]
            });
            assert.ok(comment, 'Comment should be found');
            assert.ok(comment.rates, 'Rates should be included');
            assert.ok(comment.rates.length > 0, 'Should have at least one rate');
        })

        it('should fetch rate with comment (Rate -> Comment)', async () => {
            const rate = await Rate.findByPk(testRateId, {
                include: [{ model: Comment, as: 'comment' }]
            });


            assert.ok(rate, 'Rate should be found');
            assert.ok(rate.comment, 'Comment should be included');
            assert.strictEqual(rate.comment.content, 'Comment with rates');
        })

        it('should cascade delete rates when comment deleted', async () => {
            const user = await User.create({
                name: 'CommentDeleteUser',
                login: 'commentdeleteuser',
                email: 'commentdelete@example.com',
                password: 'password123'
            });

            const comment = await Comment.create({
                product_id: 1,
                user_id: user.id,
                content: 'Comment with rate to delete'
            });

            await Rate.create({
                comment_id: comment.id,
                user_id: user.id,
                rate: 3
            });

            const rateCountBefore = await Rate.count({ where: { comment_id: comment.id } });

            await comment.destroy();

            const rateCountAfter = await Rate.count({ where: { comment_id: comment.id } });

            await user.destroy()

            assert.strictEqual(rateCountBefore, 1, 'Should have 1 rate before delete');
            assert.strictEqual(rateCountAfter, 0, 'Should have 0 rates after delete');
        })
    })

    describe('Deep relations User -> Comment -> Rate', async () => {
        it('should fetch User -> Comment -> Rate (deep nested)', async () => {
            const user = await User.findByPk(testUserId, {
                include: [{
                    model: Comment,
                    as: 'comments',
                    include: [{ model: Rate, as: 'rates' }]
                }]
            });


            assert.ok(user, 'User should be found');
            assert.ok(user.comments, 'Comments should be included');
            if (user.comments.length > 0) {
                assert.ok(user.comments[0].rates, 'Rates should be included in comment');
            }
        })

        it('should fetch User -> Rate -> Comment (deep nested)', async () => {
            const user = await User.findByPk(testUserId, {
                include: [{
                    model: Rate,
                    as: 'rates',
                    include: [{ model: Comment, as: 'comment' }]
                }]
            });

            assert.ok(user, 'User should be found');
            assert.ok(user.rates, 'Rates should be included');
            if (user.rates.length > 0) {
                assert.ok(user.rates[0].comment, 'Comment should be included in rate');
            }
        })
    })

    describe('Category self-referential relation', async () => {
        it('should create parent category (Category)', async () => {
            const category = await Category.create({
                name: 'Electronics',
                slug: 'electronics'
            });
            testCategoryId = category.id;

            assert.ok(category.id, 'Category should have an id');
        })

        it('should create child category (Category -> Category)', async () => {
            const childCategory = await Category.create({
                name: 'Laptops',
                slug: 'laptops',
                parent_id: testCategoryId
            });
            testChildCategoryId = childCategory.id;

            assert.ok(childCategory.id, 'Child category should have an id');
            assert.strictEqual(childCategory.parent_id, testCategoryId);
        })

        it('should fetch category with children (Category -> Category)', async () => {
            const parent = await Category.findByPk(testCategoryId, {
                include: [{ 
                    model: Category,
                    as: 'children'
                }]
            });

            assert.ok(parent, 'Parent category should be found');
            assert.ok(parent.children, 'Children should be included');
            assert.ok(parent.children.length > 0, 'Should have at least one child');
            assert.strictEqual(parent.children[0].name, 'Laptops');
        })

        it('should fetch category with parent (Category -> Category)', async () => {
            const child = await Category.findByPk(testChildCategoryId, {
                include: [{ 
                    model: Category,
                    as: 'parent'
                }]
            });

            assert.ok(child, 'Child category should be found');
            assert.ok(child.parent, 'Parent should be included');
            assert.strictEqual(child.parent.name, 'Electronics');
        })

        it('should cascade delete child categories when parent deleted', async () => {
            const parent = await Category.create({
                name: 'ToDelete',
                slug: 'to-delete'
            });

            await Category.create({
                name: 'WillAlsoDelete',
                slug: 'will-also-delete',
                parent_id: parent.id
            });

            const childCountBefore = await Category.count({ where: { parent_id: parent.id } });

            await parent.destroy();

            const childCountAfter = await Category.count({ where: { parent_id: parent.id } });

            assert.strictEqual(childCountBefore, 1, 'Should have 1 child before delete');
            assert.strictEqual(childCountAfter, 0, 'Should have 0 children after delete');
        })
    })
    
    describe('Product -> ProductCategory -> Category relations', async () => {
        it('should create product category link (Product -> ProductCategory -> Category)', async () => {
            const productCategory = await ProductCategory.create({
                product_id: testProductId,
                category_id: testChildCategoryId,
                is_primary: true
            });
            testProductCategoryId = productCategory.id;

            assert.ok(productCategory.id, 'ProductCategory should have an id');
            assert.strictEqual(productCategory.product_id, testProductId);
            assert.strictEqual(productCategory.category_id, testChildCategoryId);
        })

        it('should fetch product with product categories (Product -> ProductCategory)', async () => {
            const product = await Product.findByPk(testProductId, {
                include: [{ model: ProductCategory, as: 'product_categories' }]
            });

            assert.ok(product, 'Product should be found');
            assert.ok(product.product_categories, 'ProductCategories should be included');
        })

        it('should fetch product category with product (ProductCategory -> Product)', async () => {
            const productCategory = await ProductCategory.findByPk(testProductCategoryId, {
                include: [{ model: Product, as: 'product' }]
            });

            assert.ok(productCategory, 'ProductCategory should be found');
            assert.ok(productCategory.product, 'Product should be included');
        })

        it('should fetch product category with category (ProductCategory -> Category)', async () => {
            const productCategory = await ProductCategory.findByPk(testProductCategoryId, {
                include: [{ model: Category, as: 'category' }]
            });

            assert.ok(productCategory, 'ProductCategory should be found');
            assert.ok(productCategory.category, 'Category should be included');
        })

        it('should fetch category with product categories (Category -> ProductCategory)', async () => {
            const category = await Category.findByPk(testChildCategoryId, {
                include: [{ model: ProductCategory, as: 'product_categories' }]
            });

            assert.ok(category, 'Category should be found');
            assert.ok(category.product_categories, 'ProductCategories should be included');
        })

        it('should deep fetch Product -> ProductCategory -> Category', async () => {
            const product = await Product.findByPk(testProductId, {
                include: [{
                    model: ProductCategory,
                    as: 'product_categories',
                    include: [{ model: Category, as: 'category' }]
                }]
            });

            assert.ok(product, 'Product should be found');
            assert.ok(product.product_categories)
            if (product.product_categories.length > 0) {
                assert.ok(product.product_categories[0].category, 'Category should be in ProductCategory');
            }
        })
    })
    
    describe('Product -> SpecificationTree specification relations', async () => {
        it('should create specification tree for product (Product -> SpecificationTree)', async () => {
            const testProduct = await Product.create({
                type: 'laptop',
                importer_id: testProductImporterId,
                brand: 'SpecTest',
                model: 'SpecModel',
                variant: 'spec-variant-001'
            });

            const specTree = await SpecificationTree.create({
                product_id: testProduct.id,
                specification_type: 'laptop'
            });
            testSpecificationTreeId = specTree.id;
            testProductId = testProduct.id;

            assert.ok(specTree.id, 'SpecificationTree should have an id');
            assert.strictEqual(specTree.product_id, testProductId);
        })

        it('should fetch product with specification tree (Product -> SpecificationTree)', async () => {
            const product = await Product.findByPk(testProductId, {
                include: [{ model: SpecificationTree, as: 'specification_tree' }]
            });

            assert.ok(product, 'Product should be found');
            assert.ok(product.specification_tree, 'SpecificationTree should be included');
        })

        it('should fetch specification tree with product (SpecificationTree -> Product)', async () => {
            const specTree = await SpecificationTree.findByPk(testSpecificationTreeId, {
                include: [{ model: Product, as: 'product' }]
            });

            assert.ok(specTree, 'SpecificationTree should be found');
            assert.ok(specTree.product, 'Product should be included');
        })
    })
    
    describe('Price -> Product cascade delete', async () => {
        it('should cascade delete prices when product deleted', async () => {
            const product = await Product.create({
                type: 'laptop',
                importer_id: testProductImporterId,
                brand: 'CascadeTest',
                model: 'CascadeTest',
                variant: 'cascade-variant-001'
            });

            await Price.create({
                price: 999.99,
                shop_id: testShopId,
                url: 'https://test.com',
                product_id: product.id
            });

            const priceCountBefore = await Price.count({ where: { product_id: product.id } });
            await product.destroy();    
            const priceCountAfter = await Price.count({ where: { product_id: product.id } });

            assert.strictEqual(priceCountBefore, 1, 'Should have 1 price before delete');
            assert.strictEqual(priceCountAfter, 0, 'Should have 0 prices after delete');
        })
    })
    
    describe('Price -> Shop cascade delete', async () => {
        it('should cascade delete prices when shop deleted', async () => {
            const shop = await Shop.create({ name: 'CascadeShop' });

            const product = await Product.create({
                type: 'laptop',
                importer_id: testProductImporterId,
                brand: 'ShopCascade',
                model: 'ShopCascade',
                variant: 'shop-cascade-001'
            });

            await Price.create({
                price: 599.99,
                shop_id: shop.id,
                url: 'https://shop.com',
                product_id: product.id
            });

            const priceCountBefore = await Price.count({ where: { shop_id: shop.id } });
            await shop.destroy();
            const priceCountAfter = await Price.count({ where: { shop_id: shop.id } });

            assert.strictEqual(priceCountBefore, 1, 'Should have 1 price before delete');
            assert.strictEqual(priceCountAfter, 0, 'Should have 0 prices after delete');
        })
    })

    describe('ProductCategory -> Product cascade delete', async () => {
        it('should cascade delete product category when product deleted', async () => {
            const product = await Product.create({
                type: 'laptop',
                importer_id: testProductImporterId,
                brand: 'PCascade',
                model: 'PCascade',
                variant: 'pcascade-001'
            });

            const category = await Category.create({
                name: 'PCategory',
                slug: 'pcategory'
            });

            await ProductCategory.create({
                product_id: product.id,
                category_id: category.id,
                is_primary: true
            });

            const pcCountBefore = await ProductCategory.count({ where: { product_id: product.id } });
            await product.destroy();
            const pcCountAfter = await ProductCategory.count({ where: { product_id: product.id } });

            assert.strictEqual(pcCountBefore, 1, 'Should have 1 product category before delete');
            assert.strictEqual(pcCountAfter, 0, 'Should have 0 product categories after delete');
        })
    })

    describe('SpecificationTree cascade delete', async () => {
        it('should cascade delete specification tree when product deleted', async () => {
            const product = await Product.create({
                type: 'laptop',
                importer_id: testProductImporterId,
                brand: 'SpecCascade',
                model: 'SpecCascade',
                variant: 'spec-cascade-001'
            });

            await SpecificationTree.create({
                product_id: product.id,
                specification_type: 'laptop'
            });

            const stCountBefore = await SpecificationTree.count({ where: { product_id: product.id } });
            await product.destroy();
            const stCountAfter = await SpecificationTree.count({ where: { product_id: product.id } });

            assert.strictEqual(stCountBefore, 1, 'Should have 1 spec tree before delete');
            assert.strictEqual(stCountAfter, 0, 'Should have 0 spec trees after delete');
        })
    })

});