import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Truck,
  Warehouse,
  Home,
  ShieldAlert,
  Navigation,
  Sparkles,
  Info,
  X,
  MessageSquare,
} from 'lucide-react';
import { PORTABOX_IMAGES } from '../assets/images';
import {
  AUSTRALIAN_POSTCODES,
  calculateDrivingDistance,
  PostcodeRecord,
  searchPostcodes,
} from '../data/australianPostcodes';
import { AppConfig, BlockedPostcode, ServiceType } from '../types/quote';
import { getMetroHubForPostcode, isPostcodeBlocked } from '../services/pricingEngine';

import { AreYouStuckBanner } from './AreYouStuckBanner';

interface Step2WhatProps {
  originPostcode: PostcodeRecord;
  destinationPostcode: PostcodeRecord | null;
  onSelectDestinationPostcode: (record: PostcodeRecord | null) => void;
  serviceType: ServiceType;
  onSelectServiceType: (service: ServiceType) => void;
  storagePlacement: 'my_place' | 'facility';
  onSelectStoragePlacement: (placement: 'my_place' | 'facility') => void;
  containerCount?: number;
  includeFuelSurcharge?: boolean;
  onToggleFuelSurcharge?: (enabled: boolean) => void;
  onChangeLocation: () => void;
  onContinue: () => void;
  onBack: () => void;
  config: AppConfig;
}

export const Step2What: React.FC<Step2WhatProps> = ({
  originPostcode,
  destinationPostcode,
  onSelectDestinationPostcode,
  serviceType,
  onSelectServiceType,
  storagePlacement,
  onSelectStoragePlacement,
  containerCount = 1,
  includeFuelSurcharge = true,
  onToggleFuelSurcharge,
  onChangeLocation,
  onContinue,
  onBack,
  config,
}) => {
  const isMoving = serviceType === 'moving' || serviceType === 'moving_storage';

  const [destQuery, setDestQuery] = useState(
    destinationPostcode ? `${destinationPostcode.postcode} ${destinationPostcode.suburb}` : ''
  );
  const [destSuggestions, setDestSuggestions] = useState<PostcodeRecord[]>([]);
  const [isDestOpen, setIsDestOpen] = useState(false);
  const [destBlockedNotice, setDestBlockedNotice] = useState<BlockedPostcode | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const destDropdownRef = useRef<HTMLDivElement>(null);

  // Sync input when destinationPostcode changes externally
  useEffect(() => {
    if (destinationPostcode) {
      setDestQuery(`${destinationPostcode.postcode} ${destinationPostcode.suburb}`);
    }
  }, [destinationPostcode]);

  // Search logic for destination postcode/suburb
  useEffect(() => {
    if (destQuery.trim().length > 0) {
      const results = searchPostcodes(destQuery);
      setDestSuggestions(results);
    } else {
      setDestSuggestions(
        AUSTRALIAN_POSTCODES.filter(
          (p) => p.postcode !== originPostcode.postcode || p.suburb !== originPostcode.suburb
        ).slice(0, 6)
      );
    }
  }, [destQuery, originPostcode]);

  // Click outside to dismiss suggestions dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (destDropdownRef.current && !destDropdownRef.current.contains(e.target as Node)) {
        setIsDestOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectDestination = (record: PostcodeRecord) => {
    const blocked = isPostcodeBlocked(record.postcode, config);
    if (blocked) {
      setDestBlockedNotice(blocked);
      onSelectDestinationPostcode(null);
      setDestQuery(`${record.postcode} ${record.suburb}`);
      setIsDestOpen(false);
      return;
    }

    setDestBlockedNotice(null);
    setValidationError(null);
    onSelectDestinationPostcode(record);
    setDestQuery(`${record.postcode} ${record.suburb}`);
    setIsDestOpen(false);
  };

  const handleClearDestination = () => {
    onSelectDestinationPostcode(null);
    setDestQuery('');
    setDestBlockedNotice(null);
    setValidationError(null);
    setIsDestOpen(true);
  };

  // Road driving distance calculation (using actual road network, NOT as the crow flies)
  const movingDistanceKm = destinationPostcode
    ? calculateDrivingDistance(
        originPostcode.lat,
        originPostcode.lng,
        destinationPostcode.lat,
        destinationPostcode.lng,
        originPostcode.postcode,
        destinationPostcode.postcode
      )
    : null;

  // Origin and destination metro hubs
  const originHub = getMetroHubForPostcode(originPostcode);
  const destHub = destinationPostcode ? getMetroHubForPostcode(destinationPostcode) : null;
  const isInterstateMove = destHub ? originHub !== destHub : false;
  const interstateKey = destHub ? `${originHub}->${destHub}` : '';
  const interstatePrice = isInterstateMove && config.interstateRates[interstateKey] ? config.interstateRates[interstateKey] : null;

  // Zone determination based on road driving distance
  const { zone1MaxKm, zone1RatePerKm, zone2MaxKm, zone2RatePerKm, zone3MaxKm, zone3RatePerKm } = config.deliveryZones;

  let movingZone = 1;
  let movingRatePerKm = zone1RatePerKm;
  let movingKmRatePerContainer = 0;
  let isZone4Call = false;

  if (movingDistanceKm !== null) {
    if (movingDistanceKm <= zone1MaxKm) {
      movingZone = 1;
      movingRatePerKm = zone1RatePerKm;
      movingKmRatePerContainer = 0;
    } else if (movingDistanceKm <= zone2MaxKm) {
      movingZone = 2;
      movingRatePerKm = zone2RatePerKm;
      movingKmRatePerContainer = Math.round(movingDistanceKm * zone2RatePerKm);
    } else if (movingDistanceKm <= zone3MaxKm) {
      movingZone = 3;
      movingRatePerKm = zone3RatePerKm;
      movingKmRatePerContainer = Math.round(movingDistanceKm * zone3RatePerKm);
    } else {
      movingZone = 4;
      if (!isInterstateMove) {
        isZone4Call = true;
      }
    }
  }

  // Extra delivery charge assessed per container
  const effectiveContainerCount = containerCount > 0 ? containerCount : 1;
  const movingKmChargeTotal = movingKmRatePerContainer * effectiveContainerCount;

  // Fuel surcharge: $0.50/km travelled assessed per container
  const fuelRatePerKm = config.fuelSurchargeRatePerKm || 0.50;
  const fuelSurchargePerContainer = movingDistanceKm !== null ? Math.round(movingDistanceKm * fuelRatePerKm * 100) / 100 : 0;
  const fuelSurchargeTotal = fuelSurchargePerContainer * effectiveContainerCount;

  const handleContinueClick = () => {
    if (isMoving && !destinationPostcode) {
      // Check if current destQuery matches any suggestion
      if (destSuggestions.length > 0) {
        handleSelectDestination(destSuggestions[0]);
        onContinue();
      } else {
        setValidationError('Please select your destination postcode or suburb before continuing.');
      }
      return;
    }
    onContinue();
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-8 lg:p-10 shadow-xs border border-slate-200/80">
      {/* Header kicker */}
      <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-[#00c0f3] font-['Cabinet_Grotesk',sans-serif] flex items-center gap-1.5">
        <span>—</span>
        <span>INSTANT QUOTE</span>
      </span>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mt-0.5 sm:mt-1 mb-2 sm:mb-3">
        <h1 className="text-xl sm:text-4xl font-extrabold text-[#0b2942] tracking-tight leading-tight">
          What do you need?
        </h1>

        {/* Selected location pill */}
        <button
          onClick={onChangeLocation}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span className="text-[#00c0f3] font-bold">✓</span>
          <span>{originPostcode.suburb}, {originPostcode.state} {originPostcode.postcode}</span>
          <span className="text-[#00c0f3] ml-1 underline">Change</span>
        </button>
      </div>

      {/* 3 Main Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-5 mt-2.5 sm:mt-6">
        {/* Card 1: Moving */}
        <div
          onClick={() => {
            onSelectServiceType('moving');
            setValidationError(null);
          }}
          className={`group rounded-xl sm:rounded-2xl border-2 transition-all p-2.5 sm:p-4 flex flex-row md:flex-col items-center md:items-stretch justify-between gap-3 cursor-pointer ${
            serviceType === 'moving'
              ? 'border-[#00c0f3] bg-sky-50/20 shadow-xs sm:shadow-md ring-2 ring-[#00c0f3]/20'
              : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs'
          }`}
        >
          <div className="flex flex-row md:flex-col items-center md:items-start gap-3 w-full">
            <div className="w-14 h-14 sm:w-full sm:aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
              <img
                src={PORTABOX_IMAGES.moving}
                alt="Portabox moving truck"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-lg font-extrabold text-[#0b2942]">Moving</h3>
                <div className="md:hidden">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      serviceType === 'moving' ? 'bg-[#00c0f3] text-white font-bold' : 'border border-slate-300'
                    }`}
                  >
                    {serviceType === 'moving' && '✓'}
                  </div>
                </div>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-2 leading-tight sm:leading-relaxed">
                We deliver, you pack, we move it door to door.
              </p>
            </div>
          </div>

          <button
            type="button"
            className={`hidden md:block w-full mt-5 py-2.5 rounded-xl font-black text-xs tracking-wide transition-all cursor-pointer ${
              serviceType === 'moving'
                ? 'bg-[#ffd000] text-[#0f3353] border border-amber-300 shadow-xs'
                : 'border border-slate-300 text-slate-700 group-hover:bg-slate-50'
            }`}
          >
            {serviceType === 'moving' ? 'Selected' : 'Select'}
          </button>
        </div>

        {/* Card 2: Storage */}
        <div
          onClick={() => {
            onSelectServiceType(storagePlacement === 'my_place' ? 'storage_at_place' : 'storage_facility');
            setValidationError(null);
          }}
          className={`group rounded-xl sm:rounded-2xl border-2 transition-all p-2.5 sm:p-4 flex flex-row md:flex-col items-center md:items-stretch justify-between gap-3 cursor-pointer relative ${
            serviceType === 'storage_at_place' || serviceType === 'storage_facility'
              ? 'border-[#00c0f3] bg-sky-50/20 shadow-xs sm:shadow-md ring-2 ring-[#00c0f3]/20'
              : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs'
          }`}
        >
          <div className="flex flex-row md:flex-col items-center md:items-start gap-3 w-full">
            <div className="w-14 h-14 sm:w-full sm:aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
              <img
                src={PORTABOX_IMAGES.storage}
                alt="Portabox storage customers"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="hidden sm:inline-block absolute top-2 right-2 bg-[#00c0f3] text-white font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-md shadow-xs">
                MOST POPULAR
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm sm:text-lg font-extrabold text-[#0b2942]">Storage</h3>
                  <span className="sm:hidden text-[9px] font-extrabold text-[#00c0f3] bg-sky-50 px-1.5 py-0.5 rounded uppercase">
                    Popular
                  </span>
                </div>
                <div className="md:hidden">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      serviceType === 'storage_at_place' || serviceType === 'storage_facility'
                        ? 'bg-[#00c0f3] text-white font-bold'
                        : 'border border-slate-300'
                    }`}
                  >
                    {(serviceType === 'storage_at_place' || serviceType === 'storage_facility') && '✓'}
                  </div>
                </div>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-2 leading-tight sm:leading-relaxed">
                Keep it at your place, or we collect and store it securely.
              </p>
            </div>
          </div>

          <button
            type="button"
            className={`hidden md:block w-full mt-5 py-2.5 rounded-xl font-black text-xs tracking-wide transition-all cursor-pointer ${
              serviceType === 'storage_at_place' || serviceType === 'storage_facility'
                ? 'bg-[#ffd000] text-[#0f3353] border border-amber-300 shadow-xs'
                : 'border border-slate-300 text-slate-700 group-hover:bg-slate-50'
            }`}
          >
            {serviceType === 'storage_at_place' || serviceType === 'storage_facility' ? 'Selected' : 'Select'}
          </button>
        </div>

        {/* Card 3: Moving and storage */}
        <div
          onClick={() => {
            onSelectServiceType('moving_storage');
            setValidationError(null);
          }}
          className={`group rounded-xl sm:rounded-2xl border-2 transition-all p-2.5 sm:p-4 flex flex-row md:flex-col items-center md:items-stretch justify-between gap-3 cursor-pointer ${
            serviceType === 'moving_storage'
              ? 'border-[#00c0f3] bg-sky-50/20 shadow-xs sm:shadow-md ring-2 ring-[#00c0f3]/20'
              : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs'
          }`}
        >
          <div className="flex flex-row md:flex-col items-center md:items-start gap-3 w-full">
            <div className="w-14 h-14 sm:w-full sm:aspect-[4/3] rounded-lg sm:rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
              <img
                src={PORTABOX_IMAGES.movingAndStorage}
                alt="Portabox container on residential driveway"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-lg font-extrabold text-[#0b2942]">Moving and storage</h3>
                <div className="md:hidden">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                      serviceType === 'moving_storage' ? 'bg-[#00c0f3] text-white font-bold' : 'border border-slate-300'
                    }`}
                  >
                    {serviceType === 'moving_storage' && '✓'}
                  </div>
                </div>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-2 leading-tight sm:leading-relaxed">
                Pack now, store with us, then deliver to new place.
              </p>
            </div>
          </div>

          <button
            type="button"
            className={`hidden md:block w-full mt-5 py-2.5 rounded-xl font-black text-xs tracking-wide transition-all cursor-pointer ${
              serviceType === 'moving_storage'
                ? 'bg-[#ffd000] text-[#0f3353] border border-amber-300 shadow-xs'
                : 'border border-slate-300 text-slate-700 group-hover:bg-slate-50'
            }`}
          >
            {serviceType === 'moving_storage' ? 'Selected' : 'Select'}
          </button>
        </div>
      </div>

      {/* Sub-question: If Storage is selected, where will it live? */}
      {(serviceType === 'storage_at_place' || serviceType === 'storage_facility') && (
        <div className="mt-3 sm:mt-8 p-3 sm:p-5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 animate-in fade-in duration-200">
          <div>
            <h4 className="text-xs sm:text-sm font-extrabold text-[#0b2942]">Where will the container live?</h4>
          </div>

          <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shadow-xs self-start sm:self-auto">
            <button
              onClick={() => {
                onSelectStoragePlacement('my_place');
                onSelectServiceType('storage_at_place');
              }}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                storagePlacement === 'my_place'
                  ? 'bg-[#0b2942] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My place
            </button>
            <button
              onClick={() => {
                onSelectStoragePlacement('facility');
                onSelectServiceType('storage_facility');
              }}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                storagePlacement === 'facility'
                  ? 'bg-[#0b2942] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Portabox facility
            </button>
          </div>
        </div>
      )}

      {/* Destination Postcode Search Section (for Moving & Moving+Storage) */}
      {isMoving && (
        <div className="mt-3.5 sm:mt-8 p-3.5 sm:p-6 bg-sky-50/60 rounded-2xl sm:rounded-3xl border border-sky-200 relative animate-in fade-in duration-200">
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
            <div className="p-1 sm:p-1.5 rounded-lg bg-[#00c0f3] text-white">
              <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#0b2942]">
                Where are you moving to?
              </h3>
            </div>
          </div>

          {/* Blocked Postcode Alert */}
          {destBlockedNotice && (
            <div className="mt-2.5 mb-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5 sm:gap-3">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">Destination {destBlockedNotice.postcode} is restricted</p>
                <p className="mt-0.5 text-amber-800">{destBlockedNotice.reason}</p>
                <p className="mt-1 text-amber-700">Please choose another delivery location or contact 1800 467 637.</p>
              </div>
            </div>
          )}

          {/* Validation Error if user clicks continue without selecting */}
          {validationError && (
            <div className="mt-2 mb-2.5 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {validationError}
            </div>
          )}

          {/* Autocomplete Input Container */}
          <div className="mt-2.5 sm:mt-4 relative" ref={destDropdownRef}>
            <label className="block text-[11px] sm:text-xs font-bold text-slate-700 mb-1">
              Destination suburb or postcode
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-[#00c0f3]" />
              </div>
              <input
                type="text"
                value={destQuery}
                onChange={(e) => {
                  setDestQuery(e.target.value);
                  setIsDestOpen(true);
                  setDestBlockedNotice(null);
                  setValidationError(null);
                }}
                onFocus={() => setIsDestOpen(true)}
                placeholder="Search destination e.g. 3000 Melbourne, 2000 Sydney..."
                className="w-full pl-9 pr-9 sm:pl-11 sm:pr-10 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-white border-2 border-[#00c0f3] text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-[#00c0f3]/20 shadow-xs"
              />
              {destQuery && (
                <button
                  type="button"
                  onClick={handleClearDestination}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown (Identical to Step 1 Where) */}
            {isDestOpen && destSuggestions.length > 0 && (
              <div className="absolute z-30 mt-1.5 sm:mt-2 w-full bg-white rounded-xl sm:rounded-2xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-slate-50 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Suggested Destination Locations
                </div>
                {destSuggestions.map((p) => {
                  const isSelected = destinationPostcode?.postcode === p.postcode && destinationPostcode?.suburb === p.suburb;
                  return (
                    <button
                      key={`dest-${p.postcode}-${p.suburb}`}
                      type="button"
                      onClick={() => handleSelectDestination(p)}
                      className={`w-full px-3.5 py-2.5 sm:px-4 sm:py-3 text-left flex items-center justify-between hover:bg-sky-50 transition-colors cursor-pointer ${
                        isSelected ? 'bg-sky-50 font-bold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-2.5">
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00c0f3]" />
                        <span className="text-xs sm:text-sm font-semibold text-slate-900">
                          <span className="font-bold text-[#0b2942]">{p.postcode}</span> {p.suburb}
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {p.state}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Clean Destination Confirmation */}
          {destinationPostcode && !destBlockedNotice && (
            <div className="mt-2.5 sm:mt-4 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-sky-200 flex items-center justify-between gap-2.5 sm:gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#00c0f3] text-white flex items-center justify-center font-bold text-xs">
                  ✓
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-[#0b2942]">
                    Moving to {destinationPostcode.suburb}, {destinationPostcode.state} {destinationPostcode.postcode}
                  </p>
                  <p className="text-[10px] sm:text-xs text-slate-500">
                    Destination confirmed
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearDestination}
                className="text-xs text-slate-500 hover:text-[#0b2942] font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Change
              </button>
            </div>
          )}
        </div>
      )}

      {/* Are You Stuck Banner */}
      <div className="mt-4 sm:mt-8">
        <AreYouStuckBanner />
      </div>

      {/* Navigation Buttons */}
      <div className="mt-4 sm:mt-10 flex items-center justify-between pt-3 sm:pt-6 border-t border-slate-100">
        <button
          onClick={onBack}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Previous</span>
        </button>

        <button
          onClick={handleContinueClick}
          className="px-7 sm:px-9 py-2.5 sm:py-3.5 bg-[#ffd000] hover:bg-[#ffdc26] active:bg-[#eab308] text-[#0f3353] font-black rounded-xl sm:rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-98 text-sm sm:text-base border-2 border-amber-300 shrink-0"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
