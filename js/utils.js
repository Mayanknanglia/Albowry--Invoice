// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Utility Functions (No Firebase)
// ═══════════════════════════════════════════════════════

// Generate Unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Format number to 2 decimal places (1234.50)
function formatNum(num) {
    return parseFloat(num || 0).toFixed(2);
}

// Format Currency (AED 1,234.00)
function formatCurrency(amount) {
    return 'AED ' + parseFloat(amount || 0).toLocaleString('en-AE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Format Date (e.g., 26-Aug-2026)
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate().toString().padStart(2, '0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
}

// Get Today's Date in YYYY-MM-DD format for input fields
function getTodayISO() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

// Calculate 5% VAT
function calculateVAT(amount) {
    return parseFloat((amount * 0.05).toFixed(2));
}

// Get Carpentry Measurement Units
function getUnitOptions() {
    return `
        <option value="Meter">Meter (m)</option>
        <option value="Sq.Meter">Sq. Meter (m²)</option>
        <option value="Sq.Ft">Sq. Feet (ft²)</option>
        <option value="R.Meter">Running Meter</option>
        <option value="Pieces">Pieces</option>
        <option value="Sets">Sets</option>
        <option value="Nos">Nos</option>
        <option value="Job">Lump Sum / Job</option>
    `;
}

// Number to Words (AED & Fils)
function numberToWords(amount) {
    if (!amount || amount === 0) return 'AED Zero Only';
    
    const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
    const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];

    function convertWhole(num) {
        if ((num = num.toString()).length > 9) return 'Overflow';
        let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return;
        let str = '';
        str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
        str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
        str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
        str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
        str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
        return str;
    }

    const parts = parseFloat(amount).toFixed(2).split('.');
    const dirhams = parseInt(parts[0]);
    const fils = parseInt(parts[1]);

    let words = 'AED ' + convertWhole(dirhams);
    if (fils > 0) {
        words += ' and ' + convertWhole(fils) + 'Fils';
    }
    return words.trim() + ' Only';
}

// Toast Notifications
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    if (type === 'info') icon = 'ℹ️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Loading Spinner
function showLoading() {
    document.getElementById('loadingScreen').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingScreen').style.display = 'none';
}

// Confirm Dialog
function confirmDialog(message) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('confirmOverlay');
        const msgEl = document.getElementById('confirmMessage');
        msgEl.textContent = message;
        overlay.style.display = 'flex';

        window.confirmResult = function(result) {
            overlay.style.display = 'none';
            resolve(result);
        };
    });
}

// Toggle Password Visibility
function togglePassword() {
    const passInput = document.getElementById('loginPassword');
    const btn = document.querySelector('.toggle-pass');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        btn.textContent = 'Hide';
    } else {
        passInput.type = 'password';
        btn.textContent = 'Show';
    }
}