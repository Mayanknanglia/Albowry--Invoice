// ✅ CLOUD SAVE INVOICE (Replace existing saveInvoice in js/invoices.js)
async function saveInvoice(invoiceId) {
    const items = collectInvoiceItems().filter(it => it.description);
    if (items.length === 0) return showToast('Add at least one item', 'error');
    const custName = document.getElementById('inv_custName').value.trim();
    if (!custName) return showToast('Customer name required', 'error');

    let finalCustId = document.getElementById('inv_customer').value;
    
    // Auto-save customer to CLOUD if new
    if (!finalCustId && custName) {
        const customers = DB.get(DB_KEYS.CUSTOMERS);
        const existing = customers.find(c => c.name.toLowerCase() === custName.toLowerCase());
        if (existing) {
            finalCustId = existing.id;
        } else {
            const newCust = {
                id: generateId(),
                name: custName,
                phone: document.getElementById('inv_custPhone').value.trim(),
                trn: document.getElementById('inv_custTRN').value.trim(),
                address: document.getElementById('inv_custAddress').value.trim(),
                createdAt: new Date().toISOString()
            };
            await DB.saveItem(DB_KEYS.CUSTOMERS, newCust);
            finalCustId = newCust.id;
        }
    }

    const subTotal = items.reduce((s,it) => s + it.amount, 0);
    const discount = parseFloat(document.getElementById('inv_discount').value) || 0;
    const taxable = subTotal - discount;
    const vatEnabled = document.getElementById('inv_vatEnabled').checked;
    const vatRate = DB.getSettings().vatRate || 5;
    const vatAmount = vatEnabled ? parseFloat((taxable * vatRate / 100).toFixed(2)) : 0;
    const roundOff = parseFloat(document.getElementById('inv_roundOff').value) || 0;
    const roundOffType = document.getElementById('inv_roundOffType').value;
    const roundOffSigned = roundOffType === 'add' ? roundOff : -roundOff;
    const grandTotal = parseFloat((taxable + vatAmount + roundOffSigned).toFixed(2));

    const invoice = {
        id: invoiceId || generateId(),
        invoiceNumber: document.getElementById('inv_number').value.trim(),
        date: document.getElementById('inv_date').value,
        paymentTerms: document.getElementById('inv_terms').value,
        customerId: finalCustId,
        customerName: custName,
        customerPhone: document.getElementById('inv_custPhone').value.trim(),
        customerTRN: document.getElementById('inv_custTRN').value.trim(),
        customerAddress: document.getElementById('inv_custAddress').value.trim(),
        lpoNumber: document.getElementById('inv_lpo').value.trim(),
        projectName: document.getElementById('inv_project').value.trim(),
        items, subTotal, discount, taxable, vatEnabled, vatRate, vatAmount, roundOff, roundOffType, grandTotal,
        paymentStatus: document.getElementById('inv_paymentStatus').value,
        paidAmount: parseFloat(document.getElementById('inv_paidAmount').value) || 0,
        notes: document.getElementById('inv_notes').value.trim(),
        timestamp: new Date().toISOString()
    };

    await DB.saveItem(DB_KEYS.INVOICES, invoice);
    closeModal('invoiceModal');
}

// ✅ CLOUD DELETE INVOICE
async function deleteInvoice(invoiceId) {
    const confirmed = await confirmDialog('Delete this invoice permanently?');
    if (!confirmed) return;
    await DB.deleteItem(DB_KEYS.INVOICES, invoiceId);
}
