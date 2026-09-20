/* =========================
   LOGIN VARIABLES
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

/* =========================
     LOGIN / SIGN UP SYSTEM
     ========================= */

  function updateLoginButton(){
    if(openLogin){
      openLogin.textContent = user ? 'Logout' : 'Log in';
    }
  }

  function openLoginModal(){
    loginModal.classList.add('show');
    loginModal.setAttribute('aria-hidden','false');
    setTimeout(()=>usernameInput && usernameInput.focus(), 120);
  }

  openLogin.addEventListener('click', ()=>{
    if(user){
      const confirmLogout = confirm('Do you want to log out?');
      if(confirmLogout){
        user = null;
        window.user = null;
        localStorage.removeItem('gd_user');
        sessionStorage.removeItem('gd_user');
         localStorage.removeItem('profileData');
        localStorage.removeItem('saved_arts');
        updateLoginButton();
        alert('You have been logged out.');
      }
    }else{
      openLoginModal();
    }
  });

  closeLogin.addEventListener('click', ()=>{ loginModal.classList.remove('show'); loginModal.setAttribute('aria-hidden','true'); });
  loginModal.addEventListener('click', e=>{ if(e.target === loginModal){ loginModal.classList.remove('show'); loginModal.setAttribute('aria-hidden','true'); } });

  togglePassword.addEventListener('click', ()=>{
    if(passwordInput.type === 'password'){ passwordInput.type = 'text'; togglePassword.textContent = '🙈'; }
    else { passwordInput.type = 'password'; togglePassword.textContent = '👁'; }
  });

  switchAuth.addEventListener('click', ()=>{
    isSignUp = !isSignUp;
    if(isSignUp){
      authTitle.textContent = 'Sign up';
      authSubtitle.textContent = 'Create your artist account!';
      emailGroup.classList.remove('hidden');
      authBtn.textContent = 'Create Account';
      switchText.textContent = 'Already have an account?';
      switchAuth.textContent = 'Log in';
    }else{
      authTitle.textContent = 'Log in';
      authSubtitle.textContent = 'Welcome back, artist!';
      emailGroup.classList.add('hidden');
      authBtn.textContent = 'Log in';
      switchText.textContent = "Don't have an account?";
      switchAuth.textContent = 'Sign up';
    }
  });

  /* Sign up / Login handler */
  authBtn.addEventListener('click', ()=>{
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    const email = emailInput.value.trim();

    if(!username || !password){
      alert('Please enter your username and password.');
      return;
    }

    if(isSignUp){
      if(!email){
        alert('Please enter your email.');
        return;
      }
      const existingUser = JSON.parse(localStorage.getItem('gd_account') || 'null');
      if(existingUser){
        alert('An account is already registered in this browser.');
        return;
      }
      const account = { username: username, email: email, password: password };
      localStorage.setItem('gd_account', JSON.stringify(account));
            alert('Account created successfully!');
      window.location.href = 'welcome.html';
      return;
      // Switch back to login
      isSignUp = false;
      authTitle.textContent = 'Log in';
      authSubtitle.textContent = 'Welcome back, artist!';
      emailGroup.classList.add('hidden');
      authBtn.textContent = 'Log in';
      switchText.textContent = "Don't have an account?";
      switchAuth.textContent = 'Sign up';
      return;
    }

    // LOGIN flow
    const account = JSON.parse(localStorage.getItem('gd_account') || 'null');
    if(!account){
      alert('No account found. Please sign up first.');
      return;
    }
    if(username !== account.username || password !== account.password){
      alert('Incorrect username or password.');
      return;
    }

    // LOGIN SUCCESS
    user = { name: account.username, email: account.email };
    window.user = user;  // <-- add this line
    if(rememberMe.checked){
      localStorage.setItem('gd_user', JSON.stringify(user));
    }else{
      sessionStorage.setItem('gd_user', JSON.stringify(user));
    }
    loginModal.classList.remove('show');
    loginModal.setAttribute('aria-hidden','true');
    alert('Welcome, ' + account.username + '!');
    updateLoginButton();
  });

  /* Restore login if present */
  const savedUser = localStorage.getItem('gd_user') || sessionStorage.getItem('gd_user');
  if(savedUser) {
    user = JSON.parse(savedUser);
    window.user = user;
  }
  updateLoginButton();
