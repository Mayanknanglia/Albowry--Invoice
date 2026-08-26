// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - LocalStorage Database
// ═══════════════════════════════════════════════════════

const DB_KEYS = {
    SETTINGS: 'albowry_settings',
    CUSTOMERS: 'albowry_customers',
    SUPPLIERS: 'albowry_suppliers',
    INVOICES: 'albowry_invoices',
    QUOTATIONS: 'albowry_quotations',
    PURCHASES: 'albowry_purchases',
    INV_COUNTER: 'albowry_inv_counter',
    QUO_COUNTER: 'albowry_quo_counter'
};

const DEFAULT_SETTINGS = {
    companyName: 'Al Bowry Carpentry LLC',
    address: 'Sharjah, United Arab Emirates',
    trn: '100XXXXXXXXX3', // Placeholder TRN
    email: 'albowry1989@gmail.com',
    phone: '+971-54-785-7469',
    website: 'www.albowry.com',
    bankName: 'Emirates NBD',
    bankAccount: '101XXXXXXXXX',
    bankIban: 'AEXXXXXXXXXXXXXXXXXXXXX',
    bankBranch: 'Sharjah Main Branch',
    invoicePrefix: 'ABC',
    vatRate: 5, // 5% UAE VAT
    logoUrl: 'public/logo.png',
    profilePhoto: '',
    invoiceNotes: '1. All customized carpentry works are non-refundable once started.\n2. 50% advance payment required for approval.\n3. Balance upon completion.',
    quotationNotes: '1. Quotation valid for 15 days.\n2. LPO required to initiate work.'
};

const DB = {
    // Basic CRUD Operations
    get(key) {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    },

    set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },

    // Settings
    getSettings() {
        const data = localStorage.getItem(DB_KEYS.SETTINGS);
        if (!data) {
            this.set(DB_KEYS.SETTINGS, DEFAULT_SETTINGS);
            return DEFAULT_SETTINGS;
        }
        return JSON.parse(data);
    },

    saveSettings(settings) {
        this.set(DB_KEYS.SETTINGS, settings);
    },

    // Invoice Number Generator (e.g., ABC-2026-001)
    generateInvoiceNumber() {
        const settings = this.getSettings();
        const year = new Date().getFullYear();
        let counter = localStorage.getItem(DB_KEYS.INV_COUNTER) || '0';
        counter = parseInt(counter) + 1;
        return `${settings.invoicePrefix}-${year}-${counter.toString().padStart(3, '0')}`;
    },

    incrementInvoiceCounter() {
        let counter = localStorage.getItem(DB_KEYS.INV_COUNTER) || '0';
        localStorage.setItem(DB_KEYS.INV_COUNTER, parseInt(counter) + 1);
    },

    // Quotation Number Generator (e.g., QT-2026-001)
    generateQuotationNumber() {
        const year = new Date().getFullYear();
        let counter = localStorage.getItem(DB_KEYS.QUO_COUNTER) || '0';
        counter = parseInt(counter) + 1;
        return `QT-${year}-${counter.toString().padStart(3, '0')}`;
    },

    incrementQuotationCounter() {
        let counter = localStorage.getItem(DB_KEYS.QUO_COUNTER) || '0';
        localStorage.setItem(DB_KEYS.QUO_COUNTER, parseInt(counter) + 1);
    }
};

// Initialize DB on first load
function initDB() {
    if (!localStorage.getItem(DB_KEYS.SETTINGS)) {
        DB.set(DB_KEYS.SETTINGS, DEFAULT_SETTINGS);
    }
    ['CUSTOMERS', 'SUPPLIERS', 'INVOICES', 'QUOTATIONS', 'PURCHASES'].forEach(key => {
        if (!localStorage.getItem(DB_KEYS[key])) {
            DB.set(DB_KEYS[key], []);
        }
    });
}
initDB();