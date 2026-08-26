// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Dashboard Module
// ═══════════════════════════════════════════════════════

function renderDashboard(container) {
    const invoices = DB.get(DB_KEYS.INVOICES);
    const quotations = DB.get(DB_KEYS.QUOTATIONS);
    const customers = DB.get(DB_KEYS.CUSTOMERS);
    const purchases = DB.get(DB_KEYS.PURCHASES);
    const settings = DB.getSettings();

    // Calculations
    const totalSales = invoices.reduce((sum, inv) => sum + parseFloat(inv.grandTotal || 0), 0);
    const totalVATCollected = invoices.reduce((sum, inv) => sum + parseFloat(inv.vatAmount || 0), 0);
    const totalPurchases = purchases.reduce((sum, p) => sum + parseFloat(p.grandTotal || 0), 0);
    const totalVATPaid = purchases.reduce((sum, p) => sum + parseFloat(p.vatAmount || 0), 0);
    
    const paidInvoices = invoices.filter(i => i.paymentStatus === 'Paid');
    const unpaidInvoices = invoices.filter(i => i.paymentStatus !== 'Paid');
    
    const totalReceived = paidInvoices.reduce((sum, i) => sum + parseFloat(i.grandTotal || 0), 0);
    const totalOutstanding = unpaidInvoices.reduce((sum, i) => sum + parseFloat(i.grandTotal || 0), 0);
    
    const netVAT = totalVATCollected - totalVATPaid;

    // Current Month Data
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    const monthInvoices = invoices.filter(inv => {
        const d = new Date(inv.date);
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });
    const monthSales = monthInvoices.reduce((sum, i) => sum + parseFloat(i.grandTotal || 0), 0);

    // Recent Invoices (Last 5)
    const recentInvoices = [...invoices]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    container.innerHTML = `
        <div class="dashboard">
            <!-- Welcome Banner -->
            <div class="card mb-3" style="background:linear-gradient(135deg,var(--primary-dark),var(--primary),var(--primary-light));color:white;border:none;">
                <div class="card-body">
                    <h2 style="color:white;font-size:1.3rem;margin-bottom:4px;">Welcome back, Admin!</h2>
                    <p style="opacity:0.85;font-size:0.9rem;">${settings.companyName} — ${new Date().toDateString()}</p>
                </div>
            </div>

            <!-- Stats -->
            <div class="stats-grid">
                <div class="stat-card blue">
                    <div class="stat-label">Total Sales</div>
                    <div class="stat-value">${formatCurrency(totalSales)}</div>
                    <div class="stat-sub">${invoices.length} invoices</div>
                </div>
                <div class="stat-card gold">
                    <div class="stat-label">This Month</div>
                    <div class="stat-value">${formatCurrency(monthSales)}</div>
                    <div class="stat-sub">${monthInvoices.length} invoices</div>
                </div>
                <div class="stat-card green">
                    <div class="stat-label">Received</div>
                    <div class="stat-value">${formatCurrency(totalReceived)}</div>
                    <div class="stat-sub">${paidInvoices.length} paid</div>
                </div>
                <div class="stat-card red">
                    <div class="stat-label">Outstanding</div>
                    <div class="stat-value">${formatCurrency(totalOutstanding)}</div>
                    <div class="stat-sub">${unpaidInvoices.length} unpaid</div>
                </div>
                <div class="stat-card info">
                    <div class="stat-label">VAT Collected</div>
                    <div class="stat-value">${formatCurrency(totalVATCollected)}</div>
                    <div class="stat-sub">Output VAT</div>
                </div>
                <div class="stat-card orange">
                    <div class="stat-label">VAT Paid</div>
                    <div class="stat-value">${formatCurrency(totalVATPaid)}</div>
                    <div class="stat-sub">Input VAT</div>
                </div>
                <div class="stat-card green">
                    <div class="stat-label">Net VAT Payable</div>
                    <div class="stat-value">${formatCurrency(netVAT)}</div>
                    <div class="stat-sub">To FTA</div>
                </div>
                <div class="stat-card blue">
                    <div class="stat-label">Customers</div>
                    <div class="stat-value">${customers.length}</div>
                    <div class="stat-sub">${quotations.length} quotations</div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="card mb-3">
                <div class="card-header">
                    <h2>Quick Actions</h2>
                </div>
                <div class="card-body">
                    <div class="btn-group">
                        <button class="btn btn-primary" onclick="navigateTo('invoices'); setTimeout(()=>openInvoiceForm(),200)">+ New Invoice</button>
                        <button class="btn btn-accent" onclick="navigateTo('quotations'); setTimeout(()=>openQuotationForm(),200)">+ New Quotation</button>
                        <button class="btn btn-outline" onclick="navigateTo('customers'); setTimeout(()=>openCustomerForm(),200)">+ Add Customer</button>
                        <button class="btn btn-outline" onclick="navigateTo('vat-reports')">VAT Report</button>
                    </div>
                </div>
            </div>

            <!-- Recent Invoices -->
            <div class="card">
                <div class="card-header">
                    <h2>Recent Invoices</h2>
                    <button class="btn btn-sm btn-outline" onclick="navigateTo('invoices')">View All</button>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Inv No.</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${recentInvoices.length === 0 ? `
                                <tr><td colspan="5" class="text-center text-muted" style="padding:30px;">No invoices yet. Create your first one!</td></tr>
                            ` : recentInvoices.map(inv => `
                                <tr>
                                    <td class="fw-semibold text-primary">${inv.invoiceNumber}</td>
                                    <td>${formatDate(inv.date)}</td>
                                    <td>${inv.customerName || '-'}</td>
                                    <td class="amount">${formatCurrency(inv.grandTotal)}</td>
                                    <td><span class="badge badge-${(inv.paymentStatus || 'unpaid').toLowerCase()}">${inv.paymentStatus || 'Unpaid'}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}