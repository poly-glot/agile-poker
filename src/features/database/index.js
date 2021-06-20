import * as firebase from 'firebase'
import paramsManager from './params'
import authDialog from '../auth-dialog'
import storyPointScreen from '../story-point-screen'

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

      //@TODO - wire this code after room admin logic
      this.storyPointRef = this.database.ref(`20210620/CA761233-ED42-11CE-BACD-00AA0057B124/${user.uid}`)
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
}

export default new RealtimeDatabase()
