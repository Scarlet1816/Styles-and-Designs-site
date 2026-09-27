/* =========================================================
   profilejs.js — profile editor + My Artworks + Follow system
   ========================================================= */

function lockScroll() { document.body.classList.add("no-scroll"); }
function unlockScroll() {
  const anyOpen = document.querySelector(
    '.art-modal.show, .login-modal.show, .my-art-modal.show, .modal.show'
  );
  if (!anyOpen) document.body.classList.remove("no-scroll");
}

/* =========================================================
   FOLLOW STORAGE
   ========================================================= */
function getFollows() {
  try { return JSON.parse(localStorage.getItem("gd_follows") || "{}"); }
  catch (e) { return {}; }
}

function saveFollows(f) {
  localStorage.setItem("gd_follows", JSON.stringify(f));
}

function isFollowing(myHandle, theirHandle) {
  const f = getFollows();
  return Array.isArray(f[theirHandle]) && f[theirHandle].indexOf(myHandle) !== -1;
}

function toggleFollow(myHandle, theirHandle) {
  const f = getFollows();
  if (!Array.isArray(f[theirHandle])) f[theirHandle] = [];
  const idx = f[theirHandle].indexOf(myHandle);
  if (idx === -1) f[theirHandle].push(myHandle);
  else f[theirHandle].splice(idx, 1);
  saveFollows(f);
}

function getFollowerCount(handle) {
  const f = getFollows();
  return Array.isArray(f[handle]) ? f[handle].length : 0;
}

function getFollowingCount(handle) {
  const f = getFollows();
  let n = 0;
  for (const key in f) {
    if (Array.isArray(f[key]) && f[key].indexOf(handle) !== -1) n++;
  }
  return n;
}

/* =========================================================
   PART 1 — PROFILE EDITOR
   ========================================================= */
(function () {
  'use strict';
  const STORAGE_KEY = 'profileData';
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

  let lastFocused = null;

  function loadProfileData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function applyAndSave(data) {
    const payload = {
      name:     data.name     || (profileNameEl     ? profileNameEl.textContent.trim() : ''),
      username: data.username || (profileUsernameEl ? profileUsernameEl.textContent.replace(/^@/, '').trim() : ''),
      bio:      data.bio      || (profileBioEl      ? profileBioEl.textContent.trim() : ''),
      picture:  data.picture  || (profilePictureEl  ? profilePictureEl.src : '')
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); } catch (e) {}
    if (profileNameEl)     profileNameEl.textContent = payload.name;
    if (profileUsernameEl) profileUsernameEl.textContent = '@' + payload.username;
    if (profileBioEl)      profileBioEl.textContent = payload.bio;
    if (profilePictureEl && payload.picture) profilePictureEl.src = payload.picture;
  }

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
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    unlockScroll();
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!inputName     || !inputName.value.trim())     return;
    if (!inputUsername || !inputUsername.value.trim()) return;
    applyAndSave({
      name:     inputName.value.trim(),
      username: inputUsername.value.trim().replace(/^@/, ''),
      bio:      inputBio     ? inputBio.value.trim()     : '',
      picture:  inputPicture ? inputPicture.value.trim() : ''
    });
    closeModal();
  }

  function init() {
    if (!modal || !form) return;
    const saved = loadProfileData();
    if (saved) applyAndSave(saved);
    if (editBtn)   editBtn.addEventListener('click', openModal);
    if (closeBtn)  closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    form.addEventListener('submit', onSubmit);
    modal.addEventListener('click', (ev) => { if (ev.target === modal) closeModal(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

/* =========================================================
   PART 2 — MY ARTWORKS + FOLLOW
   ========================================================= */
(function () {
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
    if (modalImage)       { modalImage.src = art.image || ''; modalImage.alt = art.title || ''; }
    if (modalTitle)       modalTitle.textContent = art.title || '';
    if (modalCategory)    modalCategory.textContent = art.category || '';
    if (modalDescription) modalDescription.textContent = art.description || '';
    if (modalStats)       modalStats.textContent =
      '♥ ' + (art.likes || 0) + '   💬 ' + ((art.comments || []).length);
    const viewLink = modal.querySelector('.my-art-modal-link');
    if (viewLink) viewLink.href = 'index.html?art=' + encodeURIComponent(art.id);
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
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeArtModal(); });

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

  function getActiveUser() {
    try {
      return JSON.parse(
        localStorage.getItem('gd_user') || sessionStorage.getItem('gd_user') || 'null'
      );
    } catch (e) { return null; }
  }

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

  function setStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

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
    const h = document.getElementById('myArtHeading');
    if (h) h.textContent = 'Artworks';
  }

  function updateFollowUI(target) {
    const followBtn = document.getElementById('followBtn');
    setStat('statFollowers', getFollowerCount(target.handle));
    setStat('statFollowing', getFollowingCount(target.handle));

    if (!followBtn) return;

    if (target.isOwn) {
      followBtn.classList.add('hidden');
      return;
    }

    const me = getActiveUser();
    if (!me) {
      followBtn.classList.add('hidden');
      return;
    }

    const myHandle = '@' + (me.name || me.username || '');

    followBtn.classList.remove('hidden');
    followBtn.textContent = isFollowing(myHandle, target.handle) ? 'Following' : 'Follow';
    followBtn.classList.toggle('following', isFollowing(myHandle, target.handle));

    followBtn.onclick = function () {
      toggleFollow(myHandle, target.handle);
      setStat('statFollowers', getFollowerCount(target.handle));
      setStat('statFollowing', getFollowingCount(target.handle));
      const nowFollowing = isFollowing(myHandle, target.handle);
      followBtn.textContent = nowFollowing ? 'Following' : 'Follow';
      followBtn.classList.toggle('following', nowFollowing);
    };
  }

  async function renderMyArt() {
    grid.innerHTML = '';
    const target = getTargetHandle();

    if (!target) {
      if (emptyMsg) {
        emptyMsg.textContent = 'Log in to see your published artworks.';
        emptyMsg.classList.remove('hidden');
      }
      setStat('statArtworks', 0);
      const followBtn = document.getElementById('followBtn');
      if (followBtn) followBtn.classList.add('hidden');
      return;
    }

    try {
      const mine = await window.API.getPostsByArtist(target.handle);
      setStat('statArtworks', mine.length);

      if (!target.isOwn) renderHeaderForOtherArtist(target.handle, mine);
      updateFollowUI(target);

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
            emptyMsg.textContent = "This artist hasn\u2019t published any artwork yet.";
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
      setStat('statArtworks', 0);
    }
  }

  renderMyArt();

  const authBtnEl = document.getElementById('authBtn');
  if (authBtnEl) authBtnEl.addEventListener('click', () => setTimeout(renderMyArt, 300));
  const openLoginBtn = document.getElementById('openLogin');
  if (openLoginBtn) openLoginBtn.addEventListener('click', () => setTimeout(renderMyArt, 300));

  window.addEventListener('storage', function (event) {
    if (event.key === 'gd_user' || event.key === 'gd_follows') renderMyArt();
  });
})();