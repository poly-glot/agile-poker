import database from '../database'
import AlertService from '../../component/alert/alert'

import './index.css'

export class Toolbar {
  constructor (elem) {
    /** @type {HTMLDivElement} */
    this.elem = elem
    this.setupEvents()
  }

  setupEvents () {
    this.signOutButton.addEventListener('click', this.onSignOut)
  }

  onSignOut = async () => {
    await database.signOut()
    AlertService.announce('Successfully signed out')
  }

  get signOutButton () {
    return this.elem.querySelector('#js-signout')
  }
}

export default new Toolbar(document.querySelector('.site__toolbar'))
