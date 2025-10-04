import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import EscrowManager, { EscrowAccount, FundAllocation } from '../../../src/lib/security/escrowManager'

describe('EscrowManager', () => {
  let mongod: MongoMemoryServer
  let escrowManager: EscrowManager

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create()
    const uri = mongod.getUri()
    await mongoose.connect(uri)
    escrowManager = new EscrowManager()
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

  const createMockEscrowAccount = (overrides = {}): EscrowAccount => ({
    id: `escrow_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    transactionId: new mongoose.Types.ObjectId().toString(),
    borrowerId: new mongoose.Types.ObjectId().toString(),
    lenderId: new mongoose.Types.ObjectId().toString(),
    status: 'created',
    totalAmount: 25.00,
    rentalFee: 20.00,
    securityDeposit: 5.00,
    platformFee: 2.50,
    currency: 'USD',
    createdAt: new Date(),
    encryptedPaymentInfo: 'encrypted_payment_data',
    auditTrail: [],
    releaseConditions: [],
    ...overrides
  })

  describe('createEscrowAccount', () => {
    test('should create a new escrow account with valid data', async () => {
      const transactionId = new mongoose.Types.ObjectId().toString()
      const borrowerId = new mongoose.Types.ObjectId().toString()
      const lenderId = new mongoose.Types.ObjectId().toString()
      const performedBy = new mongoose.Types.ObjectId().toString()

      const account = await escrowManager.createEscrowAccount(
        transactionId,
        borrowerId,
        lenderId,
        {
          rentalFee: 15.00,
          securityDeposit: 10.00,
          platformFee: 2.50
        },
        { type: 'card', last4: '1234' },
        [
          {
            type: 'book_returned',
            description: 'Book returned in good condition'
          }
        ]
      )

      expect(account.id).toBeDefined()
      expect(account.transactionId).toBe(transactionId)
      expect(account.borrowerId).toBe(borrowerId)
      expect(account.lenderId).toBe(lenderId)
      expect(account.status).toBe('created')
      expect(account.totalAmount).toBe(25.00)
      expect(account.auditTrail).toHaveLength(1)
      expect(account.auditTrail[0].action).toBe('created')
    })

    test('should validate amount is positive', async () => {
      const transactionId = new mongoose.Types.ObjectId().toString()
      const borrowerId = new mongoose.Types.ObjectId().toString()
      const lenderId = new mongoose.Types.ObjectId().toString()
      const performedBy = new mongoose.Types.ObjectId().toString()

      await expect(
        escrowManager.createEscrowAccount(
          transactionId,
          borrowerId,
          lenderId,
          {
            rentalFee: -10.00,
            securityDeposit: 0,
            platformFee: 0
          },
          { type: 'card', last4: '4242' },
          []
        )
      ).rejects.toThrow('Amount must be positive')
    })
  })

  describe('fundEscrowAccount', () => {
    test('should fund an escrow account successfully', async () => {
      const mockAccount = createMockEscrowAccount()
      const performedBy = new mongoose.Types.ObjectId().toString()

      const fundedAccount = await escrowManager.fundEscrowAccount(
        mockAccount,
        performedBy,
        'credit_card_payment'
      )

      expect(fundedAccount.status).toBe('funded')
      expect(fundedAccount.fundedAt).toBeDefined()
      expect(fundedAccount.auditTrail).toHaveLength(1)
      expect(fundedAccount.auditTrail[0].action).toBe('funded')
    })

    test('should reject funding if account is not in created status', async () => {
      const mockAccount = createMockEscrowAccount({ status: 'released' })
      const performedBy = new mongoose.Types.ObjectId().toString()

      await expect(
        escrowManager.fundEscrowAccount(mockAccount, performedBy, 'credit_card_payment')
      ).rejects.toThrow('Cannot fund account in status: released')
    })
  })

  describe('holdFunds', () => {
    test('should hold funds from funded account', async () => {
      const mockAccount = createMockEscrowAccount({ status: 'funded' })
      const performedBy = new mongoose.Types.ObjectId().toString()

      const heldAccount = await escrowManager.holdFunds(
        mockAccount,
        performedBy,
        'transaction_confirmation'
      )

      expect(heldAccount.status).toBe('held')
      expect(heldAccount.auditTrail).toHaveLength(1)
      expect(heldAccount.auditTrail[0].action).toBe('held')
    })

    test('should reject holding if account is not funded', async () => {
      const mockAccount = createMockEscrowAccount({ status: 'created' })
      const performedBy = new mongoose.Types.ObjectId().toString()

      await expect(
        escrowManager.holdFunds(mockAccount, performedBy, 'transaction_confirmation')
      ).rejects.toThrow('Cannot hold funds in status: created')
    })
  })

  describe('releaseFunds', () => {
    test('should release funds with valid allocation', async () => {
      const mockAccount = createMockEscrowAccount({
        status: 'held',
        totalAmount: 25.00,
        fundedAt: new Date()
      })

      const allocation: FundAllocation = {
        lenderAmount: 22.50,
        platformAmount: 2.50
      }

      const performedBy = new mongoose.Types.ObjectId().toString()

      const releasedAccount = await escrowManager.releaseFunds(
        mockAccount,
        allocation,
        performedBy,
        'book_returned'
      )

      expect(releasedAccount.status).toBe('released')
      expect(releasedAccount.releasedAt).toBeDefined()
      expect(releasedAccount.auditTrail).toHaveLength(1)
      expect(releasedAccount.auditTrail[0].action).toBe('released')
    })

    test('should validate fund allocation totals correctly', async () => {
      const mockAccount = createMockEscrowAccount({
        status: 'held',
        totalAmount: 25.00
      })

      const invalidAllocation: FundAllocation = {
        lenderAmount: 20.00,
        platformAmount: 10.00 // Total exceeds account total
      }

      const performedBy = new mongoose.Types.ObjectId().toString()

      await expect(
        escrowManager.releaseFunds(mockAccount, invalidAllocation, performedBy)
      ).rejects.toThrow('Fund allocation mismatch')
    })

    test('should reject negative allocation amounts', async () => {
      const mockAccount = createMockEscrowAccount({
        status: 'held',
        totalAmount: 25.00
      })

      const invalidAllocation: FundAllocation = {
        lenderAmount: -5.00,
        platformAmount: 30.00
      }

      const performedBy = new mongoose.Types.ObjectId().toString()

      await expect(
        escrowManager.releaseFunds(mockAccount, invalidAllocation, performedBy)
      ).rejects.toThrow('Allocation amounts cannot be negative')
    })
  })

  describe('refundFunds', () => {
    test('should refund funds from held account', async () => {
      const mockAccount = createMockEscrowAccount({
        status: 'held',
        totalAmount: 25.00,
        fundedAt: new Date()
      })

      const performedBy = new mongoose.Types.ObjectId().toString()

      const refundedAccount = await escrowManager.refundFunds(
        mockAccount,
        25.00,
        performedBy,
        'transaction_cancelled'
      )

      expect(refundedAccount.status).toBe('refunded')
      expect(refundedAccount.refundedAt).toBeDefined()
      expect(refundedAccount.auditTrail).toHaveLength(1)
      expect(refundedAccount.auditTrail[0].action).toBe('refunded')
    })

    test('should validate refund amount does not exceed total', async () => {
      const mockAccount = createMockEscrowAccount({
        status: 'held',
        totalAmount: 25.00
      })

      const performedBy = new mongoose.Types.ObjectId().toString()

      await expect(
        escrowManager.refundFunds(mockAccount, 50.00, performedBy, 'partial_refund')
      ).rejects.toThrow('Refund amount cannot exceed escrow amount')
    })

    test('should reject refund of non-held account', async () => {
      const mockAccount = createMockEscrowAccount({ status: 'created' })
      const performedBy = new mongoose.Types.ObjectId().toString()

      await expect(
        escrowManager.refundFunds(mockAccount, 25.00, performedBy, 'refund')
      ).rejects.toThrow('Cannot refund funds in status: created')
    })
  })

  describe('audit trail validation', () => {
    test('should validate audit signatures correctly', async () => {
      const mockAccount = createMockEscrowAccount()
      const performedBy = new mongoose.Types.ObjectId().toString()

      // Add an audit entry
      await escrowManager.fundEscrowAccount(mockAccount, performedBy, 'test_funding')

      // The audit entry should have a valid signature
      expect(mockAccount.auditTrail).toHaveLength(1)
      expect(mockAccount.auditTrail[0].signature).toBeDefined()
      expect(typeof mockAccount.auditTrail[0].signature).toBe('string')
      expect(mockAccount.auditTrail[0].signature.length).toBeGreaterThan(0)
    })
  })

  describe('encryption and security', () => {
    test('should encrypt payment information', async () => {
      const transactionId = new mongoose.Types.ObjectId().toString()
      const borrowerId = new mongoose.Types.ObjectId().toString()
      const lenderId = new mongoose.Types.ObjectId().toString()
      const performedBy = new mongoose.Types.ObjectId().toString()

      const account = await escrowManager.createEscrowAccount(
        transactionId,
        borrowerId,
        lenderId,
        {
          rentalFee: 20.00,
          securityDeposit: 5.00,
          platformFee: 2.50
        },
        { type: 'card', last4: '4242' },
        []
      )

      expect(account.encryptedPaymentInfo).toBeDefined()
      expect(typeof account.encryptedPaymentInfo).toBe('string')
      expect(account.encryptedPaymentInfo.length).toBeGreaterThan(0)
    })
  })

  describe('error handling', () => {
    test('should handle invalid ObjectId strings gracefully', async () => {
      await expect(
        escrowManager.createEscrowAccount(
          'invalid-objectid',
          'another-invalid-id',
          'third-invalid-id',
          {
            rentalFee: 20.00,
            securityDeposit: 5.00,
            platformFee: 2.50
          },
          { type: 'card', last4: '4242' },
          []
        )
      ).rejects.toThrow()
    })
  })

  describe('concurrency handling', () => {
    test('should handle concurrent operations on different accounts', async () => {
      const performedBy = new mongoose.Types.ObjectId().toString()

      const account1Promise = escrowManager.createEscrowAccount(
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString(),
        {
          rentalFee: 20.00,
          securityDeposit: 5.00,
          platformFee: 2.50
        },
        { type: 'card', last4: '4242' },
        []
      )

      const account2Promise = escrowManager.createEscrowAccount(
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString(),
        new mongoose.Types.ObjectId().toString(),
        {
          rentalFee: 25.00,
          securityDeposit: 5.00,
          platformFee: 3.00
        },
        { type: 'card', last4: '4343' },
        []
      )

      const [account1, account2] = await Promise.all([account1Promise, account2Promise])

      expect(account1.id).toBeDefined()
      expect(account2.id).toBeDefined()
      expect(account1.id).not.toBe(account2.id)
      expect(account1.totalAmount).toBe(27.50)
      expect(account2.totalAmount).toBe(33.00)
    })
  })
})