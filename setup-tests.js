import fs from 'fs'
import http from 'http'
import path from 'path'
import * as firebase from '@firebase/rules-unit-testing'

const DATABASE_NAME = 'agile-poker'
const DATABASE_EMULATOR_HOST = 'localhost:9001'

process.env.DATABASE_EMULATOR_HOST = DATABASE_EMULATOR_HOST

const indexFile = path.resolve(path.join(__dirname, 'public', 'index.html'))
const html = fs.readFileSync(indexFile, {encoding: 'utf8'})

const COVERAGE_URL = `http://${process.env.FIREBASE_DATABASE_EMULATOR_HOST}/.inspect/coverage?ns=${DATABASE_NAME}`;

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

/**
 *
 * @param {TokenOptions} auth
 * @return {firebase.database.Database}
 */
global.authedApp = (auth) => {
  return firebase.initializeTestApp({
    databaseName: DATABASE_NAME,
    auth,
  }).database();
}

global.adminApp = () => {
  return firebase.initializeAdminApp({ databaseName: DATABASE_NAME })
    .database()
}

beforeEach(async () => {
  document.documentElement.innerHTML = html.toString()

  await adminApp().ref().set(null)
});

afterEach(() => {
  jest.clearAllMocks()
});

beforeAll(async () => {
  // Set database rules before running these tests
  const rules = fs.readFileSync("database.rules.json", "utf8")
  await firebase.loadDatabaseRules({
    databaseName: DATABASE_NAME,
    rules: rules,
  })
})

afterAll(async () => {
  await Promise.all(firebase.apps().map((app) => app.delete()))

  // Write the coverage report to a file
  const coverageFile = 'database-coverage.html'
  const stream = fs.createWriteStream(coverageFile)
  await new Promise((resolve, reject) => {
    http.get(COVERAGE_URL, (res) => {
      res.pipe(stream, { end: true })

      res.on("end", resolve)
      res.on("error", reject)
    })
  })
})
