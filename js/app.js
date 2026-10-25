// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Main Application Logic
// Features: App Routing, PWA Install (Login & Topbar), Theme
// ═══════════════════════════════════════════════════════

let currentPage = 'dashboard';
let deferredPrompt = null; 

function initializeApp() {
    loadTheme();
    loadSidebarInfo();
    navigateTo('dashboard');
    hideLoading();
    
    if (!document.querySelector('.sidebar-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.onclick = toggleSidebar;
        document.body.appendChild(overlay);
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('SW Registered!', reg.scope))
            .catch(err => console.log('SW failed:', err));
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.action-menu')) {
            document.querySelectorAll('.action-dropdown.show').forEach(d => d.classList.remove('show'));
        }
    });

    setupInstallButtons();
}

window.renderCurrentPage = function() {
    const container = document.getElementById('pageContainer');
    if (container) renderPage(currentPage, container, true);
};

// ════════ PWA INSTALL LOGIC (PC + Phone) ════════
function isIosDevice() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isInStandaloneMode() {
    return window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
}

function updateInstallUI() {
    const loginBox = document.getElementById('loginInstallBox');
    const topbarBtn = document.getElementById('installAppBtn');
    const iosTip = document.getElementById('iosInstallTip');

    // If already installed, hide all install buttons
    if (isInStandaloneMode()) {
        if (loginBox) loginBox.style.display = 'none';
        if (topbarBtn) topbarBtn.style.display = 'none';
        if (iosTip) iosTip.style.display = 'none';
        return;
    }

    // iOS Safari tip (Apple doesn't support install button)
    if (isIosDevice()) {
        if (loginBox) loginBox.style.display = 'none';
        if (topbarBtn) topbarBtn.style.display = 'none';
        if (iosTip) iosTip.style.display = 'block';
        return;
    }

    // Android/Chrome/Edge (Show if prompt is ready)
    const canInstall = !!deferredPrompt;
    if (loginBox) loginBox.style.display = canInstall ? 'block' : 'none';
    if (topbarBtn) topbarBtn.style.display = canInstall ? 'inline-flex' : 'none';
    if (iosTip) iosTip.style.display = 'none';
}

async function triggerPwaInstall() {
    if (!deferredPrompt) {
        if(typeof showToast === 'function') showToast('Install not ready. Try Browser Menu -> Install', 'info');
        return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        if(typeof showToast === 'function') showToast('App Installed Successfully! 🎉', 'success');
    }
    deferredPrompt = null;
    updateInstallUI();
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    updateInstallUI();
});

window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    updateInstallUI();
});

function setupInstallButtons() {
    const loginBtn = document.getElementById('loginInstallBtn');
    const topbarBtn = document.getElementById('installAppBtn');

    if (loginBtn) {
        // Remove old listeners to avoid duplicates
        const newLoginBtn = loginBtn.cloneNode(true);
        loginBtn.parentNode.replaceChild(newLoginBtn, loginBtn);
        newLoginBtn.addEventListener('click', (e) => { e.preventDefault(); triggerPwaInstall(); });
    }
    if (topbarBtn) {
        const newTopbarBtn = topbarBtn.cloneNode(true);
        topbarBtn.parentNode.replaceChild(newTopbarBtn, topbarBtn);
        newTopbarBtn.addEventListener('click', (e) => { e.preventDefault(); triggerPwaInstall(); });
    }
    updateInstallUI();
}

// ════════ UI HELPERS ════════
function loadSidebarInfo() {
    const settings = DB.getSettings();
    const userNameEl = document.getElementById('sidebarUserName');
    if (userNameEl) userNameEl.textContent = 'Administrator';
    
    const photoEl = document.getElementById('sidebarPhoto');
    if (photoEl) {
        if (settings.profilePhoto) { photoEl.src = settings.profilePhoto; photoEl.style.display = 'block'; } 
        else { photoEl.style.display = 'none'; }
    }
    const sidebarLogo = document.querySelector('.sidebar-logo');
    if (sidebarLogo && settings.logoUrl) sidebarLogo.src = settings.logoUrl;
}

function navigateTo(pageId) {
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.page === pageId) el.classList.add('active');
    });

    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar && sidebar.classList.contains('open')) sidebar.classList.remove('open');
        if (overlay && overlay.classList.contains('show')) overlay.classList.remove('show');
    }

    const titles = {
        'dashboard': 'Dashboard', 'invoices': 'Tax Invoices', 'quotations': 'Quotations',
        'manual-invoices': 'Manual Invoices',
        'customers': 'Customer Directory', 'suppliers': 'Supplier Directory', 
        'purchases': 'Purchase Bills', 'reports': 'Business Analytics', 
        'vat-reports': 'VAT Tax Reports', 'settings': 'System Settings'
    };
    document.getElementById('pageTitle').textContent = titles[pageId] || 'Al Bowry App';
    currentPage = pageId;

    const container = document.getElementById('pageContainer');
    container.innerHTML = `<div class="empty-state"><div class="loading-spinner" style="border-top-color:var(--primary);margin:0 auto 12px;"></div><p>Loading ${titles[pageId]}...</p></div>`;
    
    window.scrollTo(0, 0);
    setTimeout(() => { renderPage(pageId, container); }, 150);
}

function renderPage(page, container, isSilentRender = false) {
    try {
        switch (page) {
            case 'dashboard': renderDashboard(container); break;
            case 'invoices': renderInvoices(container); break;
            case 'manual-invoices': renderManualInvoices(container); break;
            case 'quotations': renderQuotations(container); break;
            case 'customers': renderCustomers(container); break;
            case 'suppliers': renderSuppliers(container); break;
            case 'purchases': renderPurchases(container); break;
            case 'reports': renderReports(container); break;
            case 'vat-reports': renderVatReports(container); break;
            case 'settings': renderSettings(container); break;
            default: container.innerHTML = `<div class="empty-state"><h3>Page Not Found</h3></div>`;
        }
    } catch (err) {
        if (!isSilentRender) container.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${err.message}</p></div>`;
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('show');
}

function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('albowry_theme', newTheme);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('albowry_theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
}

document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    if (e.ctrlKey && e.key === 'n') { e.preventDefault(); navigateTo('invoices'); setTimeout(() => openInvoiceForm(), 300); }
    if (e.ctrlKey && e.key === 'q') { e.preventDefault(); navigateTo('quotations'); setTimeout(() => openQuotationForm(), 300); }
    if (e.ctrlKey && e.key === 'd') { e.preventDefault(); navigateTo('dashboard'); }
    if (e.key === 'Escape') { const openModal = document.querySelector('.modal-overlay'); if (openModal) openModal.remove(); }
});

window.addEventListener('DOMContentLoaded', () => { 
    if(typeof checkAuth === 'function') checkAuth(); 
    setupInstallButtons(); 
});

if (typeof closeModal === 'undefined') {
    window.closeModal = function(id) { const m = document.getElementById(id); if (m) m.remove(); };
}
