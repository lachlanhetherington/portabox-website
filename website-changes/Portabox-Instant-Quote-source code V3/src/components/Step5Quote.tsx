import React, { useState, useEffect } from 'react';
import { RotateCcw, Check, Tag, Phone, TrendingDown, ChevronDown, Sparkles, Calendar, Clock, ExternalLink, AlertCircle, CalendarCheck } from 'lucide-react';
import { PORTABOX_IMAGES } from '../assets/images';
import { QuoteBreakdown } from '../types/quote';
import { AreYouStuckBanner } from './AreYouStuckBanner';
import {
  scheduleDeliveryOnGoogleCalendar,
  signInWithGoogleCalendar,
  getCalendarAccessToken,
  STANDARD_DELIVERY_SLOTS,
} from '../services/googleCalendarService';
import { getMetroHubForPostcode } from '../services/pricingEngine';
import { BraintreePaymentSection } from './BraintreePaymentSection';
import { BraintreePaymentResult } from '../services/braintreeService';
import { DeliverySlotWindow, DepotCalendarConfig } from '../types/quote';

interface Step5QuoteProps {
  quote: QuoteBreakdown;
  customerData?: {
    firstName: string;
    mobile: string;
    email: string;
  };
  onResetQuote: () => void;
  onApplyPromoCode: (code: string) => void;
  onUpdateBoxesCount?: (count: number) => void;
  onUpdateBlanketsCount?: (count: number) => void;
  onSelectSlot?: (slot: DeliverySlotWindow) => void;
  depotCalendarConfig?: DepotCalendarConfig;
  onPaymentSuccess?: (result: BraintreePaymentResult) => void;
  phone?: string;
}

export const Step5Quote: React.FC<Step5QuoteProps> = ({
  quote,
  customerData,
  onResetQuote,
  onApplyPromoCode,
  onUpdateBoxesCount,
  onUpdateBlanketsCount,
  onSelectSlot,
  depotCalendarConfig,
  onPaymentSuccess,
  phone = '1800 467 637',
}) => {
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoFeedback, setPromoFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hasPaid, setHasPaid] = useState(false);
  const [isBooked, setIsBooked] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isSchedulingCalendar, setIsSchedulingCalendar] = useState(false);
  const [calendarEventLink, setCalendarEventLink] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  const hub = getMetroHubForPostcode(quote.originPostcode);
  const effectiveSlot = quote.selectedSlot || {
    ...STANDARD_DELIVERY_SLOTS[0],
    available: true,
    slotsRemaining: 2,
  };

  // Watch for applied promo code changes to notify the user
  useEffect(() => {
    if (quote.appliedPromoCode) {
      if (quote.totalDiscount > 0) {
        const promoDesc = quote.appliedPromotions?.[0]?.description || `$${quote.totalDiscount} discount`;
        setPromoFeedback({
          type: 'success',
          message: `✓ Promo code "${quote.appliedPromoCode}" applied! ${promoDesc}. Your first payment has been adjusted to $${quote.firstPaymentTotal}.`,
        });
      } else {
        setPromoFeedback({
          type: 'error',
          message: `Coupon code "${quote.appliedPromoCode}" is invalid, expired, or not applicable to this quote.`,
        });
      }
    }
  }, [quote.appliedPromoCode, quote.totalDiscount, quote.firstPaymentTotal, quote.appliedPromotions]);

  const handleInitiateCalendarBooking = async () => {
    const token = getCalendarAccessToken();
    if (!token) {
      try {
        await signInWithGoogleCalendar();
      } catch (err: any) {
        setCalendarError('Please connect your Google account to add the drop-off to your calendar.');
        return;
      }
    }
    // Open explicit user confirmation dialog
    setIsCalendarModalOpen(true);
  };

  const handleConfirmCalendarBooking = async () => {
    setIsSchedulingCalendar(true);
    setCalendarError(null);
    try {
      const result = await scheduleDeliveryOnGoogleCalendar({
        customerName: customerData?.firstName || 'Valued Customer',
        customerEmail: customerData?.email || 'customer@portabox.com.au',
        customerPhone: customerData?.mobile || '0412 345 678',
        deliveryDateStr: quote.preferredDate,
        slot: effectiveSlot,
        metroHub: hub,
        suburb: quote.originPostcode.suburb,
        state: quote.originPostcode.state,
        postcode: quote.originPostcode.postcode,
        containerName: quote.containerName,
        containerCount: quote.containerCount,
        serviceType: quote.serviceType,
        storageDuration: quote.storageDuration,
        firstPaymentTotal: quote.firstPaymentTotal,
      });

      if (result.success && result.eventLink) {
        setCalendarEventLink(result.eventLink);
        setIsBooked(true);
        setIsCalendarModalOpen(false);
      } else {
        setCalendarError(result.error || 'Failed to create calendar event.');
      }
    } catch (err: any) {
      setCalendarError(err.message || 'Error communicating with Google Calendar.');
    } finally {
      setIsSchedulingCalendar(false);
    }
  };

  const handleApplyPromo = () => {
    const code = promoCodeInput.trim().toUpperCase();
    if (!code) {
      setPromoFeedback({ type: 'error', message: 'Please enter a promo code.' });
      return;
    }
    setPromoFeedback(null);
    onApplyPromoCode(code);
  };

  const getImageForSize = () => {
    if (quote.containerSize === 'small_10m3') return PORTABOX_IMAGES.smallContainer;
    if (quote.containerSize === 'medium_19m3') return PORTABOX_IMAGES.mediumContainer;
    return PORTABOX_IMAGES.largeContainer;
  };

  const getContainerSizeLabel = () => {
    switch (quote.containerSize) {
      case 'small_10m3':
        return 'SMALL · 10 M³';
      case 'medium_19m3':
        return 'MEDIUM · 19 M³';
      case 'combo_35m3':
        return 'COMBO · 35 M³';
      case 'two_large_50m3':
        return '2 X LARGE · 50 M³';
      case 'large_25m3':
      default:
        return 'LARGE · 25 M³';
    }
  };

  const getBillingPeriodDescription = () => {
    switch (quote.billingCycle) {
      case 'weekly':
        return 'first week storage';
      case '3_months_upfront':
        return 'first 3 months upfront storage';
      case '6_months_upfront':
        return 'first 6 months upfront storage';
      case '12_months_upfront':
        return 'first 12 months upfront storage';
      case 'monthly':
      default:
        return 'first month storage';
    }
  };

  // 1. Calculate Cubic Meter Volume & Savings Benchmarked against portable storage market:
  const containerM3 = quote.containerSize === 'small_10m3' ? 10 : quote.containerSize === 'medium_19m3' ? 19 : quote.containerSize === 'combo_35m3' ? 35 : 25;
  const totalVolumeM3 = containerM3 * quote.containerCount;
  const industryBenchmarkRatePerM3 = 15.20; // Standard Australian portable storage modular rate per m3
  const portaboxRatePerM3 = Math.round((quote.monthlyStorageFee / totalVolumeM3) * 100) / 100;
  const marketMonthlyCost = Math.round(totalVolumeM3 * industryBenchmarkRatePerM3);
  const monthlyCubicSavings = Math.max(0, marketMonthlyCost - quote.monthlyStorageFee);
  const cubicSavingsPercent = Math.round((monthlyCubicSavings / marketMonthlyCost) * 100);

  // Competitor Excess Delivery Charges calculation:
  // Standard smaller portable containers in Australia are 7 m³ to 9 m³ (average ~8 m³ usable capacity).
  const competitorSmallContainersCount = Math.max(quote.containerCount + 1, Math.ceil(totalVolumeM3 / 8));
  const deliveryFeePerUnit = quote.domesticLegFeePerContainer || 149;
  const competitorDeliveryCost = competitorSmallContainersCount * deliveryFeePerUnit;
  const portaboxDeliveryCost = quote.initialDeliveryFee;
  const excessDeliveryCharges = Math.max(0, competitorDeliveryCost - portaboxDeliveryCost);
  const firstMonthTotalSavings = monthlyCubicSavings + excessDeliveryCharges;

  // 2. Billing cycle upfront savings:
  let billingUpfrontSavings = 0;
  if (quote.billingCycle === 'monthly') {
    billingUpfrontSavings = Math.round(quote.weeklyStorageFee * (52 / 12)) - quote.monthlyStorageFee;
  } else if (quote.billingCycle === '3_months_upfront') {
    billingUpfrontSavings = (quote.weeklyStorageFee * 13) - quote.currentPeriodicStorageFee;
  } else if (quote.billingCycle === '6_months_upfront') {
    billingUpfrontSavings = (quote.weeklyStorageFee * 26) - quote.currentPeriodicStorageFee;
  } else if (quote.billingCycle === '12_months_upfront') {
    billingUpfrontSavings = (quote.weeklyStorageFee * 52) - quote.currentPeriodicStorageFee;
  }

  // 3. Total Combined Savings (Includes storage savings, excess delivery avoided, and any promo code discount):
  const totalSavedDisplay = (billingUpfrontSavings > 0 ? billingUpfrontSavings : monthlyCubicSavings) + excessDeliveryCharges + (quote.totalDiscount || 0);

  return (
    <div className="final-quote-container bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 lg:p-10 shadow-xs border border-slate-200/80 animate-in fade-in duration-200">
      {/* Top action row */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-[#00c0f3] font-['Cabinet_Grotesk',sans-serif] flex items-center gap-1.5">
          <span>—</span>
          <span>YOUR INSTANT QUOTE</span>
        </span>
        <button
          onClick={onResetQuote}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>New Quote</span>
        </button>
      </div>

      <h1 className="text-xl sm:text-4xl font-extrabold text-[#0b2942] tracking-tight mt-0.5 sm:mt-1 mb-1 leading-tight">
        Here's your instant quote
      </h1>

      {customerData && (
        <p className="text-xs text-slate-500 mb-3 sm:mb-4">
          Quote sent to <strong className="text-slate-800">{customerData.email}</strong> and <strong className="text-slate-800">{customerData.mobile}</strong>
        </p>
      )}

      {/* Hero Payment Banner with Total Saved */}
      <div className="mt-3 sm:mt-4 rounded-2xl sm:rounded-3xl bg-[#00c0f3] text-white p-4 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-5">
        <div>
          <p className="text-xs sm:text-sm font-bold text-sky-100 uppercase tracking-wider">
            Your first payment
          </p>
          <p className="text-xs text-sky-100/90 mt-0.5 max-w-md leading-relaxed">
            Includes initial empty container delivery {quote.containerCount > 1 ? `($${quote.domesticLegFeePerContainer}/container × ${quote.containerCount} = $${quote.initialDeliveryFee})` : `($${quote.initialDeliveryFee})`} + {getBillingPeriodDescription()} {quote.containerCount > 1 ? `($${quote.billingCycle === 'weekly' ? quote.weeklyRatePerContainer : quote.monthlyRatePerContainer}/container × ${quote.containerCount} = $${quote.currentPeriodicStorageFee})` : `($${quote.currentPeriodicStorageFee})`}{quote.packingSupplies.totalSuppliesPrice > 0 ? ` + packing supplies ($${quote.packingSupplies.totalSuppliesPrice})` : ''}
            {quote.totalDiscount > 0 ? ` - promo discount (-$${quote.totalDiscount})` : ''}
          </p>
        </div>
        <div className="text-left sm:text-right shrink-0">
          <div className="flex items-baseline sm:justify-end gap-2.5">
            {quote.totalDiscount > 0 && (
              <span className="text-2xl sm:text-3xl font-extrabold line-through text-sky-200 font-mono">
                ${quote.firstPaymentTotal + quote.totalDiscount}
              </span>
            )}
            <div className="text-3xl sm:text-5xl font-extrabold tracking-tight font-mono">
              ${quote.firstPaymentTotal}
            </div>
          </div>
          <div className="mt-1 flex items-center sm:justify-end gap-1.5 flex-wrap">
            <span className="text-xs text-sky-100 font-medium">
              GST included · All billing in advance
            </span>
            {quote.totalDiscount > 0 && (
              <span className="bg-emerald-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                -${quote.totalDiscount} PROMO APPLIED
              </span>
            )}
            {totalSavedDisplay > 0 && (
              <span className="bg-emerald-300 text-slate-950 font-black text-[11px] px-2.5 py-0.5 rounded-full shadow-2xs">
                TOTAL SAVED: ${totalSavedDisplay}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Eco-Route Carbon Reduction & Horizontal Level-Lift Banner */}
      {quote.ecoEmissionsInfo?.isBestValue && (
        <div className="mt-4 p-4.5 rounded-2xl bg-emerald-50/90 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-sm">
              🌱
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-950">
                  Eco-Optimized Delivery Window
                </span>
                <span className="text-[10px] font-bold bg-white text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  {quote.ecoEmissionsInfo.co2SavedKg} kg CO₂ Emissions Prevented
                </span>
                {quote.ecoEmissionsInfo.incentiveMode === 'dollar_discount' && quote.ecoEmissionsInfo.discountAud > 0 && (
                  <span className="text-[10px] font-black bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                    ${quote.ecoEmissionsInfo.discountAud} Discount Applied ({quote.ecoEmissionsInfo.discountPercent}% Savings)
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-900 mt-1 leading-relaxed">
                Your delivery clusters with local fleet routes, cutting ~26 km in redundant truck transit.
                <span className="font-semibold block sm:inline sm:ml-1 text-emerald-950">
                  Portabox uses advanced horizontal level-lift trucks — keeping your container 100% flat with zero tilting.
                </span>
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <div className="text-2xl font-black text-emerald-800 font-mono">
              -{quote.ecoEmissionsInfo.co2SavedKg} kg
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
              Carbon Avoided
            </span>
          </div>
        </div>
      )}

      {/* Quote Breakdown Items */}
      <div className="mt-6 divide-y divide-slate-100 border border-slate-200/80 rounded-2xl p-5 bg-slate-50/40 space-y-4">
        {/* Container & Storage Row */}
        <div className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-12 rounded-xl overflow-hidden bg-slate-200 shrink-0">
              <img
                src={getImageForSize()}
                alt="Portabox unit"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                {quote.containerCount > 1 ? `${quote.containerCount} X ${getContainerSizeLabel()}` : `1 X ${getContainerSizeLabel()}`}
              </p>
              <h3 className="text-base font-extrabold text-[#0b2942]">
                {quote.serviceType === 'storage_at_place'
                  ? 'Storage at your place'
                  : quote.serviceType === 'storage_facility'
                  ? 'Storage at Portabox facility'
                  : quote.serviceType === 'moving'
                  ? `Moving to ${quote.destinationPostcode?.suburb || 'Destination'}`
                  : `Moving and storage to ${quote.destinationPostcode?.suburb || 'Destination'}`}
              </h3>
              <p className="text-xs text-slate-500">
                {quote.storageDuration.replace(/_/g, ' ')} · Rate locked for 12 months
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:items-end text-left sm:text-right gap-1">
            <div className="text-xl font-extrabold text-[#0b2942] font-mono">
              {quote.billingCycle === 'weekly' ? `$${quote.weeklyStorageFee}` : `$${quote.monthlyStorageFee}`}
            </div>
            <div className="text-xs text-slate-500">
              {quote.billingCycleLabel || (quote.billingCycle === 'weekly' ? 'Weekly billing' : 'Monthly billing')}
            </div>
            {quote.billingCycleSavingsText && quote.billingCycle !== 'weekly' && (
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 self-start sm:self-auto">
                {quote.billingCycleSavingsText}
              </span>
            )}
            {quote.containerCount > 1 && (
              <div className="text-[11px] font-bold text-[#00c0f3] bg-sky-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                {quote.storagePricingText}
              </div>
            )}
          </div>
        </div>

        {/* Extra KM Charge Callout if applicable */}
        {quote.movingKmCharge !== undefined && quote.movingKmCharge > 0 && (
          <div className="pt-3 pb-2">
            <div className="p-3.5 bg-sky-50/80 border border-sky-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00c0f3] shrink-0" />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-[#0b2942]">
                      Extra km delivery charge to {quote.destinationPostcode?.suburb || 'Destination'}:
                    </span>
                    <span className="text-[10px] font-bold bg-white text-[#00c0f3] px-2 py-0.5 rounded border border-sky-200">
                      Road driving distance
                    </span>
                  </div>
                  <div className="text-slate-600 mt-1">
                    <span>
                      {quote.movingDistanceKm} km road driving route · Zone {quote.movingDeliveryZone} rate (${quote.kmRatePerKm?.toFixed(2) || '2.00'}/km)
                    </span>
                    {quote.containerCount > 1 && (
                      <span className="font-bold text-[#00c0f3] ml-1.5">
                        (${quote.movingKmRatePerContainer || Math.round(quote.movingKmCharge / quote.containerCount)}/container × {quote.containerCount} containers)
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono font-extrabold text-[#0b2942] text-sm">
                  +${quote.movingKmCharge}
                </div>
                {quote.containerCount > 1 && (
                  <div className="text-[10px] text-slate-500 font-medium">
                    ${quote.movingKmRatePerContainer || Math.round(quote.movingKmCharge / quote.containerCount)} per container
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Fuel Surcharge Line Item (Set by Portabox admin, Blue Lettering, Non-Optional) */}
        {quote.isFuelSurchargeIncluded && quote.fuelSurchargeAmount > 0 && (
          <div className="pt-3 pb-2">
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                    <h4 className="text-xs font-extrabold text-blue-700">
                      Fuel Surcharge (${quote.fuelSurchargeRatePerKm?.toFixed(2) || '0.50'} / km travelled)
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-100 border-blue-300 text-blue-800">
                      Standard Transport Inclusion (Set by Portabox Admin)
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-700">
                    Calculated on road driving distance ({quote.movingDistanceKm || quote.originDistanceKm} km) at ${quote.fuelSurchargeRatePerKm?.toFixed(2) || '0.50'}/km:
                    {' '}
                    <strong className="text-blue-800">
                      ${quote.fuelSurchargePerContainer?.toFixed(2) || '0.00'}/container
                    </strong>
                    {quote.containerCount > 1 && (
                      <span>
                        {' '}× {quote.containerCount} containers = <strong className="text-blue-800 font-mono">${quote.fuelSurchargeAmount?.toFixed(2) || '0.00'}</strong> total
                      </span>
                    )}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-extrabold text-base text-blue-600">
                    +${quote.fuelSurchargeAmount?.toFixed(2)}
                  </span>
                  <div className="text-[10px] text-blue-600 font-medium">
                    included in transport
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legs breakdown */}
        <div className="pt-2 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
              Transport & Delivery Legs ({quote.containerCount > 1 ? `$149 per container · $${149 * quote.containerCount} total per leg` : '$149 per one-way domestic leg'})
            </div>
            {quote.containerCount > 1 && (
              <span className="text-[10px] font-bold text-[#00c0f3] bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 w-fit">
                Per-container & total breakdown shown
              </span>
            )}
          </div>

          {quote.legs.map((leg, idx) => (
            <div key={idx} className="flex items-start sm:items-center justify-between gap-4 py-2 border-b border-slate-100 last:border-b-0">
              <div className="space-y-0.5">
                <h4 className="text-sm font-extrabold text-[#0b2942] flex flex-wrap items-center gap-2">
                  <span>{leg.label}</span>
                  {leg.isPayableNow && (
                    <span className="text-[10px] font-bold bg-sky-100 text-[#00c0f3] px-2 py-0.5 rounded-full">
                      Included in 1st payment
                    </span>
                  )}
                  {leg.feePerContainer && leg.containerCount && leg.containerCount > 1 && (
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                      ${leg.feePerContainer}/container × {leg.containerCount}
                    </span>
                  )}
                  {leg.extraKmCharge && leg.extraKmCharge > 0 && (
                    <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-md">
                      +${leg.extraKmCharge} extra km ({leg.extraKmDistanceKm} km)
                    </span>
                  )}
                </h4>
                <p className="text-xs text-slate-500">{leg.description}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-base font-extrabold text-[#0b2942] font-mono">
                  ${leg.fee}
                </span>
                <div className="text-[10px] text-slate-400 font-medium">
                  {leg.isPayableNow ? 'Payable now' : 'Payable upon collection'}
                </div>
              </div>
            </div>
          ))}

          {/* Applied Promotional Discount Row in Breakdown */}
          {quote.totalDiscount > 0 && (
            <div className="pt-3 pb-1 border-t border-emerald-200">
              <div className="p-3.5 rounded-xl border border-emerald-300 bg-emerald-50/90 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-emerald-950 text-xs sm:text-sm">
                        Promotional Discount {quote.appliedPromoCode ? `(${quote.appliedPromoCode})` : ''}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                        APPLIED
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      {quote.appliedPromotions?.[0]?.description || `$${quote.totalDiscount} discount applied to first payment`}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono font-black text-base text-emerald-700">
                    -${quote.totalDiscount}
                  </span>
                  <div className="text-[10px] text-emerald-600 font-bold">
                    Deducted at checkout
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Price Match Guarantee Card with Check Out Competitors Prices */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/60 p-5 space-y-3">
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
        <details className="group border border-slate-200 rounded-xl bg-white p-4 transition-all">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* 1. Monthly Storage Rate Comparison */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  1. Monthly Storage Rate ({totalVolumeM3} m³)
                </span>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-600">Smaller containers ($15.20/m³):</span>
                  <span className="font-mono font-bold text-slate-700">${marketMonthlyCost}/mo</span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-900 font-semibold">Portabox (${portaboxRatePerM3}/m³):</span>
                  <span className="font-mono font-bold text-[#00c0f3]">${quote.monthlyStorageFee}/mo</span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 text-[11px] text-emerald-700 font-bold">
                  ✓ Save ${monthlyCubicSavings}/mo on storage ({cubicSavingsPercent}% lower rate)
                </div>
              </div>

              {/* 2. Excess Delivery Charges for Multiple Smaller Containers */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  2. Excess Container Delivery Fees
                </span>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-600">{competitorSmallContainersCount} smaller containers needed:</span>
                  <span className="font-mono font-bold text-slate-700">${competitorDeliveryCost}</span>
                </div>
                <div className="flex justify-between items-baseline text-xs">
                  <span className="text-slate-900 font-semibold">{quote.containerCount} Portabox container{quote.containerCount > 1 ? 's' : ''}:</span>
                  <span className="font-mono font-bold text-[#00c0f3]">${portaboxDeliveryCost}</span>
                </div>
                <div className="pt-1.5 border-t border-slate-200 text-[11px] text-emerald-700 font-bold">
                  ✓ Save ${excessDeliveryCharges} in excess delivery trips avoided
                </div>
              </div>
            </div>

            {/* Combined Savings Total */}
            <div className="p-3.5 rounded-xl bg-emerald-500 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
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

      {/* Promo Code Input - Removed and NOT displayed once user has paid */}
      {!hasPaid ? (
        <div className="mt-6 space-y-2">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => {
                  setPromoCodeInput(e.target.value.toUpperCase());
                  if (promoFeedback) setPromoFeedback(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyPromo();
                  }
                }}
                placeholder="Have a promo code? (e.g. FREEDEL, HALFPRICE, SAVE50)"
                className="w-full pl-9 pr-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 uppercase bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00c0f3]"
              />
            </div>
            <button
              type="button"
              onClick={handleApplyPromo}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#0b2942] hover:bg-[#081e30] text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Apply Code
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            Note: Only one promo code can be applied at a time (entering a code will replace any slot efficiency discount).
          </p>

          {promoFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in duration-200 ${
                promoFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              <span>{promoFeedback.message}</span>
              {promoFeedback.type === 'success' && quote.totalDiscount > 0 && (
                <span className="font-mono font-black text-emerald-700 shrink-0">
                  -${quote.totalDiscount}
                </span>
              )}
            </div>
          )}
        </div>
      ) : null}

      {/* Braintree Hosted Fields & PayPal / Digital Wallets 'Pay Now' Section */}
      <BraintreePaymentSection
        amount={quote.firstPaymentTotal}
        customerName={customerData?.firstName ? `${customerData.firstName}` : undefined}
        customerEmail={customerData?.email}
        customerPhone={customerData?.mobile}
        orderDescription={`${quote.containerName} delivery to ${quote.originPostcode.suburb} ${quote.originPostcode.state}`}
        billingCycleLabel={quote.billingCycle.replace(/_/g, ' ')}
        onPaymentSuccess={(result) => {
          setIsBooked(true);
          setHasPaid(true);
          if (onPaymentSuccess) {
            onPaymentSuccess(result);
          }
        }}
      />

      {/* Booking Next Steps & Call to Action */}
      <div className="mt-8 p-6 bg-slate-50 border border-slate-200/80 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-[#0b2942]">Prefer to book over the phone?</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Your quote is saved. Speak with our local dispatch team or text us for immediate assistance.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <a
            href={`tel:${phone.replace(/\s+/g, '')}`}
            className="px-5 py-3 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-[#0b2942] font-bold text-xs flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <Phone className="w-4 h-4 text-[#00c0f3]" />
            <span>Call {phone}</span>
          </a>

          {!isBooked && (
            <button
              type="button"
              onClick={() => setIsBooked(true)}
              className="px-6 py-3 rounded-2xl bg-[#0b2942] hover:bg-[#081e30] text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4 text-[#00c0f3]" />
              <span>Reserve Without Paying Now</span>
            </button>
          )}
        </div>
      </div>

      {isBooked && !calendarEventLink && (
        <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Thank you! Your container reservation has been logged. Our {quote.originDepot.name} team will contact you to coordinate drop-off.</span>
          </div>
          <button
            type="button"
            onClick={handleInitiateCalendarBooking}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-900 text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Calendar className="w-3.5 h-3.5 text-[#00c0f3]" />
            <span>Add Delivery to Google Calendar</span>
          </button>
        </div>
      )}

      {/* Explicit User Confirmation Modal for Google Calendar event creation (Mandatory per Skill) */}
      {isCalendarModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-3 bg-sky-50 text-[#00c0f3] rounded-2xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#0b2942]">Confirm Calendar Reservation</h3>
                <p className="text-xs text-slate-500">Google Calendar dispatch event</p>
              </div>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200 text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Delivery Event:</span>
                <span className="font-bold text-[#0b2942]">Portabox Container Delivery</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Scheduled Date:</span>
                <span className="font-bold text-[#0b2942]">{quote.preferredDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Arrival Window:</span>
                <span className="font-bold text-[#00c0f3]">{effectiveSlot.label} ({effectiveSlot.timeRange})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Container Details:</span>
                <span className="font-bold text-[#0b2942]">{quote.containerCount}x {quote.containerName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Delivery Location:</span>
                <span className="font-bold text-[#0b2942]">{quote.originPostcode.suburb}, {quote.originPostcode.state} {quote.originPostcode.postcode}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Invited Attendee:</span>
                <span className="font-bold text-[#0b2942]">{customerData?.email || 'customer@portabox.com.au'}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal">
              This action will schedule a calendar appointment on your connected Google Calendar with automated reminders 24h and 2h before arrival.
            </p>

            {calendarError && (
              <p className="text-xs text-rose-600 font-semibold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                {calendarError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCalendarModalOpen(false)}
                disabled={isSchedulingCalendar}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCalendarBooking}
                disabled={isSchedulingCalendar}
                className="px-5 py-2.5 rounded-xl bg-[#00c0f3] hover:bg-[#00abda] text-white text-xs font-black shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSchedulingCalendar ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Scheduling Event...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Confirm Calendar Reservation</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Are You Stuck Banner on Every Page */}
      <AreYouStuckBanner />
    </div>
  );
};
