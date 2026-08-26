// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Purchases Module
// ═══════════════════════════════════════════════════════

let purchaseSearchQuery = '';
let purchaseStatusFilter = 'all';

function renderPurchases(container) {
    const purchases = DB.get(DB_KEYS.PURCHASES);
    let filtered = [...purchases];

    if (purchaseStatusFilter !== 'all') {
        filtered = filtered.filter(p => (p.paymentStatus || 'Unpaid') === purchaseStatusFilter);
    }
    if (purchaseSearchQuery) {
        const q = purchaseSearchQuery.toLowerCase();
        filtered = filtered.filter(p => 
            (p.billNumber||'').toLowerCase().includes(q) ||
            (p.supplierName||'').toLowerCase().includes(q)
        );
    }
    filtered.sort((a,b) => new Date(b.date) - new Date(a.date));

    const totalAmt = purchases.reduce((s,p) => s + parseFloat(p.grandTotal||0), 0);
    const paidAmt = purchases.filter(p => p.paymentStatus==='Paid').reduce((s,p) => s + parseFloat(p.grandTotal||0), 0);
    const unpaidAmt = totalAmt - paidAmt;
    const totalInputVAT = purchases.reduce((s,p) => s + parseFloat(p.vatAmount||0), 0);

    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card blue">
                <div class="stat-label">Total Bills</div>
                <div class="stat-value">${purchases.length}</div>
            </div>
            <div class="stat-card gold">
                <div class="stat-label">Total Purchases</div>
                <div class="stat-value">${formatCurrency(totalAmt)}</div>
            </div>
            <div class="stat-card green">
                <div class="stat-label">Paid</div>
                <div class="stat-value">${formatCurrency(paidAmt)}</div>
            </div>
            <div class="stat-card red">
                <div class="stat-label">Payable</div>
                <div class="stat-value">${formatCurrency(unpaidAmt)}</div>
            </div>
            <div class="stat-card info">
                <div class="stat-label">Input VAT (Credit)</div>
                <div class="stat-value">${formatCurrency(totalInputVAT)}</div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>Purchase Bills</h2>
                <button class="btn btn-primary btn-sm" onclick="openPurchaseForm()">+ New Purchase</button>
            </div>
            <div class="card-body">
                <div class="filters-bar">
                    <div class="search-box">
                        <input type="text" placeholder="Search..." value="${purchaseSearchQuery}" oninput="purchaseSearchQuery=this.value; renderPurchases(document.getElementById('pageContainer'))">
                    </div>
                    <select class="filter-select" onchange="purchaseStatusFilter=this.value; renderPurchases(document.getElementById('pageContainer'))">
                        <option value="all">All Status</option>
                        <option value="Paid" ${purchaseStatusFilter==='Paid'?'selected':''}>Paid</option>
                        <option value="Unpaid" ${purchaseStatusFilter==='Unpaid'?'selected':''}>Unpaid</option>
                        <option value="Partial" ${purchaseStatusFilter==='Partial'?'selected':''}>Partial</option>
                    </select>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Bill No.</th>
                                <th>Date</th>
                                <th>Supplier</th>
                                <th>Description</th>
                                <th class="text-right">Sub Total</th>
                                <th class="text-right">VAT</th>
                                <th class="text-right">Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.length === 0 ? `
                                <tr><td colspan="9" class="text-center text-muted" style="padding:40px;">
                                    ${purchases.length === 0 ? 'No purchases yet.' : 'No results.'}
                                </td></tr>
                            ` : filtered.map(p => `
                                <tr>
                                    <td class="fw-semibold text-primary">${p.billNumber}</td>
                                    <td>${formatDate(p.date)}</td>
                                    <td>${p.supplierName || '-'}</td>
                                    <td>${(p.description || '').substring(0,40)}${p.description && p.description.length>40?'...':''}</td>
                                    <td class="amount">${formatCurrency(p.subTotal)}</td>
                                    <td class="amount">${formatCurrency(p.vatAmount)}</td>
                                    <td class="amount fw-bold">${formatCurrency(p.grandTotal)}</td>
                                    <td><span class="badge badge-${(p.paymentStatus||'unpaid').toLowerCase()}">${p.paymentStatus||'Unpaid'}</span></td>
                                    <td>
                                        <div class="btn-group">
                                            <button class="btn btn-secondary btn-xs" onclick="openPurchaseForm('${p.id}')">Edit</button>
                                            <button class="btn btn-danger btn-xs" onclick="deletePurchase('${p.id}')">×</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function openPurchaseForm(purchaseId = null) {
    const purchases = DB.get(DB_KEYS.PURCHASES);
    const suppliers = DB.get(DB_KEYS.SUPPLIERS);
    const p = purchaseId ? purchases.find(x => x.id === purchaseId) : {
        date: getTodayISO(),
        vatInclusive: false,
        vatEnabled: true,
        paymentStatus: 'Unpaid'
    };

    const modalHtml = `
        <div class="modal-overlay" id="purchaseModal">
            <div class="modal" style="max-width:800px;">
                <div class="modal-header">
                    <h2>${purchaseId ? 'Edit Purchase' : 'New Purchase Bill'}</h2>
                    <button class="modal-close" onclick="closeModal('purchaseModal')">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Bill / Invoice No. *</label>
                            <input type="text" id="pur_billNumber" value="${p.billNumber||''}" placeholder="Supplier's bill number">
                        </div>
                        <div class="form-group">
                            <label>Bill Date *</label>
                            <input type="date" id="pur_date" value="${p.date}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Select Supplier *</label>
                            <select id="pur_supplier" onchange="fillSupplierData()">
                                <option value="">-- Select --</option>
                                ${suppliers.map(s => `<option value="${s.id}" ${p.supplierId===s.id?'selected':''}>${s.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Or Supplier Name</label>
                            <input type="text" id="pur_supplierName" value="${p.supplierName||''}" placeholder="Type new supplier">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Supplier TRN</label>
                        <input type="text" id="pur_supplierTRN" value="${p.supplierTRN||''}">
                    </div>

                    <div class="section-divider"><span>Bill Details</span></div>
                    <div class="form-group">
                        <label>Description / Items *</label>
                        <textarea id="pur_description" rows="3" placeholder="e.g., MDF Boards (20 sheets), Wood Screws, Sanding Paper...">${p.description||''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <select id="pur_category">
                            <option value="Raw Materials" ${p.category==='Raw Materials'?'selected':''}>Raw Materials</option>
                            <option value="Hardware" ${p.category==='Hardware'?'selected':''}>Hardware & Fittings</option>
                            <option value="Tools" ${p.category==='Tools'?'selected':''}>Tools & Equipment</option>
                            <option value="Labour" ${p.category==='Labour'?'selected':''}>Labour</option>
                            <option value="Transport" ${p.category==='Transport'?'selected':''}>Transport</option>
                            <option value="Rent" ${p.category==='Rent'?'selected':''}>Rent</option>
                            <option value="Utilities" ${p.category==='Utilities'?'selected':''}>Utilities</option>
                            <option value="Other" ${p.category==='Other'?'selected':''}>Other</option>
                        </select>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Amount (AED) *</label>
                            <input type="number" id="pur_amount" value="${p.subTotal||''}" step="0.01" onchange="calculatePurchaseTotals()">
                        </div>
                        <div class="form-group">
                            <label>Discount (AED)</label>
                            <input type="number" id="pur_discount" value="${p.discount||0}" step="0.01" onchange="calculatePurchaseTotals()">
                        </div>
                    </div>

                    <div class="checkbox-group">
                        <input type="checkbox" id="pur_vatEnabled" ${p.vatEnabled!==false?'checked':''} onchange="calculatePurchaseTotals()">
                        <label for="pur_vatEnabled">Bill includes VAT (Input VAT Credit)</label>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" id="pur_vatInclusive" ${p.vatInclusive?'checked':''} onchange="calculatePurchaseTotals()">
                        <label for="pur_vatInclusive">Amount above is VAT-Inclusive (extract VAT from it)</label>
                    </div>

                    <div class="totals-section">
                        <div class="totals-box" id="purTotalsBox"></div>
                    </div>

                    <div class="section-divider"><span>Payment</span></div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Payment Status</label>
                            <select id="pur_paymentStatus">
                                <option value="Unpaid" ${p.paymentStatus==='Unpaid'?'selected':''}>Unpaid</option>
                                <option value="Partial" ${p.paymentStatus==='Partial'?'selected':''}>Partial</option>
                                <option value="Paid" ${p.paymentStatus==='Paid'?'selected':''}>Paid</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Payment Method</label>
                            <select id="pur_paymentMethod">
                                <option value="Cash" ${p.paymentMethod==='Cash'?'selected':''}>Cash</option>
                                <option value="Bank Transfer" ${p.paymentMethod==='Bank Transfer'?'selected':''}>Bank Transfer</option>
                                <option value="Cheque" ${p.paymentMethod==='Cheque'?'selected':''}>Cheque</option>
                                <option value="Credit" ${p.paymentMethod==='Credit'?'selected':''}>Credit</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea id="pur_notes" rows="2">${p.notes||''}</textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('purchaseModal')">Cancel</button>
                    <button class="btn btn-primary" onclick="savePurchase('${purchaseId || ''}')">Save Purchase</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    calculatePurchaseTotals();
}

function fillSupplierData() {
    const supId = document.getElementById('pur_supplier').value;
    if (!supId) return;
    const s = DB.get(DB_KEYS.SUPPLIERS).find(x => x.id === supId);
    if (s) {
        document.getElementById('pur_supplierName').value = s.name;
        document.getElementById('pur_supplierTRN').value = s.trn || '';
    }
}

function calculatePurchaseTotals() {
    let amount = parseFloat(document.getElementById('pur_amount').value) || 0;
    const discount = parseFloat(document.getElementById('pur_discount').value) || 0;
    const vatEnabled = document.getElementById('pur_vatEnabled').checked;
    const vatInclusive = document.getElementById('pur_vatInclusive').checked;
    const vatRate = DB.getSettings().vatRate || 5;

    let subTotal, vatAmount, grandTotal;
    if (vatEnabled && vatInclusive) {
        // Extract VAT from amount
        const netAmount = amount / (1 + vatRate/100);
        subTotal = parseFloat(netAmount.toFixed(2));
        vatAmount = parseFloat((amount - netAmount).toFixed(2));
        grandTotal = amount - discount;
    } else if (vatEnabled) {
        subTotal = amount;
        const taxable = subTotal - discount;
        vatAmount = parseFloat((taxable * vatRate/100).toFixed(2));
        grandTotal = parseFloat((taxable + vatAmount).toFixed(2));
    } else {
        subTotal = amount;
        vatAmount = 0;
        grandTotal = subTotal - discount;
    }

    document.getElementById('purTotalsBox').innerHTML = `
        <div class="total-row"><span>Sub Total:</span><span>${formatCurrency(subTotal)}</span></div>
        ${discount > 0 ? `<div class="total-row"><span>Discount:</span><span>- ${formatCurrency(discount)}</span></div>` : ''}
        ${vatEnabled ? `<div class="total-row"><span>Input VAT (${vatRate}%):</span><span>${formatCurrency(vatAmount)}</span></div>` : ''}
        <div class="total-row grand"><span>Grand Total:</span><span>${formatCurrency(grandTotal)}</span></div>
    `;
    
    // Save calculated values to hidden state
    window._purCalc = { subTotal, vatAmount, grandTotal };
}

function savePurchase(purchaseId) {
    const billNumber = document.getElementById('pur_billNumber').value.trim();
    const supplierName = document.getElementById('pur_supplierName').value.trim();
    if (!billNumber) return showToast('Bill number required', 'error');
    if (!supplierName) return showToast('Supplier name required', 'error');

    calculatePurchaseTotals();
    const calc = window._purCalc || { subTotal: 0, vatAmount: 0, grandTotal: 0 };

    // Auto-save supplier if new
    let finalSupId = document.getElementById('pur_supplier').value;
    if (!finalSupId) {
        const suppliers = DB.get(DB_KEYS.SUPPLIERS);
        const existing = suppliers.find(s => s.name.toLowerCase() === supplierName.toLowerCase());
        if (existing) finalSupId = existing.id;
        else {
            const newSup = {
                id: generateId(),
                name: supplierName,
                trn: document.getElementById('pur_supplierTRN').value.trim(),
                createdAt: new Date().toISOString()
            };
            suppliers.push(newSup);
            DB.set(DB_KEYS.SUPPLIERS, suppliers);
            finalSupId = newSup.id;
        }
    }

    const purchase = {
        id: purchaseId || generateId(),
        billNumber,
        date: document.getElementById('pur_date').value,
        supplierId: finalSupId,
        supplierName,
        supplierTRN: document.getElementById('pur_supplierTRN').value.trim(),
        description: document.getElementById('pur_description').value.trim(),
        category: document.getElementById('pur_category').value,
        subTotal: calc.subTotal,
        discount: parseFloat(document.getElementById('pur_discount').value) || 0,
        vatEnabled: document.getElementById('pur_vatEnabled').checked,
        vatInclusive: document.getElementById('pur_vatInclusive').checked,
        vatRate: DB.getSettings().vatRate || 5,
        vatAmount: calc.vatAmount,
        grandTotal: calc.grandTotal,
        paymentStatus: document.getElementById('pur_paymentStatus').value,
        paymentMethod: document.getElementById('pur_paymentMethod').value,
        notes: document.getElementById('pur_notes').value.trim(),
        createdAt: purchaseId ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    let purchases = DB.get(DB_KEYS.PURCHASES);
    if (purchaseId) {
        const idx = purchases.findIndex(x => x.id === purchaseId);
        if (idx >= 0) purchases[idx] = { ...purchases[idx], ...purchase };
    } else {
        purchases.push(purchase);
    }
    DB.set(DB_KEYS.PURCHASES, purchases);
    closeModal('purchaseModal');
    showToast(`Purchase ${purchaseId?'updated':'added'}!`, 'success');
    renderPurchases(document.getElementById('pageContainer'));
}

async function deletePurchase(purchaseId) {
    const c = await confirmDialog('Delete this purchase bill?');
    if (!c) return;
    let purchases = DB.get(DB_KEYS.PURCHASES).filter(x => x.id !== purchaseId);
    DB.set(DB_KEYS.PURCHASES, purchases);
    showToast('Deleted', 'success');
    renderPurchases(document.getElementById('pageContainer'));
}