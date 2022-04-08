import { initializeApp, getApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getDatabase, connectDatabaseEmulator } from 'firebase/database'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'
const { initializeAppCheck, ReCaptchaV3Provider } = require('firebase/app-check')

const app = initializeApp({
  apiKey: 'AIzaSyBn8POCZdoWzsxN7OEBXnH863pdpboqeaA',
  appId: '1:56845607283:web:d515660e7dfba186dde506',
  authDomain: 'agile0.firebaseapp.com',
  databaseURL: 'https://agile0-default-rtdb.europe-west1.firebasedatabase.app',
  measurementId: 'G-YQV35JRDBR',
  messagingSenderId: '56845607283',
  projectId: 'agile0',
  storageBucket: 'agile0.appspot.com'
})

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LdDSVofAAAAAOCVXxuoWUdAcjrTC1Oey4P_4j5d'),
  isTokenAutoRefreshEnabled: true
})

if (!process.env.DISABLE_FIREBASE_EMULATORS) {
  const firebaseEmulators = {
    auth: {
      host: '0.0.0.0',
      port: 9099
    },
    database: {
      host: '0.0.0.0',
      port: 9001
    },
    functions: {
      host: '0.0.0.0',
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
