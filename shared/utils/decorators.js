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
const { isAuthorized } = require('../utils/auth');
const { validateWithSchemaOrRef } = require('../utils/validators');

// Decorate serverless function with support for:
// - error handling
// - request method validation
// - request (parameters and body object) and response data validation against the schema
// - authentication and authorization ability
const functionDecorator = (
  func,
  apiVersion,
  apiPath,
  authScope = []
) => async (req, res) => {
  try {
    // start timer
    req.start = process.hrtime();

    // Fetch swagger schema
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

    // HTTP Request method validation
    if (!Object.keys(schema).includes(requestMethod)) {
      throw new GliderError(
        'Method not allowed',
        METHOD_NOT_ALLOWED
      );
    }

    // Authentication and Authorization
    // "orgid_auth" method is allowed only
    const authSchema = getDeepValue(
      schema,
      `${requestMethod}.security`
    );
    if (authSchema && Array.isArray(authSchema) && authSchema.length > 0) {

      // Verify function scope configuration
      if (!authScope || !Array.isArray(authScope)) {
        throw new GliderError(
          'Function authentication scope not defined',
          INTERNAL_SERVER_ERROR
        );
      }

      // Extract auth scope from security schema
      const authScopeSchema = authSchema.reduce(
        (a, v) => {
          if (v['orgid_auth']) {
            a = v['orgid_auth'];
          }
          return a;
        },
        []
      );

      // Checking if the function can be executed in the current scope
      if (authScopeSchema.filter(s => authScope.includes(s)).length === 0) {
        throw new GliderError(
          `Function cannot be executed in scope: ${JSON.stringify(authScopeSchema)}`,
          INTERNAL_SERVER_ERROR
        );
      }

      // Authenticate the request
      await isAuthorized(req, authScope);
    }

    // Request parameters validation
    const requestParametersSchema = getDeepValue(
      schema,
      `${requestMethod}.parameters`
    );

    if (requestParametersSchema && Array.isArray(requestParametersSchema)) {
      const requestParameters = req.query;

      // Iterate through parameters schema
      for (const parameter of requestParametersSchema) {
        const parameterValue = requestParameters[parameter.name];
        const isRequired = parameter.required;

        if (parameterValue) {
          const requestModelRef = parameter.schema;
          const requestValidationResult = validateWithSchemaOrRef(
            null,
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
      const requestBody = req.body;
      const isRequired = requestBodySchema.required;

      if (requestBody && typeof requestBody === 'object') {
        const requestBodyValidationResult = validateWithSchemaOrRef(
          swaggerJson,
          requestBodySchema,
          requestBody
        );
        if (requestBodyValidationResult !== null) {
          throw new GliderError(
            `Request validation error: ${requestBodyValidationResult}`,
            BAD_REQUEST
          );
        }
      } else if (!requestBody && isRequired) {
        throw new GliderError(
          'Request body is required',
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

    const responseValidationResult = validateWithSchemaOrRef(
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
