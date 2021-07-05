// Firebase local & CI testing configuration. It is replaced with "/__/firebase/init.js" on live deployment

if (typeof firebase === 'undefined') {
  throw new Error('hosting/init-error: Firebase SDK not detected. You must include it before /__/firebase/init.js')
}

firebase.initializeApp({
  "projectId": "agile0",
  "apiKey": "AIzaSyBn8POCZdoWzsxN7OEBXnH863pdpbtestA"
});

const firebaseEmulators = {
  "auth": {
    "host": "0.0.0.0",
    "port": 9099
  },
  "database": {
    "host": "0.0.0.0",
    "port": 9001
  },
  "functions": {
    "host": "0.0.0.0",
    "port": 5001
  }
};

console.log("Automatically connecting Firebase SDKs to running emulators:");

Object.keys(firebaseEmulators).forEach(function(key) {
  console.log('\t' + key + ': http://' +  firebaseEmulators[key].host + ':' + firebaseEmulators[key].port );
});

if (firebaseEmulators.database && typeof firebase.database === 'function') {
  firebase.database().useEmulator(firebaseEmulators.database.host, firebaseEmulators.database.port);
}

if (firebaseEmulators.firestore && typeof firebase.firestore === 'function') {
  firebase.firestore().useEmulator(firebaseEmulators.firestore.host, firebaseEmulators.firestore.port);
}

if (firebaseEmulators.functions && typeof firebase.functions === 'function') {
  firebase.functions().useEmulator(firebaseEmulators.functions.host, firebaseEmulators.functions.port);
}

if (firebaseEmulators.auth && typeof firebase.auth === 'function') {
  firebase.auth().useEmulator('http://' + firebaseEmulators.auth.host + ':' + firebaseEmulators.auth.port);
}
