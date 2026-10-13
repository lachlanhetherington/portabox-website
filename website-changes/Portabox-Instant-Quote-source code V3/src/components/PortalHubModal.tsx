import React from 'react';
import { X, User, Calendar, SlidersHorizontal, ArrowRight, ShieldCheck, Phone } from 'lucide-react';

interface PortalHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCustomerPortal: () => void;
  onOpenCallCenter: () => void;
  onOpenAdmin: () => void;
  isCallCenterEnabled?: boolean;
  phone?: string;
}

export const PortalHubModal: React.FC<PortalHubModalProps> = ({
  isOpen,
  onClose,
  onOpenCustomerPortal,
  onOpenCallCenter,
  onOpenAdmin,
  isCallCenterEnabled = true,
  phone = '1800 467 637',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="portal-hub-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-[#00c0f3] text-[10px] font-extrabold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3 h-3" />
            <span>Internal & Customer Services</span>
          </div>
          <h3
            id="portal-hub-title"
            className="text-xl sm:text-2xl font-extrabold text-[#0b2942] tracking-tight"
          >
            Portabox Management & Portals
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Choose which portal you would like to access:
          </p>
        </div>

        {/* 3 Portal Selection Cards */}
        <div className="space-y-3">
          {/* 1. Customer Account Portal */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCustomerPortal();
            }}
            className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-[#00c0f3] bg-slate-50/60 hover:bg-sky-50/40 transition-all cursor-pointer group flex items-start justify-between gap-3 shadow-2xs"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00c0f3] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#0b2942] group-hover:text-[#00c0f3] transition-colors">
                  Customer Account Portal
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Log in to view active containers on site, delivery schedules, saved quotes, and invoices.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#00c0f3] transition-colors shrink-0 mt-1" />
          </button>

          {/* 2. Call Center Dispatch & Scheduling */}
          {isCallCenterEnabled && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCallCenter();
              }}
              className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-[#00c0f3] bg-slate-50/60 hover:bg-sky-50/40 transition-all cursor-pointer group flex items-start justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[#0b2942] group-hover:text-amber-600 transition-colors">
                    Call Center Dispatch & Calendar
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Live route clustering, delivery window allocation, and Google Calendar fleet integration.
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors shrink-0 mt-1" />
            </button>
          )}

          {/* 3. Admin & Pricing Portal */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAdmin();
            }}
            className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/40 transition-all cursor-pointer group flex items-start justify-between gap-3 shadow-2xs"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                <SlidersHorizontal className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-[#0b2942] group-hover:text-emerald-600 transition-colors">
                  Admin Management & Pricing
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Real-time lead CRM, pricing rules, promo codes, Australian depot rates, and Smartsheet bridge.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0 mt-1" />
          </button>
        </div>

        {/* Footer Support Info */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Portabox Staff Support: <strong className="text-slate-700">{phone}</strong></span>
          <span className="font-mono text-[11px] text-slate-400">Shortcut: Ctrl+Shift+A</span>
        </div>
      </div>
    </div>
  );
};
