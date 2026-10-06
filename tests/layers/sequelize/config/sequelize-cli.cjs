module.exports = {
  postgres: {
    dialect: 'postgres',
    username: 'migrator',
    password: 'migratorpass',
    database: 'node_repo_test',
    host: '127.0.0.1',
    port: 3001,
    logging: false
  },
  mysql: {
    dialect: 'mysql',
    username: 'migrator',
    password: 'migratorpass',
    database: 'node_repo_test',
    host: '127.0.0.1',
    port: 3002,
    multipleStatements: true,
    logging: false
  },
  mariadb: {
    dialect: 'mariadb',
    username: 'migrator',
    password: 'migratorpass',
    database: 'node_repo_test',
    host: '127.0.0.1',
    port: 3003,
    multipleStatements: true,
    logging: false
  },
  sqlite: {
    dialect: 'sqlite',
    storage: './tests/dependency/sqlite/test_db.sqlite',
    logging: false
  }
}