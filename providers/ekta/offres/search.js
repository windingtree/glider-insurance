const { v4: uuidv4 } = require('uuid');
const {
  HTTP_METHODS: {
    POST
  }
} = require('../../../shared/constants');
const { request } = require('../../../shared/utils/rest');
const {
  getProviderConfig
} = require('../../../shared/config');

module.exports = async req => {
  const {
    baseUrl
  } = getProviderConfig('ekta');

  const response = await request(
    baseUrl,
    '/travel/calculate',
    POST,
    req.body,
    {
      method: 'body',
      data: req.providerAuth
    }
  );

  return response.map(o => ({
    offerId: uuidv4(),
    ...o
  }))
};
