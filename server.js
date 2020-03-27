const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const MongoClient = require('mongodb').MongoClient;
const { ObjectID } = require('mongodb');
const assert = require('assert');

const app = express();
const url = process.env.MONGODB_URI || 'mongodb://localhost:' + 27017 + '/notes';
const dbName = "notes";
const client = new MongoClient(url, { useUnifiedTopology: true });

const BADREQUEST = 400;
const UNAUTHORIZED = 401;
const FORBIDDEN = 403;
const NOTFOUND = 404;
const SUCCESS = 200;
const CREATED = 201;

const SALTROUND = 12;

const JWT_KEY = process.env.JWT_KEY || 'secret';
const JWT_EXPIRY = 24 * 60 * 60;

app.use(express.json());

const log = console.log;

async function getCol(colName) {
  const db = client.db(dbName);
  return db.collection(colName);
}

async function findUser(username){
  const col = await getCol('users');
  const user = await col.findOne({ username: username });
  return user == null ? false : user; 
}

async function findUserByid(id){
  const col = await getCol('users');
  return col.findOne({ _id: ObjectID(id) });
}

function makeToken(id){
  return jwt.sign({ id }, JWT_KEY, { expiresIn: JWT_EXPIRY })
}

async function authenticateToken(token){
  try{
    return jwt.verify(token, JWT_KEY);
  }catch(e){
    log(e);
  }
}

(async function() {
try {
  await client.connect();
  log('Connected to ' + dbName)
} catch (err) { log(err.stack); }
})();

app.listen(3000, function () {
  log('API listening on port 3000!')
})

// respond with "hello world" when a GET request is made to the homepage
app.get('/', function(req, res) {
  res.send('hello world');
});

app.post('/signup', async (req, res) => {
  let username = req.body.username != undefined? req.body.username : null;
  let password = req.body.password != undefined? req.body.password : null;
  let user = await findUser(username);
  if(password.length < 4 ){
    res.status(BADREQUEST).send({ error : "Le mot de passe doit contenir au moins 4 caractères", token: "" });
    return;
  }
  if(username.length < 2 || username.length > 20){
    res.status(BADREQUEST).send({ error : "Votre identifiant doit contenir entre 2 et 20 caractères", token: "" });
    return;
  }
  if(!username.match(/^[a-z]+$/)){
    res.status(BADREQUEST).send({ error : "Votre identifiant ne doit contenir que des lettres minuscules non accentuées", token: "" });
    return;
  }
  if(user){
    res.status(BADREQUEST).send({ error : "Cet identifiant est déjà associé à un compte", token: "" });
    return;
  }
  bcrypt.hash(password, SALTROUND, async (err, hash) => {
    if(err) res.status(500).send(err.message);
    const { insertedId } = await((await getCol('users')).insertOne({
      username: username,
      password: hash
    }));
    res.status(SUCCESS).send({
      error: null,
      token: makeToken(insertedId)
    });
    log("Inserted ! ", insertedId);
  });
})

app.post('/signin',async (req, res) => {
  let username = req.body.username != undefined? req.body.username : null;
  let password = req.body.password != undefined? req.body.password : null;
  if(password.length < 4 ){
    res.status(BADREQUEST).send({ error : "Le mot de passe doit contenir au moins 4 caractères", token: "" });
    return;
  }
  if(username.length < 2 || username.length > 20){
    res.status(BADREQUEST).send({ error : "Votre identifiant doit contenir entre 2 et 20 caractères", token: "" });
    return;
  }
  if(!username.match(/^[a-z]+$/)){
    res.status(BADREQUEST).send({ error : "Votre identifiant ne doit contenir que des lettres minuscules non accentuées", token: "" });
    return;
  }
  let user = await findUser(username);
  if (user === false) {
    res.status(FORBIDDEN).send({ error : 'Cet identifiant est inconnu', token: "" });
    return;
  }else{
    await bcrypt.compare(password, user.password, function(err, result) {
      if (result === true) {
        log(user._id);
        res.status(SUCCESS).send({
          error: null,
          token: makeToken(user._id),
        });
      }else {
        res.status(FORBIDDEN).send({ error : 'Cet identifiant est inconnu', token: "" });
        return;
      }
    });
  }
});

app.put('/notes', async (req, res) => {
  const token = req.get('x-access-token');
  if(!token) return res.status(401).json('Unauthorize user');
  const decoded = await authenticateToken(token);
  const user = await findUserByid(decoded.id);
  if(!user) return res.status("User not found");
  if(req.body.content != undefined) {
    const note = {
      userId: user._id,
      content: req.body.content
    }
    const col = await getCol('notes');
    const { insertedId } = await col.insertOne(note);
    res.status(SUCCESS).send({
      error: null,
      note: {
        id: insertedId,
        ...note
      }
    });
  }
  res.status(500).send("Internal server error.");
})