// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Advanced PDF Engine
// Tight rows, Table Stretch, Fixed Footer & Auto Font-Size
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
        sl:     { x: M,       w: 12 },
        desc:   { x: M + 12,  w: 78 },
        qty:    { x: M + 90,  w: 18 },
        unit:   { x: M + 108, w: 18 },
        rate:   { x: M + 126, w: 26 },
        amount: { x: M + 152, w: 38 }
    };
    const splitX = col.qty.x;
    const SIG_W = 55, SIG_H = 32;

    // ✅ PRO FEATURE: Auto Font-Size Adjust (Text overlap rokne ke liye)
    const drawCell = (text, x, yPos, opts = {}) => {
        let currentSize = opts.size || 9;
        doc.setFont('helvetica', opts.bold ? 'bold' : (opts.italic ? 'italic' : 'normal'));
        doc.setFontSize(currentSize);

        if (opts.maxWidth) {
            let textWidth = doc.getTextWidth(String(text || ''));
            while (textWidth > opts.maxWidth && currentSize > 4.5) {
                currentSize -= 0.5;
                doc.setFontSize(currentSize);
                textWidth = doc.getTextWidth(String(text || ''));
            }
        }

        doc.setTextColor(...(opts.color || [0, 0, 0]));
        doc.text(String(text || ''), x, yPos, { align: opts.align || 'left' });
    };

    const LINE_W = 0.4;
    const hLine = (yPos) => { doc.setDrawColor(0); doc.setLineWidth(LINE_W); doc.line(M, yPos, M + W, yPos); };
    const vLine = (x, y1, y2) => { doc.setDrawColor(0); doc.setLineWidth(LINE_W); doc.line(x, y1, x, y2); };
    const closeFrame = (bottomY) => {
        doc.setDrawColor(0);
        doc.setLineWidth(0.6);
        doc.rect(M, M, W, bottomY - M, 'S');
    };

    const FOOTER_H = 78;
    const pageBottom = pageH - M;

    // ─── TITLE ───
    drawCell('TAX INVOICE', pageW / 2, y + 5.5, { bold: true, size: 13, align: 'center' });
    y += 8; hLine(y);

    // ─── LOGO + COMPANY ───
    y += 2;
    if (settings.logoUrl) {
        try { doc.addImage(settings.logoUrl, 'PNG', pageW / 2 - 14, y, 28, 20); } catch (e) {}
    }
    y += 22;
    drawCell((settings.companyName || 'AL BOWRY CARPENTRY LLC').toUpperCase(), pageW / 2, y, {
        bold: true, size: 14, align: 'center', color: [26, 58, 92], maxWidth: W - 10
    });
    y += 4.2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const addrLines = doc.splitTextToSize(settings.address || '', 130);
    addrLines.forEach(line => { doc.text(line, pageW / 2, y, { align: 'center' }); y += 3.5; });
    doc.text('United Arab Emirates', pageW / 2, y, { align: 'center' });
    y += 4;
    drawCell(`TRN: ${settings.trn || 'Not Set'}`, pageW / 2, y, { bold: true, size: 9, align: 'center' });
    y += 3.5; hLine(y);

    // ─── BUYER + META ───
    const buyerBoxTop = y;
    let leftY = y + 4;
    drawCell('Buyer (Bill to):', M + 3, leftY, { bold: true, size: 9 }); leftY += 4.5;
    drawCell(invoice.customerName || 'N/A', M + 3, leftY, { bold: true, size: 11, maxWidth: col.desc.w }); leftY += 4.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    const custAddrLines = doc.splitTextToSize(invoice.customerAddress || '', splitX - M - 6);
    custAddrLines.slice(0, 3).forEach(line => { doc.text(line, M + 3, leftY); leftY += 3.5; });
    if (invoice.customerPhone) { doc.text(`Phone: ${invoice.customerPhone}`, M + 3, leftY); leftY += 3.5; }
    if (invoice.customerTRN) {
        drawCell(`TRN: ${invoice.customerTRN}`, M + 3, leftY, { bold: true, size: 8 });
        leftY += 3.8;
    }

    let rightY = y + 4;
    const labelX = splitX + 3, valueX = splitX + 28;
    drawCell('Invoice No.:', labelX, rightY, { bold: true, size: 8.5 });
    drawCell(invoice.invoiceNumber || '', valueX, rightY, { bold: true, size: 8.5, color: [26, 58, 92], maxWidth: W - valueX });
    rightY += 5;
    drawCell('Dated:', labelX, rightY, { bold: true, size: 8.5 });
    drawCell(typeof formatDate === 'function' ? formatDate(invoice.date) : (invoice.date || ''), valueX, rightY, { size: 8.5 });
    rightY += 5;
    drawCell('Mode/Terms:', labelX, rightY, { bold: true, size: 8.5 });
    drawCell(invoice.paymentTerms || 'Cash', valueX, rightY, { bold: true, size: 8.5, maxWidth: W - valueX });
    rightY += 5;
    if (invoice.lpoNumber) {
        drawCell('LPO No.:', labelX, rightY, { bold: true, size: 8.5 });
        drawCell(invoice.lpoNumber, valueX, rightY, { size: 8.5, maxWidth: W - valueX });
        rightY += 5;
    }

    const buyerBoxH = Math.max(leftY, rightY) - buyerBoxTop + 2;
    vLine(splitX, buyerBoxTop, buyerBoxTop + buyerBoxH);
    y = buyerBoxTop + buyerBoxH;
    hLine(y);

    if (invoice.projectName) {
        y += 3.5;
        drawCell('Project:', M + 3, y, { bold: true, size: 8.5 });
        drawCell(invoice.projectName, M + 20, y, { size: 8.5, maxWidth: W - 25 });
        y += 3; hLine(y);
    }

    // ─── TABLE HEADER ───
    const drawTableHeader = () => {
        doc.setFillColor(235, 235, 235);
        doc.rect(M, y, W, 6.5, 'F');
        drawCell('Sl No.', col.sl.x + col.sl.w / 2, y + 4.4, { bold: true, size: 8, align: 'center' });
        drawCell('Particulars', col.desc.x + 2, y + 4.4, { bold: true, size: 8 });
        drawCell('Qty', col.qty.x + col.qty.w / 2, y + 4.4, { bold: true, size: 8, align: 'center' });
        drawCell('Unit', col.unit.x + col.unit.w / 2, y + 4.4, { bold: true, size: 8, align: 'center' });
        drawCell('Rate', col.rate.x + col.rate.w / 2, y + 4.4, { bold: true, size: 8, align: 'center' });
        drawCell('Amount (AED)', col.amount.x + col.amount.w - 2, y + 4.4, { bold: true, size: 8, align: 'right' });
        y += 6.5;
        hLine(y);
    };
    drawTableHeader();

    // ─── ITEMS ───
    let totalQtyCount = 0;
    const items = invoice.items || [];
    
    const startNewPage = () => {
        vLine(col.desc.x, y, pageBottom);
        vLine(col.qty.x, y, pageBottom);
        vLine(col.unit.x, y, pageBottom);
        vLine(col.rate.x, y, pageBottom);
        vLine(col.amount.x, y, pageBottom);
        hLine(pageBottom);
        closeFrame(pageBottom);

        doc.addPage();
        y = M;
        drawTableHeader();
    };

    items.forEach((item, idx) => {
        const descLines = doc.splitTextToSize(item.description || '-', col.desc.w - 4);
        const rowH = Math.max(5.8, descLines.length * 3.6 + 2.2);

        if (y + rowH > pageBottom - FOOTER_H) {
            startNewPage();
        }

        const rowTop = y;
        totalQtyCount += parseFloat(item.qty || 0);

        drawCell(String(idx + 1), col.sl.x + col.sl.w / 2, y + 4, { size: 8, align: 'center' });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(descLines[0] || '', col.desc.x + 2, y + 4);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        for (let i = 1; i < descLines.length; i++) {
            doc.text(descLines[i], col.desc.x + 2, y + 4 + (i * 3.4));
        }

        drawCell(formatNum(item.qty), col.qty.x + col.qty.w / 2, y + 4, { size: 8, align: 'center', maxWidth: col.qty.w - 2 });
        drawCell(item.unit || 'Nos', col.unit.x + col.unit.w / 2, y + 4, { size: 8, align: 'center', maxWidth: col.unit.w - 2 });
        drawCell(formatNum(item.rate), col.rate.x + col.rate.w - 2, y + 4, { size: 8, align: 'right', maxWidth: col.rate.w - 2 });
        drawCell(formatNum(item.amount), col.amount.x + col.amount.w - 2, y + 4, { bold: true, size: 8, align: 'right', maxWidth: col.amount.w - 2 });

        y += rowH;
        vLine(col.desc.x, rowTop, y);
        vLine(col.qty.x, rowTop, y);
        vLine(col.unit.x, rowTop, y);
        vLine(col.rate.x, rowTop, y);
        vLine(col.amount.x, rowTop, y);
    });

    // ✅ PRO FEATURE: Table Stretch & Footer Lock
    if (y + FOOTER_H > pageBottom) {
        hLine(y);
        closeFrame(y);
        doc.addPage();
        y = M;
        drawTableHeader();
    }

    const footerStartY = pageBottom - FOOTER_H;
    if (y < footerStartY) {
        vLine(col.desc.x, y, footerStartY);
        vLine(col.qty.x, y, footerStartY);
        vLine(col.unit.x, y, footerStartY);
        vLine(col.rate.x, y, footerStartY);
        vLine(col.amount.x, y, footerStartY);
        y = footerStartY;
    }
    hLine(y); 

    // ─── TOTALS ───
    const totalsTop = y;
    y += 4;
    const labelAlign = col.amount.x - 2;
    const valueAlign = col.amount.x + col.amount.w - 2;

    drawCell('Total Qty:', col.desc.x + col.desc.w - 2, y, {
        bold: true, size: 7.5, align: 'right', color: [100, 100, 100]
    });
    drawCell(formatNum(totalQtyCount), col.qty.x + col.qty.w / 2, y, {
        bold: true, size: 8.5, align: 'center', maxWidth: col.qty.w - 2
    });
    drawCell('Sub Total', labelAlign, y, { bold: true, size: 9, align: 'right' });
    drawCell(formatNum(invoice.subTotal), valueAlign, y, { bold: true, size: 9, align: 'right', maxWidth: col.amount.w - 2 });
    y += 4;

    if (invoice.discount > 0) {
        drawCell('Discount', labelAlign, y, { bold: true, size: 9, align: 'right' });
        drawCell('- ' + formatNum(invoice.discount), valueAlign, y, { bold: true, size: 9, align: 'right', maxWidth: col.amount.w - 2 });
        y += 4;
    }
    if (invoice.vatEnabled) {
        drawCell(`OUTPUT VAT @ ${invoice.vatRate || 5}%`, labelAlign, y, { bold: true, size: 9, align: 'right' });
        drawCell(formatNum(invoice.vatAmount), valueAlign, y, { bold: true, size: 9, align: 'right', maxWidth: col.amount.w - 2 });
        y += 4;
    }
    if (invoice.roundOff > 0) {
        drawCell('Round Off', labelAlign, y, { size: 9, align: 'right' });
        drawCell(`${invoice.roundOffType === 'add' ? '(+)' : '(-)'} ${formatNum(invoice.roundOff)}`, valueAlign, y, { size: 9, align: 'right', maxWidth: col.amount.w - 2 });
        y += 4;
    }

    vLine(col.amount.x, totalsTop, y);
    hLine(y);

    // ─── GRAND TOTAL ───
    doc.setFillColor(242, 246, 249);
    doc.rect(M, y, W, 7.5, 'F');
    y += 5.2;
    drawCell('GRAND TOTAL', labelAlign, y, { bold: true, size: 10.5, align: 'right', color: [26, 58, 92] });
    drawCell(`AED ${formatNum(invoice.grandTotal)}`, valueAlign, y, {
        bold: true, size: 11.5, align: 'right', color: [26, 58, 92], maxWidth: col.amount.w - 2
    });
    y += 2.3;
    vLine(col.amount.x, y - 7.5, y);
    hLine(y);

    // ─── AMOUNT IN WORDS ───
    y += 3.5;
    drawCell('Amount Chargeable (in words):', M + 3, y, { bold: true, size: 8.5 });
    drawCell('E. & O.E', M + W - 3, y, { italic: true, size: 7.5, align: 'right' });
    y += 4.5;
    const words = typeof numberToWords === 'function' ? numberToWords(invoice.grandTotal) : '';
    drawCell(words, M + 3, y, { bold: true, size: 9.5, color: [26, 58, 92], maxWidth: W - 10 });
    y += 3; hLine(y);

    // ─── BANK + SIGNATURE ───
    const bottomBoxTop = y;
    let bankY = y + 3.5;
    drawCell("Company's Bank Details", M + 3, bankY, { bold: true, size: 9 });
    bankY += 4;
    const bx = M + 3, by = M + 26;
    drawCell('A/c Holder:', bx, bankY, { bold: true, size: 8 });
    drawCell(settings.companyName || 'Al Bowry Carpentry LLC', by, bankY, { bold: true, size: 8, maxWidth: splitX - by - 2 });
    bankY += 3.5;
    drawCell('Bank Name:', bx, bankY, { bold: true, size: 8 });
    drawCell(settings.bankName || '-', by, bankY, { size: 8, maxWidth: splitX - by - 2 });
    bankY += 3.5;
    drawCell('A/c No.:', bx, bankY, { bold: true, size: 8 });
    drawCell(settings.bankAccount || settings.bankAc || '-', by, bankY, { bold: true, size: 8, maxWidth: splitX - by - 2 });
    bankY += 3.5;
    drawCell('IBAN:', bx, bankY, { bold: true, size: 8 });
    drawCell(settings.bankIban || '-', by, bankY, { size: 8, maxWidth: splitX - by - 2 });
    bankY += 2;

    const boxBottomY = Math.max(bankY + 1, bottomBoxTop + SIG_H + 10);
    drawCell(`For ${settings.companyName || 'Al Bowry Carpentry LLC'}`, M + W - 3, bottomBoxTop + 3.5, {
        bold: true, size: 9, align: 'right', maxWidth: (W - splitX) - 5
    });

    if (settings.signatureUrl || settings.stampUrl) {
        try {
            const img = settings.signatureUrl || settings.stampUrl;
            const rW = (M + W) - splitX;
            const sigX = splitX + (rW - SIG_W) / 2;
            doc.addImage(img, 'PNG', sigX, bottomBoxTop + 5, SIG_W, SIG_H);
        } catch (e) {}
    }

    drawCell('Authorised Signatory', M + W - 3, boxBottomY - 2.5, {
        bold: true, size: 8.5, align: 'right'
    });
    vLine(splitX, bottomBoxTop, boxBottomY);
    hLine(boxBottomY);
    y = boxBottomY;

    // ─── CONTACT FOOTER ───
    y += 3.5;
    const cw = W / 3;
    drawCell('Contact:', M + 3, y, { bold: true, size: 8 });
    drawCell(settings.phone || '-', M + 18, y, { size: 8, maxWidth: cw - 20 });
    drawCell('Website:', M + cw + 3, y, { bold: true, size: 8 });
    drawCell(settings.website || '-', M + cw + 18, y, { size: 8, maxWidth: cw - 20 });
    drawCell('E-Mail:', M + 2 * cw + 3, y, { bold: true, size: 8 });
    drawCell(settings.email || '-', M + 2 * cw + 16, y, { size: 8, maxWidth: cw - 20 });
    y += 3; hLine(y);

    // Final outer border
    closeFrame(y);
    drawCell('This is a Computer Generated Invoice', pageW / 2, y + 4.5, {
        italic: true, size: 7.5, align: 'center', color: [100, 100, 100]
    });

    if (preview) {
        window.open(doc.output('bloburl'), '_blank');
    } else {
        doc.save(`Invoice_${(invoice.invoiceNumber || 'INV').replace(/\//g, '-')}.pdf`);
        showToast('PDF downloaded!', 'success');
    }
}


// ═══════════════════════════════════════════════════════
// MANUAL INVOICE GENERATOR — same tight layout & features
// ═══════════════════════════════════════════════════════

function generateManualInvoicePDF(data, preview = false) {
    const settings = DB.getSettings();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = 210, pageH = 297, M = 10, W = pageW - 2 * M;
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
    const SIG_W = 55, SIG_H = 32;

    const drawCell = (text, x, yPos, opts = {}) => {
        let currentSize = opts.size || 9;
        doc.setFont('helvetica', opts.bold ? 'bold' : (opts.italic ? 'italic' : 'normal'));
        doc.setFontSize(currentSize);

        if (opts.maxWidth) {
            let textWidth = doc.getTextWidth(String(text || ''));
            while (textWidth > opts.maxWidth && currentSize > 4.5) {
                currentSize -= 0.5;
                doc.setFontSize(currentSize);
                textWidth = doc.getTextWidth(String(text || ''));
            }
        }

        doc.setTextColor(...(opts.color || [0, 0, 0]));
        doc.text(String(text || ''), x, yPos, { align: opts.align || 'left' });
    };

    const LINE_W = 0.4;
    const hLine = (yPos) => { doc.setDrawColor(0); doc.setLineWidth(LINE_W); doc.line(M, yPos, M + W, yPos); };
    const vLine = (x, y1, y2) => { doc.setDrawColor(0); doc.setLineWidth(LINE_W); doc.line(x, y1, x, y2); };
    const closeFrame = (bottomY) => {
        doc.setDrawColor(0);
        doc.setLineWidth(0.6);
        doc.rect(M, M, W, bottomY - M, 'S');
    };

    const FOOTER_H = 78;
    const pageBottom = pageH - M;

    // TITLE
    drawCell(data.docTitle || 'TAX INVOICE', pageW / 2, y + 5.5, { bold: true, size: 13, align: 'center', maxWidth: W - 10 });
    y += 8; hLine(y);

    // COMPANY
    y += 2;
    if (settings.logoUrl) {
        try { doc.addImage(settings.logoUrl, 'PNG', pageW / 2 - 14, y, 28, 20); } catch (e) {}
    }
    y += 22;
    drawCell((settings.companyName || 'AL BOWRY CARPENTRY LLC').toUpperCase(), pageW / 2, y, {
        bold: true, size: 14, align: 'center', color: [26, 58, 92], maxWidth: W - 10
    });
    y += 4.2;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    const addrLines = doc.splitTextToSize(settings.address || '', 130);
    addrLines.forEach(line => { doc.text(line, pageW / 2, y, { align: 'center' }); y += 3.5; });
    doc.text('United Arab Emirates', pageW / 2, y, { align: 'center' });
    y += 4;
    drawCell(`TRN: ${settings.trn || 'Not Set'}`, pageW / 2, y, { bold: true, size: 9, align: 'center' });
    y += 3.5; hLine(y);

    // BUYER / META free text
    const buyerBoxTop = y;
    let leftY = y + 4;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    const leftTextLines = doc.splitTextToSize(data.buyerText || '', splitX - M - 6);
    leftTextLines.forEach(line => { doc.text(line, M + 3, leftY); leftY += 4; });

    let rightY = y + 4;
    const rightTextLines = doc.splitTextToSize(data.metaText || '', (M + W) - splitX - 6);
    rightTextLines.forEach(line => { doc.text(line, splitX + 3, rightY); rightY += 4; });

    const buyerBoxH = Math.max(leftY, rightY) - buyerBoxTop + 2;
    vLine(splitX, buyerBoxTop, buyerBoxTop + buyerBoxH);
    y = buyerBoxTop + buyerBoxH;
    hLine(y);

    if (data.projectText) {
        y += 3.5;
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
        doc.text(data.projectText, M + 3, y);
        y += 3; hLine(y);
    }

    // TABLE HEADER
    const drawTableHeader = () => {
        doc.setFillColor(235, 235, 235);
        doc.rect(M, y, W, 6.5, 'F');
        drawCell(data.h1 || 'Sl No.', col.sl.x + col.sl.w / 2, y + 4.4, { bold: true, size: 8, align: 'center', maxWidth: col.sl.w - 1 });
        drawCell(data.h2 || 'Particulars', col.desc.x + 2, y + 4.4, { bold: true, size: 8, maxWidth: col.desc.w - 4 });
        drawCell(data.h3 || 'Qty', col.qty.x + col.qty.w / 2, y + 4.4, { bold: true, size: 8, align: 'center', maxWidth: col.qty.w - 1 });
        drawCell(data.h4 || 'Unit', col.unit.x + col.unit.w / 2, y + 4.4, { bold: true, size: 8, align: 'center', maxWidth: col.unit.w - 1 });
        drawCell(data.h5 || 'Rate', col.rate.x + col.rate.w / 2, y + 4.4, { bold: true, size: 8, align: 'center', maxWidth: col.rate.w - 1 });
        drawCell(data.h6 || 'Amount', col.amount.x + col.amount.w - 2, y + 4.4, { bold: true, size: 8, align: 'right', maxWidth: col.amount.w - 1 });
        y += 6.5;
        hLine(y);
    };
    drawTableHeader();

    const startNewPage = () => {
        vLine(col.desc.x, y, pageBottom);
        vLine(col.qty.x, y, pageBottom);
        vLine(col.unit.x, y, pageBottom);
        vLine(col.rate.x, y, pageBottom);
        vLine(col.amount.x, y, pageBottom);
        hLine(pageBottom);
        closeFrame(pageBottom);

        doc.addPage();
        y = M;
        drawTableHeader();
    };

    (data.items || []).forEach((item) => {
        const descLines = doc.splitTextToSize(item.c2 || '', col.desc.w - 4);
        const rowH = Math.max(5.8, descLines.length * 3.6 + 2.2);

        if (y + rowH > pageBottom - FOOTER_H) {
            startNewPage();
        }

        const rowTop = y;
        drawCell(item.c1 || '', col.sl.x + col.sl.w / 2, y + 4, { size: 8, align: 'center', maxWidth: col.sl.w - 2 });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        descLines.forEach((line, i) => doc.text(line, col.desc.x + 2, y + 4 + (i * 3.4)));
        drawCell(item.c3 || '', col.qty.x + col.qty.w / 2, y + 4, { size: 8, align: 'center', maxWidth: col.qty.w - 2 });
        drawCell(item.c4 || '', col.unit.x + col.unit.w / 2, y + 4, { size: 8, align: 'center', maxWidth: col.unit.w - 2 });
        drawCell(item.c5 || '', col.rate.x + col.rate.w - 2, y + 4, { size: 8, align: 'right', maxWidth: col.rate.w - 2 });
        drawCell(item.c6 || '', col.amount.x + col.amount.w - 2, y + 4, { bold: true, size: 8, align: 'right', maxWidth: col.amount.w - 2 });

        y += rowH;
        vLine(col.desc.x, rowTop, y);
        vLine(col.qty.x, rowTop, y);
        vLine(col.unit.x, rowTop, y);
        vLine(col.rate.x, rowTop, y);
        vLine(col.amount.x, rowTop, y);
    });

    // ✅ PRO FEATURE: Table Stretch & Footer Lock
    if (y + FOOTER_H > pageBottom) {
        hLine(y);
        closeFrame(y);
        doc.addPage();
        y = M;
        drawTableHeader(); 
    }

    const footerStartY = pageBottom - FOOTER_H;
    if (y < footerStartY) {
        vLine(col.desc.x, y, footerStartY);
        vLine(col.qty.x, y, footerStartY);
        vLine(col.unit.x, y, footerStartY);
        vLine(col.rate.x, y, footerStartY);
        vLine(col.amount.x, y, footerStartY);
        y = footerStartY;
    }
    hLine(y);

    // TOTALS TEXT
    const tLines = doc.splitTextToSize(data.totalsText || '', W - 4);
    const totalsTop = y;
    y += 4;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    tLines.forEach(line => { doc.text(line, M + W - 2, y, { align: 'right' }); y += 4; });
    vLine(col.amount.x, totalsTop, y);
    hLine(y);

    // GRAND TOTAL
    doc.setFillColor(242, 246, 249);
    doc.rect(M, y, W, 7.5, 'F');
    y += 5.2;
    drawCell(data.grandTotalLabel || 'GRAND TOTAL', col.amount.x - 2, y, {
        bold: true, size: 10.5, align: 'right', color: [26, 58, 92]
    });
    drawCell(data.grandTotalValue || '', M + W - 2, y, {
        bold: true, size: 11.5, align: 'right', color: [26, 58, 92], maxWidth: col.amount.w - 2
    });
    y += 2.3;
    vLine(col.amount.x, y - 7.5, y);
    hLine(y);

    // WORDS
    y += 3.5;
    drawCell('Amount Chargeable (in words):', M + 3, y, { bold: true, size: 8.5 });
    drawCell('E. & O.E', M + W - 3, y, { italic: true, size: 7.5, align: 'right' });
    y += 4.5;
    drawCell(data.amountInWords || '', M + 3, y, { bold: true, size: 9.5, color: [26, 58, 92], maxWidth: W - 10 });
    y += 3; hLine(y);

    // BANK + SIGN
    const bottomBoxTop = y;
    let bankY = y + 3.5;
    drawCell("Company's Bank Details", M + 3, bankY, { bold: true, size: 9 });
    bankY += 4;
    const bx = M + 3, by = M + 26;
    drawCell('A/c Holder:', bx, bankY, { bold: true, size: 8 });
    drawCell(settings.companyName || 'Al Bowry Carpentry LLC', by, bankY, { bold: true, size: 8, maxWidth: splitX - by - 2 });
    bankY += 3.5;
    drawCell('Bank Name:', bx, bankY, { bold: true, size: 8 });
    drawCell(settings.bankName || '-', by, bankY, { size: 8, maxWidth: splitX - by - 2 });
    bankY += 3.5;
    drawCell('A/c No.:', bx, bankY, { bold: true, size: 8 });
    drawCell(settings.bankAccount || settings.bankAc || '-', by, bankY, { bold: true, size: 8, maxWidth: splitX - by - 2 });
    bankY += 3.5;
    drawCell('IBAN:', bx, bankY, { bold: true, size: 8 });
    drawCell(settings.bankIban || '-', by, bankY, { size: 8, maxWidth: splitX - by - 2 });
    bankY += 2;

    const boxBottomY = Math.max(bankY + 1, bottomBoxTop + SIG_H + 10);
    drawCell(`For ${settings.companyName || 'Al Bowry Carpentry LLC'}`, M + W - 3, bottomBoxTop + 3.5, {
        bold: true, size: 9, align: 'right', maxWidth: (W - splitX) - 5
    });
    if (settings.signatureUrl || settings.stampUrl) {
        try {
            const img = settings.signatureUrl || settings.stampUrl;
            const rW = (M + W) - splitX;
            const sigX = splitX + (rW - SIG_W) / 2;
            doc.addImage(img, 'PNG', sigX, bottomBoxTop + 5, SIG_W, SIG_H);
        } catch (e) {}
    }
    drawCell('Authorised Signatory', M + W - 3, boxBottomY - 2.5, {
        bold: true, size: 8.5, align: 'right'
    });
    vLine(splitX, bottomBoxTop, boxBottomY);
    hLine(boxBottomY);
    y = boxBottomY;

    // CONTACT
    y += 3.5;
    const cw = W / 3;
    drawCell('Contact:', M + 3, y, { bold: true, size: 8 });
    drawCell(settings.phone || '-', M + 18, y, { size: 8, maxWidth: cw - 20 });
    drawCell('Website:', M + cw + 3, y, { bold: true, size: 8 });
    drawCell(settings.website || '-', M + cw + 18, y, { size: 8, maxWidth: cw - 20 });
    drawCell('E-Mail:', M + 2 * cw + 3, y, { bold: true, size: 8 });
    drawCell(settings.email || '-', M + 2 * cw + 16, y, { size: 8, maxWidth: cw - 20 });
    y += 3; hLine(y);

    closeFrame(y);
    drawCell('This is a Computer Generated Document', pageW / 2, y + 4.5, {
        italic: true, size: 7.5, align: 'center', color: [100, 100, 100]
    });

    if (preview) {
        window.open(doc.output('bloburl'), '_blank');
    } else {
        doc.save(`Manual_${(data.docTitle || 'Doc').replace(/\s+/g, '_')}.pdf`);
        showToast('PDF downloaded!', 'success');
    }
}
