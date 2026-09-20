/* =========================================================
   indexjs.js — Saved Artwork page
   =========================================================
   Loads posts from the servlet and filters by saved_arts.
   Depends on: api.js (must be loaded BEFORE this file)
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  // ---------- Page elements ----------
  const savedGrid = document.getElementById("savedGrid");
  const savedLoginMessage = document.getElementById("savedLoginMessage");
  const noSavedMessage = document.getElementById("noSavedMessage");
  const savedLoginBtn = document.getElementById("savedLoginBtn");

  // ---------- Modal elements ----------
  const modal = document.getElementById("artModal");
  const modalImage = document.getElementById("modalImage");
  const modalTitle = document.getElementById("modalTitle");
  const modalArtist = document.getElementById("modalArtist");
  const modalDescription = document.getElementById("modalDescription");
  const modalLikes = document.getElementById("modalLikes");
  const modalLikeBtn = document.getElementById("modalLikeBtn");
  const modalSaveBtn = document.getElementById("modalSaveBtn");
  const modalShareBtn = document.getElementById("modalShareBtn");
  const modalCommentList = document.getElementById("modalCommentList");
  const modalCommentInput = document.getElementById("modalCommentInput");
  const modalPost = document.getElementById("modalPost");
  const closeModalBtn = document.getElementById("closeModal");

  let currentArtwork = null;
  let allPosts = [];

  // ---------- Helpers ----------
  function getCurrentUser() {
    try {
      const storedUser = localStorage.getItem("gd_user") || sessionStorage.getItem("gd_user");
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
    return allPosts.find(p => p.id === id) || null;
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
        else { text = comment; }
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

  function openArtwork(id) {
    const artwork = getArtworkById(id);
    if (!artwork) return;

    currentArtwork = id;

    if (modalImage) { modalImage.src = artwork.image || ""; modalImage.alt = artwork.title || "Artwork"; }
    if (modalTitle) modalTitle.textContent = artwork.title || "Untitled";
    if (modalArtist) { modalArtist.textContent = artwork.artist || "@unknown"; modalArtist.href = "profile.html"; }
    if (modalDescription) modalDescription.textContent = artwork.description || "";
    if (modalLikes) modalLikes.textContent = artwork.likes || 0;
    if (modalCommentInput) modalCommentInput.value = "";

    if (modalLikeBtn) modalLikeBtn.classList.toggle("liked", !!artwork.liked);
    if (modalSaveBtn) {
      modalSaveBtn.classList.add("saved");
      modalSaveBtn.textContent = "🔖 Saved";
      modalSaveBtn.dataset.artId = id;
    }
    if (modalLikeBtn) modalLikeBtn.dataset.artId = id;
    if (modalShareBtn) modalShareBtn.dataset.artId = id;

    displayComments(artwork);

    if (modal) {
      modal.classList.add("show");
      modal.setAttribute("aria-hidden", "false");
    }
  }

  function closeArtworkModal() {
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    currentArtwork = null;
  }

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
    numbers.textContent = "♥ " + (art.likes || 0) + "   💬 " + ((art.comments || []).length);

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

  function renderSavedArt() {
    if (!savedGrid) return;
    savedGrid.innerHTML = "";

    const currentUser = getCurrentUser();

    if (!currentUser) {
      savedGrid.classList.add("hidden");
      if (noSavedMessage) noSavedMessage.classList.add("hidden");
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

  function unsaveArtwork(id) {
    let savedIds = getSavedIds();
    savedIds = savedIds.filter(sid => sid !== id);
    localStorage.setItem("saved_arts", JSON.stringify(savedIds));
    closeArtworkModal();
    renderSavedArt();
  }

  // ---------- Modal buttons ----------
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

      const shareText = art.title + " by " + art.artist;
      const shareData = { title: art.title, text: shareText, url: window.location.href };
      const fullText = shareText + "\n" + window.location.href;

      if (navigator.share) {
        try { await navigator.share(shareData); return; } catch (e) {}
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try { await navigator.clipboard.writeText(fullText); alert("Artwork link copied!"); return; } catch (e) {}
      }
      window.prompt("Copy this link to share:", fullText);
    });
  }

  if (modalPost) {
    modalPost.addEventListener("click", function () {
      const id = currentArtwork;
      if (!id) return;
      const text = modalCommentInput.value.trim();
      if (!text) { alert("Please write a comment first."); return; }

      const activeUser = getCurrentUser();
      if (!activeUser) {
        alert("Please log in to comment.");
        if (typeof openLoginModal === "function") openLoginModal();
        return;
      }

      const art = getArtworkById(id);
      if (!art) return;
      art.comments = Array.isArray(art.comments) ? art.comments : [];
      art.comments.push({ user: activeUser.name || activeUser.username || "@you", text: text });

      localStorage.setItem("comments_" + id, JSON.stringify(art.comments));
      modalCommentInput.value = "";
      displayComments(art);
    });
  }

  if (closeModalBtn) closeModalBtn.addEventListener("click", closeArtworkModal);
  if (modal) modal.addEventListener("click", e => { if (e.target === modal) closeArtworkModal(); });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && modal && modal.classList.contains("show")) closeArtworkModal();
  });

  if (savedLoginBtn) {
    savedLoginBtn.addEventListener("click", function () {
      if (typeof openLoginModal === "function") openLoginModal();
    });
  }

  // ---------- Load posts, then render ----------
  async function init() {
    try {
      allPosts = await window.API.getPosts();
      console.log("✅ Saved page: loaded " + allPosts.length + " posts from servlet");
    } catch (err) {
      console.error("❌ Saved page: failed to load posts:", err);
      allPosts = [];
    }

    // Re-apply saved comments from localStorage
    allPosts.forEach(post => {
      const persisted = JSON.parse(localStorage.getItem("comments_" + post.id) || "null");
      if (Array.isArray(persisted)) post.comments = persisted;
    });

    renderSavedArt();
  }

  init();

  window.addEventListener("storage", renderSavedArt);
});
