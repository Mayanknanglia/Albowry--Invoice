// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Invoice PDF (COMPACT LIFT)
// Tighter spacing so full bottom border shows on page
// ═══════════════════════════════════════════════════════

function generateInvoicePDF(invoiceId, preview = false) {
    const invoice = DB.get(DB_KEYS.INVOICES).find(i => i.id === invoiceId);
    if (!invoice) return showToast('Invoice not found', 'error');
    const settings = DB.getSettings();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;

    const M = 10;
    const W = pageW - 2 * M;
    let y = M;

    const col = {
        sl:     { x: M,       w: 12 },
        desc:   { x: M + 12,  w: 78 },
        qty:    { x: M + 90,  w: 18 },
        unit:   { x: M + 108, w: 18 },
        rate:   { x: M + 126, w: 26 },
        amount: { x: M + 152, w: 38 }
    };
    const splitX = col.qty.x;

    // Stamp size
    const SIG_W = 58;
    const SIG_H = 34;

    const drawCell = (text, x, y, opts = {}) => {
        doc.setFont('helvetica', opts.bold ? 'bold' : (opts.italic ? 'italic' : 'normal'));
        doc.setFontSize(opts.size || 9);
        doc.setTextColor(...(opts.color || [0, 0, 0]));
        doc.text(String(text || ''), x, y, { align: opts.align || 'left' });
    };

    const LINE_W = 0.4;
    const hLine = (yPos) => {
        doc.setDrawColor(0);
        doc.setLineWidth(LINE_W);
        doc.line(M, yPos, M + W, yPos);
    };
    const vLine = (x, y1, y2) => {
        doc.setDrawColor(0);
        doc.setLineWidth(LINE_W);
        doc.line(x, y1, x, y2);
    };

    // ═══ TITLE ═══
    drawCell('TAX INVOICE', pageW / 2, y + 6, { bold: true, size: 13, align: 'center' });
    y += 9;
    hLine(y);

    // ═══ LOGO + COMPANY (tighter) ═══
    y += 3;
    if (settings.logoUrl) {
        try {
            doc.addImage(settings.logoUrl, 'PNG', pageW / 2 - 16, y, 32, 22);
        } catch (e) {}
    }
    y += 24;

    drawCell(settings.companyName.toUpperCase(), pageW / 2, y, {
        bold: true, size: 15, align: 'center', color: [26, 58, 92]
    });
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const addrLines = doc.splitTextToSize(settings.address || '', 130);
    addrLines.forEach(line => {
        doc.text(line, pageW / 2, y, { align: 'center' });
        y += 3.8;
    });
    doc.text('United Arab Emirates', pageW / 2, y, { align: 'center' });
    y += 4.5;

    drawCell(`TRN: ${settings.trn || 'Not Set'}`, pageW / 2, y, {
        bold: true, size: 9.5, align: 'center'
    });
    y += 4;
    hLine(y);

    // ═══ BUYER + INVOICE INFO ═══
    const buyerBoxTop = y;
    const buyerBoxH = 36;

    let leftY = y + 5;
    drawCell('Buyer (Bill to):', M + 3, leftY, { bold: true, size: 9.5 });
    leftY += 5;
    drawCell(invoice.customerName || 'N/A', M + 3, leftY, { bold: true, size: 11.5 });
    leftY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const custAddrLines = doc.splitTextToSize(invoice.customerAddress || '', splitX - M - 6);
    custAddrLines.slice(0, 3).forEach(line => {
        doc.text(line, M + 3, leftY);
        leftY += 3.8;
    });
    if (invoice.customerPhone) {
        doc.text(`Phone: ${invoice.customerPhone}`, M + 3, leftY);
        leftY += 3.8;
    }
    if (invoice.customerTRN) {
        drawCell(`TRN: ${invoice.customerTRN}`, M + 3, leftY, { bold: true, size: 8.5 });
    }

    let rightY = y + 5;
    const labelX = splitX + 4;
    const valueX = splitX + 30;

    drawCell('Invoice No.:', labelX, rightY, { bold: true, size: 9 });
    drawCell(invoice.invoiceNumber, valueX, rightY, { bold: true, size: 9, color: [26, 58, 92] });
    rightY += 5.5;
    drawCell('Dated:', labelX, rightY, { bold: true, size: 9 });
    drawCell(formatDate(invoice.date), valueX, rightY, { size: 9 });
    rightY += 5.5;
    drawCell('Mode/Terms:', labelX, rightY, { bold: true, size: 9 });
    drawCell(invoice.paymentTerms || 'Cash', valueX, rightY, { bold: true, size: 9 });
    rightY += 5.5;
    if (invoice.lpoNumber) {
        drawCell('LPO No.:', labelX, rightY, { bold: true, size: 9 });
        drawCell(invoice.lpoNumber, valueX, rightY, { size: 9 });
    }

    vLine(splitX, buyerBoxTop, buyerBoxTop + buyerBoxH);
    y = buyerBoxTop + buyerBoxH;
    hLine(y);

    // ═══ PROJECT ═══
    if (invoice.projectName) {
        y += 4;
        drawCell('Project:', M + 3, y, { bold: true, size: 9 });
        drawCell(invoice.projectName, M + 20, y, { size: 9 });
        y += 3.5;
        hLine(y);
    }

    // ═══ ITEMS TABLE ═══
    const headerTop = y;
    doc.setFillColor(235, 235, 235);
    doc.rect(M, y, W, 7, 'F');

    drawCell('Sl No.', col.sl.x + col.sl.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
    drawCell('Particulars', col.desc.x + 3, y + 4.8, { bold: true, size: 8.5 });
    drawCell('Qty', col.qty.x + col.qty.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
    drawCell('Unit', col.unit.x + col.unit.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
    drawCell('Rate', col.rate.x + col.rate.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
    drawCell('Amount (AED)', col.amount.x + col.amount.w - 2, y + 4.8, { bold: true, size: 8.5, align: 'right' });
    y += 7;
    hLine(y);

    vLine(col.desc.x, headerTop, y);
    vLine(col.qty.x, headerTop, y);
    vLine(col.unit.x, headerTop, y);
    vLine(col.rate.x, headerTop, y);
    vLine(col.amount.x, headerTop, y);

    let totalQtyCount = 0;
    const itemsStartY = y;
    const items = invoice.items || [];

    items.forEach((item, idx) => {
        const descLines = doc.splitTextToSize(item.description || '-', col.desc.w - 4);
        const rowH = Math.max(6.5, descLines.length * 4 + 2.5);
        const rowTop = y;
        totalQtyCount += parseFloat(item.qty || 0);

        drawCell(String(idx + 1), col.sl.x + col.sl.w / 2, y + 4.5, { size: 8.5, align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(descLines[0] || '', col.desc.x + 2, y + 4.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        for (let i = 1; i < descLines.length; i++) {
            doc.text(descLines[i], col.desc.x + 2, y + 4.5 + (i * 3.5));
        }

        drawCell(formatNum(item.qty), col.qty.x + col.qty.w / 2, y + 4.5, { size: 8.5, align: 'center' });
        drawCell(item.unit || 'Nos', col.unit.x + col.unit.w / 2, y + 4.5, { size: 8.5, align: 'center' });
        drawCell(formatNum(item.rate), col.rate.x + col.rate.w - 2, y + 4.5, { size: 8.5, align: 'right' });
        drawCell(formatNum(item.amount), col.amount.x + col.amount.w - 2, y + 4.5, {
            bold: true, size: 8.5, align: 'right'
        });

        y += rowH;
        vLine(col.desc.x, rowTop, y);
        vLine(col.qty.x, rowTop, y);
        vLine(col.unit.x, rowTop, y);
        vLine(col.rate.x, rowTop, y);
        vLine(col.amount.x, rowTop, y);
    });

    // Min table body — shorter so page fits
    const minTableHeight = 28;
    if ((y - itemsStartY) < minTableHeight) {
        const emptySpace = minTableHeight - (y - itemsStartY);
        vLine(col.desc.x, y, y + emptySpace);
        vLine(col.qty.x, y, y + emptySpace);
        vLine(col.unit.x, y, y + emptySpace);
        vLine(col.rate.x, y, y + emptySpace);
        vLine(col.amount.x, y, y + emptySpace);
        y += emptySpace;
    }
    hLine(y);

    // ═══ TOTALS ═══
    const totalsTop = y;
    y += 4.5;
    const labelAlign = col.amount.x - 2;
    const valueAlign = col.amount.x + col.amount.w - 2;

    drawCell('Total Qty:', col.desc.x + col.desc.w - 2, y, {
        bold: true, size: 8, align: 'right', color: [100, 100, 100]
    });
    drawCell(formatNum(totalQtyCount), col.qty.x + col.qty.w / 2, y, {
        bold: true, size: 9, align: 'center'
    });
    drawCell('Sub Total', labelAlign, y, { bold: true, size: 9.5, align: 'right' });
    drawCell(formatNum(invoice.subTotal), valueAlign, y, { bold: true, size: 9.5, align: 'right' });
    y += 4.5;

    if (invoice.discount > 0) {
        drawCell('Discount', labelAlign, y, { bold: true, size: 9.5, align: 'right' });
        drawCell('- ' + formatNum(invoice.discount), valueAlign, y, { bold: true, size: 9.5, align: 'right' });
        y += 4.5;
    }
    if (invoice.vatEnabled) {
        drawCell(`OUTPUT VAT @ ${invoice.vatRate || 5}%`, labelAlign, y, {
            bold: true, size: 9.5, align: 'right'
        });
        drawCell(formatNum(invoice.vatAmount), valueAlign, y, { bold: true, size: 9.5, align: 'right' });
        y += 4.5;
    }
    if (invoice.roundOff > 0) {
        drawCell('Round Off', labelAlign, y, { size: 9.5, align: 'right' });
        const sign = invoice.roundOffType === 'add' ? '(+)' : '(-)';
        drawCell(`${sign} ${formatNum(invoice.roundOff)}`, valueAlign, y, { size: 9.5, align: 'right' });
        y += 4.5;
    }

    y += 0.5;
    vLine(col.amount.x, totalsTop, y);
    hLine(y);

    // ═══ GRAND TOTAL ═══
    doc.setFillColor(242, 246, 249);
    doc.rect(M, y, W, 8.5, 'F');
    y += 5.8;
    drawCell('GRAND TOTAL', labelAlign, y, {
        bold: true, size: 11, align: 'right', color: [26, 58, 92]
    });
    drawCell(`AED ${formatNum(invoice.grandTotal)}`, valueAlign, y, {
        bold: true, size: 12, align: 'right', color: [26, 58, 92]
    });
    y += 2.7;
    vLine(col.amount.x, y - 8.5, y);
    hLine(y);

    // ═══ AMOUNT IN WORDS ═══
    y += 4;
    drawCell('Amount Chargeable (in words):', M + 3, y, { bold: true, size: 9 });
    drawCell('E. & O.E', M + W - 3, y, { italic: true, size: 8, align: 'right' });
    y += 5;
    drawCell(numberToWords(invoice.grandTotal), M + 3, y, {
        bold: true, size: 10, color: [26, 58, 92]
    });
    y += 3.5;
    hLine(y);

    // ═══ BANK + STAMP (compact) ═══
    const bottomBoxTop = y;

    let bankY = y + 4;
    drawCell("Company's Bank Details", M + 3, bankY, { bold: true, size: 9.5 });
    bankY += 4.5;

    const bx = M + 3;
    const by = M + 28;
    drawCell('A/c Holder:', bx, bankY, { bold: true, size: 8.5 });
    drawCell(settings.companyName, by, bankY, { bold: true, size: 8.5 });
    bankY += 3.8;
    drawCell('Bank Name:', bx, bankY, { bold: true, size: 8.5 });
    drawCell(settings.bankName || '-', by, bankY, { size: 8.5 });
    bankY += 3.8;
    drawCell('A/c No.:', bx, bankY, { bold: true, size: 8.5 });
    drawCell(settings.bankAccount || '-', by, bankY, { bold: true, size: 8.5 });
    bankY += 3.8;
    drawCell('IBAN:', bx, bankY, { bold: true, size: 8.5 });
    drawCell(settings.bankIban || '-', by, bankY, { size: 8.5 });
    bankY += 2;

    const stampNeededH = 4 + SIG_H + 5;
    const boxBottomY = Math.max(bankY + 1, bottomBoxTop + stampNeededH);

    drawCell(`For ${settings.companyName}`, M + W - 3, bottomBoxTop + 4, {
        bold: true, size: 9.5, align: 'right'
    });

    if (settings.signatureUrl) {
        try {
            const rightBoxW = (M + W) - splitX;
            const sigX = splitX + (rightBoxW - SIG_W) / 2;
            const sigY = bottomBoxTop + 5.5;
            doc.addImage(settings.signatureUrl, 'PNG', sigX, sigY, SIG_W, SIG_H);
        } catch (e) {}
    }

    drawCell('Authorised Signatory', M + W - 3, boxBottomY - 3, {
        bold: true, size: 9, align: 'right'
    });

    vLine(splitX, bottomBoxTop, boxBottomY);
    hLine(boxBottomY);
    y = boxBottomY;

    // ═══ CONTACT FOOTER ═══
    y += 4;
    const cw = W / 3;
    drawCell('Contact:', M + 3, y, { bold: true, size: 8.5 });
    drawCell(settings.phone || '-', M + 18, y, { size: 8.5 });
    drawCell('Website:', M + cw + 3, y, { bold: true, size: 8.5 });
    drawCell(settings.website || '-', M + cw + 18, y, { size: 8.5 });
    drawCell('E-Mail:', M + 2 * cw + 3, y, { bold: true, size: 8.5 });
    drawCell(settings.email || '-', M + 2 * cw + 16, y, { size: 8.5 });
    y += 3.5;
    hLine(y);

    const finalY = y;

    // Outer border — full closed box
    doc.setDrawColor(0);
    doc.setLineWidth(0.6);
    doc.rect(M, M, W, finalY - M, 'S');

    // Outside text — close under border so it stays on page
    drawCell('This is a Computer Generated Invoice', pageW / 2, finalY + 5, {
        italic: true, size: 8, align: 'center', color: [100, 100, 100]
    });

    // Safety: if somehow near page end, still OK (A4 = 297, margin 10)
    // finalY typically ~250–270 with compact spacing

    const filename = `Invoice_${(invoice.invoiceNumber || 'INV').replace(/\//g, '-')}.pdf`;
    if (preview) {
        window.open(doc.output('bloburl'), '_blank');
    } else {
        doc.save(filename);
        showToast('PDF downloaded!', 'success');
    }
}
