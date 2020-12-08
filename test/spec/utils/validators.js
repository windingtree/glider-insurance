const { validateWithSchemaOrRef } = require('../../../shared/utils/validators');
const swaggerJson = require('../../fixtures/swagger.json');
const {
  pingRequestFull,
  pingResponseFull,
  pingResponseWrongType
} = require('../../fixtures/dataSets');
require('chai').should();

describe('Validators', () => {

  describe('#validateWithSchemaOrRef', () => {

    it('should validate object by the schema reference', async () => {
      let result = validateWithSchemaOrRef(
        swaggerJson,
        '#/components/schemas/Pong',
        pingResponseFull
      );
      (String(result)).should.equal('null');

      // Validate response with wrong data
      result = validateWithSchemaOrRef(
        swaggerJson,
        '#/components/schemas/Pong',
        pingResponseWrongType
      );
      (result).should.be.a('string')
        .that.equal('data.date should match format "date-time"');
    });

    it('should validate "parameters" by the rule', async () => {
      const result = validateWithSchemaOrRef(
        null,// Not required for the such case
        {
          type: 'string'
        },
        pingRequestFull.message
      );
      (String(result)).should.equal('null');
    });
  });
});
