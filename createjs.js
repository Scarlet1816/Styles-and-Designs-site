/* =========================================================
   createjs.js — publishes artwork (with image) to the servlet
   Depends on: api.js (loaded BEFORE this file)
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

  const fileInput      = document.querySelector(".file-input");
  const titleInput     = document.getElementById("title");
  const descInput      = document.getElementById("description");
  const categorySelect = document.getElementById("category");
  const tagsInput      = document.getElementById("tags");
  const publishBtn     = document.querySelector(".publish-btn");

  if (!publishBtn) return;

  publishBtn.addEventListener("click", async function () {

    /* ---- Validation ---- */
    const title = (titleInput.value || "").trim();
    if (!title) {
      alert("Please give your artwork a title.");
      titleInput.focus();
      return;
    }

    const category = (categorySelect.value || "").trim();
    if (!category) {
      alert("Please select a category.");
      categorySelect.focus();
      return;
    }

    /* ---- Login check ---- */
    const activeUser =
      window.user ||
      (function () {
        try {
          return JSON.parse(
            localStorage.getItem("gd_user") ||
            sessionStorage.getItem("gd_user") ||
            "null"
          );
        } catch (e) { return null; }
      })();

    if (!activeUser) {
      alert("Please log in before publishing.");
      if (typeof window.openLoginModal === "function") window.openLoginModal();
      return;
    }

    const handle = "@" + (activeUser.name || activeUser.username || "you");

    /* ---- Disable button while sending ---- */
    publishBtn.disabled = true;
    const originalText = publishBtn.textContent;
    publishBtn.textContent = "Publishing...";

    try {
      /* ---- Read the image file (if any) as base64 ---- */
      let imageDataUrl = "";
      const file = fileInput && fileInput.files && fileInput.files[0];

      if (file) {
        if (file.size > 3 * 1024 * 1024) {
          const proceed = confirm(
            "That image is over 3 MB and may be slow to upload. Continue?"
          );
          if (!proceed) {
            publishBtn.disabled = false;
            publishBtn.textContent = originalText;
            return;
          }
        }

        imageDataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target.result);
          reader.onerror = () => reject(new Error("Could not read image file."));
          reader.readAsDataURL(file);
        });
      }

      /* ---- Send to servlet ---- */
      const newPost = await window.API.createPost({
        title: title,
        description: (descInput.value || "").trim(),
        category: category,
        artist: handle,
        image: imageDataUrl,
        tags: tagsInput ? tagsInput.value.trim() : ""
      });

      console.log("✅ Published:", newPost);

      alert("Artwork published!");
      window.location.href = "index.html";

    } catch (err) {
      console.error("❌ Publish failed:", err);
      alert("Could not publish: " + err.message);
      publishBtn.disabled = false;
      publishBtn.textContent = originalText;
    }
  });

});