/* istanbul ignore file */

import AlertService from './component/alert/alert'

import './component/core-css'
import './component/poker-cards'
import './component/team-story-points'
import './component/share-link'

async function main () {
  AlertService.init()
  AlertService.announce('Application is ready to use')
}

main()
