const {
  insertOne,
  findOne,
  updateOne
} = require('../helpers');

// Get order by Id
module.exports.getOrder = orderId => findOne(
  'orders',
  {
    orderId
  }
);

// Save order
module.exports.saveOrder = order => insertOne(
  'orders',
  order
);

// Update order by Id
module.exports.updateOrder = (orderId, order) => updateOne(
  'orders',
  {
    orderId
  },
  order
);
