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
                        `${process.env.DATABASE_SP}`,
                        `${process.env.USERNAME_SP}`,
                        `${process.env.PASSWORD_SP}`,  
                        {
                            host: `${process.env.HOST_SP}`,
                            dialect: dialect as Dialect,
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
            
            try {
                await connection.authenticate();
                console.log(`Connected to database by Sequelize using dialect: ${dialect}`);
            } catch (error) {
              throw new Error(`Could not connect to database by Sequelize: ${error}`);
            }
        break;

        default:
            throw new Error(`Unsupported ORM: ${orm}`);

    }
})()

if (!connection) throw new Error('connections is undefined!')

export default connection as Sequelize


