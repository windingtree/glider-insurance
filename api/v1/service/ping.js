const { functionDecorator } = require('../../../shared/utils/decorators');
// const GliderError = require('../../../shared/error');

const ping = async () => ({
  message: 'Pong',
  date: new Date().toISOString()
});

module.exports = functionDecorator(
  ping,
  'v1',
  '/service/ping'
);
