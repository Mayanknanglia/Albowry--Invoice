// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Customers Module (Cloud)
// ═══════════════════════════════════════════════════════

let customerSearchQuery = '';

function renderCustomers(container) {
    const customers = DB.get(DB_KEYS.CUSTOMERS);
    const invoices = DB.get(DB_KEYS.INVOICES);

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
        return (c.name || '').toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q);
    });

    // Same HTML block as before
    container.innerHTML = `
        <!-- HTML is exactly the same as your current customers.js for renderCustomers -->
        <div class="stats-grid">
            <div class="stat-card blue"><div class="stat-label">Total Customers</div><div class="stat-value">${customers.length}</div></div>
            <div class="stat-card gold"><div class="stat-label">Total Billed</div><div class="stat-value">${formatCurrency(enriched.reduce((s,c) => s + c.totalBilled, 0))}</div></div>
            <div class="stat-card red"><div class="stat-label">Outstanding</div><div class="stat-value">${formatCurrency(enriched.reduce((s,c) => s + c.outstanding, 0))}</div></div>
        </div>
        <div class="card">
            <div class="card-header">
                <h2>Customer Directory</h2>
                <button class="btn btn-primary btn-sm" onclick="openCustomerForm()">+ New Customer</button>
            </div>
            <div class="card-body">
                <div class="filters-bar">
                    <div class="search-box">
                        <input type="text" placeholder="Search by name or phone..." value="${customerSearchQuery}" oninput="customerSearchQuery=this.value; renderCustomers(document.getElementById('pageContainer'))">
                    </div>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead><tr><th>Name</th><th>Phone</th><th>City</th><th>TRN</th><th class="text-right">Invoices</th><th class="text-right">Outstanding</th><th>Actions</th></tr></thead>
                        <tbody>
                            ${filtered.map(c => `
                                <tr>
                                    <td class="fw-semibold">${c.name}</td><td>${c.phone || '-'}</td><td>${c.city || '-'}</td><td>${c.trn || '-'}</td>
                                    <td class="text-right">${c.invoiceCount}</td>
                                    <td class="amount ${c.outstanding > 0 ? 'text-danger' : 'text-success'}">${formatCurrency(c.outstanding)}</td>
                                    <td>
                                        <div class="btn-group">
                                            <button class="btn btn-outline btn-xs" onclick="viewCustomerLedger('${c.id}')">Ledger</button>
                                            <button class="btn btn-secondary btn-xs" onclick="openCustomerForm('${c.id}')">Edit</button>
                                            <button class="btn btn-danger btn-xs" onclick="deleteCustomer('${c.id}')">×</button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('') || `<tr><td colspan="7" class="text-center text-muted">No customers found.</td></tr>`}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function openCustomerForm(customerId = null) {
    const c = customerId ? DB.get(DB_KEYS.CUSTOMERS).find(x => x.id === customerId) : {};
    const modalHtml = `
        <div class="modal-overlay" id="customerModal">
            <div class="modal">
                <div class="modal-header"><h2>${customerId ? 'Edit' : 'New'} Customer</h2><button class="modal-close" onclick="closeModal('customerModal')">×</button></div>
                <div class="modal-body">
                    <div class="form-group"><label>Customer Name *</label><input type="text" id="cust_name" value="${c.name || ''}" required></div>
                    <div class="form-row">
                        <div class="form-group"><label>Phone</label><input type="text" id="cust_phone" value="${c.phone || ''}"></div>
                        <div class="form-group"><label>Email</label><input type="email" id="cust_email" value="${c.email || ''}"></div>
                    </div>
                    <div class="form-group"><label>Address</label><textarea id="cust_address" rows="2">${c.address || ''}</textarea></div>
                    <div class="form-row">
                        <div class="form-group"><label>City / Emirate</label><input type="text" id="cust_city" value="${c.city || ''}"></div>
                        <div class="form-group"><label>Country</label><input type="text" id="cust_country" value="${c.country || 'United Arab Emirates'}"></div>
                    </div>
                    <div class="form-group"><label>TRN</label><input type="text" id="cust_trn" value="${c.trn || ''}"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="closeModal('customerModal')">Cancel</button>
                    <button class="btn btn-primary" onclick="saveCustomer('${customerId || ''}')">Save</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

// ✅ CLOUD SAVE
async function saveCustomer(customerId) {
    const name = document.getElementById('cust_name').value.trim();
    if (!name) return showToast('Name is required', 'error');

    const customer = {
        id: customerId || generateId(),
        name,
        phone: document.getElementById('cust_phone').value.trim(),
        email: document.getElementById('cust_email').value.trim(),
        address: document.getElementById('cust_address').value.trim(),
        city: document.getElementById('cust_city').value.trim(),
        country: document.getElementById('cust_country').value.trim(),
        trn: document.getElementById('cust_trn').value.trim(),
        timestamp: new Date().toISOString()
    };

    await DB.saveItem(DB_KEYS.CUSTOMERS, customer);
    closeModal('customerModal');
}

// ✅ CLOUD DELETE
async function deleteCustomer(customerId) {
    const c = await confirmDialog('Delete this customer permanently?');
    if (!c) return;
    await DB.deleteItem(DB_KEYS.CUSTOMERS, customerId);
}

// Ledger function remains the same html wise
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
                <div class="ledger-header"><h2>${customer.name}</h2><p>${customer.phone || ''}</p></div>
                <div class="ledger-stats">
                    <div class="ledger-stat"><label>Billed</label><span>${formatCurrency(totalBilled)}</span></div>
                    <div class="ledger-stat"><label>Outstanding</label><span class="text-danger">${formatCurrency(outstanding)}</span></div>
                </div>
                <div class="modal-body">
                    <div class="table-wrapper">
                        <table>
                            <thead><tr><th>Inv No.</th><th>Date</th><th class="text-right">Amount</th><th>Status</th></tr></thead>
                            <tbody>
                                ${invoices.map(inv => `<tr><td>${inv.invoiceNumber}</td><td>${formatDate(inv.date)}</td><td class="amount">${formatCurrency(inv.grandTotal)}</td><td>${inv.paymentStatus}</td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal('ledgerModal')">Close</button></div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}
