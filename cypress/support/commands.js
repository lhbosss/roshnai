// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Authentication commands
Cypress.Commands.add('loginAsUser', (userType = 'borrower') => {
  const users = {
    borrower: { email: 'borrower@test.com', password: 'password123' },
    lender: { email: 'lender@test.com', password: 'password123' },
    admin: { email: 'admin@test.com', password: 'admin123' }
  }
  
  const user = users[userType]
  cy.visit('/login')
  cy.get('[data-cy="email-input"]').type(user.email)
  cy.get('[data-cy="password-input"]').type(user.password)
  cy.get('[data-cy="login-button"]').click()
  cy.url().should('not.include', '/login')
})

// Book management commands
Cypress.Commands.add('createTestBook', (bookData = {}) => {
  const defaultBook = {
    title: 'Test Book',
    author: 'Test Author',
    isbn: '9781234567890',
    condition: 'good',
    price: 25.00,
    description: 'A test book for automated testing'
  }
  
  const book = { ...defaultBook, ...bookData }
  
  cy.request({
    method: 'POST',
    url: '/api/books',
    body: book,
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('auth-token')}`
    }
  }).then((response) => {
    expect(response.status).to.equal(201)
    return response.body.book
  })
})

// Transaction commands
Cypress.Commands.add('initiateTransaction', (bookId, amount) => {
  cy.request({
    method: 'POST',
    url: '/api/transactions',
    body: {
      bookId,
      amount,
      type: 'borrow'
    },
    headers: {
      'Authorization': `Bearer ${window.localStorage.getItem('auth-token')}`
    }
  }).then((response) => {
    expect(response.status).to.equal(201)
    return response.body.transaction
  })
})

// Utility commands
Cypress.Commands.add('waitForElement', (selector, timeout = 10000) => {
  cy.get(selector, { timeout }).should('exist').should('be.visible')
})

Cypress.Commands.add('fillForm', (formData) => {
  Object.keys(formData).forEach(field => {
    cy.get(`[data-cy="${field}-input"]`).clear().type(formData[field])
  })
})