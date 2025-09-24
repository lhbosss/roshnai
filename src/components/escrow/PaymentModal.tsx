import React, { useState } from 'react';

interface PaymentModalProps {
  book: {
    _id: string;
    title: string;
    author: string;
    rentalFee?: number;
    securityDeposit?: number;
    lender: {
      _id: string;
      name: string;
    };
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transactionId: string) => void;
}

export default function PaymentModal({ book, isOpen, onClose, onSuccess }: PaymentModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const rentalFee = book.rentalFee || 0;
  const securityDeposit = book.securityDeposit || 0;
  const totalAmount = rentalFee + securityDeposit;

  if (!isOpen) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedPaymentMethod) {
      setError('Please select a payment method');
      return;
    }

    if (!termsAccepted) {
      setError('Please accept the terms and conditions');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/escrow/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: book._id,
          paymentMethod: selectedPaymentMethod,
          totalAmount,
          rentalFee,
          securityDeposit,
          termsAccepted: true
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess(data.transactionId);
        onClose();
      } else {
        setError(data.error || 'Payment failed');
      }
    } catch (error) {
      setError('Payment processing failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    { number: 1, title: 'Review Order', active: currentStep === 1 },
    { number: 2, title: 'Payment Method', active: currentStep === 2 },
    { number: 3, title: 'Terms & Conditions', active: currentStep === 3 }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Secure Payment</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
              disabled={isProcessing}
            >
              ✕
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className={`flex items-center space-x-2 ${
                  step.active ? 'text-blue-600' : currentStep > step.number ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.active 
                      ? 'bg-blue-600 text-white' 
                      : currentStep > step.number 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {currentStep > step.number ? '✓' : step.number}
                  </div>
                  <span className="text-sm font-medium">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 ${
                    currentStep > step.number ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Review Order */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-20 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center">
                      📚
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-lg">{book.title}</h4>
                      <p className="text-gray-600">by {book.author}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Rented from: {book.lender.name}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span>Rental Fee</span>
                  <span className="font-medium">{formatCurrency(rentalFee)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-200">
                  <span>Security Deposit (refundable)</span>
                  <span className="font-medium">{formatCurrency(securityDeposit)}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-blue-50 px-4 rounded-lg">
                  <span className="font-semibold">Total Due Now</span>
                  <span className="font-bold text-xl text-blue-600">{formatCurrency(totalAmount)}</span>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-yellow-800 mb-1">Escrow Protection</div>
                    <div className="text-yellow-700">
                      Your payment is held securely until both you and the lender confirm the book exchange. 
                      The security deposit will be refunded when the book is returned.
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep(2)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700"
              >
                Continue to Payment Method
              </button>
            </div>
          )}

          {/* Step 2: Payment Method */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Choose Payment Method</h3>
                <div className="space-y-3">
                  <label className="block">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="stripe"
                      checked={selectedPaymentMethod === 'stripe'}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedPaymentMethod === 'stripe' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">💳</span>
                        </div>
                        <div>
                          <div className="font-medium">Credit/Debit Card</div>
                          <div className="text-sm text-gray-600">Visa, Mastercard, American Express</div>
                        </div>
                        {selectedPaymentMethod === 'stripe' && (
                          <div className="ml-auto">
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </label>

                  <label className="block">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={selectedPaymentMethod === 'paypal'}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                      className="sr-only"
                    />
                    <div className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedPaymentMethod === 'paypal' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-8 bg-yellow-500 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">PP</span>
                        </div>
                        <div>
                          <div className="font-medium">PayPal</div>
                          <div className="text-sm text-gray-600">Pay with your PayPal account</div>
                        </div>
                        {selectedPaymentMethod === 'paypal' && (
                          <div className="ml-auto">
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={!selectedPaymentMethod}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Terms & Conditions */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Terms & Conditions</h3>
                <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto text-sm">
                  <h4 className="font-medium mb-2">Book Rental Agreement</h4>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>1. Payment Terms:</strong> You agree to pay the total amount of {formatCurrency(totalAmount)} which includes a rental fee of {formatCurrency(rentalFee)} and a refundable security deposit of {formatCurrency(securityDeposit)}.</p>
                    
                    <p><strong>2. Escrow Protection:</strong> Your payment will be held in a secure escrow account. The rental fee will only be released to the book owner after both parties confirm successful book handover.</p>
                    
                    <p><strong>3. Book Condition:</strong> You agree to return the book in the same condition it was received. Any damage beyond normal wear may result in partial or full forfeiture of the security deposit.</p>
                    
                    <p><strong>4. Return Policy:</strong> Books must be returned within the agreed rental period. Late returns may incur additional fees.</p>
                    
                    <p><strong>5. Cancellation:</strong> You may cancel this transaction before the book handover for a full refund. After handover, standard return policies apply.</p>
                    
                    <p><strong>6. Dispute Resolution:</strong> Any disputes will be handled through our platform's resolution process with potential mediation.</p>
                    
                    <p><strong>7. Privacy:</strong> Your payment and personal information are protected according to our privacy policy.</p>
                  </div>
                </div>
              </div>

              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-sm">
                  I have read and agree to the terms and conditions of this book rental agreement. 
                  I understand that my payment will be held in escrow until the transaction is completed.
                </span>
              </label>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-red-800 text-sm">{error}</div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentStep(2)}
                  disabled={isProcessing}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  onClick={handlePaymentSubmit}
                  disabled={!termsAccepted || isProcessing}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing Payment...' : `Pay ${formatCurrency(totalAmount)}`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}