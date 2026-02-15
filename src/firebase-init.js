import { initializeApp, getApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getDatabase, connectDatabaseEmulator } from 'firebase/database'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'

// Only enable emulator mode in development environment
// Vite uses import.meta.env instead of process.env
const isDevelopment = import.meta.env.DEV
const isEmulatorMode = isDevelopment && !import.meta.env.VITE_DISABLE_FIREBASE_EMULATORS

// To test App Check locally:
// 1. Set VITE_TEST_APPCHECK=true in .env.local
// 2. Register a debug token in Firebase Console (App Check → Apps → Manage debug tokens)
// 3. Set VITE_APPCHECK_DEBUG_TOKEN=<your-debug-token> in .env.local
// This will use production config but with App Check debug mode
const testAppCheckLocally = isDevelopment && import.meta.env.VITE_TEST_APPCHECK === 'true'

// Production Firebase config
const productionConfig = {
  apiKey: 'AIzaSyBn8POCZdoWzsxN7OEBXnH863pdpboqeaA',
  appId: '1:56845607283:web:d515660e7dfba186dde506',
  authDomain: 'agile0.firebaseapp.com',
  databaseURL: 'https://agile0-default-rtdb.europe-west1.firebasedatabase.app',
  measurementId: 'G-YQV35JRDBR',
  messagingSenderId: '56845607283',
  projectId: 'agile0',
  storageBucket: 'agile0.appspot.com'
}

// Emulator config uses demo project
const emulatorConfig = {
  apiKey: 'demo-key',
  projectId: 'demo-agile-poker',
  authDomain: 'localhost',
  databaseURL: 'http://localhost:9001?ns=demo-agile-poker'
}

// Use production config when testing App Check locally, otherwise use emulator config
const useProductionConfig = !isEmulatorMode || testAppCheckLocally
const firebaseConfig = useProductionConfig ? productionConfig : emulatorConfig
const app = initializeApp(firebaseConfig)

// Initialize App Check in production OR when testing App Check locally
if (!isEmulatorMode || testAppCheckLocally) {
  // Enable debug token for local App Check testing
  // The token will be logged to console on first run - register it in Firebase Console
  if (testAppCheckLocally && typeof window !== 'undefined') {
    const debugToken = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN
    if (debugToken) {
      window.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken
    } else {
      // Setting to true will auto-generate and log a debug token to console
      window.FIREBASE_APPCHECK_DEBUG_TOKEN = true
    }
  }

  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('6LdDSVofAAAAAOCVXxuoWUdAcjrTC1Oey4P_4j5d'),
      isTokenAutoRefreshEnabled: true
    })
  } catch (error) {
    console.error('App Check initialization failed:', error)
  }
}

// Don't connect to emulators when testing App Check (needs real Firebase services)
if (isEmulatorMode && !testAppCheckLocally) {
  // Use localhost for browser connections (0.0.0.0 is for server binding, not client access)
  const firebaseEmulators = {
    auth: {
      host: 'localhost',
      port: 9099
    },
    database: {
      host: 'localhost',
      port: 9001
    },
    functions: {
      host: 'localhost',
      port: 5001
    }
  }

  const auth = getAuth()
  const db = getDatabase()
  const functions = getFunctions(getApp())

  connectAuthEmulator(auth, `http://${firebaseEmulators.auth.host}:${firebaseEmulators.auth.port}`)
  connectDatabaseEmulator(db, firebaseEmulators.database.host, firebaseEmulators.database.port)
  connectFunctionsEmulator(functions, firebaseEmulators.functions.host, firebaseEmulators.functions.port)
}
