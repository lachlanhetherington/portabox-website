import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ArrowRight, AlertTriangle, ShieldAlert, Sparkles } from 'lucide-react';
import {
  AUSTRALIAN_POSTCODES,
  findClosestDepot,
  PostcodeRecord,
  searchPostcodes,
} from '../data/australianPostcodes';
import { AppConfig, BlockedPostcode } from '../types/quote';
import { isPostcodeBlocked } from '../services/pricingEngine';
import { AreYouStuckBanner } from './AreYouStuckBanner';

interface Step1WhereProps {
  initialPostcode: PostcodeRecord | null;
  onSelectPostcode: (postcode: PostcodeRecord) => void;
  onContinue: () => void;
  config: AppConfig;
}

export const Step1Where: React.FC<Step1WhereProps> = ({
  initialPostcode,
  onSelectPostcode,
  onContinue,
  config,
}) => {
  const [query, setQuery] = useState(initialPostcode ? `${initialPostcode.postcode} ${initialPostcode.suburb}` : '5061');
  const [selected, setSelected] = useState<PostcodeRecord | null>(initialPostcode || AUSTRALIAN_POSTCODES[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<PostcodeRecord[]>([]);
  const [blockedNotice, setBlockedNotice] = useState<BlockedPostcode | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length > 0) {
      const results = searchPostcodes(query);
      setSuggestions(results);
    } else {
      setSuggestions(AUSTRALIAN_POSTCODES.slice(0, 6));
    }
  }, [query]);

  // Click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (record: PostcodeRecord) => {
    const blocked = isPostcodeBlocked(record.postcode, config);
    if (blocked) {
      setBlockedNotice(blocked);
      setSelected(null);
      setQuery(`${record.postcode} ${record.suburb}`);
      setIsOpen(false);
      return;
    }

    setBlockedNotice(null);
    setSelected(record);
    setQuery(`${record.postcode} ${record.suburb}`);
    setIsOpen(false);
    onSelectPostcode(record);
  };

  const handleContinueClick = () => {
    if (selected) {
      const blocked = isPostcodeBlocked(selected.postcode, config);
      if (blocked) {
        setBlockedNotice(blocked);
        return;
      }
      onSelectPostcode(selected);
      onContinue();
    } else if (suggestions.length > 0) {
      handleSelect(suggestions[0]);
      onContinue();
    }
  };

  // Calculate depot info for currently selected
  const depotInfo = selected ? findClosestDepot(selected.lat, selected.lng) : null;

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 shadow-xs border border-slate-200/80">
      {/* Header kicker */}
      <span className="text-xs font-extrabold uppercase tracking-widest text-[#00c0f3] font-['Cabinet_Grotesk',sans-serif]">
        INSTANT QUOTE
      </span>

      <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0b2942] tracking-tight mt-1 mb-2">
        Where are you moving or storing?
      </h1>
      <p className="text-sm sm:text-base text-slate-500 max-w-xl">
        Start with your suburb or postcode
      </p>

      {/* Blocked postcode warning */}
      {blockedNotice && (
        <div className="mt-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold">Postcode {blockedNotice.postcode} is currently restricted</p>
            <p className="text-xs text-amber-800 mt-0.5">{blockedNotice.reason}</p>
            <p className="text-xs text-amber-700 mt-1">
              Please enter an alternative Australian delivery address or phone 1800 467 637 for special dispatch options.
            </p>
          </div>
        </div>
      )}

      {/* Input section */}
      <div className="mt-8 relative" ref={dropdownRef}>
        <label className="block text-xs font-bold text-slate-700 mb-2">
          Suburb or postcode
        </label>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-[#00c0f3]" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
                setBlockedNotice(null);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="e.g. 5061, Hyde Park, Melbourne, Sydney..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 border-2 border-[#00c0f3] text-base font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#00c0f3]/20 focus:bg-white transition-all shadow-xs"
            />
          </div>

          <button
            onClick={handleContinueClick}
            disabled={!selected && suggestions.length === 0}
            className="px-8 py-3.5 bg-[#0b2942] hover:bg-[#081e30] disabled:bg-slate-300 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <span>Continue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Autocomplete Dropdown */}
        {isOpen && suggestions.length > 0 && (
          <div className="absolute z-20 mt-2 w-full sm:max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-4 py-2 bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Suggested Australian Locations
            </div>
            {suggestions.map((p) => {
              const isSelected = selected?.postcode === p.postcode && selected?.suburb === p.suburb;
              return (
                <button
                  key={`${p.postcode}-${p.suburb}`}
                  onClick={() => handleSelect(p)}
                  className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-sky-50/70 transition-colors cursor-pointer ${
                    isSelected ? 'bg-sky-50 font-bold' : ''
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4 h-4 text-[#00c0f3]" />
                    <span className="text-sm font-semibold text-slate-900">
                      <span className="font-bold text-[#0b2942]">{p.postcode}</span> {p.suburb}
                    </span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {p.state}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Location Service Check Summary */}
      {selected && !blockedNotice && (
        <div className="mt-6 p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00c0f3] text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <p className="text-sm font-bold text-[#0b2942]">
                Service available to {selected.suburb}, {selected.state} {selected.postcode}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Are You Stuck Banner */}
      <div className="mt-8">
        <AreYouStuckBanner />
      </div>
    </div>
  );
};
