// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Settings Module (With Signature)
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
                                <input type="text" id="set_trn" value="${s.trn || ''}">
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

                <!-- LOGO & SIGNATURE / STAMP -->
                <div class="settings-section">
                    <div class="settings-section-header">🖼️ Branding & Stamp</div>
                    <div class="settings-section-body">
                        <div class="form-group">
                            <label>Company Logo</label>
                            ${s.logoUrl ? `<img src="${s.logoUrl}" class="logo-preview" id="logoPreview">` : `<img src="" class="logo-preview" id="logoPreview" style="display:none;">`}
                            <input type="file" accept="image/*" onchange="uploadLogo(event)">
                        </div>
                        
                        <!-- ✅ NEW SIGNATURE BOX ✅ -->
                        <div class="form-group mt-3" style="border-top: 1px solid var(--border); padding-top: 15px;">
                            <label>Company Stamp / Signature (For PDF)</label>
                            ${s.signatureUrl ? `<img src="${s.signatureUrl}" class="logo-preview" id="sigPreview" style="width:150px; height:auto; border:1px solid #ccc; padding:5px;">` : `<img src="" class="logo-preview" id="sigPreview" style="display:none; width:150px; height:auto; border:1px solid #ccc; padding:5px;">`}
                            <input type="file" accept="image/*" onchange="uploadSignature(event)">
                            <div class="hint">Recommended: Transparent PNG (Without background)</div>
                        </div>

                    </div>
                </div>

                <!-- INVOICE PREFERENCES -->
                <div class="settings-section">
                    <div class="settings-section-header">📄 Invoice Preferences</div>
                    <div class="settings-section-body">
                        <div class="form-group">
                            <label>Invoice Prefix</label>
                            <input type="text" id="set_invoicePrefix" value="${s.invoicePrefix || 'ABC'}">
                        </div>
                        <div class="form-group">
                            <label>Invoice Terms (For PDF Bank Box)</label>
                            <textarea id="set_invoiceNotes" rows="4">${s.invoiceNotes || ''}</textarea>
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
                        </div>
                    </div>
                </div>

                <!-- DATA MANAGEMENT -->
                <div class="settings-section">
                    <div class="settings-section-header">💾 Data Backup & Restore</div>
                    <div class="settings-section-body">
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

function uploadLogo(event) {
    const file = event.target.files[0];
    if (!file) return;
    compressImage(file, 400, (dataUrl) => {
        document.getElementById('logoPreview').src = dataUrl;
        document.getElementById('logoPreview').style.display = 'block';
        window._newLogo = dataUrl;
        showToast('Logo uploaded! Click Save.', 'info');
    });
}

// ✅ NEW FUNCTION TO HANDLE STAMP/SIGNATURE UPLOAD
function uploadSignature(event) {
    const file = event.target.files[0];
    if (!file) return;
    compressImage(file, 500, (dataUrl) => {
        document.getElementById('sigPreview').src = dataUrl;
        document.getElementById('sigPreview').style.display = 'block';
        window._newSig = dataUrl;
        showToast('Stamp uploaded! Click Save.', 'info');
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

    if (window._newLogo) settings.logoUrl = window._newLogo;
    if (window._newSig) settings.signatureUrl = window._newSig; // ✅ SAVE SIGNATURE

    DB.saveSettings(settings);

    const newEmail = document.getElementById('set_loginEmail').value.trim();
    const newPass = document.getElementById('set_loginPassword').value;
    if (newEmail && newPass) localStorage.setItem('albowry_credentials', JSON.stringify({ email: newEmail, password: newPass }));

    loadSidebarInfo();
    showToast('Settings saved successfully!', 'success');
    window._newLogo = null;
    window._newSig = null;
}

function exportBackup() { /* ... unchanged ... */ }
async function importBackup(event) { /* ... unchanged ... */ }
async function clearAllData() { /* ... unchanged ... */ }
