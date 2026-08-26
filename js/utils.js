// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Utility Functions (No Firebase)
// ═══════════════════════════════════════════════════════

// Generate Unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Format number to 2 decimal places with commas (e.g., 1,234.50)
function formatNum(num) {
    return parseFloat(num || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Format Currency (AED 1,234.00)
function formatCurrency(amount) {
    return 'AED ' + parseFloat(amount || 0).toLocaleString('en-US', {
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

// Number to Words (US / UAE International Format - Thousands, Millions, Billions)
function numberToWords(amount) {
    if (!amount || parseFloat(amount) === 0) return 'AED Zero Only';
    
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty ', 'Thirty ', 'Forty ', 'Fifty ', 'Sixty ', 'Seventy ', 'Eighty ', 'Ninety '];
    const scales = ['', 'Thousand ', 'Million ', 'Billion ', 'Trillion '];

    function convertChunk(num) {
        let str = '';
        if (num > 99) { str += a[Math.floor(num / 100)] + 'Hundred '; num %= 100; }
        if (num > 19) { str += b[Math.floor(num / 10)]; num %= 10; }
        if (num > 0) { str += a[num]; }
        return str;
    }

    const parts = parseFloat(amount).toFixed(2).split('.');
    let dirhams = parseInt(parts[0]);
    const fils = parseInt(parts[1]);

    if (dirhams === 0) {
        let words = 'AED Zero';
        if (fils > 0) words += ' and ' + convertChunk(fils).trim() + ' Fils';
        return words.trim() + ' Only';
    }

    let wordStr = '';
    let scaleIdx = 0;
    
    while (dirhams > 0) {
        let chunk = dirhams % 1000;
        if (chunk > 0) {
            wordStr = convertChunk(chunk) + scales[scaleIdx] + wordStr;
        }
        dirhams = Math.floor(dirhams / 1000);
        scaleIdx++;
    }

    let finalStr = 'AED ' + wordStr.trim();
    if (fils > 0) {
        finalStr += ' and ' + convertChunk(fils).trim() + ' Fils';
    }
    return finalStr + ' Only';
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
