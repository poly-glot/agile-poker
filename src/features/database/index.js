import { getDatabase, ref, get, update, set, onValue, onChildAdded, onChildChanged, onChildRemoved } from 'firebase/database'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getAuth, onAuthStateChanged, signInWithCustomToken, updateProfile, signOut as firebaseSignOut } from 'firebase/auth'

import debounce from 'lodash.debounce'

import paramsManager from './params'
import authDialog from '../auth-dialog'
import storyPointScreen from '../story-point-screen'
import { StoryPoints } from '../../component/team-story-points'

export class RealtimeDatabase {
  constructor (params = paramsManager) {
    this.params = params

    /** @type {firebase.database.Reference} */
    this.roomRef = null

    /** @type {firebase.database.Reference} */
    this.storyPointRef = null
  }

  async init () {
    this.onUserStateChange()
  }

  onUserStateChange () {
    const auth = getAuth()
    onAuthStateChanged(auth, async (user) => {
      authDialog.toggleVisibilityBasedOnAuth(user)
      await storyPointScreen.resumeJourney(user)
    })
  }

  signIn (username) {
    return new Promise((resolve, reject) => {
      (async () => {
        const functions = getFunctions()
        const loginFunction = httpsCallable(functions, 'login')

        try {
          const auth = getAuth()
          const { data: { token } } = await loginFunction({ username })
          signInWithCustomToken(auth, token)
          await updateProfile(auth.currentUser, { displayName: username })
          resolve(true)
        } catch (err) {
          reject(err.message)
        }
      })()
    })
  }

  async signOut () {
    const auth = getAuth()
    await firebaseSignOut(auth)
  }

  async submitStoryPoints (points) {
    await set(this.storyPointRef, points)
  }

  createRoom () {
    return new Promise((resolve, reject) => {
      (async () => {
        const functions = getFunctions()
        const loginFunction = httpsCallable(functions, 'createRoom')

        try {
          const auth = getAuth()
          const { data: { token, uid, roomId } } = await loginFunction()
          await signInWithCustomToken(auth, token)
          await updateProfile(auth.currentUser, { displayName: uid })
          resolve(roomId)
        } catch (err) {
          reject(err.message)
        }
      })()
    })
  }

  async signIntoRoom (roomId, uid) {
    const today = new Date()
    const year = today.getUTCFullYear()
    const month = today.getUTCMonth() + 1
    const day = today.getUTCDate()

    const yearMonthDay = year + (month < 10 ? '0' + month : month) + (day < 10 ? '0' + day : day)
    const db = getDatabase()

    this.roomKey = `storyPoints/${yearMonthDay}/${roomId}`
    this.roomRef = ref(db, this.roomKey)
    this.storyPointRef = ref(db, `${this.roomKey}/${uid}`)

    const hasPointed = await get(this.storyPointRef)
    if (!hasPointed.exists()) {
      await this.submitStoryPoints(-1)
    }
  }

  async resetStoryPoints () {
    const db = getDatabase()

    const snapshot = await get(this.roomRef)
    const usernames = Object.keys(snapshot.val()).filter(n => n !== 'revealPoints')

    const uniqueRandomNumber = Math.floor((Math.random() * (100 - 2) + 2)) * -1

    const updates = {
      [this.roomKey + '/revealPoints']: uniqueRandomNumber
    }
    usernames.forEach(username => {
      updates[this.roomKey + '/' + username] = StoryPoints.NOT_POINTED_INT
    })

    await update(ref(db), updates)
  }

  async hideStoryPoints () {
    const db = getDatabase()
    await set(ref(db, this.roomKey + '/revealPoints'), -1)
  }

  async revealStoryPoints () {
    const db = getDatabase()
    await set(ref(db, this.roomKey + '/revealPoints'), 1)
  }

  async onRoomReset (callback) {
    if (!this.roomRef) {
      throw new Error('You are not logged into room')
    }

    const db = getDatabase()
    const pointRef = ref(db, this.roomKey + '/revealPoints')
    onValue(pointRef, (snapshot) => {
      const value = snapshot.val()
      if (value < -1) {
        callback()
      }
    })
  }

  async listenRoomChanges (onRoomChanges = () => {}) {
    if (!this.roomRef) {
      throw new Error('You are not logged into room')
    }

    const state = new Map()

    const notifyChanges = debounce(() => {
      const stateArr = []
      state.forEach((points, name) => {
        stateArr.push({ points, name })
      })

      onRoomChanges(stateArr)
    }, 200)

    onChildRemoved(this.roomRef, (snapshot) => {
      state.delete(snapshot.key)
      notifyChanges()
    })

    onChildChanged(this.roomRef, (snapshot) => {
      state.set(snapshot.key, snapshot.val())
      notifyChanges()
    })

    onChildAdded(this.roomRef, (snapshot) => {
      state.set(snapshot.key, snapshot.val())
      notifyChanges()
    })
  }
}

export default new RealtimeDatabase()
