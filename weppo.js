const http = require('http');
const express = require('express');
const session =  require('express-session')
const bodyParser = require('body-parser')
const pg = require('pg');
const bcrypt = require('bcrypt');

const app = express();

/* XXX: useful constants */
const kSessionSecret = '\057\108\181\205\180\139\139\235\213\216';
const kViewsDir = './views';
const kServerPort = 5321;
const kDbHost = 'localhost';
const kDbPort = 5432;
const kDbUser = 'weppo';
const kDbPasswd = 'weppo';
const kDbName = 'weppo';
const kBcryptRounds = 10;
const kAdminRole = 'admin';

let db = new pg.Pool({
  host: kDbHost,
  port: kDbPort,
  database: kDbName,
  user: kDbUser,
  password: kDbPasswd
});

app.set('view engine', 'ejs');
app.set('views', kViewsDir);
app.set('trust proxy', 'loopback');

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('static'))

/* let's use in memory storage */
app.use(session({
  secret: kSessionSecret,
  resave: true,
}));

function Now() {
  return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

app.use((req, res, next) => {
  timestamp = Now();
  if ('user' in req.session) {
    console.log(`${req.ips} - [${timestamp}] - ${req.session.user} - ${req.url}`);
  } else {
    console.log(`${req.ips} - [${timestamp}] - - ${req.url}`);
  }
  next();
});

/* ------------------------------------------------------------------------- */

function Hash(text) {
  return bcrypt.hashSync(text, kBcryptRounds);
}

function HashEq(text, hash) {
  return bcrypt.compareSync(text, hash);
}

/* ------------------------------------------------------------------------- */

class User {
  constructor(db, email) {
    this.db = db
    this.id = -1;
    this.email = email;
    this.passwd = '';
    this.name = '';
    this.address = '';
    this.roles = [];

    this.sqlUpdate = 'UPDATE users SET email=$2, passwd=$3, name=$4, address=$5 WHERE id=$1';
    this.sqlFind = 'SELECT id, email, passwd, name, address FROM users WHERE email=$1';
    this.sqlFindById = 'SELECT id, email, passwd, name, address FROM users WHERE id=$1';
    this.sqlInsert = 'INSERT INTO users (email, passwd, name, address) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING id';
    this.sqlRoles = 'SELECT roles.role FROM roles INNER JOIN user_role ON user_role.role_id=roles.id INNER JOIN users ON users.id=user_role.user_id WHERE users.id=$1';
  }

  Update = async function() {
    /* let's assume that this is a _valid_ user */
    let handle = await this.db.connect();
    await handle.query(this.sqlUpdate, [this.id, this.email, this.passwd, this.name, this.address]);
    await handle.release();
  }

  _findCommon = async function(handle, res) {
    let row = res.rows;
    if (row.length != 1) {
      await handle.release();
      return false;
    }

    this.id = row[0]['id'];
    this.email = row[0]['email'];
    this.passwd = row[0]['passwd'];
    this.name = row[0]['name'];
    this.address = row[0]['address'];

    let roles = await handle.query(this.sqlRoles, [this.id]);
    await handle.release();

    roles = roles.rows;
    for (let i = 0; i < roles.length; ++i) {
      this.roles.push(roles[i]['role']);
    }

    return true;
  }

  Find = async function() {
    let handle = await this.db.connect();
    let res = await handle.query(this.sqlFind, [this.email]);
    return await this._findCommon(handle, res);
  }

  FindById = async function(id) {
    this.id = id;
    let handle = await this.db.connect();
    let res = await handle.query(this.sqlFindById, [this.id]);
    return await this._findCommon(handle, res);
  }

  Insert = async function(name, passwd, address) {
    let handle = await this.db.connect();
    this.name = name;
    this.passwd = Hash(passwd);
    this.address = address;
    let res = await handle.query(this.sqlInsert, [this.email, this.passwd, this.name, this.address])
    await handle.release();

    let row = res.rows;
    if (row.length == 1) {
      this.id = row[0]['id'];
      return this.id;
    }
    return -1;
  }

  Authorize = function(passwd) {
    return HashEq(passwd, this.passwd);
  }

  Admin = async function() {
    if (await this.Find() == false)
      return false;

    return this.roles.includes(kAdminRole);
  }
}

class Item {
  constructor(db, id) {
    this.db = db
    this.id = id;
    this.name = '';
    this.price = -1;
    this.amount = -1;
    this.available = false;
    this.hidden = true;

    this.sqlUpdate = 'UPDATE items SET name=$2, price=$3, amount=$4, available=$5, hidden=$6 WHERE id=$1';
    this.sqlFind = 'SELECT id, name, price, amount, available, hidden FROM items WHERE id=$1';
    this.sqlInsert = 'INSERT INTO items (name, price, amount, available, hidden) VALUES ($1, $2, $3, $4, $5) RETURNING id';
  }

  Update = async function() {
    /* let's assume that this is a _valid_ item */
    let handle = await this.db.connect();
    await handle.query(this.sqlUpdate, [this.id, this.name, this.price, this.amount, this.available, this.hidden]);
    await handle.release();
  }

  Find = async function() {
    let handle = await this.db.connect();
    let res = await handle.query(this.sqlFind, [this.id]);
    await handle.release();

    let row = res.rows;
    if (row.length != 1) {
      return false;
    }

    this.id = row[0]['id'];
    this.name = row[0]['name'];
    this.price = row[0]['price'];
    this.amount = row[0]['amount'];
    this.available = row[0]['available'];
    this.hidden = row[0]['hidden'];

    return true;
  }

  Insert = async function(name, price, amount, available, hidden) {
    let handle = await this.db.connect();

    this.name = name;
    this.price = price;
    this.amount = amount;
    this.available = available;
    this.hidden = hidden;

    let res = await handle.query(this.sqlInsert, [this.name, this.price, this.amount, this.available, this.hidden])
    await handle.release();

    let row = res.rows;
    if (row.length == 1) {
      this.id = row[0]['id'];
      return this.id;
    }
    return -1;
  }
}

class Discount {
  constructor(db, id) {
    this.db = db
    this.id = id;
    this.item_id = -1;
    this.discount = 0;
    this.rule = '';

    this.sqlUpdate = 'UPDATE discounts SET item_id=$2, discount=$3, rule=$4 WHERE id=$1';
    this.sqlFind = 'SELECT id, item_id, discount, rule FROM discounts WHERE id=$1';
    this.sqlInsert = 'INSERT INTO discounts (item_id, discount, rule) VALUES ($1, $2, $3) RETURNING id';
  }

  Update = async function() {
    /* let's assume that this is a _valid_ discount */
    let handle = await this.db.connect();
    await handle.query(this.sqlUpdate, [this.id, this.item_id, this.discount, this.rule]);
    await handle.release();
  }

  Find = async function() {
    let handle = await this.db.connect();
    let res = await handle.query(this.sqlFind, [this.id]);
    await handle.release();

    let row = res.rows;
    if (row.length != 1) {
      return false;
    }

    this.id = row[0]['id'];
    this.item_id = row[0]['item_id'];
    this.discount = row[0]['discount'];
    this.rule = row[0]['rule'];

    return true;
  }

  Insert = async function(item_id, discount, rule) {
    let handle = await this.db.connect();

    this.item_id = item_id;
    this.discount = discount;
    this.rule = rule;

    let res = await handle.query(this.sqlInsert, [this.item_id, this.discount, this.rule]);
    await handle.release();

    let row = res.rows;
    if (row.length == 1) {
      this.id = row[0]['id'];
      return this.id;
    }
    return -1;
  }

  Invalidate = async function() {
    /* 0 is a neutral value for discount */
    this.discount = 0;
    await this.Update();
  }

  Valid = async function() {
    await this.Find();
    return this.discount != 0;
  }
}

class Order {
  constructor(db, id) {
    this.db = db
    this.id = id;
    this.user_id = -1;
    this.paid = false;

    this.sqlUpdate = 'UPDATE orders SET user_id=$2, paid=$3 WHERE id=$1';
    this.sqlFind = 'SELECT id, user_id, paid FROM orders WHERE id=$1';
    this.sqlInsert = 'INSERT INTO orders (user_id, paid) VALUES ($1, $2) RETURNING id';
  }

  Update = async function() {
    /* let's assume that this is a _valid_ order */
    let handle = await this.db.connect();
    await handle.query(this.sqlUpdate, [this.id, this.user_id, this.paid]);
    await handle.release();
  }

  Find = async function() {
    let handle = await this.db.connect();
    let res = await handle.query(this.sqlFind, [this.id]);
    await handle.release();

    let row = res.rows;
    if (row.length != 1) {
      return false;
    }

    this.id = row[0]['id'];
    this.user_id = row[0]['user_id'];
    this.paid = row[0]['paid'];

    return true;
  }

  Insert = async function(user_id, paid) {
    let handle = await this.db.connect();

    this.user_id = user_id;
    this.paid = paid;

    let res = await handle.query(this.sqlInsert, [this.user_id,  this.paid]);
    await handle.release();

    let row = res.rows;
    if (row.length == 1) {
      this.id = row[0]['id'];
      return this.id;
    }
    return -1;
  }
}

/* ------------------------------------------------------------------------- */

async function skipLogin(req, res, next) {
  if ('user' in req.session) {
    res.redirect('/');
    return;
  }
  next();
}

app.get('/register', skipLogin, async (req, res) => {
  res.render('register', {
    'serverTime': Now(),
    'username': '',
    'userID': '',
    'info': [],
    'warnings': []
  });
});

/* validate register form */
function registerCheck(name, address, email, passwd, repasswd) {
  if (passwd != repasswd)
    return false;
  if (name.length == 0 || address.length == 0 || email.length == 0 || passwd.length == 0)
    return false;
  return true;
}

app.post('/register', skipLogin, async (req, res) => {
  const name = req.body.name;
  const address = req.body.address;
  const email = req.body.email;
  const passwd = req.body.passwd;
  const repasswd = req.body.repasswd;

  if (registerCheck(name, address, email, passwd, repasswd) == false) {
    res.render('register', {
      'serverTime': Now(),
      'username': '',
      'userID': '',
      'info': [],
      'warnings': ['Data are not correct.']
    });
  }

  let user = new User(db, email);
  let user_id = await user.Insert(name, passwd, address);

  if (user_id == -1) {
    res.render('register', {
      'serverTime': Now(),
      'username': '',
      'userID': '',
      'info': [],
      'warnings': [`${email} is already used.`]
    });
  } else {
    req.session.user = email;
    req.session.user_id = user_id;
    res.render('register', {
      'serverTime': Now(),
      'username': email,
      'userID': user_id,
      'info': [`Success - your user id is ${user_id}.`],
      'warnings': []
    });
  }
});

/* ------------------------------------------------------------------------- */

app.get('/login', skipLogin, async (req, res) => {
  res.render('login', {
    'serverTime': Now(),
    'username': '',
    'userID': '',
    'info': [],
    'warnings': []
  });
});

app.post('/login', skipLogin, async (req, res) => {
  const email = req.body.email;
  const passwd = req.body.passwd;

  let user = new User(db, email);
  if (await user.Find() == false) {
    /* user doesn't exist */
    res.render('login', {
      'serverTime': Now(),
      'username': '',
      'userID': '',
      'info': [],
      'warnings': [`${email} doesn't exist.`]
    });
    return;
  }

  if (user.Authorize(passwd) == false) {
    /* password mismatch */
    res.render('login', {
      'serverTime': Now(),
      'username': '',
      'userID': '',
      'info': [],
      'warnings': [`Password mismatch.`]
    });
    return;
  }

  let user_id = user.id;
  req.session.user = email;
  req.session.user_id = user_id;

  res.redirect('/');
});

app.get('/logout', async (req, res) => {
  delete req.session.user;
  delete req.session.user_id;
  delete req.session.order_id;
  res.redirect('/');
});

/* ------------------------------------------------------------------------- */

async function requireAdmin(req, res, next) {
  if ('user' in req.session) {
    let user = new User(db, req.session.user);
    if (await user.Admin()) {
      next();
      return;
    }
  }
  res.status(403).end('403');
}

async function requireLogin(req, res, next) {
  if ('user' in req.session) {
    next();
    return;
  }
  res.status(403).end('403');
}

/* ------------------------------------------------------------------------- */

app.get('/api/v1/user/list', requireAdmin, async (req, res) => {
  let handle = await db.connect();
  let rows = await handle.query('SELECT id, email, name, address FROM users', []);
  let users = []
  for (let i = 0; i < rows.rows.length; ++i) {
    users.push(rows.rows[i]);
  }
  await handle.release();
  res.json(users);
});

app.get('/api/v1/role/list', requireAdmin, async (req, res) => {
  let handle = await db.connect();
  let rows = await handle.query('SELECT id, role FROM roles', []);
  let roles = []
  for (let i = 0; i < rows.rows.length; ++i) {
    roles.push(rows.rows[i]);
  }
  await handle.release();
  res.json(roles);
});

app.put('/api/v1/role/add/:role', requireAdmin, async (req, res) => {
  let handle = await db.connect();
  await handle.query('INSERT INTO roles (role) VALUES ($1) ON CONFLICT (role) DO NOTHING', [req.params.role]);
  await handle.release();
  res.json({'status': 'ok'});
});

app.put('/api/v1/user/:user_id/role/add/:role_id', requireAdmin, async (req, res) => {
  let handle = await db.connect();
  try {
    await handle.query('INSERT INTO user_role (user_id, role_id) VALUES ($1, $2)', [req.params.user_id, req.params.role_id]);
    res.json({'status': 'ok'});
  } catch (ex) {
    console.log('====== EXCEPTION ======');
    console.log(ex);
    console.log('=======================');
    res.status(400).json({'status': 'failure'});
  } finally {
    await handle.release();
  }
});

function validateItemAdd(req) {
  return ('name' in req && 'price' in req && 'amount' in req && 'available' in req && 'hidden' in req);
}

app.put('/api/v1/item/add', requireAdmin, express.json(), async (req, res) => {
  if (validateItemAdd(req.body) == false) {
    res.status(400).json({'status': 'data mismatch'});
    return;
  }

  let item = new Item(db, /* id */ -1);
  let item_id = await item.Insert(req.body.name, req.body.price, req.body.amount, req.body.available, req.body.hidden);

  if (item_id == -1) {
    res.status(500).json({'status': 'internal error'});
    return;
  }

  res.json({ id: item_id });
});

async function validateItemUpdate(req) {
  if (validateItemAdd(req) == false || !('id' in req)) {
    return false;
  }

  let item = new Item(db, req.id);
  return await item.Find();
}

app.put('/api/v1/item/update', requireAdmin, express.json(), async (req, res) => {
  console.log(req.body);
  if (await validateItemUpdate(req.body) == false) {
    res.status(400).json({'status': 'data mismatch'});
    return;
  }

  /* it's a correct solution but _not_ good */
  let item = new Item(db, req.body.id);
  await item.Find();

  item.name = req.body.name;
  item.price = req.body.price;
  item.amount = req.body.amount;
  item.available = req.body.available;
  item.hidden = req.body.hidden;

  await item.Update();
  res.json({'status': 'ok'});
});

app.get('/api/v1/item/list', async (req, res) => {
  let handle = await db.connect();
  let ret = await handle.query('SELECT id, name, price, amount, available, hidden FROM items');
  await handle.release();

  let items = []

  for (let i = 0; i < ret.rows.length; ++i) {
    items.push({
      'id': ret.rows[i]['id'],
      'name': ret.rows[i]['name'],
      'price': ret.rows[i]['price'],
      'amount': ret.rows[i]['amount'],
      'available': ret.rows[i]['available'],
      'hidden': ret.rows[i]['hidden']
    });
  }

  res.json(items);
});

app.get('/api/v1/item/:item_id', async (req, res) => {
  if (isNaN(Number(req.params.item_id))) {
    res.status(400).json({'status': 'invalid id'});
    return;
  }

  let item_id = req.params.item_id;
  let handle = await db.connect();
  let ret = await handle.query(`SELECT id, name, price, amount, available, hidden FROM items WHERE id=${item_id}`);
  await handle.release();

  if (ret.rows.length == 0) {
    res.status(404).json({'status': 'item not found'});
    return;
  }
  let item = {
      'id': ret.rows[0]['id'],
      'name': ret.rows[0]['name'],
      'price': ret.rows[0]['price'],
      'amount': ret.rows[0]['amount'],
      'available': ret.rows[0]['available'],
      'hidden': ret.rows[0]['hidden']
  };
  res.json(item);
});

/* ------------------------------------------------------------------------- */

async function validateDiscount(req) {
  if (!('item_id' in req && 'discount' in req && 'rule' in req)) {
    return false;
  }

  let item = new Item(db, req.item_id);
  if (await item.Find() == false) {
    return false;
  }

  return true;
}

app.put('/api/v1/discount/add', requireAdmin, express.json(), async (req, res) => {
  if (await validateDiscount(req.body) == false) {
    res.status(400).json({'status': 'data mismatch'});
    return;
  }

  /* now we are sure that item _exists_ */
  let discount = new Discount(db, /* id */ -1);
  let discount_id = await discount.Insert(req.body.item_id, req.body.discount, req.body.rule);

  if (discount_id == -1) {
    res.status(500).json({'status': 'internal error'});
    return;
  }

  res.json({ id: discount_id });
});

app.delete('/api/v1/discount/delete/:discount_id', requireAdmin, async (req, res) => {
  if (isNaN(Number(req.params.discount_id))) {
    res.status(400).json({'status': 'invalid id'});
    return;
  }

  let discount = new Discount(db, req.params.discount_id);

  if (await discount.Find() == false) {
    res.status(400).json({'status': 'discount not found'});
    return;
  }

  await discount.Invalidate();
  res.json({'status': 'ok'});
});

app.get('/api/v1/discount/list/:item_id', async (req, res) => {
  if (isNaN(Number(req.params.item_id))) {
    res.status(400).json({'status': 'invalid id'});
    return;
  }

  let item_id = req.params.item_id;

  let handle = await db.connect();
  let ret = await handle.query('SELECT * FROM discounts WHERE item_id=$1', [item_id]);
  await handle.release();

  discounts = [];

  for (let i = 0; i < ret.rows.length; ++i) {
    discounts.push({
      'id': ret.rows[i]['id'],
      'item_id': ret.rows[i]['item_id'],
      'discount': ret.rows[i]['discount'],
      'rule': ret.rows[i]['rule']
    });
  }

  res.json(discounts);
});

app.get('/api/v1/order/get', requireLogin, async (req, res) => {
  if (!('order_id' in req.session)) {
    res.status(400).json({'status': 'no current order'});
    return;
  }

  res.json({'id': req.session.order_id});
});

app.put('/api/v1/order/create', requireLogin, async (req, res) => {
  let user = new User(db, req.session.user);
  await user.Find();

  let order = new Order(db, -1);
  let order_id = await order.Insert(user.id, false);
  req.session.order_id = order_id;

  res.json({'id': order_id});
});

app.put('/api/v1/order/add/:item_id', requireLogin, async (req, res) => {
  if (isNaN(Number(req.params.item_id))) {
    res.status(400).json({'status': 'invalid id'});
    return;
  }
  /* ughh... it's horrible... */

  /* 1. find user - we already have called requireLogin so somebody _should_ exist */
  let user = new User(db, req.session.user);
  await user.Find();

  /* 2. find order */
  if (!('order_id' in req.session)) {
    res.status(400).json({'status': 'data mismatch'});
    return;
  }

  let order = new Order(db, req.session.order_id);
  if (await order.Find() == false) {
    /* 2.1 order doesn't exist (we shouldn't get here) */
    res.status(400).json({'status': 'data mismatch'});
    return;
  }

  /* 3. user must be an owner of order */
  if (order.user_id != user.id) {
    res.status(400).json({'status': 'data mismatch'});
    return;
  }

  /* 4. order must be open */
  if (order.paid) {
    res.status(400).json({'status': 'data mismatch'});
    return;
  }

  /* 4. find item */
  let item = new Item(db, req.params.item_id);
  if (await item.Find() == false) {
    /* 4.1 item doesn't exist */
    res.status(400).json({'status': 'data mismatch'});
    return;
  }

  /* 5. check available */
  if (item.available == false) {
    /* we shouldn't be here... but our permission model is stupid :) */
    res.status(400).json({'status': 'data mismatch'});
    return;
  }

  /* 6. check amount */
  if (item.amount == 0) {
    res.status(400).json({'status': 'data mismatch'});
    return;
  }

  /* ughh... I don't have any idea what to do with hidden field here... */


  /* ok... it's time to add item into order */
  let stmt = 'INSERT INTO item_order (item_id, order_id) VALUES ($1, $2)';
  let handle = await db.connect();

  await handle.query(stmt, [item.id, order.id]);

  item.amount--;
  await item.Update();

  await handle.release();

  /* get out of hell */
  res.json({'status': 'ok'});
});

app.delete('/api/v1/order/delete/:item_order_id', requireLogin, async (req, res) => {
  if (isNaN(Number(req.params.item_order_id))) {
    res.status(400).json({'status': 'invalid id'});
    return;
  }

  /* 1. find user - we already have called requireLogin so somebody _should_ exist */
  let user = new User(db, req.session.user);
  await user.Find();

  /* 2. find order */
  if (!('order_id' in req.session)) {
    res.status(400).json({'status': 'data mismatch'});
    return;
  }

  let order = new Order(db, req.session.order_id);
  if (await order.Find() == false) {
    /* 2.1 order doesn't exist (we shouldn't get here) */
    res.status(400).json({'status': 'data mismatch'});
    return;
  }

  /* 3. user must be an owner of order */
  if (order.user_id != user.id) {
    res.status(400).json({'status': 'data mismatch'});
    return;
  }

  /* 4. order must be open */
  if (order.paid) {
    res.status(400).json({'status': 'data mismatch'});
    return;
  }

  /* 5. invalidate item */

  let sqlFind = 'SELECT item_id FROM item_order WHERE id=$1';
  let sqlDelete = 'DELETE FROM item_order WHERE id=$1';
  let handle = await db.connect();

  /* 6.1 update amount */
  let ret = await handle.query(sqlFind, [req.params.item_order_id]);
  let item = new Item(db, ret.rows[0]['item_id']);
  await item.Find();
  item.amount++;
  await item.Update();

  /* 6.2 delete old item */
  await handle.query(sqlDelete, [req.params.item_order_id]);

  await handle.release();
  res.json({'status': 'ok'});
});

app.get('/api/v1/order/user/:user_id/list', requireLogin, async (req, res) => {
  /* 1. recv user */
  let user = new User(db, '');
  if (await user.FindById(req.params.user_id) == false) {
    res.status(400).json({'status': 'data mismatch'});
    return;
  }

  /* 2. check permission */
  let me = new User(db, req.session.user);
  if (await me.Admin() == false && me.id != user.id) {
    res.status(403).json({'status': '403'});
    return;
  }

  /* 3. recv orders */
  let orders = [];

  let sql = 'SELECT id, user_id, paid FROM orders WHERE user_id=$1';
  let handle = await db.connect();

  let ret = await handle.query(sql, [user.id]);

  for (let i = 0; i < ret.rows.length; ++i) {
    orders.push({
      'id': ret.rows[i]['id'],
      'user_id': ret.rows[i]['user_id'],
      'paid': ret.rows[i]['paid']
    });
  }

  await handle.release();
  res.json(orders);
});

app.put('/api/v1/order/pay', requireLogin, async (req, res) => {
  /* 1. recv user */
  let user = new User(db, req.session.user);
  await user.Find();

  if (!('order_id' in req.session)) {
    res.status(400).json({'status': 'data mismatch'});
    return;
  }

  /* 2. check permission */
  let order = new Order(db, req.session.order_id);
  if (await order.Find() == false) {
    res.status(400).json({'status': 'data mismatch'});
    return;
  }
  if (order.user_id != user.id) {
    res.status(400).json({'status': 'data mismatch'});
    return;
  }

  order.paid = true;
  await order.Update();

  res.end('ok');
});

app.get('/api/v1/order/list/:order_id', requireLogin, async (req, res) => {
  if (isNaN(Number(req.params.order_id))) {
    res.status(400).json({'status': 'invalid id'});
    return;
  }

  /* 1. recv user */
  let user = new User(db, req.session.user);
  await user.Find();

  /* 2. check permission */
  let order = new Order(db, req.params.order_id);
  if (await order.Find() == false) {
    res.status(400).json({'status': 'data mismatch'});
    return;
  }
  if (order.user_id != user.id && await user.Admin() == false) {
    res.status(400).json({'status': 'data mismatch'});
    return;
  }

  let items = [];
  let sql = 'SELECT id, item_id, order_id FROM item_order WHERE order_id=$1';
  let handle = await db.connect();
  let ret = await handle.query(sql, [order.id]);
  await handle.release();

  for (let i = 0; i < ret.rows.length; ++i) {
    items.push({
      'id': ret.rows[i]['id'],
      'item_id': ret.rows[i]['item_id']
    });
  }

  res.json(items);
});

/* ------------------------------------------------------------------------- */

app.get('/', async (req, res) => {
  let user = '';
  let user_id;
  if ('user' in req.session) {
    user = req.session.user;
    user_id = req.session.user_id;
  }

  res.render('index', {
    'serverTime': Now(),
    'username': user,
    'userID': user_id,
    'info': [],
    'warnings': []
  });
});

app.get('/list/item', async (req, res) => {
  let user = '';
  let user_id = '';
  if ('user' in req.session) {
    user = req.session.user;
    user_id = req.session.user_id;
  }

  res.render('item_list', {
    'serverTime': Now(),
    'username': user,
    'userID': user_id
  });
});

app.get('/item/:id', async (req, res) => {
  if (isNaN(Number(req.params.id))) {
    res.status(400).end('invalid id');
    return;
  }
  let user = '';
  let user_id = '';
  if ('user' in req.session) {
    user = req.session.user;
    user_id = req.session.user_id;
  }

  res.render('item', {
    'serverTime': Now(),
    'itemID': req.params.id,
    'username': user,
    'userID': user_id
  });
});

app.get('/add/item', requireAdmin, async (req, res) => {
  res.render('item_add', {
    'serverTime': Now(),
    'username': req.session.user,
    'userID': req.session.user_id
  });
});

app.get('/update/item/:id', requireAdmin, async (req, res) => {
  if (isNaN(Number(req.params.id))) {
    res.status(400).end('invalid id');
    return;
  }

  res.render('item_update', {
    'serverTime': Now(),
    'username': req.session.user,
    'userID': req.session.user_id,
    'itemID': req.params.id
  });
});

/* list of discounts with actions add and delete */
app.get('/discounts', requireAdmin, async (req, res) => {
  res.render('discounts', {
    'serverTime': Now(),
    'username': req.session.user,
    'userID': req.session.user_id
  });
});

app.get('/order/:id', requireLogin, async (req, res) => {
  if (isNaN(Number(req.params.id))) {
    res.status(400).end('invalid id');
    return;
  }

  let order = new Order(db, req.params.id);
  await order.Find();

  if (order.user_id != req.session.user_id) {
    res.status(403).end('forbidden');
    return;
  }

  res.render('order', {
    'serverTime': Now(),
    'username': req.session.user,
    'userID': req.session.user_id,
    'orderID': req.params.id
  });
});

app.get('/orders', requireLogin, async (req, res) => {
  res.render('orders', {
    'serverTime': Now(),
    'username': req.session.user,
    'userID': req.session.user_id
  });
});

app.get('/cart', requireLogin, async (req, res) => {
  if ('order_id' in req.session)
    res.redirect(`/order/${req.session.order_id}`);
  else
    res.end("Your cart is empty :(");
});

console.log(`Listening on localhost:${kServerPort}`);
http.createServer(app).listen(kServerPort);
