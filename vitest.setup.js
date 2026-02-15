import { beforeAll, beforeEach, afterEach, afterAll, vi } from 'vitest'
import fs from 'fs'
import http from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { setLogLevel } from 'firebase/app'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Database rules testing configuration
const DATABASE_NAME = 'demo-agile-poker'
const DATABASE_EMULATOR_HOST = 'localhost:9001'
process.env.DATABASE_EMULATOR_HOST = DATABASE_EMULATOR_HOST
const COVERAGE_URL = `http://${DATABASE_EMULATOR_HOST}/emulator/v1/projects/${DATABASE_NAME}:ruleCoverage.html`

/** @type RulesTestEnvironment */
let testEnv

// Load HTML for jsdom tests
let html = ''
try {
  const indexFile = path.resolve(path.join(__dirname, 'index.html'))
  html = fs.readFileSync(indexFile, { encoding: 'utf8' })
} catch (e) {
  // May fail in node environment without DOM, that's OK
}

// Track which test files need rules testing setup
let rulesTestInitialized = false

beforeAll(async () => {
  setLogLevel('error')

  try {
    testEnv = await initializeTestEnvironment({
      projectId: DATABASE_NAME,
      database: {
        rules: fs.readFileSync('database.rules.json', 'utf8'),
        host: 'localhost',
        port: 9001
      }
    })
    rulesTestInitialized = true
  } catch (e) {
    // May fail if emulator not ready, continue anyway for non-db tests
    console.warn('Could not initialize test environment:', e.message)
  }
})

/**
 * @param {Object} auth
 * @return {firebase.database.Database}
 */
globalThis.authedApp = (auth) => {
  if (!testEnv) {
    throw new Error('Test environment not initialized')
  }

  if (!auth) {
    return testEnv.unauthenticatedContext().database()
  }

  let { uid, ...token } = auth
  uid = uid ?? 'user'
  token = { ...token, sub: uid }

  return testEnv.authenticatedContext(uid, token).database()
}

beforeEach((context) => {
  // Set up DOM for browser tests
  if (typeof document !== 'undefined' && html) {
    document.documentElement.innerHTML = html.toString()
  }

  // Mock HTMLDialogElement methods not implemented in jsdom
  if (typeof HTMLDialogElement !== 'undefined') {
    HTMLDialogElement.prototype.showModal = HTMLDialogElement.prototype.showModal || function () {
      this.setAttribute('open', '')
    }
    HTMLDialogElement.prototype.close = HTMLDialogElement.prototype.close || function () {
      this.removeAttribute('open')
    }
  }
})

afterEach(async (context) => {
  // Only clear database for rules tests, not for functions tests
  // Functions tests manage their own data and use firebase-admin directly
  const testPath = context?.task?.file?.name || ''
  const isRulesTest = testPath.includes('database.rules.spec')

  if (testEnv && rulesTestInitialized && isRulesTest) {
    await testEnv.clearDatabase()
  }
  vi.clearAllMocks()
})

afterAll(async () => {
  // Don't cleanup testEnv as it may affect other tests running in parallel
  // The emulator will be shut down by firebase CLI anyway

  // Write the coverage report to a file (best effort)
  const coverageFile = 'database-coverage.html'
  try {
    const stream = fs.createWriteStream(coverageFile)
    await new Promise((resolve) => {
      const req = http.get(COVERAGE_URL, (res) => {
        res.pipe(stream, { end: true })
        stream.on('finish', () => {
          stream.close()
          resolve()
        })
      })
      req.on('error', () => {
        stream.close()
        resolve()
      })
      req.setTimeout(5000, () => {
        req.destroy()
        stream.close()
        resolve()
      })
    })
  } catch (e) {
    // Ignore coverage errors
  }
})
