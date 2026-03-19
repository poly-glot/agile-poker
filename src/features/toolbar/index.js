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
    // Remove request admin button if it exists (user was just promoted)
    this.removeRequestAdminButton()

    if (this.elem.querySelector('#js-reset')) return

    const adminControls = this.adminControlsTemplate.content.cloneNode(true)
    this.elem.appendChild(adminControls)

    this.resetButton.addEventListener('click', this.onResetStoryPoints)
    this.hideStoryPointsButton.addEventListener('click', this.onHideStoryPoints)
    this.revealStoryPointsButton.addEventListener('click', this.onRevealStoryPoints)
  }

  disableAdminControls () {
    const reset = this.elem.querySelector('#js-reset')
    const hide = this.elem.querySelector('#js-hide')
    const reveal = this.elem.querySelector('#js-reveal')

    if (reset) {
      reset.removeEventListener('click', this.onResetStoryPoints)
      reset.remove()
    }
    if (hide) {
      hide.removeEventListener('click', this.onHideStoryPoints)
      hide.remove()
    }
    if (reveal) {
      reveal.removeEventListener('click', this.onRevealStoryPoints)
      reveal.remove()
    }
  }

  enableRequestAdmin (onRequest) {
    if (this.elem.querySelector('#js-request-admin')) return

    const template = this.elem.querySelector('.site__request-admin')
    if (!template) return

    const controls = template.content.cloneNode(true)
    this.elem.appendChild(controls)

    this.elem.querySelector('#js-request-admin')
      .addEventListener('click', onRequest)
  }

  removeRequestAdminButton () {
    const btn = this.elem.querySelector('#js-request-admin')
    if (btn) btn.remove()
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
