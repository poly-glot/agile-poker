module.exports = {
  env: {
    browser: true,
    es6: true,
    jest: true
  },
  extends: [
    'standard'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    cy: true,
    Cypress: true,
    authedApp: true,
    adminApp: true,
    firebase: true,
    firebaseEmulators: true
  },
  parser: "@babel/eslint-parser",
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  plugins: [
    "@babel"
  ],
  rules: {
    'max-len': ["error", { "code": 180 }]
  }
}
