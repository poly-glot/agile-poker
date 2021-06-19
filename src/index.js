/* istanbul ignore file */

import AlertService from './component/alert/alert'

import './component/core-css'
import './component/poker-cards'
import './component/team-story-points'
import './component/share-link'
import './component/dialog'

import authDialog from './features/auth-dialog'

async function main () {
  AlertService.init()
  AlertService.announce('Application is ready to use')

  authDialog.show()
}

main()
