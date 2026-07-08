import { after, before } from 'node:test';
import { createDatabase, dropDatabase } from './database';
import connection from '../../../../config/connection';
import { Sequelize } from 'sequelize';


if (!(connection instanceof Sequelize)) {
    throw new Error(`Instanceof connection is not Sequelize!`)
}

const sequelize: Sequelize = connection
const dialect = connection.getDialect()

before(async () => {
    console.log('>>> SETUP before hook: Starting');
    await createDatabase(sequelize)     
    console.log('>>> SETUP before hook: Database created');
});

after(async () => {
    console.log('>>> SETUP after hook: About to drop database');
    await dropDatabase(sequelize)
    console.log('>>> SETUP after hook: Database dropped');

})
