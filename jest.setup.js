import '@testing-library/jest-dom'
import { jest } from '@jest/globals'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      back: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock environment variables
process.env.MONGODB_URI = global.__MONGO_URI__
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only'
process.env.ESCROW_ENCRYPTION_KEY = 'test-escrow-encryption-key-32-bytes'
process.env.AUDIT_ENCRYPTION_KEY = 'test-audit-encryption-key-32-bytes!'

// Global test utilities
global.mockUser = {
  _id: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  name: 'Test User',
  role: 'user',
}

global.mockBook = {
  _id: '507f1f77bcf86cd799439012',
  title: 'Test Book',
  author: 'Test Author',
  isbn: '9781234567890',
  condition: 'good',
  price: 25.00,
  owner: '507f1f77bcf86cd799439011',
}

global.mockTransaction = {
  _id: '507f1f77bcf86cd799439013',
  borrower: '507f1f77bcf86cd799439011',
  lender: '507f1f77bcf86cd799439014',
  book: '507f1f77bcf86cd799439012',
  amount: 25.00,
  status: 'pending',
  escrowStatus: 'initialized',
}