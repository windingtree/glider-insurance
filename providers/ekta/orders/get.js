const GliderError = require('../../../shared/error');
const {
  HTTP_STATUS: {
    NOT_FOUND
  }
} = require('../../../shared/constants');
const {
  getOrder
} = require('../../../shared/mongo/models/orders');

module.exports = async req => {
  const {
    orderId
  } = req.query;

  // Get the order the database
  const order = await getOrder(orderId);

  if (!order) {
    throw new GliderError(
      'Order not found',
      NOT_FOUND
    );
  }

  // Exclude extra data from the response
  delete order.extraData;

  return order;
};
