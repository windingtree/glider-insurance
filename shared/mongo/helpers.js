const GliderError = require('../error');
const {
  HTTP_STATUS: {
    INTERNAL_SERVER_ERROR
  }
} = require('../constants');
const connection = require('./connection');

// Create expiration index
const createExpireIndex = async (collection, indexName, indexFieldName, ttl) => {
  const db = await connection();
  return db.collection(collection)
    .createIndex(
      {
        [indexFieldName]: 1
      },
      {
        name: indexName,
        background: true,
        expireAfterSeconds: ttl
      }
    );
};
module.exports.createExpireIndex = createExpireIndex;

// Drop index by its name
const dropIndex = async (collection, indexName) => {
  const db = await connection();
  return db.collection(collection)
    .dropIndex(indexName);
};
module.exports.dropIndex = dropIndex;

// Search thru collection
const find = async (collection, query, options) => {
  const db = await connection();
  return db.collection(collection)
    .find(query, options);
};
module.exports.find = find;

// Get single document by query
const findOne = async (collection, query, options) => {
  const db = await connection();
  return db.collection(collection)
    .findOne(query, options);
};
module.exports.findOne = findOne;

// Insert one document
const insertOne = async (collection, document, options) => {
  const db = await connection();
  const result = await db.collection(collection)
    .insertOne(
      {
        ...document,
        updatedAt: new Date()
      },
      options
    );
  if (result.insertedCount !== 1) {
    throw new GliderError(
      'Document has not been saved',
      INTERNAL_SERVER_ERROR
    );
  }
  return result;
};
module.exports.insertOne = insertOne;

// Insert many documents
const insertMany = async (collection, documents, options) => {
  const db = await connection();
  const result = await db.collection(collection)
    .insertMany(
      documents.map(d => ({
        ...d,
        updatedAt: new Date()
      })),
      {
        ordered: true,
        ...(options
          ? options
          : {})
      }
    );
  if (result.insertedCount !== documents.length) {
    // @note Is this is right behaviour?
    throw new GliderError(
      'Documents has not been saved completely',
      INTERNAL_SERVER_ERROR
    );
  }
  return result;
};
module.exports.insertMany = insertMany;

// Update document
const updateOne = async (collection, filter, document, options) => {
  const db = await connection();
  const result = await db.collection(collection)
    .updateOne(
      filter,
      {
        $set: {
          ...document,
          updatedAt: new Date()
        }
      },
      options
    );
  if (result.matchedCount !== 1 || result.modifiedCount !== 1) {
    throw new GliderError(
      'Document has not been updated',
      INTERNAL_SERVER_ERROR
    );
  }
  return result;
};
module.exports.updateOne = updateOne;
