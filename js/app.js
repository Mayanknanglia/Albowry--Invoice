// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Main Application Logic
// Version: 1.0 (No Firebase - Pure LocalStorage)
// ═══════════════════════════════════════════════════════

let currentPage = 'dashboard';

// ─── INITIALIZE APP ───
function initializeApp() {
    loadTheme();
    loadSidebarInfo();
    navigateTo('dashboard');
    hideLoading();
    
    // Add mobile sidebar overlay
    if (!document.querySelector('.sidebar-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.onclick = toggleSidebar;
        document.body.appendChild(overlay);
    }

    // Register service worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed:', err));
    }

    // Close action dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.action-menu')) {
            document.querySelectorAll('.action-dropdown.show').forEach(d => d.classList.remove('show'));
        }
    });
}

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

    // Update sidebar logo
    const sidebarLogo = document.querySelector('.sidebar-logo');
    if (sidebarLogo && settings.logoUrl) {
        sidebarLogo.src = settings.logoUrl;
    }
}

// ─── NAVIGATION ROUTER ───
function navigateTo(pageId) {
    // Update active class in sidebar
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
        if (el.dataset.page === pageId) el.classList.add('active');
    });

    // Close mobile sidebar
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            if (overlay) overlay.classList.remove('show');
        }
    }

    // Set Page Title
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

    // Show loading state
    const container = document.getElementById('pageContainer');
    container.innerHTML = `
        <div class="empty-state">
            <div class="loading-spinner" style="border-top-color:var(--primary);margin:0 auto 12px;"></div>
            <p>Loading ${titles[pageId] || 'page'}...</p>
        </div>
    `;

    // Scroll to top
    window.scrollTo(0, 0);

    // Render page after short delay for smooth transition
    setTimeout(() => {
        renderPage(pageId, container);
    }, 150);
}

// ─── MODULE RENDERER ───
function renderPage(page, container) {
    try {
        switch (page) {
            case 'dashboard':
                if (typeof renderDashboard === 'function') {
                    renderDashboard(container);
                } else {
                    showModuleError(container, 'Dashboard');
                }
                break;

            case 'invoices':
                if (typeof renderInvoices === 'function') {
                    renderInvoices(container);
                } else {
                    showModuleError(container, 'Invoices');
                }
                break;

            case 'quotations':
                if (typeof renderQuotations === 'function') {
                    renderQuotations(container);
                } else {
                    showModuleError(container, 'Quotations');
                }
                break;

            case 'customers':
                if (typeof renderCustomers === 'function') {
                    renderCustomers(container);
                } else {
                    showModuleError(container, 'Customers');
                }
                break;

            case 'suppliers':
                if (typeof renderSuppliers === 'function') {
                    renderSuppliers(container);
                } else {
                    showModuleError(container, 'Suppliers');
                }
                break;

            case 'purchases':
                if (typeof renderPurchases === 'function') {
                    renderPurchases(container);
                } else {
                    showModuleError(container, 'Purchases');
                }
                break;

            case 'reports':
                if (typeof renderReports === 'function') {
                    renderReports(container);
                } else {
                    showModuleError(container, 'Reports');
                }
                break;

            case 'vat-reports':
                if (typeof renderVatReports === 'function') {
                    renderVatReports(container);
                } else {
                    showModuleError(container, 'VAT Reports');
                }
                break;

            case 'settings':
                if (typeof renderSettings === 'function') {
                    renderSettings(container);
                } else {
                    showModuleError(container, 'Settings');
                }
                break;

            default:
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🚧</div>
                        <h3>Page Not Found</h3>
                        <p>The requested page "${page}" does not exist.</p>
                        <button class="btn btn-primary mt-2" onclick="navigateTo('dashboard')">Go to Dashboard</button>
                    </div>
                `;
        }
    } catch (err) {
        console.error('Error rendering page:', err);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h3>Error Loading Page</h3>
                <p>${err.message}</p>
                <button class="btn btn-primary mt-2" onclick="navigateTo('dashboard')">Go to Dashboard</button>
            </div>
        `;
        showToast('Error loading page: ' + err.message, 'error');
    }
}

// ─── MODULE ERROR ───
function showModuleError(container, moduleName) {
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">⚠️</div>
            <h3>${moduleName} Module Not Loaded</h3>
            <p>The JavaScript file for this module could not be loaded.</p>
            <p class="text-muted mt-1" style="font-size:0.8rem;">Please check that all JS files are present in the /js folder.</p>
            <button class="btn btn-primary mt-2" onclick="window.location.reload()">Reload Page</button>
        </div>
    `;
}

// ─── SIDEBAR TOGGLE (MOBILE) ───
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('show');
}

// ─── THEME MANAGEMENT ───
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
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
}

// ─── KEYBOARD SHORTCUTS ───
document.addEventListener('keydown', (e) => {
    // Only trigger if not typing in an input
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    // Ctrl+N — New Invoice
    if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        if (typeof openInvoiceForm === 'function') {
            navigateTo('invoices');
            setTimeout(() => openInvoiceForm(), 300);
        }
    }

    // Ctrl+Q — New Quotation
    if (e.ctrlKey && e.key === 'q') {
        e.preventDefault();
        if (typeof openQuotationForm === 'function') {
            navigateTo('quotations');
            setTimeout(() => openQuotationForm(), 300);
        }
    }

    // Ctrl+D — Dashboard
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        navigateTo('dashboard');
    }

    // Escape — Close any open modal
    if (e.key === 'Escape') {
        const openModal = document.querySelector('.modal-overlay');
        if (openModal) openModal.remove();
    }
});

// ─── WINDOW RESIZE HANDLER ───
window.addEventListener('resize', () => {
    // Close sidebar on resize to desktop
    if (window.innerWidth > 768) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('show');
    }
});

// ─── PREVENT ACCIDENTAL DATA LOSS ───
window.addEventListener('beforeunload', (e) => {
    // Check if any modal with unsaved changes is open
    const openModal = document.querySelector('.modal-overlay');
    if (openModal) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
    }
});

// ─── START THE APP ON LOAD ───
window.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// ─── GLOBAL HELPER: CLOSE MODAL ───
// (In case modules haven't defined it)
if (typeof closeModal === 'undefined') {
    window.closeModal = function(id) {
        const m = document.getElementById(id);
        if (m) m.remove();
    };
}

// ─── PRINT HELPER ───
function printCurrentPage() {
    window.print();
}

// ─── DEBUG HELPER (Optional - Remove in production) ───
window.debugAlBowry = function() {
    console.log('═══ AL BOWRY DEBUG INFO ═══');
    console.log('Settings:', DB.getSettings());
    console.log('Customers:', DB.get(DB_KEYS.CUSTOMERS));
    console.log('Suppliers:', DB.get(DB_KEYS.SUPPLIERS));
    console.log('Invoices:', DB.get(DB_KEYS.INVOICES));
    console.log('Quotations:', DB.get(DB_KEYS.QUOTATIONS));
    console.log('Purchases:', DB.get(DB_KEYS.PURCHASES));
    console.log('Current Page:', currentPage);
    console.log('═══════════════════════════');
};

console.log('%c🚀 Al Bowry Carpentry LLC - Invoice System', 'font-size:14px;font-weight:bold;color:#1a3a5c;');
console.log('%cType debugAlBowry() in console to see all data', 'color:#d4a843;');