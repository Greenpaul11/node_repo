import { Sequelize, Options } from 'sequelize';
import * as fs from 'fs';
import * as path from 'path'

export async function createDatabase(connection: Sequelize) {
    const dialect = connection.getDialect()
    switch (dialect) {
        case 'mysql':
            try {
                console.log('>>> createDatabase: Before query, connection config database:', connection.config.database);
                await connection.query(
                  `CREATE DATABASE IF NOT EXISTS ${connection.config.database}`
                );
                console.log(`>>> createDatabase: Database ${connection.config.database} created successfully`);
                console.log('>>> createDatabase: Executing USE command to select the database...');
                await connection.query(`USE ${connection.config.database}`);
                console.log('>>> createDatabase: USE command succeeded');
            } catch (error) {
                console.error(error);
            } 
            await connection.sync({
                force: true,
                logging: false
            })
            break
        case 'sqlite':
            const storagePath = ((connection as unknown as { options: Options }).options).storage as string | undefined
            if (!storagePath) {
                console.log('>>> createDatabase: No storage path (in-memory DB), skipping file creation.');
                return;
            }
            const dir = path.dirname(storagePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`>>> createDatabase: Created directory: ${dir}`);
            }
            if (!fs.existsSync(storagePath)) {
                fs.writeFileSync(storagePath, '');
                console.log(`>>> createDatabase: Created empty SQLite file: ${storagePath}`);
            } else {
                console.log(`>>> createDatabase: SQLite file already exists: ${storagePath}`);
            }
            await connection.query('PRAGMA foreign_keys = ON;');
            await connection.sync({ force: true, logging: false })
            break
    }
}


export async function dropDatabase(connection: Sequelize) {
    const databaseName = connection.config.database; 
    const dialect = connection.getDialect()
    switch(dialect) {
        case 'mysql': 
            if (!databaseName) {
                throw new Error("Database name not found");
            }   
            await connection.query(
                `DROP DATABASE IF EXISTS \`${databaseName}\``
            );
            break
        
        case 'sqlite':
            const storagePath = ((connection as unknown as { options: Options }).options).storage as string | undefined
            if (!storagePath) {
                console.log('>>> dropDatabase: No storage path (in-memory DB), skipping file creation.');
                return;
            }
            const dir = path.dirname(storagePath);
            if (!fs.existsSync(dir)) return
            if (!fs.existsSync(storagePath)) return
            else {
                fs.unlinkSync(storagePath)
                console.log(`>>> dropDatabase: SQLite database "${storagePath}" destroyed.`);
            }
    }
}
