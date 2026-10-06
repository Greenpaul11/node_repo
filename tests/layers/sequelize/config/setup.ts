import { after, before } from 'node:test';
import { applayClean } from './database.js';
import connection from './connection.js';
import { Sequelize } from 'sequelize';

const notValidMode = process.env.NODE_ENV === 'test' ? false : true

if (notValidMode) {
    throw new Error('Database setup is not running in test mode!' +
        'Test cannot be accomplished!'
    )
}

if (!(connection instanceof Sequelize)) {
    throw new Error(`Instanceof connection is not Sequelize!`)
}

before(async () => {
    await applayClean(connection)
})

after(async () => {
    await applayClean(connection)
    await connection.close()
})

