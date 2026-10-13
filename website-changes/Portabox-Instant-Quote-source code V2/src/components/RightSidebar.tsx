import React from 'react';
import { Check, Pencil, ChevronDown, TrendingDown } from 'lucide-react';
import { PostcodeRecord } from '../data/australianPostcodes';
import { BillingCycle, ContainerSizeId, DeliverySlotWindow, ServiceType, StorageDuration } from '../types/quote';

interface RightSidebarProps {
  currentStep: number;
  onJumpToStep: (step: number) => void;
  originPostcode: PostcodeRecord | null;
  destinationPostcode?: PostcodeRecord | null;
  movingDistanceKm?: number | null;
  movingKmCharge?: number;
  fuelSurchargeAmount?: number;
  serviceType: ServiceType;
  storagePlacement?: 'my_place' | 'facility';
  containerSize: ContainerSizeId;
  containerCount?: number;
  storageDuration: StorageDuration;
  preferredDate: string;
  selectedSlot?: DeliverySlotWindow;
  metroHubName?: string;
  billingCycle?: BillingCycle;
  boxesCount?: number;
  blanketsCount?: number;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  currentStep,
  onJumpToStep,
  originPostcode,
  destinationPostcode,
  movingDistanceKm,
  movingKmCharge,
  fuelSurchargeAmount,
  serviceType,
  storagePlacement = 'my_place',
  containerSize,
  containerCount = 1,
  storageDuration,
  preferredDate,
  selectedSlot,
  metroHubName = 'Adelaide',
  billingCycle = 'monthly',
  boxesCount = 0,
  blanketsCount = 0,
}) => {
  const getServiceLabel = () => {
    if (serviceType === 'storage_at_place') return 'Storage, at my place';
    if (serviceType === 'storage_facility') return 'Storage, at Portabox facility';
    if (serviceType === 'moving') {
      if (destinationPostcode) {
        return `Moving to ${destinationPostcode.suburb} ${movingDistanceKm ? `(${movingDistanceKm} km)` : ''}`;
      }
      return 'Moving door to door';
    }
    if (serviceType === 'moving_storage') {
      if (destinationPostcode) {
        return `Move & store: ${originPostcode?.suburb} → ${destinationPostcode.suburb}`;
      }
      return 'Moving and storage';
    }
    return 'Moving and storage';
  };

  const getSizeLabel = () => {
    switch (containerSize) {
      case 'small_10m3':
        return containerCount > 1 ? `${containerCount} x Small (${containerCount * 10} m³)` : '1 x Small (10 m³)';
      case 'medium_19m3':
        return containerCount > 1 ? `${containerCount} x Medium (${containerCount * 19} m³)` : '1 x Medium (19 m³)';
      case 'large_25m3':
        return containerCount > 1 ? `${containerCount} x Large (${containerCount * 25} m³)` : '1 x Large (25 m³)';
      case 'combo_35m3':
        return 'Large + Small combo (35 m³ · 2 units)';
      case 'two_large_50m3':
        return '2 x Large (50 m³ · 2 units)';
      default:
        return '1 x Large (25 m³)';
    }
  };

  const getDurationLabel = () => {
    let dur = storageDuration.replace(/_/g, ' ');
    if (storageDuration === '2_weeks') dur = '2 weeks';
    if (storageDuration === '1_to_3_months') dur = '1 to 3 months';
    if (storageDuration === '4_to_11_months') dur = '4 to 11 months';
    if (storageDuration === '12_plus_months') dur = '12+ months';

    let cycle = 'Monthly billing';
    if (billingCycle === 'weekly') cycle = 'Weekly billing';
    else if (billingCycle === '3_months_upfront') cycle = '3 mo upfront billing';
    else if (billingCycle === '6_months_upfront') cycle = '6 mo upfront billing';
    else if (billingCycle === '12_months_upfront') cycle = '12 mo upfront billing';

    return `${dur} · ${cycle} · from ${preferredDate}`;
  };

  // Competitor benchmarking consistent with Page 6:
  const containerM3 = containerSize === 'small_10m3' ? 10 : containerSize === 'medium_19m3' ? 19 : containerSize === 'combo_35m3' ? 35 : 25;
  const totalVolumeM3 = containerM3 * containerCount;
  const industryBenchmarkRatePerM3 = 15.20;
  const estimatedMonthlyStorage = containerSize === 'small_10m3' ? 209 * containerCount : 219 * containerCount;
  const portaboxRatePerM3 = Math.round((estimatedMonthlyStorage / totalVolumeM3) * 100) / 100;
  const marketMonthlyCost = Math.round(totalVolumeM3 * industryBenchmarkRatePerM3);
  const monthlyCubicSavings = Math.max(0, marketMonthlyCost - estimatedMonthlyStorage);
  const cubicSavingsPercent = Math.round((monthlyCubicSavings / marketMonthlyCost) * 100);

  const competitorSmallContainersCount = Math.max(containerCount + 1, Math.ceil(totalVolumeM3 / 8));
  const deliveryFeePerUnit = 149;
  const competitorDeliveryCost = competitorSmallContainersCount * deliveryFeePerUnit;
  const portaboxDeliveryCost = containerCount * deliveryFeePerUnit;
  const excessDeliveryCharges = Math.max(0, competitorDeliveryCost - portaboxDeliveryCost);
  const firstMonthTotalSavings = monthlyCubicSavings + excessDeliveryCharges;

  return (
    <div className="w-full space-y-4">
      {/* Tracker Card */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-5">
          {currentStep === 5 ? 'YOUR DETAILS' : 'YOUR QUOTE SO FAR'}
        </h3>

        <div className="space-y-3">
          {/* Step 1: Where */}
          <div
            className={`p-3.5 rounded-xl transition-all border ${
              currentStep === 1
                ? 'border-[#00c0f3] bg-[#f0f9ff]/50 ring-2 ring-[#00c0f3]/20'
                : 'border-slate-100 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {currentStep > 1 && originPostcode ? (
                  <div className="w-5 h-5 rounded-full bg-[#00c0f3] flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === 1 ? 'bg-[#00c0f3] text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    1
                  </div>
                )}
                <span className={`text-sm font-semibold ${currentStep === 1 ? 'text-[#0b2942]' : 'text-slate-700'}`}>
                  Where
                </span>
              </div>
              {currentStep > 1 && originPostcode && (
                <button
                  onClick={() => onJumpToStep(1)}
                  aria-label="Edit location"
                  className="text-slate-400 hover:text-[#00c0f3] transition-colors p-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {currentStep > 1 && originPostcode && (
              <div className="mt-1.5 ml-7.5 space-y-1">
                {(serviceType === 'moving' || serviceType === 'moving_storage') ? (
                  <>
                    <div className="text-xs text-slate-700 font-medium flex items-baseline gap-1.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">From:</span>
                      <span>{originPostcode.suburb}, {originPostcode.state} {originPostcode.postcode}</span>
                    </div>

                    <div className="text-xs font-medium pt-0.5">
                      {destinationPostcode ? (
                        <div className="space-y-0.5">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#00c0f3]">Moving to:</span>
                            <span className="font-bold text-[#0b2942]">
                              {destinationPostcode.suburb}, {destinationPostcode.state} {destinationPostcode.postcode}
                            </span>
                          </div>
                          {movingDistanceKm !== undefined && movingDistanceKm !== null && (
                            <div className="text-[11px] text-slate-500 font-medium pl-0.5 space-y-0.5">
                              <div>
                                Distance: <span className="font-mono font-bold text-[#00c0f3]">{movingDistanceKm} km</span> <span className="text-slate-400">(road driving)</span>
                              </div>
                              {movingKmCharge !== undefined && movingKmCharge > 0 && (
                                <div className="text-[#00c0f3] font-bold text-[10px]">
                                  +${movingKmCharge} extra delivery charge {containerCount > 1 ? `(${containerCount} containers)` : ''}
                                </div>
                              )}
                              {fuelSurchargeAmount !== undefined && fuelSurchargeAmount > 0 && (
                                <div className="text-[#00c0f3] font-bold text-[10px]">
                                  +${fuelSurchargeAmount} fuel surcharge ($0.50/km)
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500">Moving to:</span>
                          <span>Select in Step 2</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-slate-600 font-medium">
                    {originPostcode.suburb}, {originPostcode.state} {originPostcode.postcode}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Step 2: What do you need */}
          <div
            className={`p-3.5 rounded-xl transition-all border ${
              currentStep === 2
                ? 'border-[#00c0f3] bg-[#f0f9ff]/50 ring-2 ring-[#00c0f3]/20'
                : 'border-slate-100 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {currentStep > 2 ? (
                  <div className="w-5 h-5 rounded-full bg-[#00c0f3] flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === 2 ? 'bg-[#00c0f3] text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    2
                  </div>
                )}
                <span className={`text-sm font-semibold ${currentStep === 2 ? 'text-[#0b2942]' : 'text-slate-700'}`}>
                  What do you need
                </span>
              </div>
              {currentStep > 2 && (
                <button
                  onClick={() => onJumpToStep(2)}
                  aria-label="Edit service type"
                  className="text-slate-400 hover:text-[#00c0f3] transition-colors p-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {currentStep > 2 && (
              <p className="mt-1 ml-7.5 text-xs text-slate-600 font-medium">{getServiceLabel()}</p>
            )}
          </div>

          {/* Step 3: Which size */}
          <div
            className={`p-3.5 rounded-xl transition-all border ${
              currentStep === 3
                ? 'border-[#00c0f3] bg-[#f0f9ff]/50 ring-2 ring-[#00c0f3]/20'
                : 'border-slate-100 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {currentStep > 3 ? (
                  <div className="w-5 h-5 rounded-full bg-[#00c0f3] flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === 3 ? 'bg-[#00c0f3] text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    3
                  </div>
                )}
                <span className={`text-sm font-semibold ${currentStep === 3 ? 'text-[#0b2942]' : 'text-slate-700'}`}>
                  Which size
                </span>
              </div>
              {currentStep > 3 && (
                <button
                  onClick={() => onJumpToStep(3)}
                  aria-label="Edit container size"
                  className="text-slate-400 hover:text-[#00c0f3] transition-colors p-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {currentStep > 3 && (
              <p className="mt-1 ml-7.5 text-xs text-slate-600 font-medium">{getSizeLabel()}</p>
            )}
          </div>

          {/* Step 4: How long and when */}
          <div
            className={`p-3.5 rounded-xl transition-all border ${
              currentStep === 4
                ? 'border-[#00c0f3] bg-[#f0f9ff]/50 ring-2 ring-[#00c0f3]/20'
                : 'border-slate-100 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {currentStep > 4 ? (
                  <div className="w-5 h-5 rounded-full bg-[#00c0f3] flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                ) : (
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      currentStep === 4 ? 'bg-[#00c0f3] text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    4
                  </div>
                )}
                <span className={`text-sm font-semibold ${currentStep === 4 ? 'text-[#0b2942]' : 'text-slate-700'}`}>
                  How long and when
                </span>
              </div>
              {currentStep > 4 && (
                <button
                  onClick={() => onJumpToStep(4)}
                  aria-label="Edit duration and date"
                  className="text-slate-400 hover:text-[#00c0f3] transition-colors p-1"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {currentStep > 4 && (
              <div className="mt-1 ml-7.5 space-y-0.5">
                <p className="text-xs text-slate-600 font-medium">{getDurationLabel()}</p>
                {selectedSlot && (
                  <p className="text-[11px] text-[#0b2942] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00c0f3]" />
                    <span>Slot: {selectedSlot.label} ({selectedSlot.timeRange})</span>
                  </p>
                )}
                {(boxesCount > 0 || blanketsCount > 0) && (
                  <p className="text-[11px] text-[#00c0f3] font-bold">
                    Supplies: {[boxesCount > 0 ? `${boxesCount} boxes` : null, blanketsCount > 0 ? `${blanketsCount} blankets` : null].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Step 5: Send Quote */}
          <div
            className={`p-3.5 rounded-xl transition-all border ${
              currentStep === 5
                ? 'border-[#00c0f3] bg-[#f0f9ff]/50 ring-2 ring-[#00c0f3]/20'
                : 'border-slate-100 bg-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {currentStep > 5 ? (
                <div className="w-5 h-5 rounded-full bg-[#00c0f3] flex items-center justify-center text-white">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    currentStep === 5 ? 'bg-[#00c0f3] text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  5
                </div>
              )}
              <span className={`text-sm font-semibold ${currentStep === 5 ? 'text-[#0b2942]' : 'text-slate-600'}`}>
                Send quote
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Price Match Guarantee Card with Check Out Competitors Prices - Consistent with Page 6 */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-[#0b2942] text-white px-2 py-0.5 rounded-full">
            PRICE MATCH GUARANTEE
          </span>
          <h4 className="text-base font-extrabold text-[#0b2942] mt-1.5">
            Seen it cheaper? We'll beat it.
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Provide any comparable written quote from another Australian container service and we guarantee a lower rate.
          </p>
        </div>

        {/* Check out our competitors prices container */}
        <details className="group border border-slate-200 rounded-xl bg-white p-3.5 transition-all">
          <summary className="flex items-center justify-between cursor-pointer list-none select-none text-xs font-bold text-[#0b2942] hover:text-[#00c0f3] transition-colors">
            <span className="flex items-center gap-2 text-[#00c0f3]">
              <TrendingDown className="w-4 h-4 shrink-0" />
              <span className="text-[#0b2942] font-black">Check out our competitors prices</span>
            </span>
            <ChevronDown className="w-4 h-4 text-[#00c0f3] group-open:rotate-180 transition-transform shrink-0" />
          </summary>

          <div className="pt-3 mt-3 border-t border-slate-100 space-y-3 text-xs">
            <p className="text-slate-600 leading-relaxed text-xs">
              Portable storage in Australia is frequently in smaller 7 m³ to 10 m³ containers with significantly higher rates per cubic meter. Portabox provides full-size container capacity with substantially lower cost per cubic meter.
            </p>

            <div className="grid grid-cols-1 gap-2.5 pt-1">
              {/* 1. Monthly Storage Rate Comparison */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  1. Monthly Storage Rate ({totalVolumeM3} m³)
                </span>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-600">Smaller containers ($15.20/m³):</span>
                  <span className="font-mono font-bold text-slate-700">${marketMonthlyCost}/mo</span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-900 font-semibold">Portabox (${portaboxRatePerM3}/m³):</span>
                  <span className="font-mono font-bold text-[#00c0f3]">${estimatedMonthlyStorage}/mo</span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 text-[11px] text-emerald-700 font-bold">
                  ✓ Save ${monthlyCubicSavings}/mo on storage ({cubicSavingsPercent}% lower rate)
                </div>
              </div>

              {/* 2. Excess Delivery Charges for Multiple Smaller Containers */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  2. Excess Container Delivery Fees
                </span>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-600">{competitorSmallContainersCount} smaller containers needed:</span>
                  <span className="font-mono font-bold text-slate-700">${competitorDeliveryCost}</span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-900 font-semibold">{containerCount} Portabox container{containerCount > 1 ? 's' : ''}:</span>
                  <span className="font-mono font-bold text-[#00c0f3]">${portaboxDeliveryCost}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 text-[11px] text-emerald-700 font-bold">
                  ✓ Save ${excessDeliveryCharges} in excess delivery trips avoided
                </div>
              </div>
            </div>

            {/* Combined Savings Total */}
            <div className="p-3 rounded-xl bg-emerald-500 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div>
                <span className="text-xs font-black uppercase tracking-wider block">
                  First-Month Combined Savings
                </span>
                <span className="text-[11px] text-emerald-100">
                  Storage rate saving (${monthlyCubicSavings}) + excess delivery charges avoided (${excessDeliveryCharges})
                </span>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-2xl font-black font-mono">
                  ${firstMonthTotalSavings}
                </span>
                <div className="text-[10px] text-emerald-100 font-bold">
                  Total First-Month Advantage
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 italic">
              Comparison data benchmarked: September 2026 across Adelaide, Melbourne, Sydney, and Brisbane. Includes excess delivery fees incurred by requiring multiple 7-9 m³ units instead of 1 full-size Portabox container.
            </p>
          </div>
        </details>
      </div>
    </div>
  );
};
