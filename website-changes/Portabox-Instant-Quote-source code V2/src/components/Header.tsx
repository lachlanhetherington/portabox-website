import React from 'react';
import { Phone, ChevronLeft, ShieldCheck, SlidersHorizontal, User, Calendar } from 'lucide-react';

interface HeaderProps {
  currentStep: number;
  onBack?: () => void;
  isAdminOpen: boolean;
  onToggleAdmin: () => void;
  isCallCenterOpen?: boolean;
  onToggleCallCenter?: () => void;
  onOpenCustomerPortal: () => void;
  phone?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onBack,
  isAdminOpen,
  onToggleAdmin,
  isCallCenterOpen = false,
  onToggleCallCenter,
  onOpenCustomerPortal,
  phone = '1800 467 637',
}) => {
  return (
    <header className="w-full bg-[#f0f4f8] border-b border-slate-200/80 sticky top-0 z-30 backdrop-blur-md bg-opacity-95">
      <div className="max-w-6xl mx-auto py-3 sm:py-4 px-3 sm:px-8 flex items-center justify-between">
        {/* Left: Back button (if past step 1 and not in admin mode) */}
        <div className="w-16 sm:w-28 flex items-center">
          {currentStep > 1 && !isAdminOpen && !isCallCenterOpen ? (
            <button
              onClick={onBack}
              aria-label="Previous step"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:border-slate-300 transition-all cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
          ) : (
            <div className="w-9 sm:w-10" />
          )}
        </div>

        {/* Center: Portabox Logo */}
        <div className="flex flex-col items-center select-none">
          <div className="bg-[#00c0f3] text-white px-4 sm:px-5 py-1 sm:py-1.5 rounded-lg shadow-xs flex flex-col items-center justify-center transition-transform hover:scale-[1.02]">
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight leading-none text-white font-['Cabinet_Grotesk',sans-serif]">
              portabox
            </span>
            <span className="text-[6.5px] sm:text-[7.5px] font-bold tracking-wider text-sky-100 uppercase mt-0.5 whitespace-nowrap">
              MOVING AND STORAGE CONTAINERS
            </span>
          </div>
        </div>

        {/* Right: Call Center, Customer Portal, Admin & Phone */}
        <div className="w-auto flex items-center gap-1.5 sm:gap-2.5 justify-end">
          {onToggleCallCenter && (
            <button
              onClick={onToggleCallCenter}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-full border transition-all cursor-pointer shadow-2xs ${
                isCallCenterOpen
                  ? 'bg-[#00c0f3] text-white border-[#00c0f3] shadow-xs'
                  : 'bg-white text-[#0b2942] border-slate-200 hover:bg-sky-50'
              }`}
              title="Call Center Google Calendar & Routing Optimizer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#00c0f3]" />
              <span className="hidden md:inline font-bold">Call Center Dispatch</span>
              <span className="md:hidden font-bold">Dispatch</span>
            </button>
          )}

          <button
            onClick={onOpenCustomerPortal}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-full border border-sky-200 bg-sky-50 hover:bg-sky-100 text-[#0b2942] transition-all cursor-pointer shadow-2xs"
            title="Log in to view active containers, delivery times, quotes, and billing"
          >
            <User className="w-3.5 h-3.5 text-[#00c0f3]" />
            <span className="hidden sm:inline font-bold">Customer Portal</span>
            <span className="sm:hidden font-bold">Portal</span>
          </button>

          <button
            onClick={onToggleAdmin}
            className={`hidden md:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
              isAdminOpen
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Configure pricing, promotions, and view customer leads"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{isAdminOpen ? 'Close Admin' : 'Admin & Pricing'}</span>
          </button>

          <a
            href={`tel:${phone.replace(/\s+/g, '')}`}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-[#0b2942] hover:bg-[#081e30] text-white rounded-full font-bold text-xs sm:text-sm tracking-wide shadow-xs transition-colors cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white shrink-0" />
            <span className="hidden xs:inline sm:inline whitespace-nowrap font-mono font-bold">{phone}</span>
            <span className="xs:hidden text-[11px] font-bold">Call</span>
          </a>
        </div>
      </div>

      {/* Progress Bar Across the Top */}
      {!isAdminOpen && !isCallCenterOpen && (
        <div className="w-full bg-slate-200/90 h-1.5 relative overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00c0f3] to-[#0096c0] transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.round((currentStep / 6) * 100))}%` }}
          />
        </div>
      )}
    </header>
  );
};
