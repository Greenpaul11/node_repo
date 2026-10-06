CREATE TYPE specification_type AS ENUM ('laptop', 'monitor', 'tablet', 'smartphone', 'headphones');

CREATE TABLE product_importer (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shop (
    id SERIAL PRIMARY KEY,
    name VARCHAR(40) NOT NULL,
    founded TIMESTAMP WITH TIME ZONE NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(40) NOT NULL,
    slug VARCHAR(40) NOT NULL,
    parent_id INTEGER NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT category_parent_id_fk FOREIGN KEY (parent_id) REFERENCES category (id) ON DELETE SET NULL
);

CREATE INDEX category_parent_id ON category (parent_id);

CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    login VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product (
    id SERIAL PRIMARY KEY,
    importer_id INTEGER NULL,
    type VARCHAR(40) NOT NULL,
    brand VARCHAR(40) NOT NULL,
    model VARCHAR(100) NOT NULL,
    description TEXT NULL,
    image VARCHAR(300) NULL,
    variant VARCHAR(100) NOT NULL UNIQUE,
    variant_second VARCHAR(100) NULL UNIQUE,
    active BOOLEAN NOT NULL DEFAULT true,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT product_importer_id_fk FOREIGN KEY (importer_id) REFERENCES product_importer (id) ON DELETE SET NULL
);

CREATE INDEX product_importer_id ON product (importer_id);

CREATE TABLE price (
    id SERIAL PRIMARY KEY,
    price DECIMAL(7,2) NOT NULL,
    shop_id INTEGER NOT NULL,
    url VARCHAR(240) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    product_id INTEGER NOT NULL,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT price_shop_id_fk FOREIGN KEY (shop_id) REFERENCES shop (id) ON DELETE CASCADE,
    CONSTRAINT price_product_id_fk FOREIGN KEY (product_id) REFERENCES product (id) ON DELETE CASCADE
);

CREATE INDEX price_product_id ON price (product_id);
CREATE INDEX price_shop_id ON price (shop_id);

CREATE TABLE product_category (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    active BOOLEAN NOT NULL DEFAULT true,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT product_category_product_id_fk FOREIGN KEY (product_id) REFERENCES product (id) ON DELETE CASCADE,
    CONSTRAINT product_category_category_id_fk FOREIGN KEY (category_id) REFERENCES category (id) ON DELETE CASCADE
);

CREATE INDEX product_category_product_id ON product_category (product_id);
CREATE INDEX product_category_category_id ON product_category (category_id);

CREATE TABLE specification_tree (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    specification_type specification_type NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT specification_tree_product_id_fk FOREIGN KEY (product_id) REFERENCES product (id) ON DELETE CASCADE
);

CREATE INDEX specification_tree_product_id ON specification_tree (product_id);

CREATE TABLE specification (
    id SERIAL PRIMARY KEY,
    specification_tree_id INTEGER NOT NULL,
    specification TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT specification_specification_tree_id_fk FOREIGN KEY (specification_tree_id) REFERENCES specification_tree (id) ON DELETE CASCADE
);

CREATE TABLE comment (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT comment_product_id_fk FOREIGN KEY (product_id) REFERENCES product (id) ON DELETE CASCADE,
    CONSTRAINT comment_user_id_fk FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE
);

CREATE INDEX comment_product_id ON comment (product_id);
CREATE INDEX comment_user_id ON comment (user_id);

CREATE TABLE rate (
    id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rate INTEGER NOT NULL,
    active BOOLEAN NOT NULL DEFAULT true,
    created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT rate_comment_id_fk FOREIGN KEY (comment_id) REFERENCES comment (id) ON DELETE CASCADE,
    CONSTRAINT rate_user_id_fk FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE
);

CREATE INDEX rate_comment_id ON rate (comment_id);
CREATE INDEX rate_user_id ON rate (user_id);