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
const {
  getGuarantee
} = require('../utils/simard');
const {
  orgId: ektaOrgId,
  baseUrl
} = getProviderConfig('ekta');

module.exports = async req => {
  const {
    offerId,
    guaranteeId,
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

  // Validate order payment confirmation on the Simard
  const guarantee = await getGuarantee(guaranteeId);
  console.log('GUARANTEE', guarantee);

  // Currency: must match offer currency
  if (guarantee.currency !== offer.currency) {
    throw new GliderError(
      'Invalid Guarantee currency',
      BAD_REQUEST
    );
  }

  // Amount: must be equal or higher (careful with fixed point decimal handling)
  if (guarantee.amount < offer.cost) {
    throw new GliderError(
      'Invalid Guarantee amount',
      BAD_REQUEST
    );
  }

  // creditorOrgId: must be EKTA ORGiD (or Hotel’s ORGiD for multi-tenant setup), otherwise return an HTTP 400 error “”
  if (guarantee.creditorOrgId !== ektaOrgId) {
    throw new GliderError(
      'Guarantee not meant for EKTA Insurance provider organization',
      BAD_REQUEST
    );
  }

  // debtorOrgId: must match the ORGiD of the offer requester, otherwise return an HTTP 400 error “Guarantee not created by offer requestor”
  if (guarantee.debtorOrgId !== req.auth.didResult.id) {
    throw new GliderError(
      'Guarantee not created by offer requestor',
      BAD_REQUEST
    );
  }

  // expiration: must be >= 72h from now, otherwise return an HTTP 400 error “Guarantee expiration is too short”
  if ((new Date().getTime() + (72 * 60 * 60 * 1000)) >= new Date(guarantee.expiration).getTime()) {
    throw new GliderError(
      'Guarantee expiration is too short',
      BAD_REQUEST
    );
  }

  // Build request object
  const requestBody = {
    insurer: offer.tourists[insurer],
    program_id: offer['program_id'],
    // We should repeat all fields from the search request
    ...({
      ...offer.extraData.requestBody,
      'period_from': offer.extraData.requestBody['single_period_from'],
      'period_till': offer.extraData.requestBody['single_period_till'],
      tourists: offer.extraData.requestBody.tourists,
      'payment_link': false
    })
  };

  console.log('Request', JSON.stringify(requestBody, null, 2));

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
  const pdfUrl = `${baseUrl}/travel/download/${response.id}`;
  const order = {
    orderId: uuidv4(),
    contractId: response.id,
    cost: response.cost,
    currency: response.currency,
    issued: false,
    pdfUrl
  };

  // Extended order version with information required for signing the contract
  const orderExtended = {
    ...order,
    pdfUrl,
    extraData: {
      confirmedOfferId,
      requestBody,
      guarantee
    }
  };

  // Save order to the database
  await saveOrder(orderExtended);

  // @todo Agree with the EKTA: payment confirmation
  // @todo Move here contract issuance code from the issueContract.js file

  return order;
};
