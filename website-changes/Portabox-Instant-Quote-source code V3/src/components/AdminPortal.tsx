import React, { useState } from 'react';
import {
  Users,
  DollarSign,
  Tag,
  MapPin,
  ShieldBan,
  Truck,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Download,
  CheckCircle,
  Phone,
  Mail,
  Send,
  MessageSquare,
  Search,
  TrendingDown,
  Filter,
  ArrowRight,
  Clock,
  CreditCard,
  FileSpreadsheet,
  Layers,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Package,
  RefreshCw,
  SlidersHorizontal,
  Check,
  Wrench,
  Shield,
  Compass,
  Radio,
  QrCode,
  ClipboardCheck,
  Calendar,
} from 'lucide-react';
import { AppConfig, BlockedPostcode, CustomerLead, MetroHub, PromotionRule, QuoteDropOffRecord } from '../types/quote';
import { PORTABOX_DEPOTS } from '../data/australianPostcodes';
import { loadDropOffRecords } from '../services/pricingEngine';
import {
  CustomerAccount,
  loadCustomerAccounts,
  saveCustomerAccounts,
} from '../services/customerPortalService';
import {
  SmartsheetRow,
  SmartsheetConfig,
  YardReviewStatus,
  YardInspectionChecklist,
  ContainerAsset,
  TruckFleetAsset,
  loadContainerAssets,
  saveContainerAssets,
  loadTruckFleet,
  saveTruckFleet,
  loadSmartsheetConfig,
  saveSmartsheetConfig,
  loadSmartsheetStagingRows,
  saveSmartsheetStagingRows,
  syncAllToSmartsheet,
  updateYardReviewStatus,
  submitYardInspectionChecklist,
  simulateInboundSmartsheetWebhook,
  downloadSmartsheetTemplateCSV,
} from '../services/smartsheetService';
import { CallCenterCalendarPortal } from './CallCenterCalendarPortal';

interface AdminPortalProps {
  config: AppConfig;
  leads: CustomerLead[];
  onSaveConfig: (newConfig: AppConfig) => void;
  onUpdateLeadStatus: (leadId: string, status: CustomerLead['status']) => void;
  onAddLeadNote: (leadId: string, note: string) => void;
  onClose: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  config,
  leads,
  onSaveConfig,
  onUpdateLeadStatus,
  onAddLeadNote,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'customers' | 'smartsheet' | 'call_center_routing' | 'accounting' | 'leads' | 'dropoffs' | 'pricing' | 'zones' | 'interstate' | 'promotions' | 'blocked' | 'depots' | 'features'
  >('customers');
  const [currentConfig, setCurrentConfig] = useState<AppConfig>(config);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [leadsSearch, setLeadsSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<string>('All');
  const [dropOffs, setDropOffs] = useState<QuoteDropOffRecord[]>(loadDropOffRecords());
  const [dropOffPageFilter, setDropOffPageFilter] = useState<string>('All');
  const [dropOffSearch, setDropOffSearch] = useState<string>('');
  const [newNoteText, setNewNoteText] = useState<Record<string, string>>({});

  // Customer Management & Financial Ledger state
  const [customers, setCustomers] = useState<CustomerAccount[]>(loadCustomerAccounts());
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState<'All' | 'Active' | 'PendingDelivery' | 'Overdue' | 'Upfront'>('All');
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [reminderSentCustomer, setReminderSentCustomer] = useState<string | null>(null);

  // Smartsheet Operational Staging & Yard Dispatch state
  const [smartsheetConfig, setSmartsheetConfig] = useState<SmartsheetConfig>(loadSmartsheetConfig());
  const [smartsheetRows, setSmartsheetRows] = useState<SmartsheetRow[]>(loadSmartsheetStagingRows());
  const [smartsheetSearch, setSmartsheetSearch] = useState('');
  const [smartsheetYardFilter, setSmartsheetYardFilter] = useState<string>('All');
  const [isSyncingSmartsheet, setIsSyncingSmartsheet] = useState(false);
  const [smartsheetSyncResult, setSmartsheetSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showSmartsheetSettings, setShowSmartsheetSettings] = useState(false);
  const [yardToast, setYardToast] = useState<string | null>(null);

  // Smartsheet Container Logistics Bridge Sub-Views & Tools
  const [smartsheetBridgeTab, setSmartsheetBridgeTab] = useState<'staging' | 'checklist' | 'webhook_sim' | 'fleet'>('staging');
  const [inspectionTargetOrder, setInspectionTargetOrder] = useState<SmartsheetRow | null>(null);
  const [containerAssets, setContainerAssets] = useState<ContainerAsset[]>(loadContainerAssets());
  const [truckFleet, setTruckFleet] = useState<TruckFleetAsset[]>(loadTruckFleet());
  const [checklistState, setChecklistState] = useState<YardInspectionChecklist>({
    weatherproofSeal: true,
    sanitizationWash: true,
    floorDrings: true,
    lockboxShroud: true,
    horizontalLiftSafetyLocks: true,
    tiltTraySafetyChains: true,
    inspectedBy: 'Dave Higgins (Yard Supervisor)',
    inspectedAt: new Date().toLocaleDateString('en-AU') + ' 08:30 AM',
    passed: true,
    notes: 'Certified clean, weather-sealed, and prepped for tilt-tray loading.',
  });
  const [simWebhookOrder, setSimWebhookOrder] = useState<string>('PBO-9841');
  const [simWebhookAction, setSimWebhookAction] = useState<YardReviewStatus>('Delivered to Site');
  const [simWebhookLocation, setSimWebhookLocation] = useState<string>('42 Osmond Tce, Norwood SA (-34.921, 138.634)');

  // New promo form state
  const [newPromo, setNewPromo] = useState<Partial<PromotionRule>>({
    name: '',
    code: '',
    description: '',
    type: 'percent_off_first_month',
    value: 50,
    targetPostcode: '',
    targetRadiusKm: 50,
    targetHubOrigin: undefined,
    targetHubDestination: undefined,
    minDurationMonths: 1,
    active: true,
    autoApply: false,
  });
  const [isAddingPromo, setIsAddingPromo] = useState(false);

  // New blocked postcode form state
  const [newBlocked, setNewBlocked] = useState<BlockedPostcode>({
    postcode: '',
    suburb: '',
    reason: '',
  });

  const handleSave = () => {
    onSaveConfig(currentConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleToggleCallCenterDispatch = (enabled: boolean) => {
    const updated: AppConfig = {
      ...currentConfig,
      enableCallCenterDispatch: enabled,
    };
    setCurrentConfig(updated);
    onSaveConfig(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all prices, delivery zones and promotions to default settings?')) {
      localStorage.removeItem('portabox_app_config_v2');
      window.location.reload();
    }
  };

  // Export leads to CSV
  const handleExportCSV = () => {
    if (leads.length === 0) {
      alert('No customer leads to export yet.');
      return;
    }
    const headers = ['ID', 'Date', 'First Name', 'Mobile', 'Email', 'Postcode', 'Suburb', 'Container', 'Service Type', 'First Payment', 'Status'];
    const rows = leads.map((l) => [
      l.id,
      new Date(l.createdAt).toLocaleDateString(),
      `"${l.firstName}"`,
      `"${l.mobile}"`,
      `"${l.email}"`,
      l.quote.originPostcode.postcode,
      `"${l.quote.originPostcode.suburb}"`,
      `"${l.quote.containerName}"`,
      `"${l.quote.serviceType}"`,
      l.quote.firstPaymentTotal,
      l.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `portabox_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered leads
  const filteredLeads = leads.filter((l) => {
    const matchSearch =
      l.firstName.toLowerCase().includes(leadsSearch.toLowerCase()) ||
      l.mobile.includes(leadsSearch) ||
      l.email.toLowerCase().includes(leadsSearch.toLowerCase()) ||
      l.quote.originPostcode.suburb.toLowerCase().includes(leadsSearch.toLowerCase()) ||
      l.quote.originPostcode.postcode.includes(leadsSearch);
    const matchStatus = leadStatusFilter === 'All' || l.status === leadStatusFilter;
    return matchSearch && matchStatus;
  });

  // Customer filtering & actions
  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      c.firstName.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.lastName.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.mobile.includes(customerSearch) ||
      c.orders.some((o) => o.containerId.toLowerCase().includes(customerSearch.toLowerCase()));

    if (!matchSearch) return false;
    if (customerFilter === 'Active') return c.orders.length > 0;
    if (customerFilter === 'PendingDelivery') return c.orders.some((o) => o.status === 'Scheduled' || o.status === 'Out for Delivery');
    if (customerFilter === 'Overdue') return c.transactions.some((t) => t.status === 'Overdue');
    if (customerFilter === 'Upfront') return c.paymentPlan.planType.includes('upfront');
    return true;
  });

  const handleMarkCustomerInvoicePaid = (customerId: string, txnId: string) => {
    const updated = customers.map((c) => {
      if (c.id === customerId) {
        return {
          ...c,
          transactions: c.transactions.map((t) =>
            t.id === txnId ? { ...t, status: 'Paid' as const, paymentMethod: 'Marked Paid by Portabox Admin' } : t
          ),
        };
      }
      return c;
    });
    setCustomers(updated);
    saveCustomerAccounts(updated);
  };

  const handleSendOverdueReminder = (customer: CustomerAccount, invoiceNum: string) => {
    setReminderSentCustomer(customer.id);
    setTimeout(() => setReminderSentCustomer(null), 3000);
  };

  // QuickBooks Online CSV Export
  const handleExportQboCSV = () => {
    const headers = ['*Customer', '*InvoiceNo', '*InvoiceDate', '*DueDate', 'Terms', 'Item(Product/Service)', 'ItemDesc', 'ItemQuantity', 'ItemRate', '*ItemAmount', 'ItemTaxCode'];
    const rows: string[][] = [];

    customers.forEach((c) => {
      c.transactions.forEach((t) => {
        rows.push([
          `"${c.firstName} ${c.lastName}"`,
          `"${t.invoiceNumber}"`,
          `"${t.date}"`,
          `"${t.dueDate || t.date}"`,
          `"${c.paymentPlan.planLabel}"`,
          '"Portable Storage Services"',
          `"${t.description.replace(/"/g, '""')}"`,
          '1',
          `${t.amount}`,
          `${t.amount}`,
          '"GST"',
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `portabox_qbo_invoices_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Google Sheets / Smartsheet Logistics Dispatch CSV Export
  const handleExportSheetsCSV = () => {
    const headers = [
      'OrderID',
      'CustomerID',
      'CustomerName',
      'Phone',
      'Email',
      'ContainerID',
      'ContainerSize',
      'ServiceType',
      'Location',
      'ScheduledDeliveryDate',
      'DeliveryWindow',
      'Driver',
      'TimeToDeliveryHours',
      'PaymentPlan',
      'TotalPaid',
      'OverdueStatus',
    ];
    const rows: string[][] = [];

    customers.forEach((c) => {
      c.orders.forEach((o) => {
        const hasOverdue = c.transactions.some((t) => t.status === 'Overdue');
        const paidSum = c.transactions.filter((t) => t.status === 'Paid').reduce((sum, t) => sum + t.amount, 0);
        rows.push([
          `"${o.orderNumber}"`,
          `"${c.id}"`,
          `"${c.firstName} ${c.lastName}"`,
          `"${c.mobile}"`,
          `"${c.email}"`,
          `"${o.containerId}"`,
          `"${o.containerSize}"`,
          `"${o.serviceType}"`,
          `"${o.location}"`,
          `"${o.scheduledDeliveryDate}"`,
          `"${o.deliveryWindow}"`,
          `"${o.driverName || 'Dispatch Scheduled'}"`,
          `${o.timeToDeliveryHours}`,
          `"${c.paymentPlan.planLabel}"`,
          `"${paidSum}"`,
          `"${hasOverdue ? 'OVERDUE' : 'Current'}"`,
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `portabox_dispatch_schedule_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSimulateWebhookSync = () => {
    setSyncFeedback('Triggering Two-Way Staging Webhook to Google Sheets & QBO API queue...');
    setTimeout(() => {
      setSyncFeedback('✓ Success! 2 Active Customer Accounts & 3 Orders synced to Google Sheets intermediary buffer and staged for QuickBooks Online.');
      setTimeout(() => setSyncFeedback(null), 5000);
    }, 1200);
  };

  // Smartsheet action handlers
  const handleSyncSmartsheet = async () => {
    setIsSyncingSmartsheet(true);
    setSmartsheetSyncResult(null);
    try {
      const result = await syncAllToSmartsheet();
      setSmartsheetRows(loadSmartsheetStagingRows());
      setSmartsheetConfig(loadSmartsheetConfig());
      setSmartsheetSyncResult({ success: true, message: result.message });
      setTimeout(() => setSmartsheetSyncResult(null), 5000);
    } catch {
      setSmartsheetSyncResult({ success: false, message: 'Smartsheet sync failed. Please check connection.' });
    } finally {
      setIsSyncingSmartsheet(false);
    }
  };

  const handleUpdateYardStatus = (orderNumber: string, newStatus: YardReviewStatus) => {
    const updated = updateYardReviewStatus(orderNumber, newStatus);
    setSmartsheetRows(updated);
    setSmartsheetConfig(loadSmartsheetConfig());
    setYardToast(`Order #${orderNumber} yard review status updated to "${newStatus}" in Smartsheet`);
    setTimeout(() => setYardToast(null), 3500);
  };

  const handleOpenInspection = (row: SmartsheetRow) => {
    setInspectionTargetOrder(row);
    if (row.inspectionChecklist) {
      setChecklistState({ ...row.inspectionChecklist });
    } else {
      setChecklistState({
        weatherproofSeal: true,
        sanitizationWash: true,
        floorDrings: true,
        lockboxShroud: true,
        horizontalLiftSafetyLocks: true,
        tiltTraySafetyChains: true,
        inspectedBy: 'Dave Higgins (Yard Supervisor)',
        inspectedAt: new Date().toLocaleDateString('en-AU') + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        passed: true,
        notes: '',
      });
    }
    setSmartsheetBridgeTab('checklist');
  };

  const handleSaveInspection = () => {
    if (!inspectionTargetOrder) return;
    const passed = Boolean(
      checklistState.weatherproofSeal &&
      checklistState.sanitizationWash &&
      checklistState.floorDrings &&
      checklistState.lockboxShroud &&
      checklistState.horizontalLiftSafetyLocks &&
      checklistState.tiltTraySafetyChains
    );

    const updatedChecklist: YardInspectionChecklist = {
      ...checklistState,
      passed,
    };
    const updated = submitYardInspectionChecklist(inspectionTargetOrder.orderNumber, updatedChecklist);
    setSmartsheetRows(updated);
    setSmartsheetConfig(loadSmartsheetConfig());
    setInspectionTargetOrder(null);
    setSmartsheetBridgeTab('staging');
    setYardToast(
      passed
        ? `✓ Order #${inspectionTargetOrder.orderNumber} inspection CERTIFIED! Status updated to "Loaded on Tilt-Tray" in Smartsheet.`
        : `⚠ Order #${inspectionTargetOrder.orderNumber} inspection FAILED one or more checks. Yard hold active.`
    );
    setTimeout(() => setYardToast(null), 4000);
  };

  const handleTriggerInboundWebhook = () => {
    const res = simulateInboundSmartsheetWebhook(simWebhookOrder, simWebhookAction, simWebhookLocation);
    setSmartsheetRows(res.rows);
    setSmartsheetConfig(loadSmartsheetConfig());
    setYardToast(`✓ Inbound Smartsheet Webhook Received: Order #${simWebhookOrder} set to "${simWebhookAction}" by driver mobile.`);
    setTimeout(() => setYardToast(null), 4000);
  };

  const handleDownloadSmartsheetCSV = () => {
    downloadSmartsheetTemplateCSV(smartsheetRows);
  };

  const handleSaveSmartsheetSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSmartsheetConfig(smartsheetConfig);
    setShowSmartsheetSettings(false);
    setSmartsheetSyncResult({
      success: true,
      message: 'Smartsheet API token, sheet ID, and webhook settings updated.',
    });
    setTimeout(() => setSmartsheetSyncResult(null), 4000);
  };

  const filteredSmartsheetRows = smartsheetRows.filter((r) => {
    const matchSearch =
      r.orderNumber.toLowerCase().includes(smartsheetSearch.toLowerCase()) ||
      r.customerName.toLowerCase().includes(smartsheetSearch.toLowerCase()) ||
      r.customerPhone.includes(smartsheetSearch) ||
      r.containerId.toLowerCase().includes(smartsheetSearch.toLowerCase()) ||
      r.deliveryAddress.toLowerCase().includes(smartsheetSearch.toLowerCase());

    if (!matchSearch) return false;
    if (smartsheetYardFilter !== 'All' && r.yardReviewStatus !== smartsheetYardFilter) return false;
    return true;
  });

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden mb-12">
      {/* Header Bar */}
      <div className="bg-[#0b2942] text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#00c0f3] text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide">
              ADMIN CONTROL PANEL
            </span>
            {saveSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded">
                <CheckCircle className="w-3.5 h-3.5" />
                Settings Saved!
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            Portabox Management Console
          </h2>
          <p className="text-xs text-slate-300">
            Set container rates, domestic legs, delivery zones, promotions, and manage customer accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#00c0f3] hover:bg-[#00a7d4] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Back to App
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-100/80 px-6 py-2 border-b border-slate-200 flex flex-wrap gap-1">
        <button
          onClick={() => {
            setCustomers(loadCustomerAccounts());
            setActiveTab('customers');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'customers' ? 'bg-white text-[#00c0f3] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5 text-[#00c0f3]" />
          <span>Customers & Accounts ({customers.length})</span>
        </button>

        <button
          onClick={() => {
            const rows = loadSmartsheetStagingRows();
            setSmartsheetRows(rows);
            setActiveTab('smartsheet');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'smartsheet' ? 'bg-white text-[#00c0f3] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#00c0f3]" />
          <span>Smartsheet Yard Dispatch ({smartsheetRows.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('call_center_routing')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'call_center_routing' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          <span>Call Center Calendar & Fleet Routing</span>
          {currentConfig.enableCallCenterDispatch === false && (
            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 font-extrabold">
              Deselected
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('accounting')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'accounting' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          <span>QuickBooks & Sheets Sync</span>
        </button>

        <button
          onClick={() => setActiveTab('leads')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'leads' ? 'bg-white text-[#0b2942] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Quote Leads ({leads.length})</span>
        </button>

        <button
          onClick={() => {
            setDropOffs(loadDropOffRecords());
            setActiveTab('dropoffs');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'dropoffs' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          <span>Drop-Off Tracking ({dropOffs.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'pricing' ? 'bg-white text-[#0b2942] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Container & Legs</span>
        </button>

        <button
          onClick={() => setActiveTab('zones')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'zones' ? 'bg-white text-[#0b2942] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Delivery Zones</span>
        </button>

        <button
          onClick={() => setActiveTab('interstate')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'interstate' ? 'bg-white text-[#0b2942] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Interstate Legs</span>
        </button>

        <button
          onClick={() => setActiveTab('promotions')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'promotions' ? 'bg-white text-[#0b2942] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Promotions ({currentConfig.promotions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('blocked')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'blocked' ? 'bg-white text-[#0b2942] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldBan className="w-3.5 h-3.5" />
          <span>Blocked Postcodes ({currentConfig.blockedPostcodes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('depots')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'depots' ? 'bg-white text-[#0b2942] shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Depot Locations</span>
        </button>

        <button
          onClick={() => setActiveTab('features')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'features' ? 'bg-white text-purple-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-purple-600" />
          <span>Feature Flags & Modules</span>
          {currentConfig.enableCallCenterDispatch === false && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* Main Tab Content */}
      <div className="p-6 sm:p-8">
        {/* ================= TAB 0A: CUSTOMERS & ACCOUNTS ================= */}
        {activeTab === 'customers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-[#0b2942]">Customer Accounts & Field Assets</h3>
                <p className="text-xs text-slate-500">
                  Track active containers, delivery ETA countdowns, payment plans, overdue balances, and discounts given.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportSheetsCSV}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Dispatch Sheet</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Accounts</span>
                <div className="text-2xl font-black text-[#0b2942]">{customers.length}</div>
                <span className="text-[10px] text-emerald-600 font-bold">100% Verified</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Containers</span>
                <div className="text-2xl font-black text-[#00c0f3]">
                  {customers.reduce((sum, c) => sum + c.orders.length, 0)} Units
                </div>
                <span className="text-[10px] text-slate-500">In customer care</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overdue Payments</span>
                <div className="text-2xl font-black text-red-600 font-mono">
                  ${customers.reduce((sum, c) => sum + c.transactions.filter(t => t.status === 'Overdue').reduce((s, t) => s + t.amount, 0), 0)}
                </div>
                <span className="text-[10px] text-red-600 font-bold">
                  {customers.reduce((sum, c) => sum + c.transactions.filter(t => t.status === 'Overdue').length, 0)} overdue balance
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Upfront Prepayments</span>
                <div className="text-2xl font-black text-emerald-600 font-mono">
                  {customers.filter(c => c.paymentPlan.planType.includes('upfront')).length}
                </div>
                <span className="text-[10px] text-emerald-600 font-bold">12-Mo & 6-Mo lock</span>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customers by name, email, phone, or container ID..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00c0f3]"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
                {(['All', 'Active', 'PendingDelivery', 'Overdue', 'Upfront'] as const).map((filterKey) => (
                  <button
                    key={filterKey}
                    type="button"
                    onClick={() => setCustomerFilter(filterKey)}
                    className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      customerFilter === filterKey
                        ? 'bg-[#0b2942] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {filterKey === 'PendingDelivery' ? 'Pending Delivery' : filterKey}
                  </button>
                ))}
              </div>
            </div>

            {/* Customers Master List */}
            <div className="space-y-4">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs">
                  No customer accounts match your current filter.
                </div>
              ) : (
                filteredCustomers.map((c) => {
                  const isExpanded = expandedCustomerId === c.id;
                  const overdueList = c.transactions.filter((t) => t.status === 'Overdue');
                  const pendingList = c.transactions.filter((t) => t.status === 'Pending');
                  const paidTotal = c.transactions.filter((t) => t.status === 'Paid').reduce((sum, t) => sum + t.amount, 0);
                  const discountsTotal = c.discountsGiven.reduce((sum, d) => sum + d.amount, 0);

                  return (
                    <div
                      key={c.id}
                      className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden transition-all"
                    >
                      {/* Customer Summary Card Header */}
                      <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3.5">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0b2942] to-[#00c0f3] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-2xs">
                            {c.firstName[0]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-extrabold text-base text-[#0b2942]">
                                {c.firstName} {c.lastName}
                              </h4>
                              {c.companyName && (
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                  {c.companyName}
                                </span>
                              )}
                              <span className="font-mono text-xs font-bold text-slate-400">
                                {c.id}
                              </span>
                              {overdueList.length > 0 && (
                                <span className="text-[10px] font-black uppercase tracking-wider bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Overdue Balance
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                              <span><Mail className="w-3 h-3 inline mr-1 text-slate-400" />{c.email}</span>
                              <span><Phone className="w-3 h-3 inline mr-1 text-slate-400" />{c.mobile}</span>
                              <span><MapPin className="w-3 h-3 inline mr-1 text-slate-400" />{c.suburb}, {c.state}</span>
                              <span>Plan: <strong className="text-slate-700">{c.paymentPlan.planLabel}</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* Top Financial & Delivery Summary */}
                        <div className="flex items-center gap-4 shrink-0 flex-wrap justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
                          <div className="text-left lg:text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Settled</span>
                            <span className="font-mono font-extrabold text-sm text-[#0b2942]">${paidTotal}</span>
                          </div>

                          <div className="text-left lg:text-right">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Discounts Given</span>
                            <span className="font-mono font-extrabold text-sm text-emerald-600">-${discountsTotal}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setExpandedCustomerId(isExpanded ? null : c.id)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span>{isExpanded ? 'Hide Details' : 'View Account & Orders'}</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Account Details */}
                      {isExpanded && (
                        <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-6 animate-in fade-in duration-150">
                          {/* 1. Active Orders, Delivery Times & Driver ETA */}
                          <div className="space-y-3">
                            <h5 className="text-xs font-black uppercase tracking-wider text-[#0b2942] flex items-center gap-1.5">
                              <Truck className="w-4 h-4 text-[#00c0f3]" />
                              <span>Containers & Live Delivery Schedule ({c.orders.length})</span>
                            </h5>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {c.orders.map((o) => (
                                <div key={o.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
                                  <div className="flex items-center justify-between">
                                    <span className="font-mono font-bold text-xs bg-[#0b2942] text-white px-2 py-0.5 rounded">
                                      {o.containerId}
                                    </span>
                                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                      {o.status}
                                    </span>
                                  </div>

                                  <div className="text-xs font-bold text-slate-800">
                                    {o.containerName} ({o.serviceType})
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                                    <div>
                                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Delivery Date:</span>
                                      <span className="font-semibold text-slate-800">{o.scheduledDeliveryDate}</span>
                                      <div className="text-[11px] text-slate-500">{o.deliveryWindow}</div>
                                    </div>

                                    <div>
                                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Time to Delivery:</span>
                                      <span className="font-mono font-bold text-emerald-600">
                                        {o.timeToDeliveryHours > 24
                                          ? `${Math.floor(o.timeToDeliveryHours / 24)} days, ${o.timeToDeliveryHours % 24} hrs`
                                          : `${o.timeToDeliveryHours} hrs remaining`}
                                      </span>
                                      <div className="text-[10px] text-slate-400">Driver: {o.driverName || 'Scheduled'}</div>
                                    </div>
                                  </div>

                                  <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] text-slate-600">
                                    <strong>Placement Location:</strong> {o.location}
                                    {o.accessNotes && <div className="mt-0.5 italic text-slate-500">Note: "{o.accessNotes}"</div>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 2. Invoices & Payments Ledger (Paid, Pending, Overdue) */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="text-xs font-black uppercase tracking-wider text-[#0b2942] flex items-center gap-1.5">
                                <CreditCard className="w-4 h-4 text-[#00c0f3]" />
                                <span>Invoices & Payments ({c.transactions.length})</span>
                              </h5>

                              {reminderSentCustomer === c.id && (
                                <span className="text-xs font-bold text-emerald-600 animate-in fade-in">
                                  ✓ Overdue payment reminder text & email dispatched to customer!
                                </span>
                              )}
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-400 uppercase text-[10px] font-bold">
                                  <tr>
                                    <th className="p-3">Invoice</th>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Description</th>
                                    <th className="p-3">Method</th>
                                    <th className="p-3 text-right">Amount</th>
                                    <th className="p-3 text-right">Status</th>
                                    <th className="p-3 text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {c.transactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50/70">
                                      <td className="p-3 font-mono font-bold text-[#0b2942]">{t.invoiceNumber}</td>
                                      <td className="p-3 text-slate-500">{t.date}</td>
                                      <td className="p-3 text-slate-700 font-medium">{t.description}</td>
                                      <td className="p-3 text-slate-500 font-mono text-[11px]">{t.paymentMethod || 'Stripe'}</td>
                                      <td className="p-3 text-right font-mono font-bold text-[#0b2942]">${t.amount}</td>
                                      <td className="p-3 text-right">
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            t.status === 'Paid'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : t.status === 'Overdue'
                                              ? 'bg-red-100 text-red-800'
                                              : 'bg-amber-100 text-amber-800'
                                          }`}
                                        >
                                          {t.status}
                                        </span>
                                      </td>
                                      <td className="p-3 text-right">
                                        {t.status === 'Overdue' ? (
                                          <div className="flex items-center gap-1.5 justify-end">
                                            <button
                                              type="button"
                                              onClick={() => handleMarkCustomerInvoicePaid(c.id, t.id)}
                                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                                            >
                                              Mark Paid
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleSendOverdueReminder(c, t.invoiceNumber)}
                                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer"
                                            >
                                              Remind
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="text-[11px] text-slate-400">Settled</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* 3. Discounts Awarded */}
                          {c.discountsGiven.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-xs font-black uppercase tracking-wider text-[#0b2942] flex items-center gap-1.5">
                                <Tag className="w-4 h-4 text-[#00c0f3]" />
                                <span>Discounts Awarded to this Account</span>
                              </h5>
                              <div className="flex flex-wrap gap-2 text-xs">
                                {c.discountsGiven.map((d) => (
                                  <div key={d.id} className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2">
                                    <span className="font-mono font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded text-[10px]">
                                      {d.code || d.type.toUpperCase()}
                                    </span>
                                    <span>{d.description}</span>
                                    <span className="font-mono font-black text-emerald-700">-${d.amount}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 0B: SMARTSHEET YARD DISPATCH & OPERATIONAL STAGING ================= */}
        {activeTab === 'smartsheet' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#00c0f3] text-white px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-2xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    SMARTSHEET API V2 CONNECTED
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    Sheet: <strong className="text-slate-800">{smartsheetConfig.sheetName}</strong>
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    (ID: {smartsheetConfig.sheetId})
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-[#0b2942]">
                  Smartsheet Operational Staging & Yard Dispatch Review
                </h3>
                <p className="text-xs text-slate-500">
                  Live operational queue synchronizing container fleet allocations, driver dispatch windows, and Stripe payments.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSyncSmartsheet}
                  disabled={isSyncingSmartsheet}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#00c0f3] hover:bg-[#00a7d4] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-75"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSmartsheet ? 'animate-spin' : ''}`} />
                  <span>{isSyncingSmartsheet ? 'Syncing to Smartsheet...' : 'Sync All to Smartsheet'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSmartsheetCSV}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Staging CSV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowSmartsheetSettings(!showSmartsheetSettings)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Settings & Webhooks</span>
                </button>
              </div>
            </div>

            {/* Sync Notifications & Yard Update Toasts */}
            {smartsheetSyncResult && (
              <div
                className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in duration-150 ${
                  smartsheetSyncResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{smartsheetSyncResult.message}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {smartsheetConfig.lastSyncTime}
                </span>
              </div>
            )}

            {yardToast && (
              <div className="p-3 bg-sky-50 border border-sky-200 text-[#0b2942] text-xs font-bold rounded-2xl flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-[#00c0f3] shrink-0" />
                <span>{yardToast}</span>
              </div>
            )}

            {/* Smartsheet Connection & Webhook Settings Drawer */}
            {showSmartsheetSettings && (
              <form
                onSubmit={handleSaveSmartsheetSettings}
                className="p-5 sm:p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4 animate-in fade-in"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h4 className="text-sm font-extrabold text-[#0b2942] flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#00c0f3]" />
                    Smartsheet API & Staging Webhook Configuration
                  </h4>
                  <span className="text-[10px] text-slate-400">OAuth2 / Bearer Token Target</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Smartsheet Sheet Name</label>
                    <input
                      type="text"
                      value={smartsheetConfig.sheetName}
                      onChange={(e) => setSmartsheetConfig({ ...smartsheetConfig, sheetName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-[#00c0f3]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Smartsheet Sheet ID</label>
                    <input
                      type="text"
                      value={smartsheetConfig.sheetId}
                      onChange={(e) => setSmartsheetConfig({ ...smartsheetConfig, sheetId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:ring-2 focus:ring-[#00c0f3]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">API Access Token (Bearer)</label>
                    <input
                      type="password"
                      value={smartsheetConfig.apiToken}
                      onChange={(e) => setSmartsheetConfig({ ...smartsheetConfig, apiToken: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono focus:ring-2 focus:ring-[#00c0f3]"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Staging Webhook URL (Zapier / Make / Cloud Function)</label>
                    <input
                      type="url"
                      value={smartsheetConfig.webhookUrl}
                      onChange={(e) => setSmartsheetConfig({ ...smartsheetConfig, webhookUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-[11px] focus:ring-2 focus:ring-[#00c0f3]"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200 text-xs">
                  <div className="flex items-center gap-5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={smartsheetConfig.autoSyncOnPayment}
                        onChange={(e) => setSmartsheetConfig({ ...smartsheetConfig, autoSyncOnPayment: e.target.checked })}
                        className="w-4 h-4 rounded text-[#00c0f3] focus:ring-[#00c0f3]"
                      />
                      <span className="font-semibold text-slate-700">Auto-sync customer orders on Braintree payment</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={smartsheetConfig.autoSyncOnQuote}
                        onChange={(e) => setSmartsheetConfig({ ...smartsheetConfig, autoSyncOnQuote: e.target.checked })}
                        className="w-4 h-4 rounded text-[#00c0f3] focus:ring-[#00c0f3]"
                      />
                      <span className="font-semibold text-slate-700">Auto-sync on customer quote submission</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#0b2942] hover:bg-[#081e30] text-white rounded-xl font-bold cursor-pointer transition-colors shadow-2xs"
                  >
                    Save Configuration
                  </button>
                </div>
              </form>
            )}

            {/* Logistics Bridge Navigation Sub-Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
              <button
                type="button"
                onClick={() => setSmartsheetBridgeTab('staging')}
                className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  smartsheetBridgeTab === 'staging'
                    ? 'bg-[#00c0f3] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Operational Staging Queue ({smartsheetRows.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSmartsheetBridgeTab('checklist')}
                className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  smartsheetBridgeTab === 'checklist'
                    ? 'bg-[#00c0f3] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>5-Point Yard Inspection Bridge</span>
              </button>

              <button
                type="button"
                onClick={() => setSmartsheetBridgeTab('fleet')}
                className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  smartsheetBridgeTab === 'fleet'
                    ? 'bg-[#00c0f3] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Depot Inventory & Tilt-Tray Fleet ({containerAssets.length} Containers)</span>
              </button>

              <button
                type="button"
                onClick={() => setSmartsheetBridgeTab('webhook_sim')}
                className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  smartsheetBridgeTab === 'webhook_sim'
                    ? 'bg-[#00c0f3] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Two-Way Webhook Bridge & Driver Simulator</span>
              </button>
            </div>

            {/* Operational Staging Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Staged</span>
                <div className="text-2xl font-black text-[#0b2942]">{smartsheetRows.length}</div>
                <span className="text-[10px] text-slate-500">Orders in Smartsheet</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Yard Review</span>
                <div className="text-2xl font-black text-amber-600">
                  {smartsheetRows.filter((r) => r.yardReviewStatus === 'Pending Inspection' || r.yardReviewStatus === 'Container Washed & Tagged').length}
                </div>
                <span className="text-[10px] text-amber-600 font-semibold">Inspection & Wash</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Loaded on Trucks</span>
                <div className="text-2xl font-black text-indigo-600">
                  {smartsheetRows.filter((r) => r.yardReviewStatus === 'Loaded on Tilt-Tray').length}
                </div>
                <span className="text-[10px] text-indigo-600 font-semibold">Tilt-Tray Ready</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Placed at Sites</span>
                <div className="text-2xl font-black text-emerald-600">
                  {smartsheetRows.filter((r) => r.yardReviewStatus === 'Delivered to Site').length}
                </div>
                <span className="text-[10px] text-emerald-600 font-semibold">Active customer care</span>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Revenue Staged</span>
                <div className="text-2xl font-black text-[#00c0f3] font-mono">
                  ${smartsheetRows.reduce((sum, r) => sum + r.amountPaid, 0)}
                </div>
                <span className="text-[10px] text-slate-500">Braintree settled</span>
              </div>
            </div>

            {/* ================= VIEW 1: STAGING QUEUE ================= */}
            {smartsheetBridgeTab === 'staging' && (
              <>
                {/* Search & Yard Review Filter Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={smartsheetSearch}
                      onChange={(e) => setSmartsheetSearch(e.target.value)}
                      placeholder="Filter Smartsheet orders by customer name, order #, container ID, or delivery address..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00c0f3]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
                    {[
                      'All',
                      'Pending Inspection',
                      'Container Washed & Tagged',
                      'Loaded on Tilt-Tray',
                      'Dispatched - En Route',
                      'Delivered to Site',
                    ].map((statusVal) => (
                      <button
                        key={statusVal}
                        type="button"
                        onClick={() => setSmartsheetYardFilter(statusVal)}
                        className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                          smartsheetYardFilter === statusVal
                            ? 'bg-[#00c0f3] text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {statusVal}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Smartsheet Operational Staging Grid */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#0b2942] text-white uppercase text-[10px] font-extrabold tracking-wider">
                        <tr>
                          <th className="p-3.5 border-r border-slate-700/60 whitespace-nowrap">Order #</th>
                          <th className="p-3.5 border-r border-slate-700/60 whitespace-nowrap">Customer</th>
                          <th className="p-3.5 border-r border-slate-700/60 whitespace-nowrap">Container</th>
                          <th className="p-3.5 border-r border-slate-700/60 whitespace-nowrap">Delivery Address</th>
                          <th className="p-3.5 border-r border-slate-700/60 whitespace-nowrap">Delivery Window</th>
                          <th className="p-3.5 border-r border-slate-700/60 whitespace-nowrap">Driver & Truck</th>
                          <th className="p-3.5 border-r border-slate-700/60 whitespace-nowrap bg-[#00c0f3] text-white">
                            Yard Review Status (Interactive)
                          </th>
                          <th className="p-3.5 border-r border-slate-700/60 whitespace-nowrap text-center">Inspection Cert</th>
                          <th className="p-3.5 border-r border-slate-700/60 whitespace-nowrap text-right">Payment</th>
                          <th className="p-3.5 whitespace-nowrap">Braintree Ref & Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredSmartsheetRows.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="p-8 text-center text-slate-400">
                              No operational staging rows found matching your search.
                            </td>
                          </tr>
                        ) : (
                          filteredSmartsheetRows.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                              {/* Order # */}
                              <td className="p-3.5 font-mono font-bold text-[#0b2942] border-r border-slate-100 whitespace-nowrap">
                                <span className="bg-sky-50 text-[#00c0f3] border border-sky-200 px-2 py-0.5 rounded-md">
                                  {row.orderNumber}
                                </span>
                                {row.operationalHold && (
                                  <span className="block mt-1 text-[9px] font-black uppercase text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                                    DISPATCH HOLD
                                  </span>
                                )}
                              </td>

                              {/* Customer */}
                              <td className="p-3.5 border-r border-slate-100">
                                <div className="font-extrabold text-[#0b2942]">{row.customerName}</div>
                                <div className="text-[11px] text-slate-500">{row.customerPhone}</div>
                                <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{row.customerEmail}</div>
                              </td>

                              {/* Container */}
                              <td className="p-3.5 border-r border-slate-100 whitespace-nowrap">
                                <span className="font-mono font-black text-xs text-[#0b2942] block">
                                  {row.containerId}
                                </span>
                                <span className="text-[11px] text-slate-500">{row.containerSize}</span>
                                <span className="text-[10px] text-slate-400 block">{row.serviceType}</span>
                              </td>

                              {/* Delivery Address */}
                              <td className="p-3.5 border-r border-slate-100 max-w-xs">
                                <div className="text-slate-800 font-medium truncate">{row.deliveryAddress}</div>
                              </td>

                              {/* Delivery Window */}
                              <td className="p-3.5 border-r border-slate-100 whitespace-nowrap">
                                <div className="font-bold text-[#0b2942]">{row.scheduledDeliveryDate}</div>
                                <div className="text-[11px] text-slate-500">{row.deliveryWindow}</div>
                              </td>

                              {/* Driver & Truck */}
                              <td className="p-3.5 border-r border-slate-100 whitespace-nowrap">
                                <span className="font-medium text-slate-800 block">{row.assignedDriver}</span>
                                <span className="text-[10px] text-slate-400 font-mono">Truck: TRUCK-ADL-01</span>
                              </td>

                              {/* Interactive Yard Review Status Dropdown */}
                              <td className="p-3.5 border-r border-slate-100 bg-sky-50/40">
                                <select
                                  value={row.yardReviewStatus}
                                  onChange={(e) => handleUpdateYardStatus(row.orderNumber, e.target.value as YardReviewStatus)}
                                  className={`w-full text-xs font-bold py-1.5 px-2.5 rounded-xl border transition-all cursor-pointer ${
                                    row.yardReviewStatus === 'Delivered to Site'
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                      : row.yardReviewStatus === 'Dispatched - En Route'
                                      ? 'bg-blue-50 border-blue-300 text-blue-800'
                                      : row.yardReviewStatus === 'Loaded on Tilt-Tray'
                                      ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                                      : row.yardReviewStatus === 'Container Washed & Tagged'
                                      ? 'bg-sky-50 border-sky-300 text-sky-800'
                                      : 'bg-amber-50 border-amber-300 text-amber-800'
                                  }`}
                                >
                                  <option value="Pending Inspection">Pending Inspection</option>
                                  <option value="Container Washed & Tagged">Container Washed & Tagged</option>
                                  <option value="Loaded on Tilt-Tray">Loaded on Tilt-Tray</option>
                                  <option value="Dispatched - En Route">Dispatched - En Route</option>
                                  <option value="Delivered to Site">Delivered to Site</option>
                                  <option value="Returned to Depot">Returned to Depot</option>
                                </select>
                              </td>

                              {/* Inspection Cert */}
                              <td className="p-3.5 border-r border-slate-100 text-center whitespace-nowrap">
                                {row.inspectionChecklist?.passed ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenInspection(row)}
                                    className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 mx-auto cursor-pointer"
                                  >
                                    <Check className="w-3 h-3 text-emerald-700" />
                                    <span>Certified</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenInspection(row)}
                                    className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 mx-auto cursor-pointer"
                                  >
                                    <Wrench className="w-3 h-3 text-amber-700" />
                                    <span>Inspect</span>
                                  </button>
                                )}
                              </td>

                              {/* Financial / Payment */}
                              <td className="p-3.5 border-r border-slate-100 text-right whitespace-nowrap">
                                <span className="font-mono font-black text-sm text-[#0b2942] block">
                                  ${row.amountPaid}
                                </span>
                                <span
                                  className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    row.paymentStatus === 'Paid'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : row.paymentStatus === 'Overdue'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {row.paymentStatus}
                                </span>
                                <div className="text-[10px] text-slate-400 mt-0.5">{row.paymentPlan}</div>
                              </td>

                              {/* Braintree Ref & Notes */}
                              <td className="p-3.5 text-xs max-w-xs">
                                <div className="font-mono text-[10px] text-slate-500 truncate">
                                  Ref: {row.braintreeTransactionId}
                                </div>
                                {row.accessNotes && (
                                  <div className="text-[11px] text-slate-700 italic truncate mt-0.5">
                                    "{row.accessNotes}"
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ================= VIEW 2: 5-POINT YARD PREP & INSPECTION BRIDGE ================= */}
            {smartsheetBridgeTab === 'checklist' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-md">
                      LOGISTICS QUALITY ASSURANCE BRIDGE
                    </span>
                    <h4 className="text-lg font-black text-[#0b2942] mt-1">
                      Pre-Dispatch 5-Point Container Inspection
                    </h4>
                    <p className="text-xs text-slate-500">
                      Standard operating procedure before any Portabox is loaded onto a tilt-tray truck and synced to Smartsheet.
                    </p>
                  </div>

                  {/* Target Order Selector */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-700">Order to Certify:</label>
                    <select
                      value={inspectionTargetOrder?.orderNumber || smartsheetRows[0]?.orderNumber}
                      onChange={(e) => {
                        const row = smartsheetRows.find((r) => r.orderNumber === e.target.value);
                        if (row) handleOpenInspection(row);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono font-bold"
                    >
                      {smartsheetRows.map((r) => (
                        <option key={r.id} value={r.orderNumber}>
                          {r.orderNumber} - {r.customerName} ({r.containerId})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 5-Point Interactive Inspection Checklist */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={checklistState.weatherproofSeal}
                      onChange={(e) => setChecklistState({ ...checklistState, weatherproofSeal: e.target.checked })}
                      className="w-5 h-5 rounded text-[#00c0f3] focus:ring-[#00c0f3] mt-0.5"
                    />
                    <div>
                      <span className="font-extrabold text-[#0b2942] block">
                        1. Weatherproof Marine Rubber Seals & Compression Cam Latches
                      </span>
                      <span className="text-slate-500">
                        Check door perimeter rubber gaskets for water-tight seal and verify dual cam locking levers latch securely.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={checklistState.sanitizationWash}
                      onChange={(e) => setChecklistState({ ...checklistState, sanitizationWash: e.target.checked })}
                      className="w-5 h-5 rounded text-[#00c0f3] focus:ring-[#00c0f3] mt-0.5"
                    />
                    <div>
                      <span className="font-extrabold text-[#0b2942] block">
                        2. Heated High-Pressure Steam Sanitization & Odor Clearance
                      </span>
                      <span className="text-slate-500">
                        Interior chamber completely washed, dried, deodorized, and free of dust or debris.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={checklistState.floorDrings}
                      onChange={(e) => setChecklistState({ ...checklistState, floorDrings: e.target.checked })}
                      className="w-5 h-5 rounded text-[#00c0f3] focus:ring-[#00c0f3] mt-0.5"
                    />
                    <div>
                      <span className="font-extrabold text-[#0b2942] block">
                        3. Marine Hardwood Flooring & Tie-Down D-Rings
                      </span>
                      <span className="text-slate-500">
                        Inspect hardwood plywood floor for smoothness and verify all recessed wall/floor D-rings are solid.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={checklistState.lockboxShroud}
                      onChange={(e) => setChecklistState({ ...checklistState, lockboxShroud: e.target.checked })}
                      className="w-5 h-5 rounded text-[#00c0f3] focus:ring-[#00c0f3] mt-0.5"
                    />
                    <div>
                      <span className="font-extrabold text-[#0b2942] block">
                        4. Security Lockbox Hardened Padlock Shroud
                      </span>
                      <span className="text-slate-500">
                        Verify steel security shroud is intact to prevent angle grinder or bolt-cutter tampering.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 cursor-pointer transition-colors md:col-span-2">
                    <input
                      type="checkbox"
                      checked={checklistState.tiltTraySafetyChains}
                      onChange={(e) => setChecklistState({ ...checklistState, tiltTraySafetyChains: e.target.checked })}
                      className="w-5 h-5 rounded text-[#00c0f3] focus:ring-[#00c0f3] mt-0.5"
                    />
                    <div>
                      <span className="font-extrabold text-[#0b2942] block">
                        5. Tilt-Tray Winch Bridle & Transport Chain Tie-Downs
                      </span>
                      <span className="text-slate-500">
                        Inspect heavy-duty load chains, ground protective nylon pads, and winch bridle for road transit.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Inspector Details & Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700">Inspecting Yard Officer</label>
                      <input
                        type="text"
                        value={checklistState.inspectedBy}
                        onChange={(e) => setChecklistState({ ...checklistState, inspectedBy: e.target.value })}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setSmartsheetBridgeTab('staging')}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveInspection}
                      className="px-6 py-2 bg-[#00c0f3] hover:bg-[#00a7d4] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Certify & Sync Status to Smartsheet</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= VIEW 3: DEPOT INVENTORY & TILT-TRAY FLEET ================= */}
            {smartsheetBridgeTab === 'fleet' && (
              <div className="space-y-6">
                {/* Physical Containers */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-[#0b2942] flex items-center gap-2">
                        <Package className="w-4 h-4 text-[#00c0f3]" />
                        Depot Container Assets & Technical Specifications
                      </h4>
                      <p className="text-xs text-slate-500">
                        Physical steel containers tracked in the Smartsheet Logistics Master Sheet.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      {containerAssets.filter((c) => c.status === 'Available in Depot').length} Available in Depot
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-extrabold">
                        <tr>
                          <th className="p-3">Container ID</th>
                          <th className="p-3">Volume</th>
                          <th className="p-3">Home Depot & Bay</th>
                          <th className="p-3 text-right">Tare Weight</th>
                          <th className="p-3 text-right">Max Gross</th>
                          <th className="p-3">Condition</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Assigned Order</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {containerAssets.map((c) => (
                          <tr key={c.containerId} className="hover:bg-slate-50/60">
                            <td className="p-3 font-mono font-bold text-[#0b2942]">{c.containerId}</td>
                            <td className="p-3 font-medium text-slate-700">{c.size}</td>
                            <td className="p-3 text-slate-600">
                              {c.depotName} <span className="font-mono text-slate-400">({c.bayNumber})</span>
                            </td>
                            <td className="p-3 text-right font-mono">{c.tareWeightKg} kg</td>
                            <td className="p-3 text-right font-mono font-bold">{c.maxGrossWeightKg} kg</td>
                            <td className="p-3">
                              <span className="bg-sky-50 text-[#00c0f3] font-bold px-2 py-0.5 rounded text-[10px]">
                                {c.condition}
                              </span>
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  c.status === 'Available in Depot'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : c.status === 'Allocated - In Yard Prep'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-500">
                              {c.assignedOrderNumber || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tilt-Tray Trucks */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-extrabold text-[#0b2942] flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#00c0f3]" />
                      Tilt-Tray Logistics Fleet Registry
                    </h4>
                    <p className="text-xs text-slate-500">
                      Heavy transport slide-on and crane-lift trucks assigned to container deliveries.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {truckFleet.map((t) => (
                      <div key={t.truckId} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[#0b2942]">{t.truckId}</span>
                          <span className="font-mono text-slate-500 text-[11px]">Rego: {t.rego}</span>
                        </div>
                        <h5 className="font-extrabold text-sm text-[#0b2942]">{t.truckModel}</h5>
                        <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px]">
                          <div><strong>Lift Mechanism:</strong> {t.truckType}</div>
                          <div><strong>Home Depot:</strong> {t.depot}</div>
                          <div><strong>Driver:</strong> {t.driverName}</div>
                          <div><strong>Driver Phone:</strong> {t.driverPhone}</div>
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">Status:</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px]">
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= VIEW 4: TWO-WAY WEBHOOK BRIDGE & DRIVER SIMULATOR ================= */}
            {smartsheetBridgeTab === 'webhook_sim' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-md">
                    TWO-WAY BIDIRECTIONAL BRIDGE
                  </span>
                  <h4 className="text-lg font-black text-[#0b2942] mt-1">
                    Smartsheet Webhook Listener & Driver Mobile Simulator
                  </h4>
                  <p className="text-xs text-slate-500">
                    Test live webhook callbacks from Smartsheet mobile apps used by delivery drivers in the field.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-4 md:col-span-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Target Order</label>
                      <select
                        value={simWebhookOrder}
                        onChange={(e) => setSimWebhookOrder(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold font-mono"
                      >
                        {smartsheetRows.map((r) => (
                          <option key={r.id} value={r.orderNumber}>
                            {r.orderNumber} - {r.customerName} ({r.deliveryAddress})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Driver Field Action</label>
                        <select
                          value={simWebhookAction}
                          onChange={(e) => setSimWebhookAction(e.target.value as YardReviewStatus)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold"
                        >
                          <option value="Dispatched - En Route">Dispatched - En Route</option>
                          <option value="Delivered to Site">Delivered to Site (Complete)</option>
                          <option value="Returned to Depot">Returned to Depot</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Driver GPS Coordinates</label>
                        <input
                          type="text"
                          value={simWebhookLocation}
                          onChange={(e) => setSimWebhookLocation(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTriggerInboundWebhook}
                      className="px-5 py-2.5 bg-[#0b2942] hover:bg-[#081e30] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-2"
                    >
                      <Radio className="w-4 h-4 text-[#00c0f3]" />
                      <span>Simulate Inbound Webhook Event from Smartsheet</span>
                    </button>
                  </div>

                  {/* Sample Payload Preview */}
                  <div className="p-4 rounded-2xl bg-slate-900 text-sky-300 font-mono text-[11px] space-y-2 overflow-x-auto">
                    <div className="text-white font-bold text-xs uppercase flex items-center justify-between">
                      <span>Webhook Payload Preview</span>
                      <span className="text-[9px] text-slate-400">JSON</span>
                    </div>
                    <pre className="text-[10px] leading-tight text-slate-300 whitespace-pre-wrap">
{JSON.stringify(
  {
    event: 'row.updated',
    sheetId: smartsheetConfig.sheetId,
    orderNumber: simWebhookOrder,
    yardReviewStatus: simWebhookAction,
    driverGpsLocation: simWebhookLocation,
    merchantGateway: 'braintree_aud',
    timestamp: new Date().toISOString(),
  },
  null,
  2
)}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {/* Smartsheet Audit Trail & Sync History */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-sm font-extrabold text-[#0b2942] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#00c0f3]" />
                  Smartsheet Sync Log & Webhook Audit Trail
                </h4>
                <span className="text-[10px] text-slate-400">Audit retention: 15 events</span>
              </div>

              <div className="space-y-2">
                {smartsheetConfig.syncHistory.map((log) => (
                  <div key={log.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div>
                        <span className="font-extrabold text-[#0b2942]">{log.action}</span>
                        <span className="text-slate-400 ml-2">({log.timestamp})</span>
                        <p className="text-slate-600 mt-0.5 text-[11px]">{log.details}</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-600 shrink-0">
                      {log.rowsAffected} row{log.rowsAffected > 1 ? 's' : ''} affected
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB: CALL CENTER CALENDAR & ROUTING OPTIMIZER ================= */}
        {activeTab === 'call_center_routing' && (
          <div className="space-y-4">
            {/* Feature Flag Status & Quick Toggle Bar */}
            <div className={`p-4 rounded-2xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs ${
              currentConfig.enableCallCenterDispatch !== false
                ? 'bg-emerald-50/80 border-emerald-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl text-white shrink-0 mt-0.5 ${
                  currentConfig.enableCallCenterDispatch !== false ? 'bg-emerald-600' : 'bg-amber-500'
                }`}>
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      currentConfig.enableCallCenterDispatch !== false ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                    }`}>
                      {currentConfig.enableCallCenterDispatch !== false ? '✓ Feature Selected (Active in App)' : '⚠ Feature Deselected (Hidden from App)'}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      Call Center Dispatch Feature Flag
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {currentConfig.enableCallCenterDispatch !== false
                      ? 'Call center dispatch tools are currently active. The "Call Center Dispatch" button is visible in the top header and staff can access calendar slots, route optimization, and driver routing sheets.'
                      : 'Call center dispatch functions have been deselected from the customer-facing app. The dispatch button in the header is hidden. You can review internal schedules below or re-enable the feature.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggleCallCenterDispatch(currentConfig.enableCallCenterDispatch === false)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-xs ${
                  currentConfig.enableCallCenterDispatch !== false
                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {currentConfig.enableCallCenterDispatch !== false ? 'Deselect (Turn Off in App)' : 'Select (Turn On in App)'}
              </button>
            </div>

            <CallCenterCalendarPortal
              onClose={() => setActiveTab('customers')}
            />
          </div>
        )}

        {/* ================= TAB 0B: QUICKBOOKS ONLINE & SHEETS INTEGRATION ================= */}
        {activeTab === 'accounting' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-[#0b2942]">
                  Accounting Integration: QuickBooks Online vs Google Sheets & Smartsheet
                </h3>
                <p className="text-xs text-slate-500">
                  Comprehensive architectural assessment, recommendations, and live export / webhook sync simulator.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportQboCSV}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#0b2942] hover:bg-[#081e30] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export QBO CSV</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportSheetsCSV}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export Sheets/Smartsheet CSV</span>
                </button>
              </div>
            </div>

            {/* Architecture Recommendation Banner */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0b2942] to-[#043354] text-white shadow-md space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-[#00c0f3] text-white px-2.5 py-0.5 rounded-full">
                  EXPERT RECOMMENDATION
                </span>
                <span className="text-xs text-sky-200 font-bold">2-Tier Intermediary Staging Architecture</span>
              </div>

              <h4 className="text-xl font-black text-white">
                Best Approach: Use Google Sheets or Smartsheet as an Operational Intermediary Before QuickBooks Online
              </h4>

              <p className="text-xs text-slate-200 leading-relaxed max-w-3xl">
                For a physical portable storage business like Portabox with moving tilt-tray trucks, container drop-offs, prorated monthly billing, and upfront 12-month prepayments, <strong>connecting directly to QuickBooks Online without an intermediary staging sheet creates operational friction and bookkeeping reversals</strong>.
              </p>

              <div className="p-4 bg-white/10 rounded-2xl border border-white/15 text-xs text-sky-100 space-y-1 font-mono">
                <div className="font-bold text-white uppercase text-[11px] mb-1">Recommended Data Flow:</div>
                <div>1. Portabox App & Stripe Elements (Orders & Payments)</div>
                <div> &nbsp;&nbsp;↳ 2. Webhook Event → Central Google Sheet / Smartsheet (Operational Staging & Yard Dispatch Review)</div>
                <div> &nbsp;&nbsp;&nbsp;&nbsp;↳ 3. Validated Rows Synced → QuickBooks Online API / Intuit OAuth2 (Final Invoices & General Ledger)</div>
              </div>
            </div>

            {/* In-depth 3-Way Comparison Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              {/* Option A: Direct QBO API */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                    Option 1: Direct QBO API
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Pure Automated</span>
                </div>
                <h5 className="font-extrabold text-sm text-[#0b2942]">Direct QuickBooks Online Connection</h5>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Uses Intuit OAuth2 REST API to automatically create Customers, Invoices, and Payments immediately when a customer pays online.
                </p>

                <div className="space-y-1.5 pt-2 text-[11px]">
                  <div className="text-emerald-700 font-semibold">✓ Pros: Zero manual touches for standard orders.</div>
                  <div className="text-red-600 font-semibold">✗ Cons: High error rate when delivery legs are altered on site (extra km, wait times, damaged pad fee adjustments). Voiding or editing locked QBO invoices damages GAAP audit logs.</div>
                  <div className="text-slate-500 font-medium">Verdict: Good for simple retail e-commerce, risky for heavy logistics.</div>
                </div>
              </div>

              {/* Option B: Google Sheets Intermediary (RECOMMENDED) */}
              <div className="bg-white p-5 rounded-3xl border-2 border-emerald-400 shadow-xs space-y-3 relative">
                <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-2xs">
                  RECOMMENDED
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    Option 2: Google Sheets Staging
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700">Cost-Effective</span>
                </div>
                <h5 className="font-extrabold text-sm text-[#0b2942]">Google Sheets Intermediary Staging</h5>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  App webhook records customer orders, delivery slots, and Stripe transaction IDs to Google Sheets. Dispatch verifies drop-off completion, then automated Zapier / Make / API pushes to QBO.
                </p>

                <div className="space-y-1.5 pt-2 text-[11px]">
                  <div className="text-emerald-700 font-semibold">✓ Pros: Free, zero per-seat licensing, instant multi-user editing, drivers and yard managers don't need QBO logins. Easy 12-month prepayment proration formulas.</div>
                  <div className="text-amber-700 font-semibold">⚠ Considerations: Best for up to ~10,000 orders/year before migrating to database staging.</div>
                  <div className="text-emerald-800 font-bold">Verdict: Highest flexibility, lowest cost, easiest to implement.</div>
                </div>
              </div>

              {/* Option C: Smartsheet Intermediary */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-xs text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                    Option 3: Smartsheet Staging
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Enterprise Logistics</span>
                </div>
                <h5 className="font-extrabold text-sm text-[#0b2942]">Smartsheet Container Logistics Bridge</h5>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Ideal if Portabox scales to 5+ regional depots (Adelaide, Melbourne, Sydney, Brisbane, Perth) requiring strict column locking, mobile driver forms, barcode container scanning, and enterprise QBO connector.
                </p>

                <div className="space-y-1.5 pt-2 text-[11px]">
                  <div className="text-emerald-700 font-semibold">✓ Pros: Built-in automated approvals, Gantt delivery schedules, enterprise audit controls.</div>
                  <div className="text-slate-600 font-semibold">✗ Cons: Higher per-user monthly SaaS subscription costs compared to Google Sheets.</div>
                  <div className="text-purple-800 font-medium">Verdict: Perfect enterprise step for multi-depot fleet management.</div>
                </div>
              </div>
            </div>

            {/* Why an Intermediary Step Solves Real Logistics Challenges */}
            <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-base font-extrabold text-[#0b2942]">
                Key Reasons Why the Intermediary Step is Essential for Portabox:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h6 className="font-bold text-[#0b2942]">1. Deferred Revenue for Upfront 12-Month Plans</h6>
                  <p className="text-slate-600 leading-relaxed">
                    Under Australian Accounting Standards (AASB 15), a $3,500 12-month upfront payment cannot be recognized as immediate sales revenue in QBO in month 1; it must sit in unearned revenue and prorate monthly. Google Sheets handles this automatic recognition schedule with transparent formulas.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h6 className="font-bold text-[#0b2942]">2. Dispatch Driver Validation Before Accounting Lock</h6>
                  <p className="text-slate-600 leading-relaxed">
                    If a driver encounters unexpected difficulties (e.g. tree branches requiring extra labor or difficult ground placement pads), the dispatcher adjusts the line item in the intermediate sheet before the finalized invoice is posted to QBO.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h6 className="font-bold text-[#0b2942]">3. Zero Accounting License Costs for Field Staff</h6>
                  <p className="text-slate-600 leading-relaxed">
                    Forklift yard operators and delivery drivers need to see delivery slots, addresses, and container sizes. They can view the Google Sheet or Smartsheet on their phones without requiring $40+/mo QuickBooks Online user licenses.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <h6 className="font-bold text-[#0b2942]">4. Rate-Limit & API Token Resilience</h6>
                  <p className="text-slate-600 leading-relaxed">
                    Intuit's OAuth tokens expire and API maintenance windows can cause silent dropouts. The intermediate sheet acts as an infallible, permanent audit log buffer so zero customer bookings are ever lost.
                  </p>
                </div>
              </div>
            </div>

            {/* Webhook Sync Test Simulator */}
            <div className="bg-sky-50/70 rounded-3xl p-6 border border-sky-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-extrabold text-[#0b2942]">
                    Interactive Webhook Sync Test Simulator
                  </h4>
                  <p className="text-xs text-slate-600">
                    Test posting active customer orders & invoices to the Google Sheets / Smartsheet staging queue and QuickBooks Online API.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateWebhookSync}
                  className="px-5 py-2.5 bg-[#00c0f3] hover:bg-[#00a8d6] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  Simulate Webhook Sync
                </button>
              </div>

              {syncFeedback && (
                <div className="p-3.5 bg-white rounded-xl border border-sky-300 text-xs font-semibold text-emerald-800 animate-in fade-in duration-200">
                  {syncFeedback}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 1: CUSTOMER LEADS CRM ================= */}
        {activeTab === 'leads' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-[#0b2942]">Customer Inquiries & Quotes</h3>
                <p className="text-xs text-slate-500">
                  Collected customer leads for follow-up calls, SMS dispatch, and CRM marketing.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export to CSV</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={leadsSearch}
                  onChange={(e) => setLeadsSearch(e.target.value)}
                  placeholder="Search by customer name, mobile, email, suburb, or postcode..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#00c0f3]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Status:</span>
                {['All', 'New', 'Contacted', 'Booked', 'Follow-up'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setLeadStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      leadStatusFilter === st
                        ? 'bg-[#0b2942] text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            {filteredLeads.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <Users className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">No matching customer quotes found</p>
                <p className="text-xs text-slate-400 mt-1">Quotes submitted via the app will automatically appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Container & Service</th>
                      <th className="py-3 px-4">First Payment</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Follow-up Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div>{lead.firstName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {new Date(lead.createdAt).toLocaleDateString()} {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-mono text-slate-800">{lead.mobile}</div>
                          <div className="text-slate-500 text-[11px]">{lead.email}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="px-1.5 py-0.5 rounded bg-sky-50 text-[#00c0f3] text-[9px] font-bold">
                              SMS Sent
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-bold">
                              Email Sent
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">
                            {lead.quote.originPostcode.suburb}
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            {lead.quote.originPostcode.state} {lead.quote.originPostcode.postcode} (Zone {lead.quote.deliveryZone})
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{lead.quote.containerName}</div>
                          <div className="text-slate-500 text-[11px]">
                            {lead.quote.serviceType.replace(/_/g, ' ')} · {lead.quote.storageDuration.replace(/_/g, ' ')}
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-900 text-sm">
                          ${lead.quote.firstPaymentTotal}
                        </td>

                        <td className="py-3 px-4">
                          <select
                            value={lead.status}
                            onChange={(e) => onUpdateLeadStatus(lead.id, e.target.value as any)}
                            className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#00c0f3]"
                          >
                            <option value="New">New</option>
                            <option value="Contacted">Contacted</option>
                            <option value="Booked">Booked</option>
                            <option value="Follow-up">Follow-up</option>
                            <option value="Archived">Archived</option>
                          </select>
                        </td>

                        <td className="py-3 px-4">
                          <div className="space-y-1 max-w-xs">
                            {lead.notes && lead.notes.length > 0 && (
                              <div className="text-[11px] text-slate-600 bg-slate-100 p-1.5 rounded">
                                {lead.notes[lead.notes.length - 1]}
                              </div>
                            )}
                            <div className="flex items-center gap-1 mt-1">
                              <input
                                type="text"
                                placeholder="Add note..."
                                value={newNoteText[lead.id] || ''}
                                onChange={(e) =>
                                  setNewNoteText({ ...newNoteText, [lead.id]: e.target.value })
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && newNoteText[lead.id]?.trim()) {
                                    onAddLeadNote(lead.id, newNoteText[lead.id]);
                                    setNewNoteText({ ...newNoteText, [lead.id]: '' });
                                  }
                                }}
                                className="w-full text-[11px] px-2 py-1 rounded border border-slate-200"
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: DROP-OFF TRACKING & FUNNEL ================= */}
        {activeTab === 'dropoffs' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wide">
                    FUNNEL ANALYTICS
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    {dropOffs.length} recorded sessions
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-[#0b2942] mt-1">
                  Quote Funnel & Page Drop-Off Analytics
                </h3>
                <p className="text-xs text-slate-500">
                  Identifies the exact page where customers stop or abandon the quote process so you can address friction and recover leads.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDropOffs(loadDropOffRecords())}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Refresh Log</span>
                </button>
              </div>
            </div>

            {/* Funnel Stage Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { step: 1, name: 'Page 1: Where', desc: 'Suburb & Postcode check', color: 'border-sky-300 bg-sky-50/50' },
                { step: 2, name: 'Page 2: What', desc: 'Service type & move destination', color: 'border-indigo-300 bg-indigo-50/50' },
                { step: 3, name: 'Page 3: Which Size', desc: 'Container size selection', color: 'border-amber-300 bg-amber-50/50' },
                { step: 4, name: 'Page 4: When', desc: 'Storage duration & billing cycle', color: 'border-purple-300 bg-purple-50/50' },
                { step: 5, name: 'Page 5: Send Quote', desc: 'Email & mobile contact capture', color: 'border-rose-300 bg-rose-50/50' },
                { step: 6, name: 'Page 6: Final Quote', desc: 'Quote viewed & completed', color: 'border-emerald-300 bg-emerald-50/50' },
              ].map((stage) => {
                const countAtStage = dropOffs.filter((d) => d.lastPageStep === stage.step).length;
                const total = dropOffs.length || 1;
                const pct = Math.round((countAtStage / total) * 100);

                return (
                  <div
                    key={stage.step}
                    className={`p-4 rounded-2xl border ${stage.color} space-y-2`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-[#0b2942]">
                        {stage.name}
                      </span>
                      <span className="text-xs font-black font-mono px-2 py-0.5 rounded-full bg-white text-slate-800 border border-slate-200 shadow-2xs">
                        {countAtStage} sessions ({pct}%)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{stage.desc}</p>
                    <div className="w-full bg-white/80 h-2 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className={`h-full ${stage.step === 6 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        style={{ width: `${Math.max(pct, 6)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Filter and Search Bar for Drop-Offs */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by suburb, postcode, email, or mobile..."
                  value={dropOffSearch}
                  onChange={(e) => setDropOffSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#00c0f3]"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={dropOffPageFilter}
                  onChange={(e) => setDropOffPageFilter(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none"
                >
                  <option value="All">All Funnel Pages</option>
                  <option value="Page 1">Page 1: Where</option>
                  <option value="Page 2">Page 2: What</option>
                  <option value="Page 3">Page 3: Which Size</option>
                  <option value="Page 4">Page 4: When</option>
                  <option value="Page 5">Page 5: Send Quote</option>
                  <option value="Page 6">Page 6: Final Quote (Completed)</option>
                </select>
              </div>
            </div>

            {/* Drop-Off Sessions Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Time / Session</th>
                      <th className="px-4 py-3">Drop-Off Page Name</th>
                      <th className="px-4 py-3">Location / Move</th>
                      <th className="px-4 py-3">Container & Qty</th>
                      <th className="px-4 py-3">Duration & Billing</th>
                      <th className="px-4 py-3">Contact Info</th>
                      <th className="px-4 py-3 text-right">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dropOffs
                      .filter((d) => {
                        const q = dropOffSearch.toLowerCase();
                        const matchSearch =
                          !q ||
                          (d.originSuburb && d.originSuburb.toLowerCase().includes(q)) ||
                          (d.originPostcode && d.originPostcode.includes(q)) ||
                          (d.customerEmail && d.customerEmail.toLowerCase().includes(q)) ||
                          (d.customerPhone && d.customerPhone.includes(q)) ||
                          d.lastPageName.toLowerCase().includes(q);

                        const matchPage =
                          dropOffPageFilter === 'All' ||
                          d.lastPageName.toLowerCase().includes(dropOffPageFilter.toLowerCase());

                        return matchSearch && matchPage;
                      })
                      .map((session) => (
                        <tr key={session.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3.5 text-slate-500">
                            <div className="font-mono font-bold text-slate-800">
                              {new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-[10px]">
                              {new Date(session.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </div>
                          </td>

                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg font-extrabold text-[11px] ${
                                session.completed
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : session.lastPageStep === 5
                                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                  : session.lastPageStep === 4
                                  ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                  : session.lastPageStep === 3
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-sky-100 text-sky-800 border border-sky-300'
                              }`}
                            >
                              {session.lastPageName}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 text-slate-700">
                            <div className="font-bold text-[#0b2942]">
                              {session.originSuburb ? `${session.originSuburb} (${session.originPostcode})` : 'Not specified'}
                            </div>
                            {session.destinationSuburb && (
                              <div className="text-[10px] text-slate-500">
                                → Moving to {session.destinationSuburb} ({session.destinationPostcode})
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-slate-700">
                            <div className="font-semibold capitalize">
                              {session.containerSize ? session.containerSize.replace(/_/g, ' ') : 'None'}
                            </div>
                            {session.containerCount && session.containerCount > 1 && (
                              <div className="text-[10px] text-sky-600 font-bold">
                                {session.containerCount} containers
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-slate-600">
                            <div>{session.storageDuration ? session.storageDuration.replace(/_/g, ' ') : '—'}</div>
                            <div className="text-[10px] text-slate-400 capitalize">{session.billingCycle || '—'}</div>
                          </td>

                          <td className="px-4 py-3.5 text-slate-700">
                            {session.customerEmail || session.customerPhone ? (
                              <div className="space-y-0.5">
                                {session.customerPhone && (
                                  <a href={`tel:${session.customerPhone}`} className="font-mono text-[11px] font-bold text-[#00c0f3] hover:underline block">
                                    {session.customerPhone}
                                  </a>
                                )}
                                {session.customerEmail && (
                                  <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                                    {session.customerEmail}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Pre-contact stage</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            {session.completed ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                Completed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                Abandoned
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: CONTAINER & LEG PRICING ================= */}
        {activeTab === 'pricing' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b2942]">Container Hire Rates</h3>
              <p className="text-xs text-slate-500">
                Adjust baseline monthly and weekly hire rates for each Portabox container size.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 10 m³ Container */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h4 className="font-extrabold text-sm text-[#0b2942]">10 m³ Container</h4>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Monthly rate ($ / month)
                  </label>
                  <input
                    type="number"
                    value={currentConfig.containerPrices.small_10m3.monthlyRate}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        containerPrices: {
                          ...currentConfig.containerPrices,
                          small_10m3: {
                            ...currentConfig.containerPrices.small_10m3,
                            monthlyRate: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Weekly rate ($ / week)
                  </label>
                  <input
                    type="number"
                    value={currentConfig.containerPrices.small_10m3.weeklyRate}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        containerPrices: {
                          ...currentConfig.containerPrices,
                          small_10m3: {
                            ...currentConfig.containerPrices.small_10m3,
                            weeklyRate: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold font-mono"
                  />
                </div>
              </div>

              {/* 19 m³ Container */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h4 className="font-extrabold text-sm text-[#0b2942]">19 m³ Container</h4>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Monthly rate ($ / month)
                  </label>
                  <input
                    type="number"
                    value={currentConfig.containerPrices.medium_19m3.monthlyRate}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        containerPrices: {
                          ...currentConfig.containerPrices,
                          medium_19m3: {
                            ...currentConfig.containerPrices.medium_19m3,
                            monthlyRate: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Weekly rate ($ / week)
                  </label>
                  <input
                    type="number"
                    value={currentConfig.containerPrices.medium_19m3.weeklyRate}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        containerPrices: {
                          ...currentConfig.containerPrices,
                          medium_19m3: {
                            ...currentConfig.containerPrices.medium_19m3,
                            weeklyRate: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold font-mono"
                  />
                </div>
              </div>

              {/* 25 m³ Container */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <h4 className="font-extrabold text-sm text-[#0b2942]">25 m³ Container</h4>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Monthly rate ($ / month)
                  </label>
                  <input
                    type="number"
                    value={currentConfig.containerPrices.large_25m3.monthlyRate}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        containerPrices: {
                          ...currentConfig.containerPrices,
                          large_25m3: {
                            ...currentConfig.containerPrices.large_25m3,
                            monthlyRate: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Weekly rate ($ / week)
                  </label>
                  <input
                    type="number"
                    value={currentConfig.containerPrices.large_25m3.weeklyRate}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        containerPrices: {
                          ...currentConfig.containerPrices,
                          large_25m3: {
                            ...currentConfig.containerPrices.large_25m3,
                            weeklyRate: Number(e.target.value),
                          },
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Packing Supplies Pricing Settings */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
              <div>
                <h4 className="font-extrabold text-sm text-[#0b2942]">Packing Supplies & Blanket Rental Rates</h4>
                <p className="text-xs text-slate-500">
                  Set prices for moving cartons and protective blanket hire packages.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Boxes */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2">
                  <h5 className="text-xs font-bold text-[#0b2942] uppercase tracking-wider">Heavy Duty Boxes</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Single Box ($)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={currentConfig.packingSupplies.boxSinglePrice}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            packingSupplies: {
                              ...currentConfig.packingSupplies,
                              boxSinglePrice: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded-lg border font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">10 Pack ($)</label>
                      <input
                        type="number"
                        value={currentConfig.packingSupplies.box10Price}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            packingSupplies: {
                              ...currentConfig.packingSupplies,
                              box10Price: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded-lg border font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">50 Pack ($)</label>
                      <input
                        type="number"
                        value={currentConfig.packingSupplies.box50Price}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            packingSupplies: {
                              ...currentConfig.packingSupplies,
                              box50Price: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded-lg border font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">100 Pack ($)</label>
                      <input
                        type="number"
                        value={currentConfig.packingSupplies.box100Price}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            packingSupplies: {
                              ...currentConfig.packingSupplies,
                              box100Price: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded-lg border font-mono font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Blankets */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2">
                  <h5 className="text-xs font-bold text-[#0b2942] uppercase tracking-wider">Blanket Rental</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-500 block">Single Blanket ($)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={currentConfig.packingSupplies.blanketSinglePrice}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            packingSupplies: {
                              ...currentConfig.packingSupplies,
                              blanketSinglePrice: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded-lg border font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">10 Pack ($)</label>
                      <input
                        type="number"
                        value={currentConfig.packingSupplies.blanket10Price}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            packingSupplies: {
                              ...currentConfig.packingSupplies,
                              blanket10Price: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded-lg border font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">50 Pack ($)</label>
                      <input
                        type="number"
                        value={currentConfig.packingSupplies.blanket50Price}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            packingSupplies: {
                              ...currentConfig.packingSupplies,
                              blanket50Price: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded-lg border font-mono font-bold text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block">100 Pack ($)</label>
                      <input
                        type="number"
                        value={currentConfig.packingSupplies.blanket100Price}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            packingSupplies: {
                              ...currentConfig.packingSupplies,
                              blanket100Price: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2 py-1 rounded-lg border font-mono font-bold text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Domestic Leg Rate */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-white">
              <h4 className="font-extrabold text-sm text-[#0b2942] mb-1">
                Standard Domestic Transport Leg Fee
              </h4>
              <p className="text-xs text-slate-500 mb-4">
                Applies per one-way transport leg ($149 per leg: Initial delivery to A, Move A to B, Return to Portabox depot, Redelivery, Final collection).
              </p>
              <div className="max-w-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-600">$</span>
                  <input
                    type="number"
                    value={currentConfig.domesticLegFee}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        domesticLegFee: Number(e.target.value),
                      })
                    }
                    className="w-32 px-3 py-2 rounded-xl border border-slate-300 text-base font-bold font-mono"
                  />
                  <span className="text-xs text-slate-500">per domestic leg</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: DELIVERY ZONES & KM CHARGES ================= */}
        {activeTab === 'zones' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b2942]">Delivery Zones & Moving Km Surcharges</h3>
              <p className="text-xs text-slate-500">
                Configure distance thresholds from the Portabox depots and rate per km (calculated on a one-way basis).
              </p>
            </div>

            <div className="space-y-4">
              {/* Zone 1 */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-[#00c0f3] uppercase tracking-wider">Zone 1</span>
                  <h4 className="font-bold text-sm text-[#0b2942]">Metro Base Radius</h4>
                  <p className="text-xs text-slate-500">Free delivery distance radius</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <label className="text-[10px] text-slate-400 block">Max Distance</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={currentConfig.deliveryZones.zone1MaxKm}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            deliveryZones: {
                              ...currentConfig.deliveryZones,
                              zone1MaxKm: Number(e.target.value),
                            },
                          })
                        }
                        className="w-16 px-2 py-1 rounded-lg border text-xs font-bold font-mono"
                      />
                      <span className="text-xs text-slate-500">km</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <label className="text-[10px] text-slate-400 block">Rate / Km</label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold">$</span>
                      <input
                        type="number"
                        value={currentConfig.deliveryZones.zone1RatePerKm}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            deliveryZones: {
                              ...currentConfig.deliveryZones,
                              zone1RatePerKm: Number(e.target.value),
                            },
                          })
                        }
                        className="w-16 px-2 py-1 rounded-lg border text-xs font-bold font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Zone 2 */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-[#00c0f3] uppercase tracking-wider">Zone 2</span>
                  <h4 className="font-bold text-sm text-[#0b2942]">Outer Metro & Semi-Rural</h4>
                  <p className="text-xs text-slate-500">Intermediate delivery zone</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <label className="text-[10px] text-slate-400 block">Max Distance</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={currentConfig.deliveryZones.zone2MaxKm}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            deliveryZones: {
                              ...currentConfig.deliveryZones,
                              zone2MaxKm: Number(e.target.value),
                            },
                          })
                        }
                        className="w-16 px-2 py-1 rounded-lg border text-xs font-bold font-mono"
                      />
                      <span className="text-xs text-slate-500">km</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <label className="text-[10px] text-slate-400 block">Rate / Km</label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold">$</span>
                      <input
                        type="number"
                        value={currentConfig.deliveryZones.zone2RatePerKm}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            deliveryZones: {
                              ...currentConfig.deliveryZones,
                              zone2RatePerKm: Number(e.target.value),
                            },
                          })
                        }
                        className="w-16 px-2 py-1 rounded-lg border text-xs font-bold font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Zone 3 */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-[#00c0f3] uppercase tracking-wider">Zone 3</span>
                  <h4 className="font-bold text-sm text-[#0b2942]">Regional Australia</h4>
                  <p className="text-xs text-slate-500">Longer distance regional transit</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <label className="text-[10px] text-slate-400 block">Max Distance</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={currentConfig.deliveryZones.zone3MaxKm}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            deliveryZones: {
                              ...currentConfig.deliveryZones,
                              zone3MaxKm: Number(e.target.value),
                            },
                          })
                        }
                        className="w-16 px-2 py-1 rounded-lg border text-xs font-bold font-mono"
                      />
                      <span className="text-xs text-slate-500">km</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <label className="text-[10px] text-slate-400 block">Rate / Km</label>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold">$</span>
                      <input
                        type="number"
                        value={currentConfig.deliveryZones.zone3RatePerKm}
                        onChange={(e) =>
                          setCurrentConfig({
                            ...currentConfig,
                            deliveryZones: {
                              ...currentConfig.deliveryZones,
                              zone3RatePerKm: Number(e.target.value),
                            },
                          })
                        }
                        className="w-16 px-2 py-1 rounded-lg border text-xs font-bold font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Zone 4 */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Zone 4 (300+ km)</span>
                  <h4 className="font-bold text-sm text-[#0b2942]">Call for Custom Pricing</h4>
                  <p className="text-xs text-slate-500">Routes over 300km prompt user to call 1800 467 637</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentConfig.deliveryZones.zone4CallPricing}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        deliveryZones: {
                          ...currentConfig.deliveryZones,
                          zone4CallPricing: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 rounded text-[#00c0f3]"
                  />
                  <span className="text-xs font-bold text-slate-700">Enabled</span>
                </label>
              </div>
            </div>

            {/* Fuel Surcharge Configuration ($0.50/km travelled) - Blue lettering, no yellow, only set by Portabox admin */}
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/70 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-extrabold text-blue-700">Fuel Surcharge Setting</h4>
                  <p className="text-xs text-blue-800/80">
                    Surcharge assessed per km travelled (driving distance) on road routes and moves. Only set by Portabox admin (not optional for customers).
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto">
                  <input
                    type="checkbox"
                    checked={currentConfig.fuelSurchargeEnabled !== false}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        fuelSurchargeEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-blue-900">Active (Included in Quotes)</span>
                </label>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-blue-900">Surcharge rate per km:</label>
                <div className="relative w-32">
                  <span className="absolute left-3 top-2 text-xs font-bold text-blue-400">$</span>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={currentConfig.fuelSurchargeRatePerKm || 0.50}
                    onChange={(e) =>
                      setCurrentConfig({
                        ...currentConfig,
                        fuelSurchargeRatePerKm: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full pl-6 pr-3 py-1.5 text-xs font-bold font-mono rounded-lg border border-blue-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-blue-950"
                  />
                </div>
                <span className="text-xs text-blue-700 font-medium">/ km travelled</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: INTERSTATE LEGS ================= */}
        {activeTab === 'interstate' && (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b2942]">Interstate Freight Legs (One-way)</h3>
              <p className="text-xs text-slate-500">
                Fixed line-haul freight prices between major Australian capitals and coastal corridors.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {Object.entries(currentConfig.interstateRates).map(([route, rate]) => (
                <div
                  key={route}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#00c0f3]" />
                    <span className="text-xs font-bold text-slate-800">
                      {route.replace('->', ' → ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-slate-600">$</span>
                    <input
                      type="number"
                      value={rate}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          interstateRates: {
                            ...currentConfig.interstateRates,
                            [route]: Number(e.target.value),
                          },
                        })
                      }
                      className="w-20 px-2 py-1 rounded-lg border text-xs font-bold font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 5: PROMOTIONS ENGINE ================= */}
        {activeTab === 'promotions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-[#0b2942]">Active Promotions & Radius Rules</h3>
                <p className="text-xs text-slate-500">
                  Target promotions by postcode, radius, route (e.g. Adelaide to Brisbane), container size, or coupon code.
                </p>
              </div>

              <button
                onClick={() => setIsAddingPromo(!isAddingPromo)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#00c0f3] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingPromo ? 'Cancel' : 'Create Promotion'}</span>
              </button>
            </div>

            {/* Create Promo Card */}
            {isAddingPromo && (
              <div className="p-5 rounded-2xl bg-sky-50/80 border border-sky-200 space-y-4">
                <h4 className="font-extrabold text-sm text-[#0b2942]">New Promotional Rule</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Promo Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Free Delivery Special"
                      value={newPromo.name}
                      onChange={(e) => setNewPromo({ ...newPromo, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border bg-white text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Promo Code (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. FREEDEL"
                      value={newPromo.code}
                      onChange={(e) => setNewPromo({ ...newPromo, code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-xl border bg-white text-xs font-semibold uppercase"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Promo Type</label>
                    <select
                      value={newPromo.type}
                      onChange={(e) => setNewPromo({ ...newPromo, type: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border bg-white text-xs font-semibold"
                    >
                      <option value="free_initial_delivery">Initial Delivery Free ($149)</option>
                      <option value="percent_off_first_month">% Off First Month Storage</option>
                      <option value="free_first_month">First Month Free</option>
                      <option value="free_third_month">Third Month Free</option>
                      <option value="percent_off_interstate">% Off Interstate Move</option>
                      <option value="free_container_upgrade">Free Upgrade to Larger Container</option>
                      <option value="fixed_discount">Fixed Dollar Discount ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Value (% or $)</label>
                    <input
                      type="number"
                      value={newPromo.value}
                      onChange={(e) => setNewPromo({ ...newPromo, value: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border bg-white text-xs font-semibold font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Postcode (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 5061 or empty for all"
                      value={newPromo.targetPostcode}
                      onChange={(e) => setNewPromo({ ...newPromo, targetPostcode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border bg-white text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Target Radius (Km)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={newPromo.targetRadiusKm}
                      onChange={(e) => setNewPromo({ ...newPromo, targetRadiusKm: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border bg-white text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPromo.autoApply}
                      onChange={(e) => setNewPromo({ ...newPromo, autoApply: e.target.checked })}
                      className="w-4 h-4 rounded text-[#00c0f3]"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Auto-apply without requiring coupon code
                    </span>
                  </label>

                  <button
                    onClick={() => {
                      if (!newPromo.name) {
                        alert('Please provide a promo name.');
                        return;
                      }
                      const created: PromotionRule = {
                        id: `promo-${Date.now()}`,
                        name: newPromo.name || 'Special Promo',
                        code: newPromo.code,
                        description: newPromo.description || newPromo.name || '',
                        type: newPromo.type || 'percent_off_first_month',
                        value: newPromo.value || 50,
                        targetPostcode: newPromo.targetPostcode || undefined,
                        targetRadiusKm: newPromo.targetRadiusKm || undefined,
                        active: true,
                        autoApply: newPromo.autoApply || false,
                      };
                      setCurrentConfig({
                        ...currentConfig,
                        promotions: [created, ...currentConfig.promotions],
                      });
                      setIsAddingPromo(false);
                    }}
                    className="px-5 py-2 bg-[#0b2942] text-white rounded-xl text-xs font-bold"
                  >
                    Save Promotion
                  </button>
                </div>
              </div>
            )}

            {/* List of existing promos */}
            <div className="space-y-3">
              {currentConfig.promotions.map((promo) => (
                <div
                  key={promo.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    promo.active ? 'bg-white border-slate-200 shadow-xs' : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[#0b2942]">{promo.name}</span>
                      {promo.code && (
                        <span className="px-2 py-0.5 rounded bg-sky-50 text-[#00c0f3] font-mono font-bold text-[10px] border border-sky-100">
                          {promo.code}
                        </span>
                      )}
                      {promo.autoApply && (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          Auto-applied
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{promo.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                      <span>Type: {promo.type.replace(/_/g, ' ')}</span>
                      {promo.targetPostcode && <span>• Target Postcode: {promo.targetPostcode} ({promo.targetRadiusKm}km)</span>}
                      {promo.targetHubOrigin && <span>• Route: {promo.targetHubOrigin} → {promo.targetHubDestination}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <button
                      onClick={() => {
                        const updated = currentConfig.promotions.map((p) =>
                          p.id === promo.id ? { ...p, active: !p.active } : p
                        );
                        setCurrentConfig({ ...currentConfig, promotions: updated });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        promo.active
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {promo.active ? 'Active' : 'Inactive'}
                    </button>

                    <button
                      onClick={() => {
                        const updated = currentConfig.promotions.filter((p) => p.id !== promo.id);
                        setCurrentConfig({ ...currentConfig, promotions: updated });
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 6: BLOCKED POSTCODES ================= */}
        {activeTab === 'blocked' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b2942]">Blocked & Restricted Postcodes</h3>
              <p className="text-xs text-slate-500">
                Block specific postcodes not serviceable by Portabox (e.g. island ferries, inaccessible regional roads).
              </p>
            </div>

            {/* Add new blocked postcode */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Postcode (e.g. 5222)"
                value={newBlocked.postcode}
                onChange={(e) => setNewBlocked({ ...newBlocked, postcode: e.target.value })}
                className="w-full sm:w-28 px-3 py-2 rounded-xl border bg-white text-xs font-semibold"
              />
              <input
                type="text"
                placeholder="Suburb name (e.g. Kangaroo Island)"
                value={newBlocked.suburb}
                onChange={(e) => setNewBlocked({ ...newBlocked, suburb: e.target.value })}
                className="w-full sm:w-44 px-3 py-2 rounded-xl border bg-white text-xs font-semibold"
              />
              <input
                type="text"
                placeholder="Reason (e.g. Ferry required; call dispatch)"
                value={newBlocked.reason}
                onChange={(e) => setNewBlocked({ ...newBlocked, reason: e.target.value })}
                className="flex-1 px-3 py-2 rounded-xl border bg-white text-xs font-semibold"
              />
              <button
                onClick={() => {
                  if (!newBlocked.postcode.trim()) return;
                  setCurrentConfig({
                    ...currentConfig,
                    blockedPostcodes: [newBlocked, ...currentConfig.blockedPostcodes],
                  });
                  setNewBlocked({ postcode: '', suburb: '', reason: '' });
                }}
                className="px-4 py-2 bg-[#0b2942] text-white rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap"
              >
                Add Block
              </button>
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white">
              {currentConfig.blockedPostcodes.map((b) => (
                <div key={b.postcode} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm font-mono text-[#0b2942]">{b.postcode}</span>
                      <span className="font-bold text-xs text-slate-700">{b.suburb}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{b.reason}</p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentConfig({
                        ...currentConfig,
                        blockedPostcodes: currentConfig.blockedPostcodes.filter(
                          (item) => item.postcode !== b.postcode
                        ),
                      });
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 7: DEPOT LOCATIONS ================= */}
        {activeTab === 'depots' && (
          <div className="space-y-6 max-w-3xl">
            <div>
              <h3 className="text-lg font-extrabold text-[#0b2942]">Active Portabox Depot Hubs</h3>
              <p className="text-xs text-slate-500">
                Operating facilities where Portabox container trucks and customer containers are dispatched from.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PORTABOX_DEPOTS.map((depot) => (
                <div key={depot.id} className="p-5 rounded-2xl border border-slate-200 bg-white space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-sky-50 text-[#00c0f3]">
                      {depot.state} Hub
                    </span>
                    <span className="font-mono text-xs text-slate-400">{depot.postcode}</span>
                  </div>
                  <h4 className="font-extrabold text-base text-[#0b2942]">{depot.name}</h4>
                  <p className="text-xs text-slate-600">
                    {depot.address}, {depot.suburb} {depot.state} {depot.postcode}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    Lat: {depot.lat} · Lng: {depot.lng}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 8: FEATURE FLAGS & APPLICATION MODULES ================= */}
        {activeTab === 'features' && (
          <div className="space-y-6 max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-[#0b2942]">Feature Flags & App Modules</h3>
                <p className="text-xs text-slate-500">
                  Select or deselect operational modules and customer-facing features across the Portabox app.
                </p>
              </div>
              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  ✓ Feature settings saved!
                </span>
              )}
            </div>

            {/* Feature 1: Call Center Dispatch & Fleet Logistics */}
            <div className={`p-6 rounded-2xl border transition-all ${
              currentConfig.enableCallCenterDispatch !== false
                ? 'bg-white border-slate-200 shadow-xs'
                : 'bg-amber-50/50 border-amber-200'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl text-white shrink-0 ${
                    currentConfig.enableCallCenterDispatch !== false ? 'bg-indigo-600 shadow-xs' : 'bg-slate-400'
                  }`}>
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="text-base font-extrabold text-[#0b2942]">
                        Call Center Dispatch & Logistics Routing
                      </h4>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        currentConfig.enableCallCenterDispatch !== false
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {currentConfig.enableCallCenterDispatch !== false ? 'Feature Selected (Enabled)' : 'Feature Deselected (Disabled)'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      Controls whether the Call Center Dispatch booking portal, Google Calendar scheduling, fleet route optimization engine, and driver routing sheets are available in the application.
                    </p>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${currentConfig.enableCallCenterDispatch !== false ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>Call Center Dispatch button in header</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${currentConfig.enableCallCenterDispatch !== false ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>Google Calendar container schedule</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${currentConfig.enableCallCenterDispatch !== false ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>Fleet routing optimizer & 48-hr suggestions</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${currentConfig.enableCallCenterDispatch !== false ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>Trailer capacity allocation & driver sheets</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleCallCenterDispatch(currentConfig.enableCallCenterDispatch === false)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                      currentConfig.enableCallCenterDispatch !== false
                        ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {currentConfig.enableCallCenterDispatch !== false ? 'Deselect Feature' : 'Select Feature (Enable)'}
                  </button>
                  <span className="text-[11px] text-slate-400">
                    {currentConfig.enableCallCenterDispatch !== false ? 'Click to deselect from app' : 'Click to restore feature'}
                  </span>
                </div>
              </div>
            </div>

            {/* Feature 2: Fuel Surcharge Calculation */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl text-white shrink-0 ${
                    currentConfig.fuelSurchargeEnabled ? 'bg-amber-600' : 'bg-slate-400'
                  }`}>
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="text-base font-extrabold text-[#0b2942]">
                        Dynamic Fuel Surcharge (${currentConfig.fuelSurchargeRatePerKm.toFixed(2)}/km)
                      </h4>
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        currentConfig.fuelSurchargeEnabled
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {currentConfig.fuelSurchargeEnabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      Automatically calculates transport diesel surcharge for deliveries and interstate legs based on current distance traveled.
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const updated: AppConfig = {
                        ...currentConfig,
                        fuelSurchargeEnabled: !currentConfig.fuelSurchargeEnabled,
                      };
                      setCurrentConfig(updated);
                      onSaveConfig(updated);
                      setSaveSuccess(true);
                      setTimeout(() => setSaveSuccess(false), 2500);
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
                      currentConfig.fuelSurchargeEnabled
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {currentConfig.fuelSurchargeEnabled ? 'Deselect Surcharge' : 'Enable Surcharge'}
                  </button>
                </div>
              </div>
            </div>

            {/* Feature 3: Braintree Gateway & Payment Processing */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-[#00c0f3] text-white shrink-0 shadow-xs">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="text-base font-extrabold text-[#0b2942]">
                        Braintree Payment Processing (PayPal Service)
                      </h4>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                        Merchant Vault Tokenization Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      Accepts credit cards (Visa, Mastercard, AMEX), PayPal 3-in-1, and Google Pay via Braintree Hosted Fields with automatic recurring monthly vault storage.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer reset button */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>Portabox Instant Quote Engine v2.4</span>
        <button
          onClick={handleResetDefaults}
          className="flex items-center gap-1 text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset all to factory defaults</span>
        </button>
      </div>
    </div>
  );
};
