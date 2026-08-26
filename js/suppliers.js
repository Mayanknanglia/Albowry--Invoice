// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Suppliers Module
// ═══════════════════════════════════════════════════════

let supplierSearchQuery = '';

function renderSuppliers(container) {
    const suppliers = DB.get(DB_KEYS.SUPPLIERS);
    const purchases = DB.get(DB_KEYS.PURCHASES);

    const enriched = suppliers.map(s => {
        const supPurchases = purchases.filter(p => p.supplierId === s.id);
        const totalBilled = supPurchases.reduce((sum, p) => sum + parseFloat(p.grandTotal || 0), 0);
        const totalPaid = supPurchases.filter(p => p.paymentStatus === 'Paid').reduce((sum, p) => sum + parseFloat(p.grandTotal || 0), 0);
        const outstanding = totalBilled - totalPaid;
        return { ...s, purchaseCount: supPurchases.length, totalBilled, totalPaid, outstanding };
    });

    const filtered = enriched.filter(s => {
        if (!supplierSearchQuery) return true;
        const q = supplierSearchQuery.toLowerCase();
        return (s.name || '').toLowerCase().includes(q) || (s.phone || '').toLowerCase().includes(q) || (s.trn || '').toLowerCase().includes(q);
    });

    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card blue">
                <div class="stat-label">Total Suppliers</div>
                <div class="stat-value">${suppliers.length}</div>
            </div>
            <div class="stat-card gold">
                <div class="stat-label">Total Purchases</div>
                <div class="stat-value">${formatCurrency(enriched.reduce((s,x) => s + x.totalBilled, 0))}</div>
            </div>
            <div class="stat-card green">
                <div class="stat-label">Paid</div>
                <div class="stat-value">${formatCurrency(enriched.reduce((s,x) => s + x.totalPaid, 0))}</div>
            </div>
            <div class="stat-card red">
                <div class="stat-label">Payable</div>
                <div class="stat-value">${formatCurrency(enriched.reduce((s,x) => s + x.outstanding, 0))}</div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>Supplier Directory</h2>
                <button class="btn btn-primary btn-sm" onclick="openSupplierForm()">+ New Supplier</button>
            </div>
            <div class="card-body">
                <div class="filters-bar">
                    <div class="search-box">
                        <input type="text" placeholder="Search suppliers..." value="${supplierSearchQuery}" oninput="supplierSearchQuery=this.value; renderSuppliers(document.getElementById('pageContainer'))">
                    </div>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>TRN</th>
                                <th>City</th>
                                <th class="text-right">Bills</th>
                                <th class="text-right">Total</th>
                                <th class="text-right">Payable</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.length === 0 ? `
                                <tr><td colspan="9" class="text-center text-muted" style="padding:40px;">
                                    ${suppliers.length === 0 ? 'No suppliers yet. Click "New Supplier" to add.' : 'No results.'}
                                </td></tr>
                            ` : filtered.map((s, idx) => `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td class="fw-semibold">${s.name}</td>
                                    <td>${s.phone || '-'}</td>
                                    <td>${s.trn || '-'}</td>
                                    <td>${s.city || '-'}</td>
                                    <td class="text-right">${s.purchaseCount}</td>
                                    <td class="amount">${formatCurrency(s.totalBilled)}</td>
                                    <td class="amount ${s.outstanding > 0 ? 'text-danger' : 'text-success'}">${formatCurrency(s.outstanding)}</td>
                                    <td>
                                        <div class="btn-group">
                                            <button class="btn btn-outline btn-xs" onclick="viewSupplierLedger('${s.id}')">Ledger</button>
                                            <button class="btn btn-secondary btn-xs" onclick="openSupplierForm('${s.id}')">Edit</button>
                                            <button class="btn btn-danger btn-xs" onclick="deleteSupplier('${s.id}')">×</button>
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

function openSupplierForm(supplierId = null) {
    const suppliers = DB.get(DB_KEYS.SUPPLIERS);
    const s = supplierId ? suppliers.find(x => x.id === supplierId) : {};

    const modalHtml = `
        <div class="modal-overlay" id="supplierModal">
            <div class="modal">
                <div class="modal-header">
                    <h2>${supplierId ? 'Edit Supplier' : 'New Supplier'}</h2>
                    <button class="modal-close" onclick="closeModal('supplierModal')">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Supplier Name *</label>
                        <input type="text" id="sup_name" value="${s.name || ''}">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Contact Person</label>
                            <input type="text" id="sup_contactPerson" value="${s.contactPerson || ''}">
                        </div>
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="text" id="sup_phone" value="${s.phone || ''}">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="sup_email" value="${s.email || ''}">
                        </div>
                        <div class="form-group">
                            <label>TRN</label>
                            <input type="text" id="sup_trn" value="${s.trn || ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <textarea id="sup_address" rows="2">${s.address || ''}</textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>City / Emirate</label>
                            <input type="text" id="sup_city" value="${s.city || ''}">
                        </div>
                        <div class="form-group">
                            <label>Country</label>
                            <input type="text" id="sup_country" value="${s.country || 'United Arab Emirates'}">
                        </div>
                    </div>
                    <div class="section-divider"><span>Bank Details (Optional)</span></div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Bank Name</label>
                            <input type="text" id="sup_bankName" value="${s.bankName || ''}">
                        </div>
                        <div class="form-group">
                            <label>Account No.</label>
                            <input type="text" id="sup_bankAccount" value="${s.bankAccount || ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>IBAN</label>
                        <input type="text" id="sup_bankIban" value="${s.bankIban || ''}">
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea id="sup_notes" rows="2">${s.notes || ''}</textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('supplierModal')">Cancel</button>
                    <button class="btn btn-primary" onclick="saveSupplier('${supplierId || ''}')">Save</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function saveSupplier(supplierId) {
    const name = document.getElementById('sup_name').value.trim();
    if (!name) return showToast('Supplier name required', 'error');

    const supplier = {
        id: supplierId || generateId(),
        name,
        contactPerson: document.getElementById('sup_contactPerson').value.trim(),
        phone: document.getElementById('sup_phone').value.trim(),
        email: document.getElementById('sup_email').value.trim(),
        trn: document.getElementById('sup_trn').value.trim(),
        address: document.getElementById('sup_address').value.trim(),
        city: document.getElementById('sup_city').value.trim(),
        country: document.getElementById('sup_country').value.trim(),
        bankName: document.getElementById('sup_bankName').value.trim(),
        bankAccount: document.getElementById('sup_bankAccount').value.trim(),
        bankIban: document.getElementById('sup_bankIban').value.trim(),
        notes: document.getElementById('sup_notes').value.trim(),
        createdAt: supplierId ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    let suppliers = DB.get(DB_KEYS.SUPPLIERS);
    if (supplierId) {
        const idx = suppliers.findIndex(x => x.id === supplierId);
        if (idx >= 0) suppliers[idx] = { ...suppliers[idx], ...supplier };
    } else {
        suppliers.push(supplier);
    }
    DB.set(DB_KEYS.SUPPLIERS, suppliers);
    closeModal('supplierModal');
    showToast(`Supplier ${supplierId ? 'updated' : 'added'}!`, 'success');
    renderSuppliers(document.getElementById('pageContainer'));
}

async function deleteSupplier(supplierId) {
    const c = await confirmDialog('Delete this supplier?');
    if (!c) return;
    let suppliers = DB.get(DB_KEYS.SUPPLIERS).filter(x => x.id !== supplierId);
    DB.set(DB_KEYS.SUPPLIERS, suppliers);
    showToast('Supplier deleted', 'success');
    renderSuppliers(document.getElementById('pageContainer'));
}

function viewSupplierLedger(supplierId) {
    const supplier = DB.get(DB_KEYS.SUPPLIERS).find(s => s.id === supplierId);
    if (!supplier) return;
    const purchases = DB.get(DB_KEYS.PURCHASES).filter(p => p.supplierId === supplierId).sort((a,b) => new Date(b.date) - new Date(a.date));
    
    const totalBilled = purchases.reduce((s,p) => s + parseFloat(p.grandTotal||0), 0);
    const totalPaid = purchases.filter(p => p.paymentStatus === 'Paid').reduce((s,p) => s + parseFloat(p.grandTotal||0), 0);
    const outstanding = totalBilled - totalPaid;

    const modalHtml = `
        <div class="modal-overlay" id="supLedgerModal">
            <div class="modal" style="max-width:900px;">
                <div class="ledger-header">
                    <h2>${supplier.name}</h2>
                    <p>${supplier.address || ''} ${supplier.city ? ', '+supplier.city : ''}</p>
                    <p>${supplier.phone || ''} ${supplier.trn ? ' • TRN: '+supplier.trn : ''}</p>
                </div>
                <div class="ledger-stats">
                    <div class="ledger-stat"><label>Bills</label><span>${purchases.length}</span></div>
                    <div class="ledger-stat"><label>Total</label><span>${formatCurrency(totalBilled)}</span></div>
                    <div class="ledger-stat"><label>Paid</label><span class="text-success">${formatCurrency(totalPaid)}</span></div>
                    <div class="ledger-stat"><label>Payable</label><span class="text-danger">${formatCurrency(outstanding)}</span></div>
                </div>
                <div class="modal-body">
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr><th>Bill No.</th><th>Date</th><th>Description</th><th class="text-right">Amount</th><th>Status</th></tr>
                            </thead>
                            <tbody>
                                ${purchases.length === 0 ? `<tr><td colspan="5" class="text-center text-muted">No purchases.</td></tr>` :
                                purchases.map(p => `
                                    <tr>
                                        <td class="fw-semibold">${p.billNumber}</td>
                                        <td>${formatDate(p.date)}</td>
                                        <td>${p.description || '-'}</td>
                                        <td class="amount">${formatCurrency(p.grandTotal)}</td>
                                        <td><span class="badge badge-${(p.paymentStatus||'unpaid').toLowerCase()}">${p.paymentStatus||'Unpaid'}</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('supLedgerModal')">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}