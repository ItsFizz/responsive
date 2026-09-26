// ===================================
// FreshFind - Login JavaScript
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    initLogin();
    initPasswordToggle();
});

// === USERS STORAGE ===
function getUsers() {
    return JSON.parse(localStorage.getItem('freshfind_users')) || [];
}

// === LOGIN ===
function initLogin() {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');

    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (!email || !password) { showError('Please fill in all fields'); return; }
        if (!isValidEmail(email)) { showError('Please enter a valid email address'); return; }

        // Match credentials with accounts saved at signup
        const user = getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) { showError('No account found with this email'); shakeElement(emailInput.parentElement); return; }
        if (user.password !== password) { showError('Incorrect password'); shakeElement(passwordInput.parentElement); return; }

        // Start epic door animation, then log the user in
        const submitBtn = form.querySelector('.btn-submit');
        startDoorAnimation(submitBtn).then(() => {
            performLogin(user);
        });
    });

    // Input focus animations
    [emailInput, passwordInput].forEach(input => {
        input.addEventListener('focus', function() {
            this.closest('.input-wrapper').style.transform = 'translateY(-2px)';
        });
        input.addEventListener('blur', function() {
            this.closest('.input-wrapper').style.transform = 'translateY(0)';
        });
    });
}

function performLogin(user) {
    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.innerHTML = '<span>Logging in...</span>';
    submitBtn.disabled = true;

    setTimeout(() => {
        const userData = {
            name: user.name,
            email: user.email,
            loggedIn: true,
            loginTime: new Date().toISOString()
        };

        localStorage.setItem('freshfind_user', JSON.stringify(userData));
        localStorage.setItem('freshfind_token', 'demo_token_' + Date.now());

        showSuccessModal();

        // Redirect to the originally intended page, or index.html as fallback
        setTimeout(() => {
            let dest = 'index.html';
            try {
                const saved = sessionStorage.getItem('freshfind_redirect');
                if (saved) {
                    sessionStorage.removeItem('freshfind_redirect');
                    dest = saved;
                }
            } catch (e) {}
            window.location.href = dest;
        }, 2000);
    }, 1500);
}

// === PASSWORD TOGGLE ===
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

    playNotificationSound();
}

// === NOTIFICATION SOUND ===
function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

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
    
    // Phase 3: Stop the walk cycle, show the happy state and settle the door
    // ('out' is kept so the figure stays at the door while 'is-happy' fades it out)
    btn.classList.remove('walking', 'dooropen');
    btn.classList.add('is-happy');
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
