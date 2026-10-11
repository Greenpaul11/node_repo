import { Sequelize } from 'sequelize'
import {
    TEST_USER,
    TEST_USER_PASSWORD,
    TEST_DATABASE,
    TEST_HOST,
    TEST_MYSQL_PORT,
    TEST_MARIA_DB_PORT,
    TEST_POSTGRES_PORT,
    TEST_SQLITE_STORAGE
    
} from '../../../../registry/constants.js'

const orm = process.env.ORM || 'sequelize'
const dialect = process.env.DIALECT || 'mysql'

// store orm connection like 'Sequelize'
let connection: Sequelize | undefined

const authenticate = async (connection: Sequelize | undefined, dialect: string | undefined) => {
    if (!connection) throw new Error('connection is undefined!')
    if (!dialect) throw new Error('dialect is undefined!')  
    await connection.authenticate()
    console.log(`================== Using orm ${orm.toUpperCase()} ` + 
        `with dialect ${dialect.toUpperCase()} ==================`)
}

await (async () => {
    switch (orm) {
        case 'sequelize':
            switch (dialect) {
                case 'postgres':
                    connection = new Sequelize(
                        TEST_DATABASE,
                        TEST_USER,
                        TEST_USER_PASSWORD,
                        {
                            host: TEST_HOST,
                            port: TEST_POSTGRES_PORT,
                            dialect: 'postgres',
                            logging: false,
                            pool: { max: 1, min: 1 }
                        }
                    )
                    break
                case 'mysql':
                    connection = new Sequelize(
                        TEST_DATABASE,
                        TEST_USER,
                        TEST_USER_PASSWORD,
                        {
                            host: TEST_HOST,
                            port: TEST_MYSQL_PORT,
                            dialect: 'mysql',
                            pool: { max: 1, min: 1 },
                            logging: false
                        }
                    )
                    break
                case 'mariadb':
                    connection = new Sequelize(
                        TEST_DATABASE,
                        TEST_USER,
                        TEST_USER_PASSWORD,
                        {
                            host: TEST_HOST,
                            port: TEST_MARIA_DB_PORT,
                            dialect: 'mariadb',
                            pool: { max: 1, min: 1 },
                            logging: false
                        }
                    )
                    break
                case 'sqlite':
                    connection = new Sequelize({
                        dialect: 'sqlite',
                        storage: TEST_SQLITE_STORAGE,
                        logging: false
                    })
                    break
            }
            break

        default:
            throw new Error(`Unsupported ORM: ${orm}`)
    }
    
    await authenticate(connection, dialect)
})()

export default connection as Sequelize


