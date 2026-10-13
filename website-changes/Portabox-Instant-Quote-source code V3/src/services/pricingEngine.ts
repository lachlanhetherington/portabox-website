import {
  AppConfig,
  BillingCycle,
  BlockedPostcode,
  ContainerSizeId,
  CustomerLead,
  DeliverySlotWindow,
  MetroHub,
  PackingSuppliesConfig,
  PackingSuppliesOrder,
  PromotionRule,
  QuoteBreakdown,
  QuoteDropOffRecord,
  QuoteLegBreakdown,
  ServiceType,
  StorageDuration,
} from '../types/quote';
import {
  calculateDrivingDistance,
  calculateHaversineDistance,
  findClosestDepot,
  PostcodeRecord,
} from '../data/australianPostcodes';
import { DEFAULT_DEPOT_CALENDARS } from './googleCalendarService';
import { getSlotEfficiencyIncentive } from './routingOptimizationService';

export const DEFAULT_PACKING_SUPPLIES: PackingSuppliesConfig = {
  boxSinglePrice: 2.5,
  box10Price: 20,
  box50Price: 40,
  box100Price: 70,
  blanketSinglePrice: 2.0,
  blanket10Price: 20,
  blanket50Price: 40,
  blanket100Price: 70,
};

export const DEFAULT_CONFIG: AppConfig = {
  phone: '1800 467 637',
  containerPrices: {
    small_10m3: {
      monthlyRate: 209,
      weeklyRate: 69,
    },
    medium_19m3: {
      monthlyRate: 219,
      weeklyRate: 75,
    },
    large_25m3: {
      monthlyRate: 219,
      weeklyRate: 75,
    },
  },
  packingSupplies: DEFAULT_PACKING_SUPPLIES,
  domesticLegFee: 149,
  fuelSurchargeRatePerKm: 0.50,
  fuelSurchargeEnabled: true,
  deliveryZones: {
    zone1MaxKm: 35,
    zone1RatePerKm: 0,
    zone2MaxKm: 100,
    zone2RatePerKm: 2,
    zone3MaxKm: 300,
    zone3RatePerKm: 3,
    zone4CallPricing: true,
  },
  interstateRates: {
    'Adelaide->Melbourne': 1500,
    'Adelaide->Sydney': 2500,
    'Adelaide->Brisbane/Gold Coast': 3500,
    'Adelaide->Sunshine Coast': 4000,
    'Melbourne->Adelaide': 1600,
    'Melbourne->Sydney': 1900,
    'Melbourne->Brisbane/Gold Coast': 2900,
    'Melbourne->Sunshine Coast': 3900,
    'Sydney->Adelaide': 2700,
    'Sydney->Brisbane/Gold Coast': 2300,
    'Sydney->Melbourne': 2100,
    'Sydney->Sunshine Coast': 2500,
    'Sunshine Coast->Adelaide': 4200,
    'Sunshine Coast->Brisbane/Gold Coast': 1200,
    'Sunshine Coast->Sydney': 1600,
    'Sunshine Coast->Melbourne': 2600,
    // Symmetrical / reverse defaults for Brisbane/Gold Coast
    'Brisbane/Gold Coast->Adelaide': 3500,
    'Brisbane/Gold Coast->Melbourne': 2900,
    'Brisbane/Gold Coast->Sydney': 2300,
    'Brisbane/Gold Coast->Sunshine Coast': 1200,
  },
  promotions: [
    {
      id: 'promo-free-delivery-zone1',
      name: 'Free Initial Delivery Special',
      code: 'FREEDEL',
      description: 'Free initial delivery to your address for bookings this month',
      type: 'free_initial_delivery',
      value: 100,
      active: true,
      autoApply: false,
    },
    {
      id: 'promo-50-first-month',
      name: '50% Off First Month Storage',
      code: 'HALFPRICE',
      description: 'Get 50% off your first month storage rent',
      type: 'percent_off_first_month',
      value: 50,
      active: true,
      autoApply: false,
    },
    {
      id: 'promo-save-50',
      name: '$50 Instant Quote Voucher',
      code: 'SAVE50',
      description: '$50 off your first payment',
      type: 'fixed_discount',
      value: 50,
      active: true,
      autoApply: false,
    },
    {
      id: 'promo-save-100',
      name: '$100 Booking Bonus Voucher',
      code: 'SAVE100',
      description: '$100 off your first payment',
      type: 'fixed_discount',
      value: 100,
      active: true,
      autoApply: false,
    },
    {
      id: 'promo-adelaide-brisbane-50',
      name: '50% Off Adelaide to Brisbane Moves',
      code: 'SUNSHINE50',
      description: '50% off interstate transit between Adelaide and Brisbane/Gold Coast',
      type: 'percent_off_interstate',
      value: 50,
      targetHubOrigin: 'Adelaide',
      targetHubDestination: 'Brisbane/Gold Coast',
      active: true,
      autoApply: true,
    },
    {
      id: 'promo-one-month-free-long-term',
      name: 'One Month Free Storage (12+ Mo)',
      code: 'YEARFREE',
      description: 'Pay for 11 months, get the 12th month completely free',
      type: 'free_first_month',
      value: 100,
      minDurationMonths: 12,
      active: true,
      autoApply: false,
    },
    {
      id: 'promo-free-upgrade',
      name: 'Free Upgrade to 25 m³ Container',
      code: 'BIGBOX',
      description: 'Get a 25 m³ container for the price of a 19 m³ container',
      type: 'free_container_upgrade',
      value: 10,
      active: false,
      autoApply: false,
    },
  ],
  blockedPostcodes: [
    { postcode: '5222', suburb: 'Kingscote (Kangaroo Island)', reason: 'Ferry required; contact special transport logistics.' },
    { postcode: '2899', suburb: 'Norfolk Island', reason: 'Offshore territory not serviced by road freight.' },
    { postcode: '7151', suburb: 'Southport TAS', reason: 'Tasmania service pending depot launch.' },
  ],
  depotCalendars: DEFAULT_DEPOT_CALENDARS,
  enableCallCenterDispatch: true,
  efficiencyDiscountPercentage: 20,
  ecoIncentiveType: 'dollar_discount',
};

export const CONTAINER_SPECS = {
  small_10m3: {
    volume: '10 m³',
    name: '10 m³ Portabox',
    length: '2.15 m',
    width: '1.52 m',
    height: '2.40 m',
    floorSpace: '3.3 m²',
    doorClearance: '1.40 m (W) × 2.10 m (H)',
    approxFit: '1 bedroom apartment · Queen bed, sofa, fridge, 30–40 boxes',
  },
  medium_19m3: {
    volume: '19 m³',
    name: '19 m³ Portabox',
    length: '3.75 m',
    width: '2.20 m',
    height: '2.40 m',
    floorSpace: '8.2 m²',
    doorClearance: '2.10 m (W) × 2.10 m (H)',
    approxFit: '2 bedroom home · 2 beds, dining suite, living room, 60–80 boxes',
  },
  large_25m3: {
    volume: '25 m³',
    name: '25 m³ Portabox',
    length: '4.95 m',
    width: '2.20 m',
    height: '2.40 m',
    floorSpace: '10.9 m²',
    doorClearance: '2.10 m (W) × 2.10 m (H)',
    approxFit: '3 bedroom family home · 3 beds, lounge, outdoor set, 100–120 boxes',
  },
  combo_35m3: {
    volume: '35 m³ (25 m³ + 10 m³)',
    name: '35 m³ Combo',
    length: 'Combined 25 m³ + 10 m³',
    width: '2.20 m & 1.52 m',
    height: '2.40 m',
    floorSpace: '14.2 m²',
    doorClearance: 'Dual ground access doors',
    approxFit: '4 bedroom large home · 26 to 35 m³ contents',
  },
  two_large_50m3: {
    volume: '50 m³ (2 x 25 m³)',
    name: '50 m³ (2 x 25 m³)',
    length: '2 × 4.95 m',
    width: '2.20 m',
    height: '2.40 m',
    floorSpace: '21.8 m²',
    doorClearance: 'Dual large access doors',
    approxFit: '5 bedroom expansive home · 36 to 50 m³ contents',
  },
};

/**
 * Box Pricing Calculator:
 * Individual: $2.50 each
 * 10 boxes: $20
 * 50 boxes: $40
 * 100 boxes: $70
 */
export function calculateBoxPrice(count: number, config?: PackingSuppliesConfig): number {
  if (count <= 0) return 0;
  const single = config?.boxSinglePrice ?? 2.5;
  const p10Rate = config?.box10Price ?? 20;
  const p50Rate = config?.box50Price ?? 40;
  const p100Rate = config?.box100Price ?? 70;

  if (count === 10) return p10Rate;
  if (count === 50) return p50Rate;
  if (count === 100) return p100Rate;

  let total = 0;
  let rem = count;

  // 100 packs
  const p100 = Math.floor(rem / 100);
  total += p100 * p100Rate;
  rem %= 100;

  // 50 pack
  if (rem >= 50) {
    total += p50Rate;
    rem -= 50;
  }

  // 10 packs
  if (rem >= 20 && rem < 50) {
    const tens = Math.floor(rem / 10);
    total += tens * p10Rate;
    rem %= 10;
  } else if (rem >= 10) {
    total += p10Rate;
    rem -= 10;
  }

  // singles capped at 10-pack price
  const singles = Math.min(rem * single, p10Rate);
  total += singles;

  return Math.round(total * 100) / 100;
}

/**
 * Blanket Rental Pricing Calculator:
 * Individual: $2.00 each
 * 10 blankets: $20
 * 50 blankets: $40
 * 100 blankets: $70
 */
export function calculateBlanketPrice(count: number, config?: PackingSuppliesConfig): number {
  if (count <= 0) return 0;
  const single = config?.blanketSinglePrice ?? 2.0;
  const p10Rate = config?.blanket10Price ?? 20;
  const p50Rate = config?.blanket50Price ?? 40;
  const p100Rate = config?.blanket100Price ?? 70;

  if (count === 10) return p10Rate;
  if (count === 50) return p50Rate;
  if (count === 100) return p100Rate;

  let total = 0;
  let rem = count;

  const p100 = Math.floor(rem / 100);
  total += p100 * p100Rate;
  rem %= 100;

  if (rem >= 50) {
    total += p50Rate;
    rem -= 50;
  }

  if (rem >= 20 && rem < 50) {
    const tens = Math.floor(rem / 10);
    total += tens * p10Rate;
    rem %= 10;
  } else if (rem >= 10) {
    total += p10Rate;
    rem -= 10;
  }

  const singles = Math.min(rem * single, p10Rate);
  total += singles;

  return Math.round(total * 100) / 100;
}

const STORAGE_KEY_CONFIG = 'portabox_app_config_v4';
const STORAGE_KEY_LEADS = 'portabox_customer_leads_v4';
const STORAGE_KEY_DROPOFFS = 'portabox_drop_offs_v1';

export function loadAppConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);

    // Normalize keys
    const containerPrices = {
      small_10m3: parsed.containerPrices?.small_10m3 || parsed.containerPrices?.small_7ft || DEFAULT_CONFIG.containerPrices.small_10m3,
      medium_19m3: parsed.containerPrices?.medium_19m3 || parsed.containerPrices?.medium_12ft || DEFAULT_CONFIG.containerPrices.medium_19m3,
      large_25m3: parsed.containerPrices?.large_25m3 || parsed.containerPrices?.large_16ft || DEFAULT_CONFIG.containerPrices.large_25m3,
    };

    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      containerPrices,
      packingSupplies: {
        ...DEFAULT_PACKING_SUPPLIES,
        ...(parsed.packingSupplies || {}),
      },
      fuelSurchargeRatePerKm: parsed.fuelSurchargeRatePerKm !== undefined ? Number(parsed.fuelSurchargeRatePerKm) : DEFAULT_CONFIG.fuelSurchargeRatePerKm,
      fuelSurchargeEnabled: parsed.fuelSurchargeEnabled !== undefined ? Boolean(parsed.fuelSurchargeEnabled) : DEFAULT_CONFIG.fuelSurchargeEnabled,
      deliveryZones: {
        ...DEFAULT_CONFIG.deliveryZones,
        ...(parsed.deliveryZones || {}),
      },
      interstateRates: {
        ...DEFAULT_CONFIG.interstateRates,
        ...(parsed.interstateRates || {}),
      },
      promotions: parsed.promotions || DEFAULT_CONFIG.promotions,
      blockedPostcodes: parsed.blockedPostcodes || DEFAULT_CONFIG.blockedPostcodes,
      depotCalendars: parsed.depotCalendars || DEFAULT_DEPOT_CALENDARS,
      enableCallCenterDispatch: parsed.enableCallCenterDispatch !== undefined ? Boolean(parsed.enableCallCenterDispatch) : DEFAULT_CONFIG.enableCallCenterDispatch,
      efficiencyDiscountPercentage: parsed.efficiencyDiscountPercentage !== undefined ? Number(parsed.efficiencyDiscountPercentage) : DEFAULT_CONFIG.efficiencyDiscountPercentage,
      ecoIncentiveType: parsed.ecoIncentiveType === 'emissions_only' ? 'emissions_only' : 'dollar_discount',
    };
  } catch (err) {
    console.error('Failed to load config from storage, using defaults:', err);
    return DEFAULT_CONFIG;
  }
}

export function saveAppConfig(config: AppConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save config:', err);
  }
}

export function loadCustomerLeads(): CustomerLead[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LEADS);
    if (!raw) {
      const seed: CustomerLead[] = [
        {
          id: 'lead-1790678000',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          firstName: 'Sarah',
          mobile: '0412 345 678',
          email: 'sarah.j@example.com.au',
          agreedToContact: true,
          status: 'New',
          smsSent: true,
          emailSent: true,
          notes: ['Quote generated online. Interested in Hyde Park storage.'],
          quote: {
            containerSize: 'large_25m3',
            containerCount: 1,
            containerName: '25 m³ Portabox',
            containerVolume: '25 m³',
            containerDimensions: CONTAINER_SPECS.large_25m3,
            serviceType: 'storage_at_place',
            billingCycle: 'monthly',
            storageDuration: '4_to_11_months',
            preferredDate: 'Wed 14 Oct 2026',
            originPostcode: {
              postcode: '5061',
              suburb: 'Hyde Park',
              state: 'SA',
              lat: -34.9542,
              lng: 138.6019,
              region: 'Adelaide',
            },
            originDepot: {
              id: 'adelaide',
              name: 'Adelaide Depot',
              address: '10 Barfield Crescent',
              suburb: 'Edinburgh North',
              postcode: '5113',
              state: 'SA',
              lat: -34.7077,
              lng: 138.6836,
              phone: '1800 467 637',
            },
            originDistanceKm: 28,
            deliveryZone: 1,
            isInterstate: false,
            kmRatePerKm: 0,
            kmTotalCharge: 0,
            requiresCallForPricing: false,
            monthlyContainerRate: 219,
            weeklyContainerRate: 75,
            monthlyRatePerContainer: 219,
            weeklyRatePerContainer: 75,
            storageRateFormatted: '$219 /month',
            storagePricingText: '$219 /month',
            domesticLegFeePerContainer: 149,
            deliveryPricingText: '$149 per one-way leg',
            fuelSurchargeRatePerKm: 0.50,
            fuelSurchargeAmount: 0,
            fuelSurchargePerContainer: 0,
            isFuelSurchargeIncluded: false,
            distanceCalculationMethod: 'driving_distance',
            packingSupplies: {
              boxesCount: 10,
              boxesPrice: 20,
              blanketsCount: 10,
              blanketsPrice: 20,
              totalSuppliesPrice: 40,
            },
            initialDeliveryFee: 149,
            collectionFeeEstimate: 149,
            firstPaymentTotal: 408,
            monthlyStorageFee: 219,
            weeklyStorageFee: 75,
            currentPeriodicStorageFee: 219,
            legs: [
              {
                label: 'Delivery to Hyde Park',
                description: 'Drop off empty container to your driveway',
                fee: 149,
                isPayableNow: true,
              },
              {
                label: "Collection when you're done",
                description: 'Payable at the end of storage',
                fee: 149,
                isPayableNow: false,
              },
            ],
            appliedPromotions: [],
            totalDiscount: 0,
            summaryText: '1 x 25 m³ Portabox · Storage at your place · 4 to 11 months · Adelaide Zone 1',
            smsPreviewText: "Hi Sarah, here's your Portabox quote: 25 m³ container at Hyde Park, $219/month, delivery $149, first payment $408. Full breakdown: portabox.au/q/7K2M. Reply here with any questions, or reply BOOK to lock in Wed 14 Oct.",
          },
        },
      ];
      saveCustomerLeads(seed);
      return seed;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load customer leads:', err);
    return [];
  }
}

export function saveCustomerLeads(leads: CustomerLead[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_LEADS, JSON.stringify(leads));
  } catch (err) {
    console.error('Failed to save customer leads:', err);
  }
}

export function loadDropOffRecords(): QuoteDropOffRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DROPOFFS);
    if (!raw) {
      // Seed a few realistic drop-off logs for admin demonstration
      const seedDropOffs: QuoteDropOffRecord[] = [
        {
          id: 'drop-101',
          sessionId: 'sess-84920',
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
          lastPageStep: 3,
          lastPageName: 'Page 3: Which Size (Container Selection)',
          originSuburb: 'Unley',
          originPostcode: '5061',
          serviceType: 'storage_at_place',
          containerSize: 'large_25m3',
          containerCount: 1,
          completed: false,
        },
        {
          id: 'drop-102',
          sessionId: 'sess-84921',
          timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString(),
          lastPageStep: 4,
          lastPageName: 'Page 4: When (Duration & Billing)',
          originSuburb: 'Norwood',
          originPostcode: '5067',
          serviceType: 'moving',
          destinationSuburb: 'Brighton',
          destinationPostcode: '5048',
          containerSize: 'medium_19m3',
          containerCount: 1,
          storageDuration: '1_to_3_months',
          billingCycle: 'monthly',
          completed: false,
        },
        {
          id: 'drop-103',
          sessionId: 'sess-84922',
          timestamp: new Date(Date.now() - 3600000 * 1.8).toISOString(),
          lastPageStep: 5,
          lastPageName: 'Page 5: Send Quote (Contact Details)',
          originSuburb: 'Glenelg',
          originPostcode: '5045',
          serviceType: 'storage_at_place',
          containerSize: 'large_25m3',
          containerCount: 2,
          storageDuration: '4_to_11_months',
          billingCycle: 'monthly',
          customerEmail: 'david.m@example.com',
          completed: false,
        },
      ];
      saveDropOffRecords(seedDropOffs);
      return seedDropOffs;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load drop-off records:', err);
    return [];
  }
}

export function saveDropOffRecords(records: QuoteDropOffRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_DROPOFFS, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save drop-off records:', err);
  }
}

export function recordDropOffEvent(event: Omit<QuoteDropOffRecord, 'id' | 'timestamp'>): void {
  try {
    const existing = loadDropOffRecords();
    const index = existing.findIndex((r) => r.sessionId === event.sessionId);
    const updatedRecord: QuoteDropOffRecord = {
      id: index >= 0 ? existing[index].id : `drop-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...event,
    };

    let nextList: QuoteDropOffRecord[];
    if (index >= 0) {
      nextList = [...existing];
      nextList[index] = updatedRecord;
    } else {
      nextList = [updatedRecord, ...existing];
    }
    // Cap at 100 recent sessions
    saveDropOffRecords(nextList.slice(0, 100));
  } catch (err) {
    console.error('Failed to record drop-off event:', err);
  }
}

export function getMetroHubForPostcode(record: PostcodeRecord): MetroHub {
  if (record.state === 'SA') return 'Adelaide';
  if (record.state === 'VIC') return 'Melbourne';
  if (record.state === 'NSW' || record.state === 'ACT') return 'Sydney';
  if (record.state === 'QLD') {
    const pc = parseInt(record.postcode, 10);
    if (pc >= 4550 && pc <= 4575) return 'Sunshine Coast';
    return 'Brisbane/Gold Coast';
  }
  return 'Sydney';
}

/**
 * Check if a postcode is blocked by admin
 */
export function isPostcodeBlocked(
  postcode: string,
  config: AppConfig
): BlockedPostcode | null {
  const clean = postcode.trim();
  const found = config.blockedPostcodes.find((b) => b.postcode === clean);
  return found || null;
}

/**
 * Core Quote Calculation Engine
 */
export function calculateQuote(params: {
  originPostcode: PostcodeRecord;
  destinationPostcode?: PostcodeRecord;
  serviceType: ServiceType;
  containerSize: ContainerSizeId;
  containerCount?: number;
  billingCycle?: BillingCycle;
  storageDuration: StorageDuration;
  preferredDate: string;
  selectedSlot?: DeliverySlotWindow;
  boxesCount?: number;
  blanketsCount?: number;
  appliedPromoCode?: string;
  includeFuelSurcharge?: boolean;
  config?: AppConfig;
}): QuoteBreakdown {
  const config = params.config || loadAppConfig();
  const {
    originPostcode,
    destinationPostcode,
    serviceType,
    containerSize,
    storageDuration,
    preferredDate,
    appliedPromoCode,
  } = params;

  // Determine billing cycle: If duration is '2_weeks', default to weekly. Otherwise use explicit cycle or monthly.
  const billingCycle: BillingCycle =
    params.billingCycle || (storageDuration === '2_weeks' ? 'weekly' : 'monthly');
  const isWeekly = billingCycle === 'weekly';

  // 1. Closest depot & driving distance for origin (Road driving distance, not as the crow flies)
  const { depot: originDepot, distanceKm: originDistanceKm } = findClosestDepot(
    originPostcode.lat,
    originPostcode.lng,
    originPostcode.postcode
  );

  // 2. Zone determination based on depot driving distance for local delivery
  const { zone1MaxKm, zone1RatePerKm, zone2MaxKm, zone2RatePerKm, zone3MaxKm, zone3RatePerKm, zone4CallPricing } = config.deliveryZones;

  let deliveryZone = 1;
  let kmRate = zone1RatePerKm;
  let requiresCallForPricing = false;

  if (originDistanceKm <= zone1MaxKm) {
    deliveryZone = 1;
    kmRate = zone1RatePerKm;
  } else if (originDistanceKm <= zone2MaxKm) {
    deliveryZone = 2;
    kmRate = zone2RatePerKm;
  } else if (originDistanceKm <= zone3MaxKm) {
    deliveryZone = 3;
    kmRate = zone3RatePerKm;
  } else {
    deliveryZone = 4;
    if (zone4CallPricing) {
      requiresCallForPricing = true;
    }
  }

  // Determine container count: explicitly passed, or combo / 2x large defaults
  let containerCount = params.containerCount && params.containerCount > 0 ? params.containerCount : 1;
  if (containerSize === 'combo_35m3' || containerSize === 'two_large_50m3') {
    containerCount = 2;
  }

  // Depot delivery km charge: assessed per container if multiple containers
  let kmTotalCharge = 0;
  if (deliveryZone === 2 || deliveryZone === 3) {
    kmTotalCharge = Math.round(originDistanceKm * kmRate) * containerCount;
  }

  // 3. Moving road driving distance from origin to destination (calculated on a one-way basis using road routes, not as the crow flies)
  let movingDistanceKm: number | undefined;
  let movingDeliveryZone: number | undefined;
  let movingKmRatePerContainer = 0;
  let movingKmCharge = 0;

  // Fuel surcharge configuration ($0.50/km travelled) - strictly set by Portabox admin (not optional for customer)
  const isFuelSurchargeIncluded = config.fuelSurchargeEnabled !== false;
  const fuelSurchargeRatePerKm = config.fuelSurchargeRatePerKm || 0.50;
  let fuelSurchargePerContainer = 0;
  let fuelSurchargeAmount = 0;

  if (destinationPostcode) {
    // Exact road driving distance
    movingDistanceKm = calculateDrivingDistance(
      originPostcode.lat,
      originPostcode.lng,
      destinationPostcode.lat,
      destinationPostcode.lng,
      originPostcode.postcode,
      destinationPostcode.postcode
    );

    if (movingDistanceKm <= zone1MaxKm) {
      movingDeliveryZone = 1;
      movingKmRatePerContainer = 0;
    } else if (movingDistanceKm <= zone2MaxKm) {
      movingDeliveryZone = 2;
      movingKmRatePerContainer = Math.round(movingDistanceKm * zone2RatePerKm);
    } else if (movingDistanceKm <= zone3MaxKm) {
      movingDeliveryZone = 3;
      movingKmRatePerContainer = Math.round(movingDistanceKm * zone3RatePerKm);
    } else {
      movingDeliveryZone = 4;
      if (zone4CallPricing) {
        requiresCallForPricing = true;
      }
    }

    // Extra delivery charge per km is assessed per container if multiple containers
    movingKmCharge = movingKmRatePerContainer * containerCount;

    // Fuel surcharge per km travelled ($0.50 per km) assessed per container
    if (isFuelSurchargeIncluded && movingDistanceKm > 0) {
      fuelSurchargePerContainer = Math.round(movingDistanceKm * fuelSurchargeRatePerKm * 100) / 100;
      fuelSurchargeAmount = fuelSurchargePerContainer * containerCount;
    }
  } else {
    // For local storage without move, if outside Zone 1 and fuel surcharge is enabled
    if (isFuelSurchargeIncluded && originDistanceKm > zone1MaxKm) {
      fuelSurchargePerContainer = Math.round(originDistanceKm * fuelSurchargeRatePerKm * 100) / 100;
      fuelSurchargeAmount = fuelSurchargePerContainer * containerCount;
    }
  }

  // 4. Interstate detection & rates
  const originHub = getMetroHubForPostcode(originPostcode);
  let isInterstate = false;
  let interstateRouteName: string | undefined;
  let interstateFee = 0;

  if (destinationPostcode) {
    const destHub = getMetroHubForPostcode(destinationPostcode);
    if (originHub !== destHub) {
      isInterstate = true;
      interstateRouteName = `${originHub}->${destHub}`;
      interstateFee = config.interstateRates[interstateRouteName] || 2500;
      requiresCallForPricing = false;
    }
  }

  // 5. Container pricing (10m³, 19m³, 25m³, combo 35m³, 2x large 50m³)
  let monthlyContainerRate = 0;
  let weeklyContainerRate = 0;
  let monthlyRatePerContainer = 0;
  let weeklyRatePerContainer = 0;
  let containerName = '25 m³ Portabox';
  let containerVolume = '25 m³';
  let containerDimensions = CONTAINER_SPECS.large_25m3;

  switch (containerSize) {
    case 'small_10m3':
      monthlyRatePerContainer = config.containerPrices.small_10m3.monthlyRate;
      weeklyRatePerContainer = config.containerPrices.small_10m3.weeklyRate;
      monthlyContainerRate = monthlyRatePerContainer * containerCount;
      weeklyContainerRate = weeklyRatePerContainer * containerCount;
      containerName = containerCount > 1 ? `${containerCount} x 10 m³ Portabox` : '10 m³ Portabox';
      containerVolume = containerCount > 1 ? `${10 * containerCount} m³ (${containerCount} containers)` : '10 m³';
      containerDimensions = CONTAINER_SPECS.small_10m3;
      break;
    case 'medium_19m3':
      monthlyRatePerContainer = config.containerPrices.medium_19m3.monthlyRate;
      weeklyRatePerContainer = config.containerPrices.medium_19m3.weeklyRate;
      monthlyContainerRate = monthlyRatePerContainer * containerCount;
      weeklyContainerRate = weeklyRatePerContainer * containerCount;
      containerName = containerCount > 1 ? `${containerCount} x 19 m³ Portabox` : '19 m³ Portabox';
      containerVolume = containerCount > 1 ? `${19 * containerCount} m³ (${containerCount} containers)` : '19 m³';
      containerDimensions = CONTAINER_SPECS.medium_19m3;
      break;
    case 'large_25m3':
      monthlyRatePerContainer = config.containerPrices.large_25m3.monthlyRate;
      weeklyRatePerContainer = config.containerPrices.large_25m3.weeklyRate;
      monthlyContainerRate = monthlyRatePerContainer * containerCount;
      weeklyContainerRate = weeklyRatePerContainer * containerCount;
      containerName = containerCount > 1 ? `${containerCount} x 25 m³ Portabox` : '25 m³ Portabox';
      containerVolume = containerCount > 1 ? `${25 * containerCount} m³ (${containerCount} containers)` : '25 m³';
      containerDimensions = CONTAINER_SPECS.large_25m3;
      break;
    case 'combo_35m3':
      containerCount = 2;
      monthlyRatePerContainer = Math.round(
        (config.containerPrices.large_25m3.monthlyRate + config.containerPrices.small_10m3.monthlyRate) / 2
      );
      weeklyRatePerContainer = Math.round(
        (config.containerPrices.large_25m3.weeklyRate + config.containerPrices.small_10m3.weeklyRate) / 2
      );
      monthlyContainerRate =
        config.containerPrices.large_25m3.monthlyRate + config.containerPrices.small_10m3.monthlyRate;
      weeklyContainerRate =
        config.containerPrices.large_25m3.weeklyRate + config.containerPrices.small_10m3.weeklyRate;
      containerName = '35 m³ Combo';
      containerVolume = '35 m³ (2 containers)';
      containerDimensions = CONTAINER_SPECS.combo_35m3;
      break;
    case 'two_large_50m3':
      containerCount = 2;
      monthlyRatePerContainer = config.containerPrices.large_25m3.monthlyRate;
      weeklyRatePerContainer = config.containerPrices.large_25m3.weeklyRate;
      monthlyContainerRate = monthlyRatePerContainer * 2;
      weeklyContainerRate = weeklyRatePerContainer * 2;
      containerName = '50 m³ (2 x 25 m³)';
      containerVolume = '50 m³ (2 containers)';
      containerDimensions = CONTAINER_SPECS.two_large_50m3;
      break;
  }

  // Transparent storage pricing text
  let storagePricingText = '';
  if (containerSize === 'combo_35m3') {
    storagePricingText = isWeekly
      ? `$75/wk (25 m³) + $69/wk (10 m³) = $${weeklyContainerRate}/wk total`
      : `$219/mo (25 m³) + $209/mo (10 m³) = $${monthlyContainerRate}/mo total`;
  } else if (containerCount > 1) {
    storagePricingText = isWeekly
      ? `$${weeklyRatePerContainer}/wk per container × ${containerCount} containers = $${weeklyContainerRate}/wk total`
      : `$${monthlyRatePerContainer}/mo per container × ${containerCount} containers = $${monthlyContainerRate}/mo total`;
  } else {
    storagePricingText = isWeekly
      ? `$${weeklyRatePerContainer} /week`
      : `$${monthlyRatePerContainer} /month`;
  }

  // 6. Packing Supplies (Boxes & Blanket Rentals)
  const boxesCount = params.boxesCount || 0;
  const blanketsCount = params.blanketsCount || 0;
  const boxesPrice = calculateBoxPrice(boxesCount, config.packingSupplies);
  const blanketsPrice = calculateBlanketPrice(blanketsCount, config.packingSupplies);
  const totalSuppliesPrice = boxesPrice + blanketsPrice;

  const packingSupplies: PackingSuppliesOrder = {
    boxesCount,
    boxesPrice,
    blanketsCount,
    blanketsPrice,
    totalSuppliesPrice,
  };

  // 7. Domestic & Interstate transport legs ($149 per container per one-way leg)
  const domesticLegFee = config.domesticLegFee; // $149
  const legBaseFee = domesticLegFee * containerCount;
  const deliveryPricingText = containerCount > 1
    ? `$${domesticLegFee} per container × ${containerCount} containers = $${legBaseFee} total per leg`
    : `$${domesticLegFee} per one-way leg`;

  const legs: QuoteLegBreakdown[] = [];

  if (serviceType === 'storage_at_place') {
    // Keep it at your place:
    // 1. Initial delivery empty -> Payable now
    // 2. Final pick up empty -> Payable at collection
    const initialFee = legBaseFee + kmTotalCharge + (isFuelSurchargeIncluded ? fuelSurchargeAmount : 0);
    legs.push({
      label: `Delivery to ${originPostcode.suburb} (empty)`,
      description: `${preferredDate} · ${originHub} zone ${deliveryZone} (${containerCount > 1 ? `$${domesticLegFee}/container × ${containerCount} = $${legBaseFee}` : 'one-way leg'}${kmTotalCharge > 0 ? ` + $${kmTotalCharge} distance fee` : ''}${isFuelSurchargeIncluded && fuelSurchargeAmount > 0 ? ` + $${fuelSurchargeAmount} fuel surcharge` : ''})`,
      fee: initialFee,
      isPayableNow: true,
      feePerContainer: domesticLegFee,
      containerCount,
      baseFee: legBaseFee,
      extraKmCharge: kmTotalCharge > 0 ? kmTotalCharge : undefined,
      fuelSurcharge: isFuelSurchargeIncluded && fuelSurchargeAmount > 0 ? fuelSurchargeAmount : undefined,
    });
    legs.push({
      label: "Collection when you're done (empty)",
      description: `Payable at the end of storage (${containerCount > 1 ? `$${domesticLegFee}/container × ${containerCount} = $${legBaseFee}` : 'one-way leg'})`,
      fee: legBaseFee,
      isPayableNow: false,
      feePerContainer: domesticLegFee,
      containerCount,
      baseFee: legBaseFee,
    });
  } else if (serviceType === 'storage_facility') {
    // ONLY storage at Portabox facility uses 'Transport to Portabox storage facility (full)'
    const initialFee = legBaseFee + kmTotalCharge + (isFuelSurchargeIncluded ? fuelSurchargeAmount : 0);
    legs.push({
      label: `Initial delivery to ${originPostcode.suburb} (empty)`,
      description: `Delivery of empty container for packing (${containerCount > 1 ? `$${domesticLegFee}/container × ${containerCount} = $${legBaseFee}` : 'one-way leg'}${kmTotalCharge > 0 ? ` + $${kmTotalCharge} distance fee` : ''}${isFuelSurchargeIncluded && fuelSurchargeAmount > 0 ? ` + $${fuelSurchargeAmount} fuel surcharge` : ''})`,
      fee: initialFee,
      isPayableNow: true,
      feePerContainer: domesticLegFee,
      containerCount,
      baseFee: legBaseFee,
      extraKmCharge: kmTotalCharge > 0 ? kmTotalCharge : undefined,
      fuelSurcharge: isFuelSurchargeIncluded && fuelSurchargeAmount > 0 ? fuelSurchargeAmount : undefined,
    });
    legs.push({
      label: 'Transport to Portabox storage facility (full)',
      description: `Move full container to secure Portabox depot storage (${containerCount > 1 ? `$${domesticLegFee}/container × ${containerCount} = $${legBaseFee}` : 'one-way leg'})`,
      fee: legBaseFee,
      isPayableNow: false,
      feePerContainer: domesticLegFee,
      containerCount,
      baseFee: legBaseFee,
    });
    legs.push({
      label: 'Redelivery from facility when ready (full)',
      description: `Drop off at your address when you need items back (${containerCount > 1 ? `$${domesticLegFee}/container × ${containerCount} = $${legBaseFee}` : 'one-way leg'})`,
      fee: legBaseFee,
      isPayableNow: false,
      feePerContainer: domesticLegFee,
      containerCount,
      baseFee: legBaseFee,
    });
    legs.push({
      label: 'Final pickup of empty container',
      description: `Collect empty container after you unpack (${containerCount > 1 ? `$${domesticLegFee}/container × ${containerCount} = $${legBaseFee}` : 'one-way leg'})`,
      fee: legBaseFee,
      isPayableNow: false,
      feePerContainer: domesticLegFee,
      containerCount,
      baseFee: legBaseFee,
    });
  } else {
    // Both 'moving' and 'moving_storage' (A to B move):
    // Do NOT charge them to go back to the warehouse!
    // Never use "Transport to Portabox storage facility (full)" for an A to B move or interstate move!

    // Leg 1: Initial empty delivery to origin
    legs.push({
      label: `Initial delivery to ${originPostcode.suburb} (empty)`,
      description: `Deliver empty container for packing (${containerCount > 1 ? `$${domesticLegFee}/container × ${containerCount} = $${legBaseFee}` : 'one-way leg'}${kmTotalCharge > 0 ? ` + $${kmTotalCharge} distance fee` : ''})`,
      fee: legBaseFee + kmTotalCharge,
      isPayableNow: true,
      feePerContainer: domesticLegFee,
      containerCount,
      baseFee: legBaseFee,
      extraKmCharge: kmTotalCharge > 0 ? kmTotalCharge : undefined,
    });

    if (isInterstate) {
      // Interstate move: direct line-haul, no warehouse detour
      const interstateTotalFee = interstateFee * containerCount;
      legs.push({
        label: `Interstate transport (${originHub} → ${getMetroHubForPostcode(destinationPostcode!)})`,
        description: `${movingDistanceKm ? `${movingDistanceKm} km driving · ` : ''}Direct interstate line-haul freight (matrix rate: $${interstateFee}${containerCount > 1 ? ` × ${containerCount} = $${interstateTotalFee}` : ''})`,
        fee: interstateTotalFee,
        isPayableNow: false,
        feePerContainer: interstateFee,
        containerCount,
        baseFee: interstateTotalFee,
      });
      legs.push({
        label: `Final delivery & collection at ${destinationPostcode?.suburb || 'Destination'} (empty)`,
        description: `Redelivery and final collection at destination (${containerCount > 1 ? `$${domesticLegFee}/container × ${containerCount} = $${legBaseFee}` : 'one-way leg'})`,
        fee: legBaseFee,
        isPayableNow: false,
        feePerContainer: domesticLegFee,
        containerCount,
        baseFee: legBaseFee,
      });
    } else {
      // Direct Local / Intrastate A to B move (e.g. Hyde Park to Victor Harbor)
      // Direct transport from origin to destination without warehouse detour!
      const movingRate = movingDeliveryZone === 2 ? zone2RatePerKm : zone3RatePerKm;
      const destinationSuburb = destinationPostcode?.suburb || 'Destination';

      let movingLegDesc = '';
      if (movingKmCharge > 0 && movingDistanceKm) {
        movingLegDesc = `Base: ${containerCount > 1 ? `$${domesticLegFee}/container × ${containerCount} = $${legBaseFee}` : `$${domesticLegFee}`} + Distance (${movingDistanceKm} km driving @ $${movingRate}/km): ${containerCount > 1 ? `$${movingKmRatePerContainer}/container × ${containerCount} = $${movingKmCharge}` : `$${movingKmCharge}`}${isFuelSurchargeIncluded && fuelSurchargeAmount > 0 ? ` + Fuel surcharge ($${fuelSurchargeRatePerKm.toFixed(2)}/km): ${containerCount > 1 ? `$${fuelSurchargePerContainer}/container × ${containerCount} = $${fuelSurchargeAmount}` : `$${fuelSurchargeAmount}`}` : ''}`;
      } else {
        movingLegDesc = `Direct move from ${originPostcode.suburb} to ${destinationSuburb} (${movingDistanceKm} km driving)${isFuelSurchargeIncluded && fuelSurchargeAmount > 0 ? ` + Fuel surcharge: $${fuelSurchargeAmount}` : ''}`;
      }

      const totalMoveFee = legBaseFee + movingKmCharge + (isFuelSurchargeIncluded ? fuelSurchargeAmount : 0);

      legs.push({
        label: `Move to ${destinationSuburb} (full)`,
        description: movingLegDesc,
        fee: totalMoveFee,
        isPayableNow: false,
        feePerContainer: domesticLegFee + movingKmRatePerContainer + (isFuelSurchargeIncluded ? fuelSurchargePerContainer : 0),
        containerCount,
        baseFee: legBaseFee,
        extraKmCharge: movingKmCharge > 0 ? movingKmCharge : undefined,
        extraKmDistanceKm: movingDistanceKm,
        fuelSurcharge: isFuelSurchargeIncluded && fuelSurchargeAmount > 0 ? fuelSurchargeAmount : undefined,
      });

      legs.push({
        label: `Final pickup of empty container at ${destinationSuburb}`,
        description: `Collect container once unpacked at ${destinationSuburb} (${containerCount > 1 ? `$${domesticLegFee}/container × ${containerCount} = $${legBaseFee}` : 'one-way leg'})`,
        fee: legBaseFee,
        isPayableNow: false,
        feePerContainer: domesticLegFee,
        containerCount,
        baseFee: legBaseFee,
      });
    }
  }

  // 8. Calculate initial charges based on billing cycle (All billing is in advance)
  const initialDeliveryFee = legs[0]?.fee || legBaseFee;

  // Periodic container fee calculation and savings vs weekly
  let currentPeriodicStorageFee = 0;
  let billingCycleLabel = 'Monthly';
  let billingCycleSavingsText = '';
  let upfrontMonths: number | undefined;
  let upfrontDiscountPercent: number | undefined;

  const monthlyCostOnWeeklyRate = Math.round(weeklyContainerRate * (52 / 12));

  switch (billingCycle) {
    case 'weekly':
      currentPeriodicStorageFee = storageDuration === '2_weeks' ? weeklyContainerRate * 2 : weeklyContainerRate;
      billingCycleLabel = 'Weekly';
      billingCycleSavingsText = 'Standard base rate';
      break;

    case 'monthly':
      currentPeriodicStorageFee = monthlyContainerRate;
      billingCycleLabel = 'Monthly';
      const monthlySavings = monthlyCostOnWeeklyRate - monthlyContainerRate;
      billingCycleSavingsText = `Save $${monthlySavings}/month vs weekly (${Math.round((monthlySavings / monthlyCostOnWeeklyRate) * 100)}% off)`;
      break;

    case '3_months_upfront':
      upfrontMonths = 3;
      upfrontDiscountPercent = 5;
      currentPeriodicStorageFee = Math.round(monthlyContainerRate * 3 * 0.95);
      billingCycleLabel = '3 Months Upfront then Monthly';
      const threeMonthsWeeklyTotal = weeklyContainerRate * 13;
      const threeMonthsSavings = threeMonthsWeeklyTotal - currentPeriodicStorageFee;
      billingCycleSavingsText = `Save $${threeMonthsSavings} vs weekly over 3 months (${Math.round((threeMonthsSavings / threeMonthsWeeklyTotal) * 100)}% off)`;
      break;

    case '6_months_upfront':
      upfrontMonths = 6;
      upfrontDiscountPercent = 10;
      currentPeriodicStorageFee = Math.round(monthlyContainerRate * 6 * 0.90);
      billingCycleLabel = '6 Months Upfront then Monthly';
      const sixMonthsWeeklyTotal = weeklyContainerRate * 26;
      const sixMonthsSavings = sixMonthsWeeklyTotal - currentPeriodicStorageFee;
      billingCycleSavingsText = `Save $${sixMonthsSavings} vs weekly over 6 months (${Math.round((sixMonthsSavings / sixMonthsWeeklyTotal) * 100)}% off)`;
      break;

    case '12_months_upfront':
      upfrontMonths = 12;
      upfrontDiscountPercent = 15;
      currentPeriodicStorageFee = Math.round(monthlyContainerRate * 12 * 0.85);
      billingCycleLabel = '12 Months Paid Upfront then Monthly';
      const twelveMonthsWeeklyTotal = weeklyContainerRate * 52;
      const twelveMonthsSavings = twelveMonthsWeeklyTotal - currentPeriodicStorageFee;
      billingCycleSavingsText = `Save $${twelveMonthsSavings} vs weekly over 12 months (${Math.round((twelveMonthsSavings / twelveMonthsWeeklyTotal) * 100)}% off)`;
      break;
  }

  // 9. Promotions (Strictly ONE promo/discount applied at a time, including Eco Discount)
  interface PromoCandidate {
    rule: PromotionRule;
    discountAmount: number;
    description: string;
    isExplicitCode: boolean;
  }
  const candidates: PromoCandidate[] = [];

  config.promotions
    .filter((p) => p.active)
    .forEach((promo) => {
      let isEligible = false;
      const isExplicitCode = Boolean(
        promo.code && appliedPromoCode && promo.code.toUpperCase() === appliedPromoCode.trim().toUpperCase()
      );

      if (isExplicitCode) {
        isEligible = true;
      } else if (promo.autoApply && !promo.code) {
        isEligible = true;
      }

      if (promo.targetHubOrigin && promo.targetHubOrigin !== originHub) {
        isEligible = false;
      }
      if (promo.targetHubDestination && destinationPostcode) {
        const destHub = getMetroHubForPostcode(destinationPostcode);
        if (promo.targetHubDestination !== destHub) {
          isEligible = false;
        }
      }

      if (promo.targetPostcode && promo.targetRadiusKm) {
        const targetCoords = originPostcode.postcode === promo.targetPostcode;
        if (!targetCoords && originDistanceKm > promo.targetRadiusKm) {
          isEligible = false;
        }
      }

      if (promo.minDurationMonths) {
        if (storageDuration === '2_weeks' && promo.minDurationMonths > 0.5) isEligible = false;
        if (storageDuration === '1_to_3_months' && promo.minDurationMonths > 3) isEligible = false;
        if (storageDuration === '4_to_11_months' && promo.minDurationMonths > 11) isEligible = false;
      }

      if (isEligible) {
        let discount = 0;
        let desc = '';

        if (promo.type === 'free_initial_delivery') {
          discount = initialDeliveryFee;
          desc = 'Free initial delivery ($149 saving)';
        } else if (promo.type === 'percent_off_first_month') {
          discount = Math.round((currentPeriodicStorageFee * promo.value) / 100);
          desc = `${promo.value}% off first period storage ($${discount} saving)`;
        } else if (promo.type === 'free_first_month') {
          discount = currentPeriodicStorageFee;
          desc = `First period storage free ($${discount} saving)`;
        } else if (promo.type === 'percent_off_interstate' && isInterstate && interstateFee > 0) {
          discount = Math.round((interstateFee * promo.value) / 100);
          desc = `${promo.value}% off interstate move fee ($${discount} saving)`;
        } else if (promo.type === 'free_container_upgrade' && containerSize === 'large_25m3') {
          discount = 10;
          desc = 'Free upgrade to 25 m³ for 19 m³ price ($10 saving)';
        } else if (promo.type === 'fixed_discount') {
          discount = promo.value;
          desc = `$${promo.value} promotional discount`;
        }

        if (discount > 0) {
          candidates.push({
            rule: promo,
            discountAmount: discount,
            description: desc,
            isExplicitCode,
          });
        }
      }
    });

  // 9b. Routing Efficiency & CO2 Emissions Calculation
  const efficiencyDiscountPct = config.efficiencyDiscountPercentage !== undefined ? config.efficiencyDiscountPercentage : 20;
  const ecoIncentiveType = config.ecoIncentiveType || 'dollar_discount';
  let ecoEmissionsInfo: QuoteBreakdown['ecoEmissionsInfo'] = undefined;

  if (params.selectedSlot) {
    const slotIncentive = getSlotEfficiencyIncentive(
      params.selectedSlot.id,
      originPostcode.postcode,
      efficiencyDiscountPct,
      ecoIncentiveType
    );

    if (slotIncentive.isBestValue) {
      ecoEmissionsInfo = {
        isBestValue: true,
        co2SavedKg: slotIncentive.co2SavedKg,
        co2SavedText: slotIncentive.co2SavedText,
        reason: slotIncentive.reason,
        incentiveMode: ecoIncentiveType,
        discountPercent: efficiencyDiscountPct,
        discountAud: slotIncentive.discountAud,
      };

      // Only add as a candidate dollar discount if incentive mode is dollar_discount
      if (ecoIncentiveType === 'dollar_discount' && slotIncentive.discountAud > 0) {
        candidates.push({
          rule: {
            id: 'promo-efficiency-slot',
            name: `Best Value / Eco-Route Incentive (${efficiencyDiscountPct}%)`,
            code: 'ECO_ROUTE',
            description: `${efficiencyDiscountPct}% of fleet logistics efficiency savings passed directly to you`,
            type: 'fixed_discount',
            value: slotIncentive.discountAud,
            active: true,
            autoApply: true,
          },
          discountAmount: slotIncentive.discountAud,
          description: `Best Value Window (${efficiencyDiscountPct}% Efficiency Incentive: -$${slotIncentive.discountAud}) · 🌱 ${slotIncentive.co2SavedText}`,
          isExplicitCode: false,
        });
      }
    }
  }

  // 9c. Enforce Single Promotion Rule (Exactly ONE promotion/discount active at a time, including Eco discount)
  const appliedPromotions: {
    rule: PromotionRule;
    discountAmount: number;
    description: string;
  }[] = [];

  if (candidates.length > 0) {
    // If customer explicitly entered a promo code, that takes precedence over auto-applied eco discount
    const explicitCandidate = candidates.find((c) => c.isExplicitCode);
    if (explicitCandidate) {
      appliedPromotions.push({
        rule: explicitCandidate.rule,
        discountAmount: explicitCandidate.discountAmount,
        description: explicitCandidate.description,
      });
    } else {
      // Otherwise, apply the single highest discount candidate
      candidates.sort((a, b) => b.discountAmount - a.discountAmount);
      appliedPromotions.push({
        rule: candidates[0].rule,
        discountAmount: candidates[0].discountAmount,
        description: candidates[0].description,
      });
    }
  }

  const totalDiscount = appliedPromotions.reduce((sum, p) => sum + p.discountAmount, 0);

  // 10. First Payment Total: Periodic rent + initial delivery + packing supplies - discounts
  let firstPaymentTotal =
    currentPeriodicStorageFee + initialDeliveryFee + totalSuppliesPrice - totalDiscount;
  if (firstPaymentTotal < 0) firstPaymentTotal = 0;

  const collectionFeeEstimate = legs[legs.length - 1]?.fee || legBaseFee;

  const storageRateFormatted = isWeekly
    ? `$${weeklyContainerRate} /week`
    : `$${monthlyContainerRate} /month`;

  const summaryText = `${containerCount > 1 ? containerName : `1 x ${containerName}`} (${containerVolume}) · ${
    serviceType === 'storage_at_place'
      ? 'Storage at your place'
      : serviceType === 'storage_facility'
      ? 'Storage at Portabox facility'
      : serviceType === 'moving'
      ? `Moving door to door${destinationPostcode ? ` to ${destinationPostcode.suburb} ${destinationPostcode.postcode}` : ''}`
      : `Moving and storage${destinationPostcode ? ` to ${destinationPostcode.suburb} ${destinationPostcode.postcode}` : ''}`
  } · ${isWeekly ? 'Weekly rate' : 'Monthly rate'} · ${originHub} zone ${deliveryZone}`;

  const smsPreviewText = `Hi [Customer], here's your Portabox quote: ${containerName} (${containerVolume}) at ${
    originPostcode.suburb
  }, ${storageRateFormatted}, delivery $${initialDeliveryFee}, first payment $${firstPaymentTotal}. Full breakdown: portabox.au/q/${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}. Reply here with any questions, or reply BOOK to lock in ${preferredDate}.`;

  return {
    containerSize,
    containerCount,
    containerName,
    containerVolume,
    containerDimensions,
    serviceType,
    billingCycle,
    billingCycleLabel,
    billingCycleSavingsText,
    upfrontMonths,
    upfrontDiscountPercent,
    storageDuration,
    preferredDate,
    originPostcode,
    destinationPostcode,
    originDepot,
    originDistanceKm,
    deliveryZone,
    movingDistanceKm,
    movingDeliveryZone,
    movingKmCharge,
    movingKmRatePerContainer,
    isInterstate,
    interstateRouteName,
    interstateFee: isInterstate ? interstateFee : undefined,
    kmRatePerKm: kmRate,
    kmTotalCharge,
    requiresCallForPricing,
    monthlyContainerRate,
    weeklyContainerRate,
    monthlyRatePerContainer,
    weeklyRatePerContainer,
    storageRateFormatted,
    storagePricingText,
    domesticLegFeePerContainer: domesticLegFee,
    deliveryPricingText,
    fuelSurchargeRatePerKm,
    fuelSurchargeAmount,
    fuelSurchargePerContainer,
    isFuelSurchargeIncluded,
    distanceCalculationMethod: 'driving_distance' as const,
    packingSupplies,
    legs,
    initialDeliveryFee,
    firstPaymentTotal,
    monthlyStorageFee: monthlyContainerRate,
    weeklyStorageFee: weeklyContainerRate,
    currentPeriodicStorageFee,
    collectionFeeEstimate,
    appliedPromotions,
    totalDiscount,
    appliedPromoCode: params.appliedPromoCode,
    summaryText,
    smsPreviewText,
    selectedSlot: params.selectedSlot,
    ecoEmissionsInfo,
  };
}
