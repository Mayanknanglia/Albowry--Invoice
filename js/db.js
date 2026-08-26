// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Firebase Sync Database
// Real-time Cloud Sync + Offline Persistence
// ═══════════════════════════════════════════════════════

// 1. FIREBASE CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyBUwJpcQUvVFWb-CVKafaX3P9H-lpGxKz8",
    authDomain: "albowry-invoice.firebaseapp.com",
    projectId: "albowry-invoice",
    storageBucket: "albowry-invoice.firebasestorage.app",
    messagingSenderId: "193429023835",
    appId: "1:193429023835:web:d066dd452474df6704e37e",
    measurementId: "G-ZRKR6KV0NV"
};

// 2. INITIALIZE FIREBASE
firebase.initializeApp(firebaseConfig);
const dbFirestore = firebase.firestore();

// Enable Offline Mode
dbFirestore.enablePersistence().catch(err => {
    console.error("Offline persistence error:", err.code);
});

// 3. DEFAULT SETTINGS
const DEFAULT_SETTINGS = {
    companyName: 'Al Bowry Carpentry LLC',
    address: 'Sharjah, United Arab Emirates',
    trn: '100XXXXXXXXX3',
    email: 'albowry1989@gmail.com',
    phone: '+971-54-785-7469',
    website: 'www.albowry.com',
    bankName: 'Emirates NBD',
    bankAccount: '101XXXXXXXXX',
    bankIban: 'AEXXXXXXXXXXXXXXXXXXXXX',
    bankBranch: 'Sharjah Main Branch',
    invoicePrefix: 'ABC',
    vatRate: 5,
    logoUrl: 'public/logo.png',
    signatureUrl: '',
    invoiceNotes: '',
    quotationNotes: '1. Quotation valid for 15 days.\n2. LPO required to initiate work.'
};

// 4. MAIN DB ENGINE
const DB_KEYS = {
    CUSTOMERS: 'customers',
    SUPPLIERS: 'suppliers',
    INVOICES: 'invoices',
    QUOTATIONS: 'quotations',
    PURCHASES: 'purchases'
};

const DB = {
    state: {
        settings: null,
        customers: [],
        suppliers: [],
        invoices: [],
        quotations: [],
        purchases: []
    },
    
    isLoaded: false,

    // Boot up and listen to real-time changes
    init(callback) {
        let loadedCollections = 0;
        const totalToLoad = 6; // Settings + 5 Collections

        const checkReady = () => {
            loadedCollections++;
            if (loadedCollections >= totalToLoad && !this.isLoaded) {
                this.isLoaded = true;
                callback();
            } else if (this.isLoaded && typeof renderCurrentPage === 'function') {
                // If already loaded and background update happens, re-render UI!
                renderCurrentPage();
            }
        };

        // 1. Listen to Settings
        dbFirestore.collection('app_data').doc('settings').onSnapshot(doc => {
            if (doc.exists) this.state.settings = { ...DEFAULT_SETTINGS, ...doc.data() };
            else this.state.settings = DEFAULT_SETTINGS;
            checkReady();
        });

        // 2. Listen to all Arrays (Invoices, Customers, etc.)
        Object.values(DB_KEYS).forEach(collectionName => {
            dbFirestore.collection(collectionName).onSnapshot(snapshot => {
                const data = [];
                snapshot.forEach(doc => data.push(doc.data()));
                this.state[collectionName] = data;
                checkReady();
            });
        });
    },

    // ─── READERS (Synchronous, instant UI) ───
    getSettings() {
        return this.state.settings || DEFAULT_SETTINGS;
    },

    get(collectionKey) {
        return this.state[collectionKey] || [];
    },

    // ─── WRITERS (Syncs to Cloud) ───
    async saveSettings(newSettings) {
        this.state.settings = newSettings;
        showToast('Syncing to cloud...', 'info');
        await dbFirestore.collection('app_data').doc('settings').set(newSettings);
        showToast('Settings Saved!', 'success');
    },

    async saveItem(collectionKey, item) {
        showToast('Saving to cloud...', 'info');
        await dbFirestore.collection(collectionKey).doc(item.id).set(item);
    },

    async deleteItem(collectionKey, itemId) {
        showToast('Deleting from cloud...', 'info');
        await dbFirestore.collection(collectionKey).doc(itemId).delete();
    },

    // ─── AUTO COUNTERS (Calculated dynamically) ───
    generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const yearInvoices = this.state.invoices.filter(i => i.invoiceNumber && i.invoiceNumber.includes(`-${year}-`));
        const counter = yearInvoices.length + 1;
        const prefix = (this.state.settings?.invoicePrefix || 'ABC').trim();
        return `${prefix}-${year}-${counter.toString().padStart(3, '0')}`;
    },

    generateQuotationNumber() {
        const year = new Date().getFullYear();
        const yearQuotes = this.state.quotations.filter(q => q.quotationNumber && q.quotationNumber.includes(`-${year}-`));
        const counter = yearQuotes.length + 1;
        return `QT-${year}-${counter.toString().padStart(3, '0')}`;
    }
};
