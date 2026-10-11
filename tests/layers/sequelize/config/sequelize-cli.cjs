const {
    MIGRATOR_USER,
    MIGRATOR_USER_PASSWORD,
    TEST_DATABASE,
    TEST_HOST,
    TEST_MYSQL_PORT,
    TEST_MARIA_DB_PORT,
    TEST_POSTGRES_PORT,
    TEST_SQLITE_STORAGE
} = require('../../../../registry/constants.js')

module.exports = {
    postgres: {
        dialect: "postgres",
        username: MIGRATOR_USER,
        password: MIGRATOR_USER_PASSWORD,
        database: TEST_DATABASE,
        host: TEST_HOST,
        port: TEST_POSTGRES_PORT,
        logging: false,
    },
    mysql: {
        dialect: "mysql",
        username: MIGRATOR_USER,
        password: MIGRATOR_USER_PASSWORD,
        database: TEST_DATABASE,
        host: TEST_HOST,
        port: TEST_MYSQL_PORT,
        multipleStatements: true,
        logging: false,
    },
    mariadb: {
        dialect: "mariadb",
        username: MIGRATOR_USER,
        password: MIGRATOR_USER_PASSWORD,
        database: TEST_DATABASE,
        host: TEST_HOST,
        port: TEST_MARIA_DB_PORT,
        multipleStatements: true,
        logging: false,
    },
    sqlite: {
        dialect: "sqlite",
        storage: TEST_SQLITE_STORAGE,
        logging: false,
    }
};

