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
    this.sqlInsert = 'INSERT INTO users (email, passwd, name, address) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING id';
    this.sqlRoles = 'SELECT roles.role FROM roles INNER JOIN user_role ON user_role.role_id=roles.id INNER JOIN users ON users.id=user_role.user_id WHERE users.id=$1';
  }

  Update = async function() {
    /* let's assume that this is a _valid_ user */
    let handle = await this.db.connect();
    await handle.query(this.sqlUpdate, [this.id, this.email, this.passwd, this.name, this.address]);
    await handle.release();
  }

  Find = async function() {
    let handle = await this.db.connect();
    let res = await handle.query(this.sqlFind, [this.email]);
    
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
    await handle.query(this.sqlUpdate, [this.item_id, this.discount, this.rule]);
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
      'info': [],
      'warnings': [`${email} is already used.`]
    });
  } else {
    req.session.user = email;
    res.render('register', {
      'serverTime': Now(),
      'username': email,
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
      'info': [],
      'warnings': [`Password mismatch.`]
    });
    return;
  }

  req.session.user = email;
  let user_id = user.id;

  res.render('login', {
    'serverTime': Now(),
    'username': email,
    'info': [`Success - your user id is ${user_id}.`],
    'warnings': []
  });
});

app.get('/logout', async (req, res) => {
  delete req.session.user;
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

/* ------------------------------------------------------------------------- */

app.put('/api/v1/role/add/:role', requireAdmin, async (req, res) => {
  let handle = await db.connect();
  await handle.query('INSERT INTO roles (role) VALUES ($1) ON CONFLICT (role) DO NOTHING', [req.params.role]);
  await handle.release();
  res.end('ok');
});

app.put('/api/v1/user/:user_id/role/add/:role_id', requireAdmin, async (req, res) => {
  let handle = await db.connect();
  try {
    await handle.query('INSERT INTO user_role (user_id, role_id) VALUES ($1, $2)', [req.params.user_id, req.params.role_id]);
    res.end('ok');
  } catch (ex) {
    console.log('====== EXCEPTION ======');
    console.log(ex);
    console.log('=======================');
    res.status(400).end('failure');
  } finally {
    await handle.release();
  }
});

function validateItemAdd(req) {
  return ('name' in req && 'price' in req && 'amount' in req && 'available' in req && 'hidden' in req);
}

app.put('/api/v1/item/add', requireAdmin, express.json(), async (req, res) => {
  if (validateItemAdd(req.body) == false) {
    res.status(400).end('data mismatch');
    return;
  }

  let item = new Item(db, /* id */ -1);
  let item_id = await item.Insert(req.body.name, req.body.price, req.body.amount, req.body.available, req.body.hidden);
  
  if (item_id == -1) {
    res.status(500).end('internal error');
    return;
  }

  res.json({ id: item_id });
});

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
    res.status(400).end('data mismatch');
    return;
  }

  /* now we are sure that item _exists_ */
  let discount = new Discount(db, /* id */ -1);
  let discount_id = await discount.Insert(req.body.item_id, req.body.discount, req.body.rule);

  if (discount_id == -1) {
    res.status(500).end('internal error');
    return;
  }

  res.json({ id: discount_id });
});

app.get('/api/v1/discount/list/:item_id', async (req, res) => {
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

/* ------------------------------------------------------------------------- */

app.get('/', async (req, res) => {
  let user = '';
  if ('user' in req.session)
    user = req.session.user;

  res.render('index', {
    'serverTime': Now(),
    'username': user,
    'info': [],
    'warnings': []
  });
});

http.createServer(app).listen(5321);
