# Note Keeper Groupe 2

This is the reference of the Node.js project: [API de gestion de notes personnelles](https://adrienjoly.com/cours-nodejs/05-proj/).

It is a HTTP API that enables JWT-authenticated users to manage notes.

This repository can be run:

- locally, with a MongoDB 4 database;
- or in production, given that the required environment variables were set.

## Prerequisites

- [Node.js](https://nodejs.org)
- [MongoDB 4](https://www.mongodb.com/download-center/community)
- [Brew](https://brew.sh/index_fr)

## Usage

To start the database and back-end locally, and make it available on port 3000:

```
$ brew services start mongodb-community 	#only for MacOS
```

Press Ctrl-C to stop both the database and back-end.

## Run tests

```
$ npm install  # to install the project's npm dependencies
$ npm test     # to run tests using a in-memory database
```

## Run Server Localy

```
$ npm install  	# to install the project's npm dependencies
$ npm start     # to run the server localy
```

## Environment variables

- `JWT_KEY` (default: `secret`)
- `MONGODB_URI` (default: `mongodb://localhost:27017`)

## References

- Exercise goals and instructions: [API de gestion de notes personnelles](