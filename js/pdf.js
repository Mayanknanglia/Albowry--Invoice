// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Invoice PDF Generator (v3 FINAL)
// Perfect Box Alignment - No Overlaps
// ═══════════════════════════════════════════════════════

function generateInvoicePDF(invoiceId, preview = false) {
    const invoice = DB.get(DB_KEYS.INVOICES).find(i => i.id === invoiceId);
    if (!invoice) return showToast('Invoice not found', 'error');
    const settings = DB.getSettings();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth(); // 210
    const pageH = doc.internal.pageSize.getHeight(); // 297
    
    const M = 10; // margin
    const W = pageW - 2*M; // usable width = 190
    let y = M;

    // Helper: Draw text in a cell
    const drawCell = (text, x, y, opts = {}) => {
        doc.setFont('helvetica', opts.bold ? 'bold' : (opts.italic ? 'italic' : 'normal'));
        doc.setFontSize(opts.size || 8.5);
        doc.setTextColor(...(opts.color || [0,0,0]));
        doc.text(String(text || ''), x, y, { align: opts.align || 'left' });
    };

    // Helper: Draw horizontal line
    const hLine = (yPos) => {
        doc.setDrawColor(0);
        doc.setLineWidth(0.3);
        doc.line(M, yPos, M + W, yPos);
    };

    // Helper: Draw vertical line
    const vLine = (x, y1, y2) => {
        doc.setDrawColor(0);
        doc.setLineWidth(0.3);
        doc.line(x, y1, x, y2);
    };

    // ═══════════════════════════════════════════════════
    // OUTER BORDER
    // ═══════════════════════════════════════════════════
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(M, M, W, pageH - 2*M);

    // ═══════════════════════════════════════════════════
    // ROW 1: TITLE "Tax Invoice"
    // ═══════════════════════════════════════════════════
    drawCell('Tax Invoice', pageW/2, y + 7, { bold: true, size: 12, align: 'center' });
    y += 10;
    hLine(y);

    // ═══════════════════════════════════════════════════
    // ROW 2: LOGO + COMPANY NAME + ADDRESS + TRN (Center)
    // ═══════════════════════════════════════════════════
    const headerBoxTop = y;
    y += 3;
    
    // Logo
    if (settings.logoUrl) {
        try {
            doc.addImage(settings.logoUrl, 'PNG', pageW/2 - 15, y, 30, 22);
        } catch(e) {}
    }
    y += 24;

    // Company Name
    drawCell(settings.companyName.toUpperCase(), pageW/2, y, { bold: true, size: 15, align: 'center', color: [26, 58, 92] });
    y += 5;

    // Address
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    const addrLines = doc.splitTextToSize(settings.address, 130);
    addrLines.forEach(line => {
        doc.text(line, pageW/2, y, { align: 'center' });
        y += 3.8;
    });
    doc.text('United Arab Emirates', pageW/2, y, { align: 'center' });
    y += 4;

    // TRN
    drawCell(`TRN: ${settings.trn || 'N/A'}`, pageW/2, y, { bold: true, size: 9, align: 'center' });
    y += 5;
    hLine(y);

    // ═══════════════════════════════════════════════════
    // ROW 3: CONTACT ROW (3 columns)
    // ═══════════════════════════════════════════════════
    const contactRowTop = y;
    y += 5;
    
    const cw = W / 3;
    const contactCol1 = M + 3;
    const contactCol2 = M + cw + 3;
    const contactCol3 = M + 2*cw + 3;
    
    drawCell('Contact:', contactCol1, y, { bold: true, size: 8.5 });
    drawCell(settings.phone || 'N/A', contactCol1 + 18, y, { size: 8.5 });
    
    drawCell('Website:', contactCol2, y, { bold: true, size: 8.5 });
    drawCell(settings.website || 'N/A', contactCol2 + 20, y, { size: 8.5 });
    
    drawCell('E-Mail:', contactCol3, y, { bold: true, size: 8.5 });
    drawCell(settings.email || 'N/A', contactCol3 + 15, y, { size: 8.5 });
    
    y += 4;
    hLine(y);

    // ═══════════════════════════════════════════════════
    // ROW 4: BUYER (LEFT) + INVOICE INFO (RIGHT)
    // ═══════════════════════════════════════════════════
    const buyerBoxTop = y;
    const buyerBoxH = 40;
    const splitX = M + (W * 0.6); // 60/40 split
    
    // Left: Buyer
    let leftY = y + 5;
    drawCell('Buyer (Bill to):', M + 3, leftY, { bold: true, size: 9 });
    leftY += 5;
    drawCell(invoice.customerName || 'N/A', M + 3, leftY, { bold: true, size: 10 });
    leftY += 5;
    
    const custAddrLines = doc.splitTextToSize(invoice.customerAddress || 'N/A', splitX - M - 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    custAddrLines.slice(0, 3).forEach(line => {
        doc.text(line, M + 3, leftY);
        leftY += 3.8;
    });
    
    if (invoice.customerPhone) {
        doc.text(`Phone: ${invoice.customerPhone}`, M + 3, leftY);
        leftY += 3.8;
    }
    if (invoice.customerTRN) {
        drawCell(`TRN: ${invoice.customerTRN}`, M + 3, leftY, { bold: true, size: 8 });
    }
    
    // Right: Invoice Info (label-value pairs)
    let rightY = y + 5;
    const labelX = splitX + 3;
    const valueX = splitX + 26;
    
    drawCell('Invoice No.:', labelX, rightY, { bold: true, size: 8.5 });
    drawCell(invoice.invoiceNumber || 'N/A', valueX, rightY, { size: 8.5 });
    rightY += 5;
    
    drawCell('Dated:', labelX, rightY, { bold: true, size: 8.5 });
    drawCell(formatDate(invoice.date), valueX, rightY, { size: 8.5 });
    rightY += 5;
    
    drawCell('Mode/Terms:', labelX, rightY, { bold: true, size: 8.5 });
    rightY += 4;
    drawCell(invoice.paymentTerms || 'Cash', valueX, rightY, { bold: true, size: 8.5 });
    rightY += 5;
    
    if (invoice.lpoNumber) {
        drawCell('LPO No.:', labelX, rightY, { bold: true, size: 8.5 });
        drawCell(invoice.lpoNumber, valueX, rightY, { size: 8.5 });
    }
    
    // Draw box borders
    vLine(splitX, buyerBoxTop, buyerBoxTop + buyerBoxH);
    y = buyerBoxTop + buyerBoxH;
    hLine(y);

    // ═══════════════════════════════════════════════════
    // ROW 5: PROJECT (Optional)
    // ═══════════════════════════════════════════════════
    if (invoice.projectName) {
        y += 4;
        drawCell('Project:', M + 3, y + 1, { bold: true, size: 8.5 });
        drawCell(invoice.projectName, M + 20, y + 1, { size: 8.5 });
        y += 4;
        hLine(y);
    }

    // ═══════════════════════════════════════════════════
    // ROW 6: ITEMS TABLE
    // ═══════════════════════════════════════════════════
    
    // Define column widths that ADD UP to exactly W (190)
    // Sl(10) + Particulars(90) + Qty(20) + Unit(20) + Rate(25) + Amount(25) = 190
    const col = {
        sl:     { x: M,          w: 10, align: 'center' },
        desc:   { x: M + 10,     w: 90, align: 'left'   },
        qty:    { x: M + 100,    w: 20, align: 'center' },
        unit:   { x: M + 120,    w: 20, align: 'center' },
        rate:   { x: M + 140,    w: 25, align: 'right'  },
        amount: { x: M + 165,    w: 25, align: 'right'  }
    };
    
    // Table Header
    const headerTop = y;
    const headerH = 8;
    
    // Header background
    doc.setFillColor(230, 230, 230);
    doc.rect(M, y, W, headerH, 'F');
    
    // Header text
    drawCell('Sl No.', col.sl.x + col.sl.w/2, y + 5, { bold: true, size: 8, align: 'center' });
    drawCell('Particulars', col.desc.x + col.desc.w/2, y + 5, { bold: true, size: 8, align: 'center' });
    drawCell('Qty', col.qty.x + col.qty.w/2, y + 5, { bold: true, size: 8, align: 'center' });
    drawCell('Unit', col.unit.x + col.unit.w/2, y + 5, { bold: true, size: 8, align: 'center' });
    drawCell('Rate', col.rate.x + col.rate.w/2, y + 5, { bold: true, size: 8, align: 'center' });
    drawCell('Amount (AED)', col.amount.x + col.amount.w - 2, y + 5, { bold: true, size: 8, align: 'right' });
    
    y += headerH;
    hLine(y);
    
    // Vertical lines for header
    vLine(col.desc.x, headerTop, y);
    vLine(col.qty.x, headerTop, y);
    vLine(col.unit.x, headerTop, y);
    vLine(col.rate.x, headerTop, y);
    vLine(col.amount.x, headerTop, y);
    
    // Item Rows
    const itemsStartY = y;
    invoice.items.forEach((item, idx) => {
        const descLines = doc.splitTextToSize(item.description || 'N/A', col.desc.w - 4);
        const rowH = Math.max(7, descLines.length * 4 + 3);
        const rowTop = y;
        
        // Sl No
        drawCell(String(idx + 1), col.sl.x + col.sl.w/2, y + 4.5, { size: 8.5, align: 'center' });
        
        // Description
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(descLines[0] || '', col.desc.x + 2, y + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        for (let i = 1; i < descLines.length; i++) {
            doc.text(descLines[i], col.desc.x + 2, y + 4.5 + (i * 3.5));
        }
        
        // Qty
        drawCell(formatNum(item.qty), col.qty.x + col.qty.w/2, y + 4.5, { size: 8.5, align: 'center' });
        
        // Unit
        drawCell(item.unit || 'Nos', col.unit.x + col.unit.w/2, y + 4.5, { size: 8.5, align: 'center' });
        
        // Rate
        drawCell(formatNum(item.rate), col.rate.x + col.rate.w - 2, y + 4.5, { size: 8.5, align: 'right' });
        
        // Amount
        drawCell(formatNum(item.amount), col.amount.x + col.amount.w - 2, y + 4.5, { size: 8.5, align: 'right' });
        
        y += rowH;
        
        // Row bottom line
        vLine(col.desc.x, rowTop, y);
        vLine(col.qty.x, rowTop, y);
        vLine(col.unit.x, rowTop, y);
        vLine(col.rate.x, rowTop, y);
        vLine(col.amount.x, rowTop, y);
    });
    
    // Empty rows to fill space (min 4 rows worth of empty space)
    const minTableHeight = 40;
    const currentTableHeight = y - itemsStartY;
    if (currentTableHeight < minTableHeight) {
        const emptySpace = minTableHeight - currentTableHeight;
        // Draw vertical lines in empty space
        vLine(col.desc.x, y, y + emptySpace);
        vLine(col.qty.x, y, y + emptySpace);
        vLine(col.unit.x, y, y + emptySpace);
        vLine(col.rate.x, y, y + emptySpace);
        vLine(col.amount.x, y, y + emptySpace);
        y += emptySpace;
    }
    
    hLine(y);

    // ═══════════════════════════════════════════════════
    // ROW 7: TOTALS SECTION (Sub Total, VAT, Round Off)
    // ═══════════════════════════════════════════════════
    const totalsTop = y;
    
    y += 4;
    
    // Sub Total
    drawCell('Sub Total', col.rate.x + col.rate.w - 2, y, { bold: true, size: 9, align: 'right' });
    drawCell(formatNum(invoice.subTotal), col.amount.x + col.amount.w - 2, y, { bold: true, size: 9, align: 'right' });
    y += 4;
    
    // Discount
    if (invoice.discount > 0) {
        drawCell('Discount', col.rate.x + col.rate.w - 2, y, { size: 9, align: 'right' });
        drawCell('- ' + formatNum(invoice.discount), col.amount.x + col.amount.w - 2, y, { size: 9, align: 'right' });
        y += 4;
    }
    
    // VAT
    if (invoice.vatEnabled) {
        drawCell(`OUTPUT VAT @ ${invoice.vatRate}%`, col.rate.x + col.rate.w - 2, y, { bold: true, size: 9, align: 'right' });
        drawCell(formatNum(invoice.vatAmount), col.amount.x + col.amount.w - 2, y, { bold: true, size: 9, align: 'right' });
        y += 4;
    }
    
    // Round Off
    if (invoice.roundOff > 0) {
        drawCell('Round Off', col.rate.x + col.rate.w - 2, y, { size: 9, align: 'right' });
        const sign = invoice.roundOffType === 'add' ? '(+)' : '(-)';
        drawCell(`${sign} ${formatNum(invoice.roundOff)}`, col.amount.x + col.amount.w - 2, y, { size: 9, align: 'right' });
        y += 4;
    }
    
    y += 1;
    
    // Vertical lines for totals section
    vLine(col.rate.x, totalsTop, y);
    vLine(col.amount.x, totalsTop, y);
    
    hLine(y);

    // ═══════════════════════════════════════════════════
    // ROW 8: GRAND TOTAL (Full width row)
    // ═══════════════════════════════════════════════════
    y += 6;
    drawCell('Total', col.rate.x + col.rate.w - 2, y, { bold: true, size: 11, align: 'right', color: [26, 58, 92] });
    drawCell(`AED ${formatNum(invoice.grandTotal)}`, col.amount.x + col.amount.w - 2, y, { bold: true, size: 12, align: 'right', color: [26, 58, 92] });
    y += 4;
    hLine(y);

    // ═══════════════════════════════════════════════════
    // ROW 9: AMOUNT IN WORDS + E. & O.E
    // ═══════════════════════════════════════════════════
    const wordsTop = y;
    y += 5;
    drawCell('Amount Chargeable (in words):', M + 3, y, { bold: true, size: 8.5 });
    drawCell('E. & O.E', M + W - 3, y, { italic: true, size: 7.5, align: 'right' });
    y += 5;
    drawCell(numberToWords(invoice.grandTotal), pageW/2, y, { bold: true, size: 8.5, align: 'center' });
    y += 4;
    hLine(y);

    // ═══════════════════════════════════════════════════
    // ROW 10: VAT ANALYSIS (Only if VAT enabled)
    // ═══════════════════════════════════════════════════
    if (invoice.vatEnabled) {
        y += 4;
        drawCell('VAT Analysis', pageW/2, y, { bold: true, size: 9, align: 'center' });
        y += 3;
        hLine(y);
        
        // VAT Analysis Table Columns (equal 4 columns)
        const vatColW = W / 4;
        const vatCol = {
            taxable:  { x: M,                  w: vatColW },
            rate:     { x: M + vatColW,        w: vatColW },
            vatAmt:   { x: M + 2*vatColW,      w: vatColW },
            totalTax: { x: M + 3*vatColW,      w: vatColW }
        };
        
        // Header
        const vatHeaderTop = y;
        doc.setFillColor(240, 240, 240);
        doc.rect(M, y, W, 7, 'F');
        drawCell('Taxable Value', vatCol.taxable.x + vatCol.taxable.w/2, y + 4.5, { bold: true, size: 8, align: 'center' });
        drawCell('VAT Rate', vatCol.rate.x + vatCol.rate.w/2, y + 4.5, { bold: true, size: 8, align: 'center' });
        drawCell('VAT Amount', vatCol.vatAmt.x + vatCol.vatAmt.w/2, y + 4.5, { bold: true, size: 8, align: 'center' });
        drawCell('Total Tax Amount', vatCol.totalTax.x + vatCol.totalTax.w/2, y + 4.5, { bold: true, size: 8, align: 'center' });
        y += 7;
        hLine(y);
        
        // Row
        y += 5;
        drawCell(formatNum(invoice.taxable), vatCol.taxable.x + vatCol.taxable.w/2, y, { size: 8.5, align: 'center' });
        drawCell(`${invoice.vatRate}%`, vatCol.rate.x + vatCol.rate.w/2, y, { size: 8.5, align: 'center' });
        drawCell(formatNum(invoice.vatAmount), vatCol.vatAmt.x + vatCol.vatAmt.w/2, y, { size: 8.5, align: 'center' });
        drawCell(formatNum(invoice.vatAmount), vatCol.totalTax.x + vatCol.totalTax.w/2, y, { size: 8.5, align: 'center' });
        y += 3;
        
        // Vertical lines
        vLine(vatCol.rate.x, vatHeaderTop, y);
        vLine(vatCol.vatAmt.x, vatHeaderTop, y);
        vLine(vatCol.totalTax.x, vatHeaderTop, y);
        
        hLine(y);
        
        // Tax Amount in words
        y += 5;
        drawCell('Tax Amount (in words):', M + 3, y, { bold: true, size: 8.5 });
        y += 4;
        drawCell(numberToWords(invoice.vatAmount), M + 3, y, { size: 8.5 });
        y += 4;
        hLine(y);
    }

    // ═══════════════════════════════════════════════════
    // ROW 11: BANK DETAILS (Right side only, left is empty)
    // ═══════════════════════════════════════════════════
    const bankBoxTop = y;
    y += 5;
    
    const bankSplitX = M + (W * 0.5);
    const bankLabelX = bankSplitX + 3;
    const bankValueX = bankSplitX + 28;
    
    drawCell("Company's Bank Details", bankLabelX, y, { bold: true, size: 9 });
    y += 5;
    
    drawCell('A/c Holder:', bankLabelX, y, { bold: true, size: 8 });
    drawCell(settings.companyName, bankValueX, y, { size: 8 });
    y += 4;
    
    drawCell('Bank Name:', bankLabelX, y, { bold: true, size: 8 });
    drawCell(settings.bankName || 'N/A', bankValueX, y, { size: 8 });
    y += 4;
    
    drawCell('A/c No.:', bankLabelX, y, { bold: true, size: 8 });
    drawCell(settings.bankAccount || 'N/A', bankValueX, y, { size: 8 });
    y += 4;
    
    drawCell('IBAN:', bankLabelX, y, { bold: true, size: 8 });
    drawCell(settings.bankIban || 'N/A', bankValueX, y, { size: 8 });
    y += 4;
    
    drawCell('Branch:', bankLabelX, y, { bold: true, size: 8 });
    drawCell(settings.bankBranch || 'N/A', bankValueX, y, { size: 8 });
    y += 5;
    
    // Vertical line separator
    vLine(bankSplitX, bankBoxTop, y);
    hLine(y);

    // ═══════════════════════════════════════════════════
    // ROW 12: DECLARATION + FOR COMPANY
    // ═══════════════════════════════════════════════════
    const declBoxTop = y;
    y += 4;
    
    // Left: Declaration
    drawCell('Declaration / Terms:', M + 3, y, { bold: true, size: 8.5 });
    let declY = y + 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const notes = invoice.notes || settings.invoiceNotes || '';
    const noteLines = doc.splitTextToSize(notes, bankSplitX - M - 6);
    noteLines.slice(0, 5).forEach(line => {
        doc.text(line, M + 3, declY);
        declY += 3.5;
    });
    
    // Right: For Company
    drawCell(`For ${settings.companyName}`, M + W - 3, y + 3, { bold: true, size: 9, align: 'right' });
    
    // Ensure enough space for signature
    y = Math.max(declY + 3, y + 22);
    
    drawCell('Authorised Signatory', M + W - 3, y, { bold: true, size: 8.5, align: 'right' });
    y += 4;
    
    // Vertical separator
    vLine(bankSplitX, declBoxTop, y);
    hLine(y);

    // ═══════════════════════════════════════════════════
    // ROW 13: CUSTOMER SEAL + AUTHORISED SIGNATORY
    // ═══════════════════════════════════════════════════
    y += 5;
    drawCell("Customer's Seal and Signature", M + 3, y, { bold: true, size: 8 });
    drawCell('Authorised Signatory', M + W - 3, y, { bold: true, size: 8, align: 'right' });
    y += 4;
    hLine(y);

    // ═══════════════════════════════════════════════════
    // ROW 14: FOOTER
    // ═══════════════════════════════════════════════════
    y += 4;
    drawCell('This is a Computer Generated Invoice', pageW/2, y, { italic: true, size: 7.5, align: 'center' });

    // ─── OUTPUT ───
    const filename = `Invoice_${(invoice.invoiceNumber || 'unknown').replace(/\//g,'-')}.pdf`;
    
    if (preview) {
        window.open(doc.output('bloburl'), '_blank');
    } else {
        doc.save(filename);
        showToast('PDF downloaded!', 'success');
    }
}
