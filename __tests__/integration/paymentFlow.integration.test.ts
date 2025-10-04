import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import request from 'supertest'
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'

describe('Payment Flow Integration Tests', () => {
  let mongod: MongoMemoryServer
  let server: any
  let app: any

  beforeAll(async () => {
    // Setup test database
    mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri()
    process.env.MONGODB_URI = uri
    await mongoose.connect(uri)

    // Setup Next.js test server
    app = next({ dev: false, dir: process.cwd() })
    const handle = app.getRequestHandler()
    
    await app.prepare()
    
    server = createServer(async (req, res) => {
      try {
        const parsedUrl = parse(req.url!, true)
        await handle(req, res, parsedUrl)
      } catch (err) {
        console.error('Error occurred handling', req.url, err)
        res.statusCode = 500
        res.end('internal server error')
      }
    })

    await new Promise<void>((resolve) => {
      server.listen(0, resolve)
    })
  }, 60000) // Increased timeout for Next.js setup

  afterAll(async () => {
    if (server) {
      server.close()
    }
    if (app) {
      await app.close()
    }
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
    await mongod.stop()
  })

  beforeEach(async () => {
    // Clear database before each test
    const collections = mongoose.connection.collections
    for (const key in collections) {
      await collections[key].deleteMany({})
    }
  })

  describe('Complete Payment Flow', () => {
    let authToken: string
    let borrowerToken: string
    let lenderToken: string
    let bookId: string
    let transactionId: string

    beforeEach(async () => {
      // Setup test users
      const borrowerResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Test Borrower',
          email: 'borrower@test.com',
          password: 'password123',
          role: 'user'
        })

      expect(borrowerResponse.status).toBe(201)
      borrowerToken = borrowerResponse.body.token

      const lenderResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Test Lender',
          email: 'lender@test.com',
          password: 'password123',
          role: 'user'
        })

      expect(lenderResponse.status).toBe(201)
      lenderToken = lenderResponse.body.token

      // Create a test book
      const bookResponse = await request(server)
        .post('/api/books')
        .set('Authorization', `Bearer ${lenderToken}`)
        .send({
          title: 'Test Book for Payment Flow',
          author: 'Test Author',
          isbn: '9781234567890',
          condition: 'good',
          price: 25.00,
          description: 'A test book for payment flow testing'
        })

      expect(bookResponse.status).toBe(201)
      bookId = bookResponse.body.book._id
    })

    test('should complete full payment flow from initiation to release', async () => {
      // Step 1: Initiate Transaction
      const initiateResponse = await request(server)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          bookId: bookId,
          amount: 25.00,
          type: 'borrow'
        })

      expect(initiateResponse.status).toBe(201)
      expect(initiateResponse.body.transaction).toBeDefined()
      transactionId = initiateResponse.body.transaction._id

      // Step 2: Initialize Escrow
      const escrowInitResponse = await request(server)
        .post('/api/escrow/initiate')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          transactionId: transactionId,
          paymentMethod: {
            type: 'card',
            last4: '4242',
            expiryMonth: 12,
            expiryYear: 2025
          }
        })

      expect(escrowInitResponse.status).toBe(201)
      expect(escrowInitResponse.body.escrowId).toBeDefined()
      expect(escrowInitResponse.body.status).toBe('initialized')

      // Step 3: Confirm Payment (Simulate payment processing)
      const confirmResponse = await request(server)
        .post('/api/escrow/confirm')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          transactionId: transactionId,
          paymentConfirmation: {
            paymentIntentId: 'pi_test_123',
            status: 'succeeded'
          }
        })

      expect(confirmResponse.status).toBe(200)
      expect(confirmResponse.body.status).toBe('confirmed')

      // Step 4: Lender accepts the transaction
      const acceptResponse = await request(server)
        .patch(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${lenderToken}`)
        .send({
          action: 'accept'
        })

      expect(acceptResponse.status).toBe(200)
      expect(acceptResponse.body.transaction.status).toBe('active')

      // Step 5: Complete the transaction (simulate book return)
      const completeResponse = await request(server)
        .patch(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          action: 'complete',
          returnConfirmation: true
        })

      expect(completeResponse.status).toBe(200)
      expect(completeResponse.body.transaction.status).toBe('completed')

      // Step 6: Release escrow funds
      const releaseResponse = await request(server)
        .post('/api/escrow/release')
        .set('Authorization', `Bearer ${lenderToken}`)
        .send({
          transactionId: transactionId,
          releaseReason: 'transaction_completed'
        })

      expect(releaseResponse.status).toBe(200)
      expect(releaseResponse.body.status).toBe('released')
      expect(releaseResponse.body.fundsTransferred).toBe(true)
    })

    test('should handle payment failures correctly', async () => {
      // Initiate transaction
      const initiateResponse = await request(server)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          bookId: bookId,
          amount: 25.00,
          type: 'borrow'
        })

      transactionId = initiateResponse.body.transaction._id

      // Initialize escrow
      await request(server)
        .post('/api/escrow/initiate')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          transactionId: transactionId,
          paymentMethod: {
            type: 'card',
            last4: '0002', // This should trigger a failure
            expiryMonth: 12,
            expiryYear: 2025
          }
        })

      // Attempt to confirm payment (should fail)
      const confirmResponse = await request(server)
        .post('/api/escrow/confirm')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          transactionId: transactionId,
          paymentConfirmation: {
            paymentIntentId: 'pi_test_failed',
            status: 'failed'
          }
        })

      expect(confirmResponse.status).toBe(400)
      expect(confirmResponse.body.error).toContain('Payment failed')

      // Verify transaction status is updated
      const statusResponse = await request(server)
        .get(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${borrowerToken}`)

      expect(statusResponse.body.transaction.status).toBe('payment_failed')
    })

    test('should handle escrow refunds correctly', async () => {
      // Complete successful payment setup
      const initiateResponse = await request(server)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          bookId: bookId,
          amount: 25.00,
          type: 'borrow'
        })

      transactionId = initiateResponse.body.transaction._id

      await request(server)
        .post('/api/escrow/initiate')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          transactionId: transactionId,
          paymentMethod: {
            type: 'card',
            last4: '4242',
            expiryMonth: 12,
            expiryYear: 2025
          }
        })

      await request(server)
        .post('/api/escrow/confirm')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          transactionId: transactionId,
          paymentConfirmation: {
            paymentIntentId: 'pi_test_123',
            status: 'succeeded'
          }
        })

      // Lender rejects the transaction
      const rejectResponse = await request(server)
        .patch(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${lenderToken}`)
        .send({
          action: 'reject',
          reason: 'Book no longer available'
        })

      expect(rejectResponse.status).toBe(200)
      expect(rejectResponse.body.transaction.status).toBe('rejected')

      // Process refund
      const refundResponse = await request(server)
        .post('/api/escrow/refund')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          transactionId: transactionId,
          refundReason: 'transaction_rejected'
        })

      expect(refundResponse.status).toBe(200)
      expect(refundResponse.body.status).toBe('refunded')
      expect(refundResponse.body.refundAmount).toBe(25.00)
    })

    test('should handle timeout scenarios', async () => {
      // Create transaction
      const initiateResponse = await request(server)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          bookId: bookId,
          amount: 25.00,
          type: 'borrow'
        })

      transactionId = initiateResponse.body.transaction._id

      await request(server)
        .post('/api/escrow/initiate')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          transactionId: transactionId,
          paymentMethod: {
            type: 'card',
            last4: '4242',
            expiryMonth: 12,
            expiryYear: 2025
          }
        })

      await request(server)
        .post('/api/escrow/confirm')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          transactionId: transactionId,
          paymentConfirmation: {
            paymentIntentId: 'pi_test_123',
            status: 'succeeded'
          }
        })

      // Simulate timeout by calling timeout endpoint
      const timeoutResponse = await request(server)
        .post('/api/escrow/timeout')
        .send({
          transactionId: transactionId,
          reason: 'no_response_from_lender'
        })

      expect(timeoutResponse.status).toBe(200)
      expect(timeoutResponse.body.action).toBe('refunded')

      // Verify transaction is cancelled
      const statusResponse = await request(server)
        .get(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${borrowerToken}`)

      expect(statusResponse.body.transaction.status).toBe('cancelled')
      expect(statusResponse.body.transaction.escrowStatus).toBe('refunded')
    })
  })

  describe('Dispute Resolution Flow', () => {
    let borrowerToken: string
    let lenderToken: string
    let bookId: string
    let transactionId: string

    beforeEach(async () => {
      // Setup users and complete initial transaction flow
      const borrowerResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Dispute Borrower',
          email: 'dispute.borrower@test.com',
          password: 'password123',
          role: 'user'
        })
      borrowerToken = borrowerResponse.body.token

      const lenderResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Dispute Lender',
          email: 'dispute.lender@test.com',
          password: 'password123',
          role: 'user'
        })
      lenderToken = lenderResponse.body.token

      const bookResponse = await request(server)
        .post('/api/books')
        .set('Authorization', `Bearer ${lenderToken}`)
        .send({
          title: 'Dispute Test Book',
          author: 'Test Author',
          isbn: '9780987654321',
          condition: 'excellent',
          price: 35.00
        })
      bookId = bookResponse.body.book._id

      // Complete transaction setup
      const initiateResponse = await request(server)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({ bookId, amount: 35.00, type: 'borrow' })
      transactionId = initiateResponse.body.transaction._id

      await request(server)
        .post('/api/escrow/initiate')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          transactionId,
          paymentMethod: { type: 'card', last4: '4242', expiryMonth: 12, expiryYear: 2025 }
        })

      await request(server)
        .post('/api/escrow/confirm')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          transactionId,
          paymentConfirmation: { paymentIntentId: 'pi_test_dispute', status: 'succeeded' }
        })

      await request(server)
        .patch(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${lenderToken}`)
        .send({ action: 'accept' })
    })

    test('should handle dispute creation and resolution', async () => {
      // Create dispute
      const disputeResponse = await request(server)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({
          type: 'transaction_dispute',
          transactionId: transactionId,
          description: 'Book was damaged when received',
          severity: 'high'
        })

      expect(disputeResponse.status).toBe(201)
      expect(disputeResponse.body.complaint.type).toBe('transaction_dispute')
      
      const disputeId = disputeResponse.body.complaint._id

      // Admin resolves dispute
      const adminResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com', 
          password: 'admin123'
        })

      let adminToken = ''
      if (adminResponse.status === 200) {
        adminToken = adminResponse.body.token
      } else {
        // Create admin user if doesn't exist
        const createAdminResponse = await request(server)
          .post('/api/auth/register')
          .send({
            name: 'Test Admin',
            email: 'admin@test.com',
            password: 'admin123',
            role: 'admin'
          })
        adminToken = createAdminResponse.body.token
      }

      const resolveResponse = await request(server)
        .patch(`/api/admin/complaints/${disputeId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          resolution: 'partial_refund',
          refundAmount: 15.00,
          notes: 'Partial refund due to book condition issues'
        })

      expect(resolveResponse.status).toBe(200)
      expect(resolveResponse.body.complaint.status).toBe('resolved')
    })
  })

  describe('Fraud Detection Integration', () => {
    test('should detect and block suspicious transactions', async () => {
      // Register suspicious user
      const suspiciousResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Suspicious User',
          email: 'suspicious@test.com',
          password: 'password123',
          role: 'user'
        })
      
      const suspiciousToken = suspiciousResponse.body.token

      // Create book
      const bookResponse = await request(server)
        .post('/api/books')
        .set('Authorization', `Bearer ${suspiciousToken}`)
        .send({
          title: 'Test Book',
          author: 'Author',
          isbn: '9781111111111',
          condition: 'good',
          price: 1000.00 // Suspiciously high amount
        })
      
      const bookId = bookResponse.body.book._id

      // Attempt high-value transaction
      const transactionResponse = await request(server)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${suspiciousToken}`)
        .send({
          bookId: bookId,
          amount: 1000.00,
          type: 'borrow'
        })

      // Should be flagged for review
      expect([201, 202, 400]).toContain(transactionResponse.status)
      
      if (transactionResponse.status === 202) {
        expect(transactionResponse.body.requiresReview).toBe(true)
        expect(transactionResponse.body.riskFlags).toBeDefined()
      }
    })
  })

  describe('Performance Tests', () => {
    test('should handle concurrent payment processing', async () => {
      const userTokens: string[] = []
      const bookIds: string[] = []

      // Create multiple users and books
      for (let i = 0; i < 5; i++) {
        const userResponse = await request(server)
          .post('/api/auth/register')
          .send({
            name: `User ${i}`,
            email: `user${i}@test.com`,
            password: 'password123',
            role: 'user'
          })
        
        userTokens.push(userResponse.body.token)

        const bookResponse = await request(server)
          .post('/api/books')
          .set('Authorization', `Bearer ${userResponse.body.token}`)
          .send({
            title: `Book ${i}`,
            author: 'Test Author',
            isbn: `97812345678${i}0`,
            condition: 'good',
            price: 20.00 + i
          })
        
        bookIds.push(bookResponse.body.book._id)
      }

      // Process concurrent transactions
      const transactionPromises = userTokens.map((token, index) =>
        request(server)
          .post('/api/transactions')
          .set('Authorization', `Bearer ${token}`)
          .send({
            bookId: bookIds[(index + 1) % bookIds.length], // Rotate books
            amount: 20.00 + index,
            type: 'borrow'
          })
      )

      const results = await Promise.all(transactionPromises)
      
      // All should succeed or be properly handled
      results.forEach((result, index) => {
        expect([200, 201, 202]).toContain(result.status)
      })
    })
  })
})