/* ============================================
   api.js — backend bridge for Styles & Design
   ============================================
   v3: relative URL, timeout, safer cache, tags
   ============================================ */

(function () {
  "use strict";

  // Relative URL — works on any host/port (no mixed-content errors).
  // If your servlet is on a different origin, change this to the full URL
  // AND enable CORS on the servlet.
  const BASE = "/WebsitQjava/api";
  const TIMEOUT_MS = 15000;

  let cachedPosts = null;
  let inflight = null;

  // ----------------------------------------------------------------
  // Fetch with timeout
  // ----------------------------------------------------------------
  async function fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      return await fetch(url, Object.assign({}, options, { signal: controller.signal }));
    } finally {
      clearTimeout(timer);
    }
  }

  // ----------------------------------------------------------------
  // Fetch all posts
  // ----------------------------------------------------------------
  async function fetchPosts() {
    if (cachedPosts) return cachedPosts;
    if (inflight) return inflight;

    inflight = (async () => {
      try {
        const res = await fetchWithTimeout(BASE + "/posts", { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        cachedPosts = Array.isArray(data.posts) ? data.posts : [];
        return cachedPosts;
      } catch (err) {
        console.error("[api.js] Failed to load posts:", err);
        cachedPosts = [];
        return cachedPosts;
      } finally {
        inflight = null;
      }
    })();

    return inflight;
  }

  // ----------------------------------------------------------------
  // Create a new post (JSON body, supports base64 image)
  // ----------------------------------------------------------------
  async function postPost(payload) {
    const res = await fetchWithTimeout(BASE + "/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title:       payload.title       || "",
        description: payload.description || "",
        category:    payload.category    || "",
        artist:      payload.artist      || "@you",
        image:       payload.image       || "",
        tags:        payload.tags        || ""
      })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error("Server returned " + res.status + ": " + text);
    }

    const newPost = await res.json();
    cachedPosts = null; // invalidate so next read is fresh
    return newPost;
  }

  // ----------------------------------------------------------------
  // Public API
  // ----------------------------------------------------------------
  window.API = {
    async getPosts() {
      return await fetchPosts();
    },

    async getPostById(id) {
      const posts = await fetchPosts();
      return posts.find(p => String(p.id) === String(id)) || null;
    },

    async getPostsByArtist(handle) {
      const posts = await fetchPosts();
      const normalized = String(handle || "").toLowerCase();
      return posts.filter(p => String(p.artist || "").toLowerCase() === normalized);
    },

    async createPost(data) {
      return await postPost(data);
    },

    clearCache() {
      cachedPosts = null;
    }
  };
})();