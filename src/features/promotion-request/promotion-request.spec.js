import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PromotionRequest } from './index'

vi.mock('firebase/app', () => ({
  getApp: vi.fn(() => ({}))
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithCustomToken: vi.fn(() => Promise.resolve())
}))

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn((_db, path) => ({ path })),
  onValue: vi.fn(),
  off: vi.fn()
}))

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn()
}))

vi.mock('../../component/alert/alert', () => ({
  default: { announce: vi.fn() }
}))

vi.mock('../toolbar', () => ({
  default: {
    enableAdminControls: vi.fn(),
    disableAdminControls: vi.fn(),
    removeRequestAdminButton: vi.fn(),
    enableRequestAdmin: vi.fn()
  }
}))

describe('PromotionRequest', () => {
  /** @type {PromotionRequest} */
  let instance

  beforeEach(() => {
    instance = new PromotionRequest()
  })

  afterEach(() => {
    instance.closeDialog()
  })

  describe('constructor', () => {
    it('initialises with default state', () => {
      expect(instance.dialog).toBeNull()
      expect(instance.countdownInterval).toBeNull()
      expect(instance.listenerRef).toBeNull()
      expect(instance.currentRoomId).toBeNull()
      expect(instance.currentUid).toBeNull()
      expect(instance.isAdmin).toBe(false)
    })
  })

  describe('listen', () => {
    it('sets room state and creates a database listener', async () => {
      const { onValue, ref } = await import('firebase/database')

      instance.listen('room-123', 'user-1', false)

      expect(instance.currentRoomId).toBe('room-123')
      expect(instance.currentUid).toBe('user-1')
      expect(instance.isAdmin).toBe(false)
      expect(ref).toHaveBeenCalledWith(expect.anything(), 'promotionRequests/room-123')
      expect(onValue).toHaveBeenCalled()
    })

    it('stores admin state when user is admin', () => {
      instance.listen('room-123', 'user-1', true)

      expect(instance.isAdmin).toBe(true)
    })

    it('stops previous listener before creating a new one', async () => {
      const { off } = await import('firebase/database')

      instance.listen('room-1', 'user-1', false)
      const firstRef = instance.listenerRef

      instance.listen('room-2', 'user-1', false)

      expect(off).toHaveBeenCalledWith(firstRef)
    })
  })

  describe('stopListening', () => {
    it('removes the listener reference', async () => {
      const { off } = await import('firebase/database')

      instance.listen('room-123', 'user-1', false)
      const listenerRef = instance.listenerRef

      instance.stopListening()

      expect(off).toHaveBeenCalledWith(listenerRef)
      expect(instance.listenerRef).toBeNull()
    })

    it('does nothing when no listener exists', async () => {
      const { off } = await import('firebase/database')
      off.mockClear()

      instance.stopListening()

      expect(off).not.toHaveBeenCalled()
    })
  })

  describe('requestPromotion', () => {
    it('does nothing when no room is set', async () => {
      const { httpsCallable } = await import('firebase/functions')

      await instance.requestPromotion()

      expect(httpsCallable).not.toHaveBeenCalled()
    })

    it('disables the button and calls the cloud function', async () => {
      const { httpsCallable } = await import('firebase/functions')
      const mockFn = vi.fn(() => Promise.resolve({ data: { success: true } }))
      httpsCallable.mockReturnValue(mockFn)

      instance.currentRoomId = 'room-123'

      const btn = document.createElement('button')
      btn.id = 'js-request-admin'
      btn.textContent = 'Request Admin Access'
      document.body.appendChild(btn)

      await instance.requestPromotion()

      expect(btn.disabled).toBe(true)
      expect(btn.textContent).toBe('Requesting...')
      expect(mockFn).toHaveBeenCalledWith({ roomId: 'room-123' })

      btn.remove()
    })

    it('announces the submission via alert', async () => {
      const { httpsCallable } = await import('firebase/functions')
      const AlertService = (await import('../../component/alert/alert')).default
      const mockFn = vi.fn(() => Promise.resolve({ data: { success: true } }))
      httpsCallable.mockReturnValue(mockFn)

      instance.currentRoomId = 'room-123'
      await instance.requestPromotion()

      expect(AlertService.announce).toHaveBeenCalledWith('Admin promotion request submitted')
    })

    it('shows result directly when server resolves immediately', async () => {
      const { httpsCallable } = await import('firebase/functions')
      const requestData = {
        status: 'approved',
        requesterName: 'TestUser',
        requesterId: 'other-user',
        votes: {}
      }
      const mockFn = vi.fn(() => Promise.resolve({
        data: { success: true, resolved: true, requestData }
      }))
      httpsCallable.mockReturnValue(mockFn)

      instance.currentRoomId = 'room-123'
      instance.currentUid = 'other-user'
      instance.listenerRef = {} // Prevent null check in listen

      const showResultSpy = vi.spyOn(instance, 'showResult').mockResolvedValue()
      await instance.requestPromotion()

      expect(showResultSpy).toHaveBeenCalledWith(requestData)
    })

    it('re-enables button and shows error on failure', async () => {
      const { httpsCallable } = await import('firebase/functions')
      const AlertService = (await import('../../component/alert/alert')).default
      const mockFn = vi.fn(() => Promise.reject(new Error('Network error')))
      httpsCallable.mockReturnValue(mockFn)

      instance.currentRoomId = 'room-123'

      const btn = document.createElement('button')
      btn.id = 'js-request-admin'
      document.body.appendChild(btn)

      await instance.requestPromotion()

      expect(btn.disabled).toBe(false)
      expect(btn.textContent).toBe('Request Admin Access')
      expect(AlertService.announce).toHaveBeenCalledWith('Network error')

      btn.remove()
    })
  })

  describe('vote', () => {
    it('does nothing when no room is set', async () => {
      const { httpsCallable } = await import('firebase/functions')
      httpsCallable.mockClear()

      await instance.vote(true)

      expect(httpsCallable).not.toHaveBeenCalled()
    })

    it('calls the voteOnPromotion cloud function', async () => {
      const { httpsCallable } = await import('firebase/functions')
      const mockFn = vi.fn(() => Promise.resolve({ data: {} }))
      httpsCallable.mockReturnValue(mockFn)

      instance.currentRoomId = 'room-123'
      await instance.vote(true)

      expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'voteOnPromotion')
      expect(mockFn).toHaveBeenCalledWith({ roomId: 'room-123', vote: true })
    })

    it('announces error on failure', async () => {
      const { httpsCallable } = await import('firebase/functions')
      const AlertService = (await import('../../component/alert/alert')).default
      const mockFn = vi.fn(() => Promise.reject(new Error('Vote failed')))
      httpsCallable.mockReturnValue(mockFn)

      instance.currentRoomId = 'room-123'
      await instance.vote(false)

      expect(AlertService.announce).toHaveBeenCalledWith('Vote failed')
    })
  })

  describe('triggerResolve', () => {
    it('does nothing when no room is set', async () => {
      const { httpsCallable } = await import('firebase/functions')
      httpsCallable.mockClear()

      await instance.triggerResolve()

      expect(httpsCallable).not.toHaveBeenCalled()
    })

    it('calls the resolvePromotion cloud function', async () => {
      const { httpsCallable } = await import('firebase/functions')
      const mockFn = vi.fn(() => Promise.resolve({ data: {} }))
      httpsCallable.mockReturnValue(mockFn)

      instance.currentRoomId = 'room-123'
      await instance.triggerResolve()

      expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'resolvePromotion')
      expect(mockFn).toHaveBeenCalledWith({ roomId: 'room-123' })
    })

    it('swallows errors silently', async () => {
      const { httpsCallable } = await import('firebase/functions')
      const mockFn = vi.fn(() => Promise.reject(new Error('Already resolved')))
      httpsCallable.mockReturnValue(mockFn)

      instance.currentRoomId = 'room-123'

      await expect(instance.triggerResolve()).resolves.toBeUndefined()
    })
  })

  describe('showVoteDialog', () => {
    const pendingData = {
      requesterName: 'Alice',
      requesterId: 'alice-uid',
      status: 'pending',
      expiresAt: Date.now() + 60000,
      memberCount: 3,
      votes: {
        'alice-uid': { vote: true, name: 'Alice' }
      }
    }

    it('creates and opens a dialog', () => {
      instance.currentUid = 'bob-uid'
      instance.showVoteDialog(pendingData)

      expect(instance.dialog).not.toBeNull()
      expect(instance.dialog.getAttribute('open')).toBe('')
      expect(instance.dialog.querySelector('[data-cy=promotion-requester]').textContent).toBe('Alice')
    })

    it('wires the close button', () => {
      instance.currentUid = 'bob-uid'
      instance.showVoteDialog(pendingData)

      const closeBtn = instance.dialog.querySelector('.dialog__close')
      expect(closeBtn).not.toBeNull()

      closeBtn.click()
      expect(instance.dialog).toBeNull()
    })

    it('displays vote entries', () => {
      instance.currentUid = 'bob-uid'
      instance.showVoteDialog(pendingData)

      const entries = instance.dialog.querySelectorAll('.promotion-dialog__vote-entry')
      // 1 vote (Alice) + 1 pending entry (2 members pending)
      expect(entries).toHaveLength(2)
      expect(entries[0].querySelector('.promotion-dialog__vote-name').textContent).toBe('Alice')
      expect(entries[0].querySelector('.vote-approve').textContent).toBe('Approved')
      expect(entries[1].querySelector('.promotion-dialog__vote-name').textContent).toBe('2 members pending')
    })

    it('disables vote buttons when user has already voted', () => {
      instance.currentUid = 'alice-uid'
      instance.showVoteDialog(pendingData)

      expect(instance.dialog.querySelector('[data-cy=promotion-approve]').disabled).toBe(true)
      expect(instance.dialog.querySelector('[data-cy=promotion-reject]').disabled).toBe(true)
    })

    it('enables vote buttons when user has not voted', () => {
      instance.currentUid = 'bob-uid'
      instance.showVoteDialog(pendingData)

      expect(instance.dialog.querySelector('[data-cy=promotion-approve]').disabled).toBe(false)
      expect(instance.dialog.querySelector('[data-cy=promotion-reject]').disabled).toBe(false)
    })

    it('updates existing dialog instead of creating a new one', () => {
      instance.currentUid = 'bob-uid'
      instance.showVoteDialog(pendingData)

      const firstDialog = instance.dialog

      const updatedData = {
        ...pendingData,
        votes: {
          ...pendingData.votes,
          'bob-uid': { vote: true, name: 'Bob' }
        }
      }
      instance.showVoteDialog(updatedData)

      expect(instance.dialog).toBe(firstDialog)
      const entries = instance.dialog.querySelectorAll('.promotion-dialog__vote-entry')
      // 2 votes (Alice + Bob) + 1 pending member = 3 entries
      expect(entries).toHaveLength(3)
    })

    it('starts a countdown timer', () => {
      instance.currentUid = 'bob-uid'
      instance.showVoteDialog(pendingData)

      expect(instance.countdownInterval).not.toBeNull()
    })
  })

  describe('updateVoteDisplay', () => {
    it('shows rejection votes correctly', () => {
      instance.currentUid = 'charlie-uid'
      const data = {
        requesterName: 'Alice',
        status: 'pending',
        expiresAt: Date.now() + 60000,
        memberCount: 2,
        votes: {
          'alice-uid': { vote: true, name: 'Alice' },
          'bob-uid': { vote: false, name: 'Bob' }
        }
      }

      instance.showVoteDialog(data)
      const entries = instance.dialog.querySelectorAll('.promotion-dialog__vote-entry')

      expect(entries).toHaveLength(2)
      const bobEntry = entries[1]
      expect(bobEntry.querySelector('.vote-reject').textContent).toBe('Rejected')
    })

    it('shows singular pending text for 1 member', () => {
      instance.currentUid = 'charlie-uid'
      const data = {
        requesterName: 'Alice',
        status: 'pending',
        expiresAt: Date.now() + 60000,
        memberCount: 2,
        votes: {
          'alice-uid': { vote: true, name: 'Alice' }
        }
      }

      instance.showVoteDialog(data)
      const pendingEntry = instance.dialog.querySelectorAll('.promotion-dialog__vote-entry')[1]
      expect(pendingEntry.querySelector('.promotion-dialog__vote-name').textContent).toBe('1 member pending')
    })

    it('hides pending section when all have voted', () => {
      instance.currentUid = 'bob-uid'
      const data = {
        requesterName: 'Alice',
        status: 'pending',
        expiresAt: Date.now() + 60000,
        memberCount: 1,
        votes: {
          'alice-uid': { vote: true, name: 'Alice' }
        }
      }

      instance.showVoteDialog(data)
      const entries = instance.dialog.querySelectorAll('.promotion-dialog__vote-entry')
      expect(entries).toHaveLength(1)
    })
  })

  describe('startCountdown', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('updates countdown text every second', () => {
      const expiresAt = Date.now() + 30000
      const data = {
        requesterName: 'Alice',
        status: 'pending',
        expiresAt,
        memberCount: 2,
        votes: {}
      }

      instance.currentUid = 'bob-uid'
      instance.showVoteDialog(data)

      const countdownEl = instance.dialog.querySelector('[data-cy=promotion-countdown]')

      vi.advanceTimersByTime(1000)
      expect(Number(countdownEl.textContent)).toBeLessThanOrEqual(30)
    })

    it('adds urgent class when 10 seconds remain', () => {
      const expiresAt = Date.now() + 9000
      const data = {
        requesterName: 'Alice',
        status: 'pending',
        expiresAt,
        memberCount: 2,
        votes: {}
      }

      instance.currentUid = 'bob-uid'
      instance.showVoteDialog(data)

      vi.advanceTimersByTime(1000)

      const timerEl = instance.dialog.querySelector('.promotion-dialog__timer')
      expect(timerEl.classList.contains('timer-urgent')).toBe(true)
    })

    it('triggers resolve when countdown reaches zero', () => {
      const expiresAt = Date.now() + 1000
      const data = {
        requesterName: 'Alice',
        status: 'pending',
        expiresAt,
        memberCount: 2,
        votes: {}
      }

      instance.currentRoomId = 'room-123'
      instance.currentUid = 'bob-uid'
      const triggerSpy = vi.spyOn(instance, 'triggerResolve').mockResolvedValue()

      instance.showVoteDialog(data)

      vi.advanceTimersByTime(2000)

      expect(triggerSpy).toHaveBeenCalled()
      expect(instance.countdownInterval).toBeNull()
    })
  })

  describe('clearCountdown', () => {
    it('clears interval and sets to null', () => {
      instance.countdownInterval = setInterval(() => {}, 1000)
      expect(instance.countdownInterval).not.toBeNull()

      instance.clearCountdown()

      expect(instance.countdownInterval).toBeNull()
    })

    it('does nothing when no interval exists', () => {
      instance.clearCountdown()
      expect(instance.countdownInterval).toBeNull()
    })
  })

  describe('showResult', () => {
    it('creates a dialog when none exists and shows approved result', async () => {
      instance.currentUid = 'observer-uid'
      instance.currentRoomId = 'room-123'

      await instance.showResult({
        status: 'approved',
        requesterName: 'Alice',
        requesterId: 'alice-uid',
        votes: { 'alice-uid': { vote: true, name: 'Alice' } },
        memberCount: 1
      })

      expect(instance.dialog).not.toBeNull()
      expect(instance.dialog.querySelector('[data-cy=promotion-result]').hidden).toBe(false)
      expect(instance.dialog.querySelector('[data-cy=promotion-result-text]').textContent)
        .toBe('Alice has been promoted to admin.')
      expect(instance.dialog.querySelector('[data-cy=promotion-result]').classList.contains('result-approved')).toBe(true)
    })

    it('shows denied result', async () => {
      instance.currentUid = 'observer-uid'
      instance.currentRoomId = 'room-123'

      await instance.showResult({
        status: 'denied',
        requesterName: 'Alice',
        requesterId: 'alice-uid',
        votes: { 'bob-uid': { vote: false, name: 'Bob' } },
        memberCount: 1
      })

      expect(instance.dialog.querySelector('[data-cy=promotion-result-text]').textContent)
        .toBe('Admin promotion for Alice was denied.')
      expect(instance.dialog.querySelector('[data-cy=promotion-result]').classList.contains('result-denied')).toBe(true)
    })

    it('hides actions and timer when showing result', async () => {
      instance.currentUid = 'bob-uid'
      instance.showVoteDialog({
        requesterName: 'Alice',
        status: 'pending',
        expiresAt: Date.now() + 60000,
        memberCount: 2,
        votes: {}
      })

      await instance.showResult({
        status: 'approved',
        requesterName: 'Alice',
        requesterId: 'alice-uid',
        votes: { 'alice-uid': { vote: true, name: 'Alice' } },
        memberCount: 1
      })

      expect(instance.dialog.querySelector('[data-cy=promotion-actions]').hidden).toBe(true)
      expect(instance.dialog.querySelector('.promotion-dialog__timer').hidden).toBe(true)
    })

    it('signs in requester with new token on approval', async () => {
      const { signInWithCustomToken } = await import('firebase/auth')

      instance.currentUid = 'alice-uid'
      instance.currentRoomId = 'room-123'

      await instance.showResult({
        status: 'approved',
        requesterName: 'Alice',
        requesterId: 'alice-uid',
        newToken: 'new-admin-token',
        votes: { 'alice-uid': { vote: true, name: 'Alice' } },
        memberCount: 1
      })

      expect(signInWithCustomToken).toHaveBeenCalledWith(expect.anything(), 'new-admin-token')
      expect(instance.isAdmin).toBe(true)
    })

    it('enables admin controls for the promoted user', async () => {
      const toolbar = (await import('../toolbar')).default

      instance.currentUid = 'alice-uid'
      instance.currentRoomId = 'room-123'

      await instance.showResult({
        status: 'approved',
        requesterName: 'Alice',
        requesterId: 'alice-uid',
        newToken: 'new-admin-token',
        votes: {},
        memberCount: 1
      })

      expect(toolbar.enableAdminControls).toHaveBeenCalled()
      expect(toolbar.removeRequestAdminButton).toHaveBeenCalled()
    })

    it('revokes admin controls from the old admin', async () => {
      const toolbar = (await import('../toolbar')).default

      instance.currentUid = 'old-admin-uid'
      instance.currentRoomId = 'room-123'
      instance.isAdmin = true

      await instance.showResult({
        status: 'approved',
        requesterName: 'Alice',
        requesterId: 'alice-uid',
        votes: { 'alice-uid': { vote: true, name: 'Alice' } },
        memberCount: 1
      })

      expect(instance.isAdmin).toBe(false)
      expect(toolbar.disableAdminControls).toHaveBeenCalled()
      expect(toolbar.enableRequestAdmin).toHaveBeenCalledWith(expect.any(Function))
    })

    it('does not revoke admin for non-admin observers', async () => {
      const toolbar = (await import('../toolbar')).default
      toolbar.disableAdminControls.mockClear()

      instance.currentUid = 'observer-uid'
      instance.currentRoomId = 'room-123'
      instance.isAdmin = false

      await instance.showResult({
        status: 'approved',
        requesterName: 'Alice',
        requesterId: 'alice-uid',
        votes: {},
        memberCount: 1
      })

      expect(toolbar.disableAdminControls).not.toHaveBeenCalled()
    })

    it('wires the close button on dialog created in showResult', async () => {
      instance.currentUid = 'observer-uid'
      instance.currentRoomId = 'room-123'

      await instance.showResult({
        status: 'approved',
        requesterName: 'Alice',
        requesterId: 'alice-uid',
        votes: {},
        memberCount: 1
      })

      const closeBtn = instance.dialog.querySelector('.dialog__close')
      expect(closeBtn).not.toBeNull()

      closeBtn.click()
      expect(instance.dialog).toBeNull()
    })

    it('auto-closes after 5 seconds', async () => {
      vi.useFakeTimers()

      instance.currentUid = 'observer-uid'
      instance.currentRoomId = 'room-123'

      await instance.showResult({
        status: 'approved',
        requesterName: 'Alice',
        requesterId: 'alice-uid',
        votes: {},
        memberCount: 1
      })

      expect(instance.dialog).not.toBeNull()

      vi.advanceTimersByTime(5000)

      expect(instance.dialog).toBeNull()

      vi.useRealTimers()
    })
  })

  describe('closeDialog', () => {
    it('removes the dialog from the DOM', () => {
      const data = {
        requesterName: 'Alice',
        status: 'pending',
        expiresAt: Date.now() + 60000,
        memberCount: 2,
        votes: {}
      }

      instance.currentUid = 'bob-uid'
      instance.showVoteDialog(data)

      expect(document.querySelector('.promotion-vote-dialog')).not.toBeNull()

      instance.closeDialog()

      expect(instance.dialog).toBeNull()
      expect(document.querySelector('.promotion-vote-dialog')).toBeNull()
    })

    it('clears countdown interval', () => {
      const data = {
        requesterName: 'Alice',
        status: 'pending',
        expiresAt: Date.now() + 60000,
        memberCount: 2,
        votes: {}
      }

      instance.currentUid = 'bob-uid'
      instance.showVoteDialog(data)

      expect(instance.countdownInterval).not.toBeNull()

      instance.closeDialog()

      expect(instance.countdownInterval).toBeNull()
    })

    it('does nothing when no dialog exists', () => {
      instance.closeDialog()
      expect(instance.dialog).toBeNull()
    })
  })
})
