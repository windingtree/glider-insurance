module.exports = {
  'extends': 'eslint:recommended',
  'env': {
    'es6': true,
    'node': true,
    'mocha': true,
    'jest': true
  },
  'globals': {},
  'parserOptions': {
    'ecmaVersion': 9
  },
  'rules': {
    'indent': ['error', 2, {
      'SwitchCase': 1
    }],
    'quotes': [2, 'single']
  }
};
