/// <reference types="cypress" />

/**
 * Helper: visit with clean auth state.
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

describe('Admin Promotion Request System', () => {

  describe('Admin should not see Request Admin button', () => {

    it('Should login and create a room as admin', () => {
      cleanVisit(Cypress.env('CYPRESS_BASE_URL'))
      cy.get('[data-cy=start-session]').first().click()
      cy.get('[data-cy=username]').clear().type('AdminUser{enter}')
      cy.contains('CREATE A ROOM').click()
      cy.url().should('contain', 'roomId')
      cy.contains('RESET')
    })

    it('Should show admin controls but not request admin button', () => {
      cy.get('[data-cy=reset]').should('exist')
      cy.get('[data-cy=hideStoryPoints]').should('exist')
      cy.get('[data-cy=showStoryPoints]').should('exist')
      cy.get('[data-cy=requestAdmin]').should('not.exist')
    })
  })

  describe('Non-admin promotion flow', () => {

    it('Should join a room as non-admin via direct link', () => {
      cleanVisit(Cypress.env('CYPRESS_BASE_URL'))

      // First create a room to get a valid roomId
      cy.get('[data-cy=start-session]').first().click()
      cy.get('[data-cy=username]').clear().type('RoomCreator{enter}')
      cy.contains('CREATE A ROOM').click()
      cy.url().should('contain', 'roomId')

      // Extract roomId and visit as a different user
      cy.url().then(url => {
        const roomId = new URL(url).searchParams.get('roomId')

        cleanVisit(Cypress.env('CYPRESS_BASE_URL') + '?roomId=' + roomId)
        cy.get('.auth-dialog').should('exist')
        cy.get('[data-cy=username]').clear().type('NonAdminUser{enter}')

        // Non-admin should see request admin button
        cy.get('[data-cy=requestAdmin]').should('exist')
      })
    })

    it('Should not show admin controls for non-admin', () => {
      cy.get('[data-cy=reset]').should('not.exist')
      cy.get('[data-cy=hideStoryPoints]').should('not.exist')
      cy.get('[data-cy=showStoryPoints]').should('not.exist')
    })

    it('Should trigger promotion request when clicking Request Admin Access', () => {
      cy.get('[data-cy=requestAdmin]').click()
      cy.get('[data-cy=notification]').should('have.text', 'Admin promotion request submitted')
    })

    it('Should show the promotion vote dialog', () => {
      cy.get('.promotion-vote-dialog', { timeout: 10000 }).should('exist')
      cy.get('[data-cy=promotion-requester]').should('have.text', 'NonAdminUser')
    })

    it('Should show requester auto-voted as approved', () => {
      cy.get('[data-cy=promotion-votes]').should('contain.text', 'NonAdminUser')
      cy.get('[data-cy=promotion-votes]').should('contain.text', 'Approved')
    })

    it('Should have vote buttons disabled for the requester', () => {
      cy.get('[data-cy=promotion-approve]').should('be.disabled')
      cy.get('[data-cy=promotion-reject]').should('be.disabled')
    })

    it('Should resolve and show approved result (sole member auto-approves)', () => {
      // With 1 member, the requester auto-vote resolves immediately
      cy.get('[data-cy=promotion-result-text]', { timeout: 10000 })
        .should('contain.text', 'has been promoted to admin')
    })

    it('Should enable admin controls after promotion', () => {
      // Admin controls should appear after promotion resolves
      cy.get('[data-cy=reset]', { timeout: 10000 }).should('exist')
      cy.get('[data-cy=requestAdmin]').should('not.exist')
    })
  })

})
