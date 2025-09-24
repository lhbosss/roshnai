'use client';

import { IBook } from '@/models/Book';

interface PaymentSummaryProps {
  book: IBook;
  rentalDays: number;
  onProceed?: () => void;
  onCancel?: () => void;
  isProcessing?: boolean;
}

export default function PaymentSummary({ 
  book, 
  rentalDays, 
  onProceed, 
  onCancel, 
  isProcessing = false 
}: PaymentSummaryProps) {
  // Calculate rental fee based on book pricing
  const dailyRate = book.rentalFee / book.rentalDuration || 0; // Daily rate from total rental fee
  const rentalFee = dailyRate * rentalDays;
  
  // Security deposit from book model
  const securityDeposit = book.securityDeposit;
  
  // Platform fee (5% of rental fee)
  const platformFee = rentalFee * 0.05;
  
  // Total amount
  const totalAmount = rentalFee + securityDeposit + platformFee;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
      
      {/* Book Details */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-start space-x-4">
          {book.coverUrl && (
            <img 
              src={book.coverUrl} 
              alt={book.title}
              className="w-16 h-20 object-cover rounded"
            />
          )}
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{book.title}</h4>
            {book.author && (
              <p className="text-sm text-gray-600">by {book.author}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Rental period: {rentalDays} day{rentalDays !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Rental fee ({rentalDays} days)</span>
          <span className="font-medium">${rentalFee.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Security deposit</span>
          <span className="font-medium">${securityDeposit.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Platform fee</span>
          <span className="font-medium">${platformFee.toFixed(2)}</span>
        </div>
        
        <hr className="my-3" />
        
        <div className="flex justify-between font-semibold">
          <span>Total Amount</span>
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Escrow Explanation */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">How Escrow Works</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p>• Your payment is held securely until the book transaction is complete</p>
          <p>• The rental fee goes to the lender after you confirm receipt</p>
          <p>• The security deposit is returned when you return the book in good condition</p>
          <p>• Platform fee covers transaction processing and buyer protection</p>
        </div>
      </div>

      {/* Refund Policy */}
      <div className="mb-6 p-4 bg-green-50 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">Refund Policy</h4>
        <div className="text-sm text-green-800 space-y-2">
          <p>• <strong>Security Deposit:</strong> Fully refunded when book is returned undamaged</p>
          <p>• <strong>Rental Fee:</strong> Refundable within 24 hours if book isn't received</p>
          <p>• <strong>Platform Fee:</strong> Non-refundable (covers processing costs)</p>
          <p>• <strong>Damage Policy:</strong> Deducted from security deposit based on condition</p>
        </div>
      </div>

      {/* Payment Timeline */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Payment Timeline</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Payment held in escrow upon checkout</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600">Lender notified to prepare book for pickup/delivery</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Rental fee released when you confirm receipt</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
            <span className="text-gray-600">Security deposit returned when book is returned</span>
          </div>
        </div>
      </div>

      {/* Terms Notice */}
      <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> By proceeding with payment, you agree to our{' '}
          <a href="/terms" className="underline">Terms of Service</a> and{' '}
          <a href="/privacy" className="underline">Privacy Policy</a>. 
          You also acknowledge that you understand the escrow payment process.
        </p>
      </div>

      {/* Action Buttons */}
      {(onProceed || onCancel) && (
        <div className="flex space-x-3">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
          {onProceed && (
            <button
              onClick={onProceed}
              disabled={isProcessing}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium"
            >
              {isProcessing ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
            </button>
          )}
        </div>
      )}

      {/* Contact Support */}
      <div className="mt-4 text-center">
        <p className="text-xs text-gray-500">
          Questions about payment or escrow?{' '}
          <a href="/support" className="text-blue-600 hover:underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
}