import { strict as assert } from 'node:assert'
import { it, describe, before } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { DataTypes, Sequelize } from 'sequelize'
import connection from '../../../../config/connection';
import { Product, Shop, SpecificationTree } from '../../../testSkeleton/models';
import { constructEntities, generateEntityAttributes } from '../../../../src/constructors/entityConstructor/sequelize/build'
import { constructMetadatas } from '../../../../src/constructors/metadataConstructor/sequelize/build';

const sequelize = connection
if (!sequelize) throw new Error('Instance Sequelize is undefined')

// typed view of the build output returned by generateEntityAttributes
type Generated = {
    name: string
    attributes: Record<string, {
        type: string
        nullable: boolean
    }>
    references: Record<string, {
        target: string
        plural: boolean
    }>
}

function generate(model: Parameters<typeof generateEntityAttributes>[0]): Generated {
    const source = generateEntityAttributes(model, '')

    const lines = source.split('\n')
    assert.ok(lines[0].startsWith('export interface '), `should start with export interface: ${lines[0]}`)
    const name = lines[0]
        .replace('export interface ', '')
        .replace(/ \{/, '')

    const markerIndex = lines.findIndex(line => line.includes('EXTERNAL REFERENCES'))

    const attributeLines = lines.slice(1, markerIndex).filter(line => line.trim() !== '')
    const referenceLines = lines
        .slice(markerIndex + 1)
        .filter(line => line.trim() !== '' && line.trim() !== '}')

    const attributes: Generated['attributes'] = {}
    for (const line of attributeLines) {
        const match = line.trim().match(/^([A-Za-z_$][\w$]*): (\w+)( \| null)?$/)
        assert.ok(match, `cannot parse attribute line: ${JSON.stringify(line.trim())}`)
        attributes[match[1]] = {
            type: match[2],
            nullable: !!match[3]
        }
    }

    const references: Generated['references'] = {}
    for (const line of referenceLines) {
        const match = line.trim().match(/^([A-Za-z_$][\w$]*)\?: ([A-Za-z_$][\w$]*)(\[\])?$/)
        if ((source.includes('ProductClone') || source.includes('Gadget'))) continue
        assert.ok(match, `cannot parse reference line: ${JSON.stringify(line.trim())}`)
        references[match[1]] = {
            target: match[2],
            plural: !!match[3]
        }
    }

    return { name, attributes, references }
}

// helper that builds the attribute config the entity is expected to produce
function expectedAttribute(config: { type: string, nullable?: boolean }) {
    return {
        type: config.type,
        nullable: config.nullable === undefined ? false : config.nullable
    }
}

describe('generateEntityAttributes', () => {

    describe('Product model (class based + Model.init)', () => {
        const entity = generate(Product)

        it('should name the interface from the model name', () => {
            assert.equal(entity.name, 'Product')
        })

        it('should generate the expected set of attributes', () => {
            assert.deepEqual(
                Object.keys(entity.attributes).sort(),
                ['id', 'importer_id', 'type', 'brand', 'model', 'description', 'image',
                    'variant', 'variant_second', 'active', 'created', 'updated'].sort()
            )
        })

        it('should map id (autoIncrement primary key)', () => {
            assert.deepEqual(entity.attributes.id, expectedAttribute({ type: 'number' }))
        })

        it('should map importer_id (nullable foreign key)', () => {
            assert.deepEqual(entity.attributes.importer_id, expectedAttribute({ type: 'number', nullable: true }))
        })

        it('should map non-null string fields', () => {
            for (const field of ['type', 'brand', 'model', 'variant']) {
                assert.deepEqual(entity.attributes[field], expectedAttribute({ type: 'string' }), `failed for field: ${field}`)
            }
        })

        it('should map nullable string fields', () => {
            for (const field of ['description', 'image', 'variant_second']) {
                assert.deepEqual(entity.attributes[field], expectedAttribute({ type: 'string', nullable: true }), `failed for field: ${field}`)
            }
        })

        it('should map boolean fields', () => {
            assert.deepEqual(entity.attributes.active, expectedAttribute({ type: 'boolean' }))
        })

        it('should map date fields', () => {
            for (const field of ['created', 'updated']) {
                assert.deepEqual(entity.attributes[field], expectedAttribute({ type: 'Date' }), `failed for field: ${field}`)
            }
        })

        it('should map associations to external references', () => {
            assert.deepEqual(entity.references, {
                prices: { target: 'Price', plural: true },
                comments: { target: 'Comment', plural: true },
                product_categories: { target: 'ProductCategory', plural: true },
                specification_tree: { target: 'SpecificationTree', plural: false },
                product_importer: { target: 'ProductImporter', plural: false }
            })
        })
    })

    describe('model with custom name option (Shop)', () => {
        const entity = generate(Shop)

        it('should name the interface from the model name', () => {
            assert.equal(entity.name, 'Shop')
        })

        it('should map nullable date field as nullable', () => {
            assert.deepEqual(entity.attributes.founded, expectedAttribute({ type: 'Date', nullable: true }))
        })

        it('should map the association to external references', () => {
            assert.deepEqual(entity.references, {
                prices: { target: 'Price', plural: true }
            })
        })
    })

    describe('model with ENUM (SpecificationTree)', () => {
        const entity = generate(SpecificationTree)

        it('should name the interface from the model name', () => {
            assert.equal(entity.name, 'SpecificationTree')
        })

        it('should map ENUM fields', () => {
            assert.deepEqual(entity.attributes.specification_type, expectedAttribute({ type: 'string' }))
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

        const entity = generate(ProductClone)

        it('should produce the same attribute configuration as the class-based Product', () => {
            const ref = generate(Product)
            assert.deepEqual(entity.attributes, ref.attributes)
        })

        it('should name the interface from the model name', () => {
            assert.equal(entity.name, 'ProductClone')
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

        const entity = generate(Gadget)

        it('should name the interface from the model name', () => {
            assert.equal(entity.name, 'Gadget')
        })

        const cases: Array<[string, ReturnType<typeof expectedAttribute>, string]> = [
            ['id', expectedAttribute({ type: 'number' }), 'autoIncrement primary key'],
            ['external_id', expectedAttribute({ type: 'string' }), 'uuid'],
            ['sku', expectedAttribute({ type: 'string' }), 'non-null string'],
            ['short_label', expectedAttribute({ type: 'string', nullable: true }), 'nullable char'],
            ['description', expectedAttribute({ type: 'string', nullable: true }), 'nullable text'],
            ['importer_id', expectedAttribute({ type: 'number', nullable: true }), 'nullable fk'],
            ['price', expectedAttribute({ type: 'number' }), 'decimal'],
            ['weight', expectedAttribute({ type: 'number' }), 'bigint'],
            ['ratio', expectedAttribute({ type: 'number', nullable: true }), 'float'],
            ['rating', expectedAttribute({ type: 'number', nullable: true }), 'double'],
            ['active', expectedAttribute({ type: 'boolean' }), 'boolean'],
            ['kind_on', expectedAttribute({ type: 'Date', nullable: true }), 'dateonly'],
            ['released_at', expectedAttribute({ type: 'Date', nullable: true }), 'date'],
            ['payload', expectedAttribute({ type: 'object', nullable: true }), 'json'],
            ['specs', expectedAttribute({ type: 'object', nullable: true }), 'jsonb'],
            ['image_data', expectedAttribute({ type: 'object', nullable: true }), 'blob'],
            ['kind', expectedAttribute({ type: 'string' }), 'enum']
        ]

        for (const [field, expected, label] of cases) {
            it(`should map ${field} (${label})`, () => {
                assert.deepEqual(entity.attributes[field], expected, `field: ${field}`)
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
    const config = {
        connection: connection,
        constructEntities: true,
        constructMetadatas: true,
        path: 'tests/constructors/testOutput/sequelize',
        dirName: 'repository'
    }
    
    before(() => {
        constructEntities(config.path, config)
    })


    it('should create entities.ts', () => {
        assert.ok(fs.existsSync(path.join(config.path, 'entities.ts')))
    })

    it('should have a numbered header comment block', () => {
        const content = fs.readFileSync(path.join(config.path, 'entities.ts'), 'utf-8')
        assert.ok(content.includes('//  *************************************************'))
        assert.ok(content.includes('//  1.  Product ENTITY'))
    })

    it('should generate an interface block for each registered model', () => {
        const content = fs.readFileSync(path.join(config.path, 'entities.ts'), 'utf-8')
        for (const modelName of Object.keys(connection.models)) {
            const interfaceName = `${modelName.charAt(0).toUpperCase()}${modelName.slice(1)}`
            assert.ok(content.includes(`export interface ${interfaceName} {`), `missing interface for ${modelName}`)
        }
    })

    it('should write the external references for each interface', () => {
        const content = fs.readFileSync(path.join(config.path, 'entities.ts'), 'utf-8')
        assert.ok(content.includes('prices?: Price'))
        assert.ok(content.includes('specification_tree?: SpecificationTree'))
        assert.ok(content.includes('product_importer?: ProductImporter'))
    })
})