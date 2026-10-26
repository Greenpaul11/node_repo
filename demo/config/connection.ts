import { readFileSync } from "node:fs";
import path from 'path'
import {
    DEMO_DATABASE,
    DEMO_USER,
    DEMO_USER_PASSWORD,
    DEMO_HOST
} from '../../registry/constants.js'
import {
    OrmOptions,
    DialectOptions
} from '../../src/types/Registry.js'
import { Sequelize } from "sequelize"

let connection: OrmOptions

function getSequelizeWithDialect(dialect: DialectOptions) {
    return new Sequelize(
        DEMO_DATABASE,
        DEMO_USER,
        DEMO_USER_PASSWORD,
        {
            host: DEMO_HOST,
            dialect: dialect,
            logging: false,
        }
    )
}

const settings = JSON.parse(
    readFileSync(path.join(process.cwd(), 'demo/config/current.json'), 'utf-8')
)

const orm = settings.orm
const dialect = settings.dialect

if (orm === 'sequelize') {
    connection = getSequelizeWithDialect(dialect)
} else {
    throw new Error('Connection is undefined!')
}

export default connection


