require('dotenv').config();
const { createToken } = require('../shared/utils/auth');
const {
  entityKeyPriv,
  entityOrgId,
  entityKeyFragment,
  ektaOrgId
} = require('../test/config');

const scopes = '';

const token = createToken(
  entityKeyPriv,
  `did:orgid:${entityOrgId}`,
  entityKeyFragment,
  `did:orgid:${ektaOrgId}`,
  scopes,
  '2000 days'
);

console.log('Token: Test company -> GI');
console.log(token);
