import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Mail, Phone, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';
import { QuoteBreakdown } from '../types/quote';
import { AreYouStuckBanner } from './AreYouStuckBanner';

interface Step5SendQuoteProps {
  quote: QuoteBreakdown;
  onSendQuote: (customerData: {
    firstName: string;
    mobile: string;
    email: string;
    agreedToContact: boolean;
  }) => void;
  onBack: () => void;
  initialCustomerData?: {
    firstName: string;
    mobile: string;
    email: string;
  };
}

export const Step5SendQuote: React.FC<Step5SendQuoteProps> = ({
  quote,
  onSendQuote,
  onBack,
  initialCustomerData,
}) => {
  const [firstName, setFirstName] = useState(initialCustomerData?.firstName || '');
  const [email, setEmail] = useState(initialCustomerData?.email || '');
  const [mobile, setMobile] = useState(initialCustomerData?.mobile || '');
  const [errors, setErrors] = useState<{ email?: string; mobile?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; mobile?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneClean = mobile.replace(/[\s\-\(\)]/g, '');

    // Phone is mandatory
    if (!phoneClean || phoneClean.length < 8) {
      newErrors.mobile = 'Please enter a valid mobile number (e.g. 0412 345 678)';
    }

    // Email is optional, validate format only if provided
    if (email.trim() && !emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendQuoteClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSendQuote({
      firstName: firstName.trim() || 'Valued Customer',
      email: email.trim(),
      mobile: mobile.trim(),
      agreedToContact: true,
    });
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 shadow-xs border border-slate-200/80">
      {/* Step kicker */}
      <span className="text-xs font-extrabold uppercase tracking-widest text-[#00c0f3] font-['Cabinet_Grotesk',sans-serif]">
        STEP 5 OF 6 · INSTANT DISPATCH
      </span>

      {/* Big simple heading as requested */}
      <h1 className="text-3xl sm:text-5xl font-black text-[#0b2942] tracking-tight mt-1 mb-2">
        Where do we send your quote?
      </h1>

      <p className="text-sm sm:text-base text-slate-500 max-w-xl">
        Enter your details below and your tailored quote will be ready immediately.
      </p>

      {/* Contact Form */}
      <form onSubmit={handleSendQuoteClick} className="mt-8 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email box (optional) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-[#0b2942] uppercase tracking-wider">
              Email Address <span className="text-slate-400 font-normal normal-case">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="you@example.com.au"
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                  errors.email
                    ? 'border-red-300 bg-red-50/40 focus:ring-red-300'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:ring-[#00c0f3] focus:border-transparent'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500 font-semibold">{errors.email}</p>
            )}
          </div>

          {/* Phone box */}
          <div className="space-y-1.5">
            <label className="block text-xs font-extrabold text-[#0b2942] uppercase tracking-wider">
              Mobile Phone <span className="text-[#00c0f3]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: undefined }));
                }}
                placeholder="0412 345 678"
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 ${
                  errors.mobile
                    ? 'border-red-300 bg-red-50/40 focus:ring-red-300'
                    : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:bg-white focus:ring-[#00c0f3] focus:border-transparent'
                }`}
              />
            </div>
            {errors.mobile && (
              <p className="text-xs text-red-500 font-semibold">{errors.mobile}</p>
            )}
          </div>
        </div>

        {/* First name (optional for personalization) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-extrabold text-[#0b2942] uppercase tracking-wider">
            First Name <span className="text-slate-400 font-normal normal-case">(optional)</span>
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="e.g. Sarah"
            className="w-full sm:w-1/2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:border-slate-300 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-[#00c0f3] focus:outline-none"
          />
        </div>

        {/* What You Receive Card */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
          <div className="font-extrabold text-[#0b2942] uppercase tracking-wider text-[11px]">
            What you'll see on the next page:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-medium">
            <div className="flex items-center gap-1.5 text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00c0f3] shrink-0" />
              <span>Full price breakdown</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00c0f3] shrink-0" />
              <span>Total savings & discounts</span>
            </div>
          </div>
        </div>

        {/* Navigation / Action Buttons */}
        <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            type="submit"
            className="px-8 py-3.5 bg-[#00c0f3] hover:bg-[#00ace0] text-white font-extrabold rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98"
          >
            <span>Send quote</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Are You Stuck Banner on Every Page */}
      <div className="mt-8">
        <AreYouStuckBanner />
      </div>
    </div>
  );
};
