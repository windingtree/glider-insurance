const GliderError = require('../../shared/error');
require('chai').should();

describe('Error', () => {

  it('should create a proper Error', async () => {
    const error = new GliderError(
      'ERROR'
    );
    (error).should.be.an.instanceof(Error);
  });
});
