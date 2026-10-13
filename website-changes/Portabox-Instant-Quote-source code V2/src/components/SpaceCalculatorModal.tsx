import React, { useState } from 'react';
import { X, Calculator, Check, Box } from 'lucide-react';
import { ContainerSizeId } from '../types/quote';

interface SpaceCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSize: (size: ContainerSizeId) => void;
}

export const SpaceCalculatorModal: React.FC<SpaceCalculatorModalProps> = ({
  isOpen,
  onClose,
  onSelectSize,
}) => {
  const [bedrooms, setBedrooms] = useState(2);
  const [hasLounge, setHasLounge] = useState(true);
  const [hasDining, setHasDining] = useState(true);
  const [hasOutdoor, setHasOutdoor] = useState(false);
  const [extraBoxes, setExtraBoxes] = useState(15);

  if (!isOpen) return null;

  // Approximate volume calculation
  let calculatedM3 = bedrooms * 7;
  if (hasLounge) calculatedM3 += 6;
  if (hasDining) calculatedM3 += 4;
  if (hasOutdoor) calculatedM3 += 4;
  calculatedM3 += Math.round(extraBoxes * 0.15);

  let recommendedSize: ContainerSizeId = 'large_25m3';
  let recommendedLabel = 'Large (25 m³)';

  if (calculatedM3 <= 10) {
    recommendedSize = 'small_10m3';
    recommendedLabel = 'Small (10 m³)';
  } else if (calculatedM3 <= 19) {
    recommendedSize = 'medium_19m3';
    recommendedLabel = 'Medium (19 m³)';
  } else if (calculatedM3 <= 25) {
    recommendedSize = 'large_25m3';
    recommendedLabel = 'Large (25 m³)';
  } else if (calculatedM3 <= 35) {
    recommendedSize = 'combo_35m3';
    recommendedLabel = 'Large + Small Combo (35 m³)';
  } else {
    recommendedSize = 'two_large_50m3';
    recommendedLabel = '2 x Large Containers (50 m³)';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 text-[#00c0f3]">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#0b2942]">Space Calculator</h3>
              <p className="text-xs text-slate-500">Find the perfect container size for your home</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inputs */}
        <div className="space-y-4 py-5">
          {/* Bedrooms */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              How many bedrooms are you storing?
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setBedrooms(num)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    bedrooms === num
                      ? 'bg-[#00c0f3] text-white border-[#00c0f3] shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {num} {num === 1 ? 'bed' : 'beds'}
                </button>
              ))}
            </div>
          </div>

          {/* Living Areas */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Additional areas:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setHasLounge(!hasLounge)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  hasLounge
                    ? 'bg-sky-50 border-[#00c0f3] text-[#0b2942] font-bold'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                {hasLounge ? '✓ ' : ''}Living room
              </button>
              <button
                type="button"
                onClick={() => setHasDining(!hasDining)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  hasDining
                    ? 'bg-sky-50 border-[#00c0f3] text-[#0b2942] font-bold'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                {hasDining ? '✓ ' : ''}Dining area
              </button>
              <button
                type="button"
                onClick={() => setHasOutdoor(!hasOutdoor)}
                className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  hasOutdoor
                    ? 'bg-sky-50 border-[#00c0f3] text-[#0b2942] font-bold'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                {hasOutdoor ? '✓ ' : ''}Garage / Shed
              </button>
            </div>
          </div>

          {/* Extra moving boxes slider */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
              <span>Estimated standard moving boxes:</span>
              <span className="font-mono text-[#00c0f3]">{extraBoxes} boxes</span>
            </div>
            <input
              type="range"
              min={0}
              max={60}
              step={5}
              value={extraBoxes}
              onChange={(e) => setExtraBoxes(parseInt(e.target.value, 10))}
              className="w-full accent-[#00c0f3] cursor-pointer"
            />
          </div>
        </div>

        {/* Output Calculation Result */}
        <div className="p-4 bg-sky-50/80 rounded-2xl border border-sky-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider font-extrabold text-sky-700">Estimated Volume</p>
              <p className="text-2xl font-extrabold text-[#0b2942] font-mono">~{calculatedM3} m³</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider font-extrabold text-sky-700">Recommended Size</p>
              <p className="text-sm font-extrabold text-[#00c0f3]">{recommendedLabel}</p>
            </div>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSelectSize(recommendedSize);
              onClose();
            }}
            className="px-6 py-2.5 bg-[#0b2942] hover:bg-[#081e30] text-white rounded-xl text-xs font-bold tracking-wide shadow-xs cursor-pointer"
          >
            Apply recommended size
          </button>
        </div>
      </div>
    </div>
  );
};
