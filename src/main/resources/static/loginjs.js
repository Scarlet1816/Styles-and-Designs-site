/* =========================================================
   loginjs.js — multi-account + Google login (null-safe)
   Toggles body.no-scroll while the login modal is open.
   ========================================================= */

let user = null;
window.user = null;
let isSignUp = false;

/* ---- Elements (all null-safe) ---- */
const loginModal     = document.getElementById('loginModal');
const openLogin      = document.getElementById('openLogin');
const closeLogin     = document.getElementById('closeLogin');
const authTitle      = document.getElementById('authTitle');
const authSubtitle   = document.getElementById('authSubtitle');
const emailGroup     = document.getElementById('emailGroup');
const emailInput     = document.getElementById('emailInput');
const usernameInput  = document.getElementById('usernameInput');
const passwordInput  = document.getElementById('passwordInput');
const togglePassword = document.getElementById('togglePassword');
const rememberMe     = document.getElementById('rememberMe');
const authBtn        = document.getElementById('authBtn');
const switchAuth     = document.getElementById('switchAuth');
const switchText     = document.getElementById('switchText');

/* ---- Helpers ---- */
function updateLoginButton() {
  if (openLogin) openLogin.textContent = user ? 'Logout' : 'Log in';
}

function lockScroll() {
  document.body.classList.add('no-scroll');
}

function unlockScroll() {
  /* Only unlock if no other modal is open.
     (loginModal is the only one loginjs knows about, but other
     pages have their own modals — check the DOM for any .show) */
  const anyOpen = document.querySelector(
    '.login-modal.show, .art-modal.show, .my-art-modal.show, .modal.show'
  );
  if (!anyOpen) document.body.classList.remove('no-scroll');
}

function openLoginModal() {
  if (!loginModal) return;
  loginModal.classList.add('show');
  loginModal.setAttribute('aria-hidden', 'false');
  lockScroll();
  setTimeout(() => { if (usernameInput) usernameInput.focus(); }, 120);
}

function closeLoginModal() {
  if (!loginModal) return;
  loginModal.classList.remove('show');
  loginModal.setAttribute('aria-hidden', 'true');
  unlockScroll();
}

/* Expose globally so other scripts (createjs, indexjs, savedjs, profilejs)
   can open the login modal */
window.openLoginModal  = openLoginModal;
window.closeLoginModal = closeLoginModal;

/* ---- Login / Logout button ---- */
if (openLogin) {
  openLogin.addEventListener('click', () => {
    if (user) {
      if (confirm('Do you want to log out?')) {
        user = null;
        window.user = null;
        localStorage.removeItem('gd_user');
        sessionStorage.removeItem('gd_user');
        updateLoginButton();
        alert('Logged out.');
      }
    } else {
      openLoginModal();
    }
  });
}

if (closeLogin) closeLogin.addEventListener('click', closeLoginModal);

if (loginModal) {
  loginModal.addEventListener('click', e => {
    if (e.target === loginModal) closeLoginModal();
  });
}

/* ---- Show / hide password ---- */
if (togglePassword && passwordInput) {
  togglePassword.addEventListener('click', () => {
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      togglePassword.textContent = '🙈';
    } else {
      passwordInput.type = 'password';
      togglePassword.textContent = '👁';
    }
  });
}

/* ---- Switch login / signup mode ---- */
function setSignUpMode(signUp) {
  isSignUp = signUp;
  if (!authTitle || !authSubtitle || !authBtn || !switchText || !switchAuth) return;

  if (signUp) {
    authTitle.textContent = 'Sign up';
    authSubtitle.textContent = 'Create your artist account!';
    if (emailGroup) emailGroup.classList.remove('hidden');
    authBtn.textContent = 'Create Account';
    switchText.textContent = 'Already have an account?';
    switchAuth.textContent = 'Log in';
  } else {
    authTitle.textContent = 'Log in';
    authSubtitle.textContent = 'Welcome back, artist!';
    if (emailGroup) emailGroup.classList.add('hidden');
    authBtn.textContent = 'Log in';
    switchText.textContent = "Don't have an account?";
    switchAuth.textContent = 'Sign up';
  }
}

if (switchAuth) {
  switchAuth.addEventListener('click', () => setSignUpMode(!isSignUp));
}

/* ---- Email format check ---- */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ---- Signup / Login handler ---- */
if (authBtn) {
  authBtn.addEventListener('click', () => {
    const username = usernameInput ? usernameInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';
    const email    = emailInput    ? emailInput.value.trim()    : '';

    if (!username || !password) { alert('Enter username and password.'); return; }

    let accounts = [];
    try {
      accounts = JSON.parse(localStorage.getItem('gd_accounts') || '[]');
    } catch (e) { accounts = []; }

    if (isSignUp) {
      if (!email)               { alert('Enter email.'); return; }
      if (!isValidEmail(email)) { alert('Enter a valid email address.'); return; }
      if (accounts.find(acc => acc.username === username)) {
        alert('Username already exists.'); return;
      }

      accounts.push({ username, email, password });
      localStorage.setItem('gd_accounts', JSON.stringify(accounts));
      alert('Account created! You can now log in.');

      /* Switch back to login mode */
      setSignUpMode(false);
      if (usernameInput) usernameInput.value = username;
      if (passwordInput) passwordInput.value = '';
      return;
    }

    const account = accounts.find(
      acc => acc.username === username && acc.password === password
    );
    if (!account) { alert('Incorrect credentials.'); return; }

    user = { name: account.username, email: account.email };
    window.user = user;

    const remember = rememberMe ? rememberMe.checked : false;
    if (remember) localStorage.setItem('gd_user', JSON.stringify(user));
    else          sessionStorage.setItem('gd_user', JSON.stringify(user));

    closeLoginModal();
    alert('Welcome, ' + account.username + '!');
    updateLoginButton();
  });
}

/* ---- Restore session on load ---- */
try {
  const savedUser = localStorage.getItem('gd_user') || sessionStorage.getItem('gd_user');
  if (savedUser) {
    user = JSON.parse(savedUser);
    window.user = user;
  }
} catch (e) {
  console.warn('[loginjs] Could not restore session:', e);
}
updateLoginButton();

/* ---- Global Escape key: close login modal if it's open ---- */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && loginModal && loginModal.classList.contains('show')) {
    closeLoginModal();
  }
});

/* ---- GOOGLE SIGN-IN ---- */
window.handleGoogleSignIn = function (response) {
  try {
    if (typeof jwt_decode !== 'function') {
      throw new Error('jwt-decode library is not loaded.');
    }
    const data = jwt_decode(response.credential);
    user = { name: data.name, email: data.email };
    window.user = user;
    localStorage.setItem('gd_user', JSON.stringify(user));
    closeLoginModal();
    updateLoginButton();
    alert('Welcome, ' + data.name + '!');
  } catch (err) {
    console.error('[loginjs] Google sign-in failed:', err);
    alert('Google sign-in failed: ' + err.message);
  }
};
