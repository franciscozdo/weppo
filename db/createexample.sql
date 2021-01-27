-- root@localhost passwd
INSERT INTO users (email, passwd, name, address) VALUES ('root@localhost', '$2b$10$5F58ZFnf.ntArPc4HMaVq.u6I7ZrFcEpV1ADer/06pkAlx0Evc0ci', 'root', 'localhost');
-- user@localhost passwd
INSERT INTO users (email, passwd, name, address) VALUES ('user@remotehost', '$2b$10$5F58ZFnf.ntArPc4HMaVq.u6I7ZrFcEpV1ADer/06pkAlx0Evc0ci', 'user', 'remotehost');

INSERT INTO roles (role) VALUES ('admin');
INSERT INTO user_role (user_id, role_id) VALUES (1, 1);

-- test@localhost pass
INSERT INTO users (email, passwd, name, address) VALUES ('test@localhost', '$2b$10$C4VaQwv2JztHtvrpNnA.4OQabTgDnOEUVKQi2NIUzCmgY.zHE5Qfy', 'test', 'localhost');

INSERT INTO items (name, price, amount, available, hidden) VALUES ('item1', 10, 20, true, false);
INSERT INTO items (name, price, amount, available, hidden) VALUES ('item2', 100, 1, true, false);

INSERT INTO discounts (item_id, discount, rule) VALUES (2, 10, 'some long rule');
