import { AuthDialog } from './index'
import database from '../database'

jest.mock('../../component/alert/alert')

jest.mock('../database', () => {
  return {
    signIn: jest.fn()
  }
})

jest.mock('dialog-polyfill', () => ({
  registerDialog: (elem) => {
    elem.showModal = jest.fn()
  }
}))

describe('Auth Dialog test', () => {
  /** @type{AuthDialog} * */
  let instance

  beforeEach(() => {
    instance = new AuthDialog()
  })

  describe('Given dialog is not displayed', () => {
    describe('When application request to show dialog', () => {
      let spyLocalStorage

      beforeEach(() => {
        spyLocalStorage = jest.spyOn(window, 'localStorage', 'get')
      })

      describe('AND localStorage is available', () => {
        beforeEach(() => {
          spyLocalStorage.mockReturnValue({})
          instance.show()
        })

        it('Then it display the login dialog', () => {
          expect(instance.isDisplayed()).toBeTruthy()
        })

        it('And allowed user to submit the form', () => {
          expect(instance.loginDialog.querySelector('[type=submit]').disabled).toBeFalsy()
          expect(instance.loginDialog.querySelector('#localstorageRequired')).toBeFalsy()
        })
      })

      describe('OR localStorage is not available', () => {
        beforeEach(() => {
          spyLocalStorage.mockReturnValue(null)
          instance.show()
        })

        it('Then it display the login dialog', () => {
          expect(instance.isDisplayed()).toBeTruthy()
        })

        it('And disable the submit button and show the warning', () => {
          expect(instance.loginDialog.querySelector('[type=submit]').disabled).toBeTruthy()
          expect(instance.loginDialog.querySelector('#localstorageRequired')).toBeTruthy()
        })
      })
    })
  })

  describe('Given dialog is displayed', () => {
    beforeEach(() => {
      instance.show()
    })

    describe('When multiple dialog display requests received', () => {
      beforeEach(() => {
        instance.show()
        instance.show()
      })

      it('Then discard them and display dialog once', () => {
        expect(document.querySelectorAll('.auth-dialog')).toHaveLength(1)
      })
    })

    describe('When user logged in successfully', () => {
      beforeEach(() => {
        instance.hide()
      })

      it('Then remove the dialog', () => {
        expect(document.querySelectorAll('.auth-dialog')).toHaveLength(0)
      })
    })

    describe('Given dialog is displayed AND user submit the form', () => {
      beforeEach(() => {
        instance.show()
      })

      describe.each`
            username                  | expectedError                   | dispatchEventTimed
            ${''}                     | ${'Invalid username supplied'}  | ${0}
            ${'a'.repeat(100)}  | ${'Invalid username supplied'}  | ${0}
            ${'okusername'}           | ${''}                           | ${1}
          `(
        'Username is $username',
        ({ username, expectedError, dispatchEventTimed }) => {
          let form
          let error
          beforeEach(() => {
            form = instance.loginDialog.querySelector('form')
            error = form.querySelector('.form__error')

            form.querySelector('[name=username]').value = username
            form.dispatchEvent(new Event('submit', { bubbles: true }))
          })

          it(`Show display error message "${expectedError}"`, () => {
            expect(error.innerHTML).toEqual(expectedError)
          })

          it(`Informed application about login request ${dispatchEventTimed} times`, () => {
            expect(database.signIn).toHaveBeenCalledTimes(dispatchEventTimed)

            if (dispatchEventTimed > 0) {
              expect(database.signIn).toHaveBeenCalledWith(username)
            }
          })
        }
      )
    })
  })
})
