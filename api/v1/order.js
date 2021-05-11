const { functionDecorator } = require('../../shared/utils/decorators');
const GliderError = require('../../shared/error');
const {
  HTTP_STATUS: {
    INTERNAL_SERVER_ERROR
  }
} = require('../../shared/constants');
const getOrder = require('../../providers/ekta/orders/get');
const issueContract = require('../../providers/ekta/orders/issueContract');

const order = async req => {

  switch (req.provider) {
    case 'ekta':
      switch (req.method) {
        case 'GET':
          return getOrder(req);
        case 'POST':
          return issueContract(req);
        default:
      }
      break;
    default:
  }

  throw new GliderError(
    'Unknown provider',
    INTERNAL_SERVER_ERROR
  );
};

module.exports = functionDecorator(
  order,
  'v1',
  '/orders/{orderId}',
  [
    'read:orders',
    'write:orders'
  ]
);
