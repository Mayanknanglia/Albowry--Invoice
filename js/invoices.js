// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Invoices Module (CLOUD SYNCED)
// ═══════════════════════════════════════════════════════

let invoiceSearchQuery = '';
let invoiceStatusFilter = 'all';
let invoiceMonthFilter = 'all';

function renderInvoices(container) {
    const invoices = DB.get(DB_KEYS.INVOICES);
    
    // Apply filters
    let filtered = [...invoices];
    if (invoiceStatusFilter !== 'all') {
        filtered = filtered.filter(i => (i.paymentStatus || 'Unpaid') === invoiceStatusFilter);
    }
    if (invoiceMonthFilter !== 'all') {
        filtered = filtered.filter(i => {
            const d = new Date(i.date);
            return `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}` === invoiceMonthFilter;
        });
    }
    if (invoiceSearchQuery) {
        const q = invoiceSearchQuery.toLowerCase();
        filtered = filtered.filter(i => 
            (i.invoiceNumber||'').toLowerCase().includes(q) ||
            (i.customerName||'').toLowerCase().includes(q)
        );
    }
    
    // Sort by newest first
    filtered.sort((a,b) => new Date(b.date) - new Date(a.date));

    // Stats
    const totalAmt = invoices.reduce((s,i) => s + parseFloat(i.grandTotal||0), 0);
    const paidAmt = invoices.filter(i => i.paymentStatus === 'Paid').reduce((s,i) => s + parseFloat(i.grandTotal||0), 0);
    const unpaidAmt = totalAmt - paidAmt;
    const totalVAT = invoices.reduce((s,i) => s + parseFloat(i.vatAmount||0), 0);

    // Month options for filter
    const monthSet = new Set();
    invoices.forEach(i => {
        if(i.date) {
            const d = new Date(i.date);
            monthSet.add(`${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}`);
        }
    });
    const monthOptions = Array.from(monthSet).sort().reverse();

    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card blue">
                <div class="stat-label">Total Invoices</div>
                <div class="stat-value">${invoices.length}</div>
            </div>
            <div class="stat-card gold">
                <div class="stat-label">Total Amount</div>
                <div class="stat-value">${formatCurrency(totalAmt)}</div>
            </div>
            <div class="stat-card green">
                <div class="stat-label">Paid</div>
                <div class="stat-value">${formatCurrency(paidAmt)}</div>
            </div>
            <div class="stat-card red">
                <div class="stat-label">Outstanding</div>
                <div class="stat-value">${formatCurrency(unpaidAmt)}</div>
            </div>
            <div class="stat-card info">
                <div class="stat-label">VAT Collected</div>
                <div class="stat-value">${formatCurrency(totalVAT)}</div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>All Invoices</h2>
                <button class="btn btn-primary btn-sm" onclick="openInvoiceForm()">+ New Invoice</button>
            </div>
            <div class="card-body">
                <div class="filters-bar">
                    <div class="search-box">
                        <input type="text" placeholder="Search invoice no. or customer..." value="${invoiceSearchQuery}" oninput="invoiceSearchQuery=this.value; renderInvoices(document.getElementById('pageContainer'))">
                    </div>
                    <select class="filter-select" onchange="invoiceStatusFilter=this.value; renderInvoices(document.getElementById('pageContainer'))">
                        <option value="all" ${invoiceStatusFilter==='all'?'selected':''}>All Status</option>
                        <option value="Paid" ${invoiceStatusFilter==='Paid'?'selected':''}>Paid</option>
                        <option value="Unpaid" ${invoiceStatusFilter==='Unpaid'?'selected':''}>Unpaid</option>
                        <option value="Partial" ${invoiceStatusFilter==='Partial'?'selected':''}>Partial</option>
                    </select>
                    <select class="filter-select" onchange="invoiceMonthFilter=this.value; renderInvoices(document.getElementById('pageContainer'))">
                        <option value="all">All Months</option>
                        ${monthOptions.map(m => {
                            const [y,mo] = m.split('-');
                            const mName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(mo)-1];
                            return `<option value="${m}" ${invoiceMonthFilter===m?'selected':''}>${mName} ${y}</option>`;
                        }).join('')}
                    </select>
                </div>

                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Inv No.</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th class="text-right">Sub Total</th>
                                <th class="text-right">VAT</th>
                                <th class="text-right">Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.length === 0 ? `
                                <tr><td colspan="8" class="text-center text-muted" style="padding:40px;">
                                    ${invoices.length === 0 ? 'No invoices yet. Click "New Invoice" to create your first.' : 'No results match your filters.'}
                                </td></tr>
                            ` : filtered.map(inv => `
                                <tr>
                                    <td class="fw-semibold text-primary">${inv.invoiceNumber}</td>
                                    <td>${formatDate(inv.date)}</td>
                                    <td>${inv.customerName || '-'}</td>
                                    <td class="amount">${formatCurrency(inv.subTotal)}</td>
                                    <td class="amount">${formatCurrency(inv.vatAmount)}</td>
                                    <td class="amount fw-bold">${formatCurrency(inv.grandTotal)}</td>
                                    <td><span class="badge badge-${(inv.paymentStatus||'unpaid').toLowerCase()}">${inv.paymentStatus||'Unpaid'}</span></td>
                                    <td>
                                        <div class="btn-group">
                                            <button class="btn btn-outline btn-xs" onclick="viewInvoice('${inv.id}')">View</button>
                                            <button class="btn btn-accent btn-xs" onclick="generateInvoicePDF('${inv.id}')">PDF</button>
                                            <button class="btn btn-success btn-xs" onclick="shareInvoiceWhatsApp('${inv.id}')">WA</button>
                                            <button class="btn btn-secondary btn-xs" onclick="openInvoiceForm('${inv.id}')">Edit</button>
                                            <button class="btn btn-danger btn-xs" onclick="deleteInvoice('${inv.id}')">×</button>
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

// ─── OPEN INVOICE FORM ───
function openInvoiceForm(invoiceId = null) {
    const invoices = DB.get(DB_KEYS.INVOICES);
    const customers = DB.get(DB_KEYS.CUSTOMERS);
    const settings = DB.getSettings();
    
    const inv = invoiceId ? invoices.find(i => i.id === invoiceId) : {
        invoiceNumber: DB.generateInvoiceNumber(),
        date: getTodayISO(),
        items: [{ description: '', qty: 1, unit: 'Nos', rate: 0, amount: 0 }],
        vatEnabled: true,
        discount: 0,
        roundOff: 0,
        roundOffType: 'add',
        paymentStatus: 'Unpaid',
        paymentTerms: 'Cash',
        notes: settings.invoiceNotes || ''
    };

    const modalHtml = `
        <div class="modal-overlay" id="invoiceModal">
            <div class="modal" style="max-width:950px;">
                <div class="modal-header">
                    <h2>${invoiceId ? 'Edit Invoice' : 'New Tax Invoice'}</h2>
                    <button class="modal-close" onclick="closeModal('invoiceModal')">×</button>
                </div>
                <div class="modal-body">
                    <!-- INVOICE HEADER -->
                    <div class="form-row-3">
                        <div class="form-group">
                            <label>Invoice No. *</label>
                            <input type="text" id="inv_number" value="${inv.invoiceNumber}">
                        </div>
                        <div class="form-group">
                            <label>Invoice Date *</label>
                            <input type="date" id="inv_date" value="${inv.date}">
                        </div>
                        <div class="form-group">
                            <label>Payment Terms</label>
                            <select id="inv_terms">
                                <option value="Cash" ${inv.paymentTerms==='Cash'?'selected':''}>Cash</option>
                                <option value="Credit 15 Days" ${inv.paymentTerms==='Credit 15 Days'?'selected':''}>Credit 15 Days</option>
                                <option value="Credit 30 Days" ${inv.paymentTerms==='Credit 30 Days'?'selected':''}>Credit 30 Days</option>
                                <option value="Credit 45 Days" ${inv.paymentTerms==='Credit 45 Days'?'selected':''}>Credit 45 Days</option>
                                <option value="50% Advance" ${inv.paymentTerms==='50% Advance'?'selected':''}>50% Advance</option>
                                <option value="Bank Transfer" ${inv.paymentTerms==='Bank Transfer'?'selected':''}>Bank Transfer</option>
                                <option value="Cheque" ${inv.paymentTerms==='Cheque'?'selected':''}>Cheque</option>
                            </select>
                        </div>
                    </div>

                    <!-- CUSTOMER SELECTION -->
                    <div class="section-divider"><span>Customer Details</span></div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Select Customer *</label>
                            <select id="inv_customer" onchange="fillCustomerData()">
                                <option value="">-- Select or type new below --</option>
                                ${customers.map(c => `<option value="${c.id}" ${inv.customerId===c.id?'selected':''}>${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Or Customer Name *</label>
                            <input type="text" id="inv_custName" value="${inv.customerName||''}" placeholder="Type new customer name">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="text" id="inv_custPhone" value="${inv.customerPhone||''}">
                        </div>
                        <div class="form-group">
                            <label>TRN</label>
                            <input type="text" id="inv_custTRN" value="${inv.customerTRN||''}" placeholder="15-digit TRN (Optional)">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <textarea id="inv_custAddress" rows="2">${inv.customerAddress||''}</textarea>
                    </div>

                    <!-- LPO / REFERENCE -->
                    <div class="form-row">
                        <div class="form-group">
                            <label>LPO / Reference No.</label>
                            <input type="text" id="inv_lpo" value="${inv.lpoNumber||''}" placeholder="Customer's LPO number">
                        </div>
                        <div class="form-group">
                            <label>Project / Site</label>
                            <input type="text" id="inv_project" value="${inv.projectName||''}" placeholder="e.g., Villa Renovation - Al Nahda">
                        </div>
                    </div>

                    <!-- ITEMS -->
                    <div class="section-divider"><span>Items / Services</span></div>
                    <div id="invItemsContainer" class="items-section">
                        ${inv.items.map((item, idx) => renderInvoiceItem(item, idx)).join('')}
                    </div>
                    <button type="button" class="btn btn-outline btn-sm mt-1" onclick="addInvoiceItem()">+ Add Item</button>

                    <!-- CALCULATION OPTIONS -->
                    <div class="section-divider"><span>Totals & Adjustments</span></div>
                    <div class="form-row-3">
                        <div class="form-group">
                            <label>Discount (AED)</label>
                            <input type="number" id="inv_discount" value="${inv.discount||0}" step="0.01" onchange="calculateInvoiceTotals()">
                        </div>
                        <div class="form-group">
                            <label>Round Off Type</label>
                            <select id="inv_roundOffType" onchange="calculateInvoiceTotals()">
                                <option value="add" ${inv.roundOffType==='add'?'selected':''}>Add (+)</option>
                                <option value="less" ${inv.roundOffType==='less'?'selected':''}>Less (-)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Round Off (AED)</label>
                            <input type="number" id="inv_roundOff" value="${inv.roundOff||0}" step="0.01" onchange="calculateInvoiceTotals()">
                        </div>
                    </div>
                    
                    <div class="checkbox-group">
                        <input type="checkbox" id="inv_vatEnabled" ${inv.vatEnabled!==false?'checked':''} onchange="calculateInvoiceTotals()">
                        <label for="inv_vatEnabled">Apply 5% VAT</label>
                    </div>

                    <!-- TOTALS BOX -->
                    <div class="totals-section">
                        <div class="totals-box" id="invTotalsBox">
                            <!-- Auto-calculated -->
                        </div>
                    </div>

                    <!-- PAYMENT STATUS -->
                    <div class="section-divider"><span>Payment & Notes</span></div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Payment Status</label>
                            <select id="inv_paymentStatus">
                                <option value="Unpaid" ${inv.paymentStatus==='Unpaid'?'selected':''}>Unpaid</option>
                                <option value="Partial" ${inv.paymentStatus==='Partial'?'selected':''}>Partial</option>
                                <option value="Paid" ${inv.paymentStatus==='Paid'?'selected':''}>Paid</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Paid Amount (AED)</label>
                            <input type="number" id="inv_paidAmount" value="${inv.paidAmount||0}" step="0.01">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Terms & Notes</label>
                        <textarea id="inv_notes" rows="3">${inv.notes||''}</textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('invoiceModal')">Cancel</button>
                    <button class="btn btn-primary" onclick="saveInvoice('${invoiceId || ''}')">☁️ Save Invoice</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    calculateInvoiceTotals();
}

function renderInvoiceItem(item, idx) {
    return `
        <div class="item-row" data-idx="${idx}">
            <div class="item-row-header">
                <strong>Item #${idx + 1}</strong>
                <button type="button" class="remove-item" onclick="removeInvoiceItem(${idx})">Remove</button>
            </div>
            <div class="form-group">
                <label>Description *</label>
                <textarea class="item-desc" rows="2" placeholder="e.g., MDF Wardrobe with Sliding Doors, White Finish">${item.description||''}</textarea>
            </div>
            <div class="item-grid">
                <div class="form-group">
                    <label>Quantity *</label>
                    <input type="number" class="item-qty" value="${item.qty||1}" step="0.01" min="0" onchange="calculateInvoiceTotals()">
                </div>
                <div class="form-group">
                    <label>Unit *</label>
                    <select class="item-unit">
                        ${getUnitOptions().replace(`value="${item.unit||'Nos'}"`, `value="${item.unit||'Nos'}" selected`)}
                    </select>
                </div>
                <div class="form-group">
                    <label>Rate (AED) *</label>
                    <input type="number" class="item-rate" value="${item.rate||0}" step="0.01" min="0" onchange="calculateInvoiceTotals()">
                </div>
                <div class="form-group">
                    <label>Amount (AED)</label>
                    <input type="text" class="item-amount" value="${formatNum((item.qty||0)*(item.rate||0))}" readonly style="background:var(--border-light);font-weight:600;">
                </div>
            </div>
        </div>
    `;
}

function addInvoiceItem() {
    const container = document.getElementById('invItemsContainer');
    const idx = container.querySelectorAll('.item-row').length;
    container.insertAdjacentHTML('beforeend', renderInvoiceItem({}, idx));
}

function removeInvoiceItem(idx) {
    const rows = document.querySelectorAll('#invItemsContainer .item-row');
    if (rows.length <= 1) {
        showToast('At least one item required', 'warning');
        return;
    }
    rows[idx].remove();
    // Re-render to fix indices
    const items = collectInvoiceItems();
    document.getElementById('invItemsContainer').innerHTML = items.map((it,i) => renderInvoiceItem(it,i)).join('');
    calculateInvoiceTotals();
}

function collectInvoiceItems() {
    const rows = document.querySelectorAll('#invItemsContainer .item-row');
    return Array.from(rows).map(row => {
        const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
        const rate = parseFloat(row.querySelector('.item-rate').value) || 0;
        return {
            description: row.querySelector('.item-desc').value.trim(),
            qty,
            unit: row.querySelector('.item-unit').value,
            rate,
            amount: parseFloat((qty * rate).toFixed(2))
        };
    });
}

function fillCustomerData() {
    const custId = document.getElementById('inv_customer').value;
    if (!custId) return;
    const customer = DB.get(DB_KEYS.CUSTOMERS).find(c => c.id === custId);
    if (customer) {
        document.getElementById('inv_custName').value = customer.name || '';
        document.getElementById('inv_custPhone').value = customer.phone || '';
        document.getElementById('inv_custTRN').value = customer.trn || '';
        document.getElementById('inv_custAddress').value = (customer.address||'') + (customer.city ? ', ' + customer.city : '') + (customer.country ? ', ' + customer.country : '');
    }
}

function calculateInvoiceTotals() {
    const items = collectInvoiceItems();
    document.querySelectorAll('#invItemsContainer .item-row').forEach((row,i) => {
        row.querySelector('.item-amount').value = formatNum(items[i].amount);
    });
    
    const subTotal = items.reduce((s,it) => s + it.amount, 0);
    const discount = parseFloat(document.getElementById('inv_discount').value) || 0;
    const taxable = subTotal - discount;
    const vatEnabled = document.getElementById('inv_vatEnabled').checked;
    const vatRate = DB.getSettings().vatRate || 5;
    const vatAmount = vatEnabled ? parseFloat((taxable * vatRate / 100).toFixed(2)) : 0;
    const roundOff = parseFloat(document.getElementById('inv_roundOff').value) || 0;
    const roundOffType = document.getElementById('inv_roundOffType').value;
    const roundOffSigned = roundOffType === 'add' ? roundOff : -roundOff;
    const grandTotal = parseFloat((taxable + vatAmount + roundOffSigned).toFixed(2));

    document.getElementById('invTotalsBox').innerHTML = `
        <div class="total-row">
            <span>Sub Total:</span>
            <span>${formatCurrency(subTotal)}</span>
        </div>
        ${discount > 0 ? `<div class="total-row"><span>Discount:</span><span>- ${formatCurrency(discount)}</span></div>` : ''}
        <div class="total-row">
            <span>Taxable Amount:</span>
            <span>${formatCurrency(taxable)}</span>
        </div>
        ${vatEnabled ? `<div class="total-row"><span>VAT (${vatRate}%):</span><span>${formatCurrency(vatAmount)}</span></div>` : ''}
        ${roundOff > 0 ? `<div class="total-row"><span>Round Off:</span><span>${roundOffType==='add'?'(+)':'(-)'} ${formatCurrency(roundOff)}</span></div>` : ''}
        <div class="total-row grand">
            <span>Grand Total:</span>
            <span>${formatCurrency(grandTotal)}</span>
        </div>
    `;
}

// ─── CLOUD SAVE ───
async function saveInvoice(invoiceId) {
    const items = collectInvoiceItems().filter(it => it.description);
    if (items.length === 0) {
        showToast('Add at least one item with description', 'error');
        return;
    }

    const custName = document.getElementById('inv_custName').value.trim();
    if (!custName) {
        showToast('Customer name required', 'error');
        return;
    }

    let finalCustId = document.getElementById('inv_customer').value;

    // Auto-save customer to Cloud if new
    if (!finalCustId && custName) {
        const customers = DB.get(DB_KEYS.CUSTOMERS);
        const existing = customers.find(c => c.name.toLowerCase() === custName.toLowerCase());
        if (existing) {
            finalCustId = existing.id;
        } else {
            const newCust = {
                id: generateId(),
                name: custName,
                phone: document.getElementById('inv_custPhone').value.trim(),
                trn: document.getElementById('inv_custTRN').value.trim(),
                address: document.getElementById('inv_custAddress').value.trim(),
                timestamp: new Date().toISOString()
            };
            await DB.saveItem(DB_KEYS.CUSTOMERS, newCust);
            finalCustId = newCust.id;
        }
    }

    const subTotal = items.reduce((s,it) => s + it.amount, 0);
    const discount = parseFloat(document.getElementById('inv_discount').value) || 0;
    const taxable = subTotal - discount;
    const vatEnabled = document.getElementById('inv_vatEnabled').checked;
    const vatRate = DB.getSettings().vatRate || 5;
    const vatAmount = vatEnabled ? parseFloat((taxable * vatRate / 100).toFixed(2)) : 0;
    const roundOff = parseFloat(document.getElementById('inv_roundOff').value) || 0;
    const roundOffType = document.getElementById('inv_roundOffType').value;
    const roundOffSigned = roundOffType === 'add' ? roundOff : -roundOff;
    const grandTotal = parseFloat((taxable + vatAmount + roundOffSigned).toFixed(2));

    const invoice = {
        id: invoiceId || generateId(),
        invoiceNumber: document.getElementById('inv_number').value.trim(),
        date: document.getElementById('inv_date').value,
        paymentTerms: document.getElementById('inv_terms').value,
        customerId: finalCustId,
        customerName: custName,
        customerPhone: document.getElementById('inv_custPhone').value.trim(),
        customerTRN: document.getElementById('inv_custTRN').value.trim(),
        customerAddress: document.getElementById('inv_custAddress').value.trim(),
        lpoNumber: document.getElementById('inv_lpo').value.trim(),
        projectName: document.getElementById('inv_project').value.trim(),
        items,
        subTotal,
        discount,
        taxable,
        vatEnabled,
        vatRate,
        vatAmount,
        roundOff,
        roundOffType,
        grandTotal,
        paymentStatus: document.getElementById('inv_paymentStatus').value,
        paidAmount: parseFloat(document.getElementById('inv_paidAmount').value) || 0,
        notes: document.getElementById('inv_notes').value.trim(),
        timestamp: new Date().toISOString()
    };

    // Save to Cloud Sync Engine
    await DB.saveItem(DB_KEYS.INVOICES, invoice);
    closeModal('invoiceModal');
}

// ─── CLOUD DELETE ───
async function deleteInvoice(invoiceId) {
    const confirmed = await confirmDialog('Delete this invoice permanently?');
    if (!confirmed) return;
    await DB.deleteItem(DB_KEYS.INVOICES, invoiceId);
}

// View Invoice triggers PDF preview
function viewInvoice(invoiceId) {
    generateInvoicePDF(invoiceId, true);
}
