/* =========================================================
   galleryjs.js — loads artwork from the Java servlet
   =========================================================
   Depends on: api.js (must be loaded BEFORE this file)
   ========================================================= */

/* =========================================================
   ARTWORK STORE
   =========================================================
   Populated from the servlet on page load.
   Keyed by artwork id so all the existing modal / like /
   comment / save logic keeps working unchanged.
   ========================================================= */
const artworks = {};

/* =========================================================
   GALLERY ELEMENTS
   ========================================================= */
const modal = document.getElementById("artModal");
const modalImage = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalArtist = document.getElementById("modalArtist");
const modalDescription = document.getElementById("modalDescription");
const modalLikes = document.getElementById("modalLikes");
const modalCommentList = document.getElementById("modalCommentList");
const modalCommentInput = document.getElementById("modalCommentInput");
const modalLikeBtn = document.getElementById("modalLikeBtn");
const modalSaveBtn = document.getElementById("modalSaveBtn");
const modalShareBtn = document.getElementById("modalShareBtn");
const modalPost = document.getElementById("modalPost");
const closeModalBtn = document.getElementById("closeModal");

const searchBox = document.getElementById("searchBox");
const filterButtons = document.querySelectorAll(".filter-btn");
let cards = [];
const noResults = document.getElementById("noResults");

/* =========================================================
   GALLERY VARIABLES
   ========================================================= */
let currentArtwork = null;
let currentFilter = "All";

/* =========================================================
   HTML ESCAPE HELPER
   ========================================================= */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}

/* =========================================================
   LOAD SAVED / COMMENT STATE FROM LOCALSTORAGE
   =========================================================
   Saves, likes, and comments still live in localStorage
   (only the POSTS come from the servlet).
   ========================================================= */
function loadPersistedData() {
  const saved = JSON.parse(localStorage.getItem("saved_arts") || "[]");
  Object.keys(artworks).forEach(id => {
    artworks[id].saved = saved.includes(id);
    const persisted = JSON.parse(localStorage.getItem("comments_" + id) || "null");
    if (Array.isArray(persisted)) {
      artworks[id].comments = persisted;
    }
  });
}

/* =========================================================
   BUILD A CARD FOR ONE ARTWORK
   ========================================================= */
function buildCard(post) {
  const card = document.createElement("div");
  card.className = "gallery-card";
  card.dataset.artId = post.id;
  card.dataset.category = post.category || "";
  card.dataset.title = post.title || "";
  card.dataset.artist = post.artist || "@you";
  card.innerHTML =
    '<img src="' + escapeHtml(post.image || "") + '" alt="' + escapeHtml(post.title || "") + '">' +
    '<div class="gallery-info">' +
      '<h3>' + escapeHtml(post.title || "") + '</h3>' +
      '<a class="artist-name" href="profile.html">' + escapeHtml(post.artist || "@you") + '</a>' +
      '<div class="art-stats">' +
        '<button class="like-btn">♥ <span class="like-count">' + (post.likes || 0) + '</span></button>' +
        '<button class="comment-btn">💬 <span class="comment-count">0</span></button>' +
      '</div>' +
    '</div>';
  return card;
}

/* =========================================================
   FETCH POSTS FROM SERVLET AND RENDER
   ========================================================= */
async function loadPostsFromServer() {
  const grid = document.getElementById("galleryGrid");
  if (!grid) return;

  try {
    const posts = await window.API.getPosts();
    console.log("✅ Loaded " + posts.length + " posts from servlet");

    // Clear any hardcoded cards left in the HTML
    grid.innerHTML = "";

    posts.forEach(post => {
      // Register in the artworks map so all existing logic works
      artworks[post.id] = {
        image: post.image || "",
        title: post.title || "",
        artist: post.artist || "@you",
        description: post.description || "",
        likes: post.likes || 0,
        liked: false,
        comments: [],
        saved: false,
        category: post.category || "Other"
      };

      grid.appendChild(buildCard(post));
    });

    // Apply localStorage state (saved, comments) now that artworks exists
    loadPersistedData();

    // Wire up click handlers now that cards exist in DOM
    setupGalleryInteractions();
    syncCountsToDom();

  } catch (err) {
    console.error("❌ Failed to load posts:", err);
    grid.innerHTML = '<p style="color:red;padding:20px;">Failed to load artworks from server.</p>';
  }
}

/* =========================================================
   SYNC LIKES / COMMENTS COUNTS FROM artworks INTO CARDS
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
   SETUP CLICK HANDLERS ON CARDS
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
    modalArtist.href = "profile.html";
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

  if (modalLikeBtn) modalLikeBtn.dataset.artId = artID;
  if (modalSaveBtn) modalSaveBtn.dataset.artId = artID;
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

/* =========================================================
   GALLERY LIKE / COMMENT BUTTONS (event delegation)
   ========================================================= */
document.addEventListener("click", e => {
  const likeBtn = e.target.closest(".like-btn");
  if (likeBtn) {
    e.stopPropagation();
    const card = likeBtn.closest(".gallery-card");
    if (!card) return;
    const id = card.dataset.artId;
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

    const saved = JSON.parse(localStorage.getItem("saved_arts") || "[]");
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
   SHARE ARTWORK
   ========================================================= */
if (modalShareBtn) {
  modalShareBtn.addEventListener("click", async () => {
    const id = modalShareBtn.dataset.artId || currentArtwork;
    if (!id) return;
    const art = artworks[id];
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
    else window.prompt("Copy this link to share:", fullText);
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

    const activeUser = window.user || null;
    if (!activeUser) {
      alert("Please log in to comment.");
      if (typeof openLoginModal === "function") openLoginModal();
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
  modal.addEventListener("click", e => { if (e.target === modal) closeArtworkModal(); });
}
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && modal && modal.classList.contains("show")) closeArtworkModal();
});

function closeArtworkModal() {
  if (!modal) return;
  modal.classList.remove("show");
  modal.setAttribute("aria-hidden", "true");
  currentArtwork = null;
}

/* =========================================================
   SEARCH & FILTERS
   ========================================================= */
function filterGallery() {
  if (!searchBox) return;
  const searchText = (searchBox.value || "").toLowerCase();
  let visible = 0;

  cards.forEach(card => {
    const titleText = card.dataset.title || (card.querySelector("h3")?.textContent || "");
    const artistText = card.dataset.artist || (card.querySelector(".artist-name")?.textContent || "");
    const category = card.dataset.category || "All";

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
  // If the URL has ?art=<id>, open that artwork's modal automatically
  const params = new URLSearchParams(window.location.search);
  const targetId = params.get("art");
  if (targetId && artworks[targetId]) {
    openArtwork(targetId);
    // Clean the URL so refreshing doesn't re-open the modal
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, "", "gallery.html");
    }
  }
});
