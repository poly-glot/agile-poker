import * as firebase from 'firebase'
import paramsManager from './params'
import authDialog from '../auth-dialog'
import storyPointScreen from '../story-point-screen'
import { StoryPoints } from '../../component/team-story-points'

export class RealtimeDatabase {
  constructor (params = paramsManager) {
    this.params = params

    /** @type {firebase.functions.Functions} */
    this.functions = firebase.functions()

    /** @type {firebase.database.Database} */
    this.database = firebase.database()

    /** @type {firebase.database.Reference} */
    this.roomRef = null

    /** @type {firebase.database.Reference} */
    this.storyPointRef = null
  }

  async init () {
    this.onUserStateChange()
  }

  onUserStateChange () {
    firebase.auth().onAuthStateChanged(async (user) => {
      authDialog.toggleVisibilityBasedOnAuth(user)
      await storyPointScreen.resumeJourney(user)
    })
  }

  signIn (username) {
    return new Promise((resolve, reject) => {
      (async () => {
        const loginFunction = this.functions.httpsCallable('login')

        try {
          const { data: { token } } = await loginFunction({ username })
          const { user } = await firebase.auth().signInWithCustomToken(token)
          await user.updateProfile({ displayName: username })
          resolve(true)
        } catch (err) {
          reject(err.message)
        }
      })()
    })
  }

  async signOut () {
    await firebase.auth().signOut()
  }

  async submitStoryPoints (points) {
    await this.storyPointRef.set(points)
  }

  createRoom () {
    return new Promise((resolve, reject) => {
      (async () => {
        const loginFunction = this.functions.httpsCallable('createRoom')

        try {
          const { data: { token, uid, roomId } } = await loginFunction()
          const { user } = await firebase.auth().signInWithCustomToken(token)
          await user.updateProfile({ displayName: uid })
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

    this.roomKey = `storyPoints/${yearMonthDay}/${roomId}`
    this.roomRef = this.database.ref(this.roomKey)
    this.storyPointRef = this.database.ref(`${this.roomKey}/${uid}`)

    const hasPointed = await this.storyPointRef.get()
    if (!hasPointed.exists()) {
      await this.submitStoryPoints(-1)
    }
  }

  async resetStoryPoints () {
    const snapshot = await this.roomRef.get()
    const usernames = Object.keys(snapshot.val()).filter(n => n !== 'revealPoints')

    const uniqueRandomNumber = Math.floor((Math.random() * (100 - 2) + 2)) * -1

    const updates = {
      [this.roomKey + '/revealPoints']: uniqueRandomNumber
    }
    usernames.forEach(username => {
      updates[this.roomKey + '/' + username] = StoryPoints.NOT_POINTED_INT
    })

    await firebase.database().ref().update(updates)
  }

  async hideStoryPoints () {
    await firebase.database().ref(this.roomKey + '/revealPoints').set(-1)
  }

  async revealStoryPoints () {
    await firebase.database().ref(this.roomKey + '/revealPoints').set(1)
  }

  async onRoomReset (callback) {
    if (!this.roomRef) {
      throw new Error('You are not logged into room')
    }

    const ref = firebase.database().ref(this.roomKey + '/revealPoints')
    ref.on('value', (snapshot) => {
      const value = snapshot.val()
      if (value < -1) {
        callback()
      }
    })
  }
}

export default new RealtimeDatabase()
