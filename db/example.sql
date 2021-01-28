INSERT INTO users (email, passwd, name, address)
VALUES
('admin@weppo', '$2b$10$sFyrDwpqdlyM0sY7cb7MheSG9jZkae3WXaY87jCmTgM17LHzycSHO', 'Admin', 'II UWr'), -- passwd: admin123
('user@weppo' , '$2b$10$v.DZqBo0huvpb1wVrTOkluRzBcozoShAUJMXiK6Rmu3V.KhyoXz82', 'User' , 'II UWr'); -- passwd: user123

INSERT INTO roles (role) VALUES ('admin');
INSERT INTO user_role (user_id, role_id) VALUES (1, 1);

INSERT INTO items (name, price, amount, available, hidden)
VALUES
('Bulbulator', 3, 10, true, false),
('Bulbulator Extra', 1, 100, true, false),
('Kalkulator Maturalny', 20, 10, true, false),
('Kalkulator Naukowy', 50, 20, true, false),
('Kalkulator Graficzny', 100, 5, true, false),
('Kalkulator Profesjonalny', 1000, 10, true, false),
('Alternator', 1, 1040, true, false),
('Lampka', 20, 20, true, false),
('Lampka nocna', 20, 30, true, false),
('Lampka czołowa', 50, 10, true, false),
('Lampa wisząca', 60, 70, true, false),
('Lampa stojąca', 80, 90, true, false),
('Lampa podwieszana', 100, 12, true, false),
('LED Lampa Super + 500', 18, 435, true, false),
('LED Lampa Advaced 3000', 23, 234, true, false),
('Ukryty 1', 32, 100, false, true),
('Ukryty 2', 32, 100, true, true),
('Ukryty 3', 32, 100, false, true),
('Ukryty 4', 32, 100, true, true),
('Niedostępny A', 10, 87, false, false),
('Niedostępny B', 10, 0, true, false),
('Niedostępny C', 10, 300, false, false),
('Niedostępny D', 10, 0, true, false),
('Item Ultimo', 5, 200, true, false);
