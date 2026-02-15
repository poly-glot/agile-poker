module.exports = {
  env: {
    browser: true,
    es2022: true,
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
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    'max-len': ["error", { "code": 180 }]
  }
}
