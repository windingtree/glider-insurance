const {
  createExpireIndex,
  insertMany
} = require('../helpers');

// Create expiration index for offers
createExpireIndex('offers', 'offers_expiration', 'updatedAt', 1800)
  .catch(console.error);

// Add offers to database
module.exports.saveOffers = offers => insertMany(
  'offers',
  offers
);
