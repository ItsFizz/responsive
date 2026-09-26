// ===================================
// FreshFind - Signup JavaScript
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    initSignup();
    initPasswordToggle();
});

// === USERS STORAGE ===
// All registered accounts are kept in localStorage under 'freshfind_users'
function getUsers() {
    return JSON.parse(localStorage.getItem('freshfind_users')) || [];
}

function saveUsers(users) {
    localStorage.setItem('freshfind_users', JSON.stringify(users));
}

// === SIGNUP ===
function initSignup() {
    const form = document.getElementById('signupForm');
    const nameInput = document.getElementById('signupName');
    const emailInput = document.getElementById('signupEmail');
    const passwordInput = document.getElementById('signupPassword');
    const confirmPasswordInput = document.getElementById('signupConfirmPassword');
    const agreeTerms = document.getElementById('agreeTerms');

    if (!form) return;

    passwordInput.addEventListener('input', function() {
        checkPasswordStrength(this.value);
    });
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (!name || !email || !password || !confirmPassword) { showError('Please fill in all fields'); return; }
        if (!isValidEmail(email)) { showError('Please enter a valid email address'); return; }
        if (password.length < 6) { showError('Password must be at least 6 characters'); return; }
        if (password !== confirmPassword) { showError('Passwords do not match'); shakeElement(confirmPasswordInput.parentElement); return; }
        if (!agreeTerms.checked) { showError('Please agree to the Terms of Service'); return; }

        // Username and email must be unique (password may repeat)
        const users = getUsers();
        if (users.some(u => u.name.toLowerCase() === name.toLowerCase())) {
            showError('Username already taken'); shakeElement(nameInput.parentElement); return;
        }
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            showError('Email is already in use'); shakeElement(emailInput.parentElement); return;
        }

        // Start epic animation
        const submitBtn = form.querySelector('.btn-submit');
        startDoorAnimation(submitBtn).then(() => {
            // Actual signup logic after animation
            performSignup(name, email, password);
        });
    });
}

function checkPasswordStrength(password) {
    const strengthContainer = document.getElementById('passwordStrength');
    if (!strengthContainer) return;
    
    const strengthText = strengthContainer.querySelector('.strength-text');
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    strengthContainer.classList.remove('strength-weak', 'strength-medium', 'strength-strong');
    
    if (strength <= 2) {
        strengthContainer.classList.add('strength-weak');
        if (strengthText) strengthText.textContent = 'Weak password';
    } else if (strength <= 3) {
        strengthContainer.classList.add('strength-medium');
        if (strengthText) strengthText.textContent = 'Medium password';
    } else {
        strengthContainer.classList.add('strength-strong');
        if (strengthText) strengthText.textContent = 'Strong password';
    }
}

function performSignup(name, email, password) {
    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.innerHTML = '<span>Creating account...</span>';
    submitBtn.disabled = true;
    
    setTimeout(() => {
        const users = getUsers();
        users.push({
            name: name,
            email: email,
            password: password,
            signupTime: new Date().toISOString()
        });
        saveUsers(users);

        showSuccessModal();

        // Redirect to login page so the user can log in with these credentials
        setTimeout(() => {
            window.location.href = 'freshfind-login.html';
        }, 2000);
    }, 1500);
}

// === PASSWORD TOGGLE (FIXED - eye stays inside border) ===
function initPasswordToggle() {
    const toggleBtns = document.querySelectorAll('.toggle-password');
    
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const input = this.closest('.input-wrapper').querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('bi-eye');
                icon.classList.add('bi-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('bi-eye-slash');
                icon.classList.add('bi-eye');
            }
        });
    });
}

// === SUCCESS MODAL ===
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) modal.classList.add('active');
    
    // Play notification sound
    playNotificationSound();
}

// === NOTIFICATION SOUND ===
function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create a pleasant "ting" notification sound
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Set frequency for a pleasant bell-like sound
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
        
        // Set volume envelope for a natural decay
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        // Play the sound
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
        
    } catch (error) {
        console.log('Audio not supported');
    }
}

// === VALIDATION ===
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// === ERROR NOTIFICATION ===
function showError(message) {
    const existing = document.querySelector('.error-notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #E74C3C;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(231, 76, 60, 0.3);
        z-index: 10000;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        animation: slideInRight 0.3s ease;
        font-family: 'DM Sans', sans-serif;
    `;
    
    notification.innerHTML = `<i class="bi bi-exclamation-circle" style="font-size: 1.3rem;"></i><span>${message}</span>`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function shakeElement(element) {
    element.style.animation = 'none';
    setTimeout(() => {
        element.style.animation = 'shake 0.5s ease';
    }, 10);
}

// === INJECT ANIMATIONS ===
const authStyle = document.createElement('style');
authStyle.textContent = `
    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(100px); }
        to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes shake {
        0%,100% { transform: translateX(0); }
        20%,60% { transform: translateX(-8px); }
        40%,80% { transform: translateX(8px); }
    }
`;
document.head.appendChild(authStyle);
// === EPIC DOOR ANIMATION ===
async function startDoorAnimation(btn) {
    btn.disabled = true;
    
    // Phase 1: Door open
    btn.classList.add('dooropen');
    await wait(300);
    
    // Phase 2: Walking 
    btn.classList.add('walking');
    btn.classList.add('out');
    await wait(750);
    
    // Phase 3: Remove classes and add happy
    btn.classList.remove('walking', 'dooropen');
    btn.classList.add('is-happy');
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
