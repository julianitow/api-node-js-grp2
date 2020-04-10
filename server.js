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

const SALTROUND = 12;

const JWT_KEY = process.env.JWT_KEY || 'secret';
const JWT_EXPIRY = 24 * 60 * 60;

app.use(express.json());

const log = console.log;

async function getCol(colName) {
  return db.collection(colName);
}

async function findUser(username) {
  const col = await getCol('users');
  const user = await col.findOne({ username: username });
  return user == null ? false : user;
}

async function findUserByid(id) {
  const col = await getCol('users');
  return col.findOne({ _id: ObjectID(id) });
}

function makeToken(id) {
  return jwt.sign({ id }, JWT_KEY, { expiresIn: JWT_EXPIRY });
}

async function authenticateToken(token) {
  try {
    return jwt.verify(token, JWT_KEY);
  } catch (e) {
    return;
  }
}

(async function () {
  try {
    await client.connect();
    log('Connected to ' + dbName);
  } catch (err) { log(err.stack); }
})();


app.get('/', function (req, res) {
  res.send('hello world');
});

app.post('/signup', async (req, res) => {
  const username = req.body.username !== undefined ? req.body.username : null;
  const password = req.body.password !== undefined ? req.body.password : null;
  const user = await findUser(username);
  if (!password || password.length < 4) {
    res.status(BADREQUEST).send({ error: 'Le mot de passe doit contenir au moins 4 caractères' });
    return;
  }
  if (!username || username.length < 2 || username.length > 20) {
    res.status(BADREQUEST).send({ error: 'Votre identifiant doit contenir entre 2 et 20 caractères' });
    return;
  }
  if (!username.match(/^[a-z]+$/)) {
    res.status(BADREQUEST).send({ error: 'Votre identifiant ne doit contenir que des lettres minuscules non accentuées' });
    return;
  }
  if (user) {
    res.status(BADREQUEST).send({ error: 'Cet identifiant est déjà associé à un compte' });
    return;
  }
  bcrypt.hash(password, SALTROUND, async (err, hash) => {
    if (err) res.status(500).send(err.message);
    const { insertedId } = await ((await getCol('users')).insertOne({
      username: username,
      password: hash,
    }));
    res.status(SUCCESS).send({
      error: null,
      token: makeToken(insertedId),
    });
  });
});

app.post('/signin', async (req, res) => {
  const username = req.body.username !== undefined ? req.body.username : null;
  const password = req.body.password !== undefined ? req.body.password : null;
  if (!password || password.length < 4) {
    res.status(BADREQUEST).send({ error: 'Le mot de passe doit contenir au moins 4 caractères' });
    return;
  }
  if (!username || username.length < 2 || username.length > 20) {
    res.status(BADREQUEST).send({ error: 'Votre identifiant doit contenir entre 2 et 20 caractères' });
    return;
  }
  if (!username.match(/^[a-z]+$/)) {
    res.status(BADREQUEST).send({ error: 'Votre identifiant ne doit contenir que des lettres minuscules non accentuées' });
    return;
  }
  const user = await findUser(username);
  if (user === false) {
    res.status(FORBIDDEN).send({ error: 'Cet identifiant est inconnu' });
    return;
  } else {
    await bcrypt.compare(password, user.password, function (err, result) {
      if (result === true) {
        res.status(SUCCESS).send({
          error: null,
          token: makeToken(user._id),
        });
      } else {
        res.status(FORBIDDEN).send({ error: 'Cet identifiant est inconnu' });
        return;
      }
    });
  }
});

app.get('/notes', async (req, res) => {
  const token = req.get('x-access-token');
  if (!token) return res.status(401).json('Unauthorize user');
  const col = await getCol('notes');
  const decoded = await authenticateToken(token);
  if (!decoded) {
    res.status(UNAUTHORIZED).send({ error: 'Utilisateur non connecté' });
    return;
  }
  const user = await findUserByid(decoded.id);
  const note = await col.find({ userId: user._id }).sort({ createdAt: -1 }).toArray();
  res.status(SUCCESS).send({
    error: null,
    notes: note,
  });
});

app.put('/notes', async (req, res) => {
  const token = req.get('x-access-token');
  if (!token) return res.status(401).json('Unauthorize user');
  const decoded = await authenticateToken(token);
  if (!decoded) {
    res.status(UNAUTHORIZED).send({ error: 'Utilisateur non connecté' });
    return;
  }
  const user = await findUserByid(decoded.id);
  if (!user) return res.status('User not found');
  if (req.body.content !== undefined) {
    const note = {
      userId: user._id,
      content: req.body.content,
    };
    const col = await getCol('notes');
    const { insertedId } = await col.insertOne(note);
    res.status(SUCCESS).send({
      error: null,
      note: {
        id: insertedId,
        ...note,
      },
    });
  } else {
    res.status(500).send('Internal server error.');
  }
});

app.patch('/notes/:id', async (req, res) => {
  const token = req.get('x-access-token');
  if (!token) return res.status(401).json('Unauthorize user');
  const col = await getCol('notes');
  const decoded = await authenticateToken(token);
  if (!decoded) {
    res.status(UNAUTHORIZED).send({ error: 'Utilisateur non connecté' });
    return;
  }
  const user = await findUserByid(decoded.id);
  const note = await col.findOne({ _id: ObjectID(req.params.id) });
  if (!note) {
    res.status(NOTFOUND).send({ error: 'Cet identifiant est inconnu' });
    return;
  }
  if (note.userId.toString() !== user._id.toString()) {
    res.status(FORBIDDEN).send({ error: 'Accès non autorisé à cette note' });
    return;
  }
  if (req.body.content !== undefined) {
    await col.updateOne(
      { _id: ObjectID(req.params.id) },
      { $set: req.body },
    );
    const _note = await col.findOne({ _id: ObjectID(req.params.id) });
    res.status(SUCCESS).send({
      error: null,
      note: _note,
    });
  } else {
    res.status(500).send('Internal server error.');
  }
});

app.delete('/notes/:id', async (req, res) => {
  const token = req.get('x-access-token');
  if (!token) return res.status(401).json('Unauthorize user');
  const col = await getCol('notes');
  const decoded = await authenticateToken(token);
  if (!decoded) {
    res.status(UNAUTHORIZED).send({ error: 'Utilisateur non connecté' });
    return;
  }
  const user = await findUserByid(decoded.id);

  const id = { _id: ObjectID(req.params.id) };
  const note = await col.findOne(id);
  if (!note) {
    res.status(NOTFOUND).send({ error: 'Cet identifiant est inconnu' });
    return;
  }
  if (note.userId.toString() !== user._id.toString()) {
    res.status(FORBIDDEN).send({ error: 'Accès non autorisé à cette note' });
    return;
  }
  await col.deleteOne(id);
  res.status(SUCCESS).send({ error: null });
});
