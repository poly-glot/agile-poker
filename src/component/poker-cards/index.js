import './index.css'

export class PokerCards {
  constructor (elem) {
    /** @type {HTMLFormElement} */
    this.elem = elem
  }

  onUserPointed (callback) {
    this.elem.addEventListener('change', () => {
      const newPoint = parseInt(this.elem.querySelector('[name=storyPoints]:checked').value, 10)
      callback(newPoint)
    })
  }
}

export default new PokerCards(document.getElementById('story-points-form'))
