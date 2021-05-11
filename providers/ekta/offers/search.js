const { v4: uuidv4 } = require('uuid');
const GliderError = require('../../../shared/error');
const {
  HTTP_STATUS: {
    NOT_FOUND
  }
} = require('../../../shared/constants');
const {
  calculateOffers
} = require('../utils/ekta');
const {
  saveOffers,
  expirationTime
} = require('../../../shared/mongo/models/offers');

// Pre-configured set of insurance programs
const insurancePrograms = [
  {
    'programm_id': 'cpa_vzr_standart',
    'insurance_limit': 3000,
    'insurance_limit_currency': 'EUR'
  },
  {
    'programm_id': 'sub_premium_vzr',
    'insurance_limit': 30000,
    'insurance_limit_currency': 'EUR'
  },
  {
    'programm_id': 'sub_premium_vzr',
    'insurance_limit': 50000,
    'insurance_limit_currency': 'USD'
  }
];

// Converts tourists array into flat array and mapped object
const buildTouristsRepresentation = touristsOrig => touristsOrig.reduce(
  (a, t) => {
    const {
      id,
      ...restObj
    } = t;
    return [
      // Tourists objects array (without Ids)
      [
        ...a[0],
        restObj
      ],
      // Tourist Id -> object mapping
      {
        ...a[1],
        [id]: restObj
      }
    ];
  },
  [[], {}]
);
module.exports.buildTouristsRepresentation = buildTouristsRepresentation;

// Build request object for the offers calculation
const createCalculationRequestBody = (
  {
    territory,
    target,
    citizenship,
    period_from,
    period_till,
    currency
  },
  program,
  tourists
) => ({
  type: 'single',
  territory,
  target,
  citizenship,
  lang: 'en',
  'single_period_from': period_from,
  'single_period_till': period_till,
  'price_currency': currency,
  ...program,
  tourists
});

// Process single offers calculation response
const processCalculationResponse = (
  response,
  touristsKeyObj,
  requestBodies
) => response.reduce(
  (a, o, index) => {
    const offerId = uuidv4();
    const expiration = expirationTime().toISOString();
    return [
      // Response collection
      [
        ...a[0],
        {
          offerId,
          ...o,
          tourists: Object.keys(touristsKeyObj),
          expiration
        }
      ],
      // Extended database version
      [
        ...a[1],
        {
          offerId,
          ...o,
          tourists: touristsKeyObj,
          expiration,
          'program_id': o.id,
          extraData: {
            requestBody: requestBodies[index]
          }
        }
      ]
    ];
  },
  [[], []]
);
module.exports.processCalculationResponse = processCalculationResponse;

// Process set of responses
const processSetAllResponses = (
  allResponses,
  touristsKeyObj,
  requestBodies
) => allResponses.reduce(
  (a, response) => {
    if (response.length > 0) {
      const [short, extended] = processCalculationResponse(
        response,
        touristsKeyObj,
        requestBodies
      );
      return [
        [
          ...a[0],
          ...short
        ],
        [
          ...a[1],
          ...extended
        ]
      ];
    }

    return a;
  },
  [[], []]
);

// Create and send request for offers
module.exports = async req => {
  const [
    tourists,
    touristsKeyObj
  ] = buildTouristsRepresentation(req.body.tourists);

  const requestBodies = insurancePrograms.map(
    program => createCalculationRequestBody(
      req.body,
      program,
      tourists
    )
  );

  const allResponses = await Promise.all(
    requestBodies.map(
      requestBody => calculateOffers(req, requestBody)
    )
  );

  const allOffers = processSetAllResponses(
    allResponses,
    touristsKeyObj,
    requestBodies
  );

  if (allOffers[0].length === 0) {
    throw new GliderError(
      'Offers not found',
      NOT_FOUND
    );
  }

  // Save offers to database
  await saveOffers(allOffers[1]);

  return {
    offers: allOffers[0].sort((a, b) => a.cost - b.cost)
  }
};
