\// ═══════════════════════════════════════════════════════
// AL BOWRY CARPENTRY LLC - Cloud Authentication
// ═══════════════════════════════════════════════════════

async function checkAuth() {
    const isLogged = sessionStorage.getItem('albowry_auth') === 'true';
    if (!isLogged) {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('loginPage').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    } else {
        // Start Firebase Sync Engine
        DB.init(() => {
            document.getElementById('loginPage').style.display = 'none';
            document.getElementById('mainApp').style.display = 'flex';
            initializeApp(); 
        });
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    document.getElementById('loadingText').textContent = "Verifying Credentials...";
    showLoading();

    try {
        // Fetch credentials directly from Firestore
        const docRef = await dbFirestore.collection('app_data').doc('credentials').get();
        let validEmail = 'admin@albowry.com';
        let validPass = 'admin';

        if (docRef.exists) {
            const data = docRef.data();
            validEmail = data.email;
            validPass = data.password;
        } else {
            // First time setup, create admin doc
            await dbFirestore.collection('app_data').doc('credentials').set({
                email: validEmail,
                password: validPass
            });
        }

        if (email === validEmail && password === validPass) {
            sessionStorage.setItem('albowry_auth', 'true');
            showToast('Login Successful!', 'success');
            
            document.getElementById('loadingText').textContent = "Syncing with Cloud...";
            
            // Start Engine
            DB.init(() => {
                document.getElementById('loginPage').style.display = 'none';
                document.getElementById('mainApp').style.display = 'flex';
                initializeApp();
            });
        } else {
            hideLoading();
            showToast('Invalid Email or Password!', 'error');
        }
    } catch (error) {
        hideLoading();
        showToast('Network Error! Cannot verify login.', 'error');
        console.error(error);
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
