const { v4: uuidv4 } = require('uuid');
const GliderError = require('../../../shared/error');
const {
  HTTP_METHODS: {
    POST
  },
  HTTP_STATUS: {
    NOT_FOUND,
    BAD_REQUEST
  }
} = require('../../../shared/constants');
const { request } = require('../../../shared/utils/rest');
const {
  getProviderConfig
} = require('../../../shared/config');
const {
  getOffer,
  saveConfirmedOffer
} = require('../../../shared/mongo/models/offers');
const {
  saveOrder
} = require('../../../shared/mongo/models/orders');

module.exports = async req => {
  const {
    baseUrl
  } = getProviderConfig('ekta');

  const {
    offerId,
    insurer
  } = req.body;

  // Get the offer the database
  const offer = await getOffer(offerId);

  if (!offer) {
    throw new GliderError(
      'Offer not found or expired',
      NOT_FOUND
    );
  }

  // Build request object
  const requestBody = {
    insurer: offer.tourists[insurer],
    // We should repeat all fields from the search request
    ...({
      ...offer.extraData.requestBody,
      'period_from': offer.extraData.requestBody['single_period_from'],
      'period_till': offer.extraData.requestBody['single_period_till'],
      tourists: offer.extraData.requestBody.tourists,
      'payment_link': false
    })
  };

  // Send request ot the provider
  const response = await request(
    baseUrl,
    '/travel/create',
    POST,
    requestBody,
    {
      method: 'body',
      data: req.providerAuth
    }
  );

  if (!response.success) {
    throw new GliderError(
      'Unable to create an order',
      BAD_REQUEST // @note Is this is right code?
    );
  }

  // Save permanent offer
  const confirmedOfferId = uuidv4();
  await saveConfirmedOffer({
    ...offer,
    offerId: confirmedOfferId
  });

  // Build order object
  const order = {
    orderId: uuidv4(),
    offerId: confirmedOfferId,
    id: response.id,
    number: response.number,
    cost: response.cost,
    currency: response.currency
  };

  // Extended order version with information required for signing the contract
  const orderExtended = {
    ...order,
    extraData: {
      requestBody,
      sms_code: response['sms_code']
    }
  };

  // Save order to the database
  await saveOrder(orderExtended);

  return order;
};
