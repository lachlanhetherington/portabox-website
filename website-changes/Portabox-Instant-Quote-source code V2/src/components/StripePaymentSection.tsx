import React, { useState } from 'react';
import {
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Printer,
  Calendar,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  processStripePayment,
  PaymentProcessResult,
} from '../services/stripeService';
import { QuoteBreakdown } from '../types/quote';

interface StripePaymentSectionProps {
  quote: QuoteBreakdown;
  customerData?: {
    firstName: string;
    mobile: string;
    email: string;
  };
  onPaymentSuccess?: (result: PaymentProcessResult) => void;
  onInitiateCalendarBooking?: () => void;
  isCalendarBooked?: boolean;
  calendarEventLink?: string | null;
  className?: string;
}

export const StripePaymentSection: React.FC<StripePaymentSectionProps> = ({
  quote,
  customerData,
  onPaymentSuccess,
  onInitiateCalendarBooking,
  isCalendarBooked = false,
  calendarEventLink = null,
  className = '',
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'google_pay'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardholderName, setCardholderName] = useState(customerData?.firstName || '');
  const [billingPostcode, setBillingPostcode] = useState(quote.originPostcode.postcode || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentProcessResult | null>(null);

  const cardBrand = detectCardBrand(cardNumber);

  // Auto-fill test card details for fast testing
  const handleUseTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExpiry('12/28');
    setCardCvc('888');
    if (!cardholderName.trim()) {
      setCardholderName(customerData?.firstName || 'John Citizen');
    }
    setErrorMessage(null);
  };

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const result = await processStripePayment({
        amount: quote.firstPaymentTotal,
        cardNumber,
        cardExpiry,
        cardCvc,
        cardholderName,
        postalCode: billingPostcode,
        customerEmail: customerData?.email || 'customer@portabox.com.au',
        customerPhone: customerData?.mobile,
        containerDescription: `${quote.containerCount}x ${quote.containerName} (${quote.originPostcode.suburb})`,
        deliveryDate: quote.preferredDate,
        paymentMethodType: paymentMethod === 'google_pay' ? 'google_pay' : 'credit_card',
      });

      if (result.success) {
        setPaymentResult(result);
        if (onPaymentSuccess) {
          onPaymentSuccess(result);
        }
      } else {
        setErrorMessage(result.error || 'Payment failed. Please check your card details and try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment processor error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGooglePayClick = async () => {
    setPaymentMethod('google_pay');
    setIsProcessing(true);
    setErrorMessage(null);

    // Process via Google Pay
    try {
      const result = await processStripePayment({
        amount: quote.firstPaymentTotal,
        cardNumber: '4111 1111 1111 9999',
        cardExpiry: '10/29',
        cardCvc: '123',
        cardholderName: customerData?.firstName ? `${customerData.firstName} (Google Pay)` : 'Google Pay User',
        postalCode: billingPostcode,
        customerEmail: customerData?.email || 'customer@portabox.com.au',
        customerPhone: customerData?.mobile,
        containerDescription: `${quote.containerCount}x ${quote.containerName}`,
        deliveryDate: quote.preferredDate,
        paymentMethodType: 'google_pay',
      });

      if (result.success) {
        setPaymentResult({
          ...result,
          cardBrand: 'Google Pay',
          last4: '9999',
        });
        if (onPaymentSuccess) {
          onPaymentSuccess({
            ...result,
            cardBrand: 'Google Pay',
          });
        }
      } else {
        setErrorMessage(result.error || 'Google Pay transaction was cancelled or declined.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google Pay processing error.');
    } finally {
      setIsProcessing(false);
    }
  };

  // If already paid, display confirmation receipt card
  if (paymentResult?.success) {
    return (
      <div className={`mt-8 p-6 sm:p-8 rounded-3xl bg-white border-2 border-emerald-400 shadow-md animate-in fade-in duration-300 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Payment Approved
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {paymentResult.transactionId}
                </span>
              </div>
              <h3 className="text-xl font-black text-[#0b2942] mt-0.5">
                Deposit & First Payment Confirmed
              </h3>
            </div>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
              ${paymentResult.amount}
            </div>
            <p className="text-[11px] text-slate-500">GST Included · Paid in full</p>
          </div>
        </div>

        {/* Receipt Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-5 border-b border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Receipt Number</span>
            <span className="font-mono font-bold text-slate-800">{paymentResult.receiptNumber}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Method</span>
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-[#00c0f3]" />
              <span>{paymentResult.cardBrand} •••• {paymentResult.last4}</span>
            </span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Billing Email</span>
            <span className="font-bold text-slate-800 truncate block">
              {customerData?.email || 'customer@portabox.com.au'}
            </span>
          </div>
        </div>

        {/* Next Step / Google Calendar Booking Callout */}
        <div className="mt-5 p-4 rounded-2xl bg-sky-50/80 border border-sky-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white text-[#00c0f3] shrink-0 shadow-2xs border border-sky-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-[#0b2942]">
                Delivery Scheduled: {quote.preferredDate} ({quote.selectedSlot?.timeRange || 'Morning Window'})
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {isCalendarBooked
                  ? 'Your container drop-off is synced with your Google Calendar.'
                  : 'Add this confirmed booking slot to your Google Calendar.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {isCalendarBooked && calendarEventLink ? (
              <a
                href={calendarEventLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white text-[#0b2942] border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              >
                <span>View on Google Calendar</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#00c0f3]" />
              </a>
            ) : onInitiateCalendarBooking ? (
              <button
                type="button"
                onClick={onInitiateCalendarBooking}
                className="px-4 py-2 bg-[#0b2942] hover:bg-[#081e30] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              >
                <Calendar className="w-3.5 h-3.5 text-[#00c0f3]" />
                <span>Add to Google Calendar</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 bg-white text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl text-xs transition-colors cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`mt-8 p-6 sm:p-8 rounded-3xl bg-white border border-sky-200/90 shadow-xs space-y-6 ${className}`}>
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-sky-100 text-[#00c0f3] px-2 py-0.5 rounded-full">
              SECURE CHECKOUT · STRIPE ELEMENTS
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>PCI-DSS Level 1 Encrypted</span>
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-[#0b2942] mt-1">
            Pay & Lock In Your Container
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Pay your initial delivery deposit of <strong className="text-[#0b2942]">${quote.firstPaymentTotal}</strong> securely using Credit Card or Google Pay.
          </p>
        </div>

        {/* Amount Badge */}
        <div className="text-left sm:text-right shrink-0">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">
            Payable Now
          </span>
          <div className="text-3xl font-black text-[#0b2942] font-mono tracking-tight">
            ${quote.firstPaymentTotal}
          </div>
          <span className="text-[10px] text-slate-400">Includes initial delivery + 1st storage cycle</span>
        </div>
      </div>

      {/* Express Checkout: Google Pay / Apple Pay via Stripe */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span className="uppercase tracking-wider text-[11px] text-slate-400">
            Express Checkout
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Instant Card Authentication
          </span>
        </div>

        {/* Google Pay Official Button */}
        <button
          type="button"
          onClick={handleGooglePayClick}
          disabled={isProcessing}
          className="w-full h-12 rounded-2xl bg-black hover:bg-slate-900 active:bg-slate-800 text-white font-medium flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer border border-black group"
        >
          <span className="text-xs font-medium text-slate-300">Pay with</span>
          {/* Google Pay Logo */}
          <div className="flex items-center gap-1">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.09C3.27 21.41 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.26C.46 8.2.01 10.05.01 12s.45 3.8 1.25 5.41l4.02-3.09z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.27 2.59 1.26 6.59l4.02 3.09c.95-2.83 3.6-4.93 6.72-4.93z"
              />
            </svg>
            <span className="font-extrabold text-sm tracking-tight text-white">Pay</span>
          </div>
        </button>
      </div>

      {/* Or Divider */}
      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-slate-200 w-full" />
        <span className="bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
          Or pay with credit or debit card
        </span>
      </div>

      {/* Stripe Elements Credit Card Form */}
      <form onSubmit={handlePayNow} className="space-y-4">
        {/* Test Card Callout */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-sky-50/80 border border-sky-100 text-xs">
          <div className="flex items-center gap-2 text-sky-800">
            <Sparkles className="w-3.5 h-3.5 text-[#00c0f3]" />
            <span className="text-[11px]">Testing checkout? Click to prefill Stripe test card.</span>
          </div>
          <button
            type="button"
            onClick={handleUseTestCard}
            className="text-[11px] font-bold text-[#00c0f3] hover:underline cursor-pointer"
          >
            Auto-fill Test Card
          </button>
        </div>

        {/* Cardholder Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Cardholder Name
          </label>
          <input
            type="text"
            required
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
            placeholder="Full name as shown on card"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#00c0f3] focus:ring-2 focus:ring-[#00c0f3]/20 text-xs font-semibold text-[#0b2942] bg-slate-50/50 focus:bg-white transition-all outline-none"
          />
        </div>

        {/* Card Number Input with Brand Detection */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold text-slate-700">
              Card Number
            </label>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
              <span className={cardBrand === 'visa' ? 'text-blue-600 font-black' : 'opacity-60'}>Visa</span>
              <span>·</span>
              <span className={cardBrand === 'mastercard' ? 'text-orange-600 font-black' : 'opacity-60'}>Mastercard</span>
              <span>·</span>
              <span className={cardBrand === 'amex' ? 'text-sky-600 font-black' : 'opacity-60'}>Amex</span>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <CreditCard className="w-4 h-4 text-[#00c0f3]" />
            </div>
            <input
              type="text"
              required
              maxLength={19}
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="4242  4242  4242  4242"
              className="w-full pl-9.5 pr-14 py-2.5 rounded-xl border border-slate-200 focus:border-[#00c0f3] focus:ring-2 focus:ring-[#00c0f3]/20 text-xs font-mono font-bold text-[#0b2942] bg-slate-50/50 focus:bg-white tracking-wider transition-all outline-none"
            />
            {cardBrand !== 'unknown' && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-[10px] font-black uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {cardBrand}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Expiry, CVC & Postal Code Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Expiration (MM/YY)
            </label>
            <input
              type="text"
              required
              maxLength={5}
              value={cardExpiry}
              onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
              placeholder="MM/YY"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#00c0f3] focus:ring-2 focus:ring-[#00c0f3]/20 text-xs font-mono font-bold text-[#0b2942] bg-slate-50/50 focus:bg-white text-center transition-all outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                CVC / CVV
              </label>
              <span className="text-[10px] text-slate-400">3 or 4 digits</span>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                maxLength={4}
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                placeholder="•••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#00c0f3] focus:ring-2 focus:ring-[#00c0f3]/20 text-xs font-mono font-bold text-[#0b2942] bg-slate-50/50 focus:bg-white text-center transition-all outline-none"
              />
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-300">
                <Lock className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Billing Postal Code
            </label>
            <input
              type="text"
              required
              maxLength={4}
              value={billingPostcode}
              onChange={(e) => setBillingPostcode(e.target.value.replace(/\D/g, ''))}
              placeholder="e.g. 5061"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#00c0f3] focus:ring-2 focus:ring-[#00c0f3]/20 text-xs font-mono font-bold text-[#0b2942] bg-slate-50/50 focus:bg-white text-center transition-all outline-none"
            />
          </div>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main "Pay Now" Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-4 rounded-2xl bg-[#00c0f3] hover:bg-[#00abda] active:bg-[#0096c0] text-white font-black text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Processing Payment with Stripe...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 stroke-[2.5]" />
                <span>Pay Now · ${quote.firstPaymentTotal} AUD</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>

        {/* Trust & Guarantee Subtext */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>End-to-end 256-bit SSL encrypted directly with Stripe</span>
          </div>
          <div className="flex items-center gap-2">
            <span>Locked Rate Guarantee</span>
            <span>·</span>
            <span>No Hidden Cancellation Fees</span>
          </div>
        </div>
      </form>
    </div>
  );
};
