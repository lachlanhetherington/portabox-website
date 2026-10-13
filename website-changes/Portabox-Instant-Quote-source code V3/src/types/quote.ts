import { PostcodeRecord, DepotLocation } from '../data/australianPostcodes';

export type ServiceType = 
  | 'storage_at_place' 
  | 'storage_facility' 
  | 'moving' 
  | 'moving_storage';

export type ContainerSizeId = 
  | 'small_10m3' 
  | 'medium_19m3' 
  | 'large_25m3' 
  | 'combo_35m3' 
  | 'two_large_50m3';

export type BillingCycle = 
  | 'weekly'
  | 'monthly'
  | '3_months_upfront'
  | '6_months_upfront'
  | '12_months_upfront';

export type StorageDurationUnit = 'months' | 'weeks';

export type StorageDuration = 
  | '2_weeks' 
  | '1_to_3_months' 
  | '4_to_11_months' 
  | '12_plus_months'
  | string; // Allows '1_month', '2_months', '3_weeks', etc.

export type MetroHub = 
  | 'Adelaide' 
  | 'Melbourne' 
  | 'Sydney' 
  | 'Brisbane/Gold Coast' 
  | 'Sunshine Coast';

export interface PromotionRule {
  id: string;
  name: string;
  code?: string;
  description: string;
  type: 
    | 'free_first_month'
    | 'free_third_month'
    | 'free_initial_delivery'
    | 'percent_off_first_month'
    | 'percent_off_interstate'
    | 'free_container_upgrade'
    | 'fixed_discount';
  value: number; // e.g. 50 for 50%, or 100 for $100
  targetPostcode?: string;
  targetRadiusKm?: number;
  targetHubOrigin?: MetroHub;
  targetHubDestination?: MetroHub;
  minDurationMonths?: number;
  active: boolean;
  autoApply: boolean;
}

export interface BlockedPostcode {
  postcode: string;
  suburb: string;
  reason: string;
}

export interface DeliveryZoneSettings {
  zone1MaxKm: number;
  zone1RatePerKm: number;
  zone2MaxKm: number;
  zone2RatePerKm: number;
  zone3MaxKm: number;
  zone3RatePerKm: number;
  zone4CallPricing: boolean;
}

export interface ContainerPriceConfig {
  monthlyRate: number;
  weeklyRate: number;
}

export interface PackingSuppliesConfig {
  boxSinglePrice: number;
  box10Price: number;
  box50Price: number;
  box100Price: number;
  blanketSinglePrice: number;
  blanket10Price: number;
  blanket50Price: number;
  blanket100Price: number;
}

export interface DeliverySlotWindow {
  id: string; // 'morning' | 'midday' | 'afternoon'
  label: string; // e.g. "Morning Window"
  timeRange: string; // e.g. "8:00 AM – 10:30 AM"
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  available: boolean;
  slotsRemaining: number;
}

export interface DepotCalendarConfig {
  depotId: string;
  depotName: string;
  calendarId: string; // e.g. 'primary' or Google calendar email
  timeZone: string;
  dailyMaxSlots: number;
}

export interface AppConfig {
  containerPrices: {
    small_10m3: ContainerPriceConfig;
    medium_19m3: ContainerPriceConfig;
    large_25m3: ContainerPriceConfig;
  };
  packingSupplies: PackingSuppliesConfig;
  domesticLegFee: number;
  deliveryZones: DeliveryZoneSettings;
  interstateRates: Record<string, number>; // key: `${from}->${to}`
  fuelSurchargeRatePerKm: number; // default 0.50
  fuelSurchargeEnabled: boolean;
  promotions: PromotionRule[];
  blockedPostcodes: BlockedPostcode[];
  depotCalendars?: Record<string, DepotCalendarConfig>;
  braintreeMerchantId?: string;
  braintreeTokenizationKey?: string;
  braintreeEnvironment?: 'sandbox' | 'production';
  stripePublishableKey?: string;
  stripeLiveMode?: boolean;
  googlePayEnabled?: boolean;
  enableCallCenterDispatch?: boolean;
  efficiencyDiscountPercentage?: number;
  ecoIncentiveType?: 'dollar_discount' | 'emissions_only';
  phone: string;
}

export interface QuoteLegBreakdown {
  label: string;
  description: string;
  fee: number;
  isPayableNow: boolean; // First payment vs payable at collection
  feePerContainer?: number;
  containerCount?: number;
  baseFee?: number;
  extraKmCharge?: number;
  extraKmDistanceKm?: number;
  fuelSurcharge?: number;
}

export interface PackingSuppliesOrder {
  boxesCount: number;
  boxesPrice: number;
  blanketsCount: number;
  blanketsPrice: number;
  totalSuppliesPrice: number;
}

export interface QuoteBreakdown {
  containerSize: ContainerSizeId;
  containerCount: number;
  containerName: string;
  containerVolume: string;
  containerDimensions: {
    length: string;
    width: string;
    height: string;
    floorSpace: string;
    doorClearance: string;
    approxFit: string;
  };
  isUpgradedFrom?: string;
  serviceType: ServiceType;
  billingCycle: BillingCycle;
  billingCycleLabel?: string;
  billingCycleSavingsText?: string;
  upfrontMonths?: number;
  upfrontDiscountPercent?: number;
  storageDuration: StorageDuration;
  preferredDate: string;
  
  originPostcode: PostcodeRecord;
  destinationPostcode?: PostcodeRecord;
  originDepot: DepotLocation;
  originDistanceKm: number;
  deliveryZone: number; // 1, 2, 3, 4
  
  movingDistanceKm?: number; // Road driving distance between origin and destination
  movingDeliveryZone?: number;
  movingKmCharge?: number;
  movingKmRatePerContainer?: number;
  
  isInterstate: boolean;
  interstateRouteName?: string;
  interstateFee?: number;
  
  kmRatePerKm: number;
  kmTotalCharge: number;
  requiresCallForPricing: boolean;
  
  monthlyContainerRate: number;
  weeklyContainerRate: number;
  monthlyRatePerContainer: number;
  weeklyRatePerContainer: number;
  storageRateFormatted: string;
  storagePricingText: string;
  
  domesticLegFeePerContainer: number;
  deliveryPricingText: string;
  
  fuelSurchargeRatePerKm: number;
  fuelSurchargeAmount: number;
  fuelSurchargePerContainer: number;
  isFuelSurchargeIncluded: boolean;
  distanceCalculationMethod: 'driving_distance';
  
  packingSupplies: PackingSuppliesOrder;
  
  legs: QuoteLegBreakdown[];
  initialDeliveryFee: number;
  firstPaymentTotal: number;
  monthlyStorageFee: number;
  weeklyStorageFee: number;
  currentPeriodicStorageFee: number;
  collectionFeeEstimate: number;
  
  appliedPromotions: {
    rule: PromotionRule;
    discountAmount: number;
    description: string;
  }[];
  totalDiscount: number;
  appliedPromoCode?: string;
  
  summaryText: string;
  smsPreviewText: string;
  selectedSlot?: DeliverySlotWindow;
  calendarEventLink?: string;
  ecoEmissionsInfo?: {
    isBestValue: boolean;
    co2SavedKg: number;
    co2SavedText: string;
    reason: string;
    incentiveMode: 'dollar_discount' | 'emissions_only';
    discountPercent: number;
    discountAud: number;
  };
}

export interface CustomerLead {
  id: string;
  createdAt: string;
  firstName: string;
  lastName?: string;
  mobile: string;
  email: string;
  agreedToContact: boolean;
  status: 'New' | 'Contacted' | 'Booked' | 'Follow-up' | 'Archived';
  quote: QuoteBreakdown;
  selectedSlot?: DeliverySlotWindow;
  calendarEventLink?: string;
  dropOffPage?: string;
  notes?: string[];
  smsSent: boolean;
  emailSent: boolean;
  paymentStatus?: 'Pending' | 'Paid' | 'Failed';
  paymentTransactionId?: string;
  paymentAmount?: number;
  paymentMethod?: 'Credit Card (Stripe)' | 'Google Pay' | 'Apple Pay';
}

export interface QuoteDropOffRecord {
  id: string;
  sessionId: string;
  timestamp: string;
  lastPageStep: number;
  lastPageName: string;
  originSuburb?: string;
  originPostcode?: string;
  destinationSuburb?: string;
  destinationPostcode?: string;
  serviceType?: string;
  containerSize?: string;
  containerCount?: number;
  storageDuration?: string;
  billingCycle?: string;
  customerEmail?: string;
  customerPhone?: string;
  completed: boolean;
}
