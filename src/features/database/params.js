export class Params {
  constructor (localStorage = window.localStorage, queryString = window.location.search) {
    this.localStorage = localStorage
    this.queryString = queryString
  }

  hasRoomId () {
    return this.roomId
  }

  hasNotRoomId () {
    return !this.roomId
  }

  get username () {
    return this.localStorage.get('AGILE_POKER_USERNAME')
  }

  get securityCode () {
    return this.localStorage.get('AGILE_POKER_CODE')
  }

  set username (value) {
    this.localStorage.set('AGILE_POKER_USERNAME', value)
  }

  set securityCode (value) {
    this.localStorage.set('AGILE_POKER_CODE', value)
  }

  get roomId () {
    return this.params.get('roomId')
  }

  get yearMonth () {
    return this.params.get('yearMonth')
  }

  get params () {
    return new URLSearchParams(this.queryString)
  }
}

export default new Params()
