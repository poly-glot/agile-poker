import dialogPolyfill from 'dialog-polyfill'

export class RoomDialog {
  show = () => {
    if (this.isDisplayed()) {
      return
    }

    const template = document.getElementById('dialogs')

    const dialog = template.content.querySelector('#roomDialog').cloneNode(true)
    dialog.removeAttribute('id')
    dialog.classList.add('room-dialog')
    dialogPolyfill.registerDialog(dialog)

    const form = dialog.querySelector('form')
    form.addEventListener('submit', this.onFormSubmit)

    document.body.appendChild(dialog)
    dialog.showModal()
  }

  hide = () => {
    this.roomDialog?.remove()
  }

  /**
   * Handle dialog form validation
   *
   * @param {Event} evt
   */
  onFormSubmit = async (evt) => {
    evt.preventDefault()

    const { target: form } = evt

    const submit = form.querySelector('button[type=submit]')
    this.setError(false)

    submit.disabled = true

    try {
      const roomId = 'xyz'
      this.redirectToRoom(roomId)

      this.hide()
    } catch (err) {
      this.setError(err.toString())
    }
  }

  setError (errorMsg) {
    const form = this.roomDialog.querySelector('form')

    /** @type {HTMLButtonElement} */
    const submit = form.querySelector('button[type=submit]')

    /** @type {HTMLDivElement} */
    const error = form.querySelector('.form__error')

    if (errorMsg) {
      error.innerHTML = errorMsg
      submit.disabled = false
      submit.focus()
    } else {
      error.innerHTML = ''
    }
  }

  isDisplayed () {
    return !!this.roomDialog
  }

  isNotDisplayed () {
    return !this.isDisplayed()
  }

  redirectToRoom (roomId) {
    const url = new URL(window.location.toString())
    url.searchParams.set('roomId', roomId)

    window.location = url.toString()
  }

  /***
   *
   * @returns {HTMLDialogElement}
   */
  get roomDialog () {
    return document.querySelector('.room-dialog')
  }
}

export default new RoomDialog()
