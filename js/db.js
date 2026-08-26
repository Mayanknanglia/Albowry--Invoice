// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Firebase Sync Database
// Real-time Cloud Sync + Offline + Error Handling
// ═══════════════════════════════════════════════════════

const firebaseConfig = {
    apiKey: "AIzaSyBUwJpcQUvVFWb-CVKafaX3P9H-lpGxKz8",
    authDomain: "albowry-invoice.firebaseapp.com",
    projectId: "albowry-invoice",
    storageBucket: "albowry-invoice.firebasestorage.app",
    messagingSenderId: "193429023835",
    appId: "1:193429023835:web:d066dd452474df6704e37e",
    measurementId: "G-ZRKR6KV0NV"
};

// Init Firebase (only once)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const dbFirestore = firebase.firestore();

// Offline persistence (optional - don't block app if fails)
dbFirestore.enablePersistence({ synchronizeTabs: true }).catch(err => {
    console.warn("Persistence:", err.code);
});

const DEFAULT_SETTINGS = {
    companyName: 'Al Bowry Carpentry LLC',
    address: 'Sharjah, United Arab Emirates',
    trn: '',
    email: 'albowry1989@gmail.com',
    phone: '+971-54-785-7469',
    website: 'www.albowry.com',
    bankName: '',
    bankAccount: '',
    bankIban: '',
    bankBranch: '',
    invoicePrefix: 'ABC',
    vatRate: 5,
    logoUrl: 'public/logo.png',
    profilePhoto: '',
    signatureUrl: '',
    invoiceNotes: '',
    quotationNotes: '1. Quotation valid for 15 days.\n2. LPO required to initiate work.'
};

const DB_KEYS = {
    CUSTOMERS: 'customers',
    SUPPLIERS: 'suppliers',
    INVOICES: 'invoices',
    QUOTATIONS: 'quotations',
    PURCHASES: 'purchases'
};

const DB = {
    state: {
        settings: { ...DEFAULT_SETTINGS },
        customers: [],
        suppliers: [],
        invoices: [],
        quotations: [],
        purchases: []
    },

    isLoaded: false,
    _unsubscribers: [],

    init(callback) {
        // Already loaded? just callback
        if (this.isLoaded) {
            if (callback) callback();
            return;
        }

        const loadingText = document.getElementById('loadingText');
        if (loadingText) loadingText.textContent = 'Connecting to Secure Cloud...';

        let pending = 6; // settings + 5 collections
        let finished = false;
        let hasError = false;

        const doneOne = (label) => {
            pending--;
            console.log('[Firebase] loaded:', label, '| remaining:', pending);
            if (loadingText) loadingText.textContent = `Syncing ${label}...`;

            if (pending <= 0 && !finished) {
                finished = true;
                this.isLoaded = true;
                if (loadingText) loadingText.textContent = 'Ready!';
                if (callback) callback();
            } else if (this.isLoaded && typeof renderCurrentPage === 'function') {
                // Live update from another device
                try { renderCurrentPage(); } catch (e) {}
            }
        };

        const failOne = (label, err) => {
            console.error('[Firebase] ERROR on', label, err);
            hasError = true;
            // Still count as done so app doesn't hang forever
            doneOne(label + ' (error)');
        };

        // TIMEOUT: max 12 seconds — then open app anyway with empty/local defaults
        const timeoutId = setTimeout(() => {
            if (!finished) {
                finished = true;
                this.isLoaded = true;
                console.warn('[Firebase] Timeout — opening app with available data');
                if (loadingText) loadingText.textContent = 'Opened (check internet / Firestore rules)';
                showToast('Cloud slow or blocked. Check Firestore Rules + internet.', 'warning');
                if (callback) callback();
            }
        }, 12000);

        // Clear timeout when fully ready
        const originalCallback = callback;
        callback = () => {
            clearTimeout(timeoutId);
            if (originalCallback) originalCallback();
        };

        // 1) SETTINGS
        try {
            const unsubSettings = dbFirestore.collection('app_data').doc('settings')
                .onSnapshot(
                    (doc) => {
                        if (doc.exists) {
                            this.state.settings = { ...DEFAULT_SETTINGS, ...doc.data() };
                        } else {
                            this.state.settings = { ...DEFAULT_SETTINGS };
                            // Create default settings doc (first run)
                            dbFirestore.collection('app_data').doc('settings')
                                .set(DEFAULT_SETTINGS)
                                .catch(e => console.warn('Could not create settings:', e));
                        }
                        doneOne('settings');
                    },
                    (err) => failOne('settings', err)
                );
            this._unsubscribers.push(unsubSettings);
        } catch (e) {
            failOne('settings', e);
        }

        // 2) COLLECTIONS
        Object.values(DB_KEYS).forEach((collectionName) => {
            try {
                const unsub = dbFirestore.collection(collectionName)
                    .onSnapshot(
                        (snapshot) => {
                            const data = [];
                            snapshot.forEach(doc => {
                                const d = doc.data();
                                // ensure id field
                                if (!d.id) d.id = doc.id;
                                data.push(d);
                            });
                            this.state[collectionName] = data;
                            doneOne(collectionName);
                        },
                        (err) => failOne(collectionName, err)
                    );
                this._unsubscribers.push(unsub);
            } catch (e) {
                failOne(collectionName, e);
            }
        });
    },

    getSettings() {
        return this.state.settings || { ...DEFAULT_SETTINGS };
    },

    get(collectionKey) {
        return this.state[collectionKey] || [];
    },

    async saveSettings(newSettings) {
        this.state.settings = newSettings;
        try {
            await dbFirestore.collection('app_data').doc('settings').set(newSettings);
            showToast('Settings saved to cloud!', 'success');
        } catch (e) {
            console.error(e);
            showToast('Cloud save failed: ' + (e.message || 'error'), 'error');
            throw e;
        }
    },

    async saveItem(collectionKey, item) {
        if (!item.id) item.id = generateId();
        try {
            // Optimistic local update
            const arr = this.state[collectionKey] || [];
            const idx = arr.findIndex(x => x.id === item.id);
            if (idx >= 0) arr[idx] = item;
            else arr.push(item);
            this.state[collectionKey] = arr;

            await dbFirestore.collection(collectionKey).doc(item.id).set(item);
            showToast('Saved to cloud!', 'success');
        } catch (e) {
            console.error(e);
            showToast('Save failed: ' + (e.message || 'Check Firestore rules'), 'error');
            throw e;
        }
    },

    async deleteItem(collectionKey, itemId) {
        try {
            this.state[collectionKey] = (this.state[collectionKey] || []).filter(x => x.id !== itemId);
            await dbFirestore.collection(collectionKey).doc(itemId).delete();
            showToast('Deleted from cloud!', 'success');
        } catch (e) {
            console.error(e);
            showToast('Delete failed: ' + (e.message || 'error'), 'error');
            throw e;
        }
    },

    generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const prefix = (this.getSettings().invoicePrefix || 'ABC').trim() || 'ABC';
        const yearInvoices = (this.state.invoices || []).filter(i =>
            i.invoiceNumber && i.invoiceNumber.includes(`-${year}-`)
        );
        // Find max counter
        let max = 0;
        yearInvoices.forEach(i => {
            const parts = (i.invoiceNumber || '').split('-');
            const n = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(n) && n > max) max = n;
        });
        return `${prefix}-${year}-${(max + 1).toString().padStart(3, '0')}`;
    },

    generateQuotationNumber() {
        const year = new Date().getFullYear();
        const yearQuotes = (this.state.quotations || []).filter(q =>
            q.quotationNumber && q.quotationNumber.includes(`-${year}-`)
        );
        let max = 0;
        yearQuotes.forEach(q => {
            const parts = (q.quotationNumber || '').split('-');
            const n = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(n) && n > max) max = n;
        });
        return `QT-${year}-${(max + 1).toString().padStart(3, '0')}`;
    }
};
