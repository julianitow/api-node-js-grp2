const express = require('express')
const app = express();
app.use(express.json()) 
const jwt = require("jsonwebtoken");
const MongoClient = require('mongodb').MongoClient;
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:' + 27017 + '/notes-api' ;
const client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const DATABASE_NAME = 'notes-api';
require('dotenv').config()
var JWT_KEY = process.env.JWT_KEY

app.post('/', (req, res) => {
    res.send("Bienvenue sur notre API");
});

// BDD
  (async function() {
    try {
      await client.connect();
      console.log(`Connecting to ${DATABASE_NAME}`);
    } catch (err) {
       console.log(err.stack);
       }
    })();

  async function getCol(colName) {
    const db = client.db(DATABASE_NAME);
    return db.collection(colName);
  }

  async function findUser(username){
    const col = await getCol('users');
    const user = await col.findOne({ username: username });
    return user == null ? false : user; 
  }

  function makeToken(id){
    return jwt.sign({ id }, JWT_KEY, { expiresIn: Math.floor(Date.now() / 1000) + (60 * 60) * 24})
    
  }

  async function authenticateToken(token){
    try{
      return jwt.verify(token, JWT_KEY);
    }catch(e){
      console.log(e);
    }
  }
   
  // Route POST /signup
  app.post('/signup',async function (req, res, next) {
    //console.log("inscription");
     var user = await findUser(req.body.username);

      if (!req.body.username || !req.body.password) {
         var erreur = "Vous devez fournir un identifiant et un mot de passe";
         var token = null;
       }
    
      else if(req.body.password.length < 4 || req.body.password.length > 10){
        var erreur = "Le mot de passe doit contenir entre 4 et 10 caractères"
        var code = 400
        var token = null;
      }
    
      else if(!req.body.username.match(/^[a-z]+$/)){
          var erreur = "Votre identifiant ne doit contenir que des lettres minuscules non accentuées";
          var code = 400;
          var token = null;
    
      }
      else if(req.body.username.length < 2 || req.body.username.length > 20){
        var erreur = "Votre identifiant doit contenir entre 2 et 20 caractères"
        var code = 400
        var token = null;
      }


      else if(user) {
        var erreur = "Cet identifiant est déjà associé à un compte"
        var code = 400
        var token = null;
      }
    
      else {

        const { insertedId } = await((await getCol('users')).insertOne({
          username: req.body.username,
          password: req.body.password
        }));

        var erreur = null;
        var code = 400;
        var token = makeToken(insertedId);

      }
    
      return res.status(code).json({
        error: erreur,
        token: token,
      });
    
    });
    
  // Route POST /signin
  app.post('/signin',async function(req,res, err){
    //console.log("connexion");
    var user = await findUser(req.body.username);

    if(!user) {
      var erreur = "Cet identifiant est inconnu"
      var code = 403
      var token = null;
    }

    else if(req.body.password != user.password ) {
      var erreur = "Mot de passe incorrect"
      var code = 403
      var token = null;
    }
  
    else {
    var erreur = null;
    var code = 400;
    var token = makeToken(user.id);
    }
 
 return res.status(code).json({
    error: erreur,
    token: token,
  });

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
    const { insertedId } = await col.insertOne(note);
    res.status(SUCCESS).send({
      error: null,
      note: {
        id: insertedId,
        ...note
      }
    });
  } else {
    res.status(500).send("Internal server error.");
  }
})


app.patch('/notes/:id', async (req, res) => {
  const token = req.get('x-access-token');
  if(!token) return res.status(401).json('Unauthorize user');
  const col = await getCol('notes');
  const decoded = await authenticateToken(token);
  const user = await findUserByid(decoded.id);
  const note = await col.findOne({ _id: ObjectID(req.params.id) });
  if (!note) {
    res.status(NOTFOUND).send("Cet identifiant est inconnu");
  }
  if (note.userId.toString() !== user._id.toString()) {
    res.status(FORBIDDEN).send("Accès non autorisé à cette note");
  }
  if(req.body.content != undefined) {
    await col.updateOne(
      { _id: ObjectID(req.params.id) },
      {$set: req.body }
    );
    const _note = await col.findOne({ _id: ObjectID(req.params.id) });
    res.status(SUCCESS).send({
      error: null,
      note: _note,
    });
  } else {
    res.status(500).send("Internal server error.");
  }
  
})




app.get('/notes', async (res, req) => {

  const token = req.headers['x-access-token'] || '';
 const col = await getCol('notes');
 const notes = await col.find();



  if(!token) {
    return res.status(401).json("Unauthorise user");//res.status(401).json('Unauthorize user');
  console.log(token);

  }

  
  const decoded = await authenticateToken(token);
  const user = await findUserByid(decoded.id);

  if(!user){

    return res.status("User not found");

  }

  ©console.log(user);
  
  res.status(200).send("OK");
})



app.listen(3000, function () {
    console.log('Listening on port + ' + PORT);
})
  
  
