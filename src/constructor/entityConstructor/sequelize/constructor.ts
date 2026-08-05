import { DataType, InferAttributes, InferCreationAttributes, Model, ModelStatic, Sequelize } from "sequelize";
import { DatabaseAttributeTypes, EntityConstructor } from "../../../types/entity/Metadata";
import { toAttributeTypes } from "../../unified";
import { useInflection } from "sequelize";
import e from "express";
import fs from "node:fs";
import { join, relative } from "node:path";


const toCamelCase = (name: string): string => name.charAt(0).toLowerCase() + name.slice(1)


export function createAll(
    outputPath: string, // related path
    connection: Sequelize

): void {
    const repoRoot = process.cwd()
    
    // get connection
    const direction = join(repoRoot, outputPath)
    

    const models = connection.modelManager.models
    
    const metadataModule = join(repoRoot, 'src', 'types', 'entity', 'Metadata')

    const header = [
        '//  *************************************************',
        ...models.map((model, index) => `//  ${index + 1}.  ${model.name} ATTRIBUTES CONFIG`),
        '//  *************************************************'
    ].join('\n')

    const blocks = models.map((model, index) => {
        const name = model.name
        const constName = `${toCamelCase(name)}AttributesConfig`
        const body = serializeObject(
            createEntityConstructor(model as ModelStatic<Model>) as unknown as Record<string, unknown>,
            ''
        )
        return [
            `//  ${index + 1}.  ${name} ATTRIBUTES CONFIG`,
            `const ${constName}: EntityConstructor<${name}> = ${body}`
        ].join('\n')
    })

    const exportedNames = models.map((model) => `    ${toCamelCase(model.name)}AttributesConfig`)
    const exportsBlock = [
        'export { ',
        exportedNames.join(',\n'),
        '}'
    ].join('\n')

    const importPath = relative(outputPath, metadataModule).replace(/\\/g, '/')
    const normalizedImport = importPath.startsWith('.') ? importPath : `./${importPath}`

    const fileContent = [
        `import { EntityConstructor } from "${normalizedImport}"`,
        '',
        '',
        header,
        '',
        ...blocks.flatMap((block) => ['', block]),
        '',
        exportsBlock,
        ''
    ].join('\n')

    fs.mkdirSync(direction, { recursive: true })
    fs.writeFileSync(join(direction, 'entityConstructors.ts'), fileContent)
}


function serializeValue(value: unknown, indent: string): string {
    if (value === null) return 'null'
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (typeof value === 'number') return String(value)
    if (typeof value === 'string') {
        return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
    }
    if (typeof value === 'object') {
        return serializeObject(value as Record<string, unknown>, indent)
    }
    throw new Error(`Cannot serialize value: ${String(value)}`)
}


function serializeObject(
    object: Record<string, unknown>,
    indent: string
): string {
    const entries = Object.entries(object)
    if (entries.length === 0) return '{}'

    const body = entries
        .map(([key, value]) => {
            const keyString = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
                ? key
                : `'${key.replace(/'/g, "\\'")}'`
            return `${indent}    ${keyString}: ${serializeValue(value, indent + '    ')}`
        })
        .join(',\n')

    return `{\n${body}\n${indent}}`
}


export function createEntityConstructor<T extends Model>(
    model: ModelStatic<T>
): EntityConstructor<any> {
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
                    type: toAttributeTypes[mapSequelizeType(attribute.type)]
                }
            ];
        })
    )

    return {
        base: {
            referenceNames: {
                singularName: singularName,
                pluralName: pluralName
            }
        },

        attributes: generated
    };
}



const toDatabaseAttributeType: Record<string, DatabaseAttributeTypes> = {
    // strings
    STRING: "string",
    CHAR: "string",
    TEXT: "string",

    // numbers
    TINYINT: "number",
    SMALLINT: "number",
    MEDIUMINT: "number",
    INTEGER: "number",
    BIGINT: "number",
    FLOAT: "number",
    DOUBLE: "number",
    REAL: "number",

    // exact decimal numbers
    DECIMAL: "decimal",

    // boolean
    BOOLEAN: "boolean",

    // dates
    DATE: "datetime",
    DATEONLY: "date",
    TIME: "time",
    NOW: "datetime",

    // identifiers
    UUID: "uuid",
    UUIDV1: "uuid",
    UUIDV4: "uuid",

    // structured data
    JSONTYPE: "json",
    JSONB: "json",

    // binary data
    BLOB: "binary",

    // special types
    ENUM: "enum",
    ARRAY: "array",
    RANGE: "array",

    // spatial
    GEOMETRY: "geometry",
    GEOGRAPHY: "geometry"
};


function mapSequelizeType(type: DataType): DatabaseAttributeTypes {
    const typeName = type.constructor.name
    const typeIs = toDatabaseAttributeType[typeName]
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