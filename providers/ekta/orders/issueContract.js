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
  getDeepValue
} = require('../../../shared/utils/object');
const {
  getProviderConfig
} = require('../../../shared/config');
const {
  getOrder,
  updateOrder
} = require('../../../shared/mongo/models/orders');
const {
  baseUrl
} = getProviderConfig('ekta');

// Issue contract by the order Id
module.exports = async req => {
  const {
    orderId
  } = req.query;

  // Get the order the database
  const order = await getOrder(orderId);

  if (!order) {
    throw new GliderError(
      'Order not found',
      NOT_FOUND
    );
  }

  // Contract from the order should not be issued
  if (order.issued) {
    throw new GliderError(
      'The contract has been emitted already',
      BAD_REQUEST
    );
  }

  // Signing a contract with SMS code
  // @todo Implement signing with SMS code.

  // const code = getDeepValue(order, 'extraData.sms_code');

  // if (!code) {
  //   throw new GliderError(
  //     'The contract signing code not found in the order',
  //     BAD_REQUEST
  //   );
  // }

  // const signingResponse = await request(
  //   baseUrl,
  //   '/travel/sign_sms',
  //   POST,
  //   {
  //     id: order.id,
  //     sms_code: code
  //   },
  //   {
  //     method: 'body',
  //     data: req.providerAuth
  //   }
  // );

  // if (!signingResponse.id || signingResponse.id !== order.id) {
  //   throw new GliderError(
  //     'Signing of the insurance contract has failed',
  //     BAD_REQUEST // @note Is this is right code?
  //   );
  // }

  // Send request for the contract emitting
  const response = await request(
    baseUrl,
    '/travel/emitted',
    POST,
    {
      id: order.id,
      payment_id: orderId
    },
    {
      method: 'body',
      data: req.providerAuth
    }
  );

  if (!response.id || response.id !== order.id) {
    throw new GliderError(
      'Unable to emit an insurance contract',
      BAD_REQUEST // @note Is this is right code?
    );
  }

  const updatedOrder = {
    ...order,
    issued: true,
    issuanceDate: new Date()
  };

  // Save updated order
  await updateOrder(orderId, updatedOrder);

  return updatedOrder;
};
