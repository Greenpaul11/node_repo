'use strict';
const fs = require('fs');
const path = require('path');

const NAME = '20260924000000-create-schema';

async function exec(sequelize, direction) {
  const file = path.join(__dirname, 'sql', sequelize.getDialect(), `${NAME}.${direction}.sql`);
  const sql = fs.readFileSync(file, 'utf8');
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of statements) {
    await sequelize.query(stmt, { type: sequelize.QueryTypes.RAW });
  }
}

module.exports = {
  async up(queryInterface) { await exec(queryInterface.sequelize, 'up'); },
  async down(queryInterface) { await exec(queryInterface.sequelize, 'down'); }
};