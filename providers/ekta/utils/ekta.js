const {
  HTTP_METHODS: {
    POST
  }
} = require('../../../shared/constants');
const {
  getProviderConfig
} = require('../../../shared/config');
const { request } = require('../../../shared/utils/rest');
const {
  baseUrl
} = getProviderConfig('ekta');

// Send request to the EKTA API for offers calculation
const calculateOffers = (req, requestBody) => request(
  baseUrl,
  '/travel/calculate',
  POST,
  requestBody,
  {
    method: 'body',
    data: req.providerAuth
  }
);
module.exports.calculateOffers = calculateOffers;
