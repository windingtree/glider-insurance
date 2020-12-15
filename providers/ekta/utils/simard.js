const {
  HTTP_METHODS: {
    GET
  }
} = require('../../../shared/constants');
const {
  buildSimardAuth
} = require('./auth');
const {
  request
} = require('../../../shared/utils/rest');
const {
  SIMARD_URI
} = require('../../../shared/config');

// Get guarantee info from the Simard by Id
module.exports.getGuarantee = guaranteeId => request(
  SIMARD_URI,
  `/balances/guarantees/${guaranteeId}`,
  GET,
  {},
  {
    method: 'headers',
    data: buildSimardAuth()
  }
);
