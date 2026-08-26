// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Main Application Logic
// ═══════════════════════════════════════════════════════

let currentPage = 'dashboard';
let deferredPrompt; // For PWA Install

// ─── INITIALIZE APP ───
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
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed:', err));
    }

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.action-menu')) {
            document.querySelectorAll('.action-dropdown.show').forEach(d => d.classList.remove('show'));
        }
    });
}

// ─── PWA INSTALLATION LOGIC ───
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default mini-infobar
    e.preventDefault();
    // Stash the event
    deferredPrompt = e;
    // Show the Install button
    const installBtn = document.getElementById('installAppBtn');
    if (installBtn) {
        installBtn.style.display = 'inline-flex';
        
        installBtn.addEventListener('click', async () => {
            installBtn.style.display = 'none';
            // Show prompt
            deferredPrompt.prompt();
            // Wait for user choice
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to install prompt: ${outcome}`);
            deferredPrompt = null;
        }, { once: true });
    }
});

window.addEventListener('appinstalled', () => {
    const installBtn = document.getElementById('installAppBtn');
    if(installBtn) installBtn.style.display = 'none';
    showToast('App installed successfully!', 'success');
});

// ─── SIDEBAR USER INFO ───
function loadSidebarInfo() {
    const settings = DB.getSettings();
    const userNameEl = document.getElementById('sidebarUserName');
    if (userNameEl) userNameEl.textContent = 'Administrator';
    
    const photoEl = document.getElementById('sidebarPhoto');
    if (photoEl) {
        if (settings.profilePhoto) {
            photoEl.src = settings.profilePhoto;
            photoEl.style.display = 'block';
        } else {
            photoEl.style.display = 'none';
        }
    }

    const sidebarLogo = document.querySelector('.sidebar-logo');
    if (sidebarLogo && settings.logoUrl) sidebarLogo.src = settings.logoUrl;
}

// ─── NAVIGATION ROUTER ───
function navigateTo(pageId) {
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.page === pageId) el.classList.add('active');
    });

    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('show');
        }
    }

    const titles = {
        'dashboard': 'Dashboard',
        'invoices': 'Tax Invoices',
        'quotations': 'Quotations / Estimates',
        'customers': 'Customer Directory',
        'suppliers': 'Supplier Directory',
        'purchases': 'Purchase Bills',
        'reports': 'Business Analytics',
        'vat-reports': 'VAT Tax Reports',
        'settings': 'System Settings'
    };
    document.getElementById('pageTitle').textContent = titles[pageId] || 'Al Bowry App';
    currentPage = pageId;

    const container = document.getElementById('pageContainer');
    container.innerHTML = `
        <div class="empty-state">
            <div class="loading-spinner" style="border-top-color:var(--primary);margin:0 auto 12px;"></div>
            <p>Loading ${titles[pageId] || 'page'}...</p>
        </div>
    `;

    window.scrollTo(0, 0);

    setTimeout(() => { renderPage(pageId, container); }, 150);
}

// ─── MODULE RENDERER ───
function renderPage(page, container) {
    try {
        switch (page) {
            case 'dashboard': if (typeof renderDashboard === 'function') renderDashboard(container); else showModuleError(container, 'Dashboard'); break;
            case 'invoices': if (typeof renderInvoices === 'function') renderInvoices(container); else showModuleError(container, 'Invoices'); break;
            case 'quotations': if (typeof renderQuotations === 'function') renderQuotations(container); else showModuleError(container, 'Quotations'); break;
            case 'customers': if (typeof renderCustomers === 'function') renderCustomers(container); else showModuleError(container, 'Customers'); break;
            case 'suppliers': if (typeof renderSuppliers === 'function') renderSuppliers(container); else showModuleError(container, 'Suppliers'); break;
            case 'purchases': if (typeof renderPurchases === 'function') renderPurchases(container); else showModuleError(container, 'Purchases'); break;
            case 'reports': if (typeof renderReports === 'function') renderReports(container); else showModuleError(container, 'Reports'); break;
            case 'vat-reports': if (typeof renderVatReports === 'function') renderVatReports(container); else showModuleError(container, 'VAT Reports'); break;
            case 'settings': if (typeof renderSettings === 'function') renderSettings(container); else showModuleError(container, 'Settings'); break;
            default:
                container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🚧</div><h3>Page Not Found</h3></div>`;
        }
    } catch (err) {
        console.error('Error rendering page:', err);
        container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Error Loading Page</h3><p>${err.message}</p></div>`;
    }
}

function showModuleError(container, moduleName) {
    container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>${moduleName} Module Not Loaded</h3><button class="btn btn-primary mt-2" onclick="window.location.reload()">Reload Page</button></div>`;
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
    showToast(`Switched to ${newTheme} mode`, 'info');
}

function loadTheme() {
    const savedTheme = localStorage.getItem('albowry_theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
}

document.addEventListener('keydown', (e) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    if (e.ctrlKey && e.key === 'n') { e.preventDefault(); if (typeof openInvoiceForm === 'function') { navigateTo('invoices'); setTimeout(() => openInvoiceForm(), 300); } }
    if (e.ctrlKey && e.key === 'q') { e.preventDefault(); if (typeof openQuotationForm === 'function') { navigateTo('quotations'); setTimeout(() => openQuotationForm(), 300); } }
    if (e.ctrlKey && e.key === 'd') { e.preventDefault(); navigateTo('dashboard'); }
    if (e.key === 'Escape') { const openModal = document.querySelector('.modal-overlay'); if (openModal) openModal.remove(); }
});

window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
    }
});

window.addEventListener('beforeunload', (e) => {
    if (document.querySelector('.modal-overlay')) {
        e.preventDefault(); e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'; return e.returnValue;
    }
});

window.addEventListener('DOMContentLoaded', () => { checkAuth(); });

if (typeof closeModal === 'undefined') {
    window.closeModal = function(id) { const m = document.getElementById(id); if (m) m.remove(); };
}
