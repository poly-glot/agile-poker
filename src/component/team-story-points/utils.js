import { StoryPoints } from './index'

/**
 * Sort list by highest story points
 *
 * The Order of Story points will be intact if
 * - Room Admin has not reveal the story points
 * - User has not pointed yet
 *
 * @param {Array<MemberEstimate>} list
 */
export function sortListByHighestStoryPoints (/* @type {Array<MemberEstimate>} */ list) {
  return list.map(({ name, points }) => {
    const newPoints = typeof points === 'number' ? points : parseInt(points, 10)
    return { name, points: Number.isNaN(newPoints) ? StoryPoints.NOT_POINTED_INT : newPoints }
  })
    .sort((a, b) => {
      if (Number.isNaN(a.points)) {
        return 0
      }

      if (a.points === StoryPoints.NOT_POINTED_INT) {
        return 0
      }

      if (a.points === StoryPoints.HIDDEN_INT) {
        return 0
      }

      return b.points - a.points
    }).sort((a, b) => {
      if (a.points === b.points) {
        return a.name.localeCompare(b.name)
      }

      return 0
    })
}

/**
 * Group list by story points
 *
 * @param {Array<MemberEstimate>} list
 */
export function groupByStoryPoints (list) {
  const grouped = new Map()

  sortListByHighestStoryPoints(list).forEach(item => {
    const { points, name } = item

    const key = points
    const previous = grouped.has(key) ? grouped.get(key) : []
    previous.push(name)

    grouped.set(key, previous)
  })

  return grouped
}

/***
 * Has user pointed the story
 *
 * @param {MemberEstimate} item
 * @return {boolean}
 */
export function isPointed (item) {
  const { points } = item

  if (!points) {
    return false
  }

  return !(points === StoryPoints.NOT_POINTED_INT || points === StoryPoints.NOT_POINTED)
}

export function isNotPointed (item) {
  return !isPointed(item)
}

/***
 * Has admin reveal story points
 *
 * @param {MemberEstimate} item
 * @return {boolean}
 */
export function isPointReveal (item) {
  const { points } = item

  if (isNotPointed(item)) {
    return false
  }

  return !(points === StoryPoints.HIDDEN_INT || points === StoryPoints.HIDDEN)
}
