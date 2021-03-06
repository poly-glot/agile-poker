/* istanbul ignore file */
import './firebase-init'

import AlertService from './component/alert/alert'
import RealtimeDatabase from './features/database'

import './component/core-css'
import './component/poker-cards'
import './component/team-story-points'
import './component/share-link'
import './component/dialog'

async function main () {
  AlertService.init()

  await RealtimeDatabase.init()
  AlertService.announce('Application is ready to use')
}

main()
