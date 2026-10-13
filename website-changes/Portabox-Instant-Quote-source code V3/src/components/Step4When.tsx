import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Calendar, Info, Package, Shield, Plus, Minus, Check } from 'lucide-react';
import { PostcodeRecord } from '../data/australianPostcodes';
import { AppConfig, BillingCycle, ContainerSizeId, StorageDuration, DeliverySlotWindow } from '../types/quote';
import { calculateBlanketPrice, calculateBoxPrice, getMetroHubForPostcode } from '../services/pricingEngine';
import { AreYouStuckBanner } from './AreYouStuckBanner';
import { DeliverySlotPicker } from './DeliverySlotPicker';

interface Step4WhenProps {
  originPostcode: PostcodeRecord;
  containerSize?: ContainerSizeId;
  containerCount?: number;
  storageDuration: StorageDuration;
  onSelectDuration: (dur: StorageDuration) => void;
  billingCycle: BillingCycle;
  onSelectBillingCycle: (cycle: BillingCycle) => void;
  preferredDate: string;
  onSelectDate: (date: string) => void;
  selectedSlot?: DeliverySlotWindow;
  onSelectSlot?: (slot: DeliverySlotWindow) => void;
  boxesCount: number;
  onUpdateBoxesCount: (count: number) => void;
  blanketsCount: number;
  onUpdateBlanketsCount: (count: number) => void;
  config: AppConfig;
  onContinue: () => void;
  onBack: () => void;
}

export const Step4When: React.FC<Step4WhenProps> = ({
  originPostcode,
  containerSize = 'large_25m3',
  containerCount = 1,
  storageDuration,
  onSelectDuration,
  billingCycle,
  onSelectBillingCycle,
  preferredDate,
  onSelectDate,
  selectedSlot,
  onSelectSlot,
  boxesCount,
  onUpdateBoxesCount,
  blanketsCount,
  onUpdateBlanketsCount,
  config,
  onContinue,
  onBack,
}) => {
  const metroHub = getMetroHubForPostcode(originPostcode);
  const depotCalendar = config.depotCalendars?.[metroHub];
  // Compute default date (2 business days ahead)
  const today = new Date();
  const defaultDateObj = new Date(today);
  defaultDateObj.setDate(today.getDate() + 3);
  const formattedDefault = defaultDateObj.toISOString().split('T')[0];

  const [dateInputValue, setDateInputValue] = useState(formattedDefault);

  // Duration unit: weeks or months
  const initialUnit = storageDuration.includes('week') ? 'weeks' : 'months';
  const [durationUnit, setDurationUnit] = useState<'months' | 'weeks'>(initialUnit);
  const [customDurationVal, setCustomDurationVal] = useState<number>(() => {
    if (storageDuration === '2_weeks') return 2;
    if (storageDuration === '1_to_3_months') return 3;
    if (storageDuration === '4_to_11_months') return 6;
    if (storageDuration === '12_plus_months') return 12;
    const match = storageDuration.match(/\d+/);
    return match ? parseInt(match[0], 10) : 3;
  });

  const handleDateChange = (val: string) => {
    setDateInputValue(val);
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const formatted = d.toLocaleDateString('en-AU', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      onSelectDate(formatted);
    }
  };

  const getContainerRates = () => {
    let weekly = 75;
    let monthly = 219;
    if (containerSize === 'small_10m3') {
      weekly = config.containerPrices.small_10m3.weeklyRate;
      monthly = config.containerPrices.small_10m3.monthlyRate;
    } else if (containerSize === 'medium_19m3') {
      weekly = config.containerPrices.medium_19m3.weeklyRate;
      monthly = config.containerPrices.medium_19m3.monthlyRate;
    } else if (containerSize === 'large_25m3') {
      weekly = config.containerPrices.large_25m3.weeklyRate;
      monthly = config.containerPrices.large_25m3.monthlyRate;
    } else if (containerSize === 'combo_35m3') {
      weekly = config.containerPrices.large_25m3.weeklyRate + config.containerPrices.small_10m3.weeklyRate;
      monthly = config.containerPrices.large_25m3.monthlyRate + config.containerPrices.small_10m3.monthlyRate;
    } else if (containerSize === 'two_large_50m3') {
      weekly = config.containerPrices.large_25m3.weeklyRate * 2;
      monthly = config.containerPrices.large_25m3.monthlyRate * 2;
    }
    const count = containerSize === 'combo_35m3' || containerSize === 'two_large_50m3' ? 1 : (containerCount || 1);
    return {
      weeklyRate: weekly * count,
      monthlyRate: monthly * count,
    };
  };

  const { weeklyRate, monthlyRate } = getContainerRates();

  // Weekly equivalent for monthly comparison:
  const monthlyCostOnWeeklyRate = Math.round(weeklyRate * (52 / 12));
  const monthlySavings = monthlyCostOnWeeklyRate - monthlyRate;
  const monthlySavingsPercent = Math.round((monthlySavings / monthlyCostOnWeeklyRate) * 100);

  // 3 months upfront (5% off monthly rate):
  const threeMonthsWeeklyTotal = weeklyRate * 13;
  const threeMonthsUpfrontTotal = Math.round(monthlyRate * 3 * 0.95);
  const threeMonthsSavings = threeMonthsWeeklyTotal - threeMonthsUpfrontTotal;
  const threeMonthsSavingsPercent = Math.round((threeMonthsSavings / threeMonthsWeeklyTotal) * 100);

  // 6 months upfront (10% off monthly rate):
  const sixMonthsWeeklyTotal = weeklyRate * 26;
  const sixMonthsUpfrontTotal = Math.round(monthlyRate * 6 * 0.90);
  const sixMonthsSavings = sixMonthsWeeklyTotal - sixMonthsUpfrontTotal;
  const sixMonthsSavingsPercent = Math.round((sixMonthsSavings / sixMonthsWeeklyTotal) * 100);

  // 12 months upfront (15% off monthly rate):
  const twelveMonthsWeeklyTotal = weeklyRate * 52;
  const twelveMonthsUpfrontTotal = Math.round(monthlyRate * 12 * 0.85);
  const twelveMonthsSavings = twelveMonthsWeeklyTotal - twelveMonthsUpfrontTotal;
  const twelveMonthsSavingsPercent = Math.round((twelveMonthsSavings / twelveMonthsWeeklyTotal) * 100);

  const currentBoxPrice = calculateBoxPrice(boxesCount, config.packingSupplies);
  const currentBlanketPrice = calculateBlanketPrice(blanketsCount, config.packingSupplies);

  const handleSelectMonths = (months: number) => {
    setCustomDurationVal(months);
    if (months <= 3) {
      onSelectDuration('1_to_3_months');
    } else if (months < 12) {
      onSelectDuration('4_to_11_months');
    } else {
      onSelectDuration('12_plus_months');
    }
  };

  const handleSelectWeeks = (weeks: number) => {
    setCustomDurationVal(weeks);
    if (weeks <= 2) {
      onSelectDuration('2_weeks');
    } else if (weeks <= 12) {
      onSelectDuration('1_to_3_months');
    } else if (weeks < 52) {
      onSelectDuration('4_to_11_months');
    } else {
      onSelectDuration('12_plus_months');
    }
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 lg:p-10 shadow-xs border border-slate-200/80">
      {/* Header kicker */}
      <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-[#00c0f3] font-['Cabinet_Grotesk',sans-serif] flex items-center gap-1.5">
        <span>—</span>
        <span>INSTANT QUOTE</span>
      </span>

      <h1 className="text-xl sm:text-4xl font-extrabold text-[#0b2942] tracking-tight mt-0.5 sm:mt-1 mb-3 sm:mb-6 leading-tight">
        How long, and when?
      </h1>

      {/* Section 1: Estimated storage duration (select weeks or months) */}
      <div className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div>
            <label className="block text-xs sm:text-sm font-extrabold text-[#0b2942]">
              Estimated storage duration
            </label>
          </div>

          {/* Unit Toggle: Months vs Weeks */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setDurationUnit('months');
                handleSelectMonths(customDurationVal || 3);
              }}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                durationUnit === 'months'
                  ? 'bg-[#0b2942] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Select Months
            </button>
            <button
              type="button"
              onClick={() => {
                setDurationUnit('weeks');
                handleSelectWeeks(customDurationVal || 4);
              }}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                durationUnit === 'weeks'
                  ? 'bg-[#0b2942] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Select Weeks
            </button>
          </div>
        </div>

        {/* Buttons for Months */}
        {durationUnit === 'months' && (
          <div className="space-y-2 sm:space-y-3">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2.5">
              {[
                { months: 1, label: '1 Month' },
                { months: 2, label: '2 Months' },
                { months: 3, label: '3 Months' },
                { months: 6, label: '6 Months' },
                { months: 9, label: '9 Months' },
                { months: 12, label: '12+ Months' },
              ].map((opt) => {
                const isSelected = customDurationVal === opt.months;
                return (
                  <button
                    key={opt.months}
                    type="button"
                    onClick={() => handleSelectMonths(opt.months)}
                    className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border text-center transition-all cursor-pointer font-bold text-xs sm:text-sm ${
                      isSelected
                        ? 'border-[#00c0f3] bg-sky-50 text-[#0b2942] ring-2 ring-[#00c0f3]/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div>{opt.label}</div>
                    {opt.months >= 12 && (
                      <span className="inline-block mt-0.5 bg-[#00c0f3] text-white font-extrabold text-[7.5px] sm:text-[8px] tracking-wider uppercase px-1 sm:px-1.5 py-0.2 rounded-sm">
                        Best value
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Months Stepper */}
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 text-xs">
              <span className="font-semibold text-slate-600 text-[11px] sm:text-xs">Custom duration:</span>
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-300 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleSelectMonths(Math.max(1, customDurationVal - 1))}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs sm:text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="w-16 sm:w-20 text-center font-bold text-[#0b2942] text-[11px] sm:text-xs">
                  {customDurationVal} {customDurationVal === 1 ? 'Month' : 'Months'}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectMonths(Math.min(36, customDurationVal + 1))}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs sm:text-sm cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Buttons for Weeks */}
        {durationUnit === 'weeks' && (
          <div className="space-y-2 sm:space-y-3">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2.5">
              {[
                { weeks: 1, label: '1 Week' },
                { weeks: 2, label: '2 Weeks' },
                { weeks: 3, label: '3 Weeks' },
                { weeks: 4, label: '4 Weeks' },
                { weeks: 8, label: '8 Weeks' },
                { weeks: 12, label: '12 Weeks' },
              ].map((opt) => {
                const isSelected = customDurationVal === opt.weeks;
                return (
                  <button
                    key={opt.weeks}
                    type="button"
                    onClick={() => handleSelectWeeks(opt.weeks)}
                    className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border text-center transition-all cursor-pointer font-bold text-xs sm:text-sm ${
                      isSelected
                        ? 'border-[#00c0f3] bg-sky-50 text-[#0b2942] ring-2 ring-[#00c0f3]/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <div>{opt.label}</div>
                  </button>
                );
              })}
            </div>

            {/* Custom Weeks Stepper */}
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 text-xs">
              <span className="font-semibold text-slate-600 text-[11px] sm:text-xs">Custom duration:</span>
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-300 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleSelectWeeks(Math.max(1, customDurationVal - 1))}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs sm:text-sm cursor-pointer"
                >
                  -
                </button>
                <span className="w-16 sm:w-20 text-center font-bold text-[#0b2942] text-[11px] sm:text-xs">
                  {customDurationVal} {customDurationVal === 1 ? 'Week' : 'Weeks'}
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectWeeks(Math.min(104, customDurationVal + 1))}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs sm:text-sm cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Billing Type Selection */}
      <div className="mb-4 sm:mb-8 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-sky-100 bg-sky-50/40">
        <div className="pb-2.5 sm:pb-3 mb-2.5 sm:mb-4 border-b border-sky-100">
          <label className="text-sm sm:text-base font-extrabold text-[#0b2942] block">
            Choose type of billing
          </label>
          <p className="text-[11px] sm:text-xs text-slate-500">
            Select your payment frequency and maximize your savings
          </p>
        </div>

        {/* 5 Billing Buttons */}
        <div className="space-y-2 sm:space-y-3">
          {/* 1. Weekly */}
          <button
            type="button"
            onClick={() => onSelectBillingCycle('weekly')}
            className={`w-full p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 ${
              billingCycle === 'weekly'
                ? 'border-[#00c0f3] bg-white ring-2 ring-[#00c0f3]/30 shadow-xs sm:shadow-sm'
                : 'border-slate-200 bg-white/70 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  billingCycle === 'weekly' ? 'border-[#00c0f3] bg-[#00c0f3]' : 'border-slate-300 bg-white'
                }`}
              >
                {billingCycle === 'weekly' && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white stroke-[3]" />}
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-[#0b2942]">Weekly</div>
            </div>

            <div className="flex flex-row sm:flex-col items-baseline sm:items-end justify-between sm:justify-center gap-1 pl-6 sm:pl-0">
              <div className="text-sm sm:text-base font-extrabold text-[#0b2942] font-mono">
                ${weeklyRate}<span className="text-[11px] sm:text-xs font-normal text-slate-500">/wk</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">
                Standard weekly base rate
              </span>
            </div>
          </button>

          {/* 2. Monthly */}
          <button
            type="button"
            onClick={() => onSelectBillingCycle('monthly')}
            className={`w-full p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 ${
              billingCycle === 'monthly'
                ? 'border-[#00c0f3] bg-white ring-2 ring-[#00c0f3]/30 shadow-xs sm:shadow-sm'
                : 'border-slate-200 bg-white/70 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  billingCycle === 'monthly' ? 'border-[#00c0f3] bg-[#00c0f3]' : 'border-slate-300 bg-white'
                }`}
              >
                {billingCycle === 'monthly' && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white stroke-[3]" />}
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-[#0b2942] flex items-center gap-1.5 sm:gap-2">
                <span>Monthly</span>
                <span className="text-[9px] sm:text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                  POPULAR
                </span>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col items-baseline sm:items-end justify-between sm:justify-center gap-1 pl-6 sm:pl-0">
              <div className="text-sm sm:text-base font-extrabold text-[#0b2942] font-mono">
                ${monthlyRate}<span className="text-[11px] sm:text-xs font-normal text-slate-500">/mo</span>{' '}
                <span className="text-[10px] sm:text-xs text-slate-400 font-normal">(~${Math.round(monthlyRate / 4.333)}/wk)</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50/80 px-1.5 py-0.2 rounded-md border border-emerald-200/60">
                Save ${monthlySavings}/mo vs weekly ({monthlySavingsPercent}% savings)
              </span>
            </div>
          </button>

          {/* 3. 3 months upfront then monthly */}
          <button
            type="button"
            onClick={() => onSelectBillingCycle('3_months_upfront')}
            className={`w-full p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 ${
              billingCycle === '3_months_upfront'
                ? 'border-[#00c0f3] bg-white ring-2 ring-[#00c0f3]/30 shadow-xs sm:shadow-sm'
                : 'border-slate-200 bg-white/70 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  billingCycle === '3_months_upfront' ? 'border-[#00c0f3] bg-[#00c0f3]' : 'border-slate-300 bg-white'
                }`}
              >
                {billingCycle === '3_months_upfront' && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white stroke-[3]" />}
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-[#0b2942]">
                3 months upfront then monthly
              </div>
            </div>

            <div className="flex flex-row sm:flex-col items-baseline sm:items-end justify-between sm:justify-center gap-1 pl-6 sm:pl-0">
              <div className="text-sm sm:text-base font-extrabold text-[#0b2942] font-mono">
                ${Math.round(threeMonthsUpfrontTotal / 3)}<span className="text-[11px] sm:text-xs font-normal text-slate-500">/mo equiv</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50/80 px-1.5 py-0.2 rounded-md border border-emerald-200/60">
                Save ${threeMonthsSavings} vs weekly over 3 months ({threeMonthsSavingsPercent}% savings)
              </span>
            </div>
          </button>

          {/* 4. 6 months upfront then monthly */}
          <button
            type="button"
            onClick={() => onSelectBillingCycle('6_months_upfront')}
            className={`w-full p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 ${
              billingCycle === '6_months_upfront'
                ? 'border-[#00c0f3] bg-white ring-2 ring-[#00c0f3]/30 shadow-xs sm:shadow-sm'
                : 'border-slate-200 bg-white/70 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  billingCycle === '6_months_upfront' ? 'border-[#00c0f3] bg-[#00c0f3]' : 'border-slate-300 bg-white'
                }`}
              >
                {billingCycle === '6_months_upfront' && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white stroke-[3]" />}
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-[#0b2942]">
                6 months upfront then monthly
              </div>
            </div>

            <div className="flex flex-row sm:flex-col items-baseline sm:items-end justify-between sm:justify-center gap-1 pl-6 sm:pl-0">
              <div className="text-sm sm:text-base font-extrabold text-[#0b2942] font-mono">
                ${Math.round(sixMonthsUpfrontTotal / 6)}<span className="text-[11px] sm:text-xs font-normal text-slate-500">/mo equiv</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50/80 px-1.5 py-0.2 rounded-md border border-emerald-200/60">
                Save ${sixMonthsSavings} vs weekly over 6 months ({sixMonthsSavingsPercent}% savings)
              </span>
            </div>
          </button>

          {/* 5. 12 months upfront then monthly */}
          <button
            type="button"
            onClick={() => onSelectBillingCycle('12_months_upfront')}
            className={`w-full p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3 ${
              billingCycle === '12_months_upfront'
                ? 'border-[#00c0f3] bg-white ring-2 ring-[#00c0f3]/30 shadow-xs sm:shadow-sm'
                : 'border-slate-200 bg-white/70 hover:bg-white'
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  billingCycle === '12_months_upfront' ? 'border-[#00c0f3] bg-[#00c0f3]' : 'border-slate-300 bg-white'
                }`}
              >
                {billingCycle === '12_months_upfront' && <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white stroke-[3]" />}
              </div>
              <div className="text-xs sm:text-sm font-extrabold text-[#0b2942] flex items-center gap-1.5 sm:gap-2">
                <span>12 months upfront</span>
                <span className="text-[9px] sm:text-[10px] font-extrabold text-white bg-[#00c0f3] px-1.5 py-0.2 rounded-full">
                  MAX SAVINGS
                </span>
              </div>
            </div>

            <div className="flex flex-row sm:flex-col items-baseline sm:items-end justify-between sm:justify-center gap-1 pl-6 sm:pl-0">
              <div className="text-sm sm:text-base font-extrabold text-[#0b2942] font-mono">
                ${Math.round(twelveMonthsUpfrontTotal / 12)}<span className="text-[11px] sm:text-xs font-normal text-slate-500">/mo equiv</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50/80 px-1.5 py-0.2 rounded-md border border-emerald-200/60">
                Save ${twelveMonthsSavings} vs weekly over 12 months ({twelveMonthsSavingsPercent}% savings)
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Section 3: Schedule Your Container Flow */}
      <div className="mb-4 sm:mb-8 p-3.5 sm:p-6 rounded-2xl sm:rounded-3xl bg-slate-50/70 border border-slate-200/90 space-y-3.5 sm:space-y-6">
        <div>
          <h3 className="text-base sm:text-2xl font-black text-[#0b2942] tracking-tight">
            Schedule your container
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1">
            Easy and simple booking in two quick steps:
          </p>
        </div>

        {/* Step 1: Pick a date */}
        <div className="space-y-1.5 sm:space-y-2">
          <label className="block text-xs sm:text-sm font-black text-[#0b2942] uppercase tracking-wider flex items-center gap-2">
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#00c0f3] text-white text-[10px] sm:text-xs flex items-center justify-center font-bold">1</span>
            <span>Pick a date</span>
          </label>

          <div className="max-w-xs">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none text-[#00c0f3]">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <input
                type="date"
                value={dateInputValue}
                min={formattedDefault}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full pl-9 pr-3 sm:pl-11 sm:pr-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border-2 border-slate-200 focus:border-[#00c0f3] focus:ring-4 focus:ring-[#00c0f3]/20 bg-white text-xs sm:text-sm font-bold text-[#0b2942] transition-all shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Pick a delivery time window */}
        <div className="space-y-1.5 sm:space-y-2 pt-2 border-t border-slate-200/70">
          <label className="block text-xs sm:text-sm font-black text-[#0b2942] uppercase tracking-wider flex items-center gap-2">
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#00c0f3] text-white text-[10px] sm:text-xs flex items-center justify-center font-bold">2</span>
            <span>Pick a delivery time window</span>
          </label>

          {/* Google Calendar Delivery Window Slot Picker */}
          <DeliverySlotPicker
            metroHub={metroHub}
            preferredDate={preferredDate}
            selectedSlot={selectedSlot}
            onSelectSlot={(slot) => {
              if (onSelectSlot) onSelectSlot(slot);
            }}
            depotCalendarConfig={depotCalendar}
          />
        </div>
      </div>

      {/* Section 4: Add Packing Boxes & Blanket Rentals */}
      <div className="mb-4 sm:mb-8 pt-3 sm:pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2.5 sm:mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-[#0b2942] flex items-center gap-2">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-[#00c0f3]" />
              <span>Packing Supplies & Blanket Rentals</span>
            </h3>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
              Delivered inside your container ready to pack.
            </p>
          </div>
          {(boxesCount > 0 || blanketsCount > 0) && (
            <div className="text-right">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 block">Supplies Total</span>
              <span className="text-sm sm:text-base font-extrabold text-[#00c0f3] font-mono">
                +${currentBoxPrice + currentBlanketPrice}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
          {/* Heavy Duty Moving Boxes */}
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-extrabold text-xs sm:text-sm text-[#0b2942]">Moving Boxes</h4>
                <p className="text-[10px] sm:text-[11px] text-slate-500">
                  Double-walled heavy duty cartons
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs sm:text-sm font-extrabold text-[#0b2942] font-mono">
                  ${currentBoxPrice}
                </span>
                <span className="block text-[9px] sm:text-[10px] text-slate-400">
                  {boxesCount} ordered
                </span>
              </div>
            </div>

            {/* Pricing Matrix Banner */}
            <div className="mt-2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white border border-slate-200/80 text-[10px] sm:text-[11px] text-slate-600 flex items-center justify-between">
              <span>$2.50 ea</span>
              <span>·</span>
              <span className="font-bold text-[#0b2942]">10 for $20</span>
              <span>·</span>
              <span className="font-bold text-[#0b2942]">50 for $40</span>
              <span>·</span>
              <span className="font-bold text-[#00c0f3]">100 for $70</span>
            </div>

            {/* Quick Bundle Selector */}
            <div className="grid grid-cols-4 gap-1.5 mt-2 sm:mt-3">
              {[0, 10, 50, 100].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => onUpdateBoxesCount(qty)}
                  className={`py-1 sm:py-1.5 px-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold border transition-all cursor-pointer text-center ${
                    boxesCount === qty
                      ? 'bg-[#00c0f3] text-white border-[#00c0f3] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {qty === 0 ? 'None' : `${qty} pk`}
                </button>
              ))}
            </div>

            {/* Stepper for custom quantity */}
            <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-200/60 text-xs">
              <span className="font-semibold text-slate-600 text-[11px] sm:text-xs">Custom count:</span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateBoxesCount(Math.max(0, boxesCount - 5))}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={boxesCount}
                  onChange={(e) => onUpdateBoxesCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-10 sm:w-12 text-center py-0.5 sm:py-1 rounded-lg border border-slate-200 font-mono font-bold text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={() => onUpdateBoxesCount(boxesCount + 5)}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Furniture Blankets Rental */}
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-extrabold text-xs sm:text-sm text-[#0b2942]">Blanket Rental</h4>
                <p className="text-[10px] sm:text-[11px] text-slate-500">
                  Thick quilted furniture padding
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs sm:text-sm font-extrabold text-[#0b2942] font-mono">
                  ${currentBlanketPrice}
                </span>
                <span className="block text-[9px] sm:text-[10px] text-slate-400">
                  {blanketsCount} blankets
                </span>
              </div>
            </div>

            {/* Pricing Matrix Banner */}
            <div className="mt-2 p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white border border-slate-200/80 text-[10px] sm:text-[11px] text-slate-600 flex items-center justify-between">
              <span>$2.00 ea</span>
              <span>·</span>
              <span className="font-bold text-[#0b2942]">10 for $20</span>
              <span>·</span>
              <span className="font-bold text-[#0b2942]">50 for $40</span>
              <span>·</span>
              <span className="font-bold text-[#00c0f3]">100 for $70</span>
            </div>

            {/* Quick Bundle Selector */}
            <div className="grid grid-cols-4 gap-1.5 mt-2 sm:mt-3">
              {[0, 10, 50, 100].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => onUpdateBlanketsCount(qty)}
                  className={`py-1 sm:py-1.5 px-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold border transition-all cursor-pointer text-center ${
                    blanketsCount === qty
                      ? 'bg-[#00c0f3] text-white border-[#00c0f3] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {qty === 0 ? 'None' : `${qty} pk`}
                </button>
              ))}
            </div>

            {/* Stepper for custom quantity */}
            <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-200/60 text-xs">
              <span className="font-semibold text-slate-600 text-[11px] sm:text-xs">Custom count:</span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateBlanketsCount(Math.max(0, blanketsCount - 5))}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={blanketsCount}
                  onChange={(e) => onUpdateBlanketsCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-10 sm:w-12 text-center py-0.5 sm:py-1 rounded-lg border border-slate-200 font-mono font-bold text-xs bg-white"
                />
                <button
                  type="button"
                  onClick={() => onUpdateBlanketsCount(blanketsCount + 5)}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Are You Stuck Banner */}
      <div className="mt-4 sm:mt-8">
        <AreYouStuckBanner />
      </div>

      {/* Navigation Buttons */}
      <div className="mt-4 sm:mt-8 flex items-center justify-between pt-3 sm:pt-6 border-t border-slate-100">
        <button
          onClick={onBack}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Previous</span>
        </button>

        <button
          onClick={onContinue}
          className="px-7 sm:px-9 py-2.5 sm:py-3.5 bg-[#ffd000] hover:bg-[#ffdc26] active:bg-[#eab308] text-[#0f3353] font-black rounded-xl sm:rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98 text-sm sm:text-base border-2 border-amber-300 shrink-0"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
