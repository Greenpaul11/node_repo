import { strict as assert } from 'node:assert'
import { it, describe, before } from "node:test";
import connection from '../../../../config/connection';
import { 
    Product, ProductImporter, Price, Shop, Comment, User, 
    Rate, Category, ProductCategory, SpecificationTree, Specification 
} from '../../../testSkeleton/models';
import { 
    productImporterData,
    productData,
    priceData,
    shopData,
    categoryData
} from '../../../testSkeleton/testData/dataBase';
import { 
    productData as productData2,
    priceData as priceData2
} from '../../../testSkeleton/testData/dataExtended';
import { 
    priceData as priceData3,
    shopData as shopData2,
    userData,
    commentData,
    rateData,
    categoryData as categoryData2,
    productCategoryData as productCategoryData2,
    specificationTreeData,
    specificationData,
} from '../../../testSkeleton/testData/dataExtended2';
import { 
    productImporterMetadata, 
    productMetadata,
    priceMetadata,
    shopMetadata,
    commentMetadata,
    rateMetadata,
    userMetadata,
    categoryMetadata,
    productCategoryMetadata,
    specificationTreeMetadata,
    specificationMetadata,
} from '../../../testSkeleton/config'
import { 
    Product as ProductEntity, 
    ProductImporter as ProductImporterEntity, 
    Price as PriceEntity,
    Shop as ShopEntity, 
    Comment as CommentEntity, 
    User as UserEntity, 
    Rate as RateEntity,
    Category as CategoryEntity, 
    ProductCategory as ProductCategoryEntity, 
    SpecificationTree as SpecificationTreeEntity, 
    Specification as SpecificationEntity 
} from '../../../testSkeleton/entities';
import { Repository } from '../../../../src/repository/repository';
import { EntityCreationAttributes } from '../../../../src/types/entity/Creation';
import Decimal from 'decimal.js'



const sequelize = connection
if (!sequelize) throw new Error('Instance Sequelize is undefined')

// REPOSITORIES - initialize a repository for each entity type under test
const productRepository = await (async () => 
    Repository.init(connection, productMetadata, Product))()
const productImporterRepository = await (async () => 
    Repository.init(connection, productImporterMetadata, ProductImporter))()
const shopRepository = await (async () => 
    Repository.init(connection, shopMetadata, Shop))()
const categoryRepository = await (async () => 
    Repository.init(connection, categoryMetadata, Category))()
const userRepository = await (async () => 
    Repository.init(connection, userMetadata, User))()
const priceRepository = await (async () => 
    Repository.init(connection, priceMetadata, Price))()
const commentRepository = await (async () => 
    Repository.init(connection, commentMetadata, Comment))()
const rateRepository = await (async () => 
    Repository.init(connection, rateMetadata, Rate))()
const productCategoryRepository = await (async () => 
    Repository.init(connection, productCategoryMetadata, ProductCategory))()
const specificationTreeRepository = await (async () => 
    Repository.init(connection, specificationTreeMetadata, SpecificationTree))()
const specificationRepository = await (async () => 
    Repository.init(connection, specificationMetadata, Specification))()


async function seedDatabase() {
    await ProductImporter.bulkCreate(productImporterData)
    await Shop.bulkCreate([...shopData, ...shopData2])
    await Product.bulkCreate([...productData, ...productData2])
    await Price.bulkCreate([...priceData, ...priceData2, ...priceData3])
    await Category.bulkCreate([...categoryData, ...categoryData2])
    await User.bulkCreate(userData)
    await Comment.bulkCreate(commentData)
    await ProductCategory.bulkCreate(productCategoryData2)
    await SpecificationTree.bulkCreate(specificationTreeData)
    await Specification.bulkCreate(specificationData)
    await Rate.bulkCreate(rateData)
}



describe('manager: Test Repository manager functions createOne, deleteOne, destroyAll', () => {
    before(async () => {
        await seedDatabase()
    })

    // ==========================================================================
    // CREATE ONE
    // ==========================================================================
    describe('createOne - insert a single record through the manager', () => {

        describe('raw=true (returns Sequelize model instance)', () => {

            it('should create a product with all required fields and return Sequelize model', async () => {
                const newProductData: EntityCreationAttributes<ProductEntity> = {
                    importer_id: 1,
                    type: 'laptop',
                    brand: 'TestBrand',
                    model: 'TestModel-Create-01',
                    image: null,
                    description: 'Test product for createOne',
                    variant: 'NEW-VARIANT-CREATE-01',
                    variant_second: null,
                }
                const result = await productRepository.createOne(newProductData, true) 

                assert(result, 'result should be defined (Sequelize model)')
                assert.strictEqual(result.get('variant'), 'NEW-VARIANT-CREATE-01')
                assert.strictEqual(result.get('brand'), 'TestBrand')
                assert.strictEqual(result.get('model'), 'TestModel-Create-01')
                assert.strictEqual(result.get('importer_id'), 1)
                assert.strictEqual(result.get('active'), true, 'default active should be true')

                // verify record exists in DB
                const inDb = await Product.findOne({ where: { variant: 'NEW-VARIANT-CREATE-01' } })
                assert(inDb, 'created record should be persisted in DB')
                assert.strictEqual(inDb!.get('brand'), 'TestBrand')
            })

            it('should create a product with explicit id, created, updated fields', async () => {
                const customId = 9001
                const createdDate = new Date('2024-01-01T10:00:00Z')
                const updatedDate = new Date('2024-01-02T10:00:00Z')
                const newProductData: EntityCreationAttributes<ProductEntity> = {
                    id: customId,
                    importer_id: 1,
                    type: 'laptop',
                    brand: 'TestBrand',
                    model: 'TestModel-With-Id',
                    image: null,
                    description: null,
                    variant: 'NEW-VARIANT-WITH-ID',
                    variant_second: null,
                    active: true,
                    created: createdDate,
                    updated: updatedDate,
                }
                const result = await productRepository.createOne(newProductData, true)

                assert(result)
                assert.strictEqual(result.get('id'), customId)
                assert.strictEqual(result.get('active'), true)

                const inDb = await Product.findByPk(customId)
                assert(inDb, 'record with custom id should be persisted')
                assert.strictEqual(inDb!.get('id'), customId)
            })

            it('should create a product with nullable fields set to null', async () => {
                const newProductData: EntityCreationAttributes<ProductEntity> = {
                    importer_id: 1,
                    type: 'smartphone',
                    brand: 'NullBrand',
                    model: 'NullModel',
                    image: null,
                    description: null,
                    variant: 'NEW-VARIANT-NULL-FIELDS',
                    variant_second: null,
                }
                const result = await productRepository.createOne(newProductData, true)

                assert(result)
                assert.strictEqual(result.get('image'), null)
                assert.strictEqual(result.get('description'), null)
                assert.strictEqual(result.get('variant_second'), null)
            })

            it('should create a product with active=false', async () => {
                const newProductData: EntityCreationAttributes<ProductEntity> = {
                    importer_id: 1,
                    type: 'monitor',
                    brand: 'InactiveBrand',
                    model: 'InactiveModel',
                    image: null,
                    description: null,
                    variant: 'NEW-VARIANT-INACTIVE',
                    variant_second: null,
                    active: false,
                }
                const result = await productRepository.createOne(newProductData, true)

                assert(result)
                assert.strictEqual(result.get('active'), false)

                const inDb = await Product.findOne({ where: { variant: 'NEW-VARIANT-INACTIVE' } })
                assert(inDb)
                assert.strictEqual(inDb!.get('active'), false)
            })

            it('should create a product importer', async () => {
                const data: EntityCreationAttributes<ProductImporterEntity> = {
                    name: 'New Test Importer',
                    active: true,
                    created: new Date('2024-06-01T00:00:00Z'),
                    updated: new Date('2024-06-01T00:00:00Z'),
                }
                const result = await productImporterRepository.createOne(data, true)

                assert(result)
                assert.strictEqual(result.get('name'), 'New Test Importer')
                assert.strictEqual(result.get('active'), true)

                const inDb = await ProductImporter.findOne({ where: { name: 'New Test Importer' } })
                assert(inDb)
            })

            it('should create a shop', async () => {
                const data: EntityCreationAttributes<ShopEntity> = {
                    name: 'New Test Shop',
                    founded: new Date('2010-01-01T00:00:00Z'),
                    active: true,
                    updated: new Date('2024-06-01T00:00:00Z'),
                    created: new Date('2024-06-01T00:00:00Z'),
                }
                const result = await shopRepository.createOne(data, true)

                assert(result)
                assert.strictEqual(result.get('name'), 'New Test Shop')

                const inDb = await Shop.findOne({ where: { name: 'New Test Shop' } })
                assert(inDb)
            })

            it('should create a category', async () => {
                const data: EntityCreationAttributes<CategoryEntity> = {
                    name: 'New Test Category',
                    slug: 'new-test-category',
                    parent_id: null,
                    active: true,
                    created: new Date('2024-06-01T00:00:00Z'),
                    updated: new Date('2024-06-01T00:00:00Z'),
                }
                const result = await categoryRepository.createOne(data, true)

                assert(result)
                assert.strictEqual(result.get('name'), 'New Test Category')
                assert.strictEqual(result.get('parent_id'), null)
            })

            it('should create a user', async () => {
                const data: EntityCreationAttributes<UserEntity> = {
                    name: 'Test User',
                    login: 'testusercreate',
                    email: 'testusercreate@example.com',
                    password: 'hashed_test_password',
                    active: true,
                    created: new Date('2024-06-01T00:00:00Z'),
                    updated: new Date('2024-06-01T00:00:00Z'),
                }
                const result = await userRepository.createOne(data, true)

                assert(result)
                assert.strictEqual(result.get('login'), 'testusercreate')

                const inDb = await User.findOne({ where: { login: 'testusercreate' } })
                assert(inDb)
            })
        })

        describe('createOne(data) with no raw parameter - (returns formatted entity — intended)', () => {

            it('should create a product and return formatted entity (no external references)', async () => {
                const newProductData: EntityCreationAttributes<ProductEntity> = {
                    importer_id: 1,
                    type: 'laptop',
                    brand: 'EntityBrand',
                    model: 'EntityModel',
                    image: null,
                    description: 'Entity formated product',
                    variant: 'NEW-VARIANT-ENTITY-FORM',
                    variant_second: null,
                }
                const result = await productRepository.createOne(newProductData)

                assert(result, 'result should be defined (entity)')
                assert.strictEqual(result.variant, 'NEW-VARIANT-ENTITY-FORM')
                assert.strictEqual(result.brand, 'EntityBrand')
                assert.strictEqual(result.model, 'EntityModel')
                assert.strictEqual(result.description, 'Entity formated product')

                // entity form - should NOT have Sequelize model methods
                assert.strictEqual('get' in result, false)
                assert.strictEqual('save' in result, false)
            })

            it('should create a price with Decimal-converted entity values via raw=true', async () => {
                // Price model has Decimal type for 'price' field
                const newPriceData: EntityCreationAttributes<PriceEntity> = {
                    price: 1234.56,
                    shop_id: 10,
                    url: 'https://test-shop.example/new',
                    product_id: 1,
                    active: true,
                    updated: new Date('2024-06-01T10:00:00Z'),
                    created: new Date('2024-06-01T10:00:00Z'),
                }
                const result = await priceRepository.createOne(newPriceData)

                assert(result, 'entity should be returned')
                assert.strictEqual(result.url, 'https://test-shop.example/new')
                assert.strictEqual(result.shop_id, 10)
                assert.strictEqual(result.product_id, 1)
                assert.strictEqual(result.active, true)

                // verify the price is Decimal-converted
                assert(result.price instanceof Decimal, 'price should be a Decimal instance')
                assert.strictEqual((result.price).toString(), '1234.56')

                // verify in DB
                const inDb = await Price.findOne({ where: { url: 'https://test-shop.example/new' } })
                assert(inDb)
            })

            it('should create a product importer and return entity form', async () => {
                const data: EntityCreationAttributes<ProductImporterEntity> = {
                    name: 'Entity Test Importer',
                    active: true,
                    created: new Date('2024-06-02T00:00:00Z'),
                    updated: new Date('2024-06-02T00:00:00Z'),
                }
                const result = await productImporterRepository.createOne(data)

                assert(result)
                assert.strictEqual(result.name, 'Entity Test Importer')
                assert.strictEqual(result.active, true)
                assert(result.created instanceof Date)
                assert(result.updated instanceof Date)
            })

            it('should create a shop and return entity form', async () => {
                const data: EntityCreationAttributes<ShopEntity> = {
                    name: 'Entity Test Shop',
                    founded: new Date('2015-01-01T00:00:00Z'),
                    active: true,
                    updated: new Date('2024-06-02T00:00:00Z'),
                    created: new Date('2024-06-02T00:00:00Z'),
                }
                const result = await shopRepository.createOne(data)

                assert(result)
                assert.strictEqual(result.name, 'Entity Test Shop')
                assert(result.founded instanceof Date)
            })

            it('should create a category and return entity form', async () => {
                const data: EntityCreationAttributes<CategoryEntity> = {
                    name: 'Entity Test Category',
                    slug: 'entity-test-category',
                    parent_id: null,
                    active: true,
                    created: new Date('2024-06-02T00:00:00Z'),
                    updated: new Date('2024-06-02T00:00:00Z'),
                }
                const result = await categoryRepository.createOne(data)

                assert(result)
                assert.strictEqual(result.name, 'Entity Test Category')
                assert.strictEqual(result.slug, 'entity-test-category')
                assert.strictEqual(result.parent_id, null)
                assert.strictEqual(result.active, true)
            })

            it('should create a user and return entity form with hash field preserved', async () => {
                const data: EntityCreationAttributes<UserEntity> = {
                    name: 'Entity User',
                    login: 'entityusercreate',
                    email: 'entityusercreate@example.com',
                    password: 'hashed_entity_password',
                    active: true,
                    created: new Date('2024-06-02T00:00:00Z'),
                    updated: new Date('2024-06-02T00:00:00Z'),
                }
                const result = await userRepository.createOne(data)

                assert(result)
                assert.strictEqual(result.name, 'Entity User')
                assert.strictEqual(result.login, 'entityusercreate')
                assert.strictEqual(result.email, 'entityusercreate@example.com')
                assert.strictEqual(result.password, 'hashed_entity_password')
            })

            it('should create a comment and return entity form', async () => {
                const data: EntityCreationAttributes<CommentEntity> = {
                    product_id: 1,
                    user_id: 1,
                    content: 'Test comment created via repository',
                    active: true,
                    created: new Date('2024-06-02T00:00:00Z'),
                    updated: new Date('2024-06-02T00:00:00Z'),
                }
                const result = await commentRepository.createOne(data)

                assert(result)
                assert.strictEqual(result.content, 'Test comment created via repository')
                assert.strictEqual(result.product_id, 1)
                assert.strictEqual(result.user_id, 1)
                assert.strictEqual(result.active, true)
            })

            it('should create a rate and return entity form', async () => {
                const data: EntityCreationAttributes<RateEntity> = {
                    id: 100,
                    comment_id: 4,
                    user_id: 1,
                    rate: 4,
                    active: true,
                    created: new Date('2024-06-02T00:00:00Z'),
                    updated: new Date('2024-06-02T00:00:00Z'),
                }
                const result = await rateRepository.createOne(data)

                assert(result)
                assert.strictEqual(result.id, 100)
                assert.strictEqual(result.rate, 4)
                assert.strictEqual(result.comment_id, 4)
                assert.strictEqual(result.user_id, 1)
            })

            it('should create a product-category junction and return entity form', async () => {
                const data: EntityCreationAttributes<ProductCategoryEntity> = {
                    product_id: 1,
                    category_id: 2,
                    is_primary: true,
                    active: true,
                    created: new Date('2024-06-02T00:00:00Z'),
                    updated: new Date('2024-06-02T00:00:00Z'),
                }
                const result = await productCategoryRepository.createOne(data)

                assert(result)
                assert.strictEqual(result.product_id, 1)
                assert.strictEqual(result.category_id, 2)
                assert.strictEqual(result.is_primary, true)
            })

            it('should create a specification tree and return entity form', async () => {
                const data: EntityCreationAttributes<SpecificationTreeEntity> = {
                    product_id: 2,
                    specification_type: 'headphones',
                    active: true,
                    created: new Date('2024-06-02T00:00:00Z'),
                    updated: new Date('2024-06-02T00:00:00Z'),
                }
                const result = await specificationTreeRepository.createOne(data)

                assert(result)
                assert.strictEqual(result.product_id, 2)
                assert.strictEqual(result.specification_type, 'headphones')
            })

            it('should create a specification and return entity form', async () => {
                const data: EntityCreationAttributes<SpecificationEntity> = {
                    specification_tree_id: 1,
                    specification: 'Test: custom specification created via repository',
                    active: true,
                    created: new Date('2024-06-02T00:00:00Z'),
                    updated: new Date('2024-06-02T00:00:00Z'),
                }
                const result = await specificationRepository.createOne(data)

                assert(result)
                assert.strictEqual(result.specification_tree_id, 1)
                assert.strictEqual(result.specification, 'Test: custom specification created via repository')
            })
        })

        describe('verify multiple creates in sequence', () => {

            it('should create multiple records and assign different auto-increment ids', async () => {
                const data1: EntityCreationAttributes<CategoryEntity> = {
                    name: 'Multi Create Category 1',
                    slug: 'multi-create-1',
                    parent_id: null,
                    active: true,
                    created: new Date('2024-06-03T00:00:00Z'),
                    updated: new Date('2024-06-03T00:00:00Z'),
                }
                const data2: EntityCreationAttributes<CategoryEntity> = {
                    name: 'Multi Create Category 2',
                    slug: 'multi-create-2',
                    parent_id: null,
                    active: true,
                    created: new Date('2024-06-03T00:00:00Z'),
                    updated: new Date('2024-06-03T00:00:00Z'),
                }
                const result1 = await categoryRepository.createOne(data1, true)
                const result2 = await categoryRepository.createOne(data2, true)

                assert(result1)
                assert(result2)
                assert.notStrictEqual(result1.get('id'), result2.get('id'),
                    'auto-incremented ids should be different')
            })

            it('should persist all created records in the DB after sequential creation', async () => {
                const data: EntityCreationAttributes<ShopEntity> = {
                    name: 'Sequential Create Shop 1',
                    founded: null,
                    active: true,
                    updated: new Date('2024-06-03T00:00:00Z'),
                    created: new Date('2024-06-03T00:00:00Z'),
                }
                const data2: EntityCreationAttributes<ShopEntity> = {
                    name: 'Sequential Create Shop 2',
                    founded: null,
                    active: true,
                    updated: new Date('2024-06-03T00:00:00Z'),
                    created: new Date('2024-06-03T00:00:00Z'),
                }
                await shopRepository.createOne(data)
                await shopRepository.createOne(data2)

                const inDb1 = await Shop.findOne({ where: { name: 'Sequential Create Shop 1' } })
                const inDb2 = await Shop.findOne({ where: { name: 'Sequential Create Shop 2' } })
                assert(inDb1, 'first record should be persisted')
                assert(inDb2, 'second record should be persisted')
            })
        })
    })


    // ==========================================================================
    // DELETE ONE
    // ==========================================================================
    describe('deleteOne - remove a single record by id through the manager', () => {

        describe('delete existing records', () => {

            it('should delete an existing product and return true', async () => {
                // pick a product to delete - the test product with variant 'TestVariant'
                const before = await Product.findOne({ where: { variant: 'TestVariant' } })
                assert(before, 'TestVariant product should exist before delete')

                const result = await productRepository.deleteOne(before.get('id'))
                assert.strictEqual(result, true, 'deleteOne should return true for existing record')

                // verify it's gone
                const after = await Product.findByPk(before.get('id'))
                assert.strictEqual(after, null, 'record should be removed from DB')
            })

            it('should delete an existing category and return true', async () => {
                const before = await Category.findByPk(9)
                assert(before, 'category id 9 should exist (Audio)')

                const result = await categoryRepository.deleteOne(9)
                assert.strictEqual(result, true)

                const after = await Category.findByPk(9)
                assert.strictEqual(after, null)
            })

            it('should delete an existing shop and return true', async () => {
                const before = await Shop.findByPk(60)
                assert(before)

                const result = await shopRepository.deleteOne(60)
                assert.strictEqual(result, true)

                const after = await Shop.findByPk(60)
                assert.strictEqual(after, null)
            })

            it('should delete an existing user and return true', async () => {
                const before = await User.findByPk(3)
                assert(before)

                const result = await userRepository.deleteOne(3)
                assert.strictEqual(result, true)

                const after = await User.findByPk(3)
                assert.strictEqual(after, null)
            })
        })

        describe('delete non-existing records', () => {

            it('should return false when deleting a non-existent id', async () => {
                const result = await productRepository.deleteOne(99999)
                assert.strictEqual(result, false, 'deleteOne should return false for non-existent id')
            })

            it('should return false when deleting an already-deleted id (idempotent check)', async () => {
                // first delete
                await productRepository.deleteOne(3)
                // second delete (idempotency check)
                const result = await productRepository.deleteOne(3)
                assert.strictEqual(result, false, 'second deleteOne should return false (record already gone)')
            })

            it('should return false when deleting with id 0', async () => {
                const result = await productRepository.deleteOne(0)
                assert.strictEqual(result, false)
            })

            it('should return false when deleting with a very large id', async () => {
                const result = await categoryRepository.deleteOne(99999999)
                assert.strictEqual(result, false)
            })
        })

        describe('delete on different entity types', () => {

            it('should delete a product importer and return true', async () => {
                const result = await productImporterRepository.deleteOne(3)
                assert.strictEqual(result, true)

                const after = await ProductImporter.findByPk(3)
                assert.strictEqual(after, null)
            })

            it('should delete a comment and return true', async () => {
                const result = await commentRepository.deleteOne(17)
                assert.strictEqual(result, true)

                const after = await Comment.findByPk(17)
                assert.strictEqual(after, null)
            })

            it('should delete a rate and return true', async () => {
                const result = await rateRepository.deleteOne(100)
                assert.strictEqual(result, true)

                const after = await Rate.findByPk(100)
                assert.strictEqual(after, null)
            })

            it('should delete a product-category junction and return true', async () => {
                const result = await productCategoryRepository.deleteOne(16)
                assert.strictEqual(result, true)

                const after = await ProductCategory.findByPk(16)
                assert.strictEqual(after, null)
            })

            it('should delete a specification tree and return true', async () => {
                const result = await specificationTreeRepository.deleteOne(13)
                assert.strictEqual(result, true)

                const after = await SpecificationTree.findByPk(13)
                assert.strictEqual(after, null)
            })

            it('should delete a specification and return true', async () => {
                const result = await specificationRepository.deleteOne(22)
                assert.strictEqual(result, true)

                const after = await Specification.findByPk(22)
                assert.strictEqual(after, null)
            })

            it('should delete a price and return true', async () => {
                const result = await priceRepository.deleteOne(29)
                assert.strictEqual(result, true)

                const after = await Price.findByPk(29)
                assert.strictEqual(after, null)
            })
        })

        describe('verify side-effects of deleteOne', () => {

            it('should not affect other records when deleting one by id', async () => {
                // delete one product
                await productRepository.deleteOne(2)

                // other products should still exist
                const other1 = await Product.findByPk(4)
                const other2 = await Product.findByPk(5)
                const other3 = await Product.findByPk(13)
                assert(other1, 'product 4 should still exist')
                assert(other2, 'product 5 should still exist')
                assert(other3, 'product 13 should still exist')
            })
        })
    })


    // ==========================================================================
    // DESTROY ALL
    // ==========================================================================
    describe('destroyAll - remove multiple records through the manager', () => {

        describe('destroyAll with no where clause', () => {

            it('should delete ALL product importer records when where is omitted', async () => {
                const before = await ProductImporter.findAll()
                assert(before.length > 0, 'should have product importers before destroy')

                const count = await productImporterRepository.destroyAll()
                assert.strictEqual(count, before.length, 
                    'destroyAll should return number of deleted records')

                const after = await ProductImporter.findAll()
                assert.strictEqual(after.length, 0, 'no records should remain')
            })

            it('should delete ALL shop records when where is omitted', async () => {
                const before = await Shop.findAll()
                assert(before.length > 0)

                const count = await shopRepository.destroyAll()
                assert.strictEqual(count, before.length)

                const after = await Shop.findAll()
                assert.strictEqual(after.length, 0)
            })

            it('should return 0 when destroying all from empty table', async () => {
                // already cleared in previous test
                const count = await productImporterRepository.destroyAll()
                assert.strictEqual(count, 0)
            })
        })

        describe('destroyAll with where clause (single condition)', () => {

            it('should delete only records matching a single-condition where', async () => {
                // delete all categories where active = false
                const before = await Category.findAll({ where: { active: false } })
                assert(before.length > 0, 'should have inactive categories before destroy')

                const totalBefore = await Category.count()
                const count = await categoryRepository.destroyAll({ active: false })
                assert.strictEqual(count, before.length)

                const after = await Category.findAll({ where: { active: false } })
                assert.strictEqual(after.length, 0, 'no inactive categories should remain')

                // active categories should still exist
                const activeAfter = await Category.findAll({ where: { active: true } })
                assert(activeAfter.length > 0, 'active categories should still exist')
                assert.strictEqual(activeAfter.length, totalBefore - before.length,
                    'remaining count should be original minus deleted')
            })

            it('should delete comments matching a single-condition where', async () => {
                // delete all comments where active = false
                const before = await Comment.findAll({ where: { active: false } })

                if (before.length === 0) {
                    // if no inactive comments, skip (or count should be 0)
                    const count = await commentRepository.destroyAll({ active: false })
                    assert.strictEqual(count, 0)
                    return
                }

                const count = await commentRepository.destroyAll({ active: false })
                assert.strictEqual(count, before.length)

                const after = await Comment.findAll({ where: { active: false } })
                assert.strictEqual(after.length, 0)
            })

            it('should delete products matching a specific brand', async () => {
                // delete all products where brand = 'Samsung' (active ones)
                const before = await Product.findAll({ where: { brand: 'Samsung', active: true } })
                const samsungActiveCount = before.length

                const count = await productRepository.destroyAll({ brand: 'Samsung', active: true })
                assert.strictEqual(count, samsungActiveCount)

                const after = await Product.findAll({ where: { brand: 'Samsung', active: true } })
                assert.strictEqual(after.length, 0)
            })
        })

        describe('destroyAll with where clause (multiple conditions)', () => {

            it('should delete records matching multiple AND conditions', async () => {
                // delete all rates where active=true AND rate=5
                const before = await Rate.findAll({ where: { active: true, rate: 5 } })
                const beforeCount = before.length

                const count = await rateRepository.destroyAll({ active: true, rate: 5 })
                assert.strictEqual(count, beforeCount)

                const after = await Rate.findAll({ where: { active: true, rate: 5 } })
                assert.strictEqual(after.length, 0)
            })

            it('should delete categories by parent_id condition', async () => {
                // delete categories with parent_id = 2 (children of Laptops)
                const before = await Category.findAll({ where: { parent_id: 2 } })
                const beforeCount = before.length

                const count = await categoryRepository.destroyAll({ parent_id: 2 })
                assert.strictEqual(count, beforeCount)

                const after = await Category.findAll({ where: { parent_id: 2 } })
                assert.strictEqual(after.length, 0)
            })

            it('should delete specifications matching specification_tree_id and active', async () => {
                const before = await Specification.findAll({ 
                    where: { specification_tree_id: 1, active: true } 
                })
                const beforeCount = before.length

                const count = await specificationRepository.destroyAll({ 
                    specification_tree_id: 1, active: true 
                })
                assert.strictEqual(count, beforeCount)

                const after = await Specification.findAll({ 
                    where: { specification_tree_id: 1, active: true } 
                })
                assert.strictEqual(after.length, 0)
            })
        })

        describe('destroyAll with where matching no records', () => {

            it('should return 0 when no records match the where clause', async () => {
                const count = await productRepository.destroyAll({ 
                    variant: 'NON-EXISTENT-VARIANT-XYZ' 
                })
                assert.strictEqual(count, 0)
            })

            it('should return 0 when destroying non-existent entity type fields', async () => {
                const count = await userRepository.destroyAll({ login: 'nonexistent_user_xyz' })
                assert.strictEqual(count, 0)
            })
        })

        describe('verify side-effects of destroyAll', () => {

            it('should not affect unrelated records when using where clause', async () => {
                // take a snapshot of all products
                const beforeCount = await Product.count()

                // destroy all with very specific condition (should affect 0 records)
                const count = await productRepository.destroyAll({ 
                    variant: 'NON-EXISTENT-VARIANT-XYZ' 
                })
                assert.strictEqual(count, 0)

                const afterCount = await Product.count()
                assert.strictEqual(afterCount, beforeCount,
                    'product count should be unchanged')
            })

            it('should preserve records NOT matching the where clause', async () => {
                // delete all comments where user_id = 1
                const before = await Comment.count()
                const toDelete = await Comment.findAll({ where: { user_id: 1 } })

                const count = await commentRepository.destroyAll({ user_id: 1 })
                assert.strictEqual(count, toDelete.length)

                const after = await Comment.count()
                assert.strictEqual(after, before - toDelete.length,
                    'remaining comment count should equal before minus deleted')

                // verify no remaining comment has user_id = 1
                const remainingUser1 = await Comment.findAll({ where: { user_id: 1 } })
                assert.strictEqual(remainingUser1.length, 0)
            })
        })
    })


    // ==========================================================================
    // INTEGRATION: combined usage of createOne, deleteOne, destroyAll
    // ==========================================================================
    describe('integration: combined usage of createOne, deleteOne, destroyAll', () => {

        it('should support full lifecycle: createOne -> verify -> deleteOne -> verify gone', async () => {
            // CREATE
            const createData: EntityCreationAttributes<ShopEntity> = {
                name: 'Lifecycle Test Shop',
                founded: new Date('2018-01-01T00:00:00Z'),
                active: true,
                updated: new Date('2024-06-05T00:00:00Z'),
                created: new Date('2024-06-05T00:00:00Z'),
            }
            const created = await shopRepository.createOne(createData, true)
            assert(created)
            const createdId = created.get('id') 

            // VERIFY exists
            const inDb = await Shop.findByPk(createdId)
            assert(inDb, 'created record should be in DB')
            assert.strictEqual(inDb!.get('name'), 'Lifecycle Test Shop')

            // DELETE
            const deleted = await shopRepository.deleteOne(createdId)
            assert.strictEqual(deleted, true)

            // VERIFY gone
            const afterDelete = await Shop.findByPk(createdId)
            assert.strictEqual(afterDelete, null)
        })

        it('should support batch lifecycle: createOne multiple -> destroyAll where -> verify', async () => {
            // CREATE multiple categories with same parent
            const parentId = 1
            const createdNames: string[] = []
            for (let i = 0; i < 3; i++) {
                const data: EntityCreationAttributes<CategoryEntity> = {
                    name: `Batch Lifecycle Category ${i}`,
                    slug: `batch-lifecycle-${i}`,
                    parent_id: parentId,
                    active: true,
                    created: new Date('2024-06-05T00:00:00Z'),
                    updated: new Date('2024-06-05T00:00:00Z'),
                }
                const created = await categoryRepository.createOne(data, true)
                assert(created)
                createdNames.push(created.get('name'))
            }

            // VERIFY all created
            for (const name of createdNames) {
                const inDb = await Category.findOne({ where: { name } })
                assert(inDb, `category ${name} should be in DB`)
            }

            // DESTROY ALL where parent_id = parentId
            const count = await categoryRepository.destroyAll({ parent_id: parentId })
            assert(count >= 3, 'at least 3 should be destroyed')

            // VERIFY created ones are gone
            for (const name of createdNames) {
                const after = await Category.findOne({ where: { name } })
                assert.strictEqual(after, null, `category ${name} should be gone`)
            }
        })
    })
})
