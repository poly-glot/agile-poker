const { onCall, HttpsError } = require('firebase-functions/v2/https')
const { onSchedule } = require('firebase-functions/v2/scheduler')
const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getDatabase } = require('firebase-admin/database')
const { v4: uuid } = require('uuid')

initializeApp()

// Only enforce App Check in production (emulator doesn't support it)
const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true'

// In emulator mode the client SDK connects to the demo-agile-poker namespace
// while the admin SDK auto-generates a different namespace from the project ID.
// Use an explicit URL so both sides share the same database.
const emulatorDbUrl = 'http://localhost:9001?ns=demo-agile-poker'

function db () {
  return isEmulator ? getDatabase(undefined, emulatorDbUrl) : getDatabase()
}
const region = 'europe-west1'

const validUsernamePattern = /^[a-z\d\-_\s]+$/i

exports.login = onCall(
  { enforceAppCheck: !isEmulator, region },
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
  { enforceAppCheck: !isEmulator, region },
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

const PROMOTION_TIMEOUT_MS = 60000

exports.requestAdminPromotion = onCall(
  { enforceAppCheck: !isEmulator, region },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'You are not logged in')
    }

    const { roomId } = request.data
    if (!roomId) {
      throw new HttpsError('invalid-argument', 'roomId is required')
    }

    // Check user is not already admin
    const user = await getAuth().getUser(uid)
    if (user.customClaims?.roomAdmin === roomId) {
      throw new HttpsError('failed-precondition', 'You are already the admin of this room')
    }

    const database = db()
    const requestRef = database.ref(`promotionRequests/${roomId}`)

    // Check no pending request exists
    const existing = await requestRef.get()
    if (existing.exists()) {
      const data = existing.val()
      if (data.status === 'pending' && Date.now() < data.expiresAt) {
        throw new HttpsError('failed-precondition', 'A promotion request is already in progress')
      }
    }

    // Count current room members to know total voters
    const today = new Date()
    const year = today.getUTCFullYear()
    const month = today.getUTCMonth() + 1
    const day = today.getUTCDate()
    const yearMonthDay = year + (month < 10 ? '0' + month : month) + (day < 10 ? '0' + day : day)

    const roomSnapshot = await database.ref(`storyPoints/${yearMonthDay}/${roomId}`).get()
    if (!roomSnapshot.exists()) {
      throw new HttpsError('not-found', 'Room not found')
    }

    const members = Object.keys(roomSnapshot.val()).filter(n => n !== 'revealPoints')
    if (!members.includes(uid)) {
      throw new HttpsError('permission-denied', 'You are not a member of this room')
    }

    const now = Date.now()
    const requestData = {
      requesterId: uid,
      requesterName: user.displayName || uid,
      status: 'pending',
      createdAt: now,
      expiresAt: now + PROMOTION_TIMEOUT_MS,
      memberCount: members.length,
      votes: {
        [uid]: { vote: true, name: user.displayName || uid }
      }
    }

    await requestRef.set(requestData)

    // If requester's auto-vote completes the majority, resolve immediately
    if (members.length <= 1) {
      const resolution = await resolvePromotionRequest(database, roomId, requestData)
      // Return enough data for the client to show the result without reading DB
      return {
        success: true,
        expiresAt: requestData.expiresAt,
        resolved: true,
        result: resolution.result,
        requestData: {
          ...requestData,
          status: resolution.result,
          newToken: resolution.newToken
        }
      }
    }

    return { success: true, expiresAt: requestData.expiresAt }
  }
)

exports.voteOnPromotion = onCall(
  { enforceAppCheck: !isEmulator, region },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'You are not logged in')
    }

    const { roomId, vote } = request.data
    if (!roomId || typeof vote !== 'boolean') {
      throw new HttpsError('invalid-argument', 'roomId and vote (boolean) are required')
    }

    const database = db()
    const requestRef = database.ref(`promotionRequests/${roomId}`)

    const snapshot = await requestRef.get()
    if (!snapshot.exists()) {
      throw new HttpsError('not-found', 'No promotion request found')
    }

    const data = snapshot.val()

    if (data.status !== 'pending') {
      throw new HttpsError('failed-precondition', 'This promotion request has already been resolved')
    }

    if (Date.now() > data.expiresAt) {
      throw new HttpsError('deadline-exceeded', 'Voting period has expired')
    }

    if (data.votes && data.votes[uid]) {
      throw new HttpsError('already-exists', 'You have already voted')
    }

    const user = await getAuth().getUser(uid)
    await requestRef.child(`votes/${uid}`).set({
      vote,
      name: user.displayName || uid
    })

    // Check if all members have voted for early resolution
    const updatedSnapshot = await requestRef.get()
    const updatedData = updatedSnapshot.val()
    const voteCount = Object.keys(updatedData.votes || {}).length

    if (voteCount >= updatedData.memberCount) {
      return resolvePromotionRequest(database, roomId, updatedData)
    }

    return { success: true, resolved: false }
  }
)

exports.resolvePromotion = onCall(
  { enforceAppCheck: !isEmulator, region },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'You are not logged in')
    }

    const { roomId } = request.data
    if (!roomId) {
      throw new HttpsError('invalid-argument', 'roomId is required')
    }

    const database = db()
    const requestRef = database.ref(`promotionRequests/${roomId}`)

    const snapshot = await requestRef.get()
    if (!snapshot.exists()) {
      throw new HttpsError('not-found', 'No promotion request found')
    }

    const data = snapshot.val()

    if (data.status !== 'pending') {
      throw new HttpsError('failed-precondition', 'This promotion request has already been resolved')
    }

    if (Date.now() < data.expiresAt) {
      throw new HttpsError('failed-precondition', 'Voting period has not expired yet')
    }

    return resolvePromotionRequest(database, roomId, data)
  }
)

/**
 * Calculate vote result and apply promotion if approved.
 * Non-voters count as implicit approvals.
 */
async function resolvePromotionRequest (db, roomId, data) {
  const votes = data.votes || {}
  const voteEntries = Object.values(votes)
  const explicitApprovals = voteEntries.filter(v => v.vote === true).length
  const explicitRejections = voteEntries.filter(v => v.vote === false).length
  const nonVoters = data.memberCount - voteEntries.length

  // Non-response = implicit approval
  const totalApprovals = explicitApprovals + nonVoters
  // Majority approves or tie → approved
  const approved = totalApprovals >= explicitRejections

  const result = approved ? 'approved' : 'denied'

  const requestRef = db.ref(`promotionRequests/${roomId}`)

  // Write only the status — never store auth tokens in the database
  await requestRef.update({ status: result })

  // Generate the admin token only for the caller (returned via HTTPS, not stored in DB)
  let newToken = null
  if (approved) {
    newToken = await getAuth().createCustomToken(data.requesterId, { roomAdmin: roomId })
  }

  return { success: true, resolved: true, result, newToken }
}

exports.claimAdminToken = onCall(
  { enforceAppCheck: !isEmulator, region },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'You are not logged in')
    }

    const { roomId } = request.data
    if (!roomId) {
      throw new HttpsError('invalid-argument', 'roomId is required')
    }

    const database = db()
    const snapshot = await database.ref(`promotionRequests/${roomId}`).get()
    if (!snapshot.exists()) {
      throw new HttpsError('not-found', 'No promotion request found')
    }

    const data = snapshot.val()

    if (data.status !== 'approved') {
      throw new HttpsError('failed-precondition', 'Promotion request was not approved')
    }

    if (data.requesterId !== uid) {
      throw new HttpsError('permission-denied', 'Only the approved requester can claim the admin token')
    }

    const token = await getAuth().createCustomToken(uid, { roomAdmin: roomId })
    return { token }
  }
)

exports.cleanup = onSchedule(
  {
    schedule: 'every 24 hours',
    timeZone: 'Europe/London',
    region
  },
  async () => {
    try {
      const today = new Date()
      const year = today.getUTCFullYear()
      const month = today.getUTCMonth() + 1
      const day = today.getUTCDate()
      const yearMonthDay = year + (month < 10 ? '0' + month : month) + (day < 10 ? '0' + day : day)

      console.log(`Starting cleanup for date: ${yearMonthDay}`)

      const database = db()
      const snapshot = await database.ref('storyPoints').get()
      const data = snapshot.val()

      if (!data) {
        console.log('No data to clean up')
        return null
      }

      const dates = Object.keys(data).filter(ymd => ymd !== yearMonthDay)
      console.log(`Found ${dates.length} old date(s) to remove`)

      for (const ymd of dates) {
        await database.ref(`storyPoints/${ymd}`).remove()
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
