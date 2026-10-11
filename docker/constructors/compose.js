import {
    ROOT_PASSWORD,
    TEST_HOST,
    TEST_MARIA_DB_PORT,
    TEST_MYSQL_PORT,
    TEST_POSTGRES_PORT,
    TEST_SQLITE_STORAGE
} from '../../registry/constants.js';

export function generateComposeContent() {
    return `
services:
  postgres:
    image: postgres:16-alpine
    container_name: node_repo_postgres
    environment:
      POSTGRES_PASSWORD: ${ROOT_PASSWORD}
    ports:
      - "${TEST_POSTGRES_PORT}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init/postgres:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d postgres"]
      interval: 5s
      timeout: 5s
      retries: 10

  mysql:
    image: mysql:8
    container_name: node_repo_mysql
    environment:
      MYSQL_ROOT_PASSWORD: ${ROOT_PASSWORD}
    ports:
      - "${TEST_MYSQL_PORT}:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./init/mysql:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "mysqladmin ping -h ${TEST_HOST} -u root -p${ROOT_PASSWORD}"]
      interval: 5s
      timeout: 5s
      retries: 10

  mariadb:
    image: mariadb:11
    container_name: node_repo_mariadb
    environment:
      MARIADB_ROOT_PASSWORD: ${ROOT_PASSWORD}
    ports:
      - "${TEST_MARIA_DB_PORT}:3306"
    volumes:
      - mariadb_data:/var/lib/mysql
      - ./init/mariadb:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "mariadb-admin ping -h ${TEST_HOST} -u root -p${ROOT_PASSWORD}"]
      interval: 5s
      timeout: 5s
      retries: 10

  sqlite:
    image: nouchka/sqlite3
    container_name: node_repo_sqlite
    working_dir: /data
    command: ["tail", "-f", "/dev/null"]
    volumes:
      - .${TEST_SQLITE_STORAGE}
    healthcheck:
      test: ["CMD", "sqlite3", "--version"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  postgres_data:
  mysql_data:
  mariadb_data:
`;
}
