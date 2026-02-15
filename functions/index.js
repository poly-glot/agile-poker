const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getDatabase } = require('firebase-admin/database')
const { v4: uuid } = require('uuid')

initializeApp()

// Only enforce App Check in production (emulator doesn't support it)
const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true'

const validUsernamePattern = /^[a-z\d\-_\s]+$/i

exports.login = onCall(
  { enforceAppCheck: !isEmulator },
  async (request) => {
    const { username } = request.data

    if (!username || username.length > 32 || !validUsernamePattern.test(username)) {
      throw new HttpsError('failed-precondition', 'Invalid username. Username should be less than 32 characters and contain alpha numeric & space characters only. e.g. "Super Man"')
    }

    if (username === 'revealPoints') {
      throw new HttpsError('failed-precondition', 'revealPoints is a reserved username. Please choose some thing else.')
    }

    const token = await getAuth().createCustomToken(username)

    return {
      token
    }
  }
)

exports.createRoom = onCall(
  { enforceAppCheck: !isEmulator },
  async (request) => {
    const uid = request.auth?.uid

    if (!uid) {
      throw new HttpsError('unauthenticated', 'You are not logged in')
    }

    const roomAdmin = uuid()

    const token = await getAuth().createCustomToken(uid, { roomAdmin })

    return {
      token,
      uid,
      roomId: roomAdmin
    }
  }
)

exports.cleanup = onSchedule(
  {
    schedule: 'every 24 hours',
    timeZone: 'Europe/London'
  },
  async () => {
    try {
      const today = new Date()
      const year = today.getUTCFullYear()
      const month = today.getUTCMonth() + 1
      const day = today.getUTCDate()
      const yearMonthDay = year + (month < 10 ? '0' + month : month) + (day < 10 ? '0' + day : day)

      console.log(`Starting cleanup for date: ${yearMonthDay}`)

      const db = getDatabase()
      const snapshot = await db.ref('storyPoints').get()
      const data = snapshot.val()

      if (!data) {
        console.log('No data to clean up')
        return null
      }

      const dates = Object.keys(data).filter(ymd => ymd !== yearMonthDay)
      console.log(`Found ${dates.length} old date(s) to remove`)

      for (const ymd of dates) {
        await db.ref(`storyPoints/${ymd}`).remove()
        console.log(`Removed data for: ${ymd}`)
      }

      console.log('Cleanup completed successfully')
      return null
    } catch (error) {
      console.error('Cleanup failed:', error)
      throw error
    }
  }
)
