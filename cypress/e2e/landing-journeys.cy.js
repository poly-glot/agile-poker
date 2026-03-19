/// <reference types="cypress" />

/**
 * Helper: visit with clean auth state by clearing Firebase persistence stores.
 */
function cleanVisit (url) {
  cy.visit(url, {
    onBeforeLoad (win) {
      win.localStorage.clear()
      win.sessionStorage.clear()
      win.indexedDB.deleteDatabase('firebaseLocalStorageDb')
      win.indexedDB.deleteDatabase('firebase-heartbeat-database')
      win.indexedDB.deleteDatabase('firebaseLocalStorage')
    }
  })
}

describe('Landing Page Journeys', () => {

  describe('Dialog Close → Back to Landing', () => {

    it('Should show the landing page on visit', () => {
      cleanVisit(Cypress.env('CYPRESS_BASE_URL'))
      cy.get('#landing-page').should('be.visible')
      cy.get('#app-view').should('not.be.visible')
    })

    it('Should open auth dialog when clicking Start a session', () => {
      cy.get('[data-cy=start-session]').first().click()
      cy.get('.auth-dialog').should('exist')
      cy.get('[data-cy=submit]').should('have.text', 'LOGIN')
    })

    it('Should return to landing when closing auth dialog', () => {
      cy.get('.auth-dialog [data-cy=dialog-close]').click()
      cy.get('.auth-dialog').should('not.exist')
      cy.get('#landing-page').should('be.visible')
      cy.get('#app-view').should('not.be.visible')
    })

    it('Should reopen auth dialog when clicking Start a session again', () => {
      cy.get('[data-cy=start-session]').first().click()
      cy.get('.auth-dialog').should('exist')
      cy.get('[data-cy=submit]').should('have.text', 'LOGIN')
    })

    it('Should show room dialog after login with valid username', () => {
      cy.get('[data-cy=username]').clear().type('TestUser{enter}')
      cy.get('.auth-dialog').should('not.exist')
      cy.get('.room-dialog').should('exist')
      cy.contains('CREATE A ROOM')
    })

    it('Should return to landing when closing room dialog', () => {
      cy.get('.room-dialog [data-cy=dialog-close]').click()
      cy.get('.room-dialog').should('not.exist')
      cy.get('#landing-page').should('be.visible')
      cy.get('#app-view').should('not.be.visible')
    })
  })

  describe('Resume Session After Closing Room Dialog', () => {

    it('Should show the landing page on visit', () => {
      cleanVisit(Cypress.env('CYPRESS_BASE_URL'))
      cy.get('#landing-page').should('be.visible')
    })

    it('Should login and see room dialog', () => {
      cy.get('[data-cy=start-session]').first().click()
      cy.get('.auth-dialog').should('exist')
      cy.get('[data-cy=username]').clear().type('ResumeUser{enter}')
      cy.get('.room-dialog').should('exist')
    })

    it('Should close room dialog and return to landing', () => {
      cy.get('.room-dialog [data-cy=dialog-close]').click()
      cy.get('#landing-page').should('be.visible')
    })

    it('Should show room dialog (not auth) when clicking Start a session again', () => {
      cy.get('[data-cy=start-session]').first().click()
      cy.get('.auth-dialog').should('not.exist')
      cy.get('.room-dialog').should('exist')
      cy.contains('CREATE A ROOM')
    })
  })

  describe('Brand Link Navigation', () => {

    it('Should login and create a room', () => {
      cleanVisit(Cypress.env('CYPRESS_BASE_URL'))
      cy.get('[data-cy=start-session]').first().click()
      cy.get('.auth-dialog').should('exist')
      cy.get('[data-cy=username]').clear().type('BrandUser{enter}')
      cy.get('.room-dialog').should('exist')
      cy.contains('CREATE A ROOM').click()
      cy.url().should('contain', 'roomId')
      cy.contains('RESET')
    })

    it('Should navigate to landing when clicking brand link', () => {
      cy.get('.site__brand a').click()
      cy.get('#landing-page').should('be.visible')
      cy.get('#app-view').should('not.be.visible')
      cy.url().should('not.contain', 'roomId')
    })
  })

  describe('Direct Room Link (Unauthenticated)', () => {

    it('Should show app view and auth dialog when visiting with roomId', () => {
      cleanVisit(Cypress.env('CYPRESS_BASE_URL') + '?roomId=test-room-123')
      cy.get('#app-view').should('be.visible')
      cy.get('#landing-page').should('not.be.visible')
      cy.get('.auth-dialog').should('exist')
    })

    it('Should return to landing and strip roomId when closing auth dialog', () => {
      cy.get('.auth-dialog [data-cy=dialog-close]').click()
      cy.get('.auth-dialog').should('not.exist')
      cy.get('#landing-page').should('be.visible')
      cy.url().should('not.contain', 'roomId')
    })
  })

  describe('CTA & Footer Start Session Buttons', () => {

    it('Should show the landing page on visit', () => {
      cleanVisit(Cypress.env('CYPRESS_BASE_URL'))
      cy.get('#landing-page').should('be.visible')
    })

    it('Should open auth dialog from bottom CTA button', () => {
      cy.get('.cta-section [data-action="start-session"]').scrollIntoView().click()
      cy.get('.auth-dialog').should('exist')
    })

    it('Should return to landing after closing', () => {
      cy.get('.auth-dialog [data-cy=dialog-close]').click()
      cy.get('#landing-page').should('be.visible')
    })

    it('Should open auth dialog from footer Start Session link', () => {
      cy.get('.landing-footer [data-action="start-session"]').scrollIntoView().click()
      cy.get('.auth-dialog').should('exist')
    })
  })
})
