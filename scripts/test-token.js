require('dotenv').config();
const { createToken } = require('../shared/utils/auth');
const {
  entityKeyPriv,
  entityOrgId,
  entityKeyFragment,
  ektaOrgId
} = require('../test/config');

const scopes = [
  'read:offers'
];

const token = createToken(
  entityKeyPriv,
  `did:orgid:${entityOrgId}`,
  entityKeyFragment,
  `did:orgid:${ektaOrgId}`,
  JSON.stringify(scopes),
  '2000 days'
);

console.log(token);
