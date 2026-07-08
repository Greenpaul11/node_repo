import { strict as assert } from 'node:assert'
import { it, describe } from "node:test";
import { Product, Price, Shop, Comment, Category, ProductCategory,
    SpecificationTree, User, Rate, ProductImporter } from '../../../../testSkeleton/models'


describe('test sequelize model relations (sqlite)', () => {
    
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


    describe('ProductImporter -> Product', () => {
        it('should create importer and product (ProductImporter -> Product)', async () => {
            const importer = await ProductImporter.create({ name: 'Importer Relation Sqlite'})
            testProductImporterId = importer.id

            const product = await Product.create({
                type: 'laptop',
                importer_id: testProductImporterId,
                brand: 'RelationBrandSqlite',
                model: 'RelationModelSqlite',
                variant: 'rel-variant-sqlite-001'
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

    describe('Product -> Price -> Shop relations', () => {
        it('should create shop and product with price (Product -> Price -> Shop)', async () => {
            const shop = await Shop.create({ name: 'Relation Shop Sqlite' });
            testShopId = shop.id;

            const price = await Price.create({
                price: 1299.99,
                shop_id: testShopId,
                url: 'https://relation-shop.com/product-sqlite',
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
            assert.strictEqual(price.product.brand, 'RelationBrandSqlite');
        })

        it('should fetch price with shop (Price -> Shop)', async () => {
            const price = await Price.findByPk(testPriceId, {
                include: [{ model: Shop, as: 'shop' }]
            });

            assert.ok(price, 'Price should be found');
            assert.ok(price.shop, 'Shop should be included');
            assert.strictEqual(price.shop.name, 'Relation Shop Sqlite');
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
    
    describe('Product -> Comment relation', () => {
        it('should create comment for product (Product -> Comment)', async () => {
            const user = await User.create({
                name: 'TestUserSqlite',
                login: 'TestLoginSqlite',
                email: 'sqlite-paul@gmail.com',
                password: 'kdfdkfjdfkdfjdfdfdfd'
            })
            const comment = await Comment.create({
                product_id: testProductId,
                content: 'Great laptop sqlite!',
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
            assert.ok(comment.product, 'Product should be included');
            assert.strictEqual(comment.product.brand, 'RelationBrandSqlite');
        })

        it('should cascade delete comments when product deleted', async () => {
            const user = await User.findOne({where: {login: 'TestLoginSqlite'}})
            assert.ok(user)
            const product = await Product.create({
                type: 'laptop',
                importer_id: testProductImporterId,
                brand: 'DeleteTestSqlite',
                model: 'DeleteTestSqlite',
                variant: 'del-variant-sqlite-001'
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

    describe('User -> Comment relation', () => {
        it('should create user with comments (User -> Comment)', async () => {
            const user = await User.create({
                name: 'RelationUserSqlite',
                login: 'relationuserSqlite',
                email: 'sqlite-relation@example.com',
                password: 'password123'
            });
            testUserId = user.id;

            const comment = await Comment.create({
                product_id: testProductId,
                user_id: user.id,
                content: 'Test comment from user sqlite'
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
            assert.strictEqual(comment.user.name, 'RelationUserSqlite');
        })


        it('should cascade delete comments when user deleted', async () => {
            const user = await User.create({
                name: 'DeleteUserSqlite',
                login: 'deleteuserSqlite',
                email: 'sqlite-delete@example.com',
                password: 'password123'
            });

            await Comment.create({
                product_id: testProductId,
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

    describe('User -> Rate relation', () => {
        it('should create user with rates (User -> Rate)', async () => {
            const user = await User.create({
                name: 'RateUserSqlite',
                login: 'rateuserSqlite',
                email: 'sqlite-rate@example.com',
                password: 'password123'
            });

            testUserId = user.id;
            
            const comment = await Comment.create({
                product_id: testProductId,
                user_id: user.id,
                content: 'Comment for rate test sqlite'
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
            assert.strictEqual(rate.user.name, 'RateUserSqlite');
        })


        it('should cascade delete rates when user deleted', async () => {
            const user = await User.create({
                name: 'RateDeleteUserSqlite',
                login: 'ratedeleteuserSqlite',
                email: 'sqlite-ratedelete@example.com',
                password: 'password123'
            });

            const comment = await Comment.create({
                product_id: testProductId,
                user_id: user.id,
                content: 'Comment for rate delete test sqlite'
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

    describe('Comment -> Rate relation', () => {
        it('should create comment with rates (Comment -> Rate)', async () => {
            const user = await User.create({
                name: 'RateCommentUserSqlite',
                login: 'ratecommentuserSqlite',
                email: 'sqlite-ratecomment@example.com',
                password: 'password123'
            });

            const comment = await Comment.create({
                product_id: testProductId,
                user_id: user.id,
                content: 'Comment with rates sqlite'
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
            assert.strictEqual(rate.comment.content, 'Comment with rates sqlite');
        })

        it('should cascade delete rates when comment deleted', async () => {
            const user = await User.create({
                name: 'CommentDeleteUserSqlite',
                login: 'commentdeleteuserSqlite',
                email: 'sqlite-commentdelete@example.com',
                password: 'password123'
            });

            const comment = await Comment.create({
                product_id: testProductId,
                user_id: user.id,
                content: 'Comment with rate to delete sqlite'
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

    describe('Deep relations User -> Comment -> Rate', () => {
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

    describe('Category self-referential relation', () => {
        it('should create parent category (Category)', async () => {
            const category = await Category.create({
                name: 'ElectronicsSqlite',
                slug: 'electronics-sqlite'
            });
            testCategoryId = category.id;

            assert.ok(category.id, 'Category should have an id');
        })

        it('should create child category (Category -> Category)', async () => {
            const childCategory = await Category.create({
                name: 'LaptopsSqlite',
                slug: 'laptops-sqlite',
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
            assert.strictEqual(parent.children[0].name, 'LaptopsSqlite');
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
            assert.strictEqual(child.parent.name, 'ElectronicsSqlite');
        })

        it('should cascade delete child categories when parent deleted', async () => {
            const parent = await Category.create({
                name: 'ToDeleteSqlite',
                slug: 'to-delete-sqlite'
            });

            await Category.create({
                name: 'WillAlsoDeleteSqlite',
                slug: 'will-also-delete-sqlite',
                parent_id: parent.id
            });

            const childCountBefore = await Category.count({ where: { parent_id: parent.id } });

            await parent.destroy();

            const childCountAfter = await Category.count({ where: { parent_id: parent.id } });

            assert.strictEqual(childCountBefore, 1, 'Should have 1 child before delete');
            assert.strictEqual(childCountAfter, 0, 'Should have 0 children after delete');
        })
    })
    
    describe('Product -> ProductCategory -> Category relations', () => {
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
    
    describe('Product -> SpecificationTree specification relations', () => {
        it('should create specification tree for product (Product -> SpecificationTree)', async () => {
            const testProduct = await Product.create({
                type: 'laptop',
                importer_id: testProductImporterId,
                brand: 'SpecTestSqlite',
                model: 'SpecModelSqlite',
                variant: 'spec-variant-sqlite-001'
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
    
    describe('Price -> Product cascade delete', () => {
        it('should cascade delete prices when product deleted', async () => {
            const product = await Product.create({
                type: 'laptop',
                importer_id: testProductImporterId,
                brand: 'CascadeTestSqlite',
                model: 'CascadeTestSqlite',
                variant: 'cascade-variant-sqlite-001'
            });

            await Price.create({
                price: 999.99,
                shop_id: testShopId,
                url: 'https://test-sqlite.com',
                product_id: product.id
            });

            const priceCountBefore = await Price.count({ where: { product_id: product.id } });
            await product.destroy();    
            const priceCountAfter = await Price.count({ where: { product_id: product.id } });

            assert.strictEqual(priceCountBefore, 1, 'Should have 1 price before delete');
            assert.strictEqual(priceCountAfter, 0, 'Should have 0 prices after delete');
        })
    })
    
    describe('Price -> Shop cascade delete', () => {
        it('should cascade delete prices when shop deleted', async () => {
            const shop = await Shop.create({ name: 'CascadeShopSqlite' });

            const product = await Product.create({
                type: 'laptop',
                importer_id: testProductImporterId,
                brand: 'ShopCascadeSqlite',
                model: 'ShopCascadeSqlite',
                variant: 'shop-cascade-sqlite-001'
            });

            await Price.create({
                price: 599.99,
                shop_id: shop.id,
                url: 'https://shop-sqlite.com',
                product_id: product.id
            });

            const priceCountBefore = await Price.count({ where: { shop_id: shop.id } });
            await shop.destroy();
            const priceCountAfter = await Price.count({ where: { shop_id: shop.id } });

            assert.strictEqual(priceCountBefore, 1, 'Should have 1 price before delete');
            assert.strictEqual(priceCountAfter, 0, 'Should have 0 prices after delete');
        })
    })

    describe('ProductCategory -> Product cascade delete', () => {
        it('should cascade delete product category when product deleted', async () => {
            const product = await Product.create({
                type: 'laptop',
                importer_id: testProductImporterId,
                brand: 'PCascadeSqlite',
                model: 'PCascadeSqlite',
                variant: 'pcascade-sqlite-001'
            });

            const category = await Category.create({
                name: 'PCategorySqlite',
                slug: 'pcategory-sqlite'
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

    describe('SpecificationTree cascade delete', () => {
        it('should cascade delete specification tree when product deleted', async () => {
            const product = await Product.create({
                type: 'laptop',
                importer_id: testProductImporterId,
                brand: 'SpecCascadeSqlite',
                model: 'SpecCascadeSqlite',
                variant: 'spec-cascade-sqlite-001'
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
