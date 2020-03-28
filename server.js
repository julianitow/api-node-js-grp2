const express = require('express')
const app = express();
app.use(express.json()) 
const jwt = require("jsonwebtoken");
const MongoClient = require('mongodb').MongoClient;
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:' + 27017 + '/notes-api' ;
const client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const DATABASE_NAME = 'notes-api';
const COLLECTION_NAME = "users";
require('dotenv').config()
var privateKey = process.env.JWT_KEY

app.post('/', (req, res) => {
    res.send("Bienvenue sur notre API");
});
 
 (async () => {
   await client.connect();
   console.log(`Connecting to ${DATABASE_NAME}`);

   const collection = client.db(DATABASE_NAME).collection(COLLECTION_NAME);
   const users = await collection.find({}).toArray();
   console.log('users:', users) 
   app.listen(PORT, function () {
    console.log("Listening on port " + PORT);
  })
  // await client.close();
  })();

  // Route POST /signup

  app.post('/signup',function(req, res, next) {
    // console.log("inscription");
    var regex = /azertyuiopqsdfghjklmwxcvbn/;
      if (!req.body.username || !req.body.password) {
         var erreur = "Vous devez fournir un identifiant et un mot de passe";
         var token = null;
       }
    
      else if(req.body.password.length < 4 || req.body.password.length > 10){
        var erreur = "Le mot de passe doit contenir entre 4 et 10 caractères"
        var code = 400
        var token = null;
      }
    
      else if(!username.match(/^[a-z]+$/)){
          var erreur = "Votre identifiant ne doit contenir que des lettres minuscules non accentuées";
          var code = 400;
          var token = null;
    
      }
      else if(req.body.username.length < 2 || req.body.username.length > 20){
        var erreur = "Votre identifiant doit contenir entre 2 et 20 caractères"
        var code = 400
        var token = null;
      }
    
      else {
        var erreur = null;
        var code = 400;
        var token = jwt.sign({
          exp: Math.floor(Date.now() / 1000) + (60 * 60) * 24,
          username: req.body
        },privateKey);
      }
    
      return res.status(code).json({
        error: erreur,
        token: token,
      });
    
    });
    
  // Route POST /signin
  app.post('/signin',function(req,res, err){
    console.log("connexion");
  });
  
