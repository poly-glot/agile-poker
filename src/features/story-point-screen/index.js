import AlertService from '../../component/alert/alert'
import database from '../database'
import paramsManager from '../database/params'
import roomDialog from '../room-dialog'
import { TeamStoryPoints } from '../../component/team-story-points'
import pokerCards from '../../component/poker-cards'

export class StoryPointScreen {
  constructor () {
    this.teamStoryPointsList = new TeamStoryPoints(document.querySelector('.team-story-points'))
    this.uid = null
  }

  /***
   * Hydrate user journey
   *
   * @param {firebase.User} user
   */
  async resumeJourney (user) {
    if (!user) {
      return
    }

    this.uid = user.uid

    const { claims } = await user.getIdTokenResult()

    // Restore room administration link
    if (paramsManager.hasNotRoomId()) {
      if (claims.roomAdmin) {
        roomDialog.redirectToRoom(claims.roomAdmin)
      } else {
        roomDialog.show()
      }
    }

    if (paramsManager.hasRoomId()) {
      pokerCards.onUserPointed(this.onUserPointHandler)

      this.enableStoryPoints()
    }
  }

  enableStoryPoints () {
    document.querySelectorAll('.poker-card input[type=radio]')
      .forEach(input => {
        input.disabled = false
      })
  }

  /***
   * Submit user story points
   *
   * @param {number} newPoint
   * @return {Promise<void>}
   */
  onUserPointHandler = async (newPoint) => {
    await database.submitStoryPoints(newPoint)
    AlertService.announce(`Your ${newPoint} story points has been submitted`)
  }
}

export default new StoryPointScreen()
