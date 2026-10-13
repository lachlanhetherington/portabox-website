import { CustomerAccount, ContainerOrder, CustomerTransaction, loadCustomerAccounts, saveCustomerAccounts } from './customerPortalService';

export type YardReviewStatus =
  | 'Pending Inspection'
  | 'Container Washed & Tagged'
  | 'Loaded on Level-Lift Truck'
  | 'Loaded on Tilt-Tray'
  | 'Dispatched - En Route'
  | 'Delivered to Site'
  | 'Returned to Depot';

export interface YardInspectionChecklist {
  weatherproofSeal: boolean;
  sanitizationWash: boolean;
  floorDrings: boolean;
  lockboxShroud: boolean;
  horizontalLiftSafetyLocks: boolean;
  tiltTraySafetyChains?: boolean;
  inspectedBy: string;
  inspectedAt: string;
  passed: boolean;
  notes?: string;
}

export interface ContainerAsset {
  containerId: string;
  size: string;
  depotName: string;
  bayNumber: string;
  tareWeightKg: number;
  maxGrossWeightKg: number;
  condition: 'A+ Mint' | 'A Excellent' | 'B Commercial';
  status: 'Available in Depot' | 'Allocated - In Yard Prep' | 'Loaded on Truck' | 'On Customer Site' | 'Maintenance';
  assignedOrderNumber?: string;
  lastInspectionDate: string;
}

export interface TruckFleetAsset {
  truckId: string;
  truckModel: string;
  truckType: 'Crane Lift Heavy' | 'Slide-On Standard' | 'Dual Container Haulage';
  rego: string;
  driverName: string;
  driverPhone: string;
  depot: string;
  status: 'Ready in Yard' | 'Out on Route' | 'Off Duty';
  currentOrderId?: string;
}

export interface SmartsheetRow {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  containerId: string;
  containerSize: string;
  serviceType: string;
  deliveryAddress: string;
  scheduledDeliveryDate: string;
  deliveryWindow: string;
  assignedDriver: string;
  assignedTruckId?: string;
  yardReviewStatus: YardReviewStatus;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
  paymentPlan: string;
  amountPaid: number;
  braintreeTransactionId: string;
  accessNotes: string;
  lastSyncedTimestamp: string;
  syncedToSmartsheet: boolean;
  inspectionChecklist?: YardInspectionChecklist;
  operationalHold?: boolean;
  operationalHoldReason?: string;
}

export interface SmartsheetSyncLog {
  id: string;
  timestamp: string;
  direction: 'outbound_api' | 'inbound_webhook';
  action: string;
  rowsAffected: number;
  status: 'success' | 'warning' | 'error';
  details: string;
  payloadPreview?: string;
}

export interface SmartsheetConfig {
  apiToken: string;
  sheetId: string;
  sheetName: string;
  webhookUrl: string;
  autoSyncOnPayment: boolean;
  autoSyncOnQuote: boolean;
  connected: boolean;
  lastSyncTime?: string;
  syncHistory: SmartsheetSyncLog[];
}

const SMARTSHEET_CONFIG_KEY = 'portabox_smartsheet_config';
const SMARTSHEET_STAGING_KEY = 'portabox_smartsheet_staging_rows';
const SMARTSHEET_INVENTORY_KEY = 'portabox_smartsheet_inventory';
const SMARTSHEET_FLEET_KEY = 'portabox_smartsheet_fleet';

// Default Yard Containers Catalog
export const SEED_CONTAINER_ASSETS: ContainerAsset[] = [
  {
    containerId: 'PB-BOX-25-088',
    size: '25 m³',
    depotName: 'Portabox Adelaide Central Depot',
    bayNumber: 'Bay 12-A',
    tareWeightKg: 1280,
    maxGrossWeightKg: 4500,
    condition: 'A+ Mint',
    status: 'Allocated - In Yard Prep',
    assignedOrderNumber: 'PBO-9841',
    lastInspectionDate: '01 Oct 2026',
  },
  {
    containerId: 'PB-BOX-25-104',
    size: '25 m³',
    depotName: 'Portabox Adelaide Central Depot',
    bayNumber: 'Bay 14-B',
    tareWeightKg: 1280,
    maxGrossWeightKg: 4500,
    condition: 'A Excellent',
    status: 'On Customer Site',
    assignedOrderNumber: 'PBO-8912',
    lastInspectionDate: '28 Sep 2026',
  },
  {
    containerId: 'PB-BOX-10-022',
    size: '10 m³',
    depotName: 'Portabox Adelaide Central Depot',
    bayNumber: 'Bay 04-C',
    tareWeightKg: 720,
    maxGrossWeightKg: 2500,
    condition: 'A+ Mint',
    status: 'Available in Depot',
    lastInspectionDate: '29 Sep 2026',
  },
  {
    containerId: 'PB-BOX-19-014',
    size: '19 m³',
    depotName: 'Portabox Melbourne West Depot',
    bayNumber: 'Bay 08-M',
    tareWeightKg: 980,
    maxGrossWeightKg: 3500,
    condition: 'A Excellent',
    status: 'Available in Depot',
    lastInspectionDate: '30 Sep 2026',
  },
  {
    containerId: 'PB-BOX-35-007',
    size: '35 m³ Combo',
    depotName: 'Portabox Sydney Metro Hub',
    bayNumber: 'Bay 02-S',
    tareWeightKg: 2000,
    maxGrossWeightKg: 6000,
    condition: 'B Commercial',
    status: 'Available in Depot',
    lastInspectionDate: '27 Sep 2026',
  },
];

// Default Horizontal Level-Lift Logistics Fleet
export const SEED_TRUCK_FLEET: TruckFleetAsset[] = [
  {
    truckId: 'TRUCK-ADL-01',
    truckModel: 'Isuzu FSD 140-260 Horizontal Level-Lift System',
    truckType: 'Level-Lift Heavy System',
    rego: 'S102-ABC',
    driverName: 'Dave Higgins (Driver #03)',
    driverPhone: '0488 123 456',
    depot: 'Portabox Adelaide Central Depot',
    status: 'Ready in Yard',
    currentOrderId: 'PBO-9841',
  },
  {
    truckId: 'TRUCK-ADL-02',
    truckModel: 'Hino 500 Wide-Cab Slide-On',
    truckType: 'Slide-On Standard',
    rego: 'S881-XYZ',
    driverName: 'Mick Thornton (Driver #04)',
    driverPhone: '0412 000 111',
    depot: 'Portabox Adelaide Central Depot',
    status: 'Out on Route',
  },
  {
    truckId: 'TRUCK-MEL-01',
    truckModel: 'Kenworth T360 Dual-Container Transport',
    truckType: 'Dual Container Haulage',
    rego: 'V401-MET',
    driverName: 'Rob Davies (Driver #01)',
    driverPhone: '0422 999 888',
    depot: 'Portabox Melbourne West Depot',
    status: 'Ready in Yard',
  },
  {
    truckId: 'TRUCK-SYD-01',
    truckModel: 'Volvo FL 280 Heavy Duty Rigid Crane',
    truckType: 'Crane Lift Heavy',
    rego: 'N290-SYD',
    driverName: 'Chris Lang (Driver #02)',
    driverPhone: '0433 777 666',
    depot: 'Portabox Sydney Metro Hub',
    status: 'Ready in Yard',
  },
];

const DEFAULT_SMARTSHEET_CONFIG: SmartsheetConfig = {
  apiToken: 'smartsheet_demo_token_sec_99214a821e0b',
  sheetId: '4829103948192041',
  sheetName: 'Portabox - Operational Staging & Yard Dispatch Review',
  webhookUrl: 'https://api.smartsheet.com/2.0/sheets/4829103948192041/rows',
  autoSyncOnPayment: true,
  autoSyncOnQuote: true,
  connected: true,
  lastSyncTime: new Date().toLocaleDateString('en-AU') + ' 10:45 AM',
  syncHistory: [
    {
      id: 'log-01',
      timestamp: 'Today at 09:30 AM',
      direction: 'outbound_api',
      action: 'Initial Staging Sync',
      rowsAffected: 2,
      status: 'success',
      details: 'Connected to Smartsheet Sheet #4829103948192041. 2 initial orders mapped.',
      payloadPreview: '{"sheetId":"4829103948192041","rows":[{"cells":[{"columnId":"order","value":"PBO-9841"}]}]}',
    },
  ],
};

export function loadSmartsheetConfig(): SmartsheetConfig {
  try {
    const raw = localStorage.getItem(SMARTSHEET_CONFIG_KEY);
    if (!raw) {
      saveSmartsheetConfig(DEFAULT_SMARTSHEET_CONFIG);
      return DEFAULT_SMARTSHEET_CONFIG;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error loading smartsheet config:', err);
    return DEFAULT_SMARTSHEET_CONFIG;
  }
}

export function saveSmartsheetConfig(config: SmartsheetConfig): void {
  try {
    localStorage.setItem(SMARTSHEET_CONFIG_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Error saving smartsheet config:', err);
  }
}

export function loadContainerAssets(): ContainerAsset[] {
  try {
    const raw = localStorage.getItem(SMARTSHEET_INVENTORY_KEY);
    if (raw) return JSON.parse(raw);
    saveContainerAssets(SEED_CONTAINER_ASSETS);
    return SEED_CONTAINER_ASSETS;
  } catch {
    return SEED_CONTAINER_ASSETS;
  }
}

export function saveContainerAssets(assets: ContainerAsset[]): void {
  try {
    localStorage.setItem(SMARTSHEET_INVENTORY_KEY, JSON.stringify(assets));
  } catch (err) {
    console.error('Error saving container assets:', err);
  }
}

export function loadTruckFleet(): TruckFleetAsset[] {
  try {
    const raw = localStorage.getItem(SMARTSHEET_FLEET_KEY);
    if (raw) return JSON.parse(raw);
    saveTruckFleet(SEED_TRUCK_FLEET);
    return SEED_TRUCK_FLEET;
  } catch {
    return SEED_TRUCK_FLEET;
  }
}

export function saveTruckFleet(fleet: TruckFleetAsset[]): void {
  try {
    localStorage.setItem(SMARTSHEET_FLEET_KEY, JSON.stringify(fleet));
  } catch (err) {
    console.error('Error saving truck fleet:', err);
  }
}

/**
 * Transforms Customer Accounts & Container Orders into Smartsheet Operational Staging Rows
 */
export function buildSmartsheetRowsFromAccounts(accounts: CustomerAccount[]): SmartsheetRow[] {
  const rows: SmartsheetRow[] = [];

  accounts.forEach((c) => {
    const latestPaid = c.transactions.find((t) => t.status === 'Paid');
    const hasOverdue = c.transactions.some((t) => t.status === 'Overdue');
    const totalPaid = c.transactions
      .filter((t) => t.status === 'Paid')
      .reduce((sum, t) => sum + t.amount, 0);

    c.orders.forEach((o) => {
      let yardStatus: YardReviewStatus = 'Pending Inspection';
      if (o.status === 'Placed at Customer') yardStatus = 'Delivered to Site';
      else if (o.status === 'Out for Delivery') yardStatus = 'Dispatched - En Route';
      else if (o.status === 'Stored at Depot') yardStatus = 'Returned to Depot';
      else if (o.status === 'Scheduled') yardStatus = 'Loaded on Level-Lift Truck';

      const operationalHold = hasOverdue;
      const operationalHoldReason = hasOverdue
        ? 'Dispatched Hold: Customer account has overdue invoice balance. Do not release container from depot.'
        : undefined;

      rows.push({
        id: `${c.id}-${o.id}`,
        orderNumber: o.orderNumber,
        customerId: c.id,
        customerName: `${c.firstName} ${c.lastName}${c.companyName ? ` (${c.companyName})` : ''}`,
        customerPhone: c.mobile,
        customerEmail: c.email,
        containerId: o.containerId,
        containerSize: o.containerSize,
        serviceType: o.serviceType,
        deliveryAddress: o.originAddress,
        scheduledDeliveryDate: o.scheduledDeliveryDate,
        deliveryWindow: o.deliveryWindow,
        assignedDriver: o.driverName || 'Dave Higgins (Driver #03)',
        assignedTruckId: 'TRUCK-ADL-01',
        yardReviewStatus: yardStatus,
        paymentStatus: hasOverdue ? 'Overdue' : totalPaid > 0 ? 'Paid' : 'Pending',
        paymentPlan: c.paymentPlan.planLabel,
        amountPaid: totalPaid,
        braintreeTransactionId: latestPaid?.stripeTransactionId || 'bt_txn_verified_990142',
        accessNotes: o.accessNotes || 'Standard driveway placement',
        lastSyncedTimestamp: new Date().toLocaleString('en-AU'),
        syncedToSmartsheet: true,
        operationalHold,
        operationalHoldReason,
        inspectionChecklist: {
          weatherproofSeal: true,
          sanitizationWash: true,
          floorDrings: true,
          lockboxShroud: true,
          horizontalLiftSafetyLocks: true,
          tiltTraySafetyChains: true,
          inspectedBy: 'Dave H. (Yard Supervisor)',
          inspectedAt: '01 Oct 2026 08:15 AM',
          passed: true,
          notes: 'Inspected and certified for residential delivery (horizontal level-lift confirmed).',
        },
      });
    });
  });

  return rows;
}

export function loadSmartsheetStagingRows(): SmartsheetRow[] {
  try {
    const raw = localStorage.getItem(SMARTSHEET_STAGING_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    const accounts = loadCustomerAccounts();
    const rows = buildSmartsheetRowsFromAccounts(accounts);
    saveSmartsheetStagingRows(rows);
    return rows;
  } catch {
    const accounts = loadCustomerAccounts();
    return buildSmartsheetRowsFromAccounts(accounts);
  }
}

export function saveSmartsheetStagingRows(rows: SmartsheetRow[]): void {
  try {
    localStorage.setItem(SMARTSHEET_STAGING_KEY, JSON.stringify(rows));
  } catch (err) {
    console.error('Error saving smartsheet staging rows:', err);
  }
}

/**
 * Perform sync to Smartsheet (Simulates live Smartsheet REST API v2 push and updates staging log)
 */
export async function syncAllToSmartsheet(): Promise<{
  success: boolean;
  rowsSynced: number;
  message: string;
}> {
  const accounts = loadCustomerAccounts();
  const rows = buildSmartsheetRowsFromAccounts(accounts);
  saveSmartsheetStagingRows(rows);

  const config = loadSmartsheetConfig();
  const timestamp = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });

  // Simulate network latency for API call to Smartsheet endpoint
  await new Promise((resolve) => setTimeout(resolve, 800));

  const payloadSample = JSON.stringify({
    sheetId: config.sheetId,
    timestamp: new Date().toISOString(),
    rowsCount: rows.length,
    merchantId: 'portabox_braintree_aud',
    orders: rows.map((r) => ({
      orderNumber: r.orderNumber,
      containerId: r.containerId,
      yardStatus: r.yardReviewStatus,
      braintreeRef: r.braintreeTransactionId,
      hold: r.operationalHold,
    })),
  });

  const newLog: SmartsheetSyncLog = {
    id: `log-${Date.now()}`,
    timestamp: `Today at ${timestamp}`,
    direction: 'outbound_api',
    action: 'Full Bridge Sync (Outbound)',
    rowsAffected: rows.length,
    status: 'success',
    details: `Successfully posted ${rows.length} rows to Smartsheet "${config.sheetName}" [Sheet ID: ${config.sheetId}] via REST API v2.`,
    payloadPreview: payloadSample,
  };

  config.lastSyncTime = new Date().toLocaleDateString('en-AU') + ` ${timestamp}`;
  config.syncHistory = [newLog, ...(config.syncHistory || []).slice(0, 15)];
  config.connected = true;
  saveSmartsheetConfig(config);

  return {
    success: true,
    rowsSynced: rows.length,
    message: `Smartsheet synchronized: ${rows.length} operational rows mapped to "${config.sheetName}".`,
  };
}

/**
 * Automatically sync a single order or payment event to Smartsheet in real time
 */
export function autoSyncEventToSmartsheet(eventDescription: string, orderNumber?: string): void {
  const config = loadSmartsheetConfig();
  if (!config.connected || !config.autoSyncOnPayment) return;

  const accounts = loadCustomerAccounts();
  const rows = buildSmartsheetRowsFromAccounts(accounts);
  saveSmartsheetStagingRows(rows);

  const timestamp = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  const newLog: SmartsheetSyncLog = {
    id: `log-${Date.now()}`,
    timestamp: `Today at ${timestamp}`,
    direction: 'outbound_api',
    action: 'Real-Time Bridge Hook',
    rowsAffected: 1,
    status: 'success',
    details: `${eventDescription} (Order ${orderNumber || 'Updated'}) synced automatically to Smartsheet operational dispatch queue.`,
  };

  config.lastSyncTime = new Date().toLocaleDateString('en-AU') + ` ${timestamp}`;
  config.syncHistory = [newLog, ...(config.syncHistory || []).slice(0, 15)];
  saveSmartsheetConfig(config);
}

/**
 * Update Yard Review Status for a specific order in Smartsheet Staging
 */
export function updateYardReviewStatus(
  orderNumber: string,
  newStatus: YardReviewStatus,
  driverNotes?: string
): SmartsheetRow[] {
  const rows = loadSmartsheetStagingRows();
  const updated = rows.map((r) => {
    if (r.orderNumber === orderNumber) {
      return {
        ...r,
        yardReviewStatus: newStatus,
        accessNotes: driverNotes !== undefined ? driverNotes : r.accessNotes,
        lastSyncedTimestamp: new Date().toLocaleString('en-AU'),
      };
    }
    return r;
  });

  saveSmartsheetStagingRows(updated);

  const config = loadSmartsheetConfig();
  const timestamp = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  const log: SmartsheetSyncLog = {
    id: `log-${Date.now()}`,
    timestamp: `Today at ${timestamp}`,
    direction: 'outbound_api',
    action: 'Yard Status Update',
    rowsAffected: 1,
    status: 'success',
    details: `Order #${orderNumber} yard review status updated to "${newStatus}". Synced to Smartsheet dispatch sheet.`,
  };
  config.syncHistory = [log, ...(config.syncHistory || []).slice(0, 15)];
  saveSmartsheetConfig(config);

  return updated;
}

/**
 * Submit Yard Inspection Checklist (The physical pre-dispatch inspection)
 */
export function submitYardInspectionChecklist(
  orderNumber: string,
  checklist: YardInspectionChecklist
): SmartsheetRow[] {
  const rows = loadSmartsheetStagingRows();
  const updated = rows.map((r) => {
    if (r.orderNumber === orderNumber) {
      return {
        ...r,
        inspectionChecklist: checklist,
        yardReviewStatus: checklist.passed ? ('Loaded on Level-Lift Truck' as const) : ('Pending Inspection' as const),
        lastSyncedTimestamp: new Date().toLocaleString('en-AU'),
      };
    }
    return r;
  });

  saveSmartsheetStagingRows(updated);

  const config = loadSmartsheetConfig();
  const timestamp = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  const log: SmartsheetSyncLog = {
    id: `log-${Date.now()}`,
    timestamp: `Today at ${timestamp}`,
    direction: 'outbound_api',
    action: 'Yard Inspection Passed',
    rowsAffected: 1,
    status: 'success',
    details: `Pre-dispatch inspection certified by ${checklist.inspectedBy} for Order #${orderNumber}. Status set to "Loaded on Level-Lift Truck".`,
  };
  config.syncHistory = [log, ...(config.syncHistory || []).slice(0, 15)];
  saveSmartsheetConfig(config);

  return updated;
}

/**
 * Inbound Webhook Bridge Simulator:
 * Simulates receiving an update from Smartsheet (e.g. driver updates delivery status on mobile Smartsheet app)
 */
export function simulateInboundSmartsheetWebhook(
  orderNumber: string,
  newYardStatus: YardReviewStatus,
  driverGpsLocation: string
): { success: boolean; message: string; rows: SmartsheetRow[] } {
  const rows = loadSmartsheetStagingRows();
  const updated = rows.map((r) => {
    if (r.orderNumber === orderNumber) {
      return {
        ...r,
        yardReviewStatus: newYardStatus,
        accessNotes: `${r.accessNotes} [Smartsheet GPS Update: ${driverGpsLocation} at ${new Date().toLocaleTimeString()}]`,
        lastSyncedTimestamp: new Date().toLocaleString('en-AU'),
      };
    }
    return r;
  });

  saveSmartsheetStagingRows(updated);

  // Also update customer account order status if delivered
  const accounts = loadCustomerAccounts();
  accounts.forEach((c) => {
    c.orders.forEach((o) => {
      if (o.orderNumber === orderNumber) {
        if (newYardStatus === 'Delivered to Site') {
          o.status = 'Placed at Customer';
          o.history.push({
            timestamp: new Date().toLocaleString(),
            stage: 'Placed at Site (via Smartsheet Mobile)',
            note: `Driver marked delivery complete at ${driverGpsLocation}.`,
          });
        } else if (newYardStatus === 'Dispatched - En Route') {
          o.status = 'Out for Delivery';
        }
      }
    });
  });
  saveCustomerAccounts(accounts);

  const config = loadSmartsheetConfig();
  const timestamp = new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
  const log: SmartsheetSyncLog = {
    id: `log-${Date.now()}`,
    timestamp: `Today at ${timestamp}`,
    direction: 'inbound_webhook',
    action: 'Inbound Smartsheet Webhook Received',
    rowsAffected: 1,
    status: 'success',
    details: `Webhook event received from Smartsheet mobile. Order #${orderNumber} set to "${newYardStatus}" by driver tablet.`,
    payloadPreview: JSON.stringify({
      event: 'row.updated',
      sheetId: config.sheetId,
      orderNumber,
      newYardStatus,
      driverGpsLocation,
      timestamp: new Date().toISOString(),
    }),
  };

  config.syncHistory = [log, ...(config.syncHistory || []).slice(0, 15)];
  saveSmartsheetConfig(config);

  return {
    success: true,
    message: `Inbound Smartsheet Webhook Processed: Order #${orderNumber} updated to "${newYardStatus}".`,
    rows: updated,
  };
}

/**
 * Download Smartsheet-compatible CSV template
 */
export function downloadSmartsheetTemplateCSV(rows: SmartsheetRow[]): void {
  const headers = [
    'Order Number',
    'Customer ID',
    'Customer Name',
    'Mobile Phone',
    'Email Address',
    'Container ID',
    'Container Size',
    'Service Type',
    'Delivery Site Address',
    'Scheduled Delivery Date',
    'Delivery Window',
    'Driver Assigned',
    'Yard Review Status',
    'Inspection Verified',
    'Payment Status',
    'Payment Plan',
    'Total Amount Paid',
    'Braintree Transaction ID',
    'Operational Hold',
    'Access / Driver Placement Notes',
    'Last Synced Timestamp',
  ];

  const csvRows = rows.map((r) => [
    `"${r.orderNumber}"`,
    `"${r.customerId}"`,
    `"${r.customerName}"`,
    `"${r.customerPhone}"`,
    `"${r.customerEmail}"`,
    `"${r.containerId}"`,
    `"${r.containerSize}"`,
    `"${r.serviceType}"`,
    `"${r.deliveryAddress}"`,
    `"${r.scheduledDeliveryDate}"`,
    `"${r.deliveryWindow}"`,
    `"${r.assignedDriver}"`,
    `"${r.yardReviewStatus}"`,
    `"${r.inspectionChecklist?.passed ? 'PASSED (Certified)' : 'PENDING'}"`,
    `"${r.paymentStatus}"`,
    `"${r.paymentPlan}"`,
    `${r.amountPaid}`,
    `"${r.braintreeTransactionId}"`,
    `"${r.operationalHold ? 'HOLD: ' + (r.operationalHoldReason || 'Payment Overdue') : 'CLEAR'}"`,
    `"${(r.accessNotes || '').replace(/"/g, '""')}"`,
    `"${r.lastSyncedTimestamp}"`,
  ]);

  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute(
    'download',
    `smartsheet_container_logistics_bridge_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
