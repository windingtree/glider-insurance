module.exports.INFURA_URI = process.env.INFURA_URI;
module.exports.DEFAULT_NETWORK = process.env.DEFAULT_NETWORK;
module.exports.SIMARD_URI = process.env.SIMARD_URI;
const PROVIDERS = {
  [process.env.PROVIDER_EKTA_DID]: {
    name: 'ekta',
    orgId: process.env.PROVIDER_EKTA_DID.match(/0x\w{64}/)[0],
    auth: {
      client_id: process.env.PROVIDER_EKTA_API_ID,
      client_pass: process.env.PROVIDER_EKTA_API_PASSWORD
    },
    simardAuth: {
      'Authorization': `Bearer ${process.env.PROVIDER_EKTA_SIMARD_TOKEN}`
    },
    baseUrl: process.env.PROVIDER_EKTA_BASE_URL
  }
};
module.exports.PROVIDERS = PROVIDERS;
module.exports.MONGO_URL = process.env.MONGO_URL;
module.exports.OFFERS_TTL = 1800;

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
