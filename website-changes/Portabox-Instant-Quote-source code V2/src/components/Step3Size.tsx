import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Calculator, Check } from 'lucide-react';
import { PORTABOX_IMAGES } from '../assets/images';
import { AppConfig, ContainerSizeId } from '../types/quote';
import { SpaceCalculatorModal } from './SpaceCalculatorModal';
import { AreYouStuckBanner } from './AreYouStuckBanner';

interface Step3SizeProps {
  containerSize: ContainerSizeId;
  onSelectContainerSize: (size: ContainerSizeId) => void;
  containerCount?: number;
  onSelectContainerCount?: (count: number) => void;
  config: AppConfig;
  onContinue: () => void;
  onBack: () => void;
}

export const Step3Size: React.FC<Step3SizeProps> = ({
  containerSize,
  onSelectContainerSize,
  containerCount = 1,
  onSelectContainerCount,
  config,
  onContinue,
  onBack,
}) => {
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isCustomCountOpen, setIsCustomCountOpen] = useState(containerCount > 3);
  const [customInputVal, setCustomInputVal] = useState(containerCount > 3 ? String(containerCount) : '4');

  const { small_10m3, medium_19m3, large_25m3 } = config.containerPrices;

  const handleCustomCountChange = (val: number) => {
    const safeVal = Math.max(1, Math.min(val, 20));
    setCustomInputVal(String(safeVal));
    if (onSelectContainerCount) {
      onSelectContainerCount(safeVal);
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 shadow-xs border border-slate-200/80">
      {/* Header kicker */}
      <span className="text-xs font-extrabold uppercase tracking-widest text-[#00c0f3] font-['Cabinet_Grotesk',sans-serif]">
        INSTANT QUOTE
      </span>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mt-1 mb-2">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0b2942] tracking-tight">
          Which size do you need?
        </h1>
      </div>

      <p className="text-sm sm:text-base text-slate-500 max-w-xl">
        Australia's largest containers, so you need fewer of them.
      </p>

      {/* Container Quantity Selection Bar */}
      {onSelectContainerCount && containerSize !== 'combo_35m3' && (
        <div className="mt-6 p-4 bg-sky-50/60 rounded-2xl border border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs font-extrabold text-[#0b2942] uppercase tracking-wider">
              Number of containers needed
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {[1, 2, 3].map((qty) => (
              <button
                key={qty}
                type="button"
                onClick={() => {
                  setIsCustomCountOpen(false);
                  onSelectContainerCount(qty);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  containerCount === qty && !isCustomCountOpen
                    ? 'bg-[#0b2942] text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                {qty} {qty === 1 ? 'Container' : 'Containers'}
              </button>
            ))}

            {/* Custom >3 containers button */}
            <button
              type="button"
              onClick={() => {
                setIsCustomCountOpen(true);
                const nextVal = containerCount > 3 ? containerCount : 4;
                handleCustomCountChange(nextVal);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isCustomCountOpen || containerCount > 3
                  ? 'bg-[#0b2942] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {containerCount > 3 ? `${containerCount} Containers` : '> 3 Custom'}
            </button>

            {/* Stepper for >3 containers */}
            {(isCustomCountOpen || containerCount > 3) && (
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-300 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleCustomCountChange(containerCount - 1)}
                  disabled={containerCount <= 4}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold flex items-center justify-center text-sm cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min="4"
                  max="20"
                  value={containerCount}
                  onChange={(e) => handleCustomCountChange(parseInt(e.target.value) || 4)}
                  className="w-10 text-center font-bold text-xs text-[#0b2942] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleCustomCountChange(containerCount + 1)}
                  disabled={containerCount >= 20}
                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold flex items-center justify-center text-sm cursor-pointer"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3 Main Container Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-7">
        {/* SMALL · 10 m³ */}
        <div
          onClick={() => onSelectContainerSize('small_10m3')}
          className={`group rounded-2xl border-2 transition-all p-4 flex flex-col justify-between cursor-pointer relative ${
            containerSize === 'small_10m3'
              ? 'border-[#00c0f3] bg-sky-50/20 shadow-md ring-2 ring-[#00c0f3]/20'
              : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs'
          }`}
        >
          <div>
            {/* Image Container without hover dimensions overlay */}
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 mb-4 relative">
              <img
                src={PORTABOX_IMAGES.smallContainer}
                alt="10 m³ Portabox Container"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              {containerCount > 1 && containerSize === 'small_10m3' ? `${containerCount} X 10 M³` : 'SMALL · 10 M³'}
            </p>
            <h3 className="text-xl font-extrabold text-[#0b2942] mt-0.5">
              {containerCount > 1 && containerSize === 'small_10m3' ? `${containerCount} x 10 m³ (${containerCount * 10} m³)` : '10 m³'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
              1 bedroom home or apartment
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-slate-400 font-medium">From</span>
                <span className="text-xl font-extrabold text-[#0b2942] font-mono">
                  ${containerCount > 1 && containerSize === 'small_10m3' ? small_10m3.monthlyRate * containerCount : small_10m3.monthlyRate}
                </span>
                <span className="text-xs text-slate-500">/mo</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                or ${containerCount > 1 && containerSize === 'small_10m3' ? small_10m3.weeklyRate * containerCount : small_10m3.weeklyRate}/wk
              </span>
            </div>
            {containerCount > 1 && containerSize === 'small_10m3' && (
              <div className="text-[11px] text-sky-700 font-semibold">
                <span>${small_10m3.monthlyRate}/mo per container</span>
              </div>
            )}
          </div>
        </div>

        {/* MEDIUM · 19 m³ */}
        <div
          onClick={() => onSelectContainerSize('medium_19m3')}
          className={`group rounded-2xl border-2 transition-all p-4 flex flex-col justify-between cursor-pointer relative ${
            containerSize === 'medium_19m3'
              ? 'border-[#00c0f3] bg-sky-50/20 shadow-md ring-2 ring-[#00c0f3]/20'
              : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs'
          }`}
        >
          <div>
            {/* Image Container without hover dimensions overlay */}
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 mb-4 relative">
              <img
                src={PORTABOX_IMAGES.mediumContainer}
                alt="19 m³ Portabox Container"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              {containerCount > 1 && containerSize === 'medium_19m3' ? `${containerCount} X 19 M³` : 'MEDIUM · 19 M³'}
            </p>
            <h3 className="text-xl font-extrabold text-[#0b2942] mt-0.5">
              {containerCount > 1 && containerSize === 'medium_19m3' ? `${containerCount} x 19 m³ (${containerCount * 19} m³)` : '19 m³'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
              2 bedroom home
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-slate-400 font-medium">From</span>
                <span className="text-xl font-extrabold text-[#0b2942] font-mono">
                  ${containerCount > 1 && containerSize === 'medium_19m3' ? medium_19m3.monthlyRate * containerCount : medium_19m3.monthlyRate}
                </span>
                <span className="text-xs text-slate-500">/mo</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                or ${containerCount > 1 && containerSize === 'medium_19m3' ? medium_19m3.weeklyRate * containerCount : medium_19m3.weeklyRate}/wk
              </span>
            </div>
            {containerCount > 1 && containerSize === 'medium_19m3' && (
              <div className="text-[11px] text-sky-700 font-semibold">
                <span>${medium_19m3.monthlyRate}/mo per container</span>
              </div>
            )}
          </div>
        </div>

        {/* LARGE · 25 m³ (BEST VALUE) */}
        <div
          onClick={() => onSelectContainerSize('large_25m3')}
          className={`group rounded-2xl border-2 transition-all p-4 flex flex-col justify-between cursor-pointer relative ${
            containerSize === 'large_25m3'
              ? 'border-[#00c0f3] bg-sky-50/20 shadow-md ring-2 ring-[#00c0f3]/20'
              : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs'
          }`}
        >
          <div>
            {/* Image Container without hover dimensions overlay */}
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 mb-4 relative">
              <img
                src={PORTABOX_IMAGES.largeContainer}
                alt="25 m³ Portabox Container"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-2 left-2 bg-[#00c0f3] text-white font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-md shadow-xs">
                BEST VALUE
              </span>
            </div>

            <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              {containerCount > 1 && containerSize === 'large_25m3' ? `${containerCount} X 25 M³` : 'LARGE · 25 M³'}
            </p>
            <h3 className="text-xl font-extrabold text-[#0b2942] mt-0.5">
              {containerCount > 1 && containerSize === 'large_25m3' ? `${containerCount} x 25 m³ (${containerCount * 25} m³)` : '25 m³'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 min-h-[32px]">
              3 bedroom home
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-slate-400 font-medium">From</span>
                <span className="text-xl font-extrabold text-[#0b2942] font-mono">
                  ${containerCount > 1 && containerSize === 'large_25m3' ? large_25m3.monthlyRate * containerCount : large_25m3.monthlyRate}
                </span>
                <span className="text-xs text-slate-500">/mo</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                or ${containerCount > 1 && containerSize === 'large_25m3' ? large_25m3.weeklyRate * containerCount : large_25m3.weeklyRate}/wk
              </span>
            </div>
            {containerCount > 1 && containerSize === 'large_25m3' && (
              <div className="text-[11px] text-sky-700 font-semibold">
                <span>${large_25m3.monthlyRate}/mo per container</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Combo Option & Space Calculator row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-5">
        {/* Large + Small Combo (35 m³) */}
        <button
          type="button"
          onClick={() => onSelectContainerSize('combo_35m3')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
            containerSize === 'combo_35m3'
              ? 'border-[#00c0f3] bg-sky-50 text-[#0b2942] ring-2 ring-[#00c0f3]/20 font-bold'
              : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
          }`}
        >
          <div>
            <div className="text-xs font-bold text-[#0b2942]">Large + Small combo (35 m³)</div>
            <div className="text-[11px] text-slate-500">2 containers · $219 + $209 = $428/mo</div>
          </div>
          {containerSize === 'combo_35m3' && (
            <div className="w-5 h-5 rounded-full bg-[#00c0f3] text-white flex items-center justify-center text-xs">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          )}
        </button>

        {/* Space Calculator CTA Button */}
        <button
          type="button"
          onClick={() => setIsCalculatorOpen(true)}
          className="p-3.5 rounded-2xl border border-dashed border-sky-300 hover:border-[#00c0f3] bg-sky-50/50 hover:bg-sky-50 text-slate-700 transition-all cursor-pointer flex items-center gap-2.5"
        >
          <div className="p-1.5 rounded-lg bg-white shadow-xs text-[#00c0f3]">
            <Calculator className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-[#0b2942]">Not sure? Space calculator</div>
            <div className="text-[11px] text-slate-500">Estimate by room & furniture</div>
          </div>
        </button>
      </div>

      {/* Are You Stuck Banner */}
      <div className="mt-8">
        <AreYouStuckBanner />
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex items-center justify-between pt-6 border-t border-slate-100">
        <button
          onClick={onBack}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <button
          onClick={onContinue}
          className="px-8 py-3.5 bg-[#0b2942] hover:bg-[#081e30] text-white font-bold rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Space Calculator Modal */}
      <SpaceCalculatorModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
        onSelectSize={(size) => {
          onSelectContainerSize(size);
        }}
      />
    </div>
  );
};
