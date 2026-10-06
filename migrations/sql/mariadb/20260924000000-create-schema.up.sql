CREATE TABLE product_importer (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE shop (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(40) NOT NULL,
    founded DATETIME NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE category (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(40) NOT NULL,
    slug VARCHAR(40) NOT NULL,
    parent_id INT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_category_parent_id FOREIGN KEY (parent_id) REFERENCES category (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX category_parent_id ON category (parent_id);

CREATE TABLE user (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    login VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE product (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    importer_id INT NULL,
    type VARCHAR(40) NOT NULL,
    brand VARCHAR(40) NOT NULL,
    model VARCHAR(100) NOT NULL,
    description TEXT NULL,
    image VARCHAR(300) NULL,
    variant VARCHAR(100) NOT NULL UNIQUE,
    variant_second VARCHAR(100) NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_importer_id FOREIGN KEY (importer_id) REFERENCES product_importer (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX product_importer_id ON product (importer_id);

CREATE TABLE price (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    price DECIMAL(7,2) NOT NULL,
    shop_id INT NOT NULL,
    url VARCHAR(240) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    product_id INT NOT NULL,
    created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_price_shop_id FOREIGN KEY (shop_id) REFERENCES shop (id) ON DELETE CASCADE,
    CONSTRAINT fk_price_product_id FOREIGN KEY (product_id) REFERENCES product (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX price_product_id ON price (product_id);
CREATE INDEX price_shop_id ON price (shop_id);

CREATE TABLE product_category (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    category_id INT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pc_product_id FOREIGN KEY (product_id) REFERENCES product (id) ON DELETE CASCADE,
    CONSTRAINT fk_pc_category_id FOREIGN KEY (category_id) REFERENCES category (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX product_category_product_id ON product_category (product_id);
CREATE INDEX product_category_category_id ON product_category (category_id);

CREATE TABLE specification_tree (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    specification_type ENUM ('laptop', 'monitor', 'tablet', 'smartphone', 'headphones') NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_specification_tree_product_id FOREIGN KEY (product_id) REFERENCES product (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX specification_tree_product_id ON specification_tree (product_id);

CREATE TABLE specification (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    specification_tree_id INT NOT NULL,
    specification TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_specification_tree_id FOREIGN KEY (specification_tree_id) REFERENCES specification_tree (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE comment (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comment_product_id FOREIGN KEY (product_id) REFERENCES product (id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_user_id FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX comment_product_id ON comment (product_id);
CREATE INDEX comment_user_id ON comment (user_id);

CREATE TABLE rate (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    comment_id INT NOT NULL,
    user_id INT NOT NULL,
    rate INT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rate_comment_id FOREIGN KEY (comment_id) REFERENCES comment (id) ON DELETE CASCADE,
    CONSTRAINT fk_rate_user_id FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX rate_comment_id ON rate (comment_id);
CREATE INDEX rate_user_id ON rate (user_id);