// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Manual Invoice System (SMART UI)
// Features: Premium Design, Auto-Calculations, Auto-Fill Customers
// ═══════════════════════════════════════════════════════

const MANUAL_INV_KEY = 'albowry_manual_invoices';

function getSavedManualInvoices() {
    return JSON.parse(localStorage.getItem(MANUAL_INV_KEY) || '[]');
}

function saveManualInvoiceToStorage(docData) {
    const list = getSavedManualInvoices();
    const existingIndex = list.findIndex(i => i.id === docData.id);
    if (existingIndex >= 0) {
        list[existingIndex] = docData;
    } else {
        list.unshift(docData);
    }
    localStorage.setItem(MANUAL_INV_KEY, JSON.stringify(list));
}

function deleteManualInvoice(id) {
    if (!confirm('Are you sure you want to delete this manual invoice?')) return;
    let list = getSavedManualInvoices();
    list = list.filter(i => i.id !== id);
    localStorage.setItem(MANUAL_INV_KEY, JSON.stringify(list));
    showToast('Manual Invoice deleted', 'info');
    renderManualInvoices(document.getElementById('pageContainer'));
}

// 🔥 ROBUST CUSTOMER LOADER (fixes empty dropdown)
function getManualCustomersList() {
    try {
        if (typeof DB !== 'undefined') {
            // Method 1: DB_KEYS (most common in your app)
            if (typeof DB_KEYS !== 'undefined' && DB_KEYS.CUSTOMERS) {
                const list = DB.get(DB_KEYS.CUSTOMERS);
                if (Array.isArray(list) && list.length) return list;
            }
            // Method 2: Helper function
            if (typeof DB.getCustomers === 'function') {
                const list = DB.getCustomers();
                if (Array.isArray(list) && list.length) return list;
            }
            // Method 3: Direct key string
            const list = DB.get('albowry_customers');
            if (Array.isArray(list) && list.length) return list;
        }
        // Method 4: Pure LocalStorage fallback
        const raw = localStorage.getItem('albowry_customers');
        if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) return list;
        }
    } catch (e) {
        console.log('Customer load error:', e);
    }
    return [];
}

function getCustomerDisplayName(c) {
    return c.name || c.customerName || c.companyName || 'Unnamed Customer';
}

function renderManualInvoices(container) {
    const savedDocs = getSavedManualInvoices();
    const customers = getManualCustomersList();

    const customStyles = `
        <style>
            .mi-card { background: #fff; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin-bottom: 25px; border-top: 5px solid #1a3a5c; overflow: hidden; }
            .mi-header { background: #f8fafc; padding: 15px 20px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px; }
            .mi-title { margin: 0; color: #1a3a5c; font-size: 1.4rem; }
            .mi-subtitle { margin: 4px 0 0 0; font-size: 0.85rem; color: #64748b; }
            .mi-body { padding: 25px 20px; }
            .mi-section-title { font-size: 1.1rem; color: #1a3a5c; margin: 0 0 15px 0; padding-bottom: 8px; border-bottom: 2px solid #f1f5f9; font-weight: 600; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;}
            
            .mi-grid-1-2 { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; margin-bottom: 25px; }
            .mi-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px; }
            @media (max-width: 768px) { .mi-grid-1-2, .mi-grid-2 { grid-template-columns: 1fr; } }
            
            .mi-form-group { display: flex; flex-direction: column; gap: 8px; }
            .mi-label { font-weight: 600; color: #334155; font-size: 0.9rem; }
            .mi-input { padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-family: inherit; font-size: 0.95rem; width: 100%; box-sizing: border-box; transition: all 0.2s; background: #fff; color: #1e293b; }
            .mi-input:focus { outline: none; border-color: #d4a843; box-shadow: 0 0 0 3px rgba(212,168,67,0.2); }
            textarea.mi-input { resize: vertical; line-height: 1.5; }
            select.mi-input { cursor: pointer; }
            
            .mi-table-wrapper { overflow-x: auto; margin-bottom: 20px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
            .mi-table { width: 100%; min-width: 900px; border-collapse: collapse; text-align: left; }
            .mi-table th { background: #1a3a5c; color: white; padding: 12px 10px; font-weight: 500; }
            .mi-table th input { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 6px 8px; border-radius: 4px; width: 100%; box-sizing: border-box; font-weight: 600; }
            .mi-table th input:focus { background: white; color: #1a3a5c; outline: none; }
            .mi-table th input::placeholder { color: rgba(255,255,255,0.6); }
            .mi-table td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
            .mi-table td input { width: 100%; padding: 8px; border: 1px solid #e2e8f0; border-radius: 4px; box-sizing: border-box; transition: border-color 0.2s; }
            .mi-table td input:focus { border-color: #1a3a5c; outline: none; }
            
            .mi-btn { padding: 9px 18px; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: opacity 0.2s; display: inline-flex; align-items: center; gap: 8px; }
            .mi-btn:hover { opacity: 0.9; }
            .mi-btn-primary { background: #1a3a5c; color: white; }
            .mi-btn-success { background: #d4a843; color: white; }
            .mi-btn-secondary { background: #e2e8f0; color: #475569; }
            .mi-btn-danger { background: #ef4444; color: white; padding: 6px 12px; }
            .mi-btn-outline { background: transparent; border: 1px solid #1a3a5c; color: #1a3a5c; }
            
            .mi-totals-box { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
            .mi-grand-total { font-size: 1.5rem; color: #1a3a5c; font-weight: bold; background: transparent; border: none; text-align: right; width: 100%; }
            .mi-badge { background:#e2e8f0; padding:4px 8px; border-radius:4px; font-size:0.85rem; font-weight:600; }
        </style>
    `;

    // Build customer options HTML
    let customerOptionsHtml = `<option value="">-- Load Saved Customer --</option>`;
    if (customers.length === 0) {
        customerOptionsHtml += `<option value="" disabled>No customers found in database</option>`;
    } else {
        customers.forEach(c => {
            const nm = getCustomerDisplayName(c);
            customerOptionsHtml += `<option value="${c.id}">${nm}</option>`;
        });
    }

    container.innerHTML = customStyles + `
        <div class="mi-card">
            <div class="mi-header">
                <div>
                    <h3 class="mi-title">&#9998; Smart Manual Document</h3>
                    <p class="mi-subtitle">Fully editable • Auto-Calc • Auto-Fill Customers (${customers.length} found)</p>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <button type="button" class="mi-btn mi-btn-secondary" onclick="resetManualForm()">Reset</button>
                    <button type="button" class="mi-btn mi-btn-primary" onclick="previewManualPDF()">Preview PDF</button>
                    <button type="button" class="mi-btn mi-btn-success" onclick="saveAndDownloadManualPDF()">Save & Download</button>
                </div>
            </div>
            
            <div class="mi-body">
                <form id="manualInvoiceForm" onsubmit="return false;">
                    <input type="hidden" id="manualDocId" value="">

                    <h4 class="mi-section-title">1. Document Headers</h4>
                    <div class="mi-grid-1-2">
                        <div class="mi-form-group">
                            <label class="mi-label">Main Heading Title</label>
                            <input type="text" id="mDocTitle" class="mi-input" value="TAX INVOICE" placeholder="e.g. TAX INVOICE, QUOTATION, PROFORMA">
                        </div>
                        <div class="mi-form-group">
                            <label class="mi-label">Project / Subject (Optional)</label>
                            <input type="text" id="mProjectText" class="mi-input" placeholder="Project: Wooden Gazebo Supply & Installation at Villa 12">
                        </div>
                    </div>

                    <h4 class="mi-section-title">
                        <span>2. Buyer & Meta Information</span>
                        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                            <select id="mCustomerSelect" class="mi-input" style="width:220px; padding:8px; font-size:0.85rem;" onchange="autoFillManualCustomer()">
                                ${customerOptionsHtml}
                            </select>
                            <button type="button" class="mi-btn mi-btn-secondary" style="padding:8px 12px; font-size:0.85rem;" onclick="autoFillManualMeta()">⚡ Auto Invoice No</button>
                        </div>
                    </h4>
                    <div class="mi-grid-2">
                        <div class="mi-form-group">
                            <label class="mi-label">Buyer Details (Left Box)</label>
                            <textarea id="mBuyerText" class="mi-input" rows="5" placeholder="Buyer (Bill to):&#10;Customer Name LLC&#10;Dubai, UAE&#10;Phone: +971...&#10;TRN: ..."></textarea>
                        </div>
                        <div class="mi-form-group">
                            <label class="mi-label">Invoice Info (Right Box)</label>
                            <textarea id="mMetaText" class="mi-input" rows="5" placeholder="Invoice No.: MAN-2026-001&#10;Dated: 19-Oct-2026&#10;Mode/Terms: Cash"></textarea>
                        </div>
                    </div>

                    <h4 class="mi-section-title">3. Table Columns & Items</h4>
                    <div class="mi-table-wrapper">
                        <table class="mi-table" id="manualItemsTable">
                            <thead>
                                <tr>
                                    <th style="width: 8%;"><input type="text" id="mH1" value="Sl No." style="text-align:center;"></th>
                                    <th style="width: 38%;"><input type="text" id="mH2" value="Particulars / Description"></th>
                                    <th style="width: 10%;"><input type="text" id="mH3" value="Qty" style="text-align:center;"></th>
                                    <th style="width: 10%;"><input type="text" id="mH4" value="Unit" style="text-align:center;"></th>
                                    <th style="width: 14%;"><input type="text" id="mH5" value="Rate" style="text-align:right;"></th>
                                    <th style="width: 15%;"><input type="text" id="mH6" value="Amount (AED)" style="text-align:right;"></th>
                                    <th style="width: 5%; text-align:center;">Del</th>
                                </tr>
                            </thead>
                            <tbody id="manualItemsBody"></tbody>
                        </table>
                    </div>
                    <button type="button" class="mi-btn mi-btn-outline" onclick="addManualRow()" style="margin-bottom:25px;">+ Add New Item Row</button>

                    <h4 class="mi-section-title">
                        <span>4. Totals & Wrap-up</span>
                        <button type="button" class="mi-btn mi-btn-secondary" style="padding:4px 10px; font-size:0.8rem;" onclick="calcGlobalManualTotals()">🔄 Refresh Totals</button>
                    </h4>
                    <div class="mi-grid-2">
                        <div class="mi-form-group">
                            <label class="mi-label">Totals Block Text (Right Aligned)</label>
                            <textarea id="mTotalsText" class="mi-input" rows="3" placeholder="Sub Total: 0.00"></textarea>
                            
                            <label class="mi-label" style="margin-top:10px;">Amount Chargeable in Words</label>
                            <input type="text" id="mAmountInWords" class="mi-input" placeholder="AED Zero Only">
                        </div>
                        <div class="mi-totals-box">
                            <div class="mi-form-group">
                                <label class="mi-label">Grand Total Box Label</label>
                                <input type="text" id="mGrandTotalLabel" class="mi-input" value="GRAND TOTAL">
                            </div>
                            <div class="mi-form-group" style="margin-top:15px;">
                                <label class="mi-label">Grand Total Final Value</label>
                                <input type="text" id="mGrandTotalValue" class="mi-input mi-grand-total" placeholder="AED 0.00">
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <div class="mi-card">
            <div class="mi-header">
                <h3 class="mi-title" style="font-size:1.2rem;">Saved Documents History</h3>
            </div>
            <div class="mi-table-wrapper" style="margin:0; border:none; border-radius:0;">
                <table class="mi-table">
                    <thead style="background:#f1f5f9;">
                        <tr>
                            <th style="color:#1a3a5c;">Date / Info</th>
                            <th style="color:#1a3a5c;">Title</th>
                            <th style="color:#1a3a5c;">Buyer Summary</th>
                            <th style="color:#1a3a5c; text-align:right;">Grand Total</th>
                            <th style="color:#1a3a5c; text-align:center;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${savedDocs.length === 0 ? `<tr><td colspan="5" style="text-align:center; padding:30px; color:#64748b;">No manual invoices saved yet.</td></tr>` : ''}
                        ${savedDocs.map(doc => `
                            <tr>
                                <td>
                                    <div style="font-weight:600; color:#1a3a5c;">${doc.metaText ? doc.metaText.split('\n')[0] : 'Manual Doc'}</div>
                                    <small style="color:#64748b;">${doc.savedAt || ''}</small>
                                </td>
                                <td><span class="mi-badge">${doc.docTitle || 'TAX INVOICE'}</span></td>
                                <td style="color:#475569;">${(doc.buyerText || '').split('\n').slice(0,2).join(' ').substring(0, 40)}...</td>
                                <td style="text-align:right; font-weight:bold; color:#1a3a5c;">${doc.grandTotalValue || '-'}</td>
                                <td style="text-align:center;">
                                    <div style="display:flex; gap:5px; justify-content:center;">
                                        <button type="button" class="mi-btn mi-btn-outline" style="padding:4px 8px; font-size:0.8rem;" onclick="editManualDoc('${doc.id}')">Edit</button>
                                        <button type="button" class="mi-btn mi-btn-primary" style="padding:4px 8px; font-size:0.8rem;" onclick="downloadSavedManualPDF('${doc.id}')">PDF</button>
                                        <button type="button" class="mi-btn mi-btn-danger" style="padding:4px 8px; font-size:0.8rem;" onclick="deleteManualInvoice('${doc.id}')">X</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    addManualRow({ c1: '1', c2: '', c3: '1', c4: 'Nos', c5: '0.00', c6: '0.00' });
}

// 🔥 AUTO FILL CUSTOMER
function autoFillManualCustomer() {
    const id = document.getElementById('mCustomerSelect').value;
    if (!id) return;

    const customers = getManualCustomersList();
    const c = customers.find(x => String(x.id) === String(id));
    if (!c) {
        showToast('Customer not found', 'warning');
        return;
    }

    const name = getCustomerDisplayName(c);
    const address = c.address || c.city || '';
    const phone = c.phone || c.mobile || '';
    const trn = c.trn || c.TRN || '';

    let text = `Buyer (Bill to):\n${name}`;
    if (address) text += `\n${address}`;
    if (phone) text += `\nPhone: ${phone}`;
    if (trn) text += `\nTRN: ${trn}`;

    document.getElementById('mBuyerText').value = text;
    showToast('Customer loaded: ' + name, 'success');
}

function autoFillManualMeta() {
    const today = (typeof formatDate === 'function')
        ? formatDate(new Date().toISOString().split('T')[0])
        : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

    const year = new Date().getFullYear();
    const rand = String(Math.floor(Math.random() * 900) + 100);
    const invNo = `MAN-${year}-${rand}`;

    const text = `Invoice No.: ${invNo}\nDated: ${today}\nMode/Terms: Cash`;
    document.getElementById('mMetaText').value = text;
    showToast('Invoice No. generated', 'success');
}

function addManualRow(data = {}) {
    const tbody = document.getElementById('manualItemsBody');
    if (!tbody) return;

    const rowId = 'row_' + Date.now() + Math.random().toString(36).substr(2, 5);
    const tr = document.createElement('tr');
    tr.id = rowId;

    const sl = data.c1 || String(tbody.children.length + 1);

    tr.innerHTML = `
        <td><input type="text" class="m-c1" style="text-align:center;" value="${sl}"></td>
        <td><input type="text" class="m-c2" value="${data.c2 || ''}" placeholder="Description"></td>
        <td><input type="number" step="any" class="m-c3" style="text-align:center;" value="${data.c3 || '1'}" oninput="calcManualRow('${rowId}')"></td>
        <td><input type="text" class="m-c4" style="text-align:center;" value="${data.c4 || 'Nos'}" placeholder="Unit"></td>
        <td><input type="number" step="any" class="m-c5" style="text-align:right;" value="${data.c5 || '0'}" oninput="calcManualRow('${rowId}')"></td>
        <td><input type="text" class="m-c6" style="text-align:right; font-weight:bold; color:#1a3a5c;" value="${data.c6 || '0.00'}" oninput="calcGlobalManualTotals()"></td>
        <td style="text-align:center;">
            <button type="button" class="mi-btn mi-btn-danger" style="padding:6px 10px;" onclick="removeManualRow('${rowId}')">X</button>
        </td>
    `;
    tbody.appendChild(tr);
}

function removeManualRow(rowId) {
    const el = document.getElementById(rowId);
    if (el) el.remove();
    calcGlobalManualTotals();
}

function calcManualRow(rowId) {
    const tr = document.getElementById(rowId);
    if (!tr) return;
    const qty = parseFloat(tr.querySelector('.m-c3').value) || 0;
    const rate = parseFloat(tr.querySelector('.m-c5').value) || 0;
    tr.querySelector('.m-c6').value = (qty * rate).toFixed(2);
    calcGlobalManualTotals();
}

function calcGlobalManualTotals() {
    let sum = 0;
    document.querySelectorAll('#manualItemsBody .m-c6').forEach(inp => {
        sum += parseFloat(inp.value) || 0;
    });

    const format = (typeof formatNum === 'function') ? formatNum(sum) : sum.toFixed(2);

    const totalsTextEl = document.getElementById('mTotalsText');
    // Auto-update only if empty or looks like our auto text
    if (!totalsTextEl.value || totalsTextEl.value.startsWith('Sub Total:')) {
        totalsTextEl.value = `Sub Total: ${format}`;
    }

    document.getElementById('mGrandTotalValue').value = `AED ${format}`;

    if (typeof numberToWords === 'function') {
        document.getElementById('mAmountInWords').value = numberToWords(sum);
    }
}

function getManualFormData() {
    const items = [];
    document.querySelectorAll('#manualItemsBody tr').forEach(tr => {
        items.push({
            c1: tr.querySelector('.m-c1').value,
            c2: tr.querySelector('.m-c2').value,
            c3: tr.querySelector('.m-c3').value,
            c4: tr.querySelector('.m-c4').value,
            c5: tr.querySelector('.m-c5').value,
            c6: tr.querySelector('.m-c6').value
        });
    });

    let docId = document.getElementById('manualDocId').value;
    if (!docId) docId = 'man_' + Date.now();

    return {
        id: docId,
        savedAt: new Date().toLocaleString(),
        docTitle: document.getElementById('mDocTitle').value || 'TAX INVOICE',
        projectText: document.getElementById('mProjectText').value || '',
        buyerText: document.getElementById('mBuyerText').value || '',
        metaText: document.getElementById('mMetaText').value || '',
        h1: document.getElementById('mH1').value,
        h2: document.getElementById('mH2').value,
        h3: document.getElementById('mH3').value,
        h4: document.getElementById('mH4').value,
        h5: document.getElementById('mH5').value,
        h6: document.getElementById('mH6').value,
        items: items,
        totalsText: document.getElementById('mTotalsText').value || '',
        amountInWords: document.getElementById('mAmountInWords').value || '',
        grandTotalLabel: document.getElementById('mGrandTotalLabel').value || 'GRAND TOTAL',
        grandTotalValue: document.getElementById('mGrandTotalValue').value || ''
    };
}

function previewManualPDF() {
    const formData = getManualFormData();
    if (typeof generateManualInvoicePDF === 'function') {
        generateManualInvoicePDF(formData, true);
    } else {
        showToast('PDF Engine missing! Check pdf.js', 'error');
    }
}

function saveAndDownloadManualPDF() {
    const formData = getManualFormData();
    saveManualInvoiceToStorage(formData);
    if (typeof generateManualInvoicePDF === 'function') {
        generateManualInvoicePDF(formData, false);
    }
    showToast('Saved & PDF downloaded!', 'success');
    // Keep form data — don't full re-render so user doesn't lose work
    // Only refresh history section would be ideal; for simplicity re-render:
    setTimeout(() => renderManualInvoices(document.getElementById('pageContainer')), 500);
}

function editManualDoc(id) {
    const list = getSavedManualInvoices();
    const doc = list.find(i => i.id === id);
    if (!doc) return;

    document.getElementById('manualDocId').value = doc.id;
    document.getElementById('mDocTitle').value = doc.docTitle || '';
    document.getElementById('mProjectText').value = doc.projectText || '';
    document.getElementById('mBuyerText').value = doc.buyerText || '';
    document.getElementById('mMetaText').value = doc.metaText || '';
    document.getElementById('mH1').value = doc.h1 || 'Sl No.';
    document.getElementById('mH2').value = doc.h2 || 'Particulars';
    document.getElementById('mH3').value = doc.h3 || 'Qty';
    document.getElementById('mH4').value = doc.h4 || 'Unit';
    document.getElementById('mH5').value = doc.h5 || 'Rate';
    document.getElementById('mH6').value = doc.h6 || 'Amount (AED)';
    document.getElementById('mTotalsText').value = doc.totalsText || '';
    document.getElementById('mAmountInWords').value = doc.amountInWords || '';
    document.getElementById('mGrandTotalLabel').value = doc.grandTotalLabel || 'GRAND TOTAL';
    document.getElementById('mGrandTotalValue').value = doc.grandTotalValue || '';

    const tbody = document.getElementById('manualItemsBody');
    tbody.innerHTML = '';
    (doc.items || []).forEach(item => addManualRow(item));

    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('Loaded for editing', 'info');
}

function downloadSavedManualPDF(id) {
    const list = getSavedManualInvoices();
    const doc = list.find(i => i.id === id);
    if (doc && typeof generateManualInvoicePDF === 'function') {
        generateManualInvoicePDF(doc, false);
    }
}

function resetManualForm() {
    renderManualInvoices(document.getElementById('pageContainer'));
    showToast('Form reset', 'info');
}
