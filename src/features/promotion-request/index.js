import { getApp } from 'firebase/app'
import { getAuth, signInWithCustomToken } from 'firebase/auth'
import { getDatabase, ref, onValue, off } from 'firebase/database'
import { getFunctions, httpsCallable } from 'firebase/functions'
import AlertService from '../../component/alert/alert'
import toolbar from '../toolbar'

import './index.css'

const FUNCTIONS_REGION = 'europe-west1'
const TIMER_CIRCUMFERENCE = 2 * Math.PI * 52 // ~326.73, matches SVG circle r=52

export class PromotionRequest {
  constructor () {
    this.dialog = null
    this.countdownInterval = null
    this.listenerRef = null
    this.currentRoomId = null
    this.currentUid = null
    this.isAdmin = false
    this.totalDuration = 60
  }

  /**
   * Start listening for promotion requests in a room.
   * Called when user joins a room.
   */
  listen (roomId, uid, isAdmin) {
    this.currentRoomId = roomId
    this.currentUid = uid
    this.isAdmin = isAdmin
    this.stopListening()

    const db = getDatabase()
    this.listenerRef = ref(db, `promotionRequests/${roomId}`)

    let isInitialCallback = true

    onValue(this.listenerRef, (snapshot) => {
      if (!snapshot.exists()) {
        isInitialCallback = false
        return
      }

      const data = snapshot.val()

      if (isInitialCallback) {
        isInitialCallback = false
        // On initial load, only show dialog for active pending votes.
        // Ignore stale resolved requests from previous sessions.
        if (data.status === 'pending' && Date.now() < data.expiresAt) {
          this.showVoteDialog(data)
        }
        return
      }

      // Real-time updates after initial load
      if (data.status === 'pending') {
        this.showVoteDialog(data)
      } else if (data.status === 'approved' || data.status === 'denied') {
        this.showResult(data)
      }
    }, (error) => {
      console.error('Promotion listener error:', error)
      AlertService.announce('Promotion listener error: ' + error.message)
    })
  }

  stopListening () {
    if (this.listenerRef) {
      off(this.listenerRef)
      this.listenerRef = null
    }
  }

  /**
   * Request admin promotion (called by non-admin user).
   */
  async requestPromotion () {
    if (!this.currentRoomId) return

    const btn = document.querySelector('#js-request-admin')
    if (btn) {
      btn.disabled = true
      btn.textContent = 'Requesting...'
    }

    try {
      const functions = getFunctions(getApp(), FUNCTIONS_REGION)
      const requestFn = httpsCallable(functions, 'requestAdminPromotion')
      const { data: result } = await requestFn({ roomId: this.currentRoomId })
      AlertService.announce('Admin promotion request submitted')

      // If the server resolved immediately (sole member), show the result
      // directly from the response data — avoids needing a DB read.
      if (result.resolved && result.requestData) {
        this.showResult(result.requestData)
      } else if (!this.dialog) {
        // For non-immediate resolution, the listener should fire when
        // the DB update arrives. As a fallback, force a read after a delay.
        setTimeout(() => {
          if (!this.dialog) {
            this.forceRefresh()
          }
        }, 500)
      }
    } catch (err) {
      const message = err.message || 'Failed to request admin promotion'
      AlertService.announce(message)
      // Re-enable button on error
      if (btn) {
        btn.disabled = false
        btn.textContent = 'Request Admin Access'
      }
    }
  }

  /**
   * Force a one-time read to catch missed listener events.
   */
  forceRefresh () {
    if (!this.listenerRef) return
    const db = getDatabase()
    const freshRef = ref(db, `promotionRequests/${this.currentRoomId}`)
    onValue(freshRef, (snapshot) => {
      if (!snapshot.exists()) return
      const data = snapshot.val()
      if (data.status === 'pending') {
        this.showVoteDialog(data)
      } else if (data.status === 'approved' || data.status === 'denied') {
        this.showResult(data)
      }
    }, { onlyOnce: true })
  }

  /**
   * Cast a vote on the current promotion request.
   */
  async vote (approve) {
    if (!this.currentRoomId) return

    try {
      const functions = getFunctions(getApp(), FUNCTIONS_REGION)
      const voteFn = httpsCallable(functions, 'voteOnPromotion')
      await voteFn({ roomId: this.currentRoomId, vote: approve })
    } catch (err) {
      const message = err.message || 'Failed to submit vote'
      AlertService.announce(message)
    }
  }

  /**
   * Trigger server-side resolution after timeout.
   */
  async triggerResolve () {
    if (!this.currentRoomId) return

    try {
      const functions = getFunctions(getApp(), FUNCTIONS_REGION)
      const resolveFn = httpsCallable(functions, 'resolvePromotion')
      await resolveFn({ roomId: this.currentRoomId })
    } catch {
      // Resolution may have already happened via early majority
    }
  }

  showVoteDialog (data) {
    // If dialog is already showing, just update it
    if (this.dialog) {
      this.updateVoteDisplay(data)
      return
    }

    const template = document.getElementById('dialogs')
    const dialog = template.content.querySelector('#promotionDialog').cloneNode(true)
    dialog.removeAttribute('id')
    dialog.classList.add('promotion-vote-dialog')

    // Set requester name
    dialog.querySelector('[data-cy=promotion-requester]').textContent = data.requesterName

    // Wire close button
    const closeBtn = dialog.querySelector('.dialog__close')
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeDialog())
    }

    // Wire vote buttons
    const approveBtn = dialog.querySelector('[data-cy=promotion-approve]')
    const rejectBtn = dialog.querySelector('[data-cy=promotion-reject]')

    approveBtn.addEventListener('click', () => {
      this.vote(true)
      approveBtn.disabled = true
      rejectBtn.disabled = true
    })

    rejectBtn.addEventListener('click', () => {
      this.vote(false)
      approveBtn.disabled = true
      rejectBtn.disabled = true
    })

    document.body.appendChild(dialog)
    dialog.showModal()
    this.dialog = dialog

    // If user already voted, disable buttons
    if (data.votes && data.votes[this.currentUid]) {
      approveBtn.disabled = true
      rejectBtn.disabled = true
    }

    this.updateVoteDisplay(data)
    this.startCountdown(data.expiresAt)
  }

  updateVoteDisplay (data) {
    if (!this.dialog) return

    const votesContainer = this.dialog.querySelector('[data-cy=promotion-votes]')
    votesContainer.innerHTML = ''

    const votes = data.votes || {}

    // Compute vote stats
    let approveCount = 0
    let rejectCount = 0
    for (const [, voteData] of Object.entries(votes)) {
      if (voteData.vote === true) approveCount++
      else rejectCount++
    }
    const votedCount = Object.keys(votes).length
    const pendingCount = Math.max(0, (data.memberCount || 0) - votedCount)

    // Update stat counters with bump animation
    this.updateStatCounter('[data-cy=promotion-approve-count]', approveCount)
    this.updateStatCounter('[data-cy=promotion-reject-count]', rejectCount)
    this.updateStatCounter('[data-cy=promotion-pending-count]', pendingCount)

    // Show all votes
    for (const [, voteData] of Object.entries(votes)) {
      const entry = document.createElement('div')
      entry.className = 'promotion-dialog__vote-entry'

      const name = document.createElement('span')
      name.className = 'promotion-dialog__vote-name'
      name.textContent = voteData.name

      const status = document.createElement('span')
      status.className = 'promotion-dialog__vote-status'

      if (voteData.vote === true) {
        status.textContent = 'Approved'
        status.classList.add('vote-approve')
      } else {
        status.textContent = 'Rejected'
        status.classList.add('vote-reject')
      }

      entry.appendChild(name)
      entry.appendChild(status)
      votesContainer.appendChild(entry)
    }

    // Show pending count
    if (pendingCount > 0) {
      const pending = document.createElement('div')
      pending.className = 'promotion-dialog__vote-entry'

      const label = document.createElement('span')
      label.className = 'promotion-dialog__vote-name'
      label.textContent = `${pendingCount} member${pendingCount > 1 ? 's' : ''} pending`

      const status = document.createElement('span')
      status.className = 'promotion-dialog__vote-status vote-pending'
      status.textContent = 'Waiting...'

      pending.appendChild(label)
      pending.appendChild(status)
      votesContainer.appendChild(pending)
    }

    // If the current user already voted, ensure buttons are disabled
    if (data.votes && data.votes[this.currentUid]) {
      const approveBtn = this.dialog.querySelector('[data-cy=promotion-approve]')
      const rejectBtn = this.dialog.querySelector('[data-cy=promotion-reject]')
      if (approveBtn) approveBtn.disabled = true
      if (rejectBtn) rejectBtn.disabled = true
    }
  }

  updateStatCounter (selector, value) {
    if (!this.dialog) return
    const el = this.dialog.querySelector(selector)
    if (!el) return
    const prev = el.textContent
    el.textContent = value
    if (prev !== '' && prev !== String(value)) {
      el.classList.add('stat-bump')
      setTimeout(() => el.classList.remove('stat-bump'), 300)
    }
  }

  startCountdown (expiresAt) {
    this.clearCountdown()

    const countdownEl = this.dialog?.querySelector('[data-cy=promotion-countdown]')
    const timerEl = this.dialog?.querySelector('.promotion-dialog__timer')
    const progressRing = this.dialog?.querySelector('.promotion-timer-progress')
    const timerRingContainer = this.dialog?.querySelector('.promotion-dialog__timer-ring')
    if (!countdownEl) return

    // Compute total duration from expiresAt for ring progress
    this.totalDuration = Math.max(1, Math.ceil((expiresAt - Date.now()) / 1000))

    this.countdownInterval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
      countdownEl.textContent = remaining

      // Update circular progress ring
      if (progressRing) {
        const fraction = remaining / this.totalDuration
        const offset = TIMER_CIRCUMFERENCE * (1 - fraction)
        progressRing.style.strokeDashoffset = offset

        // Color transitions: green → yellow (≤20s) → red (≤10s)
        progressRing.classList.remove('timer-warning', 'timer-urgent')
        if (timerRingContainer) {
          timerRingContainer.classList.remove('timer-warning', 'timer-urgent')
        }
        if (remaining <= 10) {
          progressRing.classList.add('timer-urgent')
          if (timerRingContainer) timerRingContainer.classList.add('timer-urgent')
        } else if (remaining <= 20) {
          progressRing.classList.add('timer-warning')
          if (timerRingContainer) timerRingContainer.classList.add('timer-warning')
        }
      }

      if (remaining <= 10 && timerEl) {
        timerEl.classList.add('timer-urgent')
      }

      if (remaining <= 0) {
        this.clearCountdown()
        this.triggerResolve()
      }
    }, 1000)
  }

  clearCountdown () {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval)
      this.countdownInterval = null
    }
  }

  async showResult (data) {
    const isApproved = data.status === 'approved'

    if (isApproved && data.requesterId === this.currentUid) {
      // Requester got approved — claim and sign in with the admin token
      try {
        let token = data.newToken
        if (!token) {
          // Non-immediate resolution: token not in data, claim it from the server
          const functions = getFunctions(getApp(), FUNCTIONS_REGION)
          const claimFn = httpsCallable(functions, 'claimAdminToken')
          const { data: claimResult } = await claimFn({ roomId: this.currentRoomId })
          token = claimResult.token
        }
        const auth = getAuth()
        await signInWithCustomToken(auth, token)
        this.isAdmin = true
        toolbar.enableAdminControls()
        toolbar.removeRequestAdminButton()
      } catch {
        // Token claim or sign-in failed, admin controls won't enable
      }
    } else if (isApproved && this.isAdmin && data.requesterId !== this.currentUid) {
      // Current user was the old admin — revoke admin controls
      this.isAdmin = false
      toolbar.disableAdminControls()
      toolbar.enableRequestAdmin(() => this.requestPromotion())
    }

    // If the dialog doesn't exist yet (e.g. immediate resolution arrived
    // before showVoteDialog had a chance to run), create it now to show the result.
    if (!this.dialog) {
      const template = document.getElementById('dialogs')
      const dialog = template.content.querySelector('#promotionDialog').cloneNode(true)
      dialog.removeAttribute('id')
      dialog.classList.add('promotion-vote-dialog')
      dialog.querySelector('[data-cy=promotion-requester]').textContent = data.requesterName
      const closeBtn = dialog.querySelector('.dialog__close')
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.closeDialog())
      }
      document.body.appendChild(dialog)
      dialog.showModal()
      this.dialog = dialog
    }

    // Hide vote buttons, show result
    const actions = this.dialog.querySelector('[data-cy=promotion-actions]')
    const result = this.dialog.querySelector('[data-cy=promotion-result]')
    const resultText = this.dialog.querySelector('[data-cy=promotion-result-text]')

    if (actions) actions.hidden = true
    this.clearCountdown()

    const timerEl = this.dialog.querySelector('.promotion-dialog__timer')
    if (timerEl) timerEl.hidden = true

    const timerRing = this.dialog.querySelector('.promotion-dialog__timer-ring')
    if (timerRing) timerRing.hidden = true

    if (result && resultText) {
      result.hidden = false
      result.classList.add(isApproved ? 'result-approved' : 'result-denied')

      if (isApproved) {
        resultText.textContent = `${data.requesterName} has been promoted to admin.`
      } else {
        resultText.textContent = `Admin promotion for ${data.requesterName} was denied.`
      }
    }

    // Update the final vote display
    this.updateVoteDisplay(data)

    // Auto-close after 5 seconds
    setTimeout(() => this.closeDialog(), 5000)
  }

  closeDialog () {
    this.clearCountdown()
    if (this.dialog) {
      this.dialog.remove()
      this.dialog = null
    }
  }
}

export default new PromotionRequest()
