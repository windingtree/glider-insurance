const { functionDecorator } = require('../../../shared/utils/decorators');
const GliderError = require('../../../shared/error');
const {
  HTTP_STATUS: {
    INTERNAL_SERVER_ERROR
  }
} = require('../../../shared/constants');
const searchOffers = require('../../../providers/ekta/offers/search');

const search = async req => {

  switch (req.provider) {
    case 'ekta':
      switch (req.method) {
        case 'POST':
          return searchOffers(req);
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
  search,
  'v1',
  '/offers/search',
  [
    'read:offers',
    'write:offers'
  ]
);
