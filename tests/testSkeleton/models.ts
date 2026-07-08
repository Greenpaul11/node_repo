import { DataTypes, Model, CreationOptional, InferAttributes, 
    InferCreationAttributes, 
    Sequelize } from 'sequelize'
import connection from '../../config/connection';
import { EntityCreationAttributes } from '../../src/types/entity/Creation';
import { 
    Product as ProductBlueprint,
    ProductImporter as ProductImporterBlueprint,
    Price as PriceBlueprint,
    Comment as CommentBlueprint,
    Rate as RateBlueprint,
    User as UserBlueprint,
    Shop as ShopBlueprint,
    Category as CategoryBlueprint,
    ProductCategory as ProductCategoryBlueprint,
    SpecificationTree as SpecificationTreeBlueprint,
    Specification as SpecificationBlueprint
} from './entities';


const sequelize = connection
if (!sequelize) throw new Error('Instance Sequelize is undefined')

const dialect = sequelize.getDialect()

// manage update field
const generateUpdateField = (seq: Sequelize = sequelize) => {
  switch (dialect) {
    case 'mysql':
      return { type: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
      }
    default: 
      return { type: DataTypes.DATE, 
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
      }
  }
}

class Product extends Model<InferAttributes<Product>, 
        InferCreationAttributes<Product>> implements EntityCreationAttributes<ProductBlueprint> {
    declare id: CreationOptional<number>
    declare importer_id: number | null;
    declare type: string
    declare brand: string
    declare model: string
    declare description: string | null;
    declare image: string | null
    declare variant: string
    declare variant_second: string | null
    declare active: CreationOptional<boolean>
    declare created: CreationOptional<Date>
    declare updated: CreationOptional<Date>
    
    declare prices?: Price[]
    declare comments?: Comment[]
    declare product_categories?: ProductCategory[]
    declare specification_tree?: SpecificationTree | null
    declare product_importer?: ProductImporter | null
}

Product.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    importer_id: {
       type: DataTypes.INTEGER,
       allowNull: true,
       references: {
         model: 'product_importer',
         key: 'id'
     }
    },
    type: {
      type: DataTypes.STRING(40),
      allowNull: false,
      validate: {
        len: [2, 40]
      }
    },
    brand: {
      type: DataTypes.STRING(40),
      allowNull: false,
      validate: {
        len: [2, 40]
      }
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100]
      }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    image: {
      type: DataTypes.STRING(300),
      allowNull: true
    },
    variant: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [5, 100]
      }
    },
    variant_second: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      validate: {
        len: [5, 100]
      }
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 1
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated: generateUpdateField()
  }, {
    sequelize,
    tableName: 'product',
    timestamps: false,
    indexes: sequelize.getDialect() === 'mysql' 
      ? [
          {
            type: "FULLTEXT",
            name: 'model',
            fields: [ 'model' ],  
          },
          {
              type: "FULLTEXT",
              name: 'description',
              fields: [ 'description' ],  
          }
      ]
      : [{
          name: "product_importer_id", using: "BTREE", fields: [{ name: "importer_id" }] 
      }]
})


class ProductImporter extends Model<InferAttributes<ProductImporter>, 
        InferCreationAttributes<ProductImporter>> implements EntityCreationAttributes<ProductImporterBlueprint> {
  declare id: CreationOptional<number>
  declare name: string;
  declare active: CreationOptional<boolean>
  declare created: CreationOptional<Date>
  declare updated: CreationOptional<Date>

  declare products?: Product[];
}

ProductImporter.init(
  {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [2, 100]
      }
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated: generateUpdateField()
  },
  {
    sequelize,
    tableName: "product_importer",
    timestamps: false
  }
);
   

class Price extends Model<InferAttributes<Price>, 
        InferCreationAttributes<Price>> implements EntityCreationAttributes<PriceBlueprint> {
    declare id: CreationOptional<number>
    declare price: number
    declare shop_id: number
    declare url: string
    declare product_id: number
    declare active: CreationOptional<boolean>
    declare updated: CreationOptional<Date>
    declare created: CreationOptional<Date>

    declare product?: Product
    declare shop?: Shop
  }
  
  Price.init({
     id: {
       autoIncrement: true,
       type: DataTypes.INTEGER,
       allowNull: false,
       primaryKey: true
     },
     price: {
       type: DataTypes.DECIMAL(7,2),
       allowNull: false
     },
     shop_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'shop',
          key: 'id'
      }
     },
     url: {
       type: DataTypes.STRING(240),
       allowNull: false,
       validate: {
         len: [14, 240]
       }
     },
     active: {
       type: DataTypes.BOOLEAN,
       allowNull: false,
       defaultValue: 1
     },
     product_id: {
       type: DataTypes.INTEGER,
       allowNull: false,
       references: {
         model: 'product',
         key: 'id'
       }
     },
     created: {
       type: DataTypes.DATE,
       allowNull: false,
       defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
     },
     updated: generateUpdateField()
   }, {
     sequelize,
     tableName: 'price',
      timestamps: false,
      indexes: sequelize.getDialect() === 'mysql'
        ? [
            {
              name: "product_id",
              using: "BTREE",
              fields: [
                { name: "product_id" },
              ]
            },
            {
              name: "shop_id",
              using: "BTREE",
              fields: [
                { name: "shop_id" },
              ]
            }
          ]
        : [
            {
              name: "price_product_id",
              using: "BTREE",
              fields: [
                { name: "product_id" },
              ]
            },
            {
              name: "price_shop_id",
              using: "BTREE",
              fields: [
                { name: "shop_id" },
              ]
            }
          ]
})


class Shop extends Model<InferAttributes<Shop>, 
        InferCreationAttributes<Shop>> implements EntityCreationAttributes<ShopBlueprint> {
    declare id: CreationOptional<number>
    declare name: string
    declare founded: Date | null
    declare active: CreationOptional<boolean>
    declare updated: CreationOptional<Date>
    declare created: CreationOptional<Date>
}

Shop.init({
    id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(40),
        allowNull: false,
        validate: {
          len: [2, 40]
        }
    },
    founded: {
        type: DataTypes.DATE,
        allowNull: true
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 1
    },
    created: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated: generateUpdateField()
}, {
    name: {
        singular: 'shop',
        plural: 'shops'
    },
    sequelize,
    tableName: 'shop',
    timestamps: false
})


class Category extends Model<InferAttributes<Category>, 
        InferCreationAttributes<Category>> implements EntityCreationAttributes<CategoryBlueprint> {
    declare id: CreationOptional<number>
    declare name: string
    declare slug: string
    declare parent_id: number | null
    declare active: CreationOptional<boolean>
    declare created: CreationOptional<Date>
    declare updated: CreationOptional<Date>

    declare parent?: Category
    declare children?: Category[]
    declare product_categories?: ProductCategory[]
}

Category.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(40),
      allowNull: false,
      validate: {
        len: [2, 40]
      }
    },
    slug: {
      type: DataTypes.STRING(40),
      allowNull: false,
      validate: {
        len: [2, 40]
      }
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'category',
        key: 'id'
      }
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 1
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated: generateUpdateField()
  }, {
    sequelize,
    tableName: 'category',
    timestamps: false,
    indexes: sequelize.getDialect() === 'mysql'
      ? [
          {
              name: "parent_id",
              using: "BTREE",
              fields: [
                  { name: "parent_id" },
              ]
          }
        ]
      : [
          {
              name: "category_parent_id",
              using: "BTREE",
              fields: [
                  { name: "parent_id" },
              ]
          }
        ]
})


class ProductCategory extends Model<InferAttributes<ProductCategory>, 
        InferCreationAttributes<ProductCategory>> implements EntityCreationAttributes<ProductCategoryBlueprint> {
    declare id: CreationOptional<number>
    declare product_id: number
    declare category_id: number
    declare is_primary: boolean
    declare active: CreationOptional<boolean>
    declare created: CreationOptional<Date>
    declare updated: CreationOptional<Date>

    declare product?: Product
    declare category?: Category
}

ProductCategory.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'product',
        key: 'id'
      }
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'category',
        key: 'id'
      }
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 0
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 1
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated: generateUpdateField()
  }, {
    name: {
        singular: 'product_category',
        plural: 'product_categories'
    },
    sequelize,
    tableName: 'product_category',
    timestamps: false,
    indexes: sequelize.getDialect() === 'mysql'
      ? [
          {
              name: "product_id",
              using: "BTREE",
              fields: [
                  { name: "product_id" },
              ]
          },
          {
              name: "category_id",
              using: "BTREE",
              fields: [
                  { name: "category_id" },
              ]
          }
        ]
      : [
          {
              name: "product_category_product_id",
              using: "BTREE",
              fields: [
                  { name: "product_id" },
              ]
          },
          {
              name: "product_category_category_id",
              using: "BTREE",
              fields: [
                  { name: "category_id" },
              ]
          }
        ]
})


class SpecificationTree extends Model<InferAttributes<SpecificationTree>, 
        InferCreationAttributes<SpecificationTree>> implements EntityCreationAttributes<SpecificationTreeBlueprint> {
    declare id: CreationOptional<number>
    declare product_id: number
    declare specification_type: 'laptop' | 'monitor' | 'tablet' | 'smartphone' | 'headphones'
    declare active: CreationOptional<boolean>
    declare created: CreationOptional<Date>
    declare updated: CreationOptional<Date>

    declare product?: Product 
    declare specification?: Specification[]
    declare category?: Category
}

SpecificationTree.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'product',
        key: 'id'
      },
    },
    specification_type: {
      type: DataTypes.ENUM('laptop', 'monitor', 'tablet', 'smartphone', 'headphones'),
      allowNull: false
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 1
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated: generateUpdateField()
  }, {
    name: {
        singular: 'specification_tree',
        plural: 'specification_trees'
    },
    sequelize,
    tableName: 'specification_tree',
    timestamps: false,
    indexes: sequelize.getDialect() === 'mysql'
      ? [
          {
              name: "product_id",
              using: "BTREE",
              fields: [
                  { name: "product_id" },
              ]
          }
        ]
      : [
          {
              name: "specification_tree_product_id",
              using: "BTREE",
              fields: [
                  { name: "product_id" },
              ]
          }
        ]
})


class Specification extends Model<InferAttributes<Specification>, 
        InferCreationAttributes<Specification>> implements EntityCreationAttributes<SpecificationBlueprint> {
    declare id: CreationOptional<number>
    declare specification_tree_id: number
    declare specification: string;
    declare active: CreationOptional<boolean>
    declare created: CreationOptional<Date>
    declare updated: CreationOptional<Date>

    declare specification_tree?: SpecificationTree | null
}

Specification.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    specification_tree_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'specification_tree',
        key: 'id'
      }
    },
    specification: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: 1
    },
    created: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated: generateUpdateField()
  }, {
    name: {
        singular: 'specification',
        plural: 'specifications'
    },
    sequelize,
    tableName: 'specification',
    timestamps: false
})


class User extends Model<InferAttributes<User>, 
        InferCreationAttributes<User>> implements EntityCreationAttributes<UserBlueprint> {
    declare id: CreationOptional<number>
    declare name: string
    declare login: string
    declare email: string
    declare password: string
    declare active: CreationOptional<boolean>
    declare created: CreationOptional<Date>
    declare updated: CreationOptional<Date>


    declare comments?: Comment[]
    declare rates?: Rate[]
}


User.init({
    id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            len: [2, 100]
        }
    },
    login: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
            len: [2, 50]
        }
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            len: [8, 255]
        }
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 1
    },
    created: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated: generateUpdateField()
}, {
    name: {
        singular: 'user',
        plural: 'users'
    },
    sequelize,
    tableName: 'user',
    timestamps: false
})


class Comment extends Model<InferAttributes<Comment>, 
        InferCreationAttributes<Comment>> implements EntityCreationAttributes<CommentBlueprint> {
    declare id: CreationOptional<number>
    declare product_id: number
    declare user_id: number
    declare content: string
    declare active: CreationOptional<boolean>
    declare created: CreationOptional<Date>
    declare updated: CreationOptional<Date>

    declare product?: Product
    declare user?: User
    declare rates?: Rate[]
}

Comment.init({
    id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'product',
            key: 'id'
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'user',
            key: 'id'
        }
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 1
    },
    created: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated: generateUpdateField()
}, {
    name: {
        singular: 'comment',
        plural: 'comments'
    },
    sequelize,
    tableName: 'comment',
    timestamps: false,
    indexes: sequelize.getDialect() === 'mysql'
      ? [
          {
              name: "product_id",
              using: "BTREE",
              fields: [
                  { name: "product_id" },
              ]
          },
          {
              name: "user_id",
              using: "BTREE",
              fields: [
                  { name: "user_id" },
              ]
          }
        ]
      : [
          {
              name: "comment_product_id",
              using: "BTREE",
              fields: [
                  { name: "product_id" },
              ]
          },
          {
              name: "comment_user_id",
              using: "BTREE",
              fields: [
                  { name: "user_id" },
              ]
          }
        ]
})


class Rate extends Model<InferAttributes<Rate>, 
        InferCreationAttributes<Rate>> implements EntityCreationAttributes<RateBlueprint> {
    declare id: CreationOptional<number>
    declare comment_id: number
    declare user_id: number
    declare rate: number
    declare active: CreationOptional<boolean>
    declare created: CreationOptional<Date>
    declare updated: CreationOptional<Date>

    declare comment?: Comment 
    declare user?: User 
}

Rate.init({
    id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
    },
    comment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'comment',
            key: 'id'
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'user',
            key: 'id'
        }
    },
    rate: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5
        }
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 1
    },
    created: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
    },
    updated: generateUpdateField()
}, {
    name: {
        singular: 'rate',
        plural: 'rates'
    },
    sequelize,
    tableName: 'rate',
    timestamps: false,
    indexes: sequelize.getDialect() === 'mysql'
      ? [
          {
              name: "comment_id",
              using: "BTREE",
              fields: [
                  { name: "comment_id" },
              ]
          },
          {
              name: "user_id",
              using: "BTREE",
              fields: [
                  { name: "user_id" },
              ]
          }
        ]
      : [
          {
              name: "rate_comment_id",
              using: "BTREE",
              fields: [
                  { name: "comment_id" },
              ]
          },
          {
              name: "rate_user_id",
              using: "BTREE",
              fields: [
                  { name: "user_id" },
              ]
          }
        ]
})


// ===========================================================================
// RELATIONS
// ===========================================================================

// One-To-Many: Product -> Price
Product.hasMany(Price, {
    foreignKey: {
      name: 'product_id'
    },
    as: 'prices'
})
// One-To-Many: Product -> Comment
Product.hasMany(Comment, {
    foreignKey: {
      name: 'product_id'
    },
    as: 'comments'
})
// One-To-Many: Product -> ProductCategory
Product.hasMany(ProductCategory, {
    foreignKey: {
      name: 'product_id'
    },
    as: 'product_categories'
})
// One-To-One: Product -> SpecificationTree
Product.hasOne(SpecificationTree, {
    foreignKey: { 
      name: 'product_id'
    },
    as: 'specification_tree'
})
// Many-To-One: Product -> ProductImporter
Product.belongsTo(ProductImporter, {
    foreignKey: { 
      name: 'importer_id'
    },
    as: 'product_importer',
    onDelete: 'SET NULL'
})
// One-To-Many: ProductImporter -> Product
ProductImporter.hasMany(Product, {
    foreignKey: { 
      name: 'importer_id'
    },
    as: 'products'
})
// Many-To-One: Price -> Product
Price.belongsTo(Product, {
    foreignKey: { 
      name: 'product_id'
    },
    as: 'product',
    onDelete: 'CASCADE'
})
// Many-To-One: Price -> Shop
Price.belongsTo(Shop, {
    foreignKey: { 
      name: 'shop_id',
      allowNull: true
    },
    as: 'shop',
    onDelete: 'CASCADE'
})
// One-To-Many: Category -> Category
Category.hasMany(Category, {
    foreignKey: {
        name: 'parent_id'
    },
    as: 'children'
})
// Many-To-One: Category -> Category
Category.belongsTo(Category, {
    foreignKey: {
        name: 'parent_id',
        allowNull: true
    },
    as: 'parent',
    onDelete: 'SET NULL'
})
// One-To-Many: Category -> ProductCategory
Category.hasMany(ProductCategory, {
    foreignKey: {
        name: 'category_id'
    },
    as: 'product_categories'
})
// Many-To-One: ProductCategory -> Category
ProductCategory.belongsTo(Category, {
    foreignKey: {
      name: 'category_id'
    },
    as: 'category',
    onDelete: 'CASCADE'
})
// Many-To-One: ProductCategory -> Product
ProductCategory.belongsTo(Product, {
    foreignKey: {
      name: 'product_id'
    },
    as: 'product',
    onDelete: 'CASCADE'
})
// Many-To-One: Price -> Product
Comment.belongsTo(Product, {
    foreignKey: { 
      name: 'product_id'
    },
    as: 'product',
    onDelete: 'CASCADE'
})
// One-To-One: SpecificationTree -> Product
SpecificationTree.belongsTo(Product, {
    foreignKey: { 
      name: 'product_id'
    },
    as: 'product',
    onDelete: 'CASCADE'
})
// One-To-Many: SpecificationTree -> Specification
SpecificationTree.hasMany(Specification, {
    foreignKey: {
        name: 'specification_tree_id'
    },
    as: 'specifications'
})
// Many-To-One: Specification -> SpecificationTree
Specification.belongsTo(SpecificationTree, {
  foreignKey: { 
    name: 'specification_tree_id'
  },
  as: 'specification_tree',
  onDelete: 'CASCADE'
})
// One-To-Many: User -> Comment
User.hasMany(Comment, {
    foreignKey: {
        name: 'user_id'
    },
    as: 'comments'
})
// One-To-Many: User -> Rate
User.hasMany(Rate, {
    foreignKey: {
        name: 'user_id'
    },
    as: 'rates'
})
// Many-To-One: Comment -> User
Comment.belongsTo(User, {
    foreignKey: {
        name: 'user_id'
    },
    as: 'user',
    onDelete: 'CASCADE'
})
// One-To-Many: Comment -> Rate
Comment.hasMany(Rate, {
    foreignKey: {
        name: 'comment_id'
    },
    as: 'rates'
})
// Many-To-One: Rate -> User
Rate.belongsTo(User, {
    foreignKey: {
        name: 'user_id'
    },
    as: 'user',
    onDelete: 'CASCADE'
})
// Many-To-One: Rate -> Comment
Rate.belongsTo(Comment, {
    foreignKey: {
        name: 'comment_id'
    },
    as: 'comment',
    onDelete: 'CASCADE'
})

export { 
    Product, Price, Shop, Comment, Category, ProductCategory,
    SpecificationTree, Specification, User, Rate, ProductImporter
}
