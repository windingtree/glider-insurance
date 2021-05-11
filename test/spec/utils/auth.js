const { JWK, JWT } = require('jose');
const {
  entityKeyPriv,
  entityKeyPub,
  entityOrgId,
  entityKeyFragment,
  ektaOrgId
} = require('../../config');
const { createToken } = require('../../../shared/utils/auth');
require('chai').should();

describe('Authentication and Authorization Utilities', () => {

  describe('#createToken', () => {
    const scopes = [
      'read:offers'
    ];
    let jwt;

    before(async () => {
      jwt = createToken(
        entityKeyPriv,
        `did:orgid:${entityOrgId}`,
        entityKeyFragment,
        `did:orgid:${ektaOrgId}`,
        JSON.stringify(scopes),
        '2000 days'
      );
    });

    it('should create a valid JWT', async () => {
      const pubKey = JWK.asKey(
        entityKeyPub,
        {
          alg: 'ES256K',
          use: 'sig'
        }
      );
      JWT.verify(
        jwt,
        pubKey,
        {
          typ: 'JWT',
          audience: `did:orgid:${ektaOrgId}`
        }
      );
    });

    it('should create a JWT with proper payload', async () => {
      const decodedToken = JWT.decode(jwt, {
        complete: true
      });
      (decodedToken).should.to.have.a.property('payload').to.be.an('object');
      (decodedToken.payload).should.to.have.a.property('iss').to.equal(`did:orgid:${entityOrgId}#${entityKeyFragment}`);
      (decodedToken.payload).should.to.have.a.property('scope').to.equal(JSON.stringify(scopes));
    });
  });
});
