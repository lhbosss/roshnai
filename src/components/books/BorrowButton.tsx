import React, { useState } from 'react';

interface BorrowButtonProps {
  book: {
    _id: string;
    title: string;
    available: boolean;
    rentalFee?: number;
    securityDeposit?: number;
    lender: {
      _id: string;
      name: string;
    };
  };
}

export default function BorrowButton({ book }: BorrowButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const rentalFee = book.rentalFee || 0;
  const securityDeposit = book.securityDeposit || 0;
  const totalAmount = rentalFee + securityDeposit;

  const handleBorrowClick = () => {
    if (!book.available) return;
    setShowPaymentModal(true);
  };

  const handlePayment = async (paymentMethod: string) => {
    setIsLoading(true);
    try {
      // TODO: Implement escrow payment initiation
      const response = await fetch('/api/escrow/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: book._id,
          paymentMethod,
          totalAmount,
          rentalFee: rentalFee,
          securityDeposit: securityDeposit
        }),
      });

      if (response.ok) {
        const { transactionId } = await response.json();
        // Redirect to payment confirmation page or messages
        window.location.href = `/transactions/${transactionId}`;
      } else {
        throw new Error('Payment initiation failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!book.available) {
    return (
      <div className="card bg-gray-50 border-gray-200">
        <div className="text-center py-8">
          <div className="text-2xl mb-2">📚</div>
          <div className="text-lg font-medium text-gray-600 mb-2">Not Available</div>
          <div className="text-sm text-gray-500">
            This book is currently being borrowed by someone else.
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="card bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Ready to Borrow?</h3>
          <p className="text-blue-100 mb-6">
            Start the secure escrow process with {book.lender.name}
          </p>
          
          <button
            onClick={handleBorrowClick}
            disabled={isLoading}
            className="w-full bg-white text-blue-600 font-semibold py-4 px-6 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : `Borrow for $${totalAmount.toFixed(2)}`}
          </button>
          
          <div className="text-sm text-blue-200 mt-3">
            Secure payment • Money held in escrow • Full refund protection
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Choose Payment Method</h3>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="font-medium">{book.title}</div>
                  <div className="text-sm text-gray-600">by {book.lender.name}</div>
                  <div className="text-lg font-bold mt-2">${totalAmount.toFixed(2)}</div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handlePayment('stripe')}
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : 'Pay with Credit Card'}
                </button>
                
                <button
                  onClick={() => handlePayment('paypal')}
                  disabled={isLoading}
                  className="w-full bg-yellow-500 text-white py-3 px-4 rounded-lg hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : 'Pay with PayPal'}
                </button>
                
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-6 text-xs text-gray-500">
                <div className="font-medium mb-2">Escrow Protection:</div>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Your payment is held securely until book exchange</li>
                  <li>Money is only released after both parties confirm</li>
                  <li>Full refund if transaction fails</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}