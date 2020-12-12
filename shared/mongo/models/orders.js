const GliderError = require('../../error');
const {
  HTTP_STATUS: {
    INTERNAL_SERVER_ERROR
  }
} = require('../../constants');
const {
  insertOne,
  findOne
} = require('../helpers');

// Get order by Id
module.exports.getOrder = orderId => findOne(
  'orders',
  {
    orderId
  }
);

// Save order
module.exports.saveOrder = async order => {
  const result = await insertOne(
    'orders',
    order
  );
  if (result.insertedCount !== 1) {
    throw new GliderError(
      'Confirmed offer has not been saved',
      INTERNAL_SERVER_ERROR
    );
  }
}
