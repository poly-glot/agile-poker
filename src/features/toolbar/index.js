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

  enableAdminControls () {
    const adminControls = this.adminControlsTemplate.content.cloneNode(true)
    this.elem.appendChild(adminControls)

    this.resetButton.addEventListener('click', this.onResetStoryPoints)
    this.hideStoryPointsButton.addEventListener('click', this.onHideStoryPoints)
    this.revealStoryPointsButton.addEventListener('click', this.onRevealStoryPoints)
  }

  onSignOut = async () => {
    await database.signOut()
    AlertService.announce('Successfully signed out')
  }

  onHideStoryPoints = async () => {
    await database.hideStoryPoints()
    AlertService.announce('Team cannot see each other story points.')
  }

  onRevealStoryPoints = async () => {
    await database.revealStoryPoints()
    AlertService.announce('Story points are visible to the team')
  }

  onResetStoryPoints = async () => {
    await database.resetStoryPoints()
    AlertService.announce('Reset story points successfully')
  }

  get adminControlsTemplate () {
    return this.elem.querySelector('.site__admin')
  }

  get signOutButton () {
    return this.elem.querySelector('#js-signout')
  }

  get resetButton () {
    return this.elem.querySelector('#js-reset')
  }

  get revealStoryPointsButton () {
    return this.elem.querySelector('#js-reveal')
  }

  get hideStoryPointsButton () {
    return this.elem.querySelector('#js-hide')
  }
}

export default new Toolbar(document.querySelector('.site__toolbar'))
