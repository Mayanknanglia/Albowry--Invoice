// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Manual Invoice System
// 100% Custom & Editable Invoice Generator
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

function renderManualInvoices(container) {
    const savedDocs = getSavedManualInvoices();

    container.innerHTML = `
        <div class="card mb-4" style="border-top: 4px solid var(--primary);">
            <div class="card-header d-flex justify-content-between align-items-center" style="flex-wrap:wrap; gap:10px;">
                <div>
                    <h3 style="margin:0; color:var(--primary);"><i class="fas fa-file-signature"></i> Manual Free-Form Invoice</h3>
                    <p style="margin:3px 0 0; font-size:13px; color:#666;">Har field custom text / Heading completely change kar sakte hain.</p>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-secondary btn-sm" onclick="resetManualForm()"><i class="fas fa-redo"></i> Reset Form</button>
                    <button class="btn btn-primary btn-sm" onclick="previewManualPDF()"><i class="fas fa-eye"></i> Preview PDF</button>
                    <button class="btn btn-success btn-sm" onclick="saveAndDownloadManualPDF()"><i class="fas fa-download"></i> Save & Download PDF</button>
                </div>
            </div>
            
            <div class="card-body">
                <form id="manualInvoiceForm">
                    <input type="hidden" id="manualDocId" value="">

                    <!-- DOCUMENT TITLE & METADATA -->
                    <div class="row g-3 mb-3" style="background:var(--bg-light); padding:12px; border-radius:6px;">
                        <div class="col-md-4">
                            <label class="form-label fw-bold">Document Main Heading Title</label>
                            <input type="text" id="mDocTitle" class="form-control" value="TAX INVOICE" placeholder="e.g. TAX INVOICE, QUOTATION, PROFORMA">
                        </div>
                        <div class="col-md-8">
                            <label class="form-label fw-bold">Project / Subject (Optional)</label>
                            <input type="text" id="mProjectText" class="form-control" placeholder="Project: Wooden Gazebo Supply & Installation at Villa 12">
                        </div>
                    </div>

                    <!-- BUYER & INVOICE DETAILS -->
                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Buyer Details (Left Box - Multiline)</label>
                            <textarea id="mBuyerText" class="form-control" rows="5" placeholder="Buyer (Bill to):&#10;Customer Name LLC&#10;Dubai, UAE&#10;Phone: +971 50 000 0000&#10;TRN: 100000000000003"></textarea>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Invoice Info / Right Box Details</label>
                            <textarea id="mMetaText" class="form-control" rows="5" placeholder="Invoice No.: ABC-2026-MAN-001&#10;Dated: 26-Oct-2026&#10;Mode/Terms: Cash / Cheque&#10;LPO No.: LPO-88493"></textarea>
                        </div>
                    </div>

                    <!-- TABLE HEADERS & ITEMS -->
                    <div class="table-responsive mb-3">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h5 style="margin:0; font-size:15px; color:var(--primary);"><i class="fas fa-list"></i> Table Columns & Items</h5>
                            <span class="badge bg-warning text-dark" style="font-size:12px;">Column headings are also editable below!</span>
                        </div>
                        <table class="table table-bordered align-middle" id="manualItemsTable">
                            <thead style="background: #f1f5f9;">
                                <tr>
                                    <th style="width: 80px;"><input type="text" class="form-control form-control-sm text-center fw-bold" id="mH1" value="Sl No."></th>
                                    <th><input type="text" class="form-control form-control-sm fw-bold" id="mH2" value="Particulars / Description"></th>
                                    <th style="width: 100px;"><input type="text" class="form-control form-control-sm text-center fw-bold" id="mH3" value="Qty / Hours"></th>
                                    <th style="width: 100px;"><input type="text" class="form-control form-control-sm text-center fw-bold" id="mH4" value="Unit"></th>
                                    <th style="width: 120px;"><input type="text" class="form-control form-control-sm text-end fw-bold" id="mH5" value="Rate"></th>
                                    <th style="width: 140px;"><input type="text" class="form-control form-control-sm text-end fw-bold" id="mH6" value="Amount (AED)"></th>
                                    <th style="width: 50px; text-align:center;">Action</th>
                                </tr>
                            </thead>
                            <tbody id="manualItemsBody">
                                <!-- Dynamic Rows -->
                            </tbody>
                        </table>
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="addManualRow()"><i class="fas fa-plus"></i> Add Item Row</button>
                    </div>

                    <!-- TOTALS & AMOUNT IN WORDS -->
                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label fw-bold">Totals Block Text (Multiline Right Aligned)</label>
                            <textarea id="mTotalsText" class="form-control" rows="4" placeholder="Sub Total: 1,000.00&#10;OUTPUT VAT @ 5%: 50.00"></textarea>
                            
                            <label class="form-label fw-bold mt-2">Amount Chargeable in Words</label>
                            <input type="text" id="mAmountInWords" class="form-control" placeholder="AED One Thousand Fifty Only">
                        </div>
                        <div class="col-md-6" style="background:var(--bg-light); padding:15px; border-radius:6px;">
                            <label class="form-label fw-bold">Grand Total Box Label</label>
                            <input type="text" id="mGrandTotalLabel" class="form-control mb-2" value="GRAND TOTAL">
                            
                            <label class="form-label fw-bold">Grand Total Final Value (AED)</label>
                            <input type="text" id="mGrandTotalValue" class="form-control text-end fw-bold fs-5 text-primary" placeholder="AED 1,050.00">
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <!-- SAVED MANUAL INVOICES HISTORY -->
        <div class="card">
            <div class="card-header"><h4 style="margin:0;"><i class="fas fa-history"></i> Saved Manual Invoices</h4></div>
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead class="table-light">
                            <tr>
                                <th>Date / ID</th>
                                <th>Title</th>
                                <th>Buyer Info Summary</th>
                                <th>Grand Total</th>
                                <th class="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${savedDocs.length === 0 ? `<tr><td colspan="5" class="text-center text-muted py-4">No manual invoices saved yet.</td></tr>` : ''}
                            ${savedDocs.map(doc => `
                                <tr>
                                    <td>
                                        <div class="fw-bold">${doc.metaText ? doc.metaText.split('\n')[0] : 'Manual Doc'}</div>
                                        <small class="text-muted">${doc.savedAt || ''}</small>
                                    </td>
                                    <td><span class="badge bg-secondary">${doc.docTitle || 'TAX INVOICE'}</span></td>
                                    <td>${(doc.buyerText || '').split('\n')[0].substring(0, 35)}...</td>
                                    <td class="fw-bold text-primary">${doc.grandTotalValue || '-'}</td>
                                    <td class="text-end">
                                        <button class="btn btn-sm btn-outline-primary" onclick="editManualDoc('${doc.id}')"><i class="fas fa-edit"></i> Edit</button>
                                        <button class="btn btn-sm btn-outline-success" onclick="downloadSavedManualPDF('${doc.id}')"><i class="fas fa-file-pdf"></i> PDF</button>
                                        <button class="btn btn-sm btn-outline-danger" onclick="deleteManualInvoice('${doc.id}')"><i class="fas fa-trash"></i></button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Initialize with 1 default row if new
    addManualRow({ c1: '1', c2: 'Custom Woodwork Item', c3: '1.00', c4: 'Nos', c5: '100.00', c6: '100.00' });
}

function addManualRow(data = {}) {
    const tbody = document.getElementById('manualItemsBody');
    if (!tbody) return;

    const rowId = 'row_' + Date.now() + Math.random().toString(36).substr(2, 4);
    const tr = document.createElement('tr');
    tr.id = rowId;

    tr.innerHTML = `
        <td><input type="text" class="form-control form-control-sm text-center m-c1" value="${data.c1 || (tbody.children.length + 1)}"></td>
        <td><input type="text" class="form-control form-control-sm m-c2" value="${data.c2 || ''}" placeholder="Description"></td>
        <td><input type="text" class="form-control form-control-sm text-center m-c3" value="${data.c3 || '1'}" oninput="calcManualRow('${rowId}')"></td>
        <td><input type="text" class="form-control form-control-sm text-center m-c4" value="${data.c4 || 'Nos'}" placeholder="Unit/Hrs"></td>
        <td><input type="text" class="form-control form-control-sm text-end m-c5" value="${data.c5 || '0.00'}" oninput="calcManualRow('${rowId}')"></td>
        <td><input type="text" class="form-control form-control-sm text-end fw-bold m-c6" value="${data.c6 || '0.00'}"></td>
        <td class="text-center">
            <button type="button" class="btn btn-link text-danger p-0" onclick="document.getElementById('${rowId}').remove()"><i class="fas fa-times"></i></button>
        </td>
    `;
    tbody.appendChild(tr);
}

function calcManualRow(rowId) {
    const tr = document.getElementById(rowId);
    if (!tr) return;
    const qty = parseFloat(tr.querySelector('.m-c3').value) || 0;
    const rate = parseFloat(tr.querySelector('.m-c5').value) || 0;
    const amtInput = tr.querySelector('.m-c6');
    if (qty > 0 && rate > 0) {
        amtInput.value = (qty * rate).toFixed(2);
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
        showToast('PDF Engine error! Refresh page.', 'error');
    }
}

function saveAndDownloadManualPDF() {
    const formData = getManualFormData();
    saveManualInvoiceToStorage(formData);
    if (typeof generateManualInvoicePDF === 'function') {
        generateManualInvoicePDF(formData, false);
    }
    showToast('Manual Invoice saved & PDF downloaded!', 'success');
    renderManualInvoices(document.getElementById('pageContainer'));
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
    showToast('Loaded into form for editing!', 'info');
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
