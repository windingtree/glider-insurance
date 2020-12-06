const { JWK, JWT } = require('jose');
const Web3 = require('web3');
const ethers = require('ethers');
const {
  OrgIdResolver,
  httpFetchMethod
} = require('@windingtree/org.id-resolver');
const {
  addresses: orgIdAddresses
} = require('@windingtree/org.id');
const GliderError = require('../error');
const {
  zeroAddress,
  HTTP_STATUS: {
    FORBIDDEN,
    UNAUTHORIZED,
    INTERNAL_SERVER_ERROR
  }
} = require('../constants');
const {
  INFURA_URI,
  DEFAULT_NETWORK,
  PROVIDERS_DIDS
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

  // Issuer should be defined
  if (!iss || iss === '') {
    throw new GliderError('JWT is missing issuing ORG.ID', FORBIDDEN);
  }

  // Extract DID of the issuer
  const { did, fragment } = iss.match(/(?<did>did:orgid:0x\w{64})(?:#{1})?(?<fragment>\w+)?/).groups;

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

  if (!fragment) {
    // Validate signature (ethereum) of the organization owner or director

    const lastPeriod = jwt.lastIndexOf('.');
    const jwtMessage = jwt.substring(0, lastPeriod);
    let rawSign = decodedToken.signature
      .toString()
      .replace('-', '+')
      .replace('_', '/');

    const signatureB16 = Buffer
      .from(
        rawSign,
        'base64'
      )
      .toString('hex');

    const hashedMessage = ethers.utils.hashMessage(jwtMessage);
    const signingAddress = ethers.utils.recoverAddress(hashedMessage, `0x${signatureB16}`);

    // Signer address should be an owner address or director address
    // and director have to be confirmed
    if (![
      didResult.organization.owner,
      ...(didResult.organization.director !== zeroAddress
          && didResult.organization.isDirectorshipAccepted
        ? [didResult.organization.director]
        : [])
    ].includes(signingAddress)) {
      throw new GliderError('JWT Token is signed by unknown key', FORBIDDEN);
    }

  } else if (fragment && didResult.didDocument.publicKey) {
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
          audience: PROVIDERS_DIDS
        }
      );
    } catch (error) {

      switch (error.code) {
        case 'ERR_JWT_EXPIRED':
          error.message = 'JWT is expired';
          break;
        case 'ERR_JWT_CLAIM_INVALID':
          if (error.claim === 'aud') {
            error.message = 'JWT recipient is not Glider';
          }
          // Raised only in case of Admin
          else if (error.claim === 'iss') {
            error.message = 'JWT must be created by a Glider authorized agent';
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
      403
    );
  }

  return {
    aud,
    iss,
    exp,
    sub,
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
  req.verificationResult = await verifyJWT(authType, jwt);

  // Checking the requester ability execute the function in its scope
  if (req.verificationResult.sub.filter(s => scope.includes(s)).length === 0) {
    throw new GliderError(
      'Authorization missing',
      UNAUTHORIZED
    );
  }
};
