const {
  getProviderConfig
} = require('../../../shared/config');

// Returns in-body EKTA auth configuration
module.exports.buildAuth = () => {
  const {
    auth
  } = getProviderConfig('ekta');

  return {
    auth
  };
};

// Return headers config for the Simard auth
module.exports.buildSimardAuth = () => {
  const {
    simardAuth
  } = getProviderConfig('ekta');

  return simardAuth;
};
