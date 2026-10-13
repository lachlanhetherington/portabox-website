import React, { useState } from 'react';
import {
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Zap,
} from 'lucide-react';
import {
  processBraintreePayment,
  detectBraintreeCardBrand,
  BRAINTREE_TEST_PRESETS,
  BraintreePaymentMethodType,
  BraintreePaymentResult,
} from '../services/braintreeService';

interface BraintreePaymentSectionProps {
  amount: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  orderDescription: string;
  billingCycleLabel?: string;
  onPaymentSuccess: (result: BraintreePaymentResult) => void;
  onPaymentError?: (error: string) => void;
}

export const BraintreePaymentSection: React.FC<BraintreePaymentSectionProps> = ({
  amount,
  customerName = 'Portabox Customer',
  customerEmail = 'customer@portabox.com.au',
  customerPhone = '1800 467 637',
  orderDescription,
  billingCycleLabel = 'Monthly storage',
  onPaymentSuccess,
  onPaymentError,
}) => {
  const [activeMethod, setActiveMethod] = useState<BraintreePaymentMethodType>('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState(customerName);
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [postalCode, setPostalCode] = useState('5061');
  const [vaultMethod, setVaultMethod] = useState(true);
  const [paypalEmail, setPaypalEmail] = useState(customerEmail);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState<BraintreePaymentResult | null>(null);

  const cardBrand = detectBraintreeCardBrand(cardNumber);

  // Format Card Number with 4-digit spacing
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Format Expiry MM/YY
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setExpiry(raw);
  };

  const handleUsePreset = (preset: (typeof BRAINTREE_TEST_PRESETS)[0]) => {
    setCardNumber(preset.number.replace(/(\d{4})(?=\d)/g, '$1 '));
    setExpiry(preset.expiry);
    setCvv(preset.cvv);
    setCardholderName(customerName || 'Portabox Verified Buyer');
    setPaymentError(null);
  };

  // Process Card Payment via Braintree
  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (cardNumber.replace(/\s+/g, '').length < 15) {
      setPaymentError('Please enter a valid 15 or 16-digit card number.');
      return;
    }
    if (!expiry || !expiry.includes('/')) {
      setPaymentError('Please enter card expiry in MM/YY format.');
      return;
    }
    if (cvv.length < 3) {
      setPaymentError('Please enter a valid 3 or 4-digit CVV security code.');
      return;
    }

    setIsProcessing(true);
    try {
      const [expMonth, expYear] = expiry.split('/');
      const result = await processBraintreePayment({
        amount,
        paymentMethodType: 'credit_card',
        customerName: cardholderName,
        customerEmail,
        customerPhone,
        cardDetails: {
          cardNumber,
          cardholderName,
          expiryMonth: expMonth,
          expiryYear: `20${expYear}`,
          cvv,
          postalCode,
        },
        vaultPaymentMethod: vaultMethod,
        orderDescription,
      });

      if (result.success) {
        setPaymentSuccessData(result);
        onPaymentSuccess(result);
      } else {
        setPaymentError(result.error || 'Braintree authorization failed.');
        if (onPaymentError) onPaymentError(result.error || 'Braintree authorization failed.');
      }
    } catch {
      setPaymentError('An error occurred connecting to Braintree. Please check card details.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process PayPal via Braintree
  const handlePayPalSubmit = async () => {
    setIsProcessing(true);
    setPaymentError(null);
    try {
      const result = await processBraintreePayment({
        amount,
        paymentMethodType: 'paypal',
        customerName,
        customerEmail: paypalEmail,
        customerPhone,
        paypalEmail,
        vaultPaymentMethod: vaultMethod,
        orderDescription,
      });

      if (result.success) {
        setPaymentSuccessData(result);
        onPaymentSuccess(result);
      } else {
        setPaymentError(result.error || 'PayPal authorization failed.');
      }
    } catch {
      setPaymentError('PayPal checkout could not complete.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process Digital Wallets (Google Pay / Apple Pay)
  const handleWalletSubmit = async (walletType: 'google_pay' | 'apple_pay') => {
    setIsProcessing(true);
    setPaymentError(null);
    try {
      const result = await processBraintreePayment({
        amount,
        paymentMethodType: walletType,
        customerName,
        customerEmail,
        customerPhone,
        vaultPaymentMethod: vaultMethod,
        orderDescription,
      });

      if (result.success) {
        setPaymentSuccessData(result);
        onPaymentSuccess(result);
      }
    } catch {
      setPaymentError('Digital wallet payment failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Top Banner: Braintree Gateway Verified */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00c0f3] text-white flex items-center justify-center font-black shadow-xs">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded">
                BRAINTREE PAYMENTS
              </span>
              <span className="text-[10px] font-bold text-slate-500">
                A PayPal Company · Level 1 PCI-DSS
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#0b2942]">
              Secure Payment & Container Reservation
            </h3>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Payable Now
          </span>
          <span className="text-2xl font-black text-[#0b2942] font-mono">${amount} AUD</span>
          <span className="text-[10px] text-emerald-600 font-bold block">
            GST Inclusive · Instant Confirmation
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {paymentSuccessData && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Payment Successfully Settled via Braintree!</span>
          </div>
          <div className="text-xs text-emerald-900 space-y-1">
            <p><strong>Transaction Ref:</strong> <span className="font-mono">{paymentSuccessData.transactionId}</span></p>
            <p><strong>Method:</strong> {paymentSuccessData.paymentMethod}</p>
            <p><strong>Vault Token:</strong> <span className="font-mono">{paymentSuccessData.vaultToken}</span> (Autopay Active)</p>
          </div>
        </div>
      )}

      {/* Payment Method Selector Tabs */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => {
            setActiveMethod('credit_card');
            setPaymentError(null);
          }}
          className={`py-3 px-2 sm:px-4 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-2 ${
            activeMethod === 'credit_card'
              ? 'border-[#00c0f3] bg-sky-50/50 text-[#0b2942] shadow-2xs'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CreditCard className="w-4 h-4 text-[#00c0f3]" />
          <span>Credit / Debit Card</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMethod('paypal');
            setPaymentError(null);
          }}
          className={`py-3 px-2 sm:px-4 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-2 ${
            activeMethod === 'paypal'
              ? 'border-blue-500 bg-blue-50/50 text-[#0b2942] shadow-2xs'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span className="font-extrabold text-blue-600 font-sans italic text-sm">P</span>
          <span>PayPal (Braintree)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMethod('google_pay');
            setPaymentError(null);
          }}
          className={`py-3 px-2 sm:px-4 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-2 ${
            activeMethod === 'google_pay' || activeMethod === 'apple_pay'
              ? 'border-slate-800 bg-slate-900 text-white shadow-2xs'
              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Google / Apple Pay</span>
        </button>
      </div>

      {paymentError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{paymentError}</span>
        </div>
      )}

      {/* TAB 1: Braintree Hosted Fields Credit Card */}
      {activeMethod === 'credit_card' && (
        <form onSubmit={handleCardSubmit} className="space-y-4">
          {/* Quick Sandbox Presets for Testing */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              1-Click Braintree Sandbox Test Cards:
            </span>
            <div className="flex flex-wrap gap-2">
              {BRAINTREE_TEST_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleUsePreset(p)}
                  className="px-2.5 py-1 bg-white hover:bg-sky-50 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Cardholder Name
            </label>
            <input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00c0f3]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Card Number (Braintree Hosted Fields)
              </label>
              <span className="text-xs font-extrabold text-[#00c0f3]">{cardBrand}</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="4111 1111 1111 1111"
                maxLength={19}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 font-mono text-sm font-bold tracking-wider focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00c0f3]"
              />
              <CreditCard className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Expiry Date
              </label>
              <input
                type="text"
                value={expiry}
                onChange={handleExpiryChange}
                placeholder="MM/YY"
                maxLength={5}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00c0f3]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Security CVV
              </label>
              <input
                type="password"
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="123"
                maxLength={4}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00c0f3]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Postcode
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.slice(0, 4))}
                placeholder="5061"
                maxLength={4}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00c0f3]"
              />
            </div>
          </div>

          {/* Braintree Vault Checkbox */}
          <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-sky-50/50 border border-sky-100 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={vaultMethod}
              onChange={(e) => setVaultMethod(e.target.checked)}
              className="w-4 h-4 rounded text-[#00c0f3] focus:ring-[#00c0f3]"
            />
            <div className="text-xs">
              <span className="font-extrabold text-[#0b2942]">Save to Braintree Vault</span>
              <span className="text-slate-500 block">
                Store payment token safely for recurring {billingCycleLabel} automatic debit. Cancel anytime.
              </span>
            </div>
          </label>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full py-4 bg-[#0b2942] hover:bg-[#081e30] text-white rounded-2xl font-extrabold text-sm tracking-wide shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-[#00c0f3]" />
                <span>Authorizing with Braintree Gateway...</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-[#00c0f3]" />
                <span>Pay ${amount} AUD Now via Braintree</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* TAB 2: PayPal via Braintree */}
      {activeMethod === 'paypal' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 text-center space-y-3">
            <div className="text-2xl font-black text-blue-800 font-sans italic">PayPal</div>
            <p className="text-xs text-blue-900 max-w-sm mx-auto">
              Check out in seconds with PayPal One-Touch powered by Braintree. Your bank or card details are never shared with merchants.
            </p>
            <div className="max-w-xs mx-auto text-left">
              <label className="block text-[11px] font-bold text-blue-900 mb-1">
                PayPal Account Email
              </label>
              <input
                type="email"
                value={paypalEmail}
                onChange={(e) => setPaypalEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white text-xs font-semibold"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handlePayPalSubmit}
            disabled={isProcessing}
            className="w-full py-3.5 bg-[#ffc439] hover:bg-[#f6bb32] text-[#003087] rounded-2xl font-black text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <span>Proceed with PayPal (${amount} AUD)</span>
            )}
          </button>
        </div>
      )}

      {/* TAB 3: Digital Wallets via Braintree */}
      {activeMethod === 'google_pay' && (
        <div className="space-y-4 text-center">
          <p className="text-xs text-slate-500">
            Use device biometrics (Face ID / Fingerprint) to pay instantly via Braintree tokenized digital wallets.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleWalletSubmit('google_pay')}
              disabled={isProcessing}
              className="py-3 px-4 bg-black hover:bg-slate-800 text-white rounded-2xl font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Pay with G Pay</span>
            </button>

            <button
              type="button"
              onClick={() => handleWalletSubmit('apple_pay')}
              disabled={isProcessing}
              className="py-3 px-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Pay with Apple Pay</span>
            </button>
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Braintree 256-Bit SSL Tokenization
        </span>
        <span>Merchant Account: portabox_aud</span>
      </div>
    </div>
  );
};
