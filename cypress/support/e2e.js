// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // when there are uncaught exceptions in the app
  console.log('Uncaught exception:', err.message)
  return false
})

// Custom commands for authentication
Cypress.Commands.add('login', (email = 'test@example.com', password = 'password123') => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: {
      email,
      password
    }
  }).then((response) => {
    expect(response.status).to.equal(200)
    window.localStorage.setItem('auth-token', response.body.token)
  })
})

Cypress.Commands.add('logout', () => {
  cy.request('POST', '/api/auth/logout')
  cy.window().then((win) => {
    win.localStorage.removeItem('auth-token')
  })
})

// Database utilities
Cypress.Commands.add('seedDatabase', () => {
  cy.request('POST', '/api/dev/seed')
})

Cypress.Commands.add('clearDatabase', () => {
  cy.request('DELETE', '/api/dev/clear')
})