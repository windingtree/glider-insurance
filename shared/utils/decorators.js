const GliderError = require('../error');
const {
  HTTP_STATUS_CODES: {
    OK,
    INTERNAL_SERVER_ERROR: INTERNAL_SERVER_ERROR_CODE
  },
  HTTP_STATUS: {
    METHOD_NOT_ALLOWED,
    BAD_REQUEST,
    INTERNAL_SERVER_ERROR
  }
} = require('../constants');
const { getDeepValue } = require('../utils/object');
const { validateWithSchemaAndRef } = require('../utils/validators');

// Decorate serverless functions with support for:
// - error handling
// - request method validation
// - request (properties and body) and response data validation against schema
// - and authentication ability
const functionDecorator = (
  func,
  apiVersion,
  apiPath,
) => async (req, res) => {
  try {
    const swaggerJson = require(`../../public/${apiVersion}/swagger.json`);
    const schema = getDeepValue(swaggerJson, `paths.${apiPath}`);

    // Schema existence validation
    if (typeof schema !== 'object') {
      throw new GliderError(
        `Schema not found on path "${apiPath}"`,
        INTERNAL_SERVER_ERROR
      );
    }

    const requestMethod = req.method.toLowerCase();

    // Request HTTP method validation
    if (!Object.keys(schema).includes(requestMethod)) {
      throw new GliderError(
        'Method not allowed',
        METHOD_NOT_ALLOWED
      );
    }

    // Request parameters validation
    const requestParameters = requestMethod === 'get'
      ? req.query
      : req.body;

    const requestParametersSchema = getDeepValue(
      schema,
      `${requestMethod}.parameters`
    );

    if (requestParametersSchema && Array.isArray(requestParametersSchema)) {
      // Iterate through parameters schema
      for (const parameter of requestParametersSchema) {
        const parameterValue = requestParameters[parameter.name];
        const isRequired = parameter.required;
        if (parameterValue) {
          const requestModelRef = parameter.schema;
          const requestValidationResult = await validateWithSchemaAndRef(
            swaggerJson,
            requestModelRef,
            parameterValue
          );
          if (requestValidationResult !== null) {
            throw new GliderError(
              `Request validation error: ${requestValidationResult}`,
              BAD_REQUEST
            );
          }
        } else if (!parameterValue && isRequired) {
          throw new GliderError(
            `Parameter ${parameter.name} is required`,
            BAD_REQUEST
          );
        }
      }
    }

    // Request body validation
    const requestBodySchema = getDeepValue(
      schema,
      `${requestMethod}.requestBody.content.application/json.schema.$ref`
    );

    if (requestBodySchema) {
      const requestBodyValidationResult = await validateWithSchemaAndRef(
        swaggerJson,
        requestBodySchema,
        requestParameters
      );
      if (requestBodyValidationResult !== null) {
        throw new GliderError(
          `Request validation error: ${requestBodyValidationResult}`,
          BAD_REQUEST
        );
      }
    }

    // Execute function
    const response = await func();

    // Response data validation
    const responseSchema = getDeepValue(
      schema,
      `${requestMethod}.responses.200`
    );

    if (!responseSchema) {
      throw new GliderError(
        `Response validation schema for "${requestMethod}:${apiPath}" not defined`,
        INTERNAL_SERVER_ERROR
      );
    }

    // @note Only json based responses are supported
    const responseModelRef = getDeepValue(
      responseSchema,
      'content.application/json.schema.$ref'
    );

    const responseValidationResult = await validateWithSchemaAndRef(
      swaggerJson,
      responseModelRef,
      response
    );

    if (responseValidationResult !== null) {
      throw new GliderError(
        `Response validation error: ${responseValidationResult}`,
        BAD_REQUEST
      );
    }

    // Send response to client
    res
      .status(OK)
      .json(response);
  } catch (error) {
    res
      .status(typeof error.status === 'number'
        ? error.status
        : INTERNAL_SERVER_ERROR_CODE)
      .json({
        message: error.message,
        ...(error.code ? { code: error.code } : {})
      });
  }
};
module.exports.functionDecorator = functionDecorator;
