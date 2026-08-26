// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Invoice PDF Generator (FINAL)
// Perfect Box Alignment - No Overlaps - Bigger & Bolder Fonts
// ═══════════════════════════════════════════════════════

function generateInvoicePDF(invoiceId, preview = false) {
    const invoice = DB.get(DB_KEYS.INVOICES).find(i => i.id === invoiceId);
    if (!invoice) return showToast('Invoice not found', 'error');
    const settings = DB.getSettings();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    
    const M = 10; // Margin
    const W = pageW - 2*M; // Usable width = 190
    let y = M;

    // ─── HELPERS ───
    const drawCell = (text, x, y, opts = {}) => {
        doc.setFont('helvetica', opts.bold ? 'bold' : (opts.italic ? 'italic' : 'normal'));
        doc.setFontSize(opts.size || 9.5); // Default size increased to 9.5
        doc.setTextColor(...(opts.color || [0,0,0]));
        doc.text(String(text || ''), x, y, { align: opts.align || 'left' });
    };

    const hLine = (yPos) => {
        doc.setDrawColor(0);
        doc.setLineWidth(0.3);
        doc.line(M, yPos, M + W, yPos);
    };

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
    // ROW 1: TITLE
    // ═══════════════════════════════════════════════════
    drawCell('TAX INVOICE', pageW/2, y + 7, { bold: true, size: 14, align: 'center' });
    y += 10;
    hLine(y);

    // ═══════════════════════════════════════════════════
    // ROW 2: LOGO & COMPANY
    // ═══════════════════════════════════════════════════
    y += 3;
    if (settings.logoUrl) {
        try { doc.addImage(settings.logoUrl, 'PNG', pageW/2 - 20, y, 40, 25); } catch(e) {}
    }
    y += 28;

    drawCell(settings.companyName.toUpperCase(), pageW/2, y, { bold: true, size: 16, align: 'center', color: [26, 58, 92] });
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const addrLines = doc.splitTextToSize(settings.address, 130);
    addrLines.forEach(line => { doc.text(line, pageW/2, y, { align: 'center' }); y += 4; });
    doc.text('United Arab Emirates', pageW/2, y, { align: 'center' });
    y += 5;

    drawCell(`TRN: ${settings.trn || 'Not Set'}`, pageW/2, y, { bold: true, size: 10, align: 'center' });
    y += 5;
    hLine(y);

    // ═══════════════════════════════════════════════════
    // ROW 3: CONTACT ROW
    // ═══════════════════════════════════════════════════
    y += 5;
    const cw = W / 3;
    drawCell('Contact:', M + 3, y, { bold: true, size: 9 });
    drawCell(settings.phone || 'N/A', M + 20, y, { size: 9 });
    
    drawCell('Website:', M + cw + 3, y, { bold: true, size: 9 });
    drawCell(settings.website || 'N/A', M + cw + 22, y, { size: 9 });
    
    drawCell('E-Mail:', M + 2*cw + 3, y, { bold: true, size: 9 });
    drawCell(settings.email || 'N/A', M + 2*cw + 18, y, { size: 9 });
    
    y += 4;
    hLine(y);

    // ═══════════════════════════════════════════════════
    // ROW 4: BUYER & INVOICE DETAILS
    // ═══════════════════════════════════════════════════
    const buyerBoxTop = y;
    const buyerBoxH = 40;
    const splitX = M + (W * 0.55); // 55% space for buyer, 45% for invoice details
    
    // Left: Buyer
    let leftY = y + 6;
    drawCell('Buyer (Bill to):', M + 3, leftY, { bold: true, size: 10 });
    leftY += 6;
    drawCell(invoice.customerName || 'N/A', M + 3, leftY, { bold: true, size: 12 });
    leftY += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const custAddrLines = doc.splitTextToSize(invoice.customerAddress || '', splitX - M - 6);
    custAddrLines.slice(0, 3).forEach(line => { doc.text(line, M + 3, leftY); leftY += 4; });
    
    if (invoice.customerPhone) { doc.text(`Phone: ${invoice.customerPhone}`, M + 3, leftY); leftY += 4; }
    if (invoice.customerTRN) { drawCell(`TRN: ${invoice.customerTRN}`, M + 3, leftY, { bold: true, size: 9 }); }
    
    // Right: Invoice Info
    let rightY = y + 6;
    const labelX = splitX + 4;
    const valueX = splitX + 30;
    
    drawCell('Invoice No.:', labelX, rightY, { bold: true, size: 9.5 });
    drawCell(invoice.invoiceNumber || 'N/A', valueX, rightY, { bold: true, size: 9.5, color: [26, 58, 92] });
    rightY += 6;
    
    drawCell('Dated:', labelX, rightY, { bold: true, size: 9.5 });
    drawCell(formatDate(invoice.date), valueX, rightY, { size: 9.5 });
    rightY += 6;
    
    drawCell('Mode/Terms:', labelX, rightY, { bold: true, size: 9.5 });
    drawCell(invoice.paymentTerms || 'Cash', valueX, rightY, { bold: true, size: 9.5 });
    rightY += 6;
    
    if (invoice.lpoNumber) {
        drawCell('LPO No.:', labelX, rightY, { bold: true, size: 9.5 });
        drawCell(invoice.lpoNumber, valueX, rightY, { size: 9.5 });
    }
    
    vLine(splitX, buyerBoxTop, buyerBoxTop + buyerBoxH);
    y = buyerBoxTop + buyerBoxH;
    hLine(y);

    // ═══════════════════════════════════════════════════
    // ROW 5: PROJECT (Optional)
    // ═══════════════════════════════════════════════════
    if (invoice.projectName) {
        y += 5;
        drawCell('Project:', M + 3, y, { bold: true, size: 9.5 });
        drawCell(invoice.projectName, M + 22, y, { size: 9.5 });
        y += 4;
        hLine(y);
    }

    // ═══════════════════════════════════════════════════
    // ROW 6: ITEMS TABLE (RECALCULATED WIDTHS FOR NO OVERLAP)
    // ═══════════════════════════════════════════════════
    // Total W = 190. Splitting correctly:
    const col = {
        sl:     { x: M,          w: 12 },
        desc:   { x: M + 12,     w: 78 },
        qty:    { x: M + 90,     w: 15 },
        unit:   { x: M + 105,    w: 20 },
        rate:   { x: M + 125,    w: 25 },
        amount: { x: M + 150,    w: 40 } // Increased Amount width to 40mm!
    };
    
    const headerTop = y;
    doc.setFillColor(235, 235, 235);
    doc.rect(M, y, W, 9, 'F');
    
    // Headers
    drawCell('Sl No.', col.sl.x + col.sl.w/2, y + 6, { bold: true, size: 9, align: 'center' });
    drawCell('Particulars', col.desc.x + 5, y + 6, { bold: true, size: 9 });
    drawCell('Qty', col.qty.x + col.qty.w/2, y + 6, { bold: true, size: 9, align: 'center' });
    drawCell('Unit', col.unit.x + col.unit.w/2, y + 6, { bold: true, size: 9, align: 'center' });
    drawCell('Rate', col.rate.x + col.rate.w/2, y + 6, { bold: true, size: 9, align: 'center' });
    drawCell('Amount (AED)', col.amount.x + col.amount.w - 3, y + 6, { bold: true, size: 9, align: 'right' });
    
    y += 9;
    hLine(y);
    
    vLine(col.desc.x, headerTop, y);
    vLine(col.qty.x, headerTop, y);
    vLine(col.unit.x, headerTop, y);
    vLine(col.rate.x, headerTop, y);
    vLine(col.amount.x, headerTop, y);
    
    const itemsStartY = y;
    invoice.items.forEach((item, idx) => {
        const descLines = doc.splitTextToSize(item.description || '-', col.desc.w - 4);
        const rowH = Math.max(8, descLines.length * 5 + 3);
        const rowTop = y;
        
        drawCell(String(idx + 1), col.sl.x + col.sl.w/2, y + 5, { size: 9, align: 'center' });
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text(descLines[0] || '', col.desc.x + 2, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        for (let i = 1; i < descLines.length; i++) {
            doc.text(descLines[i], col.desc.x + 2, y + 5 + (i * 4.5));
        }
        
        drawCell(formatNum(item.qty), col.qty.x + col.qty.w/2, y + 5, { size: 9.5, align: 'center' });
        drawCell(item.unit || 'Nos', col.unit.x + col.unit.w/2, y + 5, { size: 9.5, align: 'center' });
        drawCell(formatNum(item.rate), col.rate.x + col.rate.w - 3, y + 5, { size: 9.5, align: 'right' });
        drawCell(formatNum(item.amount), col.amount.x + col.amount.w - 3, y + 5, { bold: true, size: 9.5, align: 'right' });
        
        y += rowH;
        vLine(col.desc.x, rowTop, y); vLine(col.qty.x, rowTop, y); vLine(col.unit.x, rowTop, y); vLine(col.rate.x, rowTop, y); vLine(col.amount.x, rowTop, y);
    });
    
    // Fill empty space if table is too short
    const minTableHeight = 45;
    if ((y - itemsStartY) < minTableHeight) {
        const emptySpace = minTableHeight - (y - itemsStartY);
        vLine(col.desc.x, y, y + emptySpace); vLine(col.qty.x, y, y + emptySpace); vLine(col.unit.x, y, y + emptySpace); vLine(col.rate.x, y, y + emptySpace); vLine(col.amount.x, y, y + emptySpace);
        y += emptySpace;
    }
    hLine(y);

    // ═══════════════════════════════════════════════════
    // ROW 7: TOTALS SECTION (NO OVERLAPS)
    // ═══════════════════════════════════════════════════
    const totalsTop = y;
    y += 5;
    
    const labelAlign = col.amount.x - 3; // Right-aligned inside Rate column
    const valueAlign = col.amount.x + col.amount.w - 3; // Right-aligned inside Amount column
    
    drawCell('Sub Total', labelAlign, y, { bold: true, size: 10, align: 'right' });
    drawCell(formatNum(invoice.subTotal), valueAlign, y, { bold: true, size: 10, align: 'right' });
    y += 5;
    
    if (invoice.discount > 0) {
        drawCell('Discount', labelAlign, y, { bold: true, size: 10, align: 'right' });
        drawCell('- ' + formatNum(invoice.discount), valueAlign, y, { bold: true, size: 10, align: 'right' });
        y += 5;
    }
    
    if (invoice.vatEnabled) {
        drawCell(`OUTPUT VAT @ ${invoice.vatRate}%`, labelAlign, y, { bold: true, size: 10, align: 'right' });
        drawCell(formatNum(invoice.vatAmount), valueAlign, y, { bold: true, size: 10, align: 'right' });
        y += 5;
    }
    
    if (invoice.roundOff > 0) {
        drawCell('Round Off', labelAlign, y, { size: 10, align: 'right' });
        const sign = invoice.roundOffType === 'add' ? '(+)' : '(-)';
        drawCell(`${sign} ${formatNum(invoice.roundOff)}`, valueAlign, y, { size: 10, align: 'right' });
        y += 5;
    }
    
    y += 1;
    vLine(col.amount.x, totalsTop, y); // Separator between Labels & Values
    hLine(y);

    // ═══════════════════════════════════════════════════
    // ROW 8: GRAND TOTAL
    // ═══════════════════════════════════════════════════
    doc.setFillColor(245, 248, 250); // Light blue background for Grand Total
    doc.rect(M, y, W, 10, 'F');
    
    y += 6.5;
    drawCell('GRAND TOTAL', labelAlign, y, { bold: true, size: 12, align: 'right', color: [26, 58, 92] });
    drawCell(`AED ${formatNum(invoice.grandTotal)}`, valueAlign, y, { bold: true, size: 13, align: 'right', color: [26, 58, 92] });
    
    y += 3.5;
    vLine(col.amount.x, y - 10, y); // Separator for grand total row
    hLine(y);

    // ═══════════════════════════════════════════════════
    // ROW 9: AMOUNT IN WORDS
    // ═══════════════════════════════════════════════════
    y += 5;
    drawCell('Amount Chargeable (in words):', M + 3, y, { bold: true, size: 10 });
    drawCell('E. & O.E', M + W - 3, y, { italic: true, size: 8, align: 'right' });
    y += 6;
    drawCell(numberToWords(invoice.grandTotal), M + 3, y, { bold: true, size: 10.5, color: [26, 58, 92] });
    y += 4;
    hLine(y);

    // ═══════════════════════════════════════════════════
    // ROW 10: VAT ANALYSIS
    // ═══════════════════════════════════════════════════
    if (invoice.vatEnabled) {
        y += 5;
        drawCell('VAT Analysis', pageW/2, y, { bold: true, size: 10, align: 'center' });
        y += 3;
        hLine(y);
        
        const vw = W / 4;
        const vx = [M, M+vw, M+2*vw, M+3*vw];
        
        doc.setFillColor(235, 235, 235);
        doc.rect(M, y, W, 7, 'F');
        
        drawCell('Taxable Value', vx[0]+vw/2, y + 5, { bold: true, size: 9, align: 'center' });
        drawCell('VAT Rate', vx[1]+vw/2, y + 5, { bold: true, size: 9, align: 'center' });
        drawCell('VAT Amount', vx[2]+vw/2, y + 5, { bold: true, size: 9, align: 'center' });
        drawCell('Total Tax Amount', vx[3]+vw/2, y + 5, { bold: true, size: 9, align: 'center' });
        
        y += 7;
        hLine(y);
        y += 5;
        
        drawCell(formatNum(invoice.taxable), vx[0]+vw/2, y, { size: 9.5, align: 'center' });
        drawCell(`${invoice.vatRate}%`, vx[1]+vw/2, y, { size: 9.5, align: 'center' });
        drawCell(formatNum(invoice.vatAmount), vx[2]+vw/2, y, { size: 9.5, align: 'center' });
        drawCell(formatNum(invoice.vatAmount), vx[3]+vw/2, y, { size: 9.5, align: 'center' });
        
        y += 3;
        vLine(vx[1], y-15, y); vLine(vx[2], y-15, y); vLine(vx[3], y-15, y);
        hLine(y);
        
        y += 6;
        drawCell('Tax Amount (in words):', M + 3, y, { bold: true, size: 9.5 });
        y += 5;
        drawCell(numberToWords(invoice.vatAmount), M + 3, y, { bold: true, size: 9.5 });
        y += 5;
        hLine(y);
    }

    // ═══════════════════════════════════════════════════
    // ROW 11: BANK DETAILS & TERMS
    // ═══════════════════════════════════════════════════
    const bankBoxTop = y;
    const splitBank = M + (W * 0.45); // Bank 45%, Terms 55%
    
    y += 6;
    drawCell("Company's Bank Details", splitBank + 3, y, { bold: true, size: 10 });
    y += 6;
    
    const bx = splitBank + 3;
    const by = splitBank + 28;
    
    drawCell('A/c Holder:', bx, y, { bold: true, size: 9 });
    drawCell(settings.companyName, by, y, { bold: true, size: 9 }); y += 5;
    
    drawCell('Bank Name:', bx, y, { bold: true, size: 9 });
    drawCell(settings.bankName || 'N/A', by, y, { size: 9 }); y += 5;
    
    drawCell('A/c No.:', bx, y, { bold: true, size: 9 });
    drawCell(settings.bankAccount || 'N/A', by, y, { bold: true, size: 9 }); y += 5;
    
    drawCell('IBAN:', bx, y, { bold: true, size: 9 });
    drawCell(settings.bankIban || 'N/A', by, y, { size: 9 }); y += 5;
    
    drawCell('Branch:', bx, y, { bold: true, size: 9 });
    drawCell(settings.bankBranch || 'N/A', by, y, { size: 9 }); y += 6;
    
    // Left side terms (goes simultaneously)
    let termY = bankBoxTop + 6;
    drawCell('Declaration / Terms:', M + 3, termY, { bold: true, size: 10 });
    termY += 6;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const notes = invoice.notes || settings.invoiceNotes || '';
    const noteLines = doc.splitTextToSize(notes, splitBank - M - 6);
    noteLines.slice(0, 6).forEach(line => { doc.text(line, M + 3, termY); termY += 4; });
    
    y = Math.max(y, termY);
    vLine(splitBank, bankBoxTop, y);
    hLine(y);

    // ═══════════════════════════════════════════════════
    // ROW 12: SIGNATURES
    // ═══════════════════════════════════════════════════
    y += 6;
    drawCell(`For ${settings.companyName}`, M + W - 3, y, { bold: true, size: 10, align: 'right' });
    y += 20;
    
    drawCell("Customer's Seal and Signature", M + 3, y, { bold: true, size: 9 });
    drawCell('Authorised Signatory', M + W - 3, y, { bold: true, size: 9, align: 'right' });
    y += 4;
    hLine(y);

    // ═══════════════════════════════════════════════════
    // ROW 13: FOOTER
    // ═══════════════════════════════════════════════════
    y += 5;
    drawCell('This is a Computer Generated Invoice', pageW/2, y, { italic: true, size: 8, align: 'center', color: [100,100,100] });

    // ─── OUTPUT ───
    const filename = `Invoice_${(invoice.invoiceNumber || 'INV').replace(/\//g,'-')}.pdf`;
    
    if (preview) {
        window.open(doc.output('bloburl'), '_blank');
    } else {
        doc.save(filename);
        showToast('PDF downloaded!', 'success');
    }
}
