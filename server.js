const express = require('express')
const app = express();
app.use(express.json()) 
const MongoClient = require('mongodb').MongoClient;
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE_NAME = 'notes-api';

// BDD
;(async () => {
    console.log(`Connecting to ${DATABASE_NAME} ...`);
    const client = new MongoClient(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
   // collection = client.db(DATABASE_NAME).collection(COLLECTION_NAME);
    console.log(`Successfully connected to ${DATABASE_NAME}`);
    app.listen(PORT, function () {
      console.log("Listening on port " + PORT);
    })
    // await client.close();
  })()

  // Route POST /signup
  app.post('/signup', (req, res) => {

  });

  // Route POST /signin
  app.post('/signin', (req, res) => {

  });
  