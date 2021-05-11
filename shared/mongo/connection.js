const { MongoClient } = require('mongodb');
const {
  MONGO_URL,
  MONGO_DB_NAME
} = require('../config');

// Cached connection
let database;
let connectionPromise;

module.exports = async () => {
  // Return cached connection if exists
  if (database) {
    return database;
  }

  // Prevent creating of multiple connections
  if (!connectionPromise) {
    connectionPromise = MongoClient.connect(
      MONGO_URL,
      {
        bufferMaxEntries: 0,
        useNewUrlParser: true,
        useUnifiedTopology: true
      }
    );
  }

  const client = await connectionPromise;
  database = client.db(MONGO_DB_NAME);

  // Subscribe Database client events
  client.on('error', console.error);
  client.on('parseError', console.error);
  client.on('close', () => {
    connectionPromise = undefined;
    database = undefined;
  });

  return database;
};
