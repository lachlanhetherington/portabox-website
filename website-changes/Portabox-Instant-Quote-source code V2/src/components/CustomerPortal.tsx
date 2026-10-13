import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  Clock,
  Calendar,
  CreditCard,
  Tag,
  Truck,
  Package,
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Phone,
  MessageSquare,
  Lock,
  ArrowRight,
  LogOut,
  ChevronRight,
  MapPin,
  RefreshCw,
  Sparkles,
  ExternalLink,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import {
  CustomerAccount,
  ContainerOrder,
  CustomerTransaction,
  loadCustomerAccounts,
  getCurrentUserSession,
  setCurrentUserSession,
  saveCustomerAccounts,
} from '../services/customerPortalService';

interface CustomerPortalProps {
  isOpen: boolean;
  onClose: () => void;
  phone?: string;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  isOpen,
  onClose,
  phone = '1800 467 637',
}) => {
  const [currentUser, setCurrentUser] = useState<CustomerAccount | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'quotes' | 'billing' | 'discounts' | 'selfservice'>('overview');
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authStep, setAuthStep] = useState<'login' | 'otp'>('login');
  const [otpCode, setOtpCode] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Self-service pickup / delivery notes state
  const [pickupRequested, setPickupRequested] = useState(false);
  const [pickupDate, setPickupDate] = useState('2026-10-25');
  const [accessNotesText, setAccessNotesText] = useState('');
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);
  const [payingInvoiceId, setPayingInvoiceId] = useState<string | null>(null);

  // Load session on mount
  useEffect(() => {
    if (isOpen) {
      const session = getCurrentUserSession();
      if (session) {
        // Refresh with latest from storage
        const all = loadCustomerAccounts();
        const found = all.find((a) => a.id === session.id) || session;
        setCurrentUser(found);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Login submission
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginEmail.trim()) {
      setLoginError('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const accounts = loadCustomerAccounts();
      const match = accounts.find(
        (a) => a.email.toLowerCase() === loginEmail.trim().toLowerCase()
      );

      if (match) {
        setAuthStep('otp');
      } else {
        setLoginError('No Portabox customer account found with this email. You can use 1-click test login below or enter a demo account.');
      }
    }, 400);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      setLoginError('Please enter the 6-digit verification code sent to your mobile.');
      return;
    }
    const accounts = loadCustomerAccounts();
    const match = accounts.find(
      (a) => a.email.toLowerCase() === loginEmail.trim().toLowerCase()
    );
    if (match) {
      setCurrentUser(match);
      setCurrentUserSession(match);
      setAuthStep('login');
      setLoginEmail('');
      setOtpCode('');
      setLoginError(null);
    }
  };

  const handleQuickLogin = (email: string) => {
    const accounts = loadCustomerAccounts();
    const match = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (match) {
      setCurrentUser(match);
      setCurrentUserSession(match);
      setLoginError(null);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentUserSession(null);
    setAuthStep('login');
  };

  // Pay Overdue invoice with Stripe
  const handlePayOverdueInvoice = (txnId: string) => {
    if (!currentUser) return;
    setPayingInvoiceId(txnId);
    setTimeout(() => {
      const accounts = loadCustomerAccounts();
      const userIdx = accounts.findIndex((a) => a.id === currentUser.id);
      if (userIdx >= 0) {
        const updatedTxns = accounts[userIdx].transactions.map((t) => {
          if (t.id === txnId) {
            return {
              ...t,
              status: 'Paid' as const,
              paymentMethod: 'Paid online via Braintree Payments',
              stripeTransactionId: `bt_settled_${Date.now()}`,
            };
          }
          return t;
        });
        accounts[userIdx].transactions = updatedTxns;
        saveCustomerAccounts(accounts);
        setCurrentUser({ ...accounts[userIdx] });
        setCurrentUserSession({ ...accounts[userIdx] });
      }
      setPayingInvoiceId(null);
    }, 800);
  };

  const handleSaveAccessNotes = () => {
    if (!currentUser || !currentUser.orders.length) return;
    const accounts = loadCustomerAccounts();
    const userIdx = accounts.findIndex((a) => a.id === currentUser.id);
    if (userIdx >= 0) {
      accounts[userIdx].orders[0].accessNotes = accessNotesText;
      saveCustomerAccounts(accounts);
      setCurrentUser({ ...accounts[userIdx] });
      setNotesSavedSuccess(true);
      setTimeout(() => setNotesSavedSuccess(false), 3000);
    }
  };

  // Overdue and Pending Calculations
  const overdueTransactions = currentUser?.transactions.filter((t) => t.status === 'Overdue') || [];
  const pendingTransactions = currentUser?.transactions.filter((t) => t.status === 'Pending') || [];
  const paidTransactions = currentUser?.transactions.filter((t) => t.status === 'Paid') || [];
  const totalPaid = paidTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalDiscounts = (currentUser?.discountsGiven || []).reduce((sum, d) => sum + d.amount, 0);
  const activeOrder = currentUser?.orders?.[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="bg-[#0b2942] text-white px-5 sm:px-8 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#00c0f3] flex items-center justify-center text-white font-black shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                  Portabox Customer Portal
                </h3>
                <span className="text-[10px] font-bold bg-[#00c0f3]/30 text-sky-200 px-2 py-0.5 rounded-full border border-sky-400/30">
                  Secure 256-Bit SSL
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Manage your storage containers, quotes, live dispatch ETA, and billing payments
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser && (
              <button
                type="button"
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8fafc]">
          {!currentUser ? (
            /* Secure Login View */
            <div className="max-w-md mx-auto py-8">
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-sky-50 text-[#00c0f3] mx-auto flex items-center justify-center border border-sky-100 shadow-2xs">
                  <Lock className="w-8 h-8" />
                </div>

                <div>
                  <h2 className="text-2xl font-black text-[#0b2942]">Customer Sign In</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your email to view your active containers, delivery ETA, invoices, and payment schedule.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 text-left">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                {authStep === 'login' ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Customer Email Address
                      </label>
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="e.g. sarah.jenkins@gmail.com"
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00c0f3]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-[#0b2942] hover:bg-[#081e30] text-white rounded-2xl font-extrabold text-sm tracking-wide shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Continue with Email & SMS Code</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
                    <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-800 flex items-start gap-2">
                      <Shield className="w-4 h-4 text-[#00c0f3] shrink-0 mt-0.5" />
                      <span>A 6-digit security code was simulated and sent to your registered phone (Code: <strong>849201</strong>).</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        6-Digit Security Code
                      </label>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="849201"
                        maxLength={6}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-center font-mono text-xl tracking-widest font-black focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00c0f3]"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAuthStep('login')}
                        className="w-1/3 py-3 border border-slate-200 hover:bg-slate-50 rounded-2xl font-bold text-xs text-slate-600 transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        className="w-2/3 py-3 bg-[#00c0f3] hover:bg-[#00a8d6] text-white rounded-2xl font-extrabold text-sm shadow-xs transition-colors cursor-pointer"
                      >
                        Verify & Access Portal
                      </button>
                    </div>
                  </form>
                )}

                {/* 1-Click Demo Logins for Testing */}
                <div className="pt-4 border-t border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Quick 1-Click Demo Accounts:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                    <button
                      type="button"
                      onClick={() => handleQuickLogin('sarah.jenkins@gmail.com')}
                      className="p-3 rounded-xl border border-slate-200 hover:border-[#00c0f3] bg-slate-50/70 hover:bg-sky-50/40 transition-all text-left cursor-pointer"
                    >
                      <div className="font-extrabold text-xs text-[#0b2942]">Sarah Jenkins</div>
                      <div className="text-[10px] text-slate-500">25 m³ Container · Norwood SA · Active</div>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                        Monthly Autopay
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleQuickLogin('david.miller@builderpro.com.au')}
                      className="p-3 rounded-xl border border-slate-200 hover:border-[#00c0f3] bg-slate-50/70 hover:bg-sky-50/40 transition-all text-left cursor-pointer"
                    >
                      <div className="font-extrabold text-xs text-[#0b2942]">David Miller (Builder)</div>
                      <div className="text-[10px] text-slate-500">35 m³ Combo · Hyde Park SA</div>
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                        12 Mo Upfront · 1 Overdue
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Logged-In Customer Dashboard */
            <div className="space-y-6">
              {/* Customer Profile Banner */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0b2942] to-[#00c0f3] text-white flex items-center justify-center font-black text-2xl shadow-sm shrink-0">
                    {currentUser.firstName[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-black text-[#0b2942]">
                        {currentUser.firstName} {currentUser.lastName}
                      </h2>
                      {currentUser.companyName && (
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {currentUser.companyName}
                        </span>
                      )}
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Verified Account ({currentUser.id})
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                      <span>Email: <strong className="text-slate-800">{currentUser.email}</strong></span>
                      <span>Mobile: <strong className="text-slate-800">{currentUser.mobile}</strong></span>
                      <span>Service: <strong className="text-slate-800">{currentUser.suburb}, {currentUser.state}</strong></span>
                      <span>Member Since: <strong className="text-slate-800">{currentUser.memberSince}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <a
                    href={`tel:${phone.replace(/\s+/g, '')}`}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-[#0b2942] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#00c0f3]" />
                    <span>Call Dispatch</span>
                  </a>
                  <a
                    href="sms:0488883234"
                    className="px-4 py-2.5 bg-[#0b2942] hover:bg-[#081e30] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#00c0f3]" />
                    <span>Text Support</span>
                  </a>
                </div>
              </div>

              {/* Overdue Payment Alert Banner (if any) */}
              {overdueTransactions.length > 0 && (
                <div className="bg-red-500 text-white rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white text-red-600 flex items-center justify-center font-black shrink-0">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider">
                        Action Required: {overdueTransactions.length} Overdue Payment
                      </h4>
                      <p className="text-xs text-red-100 mt-0.5">
                        Invoice {overdueTransactions[0].invoiceNumber} for ${overdueTransactions[0].amount} was due on {overdueTransactions[0].dueDate || 'recently'}. Please clear to avoid late fees.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePayOverdueInvoice(overdueTransactions[0].id)}
                    disabled={payingInvoiceId === overdueTransactions[0].id}
                    className="px-5 py-2.5 bg-white hover:bg-red-50 text-red-700 font-extrabold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    {payingInvoiceId === overdueTransactions[0].id ? 'Processing...' : `Pay $${overdueTransactions[0].amount} Now via Braintree`}
                  </button>
                </div>
              )}

              {/* Portal Tab Navigation */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'overview'
                      ? 'bg-[#0b2942] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-4 h-4 text-[#00c0f3]" />
                  <span>Overview & Live Delivery ETA</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'orders'
                      ? 'bg-[#0b2942] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Truck className="w-4 h-4 text-[#00c0f3]" />
                  <span>Containers & Orders ({currentUser.orders.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('billing')}
                  className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'billing'
                      ? 'bg-[#0b2942] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-[#00c0f3]" />
                  <span>Payments & Payment Plans</span>
                  {overdueTransactions.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('quotes')}
                  className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'quotes'
                      ? 'bg-[#0b2942] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-4 h-4 text-[#00c0f3]" />
                  <span>Quotes ({currentUser.quotes.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('discounts')}
                  className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'discounts'
                      ? 'bg-[#0b2942] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Tag className="w-4 h-4 text-[#00c0f3]" />
                  <span>Discounts Given (${totalDiscounts})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('selfservice')}
                  className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'selfservice'
                      ? 'bg-[#0b2942] text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Package className="w-4 h-4 text-[#00c0f3]" />
                  <span>Self-Service & Pickup</span>
                </button>
              </div>

              {/* TAB 1: OVERVIEW & LIVE DELIVERY ETA */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Key Metrics Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Active Containers
                      </span>
                      <div className="text-2xl font-black text-[#0b2942]">
                        {currentUser.orders.length} Unit{currentUser.orders.length > 1 ? 's' : ''}
                      </div>
                      <span className="text-[11px] text-emerald-600 font-semibold block">
                        {activeOrder?.status || 'Active in service'}
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Next Billing Date
                      </span>
                      <div className="text-2xl font-black text-[#0b2942] font-mono">
                        {currentUser.paymentPlan.nextBillingDate}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium block">
                        ${currentUser.paymentPlan.periodicAmount}/period ({currentUser.paymentPlan.planLabel})
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Total Paid To Date
                      </span>
                      <div className="text-2xl font-black text-[#0b2942] font-mono">
                        ${totalPaid}
                      </div>
                      <span className="text-[11px] text-emerald-600 font-semibold block">
                        {paidTransactions.length} settled invoice{paidTransactions.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Lifetime Savings Given
                      </span>
                      <div className="text-2xl font-black text-emerald-600 font-mono">
                        ${totalDiscounts}
                      </div>
                      <span className="text-[11px] text-slate-500 font-medium block">
                        Promos & advance term savings
                      </span>
                    </div>
                  </div>

                  {/* Live "Time to Delivery" & Status Tracker Card */}
                  {activeOrder && (
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                        <div className="flex items-center gap-3">
                          <div className="p-3 rounded-2xl bg-sky-100 text-[#00c0f3]">
                            <Truck className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#00c0f3]">
                              Live Container Delivery Tracker
                            </span>
                            <h3 className="text-lg sm:text-xl font-black text-[#0b2942]">
                              Order #{activeOrder.orderNumber} · Container {activeOrder.containerId}
                            </h3>
                          </div>
                        </div>

                        <div className="bg-sky-50 border border-sky-200/80 rounded-2xl px-4 py-2.5 text-right">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Target Delivery Window
                          </span>
                          <span className="text-sm font-black text-[#0b2942]">
                            {activeOrder.scheduledDeliveryDate} ({activeOrder.deliveryWindow})
                          </span>
                        </div>
                      </div>

                      {/* 4-Stage Progress Line */}
                      <div className="py-2">
                        <div className="grid grid-cols-4 gap-2 text-center relative">
                          {/* Progress connector line */}
                          <div className="absolute top-4 left-1/8 right-1/8 h-1 bg-slate-200 -z-0">
                            <div className="h-full bg-emerald-500 w-3/4" />
                          </div>

                          <div className="relative z-10 flex flex-col items-center space-y-1.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                              ✓
                            </div>
                            <span className="text-xs font-bold text-[#0b2942]">1. Booked</span>
                            <span className="text-[10px] text-slate-400">Order Locked</span>
                          </div>

                          <div className="relative z-10 flex flex-col items-center space-y-1.5">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                              ✓
                            </div>
                            <span className="text-xs font-bold text-[#0b2942]">2. Prepped</span>
                            <span className="text-[10px] text-slate-400">Depot Inspection</span>
                          </div>

                          <div className="relative z-10 flex flex-col items-center space-y-1.5">
                            <div className="w-8 h-8 rounded-full bg-[#00c0f3] text-white flex items-center justify-center font-bold text-xs shadow-xs animate-pulse">
                              <Truck className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-extrabold text-[#00c0f3]">3. Dispatched</span>
                            <span className="text-[10px] text-slate-500 font-medium">Driver En Route</span>
                          </div>

                          <div className="relative z-10 flex flex-col items-center space-y-1.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 border border-slate-300 flex items-center justify-center font-bold text-xs">
                              4
                            </div>
                            <span className="text-xs font-bold text-slate-400">4. Placed</span>
                            <span className="text-[10px] text-slate-400">Ground Secure</span>
                          </div>
                        </div>
                      </div>

                      {/* Details Box */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Current Location
                          </span>
                          <span className="text-xs font-bold text-[#0b2942] flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#00c0f3]" />
                            {activeOrder.location}
                          </span>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Assigned Driver
                          </span>
                          <span className="text-xs font-bold text-[#0b2942]">
                            {activeOrder.driverName || 'Mick T. (Heavy Haulage)'}
                          </span>
                          <div className="text-[11px] text-slate-500">{activeOrder.driverPhone || '0412 000 111'}</div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                            Time to Delivery
                          </span>
                          <span className="text-sm font-black text-emerald-600 font-mono">
                            {activeOrder.timeToDeliveryHours > 24
                              ? `${Math.floor(activeOrder.timeToDeliveryHours / 24)} days, ${activeOrder.timeToDeliveryHours % 24} hrs`
                              : `${activeOrder.timeToDeliveryHours} hours remaining`}
                          </span>
                          <div className="text-[11px] text-slate-500">Live GPS tracking active</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: CONTAINERS & ORDERS */}
              {activeTab === 'orders' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-[#0b2942]">
                      Your Container Fleet & Orders ({currentUser.orders.length})
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {currentUser.orders.map((order) => (
                      <div
                        key={order.id}
                        className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black bg-[#0b2942] text-white px-2.5 py-0.5 rounded-full">
                                {order.containerId}
                              </span>
                              <h4 className="text-base font-extrabold text-[#0b2942]">
                                {order.containerName}
                              </h4>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              Order #{order.orderNumber} · Service: <strong>{order.serviceType}</strong>
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
                              Status: {order.status}
                            </span>
                            <div className="text-xs text-slate-500 mt-1 font-mono">
                              Drop-off: {order.scheduledDeliveryDate}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                            <span className="font-bold text-slate-500">Origin / Placed Address:</span>
                            <p className="text-slate-800 font-medium">{order.originAddress}</p>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                            <span className="font-bold text-slate-500">Placement & Driver Notes:</span>
                            <p className="text-slate-800 font-medium">{order.accessNotes || 'Standard driveway placement'}</p>
                          </div>
                        </div>

                        {/* Order Timeline History */}
                        <div className="pt-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
                            Tracking Milestones:
                          </span>
                          <div className="space-y-2">
                            {order.history.map((h, i) => (
                              <div key={i} className="flex items-start gap-3 text-xs">
                                <div className="w-2 h-2 rounded-full bg-[#00c0f3] mt-1.5 shrink-0" />
                                <div>
                                  <span className="font-bold text-[#0b2942]">{h.stage}</span>
                                  <span className="text-slate-400 ml-2">({h.timestamp})</span>
                                  <p className="text-slate-600 mt-0.5">{h.note}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: PAYMENTS & PAYMENT PLANS */}
              {activeTab === 'billing' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Payment Plan Card */}
                  <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#00c0f3]">
                          Active Payment Plan & Method
                        </span>
                        <h3 className="text-lg font-black text-[#0b2942]">
                          {currentUser.paymentPlan.planLabel}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Periodic rate: <strong>${currentUser.paymentPlan.periodicAmount}</strong> billed automatically to avoid storage interruptions.
                        </p>
                      </div>

                      <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <CreditCard className="w-6 h-6 text-[#00c0f3]" />
                        <div className="text-xs">
                          <div className="font-extrabold text-[#0b2942]">
                            {currentUser.paymentPlan.cardBrand} •••• {currentUser.paymentPlan.cardLast4}
                          </div>
                          <div className="text-slate-400">Exp: {currentUser.paymentPlan.cardExpiry}</div>
                        </div>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full ml-2">
                          Active Autopay
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Billing Cycle</span>
                        <span className="font-bold text-slate-800">{currentUser.paymentPlan.planType.replace(/_/g, ' ').toUpperCase()}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Next Charge Date</span>
                        <span className="font-bold text-slate-800 font-mono">{currentUser.paymentPlan.nextBillingDate}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Term Discount Applied</span>
                        <span className="font-bold text-emerald-600 font-mono">{currentUser.paymentPlan.termDiscountPercent}% Off Regular Monthly</span>
                      </div>
                    </div>
                  </div>

                  {/* Invoices & Transactions Table */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-[#0b2942]">
                        Invoices & Transaction Ledger
                      </h3>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Statement (PDF)</span>
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                            <th className="pb-3">Invoice #</th>
                            <th className="pb-3">Date</th>
                            <th className="pb-3">Description</th>
                            <th className="pb-3">Payment Method</th>
                            <th className="pb-3 text-right">Amount (AUD)</th>
                            <th className="pb-3 text-right">Status</th>
                            <th className="pb-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {currentUser.transactions.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3.5 font-bold font-mono text-[#0b2942]">{t.invoiceNumber}</td>
                              <td className="py-3.5 text-slate-500">{t.date}</td>
                              <td className="py-3.5 font-medium text-slate-700 max-w-xs">{t.description}</td>
                              <td className="py-3.5 text-slate-500 font-mono text-[11px]">{t.paymentMethod || 'Braintree Vault'}</td>
                              <td className="py-3.5 text-right font-black font-mono text-[#0b2942]">${t.amount}</td>
                              <td className="py-3.5 text-right">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    t.status === 'Paid'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : t.status === 'Overdue'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {t.status}
                                </span>
                              </td>
                              <td className="py-3.5 text-right">
                                {t.status === 'Overdue' ? (
                                  <button
                                    type="button"
                                    onClick={() => handlePayOverdueInvoice(t.id)}
                                    disabled={payingInvoiceId === t.id}
                                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-[10px] cursor-pointer"
                                  >
                                    Pay Now
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="text-slate-400 hover:text-slate-700 font-bold text-[11px] cursor-pointer"
                                  >
                                    Invoice
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: QUOTES */}
              {activeTab === 'quotes' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-extrabold text-[#0b2942]">
                      Your Portabox Quotes ({currentUser.quotes.length})
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {currentUser.quotes.map((q) => (
                      <div
                        key={q.id}
                        className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs bg-sky-100 text-sky-800 px-2.5 py-0.5 rounded-md">
                              {q.quoteNumber}
                            </span>
                            <h4 className="font-extrabold text-sm text-[#0b2942]">
                              {q.containerSize.replace('_', ' ').toUpperCase()} Container ({q.containerCount} Unit{q.containerCount > 1 ? 's' : ''})
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500">
                            Created: {q.createdAt} · Valid until: <strong>{q.validUntil}</strong> · Billing: <strong>{q.billingCycle}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-left sm:text-right">
                            <div className="text-lg font-black text-[#0b2942] font-mono">
                              ${q.firstPaymentTotal}
                            </div>
                            <span className="text-[11px] text-slate-400">First payment</span>
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            {q.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: DISCOUNTS & SAVINGS */}
              {activeTab === 'discounts' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-emerald-500 text-white rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-100">
                        Total Discounts & Savings Awarded
                      </span>
                      <h3 className="text-3xl sm:text-4xl font-black font-mono mt-1">
                        ${totalDiscounts}
                      </h3>
                      <p className="text-xs text-emerald-100 mt-1 max-w-md">
                        Includes promotional voucher codes, upfront advance payment rebates, and volume discounts applied to your Portabox account.
                      </p>
                    </div>

                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
                      <Sparkles className="w-7 h-7" />
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
                    <h4 className="text-sm font-extrabold text-[#0b2942]">Discount Log:</h4>
                    <div className="divide-y divide-slate-100">
                      {(currentUser.discountsGiven || []).map((d) => (
                        <div key={d.id} className="py-3 flex items-center justify-between text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                {d.code || d.type.toUpperCase()}
                              </span>
                              <span className="font-extrabold text-[#0b2942]">{d.description}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 mt-0.5 block">{d.date}</span>
                          </div>
                          <span className="font-mono font-black text-sm text-emerald-600">
                            -${d.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: SELF-SERVICE & CONTAINER PICKUP */}
              {activeTab === 'selfservice' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Schedule Container Pickup */}
                  <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-sky-100 text-[#00c0f3]">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-[#0b2942]">
                          Request Container Pickup / Return
                        </h4>
                        <p className="text-xs text-slate-500">
                          Finished packing or storing? Book a horizontal level-lift truck pickup from your address (zero tilt keeps your goods completely flat).
                        </p>
                      </div>
                    </div>

                    {pickupRequested ? (
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span>Pickup request confirmed for {pickupDate}! Our dispatch team will text you 30 minutes before arrival.</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Preferred Pickup Date
                          </label>
                          <input
                            type="date"
                            value={pickupDate}
                            onChange={(e) => setPickupDate(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00c0f3]"
                          />
                        </div>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => setPickupRequested(true)}
                            className="w-full py-2.5 bg-[#0b2942] hover:bg-[#081e30] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                          >
                            Confirm Pickup Booking
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Update Placement Instructions */}
                  <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-[#0b2942]">
                          Driver Placement & Access Instructions
                        </h4>
                        <p className="text-xs text-slate-500">
                          Update gate codes, driveway side preferences, or low-branch clearance notes for your driver.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-1">
                      <textarea
                        rows={3}
                        value={accessNotesText}
                        onChange={(e) => setAccessNotesText(e.target.value)}
                        placeholder="e.g. Place container on left side of driveway facing garage. Gate access code is 4192. Please call 15 min prior."
                        className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00c0f3]"
                      />

                      <div className="flex items-center justify-between">
                        {notesSavedSuccess ? (
                          <span className="text-xs font-bold text-emerald-600">✓ Notes sent to dispatch driver tablet</span>
                        ) : <span />}

                        <button
                          type="button"
                          onClick={handleSaveAccessNotes}
                          className="px-5 py-2.5 bg-[#00c0f3] hover:bg-[#00a8d6] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Save Instructions
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
