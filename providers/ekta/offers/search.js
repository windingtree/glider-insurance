const { v4: uuidv4 } = require('uuid');
const GliderError = require('../../../shared/error');
const {
  HTTP_METHODS: {
    POST
  },
  HTTP_STATUS: {
    NOT_FOUND
  }
} = require('../../../shared/constants');
const { request } = require('../../../shared/utils/rest');
const {
  getProviderConfig
} = require('../../../shared/config');
const {
  saveOffers,
  expirationTime
} = require('../../../shared/mongo/models/offers');

module.exports = async req => {
  const {
    baseUrl
  } = getProviderConfig('ekta');

  // Tourists Ids only
  let tourists = {};

  // Build request object
  const requestBody = {
    ...req.body,
    tourists: req.body.tourists.map(
      t => {
        const {
          id,
          ...restObj
        } = t;
        tourists[id] = restObj;
        return restObj;
      }
    )
  };

  // Send request to the provider API
  const response = await request(
    baseUrl,
    '/travel/calculate',
    POST,
    requestBody,
    {
      method: 'body',
      data: req.providerAuth
    }
  );

  if (response.length > 0) {
    const [offers, fullOffers] = response.reduce(
      (a, o) => {
        const offerId = uuidv4();
        const expiration = expirationTime().toISOString();
        return [
          // Response collection
          [
            ...a[0],
            {
              offerId,
              ...o,
              tourists: Object.keys(tourists),
              expiration
            }
          ],
          // Extended database version
          [
            ...a[1],
            {
              offerId,
              ...o,
              tourists,
              expiration,
              extraData: {
                requestBody
              }
            }
          ]
        ];
      },
      [[], []]
    );

    // Save offers to database
    await saveOffers(fullOffers);

    return {
      offers
    };
  }

  throw new GliderError(
    'Offers not found',
    NOT_FOUND
  );
};
