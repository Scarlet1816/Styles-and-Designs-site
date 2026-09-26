/* =========================================================
   profilejs.js — profile editor + "My Artworks" from servlet
   Depends on: api.js (loaded BEFORE this file)
   Toggles body.no-scroll while either modal is open.
   ========================================================= */

/* =========================================================
   SCROLL LOCK HELPERS (shared by both modals in this file)
   ========================================================= */
function lockScroll() {
  document.body.classList.add("no-scroll");
}

function unlockScroll() {
  /* Only unlock if no other modal is still open */
  const anyOpen = document.querySelector(
    '.art-modal.show, .login-modal.show, .my-art-modal.show, .modal.show'
  );
  if (!anyOpen) document.body.classList.remove("no-scroll");
}


/* =========================================================
   PART 1 — PROFILE EDITOR
   ========================================================= */
(function () {
  'use strict';

  const STORAGE_KEY = 'profileData';

  /* DOM references */
  const editBtn          = document.getElementById('editProfileBtn');
  const modal            = document.getElementById('profileEditModal');
  const dialog           = modal && modal.querySelector('.modal-dialog');
  const closeBtn         = document.getElementById('closeProfileEdit');
  const cancelBtn        = document.getElementById('cancelProfile');
  const form             = document.getElementById('profileEditForm');
  const inputName        = document.getElementById('editName');
  const inputUsername    = document.getElementById('editUsername');
  const inputBio         = document.getElementById('editBio');
  const inputPicture     = document.getElementById('editPicture');

  const profileNameEl     = document.querySelector('.profile-info h1');
  const profileUsernameEl = document.querySelector('.username');
  const profileBioEl      = document.querySelector('.bio');
  const profilePictureEl  = document.querySelector('.profile-picture img');

  let lastFocused = null;

  /* ---------- Utilities ---------- */
  function loadProfileData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Invalid profile data, clearing', e);
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  function applyAndSave(data) {
    const payload = {
      name:     data.name     || (profileNameEl     ? profileNameEl.textContent.trim() : ''),
      username: data.username || (profileUsernameEl ? profileUsernameEl.textContent.replace(/^@/, '').trim() : ''),
      bio:      data.bio      || (profileBioEl      ? profileBioEl.textContent.trim() : ''),
      picture:  data.picture  || (profilePictureEl  ? profilePictureEl.src : '')
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) { console.warn(e); }

    if (profileNameEl)     profileNameEl.textContent = payload.name;
    if (profileUsernameEl) profileUsernameEl.textContent = '@' + payload.username;
    if (profileBioEl)      profileBioEl.textContent = payload.bio;
    if (profilePictureEl && payload.picture) profilePictureEl.src = payload.picture;
  }

  /* ---------- Modal open/close ---------- */
  function openModal() {
    if (!modal) return;

    const data = loadProfileData() || {
      name:     profileNameEl     ? profileNameEl.textContent.trim() : '',
      username: profileUsernameEl ? profileUsernameEl.textContent.replace(/^@/, '').trim() : '',
      bio:      profileBioEl      ? profileBioEl.textContent.trim() : '',
      picture:  profilePictureEl  ? profilePictureEl.src : ''
    };

    if (inputName)     inputName.value     = data.name     || '';
    if (inputUsername) inputUsername.value = data.username || '';
    if (inputBio)      inputBio.value      = data.bio      || '';
    if (inputPicture)  inputPicture.value  = data.picture  || '';

    lastFocused = document.activeElement;

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    lockScroll();

    setTimeout(() => { if (inputName) inputName.focus(); }, 80);
    document.addEventListener('keydown', onKeyDown);
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', onKeyDown);

    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();

    unlockScroll();
  }

  /* ---------- Keyboard: Esc + focus trap ---------- */
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      /* If a login modal is also open, let loginjs handle Escape */
      const loginOpen = document.querySelector('.login-modal.show');
      if (loginOpen) return;

      e.preventDefault();
      closeModal();
      return;
    }
    if (e.key === 'Tab' && dialog) {
      const focusable = dialog.querySelectorAll(
        'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  /* ---------- Submit ---------- */
  function onSubmit(e) {
    e.preventDefault();

    if (!inputName     || !inputName.value.trim())     { if (inputName) inputName.focus(); return; }
    if (!inputUsername || !inputUsername.value.trim()) { if (inputUsername) inputUsername.focus(); return; }

    const username = inputUsername.value.trim().replace(/^@/, '');

    applyAndSave({
      name:     inputName.value.trim(),
      username: username,
      bio:      inputBio     ? inputBio.value.trim()     : '',
      picture:  inputPicture ? inputPicture.value.trim() : ''
    });

    closeModal();
    try { alert('Profile updated successfully'); } catch (e) {}
  }

  /* ---------- Init ---------- */
  function init() {
    if (!modal || !form) return;

    const saved = loadProfileData();
    if (saved) applyAndSave(saved);

    if (editBtn)   editBtn.addEventListener('click', openModal);
    if (closeBtn)  closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    form.addEventListener('submit', onSubmit);

    modal.addEventListener('click', (ev) => {
      if (ev.target === modal) closeModal();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


/* =========================================================
   PART 2 — MY ARTWORKS (loaded from servlet)
   Also supports ?artist=@handle for viewing other artists.
   ========================================================= */
(function () {
  'use strict';

  const grid     = document.getElementById('myArtGrid');
  const emptyMsg = document.getElementById('myArtEmpty');
  if (!grid) return;

  const modal          = document.getElementById('myArtModal');
  const closeBtn       = document.getElementById('closeMyArtModal');
  const modalImage     = document.getElementById('myArtModalImage');
  const modalTitle     = document.getElementById('myArtModalTitle');
  const modalCategory  = document.getElementById('myArtModalCategory');
  const modalDescription = document.getElementById('myArtModalDescription');
  const modalStats     = document.getElementById('myArtModalStats');

  /* ---------- Modal open/close ---------- */
  function openArtModal(art) {
    if (!modal) return;
    if (modalImage)       { modalImage.src = art.image || ''; modalImage.alt = art.title || ''; }
    if (modalTitle)       modalTitle.textContent = art.title || '';
    if (modalCategory)    modalCategory.textContent = art.category || '';
    if (modalDescription) modalDescription.textContent = art.description || '';
    if (modalStats)       modalStats.textContent =
      '♥ ' + (art.likes || 0) + '   💬 ' + ((art.comments || []).length);

    const viewLink = modal.querySelector('.my-art-modal-link');
    if (viewLink) {
      viewLink.href = 'index.html?art=' + encodeURIComponent(art.id);
    }

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    lockScroll();
  }

  function closeArtModal() {
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    unlockScroll();
  }

  if (closeBtn) closeBtn.addEventListener('click', closeArtModal);
  if (modal)    modal.addEventListener('click', e => {
    if (e.target === modal) closeArtModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal && modal.classList.contains('show')) {
      /* If a login modal is also open, let loginjs handle Escape */
      const loginOpen = document.querySelector('.login-modal.show');
      if (loginOpen) return;
      closeArtModal();
    }
  });

  /* ---------- Build card ---------- */
  function buildCard(art) {
    const card = document.createElement('div');
    card.className = 'art-card';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');

    const img = document.createElement('img');
    img.src = art.image || '';
    img.alt = art.title || '';

    const info = document.createElement('div');
    info.className = 'art-info';

    const h3 = document.createElement('h3');
    h3.textContent = art.title || '';

    const p = document.createElement('p');
    p.textContent = art.category || '';

    info.appendChild(h3);
    info.appendChild(p);
    card.appendChild(img);
    card.appendChild(info);

    card.addEventListener('click', () => openArtModal(art));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openArtModal(art);
      }
    });

    return card;
  }

  /* ---------- Update header artwork count ---------- */
  function updateArtworkCount(count) {
    const stats = document.querySelectorAll('.profile-stats .stat');
    stats.forEach(stat => {
      const label = stat.querySelector('span');
      const num   = stat.querySelector('strong');
      if (label && num && label.textContent.trim().toLowerCase() === 'artworks') {
        num.textContent = count;
      }
    });
  }

  /* ---------- Get logged-in user ---------- */
  function getActiveUser() {
    try {
      return JSON.parse(
        localStorage.getItem('gd_user') ||
        sessionStorage.getItem('gd_user') ||
        'null'
      );
    } catch (e) {
      return null;
    }
  }

  /* ---------- Which handle to show? ---------- */
  function getTargetHandle() {
    const params = new URLSearchParams(window.location.search);
    const urlArtist = params.get('artist');
    if (urlArtist) {
      const clean = urlArtist.trim().replace(/^@/, '');
      return { handle: '@' + clean, isOwn: false };
    }

    const currentUser = getActiveUser();
    if (currentUser) {
      const name = (currentUser.name || currentUser.username || '').trim();
      return { handle: '@' + name, isOwn: true };
    }

    return null;
  }

  /* ---------- Update the header for other artists ---------- */
  function renderHeaderForOtherArtist(handle, arts) {
    const nameEl     = document.querySelector('.profile-info h1');
    const usernameEl = document.querySelector('.username');
    const bioEl      = document.querySelector('.bio');
    const picEl      = document.querySelector('.profile-picture img');
    const editBtn    = document.getElementById('editProfileBtn');

    if (nameEl)     nameEl.textContent = handle.replace(/^@/, '');
    if (usernameEl) usernameEl.textContent = handle;
    if (bioEl)      bioEl.textContent = 'Artist profile.';
    if (picEl)      picEl.src = arts[0] && arts[0].image ? arts[0].image : 'profile.jpg';
    if (editBtn)    editBtn.style.display = 'none';

    const myArtHeading = document.getElementById('myArtHeading');
    if (myArtHeading) myArtHeading.textContent = 'Artworks';
  }

  /* ---------- Render ---------- */
  async function renderMyArt() {
    grid.innerHTML = '';

    const target = getTargetHandle();

    if (!target) {
      if (emptyMsg) {
        emptyMsg.textContent = 'Log in to see your published artworks.';
        emptyMsg.classList.remove('hidden');
      }
      updateArtworkCount(0);
      return;
    }

    try {
      const mine = await window.API.getPostsByArtist(target.handle);

      updateArtworkCount(mine.length);

      if (!target.isOwn) {
        renderHeaderForOtherArtist(target.handle, mine);
      }

      if (!mine.length) {
        if (emptyMsg) {
          emptyMsg.innerHTML = '';
          if (target.isOwn) {
            emptyMsg.textContent = "You haven't published any artwork yet. ";
            const link = document.createElement('a');
            link.href = 'create.html';
            link.textContent = 'Upload your first piece →';
            emptyMsg.appendChild(link);
          } else {
            emptyMsg.textContent = 'This artist hasn\u2019t published any artwork yet.';
          }
          emptyMsg.classList.remove('hidden');
        }
        return;
      }

      if (emptyMsg) emptyMsg.classList.add('hidden');
      mine.forEach(art => grid.appendChild(buildCard(art)));

    } catch (err) {
      console.error('[profilejs] Failed to load artworks:', err);
      if (emptyMsg) {
        emptyMsg.textContent = 'Could not load artworks. Is the backend running?';
        emptyMsg.classList.remove('hidden');
      }
      updateArtworkCount(0);
    }
  }

  renderMyArt();

  /* Re-render after login state changes in this tab */
  const authBtnEl = document.getElementById('authBtn');
  if (authBtnEl) authBtnEl.addEventListener('click', () => setTimeout(renderMyArt, 300));

  const openLoginBtn = document.getElementById('openLogin');
  if (openLoginBtn) openLoginBtn.addEventListener('click', () => setTimeout(renderMyArt, 300));

  /* Cross-tab sync */
  window.addEventListener('storage', function (event) {
    if (event.key === 'gd_user') renderMyArt();
  });
})();