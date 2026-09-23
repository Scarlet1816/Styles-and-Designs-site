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

switchAuth.addEventListener('click', ()=>{
  isSignUp=!isSignUp;
  if(isSignUp){
    authTitle.textContent='Sign up';
    authSubtitle.textContent='Create your artist account!';
    emailGroup.classList.remove('hidden');
    authBtn.textContent='Create Account';
    switchText.textContent='Already have an account?';
    switchAuth.textContent='Log in';
  } else {
    authTitle.textContent='Log in';
    authSubtitle.textContent='Welcome back, artist!';
    emailGroup.classList.add('hidden');
    authBtn.textContent='Log in';
    switchText.textContent="Don't have an account?";
    switchAuth.textContent='Sign up';
  }
});

/* Sign up / Login handler */
authBtn.addEventListener('click', ()=>{
  const username=usernameInput.value.trim();
  const password=passwordInput.value.trim();
  const email=emailInput.value.trim();
  if(!username||!password){ alert('Enter username and password.'); return; }

  let accounts=JSON.parse(localStorage.getItem('gd_accounts')||'[]');

  if(isSignUp){
    if(!email){ alert('Enter email.'); return; }
    if(accounts.find(acc=>acc.username===username)){
      alert('Username already exists.'); return;
    }
    accounts.push({username,email,password});
    localStorage.setItem('gd_accounts',JSON.stringify(accounts));
    alert('Account created!');
    isSignUp=false;
    return;
  }

  const account=accounts.find(acc=>acc.username===username&&acc.password===password);
  if(!account){ alert('Incorrect credentials.'); return; }

  user={name:account.username,email:account.email};
  window.user=user;
  if(rememberMe.checked) localStorage.setItem('gd_user',JSON.stringify(user));
  else sessionStorage.setItem('gd_user',JSON.stringify(user));
  loginModal.classList.remove('show');
  alert('Welcome, '+account.username+'!');
  updateLoginButton();
});

/* Restore session */
const savedUser=localStorage.getItem('gd_user')||sessionStorage.getItem('gd_user');
if(savedUser){ user=JSON.parse(savedUser); window.user=user; }
updateLoginButton();

/* GOOGLE SIGN-IN */
window.handleGoogleSignIn=(response)=>{
  const data=jwt_decode(response.credential); // requires jwt-decode library
  user={name:data.name,email:data.email};
  window.user=user;
  localStorage.setItem('gd_user',JSON.stringify(user));
  updateLoginButton();
  alert('Welcome, '+data.name+'!');
};
