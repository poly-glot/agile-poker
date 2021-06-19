import * as firebase from 'firebase'
import paramsManager from './params'
import authDialog from '../auth-dialog'

export class RealtimeDatabase {
  constructor (params = paramsManager) {
    this.params = params

    /** @type {firebase.functions.Functions} */
    this.functions = firebase.functions()
  }

  async init () {
    this.onUserStateChange()
  }

  onUserStateChange () {
    firebase.auth().onAuthStateChanged(async (user) => {
      authDialog.toggleVisibilityBasedOnAuth(user)
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
}

export default new RealtimeDatabase()
