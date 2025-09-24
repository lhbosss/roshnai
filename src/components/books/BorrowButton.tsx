import React, { useState } from 'react';
import PaymentModal from '@/components/escrow/PaymentModal';

interface BorrowButtonProps {
  book: {
    _id: string;
    title: string;
    author: string;
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const rentalFee = book.rentalFee || 0;
  const securityDeposit = book.securityDeposit || 0;
  const totalAmount = rentalFee + securityDeposit;

  const handleBorrowClick = () => {
    if (!book.available) return;
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (transactionId: string) => {
    // Redirect to transaction page
    window.location.href = `/transactions/${transactionId}`;
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
            className="w-full bg-white text-blue-600 font-semibold py-4 px-6 rounded-lg hover:bg-blue-50 transition-colors"
          >
            {`Borrow for $${totalAmount.toFixed(2)}`}
          </button>
          
          <div className="text-sm text-blue-200 mt-3">
            Secure payment • Money held in escrow • Full refund protection
          </div>
        </div>
      </div>

      <PaymentModal
        book={book}
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}