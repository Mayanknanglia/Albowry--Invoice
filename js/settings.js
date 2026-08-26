// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Settings Module
// ═══════════════════════════════════════════════════════

function renderSettings(container) {
    const s = DB.getSettings();
    const creds = JSON.parse(localStorage.getItem('albowry_credentials')) || { email: 'admin@albowry.com', password: 'admin' };

    container.innerHTML = `
        <div class="settings-page">
            
            <div class="settings-grid">
                <!-- COMPANY INFO -->
                <div class="settings-section">
                    <div class="settings-section-header">🏢 Company Information</div>
                    <div class="settings-section-body">
                        <div class="form-group">
                            <label>Company Name *</label>
                            <input type="text" id="set_companyName" value="${s.companyName || ''}">
                        </div>
                        <div class="form-group">
                            <label>Address *</label>
                            <textarea id="set_address" rows="2">${s.address || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>Phone</label>
                                <input type="text" id="set_phone" value="${s.phone || ''}">
                            </div>
                            <div class="form-group">
                                <label>Email</label>
                                <input type="email" id="set_email" value="${s.email || ''}">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Website</label>
                            <input type="text" id="set_website" value="${s.website || ''}">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label>TRN (Tax Registration No.)</label>
                                <input type="text" id="set_trn" value="${s.trn || ''}" placeholder="15-digit TRN">
                            </div>
                            <div class="form-group">
                                <label>VAT Rate (%)</label>
                                <input type="number" id="set_vatRate" value="${s.vatRate || 5}" step="0.01">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- BANK DETAILS -->
                <div class="settings-section">
                    <div class="settings-section-header">🏦 Bank Details</div>
                    <div class="settings-section-body">
                        <div class="form-group">
                            <label>Bank Name</label>
                            <input type="text" id="set_bankName" value="${s.bankName || ''}">
                        </div>
                        <div class="form-group">
                            <label>Account Number</label>
                            <input type="text" id="set_bankAccount" value="${s.bankAccount || ''}">
                        </div>
                        <div class="form-group">
                            <label>IBAN</label>
                            <input type="text" id="set_bankIban" value="${s.bankIban || ''}">
                        </div>
                        <div class="form-group">
                            <label>Branch</label>
                            <input type="text" id="set_bankBranch" value="${s.bankBranch || ''}">
                        </div>
                    </div>
                </div>

                <!-- INVOICE PREFERENCES -->
                <div class="settings-section">
                    <div class="settings-section-header">📄 Invoice Preferences</div>
                    <div class="settings-section-body">
                        <div class="form-group">
                            <label>Invoice Prefix</label>
                            <input type="text" id="set_invoicePrefix" value="${s.invoicePrefix || 'ABC'}" placeholder="e.g., ABC">
                            <div class="hint">Format: PREFIX-YEAR-NUMBER (e.g., ABC-2026-001)</div>
                        </div>
                        <div class="form-group">
                            <label>Invoice Terms & Notes</label>
                            <textarea id="set_invoiceNotes" rows="4">${s.invoiceNotes || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>Quotation Terms & Notes</label>
                            <textarea id="set_quotationNotes" rows="4">${s.quotationNotes || ''}</textarea>
                        </div>
                    </div>
                </div>

                <!-- LOGO & PHOTO -->
                <div class="settings-section">
                    <div class="settings-section-header">🖼️ Branding</div>
                    <div class="settings-section-body">
                        <div class="form-group">
                            <label>Company Logo (For Invoice PDF)</label>
                            ${s.logoUrl ? `<img src="${s.logoUrl}" class="logo-preview" id="logoPreview">` : `<img src="" class="logo-preview" id="logoPreview" style="display:none;">`}
                            <input type="file" accept="image/*" onchange="uploadLogo(event)">
                            <div class="hint">Recommended: PNG with transparent background, 300x300px</div>
                        </div>
                        <div class="form-group">
                            <label>Admin Profile Photo</label>
                            ${s.profilePhoto ? `<img src="${s.profilePhoto}" class="photo-preview" id="photoPreview">` : `<img src="" class="photo-preview" id="photoPreview" style="display:none;">`}
                            <input type="file" accept="image/*" onchange="uploadPhoto(event)">
                        </div>
                    </div>
                </div>

                <!-- LOGIN CREDENTIALS -->
                <div class="settings-section">
                    <div class="settings-section-header">🔐 Login Credentials</div>
                    <div class="settings-section-body">
                        <div class="form-group">
                            <label>Login Email</label>
                            <input type="email" id="set_loginEmail" value="${creds.email}">
                        </div>
                        <div class="form-group">
                            <label>Login Password</label>
                            <input type="text" id="set_loginPassword" value="${creds.password}">
                            <div class="hint">Change password to secure your account</div>
                        </div>
                    </div>
                </div>

                <!-- DATA MANAGEMENT -->
                <div class="settings-section">
                    <div class="settings-section-header">💾 Data Backup & Restore</div>
                    <div class="settings-section-body">
                        <p style="font-size:0.85rem;color:var(--text-light);margin-bottom:12px;">
                            Backup your data regularly. All information is stored locally in your browser.
                        </p>
                        <div class="btn-group">
                            <button class="btn btn-success btn-sm" onclick="exportBackup()">📥 Export Backup (JSON)</button>
                            <label class="btn btn-outline btn-sm" style="margin:0;cursor:pointer;">
                                📤 Import Backup
                                <input type="file" accept=".json" onchange="importBackup(event)" style="display:none;">
                            </label>
                            <button class="btn btn-danger btn-sm" onclick="clearAllData()">🗑️ Clear All Data</button>
                        </div>
                    </div>
                </div>

            </div>

            <div class="card mt-3">
                <div class="card-body text-center">
                    <button class="btn btn-primary" style="padding:12px 40px;font-size:1rem;" onclick="saveAllSettings()">💾 Save All Settings</button>
                </div>
            </div>
        </div>
    `;
}

// Upload Logo (Compress and save as base64)
function uploadLogo(event) {
    const file = event.target.files[0];
    if (!file) return;
    compressImage(file, 400, (dataUrl) => {
        document.getElementById('logoPreview').src = dataUrl;
        document.getElementById('logoPreview').style.display = 'block';
        window._newLogo = dataUrl;
        showToast('Logo uploaded! Click Save to apply.', 'info');
    });
}

// Upload Profile Photo
function uploadPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;
    compressImage(file, 300, (dataUrl) => {
        document.getElementById('photoPreview').src = dataUrl;
        document.getElementById('photoPreview').style.display = 'block';
        window._newPhoto = dataUrl;
        showToast('Photo uploaded! Click Save to apply.', 'info');
    });
}

// Image Compression
function compressImage(file, maxSize, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width, h = img.height;
            if (w > h) {
                if (w > maxSize) { h *= maxSize / w; w = maxSize; }
            } else {
                if (h > maxSize) { w *= maxSize / h; h = maxSize; }
            }
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            callback(canvas.toDataURL('image/png', 0.85));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Save Settings
function saveAllSettings() {
    const settings = DB.getSettings();
    
    settings.companyName = document.getElementById('set_companyName').value.trim();
    settings.address = document.getElementById('set_address').value.trim();
    settings.phone = document.getElementById('set_phone').value.trim();
    settings.email = document.getElementById('set_email').value.trim();
    settings.website = document.getElementById('set_website').value.trim();
    settings.trn = document.getElementById('set_trn').value.trim();
    settings.vatRate = parseFloat(document.getElementById('set_vatRate').value) || 5;
    settings.bankName = document.getElementById('set_bankName').value.trim();
    settings.bankAccount = document.getElementById('set_bankAccount').value.trim();
    settings.bankIban = document.getElementById('set_bankIban').value.trim();
    settings.bankBranch = document.getElementById('set_bankBranch').value.trim();
    settings.invoicePrefix = document.getElementById('set_invoicePrefix').value.trim() || 'ABC';
    settings.invoiceNotes = document.getElementById('set_invoiceNotes').value.trim();
    settings.quotationNotes = document.getElementById('set_quotationNotes').value.trim();

    if (window._newLogo) settings.logoUrl = window._newLogo;
    if (window._newPhoto) settings.profilePhoto = window._newPhoto;

    DB.saveSettings(settings);

    // Update credentials
    const newEmail = document.getElementById('set_loginEmail').value.trim();
    const newPass = document.getElementById('set_loginPassword').value;
    if (newEmail && newPass) updateCredentials(newEmail, newPass);

    loadSidebarInfo();
    showToast('Settings saved successfully!', 'success');
    window._newLogo = null;
    window._newPhoto = null;
}

// Export Backup
function exportBackup() {
    const data = {
        settings: DB.getSettings(),
        customers: DB.get(DB_KEYS.CUSTOMERS),
        suppliers: DB.get(DB_KEYS.SUPPLIERS),
        invoices: DB.get(DB_KEYS.INVOICES),
        quotations: DB.get(DB_KEYS.QUOTATIONS),
        purchases: DB.get(DB_KEYS.PURCHASES),
        invCounter: localStorage.getItem(DB_KEYS.INV_COUNTER),
        quoCounter: localStorage.getItem(DB_KEYS.QUO_COUNTER),
        credentials: JSON.parse(localStorage.getItem('albowry_credentials') || 'null'),
        exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `albowry-backup-${getTodayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup downloaded!', 'success');
}

// Import Backup
async function importBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    const confirmed = await confirmDialog('This will REPLACE all your current data. Continue?');
    if (!confirmed) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.settings) DB.saveSettings(data.settings);
            if (data.customers) DB.set(DB_KEYS.CUSTOMERS, data.customers);
            if (data.suppliers) DB.set(DB_KEYS.SUPPLIERS, data.suppliers);
            if (data.invoices) DB.set(DB_KEYS.INVOICES, data.invoices);
            if (data.quotations) DB.set(DB_KEYS.QUOTATIONS, data.quotations);
            if (data.purchases) DB.set(DB_KEYS.PURCHASES, data.purchases);
            if (data.invCounter) localStorage.setItem(DB_KEYS.INV_COUNTER, data.invCounter);
            if (data.quoCounter) localStorage.setItem(DB_KEYS.QUO_COUNTER, data.quoCounter);
            if (data.credentials) localStorage.setItem('albowry_credentials', JSON.stringify(data.credentials));
            showToast('Backup restored successfully!', 'success');
            setTimeout(() => window.location.reload(), 1000);
        } catch (err) {
            showToast('Invalid backup file!', 'error');
        }
    };
    reader.readAsText(file);
}

// Clear All Data
async function clearAllData() {
    const confirmed = await confirmDialog('⚠️ DANGER! This will delete ALL data permanently. Are you absolutely sure?');
    if (!confirmed) return;
    const doubleCheck = await confirmDialog('This action cannot be undone. Confirm one more time?');
    if (!doubleCheck) return;

    Object.values(DB_KEYS).forEach(key => localStorage.removeItem(key));
    localStorage.removeItem('albowry_credentials');
    showToast('All data cleared!', 'warning');
    setTimeout(() => window.location.reload(), 1000);
}