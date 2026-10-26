// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Advanced PDF Engine
// Auto-Pagination, Dynamic Borders, Premium Layout
// ═══════════════════════════════════════════════════════

function generateInvoicePDF(invoiceId, preview = false) {
    const invoice = DB.get(DB_KEYS.INVOICES).find(i => i.id === invoiceId);
    if (!invoice) return showToast('Invoice not found', 'error');
    const settings = DB.getSettings();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = 210, pageH = 297, M = 10, W = pageW - 2 * M;
    let y = M;

    const col = {
        sl: { x: M, w: 12 }, desc: { x: M + 12, w: 78 }, qty: { x: M + 90, w: 18 },
        unit: { x: M + 108, w: 18 }, rate: { x: M + 126, w: 26 }, amount: { x: M + 152, w: 38 }
    };
    const splitX = col.qty.x;
    const SIG_W = 58, SIG_H = 34;

    const drawCell = (text, x, yPos, opts = {}) => {
        doc.setFont('helvetica', opts.bold ? 'bold' : (opts.italic ? 'italic' : 'normal'));
        doc.setFontSize(opts.size || 9);
        doc.setTextColor(...(opts.color || [0, 0, 0]));
        doc.text(String(text || ''), x, yPos, { align: opts.align || 'left' });
    };

    const LINE_W = 0.4;
    const hLine = (yPos) => { doc.setDrawColor(0); doc.setLineWidth(LINE_W); doc.line(M, yPos, M + W, yPos); };
    const vLine = (x, y1, y2) => { doc.setDrawColor(0); doc.setLineWidth(LINE_W); doc.line(x, y1, x, y2); };

    // PAGE BREAK LOGIC
    let currentPage = 1;
    const checkPageBreak = (neededH) => {
        if (y + neededH > pageH - M - 10) {
            doc.setDrawColor(0); doc.setLineWidth(0.6); doc.rect(M, M, W, y - M, 'S'); // Close outer box
            doc.addPage();
            currentPage++;
            y = M;
            
            // Re-draw table header
            doc.setFillColor(235, 235, 235); doc.rect(M, y, W, 7, 'F');
            drawCell('Sl No.', col.sl.x + col.sl.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
            drawCell('Particulars', col.desc.x + 3, y + 4.8, { bold: true, size: 8.5 });
            drawCell('Qty', col.qty.x + col.qty.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
            drawCell('Unit', col.unit.x + col.unit.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
            drawCell('Rate', col.rate.x + col.rate.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
            drawCell('Amount (AED)', col.amount.x + col.amount.w - 2, y + 4.8, { bold: true, size: 8.5, align: 'right' });
            y += 7; hLine(y);
        }
    };

    // ═══ TITLE ═══
    drawCell('TAX INVOICE', pageW / 2, y + 6, { bold: true, size: 13, align: 'center' });
    y += 9; hLine(y);

    // ═══ LOGO + COMPANY ═══
    y += 3;
    if (settings.logoUrl) { try { doc.addImage(settings.logoUrl, 'PNG', pageW / 2 - 16, y, 32, 22); } catch (e) {} }
    y += 24;
    drawCell(settings.companyName.toUpperCase(), pageW / 2, y, { bold: true, size: 15, align: 'center', color: [26, 58, 92] }); y += 4.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    const addrLines = doc.splitTextToSize(settings.address || '', 130);
    addrLines.forEach(line => { doc.text(line, pageW / 2, y, { align: 'center' }); y += 3.8; });
    doc.text('United Arab Emirates', pageW / 2, y, { align: 'center' }); y += 4.5;
    drawCell(`TRN: ${settings.trn || 'Not Set'}`, pageW / 2, y, { bold: true, size: 9.5, align: 'center' }); y += 4; hLine(y);

    // ═══ BUYER + INVOICE INFO ═══
    const buyerBoxTop = y;
    let leftY = y + 5;
    drawCell('Buyer (Bill to):', M + 3, leftY, { bold: true, size: 9.5 }); leftY += 5;
    drawCell(invoice.customerName || 'N/A', M + 3, leftY, { bold: true, size: 11.5 }); leftY += 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    const custAddrLines = doc.splitTextToSize(invoice.customerAddress || '', splitX - M - 6);
    custAddrLines.slice(0, 3).forEach(line => { doc.text(line, M + 3, leftY); leftY += 3.8; });
    if (invoice.customerPhone) { doc.text(`Phone: ${invoice.customerPhone}`, M + 3, leftY); leftY += 3.8; }
    if (invoice.customerTRN) { drawCell(`TRN: ${invoice.customerTRN}`, M + 3, leftY, { bold: true, size: 8.5 }); leftY += 4; }

    let rightY = y + 5; const labelX = splitX + 4, valueX = splitX + 30;
    drawCell('Invoice No.:', labelX, rightY, { bold: true, size: 9 }); drawCell(invoice.invoiceNumber, valueX, rightY, { bold: true, size: 9, color: [26, 58, 92] }); rightY += 5.5;
    drawCell('Dated:', labelX, rightY, { bold: true, size: 9 }); drawCell(formatDate(invoice.date), valueX, rightY, { size: 9 }); rightY += 5.5;
    drawCell('Mode/Terms:', labelX, rightY, { bold: true, size: 9 }); drawCell(invoice.paymentTerms || 'Cash', valueX, rightY, { bold: true, size: 9 }); rightY += 5.5;
    if (invoice.lpoNumber) { drawCell('LPO No.:', labelX, rightY, { bold: true, size: 9 }); drawCell(invoice.lpoNumber, valueX, rightY, { size: 9 }); rightY += 5.5; }

    const buyerBoxH = Math.max(leftY, rightY) - buyerBoxTop + 2;
    vLine(splitX, buyerBoxTop, buyerBoxTop + buyerBoxH); y = buyerBoxTop + buyerBoxH; hLine(y);

    if (invoice.projectName) {
        y += 4; drawCell('Project:', M + 3, y, { bold: true, size: 9 }); drawCell(invoice.projectName, M + 20, y, { size: 9 }); y += 3.5; hLine(y);
    }

    // ═══ ITEMS TABLE ═══
    checkPageBreak(25);
    doc.setFillColor(235, 235, 235); doc.rect(M, y, W, 7, 'F');
    drawCell('Sl No.', col.sl.x + col.sl.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
    drawCell('Particulars', col.desc.x + 3, y + 4.8, { bold: true, size: 8.5 });
    drawCell('Qty', col.qty.x + col.qty.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
    drawCell('Unit', col.unit.x + col.unit.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
    drawCell('Rate', col.rate.x + col.rate.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
    drawCell('Amount (AED)', col.amount.x + col.amount.w - 2, y + 4.8, { bold: true, size: 8.5, align: 'right' });
    y += 7; hLine(y);

    let totalQtyCount = 0; const itemsStartY = y;
    (invoice.items || []).forEach((item, idx) => {
        const descLines = doc.splitTextToSize(item.description || '-', col.desc.w - 4);
        const rowH = Math.max(6.5, descLines.length * 4 + 2.5);
        checkPageBreak(rowH + 2);
        
        const rowTop = y; totalQtyCount += parseFloat(item.qty || 0);
        drawCell(String(idx + 1), col.sl.x + col.sl.w / 2, y + 4.5, { size: 8.5, align: 'center' });
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.text(descLines[0] || '', col.desc.x + 2, y + 4.5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
        for (let i = 1; i < descLines.length; i++) { doc.text(descLines[i], col.desc.x + 2, y + 4.5 + (i * 3.5)); }

        drawCell(formatNum(item.qty), col.qty.x + col.qty.w / 2, y + 4.5, { size: 8.5, align: 'center' });
        drawCell(item.unit || 'Nos', col.unit.x + col.unit.w / 2, y + 4.5, { size: 8.5, align: 'center' });
        drawCell(formatNum(item.rate), col.rate.x + col.rate.w - 2, y + 4.5, { size: 8.5, align: 'right' });
        drawCell(formatNum(item.amount), col.amount.x + col.amount.w - 2, y + 4.5, { bold: true, size: 8.5, align: 'right' });

        y += rowH;
        vLine(col.desc.x, rowTop, y); vLine(col.qty.x, rowTop, y); vLine(col.unit.x, rowTop, y); vLine(col.rate.x, rowTop, y); vLine(col.amount.x, rowTop, y);
    });

    const minTableHeight = 28;
    if ((y - itemsStartY) < minTableHeight && currentPage === 1) {
        const emptySpace = minTableHeight - (y - itemsStartY);
        vLine(col.desc.x, y, y + emptySpace); vLine(col.qty.x, y, y + emptySpace); vLine(col.unit.x, y, y + emptySpace); vLine(col.rate.x, y, y + emptySpace); vLine(col.amount.x, y, y + emptySpace);
        y += emptySpace;
    }
    hLine(y);

    // ═══ TOTALS ═══
    checkPageBreak(50);
    const totalsTop = y; y += 4.5;
    const labelAlign = col.amount.x - 2, valueAlign = col.amount.x + col.amount.w - 2;

    drawCell('Total Qty:', col.desc.x + col.desc.w - 2, y, { bold: true, size: 8, align: 'right', color: [100, 100, 100] });
    drawCell(formatNum(totalQtyCount), col.qty.x + col.qty.w / 2, y, { bold: true, size: 9, align: 'center' });
    drawCell('Sub Total', labelAlign, y, { bold: true, size: 9.5, align: 'right' }); drawCell(formatNum(invoice.subTotal), valueAlign, y, { bold: true, size: 9.5, align: 'right' }); y += 4.5;

    if (invoice.discount > 0) { drawCell('Discount', labelAlign, y, { bold: true, size: 9.5, align: 'right' }); drawCell('- ' + formatNum(invoice.discount), valueAlign, y, { bold: true, size: 9.5, align: 'right' }); y += 4.5; }
    if (invoice.vatEnabled) { drawCell(`OUTPUT VAT @ ${invoice.vatRate || 5}%`, labelAlign, y, { bold: true, size: 9.5, align: 'right' }); drawCell(formatNum(invoice.vatAmount), valueAlign, y, { bold: true, size: 9.5, align: 'right' }); y += 4.5; }
    if (invoice.roundOff > 0) {
        drawCell('Round Off', labelAlign, y, { size: 9.5, align: 'right' });
        drawCell(`${invoice.roundOffType === 'add' ? '(+)' : '(-)'} ${formatNum(invoice.roundOff)}`, valueAlign, y, { size: 9.5, align: 'right' }); y += 4.5;
    }
    y += 0.5; vLine(col.amount.x, totalsTop, y); hLine(y);

    // ═══ GRAND TOTAL ═══
    doc.setFillColor(242, 246, 249); doc.rect(M, y, W, 8.5, 'F'); y += 5.8;
    drawCell('GRAND TOTAL', labelAlign, y, { bold: true, size: 11, align: 'right', color: [26, 58, 92] });
    drawCell(`AED ${formatNum(invoice.grandTotal)}`, valueAlign, y, { bold: true, size: 12, align: 'right', color: [26, 58, 92] });
    y += 2.7; vLine(col.amount.x, y - 8.5, y); hLine(y);

    // ═══ AMOUNT IN WORDS ═══
    y += 4; drawCell('Amount Chargeable (in words):', M + 3, y, { bold: true, size: 9 });
    drawCell('E. & O.E', M + W - 3, y, { italic: true, size: 8, align: 'right' }); y += 5;
    drawCell(numberToWords(invoice.grandTotal), M + 3, y, { bold: true, size: 10, color: [26, 58, 92] }); y += 3.5; hLine(y);

    // ═══ BANK + STAMP ═══
    checkPageBreak(45);
    const bottomBoxTop = y; let bankY = y + 4;
    drawCell("Company's Bank Details", M + 3, bankY, { bold: true, size: 9.5 }); bankY += 4.5;
    const bx = M + 3, by = M + 28;
    drawCell('A/c Holder:', bx, bankY, { bold: true, size: 8.5 }); drawCell(settings.companyName, by, bankY, { bold: true, size: 8.5 }); bankY += 3.8;
    drawCell('Bank Name:', bx, bankY, { bold: true, size: 8.5 }); drawCell(settings.bankName || '-', by, bankY, { size: 8.5 }); bankY += 3.8;
    drawCell('A/c No.:', bx, bankY, { bold: true, size: 8.5 }); drawCell(settings.bankAccount || '-', by, bankY, { bold: true, size: 8.5 }); bankY += 3.8;
    drawCell('IBAN:', bx, bankY, { bold: true, size: 8.5 }); drawCell(settings.bankIban || '-', by, bankY, { size: 8.5 }); bankY += 2;

    const stampNeededH = 4 + SIG_H + 5; const boxBottomY = Math.max(bankY + 1, bottomBoxTop + stampNeededH);
    drawCell(`For ${settings.companyName}`, M + W - 3, bottomBoxTop + 4, { bold: true, size: 9.5, align: 'right' });
    if (settings.signatureUrl) {
        try { const rW = (M + W) - splitX; const sigX = splitX + (rW - SIG_W) / 2; doc.addImage(settings.signatureUrl, 'PNG', sigX, bottomBoxTop + 5.5, SIG_W, SIG_H); } catch (e) {}
    }
    drawCell('Authorised Signatory', M + W - 3, boxBottomY - 3, { bold: true, size: 9, align: 'right' });
    vLine(splitX, bottomBoxTop, boxBottomY); hLine(boxBottomY); y = boxBottomY;

    // ═══ CONTACT FOOTER ═══
    y += 4; const cw = W / 3;
    drawCell('Contact:', M + 3, y, { bold: true, size: 8.5 }); drawCell(settings.phone || '-', M + 18, y, { size: 8.5 });
    drawCell('Website:', M + cw + 3, y, { bold: true, size: 8.5 }); drawCell(settings.website || '-', M + cw + 18, y, { size: 8.5 });
    drawCell('E-Mail:', M + 2 * cw + 3, y, { bold: true, size: 8.5 }); drawCell(settings.email || '-', M + 2 * cw + 16, y, { size: 8.5 });
    y += 3.5; hLine(y);

    // CLOSE FINAL PAGE BORDER
    doc.setDrawColor(0); doc.setLineWidth(0.6); doc.rect(M, M, W, y - M, 'S');
    drawCell('This is a Computer Generated Invoice', pageW / 2, y + 5, { italic: true, size: 8, align: 'center', color: [100, 100, 100] });

    if (preview) { window.open(doc.output('bloburl'), '_blank'); } 
    else { doc.save(`Invoice_${(invoice.invoiceNumber || 'INV').replace(/\//g, '-')}.pdf`); showToast('PDF downloaded!', 'success'); }
}


// ═══════════════════════════════════════════════════════
// NEW: ADVANCED MANUAL INVOICE GENERATOR (100% Custom Layout)
// Features: Auto-Page Break, Dynamic Wraps, Navy Blue Theme
// ═══════════════════════════════════════════════════════
function generateManualInvoicePDF(data, preview = false) {
    const settings = DB.getSettings();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = 210, pageH = 297, M = 10, W = pageW - 2 * M;
    let y = M;

    const col = {
        sl: { x: M, w: 12 }, desc: { x: M + 12, w: 78 }, qty: { x: M + 90, w: 18 },
        unit: { x: M + 108, w: 18 }, rate: { x: M + 126, w: 26 }, amount: { x: M + 152, w: 38 }
    };
    const splitX = col.qty.x;
    const SIG_W = 58, SIG_H = 34;

    const drawCell = (text, x, yPos, opts = {}) => {
        doc.setFont('helvetica', opts.bold ? 'bold' : (opts.italic ? 'italic' : 'normal'));
        doc.setFontSize(opts.size || 9); doc.setTextColor(...(opts.color || [0, 0, 0]));
        doc.text(String(text || ''), x, yPos, { align: opts.align || 'left' });
    };

    const LINE_W = 0.4;
    const hLine = (yPos) => { doc.setDrawColor(0); doc.setLineWidth(LINE_W); doc.line(M, yPos, M + W, yPos); };
    const vLine = (x, y1, y2) => { doc.setDrawColor(0); doc.setLineWidth(LINE_W); doc.line(x, y1, x, y2); };

    // PAGE BREAK LOGIC FOR MANUAL PDF
    let currentPage = 1;
    const checkPageBreak = (neededH) => {
        if (y + neededH > pageH - M - 10) {
            doc.setDrawColor(0); doc.setLineWidth(0.6); doc.rect(M, M, W, y - M, 'S'); // Close outer border perfectly
            doc.addPage();
            currentPage++;
            y = M;
            
            // Re-draw manual table headers perfectly
            doc.setFillColor(235, 235, 235); doc.rect(M, y, W, 7, 'F');
            drawCell(data.h1 || 'Sl No.', col.sl.x + col.sl.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
            drawCell(data.h2 || 'Particulars', col.desc.x + 3, y + 4.8, { bold: true, size: 8.5 });
            drawCell(data.h3 || 'Qty', col.qty.x + col.qty.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
            drawCell(data.h4 || 'Unit', col.unit.x + col.unit.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
            drawCell(data.h5 || 'Rate', col.rate.x + col.rate.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
            drawCell(data.h6 || 'Amount', col.amount.x + col.amount.w - 2, y + 4.8, { bold: true, size: 8.5, align: 'right' });
            y += 7; hLine(y);
        }
    };

    // TITLE
    drawCell(data.docTitle || 'TAX INVOICE', pageW / 2, y + 6, { bold: true, size: 13, align: 'center' });
    y += 9; hLine(y);

    // COMPANY INFO
    y += 3;
    if (settings.logoUrl) { try { doc.addImage(settings.logoUrl, 'PNG', pageW / 2 - 16, y, 32, 22); } catch (e) {} }
    y += 24;
    drawCell(settings.companyName.toUpperCase(), pageW / 2, y, { bold: true, size: 15, align: 'center', color: [26, 58, 92] }); y += 4.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    const addrLines = doc.splitTextToSize(settings.address || '', 130);
    addrLines.forEach(line => { doc.text(line, pageW / 2, y, { align: 'center' }); y += 3.8; });
    doc.text('United Arab Emirates', pageW / 2, y, { align: 'center' }); y += 4.5;
    drawCell(`TRN: ${settings.trn || 'Not Set'}`, pageW / 2, y, { bold: true, size: 9.5, align: 'center' }); y += 4; hLine(y);

    // CUSTOM TEXT BLOCKS (Buyer & Meta)
    const buyerBoxTop = y;
    let leftY = y + 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    const leftTextLines = doc.splitTextToSize(data.buyerText || '', splitX - M - 6);
    leftTextLines.forEach(line => { doc.text(line, M + 3, leftY); leftY += 4.5; });

    let rightY = y + 5;
    const rightTextLines = doc.splitTextToSize(data.metaText || '', (M + W) - splitX - 6);
    rightTextLines.forEach(line => { doc.text(line, splitX + 4, rightY); rightY += 4.5; });

    // 🔥 Exact Height calculation to prevent breaking
    const buyerBoxH = Math.max(leftY, rightY) - buyerBoxTop + 2;
    vLine(splitX, buyerBoxTop, buyerBoxTop + buyerBoxH);
    y = buyerBoxTop + buyerBoxH; hLine(y);

    // PROJECT TEXT
    if (data.projectText) {
        y += 4.5; doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        doc.text(data.projectText, M + 3, y); y += 3.5; hLine(y);
    }

    // TABLE HEADERS
    checkPageBreak(25);
    const headerTop = y;
    doc.setFillColor(235, 235, 235); doc.rect(M, y, W, 7, 'F');
    drawCell(data.h1 || 'Sl No.', col.sl.x + col.sl.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
    drawCell(data.h2 || 'Particulars', col.desc.x + 3, y + 4.8, { bold: true, size: 8.5 });
    drawCell(data.h3 || 'Qty', col.qty.x + col.qty.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
    drawCell(data.h4 || 'Unit', col.unit.x + col.unit.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
    drawCell(data.h5 || 'Rate', col.rate.x + col.rate.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
    drawCell(data.h6 || 'Amount', col.amount.x + col.amount.w - 2, y + 4.8, { bold: true, size: 8.5, align: 'right' });
    y += 7; hLine(y);

    const itemsStartY = y;
    (data.items || []).forEach((item) => {
        const descLines = doc.splitTextToSize(item.c2 || '', col.desc.w - 4);
        const rowH = Math.max(6.5, descLines.length * 4 + 2.5);
        
        // 🔥 This checks if this row will break the page. If yes, makes new page!
        checkPageBreak(rowH + 2); 
        
        const rowTop = y;
        drawCell(item.c1 || '', col.sl.x + col.sl.w / 2, y + 4.5, { size: 8.5, align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
        descLines.forEach((line, i) => doc.text(line, col.desc.x + 2, y + 4.5 + (i * 4)));
        drawCell(item.c3 || '', col.qty.x + col.qty.w / 2, y + 4.5, { size: 8.5, align: 'center' });
        drawCell(item.c4 || '', col.unit.x + col.unit.w / 2, y + 4.5, { size: 8.5, align: 'center' });
        drawCell(item.c5 || '', col.rate.x + col.rate.w - 2, y + 4.5, { size: 8.5, align: 'right' });
        drawCell(item.c6 || '', col.amount.x + col.amount.w - 2, y + 4.5, { bold: true, size: 8.5, align: 'right' });

        y += rowH;
        vLine(col.desc.x, rowTop, y); vLine(col.qty.x, rowTop, y); vLine(col.unit.x, rowTop, y); vLine(col.rate.x, rowTop, y); vLine(col.amount.x, rowTop, y);
    });

    const minH = 28;
    if ((y - itemsStartY) < minH && currentPage === 1) {
        let eH = minH - (y - itemsStartY);
        vLine(col.desc.x, y, y + eH); vLine(col.qty.x, y, y + eH); vLine(col.unit.x, y, y + eH); vLine(col.rate.x, y, y + eH); vLine(col.amount.x, y, y + eH);
        y += eH;
    }
    hLine(y);

    // MANUAL TOTALS BOX
    const tLines = doc.splitTextToSize(data.totalsText || '', W - 4);
    const totalsBlockH = tLines.length * 4.5 + 15;
    checkPageBreak(totalsBlockH); // Ensures totals don't get cut

    const totalsTop = y; y += 4.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    tLines.forEach(line => { doc.text(line, M + W - 2, y, { align: 'right' }); y += 4.5; });
    vLine(col.amount.x, totalsTop, y); hLine(y);

    // MANUAL GRAND TOTAL
    doc.setFillColor(242, 246, 249); doc.rect(M, y, W, 8.5, 'F'); y += 5.8;
    drawCell(data.grandTotalLabel || 'GRAND TOTAL', col.amount.x - 2, y, { bold: true, size: 11, align: 'right', color: [26, 58, 92] });
    drawCell(data.grandTotalValue || '', M + W - 2, y, { bold: true, size: 12, align: 'right', color: [26, 58, 92] });
    y += 2.7; vLine(col.amount.x, y - 8.5, y); hLine(y);

    // AMOUNT IN WORDS
    checkPageBreak(45);
    y += 4; drawCell('Amount Chargeable (in words):', M + 3, y, { bold: true, size: 9 });
    drawCell('E. & O.E', M + W - 3, y, { italic: true, size: 8, align: 'right' }); y += 5;
    drawCell(data.amountInWords || '', M + 3, y, { bold: true, size: 10, color: [26, 58, 92] }); y += 3.5; hLine(y);

    // BANK + STAMP
    const bottomBoxTop = y; let bankY = y + 4;
    drawCell("Company's Bank Details", M + 3, bankY, { bold: true, size: 9.5 }); bankY += 4.5;
    const bx = M + 3, by = M + 28;
    drawCell('A/c Holder:', bx, bankY, { bold: true, size: 8.5 }); drawCell(settings.companyName, by, bankY, { bold: true, size: 8.5 }); bankY += 3.8;
    drawCell('Bank Name:', bx, bankY, { bold: true, size: 8.5 }); drawCell(settings.bankName || '-', by, bankY, { size: 8.5 }); bankY += 3.8;
    drawCell('A/c No.:', bx, bankY, { bold: true, size: 8.5 }); drawCell(settings.bankAccount || '-', by, bankY, { bold: true, size: 8.5 }); bankY += 3.8;
    drawCell('IBAN:', bx, bankY, { bold: true, size: 8.5 }); drawCell(settings.bankIban || '-', by, bankY, { size: 8.5 }); bankY += 2;

    const stampNeededH = 4 + 34 + 5; const boxBottomY = Math.max(bankY + 1, bottomBoxTop + stampNeededH);
    drawCell(`For ${settings.companyName}`, M + W - 3, bottomBoxTop + 4, { bold: true, size: 9.5, align: 'right' });
    if (settings.signatureUrl) {
        try { const rW = (M + W) - splitX; const sigX = splitX + (rW - 58) / 2; doc.addImage(settings.signatureUrl, 'PNG', sigX, bottomBoxTop + 5.5, 58, 34); } catch (e) {}
    }
    drawCell('Authorised Signatory', M + W - 3, boxBottomY - 3, { bold: true, size: 9, align: 'right' });
    vLine(splitX, bottomBoxTop, boxBottomY); hLine(boxBottomY); y = boxBottomY;

    // FOOTER
    y += 4; const cw = W / 3;
    drawCell('Contact:', M + 3, y, { bold: true, size: 8.5 }); drawCell(settings.phone || '-', M + 18, y, { size: 8.5 });
    drawCell('Website:', M + cw + 3, y, { bold: true, size: 8.5 }); drawCell(settings.website || '-', M + cw + 18, y, { size: 8.5 });
    drawCell('E-Mail:', M + 2 * cw + 3, y, { bold: true, size: 8.5 }); drawCell(settings.email || '-', M + 2 * cw + 16, y, { size: 8.5 });
    y += 3.5; hLine(y);

    // 🔥 FINAL OUTER BORDER - Perfectly enclosed
    doc.setDrawColor(0); doc.setLineWidth(0.6); doc.rect(M, M, W, y - M, 'S');
    drawCell('This is a Computer Generated Document', pageW / 2, y + 5, { italic: true, size: 8, align: 'center', color: [100, 100, 100] });

    if (preview) { window.open(doc.output('bloburl'), '_blank'); } 
    else { doc.save(`Manual_${data.docTitle || 'Doc'}.pdf`); showToast('PDF downloaded!', 'success'); }
}
