import fs from 'fs'
import http from 'http'
import path from 'path'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
const { setLogLevel } = require('firebase/app')

const DATABASE_NAME = 'agile-poker'
const DATABASE_EMULATOR_HOST = 'localhost:9001'

process.env.DATABASE_EMULATOR_HOST = DATABASE_EMULATOR_HOST

const indexFile = path.resolve(path.join(__dirname, 'public', 'index.html'))
const html = fs.readFileSync(indexFile, { encoding: 'utf8' })

const COVERAGE_URL = `http://${DATABASE_EMULATOR_HOST}/emulator/v1/projects/${DATABASE_NAME}:ruleCoverage.html`

/**
 * @typedef {Object} TokenOptions
 * @property {string} iss
 * @property {string} aud
 * @property {string} sub
 * @property {number} iat
 * @property {number} number
 * @property {string} user_id
 * @property {auth_time} user_id
 * @property {string} uid
 */

/** @type RulesTestEnvironment */
let testEnv

beforeAll(async () => {
  setLogLevel('error')

  testEnv = await initializeTestEnvironment({
    database: { rules: fs.readFileSync('database.rules.json', 'utf8') }
  })
})

/**
 *
 * @param {TokenOptions} auth
 * @return {firebase.database.Database}
 */
global.authedApp = (auth) => {
  if (!auth) {
    return testEnv.unauthenticatedContext().database()
  }

  let { uid, ...token } = auth
  uid = uid ?? 'user'
  token = { ...token, sub: uid }

  return testEnv.authenticatedContext(uid, token).database()
}

beforeEach(() => {
  document.documentElement.innerHTML = html.toString()
})

afterEach(async () => {
  await testEnv.clearDatabase()

  jest.clearAllMocks()
})

afterAll(async () => {
  await testEnv.cleanup()

  // Write the coverage report to a file
  const coverageFile = 'database-coverage.html'
  const stream = fs.createWriteStream(coverageFile)
  await new Promise((resolve, reject) => {
    http.get(COVERAGE_URL, (res) => {
      res.pipe(stream, { end: true })

      res.on('end', resolve)
      res.on('error', reject)
    })
  })
})
