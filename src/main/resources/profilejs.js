/* profilejs.js - modal editor version */
(() => {
  'use strict';

  const STORAGE_KEY = 'profileData';

  // DOM references
  const editBtn = document.getElementById('editProfileBtn');
  const modal = document.getElementById('profileEditModal');
  const dialog = modal && modal.querySelector('.modal-dialog');
  const closeBtn = document.getElementById('closeProfileEdit');
  const cancelBtn = document.getElementById('cancelProfile');
  const form = document.getElementById('profileEditForm');
  const inputName = document.getElementById('editName');
  const inputUsername = document.getElementById('editUsername');
  const inputBio = document.getElementById('editBio');
  const inputPicture = document.getElementById('editPicture');

  const profileNameEl = document.querySelector('.profile-info h1');
  const profileUsernameEl = document.querySelector('.username');
  const profileBioEl = document.querySelector('.bio');
  const profilePictureEl = document.querySelector('.profile-picture img');

  // Utility: load saved profile
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

  // Utility: write profile to storage and DOM
  function applyAndSave({ name, username, bio, picture }) {
    const payload = {
      name: name || (profileNameEl ? profileNameEl.textContent.trim() : ''),
      username: username || (profileUsernameEl ? profileUsernameEl.textContent.replace(/^@/, '').trim() : ''),
      bio: bio || (profileBioEl ? profileBioEl.textContent.trim() : ''),
      picture: picture || (profilePictureEl ? profilePictureEl.src : '')
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (e) { console.warn(e); }
    // update DOM
    if (profileNameEl) profileNameEl.textContent = payload.name;
    if (profileUsernameEl) profileUsernameEl.textContent = '@' + payload.username;
    if (profileBioEl) profileBioEl.textContent = payload.bio;
    if (profilePictureEl && payload.picture) profilePictureEl.src = payload.picture;
  }

  // Open modal and populate fields
  function openModal() {
    const data = loadProfileData() || {
      name: profileNameEl ? profileNameEl.textContent.trim() : '',
      username: profileUsernameEl ? profileUsernameEl.textContent.replace(/^@/, '').trim() : '',
      bio: profileBioEl ? profileBioEl.textContent.trim() : '',
      picture: profilePictureEl ? profilePictureEl.src : ''
    };
    inputName.value = data.name || '';
    inputUsername.value = data.username || '';
    inputBio.value = data.bio || '';
    inputPicture.value = data.picture || '';
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    // trap focus: focus first input
    setTimeout(() => inputName.focus(), 80);
    document.addEventListener('keydown', onKeyDown);
    lastFocused = document.activeElement;
  }

  // Close modal and restore focus
  let lastFocused = null;
  function closeModal() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.removeEventListener('keydown', onKeyDown);
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  // Keyboard handling: Esc closes modal
  function onKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeModal();
    }
    // trap focus inside dialog (basic)
    if (e.key === 'Tab' && dialog) {
      const focusable = dialog.querySelectorAll('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  // Form submit handler
  function onSubmit(e) {
    e.preventDefault();
    // Basic validation
    if (!inputName.value.trim()) { inputName.focus(); return; }
    if (!inputUsername.value.trim()) { inputUsername.focus(); return; }
    // optional: sanitize username (remove leading @)
    const username = inputUsername.value.trim().replace(/^@/, '');
    const payload = {
      name: inputName.value.trim(),
      username,
      bio: inputBio.value.trim(),
      picture: inputPicture.value.trim()
    };
    applyAndSave(payload);
    closeModal();
    // small success feedback
    try { alert('Profile updated successfully'); } catch (e) {}
  }

  // Initialize: attach listeners if elements exist
  function init() {
    // If modal elements are missing, do nothing
    if (!modal || !form) return;

    // Load existing data into DOM on page load
    const saved = loadProfileData();
    if (saved) applyAndSave(saved);

    // Attach triggers
    if (editBtn) editBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    form.addEventListener('submit', onSubmit);

    // Close when clicking backdrop
    modal.addEventListener('click', (ev) => { if (ev.target === modal) closeModal(); });

    // Prevent accidental form submission by Enter on inputs except when focused on textarea
    const inputs = form.querySelectorAll('input');
    inputs.forEach(inp => {
      inp.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' && inp.tagName.toLowerCase() === 'input') {
          // allow Enter to submit only when focused on last field or when explicitly submitting
          // here we do nothing special; form submit will handle validation
        }
      });
    });
  }

  // Run init when DOM ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();

/* =========================
   MY ARTWORKS (loaded from servlet)
   ========================= */
(() => {
  'use strict';

  const grid = document.getElementById('myArtGrid');
  const emptyMsg = document.getElementById('myArtEmpty');
  if (!grid) return;

  const modal = document.getElementById('myArtModal');
  const closeBtn = document.getElementById('closeMyArtModal');
  const modalImage = document.getElementById('myArtModalImage');
  const modalTitle = document.getElementById('myArtModalTitle');
  const modalCategory = document.getElementById('myArtModalCategory');
  const modalDescription = document.getElementById('myArtModalDescription');
  const modalStats = document.getElementById('myArtModalStats');

  function openArtModal(art) {
    if (!modal) return;
    if (modalImage) { modalImage.src = art.image || ''; modalImage.alt = art.title || ''; }
    if (modalTitle) modalTitle.textContent = art.title || '';
    if (modalCategory) modalCategory.textContent = art.category || '';
    if (modalDescription) modalDescription.textContent = art.description || '';
    if (modalStats) modalStats.textContent = '♥ ' + (art.likes || 0) + '   💬 ' + ((art.comments || []).length);
    
    // NEW: point "View in Gallery →" at this specific artwork
    const viewLink = modal.querySelector('.my-art-modal-link');
    if (viewLink) {
      viewLink.href = 'gallery.html?art=' + encodeURIComponent(art.id);
    }
    
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeArtModal() {
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
  }

  if (closeBtn) closeBtn.addEventListener('click', closeArtModal);
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeArtModal(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal && modal.classList.contains('show')) closeArtModal();
  });

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
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openArtModal(art); }
    });

    return card;
  }

  // ---- Update the header artwork count ----
  function updateArtworkCount(count) {
    // Look for the "Artworks" stat number in the profile header
    const stats = document.querySelectorAll('.profile-stats .stat');
    stats.forEach(stat => {
      const label = stat.querySelector('span');
      const num = stat.querySelector('strong');
      if (label && num && label.textContent.trim().toLowerCase() === 'artworks') {
        num.textContent = count;
      }
    });
  }

  // ---- Get the logged-in user's handle ----
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

  // ---- Render ----
  async function renderMyArt() {
    grid.innerHTML = '';

    const currentUser = getActiveUser();

    if (!currentUser) {
      if (emptyMsg) {
        emptyMsg.textContent = 'Log in to see your published artworks.';
        emptyMsg.classList.remove('hidden');
      }
      updateArtworkCount(0);
      return;
    }

    const handle = '@' + (currentUser.name || currentUser.username || '');

    try {
      const mine = await window.API.getPostsByArtist(handle);

      updateArtworkCount(mine.length);

      if (!mine.length) {
        if (emptyMsg) {
          emptyMsg.innerHTML = '';
          emptyMsg.textContent = "You haven't published any artwork yet. ";
          const link = document.createElement('a');
          link.href = 'create.html';
          link.textContent = 'Upload your first piece →';
          emptyMsg.appendChild(link);
          emptyMsg.classList.remove('hidden');
        }
        return;
      }

      if (emptyMsg) emptyMsg.classList.add('hidden');
      mine.forEach(art => grid.appendChild(buildCard(art)));

    } catch (err) {
      console.error('[profilejs] Failed to load your artworks:', err);
      if (emptyMsg) {
        emptyMsg.textContent = 'Could not load your artworks. Is the backend running?';
        emptyMsg.classList.remove('hidden');
      }
      updateArtworkCount(0);
    }
  }

  renderMyArt();

  // Re-render when login state changes in this tab
  const authBtn = document.getElementById('authBtn');
  if (authBtn) authBtn.addEventListener('click', () => setTimeout(renderMyArt, 300));

  const openLoginBtn = document.getElementById('openLogin');
  if (openLoginBtn) openLoginBtn.addEventListener('click', () => setTimeout(renderMyArt, 300));
})();