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
module.exports.saveOffers = offers => insertMany(
  'offers',
  offers
);

// Get offer by Id
module.exports.getOffer = offerId => findOne(
  'offers',
  {
    offerId
  }
);

// Save confirmed offer
module.exports.saveConfirmedOffer = offer => insertOne(
  'confirmed_offers',
  offer
);

// Get offer from the confirmed_offers collection
module.exports.getConfirmedOffer = offerId => findOne(
  'confirmed_offers',
  {
    offerId
  }
);
