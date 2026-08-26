// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Invoice PDF Generator (FIXED v2)
// Exact Tripzar-style layout, Navy Blue theme, AED + VAT
// All alignment issues fixed!
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

    // ─── OUTER BORDER ───
    doc.setDrawColor(0);
    doc.setLineWidth(0.4);
    doc.rect(margin, margin, pageW - 2*margin, pageH - 2*margin);

    // ─── TITLE: "Tax Invoice" centered ───
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Tax Invoice', pageW/2, y + 7, { align: 'center' });
    y += 9;
    doc.line(margin, y, pageW - margin, y);
    y += 2;

    // ─── LOGO (Center) ───
    if (settings.logoUrl) {
        try {
            doc.addImage(settings.logoUrl, 'PNG', pageW/2 - 20, y + 2, 40, 30);
        } catch(e) {}
    }
    y += 32;

    // ─── COMPANY HEADER ───
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(26, 58, 92); // Navy Blue
    doc.text(settings.companyName.toUpperCase(), pageW/2, y, { align: 'center' });
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(80, 80, 80);
    
    const addrLines = doc.splitTextToSize(settings.address, 120);
    addrLines.forEach(line => {
        doc.text(line, pageW/2, y, { align: 'center' });
        y += 4;
    });
    y += 1;
    doc.text('United Arab Emirates', pageW/2, y, { align: 'center' });
    y += 5;

    // TRN
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const trnText = settings.trn && settings.trn !== 'N/A' ? settings.trn : 'Not Set';
    doc.text(`TRN: ${trnText}`, pageW/2, y, { align: 'center' });
    y += 6;

    // ─── CONTACT ROW BOX ───
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 5;
    
    const col1 = margin + 3;
    const col2 = margin + 75;
    const col3 = margin + 135;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0,0,0);
    
    // Contact
    doc.text('Contact:', col1, y);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.phone || 'N/A', col1 + 18, y);
    
    // Website
    doc.setFont('helvetica', 'bold');
    doc.text('Website:', col2, y);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.website || 'N/A', col2 + 20, y);
    
    // Email
    doc.setFont('helvetica', 'bold');
    doc.text('E-Mail:', col3, y);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.email || 'N/A', col3 + 15, y);
    
    y += 4;
    doc.line(margin, y, pageW - margin, y);
    y += 2;

    // ─── BUYER + INVOICE INFO (2-Column Box) ───
    const boxTop = y;
    const boxH = 38;
    const midX = pageW - margin - 75;

    // Left: Buyer
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0,0,0);
    doc.text('Buyer (Bill to):', col1, y + 6);
    
    doc.setFontSize(10);
    doc.text(invoice.customerName || 'N/A', col1, y + 11);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    let ly = y + 15;
    // Address lines
    const custAddr = doc.splitTextToSize(invoice.customerAddress || 'N/A', 90);
    custAddr.forEach(line => {
        doc.text(line, col1, ly);
        ly += 4;
    });
    if (invoice.customerPhone) {
        doc.text(`Phone: ${invoice.customerPhone}`, col1, ly);
        ly += 4;
    }
    if (invoice.customerTRN) {
        doc.setFont('helvetica', 'bold');
        doc.text(`TRN: ${invoice.customerTRN}`, col1, ly);
    }

    // Right: Invoice Info
    const infoX = midX + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    
    doc.text('Invoice No.:', infoX, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoiceNumber || 'N/A', infoX + 24, y + 6);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Dated:', infoX, y + 11);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(invoice.date), infoX + 24, y + 11);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Mode/Terms:', infoX, y + 16);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.paymentTerms || 'Cash', infoX + 24, y + 21);
    
    if (invoice.lpoNumber) {
        doc.setFont('helvetica', 'bold');
        doc.text('LPO No.:', infoX, y + 26);
        doc.setFont('helvetica', 'normal');
        doc.text(invoice.lpoNumber, infoX + 24, y + 26);
    }
    
    // Border for this box
    doc.line(margin, boxTop, margin, boxTop + boxH);
    doc.line(midX - 5, boxTop, midX - 5, boxTop + boxH);
    doc.line(pageW - margin, boxTop, pageW - margin, boxTop + boxH);
    doc.line(margin, boxTop + boxH, pageW - margin, boxTop + boxH);
    
    y = boxTop + boxH;

    // ─── PROJECT NAME ROW (Optional) ───
    if (invoice.projectName) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(0, 0, 0);
        doc.text('Project:', col1, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.text(invoice.projectName, col1 + 18, y + 5);
        y += 7;
        doc.line(margin, y, pageW - margin, y);
    }

    // ─── ITEMS TABLE ───
    const tHeader = y;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setFillColor(230, 230, 230);
    doc.rect(margin, y, pageW - 2*margin, 9, 'F');
    
    // Column positions
    const cSlNo = margin + 2;
    const cDesc = margin + 14;
    const cQty = margin + 115;
    const cUnit = margin + 135;
    const cRate = margin + 155;
    const cAmt = pageW - margin - 3;
    
    // Headers
    doc.text('Sl', cSlNo + 2, y + 5);
    doc.text('No.', cSlNo + 2, y + 8); // Sl no
    doc.text('Particulars', cDesc + 15, y + 5, { align: 'center' });
    doc.text('Qty', cQty + 8, y + 5, { align: 'center' });
    doc.text('Unit', cUnit + 8, y + 5, { align: 'center' });
    doc.text('Rate', cRate + 8, y + 5, { align: 'center' });
    doc.text('Amount (AED)', cAmt, y + 5, { align: 'right' });
    
    // Column vertical lines
    doc.line(margin + 11, y, margin + 11, y + 9);
    doc.line(cQty, y, cQty, y + 9);
    doc.line(cUnit, y, cUnit, y + 9);
    doc.line(cRate, y, cRate, y + 9);
    
    y += 9;
    doc.line(margin, y, pageW - margin, y);

    // Items
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    
    invoice.items.forEach((item, idx) => {
        const descLines = doc.splitTextToSize(item.description || 'N/A', 95);
        const rowH = Math.max(7, descLines.length * 4 + 2);
        
        doc.text(String(idx + 1), cSlNo + 2, y + 4);
        doc.setFont('helvetica', 'bold');
        doc.text(descLines[0] || '', cDesc, y + 4);
        doc.setFont('helvetica', 'normal');
        for (let i = 1; i < descLines.length; i++) {
            doc.setFontSize(7.5);
            doc.text(descLines[i], cDesc, y + 4 + (i * 4));
            doc.setFontSize(8.5);
        }
        
        doc.text(formatNum(item.qty), cQty + 8, y + 4, { align: 'center' });
        doc.text(item.unit || 'Nos', cUnit + 8, y + 4, { align: 'center' });
        doc.text(formatNum(item.rate), cRate + 8, y + 4, { align: 'right' });
        doc.text(formatNum(item.amount), cAmt, y + 4, { align: 'right' });
        
        y += rowH;
        // Vertical lines through row
        doc.line(margin + 11, y - rowH, margin + 11, y);
        doc.line(cQty, y - rowH, cQty, y);
        doc.line(cUnit, y - rowH, cUnit, y);
        doc.line(cRate, y - rowH, cRate, y);
        doc.line(cRate + 16, y - rowH, cRate + 16, y);
    });

    // Sub Total Row
    y += 2;
    doc.line(margin, y, pageW - margin, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Sub Total', cRate + 8, y, { align: 'right' });
    doc.text(formatNum(invoice.subTotal), cAmt, y, { align: 'right' });
    y += 4;

    // Discount
    if (invoice.discount > 0) {
        doc.setFont('helvetica', 'normal');
        doc.text('Discount', cRate + 8, y, { align: 'right' });
        doc.text('- ' + formatNum(invoice.discount), cAmt, y, { align: 'right' });
        y += 4;
    }

    // VAT Row
    if (invoice.vatEnabled) {
        doc.setFont('helvetica', 'bold');
        doc.text(`OUTPUT VAT @ ${invoice.vatRate}%`, cRate + 8, y, { align: 'right' });
        doc.text(formatNum(invoice.vatAmount), cAmt, y, { align: 'right' });
        y += 4;
    }

    // Round Off Row
    if (invoice.roundOff > 0) {
        doc.setFont('helvetica', 'normal');
        doc.text('Round Off', cRate + 8, y, { align: 'right' });
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
    doc.text('Total', cRate + 8, y, { align: 'right' });
    doc.text(`AED ${formatNum(invoice.grandTotal)}`, cAmt, y, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    y += 5;
    doc.line(margin, y, pageW - margin, y);

    // Amount in Words
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Amount Chargeable (in words):', col1, y);
    
    // Right align "E. & O.E" on the same line
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text('E. & O.E', pageW - margin - 3, y, { align: 'right' });
    
    // Amount in words below
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(numberToWords(invoice.grandTotal), col1 + 55, y + 5);
    
    y += 10;
    doc.line(margin, y, pageW - margin, y);

    // ─── VAT ANALYSIS (Only if VAT enabled) ───
    if (invoice.vatEnabled) {
        y += 3;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text('VAT Analysis', pageW/2, y, { align: 'center' });
        y += 4;
        doc.line(margin, y, pageW - margin, y);
        y += 2;
        
        // Headers
        doc.setFillColor(245, 245, 245);
        doc.rect(margin, y, pageW - 2*margin, 6.5, 'F');
        doc.setFontSize(8);
        
        // Header positions
        const hTaxable = margin + 40;
        const hRate = margin + 90;
        const hVAT = margin + 130;
        const hTotalTax = pageW - margin - 25;
        
        doc.text('Taxable Value', hTaxable, y + 4, { align: 'center' });
        doc.text('VAT Rate', hRate, y + 4, { align: 'center' });
        doc.text('VAT Amount', hVAT, y + 4, { align: 'center' });
        doc.text('Total Tax Amount', hTotalTax, y + 4, { align: 'center' });
        y += 6.5;
        
        // Horizontal lines
        doc.line(margin, y, pageW - margin, y);
        y += 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text(formatNum(invoice.taxable), hTaxable, y, { align: 'center' });
        doc.text(`${invoice.vatRate}%`, hRate, y, { align: 'center' });
        doc.text(formatNum(invoice.vatAmount), hVAT, y, { align: 'center' });
        doc.text(formatNum(invoice.vatAmount), hTotalTax, y, { align: 'center' });
        y += 4;
        doc.line(margin, y, pageW - margin, y);
        
        y += 4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('Tax Amount (in words):', col1, y);
        doc.setFont('helvetica', 'normal');
        doc.text(numberToWords(invoice.vatAmount), col1, y + 5);
        y += 10;
        doc.line(margin, y, pageW - margin, y);
    }

    // ─── BANK DETAILS ───
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text("Company's Bank Details", midX, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    y += 5;
    
    const bankX = midX + 2;
    doc.setFont('helvetica', 'bold');
    doc.text('A/c Holder:', bankX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.companyName, bankX + 24, y);
    y += 4;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Bank Name:', bankX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.bankName || 'N/A', bankX + 24, y);
    y += 4;
    
    doc.setFont('helvetica', 'bold');
    doc.text('A/c No.:', bankX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.bankAccount || 'N/A', bankX + 24, y);
    y += 4;
    
    doc.setFont('helvetica', 'bold');
    doc.text('IBAN:', bankX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.bankIban || 'N/A', bankX + 24, y);
    y += 4;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Branch:', bankX, y);
    doc.setFont('helvetica', 'normal');
    doc.text(settings.bankBranch || 'N/A', bankX + 24, y);
    y += 7;
    
    doc.line(margin, y, pageW - margin, y);

    // ─── DECLARATION + NOTES ───
    y += 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text('Declaration / Terms:', col1, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const notes = invoice.notes || settings.invoiceNotes || '';
    const noteLines = doc.splitTextToSize(notes, 110);
    let ny = y + 5;
    noteLines.slice(0, 6).forEach(line => {
        doc.text(line, col1, ny);
        ny += 3.5;
    });

    // For Company
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`For ${settings.companyName}`, pageW - margin - 5, y + 5, { align: 'right' });
    doc.text('Authorised Signatory', pageW - margin - 5, y + 25, { align: 'right' });
    
    y = Math.max(ny, y + 28) + 2;
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
