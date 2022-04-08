import { initializeApp, getApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getDatabase, connectDatabaseEmulator } from 'firebase/database'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

initializeApp({
  projectId: 'agile0',
  apiKey: 'AIzaSyBn8POCZdoWzsxN7OEBXnH863pdpbtestA'
})

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
