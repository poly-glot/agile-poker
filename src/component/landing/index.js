import './index.css'

/**
 * Controls visibility of landing page vs app view.
 * - If ?roomId is present, hide landing and show app immediately
 * - Otherwise show landing; "Start a session" buttons trigger auth dialog
 */
export function initLanding () {
  const landing = document.getElementById('landing-page')
  const app = document.getElementById('app-view')

  if (!landing || !app) return

  const params = new URLSearchParams(window.location.search)

  if (params.has('roomId')) {
    landing.hidden = true
    app.hidden = false
  } else {
    landing.hidden = false
    app.hidden = true
  }

  // Wire all "Start a session" CTA buttons to hide landing and trigger auth
  document.querySelectorAll('[data-action="start-session"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      landing.hidden = true
      app.hidden = false
      document.dispatchEvent(new CustomEvent('landing:start-session'))
    })
  })

  // Wire brand link to show landing instead of full reload
  const brand = document.querySelector('.site__brand a')
  if (brand) {
    brand.addEventListener('click', (e) => {
      e.preventDefault()
      showLanding()
    })
  }
}

/**
 * Show landing page (used when user signs out while on a non-room URL)
 */
export function isLandingVisible () {
  const landing = document.getElementById('landing-page')
  return landing && !landing.hidden
}

export function showLanding () {
  const landing = document.getElementById('landing-page')
  const app = document.getElementById('app-view')

  if (!landing || !app) return

  // Strip roomId from URL so the user lands on a clean state
  const url = new URL(window.location.href)
  if (url.searchParams.has('roomId')) {
    url.searchParams.delete('roomId')
    window.history.replaceState(null, '', url.toString())
  }

  landing.hidden = false
  app.hidden = true
}
