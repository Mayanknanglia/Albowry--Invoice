// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Auth (with timeout safety)
// ═══════════════════════════════════════════════════════

function setLoadingText(msg) {
    const el = document.getElementById('loadingText');
    if (el) el.textContent = msg;
}

async function checkAuth() {
    const isLogged = sessionStorage.getItem('albowry_auth') === 'true';

    if (!isLogged) {
        hideLoading();
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
        return;
    }

    // Already logged in → connect cloud then open app
    setLoadingText('Connecting to Secure Cloud...');
    showLoading();

    DB.init(() => {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('mainApp').style.display = 'flex';
        initializeApp();
    });
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    setLoadingText('Verifying credentials...');
    showLoading();

    try {
        let validEmail = 'admin@albowry.com';
        let validPass = 'admin';

        // Try cloud credentials (with short timeout)
        const credPromise = dbFirestore.collection('app_data').doc('credentials').get();
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), 8000)
        );

        try {
            const docRef = await Promise.race([credPromise, timeoutPromise]);
            if (docRef && docRef.exists) {
                const data = docRef.data();
                validEmail = data.email || validEmail;
                validPass = data.password || validPass;
            } else {
                // First time: create default credentials in cloud
                await dbFirestore.collection('app_data').doc('credentials').set({
                    email: validEmail,
                    password: validPass
                });
            }
        } catch (netErr) {
            console.warn('Credential fetch failed, using defaults:', netErr);
            // Offline / rules blocked → allow default login so app still opens
            showToast('Cloud unreachable — using offline login', 'warning');
        }

        if (email === validEmail && password === validPass) {
            sessionStorage.setItem('albowry_auth', 'true');
            showToast('Login Successful!', 'success');
            setLoadingText('Syncing with Cloud...');

            DB.init(() => {
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('mainApp').style.display = 'flex';
                initializeApp();
            });
        } else {
            hideLoading();
            document.getElementById('loginPage').style.display = 'flex';
            showToast('Invalid Email or Password!', 'error');
        }
    } catch (error) {
        hideLoading();
        document.getElementById('loginPage').style.display = 'flex';
        showToast('Login error: ' + (error.message || 'network'), 'error');
        console.error(error);
    }
}

function handleLogout() {
    confirmDialog('Are you sure you want to logout?').then(confirm => {
        if (confirm) {
            sessionStorage.removeItem('albowry_auth');
            window.location.reload();
        }
    });
}
