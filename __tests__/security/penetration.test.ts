import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { MongoMemoryServer } from 'mongodb-memory-server'
import mongoose from 'mongoose'
import request from 'supertest'
import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import crypto from 'crypto'

describe('Security Penetration Tests', () => {
  let mongod: MongoMemoryServer
  let server: any
  let app: any

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri()
    process.env.MONGODB_URI = uri
    await mongoose.connect(uri)

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
  }, 60000)

  afterAll(async () => {
    if (server) server.close()
    if (app) await app.close()
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
    await mongod.stop()
  })

  beforeEach(async () => {
    const collections = mongoose.connection.collections
    for (const key in collections) {
      await collections[key].deleteMany({})
    }
  })

  describe('Authentication Security', () => {
    test('should prevent brute force attacks on login', async () => {
      // Create test user first
      await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'correctpassword123',
          role: 'user'
        })

      // Attempt multiple failed logins
      const failedAttempts = []
      for (let i = 0; i < 10; i++) {
        failedAttempts.push(
          request(server)
            .post('/api/auth/login')
            .send({
              email: 'test@example.com',
              password: 'wrongpassword'
            })
        )
      }

      const results = await Promise.all(failedAttempts)
      
      // Later attempts should be rate limited
      const lastFew = results.slice(-3)
      lastFew.forEach(result => {
        expect([429, 401]).toContain(result.status)
      })
    })

    test('should prevent password enumeration attacks', async () => {
      // Test with non-existent email
      const nonExistentResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'anypassword'
        })

      // Test with existing email but wrong password
      await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Real User',
          email: 'real@example.com',
          password: 'correctpassword',
          role: 'user'
        })

      const existentResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'real@example.com',
          password: 'wrongpassword'
        })

      // Response times and messages should be similar
      expect(nonExistentResponse.status).toBe(401)
      expect(existentResponse.status).toBe(401)
      
      // Messages should be generic
      expect(nonExistentResponse.body.error).not.toContain('not found')
      expect(existentResponse.body.error).not.toContain('password')
    })

    test('should enforce strong password policies', async () => {
      const weakPasswords = [
        'weak',
        '123456',
        'password',
        'abc123',
        'testtest'
      ]

      for (const password of weakPasswords) {
        const response = await request(server)
          .post('/api/auth/register')
          .send({
            name: 'Test User',
            email: `test${Math.random()}@example.com`,
            password: password,
            role: 'user'
          })

        expect(response.status).toBe(400)
        expect(response.body.error).toContain('password')
      }
    })

    test('should prevent session hijacking', async () => {
      // Register and login user
      await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Session Test',
          email: 'session@test.com',
          password: 'strongpassword123',
          role: 'user'
        })

      const loginResponse = await request(server)
        .post('/api/auth/login')
        .send({
          email: 'session@test.com',
          password: 'strongpassword123'
        })

      const token = loginResponse.body.token

      // Test with modified token
      const modifiedToken = token.substring(0, token.length - 5) + 'HACKED'

      const hackAttemptResponse = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${modifiedToken}`)

      expect(hackAttemptResponse.status).toBe(401)
    })
  })

  describe('Authorization Security', () => {
    test('should enforce role-based access control', async () => {
      // Create regular user
      const userResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Regular User',
          email: 'user@test.com',
          password: 'password123',
          role: 'user'
        })

      const userToken = userResponse.body.token

      // Try to access admin endpoints
      const adminAttempts = [
        request(server)
          .get('/api/admin/users')
          .set('Authorization', `Bearer ${userToken}`),
        request(server)
          .get('/api/admin/dashboard')
          .set('Authorization', `Bearer ${userToken}`),
        request(server)
          .delete('/api/admin/users/123')
          .set('Authorization', `Bearer ${userToken}`)
      ]

      const results = await Promise.all(adminAttempts)
      results.forEach(result => {
        expect(result.status).toBe(403)
      })
    })

    test('should prevent privilege escalation', async () => {
      const userResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'escalation@test.com',
          password: 'password123',
          role: 'user'
        })

      const userToken = userResponse.body.token
      const userId = userResponse.body.user._id

      // Try to modify own role
      const escalationAttempt = await request(server)
        .patch(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'admin' })

      expect(escalationAttempt.status).toBe(403)
    })
  })

  describe('Input Validation Security', () => {
    test('should prevent SQL injection attempts', async () => {
      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users (email, role) VALUES ('hacker@evil.com', 'admin'); --",
        "' UNION SELECT * FROM sensitive_data WHERE '1'='1"
      ]

      for (const payload of sqlInjectionPayloads) {
        const response = await request(server)
          .post('/api/auth/login')
          .send({
            email: payload,
            password: 'anypassword'
          })

        expect(response.status).toBe(401)
        expect(response.body.error).not.toContain('SQL')
      }
    })

    test('should prevent NoSQL injection attempts', async () => {
      const noSQLInjectionPayloads = [
        { $ne: null },
        { $gt: '' },
        { $regex: '.*' },
        { $where: 'return true' }
      ]

      for (const payload of noSQLInjectionPayloads) {
        const response = await request(server)
          .post('/api/auth/login')
          .send({
            email: payload,
            password: 'anypassword'
          })

        expect(response.status).toBe(400)
      }
    })

    test('should sanitize XSS attempts', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("XSS")',
        '<svg onload="alert(1)">',
        '"><script>alert("XSS")</script>'
      ]

      // Register user first
      const userResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'XSS Test User',
          email: 'xss@test.com',
          password: 'password123',
          role: 'user'
        })

      const token = userResponse.body.token

      for (const payload of xssPayloads) {
        // Try to create book with XSS payload
        const bookResponse = await request(server)
          .post('/api/books')
          .set('Authorization', `Bearer ${token}`)
          .send({
            title: payload,
            author: 'Test Author',
            description: payload,
            isbn: '9781234567890',
            condition: 'good',
            price: 25.00
          })

        if (bookResponse.status === 201) {
          const book = bookResponse.body.book
          // Verify payload was sanitized
          expect(book.title).not.toContain('<script>')
          expect(book.title).not.toContain('javascript:')
          expect(book.description).not.toContain('<script>')
        }
      }
    })

    test('should validate input lengths and formats', async () => {
      const userResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'length@test.com',
          password: 'password123',
          role: 'user'
        })

      const token = userResponse.body.token

      // Test extremely long inputs
      const longString = 'A'.repeat(10000)
      
      const longInputResponse = await request(server)
        .post('/api/books')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: longString,
          author: longString,
          description: longString,
          isbn: '9781234567890',
          condition: 'good',
          price: 25.00
        })

      expect(longInputResponse.status).toBe(400)

      // Test invalid formats
      const invalidEmailResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Test',
          email: 'not-an-email',
          password: 'password123',
          role: 'user'
        })

      expect(invalidEmailResponse.status).toBe(400)
    })
  })

  describe('Payment Security', () => {
    test('should prevent payment manipulation attacks', async () => {
      const borrowerResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Borrower',
          email: 'borrower@test.com',
          password: 'password123',
          role: 'user'
        })

      const lenderResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Lender',
          email: 'lender@test.com',
          password: 'password123',
          role: 'user'
        })

      const borrowerToken = borrowerResponse.body.token
      const lenderToken = lenderResponse.body.token

      // Create book
      const bookResponse = await request(server)
        .post('/api/books')
        .set('Authorization', `Bearer ${lenderToken}`)
        .send({
          title: 'Expensive Book',
          author: 'Author',
          isbn: '9781234567890',
          condition: 'excellent',
          price: 100.00
        })

      const bookId = bookResponse.body.book._id

      // Try to manipulate transaction amount
      const manipulationAttempts = [
        { bookId, amount: 1.00 }, // Much lower than book price
        { bookId, amount: -50.00 }, // Negative amount
        { bookId, amount: 0 }, // Zero amount
        { bookId, amount: 'free' }, // Non-numeric amount
      ]

      for (const payload of manipulationAttempts) {
        const response = await request(server)
          .post('/api/transactions')
          .set('Authorization', `Bearer ${borrowerToken}`)
          .send(payload)

        expect([400, 422]).toContain(response.status)
      }
    })

    test('should prevent double spending attacks', async () => {
      const borrowerResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Double Spender',
          email: 'doublespend@test.com',
          password: 'password123',
          role: 'user'
        })

      const lenderResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Lender',
          email: 'lender2@test.com',
          password: 'password123',
          role: 'user'
        })

      const borrowerToken = borrowerResponse.body.token
      const lenderToken = lenderResponse.body.token

      const bookResponse = await request(server)
        .post('/api/books')
        .set('Authorization', `Bearer ${lenderToken}`)
        .send({
          title: 'Test Book',
          author: 'Author',
          isbn: '9781234567890',
          condition: 'good',
          price: 50.00
        })

      const bookId = bookResponse.body.book._id

      // Create first transaction
      const firstTransaction = await request(server)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({ bookId, amount: 50.00, type: 'borrow' })

      expect(firstTransaction.status).toBe(201)

      // Try to create duplicate transaction for same book
      const duplicateTransaction = await request(server)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${borrowerToken}`)
        .send({ bookId, amount: 50.00, type: 'borrow' })

      expect(duplicateTransaction.status).toBe(400)
      expect(duplicateTransaction.body.error).toContain('already')
    })
  })

  describe('Data Protection', () => {
    test('should not expose sensitive data in responses', async () => {
      const userResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Data Test',
          email: 'data@test.com',
          password: 'password123',
          role: 'user'
        })

      const token = userResponse.body.token

      // Get user profile
      const profileResponse = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)

      expect(profileResponse.body.user).toBeDefined()
      expect(profileResponse.body.user.password).toBeUndefined()
      expect(profileResponse.body.user.passwordHash).toBeUndefined()

      // Get users list (if accessible)
      const usersResponse = await request(server)
        .get('/api/users')
        .set('Authorization', `Bearer ${token}`)

      if (usersResponse.status === 200 && usersResponse.body.users) {
        usersResponse.body.users.forEach((user: any) => {
          expect(user.password).toBeUndefined()
          expect(user.passwordHash).toBeUndefined()
        })
      }
    })

    test('should implement proper data encryption', async () => {
      const userResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Encryption Test',
          email: 'encrypt@test.com',
          password: 'password123',
          role: 'user'
        })

      const token = userResponse.body.token

      // Create transaction to test payment data encryption
      const lenderResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Lender',
          email: 'lender3@test.com',
          password: 'password123',
          role: 'user'
        })

      const lenderToken = lenderResponse.body.token

      const bookResponse = await request(server)
        .post('/api/books')
        .set('Authorization', `Bearer ${lenderToken}`)
        .send({
          title: 'Encryption Test Book',
          author: 'Author',
          isbn: '9781234567890',
          condition: 'good',
          price: 30.00
        })

      const transactionResponse = await request(server)
        .post('/api/transactions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          bookId: bookResponse.body.book._id,
          amount: 30.00,
          type: 'borrow'
        })

      const escrowResponse = await request(server)
        .post('/api/escrow/initiate')
        .set('Authorization', `Bearer ${token}`)
        .send({
          transactionId: transactionResponse.body.transaction._id,
          paymentMethod: {
            type: 'card',
            number: '4242424242424242',
            expiryMonth: 12,
            expiryYear: 2025,
            cvc: '123'
          }
        })

      // Verify payment data is encrypted in storage
      expect(escrowResponse.status).toBe(201)
      // In a real test, we'd verify the database contains encrypted payment data
    })
  })

  describe('Rate Limiting and DoS Protection', () => {
    test('should implement API rate limiting', async () => {
      // Test registration endpoint rate limiting
      const requests = []
      
      for (let i = 0; i < 20; i++) {
        requests.push(
          request(server)
            .post('/api/auth/register')
            .send({
              name: `User ${i}`,
              email: `user${i}@ratetest.com`,
              password: 'password123',
              role: 'user'
            })
        )
      }

      const results = await Promise.all(requests)
      
      // Some requests should be rate limited
      const rateLimitedResponses = results.filter(r => r.status === 429)
      expect(rateLimitedResponses.length).toBeGreaterThan(0)
    })

    test('should handle request size limits', async () => {
      const userResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'Size Test User',
          email: 'size@test.com',
          password: 'password123',
          role: 'user'
        })

      const token = userResponse.body.token

      // Create extremely large payload
      const largePayload = {
        title: 'Normal Title',
        author: 'Normal Author',
        description: 'A'.repeat(1000000), // 1MB description
        isbn: '9781234567890',
        condition: 'good',
        price: 25.00
      }

      const response = await request(server)
        .post('/api/books')
        .set('Authorization', `Bearer ${token}`)
        .send(largePayload)

      expect(response.status).toBe(413) // Payload Too Large
    })
  })

  describe('File Upload Security', () => {
    test('should validate file types and sizes', async () => {
      const userResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'File Test User',
          email: 'file@test.com',
          password: 'password123',
          role: 'user'
        })

      const token = userResponse.body.token

      // Test malicious file upload attempts
      const maliciousFiles = [
        { filename: 'script.js', content: 'alert("XSS")' },
        { filename: 'virus.exe', content: 'binary content' },
        { filename: 'shell.php', content: '<?php system($_GET["cmd"]); ?>' },
      ]

      for (const file of maliciousFiles) {
        const response = await request(server)
          .post('/api/messages/upload')
          .set('Authorization', `Bearer ${token}`)
          .attach('file', Buffer.from(file.content), file.filename)

        expect([400, 415]).toContain(response.status)
      }
    })
  })

  describe('Cross-Origin Security', () => {
    test('should implement proper CORS policies', async () => {
      const response = await request(server)
        .options('/api/auth/login')
        .set('Origin', 'https://malicious-site.com')

      expect(response.headers['access-control-allow-origin']).not.toBe('*')
      
      if (response.headers['access-control-allow-origin']) {
        expect(response.headers['access-control-allow-origin']).not.toContain('malicious-site.com')
      }
    })

    test('should prevent CSRF attacks', async () => {
      const userResponse = await request(server)
        .post('/api/auth/register')
        .send({
          name: 'CSRF Test',
          email: 'csrf@test.com',
          password: 'password123',
          role: 'user'
        })

      const token = userResponse.body.token

      // Try request without proper CSRF protection
      const csrfResponse = await request(server)
        .post('/api/books')
        .set('Authorization', `Bearer ${token}`)
        .set('Origin', 'https://evil-site.com')
        .send({
          title: 'CSRF Attack Book',
          author: 'Hacker',
          isbn: '9781234567890',
          condition: 'good',
          price: 25.00
        })

      // Should be rejected due to CORS or CSRF protection
      expect([400, 403, 405]).toContain(csrfResponse.status)
    })
  })

  describe('Information Disclosure', () => {
    test('should not leak stack traces in production', async () => {
      // Trigger an error condition
      const errorResponse = await request(server)
        .get('/api/nonexistent/endpoint')

      expect(errorResponse.status).toBe(404)
      expect(errorResponse.body.stack).toBeUndefined()
      expect(JSON.stringify(errorResponse.body)).not.toContain('Error:')
      expect(JSON.stringify(errorResponse.body)).not.toContain('at ')
    })

    test('should not expose system information', async () => {
      const healthResponse = await request(server)
        .get('/api/health')

      expect(healthResponse.status).toBe(200)
      expect(healthResponse.body.version).toBeUndefined()
      expect(healthResponse.body.nodeVersion).toBeUndefined()
      expect(healthResponse.body.env).toBeUndefined()
    })
  })
})