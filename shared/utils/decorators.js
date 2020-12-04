const GliderError = require('../error');
const {
  HTTP_STATUS: {
    BAD_REQUEST,
    INTERNAL_SERVER_ERROR
  }
} = require('../constants');

// Decorate serverless functions with error handling and authentication ability
const functionDecorator = (
  func,
  apiVersion,
  apiPath,
) => async (req, res) => {
  try {
    const swaggerJson = require(`../../public/${apiVersion}/swagger.json`);
    const schema = swaggerJson.paths[apiPath];

    if (typeof schema !== 'object') {
      throw new GliderError(
        `Schema not found on path "${apiPath}"`,
        INTERNAL_SERVER_ERROR
      );
    }

    if (!Object.keys(schema).includes(req.method.toLowerCase())) {
      throw new GliderError(
        'Method not allowed',
        BAD_REQUEST
      );
    }

    const response = await func();
    res
      .status(200)
      .json(response);
  } catch (error) {
    res
      .status(typeof error.status === 'number'
        ? error.status
        : INTERNAL_SERVER_ERROR)
      .json({
        message: error.message,
        ...(error.code ? { code: error.code } : {})
      });
  }
};
module.exports.functionDecorator = functionDecorator;
