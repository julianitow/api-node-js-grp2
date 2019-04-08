const assert = require('assert');

function initApiEndpoints({ attachTo: app, db }) {
  assert('get' in (app || {}), 'attachTo parameter should be an express Router');
  assert('collection' in (db || {}), 'db parameter should be a MongoDB connection');

  app.get('/', (req, res) => {
    res.send('Hello World!');
  });

  // TODO: add your API endpoints here
}

module.exports = initApiEndpoints;
