async function handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const loginBtn = document.querySelector('.btn-primary');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.sessionToken) {
            setToken(data.sessionToken);
            setUserRole(data.user.role);
            setUserName(`${data.user.first_name} ${data.user.last_name}`);

            window.location.href = 'dashboard.html';
        } else {
            showError(data.error || 'Login failed');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Network error. Please try again.');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = '❌ ' + message;
        errorDiv.style.display = 'block';
    }
}

function handleLogout() {
    clearToken();
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = 'index.html';
}

function checkAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = 'index.html';
    }
}