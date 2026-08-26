// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Settings Module (CLOUD SYNCED)
// ═══════════════════════════════════════════════════════

function renderSettings(container) {
    const s = DB.getSettings();
    // Assuming credentials doc was fetched during login, we don't display password for security.
    
    container.innerHTML = `
        <div class="settings-page">
            <div class="settings-grid">
                <!-- COMPANY INFO -->
                <div class="settings-section">
                    <div class="settings-section-header">🏢 Company Information</div>
                    <div class="settings-section-body">
                        <div class="form-group"><label>Company Name *</label><input type="text" id="set_companyName" value="${s.companyName || ''}"></div>
                        <div class="form-group"><label>Address *</label><textarea id="set_address" rows="2">${s.address || ''}</textarea></div>
                        <div class="form-row">
                            <div class="form-group"><label>Phone</label><input type="text" id="set_phone" value="${s.phone || ''}"></div>
                            <div class="form-group"><label>Email</label><input type="email" id="set_email" value="${s.email || ''}"></div>
                        </div>
                        <div class="form-group"><label>Website</label><input type="text" id="set_website" value="${s.website || ''}"></div>
                        <div class="form-row">
                            <div class="form-group"><label>TRN (Tax Registration No.)</label><input type="text" id="set_trn" value="${s.trn || ''}"></div>
                            <div class="form-group"><label>VAT Rate (%)</label><input type="number" id="set_vatRate" value="${s.vatRate || 5}" step="0.01"></div>
                        </div>
                    </div>
                </div>

                <!-- BANK DETAILS -->
                <div class="settings-section">
                    <div class="settings-section-header">🏦 Bank Details</div>
                    <div class="settings-section-body">
                        <div class="form-group"><label>Bank Name</label><input type="text" id="set_bankName" value="${s.bankName || ''}"></div>
                        <div class="form-group"><label>Account Number</label><input type="text" id="set_bankAccount" value="${s.bankAccount || ''}"></div>
                        <div class="form-group"><label>IBAN</label><input type="text" id="set_bankIban" value="${s.bankIban || ''}"></div>
                        <div class="form-group"><label>Branch</label><input type="text" id="set_bankBranch" value="${s.bankBranch || ''}"></div>
                    </div>
                </div>

                <!-- BRANDING -->
                <div class="settings-section">
                    <div class="settings-section-header">🖼️ Branding & Digital Stamp</div>
                    <div class="settings-section-body">
                        <div class="form-group">
                            <label>Company Logo</label>
                            ${s.logoUrl ? `<img src="${s.logoUrl}" class="logo-preview" id="logoPreview" style="max-width:120px; max-height:80px; object-fit:contain; border:1px solid var(--border); padding:5px; margin-bottom:8px; display:block;">` : `<img src="" class="logo-preview" id="logoPreview" style="display:none; max-width:120px; max-height:80px; object-fit:contain; border:1px solid var(--border); padding:5px; margin-bottom:8px;">`}
                            <input type="file" accept="image/*" onchange="uploadLogo(event)">
                        </div>
                        <div class="form-group mt-3" style="border-top: 1px dashed var(--border); padding-top: 15px;">
                            <label style="color:var(--primary); font-weight:bold;">🖋️ Company Stamp / Signature</label>
                            ${s.signatureUrl ? `<img src="${s.signatureUrl}" class="logo-preview" id="sigPreview" style="max-width:150px; max-height:90px; object-fit:contain; border:1px dashed var(--primary); padding:5px; margin-bottom:8px; display:block; background:#fff;">` : `<img src="" class="logo-preview" id="sigPreview" style="display:none; max-width:150px; max-height:90px; object-fit:contain; border:1px dashed var(--primary); padding:5px; margin-bottom:8px; background:#fff;">`}
                            <input type="file" accept="image/*" onchange="uploadSignature(event)">
                            <div class="hint">Upload PNG file with transparent background</div>
                        </div>
                    </div>
                </div>

                <!-- PREFERENCES & CREDENTIALS -->
                <div class="settings-section">
                    <div class="settings-section-header">📄 Preferences & Security</div>
                    <div class="settings-section-body">
                        <div class="form-group"><label>Invoice Prefix</label><input type="text" id="set_invoicePrefix" value="${s.invoicePrefix || 'ABC'}"></div>
                        <div class="form-group"><label>Invoice Terms & Notes</label><textarea id="set_invoiceNotes" rows="3">${s.invoiceNotes || ''}</textarea></div>
                        <div class="form-group mt-2" style="border-top: 1px solid var(--border); padding-top: 12px;">
                            <label style="color:var(--danger)">Update Login Credentials</label>
                            <input type="email" id="set_loginEmail" placeholder="New Admin Email" class="mb-1">
                            <input type="text" id="set_loginPassword" placeholder="New Password">
                            <div class="hint">Leave blank if you don't want to change.</div>
                        </div>
                    </div>
                </div>

                <!-- CLOUD DATA -->
                <div class="settings-section">
                    <div class="settings-section-header">☁️ Cloud Data Backup</div>
                    <div class="settings-section-body">
                        <p style="font-size:0.85rem;color:var(--text-light);margin-bottom:12px;">
                            Your data is safely synced to the cloud. You can still download a local copy.
                        </p>
                        <div class="btn-group">
                            <button class="btn btn-success btn-sm" onclick="exportBackup()">📥 Download JSON Backup</button>
                        </div>
                    </div>
                </div>
            </div>
            <div class="card mt-3">
                <div class="card-body text-center">
                    <button class="btn btn-primary" style="padding:12px 40px;font-size:1rem;" onclick="saveAllSettings()">☁️ Save to Cloud</button>
                </div>
            </div>
        </div>
    `;
}

function uploadLogo(event) {
    const file = event.target.files[0];
    if (!file) return;
    compressImage(file, 400, (dataUrl) => {
        document.getElementById('logoPreview').src = dataUrl;
        document.getElementById('logoPreview').style.display = 'block';
        window._newLogo = dataUrl;
    });
}

function uploadSignature(event) {
    const file = event.target.files[0];
    if (!file) return;
    compressImage(file, 500, (dataUrl) => {
        document.getElementById('sigPreview').src = dataUrl;
        document.getElementById('sigPreview').style.display = 'block';
        window._newSig = dataUrl;
    });
}

function compressImage(file, maxSize, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width, h = img.height;
            if (w > h) { if (w > maxSize) { h *= maxSize / w; w = maxSize; } } 
            else { if (h > maxSize) { w *= maxSize / h; h = maxSize; } }
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            callback(canvas.toDataURL('image/png', 0.9));
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function saveAllSettings() {
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

    if (window._newLogo) settings.logoUrl = window._newLogo;
    if (window._newSig) settings.signatureUrl = window._newSig;

    // Save Settings to Cloud
    await DB.saveSettings(settings);

    // Update Credentials if provided
    const newEmail = document.getElementById('set_loginEmail').value.trim();
    const newPass = document.getElementById('set_loginPassword').value;
    if (newEmail && newPass) {
        try {
            await dbFirestore.collection('app_data').doc('credentials').set({ email: newEmail, password: newPass });
            showToast('Credentials updated!', 'success');
            document.getElementById('set_loginEmail').value = '';
            document.getElementById('set_loginPassword').value = '';
        } catch (e) {
            showToast('Failed to update credentials', 'error');
        }
    }

    if (typeof loadSidebarInfo === 'function') loadSidebarInfo();
    window._newLogo = null; window._newSig = null;
}

function exportBackup() {
    const data = {
        settings: DB.getSettings(),
        customers: DB.get(DB_KEYS.CUSTOMERS),
        suppliers: DB.get(DB_KEYS.SUPPLIERS),
        invoices: DB.get(DB_KEYS.INVOICES),
        quotations: DB.get(DB_KEYS.QUOTATIONS),
        purchases: DB.get(DB_KEYS.PURCHASES),
        exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AlBowry_CloudBackup_${getTodayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup downloaded!', 'success');
}
