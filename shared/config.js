module.exports.INFURA_URI = process.env.INFURA_URI;
module.exports.DEFAULT_NETWORK = process.env.DEFAULT_NETWORK;
const PROVIDERS = {
  [process.env.PROVIDER_EKTA_DID]: {
    name: 'ekta',
    auth: {
      client_id: process.env.PROVIDER_EKTA_API_ID,
      client_pass: process.env.PROVIDER_EKTA_API_PASSWORD
    },
    baseUrl: process.env.PROVIDER_EKTA_BASE_URL
  }
};
module.exports.PROVIDERS = PROVIDERS;
module.exports.MONGO_URL = process.env.MONGO_URL;

// Extract config of the provider by the name
module.exports.getProviderConfig = name => Object.entries(PROVIDERS)
  .reduce(
    (a, v) => {
      if (v[1].name === name) {
        a = v[1];
      }
      return a;
    },
    {}
  );
