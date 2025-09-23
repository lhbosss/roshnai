import React from 'react';

interface BookPricingProps {
  book: {
    rentalFee: number;
    securityDeposit: number;
    rentalDuration: number;
  };
}

export default function BookPricing({ book }: BookPricingProps) {
  const totalCost = book.rentalFee + book.securityDeposit;
  const dailyRate = book.rentalFee / book.rentalDuration;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Rental Pricing</h3>
      
      <div className="space-y-4">
        {/* Main Pricing */}
        <div className="flex justify-between items-center py-3 border-b border-blue-200">
          <div>
            <div className="font-medium text-gray-900">Rental Fee</div>
            <div className="text-sm text-gray-600">
              For {book.rentalDuration} day{book.rentalDuration !== 1 ? 's' : ''} 
              ({formatCurrency(dailyRate)}/day)
            </div>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {formatCurrency(book.rentalFee)}
          </div>
        </div>

        <div className="flex justify-between items-center py-3 border-b border-blue-200">
          <div>
            <div className="font-medium text-gray-900">Security Deposit</div>
            <div className="text-sm text-gray-600">
              Refundable upon return
            </div>
          </div>
          <div className="text-lg font-semibold text-gray-900">
            {formatCurrency(book.securityDeposit)}
          </div>
        </div>

        {/* Total */}
        <div className="flex justify-between items-center py-3 bg-white rounded-lg px-4 shadow-sm">
          <div>
            <div className="font-semibold text-gray-900">Total Due Now</div>
            <div className="text-sm text-gray-600">
              Rental fee + Security deposit
            </div>
          </div>
          <div className="text-xl font-bold text-blue-600">
            {formatCurrency(totalCost)}
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">!</span>
              </div>
            </div>
            <div className="text-sm">
              <div className="font-medium text-yellow-800 mb-1">Escrow Protection</div>
              <div className="text-yellow-700">
                Your payment is held securely until both parties confirm the book exchange. 
                The rental fee goes to the owner only after successful handover.
              </div>
            </div>
          </div>
        </div>

        {/* Breakdown Note */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded p-3">
          <div className="font-medium mb-1">How it works:</div>
          <ul className="space-y-1 list-disc list-inside">
            <li>Pay the total amount upfront</li>
            <li>Money is held in escrow until book exchange</li>
            <li>Security deposit is refunded when book is returned</li>
            <li>Rental fee is released to owner upon confirmation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}