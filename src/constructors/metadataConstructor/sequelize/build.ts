import { DataType, Model, ModelStatic, Sequelize } from "sequelize";
import { DatabaseAttributeTypes } from "../../../types/entity/Metadata.js";
import { unifiedTypesToAttributeTypes, sequelizeAttributeTypesToUnified } from "../../unified.js";
import fs from "node:fs";
import { join } from "node:path";
import { ConstructorConifg } from "../../../types/Config.js";
import configDefault from "../../config.js"


export function constructMetadatas(
    dirPath: string, // related path
    config: ConstructorConifg

): void {
    
    const indent = (() => {
        const configIndent = config['indent'] ? config['indent'] : configDefault['indent']
        let target = ''
        for (let i=configIndent; i > 0; i--) {
            target += ' '
        }
        return target
    })()

    const imports = [
        'import { MetadataConstructor, EntityMetadata } from "node-repo/types"',
        'import { EntityMetadataManager } from "node-repo"'
    ].join('\n')
    
    const models = config.connection.modelManager.models

    if (!Object.keys(models).length) {
        throw new Error('Sequelize connection (Sequelize.modelManager.models) does not include any models.')
    }
    
    const header = [
        '//  *************************************************',
        ...models.map((model, index) => `//  ${index + 1}.  ${model.name} METADATA CONSTRUCTOR`),
        '//  *************************************************'
    ].join('\n')

    const blocks = models.map((model, index) => {
        const name = model.name
        const constName = `${toCamelCase(name)}Constructor`
        const metadataName = `${toCamelCase(name)}Metadata`
        const constructorBody = generateConstructor(model as ModelStatic<Model>, indent)
        const metadataBody = generateMetadata(constName, model as ModelStatic<Model>, indent)
        return [
            `//  ${index + 1}.  ${name} CONSTRUCTOR & METADATA`,
            `const ${constName}: MetadataConstructor<any> = ${constructorBody}`,
            `const ${metadataName}: EntityMetadata<any> = ${metadataBody}`
        ].join('\n')
    })

    const exportedNames = models.map((model) => `${indent}${toCamelCase(model.name)}Constructor`)
    const exportsBlock = [
        'export { ',
        exportedNames.join(',\n'),
        '}'
    ].join('\n')

    const fileContent = [
        imports,
        '',
        header,
        '',
        ...blocks.flatMap((block) => ['', block]),
        '',
        exportsBlock,
        ''
    ].join('\n')

    fs.writeFileSync(join(dirPath, 'metadata.ts'), fileContent)
}


function serializeValue(value: unknown, indent: string, depth: number): string {
    if (value === null) return 'null'
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (typeof value === 'number') return String(value)
    if (typeof value === 'string') {
        return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
    }
    if (typeof value === 'object') {
        return serializeObject(value as Record<string, unknown>, indent, depth)
    }
    throw new Error(`Cannot serialize value: ${String(value)}`)
}


function serializeObject(
    object: Record<string, unknown>,
    indent: string,
    depth: number = 1
): string {
    const entries = Object.entries(object)
    if (entries.length === 0) return '{}'
    const body = entries
        .map(([key, value]) => {
            const keyString = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
                ? key
                : `'${key.replace(/'/g, "\\'")}'`
            
                if (value && typeof value === 'object' && '__raw' in value) {
                    return `${indent.repeat(depth)}${keyString}: ${value.__raw}`;
                }
            
            return `${indent.repeat(depth)}${keyString}: ${serializeValue(value, indent, depth + 1)}`
        })
        .join(',\n')

    return `{\n${body}\n${indent.repeat(depth - 1)}}`
}


export function generateConstructor<T extends Model>(
    model: ModelStatic<T>,
    indent: string

): string {
    const attributes = model.getAttributes();

    // generate name references
    const referenceNames = model.options.name;

    const singularName = referenceNames?.singular ?? model.name;

    const pluralName = referenceNames?.plural ?? `${singularName}s`;

    // generate attributes
    const generated = Object.fromEntries(
        Object.entries(attributes).map(([name, attribute]) => {
            return [
                name,
                {
                    primaryKey: !!attribute.primaryKey,
                    required: !attribute.allowNull && !attribute.autoIncrement,
                    allowNull: attribute.allowNull ?? false,
                    associated: attribute.references ? true : false,
                    asRange: isRangeType(attribute.type),
                    searchIn: null,
                    fieldType: mapSequelizeType(attribute.type),
                    type: unifiedTypesToAttributeTypes[mapSequelizeType(attribute.type)]
                }
            ];
        })
    )

    return serializeObject({
        base: {
            referenceNames: {
                singularName: singularName,
                pluralName: pluralName
            }
        },
        attributes: generated 
    }, indent)
}

export function generateMetadata<T extends Model>(
    constName: string,
    model: ModelStatic<T>,
    indent: string
) {
    const associations = model.associations

    const generated = Object.fromEntries(
        Object.entries(associations).map(([entity, config]) => {
            return [
                entity, 
                { 
                    metadata: { __raw: `${toCamelCase(config.target.name)}Metadata` },
                    relation: convertSequelizeRelationString(config.associationType) 
                }
            ]
        })
    )

    return `new EntityMetadataManager(\n` +
        `${indent}${constName},\n` +
        `${indent}() => (${serializeObject(generated, indent, 2)})\n` +
        `)`
}


const toCamelCase = (name: string): string => name.charAt(0).toLowerCase() + name.slice(1)


function mapSequelizeType(type: DataType): DatabaseAttributeTypes {
    const typeName = type.constructor.name
    const typeIs = sequelizeAttributeTypesToUnified[typeName]
    if (!typeIs) {
        throw new Error(`Type: ${type} is not registred in DatabaseAttributeTypes.`)
    }
    return typeIs
}

function isRangeType(type: DataType): boolean {
    const typeIs = mapSequelizeType(type)
    switch (typeIs) {
        case 'number':
        case 'decimal':
        case 'datetime':
        case 'date':
            return true
        default:
            return false
    }
}

function convertSequelizeRelationString(relation: string): string {
    switch(relation) {
        case 'HasOne':
            return 'one to one'
        case 'HasMany':
            return 'one to many'
        case 'BelongsTo':
            return 'many to one'
        case 'BelongsToMany':
            return 'many to many'
    }
    throw new Error('relation string has no entry in domain system!')
}

