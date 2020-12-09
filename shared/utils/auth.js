const { JWK, JWT } = require('jose');
const Web3 = require('web3');
const {
  OrgIdResolver,
  httpFetchMethod
} = require('@windingtree/org.id-resolver');
const {
  addresses: orgIdAddresses
} = require('@windingtree/org.id');
const GliderError = require('../error');
const {
  HTTP_STATUS: {
    FORBIDDEN,
    UNAUTHORIZED,
    INTERNAL_SERVER_ERROR
  }
} = require('../constants');
const {
  INFURA_URI,
  DEFAULT_NETWORK,
  PROVIDERS
} = require('../config');
const { toChecksObject } = require('../utils/object');

// ORG.ID resolver configuration
const defaultNetwork = DEFAULT_NETWORK;
const web3 = new Web3(INFURA_URI);
const orgIdResolver = new OrgIdResolver({
  web3,
  orgId: orgIdAddresses[defaultNetwork]
});
orgIdResolver.registerFetchMethod(httpFetchMethod);

// Verify auth token
const verifyJWT = async (type, jwt) => {
  if (type !== 'Bearer') {
    throw new GliderError('Unknown authorization method', 403);
  }

  let decodedToken;

  try {
    decodedToken = JWT.decode(jwt, {
      complete: true
    });
  } catch (error) {
    switch (error.code) {
      case 'ERR_JWT_MALFORMED':
        error.message = 'JWT is malformed';
        error.code = FORBIDDEN;
        break;
      default:
        error.code = INTERNAL_SERVER_ERROR;
    }

    throw new GliderError(error.message, error.code);
  }

  // Extract token content
  const { payload: { exp, aud, iss, sub } } = decodedToken;

  // Parse subject
  const subject = sub.match(/^\[[\w"].*\]$/g)
    ? JSON.parse(sub)
    : sub.split(',');

  // Issuer should be defined
  if (!iss || iss === '') {
    throw new GliderError(
      'JWT is missing issuing ORGiD',
      FORBIDDEN
    );
  }

  // Extract DID of the issuer
  const isIssuerWellFormed = iss.match(/(?<did>did:orgid:0x\w{64})(?:#{1})?(?<fragment>\w+)?/);

  if (!isIssuerWellFormed) {
    throw new GliderError(
      'The issuer of the JWT not well-formed',
      FORBIDDEN
    );
  }
  const { did, fragment } = isIssuerWellFormed.groups;

  // Resolve DID
  const didResult = await orgIdResolver.resolve(did);
  const checks = toChecksObject(didResult.checks);

  // didDocument should be resolved
  if (!checks.DID_DOCUMENT.passed) {
    throw new GliderError(
      checks.DID_DOCUMENT.errors.join('; '),
      FORBIDDEN
    );
  }

  // Organization should not be disabled
  if (!didResult.organization.isActive) {
    throw new GliderError(
      `Organization: ${didResult.organization.orgId} is disabled`,
      FORBIDDEN
    );
  }

  if (fragment) {
    // Validate signature using publicKey

    let publicKey = didResult.didDocument.publicKey.filter(
      p => p.id.match(RegExp(`#${fragment}$`, 'g'))
    )[0];

    if (!publicKey) {
      throw new GliderError(
        'Public key definition not found in the DID document',
        FORBIDDEN
      );
    }

    let alg;

    switch (publicKey.type) {
      case 'ES256K':
      case 'secp256k1':
        alg = 'ES256K';
        break;
      default:
        throw new GliderError(
          `'${publicKey.type}' signature not supported yet`,
          FORBIDDEN
        );
    }

    if (!publicKey.publicKeyPem.match(RegExp('PUBLIC KEY', 'gi'))) {
      publicKey.publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKey.publicKeyPem}\n-----END PUBLIC KEY-----`;
    }

    const pubKey = JWK.asKey(
      publicKey.publicKeyPem,
      {
        alg,
        use: 'sig'
      }
    );

    try {
      JWT.verify(
        jwt,
        pubKey,
        {
          typ: 'JWT',
          audience: Object.keys(PROVIDERS), // List of DIDs
          clockTolerance: '1 min'
        }
      );
    } catch (error) {

      switch (error.code) {
        case 'ERR_JWT_EXPIRED':
          error.message = 'JWT is expired';
          break;
        case 'ERR_JWT_CLAIM_INVALID':
          if (error.claim === 'aud') {
            error.message = 'JWT recipient is not an insurance provider';
          }
          break;
        case 'ERR_JWS_VERIFICATION_FAILED':
          error.message = 'JWT signature verification failed';
          break;
        default:
      }

      throw new GliderError(error.message, FORBIDDEN);
    }

  } else {
    throw new GliderError(
      'Signature verification method not found',
      FORBIDDEN
    );
  }

  return {
    aud,
    iss,
    exp,
    sub: subject,
    didResult
  }
};

// "orgid_auth" authentication and authorization method
module.exports.isAuthorized = async (req, scope) => {
  const headers= req.headers;

  if (!headers.authorization) {
    throw new GliderError(
      'Authorization missing',
      FORBIDDEN
    );
  }

  const [ authType, jwt ] = headers.authorization.split(' ');
  req.auth = await verifyJWT(authType, jwt);

  // Set a type of provider for the request
  req.provider = PROVIDERS[req.auth.aud]
    ? PROVIDERS[req.auth.aud].name
    : undefined;

  if (!req.provider) {
    throw new GliderError(
      'Unknown insurance provider',
      FORBIDDEN
    );
  }

  // Checking the requester ability execute the function in its scope
  if (req.auth.sub.filter(s => scope.includes(s)).length === 0) {
    throw new GliderError(
      `Not authorized to make requests in the scope: ${JSON.stringify(scope)}`,
      UNAUTHORIZED
    );
  }
};

// Creates a JWT signed by the provided private key
module.exports.createToken = (
  privPem,
  issuer,
  fragment,
  audience,
  subject,
  expiresIn
) => {
  const priv = JWK.asKey(
    privPem,
    {
      alg: 'ES256K',
      use: 'sig'
    }
  );

  return JWT.sign(
    {},
    priv,
    {
      audience,
      ...(issuer ? { issuer: `${issuer}${fragment ? '#' + fragment : ''}` } : {}),
      expiresIn,
      subject,
      kid: false,
      header: { typ: 'JWT' }
    }
  );
}
