// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Invoice PDF Generator
// Exact Tripzar-style layout, Navy Blue theme, AED + VAT
// ═══════════════════════════════════════════════════════

function generateInvoicePDF(invoiceId, preview = false) {
    const invoice = DB.get(DB_KEYS.INVOICES).find(i => i.id === invoiceId);
    if (!invoice) return showToast('Invoice not found', 'error');
    const settings = DB.getSettings();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    
    const margin = 10;
    let y = margin;

    // Border
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(margin, margin, pageW - 2*margin, pageH - 2*margin);

    // ─── TITLE: "Tax Invoice" centered ───
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Tax Invoice', pageW/2, y + 6, { align: 'center' });
    doc.line(margin, y + 8, pageW - margin, y + 8);
    y += 8;

    // ─── LOGO (Center) ───
    if (settings.logoUrl) {
        try {
            doc.addImage(settings.logoUrl, 'PNG', pageW/2 - 15, y + 2, 30, 25);
        } catch(e) {}
    }
    y += 28;

    // ─── COMPANY HEADER ───
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(26, 58, 92); // Navy Blue
    doc.text(settings.companyName.toUpperCase(), pageW/2, y, { align: 'center' });
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    
    const addrLines = doc.splitTextToSize(settings.address, 100);
    addrLines.forEach(line => {
        doc.text(line, pageW/2, y, { align: 'center' });
        y += 3.5;
    });
    doc.text('United Arab Emirates', pageW/2, y, { align: 'center' });
    y += 4;

    // TRN
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`TRN: ${settings.trn || 'N/A'}`, pageW/2, y, { align: 'center' });
    y += 6;

    // ─── CONTACT ROW ───
    doc.setDrawColor(0);
    doc.line(margin, y, pageW - margin, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0,0,0);
    
    const col1 = margin + 3;
    const col2 = margin + 65;
    const col3 = margin + 130;
    
    doc.text('Contact:', col1, y);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.phone || '', col1 + 18, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Website:', col2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.website || '', col2 + 18, y);
    
    doc.setFont('helvetica', 'bold');
    doc.text('E-Mail:', col3, y);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.email || '', col3 + 14, y);
    y += 4;
    doc.line(margin, y, pageW - margin, y);
    y += 2;

    // ─── BUYER + INVOICE INFO (2-Column Box) ───
    const boxTop = y;
    const boxH = 32;
    const midX = pageW - margin - 65;

    // Left: Buyer
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Buyer (Bill to):', col1, y + 5);
    doc.setFontSize(10);
    doc.text(invoice.customerName || '', col1, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const custAddr = doc.splitTextToSize(invoice.customerAddress || '', 90);
    let ly = y + 14;
    custAddr.forEach(line => {
        doc.text(line, col1, ly);
        ly += 3.5;
    });
    if (invoice.customerPhone) {
        doc.text(`Phone: ${invoice.customerPhone}`, col1, ly);
        ly += 3.5;
    }
    if (invoice.customerTRN) {
        doc.setFont('helvetica', 'bold');
        doc.text(`TRN: ${invoice.customerTRN}`, col1, ly);
    }

    // Right: Invoice Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Invoice No.:', midX, y + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoiceNumber, midX + 22, y + 5);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Dated:', midX, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(invoice.date), midX + 22, y + 10);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Mode/Terms:', midX, y + 15);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.paymentTerms || 'Cash', midX + 22, y + 20);
    
    if (invoice.lpoNumber) {
        doc.setFont('helvetica', 'bold');
        doc.text('LPO No.:', midX, y + 25);
        doc.setFont('helvetica', 'normal');
        doc.text(invoice.lpoNumber, midX + 22, y + 25);
    }
    
    doc.line(margin, boxTop, margin, boxTop + boxH);
    doc.line(midX - 3, boxTop, midX - 3, boxTop + boxH);
    doc.line(pageW - margin, boxTop, pageW - margin, boxTop + boxH);
    doc.line(margin, boxTop + boxH, pageW - margin, boxTop + boxH);
    y = boxTop + boxH;

    // ─── PROJECT NAME ROW (Optional) ───
    if (invoice.projectName) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('Project:', col1, y + 4);
        doc.setFont('helvetica', 'normal');
        doc.text(invoice.projectName, col1 + 15, y + 4);
        y += 6;
        doc.line(margin, y, pageW - margin, y);
    }

    // ─── ITEMS TABLE ───
    const tHeader = y + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, pageW - 2*margin, 8, 'F');
    
    // Column widths
    const cSlNo = margin + 8;
    const cDesc = margin + 12;
    const cQty = margin + 115;
    const cUnit = margin + 135;
    const cRate = margin + 155;
    const cAmt = pageW - margin - 3;
    
    doc.text('Sl', margin + 2, y + 5);
    doc.text('No.', margin + 2, y + 8);
    doc.text('Particulars', cDesc + 30, y + 5, { align: 'center' });
    doc.text('Qty', cQty + 8, y + 5, { align: 'center' });
    doc.text('Unit', cUnit + 8, y + 5, { align: 'center' });
    doc.text('Rate', cRate + 8, y + 5, { align: 'center' });
    doc.text('Amount (AED)', cAmt, y + 5, { align: 'right' });
    
    // Column vertical lines
    doc.line(margin + 10, y, margin + 10, y + 8);
    doc.line(cQty, y, cQty, y + 8);
    doc.line(cUnit, y, cUnit, y + 8);
    doc.line(cRate, y, cRate, y + 8);
    doc.line(cRate + 18, y, cRate + 18, y + 8);
    
    y += 8;
    doc.line(margin, y, pageW - margin, y);

    // Items
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0,0,0);
    
    invoice.items.forEach((item, idx) => {
        const descLines = doc.splitTextToSize(item.description || '', 100);
        const rowH = Math.max(6, descLines.length * 3.8 + 2);
        
        doc.text(String(idx + 1), margin + 5, y + 4, { align: 'center' });
        
        doc.setFont('helvetica', 'bold');
        doc.text(descLines[0] || '', cDesc, y + 4);
        doc.setFont('helvetica', 'normal');
        for (let i = 1; i < descLines.length; i++) {
            doc.setFontSize(7.5);
            doc.text(descLines[i], cDesc, y + 4 + (i * 3.5));
            doc.setFontSize(8.5);
        }
        
        doc.text(formatNum(item.qty), cQty + 8, y + 4, { align: 'center' });
        doc.text(item.unit || 'Nos', cUnit + 8, y + 4, { align: 'center' });
        doc.text(formatNum(item.rate), cRate + 15, y + 4, { align: 'right' });
        doc.text(formatNum(item.amount), cAmt, y + 4, { align: 'right' });
        
        y += rowH;
        // Vertical lines through row
        doc.line(margin + 10, y - rowH, margin + 10, y);
        doc.line(cQty, y - rowH, cQty, y);
        doc.line(cUnit, y - rowH, cUnit, y);
        doc.line(cRate, y - rowH, cRate, y);
        doc.line(cRate + 18, y - rowH, cRate + 18, y);
    });

    // Sub Total Row
    y += 2;
    doc.line(margin, y, pageW - margin, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Sub Total', cRate + 15, y, { align: 'right' });
    doc.text(formatNum(invoice.subTotal), cAmt, y, { align: 'right' });
    y += 4;

    // Discount
    if (invoice.discount > 0) {
        doc.setFont('helvetica', 'normal');
        doc.text('Discount', cRate + 15, y, { align: 'right' });
        doc.text('- ' + formatNum(invoice.discount), cAmt, y, { align: 'right' });
        y += 4;
    }

    // VAT Row
    if (invoice.vatEnabled) {
        doc.setFont('helvetica', 'bold');
        doc.text(`OUTPUT VAT @ ${invoice.vatRate}%`, cRate + 15, y, { align: 'right' });
        doc.text(formatNum(invoice.vatAmount), cAmt, y, { align: 'right' });
        y += 4;
    }

    // Round Off
    if (invoice.roundOff > 0) {
        doc.setFont('helvetica', 'normal');
        doc.text('Round Off', cRate + 15, y, { align: 'right' });
        const sign = invoice.roundOffType === 'add' ? '(+)' : '(-)';
        doc.text(`${sign} ${formatNum(invoice.roundOff)}`, cAmt, y, { align: 'right' });
        y += 4;
    }

    // Grand Total Line
    y += 1;
    doc.line(margin, y, pageW - margin, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(26, 58, 92);
    doc.text('Total', cRate + 15, y, { align: 'right' });
    doc.text(`AED ${formatNum(invoice.grandTotal)}`, cAmt, y, { align: 'right' });
    doc.setTextColor(0,0,0);
    y += 4;
    doc.line(margin, y, pageW - margin, y);

    // Amount in Words
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Amount Chargeable (in words):', col1, y);
    doc.setFont('helvetica', 'bold');
    doc.text(numberToWords(invoice.grandTotal), col1 + 55, y);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text('E. & O.E', pageW - margin - 3, y, { align: 'right' });
    y += 4;
    doc.line(margin, y, pageW - margin, y);

    // ─── VAT ANALYSIS (Only if VAT enabled) ───
    if (invoice.vatEnabled) {
        y += 4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('VAT Analysis', pageW/2, y, { align: 'center' });
        y += 3;
        doc.line(margin, y, pageW - margin, y);
        y += 1;
        
        // Headers
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y, pageW - 2*margin, 6, 'F');
        doc.setFontSize(8);
        doc.text('Taxable Value', margin + 40, y + 4, { align: 'center' });
        doc.text('VAT Rate', margin + 90, y + 4, { align: 'center' });
        doc.text('VAT Amount', margin + 130, y + 4, { align: 'center' });
        doc.text('Total Tax Amount', pageW - margin - 15, y + 4, { align: 'center' });
        y += 6;
        doc.line(margin, y, pageW - margin, y);
        
        doc.setFont('helvetica', 'normal');
        y += 5;
        doc.text(formatNum(invoice.taxable), margin + 40, y, { align: 'center' });
        doc.text(`${invoice.vatRate}%`, margin + 90, y, { align: 'center' });
        doc.text(formatNum(invoice.vatAmount), margin + 130, y, { align: 'center' });
        doc.text(formatNum(invoice.vatAmount), pageW - margin - 15, y, { align: 'center' });
        y += 3;
        doc.line(margin, y, pageW - margin, y);
        
        y += 4;
        doc.setFont('helvetica', 'bold');
        doc.text('Tax Amount (in words):', col1, y);
        doc.setFont('helvetica', 'normal');
        doc.text(numberToWords(invoice.vatAmount), col1, y + 4);
        y += 8;
        doc.line(margin, y, pageW - margin, y);
    }

    // ─── BANK DETAILS ───
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text("Company's Bank Details", midX, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('A/c Holder:', midX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.companyName, midX + 22, y);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('Bank Name:', midX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.bankName || '', midX + 22, y);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('A/c No.:', midX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.bankAccount || '', midX + 22, y);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('IBAN:', midX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.bankIban || '', midX + 22, y);
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.text('Branch:', midX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.bankBranch || '', midX + 22, y);
    y += 6;
    
    doc.line(margin, y, pageW - margin, y);

    // ─── DECLARATION + NOTES ───
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Declaration / Terms:', col1, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const notes = invoice.notes || settings.invoiceNotes || '';
    const noteLines = doc.splitTextToSize(notes, 110);
    let ny = y + 4;
    noteLines.slice(0, 5).forEach(line => {
        doc.text(line, col1, ny);
        ny += 3;
    });

    // For Company
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`For ${settings.companyName}`, pageW - margin - 3, y + 4, { align: 'right' });
    doc.text('Authorised Signatory', pageW - margin - 3, y + 22, { align: 'right' });
    
    y = Math.max(ny, y + 25) + 3;
    doc.line(margin, y, pageW - margin, y);
    
    // Signature Lines
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text("Customer's Seal and Signature", col1, y);
    doc.text('Authorised Signatory', pageW - margin - 3, y, { align: 'right' });
    
    y += 4;
    doc.line(margin, y, pageW - margin, y);
    y += 4;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.text('This is a Computer Generated Invoice', pageW/2, y, { align: 'center' });

    // ─── OUTPUT ───
    const filename = `Invoice_${invoice.invoiceNumber.replace(/\//g,'-')}.pdf`;
    
    if (preview) {
        window.open(doc.output('bloburl'), '_blank');
    } else {
        doc.save(filename);
        showToast('PDF downloaded!', 'success');
    }
}