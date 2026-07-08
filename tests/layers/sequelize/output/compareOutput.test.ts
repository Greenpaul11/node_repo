import { strict as assert } from 'node:assert'
import { it, describe, before } from "node:test";
import connection from '../../../../config/connection';
import { Product, Comment, ProductImporter, User, Rate, SpecificationTree, Category, ProductCategory, Price } from '../../../testSkeleton/entities'

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
    productCategoryData,
    specificationTreeData,

} from '../../../testSkeleton/testData/dataExtended2';
import {
    ProductImporter as ProductImporterModel,
    Product as ProductModel,
    Price as PriceModel,
    Shop as ShopModel,
    Comment as CommentModel,
    Rate as RateModel,
    User as UserModel,
    Category as CategoryModel,
    ProductCategory as ProductCategoryModel,
    SpecificationTree as SpecificationTreeModel,
    Specification as SpecificationModel,
} from '../../../testSkeleton/models.js';
import { 
    priceMetadata,
    productImporterMetadata, 
    productMetadata,
    commentMetadata,
    rateMetadata,
    userMetadata,
    categoryMetadata,
    productCategoryMetadata,
    specificationTreeMetadata,
} from '../../../testSkeleton/config'
import { EntityRelationTree } from '../../../../src/types/entity/Metadata';
import { Query } from '../../../../src/types/entity/Query';
import Decimal from 'decimal.js'
import { createRelationTree } from '../../../../src/tree/treeBuilders';
import { OutputFormater } from '../../../../src/layers/sequelize/output/formater';



const sequelize = connection
if (!sequelize) throw new Error('Instance Sequelize is undefined')
const dialect = sequelize.getDialect() as 'mysql' | 'sqlite'

const productTree: EntityRelationTree<Product> = createRelationTree(productMetadata)
const commentTree: EntityRelationTree<Comment> = createRelationTree(commentMetadata)
const productImporterTree: EntityRelationTree<ProductImporter> = createRelationTree(productImporterMetadata)
const userTree: EntityRelationTree<User> = createRelationTree(userMetadata)
const rateTree: EntityRelationTree<Rate> = createRelationTree(rateMetadata)
const specificationTreeTree: EntityRelationTree<SpecificationTree> = createRelationTree(specificationTreeMetadata)
const categoryTree: EntityRelationTree<Category> = createRelationTree(categoryMetadata)
const productCategoryTree: EntityRelationTree<ProductCategory> = createRelationTree(productCategoryMetadata)
const priceTree: EntityRelationTree<Price> = createRelationTree(priceMetadata)

// FORMATERS
const productFormater = new OutputFormater(productMetadata, productTree, dialect)
const commentFormater = new OutputFormater(commentMetadata, commentTree, dialect)
const productImporterFormater = new OutputFormater(productImporterMetadata, productImporterTree, dialect)
const userFormater = new OutputFormater(userMetadata, userTree, dialect)
const rateFormater = new OutputFormater(rateMetadata, rateTree, dialect)
const specificationTreeFormater = new OutputFormater(specificationTreeMetadata, specificationTreeTree, dialect)
const categoryFormater = new OutputFormater(categoryMetadata, categoryTree, dialect)
const productCategoryFormater = new OutputFormater(productCategoryMetadata, productCategoryTree, dialect)
const priceFormater = new OutputFormater(priceMetadata, priceTree, dialect)



async function seedDatabase() {
    await ProductImporterModel.bulkCreate(productImporterData)
    await ShopModel.bulkCreate([...shopData, ...shopData2])
    await ProductModel.bulkCreate([...productData, ...productData2])
    await PriceModel.bulkCreate([...priceData, ...priceData2, ...priceData3])
    await CategoryModel.bulkCreate([...categoryData, ...categoryData2])
    await UserModel.bulkCreate(userData)
    await CommentModel.bulkCreate(commentData)
    await ProductCategoryModel.bulkCreate(productCategoryData)
    await SpecificationTreeModel.bulkCreate(specificationTreeData)
    await RateModel.bulkCreate(rateData)
}



describe('compareOutput: Compare Sequelize query outputs with formated otutput as result of (raw/nest options)/toJSON', () => {
    before(async () => {
        await seedDatabase()
    })

    describe('simple queries without relations', () => {

        it('findOne - simple product without relations', async () => {
            const variant = 'TestVariant'
            
            const asModel = await ProductModel.findOne({
                where: { variant: variant }
            })
            const asPlain = asModel ? asModel.toJSON() : asModel
            
            // formater 
            const query = { variant: variant }
            const converted = productFormater.asEntity(asModel, query)
            
            assert.deepStrictEqual(asPlain, converted)
        })

        it('findAll - all products without relations', async () => {
            const asModel = await ProductModel.findAll({
                where: {}
            })
            const asPlain = asModel.map(m => m.toJSON())
            
            // formater 
            const asRaw = await ProductModel.findAll({
                where: {},
                raw: true,
                nest: true
            }) 
            const query = {}
            const converted = productFormater.asEntities(asRaw, query)
            
            assert.strictEqual(asPlain.length, converted.length)
            assert.deepStrictEqual(asPlain, converted)
        })
    })
    
    describe('test 1-level depth relations queries', () => {
        it('one to one: Product -> SpecificationTree (findOne)', async () => {
            const id = 1
            
            const asModel = await ProductModel.findOne({
                where: { id: id },
                include: [{ model: SpecificationTreeModel, as: 'specification_tree', attributes: ['id', 'specification_type'] }]
            })
            const asPlain = asModel ? asModel.toJSON() : asModel

            // formater 
            const query: Query<Product> = { 
                id: id,
                specification_tree: {
                    select: ['id', 'specification_type']
                }
            }
            const converted = productFormater.asEntity(asModel, query)
            
            assert.deepStrictEqual(asPlain, converted)
        })
        
        it('one to one: Product -> SpecificationTree (findAll)', async () => {
            const active = true
           
            const asModel = await ProductModel.findAll({
                where: { active: active },
                include: [{ model: SpecificationTreeModel, as: 'specification_tree', attributes: ['id', 'specification_type'] }]
            })
            const asPlain = asModel.map(m => m.toJSON())

            // formater 
            const asRaw = await ProductModel.findAll({
                where: { active: active },
                include: [{ model: SpecificationTreeModel, as: 'specification_tree', attributes: ['id', 'specification_type'] }],
                raw: true,
                nest: true
            }) 
            const query: Query<Product> = { 
                active: active,
                specification_tree: {
                    select: ['id', 'specification_type']
                }
            }
            const converted = productFormater.asEntities(asRaw, query)

            assert.deepStrictEqual(asPlain, converted)
        })

        it('one to many: Product -> Prices (findOne)', async () => {
            const id = 1

            const asModel = await ProductModel.findOne({
                where: { id: id },
                include: [{ model: PriceModel, as: 'prices', attributes: ['id', 'price'] }]
            })
            const asPlain = asModel ? asModel.toJSON() : asModel
            assert(asPlain)
            assert(asPlain.prices)
            asPlain['prices'].forEach((p) => {  // match Decimal type
                p.price = new Decimal(p.price) as any
            })
            
            // formater 
            const query: Query<Product> = { 
                id: id,
                prices: {
                    select: ['id', 'price']
                }
            }
            const converted = productFormater.asEntity(asModel, query)

            assert.deepStrictEqual(asPlain, converted)
        })

        it('one to many: Product -> Prices (findAll)', async () => {
            const active = true
           
            const asModel = await ProductModel.findAll({
                include: [{ model: PriceModel, as: 'prices', attributes: ['id', 'price'], where: { active: active} }]
            })
            const asPlain = asModel.map(m => m.toJSON())
            asPlain.forEach((pr) => {
                pr.prices?.forEach((p) => {
                    p.price = new Decimal(p.price) as any
                })
            })
        
            // formater 
            const asRaw = await ProductModel.findAll({
                include: [{ model: PriceModel, as: 'prices', attributes: ['id', 'price'], where: { active: active} }],
                raw: true,
                nest: true
            }) 
            const query: Query<Product> = { 
                prices: {
                    active: true,
                    select: ['id', 'price']
                }
            }
            const converted = productFormater.asEntities(asRaw, query)
    
            assert.deepStrictEqual(asPlain, converted)
        })
        
        it('many to one: Comment -> Product (findOne)', async () => {
            const id = 1

            const asModel = await CommentModel.findOne({
                where: { id: id },
                include: [{ model: ProductModel, as: 'product', attributes: ['id', 'model'] }]
            })
            const asPlain = asModel ? asModel.toJSON() : asModel
            
            // formater 
            const query: Query<Comment> = { 
                id: id,
                product: {
                    select: ['id', 'model']
                }
            }
            const converted = commentFormater.asEntity(asModel, query)


            assert.deepStrictEqual(asPlain, converted)
        })        

        it('many to one: Comment -> Product (findAll)', async () => {
            const userId = 1
            const asModel = await CommentModel.findAll({
                where: { user_id: userId },
                include: [{ model: ProductModel, as: 'product'}]
            })
            const asPlain = asModel.map(m => m.toJSON())

            // formater 
            const asRaw = await CommentModel.findAll({
                where: { user_id: userId },
                include: [{ model: ProductModel, as: 'product'}],
                raw: true,
                nest: true
            }) 
            const query: Query<Comment> = { 
                user_id: userId,
                product: {}
            }
            const converted = commentFormater.asEntities(asRaw, query)
            assert.deepStrictEqual(asPlain, converted)
        })        
    })
    
    describe('test 2-level depth relations queries', () => {

        describe('one to one -> one to one: Product -> SpecificationTree -> Product', () => {
          
            it('findOne - root is Product', async () => {
                const id = 1
                
                const asModel = await ProductModel.findOne({
                    include: [{ 
                        model: SpecificationTreeModel, 
                        as: 'specification_tree', 
                        attributes: ['id', 'specification_type'],
                        include: [{
                            model: ProductModel,
                            as: 'product',
                            where: { id: id }
                        }]
                    }]
                })
                const asPlain = asModel ? asModel.toJSON() : asModel    
                // formater 
                const query: Query<Product> = { 
                    specification_tree: {
                        select: ['id', 'specification_type'],
                        product: {
                            id: id
                        }
                    }
                }
                const converted = productFormater.asEntity(asModel, query)

                assert.deepStrictEqual(asPlain, converted)            
            })

            it('findAll - root is Product', async () => {
                const active = true     
                const asModel = await ProductModel.findAll({
                    include: [{ 
                        model: SpecificationTreeModel, 
                        as: 'specification_tree', 
                        attributes: ['id', 'specification_type'],
                        include: [{
                            model: ProductModel,
                            as: 'product',
                            where: { active: active }
                        }]
                    }]
                })
                const asPlain = asModel.map(m => m.toJSON())

                // formater 
                const asRaw = await ProductModel.findAll({
                    include: [{ 
                        model: SpecificationTreeModel, 
                        as: 'specification_tree', 
                        attributes: ['id', 'specification_type'],
                        include: [{
                            model: ProductModel,
                            as: 'product',
                            where: { active: active }
                        }]
                    }],
                    raw: true,
                    nest: true
                })
                const query: Query<Product> = { 
                    specification_tree: {
                        select: ['id', 'specification_type'],
                        product: {
                            active: active
                        }
                    }
                }
                const converted = productFormater.asEntities(asRaw, query)      
                
                assert.deepStrictEqual(asPlain, converted)            
              })
            })
        })
        
        describe('one to one -> one to many: SpecificationTree -> Product -> Prices', () => {
            
            it('findOne - root is SpecificationTree', async () => {
                const id = 1
                
                const asModel = await SpecificationTreeModel.findOne({
                    where: { id: id },
                    include: [{ 
                        model: ProductModel, 
                        as: 'product', 
                        attributes: ['id', 'brand', 'model'],
                        include: [{
                            model: PriceModel,
                            as: 'prices',
                            attributes: ['id', 'price']
                        }]
                    }]
                })
                const asPlain = asModel ? asModel.toJSON() : asModel
                if (asPlain && asPlain.product) {
                    asPlain.product.prices?.forEach((p: any) => {
                        p.price = new Decimal(p.price) as any
                    })
                }

                const query: Query<SpecificationTree> = { 
                    id: id,
                    product: {
                        select: ['id', 'brand', 'model'],
                        prices: {
                            select: ['id', 'price']
                        }
                    }
                }
                const converted = specificationTreeFormater.asEntity(asModel, query)
                
                assert.deepStrictEqual(asPlain, converted)
            })

            it('findAll - root is SpecificationTree', async () => {
                const specificationType = 'smartphone'

                const asModel = await SpecificationTreeModel.findAll({
                    where: { specification_type: specificationType },
                    include: [{ 
                        model: ProductModel, 
                        as: 'product', 
                        attributes: ['id', 'brand', 'model'],
                        include: [{
                            model: PriceModel,
                            as: 'prices',
                            attributes: ['id', 'price']
                        }]
                    }]
                })
                const asPlain = asModel.map(m => m.toJSON())
                asPlain.forEach((specTree: any) => {
                    if (specTree.product) {
                        specTree.product.prices?.forEach((p: any) => {
                            p.price = new Decimal(p.price) as any
                        })
                    }
                })

                const asRaw = await SpecificationTreeModel.findAll({
                    where: { specification_type: specificationType },
                    include: [{ 
                        model: ProductModel, 
                        as: 'product', 
                        attributes: ['id', 'brand', 'model'],
                        include: [{
                            model: PriceModel,
                            as: 'prices',
                            attributes: ['id', 'price']
                        }]
                    }],
                    raw: true,
                    nest: true
                })
                const query: Query<SpecificationTree> = { 
                    specification_type: specificationType,
                    product: {
                        select: ['id', 'brand', 'model'],
                        prices: {
                            select: ['id', 'price']
                        }
                    }
                }
                const converted = specificationTreeFormater.asEntities(asRaw, query)

                assert.deepStrictEqual(asPlain, converted)
            })
        })
        
        describe('one to one -> many to one: SpecificationTree -> Product -> ProductImporter', () => {
            
            it('findOne - root is SpecificationTree', async () => {
                const id = 1
                
                const asModel = await SpecificationTreeModel.findOne({
                    where: { id: id },
                    include: [{ 
                        model: ProductModel, 
                        as: 'product', 
                        attributes: ['id', 'brand', 'model'],
                        include: [{
                            model: ProductImporterModel,
                            as: 'product_importer',
                            attributes: ['id', 'name']
                        }]
                    }]
                })
                const asPlain = asModel ? asModel.toJSON() : asModel

                const query: Query<SpecificationTree> = { 
                    id: id,
                    product: {
                        select: ['id', 'brand', 'model'],
                        product_importer: {
                            select: ['id', 'name']
                        }
                    }
                }
                const converted = specificationTreeFormater.asEntity(asModel, query)
                
                assert.deepStrictEqual(asPlain, converted)
            })

            it('findAll - root is SpecificationTree', async () => {
                const specificationType = 'smartphone'

                const asModel = await SpecificationTreeModel.findAll({
                    where: { specification_type: specificationType },
                    include: [{ 
                        model: ProductModel, 
                        as: 'product', 
                        attributes: ['id', 'brand', 'model'],
                        include: [{
                            model: ProductImporterModel,
                            as: 'product_importer',
                            attributes: ['id', 'name']
                        }]
                    }]
                })
                const asPlain = asModel.map(m => m.toJSON())

                const asRaw = await SpecificationTreeModel.findAll({
                    where: { specification_type: specificationType },
                    include: [{ 
                        model: ProductModel, 
                        as: 'product', 
                        attributes: ['id', 'brand', 'model'],
                        include: [{
                            model: ProductImporterModel,
                            as: 'product_importer',
                            attributes: ['id', 'name']
                        }]
                    }],
                    raw: true,
                    nest: true
                })
                const query: Query<SpecificationTree> = { 
                    specification_type: specificationType,
                    product: {
                        select: ['id', 'brand', 'model'],
                        product_importer: {
                            select: ['id', 'name']
                        }
                    }
                }
                const converted = specificationTreeFormater.asEntities(asRaw, query)

                assert.deepStrictEqual(asPlain, converted)
            })
        })

        describe('one to many -> one to one: ProductImporter -> Product -> SpecificationTree', () => {
            
            it('findOne - root is ProductImporter', async () => {
                const id = 1
                
                const asModel = await ProductImporterModel.findOne({
                    where: { id: id },
                    include: [{ 
                        model: ProductModel, 
                        as: 'products', 
                        attributes: ['id', 'brand', 'model'],
                        include: [{
                            model: SpecificationTreeModel,
                            as: 'specification_tree',
                            attributes: ['id', 'specification_type']
                        }]
                    }]
                })
                const asPlain = asModel ? asModel.toJSON() : asModel

                const query: Query<ProductImporter> = { 
                    id: id,
                    products: {
                        select: ['id', 'brand', 'model'],
                        specification_tree: {
                            select: ['id', 'specification_type']
                        }
                    }
                }
                const converted = productImporterFormater.asEntity(asModel, query)
                
                assert.deepStrictEqual(asPlain, converted)
            })

            it('findAll - root is ProductImporter', async () => {
                const active = true

                const asModel = await ProductImporterModel.findAll({
                    where: { active: active },
                    include: [{ 
                        model: ProductModel, 
                        as: 'products', 
                        attributes: ['id', 'brand', 'model'],
                        include: [{
                            model: SpecificationTreeModel,
                            as: 'specification_tree',
                            attributes: ['id', 'specification_type']
                        }]
                    }]
                })
                const asPlain = asModel.map(m => m.toJSON())

                const asRaw = await ProductImporterModel.findAll({
                    where: { active: active },
                    include: [{ 
                        model: ProductModel, 
                        as: 'products', 
                        attributes: ['id', 'brand', 'model'],
                        include: [{
                            model: SpecificationTreeModel,
                            as: 'specification_tree',
                            attributes: ['id', 'specification_type']
                        }]
                    }],
                    raw: true,
                    nest: true
                })
                const query: Query<ProductImporter> = { 
                    active: active,
                    products: {
                        select: ['id', 'brand', 'model'],
                        specification_tree: {
                            select: ['id', 'specification_type']
                        }
                    }
                }
                const converted = productImporterFormater.asEntities(asRaw, query)

                assert.deepStrictEqual(asPlain, converted)
            })
        })

        describe('one to many -> one to many: User -> Comment -> Rate', () => {
            
            it('findOne - root is User', async () => {
                const id = 1
                
                const asModel = await UserModel.findOne({
                    where: { id: id },
                    include: [{ 
                        model: CommentModel, 
                        as: 'comments', 
                        attributes: ['id', 'content'],
                        include: [{
                            model: RateModel,
                            as: 'rates',
                            attributes: ['id', 'rate']
                        }]
                    }]
                })
                const asPlain = asModel ? asModel.toJSON() : asModel

                const query: Query<User> = { 
                    id: id,
                    comments: {
                        select: ['id', 'content'],
                        rates: {
                            select: ['id', 'rate']
                        }
                    }
                }
                const converted = userFormater.asEntity(asModel, query)
                
                assert.deepStrictEqual(asPlain, converted)
            })

            it('findAll - root is User', async () => {
                const active = true

                const asModel = await UserModel.findAll({
                    where: { active: active },
                    include: [{ 
                        model: CommentModel, 
                        as: 'comments', 
                        attributes: ['id', 'content'],
                        include: [{
                            model: RateModel,
                            as: 'rates',
                            attributes: ['id', 'rate']
                        }]
                    }]
                })
                const asPlain = asModel.map(m => m.toJSON())

                const asRaw = await UserModel.findAll({
                    where: { active: active },
                    include: [{ 
                        model: CommentModel, 
                        as: 'comments', 
                        attributes: ['id', 'content'],
                        include: [{
                            model: RateModel,
                            as: 'rates',
                            attributes: ['id', 'rate']
                        }]
                    }],
                    raw: true,
                    nest: true
                })
                const query: Query<User> = { 
                    active: active,
                    comments: {
                        select: ['id', 'content'],
                        rates: {
                            select: ['id', 'rate']
                        }
                    }
                }
                const converted = userFormater.asEntities(asRaw, query)

                assert.deepStrictEqual(asPlain, converted)
            })
        })
    
        describe('one to many -> many to one: Product -> ProductCategory -> Category', () => {
            
            it('findOne - root is Product', async () => {
                const id = 1
                
                const asModel = await ProductModel.findOne({
                    where: { id: id },
                    include: [{ 
                        model: ProductCategoryModel, 
                        as: 'product_categories', 
                        attributes: ['id', 'is_primary'],
                        include: [{
                            model: CategoryModel,
                            as: 'category',
                            attributes: ['id', 'name']
                        }]
                    }]
                })
                const asPlain = asModel ? asModel.toJSON() : asModel

                const query: Query<Product> = { 
                    id: id,
                    product_categories: {
                        select: ['id', 'is_primary'],
                        category: {
                            select: ['id', 'name']
                        }
                    }
                }
                const converted = productFormater.asEntity(asModel, query)
                
                assert.deepStrictEqual(asPlain, converted)
            })

            it('findAll - root is Product', async () => {
                const active = true

                const asModel = await ProductModel.findAll({
                    where: { active: active },
                    include: [{ 
                        model: ProductCategoryModel, 
                        as: 'product_categories', 
                        attributes: ['id', 'is_primary'],
                        include: [{
                            model: CategoryModel,
                            as: 'category',
                            attributes: ['id', 'name']
                        }]
                    }]
                })
                const asPlain = asModel.map(m => m.toJSON())

                const asRaw = await ProductModel.findAll({
                    where: { active: active },
                    include: [{ 
                        model: ProductCategoryModel, 
                        as: 'product_categories', 
                        attributes: ['id', 'is_primary'],
                        include: [{
                            model: CategoryModel,
                            as: 'category',
                            attributes: ['id', 'name']
                        }]
                    }],
                    raw: true,
                    nest: true
                })
                const query: Query<Product> = { 
                    active: active,
                    product_categories: {
                        select: ['id', 'is_primary'],
                        category: {
                            select: ['id', 'name']
                        }
                    }
                }
                const converted = productFormater.asEntities(asRaw, query)

                assert.deepStrictEqual(asPlain, converted)
            })
        })
        
        describe('many to one -> one to one: Comment -> Product -> SpecificationTree', () => {
            
            it('findOne - root is Comment', async () => {
                const id = 1
                
                const asModel = await CommentModel.findOne({
                    where: { id: id },
                    include: [{ 
                        model: ProductModel, 
                        as: 'product', 
                        attributes: ['id', 'brand', 'model'],
                        include: [{
                            model: SpecificationTreeModel,
                            as: 'specification_tree',
                            attributes: ['id', 'specification_type']
                        }]
                    }]
                })
                const asPlain = asModel ? asModel.toJSON() : asModel


                const query: Query<Comment> = { 
                    id: id,
                    product: {
                        select: ['id', 'brand', 'model'],
                        specification_tree: {
                            select: ['id', 'specification_type']
                        }
                    }
                }
                const converted = commentFormater.asEntity(asModel, query)
                
                assert.deepStrictEqual(asPlain, converted)
            })


            it('findAll - root is Comment', async () => {
                const active = true


                const asModel = await CommentModel.findAll({
                    where: { active: active },
                    include: [{ 
                        model: ProductModel, 
                        as: 'product', 
                        attributes: ['id', 'brand', 'model'],
                        include: [{
                            model: SpecificationTreeModel,
                            as: 'specification_tree',
                            attributes: ['id', 'specification_type']
                        }]
                    }]
                })
                const asPlain = asModel.map(m => m.toJSON())


                const asRaw = await CommentModel.findAll({
                    where: { active: active },
                    include: [{ 
                        model: ProductModel, 
                        as: 'product', 
                        attributes: ['id', 'brand', 'model'],
                        include: [{
                            model: SpecificationTreeModel,
                            as: 'specification_tree',
                            attributes: ['id', 'specification_type']
                        }]
                    }],
                    raw: true,
                    nest: true
                })
                const query: Query<Comment> = { 
                    active: active,
                    product: {
                        select: ['id', 'brand', 'model'],
                        specification_tree: {
                            select: ['id', 'specification_type']
                        }
                    }
                }
                const converted = commentFormater.asEntities(asRaw, query)


                assert.deepStrictEqual(asPlain, converted)
            })
        })

        describe('many to one -> one to many: Comment -> Product -> Prices', () => {
            
            it('findOne - root is Comment', async () => {
                const id = 1
                
                const asModel = await CommentModel.findOne({
                    where: { id: id },
                    include: [{ 
                        model: ProductModel, 
                        as: 'product', 
                        attributes: ['id', 'brand', 'model'],
                        include: [{
                            model: PriceModel,
                            as: 'prices',
                            attributes: ['id', 'price']
                        }]
                    }]
                })
                const asPlain = asModel ? asModel.toJSON() : asModel
                if (asPlain && asPlain.product) {
                    asPlain.product.prices?.forEach((p: any) => {
                        p.price = new Decimal(p.price) as any
                    })
                }

                const query: Query<Comment> = { 
                    id: id,
                    product: {
                        select: ['id', 'brand', 'model'],
                        prices: {
                            select: ['id', 'price']
                        }
                    }
                }
                const converted = commentFormater.asEntity(asModel, query)
                
                assert.deepStrictEqual(asPlain, converted)
            })

            it('findAll - root is Comment', async () => {
                const active = true

                const asModel = await CommentModel.findAll({
                    where: { active: active },
                    include: [{ 
                        model: ProductModel, 
                        as: 'product', 
                        attributes: ['id', 'brand', 'model'],
                        include: [{
                            model: PriceModel,
                            as: 'prices',
                            attributes: ['id', 'price']
                        }]
                    }]
                })
                const asPlain = asModel.map(m => m.toJSON())
                if (asPlain && asPlain.length) {
                    for (const comment of asPlain) {
                        if (comment.product) {
                            comment.product.prices?.forEach((p: any) => {
                                p.price = new Decimal(p.price) as any
                            })
                        }
                    }
                }

                const asRaw = await CommentModel.findAll({
                    where: { active: active },
                    include: [{ 
                        model: ProductModel, 
                        as: 'product', 
                        attributes: ['id', 'brand', 'model'],
                        include: [{
                            model: PriceModel,
                            as: 'prices',
                            attributes: ['id', 'price']
                        }]
                    }],
                    raw: true,
                    nest: true
                })
                const query: Query<Comment> = { 
                    active: active,
                    product: {
                        select: ['id', 'brand', 'model'],
                        prices: {
                            select: ['id', 'price']
                        }
                    }
                }
                const converted = commentFormater.asEntities(asRaw, query)

                assert.deepStrictEqual(asPlain, converted)
            })
        })
        
        describe('many to one -> many to one: Rate -> Comment -> Product', () => {
            
            it('findOne - root is Rate', async () => {
                const id = 1
                
                const asModel = await RateModel.findOne({
                    where: { id: id },
                    include: [{ 
                        model: CommentModel, 
                        as: 'comment', 
                        attributes: ['id', 'content'],
                        include: [{
                            model: ProductModel,
                            as: 'product',
                            attributes: ['id', 'brand', 'model']
                        }]
                    }]
                })
                const asPlain = asModel ? asModel.toJSON() : asModel

                const query: Query<Rate> = { 
                    id: id,
                    comment: {
                        select: ['id', 'content'],
                        product: {
                            select: ['id', 'brand', 'model']
                        }
                    }
                }
                const converted = rateFormater.asEntity(asModel, query)
                
                assert.deepStrictEqual(asPlain, converted)
            })

            it('findAll - root is Rate', async () => {
                const active = true

                const asModel = await RateModel.findAll({
                    where: { active: active },
                    include: [{ 
                        model: CommentModel, 
                        as: 'comment', 
                        attributes: ['id', 'content'],
                        include: [{
                            model: ProductModel,
                            as: 'product',
                            attributes: ['id', 'brand', 'model']
                        }]
                    }]
                })
                const asPlain = asModel.map(m => m.toJSON())

                const asRaw = await RateModel.findAll({
                    where: { active: active },
                    include: [{ 
                        model: CommentModel, 
                        as: 'comment', 
                        attributes: ['id', 'content'],
                        include: [{
                            model: ProductModel,
                            as: 'product',
                            attributes: ['id', 'brand', 'model']
                        }]
                    }],
                    raw: true,
                    nest: true
                })
                const query: Query<Rate> = { 
                    active: active,
                    comment: {
                        select: ['id', 'content'],
                        product: {
                            select: ['id', 'brand', 'model']
                        }
                    }
                }
                const converted = rateFormater.asEntities(asRaw, query)

                assert.deepStrictEqual(asPlain, converted)
            })
        })

        describe('test mixed relations queries', () => {
            
            it('findOne - multiple relations', async () => {
                const price = 5499.99
                    
                const asModel = await ProductModel.findOne({
                    include: [{
                        model: PriceModel,
                        as: 'prices',
                        attributes: ['id', 'price', 'product_id', 'shop_id'],
                        where: {
                            price: price
                        }
                    },
                    { 
                        model: SpecificationTreeModel, 
                        as: 'specification_tree', 
                        attributes: ['id', 'product_id', 'specification_type']
                    }, 
                    {
                        model: ProductImporterModel,
                        as: 'product_importer',
                        attributes: ['id', 'name']
                    }]
                })

                const asPlain = asModel ? asModel.toJSON() : asModel   
                assert(asPlain)
                assert(asPlain.prices)
                assert(asPlain.prices[0])
                asPlain.prices[0].price = new Decimal(asPlain.prices[0].price) as any
        
                // formater 
                const query: Query<Product> = { 
                    prices: {
                        price: price,
                        select: ['id', 'price', 'product_id', 'shop_id']
                    },
                    specification_tree: {
                        select: ['id', 'product_id', 'specification_type']
                    },
                    product_importer: {
                        select: ['id', 'name']
                    }
                }
                const converted = productFormater.asEntity(asModel, query)
     
                assert.deepStrictEqual(asPlain, converted)            
            })

            it('findAll - multiple relations', async () => {
                const active = true
                    
                const asModel = await ProductModel.findAll({
                    include: [{
                        model: PriceModel,
                        as: 'prices',
                        attributes: ['id', 'price', 'product_id', 'shop_id'],
                        where: {
                            active: active
                        }
                    },
                    { 
                        model: SpecificationTreeModel, 
                        as: 'specification_tree', 
                        attributes: ['id', 'product_id', 'specification_type']
                    }, 
                    {
                        model: ProductImporterModel,
                        as: 'product_importer',
                        attributes: ['id', 'name']
                    }]
                })

                const asPlain = asModel.map((m) => m.toJSON())
                for (const product of asPlain) {
                    assert(product)
                    assert(product.prices)
                    for (const price of product.prices) {
                        price.price = new Decimal(price.price) as any
                    }
                }
        
                // formater 
                const asRaw = await ProductModel.findAll({
                    include: [{
                        model: PriceModel,
                        as: 'prices',
                        attributes: ['id', 'price', 'product_id', 'shop_id'],
                        where: {
                            active: active
                        }
                    },
                    { 
                        model: SpecificationTreeModel, 
                        as: 'specification_tree', 
                        attributes: ['id', 'product_id', 'specification_type']
                    }, 
                    {
                        model: ProductImporterModel,
                        as: 'product_importer',
                        attributes: ['id', 'name']
                    }],
                    raw: true,
                    nest: true
                })
                const query: Query<Product> = { 
                    prices: {
                        active: active,
                        select: ['id', 'price', 'product_id', 'shop_id']
                    },
                    specification_tree: {
                        select: ['id', 'product_id', 'specification_type']
                    },
                    product_importer: {
                        select: ['id', 'name']
                    }
                }
                const converted = productFormater.asEntities(asRaw, query)
     
                assert.deepStrictEqual(asPlain, converted)            
            })

            it('findOne - multiple nested relations', async () => {
                const price = 5499.99

                const asModel = await ProductModel.findOne({
                    include: [{
                        model: PriceModel,
                        as: 'prices',
                        attributes: ['id', 'price', 'product_id', 'shop_id'],
                        where: {
                            price: price
                        },
                        include: [{
                            model: ShopModel,
                            as: 'shop',
                            attributes: ['id', 'name']
                        }]
                    },
                    { 
                        model: SpecificationTreeModel, 
                        as: 'specification_tree', 
                        attributes: ['id', 'product_id', 'specification_type'],
                        include: [{
                            model: SpecificationModel,
                            as: 'specifications',
                            attributes: ['specification_tree_id', 'specification']
                        }]
                    },
                    {
                        model: CommentModel,
                        as: 'comments',
                        attributes: ['id', 'product_id', 'user_id'],
                        include: [{
                            model: UserModel,
                            as: 'user'
                        }]
                    }]
                })
                const asPlain = asModel ? asModel.toJSON() : asModel   
                assert(asPlain)
                assert(asPlain.prices)
                assert(asPlain.prices[0])
                asPlain.prices[0].price = new Decimal(asPlain.prices[0].price) as any
                
                // formater 
                const query: Query<Product> = { 
                    prices: {
                        price: price,
                        select: ['id', 'price', 'product_id', 'shop_id'],
                        shop: {
                            select: ['id', 'name']
                        }
                    },
                    specification_tree: {
                        select: ['id', 'product_id', 'specification_type'],
                        specifications: {
                            select: ['specification_tree_id', 'specification']
                        }
                    },
                    comments: {
                        select: ['id', 'product_id', 'user_id'],
                        user: {}
                    }
                }
                const converted = productFormater.asEntity(asModel, query)
    
                assert.deepStrictEqual(asPlain, converted)            
            })

            it('findAll - multiple nested relations', async () => {
                const active = true
                    
                const asModel = await ProductModel.findAll({
                   include: [{
                       model: PriceModel,
                       as: 'prices',
                       attributes: ['id', 'price', 'product_id', 'shop_id'],
                       where: {
                           active: active
                       },
                       include: [{
                           model: ShopModel,
                           as: 'shop',
                           attributes: ['id', 'name']
                       }]
                   },
                   { 
                       model: SpecificationTreeModel, 
                       as: 'specification_tree', 
                       attributes: ['id', 'product_id', 'specification_type'],
                       include: [{
                           model: SpecificationModel,
                           as: 'specifications',
                           attributes: ['specification_tree_id', 'specification']
                       }]
                   },
                   {
                       model: CommentModel,
                       as: 'comments',
                       attributes: ['id', 'product_id', 'user_id'],
                       include: [{
                           model: UserModel,
                           as: 'user'
                       }]
                   }]
                })
                
                const asPlain = asModel.map((m) => m.toJSON())
                for (const product of asPlain) {
                    assert(product)
                    assert(product.prices)
                    for (const price of product.prices) {
                        price.price = new Decimal(price.price) as any
                    }
                }
        
                // formater 
                const asRaw = await ProductModel.findAll({
                   include: [{
                       model: PriceModel,
                       as: 'prices',
                       attributes: ['id', 'price', 'product_id', 'shop_id'],
                       where: {
                           active: active
                       },
                       include: [{
                           model: ShopModel,
                           as: 'shop',
                           attributes: ['id', 'name']
                       }]
                   },
                   { 
                       model: SpecificationTreeModel, 
                       as: 'specification_tree', 
                       attributes: ['id', 'product_id', 'specification_type'],
                       include: [{
                           model: SpecificationModel,
                           as: 'specifications',
                           attributes: ['specification_tree_id', 'specification']
                       }]
                   },
                   {
                       model: CommentModel,
                       as: 'comments',
                       attributes: ['id', 'product_id', 'user_id'],
                       include: [{
                           model: UserModel,
                           as: 'user'
                       }]
                   }],
                   raw: true,
                   nest: true
                })
                const query: Query<Product> = { 
                    prices: {
                        active: active,
                        select: ['id', 'price', 'product_id', 'shop_id'],
                        shop: {
                            select: ['id', 'name']
                        }
                    },
                    specification_tree: {
                        select: ['id', 'product_id', 'specification_type'],
                        specifications: {
                            select: ['specification_tree_id', 'specification']
                        }
                    },
                    comments: {
                        select: ['id', 'product_id', 'user_id'],
                        user: {}
                    }
                }
                const converted = productFormater.asEntities(asRaw, query)
     
                assert.deepStrictEqual(asPlain, converted)            
            })
        })


})
