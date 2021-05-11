# Payment guarantee verification

## Simard Pay authentication

### Prerequisites

- For a JWT generation is used a cryptography library `jose` of version `2.0.5`. Please use this version with the code examples mentioned in this guide.
- For ORGiD resolution have to be used `@windingtree/org.id-resolver` utility.
- `@windingtree/org.id-resolver` requires a web3 provider connection link that can be obtained at [https://infura.io](https://infura.io) for free



### Requirements

To be authenticated by the Simard Pay should be fulfilled following requirements.

- ORGiD registered, valid and active
- Public key must be  published in the ORG.JSON
- Authorization JWT is signed by the proper private key
  - Issuer (iss) of the JWT must to be an organization DID
  - Audience (aud) of the JWT must be a Simard Pay DID
  - JWT must be included into every request headers in a Bearer format

### JWT generation

```javascript
const { JWK, JWT } = require('jose');

const createToken = (
  privPemAlgorithm,
  privPem,
  issuer,
  fragment,
  audience,
  expiresIn
) => {
  // Read the key
  const priv = JWK.asKey(
    privPem,
    {
      alg: privPemAlgorithm,
      use: 'sig'
    }
  );

  // Create and sign an auth JWT
  return JWT.sign(
    {
      scope: ''
    },
    priv,
    {
      audience,
      ...(
        issuer
          ? { issuer: `${issuer}${fragment ? '#' + fragment : ''}` }
          : {}
      ),
      expiresIn,
      kid: false,
      header: { typ: 'JWT' }
    }
  );
}

const keyAlgorithm = 'ES256K'; // As published in the ORG.JSON
const privPem = '-----BEGIN EC PRIVATE KEY-----\nMHQCAQEE...g1ZaogiA==\n-----END EC PRIVATE KEY-----';
const providerDid = 'did:orgid:0x253b2241c8ab7c4af7cf998feb0861cfa277abf011db95bd37a3712dfb57aba6';
const providerKeyId = 'api'; // As published in the ORG.JSON
const simardPayDid = 'did:orgid:0x56e34fe286de62c4d15d536cef2d171f0cd380e38d77d33fd4a4f0c1257b5f9f'; // staging, for production have to use `did:orgid:0xb5cd9c2be7774d1729e21d6534f9c0a0e9a40bd6c7259896cf55db9962ced5b4`
const expiration = '1 day';

const jwt = createToken(
  keyAlgorithm,
  privPem,
  providerDid,
  providerKeyId,
  simardPayDid,
  expiration
);

console.log(jwt);
// > eyJ0eXAiOiJ ... 5rq0rmMXRcEm1g41A
```

### Prepare request headers

```javascript
const jwt = 'eyJ0eXAiOiJ ... 5rq0rmMXRcEm1g41A'; // stored in the application process environment as usual
const requestHeaders = {
  'Authorization': `Bearer ${jwt}`
};
```

## ORGiD resolution

```javascript
const assert = require('assert');
const Web3 = require('web3');
const {
  OrgIdResolver,
  httpFetchMethod
} = require('@windingtree/org.id-resolver');
const web3 = new Web3('<HTTP_INFURA_PROVIDER_URI>'); // Can be obtained here, for free: https://infura.io/
const orgIdResolver = new OrgIdResolver({
  web3,
  orgId: orgIdAddresses['ropsten'] // staging version, for production have to use `main`
});
orgIdResolver.registerFetchMethod(httpFetchMethod);

const orgIdToVerify = `did:orgid:0xd28ed661a8619301ed6cb7048142c1a356c662bb96ba9d1c0b4c88f135363d26`;
orgIdResolver
  .resolve(orgIdToVerify)
  .then(result => {
    console.log(result.didDocument);
    assert.equal(result.didDocument.id, orgIdToVerify);
    assert(result.didResult.organization.isActive);

    const didDocCheck = result.didResult.checks.filter(c => c.type === 'DID_DOCUMENT')[0];
    assert(didDocCheck && didDocCheck.passed)
  })
  .catch(console.error);
```

### Validation of the resolution result

- Resolution must not fail
- Resolved DID (`result.didDocument.id`) must be equal to query
- Resolved organization (`result.didResult.organization.isActive`) must be active
- DID document verification check must be passed

## Payment guarantee verification

### Fetching of the guarantee

```javascript
const axios = require('axios');
const jwt = require('path/to/jwt'); // get auth token from file or from the environment

// Request utility
const fetchGuarantee = async (guaranteeId) => {
  const guaranteeApiPath = `/balances/guarantees/${guaranteeId}`;
  const url = `https://staging.api.simard.io/api/v1${guaranteeApiPath}`; // staging base path
  const timeout = 10000;

  try {
    // Connection timeout handler
    const cancelTokenSource = axios.CancelToken.source();
    let connectionTimeout = setTimeout(
      () => cancelTokenSource
        .cancel(
          `Cannot connect to the source: ${baseURL}${apiPath}`
        ),
      timeout
    );

    // Send request
    const response = await axios({
      url,
      'GET',
      timeout,
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip,deflate',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Authorization': `Bearer ${jwt}`
      },
      cancelToken: cancelTokenSource.token
    });

    clearTimeout(connectionTimeout);

    return response.data;
  } catch (error) {

    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);

      // Simard errors
      else if (error.response.data && error.response.data.message) {
        error.message = error.response.data.message;
      }
    } else if (error.request) {
      // The request was made but no response was received
      // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
      // http.ClientRequest in node.js
      console.log(error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log('Error', error.message);
    }

    throw new Error(error.message);
  }
};

const guaranteeId = '3da593bf-f745-4e9c-ada0-6e3012bc176c';

fetchGuarantee(guaranteeId)
  .then(result => {
    console.log(result);
  })
  .catch(console.error);

// {
//   amount: '6.84',
//   creditorOrgId: '0x253b2241c8ab7c4af7cf998feb0861cfa277abf011db95bd37a3712dfb57aba6',
//   currency: 'EUR',
//   debtorOrgId: '0xd28ed661a8619301ed6cb7048142c1a356c662bb96ba9d1c0b4c88f135363d26',
//   expiration: '2021-05-14T22:25:57.814000Z'
// }
```

### Guarantee validation

- `amount` must be equal to an order (contract) amount
- `currency` must be equal to an order (contract) currency
- `creditorOrgId` must be a provider DID
- `debtorOrgId` must be a verified ORGiD (see **ORGiD resolution** chapter above)
- `expiration` date must not be expired
