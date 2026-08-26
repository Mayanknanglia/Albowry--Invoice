// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - VAT Reports (FTA-Ready)
// ═══════════════════════════════════════════════════════

let vatQuarter = 'current';

function renderVatReports(container) {
    const settings = DB.getSettings();
    const period = getVatPeriod();
    const invoices = DB.get(DB_KEYS.INVOICES).filter(i => {
        const d = new Date(i.date);
        return d >= period.start && d <= period.end;
    });
    const purchases = DB.get(DB_KEYS.PURCHASES).filter(p => {
        const d = new Date(p.date);
        return d >= period.start && d <= period.end;
    });

    // Calculations
    const standardRatedSales = invoices.filter(i => i.vatEnabled).reduce((s,i) => s + parseFloat(i.taxable||0), 0);
    const zeroRatedSales = invoices.filter(i => !i.vatEnabled).reduce((s,i) => s + parseFloat(i.subTotal||0), 0);
    const outputVAT = invoices.reduce((s,i) => s + parseFloat(i.vatAmount||0), 0);
    
    const purchasesTotal = purchases.filter(p => p.vatEnabled).reduce((s,p) => s + parseFloat(p.subTotal||0), 0);
    const inputVAT = purchases.reduce((s,p) => s + parseFloat(p.vatAmount||0), 0);
    
    const netVATPayable = outputVAT - inputVAT;

    container.innerHTML = `
        <div class="card mb-3">
            <div class="card-header">
                <h2>UAE VAT Return Report</h2>
                <button class="btn btn-success btn-sm" onclick="exportVatExcel()">Export Excel</button>
            </div>
            <div class="card-body">
                <div class="quick-filters">
                    <button class="quick-filter ${vatQuarter==='current'?'active':''}" onclick="vatQuarter='current'; renderVatReports(document.getElementById('pageContainer'))">Current Quarter</button>
                    <button class="quick-filter ${vatQuarter==='previous'?'active':''}" onclick="vatQuarter='previous'; renderVatReports(document.getElementById('pageContainer'))">Previous Quarter</button>
                    <button class="quick-filter ${vatQuarter==='thisYear'?'active':''}" onclick="vatQuarter='thisYear'; renderVatReports(document.getElementById('pageContainer'))">This Year</button>
                    <button class="quick-filter ${vatQuarter==='lastYear'?'active':''}" onclick="vatQuarter='lastYear'; renderVatReports(document.getElementById('pageContainer'))">Last Year</button>
                </div>
                <p class="text-muted mt-2" style="font-size:0.85rem;">
                    Period: <strong>${period.label}</strong> | 
                    TRN: <strong>${settings.trn || 'Not Set'}</strong>
                </p>
            </div>
        </div>

        <!-- VAT SUMMARY BOX -->
        <div class="card mb-3">
            <div class="card-header"><h2>VAT Return Summary (FTA Format)</h2></div>
            <div class="card-body">
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Box</th>
                                <th>Description</th>
                                <th class="text-right">Amount (AED)</th>
                                <th class="text-right">VAT (AED)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style="background:var(--border-light);"><td colspan="4" class="fw-bold">SALES AND ALL OTHER OUTPUTS</td></tr>
                            <tr>
                                <td>1a</td>
                                <td>Standard Rated Supplies</td>
                                <td class="amount">${formatCurrency(standardRatedSales)}</td>
                                <td class="amount fw-bold">${formatCurrency(outputVAT)}</td>
                            </tr>
                            <tr>
                                <td>4</td>
                                <td>Zero Rated / Exempt Supplies</td>
                                <td class="amount">${formatCurrency(zeroRatedSales)}</td>
                                <td class="amount">0.00</td>
                            </tr>
                            <tr class="fw-bold" style="background:#e8f4f8;">
                                <td colspan="2">Total Sales / Output VAT</td>
                                <td class="amount">${formatCurrency(standardRatedSales + zeroRatedSales)}</td>
                                <td class="amount text-primary">${formatCurrency(outputVAT)}</td>
                            </tr>
                            
                            <tr style="background:var(--border-light);"><td colspan="4" class="fw-bold">EXPENSES AND ALL OTHER INPUTS</td></tr>
                            <tr>
                                <td>9</td>
                                <td>Standard Rated Expenses</td>
                                <td class="amount">${formatCurrency(purchasesTotal)}</td>
                                <td class="amount fw-bold">${formatCurrency(inputVAT)}</td>
                            </tr>
                            <tr class="fw-bold" style="background:#e8f4f8;">
                                <td colspan="2">Total Purchases / Input VAT</td>
                                <td class="amount">${formatCurrency(purchasesTotal)}</td>
                                <td class="amount text-primary">${formatCurrency(inputVAT)}</td>
                            </tr>
                            
                            <tr style="background:linear-gradient(90deg,var(--primary),var(--primary-light));color:white;">
                                <td colspan="3" class="fw-bold" style="font-size:1.05rem;">NET VAT ${netVATPayable >= 0 ? 'PAYABLE' : 'REFUNDABLE'}</td>
                                <td class="amount fw-bold" style="font-size:1.1rem;">${formatCurrency(Math.abs(netVATPayable))}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="settings-grid">
            <div class="settings-section">
                <div class="settings-section-header">Output VAT (Sales)</div>
                <div class="settings-section-body">
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr><th>Inv No.</th><th>Date</th><th>Customer</th><th class="text-right">VAT</th></tr>
                            </thead>
                            <tbody>
                                ${invoices.length === 0 ? `<tr><td colspan="4" class="text-muted text-center">No sales</td></tr>` :
                                invoices.map(i => `
                                    <tr>
                                        <td>${i.invoiceNumber}</td>
                                        <td>${formatDate(i.date)}</td>
                                        <td>${(i.customerName||'').substring(0,20)}</td>
                                        <td class="amount">${formatCurrency(i.vatAmount)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="settings-section">
                <div class="settings-section-header">Input VAT (Purchases)</div>
                <div class="settings-section-body">
                    <div class="table-wrapper">
                        <table>
                            <thead>
                                <tr><th>Bill No.</th><th>Date</th><th>Supplier</th><th class="text-right">VAT</th></tr>
                            </thead>
                            <tbody>
                                ${purchases.length === 0 ? `<tr><td colspan="4" class="text-muted text-center">No purchases</td></tr>` :
                                purchases.map(p => `
                                    <tr>
                                        <td>${p.billNumber}</td>
                                        <td>${formatDate(p.date)}</td>
                                        <td>${(p.supplierName||'').substring(0,20)}</td>
                                        <td class="amount">${formatCurrency(p.vatAmount)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getVatPeriod() {
    const now = new Date();
    let start, end, label;
    switch(vatQuarter) {
        case 'current':
            const q = Math.floor(now.getMonth() / 3);
            start = new Date(now.getFullYear(), q*3, 1);
            end = new Date(now.getFullYear(), q*3+3, 0);
            label = `Q${q+1} ${now.getFullYear()}`;
            break;
        case 'previous':
            const pq = Math.floor(now.getMonth() / 3) - 1;
            const pYear = pq < 0 ? now.getFullYear()-1 : now.getFullYear();
            const adjQ = pq < 0 ? 3 : pq;
            start = new Date(pYear, adjQ*3, 1);
            end = new Date(pYear, adjQ*3+3, 0);
            label = `Q${adjQ+1} ${pYear}`;
            break;
        case 'thisYear':
            start = new Date(now.getFullYear(), 0, 1);
            end = new Date(now.getFullYear(), 11, 31);
            label = `Year ${now.getFullYear()}`;
            break;
        case 'lastYear':
            start = new Date(now.getFullYear()-1, 0, 1);
            end = new Date(now.getFullYear()-1, 11, 31);
            label = `Year ${now.getFullYear()-1}`;
            break;
    }
    return { start, end, label };
}

function exportVatExcel() {
    const settings = DB.getSettings();
    const period = getVatPeriod();
    const invoices = DB.get(DB_KEYS.INVOICES).filter(i => {
        const d = new Date(i.date);
        return d >= period.start && d <= period.end;
    });
    const purchases = DB.get(DB_KEYS.PURCHASES).filter(p => {
        const d = new Date(p.date);
        return d >= period.start && d <= period.end;
    });

    const wb = XLSX.utils.book_new();
    const outputVAT = invoices.reduce((s,i) => s + parseFloat(i.vatAmount||0), 0);
    const inputVAT = purchases.reduce((s,p) => s + parseFloat(p.vatAmount||0), 0);
    const standardSales = invoices.filter(i => i.vatEnabled).reduce((s,i) => s + parseFloat(i.taxable||0), 0);
    const purchasesTotal = purchases.filter(p => p.vatEnabled).reduce((s,p) => s + parseFloat(p.subTotal||0), 0);

    // Summary sheet
    const summary = [
        ['Al Bowry Carpentry LLC - VAT Return'],
        ['TRN:', settings.trn || ''],
        ['Period:', period.label],
        [''],
        ['BOX', 'DESCRIPTION', 'AMOUNT (AED)', 'VAT (AED)'],
        ['1a', 'Standard Rated Supplies', standardSales.toFixed(2), outputVAT.toFixed(2)],
        ['9', 'Standard Rated Expenses', purchasesTotal.toFixed(2), inputVAT.toFixed(2)],
        [''],
        ['NET VAT PAYABLE:', '', '', (outputVAT - inputVAT).toFixed(2)]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'VAT Summary');

    // Sales sheet
    const salesData = [['Invoice No.', 'Date', 'Customer', 'TRN', 'Taxable Value', 'VAT (5%)', 'Total']];
    invoices.forEach(i => salesData.push([
        i.invoiceNumber, formatDate(i.date), i.customerName, i.customerTRN || '',
        (i.taxable || 0).toFixed(2), (i.vatAmount || 0).toFixed(2), (i.grandTotal || 0).toFixed(2)
    ]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(salesData), 'Output VAT (Sales)');

    // Purchases sheet
    const purData = [['Bill No.', 'Date', 'Supplier', 'TRN', 'Taxable Value', 'VAT (5%)', 'Total']];
    purchases.forEach(p => purData.push([
        p.billNumber, formatDate(p.date), p.supplierName, p.supplierTRN || '',
        (p.subTotal || 0).toFixed(2), (p.vatAmount || 0).toFixed(2), (p.grandTotal || 0).toFixed(2)
    ]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(purData), 'Input VAT (Purchases)');

    XLSX.writeFile(wb, `AlBowry_VAT_Return_${period.label.replace(/\s/g,'_')}.xlsx`);
    showToast('VAT Report exported!', 'success');
}