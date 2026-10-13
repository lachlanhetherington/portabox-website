import React from 'react';
import { MessageSquare, Phone } from 'lucide-react';

interface AreYouStuckBannerProps {
  className?: string;
  variant?: 'banner' | 'compact' | 'card';
}

export const AreYouStuckBanner: React.FC<AreYouStuckBannerProps> = ({
  className = '',
  variant = 'banner',
}) => {
  return (
    <div
      className={`rounded-2xl border border-sky-200/90 bg-sky-50/80 p-4 sm:p-4.5 transition-all shadow-2xs ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#00c0f3] text-white shrink-0 shadow-xs">
            <MessageSquare className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-extrabold text-[#0b2942] tracking-tight">
              Are you stuck?
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Text us and we will help you.{' '}
              <span className="hidden sm:inline">Our team is ready to answer any questions.</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <a
            href="sms:0488883234"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0b2942] hover:bg-[#081e30] text-white text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#00c0f3]" />
            <span>Text us now (0488 883 234)</span>
          </a>
          <a
            href="tel:0488883234"
            title="Call 0488 883 234"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer sm:hidden"
          >
            <Phone className="w-3.5 h-3.5 text-[#00c0f3]" />
          </a>
        </div>
      </div>
    </div>
  );
};
