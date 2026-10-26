const { jsPDF } = window.jspdf;

// Helper: Format Money
function formatMoney(num) {
    let val = parseFloat(num);
    if (isNaN(val)) return num || '';
    return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Helper: Get Base64 Image
function getBase64ImageFromURL(url) {
    return new Promise((resolve) => {
        if (!url) { resolve(null); return; }
        var img = new Image();
        img.setAttribute("crossOrigin", "anonymous");
        img.onload = function () {
            var canvas = document.createElement("canvas");
            canvas.width = this.width;
            canvas.height = this.height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(this, 0, 0);
            var dataURL = canvas.toDataURL("image/png");
            resolve(dataURL);
        };
        img.onerror = function () { resolve(null); };
        img.src = url;
    });
}

// Helper: Get Settings safely
function getSafeSettings() {
    if (typeof DB !== 'undefined' && typeof DB.getSettings === 'function') {
        return DB.getSettings();
    }
    return JSON.parse(localStorage.getItem('albowry_settings')) || {};
}

// ==========================================
// 1. STANDARD INVOICE GENERATOR
// ==========================================
async function generateInvoicePDF(invoiceId, preview = false) {
    try {
        // Safe Invoice Fetch (Fixes "DB.getInvoice is not a function")
        let invoices = [];
        if (typeof DB !== 'undefined' && typeof DB.getInvoices === 'function') {
            invoices = DB.getInvoices();
        } else {
            invoices = JSON.parse(localStorage.getItem('albowry_invoices')) || [];
        }
        
        const invoice = invoices.find(i => String(i.id) === String(invoiceId));
        if (!invoice) throw new Error("Invoice not found in Database!");

        const settings = getSafeSettings();

        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const M = 10;
        const pageW = 210;
        const pageH = 297;
        const W = pageW - 2 * M;
        const W_HALF = pageW / 2;
        const primaryColor = [26, 58, 92];

        let y = M;
        const maxPageY = pageH - M; // 287
        const footerH = 65; // Totals(24) + Words(11) + Bank(30)
        const yLimit = maxPageY - footerH; // 222

        const drawFrame = () => {
            doc.setDrawColor(...primaryColor);
            doc.setLineWidth(0.6);
            doc.rect(M, M, W, pageH - 2 * M, 'S');
        };

        const drawVertLines = (startY, endY) => {
            doc.setDrawColor(...primaryColor);
            doc.setLineWidth(0.4);
            doc.line(22, startY, 22, endY);
            doc.line(120, startY, 120, endY);
            doc.line(140, startY, 140, endY);
            doc.line(160, startY, 160, endY);
            doc.line(180, startY, 180, endY);
        };

        // Initialize Page 1
        drawFrame();

        // Header Section
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.6);
        doc.rect(M, y, W, 8, 'S');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...primaryColor);
        doc.text("TAX INVOICE", W_HALF, y + 5.5, { align: "center" });

        y += 8;
        const logoImg = await getBase64ImageFromURL(settings.logoUrl || 'public/logo.png');
        if (logoImg) {
            doc.addImage(logoImg, 'PNG', W_HALF - 12, y + 2, 24, 24);
        }

        y += 28;
        doc.setFontSize(14);
        doc.text(settings.companyName || "Al Bowry Carpentry LLC", W_HALF, y, { align: "center" });
        y += 5;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(settings.address || "", W_HALF, y, { align: "center" });
        y += 5;
        doc.text(`TRN: ${settings.trn || ""}`, W_HALF, y, { align: "center" });
        
        y += 5;
        doc.setLineWidth(0.4);
        doc.line(M, y, pageW - M, y);
        y += 4;

        // Buyer & Meta Section
        let buyerTopY = y - 4;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text("Buyer (Bill to):", 12, y);
        doc.setFontSize(10);
        y += 5;
        let leftY = y;
        
        const bName = invoice.buyerInfo ? invoice.buyerInfo.name : (invoice.customerName || "");
        const bAddr = invoice.buyerInfo ? invoice.buyerInfo.address : "";
        const bTrn = invoice.buyerInfo ? invoice.buyerInfo.trn : "";

        const buyerLines = doc.splitTextToSize(bName, 90);
        doc.text(buyerLines, 12, leftY);
        leftY += (buyerLines.length * 5);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const addrLines = doc.splitTextToSize(bAddr, 90);
        doc.text(addrLines, 12, leftY);
        leftY += (addrLines.length * 4);
        doc.setFont("helvetica", "bold");
        if (bTrn) doc.text(`TRN: ${bTrn}`, 12, leftY);
        leftY += 5;

        let rightY = buyerTopY + 5;
        doc.setFontSize(8);
        doc.text("Invoice No. :", 105, rightY);
        doc.text(invoice.invoiceNo || "", 130, rightY);
        rightY += 6;
        doc.text("Dated :", 105, rightY);
        doc.text(invoice.date || "", 130, rightY);
        rightY += 6;
        doc.text("Mode/Terms :", 105, rightY);
        doc.setFont("helvetica", "normal");
        doc.text(invoice.paymentMode || 'Cash', 130, rightY);
        rightY += 6;

        y = Math.max(leftY, rightY) + 2;
        doc.line(M, y, pageW - M, y); // End Buyer Box
        
        // Table Headers
        doc.line(105, buyerTopY, 105, y); // Vertical separator for buyer
        let tableStartY = y;
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        y += 5;
        doc.text("Sl No", 16, y, { align: "center" });
        doc.text("Particulars", 24, y);
        doc.text("Qty", 130, y, { align: "center" });
        doc.text("Unit", 150, y, { align: "center" });
        doc.text("Rate", 170, y, { align: "center" });
        doc.text("Amount (AED)", 190, y, { align: "center" });
        
        y += 3;
        doc.line(M, y, pageW - M, y);
        
        // Items Loop
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        let totalQty = 0;
        let itemsArray = invoice.items || [];

        for (let i = 0; i < itemsArray.length; i++) {
            const item = itemsArray[i];
            const lines = doc.splitTextToSize(item.part || item.particulars || "", 94);
            const rowH = Math.max(8, lines.length * 5 + 3);

            // Handle Page Break strictly at yLimit
            if (y + rowH > yLimit) {
                drawVertLines(tableStartY, maxPageY);
                doc.setFontSize(8);
                doc.text("Continued on next page...", W_HALF, maxPageY - 2, { align: "center" });
                
                doc.addPage();
                drawFrame();
                
                y = M;
                tableStartY = y;
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                doc.text("Sl No", 16, y + 5, { align: "center" });
                doc.text("Particulars", 24, y + 5);
                doc.text("Qty", 130, y + 5, { align: "center" });
                doc.text("Unit", 150, y + 5, { align: "center" });
                doc.text("Rate", 170, y + 5, { align: "center" });
                doc.text("Amount (AED)", 190, y + 5, { align: "center" });
                y += 8;
                doc.line(M, y, pageW - M, y);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
            }

            let textY = y + 5;
            doc.text((i + 1).toString(), 16, textY, { align: "center" });
            doc.text(lines, 24, textY);
            doc.text(formatMoney(item.qty), 138, textY, { align: "right" });
            doc.text(item.unit || "", 150, textY, { align: "center" });
            doc.text(formatMoney(item.rate), 178, textY, { align: "right" });
            doc.text(formatMoney(item.amt || item.amount), 198, textY, { align: "right" });
            
            totalQty += parseFloat(item.qty) || 0;
            y += rowH;
        }

        // Close Items Area securely at yLimit
        drawVertLines(tableStartY, yLimit);
        doc.line(M, yLimit, pageW - M, yLimit);
        
        y = yLimit; 
        
        // Totals Section (24mm height)
        doc.line(120, y, 120, y + 24);
        doc.line(180, y, 180, y + 24);
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(`Total Qty: ${formatMoney(totalQty)}`, 115, y + 5, { align: "right" });
        doc.text("Sub Total", 177, y + 5, { align: "right" });
        doc.text(formatMoney(invoice.subTotal), 198, y + 5, { align: "right" });
        y += 8;
        doc.line(120, y, pageW - M, y);
        
        doc.text("OUTPUT VAT @ 5%", 177, y + 5, { align: "right" });
        doc.text(formatMoney(invoice.tax || invoice.vat), 198, y + 5, { align: "right" });
        y += 8;
        doc.line(120, y, pageW - M, y);
        
        doc.text("GRAND TOTAL", 177, y + 5, { align: "right" });
        doc.text(`AED ${formatMoney(invoice.grandTotal || invoice.total)}`, 198, y + 5, { align: "right" });
        y += 8;
        doc.line(M, y, pageW - M, y);
        
        // Amount in Words (11mm height)
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("Amount Chargeable (in words):", 12, y + 4);
        doc.setFont("helvetica", "bold");
        // Safe check for numberToWords
        let words = typeof numberToWords === 'function' ? numberToWords(invoice.grandTotal || invoice.total) : "";
        doc.text(`AED ${words} Only`, 12, y + 9);
        y += 11;
        doc.line(M, y, pageW - M, y);

        // Bank Details & Signature (30mm height)
        doc.line(120, y, 120, maxPageY);
        doc.setFont("helvetica", "bold");
        doc.text("Company's Bank Details", 12, y + 4);
        doc.setFont("helvetica", "normal");
        doc.text("A/c Name:", 12, y + 9);
        doc.text("Bank Name:", 12, y + 13);
        doc.text("A/c No.:", 12, y + 17);
        doc.text("IBAN:", 12, y + 21);
        
        doc.setFont("helvetica", "bold");
        doc.text(settings.bankName || "Al Bowry Carpentry LLC", 35, y + 9);
        doc.text(settings.bankBank || "Abu Dhabi Commercial Bank", 35, y + 13);
        doc.text(settings.bankAc || "1215754581", 35, y + 17);
        doc.text(settings.bankIban || "AE540000001215754581", 35, y + 21);

        doc.text("For Al Bowry Carpentry LLC", 195, y + 4, { align: "right" });
        doc.text("Authorized Signatory", 195, y + 28, { align: "right" });
        
        const stampImg = await getBase64ImageFromURL(settings.stampUrl);
        if (stampImg) {
            doc.addImage(stampImg, 'PNG', 145, y + 5, 45, 22);
        }

        if (preview) {
            return doc.output('datauristring');
        } else {
            doc.save(`${invoice.invoiceNo || 'Invoice'}.pdf`);
        }
    } catch (e) {
        console.error(e);
        alert("Error generating Standard PDF: " + e.message);
    }
}

// ==========================================
// 2. MANUAL INVOICE GENERATOR
// ==========================================
async function generateManualInvoicePDF(data, preview = false) {
    try {
        const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const settings = getSafeSettings();
        
        const M = 10;
        const pageW = 210;
        const pageH = 297;
        const W = pageW - 2 * M;
        const W_HALF = pageW / 2;
        const primaryColor = [26, 58, 92];

        let y = M;
        const maxPageY = pageH - M; // 287
        
        // Dynamically calculate footer height for Manual Invoices
        const numTotals = data.totals ? data.totals.length : 0;
        const footerH = (numTotals * 8) + 11 + 30; 
        const yLimit = maxPageY - footerH;

        const drawFrame = () => {
            doc.setDrawColor(...primaryColor);
            doc.setLineWidth(0.6);
            doc.rect(M, M, W, pageH - 2 * M, 'S');
        };

        // Header Structure
        drawFrame();
        doc.setDrawColor(...primaryColor);
        doc.setLineWidth(0.6);
        doc.rect(M, y, W, 8, 'S');
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...primaryColor);
        doc.text((data.meta.docTitle || "INVOICE").toUpperCase(), W_HALF, y + 5.5, { align: "center" });

        y += 8;
        const logoImg = await getBase64ImageFromURL(settings.logoUrl || 'public/logo.png');
        if (logoImg) doc.addImage(logoImg, 'PNG', W_HALF - 12, y + 2, 24, 24);

        y += 28;
        doc.setFontSize(14);
        doc.text(settings.companyName || "Al Bowry Carpentry LLC", W_HALF, y, { align: "center" });
        y += 5;
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(settings.address || "", W_HALF, y, { align: "center" });
        y += 5;
        doc.text(`TRN: ${settings.trn || ""}`, W_HALF, y, { align: "center" });
        
        y += 5;
        doc.setLineWidth(0.4);
        doc.line(M, y, pageW - M, y);
        y += 4;

        // Buyer Area
        let buyerTopY = y - 4;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.text(data.buyer.title || "Buyer (Bill to):", 12, y);
        doc.setFontSize(10);
        y += 5;
        let leftY = y;
        
        const bNameLines = doc.splitTextToSize(data.buyer.name || "", 90);
        doc.text(bNameLines, 12, leftY);
        leftY += (bNameLines.length * 5);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        
        if (data.buyer.address) {
            const bAddrLines = doc.splitTextToSize(data.buyer.address, 90);
            doc.text(bAddrLines, 12, leftY);
            leftY += (bAddrLines.length * 4);
        }
        if (data.buyer.trn) {
            doc.setFont("helvetica", "bold");
            doc.text(`TRN: ${data.buyer.trn}`, 12, leftY);
            leftY += 5;
        }

        let rightY = buyerTopY + 5;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        if (data.meta.projectText) {
            let pLines = doc.splitTextToSize(data.meta.projectText, 80);
            doc.text(pLines, 105, rightY);
            rightY += (pLines.length * 4) + 2;
        }
        doc.setFont("helvetica", "bold");
        doc.text("Invoice No. :", 105, rightY);
        doc.text(data.meta.invoiceNo || "", 135, rightY);
        rightY += 6;
        doc.text("Dated :", 105, rightY);
        doc.text(data.meta.date || "", 135, rightY);
        rightY += 6;
        
        y = Math.max(leftY, rightY) + 2;
        doc.line(M, y, pageW - M, y);
        doc.line(100, buyerTopY, 100, y); 
        
        // Columns setup
        let numCols = data.headers.length;
        let cols = [];
        let currentX = M;
        let col0W = 12; 
        
        if (numCols === 6) {
            cols = [
                { label: data.headers[0], x: currentX, w: 12 },
                { label: data.headers[1], x: currentX += 12, w: 98 },
                { label: data.headers[2], x: currentX += 98, w: 20 },
                { label: data.headers[3], x: currentX += 20, w: 20 },
                { label: data.headers[4], x: currentX += 20, w: 20 },
                { label: data.headers[5], x: currentX += 20, w: 20 }
            ];
        } else {
            let remainingW = W - col0W;
            let dynamicW = remainingW / (numCols - 1);
            cols.push({ label: data.headers[0], x: M, w: col0W });
            currentX += col0W;
            for(let i = 1; i < numCols; i++) {
                cols.push({ label: data.headers[i], x: currentX, w: dynamicW });
                currentX += dynamicW;
            }
        }

        const drawManualVertLines = (startY, endY) => {
            doc.setDrawColor(...primaryColor);
            doc.setLineWidth(0.4);
            for (let i = 1; i < cols.length; i++) {
                doc.line(cols[i].x, startY, cols[i].x, endY);
            }
        };

        // Table Headers
        let tableStartY = y;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        y += 5;
        cols.forEach((c, idx) => {
            let align = (idx === 0 || idx > 1) ? "center" : "left";
            let tx = align === "center" ? c.x + (c.w / 2) : c.x + 2;
            doc.text(c.label || "", tx, y, { align: align });
        });
        y += 3;
        doc.line(M, y, pageW - M, y);

        // Items Loop
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        for (let i = 0; i < data.items.length; i++) {
            const itemCells = data.items[i];
            let maxLines = 1;
            let cellTexts = [];

            itemCells.forEach((text, idx) => {
                let lines = doc.splitTextToSize(text || "", cols[idx].w - 2);
                if (lines.length > maxLines) maxLines = lines.length;
                cellTexts.push(lines);
            });

            const rowH = Math.max(8, maxLines * 5 + 3);

            if (y + rowH > yLimit) {
                drawManualVertLines(tableStartY, maxPageY);
                doc.setFontSize(8);
                doc.text("Continued on next page...", W_HALF, maxPageY - 2, { align: "center" });

                doc.addPage();
                drawFrame();
                
                y = M;
                tableStartY = y;
                doc.setFont("helvetica", "bold");
                doc.setFontSize(9);
                cols.forEach((c, idx) => {
                    let align = (idx === 0 || idx > 1) ? "center" : "left";
                    let tx = align === "center" ? c.x + (c.w / 2) : c.x + 2;
                    doc.text(c.label || "", tx, y + 5, { align: align });
                });
                y += 8;
                doc.line(M, y, pageW - M, y);
                doc.setFont("helvetica", "normal");
                doc.setFontSize(8);
            }

            let textY = y + 5;
            cellTexts.forEach((lines, idx) => {
                let align = (idx === 0 || idx > 1) ? "center" : "left";
                if (idx >= cols.length - 2 && idx > 1) align = "right"; 
                
                let tx = cols[idx].x;
                if (align === "center") tx += (cols[idx].w / 2);
                else if (align === "right") tx += cols[idx].w - 2;
                else tx += 2;
                
                doc.text(lines, tx, textY, { align: align });
            });
            y += rowH;
        }

        // Close manual items securely
        drawManualVertLines(tableStartY, yLimit);
        doc.line(M, yLimit, pageW - M, yLimit);
        
        y = yLimit;

        // Totals Area
        let splitIndex = (cols.length === 6) ? 2 : (cols.length > 3 ? cols.length - 3 : 1);
        let splitX = cols[splitIndex].x;
        let lastColX = cols[cols.length - 1].x;

        doc.line(splitX, y, splitX, y + (numTotals * 8));
        doc.line(lastColX, y, lastColX, y + (numTotals * 8));

        doc.setFontSize(9);
        for (let t = 0; t < numTotals; t++) {
            let isLast = (t === numTotals - 1);
            doc.setFont("helvetica", "bold");
            doc.text(data.totals[t].label || "", lastColX - 3, y + 5, { align: "right" });
            doc.text(formatMoney(data.totals[t].amount), pageW - M - 2, y + 5, { align: "right" });
            y += 8;
            if (!isLast) {
                doc.line(splitX, y, pageW - M, y);
            } else {
                doc.line(M, y, pageW - M, y);
            }
        }

        // Words Area
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("Amount Chargeable (in words):", 12, y + 4);
        doc.setFont("helvetica", "bold");
        doc.text(data.amountInWords || "", 12, y + 9);
        y += 11;
        doc.line(M, y, pageW - M, y);

        // Bank Area
        doc.line(splitX, y, splitX, maxPageY);
        doc.setFont("helvetica", "bold");
        doc.text("Company's Bank Details", 12, y + 4);
        doc.setFont("helvetica", "normal");
        doc.text("A/c Name:", 12, y + 9);
        doc.text("Bank Name:", 12, y + 13);
        doc.text("A/c No.:", 12, y + 17);
        doc.text("IBAN:", 12, y + 21);
        
        doc.setFont("helvetica", "bold");
        doc.text(settings.bankName || "Al Bowry Carpentry LLC", 35, y + 9);
        doc.text(settings.bankBank || "Abu Dhabi Commercial Bank", 35, y + 13);
        doc.text(settings.bankAc || "1215754581", 35, y + 17);
        doc.text(settings.bankIban || "AE540000001215754581", 35, y + 21);

        doc.text("For Al Bowry Carpentry LLC", 195, y + 4, { align: "right" });
        doc.text("Authorized Signatory", 195, y + 28, { align: "right" });
        
        const stampImg = await getBase64ImageFromURL(settings.stampUrl);
        if (stampImg) {
            let signCenter = splitX + ((pageW - M - splitX) / 2);
            doc.addImage(stampImg, 'PNG', signCenter - 22, y + 5, 45, 22);
        }

        if (preview) {
            return doc.output('datauristring');
        } else {
            doc.save(`${data.meta.invoiceNo || 'Manual_Invoice'}.pdf`);
        }
    } catch (e) {
        console.error(e);
        alert("Error generating Manual PDF: " + e.message);
    }
}
