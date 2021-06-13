const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { v4: uuid } = require('uuid')

admin.initializeApp();

const validUsernamePattern = /^[a-z\d\-_\s]+$/i

exports.login = functions.https.onCall(async (data, context) => {
  const { username } = data;

  if (!username || username.length > 32 || !validUsernamePattern.test(username)) {
    throw new functions.https.HttpsError('failed-precondition', 'Invalid username. Username should be less than 32 characters and contain alpha numeric & space characters only. e.g. "Super Man"');
  }

  if (username === 'revealPoints') {
    throw new functions.https.HttpsError('failed-precondition', 'revealPoints is a reserved username. Please choose some thing else.');
  }

  const token = await admin.auth().createCustomToken(username);

  return {
    token
  }
});

exports.createRoom = functions.https.onCall(async (data, context) => {
  const { uid } = context.auth

  if (!uid) {
    throw new functions.https.HttpsError('failed-precondition', 'You are not logged in');
  }

  const roomAdmin = uuid()

  const token = await admin.auth().createCustomToken(uid, {roomAdmin});

  return {
    token,
    uid,
    roomId: roomAdmin
  }
})

exports.cleanup = functions.pubsub.schedule('every 24 hours')
  .timeZone('Europe/London')
  .onRun(async (context) => {

    const today = new Date()
    const year = today.getUTCFullYear()
    const month = today.getUTCMonth() + 1
    const day = today.getUTCDate()
    const yearMonthDay = year + (month < 10 ? '0' + month : month) + (day < 10 ? '0' + day : day)

    const db = admin.database()
    const snapshot = await db.ref('storyPoints').get()
    const data = snapshot.val()

    if (!data) {
      return null
    }

    const dates = Object.keys(data).filter(ymd => ymd !== yearMonthDay)
    for (const ymd of dates) {
      await db.ref(`storyPoints/${ymd}`).remove()
    }

    return null;
  });
