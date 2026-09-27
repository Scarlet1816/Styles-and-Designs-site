/* =========================================================
   indexjs.js — loads artwork from the Java servlet
   Depends on: api.js (loaded BEFORE this file)
   Toggles body.no-scroll while the art modal is open.
   ========================================================= */

const artworks = {};

/* ---- Modal elements ---- */
const modal             = document.getElementById("artModal");
const modalImage        = document.getElementById("modalImage");
const modalTitle        = document.getElementById("modalTitle");
const modalArtist       = document.getElementById("modalArtist");
const modalDescription  = document.getElementById("modalDescription");
const modalLikes        = document.getElementById("modalLikes");
const modalCommentList  = document.getElementById("modalCommentList");
const modalCommentInput = document.getElementById("modalCommentInput");
const modalLikeBtn      = document.getElementById("modalLikeBtn");
const modalSaveBtn      = document.getElementById("modalSaveBtn");
const modalShareBtn     = document.getElementById("modalShareBtn");
const modalPost         = document.getElementById("modalPost");
const closeModalBtn     = document.getElementById("closeModal");

const searchBox     = document.getElementById("searchBox");
const filterButtons = document.querySelectorAll(".filter-btn");
let cards = [];
const noResults = document.getElementById("noResults");

let currentArtwork = null;
let currentFilter  = "All";

/* =========================================================
   SCROLL LOCK HELPERS
   ========================================================= */
function lockScroll() {
  document.body.classList.add("no-scroll");
}

function unlockScroll() {
  /* Don't unlock if another modal is still open (e.g. login modal) */
  const anyOpen = document.querySelector(
    '.art-modal.show, .login-modal.show, .my-art-modal.show, .modal.show'
  );
  if (!anyOpen) document.body.classList.remove("no-scroll");
}

/* =========================================================
   HELPERS
   ========================================================= */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

function escapeAttr(str) {
  return String(str == null ? "" : str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/* =========================================================
   RESTORE SAVED / COMMENTS
   ========================================================= */
function loadPersistedData() {
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem("saved_arts") || "[]"); } catch (e) {}

  Object.keys(artworks).forEach(id => {
    artworks[id].saved = saved.includes(id);

    let persisted = null;
    try {
      persisted = JSON.parse(localStorage.getItem("comments_" + id) || "null");
    } catch (e) {}
    if (Array.isArray(persisted)) artworks[id].comments = persisted;
  });
}

/* =========================================================
   BUILD A CARD
   ========================================================= */
function buildCard(post) {
  const card = document.createElement("div");
  card.className = "gallery-card";
  card.dataset.artId    = post.id;
  card.dataset.category = post.category || "";
  card.dataset.title    = post.title || "";
  card.dataset.artist   = post.artist || "@you";

  card.innerHTML =
    '<img src="' + escapeAttr(post.image || "") + '" alt="' + escapeAttr(post.title || "") + '">' +
    '<div class="gallery-info">' +
      '<h3>' + escapeHtml(post.title || "") + '</h3>' +
      '<a class="artist-name" href="profile.html?artist=' +
        encodeURIComponent(post.artist || "@you") + '">' +
        escapeHtml(post.artist || "@you") +
      '</a>' +
      '<div class="art-stats">' +
        '<button class="like-btn" type="button">♥ <span class="like-count">' + (post.likes || 0) + '</span></button>' +
        '<button class="comment-btn" type="button">💬 <span class="comment-count">0</span></button>' +
      '</div>' +
    '</div>';
  return card;
}

/* =========================================================
   LOAD POSTS
   ========================================================= */
async function loadPostsFromServer() {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;

  try {
    const posts = await window.API.getPosts();
    console.log("✅ Loaded " + posts.length + " posts from servlet");

    grid.innerHTML = "";

    posts.forEach(post => {
      artworks[post.id] = {
        id:          post.id,
        image:       post.image || "",
        title:       post.title || "",
        artist:      post.artist || "@you",
        description: post.description || "",
        likes:       post.likes || 0,
        liked:       false,
        comments:    [],
        saved:       false,
        category:    post.category || "Other"
      };
      grid.appendChild(buildCard(post));
    });

    loadPersistedData();
    setupGalleryInteractions();
    syncCountsToDom();

  } catch (err) {
    console.error("❌ Failed to load posts:", err);
    grid.innerHTML =
      '<p style="color:red;padding:20px;">Failed to load artworks from server.</p>';
  }
}

/* =========================================================
   SYNC COUNTS
   ========================================================= */
function syncCountsToDom() {
  cards = document.querySelectorAll(".gallery-card");
  cards.forEach(card => {
    const id = card.dataset.artId;
    if (!id) return;
    const art = artworks[id];
    if (!art) return;

    const img = card.querySelector("img");
    if (img && art.image) img.src = art.image;

    const likeSpan = card.querySelector(".like-count");
    if (likeSpan) likeSpan.textContent = art.likes || 0;

    const commentSpan = card.querySelector(".comment-count");
    if (commentSpan) commentSpan.textContent = (art.comments || []).length;

    const galleryLikeBtn = card.querySelector(".like-btn");
    if (galleryLikeBtn) galleryLikeBtn.classList.toggle("liked", !!art.liked);
  });
}

/* =========================================================
   WIRE UP CARD CLICKS
   ========================================================= */
function setupGalleryInteractions() {
  cards = document.querySelectorAll(".gallery-card");
  cards.forEach(card => {
    card.addEventListener("click", e => {
      if (
        e.target.closest(".like-btn") ||
        e.target.closest(".comment-btn") ||
        e.target.closest(".artist-name")
      ) return;
      openArtwork(card.dataset.artId);
    });
  });
}

/* =========================================================
   MODAL IMAGE ZOOM
   ========================================================= */
if (modalImage) {
  modalImage.style.cursor = "zoom-in";
  modalImage.addEventListener("click", () => {
    modalImage.classList.toggle("zoomed");
  });
}

/* =========================================================
   OPEN ARTWORK MODAL
   ========================================================= */
function openArtwork(artID) {
  const artwork = artworks[artID];
  if (!artwork) return;

  currentArtwork = artID;

  if (modalImage) {
    modalImage.src = artwork.image || "";
    modalImage.alt = artwork.title || "Artwork";
  }
  if (modalTitle) modalTitle.textContent = artwork.title;
  if (modalArtist) {
    modalArtist.textContent = artwork.artist;
    modalArtist.href = "profile.html?artist=" + encodeURIComponent(artwork.artist);
  }
  if (modalDescription) modalDescription.textContent = artwork.description;
  if (modalLikes) modalLikes.textContent = artwork.likes || 0;
  if (modalCommentInput) modalCommentInput.value = "";

  if (modalLikeBtn) modalLikeBtn.classList.toggle("liked", !!artwork.liked);
  if (modalSaveBtn) {
    modalSaveBtn.classList.toggle("saved", !!artwork.saved);
    modalSaveBtn.textContent = artwork.saved ? "🔖 Saved" : "🔖 Save";
  }

  displayComments(artwork);

  if (modal) {
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  }

  lockScroll();

  if (modalLikeBtn)  modalLikeBtn.dataset.artId  = artID;
  if (modalSaveBtn)  modalSaveBtn.dataset.artId  = artID;
  if (modalShareBtn) modalShareBtn.dataset.artId = artID;
}

/* =========================================================
   DISPLAY COMMENTS
   ========================================================= */
function displayComments(artwork) {
  if (!modalCommentList) return;
  modalCommentList.innerHTML = "";

  (artwork.comments || []).forEach(comment => {
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

/* =========================================================
   GALLERY LIKE / COMMENT (delegation)
   ========================================================= */
document.addEventListener("click", e => {
  const likeBtn = e.target.closest(".like-btn");
  if (likeBtn) {
    e.stopPropagation();
    const card = likeBtn.closest(".gallery-card");
    if (!card) return;
    const id  = card.dataset.artId;
    const art = artworks[id];
    if (!art) return;

    art.liked = !art.liked;
    art.likes = Math.max(0, (art.likes || 0) + (art.liked ? 1 : -1));

    const span = card.querySelector(".like-count");
    if (span) span.textContent = art.likes;
    likeBtn.classList.toggle("liked", art.liked);

    if (currentArtwork === id && modalLikes && modalLikeBtn) {
      modalLikes.textContent = art.likes;
      modalLikeBtn.classList.toggle("liked", art.liked);
    }
    return;
  }

  const commentBtn = e.target.closest(".comment-btn");
  if (commentBtn) {
    e.stopPropagation();
    const card = commentBtn.closest(".gallery-card");
    if (!card) return;
    openArtwork(card.dataset.artId);
    setTimeout(() => { if (modalCommentInput) modalCommentInput.focus(); }, 200);
  }
});

/* =========================================================
   MODAL LIKE
   ========================================================= */
if (modalLikeBtn) {
  modalLikeBtn.addEventListener("click", e => {
    e.stopPropagation();
    const id = modalLikeBtn.dataset.artId || currentArtwork;
    if (!id) return;
    const art = artworks[id];
    if (!art) return;

    art.liked = !art.liked;
    art.likes = Math.max(0, (art.likes || 0) + (art.liked ? 1 : -1));

    if (modalLikes) modalLikes.textContent = art.likes;
    modalLikeBtn.classList.toggle("liked", art.liked);

    const card = document.querySelector('.gallery-card[data-art-id="' + id + '"]');
    if (card) {
      const span = card.querySelector(".like-count");
      if (span) span.textContent = art.likes;
      const galleryLikeBtn = card.querySelector(".like-btn");
      if (galleryLikeBtn) galleryLikeBtn.classList.toggle("liked", art.liked);
    }
  });
}

/* =========================================================
   SAVE ARTWORK
   ========================================================= */
if (modalSaveBtn) {
  modalSaveBtn.addEventListener("click", e => {
    e.stopPropagation();
    const id = modalSaveBtn.dataset.artId || currentArtwork;
    if (!id) return;
    const art = artworks[id];
    if (!art) return;

    art.saved = !art.saved;
    modalSaveBtn.classList.toggle("saved", art.saved);
    modalSaveBtn.textContent = art.saved ? "🔖 Saved" : "🔖 Save";

    let saved = [];
    try { saved = JSON.parse(localStorage.getItem("saved_arts") || "[]"); } catch (e2) {}

    if (art.saved) {
      if (!saved.includes(id)) saved.push(id);
    } else {
      const index = saved.indexOf(id);
      if (index > -1) saved.splice(index, 1);
    }
    localStorage.setItem("saved_arts", JSON.stringify(saved));
  });
}

/* =========================================================
   SHARE ARTWORK (deep link with ?art=<id>)
   ========================================================= */
if (modalShareBtn) {
  modalShareBtn.addEventListener("click", async () => {
    const id = modalShareBtn.dataset.artId || currentArtwork;
    if (!id) return;
    const art = artworks[id];
    if (!art) return;

    const shareUrl = window.location.origin + window.location.pathname +
                     "?art=" + encodeURIComponent(id);
    const shareText = art.title + " by " + art.artist;
    const shareData = { title: art.title, text: shareText, url: shareUrl };
    const fullText  = shareText + "\n" + shareUrl;

    if (navigator.share) {
      try { await navigator.share(shareData); return; } catch (e) {}
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try { await navigator.clipboard.writeText(fullText); alert("Artwork link copied!"); return; } catch (e) {}
    }
    const tempInput = document.createElement("textarea");
    tempInput.value = fullText;
    tempInput.style.position = "fixed";
    tempInput.style.opacity = "0";
    document.body.appendChild(tempInput);
    tempInput.focus();
    tempInput.select();
    let copied = false;
    try { copied = document.execCommand("copy"); } catch (e) { copied = false; }
    document.body.removeChild(tempInput);

    if (copied) alert("Artwork link copied!");
    else        window.prompt("Copy this link to share:", fullText);
  });
}

/* =========================================================
   POST COMMENT
   ========================================================= */
if (modalPost) {
  modalPost.addEventListener("click", () => {
    const id = currentArtwork;
    if (!id) return;
    if (!modalCommentInput) return;

    const text = modalCommentInput.value.trim();
    if (!text) { alert("Please write a comment first."); return; }

    const activeUser = window.user;
    if (!activeUser) {
      alert("Please log in to comment.");
      if (typeof window.openLoginModal === "function") window.openLoginModal();
      return;
    }

    const art = artworks[id];
    art.comments = art.comments || [];
    art.comments.push({ user: activeUser.name || "@you", text: text });

    localStorage.setItem("comments_" + id, JSON.stringify(art.comments));
    modalCommentInput.value = "";
    displayComments(art);

    const card = document.querySelector('.gallery-card[data-art-id="' + id + '"]');
    if (card) {
      const commentCount = card.querySelector(".comment-count");
      if (commentCount) commentCount.textContent = art.comments.length;
    }
  });
}

/* =========================================================
   CLOSE MODAL
   ========================================================= */
if (closeModalBtn) closeModalBtn.addEventListener("click", closeArtworkModal);

if (modal) {
  modal.addEventListener("click", e => {
    if (e.target === modal) closeArtworkModal();
  });
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && modal && modal.classList.contains("show")) {
    /* If a login modal is ALSO open, close that first */
    const loginOpen = document.querySelector(".login-modal.show");
    if (loginOpen) return; /* loginjs.js handles its own Escape */
    closeArtworkModal();
  }
});

function closeArtworkModal() {
  if (!modal) return;
  if (modalImage) modalImage.classList.remove("zoomed");
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  currentArtwork = null;

  /* Only unlock scroll if no other modal is still open */
  unlockScroll();
}

/* =========================================================
   SEARCH & FILTER
   ========================================================= */
function filterGallery() {
  if (!searchBox) return;
  const searchText = (searchBox.value || "").toLowerCase();
  let visible = 0;

  cards.forEach(card => {
    const titleEl  = card.querySelector("h3");
    const artistEl = card.querySelector(".artist-name");

    const titleText  = card.dataset.title  || (titleEl  ? titleEl.textContent  : "");
    const artistText = card.dataset.artist || (artistEl ? artistEl.textContent : "");
    const category   = card.dataset.category || "All";

    const matchesSearch =
      titleText.toLowerCase().includes(searchText) ||
      artistText.toLowerCase().includes(searchText);
    const matchesFilter =
      currentFilter === "All" ||
      category.toLowerCase() === currentFilter.toLowerCase();

    if (matchesSearch && matchesFilter) {
      card.style.display = "";
      visible++;
    } else {
      card.style.display = "none";
    }
  });

  if (noResults) noResults.style.display = visible === 0 ? "block" : "none";
}

if (searchBox) searchBox.addEventListener("input", filterGallery);

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.filter || "All";
    filterGallery();
  });
});

/* =========================================================
   BOOT
   ========================================================= */
loadPostsFromServer().then(() => {
  const params   = new URLSearchParams(window.location.search);
  const targetId = params.get("art");

  if (targetId && artworks[targetId]) {
    openArtwork(targetId);

    /* Clean the URL so refresh doesn't re-open the modal */
    if (window.history && window.history.replaceState) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }
});