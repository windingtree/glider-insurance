const GliderError = require('../../../shared/error');
const {
  HTTP_STATUS: {
    INTERNAL_SERVER_ERROR,
    BAD_GATEWAY
  },
  HTTP_METHODS: {
    POST
  }
} = require('../../../shared/constants');
const {
  getProviderConfig
} = require('../../../shared/config');
const {
  request
} = require('../../../shared/utils/rest');

module.exports.buildAuth = async () => {
  const {
    token,
    baseUrl
  } = getProviderConfig('ekta');

  if (!token) {
    throw new GliderError(
      'Auth token not configured',
      INTERNAL_SERVER_ERROR
    );
  }

  // // Update the token
  // const response = await request(
  //   baseUrl,
  //   '/auth/refreshToken',
  //   POST,
  //   {
  //     auth: {
  //       token
  //     }
  //   }
  // );

  // if (!response.success) {
  //   throw new GliderError(
  //     'Auth token update failed',
  //     BAD_GATEWAY // @todo Is this code is acceptable?
  //   );
  // }

  return {
    auth: {
      token
    }
  };
};
