import {
    Product as ProductBlueprint,
    ProductCategory as ProductCategoryBlueprint,
    ProductType as ProductTypeBlueprint,
    Price as PriceBlueprint,
    Laptop as LaptopBlueprint,
    User as UserBlueprint,
    UserToken as UserTokenBlueprint,
} from "./entities.js";
import {
    DataTypes,
    Model,
    CreationOptional,
    Association,
    ModelAttributes,
    Optional,
    InferAttributes,
    InferCreationAttributes,
    HasOneGetAssociationMixin,
    HasOneSetAssociationMixin,
    HasOneCreateAssociationMixin,
} from "sequelize";
import sequelize from "../config/connection.js";

abstract class ProductModel<M extends ProductModel<M>>
    extends Model
    implements ProductBlueprint
{
    declare id: CreationOptional<number>;
    declare type: string;
    declare brand: string;
    declare model: string;
    declare image_low: string | null;
    declare image_high: string | null;
    declare description: string | null;
    declare variant: string;
    declare variant_second: string | null;
    declare variant_ean: string | null;
    declare updated_from_null: string | null;
    declare job_pid: string | null;
    declare job_pid_update: string | null;
    declare active: CreationOptional<boolean>;
    declare created: CreationOptional<Date>;
    declare updated: CreationOptional<Date>;
    declare category: string | null;
    declare prices?: Price[];
    declare static associations: {
        type: Association<Model, ProductType>;
        category: Association<Model, ProductCategory>;
        prices: Association<Model, Price>;
    };
}

const getProductAttributes = <M extends ProductModel<M>>(): ModelAttributes<
    M,
    Optional<any, never>
> => ({
    id: {
        autoIncrement: true,
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    type: {
        type: DataTypes.STRING(40),
        allowNull: false,
        references: {
            model: "product_type",
            key: "name",
        },
    },
    brand: {
        type: DataTypes.STRING(40),
        allowNull: false,
        validate: {
            len: [2, 40],
        },
    },
    model: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            len: [2, 100],
        },
    },
    image_low: {
        type: DataTypes.STRING(300),
        allowNull: true,
    },
    image_high: {
        type: DataTypes.STRING(300),
        allowNull: true,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    variant: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            len: [5, 100],
        },
    },
    variant_second: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
        validate: {
            len: [5, 100],
        },
    },
    variant_ean: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
        validate: {
            len: [5, 100],
        },
    },
    updated_from_null: {
        type: DataTypes.STRING(300),
        allowNull: true,
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: 1,
    },
    created: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    updated: {
        type: DataTypes.DATE, //'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        allowNull: false,
        defaultValue: sequelize.Sequelize.literal("CURRENT_TIMESTAMP"),
    },
    category: {
        type: DataTypes.STRING(40),
        allowNull: true,
        references: {
            model: "product_category",
            key: "name",
        },
    },
});

class ProductCategory
    extends Model<
        InferAttributes<ProductCategory>,
        InferCreationAttributes<ProductCategory>
    >
    implements ProductCategoryBlueprint
{
    declare id: CreationOptional<number>;
    declare name: string;
    declare type: number;
    declare slug: string;
    declare description: string | null;
    declare active: CreationOptional<boolean>;
    declare created: CreationOptional<Date>;
    declare updated: CreationOptional<Date>;
}
ProductCategory.init(
    {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(40),
            allowNull: false,
            unique: true,
            validate: {
                len: [2, 100],
            },
        },
        type: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "product_type",
                key: "id",
            },
        },
        slug: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                len: [2, 100],
            },
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: 1,
        },
        created: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated: {
            type: DataTypes.DATE, //'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            allowNull: false,
            defaultValue: sequelize.Sequelize.literal("CURRENT_TIMESTAMP"),
        },
    },
    {
        sequelize,
        tableName: "product_category",
        timestamps: false,
        indexes: [
            {
                name: "PRIMARY",
                unique: true,
                using: "BTREE",
                fields: [{ name: "id" }],
            },
            {
                name: "slug",
                unique: true,
                using: "BTREE",
                fields: [{ name: "slug" }],
            },
            {
                name: "type",
                using: "BTREE",
                fields: [{ name: "type" }],
            },
        ],
    },
);

class ProductType
    extends Model<
        InferAttributes<ProductType>,
        InferCreationAttributes<ProductType>
    >
    implements ProductTypeBlueprint
{
    declare id: CreationOptional<number>;
    declare name: string;
    declare slug: string;
    declare active: CreationOptional<boolean>;
    declare created: CreationOptional<Date>;
    declare updated: CreationOptional<Date>;
}
ProductType.init(
    {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                len: [2, 40],
            },
        },
        slug: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                len: [2, 100],
            },
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: 1,
        },
        created: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated: {
            type: DataTypes.DATE, //'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            allowNull: false,
            defaultValue: sequelize.Sequelize.literal("CURRENT_TIMESTAMP"),
        },
    },
    {
        sequelize,
        tableName: "product_type",
        timestamps: false,
        indexes: [
            {
                name: "PRIMARY",
                unique: true,
                using: "BTREE",
                fields: [{ name: "id" }],
            },
            {
                name: "slug",
                unique: true,
                using: "BTREE",
                fields: [{ name: "slug" }],
            },
        ],
    },
);

class Price
    extends Model<InferAttributes<Price>, InferCreationAttributes<Price>>
    implements PriceBlueprint
{
    declare id: CreationOptional<number>;
    declare price: number;
    declare shop: string;
    declare url: string;
    declare product_id: number;
    declare job_pid: string | null;
    declare active: CreationOptional<boolean>;
    declare updated: CreationOptional<Date>;
    declare created: CreationOptional<Date>;
}
Price.init(
    {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        price: {
            type: DataTypes.DECIMAL(7, 2),
            allowNull: false,
        },
        shop: {
            type: DataTypes.STRING(40),
            allowNull: false,
            validate: {
                len: [2, 40],
            },
        },
        url: {
            type: DataTypes.STRING(240),
            allowNull: false,
            validate: {
                len: [14, 240],
            },
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: 1,
        },
        product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "laptop",
                key: "id",
            },
        },
        job_pid: {
            type: DataTypes.STRING(40),
            allowNull: true,
            references: {
                model: "collect_job",
                key: "pid",
            },
        },
        created: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated: {
            type: DataTypes.DATE, //'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',

            allowNull: false,
            defaultValue: sequelize.Sequelize.literal("CURRENT_TIMESTAMP"),
        },
    },
    {
        name: {
            singular: "price",
            plural: "prices",
        },
        sequelize,
        tableName: "price",
        timestamps: false,
        indexes: [
            {
                name: "PRIMARY",
                unique: true,
                using: "BTREE",
                fields: [{ name: "id" }],
            },
            {
                name: "product_id",
                using: "BTREE",
                fields: [{ name: "product_id" }],
            },
            {
                name: "job_pid",
                using: "BTREE",
                fields: [{ name: "job_pid" }],
            },
        ],
    },
);

class Laptop extends ProductModel<Laptop> implements LaptopBlueprint {
    declare processor: string;
    declare processor_short: string | null;
    declare processor_cores: string | null;
    declare ram_size: string | null;
    declare ram_speed: string | null;
    declare ram_type: string | null;
    declare disk_type: string | null;
    declare disk_size: string | null;
    declare disk_slot_available: boolean | null;
    declare touchscreen: boolean | null;
    declare screen_type: string | null;
    declare screen_coat: string | null;
    declare screen_size: string | null;
    declare screen_resolution: string | null;
    declare screen_refresh: string | null;
    declare graphic_card: string;
    declare graphic_card_short: string | null;
    declare graphic_card_memory: string | null;
    declare graphic_card_tgp: string | null;
    declare ports: string | null;
    declare battery_type: string | null;
    declare color: string | null;
    declare material: string | null;
    declare operating_system: string | null;
    declare weight: string | null;
}

const productAttributes = getProductAttributes<Laptop>();

Laptop.init(
    {
        // laptop is product
        ...productAttributes,
        // specific for laptop
        processor: {
            type: DataTypes.STRING(40),
            allowNull: false,
            validate: {
                len: [5, 40],
            },
        },
        processor_short: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        processor_cores: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
        ram_size: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
        ram_speed: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
        ram_type: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
        disk_type: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
        disk_size: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
        disk_slot_available: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: 0,
        },
        touchscreen: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            defaultValue: 0,
        },
        screen_type: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
        screen_coat: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
        screen_size: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
        screen_resolution: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
        screen_refresh: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
        graphic_card: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                len: [2, 100],
            },
        },
        graphic_card_short: {
            type: DataTypes.STRING(10),
            allowNull: true,
        },
        graphic_card_memory: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
        graphic_card_tgp: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
        ports: {
            type: DataTypes.STRING(400),
            allowNull: true,
        },
        battery_type: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
        color: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
        material: {
            type: DataTypes.STRING(400),
            allowNull: true,
        },
        operating_system: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
        weight: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
    },
    {
        name: {
            singular: "laptop",
            plural: "laptops",
        },
        sequelize,
        tableName: "laptop",
        timestamps: false,
        indexes: [
            {
                name: "PRIMARY",
                unique: true,
                using: "BTREE",
                fields: [{ name: "id" }],
            },
            {
                name: "job_pid",
                using: "BTREE",
                fields: [{ name: "job_pid" }],
            },
            {
                name: "job_pid_update",
                using: "BTREE",
                fields: [{ name: "job_pid_update" }],
            },
            {
                name: "type",
                using: "BTREE",
                fields: [{ name: "type" }],
            },
            {
                name: "category",
                using: "BTREE",
                fields: [{ name: "category" }],
            },
            {
                type: "FULLTEXT",
                name: "ports",
                fields: ["ports"],
            },
            {
                type: "FULLTEXT",
                name: "material",
                fields: ["material"],
            },
        ],
        validate: {
            checkVariant() {
                if (this.variant === this.variant_second) {
                    throw new Error(
                        '"variant" and "variant_second" can not be the same!',
                    );
                }
            },
        },
    },
);

class User
    extends Model<InferAttributes<User>, InferCreationAttributes<User>>
    implements UserBlueprint
{
    declare id: CreationOptional<number>;
    declare password: string;
    declare email: string;
    declare login: string;
    declare active: CreationOptional<boolean>;
    declare verified: CreationOptional<boolean>;
    declare super_user: CreationOptional<boolean>;
    declare created: CreationOptional<Date>;
    declare updated: CreationOptional<Date>;
    declare user_token?: UserToken;
    declare static associations: {
        user_token: Association<User, UserToken>;
    };

    declare getUserToken: HasOneGetAssociationMixin<UserToken>;
    declare setUserToken: HasOneSetAssociationMixin<UserToken, number>;
    declare createUserToken: HasOneCreateAssociationMixin<UserToken>;
}
User.init(
    {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        login: {
            type: DataTypes.STRING(40),
            allowNull: false,
            unique: true,
            validate: {
                len: [4, 40],
            },
        },
        password: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                len: [32, 100],
            },
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                len: [7, 100],
            },
        },
        created: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated: {
            type: DataTypes.DATE, //'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            allowNull: false,
            defaultValue: sequelize.Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: 1,
        },
        verified: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: 0,
        },
        super_user: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        tableName: "user",
        timestamps: false,
        indexes: [
            {
                name: "PRIMARY",
                unique: true,
                using: "BTREE",
                fields: [{ name: "id" }],
            },
        ],
    },
);

class UserToken
    extends Model<
        InferAttributes<UserToken>,
        InferCreationAttributes<UserToken>
    >
    implements UserTokenBlueprint
{
    declare id: CreationOptional<number>;
    declare token: string;
    declare expiration_date: Date;
    declare user_id: number;
    declare updated: CreationOptional<Date>;
    declare created: CreationOptional<Date>;
    declare active: CreationOptional<boolean>;
}

UserToken.init(
    {
        id: {
            autoIncrement: true,
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: "user",
                key: "id",
            },
        },
        token: {
            type: DataTypes.STRING(200),
            allowNull: false,
            validate: {
                len: [16, 200],
            },
        },
        expiration_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        created: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        updated: {
            type: DataTypes.DATE, //'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            allowNull: false,
            defaultValue: sequelize.Sequelize.literal("CURRENT_TIMESTAMP"),
        },
        active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: 1,
        },
    },
    {
        name: {
            singular: "user_token",
            plural: "user_tokens",
        },
        sequelize,
        tableName: "user_token",
        timestamps: false,
        indexes: [
            {
                name: "PRIMARY",
                unique: true,
                using: "BTREE",
                fields: [{ name: "id" }],
            },
            {
                name: "id",
                using: "BTREE",
                fields: [{ name: "id" }],
            },
        ],
    },
);

//>>>>>>>>>>>>> User <<<<<<<<<<<<<<

User.hasOne(UserToken, {
  foreignKey: {
    name: 'user_id'
  },
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
}) 

//>>>>>>>>>>>>> UserToken <<<<<<<<<<<<<<

UserToken.belongsTo(User, {
  foreignKey: {
      name: 'user_id'
  }
})

//>>>>>>>>>>>>> Laptop <<<<<<<<<<<<<<

Laptop.belongsTo(ProductType, {
  foreignKey: {
    name: 'type'
  }
})

Laptop.belongsTo(ProductCategory, {
  foreignKey: {
    name: 'category'
  }
})

Laptop.hasMany(Price, {
  foreignKey: {
    name: 'product_id'
  },
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
})

//>>>>>>>>>>>>> Price <<<<<<<<<<<<<<

Price.belongsTo(Laptop, {
  foreignKey: { 
    name: 'product_id'
  }
})

export { User, UserToken, Laptop, Price, ProductType, ProductCategory, sequelize as connection}

