import fs from 'fs';
import path from 'path';
import { generateComposeContent } from './compose.js'
import { generateDatabaseInit } from './database.js';

const OUTPUT_DIR = './docker';
const INIT_DIR = `${OUTPUT_DIR}/init`;

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}
try {
    ensureDir(INIT_DIR)
    ensureDir(`${INIT_DIR}/mariadb`)
    ensureDir(`${INIT_DIR}/mysql`)
    ensureDir(`${INIT_DIR}/postgres`)

    fs.writeFileSync(path.join(OUTPUT_DIR, 'docker-compose.yml'), generateComposeContent())
    console.log('docker-compose.yml generated successfully!')

    fs.writeFileSync(path.join(INIT_DIR, 'mariadb', '00_create_db_and_user.sql'), generateDatabaseInit('mariadb'))
    console.log('mariadb init script generated successfully!')

    fs.writeFileSync(path.join(INIT_DIR, 'mysql', '00_create_db_and_user.sql'), generateDatabaseInit('mysql'))
    console.log('mysql init script generated successfully!')

    fs.writeFileSync(path.join(INIT_DIR, 'postgres', '00_create_db_and_user.sql'), generateDatabaseInit('postgres'))
    console.log('postgres init script generated successfully!')
} catch (error) {
    const message = error instanceof Error ? error.message : error
    console.error('Error generating files:', message)
    process.exit(1)
}