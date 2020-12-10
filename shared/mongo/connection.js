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
        bufferCommands: false,
        bufferMaxEntries: 0,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true
      }
    );
  }

  const client = await connectionPromise;
  database = client.db(MONGO_DB_NAME);

  // Subscribe Database events
  database.on('error', console.error);
  database.on('parseError', console.error);
  database.on('close', () => {
    connectionPromise = undefined;
    database = undefined;
  });

  return database;
};
