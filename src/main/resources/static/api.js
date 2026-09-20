/* ============================================
   api.js — backend bridge for Styles & Design
   ============================================
   v2: sends POST requests as JSON (supports image data URLs)
   ============================================ */

(function () {
  "use strict";

  const BASE = "/api";

  let cachedPosts = null;
  let inflight = null;

  // ----------------------------------------------------------------
  // Fetch all posts
  // ----------------------------------------------------------------
  async function fetchPosts() {
    if (cachedPosts) return cachedPosts;
    if (inflight) return inflight;

    inflight = (async () => {
      try {
        const res = await fetch(BASE + "/posts", { cache: "no-store" });
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
    const res = await fetch(BASE + "/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: payload.title || "",
        description: payload.description || "",
        category: payload.category || "",
        artist: payload.artist || "@you",
        image: payload.image || ""
      })
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error("Server returned " + res.status + ": " + text);
    }

    const newPost = await res.json();
    if (cachedPosts) cachedPosts.push(newPost);
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
      return posts.find(p => p.id === id) || null;
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
