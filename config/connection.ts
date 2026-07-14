import { Dialect, Sequelize } from 'sequelize'
import dotenv from 'dotenv'


const mode = process.env.NODE_ENV
dotenv.config({path: `src/config/${mode}`})

const orm = process.env.ORM
const dialect = process.env.DIALECT


// store orm connection like 'Sequelize'
let connection: Sequelize | undefined

// create connection
(async () => {
    switch (orm){
        case 'Sequelize':
            switch (dialect) {
                case 'mysql':
                    connection = new Sequelize(
                        ``,
                        ``,
                        `${process.env.PASSWORD_SP}`,  
                        {
                            host: `${process.env.HOST_SP}`,
                            dialect: dialect as Dialect,
                            pool: {max: 1, min: 1},
                            logging: false
                        }
                    ) 
                    break
                case 'sqlite':
                    connection = new Sequelize({
                        dialect: 'sqlite',
                        storage: process.env.STORAGE,
                        logging: false
                    })
            }


            if (!connection) throw new Error(`Connection for selected dialect: "${dialect}" does not exist!`)
        
        break;

        default:
            throw new Error(`Unsupported ORM: ${orm}`);

    }
})()

if (!connection) throw new Error('connections is undefined!')

export default connection as Sequelize


