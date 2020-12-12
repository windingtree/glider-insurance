const { functionDecorator } = require('../../shared/utils/decorators');
const GliderError = require('../../shared/error');
const {
  HTTP_STATUS: {
    NOT_IMPLEMENTED,
    INTERNAL_SERVER_ERROR
  }
} = require('../../shared/constants');
const createOrder = require('../../providers/ekta/orders/create');

const order = async req => {

  switch (req.provider) {
    case 'ekta':
      switch (req.method) {
        case 'POST':
          return createOrder(req);
        case 'PUT':
          // Signing an order
          throw new GliderError(
            'Not Implemented Yet',
            NOT_IMPLEMENTED
          );
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
  '/orders',
  [
    'read:offers',
    'write:orders'
  ]
);
