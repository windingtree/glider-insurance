const GliderError = require('../../error');
const {
  HTTP_STATUS: {
    INTERNAL_SERVER_ERROR
  }
} = require('../../constants');
const {
  createExpireIndex,
  insertOne,
  insertMany,
  findOne
} = require('../helpers');
const { OFFERS_TTL } = require('../../config');

// Create expiration index for offers
createExpireIndex('offers', 'offers_expiration', 'updatedAt', OFFERS_TTL)
  .catch(console.error);


// Create expiration time
module.exports.expirationTime = () => new Date((OFFERS_TTL * 1000) + Date.now() - 1);

// Add offers to database
module.exports.saveOffers = async offers => {
  const result = await insertMany(
    'offers',
    offers
  );
  if (result.insertedCount !== offers.length) {
    throw new GliderError(
      'Offer has not been saved',
      INTERNAL_SERVER_ERROR
    );
  }
};

// Get offer by Id
module.exports.getOffer = offerId => findOne(
  'offers',
  {
    offerId
  }
);

// Save confirmed offer
module.exports.saveConfirmedOffer = async offer => {
  const result = await insertOne(
    'confirmed_offers',
    offer
  );
  if (result.insertedCount !== 1) {
    throw new GliderError(
      'Confirmed offer has not been saved',
      INTERNAL_SERVER_ERROR
    );
  }
};

// Get offer from the confirmed_offers collection
module.exports.getConfirmedOffer = offerId => findOne(
  'confirmed_offers',
  {
    offerId
  }
);
