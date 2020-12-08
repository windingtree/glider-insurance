const { v4: uuidv4 } = require('uuid');
const { functionDecorator } = require('../../../shared/utils/decorators');
// const GliderError = require('../../../shared/error');

const search = async () => {

  return {
    offers: [
      {
        id: uuidv4()
      }
    ]
  };
};

module.exports = functionDecorator(
  search,
  'v1',
  '/offers/search',
  [
    'read:offers'
  ]
);
