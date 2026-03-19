/* istanbul ignore file */
import './firebase-init'

import AlertService from './component/alert/alert'
import RealtimeDatabase from './features/database'

import './component/core-css'
import './component/poker-cards'
import './component/team-story-points'
import './component/share-link'
import './component/dialog'

import { initLanding } from './component/landing'

async function main () {
  initLanding()

  AlertService.init()

  await RealtimeDatabase.init()
  AlertService.announce('Application is ready to use')
}

main()
