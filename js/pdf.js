// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Advanced PDF Engine v3
// Full-Page Borders on EVERY page + Perfect Item Flow
// ═══════════════════════════════════════════════════════

function generateInvoicePDF(invoiceId, preview = false) {
    const invoice = DB.get(DB_KEYS.INVOICES).find(i => i.id === invoiceId);
    if (!invoice) return showToast('Invoice not found', 'error');
    const settings = DB.getSettings();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = 210, pageH = 297, M = 10, W = pageW - 2 * M;
    const contentBottom = pageH - M;          // 287
    const footerReserve = 92;                 // space needed for totals+words+bank+sign+contact
    let y = M;
    let currentPage = 1;
    let pages = [];                           // track startY of content per page if needed

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

    // Draw FULL-PAGE outer border (always top to bottom)
    const drawFullPageBorder = () => {
        doc.setDrawColor(0);
        doc.setLineWidth(0.6);
        doc.rect(M, M, W, pageH - 2 * M, 'S');
    };

    // Close current page table lines + full border, then start new page with table header
    const newPageWithTableHeader = (isContinuation = true) => {
        // stretch remaining vertical lines to near bottom before closing
        const closeY = contentBottom - 8;
        if (y < closeY) {
            vLine(col.desc.x, y, closeY);
            vLine(col.qty.x, y, closeY);
            vLine(col.unit.x, y, closeY);
            vLine(col.rate.x, y, closeY);
            vLine(col.amount.x, y, closeY);
            hLine(closeY);
            y = closeY;
        }
        drawFullPageBorder();
        // page number
        drawCell(`Page ${currentPage}`, pageW / 2, pageH - 5, { size: 7.5, align: 'center', color: [120, 120, 120] });

        doc.addPage();
        currentPage++;
        y = M;

        // mini continuation header
        if (isContinuation) {
            drawCell('TAX INVOICE (Continued)', pageW / 2, y + 5, { bold: true, size: 11, align: 'center', color: [26, 58, 92] });
            y += 8;
            hLine(y);
            y += 2;
        }

        // table header again
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
    };

    const checkPageBreak = (neededH) => {
        // leave room so we never cut mid-row; on last content pages we still allow footer reserve later
        if (y + neededH > contentBottom - 12) {
            newPageWithTableHeader(true);
        }
    };

    // ═══ TITLE ═══
    drawCell('TAX INVOICE', pageW / 2, y + 6, { bold: true, size: 13, align: 'center' });
    y += 9; hLine(y);

    // ═══ LOGO + COMPANY ═══
    y += 3;
    if (settings.logoUrl) {
        try { doc.addImage(settings.logoUrl, 'PNG', pageW / 2 - 16, y, 32, 22); } catch (e) {}
    }
    y += 24;
    drawCell(settings.companyName.toUpperCase(), pageW / 2, y, { bold: true, size: 15, align: 'center', color: [26, 58, 92] });
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const addrLines = doc.splitTextToSize(settings.address || '', 130);
    addrLines.forEach(line => { doc.text(line, pageW / 2, y, { align: 'center' }); y += 3.8; });
    doc.text('United Arab Emirates', pageW / 2, y, { align: 'center' });
    y += 4.5;
    drawCell(`TRN: ${settings.trn || 'Not Set'}`, pageW / 2, y, { bold: true, size: 9.5, align: 'center' });
    y += 4; hLine(y);

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

    let rightY = y + 5;
    const labelX = splitX + 4, valueX = splitX + 30;
    drawCell('Invoice No.:', labelX, rightY, { bold: true, size: 9 });
    drawCell(invoice.invoiceNumber, valueX, rightY, { bold: true, size: 9, color: [26, 58, 92] }); rightY += 5.5;
    drawCell('Dated:', labelX, rightY, { bold: true, size: 9 });
    drawCell(formatDate(invoice.date), valueX, rightY, { size: 9 }); rightY += 5.5;
    drawCell('Mode/Terms:', labelX, rightY, { bold: true, size: 9 });
    drawCell(invoice.paymentTerms || 'Cash', valueX, rightY, { bold: true, size: 9 }); rightY += 5.5;
    if (invoice.lpoNumber) {
        drawCell('LPO No.:', labelX, rightY, { bold: true, size: 9 });
        drawCell(invoice.lpoNumber, valueX, rightY, { size: 9 }); rightY += 5.5;
    }

    const buyerBoxH = Math.max(leftY, rightY) - buyerBoxTop + 2;
    vLine(splitX, buyerBoxTop, buyerBoxTop + buyerBoxH);
    y = buyerBoxTop + buyerBoxH;
    hLine(y);

    if (invoice.projectName) {
        y += 4;
        drawCell('Project:', M + 3, y, { bold: true, size: 9 });
        drawCell(invoice.projectName, M + 20, y, { size: 9 });
        y += 3.5; hLine(y);
    }

    // ═══ ITEMS TABLE HEADER ═══
    checkPageBreak(20);
    doc.setFillColor(235, 235, 235);
    doc.rect(M, y, W, 7, 'F');
    drawCell('Sl No.', col.sl.x + col.sl.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
    drawCell('Particulars', col.desc.x + 3, y + 4.8, { bold: true, size: 8.5 });
    drawCell('Qty', col.qty.x + col.qty.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
    drawCell('Unit', col.unit.x + col.unit.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
    drawCell('Rate', col.rate.x + col.rate.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
    drawCell('Amount (AED)', col.amount.x + col.amount.w - 2, y + 4.8, { bold: true, size: 8.5, align: 'right' });
    y += 7; hLine(y);

    let totalQtyCount = 0;
    const items = invoice.items || [];

    items.forEach((item, idx) => {
        const descLines = doc.splitTextToSize(item.description || '-', col.desc.w - 4);
        const rowH = Math.max(6.5, descLines.length * 3.8 + 2.5);

        // if this row + a little buffer won't fit → new full page with table header
        if (y + rowH > contentBottom - 12) {
            newPageWithTableHeader(true);
        }

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
        drawCell(formatNum(item.amount), col.amount.x + col.amount.w - 2, y + 4.5, { bold: true, size: 8.5, align: 'right' });

        y += rowH;
        vLine(col.desc.x, rowTop, y);
        vLine(col.qty.x, rowTop, y);
        vLine(col.unit.x, rowTop, y);
        vLine(col.rate.x, rowTop, y);
        vLine(col.amount.x, rowTop, y);
    });

    // ═══ AFTER ALL ITEMS: decide if footer fits on this page ═══
    if (y + footerReserve > contentBottom - 5) {
        // not enough room → finish this page as full table page, move footer to next
        newPageWithTableHeader(true);
    }

    // Stretch empty table area so footer sits near bottom (professional look)
    const stretchTo = contentBottom - footerReserve;
    if (y < stretchTo) {
        vLine(col.desc.x, y, stretchTo);
        vLine(col.qty.x, y, stretchTo);
        vLine(col.unit.x, y, stretchTo);
        vLine(col.rate.x, y, stretchTo);
        vLine(col.amount.x, y, stretchTo);
        y = stretchTo;
    }
    hLine(y);

    // ═══ TOTALS ═══
    const totalsTop = y;
    y += 4.5;
    const labelAlign = col.amount.x - 2;
    const valueAlign = col.amount.x + col.amount.w - 2;

    drawCell('Total Qty:', col.desc.x + col.desc.w - 2, y, { bold: true, size: 8, align: 'right', color: [100, 100, 100] });
    drawCell(formatNum(totalQtyCount), col.qty.x + col.qty.w / 2, y, { bold: true, size: 9, align: 'center' });
    drawCell('Sub Total', labelAlign, y, { bold: true, size: 9.5, align: 'right' });
    drawCell(formatNum(invoice.subTotal), valueAlign, y, { bold: true, size: 9.5, align: 'right' });
    y += 4.5;

    if (invoice.discount > 0) {
        drawCell('Discount', labelAlign, y, { bold: true, size: 9.5, align: 'right' });
        drawCell('- ' + formatNum(invoice.discount), valueAlign, y, { bold: true, size: 9.5, align: 'right' });
        y += 4.5;
    }
    if (invoice.vatEnabled) {
        drawCell(`OUTPUT VAT @ ${invoice.vatRate || 5}%`, labelAlign, y, { bold: true, size: 9.5, align: 'right' });
        drawCell(formatNum(invoice.vatAmount), valueAlign, y, { bold: true, size: 9.5, align: 'right' });
        y += 4.5;
    }
    if (invoice.roundOff > 0) {
        drawCell('Round Off', labelAlign, y, { size: 9.5, align: 'right' });
        drawCell(`${invoice.roundOffType === 'add' ? '(+)' : '(-)'} ${formatNum(invoice.roundOff)}`, valueAlign, y, { size: 9.5, align: 'right' });
        y += 4.5;
    }
    y += 0.5;
    vLine(col.amount.x, totalsTop, y);
    hLine(y);

    // ═══ GRAND TOTAL ═══
    doc.setFillColor(242, 246, 249);
    doc.rect(M, y, W, 8.5, 'F');
    y += 5.8;
    drawCell('GRAND TOTAL', labelAlign, y, { bold: true, size: 11, align: 'right', color: [26, 58, 92] });
    drawCell(`AED ${formatNum(invoice.grandTotal)}`, valueAlign, y, { bold: true, size: 12, align: 'right', color: [26, 58, 92] });
    y += 2.7;
    vLine(col.amount.x, y - 8.5, y);
    hLine(y);

    // ═══ AMOUNT IN WORDS ═══
    y += 4;
    drawCell('Amount Chargeable (in words):', M + 3, y, { bold: true, size: 9 });
    drawCell('E. & O.E', M + W - 3, y, { italic: true, size: 8, align: 'right' });
    y += 5;
    drawCell(numberToWords(invoice.grandTotal), M + 3, y, { bold: true, size: 10, color: [26, 58, 92] });
    y += 3.5;
    hLine(y);

    // ═══ BANK + SIGNATURE ═══
    const bottomBoxTop = y;
    let bankY = y + 4;
    drawCell("Company's Bank Details", M + 3, bankY, { bold: true, size: 9.5 });
    bankY += 4.5;
    const bx = M + 3, by = M + 28;
    drawCell('A/c Holder:', bx, bankY, { bold: true, size: 8.5 });
    drawCell(settings.companyName, by, bankY, { bold: true, size: 8.5 }); bankY += 3.8;
    drawCell('Bank Name:', bx, bankY, { bold: true, size: 8.5 });
    drawCell(settings.bankName || '-', by, bankY, { size: 8.5 }); bankY += 3.8;
    drawCell('A/c No.:', bx, bankY, { bold: true, size: 8.5 });
    drawCell(settings.bankAccount || '-', by, bankY, { bold: true, size: 8.5 }); bankY += 3.8;
    drawCell('IBAN:', bx, bankY, { bold: true, size: 8.5 });
    drawCell(settings.bankIban || '-', by, bankY, { size: 8.5 }); bankY += 2;

    const boxBottomY = Math.max(bankY + 1, bottomBoxTop + 4 + SIG_H + 5);
    drawCell(`For ${settings.companyName}`, M + W - 3, bottomBoxTop + 4, { bold: true, size: 9.5, align: 'right' });
    if (settings.signatureUrl) {
        try {
            const rW = (M + W) - splitX;
            const sigX = splitX + (rW - SIG_W) / 2;
            doc.addImage(settings.signatureUrl, 'PNG', sigX, bottomBoxTop + 5.5, SIG_W, SIG_H);
        } catch (e) {}
    }
    drawCell('Authorised Signatory', M + W - 3, boxBottomY - 3, { bold: true, size: 9, align: 'right' });
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

    // FINAL full-page border + page no + computer generated note
    drawFullPageBorder();
    drawCell(`Page ${currentPage}`, pageW / 2, pageH - 5, { size: 7.5, align: 'center', color: [120, 120, 120] });
    drawCell('This is a Computer Generated Invoice', pageW / 2, y + 4, { italic: true, size: 8, align: 'center', color: [100, 100, 100] });

    if (preview) {
        window.open(doc.output('bloburl'), '_blank');
    } else {
        doc.save(`Invoice_${(invoice.invoiceNumber || 'INV').replace(/\//g, '-')}.pdf`);
        showToast('PDF downloaded!', 'success');
    }
}


// ═══════════════════════════════════════════════════════
// MANUAL INVOICE - Same full-page multi-page engine
// ═══════════════════════════════════════════════════════
function generateManualInvoicePDF(data, preview = false) {
    const settings = DB.getSettings();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = 210, pageH = 297, M = 10, W = pageW - 2 * M;
    const contentBottom = pageH - M;
    let y = M;
    let currentPage = 1;

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

    const drawFullPageBorder = () => {
        doc.setDrawColor(0);
        doc.setLineWidth(0.6);
        doc.rect(M, M, W, pageH - 2 * M, 'S');
    };

    const newPageWithTableHeader = () => {
        const closeY = contentBottom - 8;
        if (y < closeY) {
            vLine(col.desc.x, y, closeY);
            vLine(col.qty.x, y, closeY);
            vLine(col.unit.x, y, closeY);
            vLine(col.rate.x, y, closeY);
            vLine(col.amount.x, y, closeY);
            hLine(closeY);
            y = closeY;
        }
        drawFullPageBorder();
        drawCell(`Page ${currentPage}`, pageW / 2, pageH - 5, { size: 7.5, align: 'center', color: [120, 120, 120] });

        doc.addPage();
        currentPage++;
        y = M;

        drawCell((data.docTitle || 'TAX INVOICE') + ' (Continued)', pageW / 2, y + 5, { bold: true, size: 11, align: 'center', color: [26, 58, 92] });
        y += 8; hLine(y); y += 2;

        doc.setFillColor(235, 235, 235);
        doc.rect(M, y, W, 7, 'F');
        drawCell(data.h1 || 'Sl No.', col.sl.x + col.sl.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
        drawCell(data.h2 || 'Particulars', col.desc.x + 3, y + 4.8, { bold: true, size: 8.5 });
        drawCell(data.h3 || 'Qty', col.qty.x + col.qty.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
        drawCell(data.h4 || 'Unit', col.unit.x + col.unit.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
        drawCell(data.h5 || 'Rate', col.rate.x + col.rate.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
        drawCell(data.h6 || 'Amount', col.amount.x + col.amount.w - 2, y + 4.8, { bold: true, size: 8.5, align: 'right' });
        y += 7; hLine(y);
    };

    // TITLE
    drawCell(data.docTitle || 'TAX INVOICE', pageW / 2, y + 6, { bold: true, size: 13, align: 'center' });
    y += 9; hLine(y);

    // COMPANY
    y += 3;
    if (settings.logoUrl) {
        try { doc.addImage(settings.logoUrl, 'PNG', pageW / 2 - 16, y, 32, 22); } catch (e) {}
    }
    y += 24;
    drawCell(settings.companyName.toUpperCase(), pageW / 2, y, { bold: true, size: 15, align: 'center', color: [26, 58, 92] });
    y += 4.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    const addrLines = doc.splitTextToSize(settings.address || '', 130);
    addrLines.forEach(line => { doc.text(line, pageW / 2, y, { align: 'center' }); y += 3.8; });
    doc.text('United Arab Emirates', pageW / 2, y, { align: 'center' });
    y += 4.5;
    drawCell(`TRN: ${settings.trn || 'Not Set'}`, pageW / 2, y, { bold: true, size: 9.5, align: 'center' });
    y += 4; hLine(y);

    // BUYER + META
    const buyerBoxTop = y;
    let leftY = y + 5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    const leftTextLines = doc.splitTextToSize(data.buyerText || '', splitX - M - 6);
    leftTextLines.forEach(line => { doc.text(line, M + 3, leftY); leftY += 4.5; });

    let rightY = y + 5;
    const rightTextLines = doc.splitTextToSize(data.metaText || '', (M + W) - splitX - 6);
    rightTextLines.forEach(line => { doc.text(line, splitX + 4, rightY); rightY += 4.5; });

    const buyerBoxH = Math.max(leftY, rightY) - buyerBoxTop + 2;
    vLine(splitX, buyerBoxTop, buyerBoxTop + buyerBoxH);
    y = buyerBoxTop + buyerBoxH;
    hLine(y);

    if (data.projectText) {
        y += 4.5;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
        doc.text(data.projectText, M + 3, y);
        y += 3.5; hLine(y);
    }

    // TABLE HEADER
    doc.setFillColor(235, 235, 235);
    doc.rect(M, y, W, 7, 'F');
    drawCell(data.h1 || 'Sl No.', col.sl.x + col.sl.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
    drawCell(data.h2 || 'Particulars', col.desc.x + 3, y + 4.8, { bold: true, size: 8.5 });
    drawCell(data.h3 || 'Qty', col.qty.x + col.qty.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
    drawCell(data.h4 || 'Unit', col.unit.x + col.unit.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
    drawCell(data.h5 || 'Rate', col.rate.x + col.rate.w / 2, y + 4.8, { bold: true, size: 8.5, align: 'center' });
    drawCell(data.h6 || 'Amount', col.amount.x + col.amount.w - 2, y + 4.8, { bold: true, size: 8.5, align: 'right' });
    y += 7; hLine(y);

    (data.items || []).forEach((item) => {
        const descLines = doc.splitTextToSize(item.c2 || '', col.desc.w - 4);
        const rowH = Math.max(6.5, descLines.length * 4 + 2.5);

        if (y + rowH > contentBottom - 12) {
            newPageWithTableHeader();
        }

        const rowTop = y;
        drawCell(item.c1 || '', col.sl.x + col.sl.w / 2, y + 4.5, { size: 8.5, align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
        descLines.forEach((line, i) => doc.text(line, col.desc.x + 2, y + 4.5 + (i * 4)));
        drawCell(item.c3 || '', col.qty.x + col.qty.w / 2, y + 4.5, { size: 8.5, align: 'center' });
        drawCell(item.c4 || '', col.unit.x + col.unit.w / 2, y + 4.5, { size: 8.5, align: 'center' });
        drawCell(item.c5 || '', col.rate.x + col.rate.w - 2, y + 4.5, { size: 8.5, align: 'right' });
        drawCell(item.c6 || '', col.amount.x + col.amount.w - 2, y + 4.5, { bold: true, size: 8.5, align: 'right' });

        y += rowH;
        vLine(col.desc.x, rowTop, y);
        vLine(col.qty.x, rowTop, y);
        vLine(col.unit.x, rowTop, y);
        vLine(col.rate.x, rowTop, y);
        vLine(col.amount.x, rowTop, y);
    });

    // Totals text height estimate
    const tLines = doc.splitTextToSize(data.totalsText || '', W - 4);
    const totalsBlockH = tLines.length * 4.5 + 12;
    const manualFooterH = totalsBlockH + 78;

    if (y + manualFooterH > contentBottom - 5) {
        newPageWithTableHeader();
    }

    // stretch table to push footer down
    const stretchTo = contentBottom - manualFooterH;
    if (y < stretchTo) {
        vLine(col.desc.x, y, stretchTo);
        vLine(col.qty.x, y, stretchTo);
        vLine(col.unit.x, y, stretchTo);
        vLine(col.rate.x, y, stretchTo);
        vLine(col.amount.x, y, stretchTo);
        y = stretchTo;
    }
    hLine(y);

    // TOTALS
    const totalsTop = y;
    y += 4.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
    tLines.forEach(line => { doc.text(line, M + W - 2, y, { align: 'right' }); y += 4.5; });
    vLine(col.amount.x, totalsTop, y);
    hLine(y);

    // GRAND TOTAL
    doc.setFillColor(242, 246, 249);
    doc.rect(M, y, W, 8.5, 'F');
    y += 5.8;
    drawCell(data.grandTotalLabel || 'GRAND TOTAL', col.amount.x - 2, y, { bold: true, size: 11, align: 'right', color: [26, 58, 92] });
    drawCell(data.grandTotalValue || '', M + W - 2, y, { bold: true, size: 12, align: 'right', color: [26, 58, 92] });
    y += 2.7;
    vLine(col.amount.x, y - 8.5, y);
    hLine(y);

    // AMOUNT IN WORDS
    y += 4;
    drawCell('Amount Chargeable (in words):', M + 3, y, { bold: true, size: 9 });
    drawCell('E. & O.E', M + W - 3, y, { italic: true, size: 8, align: 'right' });
    y += 5;
    drawCell(data.amountInWords || '', M + 3, y, { bold: true, size: 10, color: [26, 58, 92] });
    y += 3.5;
    hLine(y);

    // BANK + SIGN
    const bottomBoxTop = y;
    let bankY = y + 4;
    drawCell("Company's Bank Details", M + 3, bankY, { bold: true, size: 9.5 });
    bankY += 4.5;
    const bx = M + 3, by = M + 28;
    drawCell('A/c Holder:', bx, bankY, { bold: true, size: 8.5 });
    drawCell(settings.companyName, by, bankY, { bold: true, size: 8.5 }); bankY += 3.8;
    drawCell('Bank Name:', bx, bankY, { bold: true, size: 8.5 });
    drawCell(settings.bankName || '-', by, bankY, { size: 8.5 }); bankY += 3.8;
    drawCell('A/c No.:', bx, bankY, { bold: true, size: 8.5 });
    drawCell(settings.bankAccount || '-', by, bankY, { bold: true, size: 8.5 }); bankY += 3.8;
    drawCell('IBAN:', bx, bankY, { bold: true, size: 8.5 });
    drawCell(settings.bankIban || '-', by, bankY, { size: 8.5 }); bankY += 2;

    const boxBottomY = Math.max(bankY + 1, bottomBoxTop + 4 + SIG_H + 5);
    drawCell(`For ${settings.companyName}`, M + W - 3, bottomBoxTop + 4, { bold: true, size: 9.5, align: 'right' });
    if (settings.signatureUrl) {
        try {
            const rW = (M + W) - splitX;
            const sigX = splitX + (rW - SIG_W) / 2;
            doc.addImage(settings.signatureUrl, 'PNG', sigX, bottomBoxTop + 5.5, SIG_W, SIG_H);
        } catch (e) {}
    }
    drawCell('Authorised Signatory', M + W - 3, boxBottomY - 3, { bold: true, size: 9, align: 'right' });
    vLine(splitX, bottomBoxTop, boxBottomY);
    hLine(boxBottomY);
    y = boxBottomY;

    // CONTACT
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

    drawFullPageBorder();
    drawCell(`Page ${currentPage}`, pageW / 2, pageH - 5, { size: 7.5, align: 'center', color: [120, 120, 120] });
    drawCell('This is a Computer Generated Document', pageW / 2, y + 4, { italic: true, size: 8, align: 'center', color: [100, 100, 100] });

    if (preview) {
        window.open(doc.output('bloburl'), '_blank');
    } else {
        doc.save(`Manual_${data.docTitle || 'Doc'}.pdf`);
        showToast('PDF downloaded!', 'success');
    }
}
