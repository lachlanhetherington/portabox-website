import { QuoteBreakdown, DeliverySlotWindow } from '../types/quote';

export interface CustomerTransaction {
  id: string;
  invoiceNumber: string;
  date: string;
  description: string;
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  dueDate?: string;
  paymentMethod?: string;
  stripeTransactionId?: string;
  pdfUrl?: string;
}

export interface ContainerOrder {
  id: string;
  orderNumber: string;
  containerId: string;
  containerSize: string;
  containerName: string;
  serviceType: string;
  status: 'Scheduled' | 'Out for Delivery' | 'Placed at Customer' | 'Stored at Depot' | 'Collected' | 'Completed';
  location: string;
  originAddress: string;
  destinationAddress?: string;
  scheduledDeliveryDate: string; // e.g. "2026-10-15"
  deliveryWindow: string; // e.g. "2:00 PM – 4:30 PM (Afternoon Window)"
  driverName?: string;
  driverPhone?: string;
  timeToDeliveryHours: number; // approximate hours remaining from current time
  accessNotes?: string;
  history: {
    timestamp: string;
    stage: string;
    note: string;
  }[];
}

export interface CustomerAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  mobile: string;
  companyName?: string;
  address: string;
  suburb: string;
  state: string;
  postcode: string;
  memberSince: string;
  verified: boolean;
  passwordHash?: string; // Simulated for secure login
  
  // Quotes
  quotes: {
    id: string;
    quoteNumber: string;
    createdAt: string;
    validUntil: string;
    containerSize: string;
    containerCount: number;
    billingCycle: string;
    firstPaymentTotal: number;
    monthlyStorageFee: number;
    status: 'Draft' | 'Active' | 'Accepted' | 'Expired';
    quoteData: QuoteBreakdown;
  }[];

  // Active & Past Orders
  orders: ContainerOrder[];

  // Financial & Billing
  paymentPlan: {
    planType: '12_months_upfront' | '6_months_upfront' | '3_months_upfront' | 'monthly' | 'weekly';
    planLabel: string;
    autopayEnabled: boolean;
    cardBrand: string;
    cardLast4: string;
    cardExpiry: string;
    nextBillingDate: string;
    periodicAmount: number;
    termDiscountPercent: number;
  };

  transactions: CustomerTransaction[];
  
  // Total discounts given to customer
  discountsGiven: {
    id: string;
    date: string;
    type: 'promo_code' | 'upfront_term' | 'volume_discount' | 'price_match';
    code?: string;
    description: string;
    amount: number;
  }[];
}

const STORAGE_KEY = 'portabox_customer_accounts';
const CURRENT_USER_KEY = 'portabox_current_user_session';

// Initial Seed Customers for realistic demonstration & testing
const SEED_CUSTOMERS: CustomerAccount[] = [
  {
    id: 'CUST-8021',
    email: 'sarah.jenkins@gmail.com',
    firstName: 'Sarah',
    lastName: 'Jenkins',
    mobile: '0412 849 201',
    address: '42 Osmond Terrace',
    suburb: 'Norwood',
    state: 'SA',
    postcode: '5067',
    memberSince: '12 Aug 2026',
    verified: true,
    quotes: [
      {
        id: 'QUO-2026-904',
        quoteNumber: 'PBQ-904',
        createdAt: '12 Aug 2026',
        validUntil: '26 Oct 2026',
        containerSize: 'large_25m3',
        containerCount: 1,
        billingCycle: 'monthly',
        firstPaymentTotal: 408,
        monthlyStorageFee: 259,
        status: 'Accepted',
        quoteData: {} as any,
      },
    ],
    orders: [
      {
        id: 'ORD-9841',
        orderNumber: 'PBO-9841',
        containerId: 'PB-BOX-25-088',
        containerSize: '25 m³',
        containerName: 'Large 25 m³ (Portabox Pro)',
        serviceType: 'Storage at secure facility',
        status: 'Placed at Customer',
        location: 'Customer Driveway - Norwood SA (Loading stage)',
        originAddress: '42 Osmond Terrace, Norwood SA 5067',
        destinationAddress: 'Portabox Adelaide Central Depot, Bay 12',
        scheduledDeliveryDate: '2026-10-02',
        deliveryWindow: '9:00 AM – 11:30 AM (Morning Window)',
        driverName: 'Dave Higgins (Driver #03)',
        driverPhone: '0488 123 456',
        timeToDeliveryHours: 5,
        accessNotes: 'Driveway has slight incline. Driver to ring bell upon arrival.',
        history: [
          { timestamp: '12 Aug 2026 14:20', stage: 'Order Booked', note: 'Initial payment confirmed via Stripe.' },
          { timestamp: '01 Oct 2026 08:30', stage: 'Container Dispatched', note: 'Loaded onto horizontal level-lift truck at Adelaide Depot.' },
          { timestamp: '01 Oct 2026 10:15', stage: 'Placed at Customer', note: 'Successfully placed on driveway with ground pads.' },
        ],
      },
    ],
    paymentPlan: {
      planType: 'monthly',
      planLabel: 'Monthly Automatic Debit',
      autopayEnabled: true,
      cardBrand: 'Visa',
      cardLast4: '4242',
      cardExpiry: '11/28',
      nextBillingDate: '12 Nov 2026',
      periodicAmount: 259,
      termDiscountPercent: 0,
    },
    transactions: [
      {
        id: 'TXN-901',
        invoiceNumber: 'INV-2026-0812',
        date: '12 Aug 2026',
        description: 'First payment: Initial delivery ($149) + 1st month storage ($259)',
        amount: 408,
        status: 'Paid',
        paymentMethod: 'Visa •••• 4242 (Stripe)',
        stripeTransactionId: 'ch_3N1abc99210041',
      },
      {
        id: 'TXN-902',
        invoiceNumber: 'INV-2026-0912',
        date: '12 Sep 2026',
        description: 'Monthly Storage Rent (Large 25 m³) - Sep 2026',
        amount: 259,
        status: 'Paid',
        paymentMethod: 'Visa •••• 4242 (Stripe Autopay)',
        stripeTransactionId: 'ch_3N2xyz88210099',
      },
      {
        id: 'TXN-903',
        invoiceNumber: 'INV-2026-1012',
        date: '12 Oct 2026',
        description: 'Monthly Storage Rent (Large 25 m³) - Oct 2026',
        amount: 259,
        status: 'Pending',
        dueDate: '12 Oct 2026',
        paymentMethod: 'Visa •••• 4242 (Scheduled Autopay)',
      },
    ],
    discountsGiven: [
      {
        id: 'DSC-101',
        date: '12 Aug 2026',
        type: 'promo_code',
        code: 'FREEDEL',
        description: 'Free initial delivery special promo code',
        amount: 149,
      },
    ],
  },
  {
    id: 'CUST-8022',
    email: 'david.miller@builderpro.com.au',
    firstName: 'David',
    lastName: 'Miller',
    companyName: 'Miller Construction & Reno',
    mobile: '0433 912 304',
    address: '18 King William Street',
    suburb: 'Hyde Park',
    state: 'SA',
    postcode: '5061',
    memberSince: '04 Jul 2026',
    verified: true,
    quotes: [
      {
        id: 'QUO-2026-781',
        quoteNumber: 'PBQ-781',
        createdAt: '04 Jul 2026',
        validUntil: '18 Jul 2026',
        containerSize: 'combo_35m3',
        containerCount: 2,
        billingCycle: '12_months_upfront',
        firstPaymentTotal: 4290,
        monthlyStorageFee: 418,
        status: 'Accepted',
        quoteData: {} as any,
      },
    ],
    orders: [
      {
        id: 'ORD-8912',
        orderNumber: 'PBO-8912',
        containerId: 'PB-BOX-25-104 & PB-BOX-10-022',
        containerSize: '35 m³ Combo',
        containerName: 'Combo 35 m³ (25 m³ + 10 m³)',
        serviceType: 'Driveway storage for renovation',
        status: 'Placed at Customer',
        location: 'Site driveway - Hyde Park SA',
        originAddress: '18 King William Street, Hyde Park SA',
        scheduledDeliveryDate: '2026-10-18',
        deliveryWindow: '1:30 PM – 4:00 PM',
        driverName: 'Mark Stevens (Heavy Haulage #01)',
        driverPhone: '0411 987 654',
        timeToDeliveryHours: 408,
        accessNotes: 'Ensure clearance from overhead power lines. Dual-lift truck needed.',
        history: [
          { timestamp: '04 Jul 2026 10:00', stage: '12-Month Contract Signed', note: 'Upfront prepayment discount locked.' },
          { timestamp: '05 Jul 2026 14:00', stage: 'Containers Delivered', note: 'Placed safely side-by-side on front driveway.' },
        ],
      },
    ],
    paymentPlan: {
      planType: '12_months_upfront',
      planLabel: '12 Months Upfront Prepayment',
      autopayEnabled: true,
      cardBrand: 'Mastercard',
      cardLast4: '8821',
      cardExpiry: '09/27',
      nextBillingDate: '04 Jul 2027',
      periodicAmount: 418,
      termDiscountPercent: 20,
    },
    transactions: [
      {
        id: 'TXN-881',
        invoiceNumber: 'INV-2026-0704',
        date: '04 Jul 2026',
        description: '12 Months Prepayment + 2x Container Delivery (Renovation Combo)',
        amount: 4290,
        status: 'Paid',
        paymentMethod: 'Mastercard •••• 8821 (Stripe)',
        stripeTransactionId: 'ch_3Nupfront998811',
      },
      {
        id: 'TXN-882',
        invoiceNumber: 'INV-2026-0925',
        date: '25 Sep 2026',
        description: 'Heavy duty moving blankets order (10x pack)',
        amount: 220,
        status: 'Overdue',
        dueDate: '28 Sep 2026',
        paymentMethod: 'Pending Payment',
      },
    ],
    discountsGiven: [
      {
        id: 'DSC-201',
        date: '04 Jul 2026',
        type: 'upfront_term',
        description: '12 Months Upfront Advance Billing Discount (20% Off Monthly Storage)',
        amount: 980,
      },
      {
        id: 'DSC-202',
        date: '04 Jul 2026',
        type: 'volume_discount',
        description: 'Multi-container combo packing waiver',
        amount: 149,
      },
    ],
  },
];

export function loadCustomerAccounts(): CustomerAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveCustomerAccounts(SEED_CUSTOMERS);
      return SEED_CUSTOMERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED_CUSTOMERS;
  } catch (err) {
    console.error('Error loading customer accounts:', err);
    return SEED_CUSTOMERS;
  }
}

export function saveCustomerAccounts(accounts: CustomerAccount[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Error saving customer accounts:', err);
  }
}

export function getCurrentUserSession(): CustomerAccount | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setCurrentUserSession(customer: CustomerAccount | null): void {
  try {
    if (customer) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(customer));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (err) {
    console.error('Error setting current user session:', err);
  }
}

/**
 * Register or update customer from a submitted quote lead / paid booking
 */
export function upsertCustomerFromLead(lead: {
  firstName: string;
  lastName?: string;
  email: string;
  mobile: string;
  quote: QuoteBreakdown;
  paymentTransactionId?: string;
  paymentAmount?: number;
  paymentMethod?: string;
}): CustomerAccount {
  const accounts = loadCustomerAccounts();
  const existingIdx = accounts.findIndex(
    (a) => a.email.toLowerCase() === lead.email.toLowerCase() || a.mobile === lead.mobile
  );

  const containerSizeLabel = lead.quote.containerName || '25 m³ Container';
  const newOrder: ContainerOrder = {
    id: `ORD-${Date.now().toString().slice(-4)}`,
    orderNumber: `PBO-${Date.now().toString().slice(-4)}`,
    containerId: `PB-BOX-${Math.floor(100 + Math.random() * 900)}`,
    containerSize: lead.quote.containerVolume || '25 m³',
    containerName: containerSizeLabel,
    serviceType: lead.quote.serviceType === 'moving_storage' ? 'Move & Storage' : 'Container Storage',
    status: 'Scheduled',
    location: `En route to ${lead.quote.originPostcode.suburb} ${lead.quote.originPostcode.state}`,
    originAddress: `${lead.quote.originPostcode.suburb}, ${lead.quote.originPostcode.state} ${lead.quote.originPostcode.postcode}`,
    scheduledDeliveryDate: lead.quote.preferredDate,
    deliveryWindow: lead.quote.selectedSlot?.timeRange || 'Morning Window (8:00 AM – 11:30 AM)',
    driverName: 'Dispatch Scheduled (Portabox Metro Fleet)',
    driverPhone: '1800 467 637',
    timeToDeliveryHours: 72,
    accessNotes: 'Standard residential driveway delivery.',
    history: [
      {
        timestamp: new Date().toLocaleString(),
        stage: 'Booking Confirmed',
        note: `Quote confirmed with first payment total $${lead.quote.firstPaymentTotal}.`,
      },
    ],
  };

  const newQuote = {
    id: `QUO-${Date.now().toString().slice(-4)}`,
    quoteNumber: `PBQ-${Date.now().toString().slice(-4)}`,
    createdAt: new Date().toLocaleDateString('en-AU'),
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-AU'),
    containerSize: lead.quote.containerSize,
    containerCount: lead.quote.containerCount,
    billingCycle: lead.quote.billingCycle,
    firstPaymentTotal: lead.quote.firstPaymentTotal,
    monthlyStorageFee: lead.quote.monthlyStorageFee,
    status: 'Accepted' as const,
    quoteData: lead.quote,
  };

  const newTransaction: CustomerTransaction = {
    id: `TXN-${Date.now().toString().slice(-4)}`,
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    date: new Date().toLocaleDateString('en-AU'),
    description: `Booking deposit: Container delivery + ${lead.quote.billingCycle} storage`,
    amount: lead.paymentAmount || lead.quote.firstPaymentTotal,
    status: 'Paid',
    paymentMethod: lead.paymentMethod || 'Credit Card (Stripe)',
    stripeTransactionId: lead.paymentTransactionId || `ch_live_${Date.now()}`,
  };

  const discounts = (lead.quote.appliedPromotions || []).map((p, idx) => ({
    id: `DSC-${Date.now()}-${idx}`,
    date: new Date().toLocaleDateString('en-AU'),
    type: 'promo_code' as const,
    code: p.rule.code,
    description: p.description,
    amount: p.discountAmount,
  }));

  if (existingIdx >= 0) {
    const existing = accounts[existingIdx];
    existing.quotes = [newQuote, ...(existing.quotes || [])];
    existing.orders = [newOrder, ...(existing.orders || [])];
    existing.transactions = [newTransaction, ...(existing.transactions || [])];
    if (discounts.length > 0) {
      existing.discountsGiven = [...discounts, ...(existing.discountsGiven || [])];
    }
    accounts[existingIdx] = existing;
    saveCustomerAccounts(accounts);
    setCurrentUserSession(existing);
    return existing;
  } else {
    const newCustomer: CustomerAccount = {
      id: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
      email: lead.email,
      firstName: lead.firstName,
      lastName: lead.lastName || '',
      mobile: lead.mobile,
      address: `${lead.quote.originPostcode.suburb}, ${lead.quote.originPostcode.state}`,
      suburb: lead.quote.originPostcode.suburb,
      state: lead.quote.originPostcode.state,
      postcode: lead.quote.originPostcode.postcode,
      memberSince: new Date().toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }),
      verified: true,
      quotes: [newQuote],
      orders: [newOrder],
      paymentPlan: {
        planType: lead.quote.billingCycle as any,
        planLabel:
          lead.quote.billingCycle === '12_months_upfront'
            ? '12 Months Upfront Prepayment'
            : lead.quote.billingCycle === '6_months_upfront'
            ? '6 Months Upfront Prepayment'
            : lead.quote.billingCycle === '3_months_upfront'
            ? '3 Months Upfront Prepayment'
            : lead.quote.billingCycle === 'weekly'
            ? 'Weekly Debit'
            : 'Monthly Direct Debit',
        autopayEnabled: true,
        cardBrand: 'Visa',
        cardLast4: '4242',
        cardExpiry: '12/28',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-AU'),
        periodicAmount: lead.quote.currentPeriodicStorageFee,
        termDiscountPercent: lead.quote.upfrontDiscountPercent || 0,
      },
      transactions: [newTransaction],
      discountsGiven: discounts,
    };
    accounts.push(newCustomer);
    saveCustomerAccounts(accounts);
    setCurrentUserSession(newCustomer);
    return newCustomer;
  }
}
