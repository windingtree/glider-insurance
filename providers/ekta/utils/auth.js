const {
  getProviderConfig
} = require('../../../shared/config');

module.exports.buildAuth = async () => {
  const {
    auth
  } = getProviderConfig('ekta');

  return {
    auth
  };
};
