/* =========================
   MULTI-ACCOUNT + GOOGLE LOGIN
   ========================= */

let user = null;
window.user = null;
let isSignUp = false;

/* Elements */
const loginModal = document.getElementById('loginModal');
const openLogin = document.getElementById('openLogin');
const closeLogin = document.getElementById('closeLogin');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const emailGroup = document.getElementById('emailGroup');
const emailInput = document.getElementById('emailInput');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const togglePassword = document.getElementById('togglePassword');
const rememberMe = document.getElementById('rememberMe');
const authBtn = document.getElementById('authBtn');
const switchAuth = document.getElementById('switchAuth');
const switchText = document.getElementById('switchText');

function updateLoginButton(){
  if(openLogin) openLogin.textContent = user ? 'Logout' : 'Log in';
}

function openLoginModal(){
  loginModal.classList.add('show');
  loginModal.setAttribute('aria-hidden','false');
  setTimeout(()=>usernameInput && usernameInput.focus(), 120);
}

openLogin.addEventListener('click', ()=>{
  if(user){
    if(confirm('Do you want to log out?')){
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

closeLogin.addEventListener('click', ()=> loginModal.classList.remove('show'));
loginModal.addEventListener('click', e=>{ if(e.target===loginModal) loginModal.classList.remove('show'); });

togglePassword.addEventListener('click', ()=>{
  if(passwordInput.type==='password'){ passwordInput.type='text'; togglePassword.textContent='🙈'; }
  else { passwordInput.type='password'; togglePassword.textContent='👁'; }
});

switch
