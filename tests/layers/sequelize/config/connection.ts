import { Sequelize } from 'sequelize'

const orm = process.env.ORM
const dialect = process.env.DIALECT

export const DATABASE = 'node_repo_test'
export const SQLITE_STORAGE = './tests/dependency/sqlite/test_db.sqlite'

// store orm connection like 'Sequelize'
let connection: Sequelize | undefined

const authenticate = async (connection: Sequelize | undefined, dialect: string | undefined) => {
    if (!connection) throw new Error('connection is undefined!')
    if (!dialect) throw new Error('dialect is undefined!')  
    await connection.authenticate()
    console.log(`================== Using orm ${orm?.toUpperCase()} ` + 
        `with dialect ${dialect.toUpperCase()} ==================`)
}

await (async () => {
    switch (orm) {
        case 'sequelize':
            switch (dialect) {
                case 'postgres':
                    connection = new Sequelize(
                        DATABASE,
                        'test_user',
                        `noderepopassword`,
                        {
                            host: `127.0.0.1`,
                            port: 3001,
                            dialect: 'postgres',
                            logging: false,
                            pool: { max: 1, min: 1 }
                        }
                    )
                    break
                case 'mysql':
                    connection = new Sequelize(
                        DATABASE,
                        `test_user`,
                        `noderepopassword`,
                        {
                            host: `127.0.0.1`,
                            port: 3002,
                            dialect: 'mysql',
                            pool: { max: 1, min: 1 },
                            logging: false
                        }
                    )
                    break
                case 'mariadb':
                    connection = new Sequelize(
                        DATABASE,
                        `test_user`,
                        `noderepopassword`,
                        {
                            host: `127.0.0.1`,
                            port: 3003,
                            dialect: 'mariadb',
                            pool: { max: 1, min: 1 },
                            logging: false
                        }
                    )
                    break
                case 'sqlite':
                    connection = new Sequelize({
                        dialect: 'sqlite',
                        storage: SQLITE_STORAGE,
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


