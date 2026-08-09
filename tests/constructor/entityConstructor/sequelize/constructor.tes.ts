import { strict as assert } from 'node:assert'
import { it, describe, before, after } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { DataTypes, Sequelize } from 'sequelize'
import connection from '../../../../config/connection';
import { Product, Shop, SpecificationTree } from '../../../testSkeleton/models';
import { createAll, createEntityConstructor } from '../../../../src/constructor/entityConstructor/sequelize/constructor';

const sequelize = connection
if (!sequelize) throw new Error('Instance Sequelize is undefined')

// typed view of the build output returned by createEntityConstructor
type Generated = {
    base: {
        referenceNames: {
            singularName: string
            pluralName: string
        }
    }
    attributes: Record<string, {
        primaryKey: boolean
        required: boolean
        allowNull: boolean
        associated: boolean
        asRange: boolean
        searchIn: boolean | null
        fieldType: string
        type: string
    }>
}

function generate(model: Parameters<typeof createEntityConstructor>[0]): Generated {
    return createEntityConstructor(model) as unknown as Generated
}

// helper that builds the attribute config the constructor is expected to produce
function expectedAttribute(config: {
    primaryKey?: boolean
    required: boolean
    allowNull: boolean
    associated?: boolean
    asRange: boolean
    fieldType: string
    type: string
    searchIn?: boolean | null
}) {
    return {
        primaryKey: !!config.primaryKey,
        required: config.required,
        allowNull: config.allowNull,
        associated: !!config.associated,
        asRange: config.asRange,
        searchIn: config.searchIn === undefined ? null : config.searchIn,
        fieldType: config.fieldType,
        type: config.type
    }
}

describe('createEntityConstructor', () => {

    describe('Product model (class based + Model.init)', () => {
        const constructor = generate(Product)

        it('should generate base referenceNames', () => {
            assert.deepEqual(constructor.base, {
                referenceNames: {
                    singularName: 'Product',
                    pluralName: 'Products'
                }
            })
        })

        it('should generate the expected set of attributes', () => {
            assert.deepEqual(
                Object.keys(constructor.attributes).sort(),
                ['id', 'importer_id', 'type', 'brand', 'model', 'description', 'image',
                    'variant', 'variant_second', 'active', 'created', 'updated'].sort()
            )
        })

        it('should map id (autoIncrement primary key)', () => {
            assert.deepEqual(constructor.attributes.id, expectedAttribute({
                primaryKey: true,
                required: false,
                allowNull: false,
                asRange: true,
                fieldType: 'number',
                type: 'number'
            }))
        })

        it('should map importer_id (nullable foreign key) as associated', () => {
            assert.deepEqual(constructor.attributes.importer_id, expectedAttribute({
                required: false,
                allowNull: true,
                associated: true,
                asRange: true,
                fieldType: 'number',
                type: 'number'
            }))
        })

        it('should map non-null varchar fields as required string', () => {
            for (const field of ['type', 'brand', 'model', 'variant']) {
                assert.deepEqual(constructor.attributes[field], expectedAttribute({
                    required: true,
                    allowNull: false,
                    asRange: false,
                    fieldType: 'string',
                    type: 'string'
                }), `failed for field: ${field}`)
            }
        })

        it('should map nullable string fields', () => {
            for (const field of ['description', 'image', 'variant_second']) {
                assert.deepEqual(constructor.attributes[field], expectedAttribute({
                    required: false,
                    allowNull: true,
                    asRange: false,
                    fieldType: 'string',
                    type: 'string'
                }), `failed for field: ${field}`)
            }
        })

        it('should map boolean fields', () => {
            assert.deepEqual(constructor.attributes.active, expectedAttribute({
                required: true,
                allowNull: false,
                asRange: false,
                fieldType: 'boolean',
                type: 'boolean'
            }))
        })

        it('should map date fields as datetime range', () => {
            for (const field of ['created', 'updated']) {
                assert.deepEqual(constructor.attributes[field], expectedAttribute({
                    required: true,
                    allowNull: false,
                    asRange: true,
                    fieldType: 'datetime',
                    type: 'date'
                }), `failed for field: ${field}`)
            }
        })
    })

    describe('model with custom name option (Shop)', () => {
        const constructor = generate(Shop)

        it('should use custom singular/plural names', () => {
            assert.deepEqual(constructor.base, {
                referenceNames: {
                    singularName: 'shop',
                    pluralName: 'shops'
                }
            })
        })
    })

    describe('model with ENUM (SpecificationTree)', () => {
        const constructor = generate(SpecificationTree)

        it('should keep custom reference names', () => {
            assert.deepEqual(constructor.base.referenceNames, {
                singularName: 'specification_tree',
                pluralName: 'specification_trees'
            })
        })

        it('should map ENUM fields', () => {
            assert.deepEqual(constructor.attributes.specification_type, expectedAttribute({
                required: true,
                allowNull: false,
                asRange: false,
                fieldType: 'enum',
                type: 'string'
            }))
        })
    })

    describe('alternatively defined model - sequelize.define() mirroring Product', () => {
        const ProductClone = sequelize.define('ProductClone', {
            id: {
                autoIncrement: true,
                type: DataTypes.INTEGER,
                allowNull: false,
                primaryKey: true
            },
            importer_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'product_importer', key: 'id' }
            },
            type: { type: DataTypes.STRING(40), allowNull: false },
            brand: { type: DataTypes.STRING(40), allowNull: false },
            model: { type: DataTypes.STRING(100), allowNull: false },
            description: { type: DataTypes.TEXT, allowNull: true },
            image: { type: DataTypes.STRING(300), allowNull: true },
            variant: { type: DataTypes.STRING(100), allowNull: false },
            variant_second: { type: DataTypes.STRING(100), allowNull: true },
            active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: 1 },
            created: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP')
            }
        }, {
            tableName: 'product_clone',
            timestamps: false
        })

        const constructor = generate(ProductClone)

        it('should produce the same attribute configuration as the class-based Product', () => {
            const ref = generate(Product)
            assert.deepEqual(constructor.attributes, ref.attributes)
        })

        it('should generate reference names from the model name', () => {
            assert.equal(constructor.base.referenceNames.singularName, 'ProductClone')
            assert.ok(constructor.base.referenceNames.pluralName.length > 0)
        })
    })

    describe('alternatively defined model - broader spectrum of DataTypes', () => {
        const Gadget = sequelize.define('Gadget', {
            id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
            external_id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
            sku: { type: DataTypes.STRING(64), allowNull: false },
            short_label: { type: DataTypes.CHAR(4), allowNull: true },
            description: { type: DataTypes.TEXT, allowNull: true },
            importer_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: { model: 'product_importer', key: 'id' }
            },
            price: { type: DataTypes.DECIMAL(7, 2), allowNull: false },
            weight: { type: DataTypes.BIGINT, allowNull: false },
            ratio: { type: DataTypes.FLOAT, allowNull: true },
            rating: { type: DataTypes.DOUBLE, allowNull: true },
            active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            kind_on: { type: DataTypes.DATEONLY, allowNull: true },
            released_at: { type: DataTypes.DATE, allowNull: true },
            payload: { type: DataTypes.JSON, allowNull: true },
            specs: { type: DataTypes.JSONB, allowNull: true },
            image_data: { type: DataTypes.BLOB, allowNull: true },
            kind: { type: DataTypes.ENUM('a', 'b'), allowNull: false }
        }, {
            tableName: 'gadget',
            timestamps: true
        })

        const constructor = generate(Gadget)

        it('should generate reference names from the model name', () => {
            assert.equal(constructor.base.referenceNames.singularName, 'Gadget')
            assert.ok(constructor.base.referenceNames.pluralName.length > 0)
        })

        const cases: Array<[string, ReturnType<typeof expectedAttribute>, string]> = [
            ['id', expectedAttribute({ primaryKey: true, required: false, allowNull: false, asRange: true, fieldType: 'number', type: 'number' }), 'autoIncrement primary key'],
            ['sku', expectedAttribute({ required: true, allowNull: false, asRange: false, fieldType: 'string', type: 'string' }), 'non-null string'],
            ['short_label', expectedAttribute({ required: false, allowNull: true, asRange: false, fieldType: 'string', type: 'string' }), 'nullable char'],
            ['description', expectedAttribute({ required: false, allowNull: true, asRange: false, fieldType: 'string', type: 'string' }), 'nullable text'],
            ['importer_id', expectedAttribute({ required: false, allowNull: true, associated: true, asRange: true, fieldType: 'number', type: 'number' }), 'nullable fk'],
            ['price', expectedAttribute({ required: true, allowNull: false, asRange: true, fieldType: 'decimal', type: 'decimal' }), 'decimal'],
            ['weight', expectedAttribute({ required: true, allowNull: false, asRange: true, fieldType: 'number', type: 'number' }), 'bigint'],
            ['ratio', expectedAttribute({ required: false, allowNull: true, asRange: true, fieldType: 'number', type: 'number' }), 'float'],
            ['rating', expectedAttribute({ required: false, allowNull: true, asRange: true, fieldType: 'number', type: 'number' }), 'double'],
            ['active', expectedAttribute({ required: true, allowNull: false, asRange: false, fieldType: 'boolean', type: 'boolean' }), 'boolean'],
            ['kind_on', expectedAttribute({ required: false, allowNull: true, asRange: true, fieldType: 'date', type: 'date' }), 'dateonly'],
            ['released_at', expectedAttribute({ required: false, allowNull: true, asRange: true, fieldType: 'datetime', type: 'date' }), 'date'],
            ['payload', expectedAttribute({ required: false, allowNull: true, asRange: false, fieldType: 'json', type: 'object' }), 'json'],
            ['specs', expectedAttribute({ required: false, allowNull: true, asRange: false, fieldType: 'json', type: 'object' }), 'jsonb'],
            ['image_data', expectedAttribute({ required: false, allowNull: true, asRange: false, fieldType: 'binary', type: 'object' }), 'blob'],
            ['kind', expectedAttribute({ required: true, allowNull: false, asRange: false, fieldType: 'enum', type: 'string' }), 'enum']
        ]

        for (const [field, expected, label] of cases) {
            it(`should map ${field} (${label})`, () => {
                assert.deepEqual(constructor.attributes[field], expected, `field: ${field}`)
            })
        }
    })

    describe('unregistered DataType should throw', () => {
        const weirdSequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false })
        const Weird = weirdSequelize.define('Weird', {
            id: { autoIncrement: true, type: DataTypes.INTEGER, allowNull: false, primaryKey: true },
            computed: { type: DataTypes.VIRTUAL }
        }, {
            tableName: 'weird',
            timestamps: false
        })

        it('should throw when the attribute type is not registered', () => {
            assert.throws(() => generate(Weird), /\bType: .+ is not registred in DatabaseAttributeTypes/)
        })
    })
})

describe('createAll', () => {
    const outputDir = path.join('tests/constructor/entityConstructor/sequelize/testOutput')

    before(() => {
        createAll(outputDir, connection)
    })

    //after(() => {
    //    fs.rmSync(outputDir, { recursive: true, force: true })
    //})

    it('should create entityConstructors.ts', () => {
        assert.ok(fs.existsSync(path.join(outputDir, 'entityConstructors.ts')))
    })

    it('should import EntityConstructor from Metadata', () => {
        const content = fs.readFileSync(path.join(outputDir, 'entityConstructors.ts'), 'utf-8')
        assert.ok(content.includes('import { EntityConstructor } from'))
    })

    it('should have a numbered header comment block', () => {
        const content = fs.readFileSync(path.join(outputDir, 'entityConstructors.ts'), 'utf-8')
        assert.ok(content.includes('//  *************************************************'))
        assert.ok(content.includes('//  1.  Product ATTRIBUTES CONFIG'))
    })

    it('should generate a const block for each registered model', () => {
        const content = fs.readFileSync(path.join(outputDir, 'entityConstructors.ts'), 'utf-8')
        for (const modelName of Object.keys(connection.models)) {
            const constName = `${modelName.charAt(0).toLowerCase()}${modelName.slice(1)}AttributesConfig`
            assert.ok(content.includes(`const ${constName}: EntityConstructor<${modelName}>`), `missing block for ${modelName}`)
        }
    })

    it('should export all generated consts', () => {
        const content = fs.readFileSync(path.join(outputDir, 'entityConstructors.ts'), 'utf-8')
        assert.ok(content.includes('export {'))
        for (const modelName of Object.keys(connection.models)) {
            const constName = `${modelName.charAt(0).toLowerCase()}${modelName.slice(1)}AttributesConfig`
            assert.ok(content.includes(constName), `missing export for ${constName}`)
        }
    })

    it('should have valid TypeScript structure for each block', () => {
        const content = fs.readFileSync(path.join(outputDir, 'entityConstructors.ts'), 'utf-8')
        const constBlocks = content.split('const ').slice(1)
        assert.ok(constBlocks.length > 0, 'should have at least one const block')
        for (const block of constBlocks) {
            assert.ok(block.includes('base:'), `block should have base: ${block.slice(0, 80)}`)
            assert.ok(block.includes('attributes:'), `block should have attributes: ${block.slice(0, 80)}`)
            assert.ok(block.includes('referenceNames:'), `block should have referenceNames: ${block.slice(0, 80)}`)
        }
    })
})