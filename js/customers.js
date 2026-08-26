// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Customers Module
// ═══════════════════════════════════════════════════════

let customerSearchQuery = '';

function renderCustomers(container) {
    const customers = DB.get(DB_KEYS.CUSTOMERS);
    const invoices = DB.get(DB_KEYS.INVOICES);

    // Enrich with stats
    const enriched = customers.map(c => {
        const custInvoices = invoices.filter(i => i.customerId === c.id);
        const totalBilled = custInvoices.reduce((s, i) => s + parseFloat(i.grandTotal || 0), 0);
        const totalPaid = custInvoices.filter(i => i.paymentStatus === 'Paid').reduce((s, i) => s + parseFloat(i.grandTotal || 0), 0);
        const outstanding = totalBilled - totalPaid;
        return { ...c, invoiceCount: custInvoices.length, totalBilled, totalPaid, outstanding };
    });

    const filtered = enriched.filter(c => {
        if (!customerSearchQuery) return true;
        const q = customerSearchQuery.toLowerCase();
        return (c.name || '').toLowerCase().includes(q) || 
               (c.phone || '').toLowerCase().includes(q) ||
               (c.trn || '').toLowerCase().includes(q);
    });

    container.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card blue">
                <div class="stat-label">Total Customers</div>
                <div class="stat-value">${customers.length}</div>
            </div>
            <div class="stat-card gold">
                <div class="stat-label">Total Billed</div>
                <div class="stat-value">${formatCurrency(enriched.reduce((s,c) => s + c.totalBilled, 0))}</div>
            </div>
            <div class="stat-card green">
                <div class="stat-label">Received</div>
                <div class="stat-value">${formatCurrency(enriched.reduce((s,c) => s + c.totalPaid, 0))}</div>
            </div>
            <div class="stat-card red">
                <div class="stat-label">Outstanding</div>
                <div class="stat-value">${formatCurrency(enriched.reduce((s,c) => s + c.outstanding, 0))}</div>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <h2>Customer Directory</h2>
                <div class="btn-group">
                    <button class="btn btn-primary btn-sm" onclick="openCustomerForm()">+ New Customer</button>
                </div>
            </div>
            <div class="card-body">
                <div class="filters-bar">
                    <div class="search-box">
                        <input type="text" placeholder="Search by name, phone, or TRN..." value="${customerSearchQuery}" oninput="customerSearchQuery=this.value; renderCustomers(document.getElementById('pageContainer'))">
                    </div>
                </div>

                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Location</th>
                                <th>TRN</th>
                                <th class="text-right">Invoices</th>
                                <th class="text-right">Total Billed</th>
                                <th class="text-right">Outstanding</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filtered.length === 0 ? `
                                <tr><td colspan="9" class="text-center text-muted" style="padding:40px;">
                                    ${customers.length === 0 ? 'No customers yet. Click "New Customer" to add one.' : 'No results match your search.'}
                                </td></tr>
                            ` : filtered.map((c, idx) => `
                                <tr>
                                    <td>${idx + 1}</td>
                                    <td class="fw-semibold">${c.name}</td>
                                    <td>${c.phone || '-'}</td>
                                    <td>${c.city || '-'}</td>
                                    <td>${c.trn || '-'}</td>
                                    <td class="text-right">${c.invoiceCount}</td>
                                    <td class="amount">${formatCurrency(c.totalBilled)}</td>
                                    <td class="amount ${c.outstanding > 0 ? 'text-danger' : 'text-success'}">${formatCurrency(c.outstanding)}</td>
                                    <td>
                                        <div class="btn-group">
                                            <button class="btn btn-outline btn-xs" onclick="viewCustomerLedger('${c.id}')">Ledger</button>
                                            <button class="btn btn-secondary btn-xs" onclick="openCustomerForm('${c.id}')">Edit</button>
                                            <button class="btn btn-danger btn-xs" onclick="deleteCustomer('${c.id}')">×</button>
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

// Open Customer Form (New/Edit)
function openCustomerForm(customerId = null) {
    const customers = DB.get(DB_KEYS.CUSTOMERS);
    const c = customerId ? customers.find(x => x.id === customerId) : {};

    const modalHtml = `
        <div class="modal-overlay" id="customerModal">
            <div class="modal">
                <div class="modal-header">
                    <h2>${customerId ? 'Edit Customer' : 'New Customer'}</h2>
                    <button class="modal-close" onclick="closeModal('customerModal')">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Customer Name *</label>
                        <input type="text" id="cust_name" value="${c.name || ''}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Phone</label>
                            <input type="text" id="cust_phone" value="${c.phone || ''}">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" id="cust_email" value="${c.email || ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Address</label>
                        <textarea id="cust_address" rows="2">${c.address || ''}</textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>City / Emirate</label>
                            <input type="text" id="cust_city" value="${c.city || ''}" placeholder="e.g., Sharjah">
                        </div>
                        <div class="form-group">
                            <label>Country</label>
                            <input type="text" id="cust_country" value="${c.country || 'United Arab Emirates'}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>TRN (Tax Registration No.)</label>
                        <input type="text" id="cust_trn" value="${c.trn || ''}" placeholder="15-digit TRN (Optional)">
                    </div>
                    <div class="form-group">
                        <label>Notes</label>
                        <textarea id="cust_notes" rows="2">${c.notes || ''}</textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('customerModal')">Cancel</button>
                    <button class="btn btn-primary" onclick="saveCustomer('${customerId || ''}')">Save Customer</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function saveCustomer(customerId) {
    const name = document.getElementById('cust_name').value.trim();
    if (!name) {
        showToast('Customer name is required!', 'error');
        return;
    }

    const customer = {
        id: customerId || generateId(),
        name,
        phone: document.getElementById('cust_phone').value.trim(),
        email: document.getElementById('cust_email').value.trim(),
        address: document.getElementById('cust_address').value.trim(),
        city: document.getElementById('cust_city').value.trim(),
        country: document.getElementById('cust_country').value.trim(),
        trn: document.getElementById('cust_trn').value.trim(),
        notes: document.getElementById('cust_notes').value.trim(),
        createdAt: customerId ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    let customers = DB.get(DB_KEYS.CUSTOMERS);
    if (customerId) {
        const idx = customers.findIndex(c => c.id === customerId);
        if (idx >= 0) customers[idx] = { ...customers[idx], ...customer };
    } else {
        customers.push(customer);
    }
    DB.set(DB_KEYS.CUSTOMERS, customers);
    closeModal('customerModal');
    showToast(`Customer ${customerId ? 'updated' : 'added'}!`, 'success');
    renderCustomers(document.getElementById('pageContainer'));
}

async function deleteCustomer(customerId) {
    const confirmed = await confirmDialog('Delete this customer permanently?');
    if (!confirmed) return;
    let customers = DB.get(DB_KEYS.CUSTOMERS);
    customers = customers.filter(c => c.id !== customerId);
    DB.set(DB_KEYS.CUSTOMERS, customers);
    showToast('Customer deleted', 'success');
    renderCustomers(document.getElementById('pageContainer'));
}

// View Customer Ledger
function viewCustomerLedger(customerId) {
    const customer = DB.get(DB_KEYS.CUSTOMERS).find(c => c.id === customerId);
    if (!customer) return;
    const invoices = DB.get(DB_KEYS.INVOICES).filter(i => i.customerId === customerId).sort((a,b) => new Date(b.date) - new Date(a.date));
    
    const totalBilled = invoices.reduce((s,i) => s + parseFloat(i.grandTotal||0), 0);
    const totalPaid = invoices.filter(i => i.paymentStatus === 'Paid').reduce((s,i) => s + parseFloat(i.grandTotal||0), 0);
    const outstanding = totalBilled - totalPaid;

    const modalHtml = `
        <div class="modal-overlay" id="ledgerModal">
            <div class="modal" style="max-width:900px;">
                <div class="ledger-header">
                    <h2>${customer.name}</h2>
                    <p>${customer.address || ''} ${customer.city ? ', ' + customer.city : ''}</p>
                    <p>${customer.phone || ''} ${customer.trn ? ' • TRN: ' + customer.trn : ''}</p>
                </div>
                <div class="ledger-stats">
                    <div class="ledger-stat">
                        <label>Total Invoices</label>
                        <span>${invoices.length}</span>
                    </div>
                    <div class="ledger-stat">
                        <label>Total Billed</label>
                        <span>${formatCurrency(totalBilled)}</span>
                    </div>
                    <div class="ledger-stat">
                        <label>Paid</label>
                        <span class="text-success">${formatCurrency(totalPaid)}</span>
                    </div>
                    <div class="ledger-stat">
                        <label>Outstanding</label>
                        <span class="text-danger">${formatCurrency(outstanding)}</span>
                    </div>
                </div>
                <div class="modal-body">
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Inv No.</th>
                                    <th>Date</th>
                                    <th class="text-right">Amount</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${invoices.length === 0 ? `<tr><td colspan="5" class="text-center text-muted">No invoices for this customer.</td></tr>` :
                                invoices.map(inv => `
                                    <tr>
                                        <td class="fw-semibold">${inv.invoiceNumber}</td>
                                        <td>${formatDate(inv.date)}</td>
                                        <td class="amount">${formatCurrency(inv.grandTotal)}</td>
                                        <td><span class="badge badge-${(inv.paymentStatus||'unpaid').toLowerCase()}">${inv.paymentStatus||'Unpaid'}</span></td>
                                        <td><button class="btn btn-outline btn-xs" onclick="closeModal('ledgerModal'); navigateTo('invoices'); setTimeout(()=>viewInvoice('${inv.id}'),200)">View</button></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('ledgerModal')">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// Helper: Close modal
function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.remove();
}