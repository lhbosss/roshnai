describe('Complete Borrowing Process E2E Tests', () => {
  beforeEach(() => {
    // Clear database and seed with test data
    cy.seedDatabase()
    cy.visit('/')
  })

  afterEach(() => {
    cy.clearDatabase()
  })

  describe('User Registration and Authentication', () => {
    it('should register a new borrower and lender', () => {
      // Register borrower
      cy.visit('/register')
      cy.fillForm({
        name: 'John Borrower',
        email: 'john.borrower@test.com',
        password: 'password123',
        confirmPassword: 'password123'
      })
      cy.get('[data-cy="register-button"]').click()
      
      cy.url().should('not.include', '/register')
      cy.get('[data-cy="welcome-message"]').should('contain', 'Welcome, John')

      // Logout and register lender
      cy.get('[data-cy="logout-button"]').click()
      
      cy.visit('/register')
      cy.fillForm({
        name: 'Jane Lender',
        email: 'jane.lender@test.com',
        password: 'password123',
        confirmPassword: 'password123'
      })
      cy.get('[data-cy="register-button"]').click()
      
      cy.get('[data-cy="welcome-message"]').should('contain', 'Welcome, Jane')
    })

    it('should handle login with validation', () => {
      cy.visit('/login')
      
      // Test invalid credentials
      cy.fillForm({
        email: 'nonexistent@test.com',
        password: 'wrongpassword'
      })
      cy.get('[data-cy="login-button"]').click()
      cy.get('[data-cy="error-message"]').should('be.visible')
      
      // Test valid credentials (using seeded user)
      cy.fillForm({
        email: 'borrower@test.com',
        password: 'password123'
      })
      cy.get('[data-cy="login-button"]').click()
      
      cy.url().should('not.include', '/login')
      cy.get('[data-cy="user-menu"]').should('be.visible')
    })
  })

  describe('Book Discovery and Search', () => {
    it('should search and filter books effectively', () => {
      cy.loginAsUser('borrower')
      
      // Navigate to book search
      cy.visit('/borrow')
      
      // Test search functionality
      cy.get('[data-cy="search-input"]').type('JavaScript')
      cy.get('[data-cy="search-button"]').click()
      
      cy.get('[data-cy="book-card"]').should('have.length.greaterThan', 0)
      cy.get('[data-cy="book-title"]').first().should('contain', 'JavaScript')
      
      // Test filtering
      cy.get('[data-cy="condition-filter"]').select('excellent')
      cy.get('[data-cy="price-range-min"]').clear().type('10')
      cy.get('[data-cy="price-range-max"]').clear().type('50')
      cy.get('[data-cy="apply-filters"]').click()
      
      // Verify filtered results
      cy.get('[data-cy="book-card"]').each(($book) => {
        cy.wrap($book).find('[data-cy="book-condition"]').should('contain', 'excellent')
        cy.wrap($book).find('[data-cy="book-price"]').then(($price) => {
          const price = parseFloat($price.text().replace('$', ''))
          expect(price).to.be.within(10, 50)
        })
      })
    })

    it('should display detailed book information', () => {
      cy.loginAsUser('borrower')
      cy.visit('/borrow')
      
      // Click on first book
      cy.get('[data-cy="book-card"]').first().click()
      
      // Verify book details page
      cy.url().should('include', '/books/')
      cy.get('[data-cy="book-title"]').should('be.visible')
      cy.get('[data-cy="book-author"]').should('be.visible')
      cy.get('[data-cy="book-condition"]').should('be.visible')
      cy.get('[data-cy="book-price"]').should('be.visible')
      cy.get('[data-cy="book-description"]').should('be.visible')
      cy.get('[data-cy="lender-info"]').should('be.visible')
      cy.get('[data-cy="borrow-button"]').should('be.enabled')
    })
  })

  describe('Complete Transaction Flow', () => {
    it('should complete entire borrowing process successfully', () => {
      // Step 1: Login as borrower
      cy.loginAsUser('borrower')
      
      // Step 2: Find and select a book
      cy.visit('/borrow')
      cy.get('[data-cy="book-card"]').first().click()
      
      // Step 3: Initiate borrowing
      cy.get('[data-cy="borrow-button"]').click()
      
      // Step 4: Payment Information
      cy.get('[data-cy="payment-form"]').should('be.visible')
      cy.fillForm({
        cardNumber: '4242424242424242',
        expiryDate: '12/25',
        cvc: '123',
        billingZip: '12345'
      })
      
      // Step 5: Review and confirm
      cy.get('[data-cy="review-details"]').should('be.visible')
      cy.get('[data-cy="confirm-payment"]').click()
      
      // Step 6: Payment processing
      cy.get('[data-cy="payment-processing"]').should('be.visible')
      cy.waitForElement('[data-cy="payment-success"]', 15000)
      
      // Step 7: Transaction created
      cy.get('[data-cy="transaction-id"]').should('be.visible')
      cy.get('[data-cy="transaction-status"]').should('contain', 'Pending Lender Approval')
      
      // Step 8: Navigate to transactions page
      cy.get('[data-cy="view-transactions"]').click()
      cy.url().should('include', '/transactions')
      
      // Step 9: Verify transaction appears in list
      cy.get('[data-cy="transaction-row"]').first().should('contain', 'Pending')
      
      // Step 10: Login as lender to approve
      cy.logout()
      cy.loginAsUser('lender')
      
      // Step 11: Lender views and approves transaction
      cy.visit('/transactions')
      cy.get('[data-cy="incoming-transaction"]').first().click()
      cy.get('[data-cy="approve-transaction"]').click()
      
      // Step 12: Confirm approval
      cy.get('[data-cy="approval-confirmation"]').should('be.visible')
      cy.get('[data-cy="confirm-approval"]').click()
      
      // Step 13: Transaction is now active
      cy.get('[data-cy="transaction-status"]').should('contain', 'Active')
      
      // Step 14: Simulate book return (borrower)
      cy.logout()
      cy.loginAsUser('borrower')
      cy.visit('/transactions')
      
      cy.get('[data-cy="active-transaction"]').first().click()
      cy.get('[data-cy="return-book"]').click()
      
      // Step 15: Confirm return
      cy.get('[data-cy="return-confirmation"]').should('be.visible')
      cy.get('[data-cy="confirm-return"]').click()
      
      // Step 16: Transaction completed
      cy.get('[data-cy="transaction-status"]').should('contain', 'Completed')
      cy.get('[data-cy="funds-released"]').should('be.visible')
    })

    it('should handle payment failures gracefully', () => {
      cy.loginAsUser('borrower')
      cy.visit('/borrow')
      cy.get('[data-cy="book-card"]').first().click()
      cy.get('[data-cy="borrow-button"]').click()
      
      // Use a card that will be declined
      cy.fillForm({
        cardNumber: '4000000000000002', // Declined card
        expiryDate: '12/25',
        cvc: '123',
        billingZip: '12345'
      })
      
      cy.get('[data-cy="confirm-payment"]').click()
      
      // Should show error message
      cy.get('[data-cy="payment-error"]').should('be.visible')
      cy.get('[data-cy="error-message"]').should('contain', 'payment was declined')
      
      // Should allow retry
      cy.get('[data-cy="retry-payment"]').should('be.enabled')
      
      // Transaction should be marked as failed
      cy.visit('/transactions')
      cy.get('[data-cy="failed-transaction"]').should('exist')
    })

    it('should handle transaction cancellation', () => {
      cy.loginAsUser('borrower')
      cy.visit('/borrow')
      cy.get('[data-cy="book-card"]').first().click()
      cy.get('[data-cy="borrow-button"]').click()
      
      // Complete payment
      cy.fillForm({
        cardNumber: '4242424242424242',
        expiryDate: '12/25',
        cvc: '123',
        billingZip: '12345'
      })
      cy.get('[data-cy="confirm-payment"]').click()
      cy.waitForElement('[data-cy="payment-success"]', 10000)
      
      // Cancel before lender approval
      cy.get('[data-cy="cancel-transaction"]').click()
      cy.get('[data-cy="cancel-reason"]').select('Changed my mind')
      cy.get('[data-cy="confirm-cancellation"]').click()
      
      // Should show refund processing
      cy.get('[data-cy="refund-processing"]').should('be.visible')
      cy.get('[data-cy="transaction-status"]').should('contain', 'Cancelled')
      
      // Verify refund in transactions
      cy.visit('/transactions')
      cy.get('[data-cy="refunded-transaction"]').should('exist')
    })
  })

  describe('Messaging System', () => {
    it('should enable communication between borrower and lender', () => {
      // Setup active transaction first
      cy.createTestBook().then((book) => {
        cy.initiateTransaction(book._id, book.price).then((transaction) => {
          // Login as borrower
          cy.loginAsUser('borrower')
          
          // Navigate to transaction messages
          cy.visit(`/messages/transaction/${transaction._id}`)
          
          // Send message to lender
          cy.get('[data-cy="message-input"]').type('Hi! When can I pick up the book?')
          cy.get('[data-cy="send-message"]').click()
          
          // Verify message sent
          cy.get('[data-cy="message-bubble"]').should('contain', 'When can I pick up')
          cy.get('[data-cy="message-status"]').should('contain', 'Sent')
          
          // Login as lender
          cy.logout()
          cy.loginAsUser('lender')
          
          // Check for new message notification
          cy.get('[data-cy="message-notification"]').should('be.visible')
          
          // Navigate to conversation
          cy.visit(`/messages/transaction/${transaction._id}`)
          cy.get('[data-cy="message-bubble"]').should('contain', 'When can I pick up')
          
          // Reply to message
          cy.get('[data-cy="message-input"]').type('You can pick it up tomorrow at 2 PM!')
          cy.get('[data-cy="send-message"]').click()
          
          // Verify conversation flow
          cy.get('[data-cy="message-bubble"]').should('have.length', 2)
        })
      })
    })
  })

  describe('Dispute Resolution', () => {
    it('should handle dispute creation and resolution', () => {
      // Setup completed transaction
      cy.createTestBook().then((book) => {
        cy.initiateTransaction(book._id, book.price).then((transaction) => {
          cy.loginAsUser('borrower')
          
          // Navigate to transaction
          cy.visit(`/transactions/${transaction._id}`)
          
          // Create dispute
          cy.get('[data-cy="create-dispute"]').click()
          cy.get('[data-cy="dispute-type"]').select('Item Condition')
          cy.get('[data-cy="dispute-description"]').type('The book was damaged when I received it')
          cy.get('[data-cy="dispute-evidence"]').attachFile('damaged-book.jpg')
          cy.get('[data-cy="submit-dispute"]').click()
          
          // Verify dispute created
          cy.get('[data-cy="dispute-status"]').should('contain', 'Under Review')
          cy.get('[data-cy="dispute-id"]').should('be.visible')
          
          // Navigate to complaints page
          cy.visit('/complaints')
          cy.get('[data-cy="dispute-item"]').should('contain', 'Item Condition')
        })
      })
    })
  })

  describe('Responsive Design and Accessibility', () => {
    it('should work correctly on mobile devices', () => {
      cy.viewport('iphone-x')
      cy.loginAsUser('borrower')
      
      // Test mobile navigation
      cy.get('[data-cy="mobile-menu-toggle"]').click()
      cy.get('[data-cy="mobile-menu"]').should('be.visible')
      cy.get('[data-cy="mobile-borrow-link"]').click()
      
      // Test mobile search
      cy.get('[data-cy="search-input"]').should('be.visible')
      cy.get('[data-cy="search-input"]').type('Test')
      cy.get('[data-cy="search-button"]').click()
      
      // Test mobile book cards
      cy.get('[data-cy="book-card"]').should('be.visible')
      cy.get('[data-cy="book-card"]').first().click()
      
      // Test mobile payment form
      cy.get('[data-cy="borrow-button"]').click()
      cy.get('[data-cy="payment-form"]').should('be.visible')
    })

    it('should be accessible with keyboard navigation', () => {
      cy.loginAsUser('borrower')
      cy.visit('/borrow')
      
      // Test keyboard navigation
      cy.get('body').tab()
      cy.focused().should('have.attr', 'data-cy', 'search-input')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'data-cy', 'search-button')
      
      // Test ARIA labels
      cy.get('[data-cy="book-card"]').first().should('have.attr', 'aria-label')
      cy.get('[data-cy="borrow-button"]').should('have.attr', 'aria-describedby')
    })
  })

  describe('Performance Tests', () => {
    it('should load pages within acceptable time limits', () => {
      cy.loginAsUser('borrower')
      
      // Test home page load time
      const homeStartTime = Date.now()
      cy.visit('/')
      cy.get('[data-cy="main-content"]').should('be.visible').then(() => {
        const homeLoadTime = Date.now() - homeStartTime
        expect(homeLoadTime).to.be.lessThan(3000) // 3 seconds max
      })
      
      // Test search page load time
      const searchStartTime = Date.now()
      cy.visit('/borrow')
      cy.get('[data-cy="book-grid"]').should('be.visible').then(() => {
        const searchLoadTime = Date.now() - searchStartTime
        expect(searchLoadTime).to.be.lessThan(5000) // 5 seconds max
      })
    })

    it('should handle large numbers of search results', () => {
      cy.loginAsUser('borrower')
      cy.visit('/borrow')
      
      // Trigger search that returns many results
      cy.get('[data-cy="search-input"]').type('book')
      cy.get('[data-cy="search-button"]').click()
      
      // Should implement pagination or virtual scrolling
      cy.get('[data-cy="book-card"]').should('have.length.lessThan', 50) // Reasonable page size
      
      if (Cypress.$('[data-cy="load-more"]').length > 0) {
        cy.get('[data-cy="load-more"]').click()
        cy.get('[data-cy="loading-indicator"]').should('be.visible')
        cy.get('[data-cy="loading-indicator"]').should('not.exist')
      }
      
      if (Cypress.$('[data-cy="pagination"]').length > 0) {
        cy.get('[data-cy="pagination"]').should('be.visible')
        cy.get('[data-cy="page-2"]').click()
        cy.url().should('include', 'page=2')
      }
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      cy.intercept('GET', '/api/books**', { forceNetworkError: true }).as('networkError')
      
      cy.loginAsUser('borrower')
      cy.visit('/borrow')
      
      cy.wait('@networkError')
      cy.get('[data-cy="error-message"]').should('be.visible')
      cy.get('[data-cy="retry-button"]').should('be.enabled')
      
      // Test retry functionality
      cy.intercept('GET', '/api/books**', { fixture: 'books.json' }).as('booksRetry')
      cy.get('[data-cy="retry-button"]').click()
      
      cy.wait('@booksRetry')
      cy.get('[data-cy="book-grid"]').should('be.visible')
    })

    it('should handle session expiry', () => {
      cy.loginAsUser('borrower')
      
      // Clear session storage to simulate expiry
      cy.clearLocalStorage()
      cy.clearCookies()
      
      cy.visit('/borrow')
      
      // Should redirect to login
      cy.url().should('include', '/login')
      cy.get('[data-cy="session-expired"]').should('be.visible')
    })
  })
})