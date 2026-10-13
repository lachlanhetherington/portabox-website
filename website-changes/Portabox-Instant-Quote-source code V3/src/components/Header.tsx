import React from 'react';
import { Phone, ChevronLeft, Lock } from 'lucide-react';

interface HeaderProps {
  currentStep: number;
  onBackStep?: () => void;
  onCancelQuote?: () => void;
  isAdminOpen: boolean;
  onToggleAdmin: () => void;
  isCallCenterOpen?: boolean;
  onToggleCallCenter?: () => void;
  onOpenCustomerPortal?: () => void;
  onOpenPortalHub?: () => void;
  phone?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onBackStep,
  onCancelQuote,
  isAdminOpen,
  onToggleAdmin,
  isCallCenterOpen = false,
  onToggleCallCenter,
  onOpenCustomerPortal,
  onOpenPortalHub,
  phone = '1800 467 637',
}) => {
  // Calculate progress percentage:
  // Step 1: ~16.7% | Step 2: ~33.3% | Step 3: ~50% | Step 4: ~66.7% | Step 5: ~83.3% | Step 6: 100%
  const progressPercent = Math.min(100, Math.round((currentStep / 6) * 100));

  const handleBackClick = () => {
    if (isAdminOpen) {
      onToggleAdmin();
    } else if (isCallCenterOpen && onToggleCallCenter) {
      onToggleCallCenter();
    } else if (currentStep === 1) {
      if (onCancelQuote) onCancelQuote();
    } else {
      if (onBackStep) onBackStep();
    }
  };

  return (
    <header className="w-full bg-[#f0f4f8] border-b border-slate-200/80 sticky top-0 z-30 backdrop-blur-md bg-opacity-95">
      <div className="max-w-6xl mx-auto py-2 sm:py-3.5 px-3 sm:px-8 flex items-center justify-between">
        {/* Left: Back button (heads back to previous step or triggers cancel quote to return to website) */}
        <div className="w-16 sm:w-32 flex items-center">
          <button
            onClick={handleBackClick}
            aria-label={currentStep === 1 && !isAdminOpen && !isCallCenterOpen ? "Cancel quote and return to website" : "Previous step"}
            title={currentStep === 1 && !isAdminOpen && !isCallCenterOpen ? "Cancel quote and return to website" : "Previous step"}
            className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white shadow-xs border border-slate-200 text-slate-700 hover:text-slate-950 hover:border-slate-300 transition-all cursor-pointer active:scale-95 text-xs sm:text-sm font-bold"
          >
            <ChevronLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        {/* Center: Portabox Logo */}
        <div className="flex flex-col items-center select-none">
          <div className="bg-[#00c0f3] text-white px-3.5 sm:px-5 py-0.5 sm:py-1.5 rounded-lg shadow-xs flex flex-col items-center justify-center transition-transform hover:scale-[1.02]">
            <span className="font-extrabold text-lg sm:text-2xl tracking-tight leading-none text-white font-['Cabinet_Grotesk',sans-serif]">
              portabox
            </span>
            <span className="text-[6px] sm:text-[7.5px] font-bold tracking-wider text-sky-100 uppercase mt-0.5 whitespace-nowrap">
              MOVING AND STORAGE CONTAINERS
            </span>
          </div>
        </div>

        {/* Right: Direct High-Converting Phone Call Button & Optional Discreet Desktop Staff Access */}
        <div className="w-16 sm:w-32 flex items-center justify-end gap-2">
          {onOpenPortalHub && (
            <button
              onClick={onOpenPortalHub}
              title="Staff & Management Portals"
              aria-label="Staff & Management Portals"
              className="hidden lg:flex w-8 h-8 rounded-full border border-slate-200/90 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 items-center justify-center transition-colors cursor-pointer shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}

          <a
            href={`tel:${phone.replace(/\s+/g, '')}`}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#0b2942] hover:bg-[#081e30] text-white rounded-full font-bold text-xs sm:text-sm tracking-wide shadow-xs transition-colors cursor-pointer"
            title={`Call Portabox: ${phone}`}
          >
            <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap font-mono font-bold">{phone}</span>
            <span className="sm:hidden text-[11px] font-bold">Call</span>
          </a>
        </div>
      </div>

      {/* Progress Bar with Small Portabox Shipping Container */}
      {!isAdminOpen && !isCallCenterOpen && (
        <div className="w-full bg-slate-200/90 h-[3.5px] relative overflow-visible">
          {/* Active progress fill line (Vibrant Cyan into Portabox Gold) */}
          <div
            className="h-full bg-gradient-to-r from-[#00c0f3] via-[#00c0f3] to-[#ffd000] transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Small Portabox Shipping Container Riding Along the Progress Bar (White body, navy frame & doors, Porter Box lettering) */}
          <div
            className="absolute -top-[19px] transition-all duration-500 ease-out pointer-events-none select-none z-10"
            style={{
              left: `min(calc(100% - 46px), max(0px, calc(${progressPercent}% - 23px)))`,
            }}
          >
            <svg
              width="46"
              height="23"
              viewBox="0 0 46 23"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-sm filter"
            >
              {/* Base contact shadow */}
              <ellipse cx="23" cy="21.5" rx="19" ry="1.5" fill="#000000" fillOpacity="0.2" />

              {/* Outer Container Perimeter & Corner Castings in Deep Navy */}
              <rect x="2" y="2" width="42" height="18" rx="1.5" fill="#0f3353" />

              {/* White Corrugated Container Side Panel */}
              <rect x="3.5" y="3.5" width="29.5" height="15" fill="#ffffff" />

              {/* Corrugation Fluting Lines on White Body */}
              <line x1="7.5" y1="3.5" x2="7.5" y2="18.5" stroke="#f1f5f9" strokeWidth="0.8" />
              <line x1="8.3" y1="3.5" x2="8.3" y2="18.5" stroke="#cbd5e1" strokeWidth="0.8" />

              <line x1="12" y1="3.5" x2="12" y2="18.5" stroke="#f1f5f9" strokeWidth="0.8" />
              <line x1="12.8" y1="3.5" x2="12.8" y2="18.5" stroke="#cbd5e1" strokeWidth="0.8" />

              <line x1="16.5" y1="3.5" x2="16.5" y2="18.5" stroke="#f1f5f9" strokeWidth="0.8" />
              <line x1="17.3" y1="3.5" x2="17.3" y2="18.5" stroke="#cbd5e1" strokeWidth="0.8" />

              <line x1="21" y1="3.5" x2="21" y2="18.5" stroke="#f1f5f9" strokeWidth="0.8" />
              <line x1="21.8" y1="3.5" x2="21.8" y2="18.5" stroke="#cbd5e1" strokeWidth="0.8" />

              <line x1="25.5" y1="3.5" x2="25.5" y2="18.5" stroke="#f1f5f9" strokeWidth="0.8" />
              <line x1="26.3" y1="3.5" x2="26.3" y2="18.5" stroke="#cbd5e1" strokeWidth="0.8" />

              {/* "Porter Box" brand lettering on the side panel */}
              <rect x="6.5" y="7.5" width="23.5" height="7" rx="1" fill="#f8fafc" />
              <text x="18" y="12.8" textAnchor="middle" fill="#0f3353" fontSize="4.6" fontWeight="900" fontFamily="sans-serif" letterSpacing="-0.2">
                Porter Box
              </text>
              {/* Cyan Brand Accent Dot */}
              <circle cx="28.2" cy="9.2" r="0.9" fill="#00c0f3" />

              {/* Navy Blue Container End / Cargo Door */}
              <rect x="33" y="3.5" width="9.5" height="15" fill="#0f3353" />
              <line x1="33" y1="3.5" x2="33" y2="18.5" stroke="#081d30" strokeWidth="0.8" />

              {/* Twin Silver Locking Rods on Navy Door */}
              <line x1="35.5" y1="3" x2="35.5" y2="19" stroke="#cbd5e1" strokeWidth="0.9" />
              <rect x="34.8" y="10" width="1.6" height="1.4" rx="0.3" fill="#ffffff" />

              <line x1="39" y1="3" x2="39" y2="19" stroke="#cbd5e1" strokeWidth="0.9" />
              <rect x="38.3" y="10" width="1.6" height="1.4" rx="0.3" fill="#ffffff" />

              {/* 4 Corner Castings with aperture cutouts in Deep Slate Navy */}
              <rect x="2" y="2" width="3.5" height="3.5" rx="0.6" fill="#081d30" />
              <ellipse cx="3.75" cy="3.75" rx="0.9" ry="0.8" fill="#1e293b" />

              <rect x="40.5" y="2" width="3.5" height="3.5" rx="0.6" fill="#081d30" />
              <ellipse cx="42.25" cy="3.75" rx="0.9" ry="0.8" fill="#1e293b" />

              <rect x="2" y="16.5" width="3.5" height="3.5" rx="0.6" fill="#081d30" />
              <ellipse cx="3.75" cy="18.25" rx="0.9" ry="0.8" fill="#1e293b" />

              <rect x="40.5" y="16.5" width="3.5" height="3.5" rx="0.6" fill="#081d30" />
              <ellipse cx="42.25" cy="18.25" rx="0.9" ry="0.8" fill="#1e293b" />
            </svg>
          </div>
        </div>
      )}
    </header>
  );
};
