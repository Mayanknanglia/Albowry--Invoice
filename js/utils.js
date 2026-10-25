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

// ═══════════════════════════════════════════════════════
// 🔥 MASSIVE UNIT DICTIONARY (Categorized)
// ═══════════════════════════════════════════════════════
function getUnitOptions() {
    return `
        <optgroup label="General / Common">
            <option value="Nos">Nos (Numbers)</option>
            <option value="Pieces">Pieces (Pcs)</option>
            <option value="Sets">Sets</option>
            <option value="Job">Lump Sum / Job</option>
            <option value="Pair">Pair (Prs)</option>
            <option value="Dozen">Dozen (Dz)</option>
            <option value="Gross">Gross (Gr)</option>
        </optgroup>
        
        <optgroup label="Length / Distance">
            <option value="Meter">Meter (m)</option>
            <option value="R.Meter">Running Meter (RM)</option>
            <option value="Centimeter">Centimeter (cm)</option>
            <option value="Millimeter">Millimeter (mm)</option>
            <option value="Kilometer">Kilometer (km)</option>
            <option value="Foot">Foot / Feet (ft)</option>
            <option value="Inch">Inch (in)</option>
            <option value="Yard">Yard (yd)</option>
        </optgroup>

        <optgroup label="Area (Surface)">
            <option value="Sq.Meter">Sq. Meter (m²)</option>
            <option value="Sq.Ft">Sq. Feet (ft²)</option>
            <option value="Sq.Inch">Sq. Inch (in²)</option>
            <option value="Sq.Yard">Sq. Yard (yd²)</option>
            <option value="Sq.Cm">Sq. Centimeter (cm²)</option>
            <option value="Acre">Acre</option>
            <option value="Hectare">Hectare (ha)</option>
        </optgroup>

        <optgroup label="Volume / Capacity">
            <option value="Cu.Meter">Cubic Meter (m³)</option>
            <option value="Cu.Ft">Cubic Feet (ft³)</option>
            <option value="Liter">Liter (L)</option>
            <option value="Milliliter">Milliliter (ml)</option>
            <option value="Gallon">Gallon (gal)</option>
        </optgroup>

        <optgroup label="Weight / Mass">
            <option value="Kg">Kilogram (Kg)</option>
            <option value="Gram">Gram (g)</option>
            <option value="Mg">Milligram (mg)</option>
            <option value="Ton">Metric Ton (t)</option>
            <option value="Pound">Pound (lb)</option>
            <option value="Ounce">Ounce (oz)</option>
        </optgroup>

        <optgroup label="Time / Labor">
            <option value="Hours">Hours (Hrs)</option>
            <option value="Days">Days</option>
            <option value="Weeks">Weeks</option>
            <option value="Months">Months</option>
            <option value="Years">Years</option>
            <option value="Man-Days">Man-Days</option>
            <option value="Man-Hours">Man-Hours</option>
            <option value="Shifts">Shifts</option>
        </optgroup>

        <optgroup label="Packaging / Containers">
            <option value="Box">Box</option>
            <option value="Carton">Carton (Ctn)</option>
            <option value="Packet">Packet (Pkt)</option>
            <option value="Bundle">Bundle (Bdl)</option>
            <option value="Roll">Roll</option>
            <option value="Coil">Coil</option>
            <option value="Bag">Bag</option>
            <option value="Sack">Sack</option>
            <option value="Drum">Drum</option>
            <option value="Bottle">Bottle</option>
            <option value="Can">Can</option>
            <option value="Cylinder">Cylinder</option>
            <option value="Pallet">Pallet</option>
            <option value="Container">Container</option>
        </optgroup>
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
