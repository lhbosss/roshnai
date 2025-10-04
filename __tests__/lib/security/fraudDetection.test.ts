import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { FraudDetectionEngine, PaymentContext, UserHistory } from '../../../src/lib/security/fraudDetection'

describe('FraudDetectionEngine', () => {
  let mongod: MongoMemoryServer
  let fraudEngine: FraudDetectionEngine

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri()
    await mongoose.connect(uri)
    fraudEngine = new FraudDetectionEngine()
  })

  afterAll(async () => {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
    await mongod.stop()
  })

  beforeEach(async () => {
    // Clear all collections before each test
    const collections = mongoose.connection.collections
    for (const key in collections) {
      const collection = collections[key]
      await collection.deleteMany({})
    }
  })

  const createMockPaymentContext = (overrides = {}): PaymentContext => ({
    userId: new mongoose.Types.ObjectId().toString(),
    transactionId: new mongoose.Types.ObjectId().toString(),
    amount: 25.00,
    currency: 'USD',
    paymentMethodId: 'pm_test_123',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    deviceFingerprint: 'device_abc123',
    location: {
      country: 'US',
      region: 'CA',
      city: 'San Francisco',
      timezone: 'America/Los_Angeles'
    },
    timestamp: new Date(),
    merchantId: 'merchant_test',
    ...overrides
  })

  const createMockUserHistory = (overrides = {}): UserHistory => ({
    userId: new mongoose.Types.ObjectId().toString(),
    accountAge: 90, // days
    totalTransactions: 15,
    averageTransactionAmount: 30.00,
    lastTransactionDate: new Date(Date.now() - 86400000), // 1 day ago
    frequentLocations: ['US-CA-San Francisco'],
    frequentDevices: ['device_abc123'],
    frequentPaymentMethods: ['pm_test_123'],
    failedTransactionCount: 0,
    chargebackCount: 0,
    disputeCount: 0,
    ...overrides
  })

  describe('analyzePayment', () => {
    test('should analyze legitimate payment with low risk', async () => {
      const context = createMockPaymentContext()
      const userHistory = createMockUserHistory()
      const recentTransactions = [
        { amount: 25.00, timestamp: new Date(Date.now() - 86400000), location: 'US-CA-San Francisco' },
        { amount: 30.00, timestamp: new Date(Date.now() - 172800000), location: 'US-CA-San Francisco' }
      ]

      const result = await fraudEngine.analyzePayment(context, userHistory, recentTransactions)

      expect(result.riskScore).toBeLessThan(50)
      expect(result.recommendation).toBe('approve')
      expect(result.confidence).toBeGreaterThan(0.7)
      expect(result.flags).toHaveLength(0)
    })

    test('should detect high-risk payment with multiple flags', async () => {
      const context = createMockPaymentContext({
        amount: 1000.00, // High amount
        ipAddress: '1.1.1.1', // Different location
        location: {
          country: 'RU',
          region: 'MOW',
          city: 'Moscow',
          timezone: 'Europe/Moscow'
        }
      })

      const userHistory = createMockUserHistory({
        frequentLocations: ['US-CA-San Francisco'], // Different from current
        averageTransactionAmount: 25.00 // Much lower than current
      })

      const recentTransactions = [
        { amount: 20.00, timestamp: new Date(Date.now() - 86400000), location: 'US-CA-San Francisco' }
      ]

      const result = await fraudEngine.analyzePayment(context, userHistory, recentTransactions)

      expect(result.riskScore).toBeGreaterThan(70)
      expect(result.recommendation).toBe('decline')
      expect(result.flags.length).toBeGreaterThan(0)
    })

    test('should flag velocity violations', async () => {
      const context = createMockPaymentContext()
      const userHistory = createMockUserHistory()

      // Many recent transactions (velocity abuse)
      const recentTransactions = Array.from({ length: 10 }, (_, i) => ({
        amount: 25.00,
        timestamp: new Date(Date.now() - i * 60000), // 1 minute apart
        location: 'US-CA-San Francisco'
      }))

      const result = await fraudEngine.analyzePayment(context, userHistory, recentTransactions)

      expect(result.riskScore).toBeGreaterThan(60)
      expect(result.flags.some(flag => flag.type.includes('velocity'))).toBe(true)
    })

    test('should handle amount anomalies', async () => {
      const context = createMockPaymentContext({
        amount: 500.00 // Much higher than usual
      })

      const userHistory = createMockUserHistory({
        averageTransactionAmount: 15.00, // Low average
        totalTransactions: 50 // Established user
      })

      const recentTransactions = [
        { amount: 10.00, timestamp: new Date(Date.now() - 86400000) },
        { amount: 15.00, timestamp: new Date(Date.now() - 172800000) }
      ]

      const result = await fraudEngine.analyzePayment(context, userHistory, recentTransactions)

      expect(result.riskScore).toBeGreaterThan(40)
      expect(result.flags.some(flag => flag.type.includes('amount'))).toBe(true)
    })

    test('should detect location anomalies', async () => {
      const context = createMockPaymentContext({
        location: {
          country: 'JP',
          region: 'Tokyo',
          city: 'Tokyo',
          timezone: 'Asia/Tokyo'
        },
        ipAddress: '103.5.140.1' // Japanese IP
      })

      const userHistory = createMockUserHistory({
        frequentLocations: ['US-CA-San Francisco', 'US-NY-New York'], // Different continent
        lastTransactionDate: new Date(Date.now() - 3600000) // 1 hour ago from US
      })

      const recentTransactions = [
        { amount: 25.00, timestamp: new Date(Date.now() - 7200000), location: 'US-CA-San Francisco' }
      ]

      const result = await fraudEngine.analyzePayment(context, userHistory, recentTransactions)

      expect(result.flags.some(flag => flag.type.includes('location'))).toBe(true)
      expect(result.riskScore).toBeGreaterThan(30)
    })

    test('should flag suspicious device patterns', async () => {
      const context = createMockPaymentContext({
        deviceFingerprint: 'unknown_device_xyz789'
      })

      const userHistory = createMockUserHistory({
        frequentDevices: ['device_abc123', 'device_def456'], // Different devices
        totalTransactions: 100 // Established user
      })

      const recentTransactions = [
        { amount: 25.00, timestamp: new Date(Date.now() - 86400000) }
      ]

      const result = await fraudEngine.analyzePayment(context, userHistory, recentTransactions)

      expect(result.flags.some(flag => flag.type.includes('device'))).toBe(true)
    })
  })

  describe('risk scoring', () => {
    test('should calculate risk scores correctly', async () => {
      const lowRiskContext = createMockPaymentContext({
        amount: 20.00
      })

      const highRiskContext = createMockPaymentContext({
        amount: 2000.00,
        ipAddress: '1.1.1.1',
        deviceFingerprint: 'suspicious_device'
      })

      const userHistory = createMockUserHistory()
      const recentTransactions = []

      const lowRiskResult = await fraudEngine.analyzePayment(lowRiskContext, userHistory, recentTransactions)
      const highRiskResult = await fraudEngine.analyzePayment(highRiskContext, userHistory, recentTransactions)

      expect(lowRiskResult.riskScore).toBeLessThan(highRiskResult.riskScore)
    })

    test('should provide confidence levels', async () => {
      const context = createMockPaymentContext()
      const userHistory = createMockUserHistory({
        totalTransactions: 100 // Well-established user provides high confidence
      })
      const recentTransactions = []

      const result = await fraudEngine.analyzePayment(context, userHistory, recentTransactions)

      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
      expect(result.confidence).toBeGreaterThan(0.5) // High confidence for established user
    })
  })

  describe('recommendation engine', () => {
    test('should recommend approval for low-risk transactions', async () => {
      const context = createMockPaymentContext({
        amount: 15.00
      })

      const userHistory = createMockUserHistory({
        totalTransactions: 50,
        averageTransactionAmount: 18.00,
        chargebackCount: 0
      })

      const recentTransactions = [
        { amount: 16.00, timestamp: new Date(Date.now() - 86400000) }
      ]

      const result = await fraudEngine.analyzePayment(context, userHistory, recentTransactions)

      expect(result.recommendation).toBe('approve')
    })

    test('should recommend decline for high-risk transactions', async () => {
      const context = createMockPaymentContext({
        amount: 1500.00, // Very high
        ipAddress: '192.0.2.1' // Test IP that might be flagged
      })

      const userHistory = createMockUserHistory({
        totalTransactions: 2, // New user
        averageTransactionAmount: 10.00,
        chargebackCount: 1 // Previous issues
      })

      const recentTransactions = []

      const result = await fraudEngine.analyzePayment(context, userHistory, recentTransactions)

      expect(result.recommendation).toBe('decline')
    })

    test('should recommend review for medium-risk transactions', async () => {
      const context = createMockPaymentContext({
        amount: 150.00 // Moderately high
      })

      const userHistory = createMockUserHistory({
        totalTransactions: 10,
        averageTransactionAmount: 50.00
      })

      const recentTransactions = [
        { amount: 45.00, timestamp: new Date(Date.now() - 86400000) }
      ]

      const result = await fraudEngine.analyzePayment(context, userHistory, recentTransactions)

      // Should be either approve or review, not decline
      expect(['approve', 'review']).toContain(result.recommendation)
    })
  })

  describe('error handling', () => {
    test('should handle invalid payment context', async () => {
      const invalidContext = {
        userId: 'invalid-id',
        amount: 'not-a-number'
      } as any

      const userHistory = createMockUserHistory()
      const recentTransactions = []

      await expect(
        fraudEngine.analyzePayment(invalidContext, userHistory, recentTransactions)
      ).rejects.toThrow()
    })

    test('should handle missing user history gracefully', async () => {
      const context = createMockPaymentContext()
      const emptyUserHistory = createMockUserHistory({
        totalTransactions: 0,
        averageTransactionAmount: 0,
        accountAge: 0
      })
      const recentTransactions = []

      const result = await fraudEngine.analyzePayment(context, emptyUserHistory, recentTransactions)

      expect(result.riskScore).toBeGreaterThan(30) // New users are riskier
      expect(result.confidence).toBeLessThan(0.8) // Lower confidence for new users
    })
  })

  describe('performance', () => {
    test('should handle concurrent fraud checks', async () => {
      const contexts = Array.from({ length: 5 }, () => createMockPaymentContext({
        userId: new mongoose.Types.ObjectId().toString(),
        transactionId: new mongoose.Types.ObjectId().toString()
      }))

      const userHistory = createMockUserHistory()
      const recentTransactions = []

      const promises = contexts.map(context =>
        fraudEngine.analyzePayment(context, userHistory, recentTransactions)
      )

      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      results.forEach(result => {
        expect(typeof result.riskScore).toBe('number')
        expect(typeof result.confidence).toBe('number')
        expect(['approve', 'review', 'decline']).toContain(result.recommendation)
      })
    })

    test('should complete analysis within reasonable time', async () => {
      const context = createMockPaymentContext()
      const userHistory = createMockUserHistory()
      const recentTransactions = Array.from({ length: 20 }, (_, i) => ({
        amount: 20 + Math.random() * 10,
        timestamp: new Date(Date.now() - i * 3600000),
        location: 'US-CA-San Francisco'
      }))

      const startTime = Date.now()
      const result = await fraudEngine.analyzePayment(context, userHistory, recentTransactions)
      const duration = Date.now() - startTime

      expect(duration).toBeLessThan(1000) // Should complete within 1 second
      expect(result).toBeDefined()
    })
  })
})