const { getDeepValue } = require('../../../shared/utils/object');
require('chai').should();

describe('Object Utilities', () => {

  describe('#getDeepValue', () => {
    const value = 1;
    const obj = {
      level1: {
        level2: {
          level3: {
            prop1: value
          }
        }
      }
    };

    it('should return deep property value by path', async () => {
      (getDeepValue(obj, 'level1.level2.level3.prop1')).should.equal(value);
    });

    it('should return "undefined" in case of property not found', async () => {
      (String(getDeepValue(obj, 'level1.level2.level3.prop2'))).should.equal('undefined');
      (String(getDeepValue(obj, 'level1.level2.level5.prop1'))).should.equal('undefined');
    });
  });
});
