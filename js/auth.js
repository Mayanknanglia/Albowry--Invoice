// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Local Authentication
// ═══════════════════════════════════════════════════════

const DEFAULT_CREDENTIALS = {
    email: 'admin@albowry.com',
    password: 'admin' // Simple default password for owner
};

function checkAuth() {
    const isLogged = sessionStorage.getItem('albowry_auth') === 'true';
    if (!isLogged) {
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        hideLoading();
    } else {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'flex';
        initializeApp(); // Calls function from app.js
    }
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Check credentials (can be updated via settings later, stored in localStorage)
    const storedCreds = JSON.parse(localStorage.getItem('albowry_credentials')) || DEFAULT_CREDENTIALS;

    if (email === storedCreds.email && password === storedCreds.password) {
        showLoading();
        sessionStorage.setItem('albowry_auth', 'true');
        showToast('Login Successful!', 'success');
        
        setTimeout(() => {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('mainApp').style.display = 'flex';
            initializeApp();
        }, 800);
    } else {
        showToast('Invalid Email or Password!', 'error');
    }
}

function handleLogout() {
    confirmDialog("Are you sure you want to logout?").then(confirm => {
        if(confirm) {
            sessionStorage.removeItem('albowry_auth');
            window.location.reload();
        }
    });
}

function updateCredentials(newEmail, newPassword) {
    localStorage.setItem('albowry_credentials', JSON.stringify({
        email: newEmail,
        password: newPassword
    }));
}