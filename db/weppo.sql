CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    passwd TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    role TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS user_role  (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    -- it's hard to handle price here... let's do that in more ugly way :)
    -- price FLOAT NOT NULL,
    paid BOOLEAN,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price FLOAT NOT NULL,
    amount INTEGER NOT NULL,
    available BOOLEAN,
    hidden BOOLEAN
);

CREATE TABLE IF NOT EXISTS item_order (
    item_order_id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    FOREIGN KEY(item_id) REFERENCES items(id),
    FOREIGN KEY(order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS discounts (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL,
    discount FLOAT NOT NULL,
    rule TEXT NOT NULL,
    FOREIGN KEY(item_id) REFERENCES items(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users (email);
CREATE INDEX IF NOT EXISTS roles_user_id ON user_role (user_id);
CREATE INDEX IF NOT EXISTS orders_user_id ON orders (user_id);
CREATE INDEX IF NOT EXISTS item_order_order_id ON item_order (order_id);
CREATE INDEX IF NOT EXISTS discounts_item_id ON discounts (item_id);
