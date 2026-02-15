import { defineConfig } from 'cypress'

export default defineConfig({
  defaultCommandTimeout: 6000,
  projectId: 'coqb3r',
  e2e: {
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.{js,jsx,ts,tsx}',
    testIsolation: false
  }
})
