# glider-insurance
Multi-tenant bridge for insurance providers on Winding Tree marketplace

## Get Started

```bash
npm i
npx vercel login
```

## Development

```
npm start
```

The API swagger UI will be available by the URL `http://localhost:3000`

For the access to APIs required an authentication you will need a token. You can generate a token using:

```bash
node ./scripts/test-token.js
```

## Unit Tests

```bash
npm test
npm run test:coverage
```

## API Tests

Run server:

```bash
npm start
```

and then start tests:

```bash
npm run test:api
```
