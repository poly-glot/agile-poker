/// <reference types="cypress" />


describe('Room Administrator', () => {

  it('As an Admin I should be able to visit the application', function () {
    cy.visit(Cypress.env('CYPRESS_BASE_URL'))
    cy.percySnapshot()
  })

  it('Should inform user when application is ready to use', function () {
    cy.get('[data-cy=notification]').should('have.text', 'Application is ready to use')
    cy.percySnapshot()
  })

  describe('Guest Login', () => {

    it('As a User I should be able to see a dialog to log into the application', function () {
      cy.get('[data-cy=submit]')
        .should('exist')
        .and('have.text', 'LOGIN')
      cy.percySnapshot()
    })

    it('When I try invalid username then it should show me an error', () => {
      cy.get('#username').type('A Room Admin!!{enter}')
      cy.contains('Invalid username')
    })

    it('Should login successfully on valid username', () => {
      cy.get('[data-cy=username]')
        .clear()
        .type('George{enter}')

      cy.get('[data-cy=notification]').should('not.contain', 'Invalid username')
    })

    it('Should present a dialog to create a room', () => {
      cy.contains('CREATE A ROOM')
    })
  })

  describe('Creating a new Room', () => {
    it('Should allow user to create a new room', () => {
      cy.url().should('not.contain', 'roomId')
      cy.contains('CREATE A ROOM').click()

      cy.contains('RESET')
      cy.url().should('contain', 'roomId')
    })
  })

  describe('Resume Journey', () => {
    it('Should redirect admin back to their room if they visit homepage', () => {
      cy.visit(Cypress.env('CYPRESS_BASE_URL'))
      cy.url().should('contain', 'roomId')
    })
  })

  describe('Admin Story points', () => {
    it('Should allow admin to post story points', () => {
      cy.get('[name=storyPoints][value=5]')
        .not('[disabled]')
        .check({ force: true })
        .should('be.checked')

      cy.get('[data-cy=notification]').should('have.text', 'Your 5 story points has been submitted')

      cy.get('.poker-card').contains('8').click()
      cy.get('[data-cy=notification]').should('have.text', 'Your 8 story points has been submitted')
    })
  })

  describe('Admin toolbar', () => {

    it('Should allow admin to hide story points', () => {
      cy.get('[data-cy=hideStoryPoints]').click()
      cy.get('[data-cy=notification]').should('have.text', 'Team cannot see each other story points.')
    })

    it('Should allow admin to reveal story points', () => {
      cy.get('[data-cy=showStoryPoints]').click()
      cy.get('[data-cy=notification]').should('have.text', 'Story points are visible to the team')
    })

    it('Should allow admin to reset story points', () => {
      cy.get('[data-cy=reset]').click()
      cy.get('[data-cy=notification]').should('have.text', 'Reset story points successfully')
    })


    it('Should allow admin sign out', () => {
      cy.get('[data-cy=signout]').click()

      cy.get('[data-cy=submit]')
        .should('exist')
        .and('have.text', 'LOGIN')
    })
  })
})
