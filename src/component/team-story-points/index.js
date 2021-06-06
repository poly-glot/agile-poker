import './index.css'
import { groupByStoryPoints } from './utils'

export const StoryPoints = Object.freeze({
  NOT_POINTED: '-1',
  HIDDEN: '-2',
  NOT_POINTED_INT: -1,
  HIDDEN_INT: -2
})

/**
 * @typedef {Object} MemberEstimate
 * @property {string} name - Name
 * @property {number} points - Story Points
 */

export class TeamStoryPoints {
  constructor (elem) {
    /** @type {HTMLElement} */
    this.container = elem
    this.content = this.container.querySelector('.team-story-points__content')
    this.template = this.container.querySelector('#teamStoryPointsTemplate')
  }

  /**
     * Render points grouped by story points.
     *
     * @param {Array<MemberEstimate>} list
     */
  render (list) {
    this.content.innerHTML = ''

    if (!Array.isArray(list) || list.length === 0) {
      return
    }

    const pointedList = list.filter(({ points }) => points > 0)
    const waitingList = list.filter(({ points }) => points < 0)

    for (const [points, values] of groupByStoryPoints(pointedList)) {
      const row = this.template.content.cloneNode(true)
      row.querySelector('.team-story-points__name').innerHTML = values.join(', ')
      row.querySelector('.team-story-points__points').innerHTML = points

      this.content.appendChild(row)
    }

    for (const { points, name } of waitingList) {
      const row = this.template.content.cloneNode(true)
      row.querySelector('.team-story-points__name').innerHTML = name

      const removeIcon = points === StoryPoints.HIDDEN_INT
        ? '.team-story-points__userwaiting'
        : '.team-story-points__adminwaiting'

      row.querySelector(removeIcon).remove()

      this.content.appendChild(row)
    }

    return this.content.innerHTML
  }
}
