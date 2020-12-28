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

    this.sqlUpdate = 'UPDATE users SET email=$2, passwd=$3, name=$4, address=$5 WHERE id=$1';
    this.sqlFind = 'SELECT id, email, passwd, name, address FROM users WHERE email=$1';
    this.sqlInsert = 'INSERT INTO users (email, passwd, name, address) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING RETURNING id';
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
    await handle.release();
    
    let row = res.rows;
    if (row.length != 1)
      return false;

    this.id = row[0]['id'];
    this.email = row[0]['email'];
    this.passwd = row[0]['passwd'];
    this.name = row[0]['name'];
    this.address = row[0]['address'];

    return true;
  }

  Insert = async function (name, passwd, address) {
    let handle = await this.db.connect();
    this.name = name;
    this.passwd = Hash(passwd);
    this.address = passwd;
    let res = await handle.query(this.sqlInsert, [this.email, this.passwd, this.name, this.address])
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

app.get('/register', async (req, res) => {
  if ('user' in req.session) {
    res.redirect('/');
  } else {
    res.render('register', {
      'serverTime': Now(),
      'username': '',
      'info': [],
      'warnings': []
    });
  }
});

/* validate register form */
function registerCheck(name, address, email, passwd, repasswd) {
  if (passwd != repasswd)
    return false;
  if (name.length == 0 || address.length == 0 || email.length == 0 || passwd.length == 0)
    return false;
  return true;
}

app.post('/register', async (req, res) => {
  if ('user' in req.session)
    res.redirect('/');

  const name = req.body.name;
  const address = req.body.name;
  const email = req.body.email;
  const passwd = req.body.passwd;
  const repasswd = req.body.repasswd;

  if (registerCheck(name, address, email, passwd, repasswd) == false) {
    res.render('register', {
      'serverTime': Now(),
      'username': '',
      'info': [],
      'warnings': ['Data is not correct.']
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

app.get('/login', async (req, res) => {
  res.end('TODO');
});

app.post('/login', async (req, res) => {
  res.end('TODO');
});

app.get('/', async (req, res) => {
  res.end('TODO');
});

http.createServer(app).listen(5321);
