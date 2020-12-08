const GliderError = require('../../shared/error');
const { HTTP_STATUS_CODES, HTTP_STATUS } = require('../../shared/constants');
require('chai').should();

describe('Error', () => {

  describe('#GliderError', () => {

    it('should create a proper Error', async () => {
      const error = new GliderError(
        'ERROR'
      );
      (error).should.be.an.instanceof(Error);
      (error.status).should.equal(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    });

    it('should create a Error with proper HTTP status code', async () => {
      const error = new GliderError(
        'ERROR',
        HTTP_STATUS.NOT_FOUND
      );
      (error.code).should.equal(HTTP_STATUS.NOT_FOUND);
      (error.status).should.equal(HTTP_STATUS_CODES.NOT_FOUND);
    });

    it('should create a Error with custom status code', async () => {
      const customCode = 'CUSTOM_CODE';
      const error = new GliderError(
        'ERROR',
        customCode
      );
      (error.code).should.equal(customCode);
      (error.status).should.equal(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
    });
  });
});
