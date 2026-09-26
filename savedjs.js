/* =========================================================
   savedjs.js — Saved Artwork page
   Loads posts from the servlet and filters by saved_arts.
   Depends on: api.js (loaded BEFORE this file)
   Toggles body.no-scroll while the art modal is open.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  /* ---------- Page elements ---------- */
  const savedGrid         = document.getElementById("savedGrid");
  const savedLoginMessage = document.getElementById("savedLoginMessage");
  const noSavedMessage    = document.getElementById("noSavedMessage");
  const savedLoginBtn     = document.getElementById("savedLoginBtn");

  /* ---------- Modal elements ---------- */
  const modal             = document.getElementById("artModal");
  const modalImage        = document.getElementById("modalImage");
  const modalTitle        = document.getElementById("modalTitle");
  const modalArtist       = document.getElementById("modalArtist");
  const modalDescription  = document.getElementById("modalDescription");
  const modalLikes        = document.getElementById("modalLikes");
  const modalLikeBtn      = document.getElementById("modalLikeBtn");
  const modalSaveBtn      = document.getElementById("modalSaveBtn");
  const modalShareBtn     = document.getElementById("modalShareBtn");
  const modalCommentList  = document.getElementById("modalCommentList");
  const modalCommentInput = document.getElementById("modalCommentInput");
  const modalPost         = document.getElementById("modalPost");
  const closeModalBtn     = document.getElementById("closeModal");

  let currentArtwork = null;
  let allPosts = [];

  /* ---------- Scroll lock helpers ---------- */
  function lockScroll() {
    document.body.classList.add("no-scroll");
  }

  function unlockScroll() {
    /* Don't unlock if another modal is still open */
    const anyOpen = document.querySelector(
      '.art-modal.show, .login-modal.show, .my-art-modal.show, .modal.show'
    );
    if (!anyOpen) document.body.classList.remove("no-scroll");
  }

  /* ---------- Helpers ---------- */
  function getCurrentUser() {
    try {
      const storedUser =
        localStorage.getItem("gd_user") || sessionStorage.getItem("gd_user");
      if (!storedUser) return null;
      return JSON.parse(storedUser);
    } catch (e) {
      return null;
    }
  }

  function getSavedIds() {
    try {
      return JSON.parse(localStorage.getItem("saved_arts") || "[]");
    } catch (e) {
      return [];
    }
  }

  function getArtworkById(id) {
    return allPosts.find(p => String(p.id) === String(id)) || null;
  }

  function displayComments(artwork) {
    if (!modalCommentList) return;
    modalCommentList.innerHTML = "";

    const comments = (artwork && artwork.comments) || [];
    comments.forEach(comment => {
      let userText = "Anonymous";
      let text = "";

      if (typeof comment === "string") {
        const match = comment.match(/^(@\w+):\s*(.*)$/);
        if (match) { userText = match[1]; text = match[2]; }
        else       { text = comment; }
      } else if (typeof comment === "object" && comment !== null) {
        userText = comment.user || "Anonymous";
        text = comment.text || "";
      }

      const div = document.createElement("div");
      div.className = "modal-comment";
      div.textContent = userText + ": " + text;
      modalCommentList.appendChild(div);
    });
  }

  /* ---------- Open / close modal ---------- */
  function openArtwork(id) {
    const artwork = getArtworkById(id);
    if (!artwork) return;

    currentArtwork = id;

    if (modalImage) {
      modalImage.src = artwork.image || "";
      modalImage.alt = artwork.title || "Artwork";
    }
    if (modalTitle) modalTitle.textContent = artwork.title || "Untitled";
    if (modalArtist) {
      modalArtist.textContent = artwork.artist || "@unknown";
      modalArtist.href = "profile.html?artist=" +
        encodeURIComponent(artwork.artist || "@unknown");
    }
    if (modalDescription) modalDescription.textContent = artwork.description || "";
    if (modalLikes) modalLikes.textContent = artwork.likes || 0;
    if (modalCommentInput) modalCommentInput.value = "";

    if (modalLikeBtn) modalLikeBtn.classList.toggle("liked", !!artwork.liked);
    if (modalSaveBtn) {
      modalSaveBtn.classList.add("saved");
      modalSaveBtn.textContent = "🔖 Saved";
      modalSaveBtn.dataset.artId = id;
    }
    if (modalLikeBtn)  modalLikeBtn.dataset.artId  = id;
    if (modalShareBtn) modalShareBtn.dataset.artId = id;

    displayComments(artwork);

    if (modal) {
      modal.classList.add("show");
      modal.setAttribute("aria-hidden", "false");
    }

    lockScroll();
  }

  function closeArtworkModal() {
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    currentArtwork = null;
    unlockScroll();
  }

  /* ---------- Build a saved card ---------- */
  function createSavedCard(id, art) {
    const card = document.createElement("div");
    card.className = "saved-card";
    card.dataset.artId = id;

    const image = document.createElement("img");
    image.src = art.image || "";
    image.alt = art.title || "Artwork";

    const info = document.createElement("div");
    info.className = "saved-info";

    const title = document.createElement("h3");
    title.textContent = art.title || "Untitled";

    const artist = document.createElement("p");
    artist.className = "saved-artist";
    artist.textContent = art.artist || "@unknown";

    const stats = document.createElement("div");
    stats.className = "saved-stats";

    const numbers = document.createElement("span");
    numbers.textContent = "♥ " + (art.likes || 0) +
                          "   💬 " + ((art.comments || []).length);

    const unsaveBtn = document.createElement("button");
    unsaveBtn.className = "unsave-btn";
    unsaveBtn.type = "button";
    unsaveBtn.textContent = "🔖 Saved";

    unsaveBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      unsaveArtwork(id);
    });

    stats.appendChild(numbers);
    stats.appendChild(unsaveBtn);

    info.appendChild(title);
    info.appendChild(artist);
    info.appendChild(stats);

    card.appendChild(image);
    card.appendChild(info);

    card.addEventListener("click", function (event) {
      if (event.target.closest(".unsave-btn")) return;
      openArtwork(id);
    });

    return card;
  }

  /* ---------- Render saved artwork ---------- */
  function renderSavedArt() {
    if (!savedGrid) return;
    savedGrid.innerHTML = "";

    const currentUser = getCurrentUser();

    if (!currentUser) {
      savedGrid.classList.add("hidden");
      if (noSavedMessage)    noSavedMessage.classList.add("hidden");
      if (savedLoginMessage) savedLoginMessage.classList.remove("hidden");
      return;
    }

    if (savedLoginMessage) savedLoginMessage.classList.add("hidden");

    const savedIds = getSavedIds();

    if (savedIds.length === 0) {
      savedGrid.classList.add("hidden");
      if (noSavedMessage) noSavedMessage.classList.remove("hidden");
      return;
    }

    if (noSavedMessage) noSavedMessage.classList.add("hidden");
    savedGrid.classList.remove("hidden");

    let displayed = 0;
    savedIds.forEach(function (id) {
      const art = getArtworkById(id);
      if (!art) return;
      const card = createSavedCard(id, art);
      savedGrid.appendChild(card);
      displayed++;
    });

    if (displayed === 0) {
      savedGrid.classList.add("hidden");
      if (noSavedMessage) noSavedMessage.classList.remove("hidden");
    }
  }

  /* ---------- Unsave ---------- */
  function unsaveArtwork(id) {
    let savedIds = getSavedIds();
    savedIds = savedIds.filter(sid => String(sid) !== String(id));
    localStorage.setItem("saved_arts", JSON.stringify(savedIds));
    closeArtworkModal();
    renderSavedArt();
  }

  /* ---------- Modal buttons ---------- */
  if (modalLikeBtn) {
    modalLikeBtn.addEventListener("click", function () {
      const id = modalLikeBtn.dataset.artId;
      if (!id) return;
      const art = getArtworkById(id);
      if (!art) return;

      art.liked = !art.liked;
      art.likes = Math.max(0, (art.likes || 0) + (art.liked ? 1 : -1));

      if (modalLikes) modalLikes.textContent = art.likes;
      modalLikeBtn.classList.toggle("liked", art.liked);
    });
  }

  if (modalSaveBtn) {
    modalSaveBtn.addEventListener("click", function () {
      const id = modalSaveBtn.dataset.artId;
      if (!id) return;
      unsaveArtwork(id);
    });
  }

  if (modalShareBtn) {
    modalShareBtn.addEventListener("click", async function () {
      const id = modalShareBtn.dataset.artId;
      if (!id) return;
      const art = getArtworkById(id);
      if (!art) return;

      const shareUrl = window.location.origin + "/index.html?art=" +
                       encodeURIComponent(id);
      const shareText = art.title + " by " + art.artist;
      const shareData = { title: art.title, text: shareText, url: shareUrl };
      const fullText  = shareText + "\n" + shareUrl;

      if (navigator.share) {
        try { await navigator.share(shareData); return; } catch (e) {}
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try { await navigator.clipboard.writeText(fullText);
              alert("Artwork link copied!"); return; } catch (e) {}
      }
      window.prompt("Copy this link to share:", fullText);
    });
  }

  if (modalPost) {
    modalPost.addEventListener("click", function () {
      const id = currentArtwork;
      if (!id) return;
      if (!modalCommentInput) return;

      const text = modalCommentInput.value.trim();
      if (!text) { alert("Please write a comment first."); return; }

      const activeUser = getCurrentUser();
      if (!activeUser) {
        alert("Please log in to comment.");
        if (typeof window.openLoginModal === "function") window.openLoginModal();
        return;
      }

      const art = getArtworkById(id);
      if (!art) return;

      art.comments = Array.isArray(art.comments) ? art.comments : [];
      art.comments.push({
        user: activeUser.name || activeUser.username || "@you",
        text: text
      });

      localStorage.setItem("comments_" + id, JSON.stringify(art.comments));
      modalCommentInput.value = "";
      displayComments(art);

      /* Update the comment count on the saved card too */
      const card = document.querySelector('.saved-card[data-art-id="' + id + '"]');
      if (card) {
        const numbers = card.querySelector(".saved-stats span");
        if (numbers) {
          numbers.textContent = "♥ " + (art.likes || 0) +
                                "   💬 " + art.comments.length;
        }
      }
    });
  }

  if (closeModalBtn) closeModalBtn.addEventListener("click", closeArtworkModal);
  if (modal) {
    modal.addEventListener("click", e => {
      if (e.target === modal) closeArtworkModal();
    });
  }

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal && modal.classList.contains("show")) {
      /* If a login modal is also open, let loginjs.js handle it */
      const loginOpen = document.querySelector(".login-modal.show");
      if (loginOpen) return;
      closeArtworkModal();
    }
  });

  if (savedLoginBtn) {
    savedLoginBtn.addEventListener("click", function () {
      if (typeof window.openLoginModal === "function") window.openLoginModal();
    });
  }

  /* ---------- Load posts, then render ---------- */
  async function init() {
    try {
      allPosts = await window.API.getPosts();
      console.log("✅ Saved page: loaded " + allPosts.length + " posts from servlet");
    } catch (err) {
      console.error("❌ Saved page: failed to load posts:", err);
      allPosts = [];
    }

    /* Re-apply saved comments from localStorage */
    allPosts.forEach(post => {
      let persisted = null;
      try {
        persisted = JSON.parse(localStorage.getItem("comments_" + post.id) || "null");
      } catch (e) {}
      if (Array.isArray(persisted)) post.comments = persisted;
    });

    renderSavedArt();
  }

  init();

  /* Re-render when login state changes in this tab */
  const authBtnEl = document.getElementById("authBtn");
  if (authBtnEl) authBtnEl.addEventListener("click", () => setTimeout(renderSavedArt, 300));

  const openLoginBtn = document.getElementById("openLogin");
  if (openLoginBtn) openLoginBtn.addEventListener("click", () => setTimeout(renderSavedArt, 300));

  /* Cross-tab sync */
  window.addEventListener("storage", function (event) {
    if (event.key === "saved_arts" || event.key === "gd_user") {
      renderSavedArt();
    }
  });
});