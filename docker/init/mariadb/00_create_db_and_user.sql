
CREATE DATABASE IF NOT EXISTS node_repo_test;

CREATE USER IF NOT EXISTS 'migrator'@'%' IDENTIFIED BY 'migratorPass123';
GRANT ALL PRIVILEGES ON node_repo_test.* TO 'migrator'@'%';

CREATE USER IF NOT EXISTS 'test_user'@'%' IDENTIFIED BY 'testUserPass123';
GRANT SELECT, INSERT, UPDATE, DELETE ON node_repo_test.* TO 'test_user'@'%';

FLUSH PRIVILEGES;
