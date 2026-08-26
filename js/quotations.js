// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Quotations Module
// ═══════════════════════════════════════════════════════

let quotationSearchQuery = '';
let quotationStatusFilter = 'all';

function renderQuotations(container) {
    const quotations = DB.get(DB_KEYS.QUOTATIONS);
    let filtered = [...quotations];
    
    if (quotationStatusFilter !== 'all') {
        filtered = filtered.filter(q => (q.status || 'Draft') === quotationStatusFilter);
    }
    if (quotationSearchQuery) {
        const s = quotationSearchQuery.toLowerCase();
        filtered = filtered.filter(q => 
            (q.quotationNumber||'').toLowerCase().includes(s) ||
            (q.customerName||'').toLowerCase().includes(s)
        );
    }
    filtered.sort((a,b) => new Date(b.date) - new Date(a.date));

    const totalAmt = quotations.reduce((s,q) => s + parseFloat(q.grandTotal||0), 0);
    const draftCount = quotations.filter(q => (q.status||'Draft')==='Draft').length;
    const sentCount = quotations.filter(q => q.status==='Sent').length;
    const confirmedCount = quotations.filter(q => q.status==='Confirmed').length;

    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card blue">
                <div class="stat-label">Total Quotations</div>
                <div class="stat-value">${quotations.length}</div>
            </div>
            <div class="stat-card gold">
                <div class="stat-label">Total Value</div>
                <div class="stat-value">${formatCurrency(totalAmt)}</div>
            </div>
            <div class="stat-card info">
                <div class="stat-label">Sent</div>
                <div class="stat-value">${sentCount}</div>
            </div>
            <div class="stat-card green">
                <div class="stat-label">Confirmed</div>
                <div class="stat-value">${confirmedCount}</div>
            </div>
            <div class="stat-card orange">
                <div class="stat-label">Draft</div>
                <div class="stat-value">${draftCount}</div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>All Quotations</h2>
                <button class="btn btn-primary btn-sm" onclick="openQuotationForm()">+ New Quotation</button>
            </div>
            <div class="card-body">
                <div class="filters-bar">
                    <div class="search-box">
                        <input type="text" placeholder="Search..." value="${quotationSearchQuery}" oninput="quotationSearchQuery=this.value; renderQuotations(document.getElementById('pageContainer'))">
                    </div>
                    <select class="filter-select" onchange="quotationStatusFilter=this.value; renderQuotations(document.getElementById('pageContainer'))">
                        <option value="all">All Status</option>
                        <option value="Draft" ${quotationStatusFilter==='Draft'?'selected':''}>Draft</option>
                        <option value="Sent" ${quotationStatusFilter==='Sent'?'selected':''}>Sent</option>
                        <option value="Confirmed" ${quotationStatusFilter==='Confirmed'?'selected':''}>Confirmed</option>
                        <option value="Cancelled" ${quotationStatusFilter==='Cancelled'?'selected':''}>Cancelled</option>
                        <option value="Converted" ${quotationStatusFilter==='Converted'?'selected':''}>Converted</option>
                    </select>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Quote No.</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Project</th>
                                <th class="text-right">Total</th>
                                <th>Valid Till</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.length === 0 ? `
                                <tr><td colspan="8" class="text-center text-muted" style="padding:40px;">
                                    ${quotations.length === 0 ? 'No quotations yet.' : 'No matching results.'}
                                </td></tr>
                            ` : filtered.map(q => `
                                <tr>
                                    <td class="fw-semibold text-primary">${q.quotationNumber}</td>
                                    <td>${formatDate(q.date)}</td>
                                    <td>${q.customerName || '-'}</td>
                                    <td>${q.projectName || '-'}</td>
                                    <td class="amount fw-bold">${formatCurrency(q.grandTotal)}</td>
                                    <td>${q.validTill ? formatDate(q.validTill) : '-'}</td>
                                    <td><span class="badge badge-${(q.status||'draft').toLowerCase()}">${q.status||'Draft'}</span></td>
                                    <td>
                                        <div class="btn-group">
                                            <button class="btn btn-accent btn-xs" onclick="generateQuotationPDF('${q.id}')">PDF</button>
                                            <button class="btn btn-success btn-xs" onclick="convertToInvoice('${q.id}')">→ Invoice</button>
                                            <button class="btn btn-secondary btn-xs" onclick="openQuotationForm('${q.id}')">Edit</button>
                                            <button class="btn btn-danger btn-xs" onclick="deleteQuotation('${q.id}')">×</button>
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

// Open Quotation Form (Same as Invoice but with Validity + Status)
function openQuotationForm(quotationId = null) {
    const quotations = DB.get(DB_KEYS.QUOTATIONS);
    const customers = DB.get(DB_KEYS.CUSTOMERS);
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 15);
    
    const q = quotationId ? quotations.find(x => x.id === quotationId) : {
        quotationNumber: DB.generateQuotationNumber(),
        date: getTodayISO(),
        validTill: validDate.toISOString().split('T')[0],
        items: [{ description: '', qty: 1, unit: 'Nos', rate: 0, amount: 0 }],
        vatEnabled: true,
        discount: 0,
        status: 'Draft',
        notes: DB.getSettings().quotationNotes || ''
    };

    const modalHtml = `
        <div class="modal-overlay" id="quotationModal">
            <div class="modal" style="max-width:950px;">
                <div class="modal-header">
                    <h2>${quotationId ? 'Edit Quotation' : 'New Quotation'}</h2>
                    <button class="modal-close" onclick="closeModal('quotationModal')">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-row-3">
                        <div class="form-group">
                            <label>Quotation No. *</label>
                            <input type="text" id="quo_number" value="${q.quotationNumber}">
                        </div>
                        <div class="form-group">
                            <label>Date *</label>
                            <input type="date" id="quo_date" value="${q.date}">
                        </div>
                        <div class="form-group">
                            <label>Valid Till *</label>
                            <input type="date" id="quo_validTill" value="${q.validTill}">
                        </div>
                    </div>

                    <div class="section-divider"><span>Customer Details</span></div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Select Customer</label>
                            <select id="quo_customer" onchange="fillCustomerDataQuo()">
                                <option value="">-- Or type name below --</option>
                                ${customers.map(c => `<option value="${c.id}" ${q.customerId===c.id?'selected':''}>${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Customer Name *</label>
                            <input type="text" id="quo_custName" value="${q.customerName||''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="text" id="quo_custPhone" value="${q.customerPhone||''}">
                        </div>
                        <div class="form-group">
                            <label>TRN</label>
                            <input type="text" id="quo_custTRN" value="${q.customerTRN||''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <textarea id="quo_custAddress" rows="2">${q.customerAddress||''}</textarea>
                    </div>
                    <div class="form-group">
                        <label>Project / Site Name</label>
                        <input type="text" id="quo_project" value="${q.projectName||''}" placeholder="e.g., Kitchen Cabinets - Villa 42">
                    </div>

                    <div class="section-divider"><span>Items / Services</span></div>
                    <div id="quoItemsContainer" class="items-section">
                        ${q.items.map((item, idx) => renderQuotationItem(item, idx)).join('')}
                    </div>
                    <button type="button" class="btn btn-outline btn-sm mt-1" onclick="addQuotationItem()">+ Add Item</button>

                    <div class="section-divider"><span>Totals</span></div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Discount (AED)</label>
                            <input type="number" id="quo_discount" value="${q.discount||0}" step="0.01" onchange="calculateQuotationTotals()">
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select id="quo_status">
                                <option value="Draft" ${q.status==='Draft'?'selected':''}>Draft</option>
                                <option value="Sent" ${q.status==='Sent'?'selected':''}>Sent</option>
                                <option value="Confirmed" ${q.status==='Confirmed'?'selected':''}>Confirmed</option>
                                <option value="Cancelled" ${q.status==='Cancelled'?'selected':''}>Cancelled</option>
                            </select>
                        </div>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" id="quo_vatEnabled" ${q.vatEnabled!==false?'checked':''} onchange="calculateQuotationTotals()">
                        <label for="quo_vatEnabled">Apply 5% VAT</label>
                    </div>
                    
                    <div class="totals-section">
                        <div class="totals-box" id="quoTotalsBox"></div>
                    </div>

                    <div class="form-group mt-2">
                        <label>Terms & Notes</label>
                        <textarea id="quo_notes" rows="3">${q.notes||''}</textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('quotationModal')">Cancel</button>
                    <button class="btn btn-primary" onclick="saveQuotation('${quotationId || ''}')">Save Quotation</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    calculateQuotationTotals();
}

function renderQuotationItem(item, idx) {
    return `
        <div class="item-row" data-idx="${idx}">
            <div class="item-row-header">
                <strong>Item #${idx + 1}</strong>
                <button type="button" class="remove-item" onclick="removeQuotationItem(${idx})">Remove</button>
            </div>
            <div class="form-group">
                <label>Description *</label>
                <textarea class="q-item-desc" rows="2">${item.description||''}</textarea>
            </div>
            <div class="item-grid">
                <div class="form-group">
                    <label>Qty</label>
                    <input type="number" class="q-item-qty" value="${item.qty||1}" step="0.01" onchange="calculateQuotationTotals()">
                </div>
                <div class="form-group">
                    <label>Unit</label>
                    <select class="q-item-unit">
                        ${getUnitOptions().replace(`value="${item.unit||'Nos'}"`, `value="${item.unit||'Nos'}" selected`)}
                    </select>
                </div>
                <div class="form-group">
                    <label>Rate</label>
                    <input type="number" class="q-item-rate" value="${item.rate||0}" step="0.01" onchange="calculateQuotationTotals()">
                </div>
                <div class="form-group">
                    <label>Amount</label>
                    <input type="text" class="q-item-amount" value="${formatNum((item.qty||0)*(item.rate||0))}" readonly style="background:var(--border-light);font-weight:600;">
                </div>
            </div>
        </div>
    `;
}

function addQuotationItem() {
    const container = document.getElementById('quoItemsContainer');
    const idx = container.querySelectorAll('.item-row').length;
    container.insertAdjacentHTML('beforeend', renderQuotationItem({}, idx));
}

function removeQuotationItem(idx) {
    const rows = document.querySelectorAll('#quoItemsContainer .item-row');
    if (rows.length <= 1) return showToast('At least one item required','warning');
    rows[idx].remove();
    const items = collectQuotationItems();
    document.getElementById('quoItemsContainer').innerHTML = items.map((it,i) => renderQuotationItem(it,i)).join('');
    calculateQuotationTotals();
}

function collectQuotationItems() {
    return Array.from(document.querySelectorAll('#quoItemsContainer .item-row')).map(row => {
        const qty = parseFloat(row.querySelector('.q-item-qty').value) || 0;
        const rate = parseFloat(row.querySelector('.q-item-rate').value) || 0;
        return {
            description: row.querySelector('.q-item-desc').value.trim(),
            qty, unit: row.querySelector('.q-item-unit').value, rate,
            amount: parseFloat((qty*rate).toFixed(2))
        };
    });
}

function fillCustomerDataQuo() {
    const custId = document.getElementById('quo_customer').value;
    if (!custId) return;
    const c = DB.get(DB_KEYS.CUSTOMERS).find(x => x.id === custId);
    if (c) {
        document.getElementById('quo_custName').value = c.name || '';
        document.getElementById('quo_custPhone').value = c.phone || '';
        document.getElementById('quo_custTRN').value = c.trn || '';
        document.getElementById('quo_custAddress').value = (c.address||'') + (c.city ? ', '+c.city : '');
    }
}

function calculateQuotationTotals() {
    const items = collectQuotationItems();
    document.querySelectorAll('#quoItemsContainer .item-row').forEach((row,i) => {
        row.querySelector('.q-item-amount').value = formatNum(items[i].amount);
    });
    const subTotal = items.reduce((s,it) => s + it.amount, 0);
    const discount = parseFloat(document.getElementById('quo_discount').value) || 0;
    const taxable = subTotal - discount;
    const vatEnabled = document.getElementById('quo_vatEnabled').checked;
    const vatRate = DB.getSettings().vatRate || 5;
    const vatAmount = vatEnabled ? parseFloat((taxable*vatRate/100).toFixed(2)) : 0;
    const grandTotal = parseFloat((taxable + vatAmount).toFixed(2));

    document.getElementById('quoTotalsBox').innerHTML = `
        <div class="total-row"><span>Sub Total:</span><span>${formatCurrency(subTotal)}</span></div>
        ${discount > 0 ? `<div class="total-row"><span>Discount:</span><span>- ${formatCurrency(discount)}</span></div>` : ''}
        ${vatEnabled ? `<div class="total-row"><span>VAT (${vatRate}%):</span><span>${formatCurrency(vatAmount)}</span></div>` : ''}
        <div class="total-row grand"><span>Grand Total:</span><span>${formatCurrency(grandTotal)}</span></div>
    `;
}

function saveQuotation(quotationId) {
    const items = collectQuotationItems().filter(it => it.description);
    if (items.length === 0) return showToast('Add at least one item', 'error');
    const custName = document.getElementById('quo_custName').value.trim();
    if (!custName) return showToast('Customer name required', 'error');

    const subTotal = items.reduce((s,it) => s + it.amount, 0);
    const discount = parseFloat(document.getElementById('quo_discount').value) || 0;
    const taxable = subTotal - discount;
    const vatEnabled = document.getElementById('quo_vatEnabled').checked;
    const vatRate = DB.getSettings().vatRate || 5;
    const vatAmount = vatEnabled ? parseFloat((taxable*vatRate/100).toFixed(2)) : 0;
    const grandTotal = parseFloat((taxable + vatAmount).toFixed(2));

    const quotation = {
        id: quotationId || generateId(),
        quotationNumber: document.getElementById('quo_number').value.trim(),
        date: document.getElementById('quo_date').value,
        validTill: document.getElementById('quo_validTill').value,
        customerId: document.getElementById('quo_customer').value,
        customerName: custName,
        customerPhone: document.getElementById('quo_custPhone').value.trim(),
        customerTRN: document.getElementById('quo_custTRN').value.trim(),
        customerAddress: document.getElementById('quo_custAddress').value.trim(),
        projectName: document.getElementById('quo_project').value.trim(),
        items, subTotal, discount, taxable, vatEnabled, vatRate, vatAmount, grandTotal,
        status: document.getElementById('quo_status').value,
        notes: document.getElementById('quo_notes').value.trim(),
        createdAt: quotationId ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    let quotations = DB.get(DB_KEYS.QUOTATIONS);
    if (quotationId) {
        const idx = quotations.findIndex(x => x.id === quotationId);
        if (idx >= 0) quotations[idx] = { ...quotations[idx], ...quotation };
    } else {
        quotations.push(quotation);
        DB.incrementQuotationCounter();
    }
    DB.set(DB_KEYS.QUOTATIONS, quotations);
    closeModal('quotationModal');
    showToast(`Quotation ${quotationId?'updated':'created'}!`, 'success');
    renderQuotations(document.getElementById('pageContainer'));
}

async function deleteQuotation(quotationId) {
    const c = await confirmDialog('Delete this quotation?');
    if (!c) return;
    let quotations = DB.get(DB_KEYS.QUOTATIONS).filter(x => x.id !== quotationId);
    DB.set(DB_KEYS.QUOTATIONS, quotations);
    showToast('Deleted', 'success');
    renderQuotations(document.getElementById('pageContainer'));
}

// Convert Quotation to Invoice
async function convertToInvoice(quotationId) {
    const q = DB.get(DB_KEYS.QUOTATIONS).find(x => x.id === quotationId);
    if (!q) return;
    const c = await confirmDialog(`Convert quotation ${q.quotationNumber} to Invoice?`);
    if (!c) return;

    const invoice = {
        id: generateId(),
        invoiceNumber: DB.generateInvoiceNumber(),
        date: getTodayISO(),
        paymentTerms: 'Cash',
        customerId: q.customerId,
        customerName: q.customerName,
        customerPhone: q.customerPhone,
        customerTRN: q.customerTRN,
        customerAddress: q.customerAddress,
        projectName: q.projectName,
        items: q.items,
        subTotal: q.subTotal,
        discount: q.discount,
        taxable: q.taxable,
        vatEnabled: q.vatEnabled,
        vatRate: q.vatRate,
        vatAmount: q.vatAmount,
        roundOff: 0,
        roundOffType: 'add',
        grandTotal: q.grandTotal,
        paymentStatus: 'Unpaid',
        notes: DB.getSettings().invoiceNotes || '',
        createdAt: new Date().toISOString(),
        convertedFromQuotation: q.quotationNumber
    };
    const invoices = DB.get(DB_KEYS.INVOICES);
    invoices.push(invoice);
    DB.set(DB_KEYS.INVOICES, invoices);
    DB.incrementInvoiceCounter();

    // Mark quotation as Converted
    const quotations = DB.get(DB_KEYS.QUOTATIONS);
    const idx = quotations.findIndex(x => x.id === quotationId);
    if (idx >= 0) {
        quotations[idx].status = 'Converted';
        DB.set(DB_KEYS.QUOTATIONS, quotations);
    }

    showToast('Converted to Invoice!', 'success');
    setTimeout(() => navigateTo('invoices'), 500);
}

// Quotation PDF (Uses similar layout to Invoice)
function generateQuotationPDF(quotationId) {
    const q = DB.get(DB_KEYS.QUOTATIONS).find(x => x.id === quotationId);
    if (!q) return;
    // Create a temp invoice-like object and pass to PDF generator
    const tempInv = {
        ...q,
        invoiceNumber: q.quotationNumber,
        _isQuotation: true,
        _validTill: q.validTill
    };
    // Save it temporarily for generator to fetch
    window._tempQuotation = tempInv;
    generateQuotationPDFDoc(tempInv);
}

function generateQuotationPDFDoc(q) {
    const settings = DB.getSettings();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 10;
    let y = margin;

    doc.rect(margin, margin, pageW - 2*margin, doc.internal.pageSize.getHeight() - 2*margin);

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('QUOTATION / ESTIMATE', pageW/2, y + 7, { align: 'center' });
    doc.line(margin, y + 9, pageW - margin, y + 9);
    y += 9;

    if (settings.logoUrl) {
        try { doc.addImage(settings.logoUrl, 'PNG', pageW/2 - 15, y + 2, 30, 25); } catch(e) {}
    }
    y += 28;

    doc.setFontSize(16); doc.setTextColor(26,58,92);
    doc.text(settings.companyName.toUpperCase(), pageW/2, y, { align: 'center' });
    y += 5;
    doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(60,60,60);
    doc.splitTextToSize(settings.address, 100).forEach(l => { doc.text(l, pageW/2, y, {align:'center'}); y+=3.5; });
    doc.text('United Arab Emirates', pageW/2, y, {align:'center'}); y+=4;
    doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.text(`TRN: ${settings.trn || 'N/A'}`, pageW/2, y, {align:'center'});
    y += 6;

    doc.line(margin, y, pageW - margin, y); y += 5;
    doc.setFontSize(8); doc.setTextColor(0,0,0);
    doc.setFont('helvetica','bold'); doc.text('Contact:', margin+3, y);
    doc.setFont('helvetica','normal'); doc.text(settings.phone, margin+18, y);
    doc.setFont('helvetica','bold'); doc.text('Email:', margin+75, y);
    doc.setFont('helvetica','normal'); doc.text(settings.email, margin+88, y);
    y += 4; doc.line(margin, y, pageW-margin, y); y += 2;

    // Customer + Quote info
    const midX = pageW - margin - 65;
    doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.text('Quote To:', margin+3, y+5);
    doc.setFontSize(10); doc.text(q.customerName, margin+3, y+10);
    doc.setFont('helvetica','normal'); doc.setFontSize(8);
    let ly = y+14;
    doc.splitTextToSize(q.customerAddress || '', 90).forEach(l => { doc.text(l, margin+3, ly); ly+=3.5; });
    if (q.customerPhone) { doc.text(`Phone: ${q.customerPhone}`, margin+3, ly); ly+=3.5; }
    if (q.customerTRN) { doc.setFont('helvetica','bold'); doc.text(`TRN: ${q.customerTRN}`, margin+3, ly); }

    doc.setFont('helvetica','bold'); doc.setFontSize(8.5);
    doc.text('Quote No.:', midX, y+5);
    doc.setFont('helvetica','normal'); doc.text(q.quotationNumber, midX+22, y+5);
    doc.setFont('helvetica','bold'); doc.text('Date:', midX, y+10);
    doc.setFont('helvetica','normal'); doc.text(formatDate(q.date), midX+22, y+10);
    doc.setFont('helvetica','bold'); doc.text('Valid Till:', midX, y+15);
    doc.setFont('helvetica','bold'); doc.setTextColor(200,0,0); doc.text(formatDate(q.validTill||q._validTill), midX+22, y+15); doc.setTextColor(0,0,0);
    if (q.projectName) { doc.setFont('helvetica','bold'); doc.text('Project:', midX, y+20); doc.setFont('helvetica','normal'); doc.text(q.projectName.substring(0,25), midX+22, y+20); }
    y += 32;
    doc.line(margin, y, pageW-margin, y);

    // Items table
    const tHead = y;
    doc.setFillColor(240,240,240); doc.rect(margin, y, pageW-2*margin, 8, 'F');
    doc.setFont('helvetica','bold'); doc.setFontSize(8.5);
    const cDesc = margin+12, cQty = margin+115, cUnit = margin+135, cRate = margin+155, cAmt = pageW-margin-3;
    doc.text('Sl', margin+2, y+5);
    doc.text('Particulars', cDesc+30, y+5, {align:'center'});
    doc.text('Qty', cQty+8, y+5, {align:'center'});
    doc.text('Unit', cUnit+8, y+5, {align:'center'});
    doc.text('Rate', cRate+8, y+5, {align:'center'});
    doc.text('Amount', cAmt, y+5, {align:'right'});
    y += 8; doc.line(margin, y, pageW-margin, y);

    doc.setFont('helvetica','normal');
    q.items.forEach((item, idx) => {
        const lines = doc.splitTextToSize(item.description||'',100);
        const rowH = Math.max(6, lines.length*3.8+2);
        doc.text(String(idx+1), margin+5, y+4, {align:'center'});
        doc.setFont('helvetica','bold'); doc.text(lines[0]||'', cDesc, y+4);
        doc.setFont('helvetica','normal');
        for(let i=1;i<lines.length;i++) { doc.setFontSize(7.5); doc.text(lines[i],cDesc,y+4+(i*3.5)); doc.setFontSize(8.5); }
        doc.text(formatNum(item.qty), cQty+8, y+4, {align:'center'});
        doc.text(item.unit, cUnit+8, y+4, {align:'center'});
        doc.text(formatNum(item.rate), cRate+15, y+4, {align:'right'});
        doc.text(formatNum(item.amount), cAmt, y+4, {align:'right'});
        y += rowH;
    });

    y += 2; doc.line(margin, y, pageW-margin, y); y += 5;
    doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.text('Sub Total', cRate+15, y, {align:'right'}); doc.text(formatNum(q.subTotal), cAmt, y, {align:'right'}); y += 4;
    if (q.discount > 0) { doc.text('Discount', cRate+15, y, {align:'right'}); doc.text('- '+formatNum(q.discount), cAmt, y, {align:'right'}); y += 4; }
    if (q.vatEnabled) { doc.text(`VAT @ ${q.vatRate}%`, cRate+15, y, {align:'right'}); doc.text(formatNum(q.vatAmount), cAmt, y, {align:'right'}); y += 4; }
    y += 1; doc.line(margin, y, pageW-margin, y); y += 5;
    doc.setFontSize(11); doc.setTextColor(26,58,92);
    doc.text('Grand Total', cRate+15, y, {align:'right'});
    doc.text(`AED ${formatNum(q.grandTotal)}`, cAmt, y, {align:'right'});
    doc.setTextColor(0,0,0); y += 5;
    doc.line(margin, y, pageW-margin, y); y += 5;

    // Amount in words
    doc.setFont('helvetica','bold'); doc.setFontSize(8.5);
    doc.text('Amount in words:', margin+3, y);
    doc.text(numberToWords(q.grandTotal), margin+40, y);
    y += 6; doc.line(margin, y, pageW-margin, y); y += 4;

    // Terms
    doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.text('Terms & Conditions:', margin+3, y); y += 4;
    doc.setFont('helvetica','normal'); doc.setFontSize(8);
    doc.splitTextToSize(q.notes || settings.quotationNotes || '', pageW-2*margin-6).forEach(l => { doc.text(l, margin+3, y); y+=3.5; });

    // Signature
    y += 10;
    doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.text(`For ${settings.companyName}`, pageW-margin-3, y, {align:'right'}); y += 15;
    doc.text('Authorised Signatory', pageW-margin-3, y, {align:'right'});

    doc.save(`Quotation_${q.quotationNumber.replace(/\//g,'-')}.pdf`);
    showToast('Quotation PDF downloaded!', 'success');
}