// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - WhatsApp Integration
// ═══════════════════════════════════════════════════════

function shareInvoiceWhatsApp(invoiceId) {
    const invoice = DB.get(DB_KEYS.INVOICES).find(i => i.id === invoiceId);
    if (!invoice) return showToast('Invoice not found', 'error');
    const settings = DB.getSettings();

    let phone = invoice.customerPhone || '';
    phone = phone.replace(/[^0-9]/g, '');
    
    if (phone && !phone.startsWith('971') && phone.length === 9) {
        phone = '971' + phone;
    } else if (phone && phone.startsWith('0')) {
        phone = '971' + phone.substring(1);
    }

    const message = `Dear ${invoice.customerName},

Greetings from *${settings.companyName}*!

Please find your invoice details below:

*Invoice No:* ${invoice.invoiceNumber}
*Date:* ${formatDate(invoice.date)}
${invoice.projectName ? `*Project:* ${invoice.projectName}\n` : ''}*Amount:* AED ${formatNum(invoice.grandTotal)}
*Status:* ${invoice.paymentStatus || 'Unpaid'}

Bank Details:
${settings.bankName}
A/c: ${settings.bankAccount}
IBAN: ${settings.bankIban}

Kindly arrange the payment at your earliest.

Thank you for your business!

Regards,
${settings.companyName}
${settings.phone}`;

    const url = phone 
        ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(url, '_blank');
    showToast('Opening WhatsApp...', 'info');
    
    // Also offer to download PDF
    setTimeout(() => {
        if (confirm('Also download PDF to attach in WhatsApp?')) {
            generateInvoicePDF(invoiceId);
        }
    }, 1500);
}

function sendPaymentReminder(invoiceId) {
    const invoice = DB.get(DB_KEYS.INVOICES).find(i => i.id === invoiceId);
    if (!invoice) return;
    const settings = DB.getSettings();
    
    let phone = (invoice.customerPhone || '').replace(/[^0-9]/g, '');
    if (phone && !phone.startsWith('971') && phone.length === 9) phone = '971' + phone;

    const message = `Dear ${invoice.customerName},

This is a gentle reminder regarding pending payment:

*Invoice:* ${invoice.invoiceNumber}
*Date:* ${formatDate(invoice.date)}
*Amount Due:* AED ${formatNum(invoice.grandTotal)}

Please arrange the payment at your earliest convenience.

For any query, contact us at ${settings.phone}.

Thank you,
${settings.companyName}`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}