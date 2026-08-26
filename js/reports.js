// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Reports Module
// ═══════════════════════════════════════════════════════

let reportPeriod = 'thisMonth';
let customStartDate = '';
let customEndDate = '';

function renderReports(container) {
    const filtered = getFilteredData();
    const { invoices, purchases, dateLabel } = filtered;

    const totalSales = invoices.reduce((s,i) => s + parseFloat(i.grandTotal||0), 0);
    const totalPurchases = purchases.reduce((s,p) => s + parseFloat(p.grandTotal||0), 0);
    const salesVAT = invoices.reduce((s,i) => s + parseFloat(i.vatAmount||0), 0);
    const purchaseVAT = purchases.reduce((s,p) => s + parseFloat(p.vatAmount||0), 0);
    const netSales = totalSales - salesVAT;
    const netPurchases = totalPurchases - purchaseVAT;
    const grossProfit = netSales - netPurchases;
    const profitMargin = netSales > 0 ? (grossProfit / netSales * 100).toFixed(1) : 0;

    // Category breakdown
    const catBreakdown = {};
    purchases.forEach(p => {
        const cat = p.category || 'Other';
        catBreakdown[cat] = (catBreakdown[cat] || 0) + parseFloat(p.grandTotal || 0);
    });

    // Top customers
    const custMap = {};
    invoices.forEach(i => {
        const key = i.customerName || 'Unknown';
        custMap[key] = (custMap[key] || 0) + parseFloat(i.grandTotal || 0);
    });
    const topCustomers = Object.entries(custMap).sort((a,b) => b[1]-a[1]).slice(0, 5);

    container.innerHTML = `
        <div class="card mb-3">
            <div class="card-header">
                <h2>Business Reports</h2>
                <div class="btn-group">
                    <button class="btn btn-success btn-sm" onclick="exportReportExcel()">Excel</button>
                </div>
            </div>
            <div class="card-body">
                <div class="quick-filters">
                    <button class="quick-filter ${reportPeriod==='thisMonth'?'active':''}" onclick="setPeriod('thisMonth')">This Month</button>
                    <button class="quick-filter ${reportPeriod==='lastMonth'?'active':''}" onclick="setPeriod('lastMonth')">Last Month</button>
                    <button class="quick-filter ${reportPeriod==='thisQuarter'?'active':''}" onclick="setPeriod('thisQuarter')">This Quarter</button>
                    <button class="quick-filter ${reportPeriod==='thisYear'?'active':''}" onclick="setPeriod('thisYear')">This Year</button>
                    <button class="quick-filter ${reportPeriod==='all'?'active':''}" onclick="setPeriod('all')">All Time</button>
                    <button class="quick-filter ${reportPeriod==='custom'?'active':''}" onclick="setPeriod('custom')">Custom</button>
                </div>
                ${reportPeriod === 'custom' ? `
                    <div class="form-row mt-2">
                        <div class="form-group">
                            <label>From</label>
                            <input type="date" value="${customStartDate}" onchange="customStartDate=this.value; renderReports(document.getElementById('pageContainer'))">
                        </div>
                        <div class="form-group">
                            <label>To</label>
                            <input type="date" value="${customEndDate}" onchange="customEndDate=this.value; renderReports(document.getElementById('pageContainer'))">
                        </div>
                    </div>
                ` : ''}
                <p class="text-muted mt-2" style="font-size:0.85rem;">Period: <strong>${dateLabel}</strong></p>
            </div>
        </div>

        <!-- P&L STATEMENT -->
        <div class="card mb-3">
            <div class="card-header"><h2>Profit & Loss Statement</h2></div>
            <div class="card-body">
                <div class="table-wrapper">
                    <table>
                        <tbody>
                            <tr style="background:var(--border-light);">
                                <td class="fw-bold" colspan="2">INCOME</td>
                            </tr>
                            <tr>
                                <td>Total Sales (${invoices.length} invoices)</td>
                                <td class="amount">${formatCurrency(totalSales)}</td>
                            </tr>
                            <tr>
                                <td class="text-muted" style="padding-left:24px;">Less: Output VAT</td>
                                <td class="amount text-muted">- ${formatCurrency(salesVAT)}</td>
                            </tr>
                            <tr class="fw-bold">
                                <td>Net Sales (Revenue)</td>
                                <td class="amount text-success">${formatCurrency(netSales)}</td>
                            </tr>
                            <tr style="background:var(--border-light);">
                                <td class="fw-bold" colspan="2">EXPENSES</td>
                            </tr>
                            <tr>
                                <td>Total Purchases (${purchases.length} bills)</td>
                                <td class="amount">${formatCurrency(totalPurchases)}</td>
                            </tr>
                            <tr>
                                <td class="text-muted" style="padding-left:24px;">Less: Input VAT</td>
                                <td class="amount text-muted">- ${formatCurrency(purchaseVAT)}</td>
                            </tr>
                            <tr class="fw-bold">
                                <td>Net Purchases (Cost)</td>
                                <td class="amount text-danger">${formatCurrency(netPurchases)}</td>
                            </tr>
                            <tr style="background:linear-gradient(90deg,var(--primary),var(--primary-light));color:white;">
                                <td class="fw-bold" style="font-size:1.05rem;">GROSS PROFIT</td>
                                <td class="amount fw-bold" style="font-size:1.1rem;">${formatCurrency(grossProfit)}</td>
                            </tr>
                            <tr>
                                <td class="text-muted">Profit Margin</td>
                                <td class="amount text-muted">${profitMargin}%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="settings-grid">
            <!-- TOP CUSTOMERS -->
            <div class="settings-section">
                <div class="settings-section-header">Top 5 Customers</div>
                <div class="settings-section-body">
                    ${topCustomers.length === 0 ? '<p class="text-muted">No data</p>' :
                    `<table>
                        <tbody>
                            ${topCustomers.map(([name, amt]) => `
                                <tr><td>${name}</td><td class="amount">${formatCurrency(amt)}</td></tr>
                            `).join('')}
                        </tbody>
                    </table>`}
                </div>
            </div>

            <!-- EXPENSE BREAKDOWN -->
            <div class="settings-section">
                <div class="settings-section-header">Expense Breakdown</div>
                <div class="settings-section-body">
                    ${Object.keys(catBreakdown).length === 0 ? '<p class="text-muted">No data</p>' :
                    `<table>
                        <tbody>
                            ${Object.entries(catBreakdown).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => `
                                <tr><td>${cat}</td><td class="amount">${formatCurrency(amt)}</td></tr>
                            `).join('')}
                        </tbody>
                    </table>`}
                </div>
            </div>
        </div>
    `;
}

function setPeriod(period) {
    reportPeriod = period;
    renderReports(document.getElementById('pageContainer'));
}

function getFilteredData() {
    const allInv = DB.get(DB_KEYS.INVOICES);
    const allPur = DB.get(DB_KEYS.PURCHASES);
    const now = new Date();
    let startDate, endDate, dateLabel;

    switch(reportPeriod) {
        case 'thisMonth':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth()+1, 0);
            dateLabel = `${startDate.toLocaleString('default',{month:'long'})} ${startDate.getFullYear()}`;
            break;
        case 'lastMonth':
            startDate = new Date(now.getFullYear(), now.getMonth()-1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            dateLabel = `${startDate.toLocaleString('default',{month:'long'})} ${startDate.getFullYear()}`;
            break;
        case 'thisQuarter':
            const q = Math.floor(now.getMonth() / 3);
            startDate = new Date(now.getFullYear(), q*3, 1);
            endDate = new Date(now.getFullYear(), q*3+3, 0);
            dateLabel = `Q${q+1} ${now.getFullYear()}`;
            break;
        case 'thisYear':
            startDate = new Date(now.getFullYear(), 0, 1);
            endDate = new Date(now.getFullYear(), 11, 31);
            dateLabel = `Year ${now.getFullYear()}`;
            break;
        case 'custom':
            startDate = customStartDate ? new Date(customStartDate) : new Date(2000,0,1);
            endDate = customEndDate ? new Date(customEndDate) : new Date();
            dateLabel = `${formatDate(startDate)} to ${formatDate(endDate)}`;
            break;
        default:
            startDate = new Date(2000,0,1);
            endDate = new Date(2100,0,1);
            dateLabel = 'All Time';
    }

    const filter = arr => arr.filter(x => {
        const d = new Date(x.date);
        return d >= startDate && d <= endDate;
    });

    return {
        invoices: filter(allInv),
        purchases: filter(allPur),
        dateLabel,
        startDate,
        endDate
    };
}

function exportReportExcel() {
    const { invoices, purchases, dateLabel } = getFilteredData();

    const wb = XLSX.utils.book_new();

    // Sales sheet
    const salesData = [
        ['Invoice No.', 'Date', 'Customer', 'TRN', 'Sub Total', 'VAT', 'Grand Total', 'Status']
    ];
    invoices.forEach(i => salesData.push([
        i.invoiceNumber, formatDate(i.date), i.customerName, i.customerTRN || '',
        i.subTotal || 0, i.vatAmount || 0, i.grandTotal || 0, i.paymentStatus || 'Unpaid'
    ]));
    const wsSales = XLSX.utils.aoa_to_sheet(salesData);
    XLSX.utils.book_append_sheet(wb, wsSales, 'Sales');

    // Purchases sheet
    const purData = [
        ['Bill No.', 'Date', 'Supplier', 'TRN', 'Description', 'Sub Total', 'VAT', 'Grand Total', 'Status']
    ];
    purchases.forEach(p => purData.push([
        p.billNumber, formatDate(p.date), p.supplierName, p.supplierTRN || '',
        p.description || '', p.subTotal || 0, p.vatAmount || 0, p.grandTotal || 0, p.paymentStatus || 'Unpaid'
    ]));
    const wsPur = XLSX.utils.aoa_to_sheet(purData);
    XLSX.utils.book_append_sheet(wb, wsPur, 'Purchases');

    // Summary
    const totalSales = invoices.reduce((s,i) => s + parseFloat(i.grandTotal||0), 0);
    const totalPur = purchases.reduce((s,p) => s + parseFloat(p.grandTotal||0), 0);
    const salesVAT = invoices.reduce((s,i) => s + parseFloat(i.vatAmount||0), 0);
    const purVAT = purchases.reduce((s,p) => s + parseFloat(p.vatAmount||0), 0);
    const summaryData = [
        ['Al Bowry Carpentry LLC - Business Report'],
        ['Period:', dateLabel],
        [''],
        ['METRIC', 'AMOUNT (AED)'],
        ['Total Sales', totalSales.toFixed(2)],
        ['Output VAT Collected', salesVAT.toFixed(2)],
        ['Net Sales', (totalSales - salesVAT).toFixed(2)],
        [''],
        ['Total Purchases', totalPur.toFixed(2)],
        ['Input VAT Paid', purVAT.toFixed(2)],
        ['Net Purchases', (totalPur - purVAT).toFixed(2)],
        [''],
        ['GROSS PROFIT', ((totalSales - salesVAT) - (totalPur - purVAT)).toFixed(2)],
        ['NET VAT PAYABLE (to FTA)', (salesVAT - purVAT).toFixed(2)]
    ];
    const wsSum = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSum, 'Summary');

    XLSX.writeFile(wb, `AlBowry_Report_${getTodayISO()}.xlsx`);
    showToast('Excel report downloaded!', 'success');
}