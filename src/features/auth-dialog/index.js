import dialogPolyfill from 'dialog-polyfill'
import AlertService from '../../component/alert/alert'

/**
 * Request user to provide
 */
export class AuthDialog {
  toggleVisibilityBasedOnAuth (user) {
    if (!user) {
      this.show()
    } else {
      this.hide()
    }
  }

  show = () => {
    if (this.isDisplayed()) {
      return
    }

    const template = document.getElementById('dialogs')

    const dialog = template.content.querySelector('#authDialog').cloneNode(true)
    dialog.removeAttribute('id')
    dialog.classList.add('auth-dialog')
    dialogPolyfill.registerDialog(dialog)

    const form = dialog.querySelector('form')
    form.addEventListener('submit', this.onFormSubmit)

    if (window.localStorage) {
      form.querySelector('#localstorageRequired').remove()
    } else {
      form.querySelector('[type=submit]').disabled = true
    }

    document.body.appendChild(dialog)
    dialog.showModal()
  }

  hide = () => {
    this.loginDialog?.remove()
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
    const { value } = form.querySelector('[name=username]')

    this.setError(false)

    submit.disabled = true

    if (!value || value.trim().length === 0 || value.length > 32) {
      this.setError('Invalid username supplied')
      return
    }

  }

  setError (errorMsg) {
    const form = this.loginDialog.querySelector('form')

    /** @type {HTMLButtonElement} */
    const submit = form.querySelector('button[type=submit]')

    /** @type {HTMLInputElement} */
    const username = form.querySelector('[name=username]')

    /** @type {HTMLDivElement} */
    const error = form.querySelector('.form__error')

    if (errorMsg) {
      username.setAttribute('aria-invalid', 'true')
      error.innerHTML = errorMsg
      submit.disabled = false

      username.focus()
    } else {
      username.removeAttribute('aria-invalid')
      error.innerHTML = ''
    }
  }

  isDisplayed () {
    return !!this.loginDialog
  }

  isNotDisplayed () {
    return !this.isDisplayed()
  }

  /***
   *
   * @returns {HTMLDialogElement}
   */
  get loginDialog () {
    return document.querySelector('.auth-dialog')
  }
}

export default new AuthDialog()
