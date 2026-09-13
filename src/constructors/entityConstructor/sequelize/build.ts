import { DataType, Model, ModelStatic, Sequelize } from "sequelize";
import { DatabaseAttributeTypes } from "../../../types/entity/Metadata.js";
import { unifiedTypesToEntityInterfaceTypes, sequelizeAttributeTypesToUnified } from "../../unified.js";
import fs from "node:fs";
import { join } from "node:path";
import { ConstructorConifg } from "../../../types/Config.js";
import configDefault from "../../config.js"


export function constructEntities(
    dirPath: string, 
    config: ConstructorConifg
): void {
    const indent = (() => {
        const configIndent = config['indent'] ? config['indent'] : configDefault['indent']
        let target = ''
        for (let i = configIndent; i > 0; i--) {
            target += ' '
        }
        return target
    })()

    const models = config.connection.modelManager.models

    if (!Object.keys(models).length) {
        throw new Error('Sequelize connection (Sequelize.modelManager.models) does not include any models.')
    }
    
    const header = [
        '//  *************************************************',
        ...models.map((model, index) => `//  ${index + 1}.  ${model.name} ENTITY`),
        '//  *************************************************'
    ].join('\n')

    const blocks = models.map((model) => {
        return generateEntityAttributes(model as ModelStatic<any>, indent) + '\n'
    })

    const fileContent = [
        '',
        header,
        '',
        ...blocks,
        ''
    ].join('\n')

    fs.writeFileSync(join(dirPath, 'entities.ts'), fileContent)
}

//function importEntities (dirPath: string, entities: string[]) {
//    const fileName = 'entities.ts'
//    // check if entities.ts exists
//    if (fs.existsSync()){}
//}


export function generateEntityAttributes<T extends Model>(
    model: ModelStatic<T>,
    indent: string
) {
    const name = toFirstUpperCase(model.name)
    const attributes = model.getAttributes()
    const associations = model.associations

    const generatedAttributes = Object.entries(attributes).map(([name, config]) => {
        return `${name}: ${unifiedTypesToEntityInterfaceTypes[mapSequelizeType(config.type)]} ${config.allowNull ? '| null' : ''}`
    } )

    const generatedReferences = Object.entries(associations).map(([entity, config]) => {
        return `${indent}${entity}?: ${config.target.name}${sequelizeRelationIsPlural(config.associationType) ? '[]' : ''}` 
    })
    

    return `export interface ${name} {\n` +
        `${indent}${generatedAttributes.join(`\n${indent}`)}` +
        `${generatedReferences.length ? indent + `\n\n${indent}//******EXTERNAL REFERENCES******\n` : '' }` +
        `${generatedReferences.length ? generatedReferences.join(`${indent}\n`) : ''}\n` +
        `}`
}


const toFirstUpperCase = (name: string): string => name.charAt(0).toUpperCase() + name.slice(1)


function mapSequelizeType(type: DataType): DatabaseAttributeTypes {
    const typeName = type.constructor.name
    const typeIs = sequelizeAttributeTypesToUnified[typeName]
    if (!typeIs) {
        throw new Error(`Type: ${type} is not registred in DatabaseAttributeTypes.`)
    }
    return typeIs
}


function sequelizeRelationIsPlural(relation: string): boolean {
    switch(relation) {
        case 'HasOne':
            return false
        case 'HasMany':
            return true
        case 'BelongsTo':
            return false
        case 'BelongsToMany':
            return true
    }
    throw new Error('relation string has no entry in domain system!')
}

