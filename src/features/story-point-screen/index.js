import AlertService from '../../component/alert/alert'
import database from '../database'
import paramsManager from '../database/params'
import roomDialog from '../room-dialog'
import { StoryPoints, TeamStoryPoints } from '../../component/team-story-points'
import pokerCards from '../../component/poker-cards'
import toolbar from '../toolbar'
import { isNotPointed } from '../../component/team-story-points/utils'

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
      await database.signIntoRoom(paramsManager.roomId, user.uid)
      await database.listenRoomChanges(this.onRoomChangesHandler)
      await database.onRoomReset(this.onRoomReset)

      pokerCards.onUserPointed(this.onUserPointHandler)

      if (claims.roomAdmin === paramsManager.roomId) {
        toolbar.enableAdminControls()
      }

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

  /***
   * Callback when Room Admin reset the room
   *
   */
  onRoomReset () {
    const form = document.getElementById('story-points-form')
    form.reset()

    AlertService.announce('Story points are reset by admin')
  }

  /**
   * Render user points
   *
   * @param {Array<MemberEstimate>} changes
   */
  onRoomChangesHandler = (changes) => {
    const revealPoints = changes.find(item => item.name === 'revealPoints')
    const showPoints = revealPoints && revealPoints.points === 1

    const list = changes.filter(item => item.name !== 'revealPoints')
      .map(item => {
        let { points } = item

        if (!showPoints) {
          points = isNotPointed(item) ? StoryPoints.NOT_POINTED_INT : StoryPoints.HIDDEN_INT
        }

        return {
          ...item,
          points
        }
      })

    this.teamStoryPointsList.render(list)
  }
}

export default new StoryPointScreen()
