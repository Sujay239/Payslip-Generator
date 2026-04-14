document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const emailGroup = document.getElementById('emailGroup');
    const passwordGroup = document.getElementById('passwordGroup');
    const togglePasswordBtn = document.getElementById('togglePassword');
    const errorMessage = document.getElementById('errorMessage');
    const loginBtn = document.getElementById('loginBtn');

    // --- Floating Label Logic ---
    const updateInputState = (input) => {
        if (input.value.trim() !== '') {
            input.classList.add('has-value');
        } else {
            input.classList.remove('has-value');
        }
    };

    // Initialize state on load (for browser autofill)
    [emailInput, passwordInput].forEach(input => {
        // Initial check
        updateInputState(input);
        
        // Check on input and blur
        input.addEventListener('input', () => updateInputState(input));
        input.addEventListener('blur', () => updateInputState(input));
    });

    // Handle delayed autofill checks
    setTimeout(() => {
        updateInputState(emailInput);
        updateInputState(passwordInput);
    }, 100);

    // --- Password Visibility Toggle ---
    togglePasswordBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Update icon
        const icon = togglePasswordBtn.querySelector('svg');
        if (type === 'text') {
            // Eye-off icon
            icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
            icon.setAttribute('viewBox', '0 0 24 24');
        } else {
            // Eye icon
            icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
            icon.setAttribute('viewBox', '0 0 24 24');
        }
    });

    // --- Form Submission & Validation ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Reset state
        errorMessage.style.display = 'none';
        emailGroup.classList.remove('has-error');
        passwordGroup.classList.remove('has-error');
        loginBtn.classList.add('loading');
        
        // Lock button during loading
        let btnText = loginBtn.textContent;
        loginBtn.disabled = true;

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        // Hit webhook for authentication
        fetch('https://n8n.srv917960.hstgr.cloud/webhook/admin-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Authentication failed');
            }
            return response.json().catch(() => ({})); // Parse JSON safely
        })
        .then(data => {
            // successful login
            if (data && data.token) {
                localStorage.setItem('jwtToken', data.token);
            } else if (data && data.jwt) {
                localStorage.setItem('jwtToken', data.jwt);
            }
            window.location.href = 'index.html';
        })
        .catch(error => {
            console.error('Login error:', error);
            emailGroup.classList.add('has-error');
            passwordGroup.classList.add('has-error');
            errorMessage.textContent = 'Invalid credentials. Please verify your access.';
            errorMessage.style.display = 'block';
            
            loginBtn.classList.remove('loading');
            loginBtn.disabled = false;
        });
    });

    // Clear error state on subsequent input
    [emailInput, passwordInput].forEach(input => {
        input.addEventListener('input', () => {
            errorMessage.style.display = 'none';
            emailGroup.classList.remove('has-error');
            passwordGroup.classList.remove('has-error');
        });
    });
});
