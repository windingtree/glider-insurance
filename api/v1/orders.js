const { functionDecorator } = require('../../shared/utils/decorators');
const GliderError = require('../../shared/error');
const {
  HTTP_STATUS: {
    INTERNAL_SERVER_ERROR
  }
} = require('../../shared/constants');
const createOrder = require('../../providers/ekta/orders/create');
const emitContract = require('../../providers/ekta/orders/emitContract');

const order = async req => {

  switch (req.provider) {
    case 'ekta':
      switch (req.method) {
        case 'POST':
          return createOrder(req);
        case 'PUT':
          return emitContract(req);
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
    'read:orders',
    'write:orders'
  ]
);
