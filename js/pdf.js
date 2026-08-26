// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Invoice PDF Generator (FINAL)
// Big Professional Stamp/Signature filling the box
// ═══════════════════════════════════════════════════════

function generateInvoicePDF(invoiceId, preview = false) {
    const invoice = DB.get(DB_KEYS.INVOICES).find(i => i.id === invoiceId);
    if (!invoice) return showToast('Invoice not found', 'error');
    const settings = DB.getSettings();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = 210;
    
    const M = 10;
    const W = pageW - 2 * M;
    let y = M;

    const col = {
        sl:     { x: M,          w: 12 },
        desc:   { x: M + 12,     w: 78 },
        qty:    { x: M + 90,     w: 18 },
        unit:   { x: M + 108,    w: 18 },
        rate:   { x: M + 126,    w: 26 },
        amount: { x: M + 152,    w: 38 }
    };
    const splitX = col.qty.x;

    const drawCell = (text, x, y, opts = {}) => {
        doc.setFont('helvetica', opts.bold ? 'bold' : (opts.italic ? 'italic' : 'normal'));
        doc.setFontSize(opts.size || 9.5);
        doc.setTextColor(...(opts.color || [0, 0, 0]));
        doc.text(String(text || ''), x, y, { align: opts.align || 'left' });
    };

    const LINE_W = 0.4;
    const hLine = (yPos) => { doc.setDrawColor(0); doc.setLineWidth(LINE_W); doc.line(M, yPos, M + W, yPos); };
    const vLine = (x, y1, y2) => { doc.setDrawColor(0); doc.setLineWidth(LINE_W); doc.line(x, y1, x, y2); };

    // ═══ TITLE ═══
    drawCell('TAX INVOICE', pageW / 2, y + 7, { bold: true, size: 14, align: 'center' });
    y += 10; hLine(y);

    // ═══ LOGO + COMPANY ═══
    y += 4;
    if (settings.logoUrl) {
        try { doc.addImage(settings.logoUrl, 'PNG', pageW / 2 - 17.5, y, 35, 25); } catch (e) {}
    }
    y += 28;

    drawCell(settings.companyName.toUpperCase(), pageW / 2, y, { bold: true, size: 16, align: 'center', color: [26, 58, 92] });
    y += 5.5;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    const addrLines = doc.splitTextToSize(settings.address, 130);
    addrLines.forEach(line => { doc.text(line, pageW / 2, y, { align: 'center' }); y += 4.5; });
    doc.text('United Arab Emirates', pageW / 2, y, { align: 'center' }); y += 5.5;

    drawCell(`TRN: ${settings.trn || 'Not Set'}`, pageW / 2, y, { bold: true, size: 10.5, align: 'center' });
    y += 5; hLine(y);

    // ═══ BUYER + INVOICE INFO ═══
    const buyerBoxTop = y;
    const buyerBoxH = 42;

    let leftY = y + 7;
    drawCell('Buyer (Bill to):', M + 3, leftY, { bold: true, size: 10.5 }); leftY += 6;
    drawCell(invoice.customerName || 'N/A', M + 3, leftY, { bold: true, size: 12.5 }); leftY += 6;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    const custAddrLines = doc.splitTextToSize(invoice.customerAddress || '', splitX - M - 6);
    custAddrLines.slice(0, 3).forEach(line => { doc.text(line, M + 3, leftY); leftY += 4.5; });
    if (invoice.customerPhone) { doc.text(`Phone: ${invoice.customerPhone}`, M + 3, leftY); leftY += 4.5; }
    if (invoice.customerTRN) { drawCell(`TRN: ${invoice.customerTRN}`, M + 3, leftY, { bold: true }); }

    let rightY = y + 7;
    const labelX = splitX + 4;
    const valueX = splitX + 32;

    drawCell('Invoice No.:', labelX, rightY, { bold: true });
    drawCell(invoice.invoiceNumber, valueX, rightY, { bold: true, color: [26, 58, 92] }); rightY += 6.5;
    drawCell('Dated:', labelX, rightY, { bold: true });
    drawCell(formatDate(invoice.date), valueX, rightY); rightY += 6.5;
    drawCell('Mode/Terms:', labelX, rightY, { bold: true });
    drawCell(invoice.paymentTerms || 'Cash', valueX, rightY, { bold: true }); rightY += 6.5;
    if (invoice.lpoNumber) {
        drawCell('LPO No.:', labelX, rightY, { bold: true });
        drawCell(invoice.lpoNumber, valueX, rightY);
    }

    vLine(splitX, buyerBoxTop, buyerBoxTop + buyerBoxH);
    y = buyerBoxTop + buyerBoxH; hLine(y);

    // ═══ PROJECT ═══
    if (invoice.projectName) {
        y += 5.5;
        drawCell('Project:', M + 3, y, { bold: true, size: 10 });
        drawCell(invoice.projectName, M + 22, y, { size: 10 });
        y += 4.5; hLine(y);
    }

    // ═══ ITEMS TABLE ═══
    const headerTop = y;
    doc.setFillColor(235, 235, 235); doc.rect(M, y, W, 8, 'F');

    drawCell('Sl No.', col.sl.x + col.sl.w / 2, y + 5.5, { bold: true, align: 'center' });
    drawCell('Particulars', col.desc.x + 4, y + 5.5, { bold: true });
    drawCell('Qty', col.qty.x + col.qty.w / 2, y + 5.5, { bold: true, align: 'center' });
    drawCell('Unit', col.unit.x + col.unit.w / 2, y + 5.5, { bold: true, align: 'center' });
    drawCell('Rate', col.rate.x + col.rate.w / 2, y + 5.5, { bold: true, align: 'center' });
    drawCell('Amount (AED)', col.amount.x + col.amount.w - 3, y + 5.5, { bold: true, align: 'right' });
    y += 8; hLine(y);

    vLine(col.desc.x, headerTop, y); vLine(col.qty.x, headerTop, y);
    vLine(col.unit.x, headerTop, y); vLine(col.rate.x, headerTop, y); vLine(col.amount.x, headerTop, y);

    let totalQtyCount = 0;
    const itemsStartY = y;

    invoice.items.forEach((item, idx) => {
        const descLines = doc.splitTextToSize(item.description || '-', col.desc.w - 4);
        const rowH = Math.max(8, descLines.length * 5 + 3);
        const rowTop = y;
        totalQtyCount += parseFloat(item.qty || 0);

        drawCell(String(idx + 1), col.sl.x + col.sl.w / 2, y + 5.5, { align: 'center' });
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9.5);
        doc.text(descLines[0] || '', col.desc.x + 2, y + 5.5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
        for (let i = 1; i < descLines.length; i++) {
            doc.text(descLines[i], col.desc.x + 2, y + 5.5 + (i * 4.5));
        }

        drawCell(formatNum(item.qty), col.qty.x + col.qty.w / 2, y + 5.5, { align: 'center' });
        drawCell(item.unit || 'Nos', col.unit.x + col.unit.w / 2, y + 5.5, { align: 'center' });
        drawCell(formatNum(item.rate), col.rate.x + col.rate.w - 3, y + 5.5, { align: 'right' });
        drawCell(formatNum(item.amount), col.amount.x + col.amount.w - 3, y + 5.5, { bold: true, align: 'right' });

        y += rowH;
        vLine(col.desc.x, rowTop, y); vLine(col.qty.x, rowTop, y);
        vLine(col.unit.x, rowTop, y); vLine(col.rate.x, rowTop, y); vLine(col.amount.x, rowTop, y);
    });

    const minTableHeight = 40;
    if ((y - itemsStartY) < minTableHeight) {
        const emptySpace = minTableHeight - (y - itemsStartY);
        vLine(col.desc.x, y, y + emptySpace); vLine(col.qty.x, y, y + emptySpace);
        vLine(col.unit.x, y, y + emptySpace); vLine(col.rate.x, y, y + emptySpace); vLine(col.amount.x, y, y + emptySpace);
        y += emptySpace;
    }
    hLine(y);

    // ═══ TOTALS ═══
    const totalsTop = y;
    y += 5.5;
    const labelAlign = col.amount.x - 3;
    const valueAlign = col.amount.x + col.amount.w - 3;

    drawCell('Total Qty:', col.desc.x + col.desc.w - 3, y, { bold: true, size: 9, align: 'right', color: [100, 100, 100] });
    drawCell(formatNum(totalQtyCount), col.qty.x + col.qty.w / 2, y, { bold: true, size: 10, align: 'center' });
    drawCell('Sub Total', labelAlign, y, { bold: true, size: 10.5, align: 'right' });
    drawCell(formatNum(invoice.subTotal), valueAlign, y, { bold: true, size: 10.5, align: 'right' });
    y += 5.5;

    if (invoice.discount > 0) {
        drawCell('Discount', labelAlign, y, { bold: true, size: 10.5, align: 'right' });
        drawCell('- ' + formatNum(invoice.discount), valueAlign, y, { bold: true, size: 10.5, align: 'right' }); y += 5.5;
    }
    if (invoice.vatEnabled) {
        drawCell(`OUTPUT VAT @ ${invoice.vatRate}%`, labelAlign, y, { bold: true, size: 10.5, align: 'right' });
        drawCell(formatNum(invoice.vatAmount), valueAlign, y, { bold: true, size: 10.5, align: 'right' }); y += 5.5;
    }
    if (invoice.roundOff > 0) {
        drawCell('Round Off', labelAlign, y, { size: 10.5, align: 'right' });
        const sign = invoice.roundOffType === 'add' ? '(+)' : '(-)';
        drawCell(`${sign} ${formatNum(invoice.roundOff)}`, valueAlign, y, { size: 10.5, align: 'right' }); y += 5.5;
    }

    y += 1;
    vLine(col.amount.x, totalsTop, y); hLine(y);

    // ═══ GRAND TOTAL ═══
    doc.setFillColor(242, 246, 249); doc.rect(M, y, W, 10, 'F');
    y += 6.5;
    drawCell('GRAND TOTAL', labelAlign, y, { bold: true, size: 12, align: 'right', color: [26, 58, 92] });
    drawCell(`AED ${formatNum(invoice.grandTotal)}`, valueAlign, y, { bold: true, size: 13, align: 'right', color: [26, 58, 92] });
    y += 3.5;
    vLine(col.amount.x, y - 10, y); hLine(y);

    // ═══ AMOUNT IN WORDS ═══
    y += 5.5;
    drawCell('Amount Chargeable (in words):', M + 3, y, { bold: true, size: 10 });
    drawCell('E. & O.E', M + W - 3, y, { italic: true, size: 8.5, align: 'right' });
    y += 6.5;
    drawCell(numberToWords(invoice.grandTotal), M + 3, y, { bold: true, size: 11, color: [26, 58, 92] });
    y += 4.5; hLine(y);

    // ═══ BANK (LEFT) + BIG STAMP (RIGHT) ═══
    const bottomBoxTop = y;

    y += 6.5;
    drawCell("Company's Bank Details", M + 3, y, { bold: true, size: 10.5 }); y += 6.5;

    const bx = M + 3;
    const by = M + 30;
    drawCell('A/c Holder:', bx, y, { bold: true, size: 9.5 });
    drawCell(settings.companyName, by, y, { bold: true, size: 9.5 }); y += 5;
    drawCell('Bank Name:', bx, y, { bold: true, size: 9.5 });
    drawCell(settings.bankName || '-', by, y, { size: 9.5 }); y += 5;
    drawCell('A/c No.:', bx, y, { bold: true, size: 9.5 });
    drawCell(settings.bankAccount || '-', by, y, { bold: true, size: 9.5 }); y += 5;
    drawCell('IBAN:', bx, y, { bold: true, size: 9.5 });
    drawCell(settings.bankIban || '-', by, y, { size: 9.5 }); y += 5;

    // Bigger box height so stamp fits professionally
    const boxBottomY = Math.max(y + 4, bottomBoxTop + 52);

    // Right side header
    drawCell(`For ${settings.companyName}`, M + W - 3, bottomBoxTop + 6, { bold: true, size: 10.5, align: 'right' });

    // ── BIG PROFESSIONAL STAMP ──
    if (settings.signatureUrl) {
        try {
            const rightBoxW = (M + W) - splitX; // ~100mm available width
            // BIG size to fill the stamp area properly
            const sigW = 55;  // width 55mm
            const sigH = 32;  // height 32mm
            const sigX = splitX + (rightBoxW - sigW) / 2; // center horizontally
            const sigY = bottomBoxTop + 10; // just below company name
            doc.addImage(settings.signatureUrl, 'PNG', sigX, sigY, sigW, sigH);
        } catch (e) {}
    }

    drawCell('Authorised Signatory', M + W - 3, boxBottomY - 4, { bold: true, size: 10, align: 'right' });

    vLine(splitX, bottomBoxTop, boxBottomY);
    hLine(boxBottomY);
    y = boxBottomY;

    // ═══ CONTACT FOOTER (INSIDE BOX) ═══
    y += 5.5;
    const cw = W / 3;
    drawCell('Contact:', M + 3, y, { bold: true, size: 9.5 });
    drawCell(settings.phone || '-', M + 20, y, { size: 9.5 });
    drawCell('Website:', M + cw + 3, y, { bold: true, size: 9.5 });
    drawCell(settings.website || '-', M + cw + 20, y, { size: 9.5 });
    drawCell('E-Mail:', M + 2 * cw + 3, y, { bold: true, size: 9.5 });
    drawCell(settings.email || '-', M + 2 * cw + 18, y, { size: 9.5 });
    y += 4; hLine(y);

    const finalY = y;

    // Outer border
    doc.setDrawColor(0);
    doc.setLineWidth(0.6);
    doc.rect(M, M, W, finalY - M, 'S');

    // Computer generated text OUTSIDE box
    drawCell('This is a Computer Generated Invoice', pageW / 2, finalY + 6, {
        italic: true, size: 8.5, align: 'center', color: [100, 100, 100]
    });

    // Output
    const filename = `Invoice_${(invoice.invoiceNumber || 'INV').replace(/\//g, '-')}.pdf`;
    if (preview) {
        window.open(doc.output('bloburl'), '_blank');
    } else {
        doc.save(filename);
        showToast('PDF downloaded!', 'success');
    }
}
